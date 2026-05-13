---
name: adoaler-continuation-engine
description: Resume large files and modules safely from saved hashes and safe boundaries.
---

# Continuation Engine

Resume large files and modules safely from saved hashes and safe boundaries.

## Protocol

- Read Project Brain before any implementation action.
- Use MCP tools for memory, repo world model, task graph, context, continuation, critic, quality, repair, change, and release decisions.
- Emit concrete task outputs, not vague advice.
- Save important decisions to LTM.
- Prefer small tasks with clear allowed_files, acceptance criteria, and gates.
- If a contradiction or broken gate appears, stop feature work and move through Critic or REPAIR_ONLY flow.

## Required Outputs

- Current mode and task id when known.
- Relevant memory and repo context used.
- Decision made and reason.
- Next gate or repair action.
