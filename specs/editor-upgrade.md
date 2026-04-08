# ConceptGraph Editor 升级：从工具到集成编辑器

## 背景

当前 `editor.html` 是一个独立的单页工具，基本工作流是「打开本地 JSON → 编辑 → 导出下载 JSON → 手动覆盖原文件」。这个流程对于频繁编辑 9 张图来说效率低下，且缺乏节点样式自定义能力。

本 spec 将编辑器从一个简易工具升级为**项目集成编辑环境**，具备：图文件浏览、原地保存、矩形尺寸手动调整、节点样式定制（含预设调色盘）、以及一键启动命令。

## 设计目标

| 目标 | 说明 |
|------|------|
| **图列表直选** | 左侧面板列出 `source/assets/data/graphs/` 下所有 JSON 文件，点击即加载编辑 |
| **原地保存** | Ctrl/⌘+S 直接写回原文件，不再需要下载→覆盖的流程 |
| **形状尺寸可调** | rect 节点支持拖拽调整宽高（`rectWidth`/`rectHeight`），circle 节点支持拖拽调整半径（`radius`）。调整后尺寸固化到节点数据中，后续力导图布局会使用新尺寸 |
| **节点样式** | 支持自定义边框颜色、填充颜色；提供预设风格调色盘快速选择 |
| **一键启动** | 增加 npm script 命令，一键启动编辑器 |

## 架构方案

### 整体思路

编辑器从「纯前端单页」变为「本地开发服务器 + 前端编辑器」双层架构：

```
┌──────────────────────────────────┐
│     浏览器：editor.html          │
│     ↕ fetch API                  │
├──────────────────────────────────┤
│     本地服务器：editor-server.js  │
│     - GET  /api/graphs           │  → 列出所有图文件
│     - GET  /api/graphs/:name     │  → 读取指定图 JSON
│     - PUT  /api/graphs/:name     │  → 保存（写回文件）
│     - 静态文件服务                │  → 托管 editor.html 等
└──────────────────────────────────┘
```

#### 为什么不继续用纯前端？

浏览器出于安全限制无法直接写入本地文件系统。要实现「点保存就写回原文件」，必须有一个本地服务进程。方案选择轻量 Node.js 脚本（项目已有 Node.js 环境），零依赖（仅用 `node:http` + `node:fs`），不引入任何第三方包。

### 文件结构变更

```
source/assets/lib/concept-graph/
├── concept-graph.js              # 不变
├── concept-graph.css             # 不变
├── concept-graph-loader.js       # 不变
├── editor.html                   # 改造：新增左侧图列表面板、样式面板、矩形 resize
└── editor-server.js              # 新增：本地开发服务器（零依赖 Node.js）

package.json                      # 新增 script: "editor"
```

## 详细设计

### 1. 左侧图列表面板

#### UI 布局变更

当前布局为「Canvas + 右侧属性面板」二栏。升级后变为三栏：

```
┌──────────────────────────────────────────────────────────────────────┐
│  [💾 保存] [新建]  |  布局: [▶ 力导图] [⏹ 固化] [↺ 重置]  | ...    │
├─────────┬───────────────────────────────────────────┬────────────────┤
│ 图列表   │                                           │  节点/边属性   │
│          │         SVG 编辑画布                       │               │
│ ─────── │                                           │  节点样式      │
│ 集合·映射│                                           │  - 填充颜色    │
│ 等价关系 │                                           │  - 边框颜色    │
│ 群结构   │                                           │  - 预设风格    │
│ 子群·陪集│                                           │               │
│ 循环群   │                                           │  矩形尺寸      │
│ 置换群   │                                           │  - 宽度        │
│ 理想·商环│                                           │  - 高度        │
│ 域扩张   │                                           │               │
│ 伽罗瓦   │                                           │  节点列表      │
│          │                                           │               │
│ ─────── │                                           │               │
│ [+ 新建] │                                           │               │
├─────────┴───────────────────────────────────────────┴────────────────┤
│  状态栏: 模式: 手动精调 | 节点: 17 (📌3) | 边: 22 | ● 已保存       │
└──────────────────────────────────────────────────────────────────────┘
```

#### 图列表行为

