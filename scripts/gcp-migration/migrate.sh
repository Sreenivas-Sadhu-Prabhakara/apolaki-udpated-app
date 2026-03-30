#!/bin/bash
# ============================================================================
# GCP Migration Orchestrator — Maker-Checker-Approver Pattern
#
# MAKER:    Qwen (local LLM via Ollama) — generates exact commands + file edits
# EXECUTOR: This script — runs the maker's commands
# CHECKER:  Qwen (fresh session) — reviews the resulting diff
# APPROVER: You (human)
#
# Usage:
#   ./migrate.sh next               Run the next pending step
#   ./migrate.sh step <step_id>     Run a specific step
#   ./migrate.sh status             Show migration status
#   ./migrate.sh approve <step_id>  Mark step as approved
#   ./migrate.sh reject <step_id>   Reject + git reset the step
# ============================================================================

set -uo pipefail

PROJECT_ROOT="/Users/macstudio/Documents/Code/apolaki-udpated-app"
MIGRATION_DIR="${PROJECT_ROOT}/scripts/gcp-migration"
STEPS_DIR="${MIGRATION_DIR}/steps"
TRACKER="${MIGRATION_DIR}/MIGRATION_TRACKER.md"
QWEN_MODEL="qwen-dev"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log_info()  { echo -e "${BLUE}ℹ${NC}  $1"; }
log_ok()    { echo -e "${GREEN}✅${NC} $1"; }
log_warn()  { echo -e "${YELLOW}⚠️${NC}  $1"; }
log_error() { echo -e "${RED}❌${NC} $1"; }
log_maker() { echo -e "${BOLD}${BLUE}[MAKER]${NC}  $1"; }
log_check() { echo -e "${BOLD}${YELLOW}[CHECK]${NC}  $1"; }

# ============================================================================
# PREFLIGHT
# ============================================================================
preflight() {
  log_info "Preflight checks..."
  command -v ollama &>/dev/null || { log_error "Ollama not found"; exit 1; }
  ollama list 2>/dev/null | grep -q "qwen" || { log_error "Qwen model not in Ollama"; exit 1; }
  command -v git &>/dev/null || { log_error "Git not found"; exit 1; }
  log_ok "Preflight passed (Ollama + Qwen + Git)"
}

