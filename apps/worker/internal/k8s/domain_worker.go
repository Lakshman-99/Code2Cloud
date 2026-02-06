package k8s

import (
	"context"
	"sync"
	"time"

	"go.uber.org/zap"
)

type DomainWorker struct {
	manager *DomainManager
	logger  *zap.Logger

	fetchPendingDomains func(ctx context.Context) ([]PendingDomain, error)
	updateDomainStatus func(ctx context.Context, domainID string, status string, errorMsg string) error

	checkInterval time.Duration
	wg sync.WaitGroup
}

type PendingDomain struct {
	ID          string `json:"id"`
	Domain      string `json:"domain"`
	ProjectID   string `json:"projectId"`
	ProjectName string `json:"projectName"`
	Status      string `json:"status"`
	CreatedAt   string `json:"createdAt"`
}

type DomainWorkerConfig struct {
	Manager             *DomainManager
	FetchPendingDomains func(ctx context.Context) ([]PendingDomain, error)
	UpdateDomainStatus  func(ctx context.Context, domainID string, status string, errorMsg string) error
	CheckInterval       time.Duration
	Logger              *zap.Logger
}

func NewDomainWorker(config DomainWorkerConfig) *DomainWorker {
	interval := config.CheckInterval
	if interval == 0 {
		interval = 30 * time.Second
	}

	return &DomainWorker{
		manager:             config.Manager,
		logger:              config.Logger,
		fetchPendingDomains: config.FetchPendingDomains,
		updateDomainStatus:  config.UpdateDomainStatus,
		checkInterval:       interval,
	}
}

func (dw *DomainWorker) Start(ctx context.Context) {
	dw.wg.Add(1)

	go func() {
		defer dw.wg.Done()

		dw.logger.Info("Domain verification worker started",
			zap.Duration("check_interval", dw.checkInterval),
		)

		dw.checkPendingDomains(ctx)

		ticker := time.NewTicker(dw.checkInterval)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				dw.logger.Info("Domain verification worker stopped")
				return
			case <-ticker.C:
				dw.checkPendingDomains(ctx)
			}
		}
	}()
}

func (dw *DomainWorker) Stop() {
	dw.wg.Wait()
}

func (dw *DomainWorker) checkPendingDomains(ctx context.Context) {
	if ctx.Err() != nil {
		return
	}

	domains, err := dw.fetchPendingDomains(ctx)
	if err != nil {
		dw.logger.Warn("Failed to fetch pending domains", zap.Error(err))
		return
	}

	if len(domains) == 0 {
		return
	}

	dw.logger.Info("Checking pending domains",
		zap.Int("count", len(domains)),
	)

	for _, domain := range domains {
		if ctx.Err() != nil {
			return
		}

		dw.verifyAndActivate(ctx, domain)
	}
}

func (dw *DomainWorker) verifyAndActivate(ctx context.Context, domain PendingDomain) {
	dw.logger.Debug("Verifying domain",
		zap.String("domain", domain.Domain),
		zap.String("project", domain.ProjectName),
	)

	result := dw.manager.VerifyDNS(domain.Domain)

	if !result.Verified {
		dw.logger.Debug("DNS not verified yet",
			zap.String("domain", domain.Domain),
			zap.String("error", result.Error),
		)

		if err := dw.updateDomainStatus(ctx, domain.ID, "PENDING", result.Error); err != nil {
			dw.logger.Warn("Failed to update domain status",
				zap.String("domain", domain.Domain),
				zap.Error(err),
			)
		}
		return
	}

	dw.logger.Info("DNS verified, configuring ingress",
		zap.String("domain", domain.Domain),
		zap.String("method", result.Method),
		zap.String("value", result.Value),
	)

	if err := dw.manager.AddDomain(ctx, domain.ProjectName, domain.Domain); err != nil {
		dw.logger.Error("Failed to add domain to ingress",
			zap.String("domain", domain.Domain),
			zap.Error(err),
		)

		dw.updateDomainStatus(ctx, domain.ID, "ERROR",
			"DNS verified but failed to configure routing. Will retry.")
		return
	}

	if err := dw.updateDomainStatus(ctx, domain.ID, "ACTIVE", ""); err != nil {
		dw.logger.Warn("Failed to mark domain as active",
			zap.String("domain", domain.Domain),
			zap.Error(err),
		)
		return
	}

	dw.logger.Info("Domain activated successfully! 🌐",
		zap.String("domain", domain.Domain),
		zap.String("project", domain.ProjectName),
		zap.String("verified_via", result.Method),
	)
}