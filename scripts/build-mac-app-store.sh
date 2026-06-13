#!/usr/bin/env bash

set -u

APP_NAME="md-quicklook"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_TAURI_DIR="${ROOT_DIR}/src-tauri"
CONFIG_PATH="${SRC_TAURI_DIR}/tauri.appstore.generated.conf.json"
ENTITLEMENTS_PATH="${SRC_TAURI_DIR}/entitlements/app-store.generated.plist"
PKG_DIR="${SRC_TAURI_DIR}/target/appstore/pkg"

log() {
  printf '[build-mac-app-store] %s\n' "$1"
}

fail() {
  printf '[build-mac-app-store] ERROR: %s\n' "$1" >&2
  exit 1
}

require_env() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    fail "Missing required environment variable: ${name}"
  fi
}

require_command() {
  local command="$1"
  command -v "${command}" >/dev/null 2>&1 || fail "Missing command: ${command}"
}

run_or_fail() {
  log "Running: $*"
  "$@"
  local status=$?
  if [ "${status}" -ne 0 ]; then
    fail "Command failed with exit code ${status}: $*"
  fi
}

cleanup() {
  rm -f "${CONFIG_PATH}"
  rm -f "${ENTITLEMENTS_PATH}"
}
trap cleanup EXIT

if [ "$(uname -s)" != "Darwin" ]; then
  fail "Mac App Store builds must run on macOS"
fi

require_command npm
require_command cargo
require_command npx
require_command rustup
require_command xcrun
require_command security
require_command plutil

SELECTED_DEVELOPER_DIR="$(xcode-select -p 2>/dev/null || true)"
if [ -n "${DEVELOPER_DIR:-}" ]; then
  log "Using DEVELOPER_DIR from environment: ${DEVELOPER_DIR}"
elif [ -n "${SELECTED_DEVELOPER_DIR}" ] && [ "${SELECTED_DEVELOPER_DIR}" != "/Library/Developer/CommandLineTools" ]; then
  export DEVELOPER_DIR="${SELECTED_DEVELOPER_DIR}"
elif [ -d "/Applications/Xcode.app/Contents/Developer" ]; then
  export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"
  log "xcode-select points to Command Line Tools; using full Xcode for this script: ${DEVELOPER_DIR}"
else
  fail "Full Xcode is required. Install Xcode or run: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
fi

xcrun -f xcodebuild >/dev/null 2>&1 || fail "xcodebuild is unavailable. Install full Xcode and accept its license."
xcrun -f productbuild >/dev/null 2>&1 || fail "productbuild is unavailable"

require_env APPSTORE_BUNDLE_IDENTIFIER
require_env APPSTORE_MARKETING_VERSION
require_env APPSTORE_BUILD_NUMBER
require_env APPSTORE_PROVISION_PROFILE
require_env APPLE_TEAM_ID
require_env APPLE_SIGNING_IDENTITY
require_env MAC_INSTALLER_SIGNING_IDENTITY

if [ ! -f "${APPSTORE_PROVISION_PROFILE}" ]; then
  fail "Provisioning profile not found: ${APPSTORE_PROVISION_PROFILE}"
fi

if ! security find-identity -v -p codesigning | grep -F "${APPLE_SIGNING_IDENTITY}" >/dev/null; then
  fail "Apple app signing identity not found in keychain: ${APPLE_SIGNING_IDENTITY}"
fi

if ! security find-identity -v | grep -F "${MAC_INSTALLER_SIGNING_IDENTITY}" >/dev/null; then
  fail "Mac installer signing identity not found in keychain: ${MAC_INSTALLER_SIGNING_IDENTITY}"
fi