# ============================================================================
# STEP CATALOG — maps step IDs to descriptions
# ============================================================================
get_step_info() {
  local step_id="$1"
  case "$step_id" in
    # PHASE 0
    "0.1") echo "Create git branch gcp/phase-0-setup" ;;
    "0.2") echo "Install and verify gcloud CLI" ;;
    "0.3") echo "Create GCP project apolaki-solar" ;;
    "0.4") echo "Enable required GCP APIs" ;;
    "0.5") echo "Set billing budget alert" ;;
    "0.6") echo "Create Artifact Registry repository" ;;
    "0.7") echo "Create .env.gcp template file" ;;
    # PHASE 1
    "1.1") echo "Create git branch gcp/phase-1-database" ;;
    "1.2") echo "Add @neondatabase/serverless as alternative driver" ;;
    "1.3") echo "Refactor db.js — extract provider pattern" ;;
    "1.4") echo "Add GCP-compatible db provider" ;;
    "1.5") echo "Update config.manager.js for GCP database settings" ;;
    "1.6") echo "Test db.js with local PostgreSQL" ;;
    "1.7") echo "Run init-db.sql against test database" ;;
    "1.8") echo "Commit and merge phase-1" ;;
    # PHASE 2
    "2.1") echo "Create git branch gcp/phase-2-assets" ;;
    "2.2") echo "Create asset upload script" ;;
    "2.3") echo "Add VITE_ASSET_BASE_URL to frontend config" ;;
    "2.4") echo "Create GCS bucket CORS config" ;;
    "2.5") echo "Test asset references locally" ;;
    "2.6") echo "Commit and merge phase-2" ;;
    # PHASE 3
    "3.1") echo "Create git branch gcp/phase-3-frontend" ;;
    "3.2") echo "Create firebase.json and .firebaserc" ;;
    "3.3") echo "Update frontend/.env.production for GCP" ;;
    "3.4") echo "Create deploy script for frontend" ;;
    "3.5") echo "Test build with GCP env vars" ;;
    "3.6") echo "Commit and merge phase-3" ;;
    # PHASE 4
    "4.1") echo "Create git branch gcp/phase-4-backend" ;;
    "4.2") echo "Remove Netlify Lambda detection from server.js" ;;
    "4.3") echo "Update Dockerfile for Cloud Run" ;;
    "4.4") echo "Add .dockerignore for lean image" ;;
    "4.5") echo "Remove serverless-http dependency" ;;
    "4.6") echo "Create Cloud Run deploy script" ;;
    "4.7") echo "Test Docker build locally" ;;
    "4.8") echo "Commit and merge phase-4" ;;
    # PHASE 5
    "5.1") echo "Create git branch gcp/phase-5-solar" ;;
    "5.2") echo "Verify Go Dockerfile for Cloud Run compatibility" ;;
    "5.3") echo "Ensure PORT env var in main.go" ;;
    "5.4") echo "Create Cloud Run deploy script for solar service" ;;
    "5.5") echo "Test Docker build locally" ;;
    "5.6") echo "Commit and merge phase-5" ;;
    # PHASE 6
    "6.1") echo "Create git branch gcp/phase-6-secrets" ;;
    "6.2") echo "Create secrets setup script" ;;
    "6.3") echo "Update deploy scripts with --set-secrets" ;;
    "6.4") echo "Verify config.manager.js with injected secrets" ;;
    "6.5") echo "Commit and merge phase-6" ;;
    # PHASE 7
    "7.1") echo "Create git branch gcp/phase-7-cicd" ;;
    "7.2") echo "Create cloudbuild.yaml for backend" ;;
    "7.3") echo "Create cloudbuild-frontend.yaml" ;;
    "7.4") echo "Create cloudbuild-solar.yaml" ;;
    "7.5") echo "Test Cloud Build locally" ;;
    "7.6") echo "Commit and merge phase-7" ;;
    # PHASE 8
    "8.1") echo "Create git branch gcp/phase-8-finalize" ;;
    "8.2") echo "Set up Cloud Monitoring uptime checks" ;;
    "8.3") echo "Update OAuth callback URLs documentation" ;;
    "8.4") echo "Archive Netlify-specific files" ;;
    "8.5") echo "Update README.md and DOCUMENTATION.md" ;;
    "8.6") echo "Final end-to-end test checklist" ;;
    "8.7") echo "Commit and merge phase-8" ;;
    *) echo "Unknown step: $step_id" ;;
  esac
}

# ============================================================================
# BUILD CONTEXT — gather relevant file context for a step
# ============================================================================
build_context() {
  local step_id="$1"
  local phase="${step_id%%.*}"
  local ctx=""

  # Always include project structure overview
  ctx+="PROJECT ROOT: ${PROJECT_ROOT}
KEY FILES:
- config/docker-compose.yml (Postgres, Redis, RabbitMQ, ES)
- config/config.manager.js (reads ALL config from env vars)
- config/init-db.sql (278 lines, 12+ tables)
- middleware/netlify-db-service/src/server.js (Express API, Passport auth)
- middleware/netlify-db-service/src/db.js (database connection)
- middleware/netlify-db-service/package.json (Node.js deps)
- middleware/solar-service/cmd/main.go (Go microservice entry)
- middleware/solar-service/Dockerfile (Go multi-stage build)
- frontend/package.json (Vue 3, Vite, Pinia, Tailwind)
- frontend/vite.config.js
- frontend/Dockerfile
- netlify.toml (current Netlify config)
- .env.example (all env vars)
"

  # Phase-specific context: read actual file contents
  case "$phase" in
    0)
      ctx+="
CURRENT GIT BRANCH: $(cd "$PROJECT_ROOT" && git branch --show-current 2>/dev/null)
EXISTING BRANCHES: $(cd "$PROJECT_ROOT" && git branch --list 2>/dev/null | tr '\n' ', ')
"
      ;;
    1)
      ctx+="
