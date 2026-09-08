# Rich Text Editing Rules

## Rule 1: Project-Detected Library, Tiptap as the Default
- **Existing project**: check `package.json` for `@tiptap/*`, `lexical`/`@lexical/react`, `prosemirror-*`, `slate`/`slate-react`, or `quill`, and follow whatever is already established.
- **New project / no precedent**: default to **Tiptap** — headless, ProseMirror-based, well-suited to structured course content with a predictable extension model. Use Lexical only if the project already commits to it or specifically needs its collaborative-editing primitives.
- Never introduce a second editor framework alongside an existing one — two editor libraries in one app doubles the sanitization surface, bundle weight, and content-format complexity.

## Rule 2: Store Structured Content, Not Raw HTML
- The source of truth for authored content is the editor's structured JSON document (ProseMirror doc JSON, Lexical serialized state), not an HTML string — HTML is generated as a render target when needed, never stored as the canonical representation.
- Structured JSON is queryable, diffable, and safely re-editable; raw stored HTML invites both drift (hand-edited HTML that the editor can't parse back) and a larger sanitization surface.

## Rule 3: Sanitize on Both Write and Read
- Content is sanitized server-side on save (reject or strip disallowed nodes/marks/attributes against an explicit allowlist), and sanitized again at render time before any HTML output reaches the DOM (e.g. via DOMPurify) — never trust that "it came from our own editor" is sufficient, since the JSON can be crafted or replayed directly against the API.
- This is the structured-editor implementation of `form-handling-validation`'s Rule 15 — that rule states the requirement; this rule defines where sanitization actually happens for a document-based editor.

## Rule 4: Read-Only Renderer Is a Separate, Lighter Code Path
- Displaying authored content to a student/viewer uses a dedicated read-only renderer (converting the stored JSON to React elements or sanitized HTML) that does not import the full editor bundle (ProseMirror/Lexical core, all extensions, toolbar UI) — a student reading a lesson should not download the same JS a course author needs to edit it.
- If the library ships a lightweight renderer package (e.g. a JSON-to-React renderer), prefer it over instantiating a read-only editor instance just to display content.

## Rule 5: Editor Is Client-Only and Lazy-Loaded
- The rich text editor component is client-only (`'use client'`) and dynamically imported (e.g. `next/dynamic` with `ssr: false`) rather than bundled into the initial page load or attempted under SSR — these editors read from `window`/`document` during initialization and produce hydration mismatches if rendered server-side.
- The editor chunk loads only on the route/interaction that actually needs authoring (e.g. after clicking "Edit," not on every page that might contain formatted content).

## Rule 6: Paste Normalization
- Content pasted from Word, Google Docs, or arbitrary web pages is normalized on paste — stripping proprietary markup, collapsing redundant inline styles, and mapping to the editor's supported node/mark set — before it enters the document, rather than allowing arbitrary foreign HTML to be inserted as-is.
- Pasted images are handled deliberately (uploaded through the standard media pipeline, or rejected with clear feedback) rather than silently embedded as base64 data URIs, which bloats the stored document and bypasses the upload pipeline's validation.

## Rule 7: Media Embedding Integrates with the Upload Pipeline
- Images, video, and file attachments inserted into editor content go through the same chunked-upload, type/size validation, and progress-feedback flow defined in `api-integration` — the editor node stores a reference (URL/asset ID) to the uploaded media, not the raw file data inline in the document.
- Embed placeholders (e.g. a video node) show upload/processing state within the editor, consistent with the upload pipeline's status reporting.

## Rule 8: Math and Code Blocks Are First-Class Content Types (EdTech-Specific)
- Math notation is authored and rendered via a dedicated math node type backed by KaTeX (or MathML), not typed as plain text with Unicode approximations — this matters directly for STEM course content.
- Code blocks are a distinct node type with language selection and syntax highlighting at render time (e.g. via Shiki/Prism), not rendered as unstyled `<pre>` text — relevant for programming-course content.

## Rule 9: Toolbar Scope Matches Context
- A comment/discussion editor exposes a minimal toolbar (bold, italic, link, maybe a list) — not the full course-authoring toolbar (headings, tables, embeds, math). A course-authoring editor exposes the full toolbar appropriate to that content type.
- Toolbar scope is a deliberate per-use-case decision (which extensions are registered), not the same maximal editor instance reused everywhere with unused buttons hidden via CSS.

## Rule 10: Editor Accessibility Is Deliberate
- The toolbar has `role="toolbar"` with accessible labels on every button (icon-only buttons include `aria-label`), keyboard shortcuts are discoverable (`aria-keyshortcuts` or a visible shortcuts reference) and don't conflict with browser/screen-reader shortcuts, and focus management on toolbar actions returns focus to the editor content afterward.
- Formatting state changes (e.g. "bold applied") are perceivable to screen reader users via the toolbar button's pressed state (`aria-pressed`), not only a visual style change — cross-references the `accessibility` skill's general ARIA-state rules.

## Rule 11: Autosave and Character/Word Count Follow Form-Handling Rules
- Long-form editor content (essays, course lesson content) autosaves per `form-handling-validation`'s Rule 10, and length-limited content shows a live counter per that skill's Rule 22 — this skill doesn't redefine those behaviors, it applies them to editor content specifically (counting the document's text content, not its serialized JSON size).

