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
6. **概念关系图 (Concept graph)** — **REQUIRED**. Every article must end with a concept graph section after 小结. When writing the article, leave a placeholder comment — do NOT generate the graph code inline. The graph will be generated separately by the user via the `/concept-graph` command.

Placeholder to insert at the end of every article:

```markdown
# 概念关系图

<!-- concept-graph: [简短描述本文的核心概念和关系，供 /concept-graph 命令参考] -->
```

## Available Libraries

### ConceptGraph (概念关系图)

> **注意**：写文章时不需要引入 ConceptGraph 库，也不需要编写概念图代码。概念图由用户在文章写完后，通过 `/concept-graph` 命令单独生成并插入。写文章时只需在末尾留下占位注释即可（见上方"Article Structure"第6条）。

ConceptGraph 库的具体用法由 `/concept-graph` 命令管理，此处不做展开。

### Graph2D (2D 数学图形)

**何时使用**：写文章时，如果某个概念、定理或构造用图示能让读者更直观地理解（例如几何变换、函数图像、空间关系、算法步骤等），应当**主动**使用 Graph2D 生成图形，而不是仅靠文字描述。不要等用户要求——判断"这里加张图会更清晰"就直接加。

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
- Arrows (straight and curved Bézier), ellipse shapes for set diagrams

**扩展库**：如果现有 API 不足以画出所需图形，可以直接向 `/source/assets/lib/2d-graph/graph2d.js` 添加新的方法或工具函数。添加时遵循已有风格（命令队列模式：公开方法 push 到 `this._commands`，内部 `_drawXxx` 方法执行实际绘制，并在 `_exec` 的 switch 里注册）。同时确保文章头部已引入该库的 `<script>` 和 `<link>`。

For detailed template and usage examples, refer to `references/article-template.md`.

## Workflow

When writing or editing a math article:

1. Read the existing article (if editing) to understand current content and structure
2. Consult `references/article-template.md` for format templates and examples
3. Apply all format rules: `<aside>` for proofs, no `---` dividers, deep theorem explanations
4. For new articles, follow the standard article structure
5. Ensure all LaTeX is syntactically correct
6. If the article includes concept graphs or 2D figures, ensure the appropriate library imports are present at the top of the file
