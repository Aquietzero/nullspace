# 图数据驱动重构：布局持久化 + 可视化编辑

## 背景与问题

当前 9 篇抽象代数文章中，每篇文末都内嵌了大段 `<script>` 代码来构建概念图。存在以下问题：

1. **力导图布局不确定**：每次刷新页面，节点位置随机，效果不稳定
2. **视口大小难调**：`width`/`height` 写死在代码里，内容可能溢出或留白
3. **文档中代码量大**：每篇 50-90 行图定义代码混在 markdown 里，影响可读性
4. **无法精细调整**：想微调某个节点位置，必须改力模拟参数，间接且不精确

## 核心理念

**一个 JSON = 一张图**。图是独立的、可复用的资源，不与特定文章绑定。一篇文章可以引用多张图，一张图也可以被多篇文章引用。编辑器和数据格式不仅限于概念图，而是适用于所有"基于动力图做初始布局 → 可视化编辑存储布局数据"的场景。

## 设计目标

| 目标 | 说明 |
|------|------|
| **数据驱动** | 每张图存为一个独立 JSON 文件，文档中只做引用 |
| **布局持久化** | JSON 中包含每个节点的 `x, y` 坐标，渲染时直接使用，不依赖力模拟 |
| **自动 viewBox** | 根据节点坐标自动计算最小包围盒，设定合适的 SVG viewBox |
| **可视化编辑器** | 提供一个拖拽编辑界面，用于调整节点位置并导出 JSON |
| **通用性** | 编辑器与数据格式不限于概念图，适用于所有动力图布局场景 |
| **向后兼容** | 旧的 JS API（`addNode`/`addEdge`/`render`）继续可用 |

## 架构设计

### 1. 数据文件格式

新增目录 `source/assets/data/graphs/`，作为所有图数据的统一仓库。**一个 JSON 文件 = 一张图**，以语义化名称命名，不与特定文章绑定：

```
source/assets/data/graphs/
├── set-mapping-operation.json          # 集合·映射·运算 关系图
├── equivalence-partition.json          # 等价关系与划分 关系图
├── group-structure.json                # 群结构概览图
├── subgroup-coset-lagrange.json        # 子群·陪集·拉格朗日 关系图
├── cyclic-group-generator.json         # 循环群与生成元 关系图
├── permutation-symmetric-group.json    # 置换群与对称群 关系图
├── ideal-quotient-ring.json            # 理想与商环 关系图
├── field-extension.json                # 域扩张 关系图
├── galois-overview.json                # 伽罗瓦理论 概览图
└── ...                                 # 未来任何新图
```

> 一篇文章可以引用多张图，一张图也可以被多篇文章引用。
> 图的粒度由内容决定，而非由文章决定。

JSON Schema：

```json
{
  "title": "集合·映射·运算",
  "options": {
    "nodeRadius": 30,
    "fullWidth": true
  },
  "nodes": [
    {
      "id": "set",
      "label": "集合",
      "group": "blue",
      "shape": "rect",
      "note": null,
      "x": 400,
      "y": 120
    }
  ],
  "edges": [
    {
      "source": "set",
      "target": "subset",
      "label": "$\\subseteq$",
      "style": "solid",
      "color": null
    }
  ]
}
```

关键点：

- **一个 JSON = 一张图**：图是独立资源，不与文章耦合
- **节点携带 `x, y`**：这是编辑器保存的精确坐标，渲染时直接定位
- **`options`**：只保留真正需要自定义的选项（`nodeRadius` 等），`width/height` 不再需要（自动计算）
- **边不需要坐标**：边的路径由起止节点坐标决定
- **`title`**：图自身的标题，用于编辑器列表展示和识别

### 2. 渲染器改造（concept-graph.js）

#### 新增静态渲染模式

在现有 `ConceptGraph` 类上新增：

```js
// 新增：从 JSON 数据渲染
ConceptGraph.fromData(container, jsonData)

// 新增：从 URL 加载 JSON 并渲染
ConceptGraph.load(container, jsonUrl)
```

渲染流程：

```
JSON 数据 → 解析节点 x,y → 计算 viewBox → 直接绘制（无力模拟）
```

