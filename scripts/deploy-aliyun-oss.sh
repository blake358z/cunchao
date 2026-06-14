#!/usr/bin/env bash
set -euo pipefail

DIST_DIR="${DIST_DIR:-apps/web/dist}"
BUCKET="${CUNCHAO_OSS_BUCKET:?Set CUNCHAO_OSS_BUCKET, for example oss://your-bucket-name}"
ENDPOINT="${CUNCHAO_OSS_ENDPOINT:?Set CUNCHAO_OSS_ENDPOINT, for example oss-cn-hongkong.aliyuncs.com}"

if ! command -v ossutil >/dev/null 2>&1; then
  echo "ossutil is not installed or not in PATH."
  exit 1
fi

npm run build --workspace @cunchao/web
ossutil cp -r -f "$DIST_DIR/" "$BUCKET/" --endpoint "$ENDPOINT"

echo "Uploaded $DIST_DIR to $BUCKET via $ENDPOINT"
