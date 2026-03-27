/**
 * ConceptGraph - 基于 D3.js 的有向力导图概念图库
 *
 * 用法：
 *   const graph = new ConceptGraph('#container', { width: 800, height: 500 })
 *   graph.addNode({ id: 'set', label: '集合', group: 'blue' })
 *   graph.addNode({ id: 'map', label: '映射', group: 'orange' })
 *   graph.addEdge({ source: 'set', target: 'map', label: '定义在集合上' })
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
        // 力模拟参数
        chargeStrength: -400,
        linkDistance: 120,
        collideRadius: 50,
        // 节点
        nodeRadius: 28,
        // 颜色主题
        groups: {
          blue:   { fill: '#4a90d9', text: '#fff',  stroke: '#3a7bc8' },
          orange: { fill: '#e8913a', text: '#fff',  stroke: '#d07e2a' },
          green:  { fill: '#50b87a', text: '#fff',  stroke: '#40a06a' },
          purple: { fill: '#A48BBE', text: '#fff',  stroke: '#8a6eaa' },
          red:    { fill: '#e05555', text: '#fff',  stroke: '#c84040' },
          gray:   { fill: '#888',    text: '#fff',  stroke: '#666'    },
          pink:   { fill: '#B35588', text: '#fff',  stroke: '#993f6e' },
        },
        defaultGroup: 'blue',
        // 边的样式
        edgeColor: '#999',
        edgeDashArray: null, // 默认实线，可设 '5,3' 等
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
   * @param {string} node.label    - 显示文本（默认等于 id）
   * @param {string} [node.group]  - 颜色分组名（blue/orange/green/purple/red/gray/pink）
   * @param {string} [node.shape]  - 形状：'circle'（默认）| 'rect' | 'diamond'
   * @param {number} [node.radius] - 自定义半径 / 矩形半宽
   * @param {string} [node.note]   - 节点下方小字注释
   * @returns {ConceptGraph} this（可链式调用）
   */
  addNode(node) {
    if (!node || !node.id) throw new Error('addNode: id is required')
    if (this._nodeMap[node.id]) return this // 已存在则忽略
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
   * @param {Array} nodes
   * @returns {ConceptGraph}
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
   * @param {string} [edge.label] - 边上文字
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
   * @param {Array} edges
   * @returns {ConceptGraph}
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
    // 为每种边颜色创建一个 marker
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
          .distance(this.options.linkDistance)
      )
      .force('charge', d3.forceManyBody().strength(this.options.chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(this.options.collideRadius))

    // ---------- 边 ----------
    const edgeG = g.append('g').attr('class', 'cg-edges')

    const link = edgeG
      .selectAll('g')
      .data(this.edges)
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

    const linkLabel = link
      .append('text')
      .attr('class', 'cg-edge-label')
      .attr('text-anchor', 'middle')
      .attr('dy', -6)
      .text((d) => d.label)

    // ---------- 节点 ----------
    const nodeG = g.append('g').attr('class', 'cg-nodes')

    const node = nodeG
      .selectAll('g')
      .data(this.nodes)
      .join('g')
      .attr('class', 'cg-node')
      .call(this._drag(simulation))

    // 形状
    node.each((d, i, nodes) => {
      const el = d3.select(nodes[i])
      const colors = this.options.groups[d.group] || this.options.groups[this.options.defaultGroup]
      const r = d.radius || this.options.nodeRadius

      if (d.shape === 'rect') {
        // 根据文字估算宽度
        const textLen = (d.label || '').length
        const w = Math.max(r * 2, textLen * 14 + 16)
        const h = d.note ? r * 2 + 10 : r * 1.6
        el.append('rect')
          .attr('class', 'cg-node-shape')
          .attr('x', -w / 2)
          .attr('y', -h / 2)
          .attr('width', w)
          .attr('height', h)
          .attr('rx', 6)
          .attr('ry', 6)
          .attr('fill', colors.fill)
          .attr('stroke', colors.stroke)
          .attr('stroke-width', 2)
      } else if (d.shape === 'diamond') {
        const s = r * 1.4
        el.append('polygon')
          .attr('class', 'cg-node-shape')
          .attr('points', `0,${-s} ${s},0 0,${s} ${-s},0`)
          .attr('fill', colors.fill)
          .attr('stroke', colors.stroke)
          .attr('stroke-width', 2)
      } else {
        el.append('circle')
          .attr('class', 'cg-node-shape')
          .attr('r', r)
          .attr('fill', colors.fill)
          .attr('stroke', colors.stroke)
          .attr('stroke-width', 2)
      }
    })

    // 节点文字
    node
      .append('text')
      .attr('class', 'cg-node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => (d.note ? -4 : 4))
      .text((d) => d.label)

    // 节点注释
    node
      .filter((d) => d.note)
      .append('text')
      .attr('class', 'cg-node-note')
      .attr('text-anchor', 'middle')
      .attr('dy', 14)
      .text((d) => d.note)

    // ---------- Tick ----------
    simulation.on('tick', () => {
      linkLine.attr('d', (d) => {
        const dx = d.target.x - d.source.x
        const dy = d.target.y - d.source.y
        const dr = Math.sqrt(dx * dx + dy * dy) * 2 // 微弧度
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`
      })

      linkLabel.attr('transform', (d) => {
        const mx = (d.source.x + d.target.x) / 2
        const my = (d.source.y + d.target.y) / 2
        return `translate(${mx},${my})`
      })

      node.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    // 保存引用
    this._simulation = simulation
    this._g = g

    return this
  }

  /**
   * 销毁实例（清理 SVG）
   */
  destroy() {
    if (this._simulation) this._simulation.stop()
    this.svg.remove()
  }

  // ========== 内部方法 ==========

  _initSVG() {
    const { width, height } = this.options
    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('class', 'concept-graph-svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)

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
}
