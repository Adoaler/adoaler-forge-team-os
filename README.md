# Adoaler Forge Team OS

Adoaler Forge Team OS is a Codex plugin that turns Codex into a governed engineering team instead of a loose code assistant. It provides skills, local MCP tools, SQLite long-term memory, repo modeling, continuation records, critic reports, change management, quality gates, repair-only state, and release governance.

## Install

From this plugin root:

    npm --prefix mcp/forge-team-server install
    npm --prefix mcp/forge-team-server run build
    npm --prefix mcp/forge-team-server run test

Then expose this folder through a Codex marketplace entry. The plugin manifest is .codex-plugin/plugin.json, and the MCP server is configured in .mcp.json.

## Runtime Surfaces

- skills/ contains the Team OS role instructions.
- .mcp.json starts node ./mcp/forge-team-server/dist/index.js.
- hooks/hooks.json uses the locally verified Codex hook shape: PostToolUse with a matcher.
- hooks/pre-turn.sh, pre-edit.sh, and related scripts are callable guard scripts. They are documented because this environment did not prove those exact hook event names are supported by the active Codex runtime.

## First Project Workflow

1. Run the 00-team-os skill.
2. Create Project Brain from templates: product, non-goals, architecture, contracts, data model, security, performance, test strategy, release plan, risk register, task graph, and project state.
3. Index the repo with repo.index.
4. Create task graph entries with task.create or task.expand.
5. Use context.compile before edits.
6. Save continuation records when a file or module cannot finish safely in one pass.
7. Run critic and quality gates continuously.
8. Release only after release.verify_ready.

## Limitations

- Only PostToolUse hook wiring is active because it is the verified local plugin hook shape. Other lifecycle scripts are included as callable guards.
- Skill subagents are instruction and metadata surfaces. Actual process-level subagent spawning depends on the Codex runtime where the plugin is installed.
- SQLite text search is the v1 LTM. The schema includes vector-ready fields for future Qdrant, LanceDB, or Chroma integration.
