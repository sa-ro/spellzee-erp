---
name: rich-text-editing
description: Use this skill whenever the user is building, integrating, or reviewing a rich text/WYSIWYG editor — course/lesson content authoring, comment or discussion editors, quiz question authoring with formatting, or anywhere free-text content needs formatting, embedded media, math, or code blocks. Trigger for phrases like "add a rich text editor", "WYSIWYG", "course content editor", "how do I sanitize this editor content", "embed an image/video in the editor", "the editor content isn't saving right", or any request involving Tiptap, Lexical, ProseMirror, Slate, or `dangerouslySetInnerHTML`. Also trigger for Definition of Done review on a rich-text/content-authoring feature.
---

# Rich Text Editing Skill

Defines how rich text/WYSIWYG editors are built and integrated for content authoring — course material, quiz questions, and discussion content — using a project-detected library with **Tiptap** (ProseMirror-based) as the default, with EdTech-specific rules for math/code content, read-only rendering at scale, and sanitization discipline shared with `form-handling-validation`.

## Step 0: Detect Project Context Before Applying Any Rule

**Always do this first.**

**Existing project?**
- Check `package.json` for `@tiptap/*`, `lexical`/`@lexical/react`, `prosemirror-*`, `slate`/`slate-react`, or `quill`. Follow whatever is already established — don't introduce a second editor framework.

**New project / no precedent?**
- Default to **Tiptap** (ProseMirror-based, headless, well-documented extension model) for most course-authoring and comment-editor needs. Consider **Lexical** only if the project already leans heavily on Meta's ecosystem or needs its specific collaborative-editing primitives.

**This skill is the owner of editor-specific sanitization, storage format, and bundle-loading strategy** — `form-handling-validation`'s Rule 15 (sanitize before rendering as HTML) applies here as the base rule; this skill defines how that's actually implemented for a structured editor.

## When to use this
- Building any new rich text/WYSIWYG editor (course authoring, quiz question formatting, discussion/comment editor)
- Handling paste from Word/Google Docs, embedded images/video, math notation, or code blocks
- Reviewing sanitization, storage format, or XSS risk in editor content
- Building the read-only renderer that displays authored content to students
- Reviewing a PR or running Definition of Done for a rich-text/content-authoring feature

## Core principles (see `references/rules.md` for full detail with rationale)

1. **Project-detected library, Tiptap as the default** — never a second editor framework in one app
2. **Store structured content (JSON document), not raw HTML** — HTML is a render target, not the source of truth
3. **Sanitize on both write and read** — never trust client-produced JSON/HTML blindly, even from your own editor
4. **Separate read-only renderer from the full editor bundle** — students reading content shouldn't download editor JS
5. **Editor is client-only and lazy-loaded** — dynamic import, avoid SSR/hydration mismatches
6. **Paste normalization** — strip/clean HTML pasted from Word/Google Docs before it enters the document
7. **Media embedding integrates with the upload pipeline** — cross-references `api-integration`'s chunked-upload rule
8. **Math and code blocks are first-class content types (EdTech-specific)** — KaTeX/MathML for math, syntax-highlighted code blocks
9. **Toolbar scope matches context** — minimal toolbar for comments, full toolbar for course authoring
10. **Editor accessibility is deliberate** — keyboard shortcuts, ARIA toolbar roles, focus management
11. **Autosave and character/word count follow `form-handling-validation`'s Rules 10 and 22**
12. **Undo/redo uses the editor's built-in history** — never fought with external state management
13. **Content schema is versioned** — stored documents survive editor/schema upgrades via migration
14. **Collaborative editing (if needed) uses a CRDT, not a naive last-write-wins save**
15. **Locale/RTL support flows through the `i18n-l10n` skill**, not reimplemented in the editor
16. **Editor bundle is code-split and lazy-loaded** — cross-references `performance-optimization`
17. **Tests interact with the editor via user-facing behavior**, not internal editor state

## Workflow

1. **Step 0 first, always**: detect existing editor library, or set Tiptap as the standard.
2. Decide storage format (structured JSON document) and read-only rendering strategy before writing any editor UI.
3. Build the editor with paste normalization, sanitized output, and accessible toolbar/keyboard behavior.
4. For EdTech content: confirm whether math/code blocks are needed, and whether the content needs autosave and word-count limits.
5. Build the lightweight read-only renderer as a separate code path from the full editor.
6. Before sign-off: run through `references/definition-of-done.md`.

## Notes
- This skill governs the editor itself and its content format. For form-level sanitization/autosave/character-count rules this builds on, see `form-handling-validation`. For upload/transport of embedded media, see `api-integration`. For editor bundle-splitting and load performance, see `performance-optimization`. For locale/RTL behavior inside the editor, see `i18n-l10n`.
- Grounded in official Tiptap/ProseMirror, Lexical, DOMPurify, OWASP XSS Prevention, and W3C ARIA Authoring Practices documentation — see `references/sources.md`.
