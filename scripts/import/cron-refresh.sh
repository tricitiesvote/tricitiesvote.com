#!/usr/bin/env bash
#
# Every-2-days refresh of external candidate data:
#   1. Donor / campaign-finance data from the PDC (2026)
#   2. Tri-City Herald candidate news search
#   3. Tri-City Herald letters-to-the-editor search
#   4. Loading those letters' FOR/AGAINST endorsements onto the site
#
# Runs on this Mac (not a cloud agent) because the Herald steps need the local
# authenticated subscriber session at scripts/import/herald-session.json, which
# expires periodically and is re-captured with `npm run import:letters:session`.
#
# Scheduled by the LaunchAgent scripts/import/cron-refresh.plist (StartInterval
# 172800s = 2 days). Each step is independent: a failure in one (e.g. an expired
# Herald session) is logged and the others still run.
#
# Letters tagged FOR or AGAINST load straight onto the site: a manual review
# step was skipped for months at a time, so letters never appeared. Letters the
# AI is unsure about are tagged REVIEW, which the loader skips; they wait in
# scripts/import/letter-endorsements-review.csv for a person.

set -uo pipefail

REPO="/Users/adam/dev/tricitiesvote.com"
cd "$REPO" || { echo "cannot cd to $REPO"; exit 1; }

# launchd/cron run with a minimal PATH — add the usual Homebrew/node locations.
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

LOG_DIR="$REPO/scripts/import/cron-logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/refresh-$(date +%Y%m%d-%H%M%S).log"

run() {
  local label="$1"; shift
  echo "=== $(date '+%F %T') START $label ===" >>"$LOG"
  if "$@" >>"$LOG" 2>&1; then
    echo "=== $(date '+%F %T') OK    $label ===" >>"$LOG"
  else
    echo "=== $(date '+%F %T') FAIL($?) $label ===" >>"$LOG"
  fi
  echo >>"$LOG"
}

echo "=== $(date '+%F %T') refresh run start ===" >>"$LOG"

run "pdc-donors-2026" npm run import:pdc:fast 2026
run "herald-articles" npm run import:herald-articles
run "herald-letters"  npm run import:letters
run "letters-load"    npm run import:letters:load

echo "=== $(date '+%F %T') refresh run done ===" >>"$LOG"

# Keep only the 20 most recent logs.
ls -1t "$LOG_DIR"/refresh-*.log 2>/dev/null | tail -n +21 | xargs -r rm -f
