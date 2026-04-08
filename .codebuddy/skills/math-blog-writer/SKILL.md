---
name: math-blog-writer
description: "Specialized skill for writing mathematics blog articles in the nullspace Hexo blog. This skill should be used when the user asks to write, edit, or review math articles in the blog, particularly for the Math Stroll series covering abstract algebra, group theory, ring theory, field theory, and related topics. Triggers include creating new math posts, editing existing ones, adding proofs, examples, concept graphs, or 2D math figures to articles."
---

# Math Blog Writer

This skill handles the writing and editing of mathematics articles for the nullspace blog (a Hexo-based static site). All articles live under `source/_posts/math/数学漫步/`.

## Article Format Rules

### Front Matter

Every article must start with YAML front matter:

```yaml
---
layout: post
title: 标题：副标题
date: YYYY-MM-DD
toc: true
categories:
    - Math
tags:
    - 数学
    - [topic area]
    - [specific tags]
---
```

### Proofs: Use `<aside>` Tags

All mathematical proofs MUST be wrapped in `<aside>` tags. Never use blockquotes or other containers for proofs.

```html
<aside data-title="证明">
Proof content here using LaTeX...

</aside>
```

Tips and notes also use `<aside data-title="NOTE 或者 TIPS">`:

```html
<aside>
💡 Tip or note content here.

</aside>
```

### No Horizontal Rules

NEVER use `---` horizontal rules to separate sections. Use proper heading hierarchy (`#`, `##`, `###`) instead. Horizontal rules break the visual flow and are not part of this blog's style.

### Important Theorems: Deep Explanation Required

When encountering an important theorem, provide substantially more content than a bare statement and proof. An important theorem section must include:

1. **Theorem statement** — Clear, formal mathematical statement
2. **Proof** — Wrapped in `<aside>` tags
3. **通俗理解 (Intuitive explanation)** — Use everyday analogies and metaphors to make the theorem accessible. Explain *why* the theorem is true at an intuitive level
4. **Concrete examples** — At least 1-2 fully worked examples with step-by-step calculations. Show every intermediate step so readers can follow along
5. **意义与局限 (Significance and limitations)** — Explain why the theorem matters in the broader context, and note any caveats or inefficiencies

### Writing Style

- Write in Chinese (中文) for all prose
- Use LaTeX for all math: inline `$...$`, display `$$...$$`
- Bold (`**...**`) for defined terms on first occurrence
- Proofs do NOT end with `$\square$` or any QED symbol — just end the proof text naturally
- NEVER insert image references (`![](...)`) for images that do not already exist in the repository. If you need a figure, use the Graph2D library to generate it programmatically
- Provide 通俗解释 (plain-language explanations) after definitions using real-world analogies
- Use `> 💡 ...` blockquotes for brief inline tips; use `<aside>💡 ...</aside>` for longer notes
- Keep a conversational, pedagogical tone — the target audience is someone learning the subject for the first time

### Article Structure

Follow this standard structure:

1. **Opening paragraph** — No heading, immediately after front matter (or library imports). 1-3 paragraphs introducing the topic and its importance
2. **Definitions** — `# xxx的定义` → `## 定义` → `## 通俗解释`
3. **Theorems and properties** — `## 定理：xxx`, each important theorem with full treatment (see above)
4. **Examples** — `# 例子` or `## 例子`, with concrete calculations
5. **小结 (Summary)** — `# 小结`, bullet-point list of key takeaways
6. **概念关系图 (Concept graph)** — **REQUIRED**. Every article must end with a concept graph after 小结. The graph should visualize the key concepts and their relationships from the article using the ConceptGraph library (d3-based, from `/assets/lib/concept-graph/`)

## Available Libraries

### ConceptGraph (概念关系图)

Import at the top of the article (after front matter):

```html
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="/assets/lib/concept-graph/concept-graph.js"></script>
<link rel="stylesheet" href="/assets/lib/concept-graph/concept-graph.css">
```

ConceptGraph is a d3-based force-directed concept graph library. Available node groups (colors): `blue`, `green`, `orange`, `purple`, `red`, `gray`.

Usage pattern (refer to existing articles like `2026-03-26-群.md` for full examples):

```js
const graph = new ConceptGraph('#container-id', {
  width: 860, height: 620,
  fullWidth: true,
  chargeStrength: -520,
  linkDistance: 130,
  collideRadius: 55,
  nodeRadius: 30,
})

graph.addNodes([
  { id: 'node1', label: '标签', group: 'blue', shape: 'rect', note: '$公式$' },
  { id: 'node2', label: '标签', group: 'green', note: '说明文字' },
])

graph.addEdges([
  { source: 'node1', target: 'node2', label: '关系' },
  { source: 'node1', target: 'node3', style: 'dashed' },
])

graph.render()
```

Design principles for concept graphs:
- Organize with clear hierarchy — core concept at center, branching outward
- Use `shape: 'rect'` for important/core concepts, default circle for others
- Use solid edges for direct relationships, `style: 'dashed'` for cross-group connections or analogies
- Keep node count to 15-20 maximum
- Each color group should represent a coherent thematic cluster
- Use `note` for LaTeX formulas or brief explanations that appear on hover

### Graph2D (2D 数学图形)

Import at the top of the article (in addition to ConceptGraph if needed):

```html
<script src="/assets/lib/2d-graph/graph2d.js"></script>
<link rel="stylesheet" href="/assets/lib/2d-graph/graph2d.css">
```

Graph2D is a canvas-based 2D drawing library that supports:
- Coordinate systems with axes, grids, and tick labels
- Mathematical figures: circles, lines, curves, arcs, parametric curves, rectangles, triangles, polylines
- Points with labels (supports `$...$` TeX via MathJax)
- Pure text labels at arbitrary positions

For detailed template and usage examples, refer to `references/article-template.md`.

## Workflow

When writing or editing a math article:

1. Read the existing article (if editing) to understand current content and structure
2. Consult `references/article-template.md` for format templates and examples
3. Apply all format rules: `<aside>` for proofs, no `---` dividers, deep theorem explanations
4. For new articles, follow the standard article structure
5. Ensure all LaTeX is syntactically correct
6. If the article includes concept graphs or 2D figures, ensure the appropriate library imports are present at the top of the file
