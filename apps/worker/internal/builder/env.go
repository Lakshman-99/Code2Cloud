package builder

import (
	"fmt"
	"strings"
)

var SensitiveEnvKeys = map[string]bool{
	"PASSWORD":          true,
	"SECRET":            true,
	"TOKEN":             true,
	"API_KEY":           true,
	"APIKEY":            true,
	"PRIVATE_KEY":       true,
	"AWS_SECRET":        true,
	"DATABASE_URL":      true,
	"DB_PASSWORD":       true,
	"NPM_TOKEN":         true,
	"GITHUB_TOKEN":      true,
	"AUTH":              true,
	"CREDENTIAL":        true,
	"ENCRYPTION_KEY":    true,
	"JWT_SECRET":        true,
	"SESSION_SECRET":    true,
	"REDIS_PASSWORD":    true,
	"POSTGRES_PASSWORD": true,
	"MYSQL_PASSWORD":    true,
}

func IsSensitiveEnvKey(key string) bool {
	upperKey := strings.ToUpper(key)
	if SensitiveEnvKeys[upperKey] {
		return true
	}
	for sensitiveWord := range SensitiveEnvKeys {
		if strings.Contains(upperKey, sensitiveWord) {
			return true
		}
	}
	return false
}

func SanitizeEnvForLogging(envVars map[string]string) map[string]string {
	sanitized := make(map[string]string, len(envVars))

	for key, value := range envVars {
		if IsSensitiveEnvKey(key) {
			sanitized[key] = "***"
		} else {
			if len(value) > 50 {
				sanitized[key] = value[:47] + "..."
			} else {
				sanitized[key] = value
			}
		}
	}

	return sanitized
}

func MergeEnvVars(maps ...map[string]string) map[string]string {
	result := make(map[string]string)

	for _, m := range maps {
		for k, v := range m {
			result[k] = v
		}
	}

	return result
}

func FrameworkRuntimePortEnv(framework string, port int32) map[string]string {
	portStr := fmt.Sprintf("%d", port)

	switch strings.ToLower(framework) {
	// Node.js / JavaScript frameworks
	case "nextjs":
		return map[string]string{"PORT": portStr, "HOSTNAME": "0.0.0.0"}
	case "vite", "vue", "sveltekit":
		return map[string]string{"PORT": portStr, "HOST": "0.0.0.0"}
	case "nuxt", "nuxtjs":
		return map[string]string{"PORT": portStr, "HOST": "0.0.0.0", "NUXT_PORT": portStr, "NUXT_HOST": "0.0.0.0"}
	case "angular":
		return map[string]string{"PORT": portStr}
	case "gatsby", "create-react-app":
		return map[string]string{"PORT": portStr}
	case "express", "fastify", "nestjs", "node":
		return map[string]string{"PORT": portStr}
	case "astro":
		return map[string]string{"PORT": portStr, "HOST": "0.0.0.0"}

	// Python frameworks
	case "django":
		return map[string]string{"PORT": portStr, "ALLOWED_HOSTS": "*"}
	case "flask":
		return map[string]string{"PORT": portStr, "FLASK_RUN_PORT": portStr, "FLASK_RUN_HOST": "0.0.0.0"}
	case "fastapi":
		return map[string]string{"PORT": portStr, "UVICORN_PORT": portStr, "UVICORN_HOST": "0.0.0.0"}
	case "streamlit":
		return map[string]string{"PORT": portStr, "STREAMLIT_SERVER_PORT": portStr, "STREAMLIT_SERVER_ADDRESS": "0.0.0.0"}
	case "python":
		return map[string]string{"PORT": portStr}

	// Go
	case "golang", "go":
		return map[string]string{"PORT": portStr}

	default:
		return map[string]string{"PORT": portStr}
	}
}

