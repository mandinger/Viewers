#!/usr/bin/env bash
set -euo pipefail

# Uploads the built viewer (dist) to Azure Storage static website ($web) using azcopy + SAS.
# Requirements: azcopy installed, a valid SAS URL with write perms, built assets in platform/app/dist.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/platform/app/dist"

if [[ ! -d "$DIST_DIR" ]]; then
  echo "dist folder not found at $DIST_DIR. Run 'yarn build' first." >&2
  exit 1
fi

SAS_URL="${AZCOPY_SAS_URL:-}"
if [[ -z "$SAS_URL" ]]; then
  echo "Set AZCOPY_SAS_URL to the full SAS for https://<account>.blob.core.windows.net/$web" >&2
  exit 1
fi

# azcopy sync requires a container-level URL (not the service root). Guard for common mistakes.
if [[ "$SAS_URL" != *"/\$web?"* && "$SAS_URL" != *"/\$web&"* && "$SAS_URL" != *"/\$web"* ]]; then
  echo 'AZCOPY_SAS_URL must include the $web container, e.g. https://<account>.blob.core.windows.net/$web?<SAS>' >&2
  exit 1
fi

command -v azcopy >/dev/null 2>&1 || {
  echo "azcopy is required. Install with: brew install azcopy" >&2
  exit 1
}

echo "Syncing $DIST_DIR to $SAS_URL ..."
azcopy sync "$DIST_DIR" "$SAS_URL" --recursive --put-md5 --delete-destination true

echo "Upload complete." 
