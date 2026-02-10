# Code2Cloud Infrastructure Setup Guide

## Prerequisites

1. **Oracle Cloud VM** (A1.Flex) running Ubuntu 24.04+
2. **Domain** `lakshman.me` with DNS access
3. **Local machine** with Ansible installed

## Step 1: Configure DNS

Add these DNS records to `lakshman.me`:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `<VM_PUBLIC_IP>` | 300 |
| A | api | `<VM_PUBLIC_IP>` | 300 |
| A | *.preview | `<VM_PUBLIC_IP>` | 300 |

Verify:
```bash
dig lakshman.me
dig api.lakshman.me
dig test.preview.lakshman.me
```

## Step 2: Update Configuration

1. Edit `ansible/inventory.ini`:
   ```ini
   letsencrypt_email=your-email@example.com
   ```

2. Edit `k8s/05-code2cloud/backend.yaml`:
   - Update `DATABASE_URL` in the Secret
   - Update `JWT_SECRET` (generate with `openssl rand -hex 32`)
   - Add GitHub OAuth credentials if using

## Step 3: Run Ansible

```bash
cd apps/infra/ansible

# Full setup
ansible-playbook -i inventory.ini playbook.yml

# Or run specific tags
ansible-playbook -i inventory.ini playbook.yml --tags k3s
ansible-playbook -i inventory.ini playbook.yml --tags k8s
```

## Step 3.5: Install Istio & Tenant Isolation

Istio provides mTLS encryption between user pods. Kubernetes NetworkPolicy
provides L3/L4 pod-to-pod isolation. Traefik stays **outside** the mesh.

```bash
# From apps/infra
kubectl apply -f k8s/00-namespaces/namespaces.yaml

helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update

helm install istio-base istio/base -n istio-system --create-namespace
helm install istiod istio/istiod -n istio-system -f k8s/07-istio/values-istiod.yaml

# Apply PERMISSIVE mTLS + default-deny NetworkPolicy in deployments
kubectl apply -f k8s/07-istio/tenant-isolation.yaml

```

Notes:
- Traefik does NOT get an Istio sidecar (it stays outside the mesh).
- The worker creates per-app `NetworkPolicy` resources that whitelist only
  same-app pods and the Traefik namespace for ingress.
- Istio PERMISSIVE mTLS encrypts pod-to-pod traffic when both have sidecars,
  but does not reject plaintext from Traefik.

## Step 4: Verify Installation

```bash
# Use the fetched kubeconfig
export KUBECONFIG=~/.kube/config

# Check nodes
kubectl get nodes

# Check all pods
kubectl get pods -A

# Check certificates (may take 1-2 minutes)
kubectl get certificates -A
```

## Step 5: Build and Deploy Your Apps

### Build Backend
```bash
cd apps/api

# Build image
docker build -t registry.lakshman.me:5000/code2cloud-backend:latest .

# Port-forward to registry (from your machine)
kubectl port-forward svc/registry 5000:5000 -n registry &

# Push image
docker push localhost:5000/code2cloud-backend:latest

# Restart deployment
kubectl rollout restart deployment/backend -n code2cloud
```

### Build Frontend
```bash
cd apps/web

# Build image
docker build -t localhost:5000/code2cloud-frontend:latest .

# Push image
docker push localhost:5000/code2cloud-frontend:latest

# Restart deployment
kubectl rollout restart deployment/frontend -n code2cloud
```

### Build Worker
```bash
cd apps/worker

# Build image
docker build -t localhost:5000/code2cloud-worker:latest .

# Push image
docker push localhost:5000/code2cloud-worker:latest

# Restart deployment
kubectl rollout restart deployment/worker -n code2cloud
```

## Step 6: Access Your Apps

- Frontend: https://code2cloud.lakshman.me
- API: https://api.lakshman.me
- User apps: https://\<app-name>.preview.code2cloud.lakshman.me

## Troubleshooting

### Pods not starting
```bash
kubectl describe pod <pod-name> -n <namespace>
kubectl logs <pod-name> -n <namespace>
```

### Certificate not issued
```bash
kubectl describe certificate <cert-name> -n <namespace>
kubectl describe certificaterequest -n <namespace>
kubectl logs -n cert-manager deployment/cert-manager
```

### Can't reach services
```bash
# Check ingress
kubectl get ingress -A

# Check Traefik logs
kubectl logs -n traefik deployment/traefik

# Test internally
kubectl run test --rm -it --image=curlimages/curl -- curl http://backend.code2cloud:3000/health
```

## Useful Aliases

Add to `~/.bashrc`:
```bash
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgs='kubectl get svc'
alias kgi='kubectl get ingress'
alias klog='kubectl logs'
alias kexec='kubectl exec -it'
```