PROFILE_PLIST="$(mktemp /tmp/md-quicklook-profile.XXXXXX.plist)"
security cms -D -i "${APPSTORE_PROVISION_PROFILE}" > "${PROFILE_PLIST}" 2>/dev/null || fail "Cannot decode provisioning profile"
PROFILE_APP_ID="$(/usr/libexec/PlistBuddy -c 'Print :Entitlements:com.apple.application-identifier' "${PROFILE_PLIST}" 2>/dev/null || true)"
PROFILE_TEAM_ID="$(/usr/libexec/PlistBuddy -c 'Print :TeamIdentifier:0' "${PROFILE_PLIST}" 2>/dev/null || true)"
PROFILE_PLATFORM="$(/usr/libexec/PlistBuddy -c 'Print :Platform:0' "${PROFILE_PLIST}" 2>/dev/null || true)"
PROFILE_TYPE="$(/usr/libexec/PlistBuddy -c 'Print :ProfileDistributionType' "${PROFILE_PLIST}" 2>/dev/null || true)"
rm -f "${PROFILE_PLIST}"

if [ "${PROFILE_TEAM_ID}" != "${APPLE_TEAM_ID}" ]; then
  fail "Provisioning profile Team ID (${PROFILE_TEAM_ID}) does not match APPLE_TEAM_ID (${APPLE_TEAM_ID})"
fi

if [ "${PROFILE_PLATFORM}" != "OSX" ]; then
  fail "Provisioning profile platform must be OSX, got: ${PROFILE_PLATFORM}"
fi

if [ -n "${PROFILE_TYPE}" ] && [ "${PROFILE_TYPE}" != "STORE" ]; then
  fail "Provisioning profile must be a Mac App Store Connect profile, got: ${PROFILE_TYPE}"
elif [ -z "${PROFILE_TYPE}" ]; then
  log "Provisioning profile does not expose ProfileDistributionType; continuing after Team ID, platform, and App ID checks."
fi

EXPECTED_APP_ID="${APPLE_TEAM_ID}.${APPSTORE_BUNDLE_IDENTIFIER}"
if [ "${PROFILE_APP_ID}" != "${EXPECTED_APP_ID}" ]; then
  fail "Provisioning profile App ID (${PROFILE_APP_ID}) does not match expected App ID (${EXPECTED_APP_ID})"
fi

TARGET="${TAURI_APPSTORE_TARGET:-universal-apple-darwin}"
case "${TARGET}" in
  universal-apple-darwin)
    rustup target list --installed | grep -Fx 'aarch64-apple-darwin' >/dev/null || fail "Missing Rust target: aarch64-apple-darwin"
    rustup target list --installed | grep -Fx 'x86_64-apple-darwin' >/dev/null || fail "Missing Rust target: x86_64-apple-darwin"
    APP_BUNDLE_PATH="${SRC_TAURI_DIR}/target/universal-apple-darwin/release/bundle/macos/${APP_NAME}.app"
    ;;
  aarch64-apple-darwin)
    rustup target list --installed | grep -Fx 'aarch64-apple-darwin' >/dev/null || fail "Missing Rust target: aarch64-apple-darwin"
    APP_BUNDLE_PATH="${SRC_TAURI_DIR}/target/aarch64-apple-darwin/release/bundle/macos/${APP_NAME}.app"
    ;;
  x86_64-apple-darwin)
    rustup target list --installed | grep -Fx 'x86_64-apple-darwin' >/dev/null || fail "Missing Rust target: x86_64-apple-darwin"
    APP_BUNDLE_PATH="${SRC_TAURI_DIR}/target/x86_64-apple-darwin/release/bundle/macos/${APP_NAME}.app"
    ;;
  native)
    APP_BUNDLE_PATH="${SRC_TAURI_DIR}/target/release/bundle/macos/${APP_NAME}.app"
    TARGET=""
    ;;
  *)
    fail "Unsupported TAURI_APPSTORE_TARGET: ${TARGET}"
    ;;
esac

mkdir -p "${PKG_DIR}" || fail "Cannot create package directory: ${PKG_DIR}"
PKG_PATH="${PKG_DIR}/${APP_NAME}_${APPSTORE_MARKETING_VERSION}_${APPSTORE_BUILD_NUMBER}_appstore.pkg"
rm -f "${PKG_PATH}" || fail "Cannot remove old package: ${PKG_PATH}"

export APPSTORE_BUNDLE_IDENTIFIER
export APPSTORE_MARKETING_VERSION
export APPSTORE_BUILD_NUMBER
export APPSTORE_PROVISION_PROFILE
export APPLE_SIGNING_IDENTITY
export CONFIG_PATH
export ENTITLEMENTS_PATH

