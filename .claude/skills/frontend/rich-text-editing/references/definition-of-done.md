# Definition of Done — Rich Text Editing

A rich text/WYSIWYG editor feature cannot be marked "done" until every item below is checked.

## 1. Setup & Library
- [ ] Existing project's editor library convention detected and followed (or Tiptap used for a new precedent)
- [ ] Only one editor framework is active in the app — no parallel editor library introduced

## 2. Storage & Sanitization
- [ ] Content is stored as structured JSON (the editor's document format), not raw HTML as the source of truth
- [ ] Content is sanitized server-side on save against an explicit allowlist
- [ ] Content is sanitized again at render time before any HTML output reaches the DOM
- [ ] Pasted content (Word/Google Docs/web) is normalized before entering the document; pasted images go through the upload pipeline, not inline base64

## 3. Rendering & Performance
- [ ] A separate, lighter read-only renderer displays content — the full editor bundle is not shipped to viewers who aren't editing
- [ ] The editor is client-only, dynamically imported, and not rendered under SSR
- [ ] The editor bundle is code-split and loads only on routes/interactions that need authoring

## 4. Media & Content Types (EdTech-Specific)
- [ ] Embedded media (image/video/file) goes through `api-integration`'s upload pipeline, stored as a reference, not inline data
- [ ] Math notation uses a dedicated node type rendered via KaTeX/MathML (if the content requires it)
- [ ] Code blocks are a distinct node type with language selection and syntax highlighting (if the content requires it)

## 5. UX & Accessibility
- [ ] Toolbar scope matches the context (minimal for comments, full for course authoring) — not one maximal toolbar reused everywhere
- [ ] Toolbar has `role="toolbar"`, accessible labels on icon-only buttons, and `aria-pressed` reflecting active formatting state
- [ ] Keyboard shortcuts don't conflict with browser/screen-reader shortcuts and are discoverable
- [ ] Undo/redo relies on the editor's built-in history, not a separate external undo stack

## 6. Long-Form Content
- [ ] Autosave implemented per `form-handling-validation` Rule 10 for long-form/high-value content
- [ ] Live character/word count shown for length-limited content per `form-handling-validation` Rule 22

## 7. Schema & Collaboration
- [ ] Stored documents carry (or are associated with) a schema version; a migration path exists for breaking schema changes
- [ ] Collaborative editing (if present) uses a CRDT (e.g. Yjs), not last-write-wins; not added speculatively for single-author content

## 8. i18n/Locale
- [ ] Toolbar/UI strings route through the `i18n-l10n` mechanism, not hardcoded
- [ ] RTL locales render correctly via logical CSS properties inside the editor

## 9. Testing
- [ ] Tests interact via user-facing behavior (typing, toolbar clicks) or the editor's public export API, not internal editor/transaction state

## Sign-off
Only mark "rich-text-editing: done" once all sections are checked.