// FrameworkStartCommand returns the correct start command for a framework
// that ensures the app listens on the specified port and allows all hosts.
//
// Static site frameworks (vite, vue, astro, sveltekit, angular, CRA, gatsby)
// use the `serve` package instead of their built-in preview servers.
// Preview servers have host-checking that blocks requests from custom domains.
func FrameworkStartCommand(framework string, currentCmd string, port int32) string {
	portStr := fmt.Sprintf("%d", port)

	// If command already uses `serve`, it's already been fixed
	if strings.Contains(currentCmd, "serve") && !strings.Contains(currentCmd, "preview") {
		return currentCmd
	}

	switch strings.ToLower(framework) {
	// Static site frameworks — replace preview servers with `serve`
	// to avoid host-checking issues (e.g. vite preview blocks non-localhost)
	case "vite":
		return fmt.Sprintf("npx --yes serve -s dist -l tcp://0.0.0.0:%s", portStr)
	case "vue":
		return fmt.Sprintf("npx --yes serve -s dist -l tcp://0.0.0.0:%s", portStr)
	case "sveltekit":
		return fmt.Sprintf("npx --yes serve -s build -l tcp://0.0.0.0:%s", portStr)
	case "astro":
		return fmt.Sprintf("npx --yes serve -s dist -l tcp://0.0.0.0:%s", portStr)
	case "angular":
		return fmt.Sprintf("npx --yes serve -s dist -l tcp://0.0.0.0:%s", portStr)
	case "create-react-app":
		return fmt.Sprintf("npx --yes serve -s build -l tcp://0.0.0.0:%s", portStr)
	case "gatsby":
		return fmt.Sprintf("npx --yes serve -s public -l tcp://0.0.0.0:%s", portStr)

	default:
		return currentCmd
	}
}

// FilterEnvVars filters env vars by a predicate function
func FilterEnvVars(envVars map[string]string, predicate func(key, value string) bool) map[string]string {
	result := make(map[string]string)

	for key, value := range envVars {
		if predicate(key, value) {
			result[key] = value
		}
	}

	return result
}

func DefaultBuildEnv() map[string]string {
	return map[string]string{
		"CI":       "true",
		"NODE_ENV": "production",
	}
}

func FrameworkEnv(framework string) map[string]string {
	switch strings.ToLower(framework) {

	// ── Node.js / JavaScript frameworks ──────────────────
	case "nextjs":
		return map[string]string{
			"NEXT_TELEMETRY_DISABLED": "1",
		}
	case "vite":
		return map[string]string{
			"NODE_ENV": "production",
		}
	case "create-react-app":
		return map[string]string{
			"GENERATE_SOURCEMAP": "false",
		}
	case "vue":
		return map[string]string{
			"NODE_ENV": "production",
		}
	case "angular":
		return map[string]string{
			"NG_CLI_ANALYTICS": "false",
		}
	case "nuxt", "nuxtjs":
		return map[string]string{
			"NUXT_TELEMETRY_DISABLED": "1",
		}
	case "gatsby":
		return map[string]string{
			"GATSBY_TELEMETRY_DISABLED": "1",
		}

	// ── Node.js backend frameworks ───────────────────────
	case "express", "fastify", "nestjs", "node":
		return map[string]string{
			"NODE_ENV": "production",
		}

	// ── Python frameworks ────────────────────────────────
	case "django":
		return map[string]string{
			"PYTHONDONTWRITEBYTECODE": "1",
			"PYTHONUNBUFFERED":        "1",
		}
	case "flask":
		return map[string]string{
			"FLASK_ENV":               "production",
			"PYTHONDONTWRITEBYTECODE": "1",
			"PYTHONUNBUFFERED":        "1",
		}
	case "fastapi":
		return map[string]string{
			"PYTHONDONTWRITEBYTECODE": "1",
			"PYTHONUNBUFFERED":        "1",
		}
	case "streamlit":
		return map[string]string{
			"PYTHONDONTWRITEBYTECODE": "1",
			"PYTHONUNBUFFERED":        "1",
		}
	case "python":
		return map[string]string{
			"PYTHONDONTWRITEBYTECODE": "1",
			"PYTHONUNBUFFERED":        "1",
		}

	// ── Go ───────────────────────────────────────────────
	case "golang", "go":
		return map[string]string{
			"CGO_ENABLED": "0",
		}

	default:
		return map[string]string{}
	}
}