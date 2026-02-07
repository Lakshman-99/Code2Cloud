#!/bin/bash
# =============================================================================
# Code2Cloud Deploy Script
# =============================================================================
# Builds and deploys app images to the K8s cluster using BuildKit.
# Designed to run on the server (where BuildKit and the registry are accessible).
#
# Usage:
#   ./deploy.sh --all                    # Build and deploy everything
#   ./deploy.sh --web                    # Deploy only frontend
#   ./deploy.sh --api                    # Deploy only backend
#   ./deploy.sh --worker                 # Deploy only worker
#   ./deploy.sh --web --api              # Deploy frontend + backend
#   ./deploy.sh --api --no-restart       # Build API without restarting pods
#
# Environment variables (required for API/Web builds):
#   DATABASE_URL          - PostgreSQL connection string
#   DATABASE_DIRECT_URL   - PostgreSQL direct connection string
#   DOMAIN                - Main domain (e.g. code2cloud.lakshman.me)
#   API_SUBDOMAIN         - API subdomain (e.g. api)
#
# These can be set via environment or will be read from the K8s ConfigMap/Secrets
# if not provided.
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Defaults
DEPLOY_WEB=false
DEPLOY_API=false
DEPLOY_WORKER=false
NO_RESTART=false
REPO_URL="https://github.com/Lakshman-99/Code2Cloud.git"
BRANCH="main"
BUILD_DIR="/tmp/code2cloud-ci-build"

export KUBECONFIG="${KUBECONFIG:-/etc/rancher/k3s/k3s.yaml}"

# =============================================================================
# Parse arguments
# =============================================================================
usage() {
  echo "Usage: $0 [--all] [--web] [--api] [--worker] [--no-restart] [--branch <branch>]"
  echo ""
  echo "Options:"
  echo "  --all          Deploy all apps"
  echo "  --web          Deploy frontend (Next.js)"
  echo "  --api          Deploy backend (NestJS)"
  echo "  --worker       Deploy worker (Go)"
  echo "  --no-restart   Build images without restarting deployments"
  echo "  --branch       Git branch to build from (default: main)"
  echo ""
  echo "Build arg options (or set via env vars):"
  echo "  --database-url <url>"
  echo "  --database-direct-url <url>"
  echo "  --domain <domain>"
  echo "  --api-subdomain <subdomain>"
  exit 1
}

if [ $# -eq 0 ]; then
  usage
fi

while [[ $# -gt 0 ]]; do
  case $1 in
    --all)       DEPLOY_WEB=true; DEPLOY_API=true; DEPLOY_WORKER=true ;;
    --web)       DEPLOY_WEB=true ;;
    --api)       DEPLOY_API=true ;;
    --worker)    DEPLOY_WORKER=true ;;
    --no-restart) NO_RESTART=true ;;
    --branch)    BRANCH="$2"; shift ;;
    --database-url)        DATABASE_URL="$2"; shift ;;
    --database-direct-url) DATABASE_DIRECT_URL="$2"; shift ;;
    --domain)              DOMAIN="$2"; shift ;;
    --api-subdomain)       API_SUBDOMAIN="$2"; shift ;;
    --help|-h)   usage ;;
    *)           echo -e "${RED}Unknown option: $1${NC}"; usage ;;
  esac
  shift
done

# =============================================================================
# Resolve cluster IPs
# =============================================================================
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Code2Cloud Deploy${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"

REGISTRY_IP=$(kubectl get svc registry -n registry -o jsonpath='{.spec.clusterIP}')
BUILDKIT_IP=$(kubectl get svc buildkitd -n default -o jsonpath='{.spec.clusterIP}')

echo -e "  Registry:  ${GREEN}${REGISTRY_IP}:5000${NC}"
echo -e "  BuildKit:  ${GREEN}${BUILDKIT_IP}:1234${NC}"
echo -e "  Branch:    ${GREEN}${BRANCH}${NC}"
echo -e "  Web:       $([ "$DEPLOY_WEB" = "true" ] && echo -e "${GREEN}yes${NC}" || echo -e "${YELLOW}no${NC}")"
echo -e "  API:       $([ "$DEPLOY_API" = "true" ] && echo -e "${GREEN}yes${NC}" || echo -e "${YELLOW}no${NC}")"
echo -e "  Worker:    $([ "$DEPLOY_WORKER" = "true" ] && echo -e "${GREEN}yes${NC}" || echo -e "${YELLOW}no${NC}")"
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"

# =============================================================================
# Try to read build args from K8s if not provided
# =============================================================================
if [ "$DEPLOY_API" = "true" ]; then
  if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${YELLOW}→ DATABASE_URL not set, trying to read from K8s secrets...${NC}"
    DATABASE_URL=$(kubectl get secret backend-secrets -n code2cloud -o jsonpath='{.data.DATABASE_URL}' 2>/dev/null | base64 -d 2>/dev/null || echo "")
    if [ -z "$DATABASE_URL" ]; then
      echo -e "${RED}✗ DATABASE_URL is required for API builds${NC}"
      exit 1
    fi
  fi
  if [ -z "${DATABASE_DIRECT_URL:-}" ]; then
    DATABASE_DIRECT_URL=$(kubectl get secret backend-secrets -n code2cloud -o jsonpath='{.data.DATABASE_DIRECT_URL}' 2>/dev/null | base64 -d 2>/dev/null || echo "")
    if [ -z "$DATABASE_DIRECT_URL" ]; then
      echo -e "${RED}✗ DATABASE_DIRECT_URL is required for API builds${NC}"
      exit 1
    fi
  fi
fi

if [ "$DEPLOY_WEB" = "true" ]; then
  if [ -z "${DOMAIN:-}" ]; then
    DOMAIN=$(kubectl get configmap frontend-config -n code2cloud -o jsonpath='{.data.NEXT_PUBLIC_APP_URL}' 2>/dev/null | sed 's|https://||' || echo "")
    if [ -z "$DOMAIN" ]; then
      echo -e "${RED}✗ DOMAIN is required for Web builds${NC}"
      exit 1
    fi
  fi
  API_SUBDOMAIN="${API_SUBDOMAIN:-api}"
fi

# =============================================================================
# Clone / update repository
# =============================================================================
if [ -d "${BUILD_DIR}/repo/.git" ]; then
  echo -e "\n${BLUE}→ Updating existing repo...${NC}"
  cd ${BUILD_DIR}/repo
  git fetch origin
  git reset --hard origin/${BRANCH}
  git clean -fdx
else
  echo -e "\n${BLUE}→ Cloning repository...${NC}"
  rm -rf ${BUILD_DIR}
  mkdir -p ${BUILD_DIR}
  git clone --branch ${BRANCH} --depth 1 ${REPO_URL} ${BUILD_DIR}/repo
fi

cd ${BUILD_DIR}/repo
COMMIT_SHA=$(git rev-parse --short HEAD)
echo -e "→ Commit: ${GREEN}${COMMIT_SHA}${NC}"

# =============================================================================
# Build + Deploy function
# =============================================================================
build_and_deploy() {
  local APP_NAME=$1
  local DOCKERFILE_DIR=$2
  local IMAGE_NAME=$3
  local K8S_DEPLOYMENT=$4
  shift 4
  local BUILD_ARGS=("$@")

  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  Building: ${APP_NAME}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  local START_TIME=$(date +%s)

  # Build the build args
  local BUILD_ARGS_STR=""
  for arg in "${BUILD_ARGS[@]}"; do
    BUILD_ARGS_STR="${BUILD_ARGS_STR} --opt build-arg:${arg}"
  done

  echo "→ Building image..."
  buildctl --addr tcp://${BUILDKIT_IP}:1234 build \
    --frontend dockerfile.v0 \
    --local context=. \
    --local dockerfile=${DOCKERFILE_DIR} \
    ${BUILD_ARGS_STR} \
    --output type=image,name=${REGISTRY_IP}:5000/${IMAGE_NAME}:latest,push=true,registry.insecure=true

  if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Build failed for ${APP_NAME}${NC}"
    return 1
  fi

  # Tag with commit SHA (non-fatal if this fails)
  buildctl --addr tcp://${BUILDKIT_IP}:1234 build \
    --frontend dockerfile.v0 \
    --local context=. \
    --local dockerfile=${DOCKERFILE_DIR} \
    ${BUILD_ARGS_STR} \
    --output type=image,name=${REGISTRY_IP}:5000/${IMAGE_NAME}:${COMMIT_SHA},push=true,registry.insecure=true \
  || echo -e "${YELLOW}→ Warning: SHA tag failed, :latest was pushed successfully${NC}"

  local END_TIME=$(date +%s)
  local DURATION=$((END_TIME - START_TIME))

  echo -e "→ Image pushed: ${GREEN}${REGISTRY_IP}:5000/${IMAGE_NAME}:${COMMIT_SHA}${NC} (${DURATION}s)"

  if [ "${NO_RESTART}" = "false" ]; then
    echo "→ Restarting deployment: ${K8S_DEPLOYMENT}"
    kubectl rollout restart deployment/${K8S_DEPLOYMENT} -n code2cloud
    kubectl rollout status deployment/${K8S_DEPLOYMENT} -n code2cloud --timeout=300s
    echo -e "${GREEN}✓ ${APP_NAME} deployed successfully${NC}"
  else
    echo -e "${YELLOW}→ Skipping restart (--no-restart)${NC}"
  fi
}

# =============================================================================
# Execute builds
# =============================================================================
FAILED=()
DEPLOYED=()

if [ "${DEPLOY_API}" = "true" ]; then
  if build_and_deploy "API (NestJS)" "apps/api" "code2cloud-backend" "backend" \
    "DATABASE_URL=${DATABASE_URL}" \
    "DATABASE_DIRECT_URL=${DATABASE_DIRECT_URL}"; then
    DEPLOYED+=("api")
  else
    FAILED+=("api")
  fi
fi

if [ "${DEPLOY_WEB}" = "true" ]; then
  mkdir -p apps/web/public
  if build_and_deploy "Web (Next.js)" "apps/web" "code2cloud-frontend" "frontend" \
    "NEXT_PUBLIC_API_URL=https://${API_SUBDOMAIN}.${DOMAIN}" \
    "NEXT_PUBLIC_APP_URL=https://${DOMAIN}"; then
    DEPLOYED+=("web")
  else
    FAILED+=("web")
  fi
fi

if [ "${DEPLOY_WORKER}" = "true" ]; then
  if build_and_deploy "Worker (Go)" "apps/worker" "code2cloud-worker" "worker"; then
    DEPLOYED+=("worker")
  else
    FAILED+=("worker")
  fi
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
if [ ${#DEPLOYED[@]} -gt 0 ]; then
  echo -e "${GREEN}  ✓ Deployed: ${DEPLOYED[*]}${NC}"
fi
if [ ${#FAILED[@]} -gt 0 ]; then
  echo -e "${RED}  ✗ Failed:   ${FAILED[*]}${NC}"
fi
echo -e "  Commit: ${COMMIT_SHA}"
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"

if [ ${#FAILED[@]} -gt 0 ]; then
  exit 1
fi
