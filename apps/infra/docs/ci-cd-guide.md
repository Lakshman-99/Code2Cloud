# CI/CD Setup Guide

This guide explains how to set up the automated CI/CD pipeline for Code2Cloud. The pipeline automatically builds and deploys changed apps when code is pushed to `main`.

## How It Works

```
Push to main → GitHub Actions detects changes → SSH into server → BuildKit builds image → Push to internal registry → Restart K8s deployment
```

**Path-based detection** ensures only changed apps are rebuilt:

| Path Changed     | App Rebuilt        |
| ---------------- | ------------------ |
| `apps/web/**`    | Frontend (Next.js) |
| `apps/api/**`    | Backend (NestJS)   |
| `apps/worker/**` | Worker (Go)        |
| `packages/**`    | Frontend + Backend |

## Setup Steps

### 1. Generate an SSH Key for CI/CD

On your local machine, generate a dedicated deploy key:

```bash
ssh-keygen -t ed25519 -C "code2cloud-deploy" -f ~/.ssh/code2cloud_deploy
```

Add the **public key** to the server:

```bash
ssh-copy-id -i ~/.ssh/code2cloud_deploy.pub ubuntu@<SERVER_IP>
```

### 2. Configure GitHub Secrets

Go to your repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret                | Description                                          | Example                                       |
| --------------------- | ---------------------------------------------------- | --------------------------------------------- |
| `SSH_HOST`            | Server IP address                                    | `140.238.x.x`                                 |
| `SSH_USER`            | SSH username                                         | `ubuntu`                                      |
| `SSH_PRIVATE_KEY`     | Contents of `~/.ssh/code2cloud_deploy` (private key) | `-----BEGIN OPENSSH PRIVATE KEY-----...`      |
| `DATABASE_URL`        | PostgreSQL connection string                         | `postgresql://user:pass@host:5432/code2cloud` |
| `DATABASE_DIRECT_URL` | PostgreSQL direct connection                         | `postgresql://user:pass@host:5432/code2cloud` |
| `DOMAIN`              | Main domain                                          | `code2cloud.lakshman.me`                      |
| `API_SUBDOMAIN`       | API subdomain                                        | `api`                                         |

### 3. Verify Server Prerequisites

The server should already have these from the Ansible setup:

- `buildctl` CLI installed
- BuildKit running in the cluster
- Internal registry running in the cluster
- `git` installed

Verify:

```bash
ssh ubuntu@<SERVER_IP>
sudo buildctl --version
sudo kubectl get pods -A | grep -E "buildkit|registry"
```

### 4. (Optional) Upload the Deploy Script

For manual deployments from the server:

```bash
scp apps/infra/scripts/deploy.sh ubuntu@<SERVER_IP>:/usr/local/bin/c2c-deploy
ssh ubuntu@<SERVER_IP> "sudo chmod +x /usr/local/bin/c2c-deploy"
```

Then you can run manual deploys:

```bash
ssh ubuntu@<SERVER_IP>
sudo c2c-deploy --web          # Deploy only frontend
sudo c2c-deploy --api          # Deploy only backend
sudo c2c-deploy --all          # Deploy everything
```

## Usage

### Automatic (Push to main)

Just push to `main`. The workflow will:

1. Detect which apps changed
2. Build only those apps
3. Deploy them

```bash
git add .
git commit -m "fix: update dashboard layout"
git push origin main
```

### Manual (GitHub UI)

Go to **Actions** → **Deploy** → **Run workflow**:

- Check **Deploy all apps** to rebuild everything
- Or select individual apps (web/api/worker)

### Manual (From Server)

```bash
# Deploy everything
sudo /usr/local/bin/c2c-deploy --all

# Deploy only what you need
sudo /usr/local/bin/c2c-deploy --web --api

# Build without restarting (useful for pre-building)
sudo /usr/local/bin/c2c-deploy --all --no-restart

# Build from a specific branch
sudo /usr/local/bin/c2c-deploy --web --branch feature/new-ui
```

## Image Tagging

Each build pushes two tags:

- `:latest` — always points to the most recent build
- `:<commit-sha>` — for traceability and rollback

To rollback to a previous version:

```bash
# Find available tags
kubectl exec -n registry deploy/registry -- ls /var/lib/registry/docker/registry/v2/repositories/code2cloud-frontend/_manifests/tags/

# Update deployment to use a specific commit
kubectl set image deployment/frontend frontend=registry.registry.svc.cluster.local:5000/code2cloud-frontend:<commit-sha> -n code2cloud
```

## Troubleshooting

### Build fails with "buildctl: command not found"

Install buildctl on the server:

```bash
ARCH=$(uname -m); case $ARCH in aarch64|arm64) ARCH="arm64";; x86_64) ARCH="amd64";; esac
curl -fsSL "https://github.com/moby/buildkit/releases/download/v0.21.0/buildkit-v0.21.0.linux-${ARCH}.tar.gz" | sudo tar -xz -C /usr/local bin/buildctl
```

### SSH connection refused

Ensure the server's firewall allows SSH (port 22) and the deploy key is authorized:

```bash
ssh -i ~/.ssh/code2cloud_deploy -v ubuntu@<SERVER_IP>
```

### Build succeeds but pods don't update

Verify `imagePullPolicy: Always` is set in the deployment manifests and the registry service is accessible:

```bash
kubectl get svc registry -n registry
kubectl rollout restart deployment/frontend -n code2cloud
kubectl rollout status deployment/frontend -n code2cloud
```