- **数据来源**：通过 `GET /api/graphs` 从服务端获取 `source/assets/data/graphs/*.json` 文件列表
- **列表项展示**：显示图的 `title`（从 JSON 中读取），文件名作为副标题
- **点击加载**：点击列表项 → `GET /api/graphs/:name` → 加载到编辑画布
- **当前选中态**：高亮当前正在编辑的图
- **脏标记**：如果当前图有未保存的修改，在列表项旁显示 `●` 标记
- **切换确认**：如果当前图未保存，切换时弹出确认提示「当前图有未保存的修改，是否丢弃？」
- **新建图**：列表底部 `[+ 新建图]` 按钮，创建空白图并自动命名为 `new-graph.json`（如已存在则递增 `new-graph-2.json`）

#### CSS

左侧面板宽度 `200px`，可通过拖拽分割线调整（可选，初版不做）。

### 2. 保存功能

#### 替换导出为保存

- **工具栏**：`💾 导出` 按钮改为 `💾 保存`
- **快捷键**：`⌘S / Ctrl+S` 触发保存（原来是触发导出/下载）
- **保存逻辑**：
  1. 构建 clean JSON（同现有 `exportJSON()` 逻辑）
  2. `PUT /api/graphs/:name` 发送到服务端
  3. 服务端将 JSON 写入 `source/assets/data/graphs/:name`
  4. 成功后在状态栏显示「✓ 已保存」，3 秒后消失
  5. 清除脏标记

#### 新建图的保存

- 新建图首次保存时，弹出简单对话框输入文件名（不含 `.json` 后缀）
- 如果文件名已存在，提示是否覆盖

#### 保留导出能力（降级）

保存功能依赖服务端。为了编辑器在无服务端时也能使用（比如直接打开 `editor.html`），保留导出下载作为 fallback：
- 当检测不到服务端（`GET /api/graphs` 返回错误或超时），自动切换到纯前端模式
- 此时「保存」按钮变回「导出」，行为不变
- 左侧图列表显示为空，仍可通过「打开文件」按钮手动加载 JSON

### 3. 节点尺寸手动调整

#### 设计原则

节点尺寸一旦通过 resize 手柄或属性面板手动调整，就**固化到节点数据中**。后续无论是运行力导图布局还是手动拖拽位置，节点都保持新尺寸。如需恢复自动计算，可点击「自动尺寸」按钮清除手动值。

#### 矩形节点（rect）

数据格式扩展——新增可选字段 `rectWidth` 和 `rectHeight`：

```json
{
  "id": "set",
  "label": "集合",
  "group": "blue",
  "shape": "rect",
  "rectWidth": 120,
  "rectHeight": 50,
  "x": 400,
  "y": 60
}
```

- **不设置时**：使用当前自动计算逻辑（基于文字长度和 `nodeRadius`）
- **设置后**：使用指定尺寸，优先级高于自动计算

选中矩形节点后，在矩形四角和四边中点显示 8 个 resize 手柄：

```
  ■────────■────────■
  │                  │
  ■      rect        ■
  │                  │
  ■────────■────────■
```

- 拖拽手柄改变 `rectWidth` / `rectHeight`
- 最小尺寸限制：宽度 ≥ 60px，高度 ≥ 30px
- 拖拽时实时更新矩形显示
- 拖拽结束后推入 undo 栈
- 支持网格吸附（尺寸对齐到 GRID_SIZE 的倍数）

属性面板中，当 shape 为 `rect` 时显示：

```
  矩形宽度  [___120___]
  矩形高度  [____50___]
  [自动尺寸] ← 清除手动尺寸，恢复自动计算
```

#### 圆形节点（circle）

数据格式扩展——新增可选字段 `radius`（节点级别，覆盖全局 `options.nodeRadius`）：

```json
{
  "id": "group-theory",
  "label": "群论",
  "group": "blue",
  "shape": "circle",
  "radius": 45,
  "x": 300,
  "y": 200
}
```

- **不设置时**：使用全局 `options.nodeRadius`（默认 30）
- **设置后**：该节点使用自定义半径

选中圆形节点后，在圆的上、右、下、左显示 4 个 resize 手柄：

```
        ■
      ╱   ╲
    ■  circle  ■
      ╲   ╱
        ■
```

- 拖拽任一手柄等比缩放 `radius`
- 最小半径限制：15px
- 拖拽时实时更新圆形显示
- 拖拽结束后推入 undo 栈
- 支持网格吸附

属性面板中，当 shape 为 `circle` 时显示：

```
  半径  [___45___]
  [自动尺寸] ← 清除手动半径，恢复全局 nodeRadius
```

#### diamond 节点

diamond 节点暂不支持手动 resize（形状由 `radius` 决定大小，与 circle 共享 `radius` 字段）。如需调整大小，可在属性面板设置 `radius`。

