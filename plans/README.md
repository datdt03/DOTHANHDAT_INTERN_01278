# Plans — LLM Implementation Tasks

This directory contains implementation plans for LLM agents. Create or update files here only after the Product or user explicitly requests a plan.

## Scope rules

- Business discussion, approved decisions, open questions, and product context belong in \`docs/v0/\`.
- \`plans/\` contains implementation goals, task cards, allowed files, tests, and acceptance criteria only.
- Each task must be small enough for one LLM to implement and verify.
- Full-stack work is split by cluster between a Codex server task and an Antigravity UI task; do not wait for the entire server before starting the UI.
- Do not create an API contract, API handoff, release note, or production document here unless the user requests it separately.
- Never use \`docs/v0/archive/\` as a source of truth.

## Active plans

No active implementation plan files are currently present in this checkout. Create or restore a plan only when the Product or user explicitly requests one.

## Required inputs

- [Product v0 documentation](../docs/v0/README.md).
- [Requirements closure](../docs/v0/01-requirements-closure.md) when a task depends on unresolved decisions.
- \`README.md\`, \`AGENTS.md\`, and \`src/ui/AGENTS.md\` when the task touches the relevant area.

## Minimum plan structure

- Goal
- Scope
- Out of scope
- Input files
- Output files
- Files to write
- Step-by-step implementation
- Testing plan
- Acceptance criteria

Every checklist must show its status. Do not use plans as long discussion logs or implementation journals.
