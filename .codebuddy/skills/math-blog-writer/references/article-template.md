# 数学博客文章模板与格式参考

## Front Matter 模板

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
    - 抽象代数       # 或其他数学分支
    - 具体标签1
    - 具体标签2
---
```

## 引入外部库

每篇文章都需要概念关系图，在 front matter 之后立即引入 d3 和 ConceptGraph：

```html
<script src="https://d3js.org/d3.v7.min.js"></script>
<script src="/assets/lib/concept-graph/concept-graph.js"></script>
<link rel="stylesheet" href="/assets/lib/concept-graph/concept-graph.css">
```

如果文章还需要 2D 数学图形（Graph2D），追加引入：

```html
<script src="/assets/lib/2d-graph/graph2d.js"></script>
<link rel="stylesheet" href="/assets/lib/2d-graph/graph2d.css">
```

## 文章结构

1. **开头导言**（无标题，front matter 之后直接写 1-3 段介绍性文字）
2. **定义部分**（`# xxx的定义` → `## 定义`）
3. **通俗解释**（`## 通俗解释`，用生活化比喻解释抽象概念）
4. **定理/性质**（`## 定理：xxx`，重要定理需要例子和通俗解释）
5. **例子**（`# 例子` 或 `## 例子`）
6. **小结**（`# 小结`，用无序列表总结要点）
7. **概念关系图**（**必需**，每篇文章末尾都要根据文章概念关系绘制一个概念图）

## `<aside>` 用法

### 证明

```html
<aside>
**证明**：

证明正文...

</aside>
```

### 提示/注意

```html
<aside>
💡 提示或注意内容

</aside>
```

## 重要定理的写法

重要定理需要包含以下部分：

1. **定理陈述**
2. **证明**（用 `<aside>` 包裹）
3. **通俗理解**（`## 通俗理解`，用比喻或直觉解释定理含义）
4. **具体例子**（至少 1-2 个完整的、手把手演算的例子）
5. **定理的意义与局限**（如果有的话）

### 范例：凯莱定理的写法

```markdown
## 定理：凯莱定理

任意 $n$ 阶有限群 $G$ 同构于 $S_n$ 的某个子群。

<aside>
**证明**：

设 $G = \{g_1, g_2, \ldots, g_n\}$...

</aside>

## 通俗理解

凯莱定理的本质可以用一句话概括：**群元素的"乘法"本身就是一种"重排"**。

想象一个 $4$ 人小组坐在一排座位上...

## 例子：$\mathbb{Z}_3$ 嵌入 $S_3$

**第一步：给元素编号**
...
**第二步：每个元素对应一个"左乘"**
...
**第三步：验证运算保持**
...

## 定理的意义与局限

**意义**：...
**局限**：...
```

## ConceptGraph 概念图写法

概念关系图使用 d3 驱动的 ConceptGraph 库（力导向布局）：

```html
<div id="xxx-concept-graph"></div>

<script>
  ;(function () {
    const graph = new ConceptGraph('#xxx-concept-graph', {
      width: 860,
      height: 620,
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
  })()
</script>
```

可用的 group 颜色：`blue`, `green`, `orange`, `purple`, `red`, `gray`

概念图组织原则：
- 用清晰的层次结构，从核心概念向外展开
- `shape: 'rect'` 用于重要/核心概念，默认圆形用于其他概念
- 实线表示直接关系，`style: 'dashed'` 表示跨组联系或类比
- 节点数量控制在 15-20 个以内，避免过于拥挤
- `note` 字段用于 LaTeX 公式或简短说明（hover 时显示）

## Graph2D 数学图形写法

```html
<div id="xxx-graph"></div>

<script>
  ;(function () {
    const g = new Graph2D(document.getElementById('xxx-graph'), {
      width: 500, height: 500,
      xRange: [-2, 2], yRange: [-2, 2],
      background: '#fafafa',
    })
    g.drawAxes()
    g.plot(x => Math.sin(x), { color: '#e74c3c', lineWidth: 2 })
    g.point(1, 0, { label: '$P$', color: '#2196f3', radius: 4 })
    g.render()
  })()
</script>
```

## 数学文章中文写作惯例

- LaTeX 行内公式用 `$...$`，行间公式用 `$$...$$`
- 定义中的被定义术语用 `**加粗**`
- 引用/提示用 `> 💡 ...` 或 `<aside>💡 ...</aside>`
- 列表项之间不需要空行（除非列表项本身包含多段）
- 证明结尾**不加** `$\square$` 或任何 QED 符号
- **不要**插入仓库中不存在的图片引用（`![](...)`)，需要图形时用 Graph2D 或 ConceptGraph 库程序化生成