--- middleware/netlify-db-service/src/db.js ---
$(cat "$PROJECT_ROOT/middleware/netlify-db-service/src/db.js" 2>/dev/null | head -80)
--- middleware/netlify-db-service/package.json ---
$(cat "$PROJECT_ROOT/middleware/netlify-db-service/package.json" 2>/dev/null)
--- config/config.manager.js (database section) ---
$(grep -A 20 'database = {' "$PROJECT_ROOT/config/config.manager.js" 2>/dev/null)
"
      ;;
    2|3)
      ctx+="
--- frontend/vite.config.js ---
$(cat "$PROJECT_ROOT/frontend/vite.config.js" 2>/dev/null)
--- frontend/package.json ---
$(cat "$PROJECT_ROOT/frontend/package.json" 2>/dev/null)
--- frontend/.env.production ---
$(cat "$PROJECT_ROOT/frontend/.env.production" 2>/dev/null || echo '(does not exist yet)')
--- frontend/assets/ listing ---
$(ls -R "$PROJECT_ROOT/frontend/assets/" 2>/dev/null | head -30)
"
      ;;
    4)
      ctx+="
--- middleware/netlify-db-service/src/server.js ---
$(cat "$PROJECT_ROOT/middleware/netlify-db-service/src/server.js" 2>/dev/null)
--- middleware/netlify-db-service/Dockerfile ---
$(cat "$PROJECT_ROOT/middleware/netlify-db-service/Dockerfile" 2>/dev/null)
--- middleware/netlify-db-service/package.json ---
$(cat "$PROJECT_ROOT/middleware/netlify-db-service/package.json" 2>/dev/null)
"
      ;;
    5)
      ctx+="
--- middleware/solar-service/cmd/main.go ---
$(cat "$PROJECT_ROOT/middleware/solar-service/cmd/main.go" 2>/dev/null)
--- middleware/solar-service/Dockerfile ---
$(cat "$PROJECT_ROOT/middleware/solar-service/Dockerfile" 2>/dev/null)
--- middleware/solar-service/go.mod ---
$(cat "$PROJECT_ROOT/middleware/solar-service/go.mod" 2>/dev/null)
"
      ;;
    6)
      ctx+="
--- .env.example ---
$(cat "$PROJECT_ROOT/.env.example" 2>/dev/null)
--- config/config.manager.js (oauth section) ---
$(grep -A 30 'oauth = {' "$PROJECT_ROOT/config/config.manager.js" 2>/dev/null)
"
      ;;
    7)
      ctx+="
--- .github/workflows/ listing ---
$(ls "$PROJECT_ROOT/.github/workflows/" 2>/dev/null)
--- netlify.toml ---
$(cat "$PROJECT_ROOT/netlify.toml" 2>/dev/null | head -50)
"
      ;;
    8)
      ctx+="
--- README.md (first 50 lines) ---
$(head -50 "$PROJECT_ROOT/README.md" 2>/dev/null)
--- netlify.toml ---
$(cat "$PROJECT_ROOT/netlify.toml" 2>/dev/null | head -30)
"
      ;;
  esac

  echo "$ctx"
}

