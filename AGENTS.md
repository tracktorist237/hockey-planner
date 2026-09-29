# Codex rules for HockeyPlanner frontend

Read [CONTRIBUTING.md](CONTRIBUTING.md) before editing. It defines the mandatory
task-branch, PR, validation and independent-review process, including exceptions.

- Work only on the approved issue. Preserve unrelated changes and prepared
  task-branch history; stop if unexpected local changes prevent safe work.
- No substantial direct push to develop. Use an issue-oriented task branch and
  a Draft PR to develop; do not force-push.
- Read affected UI, API code and tests before editing. Preserve backend contract
  compatibility, auth refresh, specialized conflict/transfer UX and accessibility.
- Keep tests deterministic. Use real serialized HTTP fixtures for contracts and
  isolated full-stack Playwright for critical journeys; do not weaken assertions.
- Follow risk-appropriate local verification and mandatory PR CI. Report missing
  checks and warnings honestly; never claim a run that was not performed.
- Hand off base/head SHAs, full scope, tests and risks to a new Codex session or
  separate review agent. Author self-review cannot provide independent approval.
- Stop for human merge. Do not change master, VERSION, production or release
  settings, deploy manually, or begin the next issue without authorization.
- Never put credentials, tokens, storageState or sensitive logs in commits,
  handoffs or artifacts.
