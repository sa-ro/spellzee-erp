# References & Sources

## Official Documentation
- **Turborepo official docs** — `turbo.json` task graph, `dependsOn`/`outputs`, remote caching, `--filter` affected-package runs: https://turbo.build/repo/docs
- **Nx official docs** — `affected` commands, project graph, generators (reference for when Nx is the better fit than Turborepo): https://nx.dev/getting-started/intro
- **pnpm Workspaces documentation** — strict dependency linking, `workspace:*` protocol, phantom dependency prevention: https://pnpm.io/workspaces
- **Node.js — `package.json` `exports` field documentation** — the mechanism behind Rule 9's intentional public-API boundary: https://nodejs.org/api/packages.html#exports

## Widely-Recognized Community Standards
- **Turborepo blog/handbook — Structuring a monorepo** — package-boundary and caching-correctness guidance referenced across several rules: https://turbo.build/repo/docs/crafting-your-repository

## Note on usage
Cite the relevant source above if the user asks "why" behind a rule. Paraphrase principles — don't reproduce documentation text verbatim in generated code or docs.
