/**
 * ConceptGraph - 基于 D3.js 的有向力导图概念图库（支持 TeX）
 *
 * TeX 支持：在 label / note 中用 $...$ 包裹 TeX 公式即可，
 * 例如 { label: '笛卡尔积', note: '$A \\times B$' }
 *
 * 需要页面已加载 MathJax（本博客全局启用）。
 *
 * 用法：
 *   const graph = new ConceptGraph('#container', { width: 800, height: 500 })
 *   graph.addNode({ id: 'set', label: '集合', group: 'blue' })
 *   graph.addNode({ id: 'product', label: '笛卡尔积', note: '$A \\times B$' })
 *   graph.addEdge({ source: 'set', target: 'product', label: '构造' })
 *   graph.render()
 */
class ConceptGraph {
  /**
   * @param {string|HTMLElement} container - CSS 选择器或 DOM 元素
   * @param {Object} options
   */
  constructor(container, options = {}) {
    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container

    this.options = Object.assign(
      {
        width: 800,
        height: 500,
        // 全宽模式：突破文章容器限制，撑满视口
        fullWidth: false,
        // 力模拟参数
        chargeStrength: -400,
        linkDistance: 120,
        collideRadius: 50,
        // 节点
        nodeRadius: 28,
        // 颜色主题 — Monochrome Geek: 黑白灰层次
        groups: {
          blue:   { fill: '#f0f0f0', text: '#1a1a1a', stroke: '#999' },
          orange: { fill: '#e8e8e8', text: '#1a1a1a', stroke: '#888' },
          green:  { fill: '#f5f5f5', text: '#1a1a1a', stroke: '#aaa' },
          purple: { fill: '#eaeaea', text: '#1a1a1a', stroke: '#999' },
          red:    { fill: '#e0e0e0', text: '#1a1a1a', stroke: '#888' },
          gray:   { fill: '#f2f2f2', text: '#1a1a1a', stroke: '#bbb' },
          pink:   { fill: '#ebebeb', text: '#1a1a1a', stroke: '#999' },
        },
        defaultGroup: 'blue',
        // 边的样式
        edgeColor: '#888',
        edgeDashArray: null,
        // 是否可缩放拖拽
        zoomable: true,
      },
      options
    )

    this.nodes = []
    this.edges = []
    this._nodeMap = {}
    this._edgeSet = new Set()

    this._initSVG()
  }

  // ========== 公开 API ==========

  /**
   * 添加节点
   * @param {Object} node
   * @param {string} node.id       - 唯一标识（必须）
   * @param {string} node.label    - 显示文本，支持 $...$ TeX（默认等于 id）
   * @param {string} [node.group]  - 颜色分组名
   * @param {string} [node.shape]  - 形状：'circle'（默认）| 'rect' | 'diamond'
   * @param {number} [node.radius] - 自定义半径 / 矩形半宽
   * @param {string} [node.note]   - 节点下方小字注释，支持 $...$ TeX
   * @returns {ConceptGraph} this
   */
  addNode(node) {
    if (!node || !node.id) throw new Error('addNode: id is required')
    if (this._nodeMap[node.id]) return this
    const n = Object.assign(
      {
        label: node.id,
        group: this.options.defaultGroup,
        shape: 'circle',
        radius: null,
        note: null,
      },
      node
    )
    this.nodes.push(n)
    this._nodeMap[n.id] = n
    return this
  }

  /**
   * 批量添加节点
   */
  addNodes(nodes) {
    nodes.forEach((n) => this.addNode(n))
    return this
  }

  /**
   * 添加有向边
   * @param {Object} edge
   * @param {string} edge.source  - 起点节点 id
   * @param {string} edge.target  - 终点节点 id
   * @param {string} [edge.label] - 边上文字，支持 $...$ TeX
   * @param {string} [edge.style] - 'solid'（默认）| 'dashed' | 'dotted'
   * @param {string} [edge.color] - 自定义颜色
   * @returns {ConceptGraph}
   */
  addEdge(edge) {
    if (!edge || !edge.source || !edge.target)
      throw new Error('addEdge: source and target are required')
    const key = `${edge.source}->${edge.target}`
    if (this._edgeSet.has(key)) return this
    this._edgeSet.add(key)
    const e = Object.assign(
      {
        label: '',
        style: 'solid',
        color: null,
      },
      edge
    )
    this.edges.push(e)
    return this
  }

