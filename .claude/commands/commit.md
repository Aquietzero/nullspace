# /commit — 提交当前变动

整理当前工作区变动，生成规范的 commit message 并提交。

## 用法

```
/commit
/commit "可选的补充说明"
```

## 流程

### 1. 分析变动

并行执行以下命令了解当前状态：

```bash
git status
git diff --staged
git diff
git log --oneline -5
```

### 2. 生成 commit message

根据变动内容，按照本项目的提交风格起草 message：

- **格式**：`<type>: <简短描述>`
- **type 参考**：`feat` / `fix` / `test` / `refactor` / `chore` / `docs` / `style`
- **语言**：描述部分使用中文，type 使用英文
- **Body**（可选）：变动较多时，用简短 bullet points 列出关键改动

### 3. 暂存并提交

```bash
# 只 add 与本次改动相关的文件（不用 git add -A，避免误提交 .env 等）
git add <相关文件>

# 提交（message 通过 HEREDOC 传入保证格式）
git commit -m "$(cat <<'EOF'
<type>: <描述>

<body（如有）>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

### 4. 输出结果

显示：
- commit hash 和 message
- 变动文件列表
