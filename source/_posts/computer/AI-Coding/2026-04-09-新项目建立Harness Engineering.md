---
layout: post
title: 新项目建立 Harness Engineering
date: 2026-04-09
categories:
    - Computer
tags:
    - AI
    - AI Coding
    - Harness Engineering
---

上一篇聊了如何在已有项目中引入 Harness Engineering，那是一个"改造"的过程——你已经有了代码，agent 可以读代码理解项目，然后逐步建立规范。但新项目不一样，文件夹里什么都没有，agent 没有任何上下文可以参考。

所以新项目的 Harness Engineering 需要一种不同的思路：**你只需要准备两样东西，agent 就能帮你把整个工程体系从零搭建起来。**

# 只需要两个文件

新项目的 Harness Engineering 极度简化，核心就是两个 markdown 文件：

1. **`blueprint.md`**: 项目蓝图。由你提供，描述你要做什么项目。如果你还没想清楚，agent 会通过提问帮你梳理并生成这份文档
2. **`harness.md`**: 施工手册。一份固定的指导文档，告诉 agent 如何基于蓝图来初始化整个 Harness Engineering 体系

有了这两个文件之后，你只需要一条指令：

```
claude > 请根据 harness.md 帮我初始化项目
```

agent 会按照 `harness.md` 中定义的步骤，结合 `blueprint.md` 中的项目信息，自动完成所有初始化工作。

# 实际操作流程

## 1. 创建项目目录

```bash
mkdir my-project && cd my-project
git init
```

## 2. 放入 harness.md

把下文给出的 `harness.md` 复制到项目根目录。这个文件是通用的，所有新项目都可以用同一份。

## 3. 放入 blueprint.md（如果你有的话）

如果你已经想好了项目的大致方向，把你的蓝图文档放到项目根目录下，命名为 `blueprint.md`。这份文档不需要多正式，但至少应该包含：

- **项目目标**：做什么？解决什么问题？
- **用户与场景**：谁用？什么场景？
- **核心功能**：最重要的 3-5 个功能模块
- **技术选型**：语言 / 框架 / 部署方式等偏好
- **非功能需求**：性能、安全、可扩展性等（如果有的话）

## 4. 启动 agent

```bash
claude-internal
```

```
claude > 请根据 harness.md 帮我初始化项目
```

然后就等着 agent 干活了。如果你没有放 `blueprint.md`，agent 会先进入"访谈模式"向你提问，帮你梳理项目思路并生成蓝图，然后再继续后面的初始化流程。

## 5. 审视与微调

agent 完成之后，你需要审视以下产物：

- `CLAUDE.md` — 项目规范是否符合你的预期
- `docs/specs/` 下的 spec 文件 — 拆分粒度是否合理，依赖关系是否正确
- `.claude/commands/` 下的命令 — 流程是否符合你的习惯
- `.claude/settings.json` 中的 hooks — 强制约束是否合理

根据需要做微调，然后就可以开始第一个 spec 的开发了：

```
claude > /design 请阅读 docs/specs/001-xxx.md，进行需求分析与设计
```

# harness.md 的完整内容

下面是 `harness.md` 的完整内容。你可以直接复制使用，也可以根据自己的偏好进行调整。

