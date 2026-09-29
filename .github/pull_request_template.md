## Issue and scope

- Linked issue (keep In Progress until post-merge verification):
- Milestone:
- Outcome and included scope:
- Non-goals:
- Base SHA:
- Head SHA:
- Changed files / diff summary:

## Compatibility impact

- API/backend contract: none / describe, including coordinated backend PR
- Database: none / describe
- Configuration/dependencies/CI: none / describe
- Auth, conflict/transfer UX, accessibility: unchanged / describe

## Verification

- Focused tests (commands/results):
- Full Jest:
- Production build:
- Contract / Playwright / workflow / HP-75 checks (or justified N/A):
- git diff --check:
- Manual checks:
- Known warnings / checks not run (with reason):

## Independent review (required before human merge)

- Reviewer: separate Codex session/agent, not the implementation session
- Session/report link:
- Reviewed head SHA:
- Review state: pending / completed
- Verdict when completed: `APPROVE`, `CHANGES REQUIRED`, or `BLOCKED / NEEDS HUMAN DECISION`
- Findings and author resolutions:
- [ ] Approval and green mandatory CI cover the current head; conversations resolved.
- [ ] Develop protection verified; human merge only. No master/release changes.

Self-review is not independent review. New commits require re-review. `pending`
is for draft handoff only. Do not mark Done until develop validation, staging
deploy and HP-75 smoke succeed. Any narrow process exception must be explicitly
named with authorization; it never bypasses failed CI or protection.

## Risk and rollback

- Known risks:
- Verification after deployment:
- Smallest safe rollback:
