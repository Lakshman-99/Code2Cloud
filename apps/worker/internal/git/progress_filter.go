package git

import (
	"io"
	"strings"
)

type ProgressFilter struct {
	dest io.Writer
}

func NewProgressFilter(dest io.Writer) *ProgressFilter {
	return &ProgressFilter{dest: dest}
}

func (f *ProgressFilter) Write(p []byte) (int, error) {
	raw := string(p)

	lines := splitLines(raw)

	var kept []string
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		if isIntermediateProgress(line) {
			continue
		}
		kept = append(kept, line)
	}

	if len(kept) > 0 {
		out := strings.Join(kept, "\n") + "\n"
		if _, err := f.dest.Write([]byte(out)); err != nil {
			return 0, err
		}
	}

	return len(p), nil
}

func splitLines(s string) []string {
	var lines []string
	var current strings.Builder
	for i := 0; i < len(s); i++ {
		ch := s[i]
		if ch == '\r' {
			lines = append(lines, current.String())
			current.Reset()
			if i+1 < len(s) && s[i+1] == '\n' {
				i++
			}
		} else if ch == '\n' {
			lines = append(lines, current.String())
			current.Reset()
		} else {
			current.WriteByte(ch)
		}
	}
	if current.Len() > 0 {
		lines = append(lines, current.String())
	}
	return lines
}

func isIntermediateProgress(line string) bool {
	stripped := line
	if strings.HasPrefix(stripped, "remote: ") {
		stripped = strings.TrimPrefix(stripped, "remote: ")
	}

	// These keywords indicate a git progress line
	progressPrefixes := []string{
		"Counting objects:",
		"Compressing objects:",
		"Receiving objects:",
		"Resolving deltas:",
		"Unpacking objects:",
	}

	isProgress := false
	for _, prefix := range progressPrefixes {
		if strings.HasPrefix(stripped, prefix) {
			isProgress = true
			break
		}
	}

	if !isProgress {
		return false
	}

	if strings.Contains(line, "done") {
		return false
	}

	return true
}