## Rule 12: Undo/Redo Uses the Editor's Built-In History
- Undo/redo is handled by the editor library's own history plugin (ProseMirror's `history`, Lexical's `HistoryPlugin`) — never layered with a separate external undo stack (e.g. from a state management library) that can desynchronize from the editor's actual internal state.
- If autosave needs to avoid polluting undo history with save-triggered updates, this is handled via the editor's transaction metadata, not by bypassing its history system.

## Rule 13: Content Schema Is Versioned
- The stored document JSON includes (or is associated with) a schema version, so that editor/extension upgrades that change the node/mark structure can migrate old content rather than silently failing to parse or rendering incorrectly.
- A migration path is defined before shipping a breaking schema change (new required attributes, renamed node types) — existing authored content must not become uneditable or corrupted by an editor upgrade.

## Rule 14: Collaborative Editing Uses a CRDT, Not Last-Write-Wins
- If multiple users can edit the same document concurrently (co-authoring a course, live collaborative notes), use a CRDT-based sync layer (e.g. Yjs, which both Tiptap and Lexical support via official bindings) rather than a naive "last save wins" API call — concurrent saves without conflict resolution silently destroy content.
- Don't build collaborative editing speculatively for single-author content (e.g. individual quiz authoring) — this is real complexity, add it only when concurrent editing is an actual product requirement.

## Rule 15: Locale/RTL Support Flows Through the i18n Skill
- Toolbar labels, placeholder text, and any editor-generated UI strings route through the `i18n-l10n` skill's mechanism, not hardcoded English. For RTL locales, the editor's text direction and toolbar layout follow `i18n-l10n`'s logical-CSS-properties rule — this skill doesn't reimplement locale handling.

## Rule 16: Editor Bundle Is Code-Split and Lazy-Loaded
- The editor library and its extensions are excluded from the main/shared bundle and loaded only on the route that needs authoring — cross-references `performance-optimization`'s code-splitting rules. A rich text editor is one of the heavier dependencies a page can pull in; it must never be part of a shared chunk loaded on pages that only display (not author) content.

## Rule 17: Tests Interact via User-Facing Behavior
- Editor tests simulate real user interaction (typing, selecting text, clicking toolbar buttons via Testing Library queries or Playwright) and assert on the rendered output or the editor's public content-export API (e.g. `getJSON()`/`getHTML()`) — not by reaching into ProseMirror/Lexical's internal transaction or node state directly.