**自动 viewBox 计算**：

```
padding = 80
minX = min(所有节点 x) - padding
minY = min(所有节点 y) - padding
maxX = max(所有节点 x) + padding
maxY = max(所有节点 y) + padding
viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`
```

#### 保留力模拟模式

旧 API（`addNode` / `addEdge` / `render()`）继续工作，用于：
- 编辑器中的实时预览
- 向后兼容（万一某些文章还没迁移）

### 3. 文档中的引用方式

改造后，文档中引用一张图只需一行 `<div>`，通过 `data-src` 指向图数据 JSON 的路径：

```html
<!-- 引用一张图 -->
<div class="concept-graph" data-src="/assets/data/graphs/set-mapping-operation.json"></div>

<!-- 同一篇文章里引用两张图 -->
<div class="concept-graph" data-src="/assets/data/graphs/group-structure.json"></div>
<div class="concept-graph" data-src="/assets/data/graphs/subgroup-coset-lagrange.json"></div>
```

由一个全局初始化脚本自动扫描页面中所有 `.concept-graph[data-src]` 元素并渲染。

**对比改造前后**：

| | 改造前 | 改造后 |
|---|---|---|
| 文档引入 | 3 行 `<script>`/`<link>` + 50-90 行图定义代码 | 1 行 `<div>`，引用独立 JSON |
| 依赖管理 | 每篇文章手动引入 d3.js 和 concept-graph.js | 全局自动加载（检测到 `.concept-graph` 时才加载） |
| 布局 | 力导图每次随机 | 固定坐标直接定位 |
| 修改图 | 改 markdown 里的代码 | 用编辑器拖拽后导出 JSON |
| 复用 | 一对一，无复用 | 任意文章可引用任意图 |

### 4. 可视化编辑器

新增 `source/assets/lib/concept-graph/editor.html`——一个独立的单页工具。不限于概念图，适用于所有需要"动力图初始布局 → 手动微调 → 存储"的场景。

#### 编辑工作流

编辑器支持**动力图布局 ↔ 手动拖拽**的反复迭代，而非一次性线性流程：

```
                    ┌─────────────────────────┐
                    │                         ▼
 导入/新建 → 动力图布局 → 手动拖拽微调 → 满意？──否──→ 重新动力图布局
                                          │                  ▲
                                          是            （保留手动拖拽
                                          │              过的约束位置）
                                          ▼
                                      固化 & 导出
