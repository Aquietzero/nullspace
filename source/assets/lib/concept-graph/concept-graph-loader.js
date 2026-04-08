/**
 * ConceptGraph Loader - 全局自动加载器
 *
 * 扫描页面中所有 .concept-graph[data-src] 元素，
 * 自动加载 D3.js 和 concept-graph.js（如未加载），
 * 然后从 data-src 指定的 JSON 文件加载并渲染图形。
 *
 * 使用方式：在 NexT 主题的 postBodyEnd 或全局 JS 中引入本文件。
 * 文档中只需写：
 *   <div class="concept-graph" data-src="/assets/data/graphs/xxx.json"></div>
 */
;(function () {
  'use strict'

  const D3_CDN = 'https://d3js.org/d3.v7.min.js'
  const CG_JS = '/assets/lib/concept-graph/concept-graph.js'
  const CG_CSS = '/assets/lib/concept-graph/concept-graph.css'

  /**
   * 动态加载 <script>，返回 Promise
   */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      // 如果已存在则跳过
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve()
        return
      }
      const s = document.createElement('script')
      s.src = src
      s.onload = resolve
      s.onerror = () => reject(new Error(`Failed to load script: ${src}`))
      document.head.appendChild(s)
    })
  }

  /**
   * 动态加载 <link rel="stylesheet">
   */
  function loadCSS(href) {
    if (document.querySelector(`link[href="${href}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
  }

  /**
   * 初始化：检测页面中的 .concept-graph[data-src]，按需加载依赖并渲染
   */
  async function init() {
    const containers = document.querySelectorAll('.concept-graph[data-src]')
    if (containers.length === 0) return

    // 加载 CSS
    loadCSS(CG_CSS)

    // 按需加载 D3.js
    if (typeof d3 === 'undefined') {
      await loadScript(D3_CDN)
    }

    // 按需加载 concept-graph.js
    if (typeof ConceptGraph === 'undefined') {
      await loadScript(CG_JS)
    }

    // 逐个渲染
    containers.forEach(async (container) => {
      const src = container.getAttribute('data-src')
      if (!src) return

      try {
        await ConceptGraph.load(container, src)
      } catch (err) {
        console.error(`[ConceptGraph Loader] Failed to load graph: ${src}`, err)
        container.innerHTML = `<p style="color:#999;font-size:0.9em;">⚠ 概念图加载失败: ${src}</p>`
      }
    })
  }

  // DOM Ready 后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
