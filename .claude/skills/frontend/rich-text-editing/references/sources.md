# References & Sources

## Official Documentation
- **Tiptap official docs** — headless editor architecture, extensions, JSON document format, collaboration (Yjs) integration: https://tiptap.dev/docs
- **ProseMirror official guide** — document schema, transactions, history plugin, the model Tiptap is built on: https://prosemirror.net/docs/guide/
- **Lexical official docs** — node/plugin model, `HistoryPlugin`, collaboration primitives: https://lexical.dev/docs/intro
- **DOMPurify** — HTML sanitization library used at render time to prevent stored/rendered XSS: https://github.com/cure53/DOMPurify
- **OWASP — Cross-Site Scripting (XSS) Prevention Cheat Sheet** — sanitization allowlisting guidance shared with `form-handling-validation`: https://owasp.org/www-community/xss-filter-evasion-cheatsheet
- **W3C WAI-ARIA Authoring Practices — Toolbar Pattern** — `role="toolbar"`, keyboard navigation, `aria-pressed` for formatting state: https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
- **Yjs documentation** — CRDT-based collaborative editing, official bindings for both Tiptap and Lexical: https://docs.yjs.dev

## Widely-Recognized Community Standards
- **KaTeX documentation** — math rendering approach referenced for the math-node rule: https://katex.org/docs/api
- **Shiki / Prism documentation** — syntax highlighting approaches referenced for the code-block rule: https://shiki.style, https://prismjs.com

## Note on usage
Cite the relevant source above if the user asks "why" behind a rule. Paraphrase principles — don't reproduce documentation text verbatim in generated code or docs.
