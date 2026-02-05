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

// IsSensitiveEnvKey checks if an env key should be hidden in logs
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
		"CI":                    "true",
		"NODE_ENV":              "production",
		"NPM_CONFIG_PRODUCTION": "false",
		"NEXT_TELEMETRY_DISABLED": "1",
		"NUXT_TELEMETRY_DISABLED": "1",
	}
}

func FrameworkEnv(framework string) map[string]string {
	switch strings.ToLower(framework) {
	case "nextjs":
		return map[string]string{
			"NEXT_TELEMETRY_DISABLED": "1",
		}
	case "nuxt", "nuxtjs":
		return map[string]string{
			"NUXT_TELEMETRY_DISABLED": "1",
		}
	case "gatsby":
		return map[string]string{
			"GATSBY_TELEMETRY_DISABLED": "1",
		}
	case "angular":
		return map[string]string{
			"NG_CLI_ANALYTICS": "false",
		}
	default:
		return map[string]string{}
	}
}