```markdown
# Harness Engineering 初始化指南

本文档用于指导 agent 为一个全新项目建立完整的 Harness Engineering 体系。

## 前置条件

在开始之前，检查项目根目录下是否存在 `blueprint.md` 文件。

### 如果 blueprint.md 不存在

以资深技术顾问的身份，通过多轮提问帮助用户梳理项目思路。需要明确以下信息：

1. 项目目标：做什么产品？解决什么问题？
2. 用户与场景：目标用户是谁？核心使用场景是什么？
3. 核心功能：最重要的 3-5 个功能模块是什么？
4. 技术选型：语言、框架、数据库、部署方式等偏好或约束
5. 非功能需求：性能、安全性、可扩展性等方面的特殊要求

每次只问 1-2 个问题，避免一次性抛出大量问题。根据用户的回答进行追问和细化。
当信息足够后，生成 `blueprint.md` 保存到项目根目录，并请用户确认。

### 如果 blueprint.md 已存在

阅读并理解其内容，然后进入下面的初始化流程。

---

## 初始化流程

按以下顺序依次执行：

### 第一步：初始化目录结构

创建以下目录：

- `.claude/docs/decisions/` — 技术决策记录
- `.claude/commands/` — 自定义命令
- `.claude/rules/` — 规则文件
- `docs/specs/` — 需求规格文档

### 第二步：生成 CLAUDE.md

基于 `blueprint.md` 生成项目根目录下的 `CLAUDE.md`，包含：

- 项目简介（一段话概述项目目标）
- 技术栈（语言、框架、核心依赖）
- 目录结构约定
- 代码风格与命名规范（基于技术栈的最佳实践）
- Git 工作流（分支策略、commit message 格式）
- 开发流程（使用 /design → /feature 的标准流程）
- 测试规范（单测覆盖要求、测试文件组织方式）

### 第三步：生成架构文档

基于 `blueprint.md` 和 `CLAUDE.md`，生成 `.claude/docs/architecture.md`，包含：

- 系统整体架构描述
- 核心模块划分及职责
- 模块间依赖关系
- 数据流向
- 关键技术决策及理由（同步记录到 `.claude/docs/decisions/`）

### 第四步：拆解 Spec

基于 `blueprint.md` 中的核心功能列表，将功能拆解为独立的 spec 文件，
输出到 `docs/specs/` 目录下。每个 spec 包含：

- 功能描述
- 用户故事（As a ... I want ... So that ...）
- 验收标准（可测试的具体条件）
- 技术要点
- 依赖关系（依赖哪些其他 spec，用文件名引用）
- 预估复杂度（S / M / L）
- 状态：draft

spec 文件命名格式：`NNN-简短描述.md`（如 `001-user-auth.md`）。

拆解完成后，在 `docs/specs/` 下生成一个 `README.md`，汇总所有 spec 的概览、
依赖关系和建议的开发顺序。

### 第五步：生成 Commands

在 `.claude/commands/` 下生成以下命令：

**design.md** — 需求分析与设计
- 输入：需求描述或 spec 文件路径
- 流程：理解需求 → 技术方案设计 → 接口设计 → 输出设计文档
- 输出：设计文档保存到 `docs/designs/`

**feature.md** — 功能实现
- 输入：设计文档路径
- 流程：确认 spec 存在且状态正确 → 技术方案细化 → 编写测试 → 实现代码 → 
  通过测试 → 更新 spec 状态 → 归档
- 要求：实现前必须先写测试，实现后测试必须全部通过

**fix.md** — 问题修复
- 输入：问题描述
- 流程：问题分析与定位 → 编写复现测试 → 修复 → 验证测试通过 → 归档

**debt.md** — 代码债务处理
- 输入：债务描述或自动扫描
- 流程：债务识别 → 影响分析 → 重构方案 → 实现 → 确保测试通过 → 归档

**review.md** — 代码审查
- 输入：文件路径或变更范围
- 流程：代码风格检查 → 逻辑审查 → 安全审查 → 性能审查 → 输出审查报告

### 第六步：配置 Hooks

在 `.claude/settings.json` 中配置以下 hooks：

1. **pre-commit hook**：
   - 运行 linter 检查
   - 检查是否包含敏感信息（API key、密码、token 等硬编码）
   - 验证 commit message 格式

2. **post-edit hook**（可选，视技术栈决定）：
   - 自动格式化修改的文件

### 第七步：初始化项目骨架

基于 `architecture.md` 和技术选型，生成项目的初始骨架：

- 按照目录结构约定创建目录
- 生成依赖管理文件（package.json / requirements.txt / go.mod 等）
- 生成基础配置文件（linter、formatter、tsconfig 等，视技术栈而定）
- 生成一个最小的可运行示例（验证技术栈可以跑通）
- 生成 `.gitignore`

### 完成

初始化完成后，向用户汇报：

1. 生成了哪些文件和目录
2. 拆解出了多少个 spec，建议的开发顺序是什么
3. 提示用户审视以上产物并做微调
4. 提示用户可以通过 `/design` + `/feature` 开始第一个 spec 的开发
```

# harness.md 的设计考量

几个值得说明的设计决定：

## 为什么是一个 md 文件而不是 command

Command 是开发过程中反复使用的操作原语（`/design`、`/feature`），而项目初始化只做一次。把它做成一个独立的 markdown 文件更合适——它是一份"施工手册"，agent 照着执行就行，执行完可以归档甚至删除。

## 为什么蓝图要单独一个文件

`harness.md` 是通用的，所有项目都可以用同一份。`blueprint.md` 是项目特定的，每个项目不同。把两者分开意味着你可以积累和迭代自己的 `harness.md` 模板，而每次只需要写新的蓝图。

## 为什么蓝图可以由 agent 生成

很多时候你启动一个新项目的时候，脑中只有一个模糊的想法。强制要求"先写好蓝图再开始"会造成不必要的阻力。让 agent 通过提问帮你梳理，降低了启动门槛——你只需要回答问题，agent 帮你把答案组织成文档。

## 为什么不一步到位生成所有东西

`harness.md` 的流程是分步的，每一步都基于前一步的产出。这样做的好处是 agent 在每一步都有充分的上下文，而不是试图一口气理解所有需求然后一次性吐出所有文件——那样质量会很差。

# 小结

新项目的 Harness Engineering 体系只需要两个文件：

- **`blueprint.md`**：你要做什么（项目蓝图）。你写，或者 agent 帮你问出来
- **`harness.md`**：怎么做（施工手册）。通用模板，一条指令启动

一条命令 `请根据 harness.md 帮我初始化项目`，agent 会按照施工手册的步骤，基于你的蓝图，依次生成 CLAUDE.md、架构文档、spec 拆解、开发命令、hooks 和项目骨架。你只需要在最后审视和微调产物，然后就可以进入 `/design` → `/feature` 的标准开发循环了。