# ============================================================================
# MAKER — Ask Qwen to generate an executable script for the step
# ============================================================================
run_maker() {
  local step_id="$1"
  local step_desc
  step_desc=$(get_step_info "$step_id")
  local step_dir="${STEPS_DIR}/${step_id}"
  mkdir -p "$step_dir"

  log_maker "Qwen generating plan for step ${step_id}: ${step_desc}"

  local context
  context=$(build_context "$step_id")

  # Write maker prompt
  cat > "${step_dir}/maker_prompt.txt" << MAKER_PROMPT_EOF
You are a DevOps engineer migrating the Apolaki Solar Platform from Netlify to GCP Free Tier.

TASK: Execute step ${step_id} — ${step_desc}

PROJECT CONTEXT:
${context}

MIGRATION PLAN SUMMARY:
Phase 0: GCP project setup (gcloud CLI, APIs, billing alerts)
Phase 1: Database — swap @netlify/neon for standard pg / @neondatabase/serverless
Phase 2: Static assets → Cloud Storage bucket
Phase 3: Frontend → Firebase Hosting
Phase 4: Node.js backend → Cloud Run container
Phase 5: Go solar service → Cloud Run container
Phase 6: Secrets → GCP Secret Manager
Phase 7: CI/CD → Cloud Build + Artifact Registry
Phase 8: DNS, monitoring, cleanup

YOUR OUTPUT MUST BE a single executable bash script that:
1. Performs ONLY step ${step_id}: ${step_desc}
2. Uses absolute paths (project root: ${PROJECT_ROOT})
3. Creates/modifies the minimum files needed
4. Is idempotent (safe to run twice)
5. Ends with an echo line: echo "STEP_RESULT: SUCCESS" or echo "STEP_RESULT: FAILED: reason"

RULES:
- Do NOT touch files outside this step's scope
- Do NOT delete existing files — use .archived suffix to rename
- Use heredocs (cat << 'EOF') to create new files
- For file edits, use sed or create the full new file
- For git branch steps: git checkout -b <branch> (from current branch)
- For commit steps: git add -A && git commit -m "gcp-migrate(phase-N): step ${step_id} - ${step_desc}"
- Keep it small and simple

Output ONLY the bash script, starting with #!/bin/bash — no explanations before or after.
MAKER_PROMPT_EOF

  log_maker "Asking Qwen to generate execution script..."
  local maker_output
  maker_output=$(cat "${step_dir}/maker_prompt.txt" | ollama run "$QWEN_MODEL" 2>/dev/null)
  echo "$maker_output" > "${step_dir}/maker_raw_output.txt"

  # Extract the bash script from the output (between ```bash and ```, or the whole thing if it starts with #!/bin/bash)
  local script_content
  if echo "$maker_output" | grep -q '```bash'; then
    script_content=$(echo "$maker_output" | sed -n '/```bash/,/```/p' | sed '1d;$d')
  elif echo "$maker_output" | grep -q '```sh'; then
    script_content=$(echo "$maker_output" | sed -n '/```sh/,/```/p' | sed '1d;$d')
  elif echo "$maker_output" | grep -q '#!/bin/bash'; then
    script_content=$(echo "$maker_output" | sed -n '/^#!/,$ p')
    # Remove any trailing ``` if present
    script_content=$(echo "$script_content" | sed '/^```$/d')
  else
    # Treat the whole output as the script
    script_content="$maker_output"
  fi

  echo "$script_content" > "${step_dir}/execute.sh"
  chmod +x "${step_dir}/execute.sh"

  # Show the script to the terminal
  echo ""
  log_maker "Generated script for step ${step_id}:"
  echo -e "${CYAN}────────────────────────────────────────${NC}"
  cat "${step_dir}/execute.sh"
  echo -e "${CYAN}────────────────────────────────────────${NC}"
  echo ""

  # Ask human: run it?
  echo -e "  ${GREEN}[r]${NC} run this script   ${YELLOW}[s]${NC} skip (edit manually)   ${RED}[a]${NC} abort"
  echo -n "Execute? "
  read -r run_decision

  if [ "$run_decision" != "r" ] && [ "$run_decision" != "run" ]; then
    log_warn "Skipped execution. Script saved at: ${step_dir}/execute.sh"
    echo "You can edit it and run manually, then: ./migrate.sh check ${step_id}"
    return 1
  fi

  # Execute the script
  log_maker "Executing step ${step_id}..."
  cd "$PROJECT_ROOT"
  bash "${step_dir}/execute.sh" 2>&1 | tee "${step_dir}/execution.log"
  local exit_code=${PIPESTATUS[0]}

  # Check result
  if grep -q "STEP_RESULT: SUCCESS" "${step_dir}/execution.log" 2>/dev/null; then
    log_ok "Maker execution succeeded"

    # Generate maker report
    cat > "${step_dir}/MAKER_REPORT.md" << REPORT_EOF
# Maker Report — Step ${step_id}: ${step_desc}
**Generated by**: Qwen (${QWEN_MODEL}) + bash execution
**Date**: $(date '+%Y-%m-%d %H:%M:%S')
**Result**: SUCCESS

## Script Executed
\`\`\`bash
$(cat "${step_dir}/execute.sh")
\`\`\`

## Execution Log
\`\`\`
$(tail -50 "${step_dir}/execution.log")
\`\`\`

## Files Changed
\`\`\`
$(cd "$PROJECT_ROOT" && git diff --stat 2>/dev/null)
$(cd "$PROJECT_ROOT" && git diff --cached --stat 2>/dev/null)
New files: $(cd "$PROJECT_ROOT" && git ls-files --others --exclude-standard 2>/dev/null | head -10)
\`\`\`
REPORT_EOF
    return 0
  else
    log_error "Maker execution failed (exit: ${exit_code})"
    cat > "${step_dir}/MAKER_REPORT.md" << REPORT_EOF
# Maker Report — Step ${step_id}: ${step_desc}
**Result**: FAILED
**Exit Code**: ${exit_code}

## Execution Log
\`\`\`
$(tail -80 "${step_dir}/execution.log")
\`\`\`
REPORT_EOF
    return 1
  fi
}

# ============================================================================
# CHECKER — Ask Qwen (fresh session) to review the diff
# ============================================================================
run_checker() {
  local step_id="$1"
  local step_desc
  step_desc=$(get_step_info "$step_id")
  local step_dir="${STEPS_DIR}/${step_id}"

  log_check "Qwen reviewing step ${step_id}..." >&2

  local git_diff
  git_diff=$(cd "$PROJECT_ROOT" && git diff --no-color 2>/dev/null | head -300)
  local staged_diff
  staged_diff=$(cd "$PROJECT_ROOT" && git diff --cached --no-color 2>/dev/null | head -300)
  local new_files
  new_files=$(cd "$PROJECT_ROOT" && git ls-files --others --exclude-standard 2>/dev/null | head -20)
  local exec_log=""
  [ -f "${step_dir}/execution.log" ] && exec_log=$(tail -100 "${step_dir}/execution.log")

  cat > "${step_dir}/checker_prompt.txt" << CHECKER_EOF
You are a code reviewer checking a GCP migration step.

STEP: ${step_id} — ${step_desc}

=== EXECUTION LOG ===
${exec_log}

=== GIT DIFF (unstaged) ===
${git_diff:-"(none)"}

=== GIT DIFF (staged) ===
${staged_diff:-"(none)"}

=== NEW UNTRACKED FILES ===
${new_files:-"(none)"}

REVIEW CHECKLIST:
1. Does the change correctly implement step ${step_id} (${step_desc})?
2. Is it small and atomic?
3. Any breaking changes to existing functionality?
4. Any hardcoded secrets or security issues?
5. Is it idempotent / safe?
6. Any best-practice violations?

RESPOND IN THIS EXACT FORMAT:
VERDICT: APPROVE or REJECT
CONFIDENCE: HIGH or MEDIUM or LOW
ISSUES: list or None
SUGGESTIONS: list or None
SUMMARY: one paragraph
CHECKER_EOF

  log_check "Sending diff to Qwen for review..." >&2
  local checker_output
  checker_output=$(cat "${step_dir}/checker_prompt.txt" | ollama run "$QWEN_MODEL" 2>/dev/null)
  echo "$checker_output" > "${step_dir}/checker_output.log"

  local verdict="UNKNOWN"
  if echo "$checker_output" | grep -qi "VERDICT:.*APPROVE"; then
    verdict="APPROVE"
  elif echo "$checker_output" | grep -qi "VERDICT:.*REJECT"; then
    verdict="REJECT"
  fi

  cat > "${step_dir}/CHECKER_REPORT.md" << CHKREPORT_EOF
# Checker Report — Step ${step_id}: ${step_desc}
**Reviewed by**: Qwen (${QWEN_MODEL})
**Date**: $(date '+%Y-%m-%d %H:%M:%S')
**Verdict**: ${verdict}

---
${checker_output}
CHKREPORT_EOF

  if [ "$verdict" = "APPROVE" ]; then
    log_ok "Checker APPROVED" >&2
  elif [ "$verdict" = "REJECT" ]; then
    log_warn "Checker REJECTED" >&2
  else
    log_warn "Checker verdict unclear" >&2
  fi

  echo "$verdict"
}

# ============================================================================
# UPDATE TRACKER
# ============================================================================
update_tracker() {
  local step_id="$1"
  local status="$2"
  local new_status=""
  case "$status" in
    "making")   new_status="🔨" ;;
    "checking") new_status="🔍" ;;
    "approved") new_status="✅" ;;
    "rejected") new_status="⬜" ;;
  esac

  python3 -c "
import re
tracker = '${TRACKER}'
step = '${step_id}'
ns = '${new_status}'
with open(tracker) as f: c = f.read()
c = re.sub(r'(\| ' + re.escape(step) + r' \|[^|]*\|[^|]*\|[^|]*\|)[^|]*\|', r'\1 ' + ns + ' |', c)
with open(tracker, 'w') as f: f.write(c)
" 2>/dev/null || log_warn "Could not update tracker"
}

# ============================================================================
# FIND NEXT STEP
# ============================================================================
find_next_step() {
  while IFS= read -r line; do
    if echo "$line" | grep -q "⬜"; then
      local sid
      sid=$(echo "$line" | sed -n 's/^| *\([0-9][0-9]*\.[0-9][0-9]*\) .*/\1/p')
      [ -n "$sid" ] && { echo "$sid"; return 0; }
    fi
  done < "$TRACKER"
  echo ""; return 1
}

# ============================================================================
# STATUS
# ============================================================================
show_status() {
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║  GCP MIGRATION — Apolaki Solar Platform                     ║${NC}"
  echo -e "${CYAN}║  Maker: Qwen  │  Checker: Qwen  │  Approver: You            ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  local total done rej ip pending
  total=$(grep -cE '^\| [0-9]+\.[0-9]' "$TRACKER" 2>/dev/null || true); total=${total:-0}
  done=$(grep -E '^\| [0-9]+\.[0-9]' "$TRACKER" 2>/dev/null | grep -c "✅" || true); done=${done:-0}
  rej=$(grep -E '^\| [0-9]+\.[0-9]' "$TRACKER" 2>/dev/null | grep -c "❌" || true); rej=${rej:-0}
  ip=$(grep -E '^\| [0-9]+\.[0-9]' "$TRACKER" 2>/dev/null | grep -cE "🔨|🔍" || true); ip=${ip:-0}
  pending=$((total - done - rej - ip))
  echo -e "  ✅ Done: ${GREEN}${done}${NC}/${total}   🔨 Active: ${YELLOW}${ip}${NC}   ⬜ Pending: ${pending}"
  echo ""
  local nxt; nxt=$(find_next_step)
  [ -n "$nxt" ] && echo -e "  ➡️  Next: ${BOLD}${nxt}${NC} — $(get_step_info "$nxt")" || echo -e "  ${GREEN}🎉 All done!${NC}"
  echo ""
}

# ============================================================================
# RUN STEP — Maker → (human preview) → Execute → Checker → Human Approval
# ============================================================================
run_step() {
  local step_id="$1"
  local step_desc; step_desc=$(get_step_info "$step_id")
  local step_dir="${STEPS_DIR}/${step_id}"

  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║  Step ${step_id}: ${step_desc}${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
  echo ""

  # ─── MAKER ───
  echo -e "${BOLD}━━━ 1/3: MAKER (Qwen generates script) ━━━${NC}"
  update_tracker "$step_id" "making"

  if ! run_maker "$step_id"; then
    log_error "Maker phase failed for step ${step_id}"
    echo -e "  Edit script: ${step_dir}/execute.sh"
    echo -e "  Then: ${CYAN}./migrate.sh check ${step_id}${NC}"
    return 1
  fi

  # ─── CHECKER ───
  echo ""
  echo -e "${BOLD}━━━ 2/3: CHECKER (Qwen reviews diff) ━━━${NC}"
  update_tracker "$step_id" "checking"
  local verdict; verdict=$(run_checker "$step_id")

  # ─── HUMAN APPROVAL ───
  echo ""
  echo -e "${BOLD}━━━ 3/3: YOUR APPROVAL ━━━${NC}"
  echo -e "${CYAN}──────────────────────────────────────────${NC}"

  [ -f "${step_dir}/MAKER_REPORT.md" ] && { echo -e "\n${BLUE}📝 MAKER REPORT:${NC}"; cat "${step_dir}/MAKER_REPORT.md"; }
  [ -f "${step_dir}/CHECKER_REPORT.md" ] && { echo -e "\n${YELLOW}🔍 CHECKER REPORT:${NC}"; cat "${step_dir}/CHECKER_REPORT.md"; }

  echo ""
  echo -e "${CYAN}──────────────────────────────────────────${NC}"
  echo -e "  Checker: ${BOLD}${verdict}${NC}"
  echo -e "${CYAN}──────────────────────────────────────────${NC}"
  echo ""
  echo -e "  ${GREEN}[a]${NC} approve   ${RED}[r]${NC} reject + revert   ${BLUE}[d]${NC} show diff"
  echo -n "Decision: "
  read -r choice

  case "$choice" in
    a|approve|y)
      update_tracker "$step_id" "approved"
      log_ok "Step ${step_id} ✅ APPROVED"
      local nxt; nxt=$(find_next_step)
      [ -n "$nxt" ] && echo -e "\n  Next: ${CYAN}./migrate.sh next${NC}  (${nxt} — $(get_step_info "$nxt"))"
      ;;
    r|reject|n)
      log_warn "Reverting changes from step ${step_id}..."
      cd "$PROJECT_ROOT" && git checkout -- . 2>/dev/null
      cd "$PROJECT_ROOT" && git clean -fd 2>/dev/null | head -10
      update_tracker "$step_id" "rejected"
      log_warn "Step ${step_id} ❌ REJECTED + reverted"
      echo -e "  Re-run: ${CYAN}./migrate.sh step ${step_id}${NC}"
      ;;
    d|diff)
      cd "$PROJECT_ROOT" && git diff --stat 2>/dev/null
      echo "---"
      cd "$PROJECT_ROOT" && git diff --no-color 2>/dev/null | head -120
      echo ""
      echo -n "Now [a]pprove or [r]eject? "
      read -r fin
      if [ "$fin" = "a" ]; then
        update_tracker "$step_id" "approved"
        log_ok "Step ${step_id} ✅ APPROVED"
      else
        cd "$PROJECT_ROOT" && git checkout -- . 2>/dev/null
        update_tracker "$step_id" "rejected"
        log_warn "Step ${step_id} ❌ REJECTED + reverted"
      fi
      ;;
    *)
      log_warn "No decision. Run: ./migrate.sh approve ${step_id} OR ./migrate.sh reject ${step_id}"
      ;;
  esac
}

# ============================================================================
# MAIN
# ============================================================================
main() {
  local cmd="${1:-help}"; local arg="${2:-}"
  preflight
  case "$cmd" in
    next)
      local s; s=$(find_next_step)
      [ -z "$s" ] && { log_ok "All done!"; show_status; exit 0; }
      run_step "$s"
      ;;
    step)
      [ -z "$arg" ] && { log_error "Usage: ./migrate.sh step <id>"; exit 1; }
      run_step "$arg"
      ;;
    check)
      [ -z "$arg" ] && { log_error "Usage: ./migrate.sh check <id>"; exit 1; }
      run_checker "$arg"
      ;;
    approve)
      [ -z "$arg" ] && { log_error "Usage: ./migrate.sh approve <id>"; exit 1; }
      update_tracker "$arg" "approved"; log_ok "Step ${arg} ✅ APPROVED"
      ;;
    reject)
      [ -z "$arg" ] && { log_error "Usage: ./migrate.sh reject <id>"; exit 1; }
      update_tracker "$arg" "rejected"; log_warn "Step ${arg} ⬜ RESET"
      ;;
    status) show_status ;;
    *)
      echo ""
      echo -e "${BOLD}GCP Migration Orchestrator${NC} — Qwen (Maker) → Qwen (Checker) → You (Approver)"
      echo ""
      echo -e "  ${CYAN}./migrate.sh next${NC}            Run next pending step"
      echo -e "  ${CYAN}./migrate.sh step <id>${NC}       Run specific step"
      echo -e "  ${CYAN}./migrate.sh status${NC}          Show progress"
      echo -e "  ${CYAN}./migrate.sh approve <id>${NC}    Approve a step"
      echo -e "  ${CYAN}./migrate.sh reject <id>${NC}     Reject + reset a step"
      echo ""
      ;;
  esac
}

main "$@"