### 4. 节点样式定制

#### 数据格式扩展

在节点 JSON 中新增可选样式字段：

```json
{
  "id": "set",
  "label": "集合",
  "group": "blue",
  "shape": "rect",
  "style": {
    "fill": "#E3F2FD",
    "stroke": "#1565C0",
    "strokeWidth": 2
  }
}
```

- **不设置 `style` 时**：使用 `group` 对应的默认颜色（现有行为不变）
- **设置 `style` 后**：自定义样式覆盖 group 默认值
  - `style.fill`：填充颜色
  - `style.stroke`：边框颜色
  - `style.strokeWidth`：边框粗细（可选，默认 2）

#### 预设风格调色盘

提供一组预设风格（preset themes），每个风格是一组 fill + stroke 配色。用户点击即可一键应用。

**预设风格列表**：

| 名称 | 填充色 | 边框色 | 视觉风格 |
|------|--------|--------|---------|
| **Default** | `#f0f0f0` | `#999` | 当前默认灰度风格 |
| **Ocean** | `#E3F2FD` | `#1565C0` | 蓝色系 |
| **Forest** | `#E8F5E9` | `#2E7D32` | 绿色系 |
| **Sunset** | `#FFF3E0` | `#E65100` | 橙色系 |
| **Lavender** | `#F3E5F5` | `#7B1FA2` | 紫色系 |
| **Rose** | `#FCE4EC` | `#C62828` | 红/玫瑰色系 |
| **Slate** | `#ECEFF1` | `#37474F` | 深灰/石板色系 |
| **Sand** | `#FFF8E1` | `#F57F17` | 暖黄色系 |
| **Mint** | `#E0F2F1` | `#00695C` | 薄荷/青色系 |
| **Charcoal** | `#E0E0E0` | `#212121` | 深色对比风格 |

#### UI 设计

在右侧属性面板的「节点属性」section 中新增「样式」区域：

```
  节点样式 ─────────────
  
  填充颜色  [#E3F2FD] [🎨]     ← 文本输入 + 颜色选择器
  边框颜色  [#1565C0] [🎨]     ← 文本输入 + 颜色选择器
  边框粗细  [___2___]
  
  预设风格:
  ┌──────────────────────────┐
  │ 🔵 Ocean    🟢 Forest   │
  │ 🟠 Sunset   🟣 Lavender │
  │ 🔴 Rose     ⬛ Slate    │
  │ 🟡 Sand     🟢 Mint     │
  │ ⬛ Charcoal  ○ Default  │
  └──────────────────────────┘
  
  [清除自定义] ← 移除 style，恢复 group 默认颜色
```

- 每个预设风格以色块形式展示（类似当前 group swatches 的样式）
- 色块用 fill 色作背景，stroke 色作边框
- 点击色块 → 设置节点的 `style.fill` 和 `style.stroke`
- 颜色选择器使用浏览器原生 `<input type="color">`

#### 渲染逻辑变更

渲染节点形状时，颜色取值优先级：

```
node.style.fill > GROUPS[node.group].fill
node.style.stroke > GROUPS[node.group].stroke
node.style.strokeWidth > 默认 2
```

#### concept-graph.js 同步

`concept-graph.js` 的 `renderStatic()` 也需要支持 `style` 字段，确保编辑器中设置的自定义样式在文章页面正确渲染。

### 5. 一键启动命令

#### npm script

在 `package.json` 中新增：

```json
{
  "scripts": {
    "editor": "node source/assets/lib/concept-graph/editor-server.js"
  }
}
```

执行 `npm run editor` 即可：
1. 启动本地服务器（默认端口 `6100`）
2. 自动打开浏览器访问 `http://localhost:6100/editor.html`
3. 终端显示启动信息

#### editor-server.js 设计

零依赖 Node.js HTTP 服务器，功能：

```js
// 启动端口
const PORT = process.env.EDITOR_PORT || 6100

// 静态文件托管根目录
const STATIC_ROOT = 'source/assets/lib/concept-graph/'

// 图数据目录
const GRAPHS_DIR = 'source/assets/data/graphs/'
```