```

核心能力分三层：

**第一层：动力图布局（探索阶段）**
- 导入节点和边数据后，先用动力图自动布局，得到一个初始分布
- 可以**拖动个别节点到大致合理的区域**，然后**重新运行动力图**——此时被拖动的节点作为"锚点"（固定位置），其余节点围绕锚点重新自动布局
- 这个"拖 → 重新布局 → 再拖 → 再布局"的循环可以反复执行，逐步逼近理想布局

**第二层：手动精调（定稿阶段）**
- 对动力图布局的结果满意后，点击**「固化布局」**，冻结所有节点坐标
- 进入纯手动拖拽模式，逐个微调节点位置（此时不再有力模拟干扰）
- 支持网格吸附辅助对齐

**第三层：回退能力**
- **「回到初始动力图布局」**：清除所有手动坐标，从零开始重新跑动力图（相当于 reset）
- **「撤销固化」**：从精调阶段退回到动力图阶段，重新进入"拖 → 布局"循环
- 常规的 **Undo/Redo**：撤销/重做单步操作

#### 其他功能

1. **加载 JSON**：从 `source/assets/data/graphs/` 目录选择已有图，或拖拽 JSON 文件导入
2. **新建图**：空白画布开始创建新图，添加节点和边
3. **导出 JSON**：一键导出包含坐标的完整 JSON
4. **网格与对齐**：可选网格吸附，帮助对齐

#### 编辑器 UI 布局

```
┌─────────────────────────────────────────────────────────────┐
│  [打开JSON] [新建]  [导出JSON]                               │
│  ─────────────────────────────────────────────────────────  │
│  布局阶段: [▶ 运行动力图] [⏹ 固化布局] [↺ 重置初始布局]       │
│            [网格吸附 ☐]   [Undo] [Redo]                     │
├──────────────────────────────────────────┬──────────────────┤
│                                          │  节点属性         │
│     图形编辑区                             │  - id            │
│     （SVG 画布）                           │  - label         │
│                                          │  - group         │
│     动力图阶段：节点可拖拽，              │  - x, y          │
│     拖拽后的节点显示📌标记（锚点）         │  - 📌 固定       │
│                                          ├──────────────────┤
│     精调阶段：纯手动拖拽，                │  边属性           │
│     无力模拟干扰                          │  - source        │
│                                          │  - target        │
│                                          │  - label         │
│                                          │  - style         │
├──────────────────────────────────────────┴──────────────────┤
│  状态栏：模式: 动力图布局 | 节点: 17 (📌3) | 边: 22          │
└─────────────────────────────────────────────────────────────┘
```

#### 技术选型

- 纯 HTML + JS + D3.js（与 ConceptGraph 同栈）
- 无需构建工具，直接在浏览器中打开
- 编辑器复用 ConceptGraph 的渲染逻辑

## 实现计划

### Phase 1: 数据格式与静态渲染（核心）

1. **定义 JSON Schema** 并创建 `source/assets/data/graphs/` 目录
2. **改造 `concept-graph.js`**：
   - 新增 `ConceptGraph.fromData(container, data)` 静态方法
   - 新增 `ConceptGraph.load(container, url)` 异步加载方法
   - 实现自动 viewBox 计算
   - 实现静态定位渲染（不启动力模拟）
3. **新增全局初始化脚本** `concept-graph-loader.js`：
   - 扫描 `.concept-graph[data-src]` 元素
   - 自动加载 d3.js（如未加载）和 concept-graph.js
   - 调用 `ConceptGraph.load()` 渲染

### Phase 2: 数据迁移

4. **从现有 9 篇文章中提取图数据**为独立 JSON 文件，存入 `source/assets/data/graphs/`：
   - 每张图一个 JSON，以图的语义命名（非文章名）
   - 节点和边数据从文章内嵌代码中提取
   - 初始 `x, y` 坐标先用力模拟跑一次，截取稳定态坐标
5. **改造 9 篇文章**：
   - 删除 `<script>` 图定义代码
   - 删除手动引入的 `<script src="d3.js">` / `<script src="concept-graph.js">` / `<link>`
   - 替换为 `<div class="concept-graph" data-src="/assets/data/graphs/xxx.json"></div>`

### Phase 3: 可视化编辑器

6. **实现编辑器 `editor.html`**：
   - JSON 加载/导出
   - SVG 画布 + 节点拖拽
   - 力布局辅助按钮
   - 节点/边属性面板
   - 网格吸附
7. **用编辑器精调已提取的图布局**，导出最终 JSON

### Phase 4: 全局集成

8. **在 NexT 主题配置中注入 loader 脚本**：
   - 在 `_data/` 或主题配置中添加全局 JS 引用
   - 确保 `concept-graph-loader.js` 在所有文章页面加载

## 文件变更汇总

```
新增：
  source/assets/data/graphs/*.json                        (图数据 JSON，一个文件一张图)
  source/assets/lib/concept-graph/concept-graph-loader.js (全局自动加载器)
  source/assets/lib/concept-graph/editor.html             (可视化编辑器)

修改：
  source/assets/lib/concept-graph/concept-graph.js        (新增静态渲染 API)
  source/_posts/math/数学漫步/抽象代数/*.md               (9 篇文章简化引用)
  _config.next.yml 或 source/_data/head.njk               (注入全局 loader)
```

## 注意事项

- **一图一文件**：`source/assets/data/graphs/` 下每个 JSON 就是一张独立的图，命名反映图的内容而非文章标题
- **MathJax 兼容**：JSON 中的 TeX 公式（`$...$`）需要在渲染后触发 MathJax 排版
- **暗色模式**：如果未来支持暗色模式，JSON 中不存储颜色，颜色由 CSS 变量控制（当前不做，留接口）
- **性能**：静态渲染比力模拟快很多，页面加载体验会明显提升
- **编辑器是开发工具**：`editor.html` 不需要部署到线上，仅本地使用
