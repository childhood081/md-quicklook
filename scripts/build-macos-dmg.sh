#!/usr/bin/env bash

set -u

APP_NAME="AI 文档快看"
VERSION="1.9.0"
ARCH="aarch64"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
APP_PATH="${ROOT_DIR}/src-tauri/target/release/bundle/macos/${APP_NAME}.app"
DMG_DIR="${ROOT_DIR}/src-tauri/target/release/bundle/dmg"
DMG_PATH="${DMG_DIR}/${APP_NAME}_${VERSION}_${ARCH}.dmg"
STAGING_DIR="$(mktemp -d "${TMPDIR:-/tmp}/${APP_NAME}-dmg.XXXXXX")"

cleanup() {
  rm -rf "${STAGING_DIR}"
}
trap cleanup EXIT

log() {
  printf '[build-macos-dmg] %s\n' "$1"
}

fail() {
  printf '[build-macos-dmg] ERROR: %s\n' "$1" >&2
  exit 1
}

run_or_fail() {
  log "Running: $*"
  "$@"
  local status=$?
  if [ "${status}" -ne 0 ]; then
    fail "Command failed with exit code ${status}: $*"
  fi
}

cd "${ROOT_DIR}" || fail "Cannot enter project root: ${ROOT_DIR}"

log "Project root: ${ROOT_DIR}"
run_or_fail npm run build
run_or_fail cargo check --manifest-path "${ROOT_DIR}/src-tauri/Cargo.toml"

mkdir -p "${DMG_DIR}" || fail "Cannot create DMG directory: ${DMG_DIR}"

log "Removing previous DMG if present: ${DMG_PATH}"
rm -f "${DMG_PATH}" || fail "Cannot remove old DMG: ${DMG_PATH}"

log "Running Tauri build. The final beta DMG will be created with hdiutil from the generated .app."
npx tauri build
TAURI_STATUS=$?

if [ "${TAURI_STATUS}" -eq 0 ]; then
  log "Tauri build completed. Rebuilding DMG with hdiutil for repeatable beta packaging."
else
  log "Tauri build exited with ${TAURI_STATUS}. Checking whether .app was generated for hdiutil fallback."
fi

if [ ! -d "${APP_PATH}" ]; then
  fail "Cannot create fallback DMG because app bundle is missing: ${APP_PATH}"
fi

log "Removing any Tauri-generated or partial DMG before hdiutil packaging: ${DMG_PATH}"
rm -f "${DMG_PATH}" || fail "Cannot remove generated or partial DMG: ${DMG_PATH}"

log "Preparing DMG staging directory: ${STAGING_DIR}"
cp -R "${APP_PATH}" "${STAGING_DIR}/${APP_NAME}.app" || fail "Cannot copy app bundle into staging directory"
ln -s /Applications "${STAGING_DIR}/Applications" || fail "Cannot create Applications shortcut"

log "Creating DMG with hdiutil: ${DMG_PATH}"
hdiutil create \
  -volname "${APP_NAME}" \
  -srcfolder "${STAGING_DIR}" \
  -ov \
  -format UDZO \
  "${DMG_PATH}" || fail "hdiutil DMG creation failed"

if [ ! -f "${DMG_PATH}" ]; then
  fail "DMG was not created: ${DMG_PATH}"
fi

log "DMG created successfully: ${DMG_PATH}"
log "This DMG is unsigned and not notarized. Use only for beta testing unless signing/notarization is added."
