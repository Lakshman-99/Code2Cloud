# Code2Cloud

A comprehensive cloud deployment management platform that streamlines the process of deploying applications, managing infrastructure, and orchestrating cloud environments with an integrated Git workflow.

## 🎯 What is Code2Cloud?

Code2Cloud is an enterprise-grade deployment and cloud management platform designed to simplify the entire lifecycle of application deployment. It bridges the gap between development (Git repositories) and cloud infrastructure by providing a unified interface to:

- **Deploy applications** to cloud environments with one click
- **Manage multiple projects** and their configurations
- **Configure custom domains** and environment variables
- **Track deployment history** and rollback when needed
- **Integrate with Git repositories** for automated deployments
- **Scale infrastructure** across multiple environments

## ✨ What Makes This Project Special

This is a **full-stack, production-ready platform** built with modern technologies:

- **Monorepo Architecture**: Leverages Turbo for optimized builds and shared configurations across multiple applications
- **Polyglot Stack**: Combines TypeScript (frontend/backend), Go (infrastructure workers), and Infrastructure-as-Code (Terraform/Ansible) for comprehensive cloud management
- **Scalable Design**: Separate worker services for handling long-running deployment tasks asynchronously
- **Infrastructure Automation**: Includes complete infrastructure provisioning with Terraform and Ansible playbooks
- **API-First Architecture**: RESTful NestJS backend with proper separation of concerns
- **Modern UI**: Next.js frontend with React components and Tailwind CSS styling

## 🛠️ Tech Stack

### Backend

