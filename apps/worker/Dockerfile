FROM golang:1.23-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY apps/worker/go.mod apps/worker/go.sum ./
RUN go mod download

COPY apps/worker/ .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /worker ./cmd/main.go

FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    openssh-client \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://railpack.com/install.sh | bash || { \
    ARCH=$(uname -m) && \
    case $ARCH in \
        aarch64|arm64) ARCH="arm64" ;; \
        x86_64) ARCH="x86_64" ;; \
    esac && \
    curl -fsSL "https://github.com/railwayapp/railpack/releases/latest/download/railpack-${ARCH}-unknown-linux-musl.tar.gz" \
    | tar -xz -C /usr/local/bin && \
    chmod +x /usr/local/bin/railpack; \
    }

RUN ARCH=$(dpkg --print-architecture) && \
    curl -fsSL "https://github.com/moby/buildkit/releases/download/v0.21.0/buildkit-v0.21.0.linux-${ARCH}.tar.gz" \
    | tar -xz -C /usr/local bin/buildctl && \
    chmod +x /usr/local/bin/buildctl

RUN railpack --version && buildctl --version && git --version

COPY --from=builder /worker /usr/local/bin/worker

RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup worker

RUN mkdir -p /tmp/builds && chown worker:appgroup /tmp/builds

USER worker

ENTRYPOINT ["/usr/local/bin/worker"]