package builder

import (
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