- **Framework**: [NestJS](https://nestjs.com/) - Progressive Node.js framework for building efficient, reliable, and scalable server-side applications
- **Language**: TypeScript
- **ORM**: [Prisma](https://www.prisma.io/) - Next-generation ORM for Node.js and TypeScript
- **Database**: Prisma-compatible (PostgreSQL recommended)
- **Queue Management**: Built-in queue system for async task processing

### Frontend

- **Framework**: [Next.js](https://nextjs.org/) - React framework for production
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **UI Components**: Custom component library (shared across apps)
- **State Management**: React Hooks with custom store implementations

### Infrastructure & Workers

- **Worker Service**: [Go](https://golang.org/) - Lightweight service for handling background jobs and deployments
- **Proxy Service**: Go-based proxy for request forwarding and load balancing
- **Infrastructure as Code**:
    - [Terraform](https://www.terraform.io/) - Manages cloud resources (compute, networking, security)
    - [Ansible](https://www.ansible.com/) - Configuration management and automation

### Monorepo & Build Tools

- **Monorepo Manager**: [Turbo](https://turbo.build/) - High-performance build system for JavaScript/TypeScript monorepos
- **Package Manager**: npm 11.1.0+
- **Node Version**: 18+
- **Linting**: ESLint
- **Formatting**: Prettier
- **Type Checking**: TypeScript

## 📁 Folder Structure

```
Code2Cloud/
├── apps/                          # Main applications
│   ├── api/                       # NestJS backend API
│   │   ├── src/
│   │   │   ├── auth/             # Authentication & authorization
│   │   │   ├── git/              # Git repository integration
│   │   │   ├── projects/         # Project management
│   │   │   ├── deployments/      # Deployment logic & tracking
│   │   │   ├── domains/          # Custom domain management
│   │   │   ├── envs/             # Environment variables
│   │   │   ├── queues/           # Task queue management
│   │   │   ├── settings/         # User/system settings
│   │   │   └── common/           # Shared utilities
│   │   ├── prisma/               # Database schema & migrations
│   │   └── generated/prisma/     # Auto-generated Prisma client
│   │
│   ├── web/                       # Next.js frontend application
│   │   ├── app/                  # Next.js app directory
│   │   │   ├── auth/             # Authentication pages
│   │   │   └── dashboard/        # Main dashboard
│   │   ├── components/           # Reusable React components
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # Utility functions & API client
│   │   ├── types/                # TypeScript type definitions
│   │   └── stores/               # State management
│   │
│   ├── worker/                    # Go background worker service
│   │   ├── cmd/                  # Worker entry point
│   │   └── internal/
│   │       ├── config/           # Configuration management
│   │       ├── db/               # Database operations
│   │       ├── k8s/              # Kubernetes integration
│   │       ├── queue/            # Job queue processing
│   │       ├── types/            # Type definitions
│   │       └── worker/           # Core worker logic
│   │
│   ├── proxy/                     # Go proxy service
│   │   └── main.go
│   │
│   └── infra/                     # Infrastructure configuration
│       ├── terraform/            # Cloud resources (AWS/GCP/Azure)
│       │   ├── compute.tf        # VM/compute instances
│       │   ├── network.tf        # VPC/networking
│       │   ├── security.tf       # Security groups & IAM
│       │   ├── budget.tf         # Cost management
│       │   └── ...
│       └── ansible/              # Configuration management
│           ├── playbook.yml      # Automation playbooks
│           └── inventory.ini     # Host inventory
│
├── packages/                       # Shared packages (monorepo)
│   ├── eslint-config/            # Shared ESLint configuration
│   ├── typescript-config/        # Shared TypeScript configurations
│   └── ui/                        # Shared UI component library
│
├── turbo.json                     # Turbo build configuration
├── package.json                   # Root package configuration
└── tsconfig.json                  # Root TypeScript configuration
```

## 🚀 What This Project Does

### Core Features

1. **Project Management**
    - Create and manage multiple cloud projects
    - Organize deployments by project
    - Configure project-specific settings

2. **Git Integration**
    - Connect to Git repositories (GitHub, GitLab, etc.)
    - Automatic deployment triggers on commits
    - Webhook support for real-time updates

3. **Deployment Management**
    - One-click deployments to cloud environments
    - Track deployment history
    - Rollback to previous versions
    - Multi-environment support (dev, staging, production)

4. **Domain Management**
    - Configure custom domains
    - SSL/TLS certificate management
    - DNS configuration

5. **Environment Configuration**
    - Manage environment variables
    - Secret management per environment
    - Configuration templating

6. **Infrastructure Automation**
    - Automated cloud resource provisioning with Terraform
    - Infrastructure configuration with Ansible
    - Multi-cloud support

7. **Background Job Processing**
    - Asynchronous deployment tasks
    - Queue-based job processing
    - Worker service for handling long-running operations

8. **User Authentication & Settings**
    - Secure user authentication
    - User preferences and settings
    - Role-based access control (implied)

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Code2Cloud Platform                         │
└─────────────────────────────────────────────────────────────────┘
         │                    │                   │
    ┌────▼─────┐      ┌──────▼──────┐      ┌─────▼────────┐
    │  Web UI   │      │   API       │      │   Worker     │
    │ (Next.js) │◄────►│  (NestJS)   │◄────►│     (Go)     │
    └──────────┘      └──────┬──────┘      └──────────────┘
                             │
                    ┌────────▼────────┐
                    │   Database      │
                    │  (via Prisma)   │
                    └─────────────────┘
                             │
    ┌────────────────────────┼────────────────────────┐
    │                        │                        │
┌───▼───────┐         ┌─────▼──────┐         ┌──────▼──────┐
│ Git Repos │         │  Cloud Env │         │  External   │
│ (GitHub)  │         │ (Terraform)│         │  Services   │
└───────────┘         └────────────┘         └─────────────┘
```

## 🎯 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 11.1.0+
- Docker (recommended for local development)
- Go 1.19+ (for worker service)

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/worker/.env.example apps/worker/.env

# Run database migrations
npm run db:migrate

# Start development
npm run dev
```

## 📚 Available Scripts

```bash
# Development
npm run dev          # Start all apps in development mode

# Production
npm run build        # Build all apps
npm run start        # Start production builds

# Code Quality
npm run lint         # Run linting across all apps
npm run format       # Format code with Prettier
npm run check-types  # Run TypeScript type checking
```

## 🔧 Development

### Running Individual Apps

```bash
# Backend API only
cd apps/api && npm run dev

# Frontend only
cd apps/web && npm run dev

# Worker service only
cd apps/worker && go run cmd/main.go
```

### Database Migrations

```bash
# Generate migration
cd apps/api && npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy
```

## 📦 Project Dependencies

- **NestJS**: ^9.0.0 - Progressive Node.js framework
- **Prisma**: Latest - Database ORM
- **Next.js**: ^14.0.0 - React framework
- **React**: ^18.0.0 - UI library
- **Tailwind CSS**: ^3.0.0 - CSS framework
- **TypeScript**: 5.9.2 - Type safety
- **Turbo**: ^2.6.1 - Monorepo build system

## 🔒 Security Features

- Authentication and authorization modules
- Environment-specific configuration
- Secure secret management
- Infrastructure security through Terraform (security groups, IAM)

## 🌐 Deployment

The project includes complete infrastructure configuration:

- **Terraform**: Automated cloud resource provisioning
- **Ansible**: Server configuration and deployment automation
- **Docker**: Containerized applications (implied by infrastructure setup)

## 📝 License

[Your License Here]

## 👥 Contributing

[Contributing Guidelines]

## 📞 Support

[Support Information]

---

**Code2Cloud**: Simplifying cloud deployment and infrastructure management for modern teams.