node <<'NODE'
const fs = require('fs')
const path = require('path')
const configPath = process.env.CONFIG_PATH
const entitlementsPath = process.env.ENTITLEMENTS_PATH
const teamId = process.env.APPLE_TEAM_ID
const bundleId = process.env.APPSTORE_BUNDLE_IDENTIFIER
const appIdentifier = `${teamId}.${bundleId}`
const baseConfigPath = path.join(path.dirname(configPath), 'tauri.conf.json')

const entitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.application-identifier</key>
  <string>${appIdentifier}</string>
  <key>com.apple.developer.team-identifier</key>
  <string>${teamId}</string>
  <key>keychain-access-groups</key>
  <array>
    <string>${teamId}.*</string>
  </array>
  <key>com.apple.security.app-sandbox</key>
  <true/>
  <key>com.apple.security.files.user-selected.read-write</key>
  <true/>
</dict>
</plist>
`
fs.writeFileSync(entitlementsPath, entitlements)

const config = JSON.parse(fs.readFileSync(baseConfigPath, 'utf8'))

config.identifier = process.env.APPSTORE_BUNDLE_IDENTIFIER
config.version = process.env.APPSTORE_MARKETING_VERSION

config.build = {
  ...(config.build ?? {}),
  frontendDist: '../dist',
}

config.app = {
  ...(config.app ?? {}),
  security: {
    ...(config.app?.security ?? {}),
    csp: "default-src 'self'; connect-src 'self' ipc: http://ipc.localhost; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:",
  },
}

config.bundle = {
  ...(config.bundle ?? {}),
  category: 'Productivity',
  macOS: {
    ...(config.bundle?.macOS ?? {}),
    bundleVersion: process.env.APPSTORE_BUILD_NUMBER,
    signingIdentity: process.env.APPLE_SIGNING_IDENTITY,
    entitlements: './entitlements/app-store.generated.plist',
    infoPlist: './Info.plist',
    files: {
      ...(config.bundle?.macOS?.files ?? {}),
      'embedded.provisionprofile': process.env.APPSTORE_PROVISION_PROFILE,
    },
  },
}

fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`)
NODE

log "Project root: ${ROOT_DIR}"
log "Bundle identifier: ${APPSTORE_BUNDLE_IDENTIFIER}"
log "Marketing version: ${APPSTORE_MARKETING_VERSION}"
log "Build number: ${APPSTORE_BUILD_NUMBER}"
log "Target: ${TAURI_APPSTORE_TARGET:-universal-apple-darwin}"

cd "${ROOT_DIR}" || fail "Cannot enter project root: ${ROOT_DIR}"
run_or_fail npm run build
run_or_fail cargo check --manifest-path "${SRC_TAURI_DIR}/Cargo.toml"

if [ -n "${TARGET}" ]; then
  run_or_fail npx tauri build --no-bundle --target "${TARGET}"
  run_or_fail npx tauri bundle --bundles app --target "${TARGET}" --config "${CONFIG_PATH}"
else
  run_or_fail npx tauri build --no-bundle
  run_or_fail npx tauri bundle --bundles app --config "${CONFIG_PATH}"
fi

if [ ! -d "${APP_BUNDLE_PATH}" ]; then
  fail "Expected App Store app bundle not found: ${APP_BUNDLE_PATH}"
fi

run_or_fail xcrun productbuild \
  --sign "${MAC_INSTALLER_SIGNING_IDENTITY}" \
  --component "${APP_BUNDLE_PATH}" \
  /Applications \
  "${PKG_PATH}"

if [ ! -f "${PKG_PATH}" ]; then
  fail "Expected App Store package not found: ${PKG_PATH}"
fi

log "Mac App Store package created: ${PKG_PATH}"
log "Upload manually after App Store Connect app record and API key are ready:"
log "xcrun altool --upload-app --type macos --file \"${PKG_PATH}\" --apiKey \"\$APPLE_API_KEY_ID\" --apiIssuer \"\$APPLE_API_ISSUER\""
log "Do not submit for App Review until explicitly approved."
