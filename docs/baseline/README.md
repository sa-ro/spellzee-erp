# Baseline — extracted text

`requirements-draft-3.txt` is `pdftotext -layout` output of
`Spellzee_ERP_Master_Product_Business_Requirements_Draft_3.pdf` at the repo root.

**The PDF remains the source of truth.** This file exists because read-only agents
(`scope-interrogator`, `erosion-auditor`) have no Bash tool and cannot extract a PDF
themselves — without it they audit from secondary sources and silently miss content.
That happened once: an audit reconstructed 14 of §30's 21 open decisions from skill
files and reported the gap rather than the answer.

Regenerate after any baseline revision:

```
pdftotext -layout Spellzee_ERP_Master_Product_Business_Requirements_Draft_3.pdf \
  docs/baseline/requirements-draft-3.txt
```

Known extraction artefacts: bullet markers render as a stray byte; some wide tables
(§4 current-state, §22.4 authority matrix, §31 glossary) have columns interleaved.
Check the PDF for those sections rather than trusting the text layout.
