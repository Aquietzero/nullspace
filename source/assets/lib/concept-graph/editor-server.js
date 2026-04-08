#!/usr/bin/env node
/**
 * ConceptGraph Editor — 本地开发服务器
 *
 * 零依赖：仅用 Node.js 内置模块（http, fs, path）
 * 功能：
 *   GET  /api/graphs          列出所有图 JSON 文件
 *   GET  /api/graphs/:name    读取指定图 JSON
 *   PUT  /api/graphs/:name    保存（写回）图 JSON
 *   GET  /*                   静态文件服务
 *
 * 用法：npm run editor  或  node source/assets/lib/concept-graph/editor-server.js
 */

const http = require('http')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

// ---- 配置 ----
const PORT = parseInt(process.env.EDITOR_PORT, 10) || 6100
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const STATIC_ROOT = path.join(PROJECT_ROOT, 'source', 'assets', 'lib', 'concept-graph')
const GRAPHS_DIR = path.join(PROJECT_ROOT, 'source', 'assets', 'data', 'graphs')

// MIME 类型
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
}

// ---- 工具函数 ----

function sendJSON(res, status, data) {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
  })
  res.end(body)
}

function send404(res, msg) {
  sendJSON(res, 404, { error: msg || 'Not Found' })
}

function send400(res, msg) {
  sendJSON(res, 400, { error: msg || 'Bad Request' })
}

function send500(res, msg) {
  sendJSON(res, 500, { error: msg || 'Internal Server Error' })
}

/** 安全校验文件名：只允许字母、数字、连字符、下划线，且以 .json 结尾 */
function isValidGraphName(name) {
  return /^[a-zA-Z0-9_-]+\.json$/.test(name) && !name.includes('..')
}

/** 收集请求 body */
function collectBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

// ---- API 路由 ----

async function handleAPI(req, res, pathname) {
  // GET /api/graphs — 列出所有图文件
  if (pathname === '/api/graphs' && req.method === 'GET') {
    try {
      const files = fs.readdirSync(GRAPHS_DIR).filter(f => f.endsWith('.json')).sort()
      const list = files.map(f => {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(GRAPHS_DIR, f), 'utf-8'))
          return { name: f, title: content.title || f.replace('.json', '') }
        } catch {
          return { name: f, title: f.replace('.json', '') }
        }
      })
      sendJSON(res, 200, list)
    } catch (err) {
      send500(res, 'Failed to list graphs: ' + err.message)
    }
    return
  }

  // GET /api/graphs/:name — 读取指定图
  const getMatch = pathname.match(/^\/api\/graphs\/([^/]+)$/)
  if (getMatch && req.method === 'GET') {
    const name = decodeURIComponent(getMatch[1])
    if (!isValidGraphName(name)) return send400(res, 'Invalid graph name')
    const filePath = path.join(GRAPHS_DIR, name)
    if (!fs.existsSync(filePath)) return send404(res, 'Graph not found: ' + name)
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      })
      res.end(content)
    } catch (err) {
      send500(res, 'Failed to read graph: ' + err.message)
    }
    return
  }

  // PUT /api/graphs/:name — 保存图
  const putMatch = pathname.match(/^\/api\/graphs\/([^/]+)$/)
  if (putMatch && req.method === 'PUT') {
    const name = decodeURIComponent(putMatch[1])
    if (!isValidGraphName(name)) return send400(res, 'Invalid graph name')
    try {
      const body = await collectBody(req)
      // 验证是合法 JSON
      JSON.parse(body)
      const filePath = path.join(GRAPHS_DIR, name)
      fs.writeFileSync(filePath, body, 'utf-8')
      sendJSON(res, 200, { ok: true, name })
    } catch (err) {
      send400(res, 'Failed to save: ' + err.message)
    }
    return
  }

  // OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    res.end()
    return
  }

  send404(res, 'Unknown API endpoint')
}

// ---- 静态文件服务 ----

function serveStatic(req, res, pathname) {
  // 默认页面
  if (pathname === '/' || pathname === '') pathname = '/editor.html'

  const filePath = path.join(STATIC_ROOT, pathname)

  // 安全检查：确保在 STATIC_ROOT 内
  if (!filePath.startsWith(STATIC_ROOT)) {
    send404(res, 'Forbidden')
    return
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send404(res, 'File not found: ' + pathname)
    return
  }

  const ext = path.extname(filePath).toLowerCase()
  const mime = MIME[ext] || 'application/octet-stream'

  try {
    const content = fs.readFileSync(filePath)
    res.writeHead(200, { 'Content-Type': mime })
    res.end(content)
  } catch (err) {
    send500(res, 'Failed to serve file: ' + err.message)
  }
}

// ---- 启动服务器 ----

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const pathname = decodeURIComponent(url.pathname)

  if (pathname.startsWith('/api/')) {
    await handleAPI(req, res, pathname)
  } else {
    serveStatic(req, res, pathname)
  }
})

server.listen(PORT, '127.0.0.1', () => {
  // 统计图文件数量
  let graphCount = 0
  try {
    graphCount = fs.readdirSync(GRAPHS_DIR).filter(f => f.endsWith('.json')).length
  } catch {}

  console.log('')
  console.log('  ✦ ConceptGraph Editor')
  console.log(`  ◇ Server running at http://localhost:${PORT}`)
  console.log(`  ◇ Graphs directory: source/assets/data/graphs/ (${graphCount} files)`)
  console.log('  ◇ Press Ctrl+C to stop')
  console.log('')

  // 自动打开浏览器
  const url = `http://localhost:${PORT}`
  const platform = process.platform
  const cmd = platform === 'darwin' ? 'open' :
              platform === 'win32' ? 'start' : 'xdg-open'
  exec(`${cmd} ${url}`, () => {})
})
