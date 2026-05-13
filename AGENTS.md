# Adoaler Forge Team OS Agent Rules

This repo implements a Codex plugin. Treat plugin format compatibility as a product contract.

- Always keep build and tests passing.
- Always use TypeScript strict for MCP server code.
- Always update docs when behavior changes.
- Do not create deferred-work markers in primary code paths.
- Do not create fake tests or tests that only assert mocks exist.
- Do not remove validation to make tests pass.
- Do not alter the plugin manifest without checking the Codex plugin format.
- Do not execute commands outside the allowlist.
- Do not save secrets to memory, logs, reports, or fixtures.
- Every feature needs a task, acceptance criteria, allowed files, and quality gate.
- Project Brain must exist before project code generation workflows begin.
- REPAIR_ONLY blocks feature work until repair gates pass.