  /**
   * 批量添加边
   */
  addEdges(edges) {
    edges.forEach((e) => this.addEdge(e))
    return this
  }

  /**
   * 渲染图形（必须在添加完节点/边后调用）
   */
  render() {
    const { width, height } = this.options

    // ---------- 自动生成说明节点 + 透明连边 ----------
    this._generateNoteNodes()

    // 清除旧内容
    this.svg.selectAll('g.graph-content').remove()

    // 构建主容器（用于 zoom）
    const g = this.svg.append('g').attr('class', 'graph-content')

    if (this.options.zoomable) {
      const zoom = d3
        .zoom()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => {
          g.attr('transform', event.transform)
        })
      this.svg.call(zoom)
    }

    // ---------- 箭头 marker ----------
    const defs = this.svg.select('defs')
    const markerColors = new Set()
    markerColors.add(this.options.edgeColor)
    this.edges.forEach((e) => {
      if (e.color) markerColors.add(e.color)
    })
    markerColors.forEach((color) => {
      const markerId = 'arrow-' + color.replace('#', '')
      defs
        .append('marker')
        .attr('id', markerId)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color)
    })

    // ---------- 力模拟 ----------
    const simulation = d3
      .forceSimulation(this.nodes)
      .force(
        'link',
        d3
          .forceLink(this.edges)
          .id((d) => d.id)
          .distance((d) => {
            // 说明节点的连边距离更短，让说明紧贴节点
            if (d._noteLink) return 50
            return this.options.linkDistance
          })
      )
      .force('charge', d3.forceManyBody().strength((d) => {
        // 说明节点的斥力更弱，让它贴近父节点
        if (d._isNote) return this.options.chargeStrength * 0.15
        return this.options.chargeStrength
      }))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide((d) => {
        if (d._isNote) return 20
        return this.options.collideRadius
      }))

    // ---------- 边（分两层：透明说明边在底层，普通边在上面） ----------
    const edgeG = g.append('g').attr('class', 'cg-edges')

    // 普通边（非说明连边）
    const normalEdges = this.edges.filter((e) => !e._noteLink)
    const noteEdges = this.edges.filter((e) => e._noteLink)

    // 先画说明连边（底层，透明）
    const noteLink = edgeG
      .selectAll('g.cg-note-edge')
      .data(noteEdges)
      .join('g')
      .attr('class', 'cg-note-edge')

    const noteLinkLine = noteLink
      .append('line')
      .attr('class', 'cg-note-edge-line')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 0)

    // 再画普通边（上层）
    const link = edgeG
      .selectAll('g.cg-edge')
      .data(normalEdges)
      .join('g')
      .attr('class', 'cg-edge')

    const linkLine = link
      .append('path')
      .attr('class', 'cg-edge-line')
      .attr('fill', 'none')
      .attr('stroke', (d) => d.color || this.options.edgeColor)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', (d) => {
        if (d.style === 'dashed') return '6,4'
        if (d.style === 'dotted') return '2,3'
        return this.options.edgeDashArray
      })
      .attr('marker-end', (d) => {
        const c = d.color || this.options.edgeColor
        return `url(#arrow-${c.replace('#', '')})`
      })

    // 边标签：使用 foreignObject 以支持 TeX
    const linkLabel = link
      .append('foreignObject')
      .attr('class', 'cg-edge-label-fo')
      .attr('width', 120)
      .attr('height', 30)
      .attr('x', -60)
      .attr('y', -20)
      .append('xhtml:div')
      .attr('class', 'cg-edge-label')
      .html((d) => this._texToHTML(d.label, '#666'))

    // ---------- 节点 ----------
    const nodeG = g.append('g').attr('class', 'cg-nodes')

    // 分离：普通节点 vs 说明节点
    const normalNodes = this.nodes.filter((n) => !n._isNote)
    const noteNodes = this.nodes.filter((n) => n._isNote)

    // 渲染普通节点
    const node = nodeG
      .selectAll('g.cg-node')
      .data(normalNodes)
      .join('g')
      .attr('class', 'cg-node')
      .call(this._drag(simulation))

    // 形状（普通节点不再考虑 note 对尺寸的影响）
    node.each((d, i, nodes) => {
      const el = d3.select(nodes[i])
      const colors =
        this.options.groups[d.group] ||
        this.options.groups[this.options.defaultGroup]
      const r = d.radius || this.options.nodeRadius
      // style 字段覆盖 group 默认颜色
      const fill = (d.style && d.style.fill) || colors.fill
      const stroke = (d.style && d.style.stroke) || colors.stroke
      const sw = (d.style && d.style.strokeWidth) || 2

      if (d.shape === 'rect') {
        const textLen = (d.label || '').length
        const noteLen = d.note ? d.note.replace(/\$[^$]*\$/g, '@@').length : 0
        const contentLen = Math.max(textLen, noteLen)
        // rectWidth/rectHeight 覆盖自动计算尺寸
        const w = d.rectWidth || Math.max(r * 2, contentLen * 14 + 48)
        const hasNote = !!d.note
        const h = d.rectHeight || (hasNote ? r * 2.0 : r * 1.4)
        el.append('rect')
          .attr('class', 'cg-node-shape')
          .attr('x', -w / 2)
          .attr('y', -h / 2)
          .attr('width', w)
          .attr('height', h)
          .attr('rx', 6)
          .attr('ry', 6)
          .attr('fill', fill)
          .attr('stroke', stroke)
          .attr('stroke-width', sw)
      } else if (d.shape === 'diamond') {
        const s = r * 1.4
        el.append('polygon')
          .attr('class', 'cg-node-shape')
          .attr('points', `0,${-s} ${s},0 0,${s} ${-s},0`)
          .attr('fill', fill)
          .attr('stroke', stroke)
          .attr('stroke-width', sw)
      } else {
        el.append('circle')
          .attr('class', 'cg-node-shape')
          .attr('r', r)
          .attr('fill', fill)
          .attr('stroke', stroke)
          .attr('stroke-width', sw)
      }
    })

    // 普通节点标签（矩形节点含 note 时在内部显示）
    node.each((d, i, nodes) => {
      const el = d3.select(nodes[i])
      const colors =
        this.options.groups[d.group] ||
        this.options.groups[this.options.defaultGroup]
      const r = d.radius || this.options.nodeRadius

      const hasNote = d.shape === 'rect' && !!d.note
      const noteLen = d.note ? d.note.replace(/\$[^$]*\$/g, '@@').length : 0
      const autoW = Math.max(r * 2, Math.max((d.label || '').length, noteLen) * 14 + 48)
      const foW = d.shape === 'rect'
        ? (d.rectWidth || autoW) + 20
        : r * 2 + 40
      const autoH = hasNote ? r * 2.0 : (d.shape === 'rect' ? r * 1.4 : r * 1.6)
      const foH = (d.shape === 'rect' ? (d.rectHeight || autoH) : autoH) + 10

      const fo = el
        .append('foreignObject')
        .attr('class', 'cg-node-fo')
        .attr('width', foW)
        .attr('height', foH)
        .attr('x', -foW / 2)
        .attr('y', -foH / 2)

      const wrapper = fo
        .append('xhtml:div')
        .attr('class', 'cg-node-content')

      wrapper
        .append('xhtml:div')
        .attr('class', 'cg-node-label')
        .style('color', colors.text)
        .html(this._texToHTML(d.label, colors.text))

      // 矩形节点内部显示 note
      if (hasNote) {
        wrapper
          .append('xhtml:div')
          .attr('class', 'cg-node-note-inline')
          .style('color', colors.text)
          .html(this._texToHTML(d.note, colors.text))
      }
    })

    // ---------- 说明节点 ----------
    const noteNode = nodeG
      .selectAll('g.cg-note-node')
      .data(noteNodes)
      .join('g')
      .attr('class', 'cg-note-node')
      .call(this._drag(simulation))

    // 说明节点只有文字，无形状
    noteNode.each((d, i, nodes) => {
      const el = d3.select(nodes[i])
      const parentNode = this._nodeMap[d._parentId]
      const colors =
        this.options.groups[(parentNode && parentNode.group) || this.options.defaultGroup] ||
        this.options.groups[this.options.defaultGroup]

      const foW = 160
      const foH = 30

      const fo = el
        .append('foreignObject')
        .attr('class', 'cg-note-fo')
        .attr('width', foW)
        .attr('height', foH)
        .attr('x', -foW / 2)
        .attr('y', -foH / 2)

      fo.append('xhtml:div')
        .attr('class', 'cg-note-label')
        .style('color', colors.text)
        .html(this._texToHTML(d.label, colors.text))
    })

    // ---------- Tick ----------
    simulation.on('tick', () => {
      linkLine.attr('d', (d) => {
        const dx = d.target.x - d.source.x
        const dy = d.target.y - d.source.y
        const dr = Math.sqrt(dx * dx + dy * dy) * 2
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`
      })

      // 更新普通边标签位置
      link.selectAll('.cg-edge-label-fo').attr('transform', (d) => {
        const mx = (d.source.x + d.target.x) / 2
        const my = (d.source.y + d.target.y) / 2
        return `translate(${mx},${my})`
      })

      // 更新说明连边位置（虽然透明，但力导图需要）
      noteLinkLine
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)

      node.attr('transform', (d) => `translate(${d.x},${d.y})`)
      noteNode.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    // 保存引用
    this._simulation = simulation
    this._g = g

    // 触发 MathJax 渲染
    this._typesetMath()

    return this
  }

  /**
   * 销毁实例
   */
  destroy() {
    if (this._simulation) this._simulation.stop()
    this.svg.remove()
  }

  // ========== 内部方法 ==========

  /**
   * 检测文本是否含 TeX（$...$），返回 HTML 字符串
   * @param {string} text - 原始文本
   * @param {string} color - 文字颜色
   * @param {boolean} isNote - 是否为注释（小字）
   */
  _texToHTML(text, color, isNote) {
    if (!text) return ''
    // 将 $...$ 包裹的内容转换为 \(...\) 让 MathJax inline 渲染
    const html = text.replace(/\$(.+?)\$/g, '\\($1\\)')
    return html
  }

  /**
   * 将带 note 的节点自动拆分为：原节点（无 note）+ 说明节点 + 透明连边
   * 仅在 render() 中调用一次
   */
  _generateNoteNodes() {
    // 避免重复生成
    if (this._noteGenerated) return
    this._noteGenerated = true

    const noteNodesToAdd = []
    const noteEdgesToAdd = []

    this.nodes.forEach((n) => {
      if (!n.note) return
      // 矩形节点的 note 直接显示在矩形内部，不生成独立说明节点
      if (n.shape === 'rect') return

      const noteId = n.id + '__note'
      const noteNode = {
        id: noteId,
        label: n.note,
        group: n.group,
        shape: 'none',     // 特殊形状标记：无形状
        _isNote: true,      // 标记为说明节点
        _parentId: n.id,    // 关联的父节点 id
      }
      noteNodesToAdd.push(noteNode)

      const noteEdge = {
        source: n.id,
        target: noteId,
        label: '',
        style: 'solid',
        color: 'transparent',
        _noteLink: true,    // 标记为说明连边
      }
      noteEdgesToAdd.push(noteEdge)
    })

    // 加入节点和边数组
    noteNodesToAdd.forEach((n) => {
      this.nodes.push(n)
      this._nodeMap[n.id] = n
    })
    noteEdgesToAdd.forEach((e) => {
      this.edges.push(e)
    })
  }

  /**
   * 触发 MathJax 对 SVG 内 foreignObject 的公式渲染
   */
  _typesetMath() {
    const containerEl = this.container
    // MathJax v3
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise([containerEl]).catch(() => {})
    }
    // MathJax v2 fallback
    else if (window.MathJax && MathJax.Hub) {
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, containerEl])
    }
  }

  _initSVG() {
    const { width, height, fullWidth } = this.options

    if (fullWidth) {
      this.container.classList.add('concept-graph-fullwidth')
    }

    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('class', 'concept-graph-svg')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')

    if (fullWidth) {
      this.svg.attr('width', '100%')
    } else {
      this.svg.attr('width', width)
    }

    this.svg.append('defs')
  }

  _drag(simulation) {
    return d3
      .drag()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      })
  }

  // ========== 静态渲染（数据驱动，不启动力模拟） ==========

  /**
   * 使用预设坐标直接渲染图形（无力模拟）
   * 节点数据中必须包含 x, y 坐标
   */
  renderStatic() {
    // ---------- 自动生成说明节点 + 透明连边 ----------
    this._generateNoteNodes()

    // 为说明节点计算默认坐标（相对父节点偏移）
    this.nodes.forEach((n) => {
      if (n._isNote && (n.x == null || n.y == null)) {
        const parent = this._nodeMap[n._parentId]
        if (parent) {
          n.x = parent.x
          n.y = (parent.y || 0) + 50
        }
      }
    })

    // ---------- 自动计算 viewBox ----------
    const padding = 80
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    this.nodes.forEach((n) => {
      if (n.x != null && n.y != null) {
        const r = n.radius || this.options.nodeRadius || 30
        // 矩形节点用 rectWidth/rectHeight 计算边界
        const hw = n.shape === 'rect' && n.rectWidth ? n.rectWidth / 2 : r
        const hh = n.shape === 'rect' && n.rectHeight ? n.rectHeight / 2 : r
        minX = Math.min(minX, n.x - hw)
        minY = Math.min(minY, n.y - hh)
        maxX = Math.max(maxX, n.x + hw)
        maxY = Math.max(maxY, n.y + hh)
      }
    })
    minX -= padding; minY -= padding
    maxX += padding; maxY += padding
    const vw = maxX - minX
    const vh = maxY - minY

    // 更新 SVG viewBox
    this.svg
      .attr('viewBox', `${minX} ${minY} ${vw} ${vh}`)
      .attr('height', null)
      .style('aspect-ratio', `${vw} / ${vh}`)

    // 清除旧内容
    this.svg.selectAll('g.graph-content').remove()

    // 构建主容器
    const g = this.svg.append('g').attr('class', 'graph-content')

    if (this.options.zoomable) {
      const zoom = d3
        .zoom()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => {
          g.attr('transform', event.transform)
        })
      this.svg.call(zoom)
    }

    // ---------- 箭头 marker ----------
    const defs = this.svg.select('defs')
    const markerColors = new Set()
    markerColors.add(this.options.edgeColor)
    this.edges.forEach((e) => {
      if (e.color) markerColors.add(e.color)
    })
    markerColors.forEach((color) => {
      const markerId = 'arrow-' + color.replace('#', '')
      defs
        .append('marker')
        .attr('id', markerId)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color)
    })

    // ---------- 边 ----------
    const edgeG = g.append('g').attr('class', 'cg-edges')

    const normalEdges = this.edges.filter((e) => !e._noteLink)
    const noteEdges = this.edges.filter((e) => e._noteLink)

    // 说明连边（透明）
    edgeG
      .selectAll('g.cg-note-edge')
      .data(noteEdges)
      .join('g')
      .attr('class', 'cg-note-edge')
      .append('line')
      .attr('class', 'cg-note-edge-line')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 0)
      .attr('x1', (d) => this._nodeMap[d.source] ? this._nodeMap[d.source].x : 0)
      .attr('y1', (d) => this._nodeMap[d.source] ? this._nodeMap[d.source].y : 0)
      .attr('x2', (d) => this._nodeMap[d.target] ? this._nodeMap[d.target].x : 0)
      .attr('y2', (d) => this._nodeMap[d.target] ? this._nodeMap[d.target].y : 0)

    // 普通边
    const link = edgeG
      .selectAll('g.cg-edge')
      .data(normalEdges)
      .join('g')
      .attr('class', 'cg-edge')

    link
      .append('path')
      .attr('class', 'cg-edge-line')
      .attr('fill', 'none')
      .attr('stroke', (d) => d.color || this.options.edgeColor)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', (d) => {
        if (d.style === 'dashed') return '6,4'
        if (d.style === 'dotted') return '2,3'
        return this.options.edgeDashArray
      })
      .attr('marker-end', (d) => {
        const c = d.color || this.options.edgeColor
        return `url(#arrow-${c.replace('#', '')})`
      })
      .attr('d', (d) => {
        const src = this._nodeMap[d.source] || d.source
        const tgt = this._nodeMap[d.target] || d.target
        const dx = tgt.x - src.x
        const dy = tgt.y - src.y
        const dr = Math.sqrt(dx * dx + dy * dy) * 2
        return `M${src.x},${src.y}A${dr},${dr} 0 0,1 ${tgt.x},${tgt.y}`
      })

    // 边标签
    link
      .append('foreignObject')
      .attr('class', 'cg-edge-label-fo')
      .attr('width', 120)
      .attr('height', 30)
      .attr('x', -60)
      .attr('y', -20)
      .attr('transform', (d) => {
        const src = this._nodeMap[d.source] || d.source
        const tgt = this._nodeMap[d.target] || d.target
        const mx = (src.x + tgt.x) / 2
        const my = (src.y + tgt.y) / 2
        return `translate(${mx},${my})`
      })
      .append('xhtml:div')
      .attr('class', 'cg-edge-label')
      .html((d) => this._texToHTML(d.label, '#666'))

    // ---------- 节点 ----------
    const nodeG = g.append('g').attr('class', 'cg-nodes')

    const normalNodes = this.nodes.filter((n) => !n._isNote)
    const noteNodes = this.nodes.filter((n) => n._isNote)

    // 普通节点
    const node = nodeG
      .selectAll('g.cg-node')
      .data(normalNodes)
      .join('g')
      .attr('class', 'cg-node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)

    // 形状
    node.each((d, i, nodes) => {
      const el = d3.select(nodes[i])
      const colors =
        this.options.groups[d.group] ||
        this.options.groups[this.options.defaultGroup]
      const r = d.radius || this.options.nodeRadius
      // style 字段覆盖 group 默认颜色
      const fill = (d.style && d.style.fill) || colors.fill
      const stroke = (d.style && d.style.stroke) || colors.stroke
      const sw = (d.style && d.style.strokeWidth) || 2

      if (d.shape === 'rect') {
        const textLen = (d.label || '').length
        const noteLen = d.note ? d.note.replace(/\$[^$]*\$/g, '@@').length : 0
        const contentLen = Math.max(textLen, noteLen)
        // rectWidth/rectHeight 覆盖自动计算尺寸
        const w = d.rectWidth || Math.max(r * 2, contentLen * 14 + 48)
        const hasNote = !!d.note
        const h = d.rectHeight || (hasNote ? r * 2.0 : r * 1.4)
        el.append('rect')
          .attr('class', 'cg-node-shape')
          .attr('x', -w / 2)
          .attr('y', -h / 2)
          .attr('width', w)
          .attr('height', h)
          .attr('rx', 6)
          .attr('ry', 6)
          .attr('fill', fill)
          .attr('stroke', stroke)
          .attr('stroke-width', sw)
      } else if (d.shape === 'diamond') {
        const s = r * 1.4
        el.append('polygon')
          .attr('class', 'cg-node-shape')
          .attr('points', `0,${-s} ${s},0 0,${s} ${-s},0`)
          .attr('fill', fill)
          .attr('stroke', stroke)
          .attr('stroke-width', sw)
      } else {
        el.append('circle')
          .attr('class', 'cg-node-shape')
          .attr('r', r)
          .attr('fill', fill)
          .attr('stroke', stroke)
          .attr('stroke-width', sw)
      }
    })

    // 标签
    node.each((d, i, nodes) => {
      const el = d3.select(nodes[i])
      const colors =
        this.options.groups[d.group] ||
        this.options.groups[this.options.defaultGroup]
      const r = d.radius || this.options.nodeRadius

      const hasNote = d.shape === 'rect' && !!d.note
      const noteLen = d.note ? d.note.replace(/\$[^$]*\$/g, '@@').length : 0
      const autoW = Math.max(r * 2, Math.max((d.label || '').length, noteLen) * 14 + 48)
      const foW = d.shape === 'rect'
        ? (d.rectWidth || autoW) + 20
        : r * 2 + 40
      const autoH = hasNote ? r * 2.0 : (d.shape === 'rect' ? r * 1.4 : r * 1.6)
      const foH = (d.shape === 'rect' ? (d.rectHeight || autoH) : autoH) + 10

      const fo = el
        .append('foreignObject')
        .attr('class', 'cg-node-fo')
        .attr('width', foW)
        .attr('height', foH)
        .attr('x', -foW / 2)
        .attr('y', -foH / 2)

      const wrapper = fo
        .append('xhtml:div')
        .attr('class', 'cg-node-content')

      wrapper
        .append('xhtml:div')
        .attr('class', 'cg-node-label')
        .style('color', colors.text)
        .html(this._texToHTML(d.label, colors.text))

      if (hasNote) {
        wrapper
          .append('xhtml:div')
          .attr('class', 'cg-node-note-inline')
          .style('color', colors.text)
          .html(this._texToHTML(d.note, colors.text))
      }
    })

    // 说明节点
    const noteNode = nodeG
      .selectAll('g.cg-note-node')
      .data(noteNodes)
      .join('g')
      .attr('class', 'cg-note-node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)

    noteNode.each((d, i, nodes) => {
      const el = d3.select(nodes[i])
      const parentNode = this._nodeMap[d._parentId]
      const colors =
        this.options.groups[(parentNode && parentNode.group) || this.options.defaultGroup] ||
        this.options.groups[this.options.defaultGroup]

      const foW = 160
      const foH = 30

      const fo = el
        .append('foreignObject')
        .attr('class', 'cg-note-fo')
        .attr('width', foW)
        .attr('height', foH)
        .attr('x', -foW / 2)
        .attr('y', -foH / 2)

      fo.append('xhtml:div')
        .attr('class', 'cg-note-label')
        .style('color', colors.text)
        .html(this._texToHTML(d.label, colors.text))
    })

    // 保存引用
    this._g = g

    // 触发 MathJax 渲染
    this._typesetMath()

    return this
  }

  // ========== 静态工厂方法 ==========

  /**
   * 从 JSON 数据对象直接渲染图形（静态模式）
   * @param {string|HTMLElement} container - CSS 选择器或 DOM 元素
   * @param {Object} data - JSON 数据 { title, options, nodes, edges }
   * @returns {ConceptGraph}
   */
  static fromData(container, data) {
    const options = Object.assign({}, data.options || {})
    // 静态模式不需要固定 width/height，由 viewBox 自动适配
    if (!options.width) options.width = 800
    if (!options.height) options.height = 600

    const graph = new ConceptGraph(container, options)
    graph.addNodes(data.nodes || [])
    graph.addEdges(data.edges || [])
    graph.renderStatic()
    return graph
  }

  /**
   * 从 URL 加载 JSON 并渲染图形（静态模式）
   * @param {string|HTMLElement} container - CSS 选择器或 DOM 元素
   * @param {string} url - JSON 文件 URL
   * @returns {Promise<ConceptGraph>}
   */
  static async load(container, url) {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`Failed to load graph data: ${url} (${resp.status})`)
    const data = await resp.json()
    return ConceptGraph.fromData(container, data)
  }
}
