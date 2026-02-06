package k8s

import (
	"context"
	"fmt"
	"net"
	"strings"
	"time"

	"go.uber.org/zap"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type DomainManager struct {
	client *Client
	logger *zap.Logger

	serverIP string

	baseDomain string
}

type DomainConfig struct {
	ServerIP   string
	BaseDomain string
}

func NewDomainManager(client *Client, config DomainConfig, logger *zap.Logger) *DomainManager {
	return &DomainManager{
		client:     client,
		logger:     logger,
		serverIP:   config.ServerIP,
		baseDomain: config.BaseDomain,
	}
}

type DNSVerifyResult struct {
	Verified bool
	Method   string
	Value    string
	Error    string
}

func (dm *DomainManager) VerifyDNS(domain string) *DNSVerifyResult {
	dm.logger.Debug("Verifying DNS for domain",
		zap.String("domain", domain),
		zap.String("expected_ip", dm.serverIP),
		zap.String("expected_cname", dm.baseDomain),
	)

	resolver := &net.Resolver{
		PreferGo: true, 
		Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
			d := net.Dialer{Timeout: 5 * time.Second}
			return d.DialContext(ctx, "udp", "8.8.8.8:53")
		},
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cname, err := resolver.LookupCNAME(ctx, domain)
	if err == nil {
		cname = strings.TrimSuffix(cname, ".")

		if strings.EqualFold(cname, dm.baseDomain) ||
			strings.HasSuffix(strings.ToLower(cname), "."+strings.ToLower(dm.baseDomain)) {
			dm.logger.Info("DNS verified via CNAME",
				zap.String("domain", domain),
				zap.String("cname", cname),
			)
			return &DNSVerifyResult{
				Verified: true,
				Method:   "CNAME",
				Value:    cname,
			}
		}
	}

	ips, err := resolver.LookupHost(ctx, domain)
	if err != nil {
		dm.logger.Debug("DNS lookup failed",
			zap.String("domain", domain),
			zap.Error(err),
		)
		return &DNSVerifyResult{
			Verified: false,
			Error:    fmt.Sprintf("DNS lookup failed: %v. Make sure you've added an A record pointing to %s", err, dm.serverIP),
		}
	}

	for _, ip := range ips {
		if ip == dm.serverIP {
			dm.logger.Info("DNS verified via A record",
				zap.String("domain", domain),
				zap.String("ip", ip),
			)
			return &DNSVerifyResult{
				Verified: true,
				Method:   "A",
				Value:    ip,
			}
		}
	}

	dm.logger.Debug("DNS points to wrong IP",
		zap.String("domain", domain),
		zap.Strings("resolved_ips", ips),
		zap.String("expected_ip", dm.serverIP),
	)

	return &DNSVerifyResult{
		Verified: false,
		Error: fmt.Sprintf(
			"Domain resolves to %s, but expected %s. Update your A record to point to %s",
			strings.Join(ips, ", "),
			dm.serverIP,
			dm.serverIP,
		),
	}
}
// ─────────────────────────────────────────────────────────────

func (dm *DomainManager) AddDomain(ctx context.Context, projectName, domain string) error {
	name := sanitizeK8sName(projectName)

	dm.logger.Info("Adding domain to ingress",
		zap.String("project", name),
		zap.String("domain", domain),
	)

	ingressClient := dm.client.clientset.NetworkingV1().Ingresses(dm.client.namespace)
	ingress, err := ingressClient.Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("failed to get ingress for %s: %w", name, err)
	}

	existingHosts := make(map[string]bool)
	for _, rule := range ingress.Spec.Rules {
		existingHosts[rule.Host] = true
	}

	if existingHosts[domain] {
		dm.logger.Info("Domain already configured",
			zap.String("domain", domain),
		)
		return nil
	}

	hosts := make([]string, 0, len(existingHosts)+1)
	for host := range existingHosts {
		hosts = append(hosts, host)
	}
	hosts = append(hosts, domain)

	return dm.client.UpdateIngressHosts(ctx, name, hosts)
}


func (dm *DomainManager) RemoveDomain(ctx context.Context, projectName, domain string) error {
	name := sanitizeK8sName(projectName)

	dm.logger.Info("Removing domain from ingress",
		zap.String("project", name),
		zap.String("domain", domain),
	)

	ingressClient := dm.client.clientset.NetworkingV1().Ingresses(dm.client.namespace)
	ingress, err := ingressClient.Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("failed to get ingress for %s: %w", name, err)
	}

	hosts := make([]string, 0)
	for _, rule := range ingress.Spec.Rules {
		if rule.Host != domain {
			hosts = append(hosts, rule.Host)
		}
	}

	if len(hosts) == 0 {
		dm.logger.Warn("Cannot remove last domain — keeping default",
			zap.String("project", name),
		)
		return fmt.Errorf("cannot remove all domains from ingress")
	}

	return dm.client.UpdateIngressHosts(ctx, name, hosts)
}