**API 端点**：

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/graphs` | 返回 `[{ name: "set-mapping-operation.json", title: "集合·映射·运算" }, ...]` |
| `GET` | `/api/graphs/:name` | 返回指定 JSON 文件内容 |
| `PUT` | `/api/graphs/:name` | 写入 JSON 到文件，body 为完整 JSON |
| `GET` | `/*` | 静态文件服务（editor.html, d3.min.js 等） |

**安全措施**：
- `:name` 参数做路径安全检查（禁止 `..`、只允许 `.json` 后缀）
- 只允许访问 `source/assets/` 下的文件
- 仅监听 `localhost`

**启动交互**：

```
$ npm run editor

  ✦ ConceptGraph Editor
  ◇ Server running at http://localhost:6100
  ◇ Graphs directory: source/assets/data/graphs/ (9 files)
  ◇ Press Ctrl+C to stop
```

启动后自动用 `open`（macOS）/ `xdg-open`（Linux）/ `start`（Windows）打开浏览器。

## 数据格式变更汇总

扩展后的完整节点 JSON Schema：

```json
{
  "id": "set",
  "label": "集合",
  "group": "blue",
  "shape": "rect",
  "note": "$A \\subseteq B$",
  "x": 400,
  "y": 60,
  "radius": 45,            // 新增（可选）：圆形/菱形节点手动半径，覆盖全局 nodeRadius
  "rectWidth": 120,       // 新增（可选）：矩形手动宽度
  "rectHeight": 50,       // 新增（可选）：矩形手动高度
  "style": {              // 新增（可选）：自定义样式
    "fill": "#E3F2FD",
    "stroke": "#1565C0",
    "strokeWidth": 2
  }
}
```

**向后兼容**：所有新增字段均为可选，不影响现有 9 个 JSON 文件和 `concept-graph.js` 的已有渲染。

**尺寸固化行为**：通过 resize 手柄或属性面板手动调整的尺寸值会持久化到 JSON 中。后续力导图布局只影响节点位置，不会改变手动设定的尺寸。

## 实现计划

### Phase 1: 服务端基础设施

1. **实现 `editor-server.js`**
   - HTTP 服务器 + 静态文件服务
   - `GET /api/graphs` 列出图文件
   - `GET /api/graphs/:name` 读取图 JSON
   - `PUT /api/graphs/:name` 写入图 JSON
   - 自动打开浏览器
2. **添加 `npm run editor` 命令**

### Phase 2: 左侧图列表 + 保存

3. **editor.html 布局改为三栏**：左侧图列表 + 中间画布 + 右侧属性面板
4. **实现图列表**：从 API 加载列表、点击切换、脏标记、切换确认
5. **保存功能**：`PUT` 写回文件、状态栏反馈、纯前端 fallback

### Phase 3: 节点样式 + 预设调色盘

6. **数据格式支持 `style` 字段**：编辑器读取/写入
7. **属性面板增加样式区域**：填充颜色、边框颜色、颜色选择器
8. **预设风格调色盘**：10 种预设、色块点击应用
9. **concept-graph.js 同步**：`renderStatic()` 支持 `style` 字段

### Phase 4: 节点尺寸 Resize

10. **数据格式支持 `rectWidth` / `rectHeight` / `radius`**
11. **选中矩形时显示 8 个 resize 手柄**：拖拽调整宽高
12. **选中圆形时显示 4 个 resize 手柄**：拖拽等比调整半径
13. **属性面板尺寸输入**：矩形宽高输入框 / 圆形半径输入框 + 自动恢复按钮
14. **尺寸固化**：手动调整后的尺寸持久化到 JSON，力导图布局不会重置尺寸

## 文件变更汇总

```
新增：
  source/assets/lib/concept-graph/editor-server.js   # 本地开发服务器

修改：
  source/assets/lib/concept-graph/editor.html         # 三栏布局、图列表、保存、样式、resize
  source/assets/lib/concept-graph/concept-graph.js    # 支持 style / rectWidth / rectHeight
  package.json                                         # 新增 "editor" script
```

## 注意事项

- **editor-server.js 是纯开发工具**：不部署到线上，只在本地开发时使用
- **零依赖**：服务器只用 Node.js 内置模块（`http`, `fs`, `path`），不需要 `npm install` 任何新包
- **向后兼容**：所有新增字段可选，现有 JSON 文件和渲染器无需修改即可继续工作
- **纯前端降级**：当无服务端时，编辑器仍可以通过「打开文件」+ 「导出」方式使用
- **MathJax 兼容**：样式变更不影响 TeX 公式渲染
- **concept-graph.js 改动最小化**：只在颜色取值逻辑和矩形尺寸计算处增加 `style` / `rectWidth` / `rectHeight` 的判断
