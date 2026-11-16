#!/usr/bin/env bash
# Builds a clean copy of this project for sharing: no git history, CI folders, agent/AI notes,
# planning docs, dependencies, build output, local env files or logs.
# The repository itself is never changed.
#
# Usage: tools/export-clean.sh [output-dir]
#   Default output-dir: ./export
#   Result: <output-dir>/<project-name>/ and <output-dir>/<project-name>-clean.zip
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NAME="$(basename "$ROOT")"
OUT="${1:-$ROOT/export}"
mkdir -p "$OUT"
OUT="$(cd "$OUT" && pwd)"
DEST="$OUT/$NAME"
ZIP="$OUT/$NAME-clean.zip"

# Folders left out only at the project root (planning docs, this tooling, the default output).
TOP_LEVEL_DIRS=(docs tools export)
# Folders left out at any depth.
EXCLUDE_DIRS=(.git .github .gitlab .circleci .claude .cursor .codex .aider .worktrees .vscode .idea
  node_modules dist coverage .vite .cache)
# Files left out at any depth.
EXCLUDE_FILES=(CLAUDE.md AGENTS.md GEMINI.md .cursorrules '.aider*' .env '.env.*' '*.log' 'npm-debug.log*'
  .DS_Store Thumbs.db '*.pem' '*.key' '*.p12' .npmrc)

rm -rf "$DEST" "$ZIP"
mkdir -p "$DEST"

find_args=()
# Never copy the output folder into itself when it sits inside the project.
case "$OUT/" in "$ROOT"/*) find_args+=(-path "./${OUT#"$ROOT"/}" -prune -o) ;; esac
for d in "${TOP_LEVEL_DIRS[@]}"; do find_args+=(-path "./$d" -prune -o); done
for d in "${EXCLUDE_DIRS[@]}"; do find_args+=(-name "$d" -type d -prune -o); done
for f in "${EXCLUDE_FILES[@]}"; do find_args+=(-name "$f" -type f -prune -o); done

cd "$ROOT"
# Copy everything else, keeping the folder structure.
find . "${find_args[@]}" -type f -print0 |
while IFS= read -r -d '' file; do
  mkdir -p "$DEST/$(dirname "$file")"
  cp -p "$file" "$DEST/$file"
done

# Keep the example env file if the project has one.
[ -f "$ROOT/.env.example" ] && cp -p "$ROOT/.env.example" "$DEST/.env.example"

# Warn about anything that looks like a secret or personal contact detail. Review each hit by hand.
echo "Checking for possible secrets or personal data..."
if grep -rInE "(api[_-]?key|secret|passw(or)?d|token|BEGIN [A-Z ]*PRIVATE KEY|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,})" \
     --exclude=package-lock.json --exclude=.gitignore "$DEST"; then
  echo "WARNING: review the lines above before sharing."
else
  echo "No obvious secrets or email addresses found."
fi

(cd "$OUT" && zip -qr "$NAME-clean.zip" "$NAME")
echo "Clean copy: $DEST"
echo "Zip:        $ZIP"
