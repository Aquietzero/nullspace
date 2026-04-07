/**
 * Graph2D - 基于 Canvas + HTML overlay 的 2D 坐标系绘图库（支持 TeX）
 *
 * TeX 支持：在 label 中用 $...$ 包裹 TeX 公式即可，
 * 需要页面已加载 MathJax（本博客全局启用）。
 *
 * 用法：
 *   const g = new Graph2D('#container', {
 *     width: 500, height: 500,
 *     xRange: [-2, 2], yRange: [-2, 2],
 *   })
 *   g.drawAxes()
 *   g.circle(0, 0, 1, { stroke: '#4a90d9' })
 *   g.point(1, 0, { label: '$1$' })
 *   g.render()
 */
class Graph2D {
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
        width: 500,
        height: 500,
        // 数学坐标范围
        xRange: [-2, 2],
        yRange: [-2, 2],
        // 内边距（像素），给坐标轴标签留空间
        padding: 40,
        // 坐标轴
        axisColor: '#333',
        axisWidth: 1.5,
        // 网格
        showGrid: false,
        gridColor: '#e8e8e8',
        gridWidth: 0.5,
        // 刻度
        tickSize: 5,
        tickColor: '#333',
        tickFont: '11px -apple-system, "Noto Serif SC", sans-serif',
        tickLabelColor: '#555',
        // 自动刻度间距（数学坐标单位），null = 自动计算
        xTickStep: null,
        yTickStep: null,
        // 默认绘图样式
        defaultStroke: '#4a90d9',
        defaultFill: 'rgba(74, 144, 217, 0.1)',
        defaultLineWidth: 1.5,
        // 默认点样式
        pointRadius: 4,
        pointColor: '#e74c3c',
        // 标签样式
        labelFont: '12px -apple-system, "Noto Serif SC", sans-serif',
        labelColor: '#333',
        // 响应式全宽
        fullWidth: false,
        // 背景色
        background: '#fafbfc',
      },
      options
    )

    // 命令队列：所有绘图操作先入队，render() 时统一执行
    this._commands = []
    // 标签队列：render() 后创建 HTML overlay
    this._labels = []

    this._initDOM()
  }

  // ========== 坐标变换 ==========

  /** 数学坐标 → Canvas 像素坐标 */
  toPixel(x, y) {
    const { padding } = this.options
    const { width, height } = this._canvasSize()
    const [xMin, xMax] = this.options.xRange
    const [yMin, yMax] = this.options.yRange
    const plotW = width - padding * 2
    const plotH = height - padding * 2
    const px = padding + ((x - xMin) / (xMax - xMin)) * plotW
    const py = padding + ((yMax - y) / (yMax - yMin)) * plotH // y 轴翻转
    return [px, py]
  }

  /** Canvas 像素坐标 → 数学坐标 */
  toMath(px, py) {
    const { padding } = this.options
    const { width, height } = this._canvasSize()
    const [xMin, xMax] = this.options.xRange
    const [yMin, yMax] = this.options.yRange
    const plotW = width - padding * 2
    const plotH = height - padding * 2
    const x = xMin + ((px - padding) / plotW) * (xMax - xMin)
    const y = yMax - ((py - padding) / plotH) * (yMax - yMin)
    return [x, y]
  }

  /** 数学长度 → 像素长度（仅 x 方向） */
  toPixelLenX(len) {
    const { padding } = this.options
    const { width } = this._canvasSize()
    const [xMin, xMax] = this.options.xRange
    return (len / (xMax - xMin)) * (width - padding * 2)
  }

  /** 数学长度 → 像素长度（仅 y 方向） */
  toPixelLenY(len) {
    const { padding } = this.options
    const { height } = this._canvasSize()
    const [yMin, yMax] = this.options.yRange
    return (len / (yMax - yMin)) * (height - padding * 2)
  }

  // ========== 坐标轴 ==========

  /** 画坐标轴（含刻度和标签） */
  drawAxes(opts = {}) {
    this._commands.push({ type: 'axes', opts })
    return this
  }

  /** 画网格 */
  drawGrid(opts = {}) {
    this._commands.push({ type: 'grid', opts })
    return this
  }

  // ========== 基本图形 ==========

  /**
   * 画圆
   * @param {number} cx - 圆心 x（数学坐标）
   * @param {number} cy - 圆心 y（数学坐标）
   * @param {number} r  - 半径（数学坐标单位）
   * @param {Object} [opts] - { stroke, fill, lineWidth, dash }
   */
  circle(cx, cy, r, opts = {}) {
    this._commands.push({ type: 'circle', cx, cy, r, opts })
    return this
  }

  /**
   * 画矩形（以中心点和半宽半高定义）
   * @param {number} cx - 中心 x
   * @param {number} cy - 中心 y
   * @param {number} hw - 半宽（数学坐标）
   * @param {number} hh - 半高（数学坐标）
   * @param {Object} [opts] - { stroke, fill, lineWidth, dash }
   */
  rect(cx, cy, hw, hh, opts = {}) {
    this._commands.push({ type: 'rect', cx, cy, hw, hh, opts })
    return this
  }

  /**
   * 画三角形（三个顶点）
   * @param {number} x1,y1 - 顶点1
   * @param {number} x2,y2 - 顶点2
   * @param {number} x3,y3 - 顶点3
   * @param {Object} [opts]
   */
  triangle(x1, y1, x2, y2, x3, y3, opts = {}) {
    this._commands.push({ type: 'triangle', x1, y1, x2, y2, x3, y3, opts })
    return this
  }

  /**
   * 画线段
   * @param {number} x1,y1 - 起点
   * @param {number} x2,y2 - 终点
   * @param {Object} [opts] - { stroke, lineWidth, dash }
   */
  line(x1, y1, x2, y2, opts = {}) {
    this._commands.push({ type: 'line', x1, y1, x2, y2, opts })
    return this
  }

  /**
   * 画多段线 / 折线
   * @param {Array<[number,number]>} points - 点数组 [[x1,y1], [x2,y2], ...]
   * @param {Object} [opts] - { stroke, lineWidth, dash, close }
   */
  polyline(points, opts = {}) {
    this._commands.push({ type: 'polyline', points, opts })
    return this
  }

  /**
   * 画弧线
   * @param {number} cx,cy - 圆心
   * @param {number} r - 半径
   * @param {number} startAngle - 起始角（弧度）
   * @param {number} endAngle - 终止角（弧度）
   * @param {Object} [opts] - { stroke, lineWidth, dash, counterclockwise }
   */
  arc(cx, cy, r, startAngle, endAngle, opts = {}) {
    this._commands.push({ type: 'arc', cx, cy, r, startAngle, endAngle, opts })
    return this
  }

  /**
   * 画函数曲线 y = f(x)
   * @param {Function} fn - 数学函数 (x) => y
   * @param {Object} [opts] - { stroke, lineWidth, dash, xMin, xMax, steps }
   */
  curve(fn, opts = {}) {
    this._commands.push({ type: 'curve', fn, opts })
    return this
  }

  /**
   * 画参数曲线 (x(t), y(t))
   * @param {Function} xFn - t => x
   * @param {Function} yFn - t => y
   * @param {number} tMin
   * @param {number} tMax
   * @param {Object} [opts] - { stroke, lineWidth, dash, steps }
   */
  parametric(xFn, yFn, tMin, tMax, opts = {}) {
    this._commands.push({ type: 'parametric', xFn, yFn, tMin, tMax, opts })
    return this
  }

  // ========== 点与标签 ==========

  /**
   * 画一个点（实心圆）+ 可选标签
   * @param {number} x - 数学坐标 x
   * @param {number} y - 数学坐标 y
   * @param {Object} [opts] - { color, radius, label, labelOffset, labelColor, labelFont }
   *   labelOffset: [dx, dy] 像素偏移，默认 [8, -8]
   */
  point(x, y, opts = {}) {
    this._commands.push({ type: 'point', x, y, opts })
    return this
  }

  /**
   * 仅添加一个文本标签（不画点）
   * @param {number} x - 数学坐标 x
   * @param {number} y - 数学坐标 y
   * @param {string} text - 支持 $...$ TeX
   * @param {Object} [opts] - { color, font, offset }
   */
  label(x, y, text, opts = {}) {
    this._commands.push({ type: 'label', x, y, text, opts })
    return this
  }

  // ========== 映射图专用 ==========

  /**
   * 画带箭头的直线（从一点指向另一点）
   * @param {number} x1,y1 - 起点（数学坐标）
   * @param {number} x2,y2 - 终点（数学坐标）
   * @param {Object} [opts] - { stroke, lineWidth, dash, headSize, label, labelOffset, labelColor, labelFont, shrinkStart, shrinkEnd }
   *   shrinkStart/shrinkEnd: 像素，箭头两端回缩距离（避免覆盖端点标签）
   */
  arrow(x1, y1, x2, y2, opts = {}) {
    this._commands.push({ type: 'arrow', x1, y1, x2, y2, opts })
    return this
  }

  /**
   * 画带箭头的二次贝塞尔曲线
   * @param {number} x1,y1 - 起点
   * @param {number} cx,cy - 控制点
   * @param {number} x2,y2 - 终点
   * @param {Object} [opts] - { stroke, lineWidth, dash, headSize, shrinkStart, shrinkEnd, label, labelOffset, labelColor, labelFont }
   */
  curvedArrow(x1, y1, cx, cy, x2, y2, opts = {}) {
    this._commands.push({ type: 'curvedArrow', x1, y1, cx, cy, x2, y2, opts })
    return this
  }

  /**
   * 画椭圆区域（表示集合/群），不使用坐标轴，以像素比例绘制
   * @param {number} cx,cy - 中心（数学坐标）
   * @param {number} rx - x 方向半径（数学坐标单位）
   * @param {number} ry - y 方向半径（数学坐标单位）
   * @param {Object} [opts] - { stroke, fill, lineWidth, dash, label, labelOffset, labelColor, labelFont }
   */
  ellipseShape(cx, cy, rx, ry, opts = {}) {
    this._commands.push({ type: 'ellipseShape', cx, cy, rx, ry, opts })
    return this
  }

  // ========== 渲染 ==========

  /** 执行所有绘图命令 */
  render() {
    const ctx = this.ctx
    const { width, height } = this._canvasSize()
    const dpr = this._dpr

    // 清空 — 先重置变换再 clear 整块物理画布，然后恢复 dpr 缩放
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, width * dpr, height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // 背景
    if (this.options.background) {
      ctx.fillStyle = this.options.background
      ctx.fillRect(0, 0, width, height)
    }

    // 清空旧标签
    this._labelLayer.innerHTML = ''
    this._labels = []

    // 预扫描：收集所有 point / label 的标签占位矩形，供坐标轴刻度做碰撞检测
    this._labelRects = this._collectLabelRects()

    // 执行命令队列
    for (const cmd of this._commands) {
      this._exec(cmd)
    }

    // 渲染 TeX 标签
    this._typesetMath()

    return this
  }

  /** 清空所有绘图命令 */
  clear() {
    this._commands = []
    this._labels = []
    this._labelLayer.innerHTML = ''
    return this
  }

  /** 销毁实例 */
  destroy() {
    this.container.innerHTML = ''
  }

  // ========== 内部方法 ==========

  _canvasSize() {
    return { width: this.options.width, height: this.options.height }
  }

  _initDOM() {
    const { width, height, fullWidth, background } = this.options
    // 取整数 dpr，避免非整数缩放导致亚像素模糊
    this._dpr = Math.ceil(window.devicePixelRatio || 1)

    // 外层容器
    this.container.classList.add('graph2d-container')
    if (fullWidth) {
      this.container.classList.add('graph2d-fullwidth')
    }
    this.container.style.position = 'relative'
    this.container.style.width = fullWidth ? '100%' : width + 'px'
    this.container.style.height = height + 'px'

    // Canvas — 物理像素 = CSS 像素 × dpr
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'graph2d-canvas'
    this.canvas.width = width * this._dpr
    this.canvas.height = height * this._dpr
    this.canvas.style.width = width + 'px'
    this.canvas.style.height = height + 'px'
    this.container.appendChild(this.canvas)

    this.ctx = this.canvas.getContext('2d')
    // 一次性将绘图坐标映射到物理像素：后续所有绘图都以 CSS 像素为单位
    this.ctx.scale(this._dpr, this._dpr)

    // HTML overlay 层（用于 TeX 标签）
    this._labelLayer = document.createElement('div')
    this._labelLayer.className = 'graph2d-labels'
    this.container.appendChild(this._labelLayer)
  }

  _exec(cmd) {
    switch (cmd.type) {
      case 'grid':    return this._drawGrid(cmd.opts)
      case 'axes':    return this._drawAxes(cmd.opts)
      case 'circle':  return this._drawCircle(cmd)
      case 'rect':    return this._drawRect(cmd)
      case 'triangle':return this._drawTriangle(cmd)
      case 'line':    return this._drawLine(cmd)
      case 'polyline':return this._drawPolyline(cmd)
      case 'arc':     return this._drawArc(cmd)
      case 'curve':   return this._drawCurve(cmd)
      case 'parametric': return this._drawParametric(cmd)
      case 'point':   return this._drawPoint(cmd)
      case 'label':   return this._drawLabel(cmd)
      case 'arrow':   return this._drawArrowLine(cmd)
      case 'curvedArrow': return this._drawCurvedArrow(cmd)
      case 'ellipseShape': return this._drawEllipseShape(cmd)
    }
  }

  // ---------- 网格 ----------
  _drawGrid(opts) {
    const ctx = this.ctx
    const { gridColor, gridWidth } = this.options
    const color = opts.color || gridColor
    const lw = opts.lineWidth || gridWidth
    const [xMin, xMax] = this.options.xRange
    const [yMin, yMax] = this.options.yRange
    const xStep = this.options.xTickStep || this._autoStep(xMin, xMax)
    const yStep = this.options.yTickStep || this._autoStep(yMin, yMax)

    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = lw

    // 竖线
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      const [px, py1] = this.toPixel(x, yMin)
      const [, py2] = this.toPixel(x, yMax)
      ctx.beginPath()
      ctx.moveTo(px, py1)
      ctx.lineTo(px, py2)
      ctx.stroke()
    }
    // 横线
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      const [px1, py] = this.toPixel(xMin, y)
      const [px2] = this.toPixel(xMax, y)
      ctx.beginPath()
      ctx.moveTo(px1, py)
      ctx.lineTo(px2, py)
      ctx.stroke()
    }
    ctx.restore()
  }

  // ---------- 坐标轴 ----------
  _drawAxes(opts) {
    const ctx = this.ctx
    const { axisColor, axisWidth, tickSize, tickColor, tickFont, tickLabelColor } = this.options
    const color = opts.color || axisColor
    const lw = opts.lineWidth || axisWidth
    const [xMin, xMax] = this.options.xRange
    const [yMin, yMax] = this.options.yRange
    const xStep = this.options.xTickStep || this._autoStep(xMin, xMax)
    const yStep = this.options.yTickStep || this._autoStep(yMin, yMax)

    // 原点像素位置（裁剪到可见区域）
    const originX = Math.max(xMin, Math.min(0, xMax))
    const originY = Math.max(yMin, Math.min(0, yMax))
    const [ox, oy] = this.toPixel(originX, originY)

    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = lw

    // x 轴
    const [pxLeft] = this.toPixel(xMin, originY)
    const [pxRight] = this.toPixel(xMax, originY)
    ctx.beginPath()
    ctx.moveTo(pxLeft, oy)
    ctx.lineTo(pxRight, oy)
    ctx.stroke()

    // y 轴
    const [, pyBottom] = this.toPixel(originX, yMin)
    const [, pyTop] = this.toPixel(originX, yMax)
    ctx.beginPath()
    ctx.moveTo(ox, pyBottom)
    ctx.lineTo(ox, pyTop)
    ctx.stroke()

    // 箭头
    this._drawArrow(ctx, pxRight, oy, 0, color, lw)
    this._drawArrow(ctx, ox, pyTop, -Math.PI / 2, color, lw)

    // 刻度 + 标签
    ctx.font = tickFont
    ctx.fillStyle = tickLabelColor
    ctx.strokeStyle = tickColor
    ctx.lineWidth = 1

    // x 刻度
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      if (Math.abs(x) < xStep * 0.01) continue // 跳过原点
      x = this._round(x, xStep)
      const [px] = this.toPixel(x, originY)
      // 始终画刻度线
      ctx.beginPath()
      ctx.moveTo(px, oy - tickSize)
      ctx.lineTo(px, oy + tickSize)
      ctx.stroke()
      // 只有不与标签重叠时才画刻度数字
      const tickText = this._formatTick(x)
      const tw = ctx.measureText(tickText).width
      const th = 12 // 近似文字高度
      const tickRect = {
        x: px - tw / 2,
        y: oy + tickSize + 3,
        w: tw,
        h: th,
      }
      if (!this._hitsLabelRect(tickRect)) {
        ctx.fillText(tickText, px, oy + tickSize + 3)
      }
    }

    // y 刻度
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      if (Math.abs(y) < yStep * 0.01) continue
      y = this._round(y, yStep)
      const [, py] = this.toPixel(originX, y)
      // 始终画刻度线
      ctx.beginPath()
      ctx.moveTo(ox - tickSize, py)
      ctx.lineTo(ox + tickSize, py)
      ctx.stroke()
      // 只有不与标签重叠时才画刻度数字
      const tickText = this._formatTick(y)
      const tw = ctx.measureText(tickText).width
      const th = 12
      const tickRect = {
        x: ox - tickSize - 4 - tw,
        y: py - th / 2,
        w: tw,
        h: th,
      }
      if (!this._hitsLabelRect(tickRect)) {
        ctx.fillText(tickText, ox - tickSize - 4, py)
      }
    }

    // 原点 "O" 标签
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.fillText('O', ox - tickSize - 2, oy + tickSize + 2)

    // 轴标签
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    if (opts.xLabel) ctx.fillText(opts.xLabel, pxRight - 15, oy - 10)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    if (opts.yLabel) ctx.fillText(opts.yLabel, ox + 15, pyTop + 5)

    ctx.restore()
  }

  _drawArrow(ctx, x, y, angle, color, lw) {
    const size = 8
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(-size, -size * 0.4)
    ctx.lineTo(-size, size * 0.4)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  // ---------- 圆 ----------
  _drawCircle(cmd) {
    const ctx = this.ctx
    const [px, py] = this.toPixel(cmd.cx, cmd.cy)
    const rx = Math.abs(this.toPixelLenX(cmd.r))
    const ry = Math.abs(this.toPixelLenY(cmd.r))
    const opts = cmd.opts

    ctx.save()
    this._applyStyle(ctx, opts)
    ctx.beginPath()
    ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2)
    if (opts.fill || (opts.fill !== false && !opts.stroke)) {
      ctx.fillStyle = opts.fill || this.options.defaultFill
      ctx.fill()
    }
    ctx.stroke()
    ctx.restore()
  }

  // ---------- 矩形 ----------
  _drawRect(cmd) {
    const ctx = this.ctx
    const [px, py] = this.toPixel(cmd.cx - cmd.hw, cmd.cy + cmd.hh) // 左上角
    const w = Math.abs(this.toPixelLenX(cmd.hw * 2))
    const h = Math.abs(this.toPixelLenY(cmd.hh * 2))
    const opts = cmd.opts

    ctx.save()
    this._applyStyle(ctx, opts)
    if (opts.fill) {
      ctx.fillStyle = opts.fill
      ctx.fillRect(px, py, w, h)
    }
    ctx.strokeRect(px, py, w, h)
    ctx.restore()
  }

  // ---------- 三角形 ----------
  _drawTriangle(cmd) {
    const ctx = this.ctx
    const [p1x, p1y] = this.toPixel(cmd.x1, cmd.y1)
    const [p2x, p2y] = this.toPixel(cmd.x2, cmd.y2)
    const [p3x, p3y] = this.toPixel(cmd.x3, cmd.y3)
    const opts = cmd.opts

    ctx.save()
    this._applyStyle(ctx, opts)
    ctx.beginPath()
    ctx.moveTo(p1x, p1y)
    ctx.lineTo(p2x, p2y)
    ctx.lineTo(p3x, p3y)
    ctx.closePath()
    if (opts.fill) {
      ctx.fillStyle = opts.fill
      ctx.fill()
    }
    ctx.stroke()
    ctx.restore()
  }

  // ---------- 线段 ----------
  _drawLine(cmd) {
    const ctx = this.ctx
    const [p1x, p1y] = this.toPixel(cmd.x1, cmd.y1)
    const [p2x, p2y] = this.toPixel(cmd.x2, cmd.y2)
    const opts = cmd.opts

    ctx.save()
    this._applyStyle(ctx, opts)
    ctx.beginPath()
    ctx.moveTo(p1x, p1y)
    ctx.lineTo(p2x, p2y)
    ctx.stroke()
    ctx.restore()
  }

  // ---------- 多段线 ----------
  _drawPolyline(cmd) {
    const ctx = this.ctx
    const pts = cmd.points.map(([x, y]) => this.toPixel(x, y))
    const opts = cmd.opts

    if (pts.length < 2) return

    ctx.save()
    this._applyStyle(ctx, opts)
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1])
    }
    if (opts.close) ctx.closePath()
    if (opts.fill) {
      ctx.fillStyle = opts.fill
      ctx.fill()
    }
    ctx.stroke()
    ctx.restore()
  }

  // ---------- 弧线 ----------
  _drawArc(cmd) {
    const ctx = this.ctx
    const [px, py] = this.toPixel(cmd.cx, cmd.cy)
    const rx = Math.abs(this.toPixelLenX(cmd.r))
    const ry = Math.abs(this.toPixelLenY(cmd.r))
    const opts = cmd.opts

    ctx.save()
    this._applyStyle(ctx, opts)
    ctx.beginPath()
    // Canvas 的 y 轴向下，角度需要取反以匹配数学坐标系
    ctx.ellipse(px, py, rx, ry, 0, -cmd.startAngle, -cmd.endAngle, !opts.counterclockwise)
    ctx.stroke()
    ctx.restore()
  }

  // ---------- 函数曲线 ----------
  _drawCurve(cmd) {
    const ctx = this.ctx
    const opts = cmd.opts
    const [xMin, xMax] = this.options.xRange
    const x0 = opts.xMin != null ? opts.xMin : xMin
    const x1 = opts.xMax != null ? opts.xMax : xMax
    const steps = opts.steps || 200
    const dx = (x1 - x0) / steps

    ctx.save()
    this._applyStyle(ctx, opts)
    ctx.beginPath()
    let started = false
    for (let i = 0; i <= steps; i++) {
      const x = x0 + i * dx
      const y = cmd.fn(x)
      if (!isFinite(y)) { started = false; continue }
      const [px, py] = this.toPixel(x, y)
      if (!started) { ctx.moveTo(px, py); started = true }
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.restore()
  }

  // ---------- 参数曲线 ----------
  _drawParametric(cmd) {
    const ctx = this.ctx
    const opts = cmd.opts
    const steps = opts.steps || 200
    const dt = (cmd.tMax - cmd.tMin) / steps

    ctx.save()
    this._applyStyle(ctx, opts)
    ctx.beginPath()
    for (let i = 0; i <= steps; i++) {
      const t = cmd.tMin + i * dt
      const x = cmd.xFn(t)
      const y = cmd.yFn(t)
      const [px, py] = this.toPixel(x, y)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    ctx.restore()
  }

  // ---------- 点 ----------
  _drawPoint(cmd) {
    const ctx = this.ctx
    const [px, py] = this.toPixel(cmd.x, cmd.y)
    const opts = cmd.opts
    const r = opts.radius || this.options.pointRadius
    const color = opts.color || this.options.pointColor

    ctx.save()
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // 标签
    if (opts.label) {
      const offset = opts.labelOffset || [8, -8]
      this._addLabel(px + offset[0], py + offset[1], opts.label, {
        color: opts.labelColor || this.options.labelColor,
        font: opts.labelFont || this.options.labelFont,
      })
    }
  }

  // ---------- 纯文本标签 ----------
  _drawLabel(cmd) {
    const [px, py] = this.toPixel(cmd.x, cmd.y)
    const opts = cmd.opts
    const offset = opts.offset || [0, 0]
    this._addLabel(px + offset[0], py + offset[1], cmd.text, {
      color: opts.color || this.options.labelColor,
      font: opts.font || this.options.labelFont,
    })
  }

  // ---------- HTML 标签 ----------
  _addLabel(px, py, text, style) {
    const el = document.createElement('div')
    el.className = 'graph2d-label'
    el.style.left = px + 'px'
    el.style.top = py + 'px'
    if (style.color) el.style.color = style.color
    if (style.font) el.style.font = style.font
    // TeX 支持：$...$ → \(...\)
    el.innerHTML = this._texToHTML(text)
    this._labelLayer.appendChild(el)
    this._labels.push(el)
  }

  // ---------- 带箭头直线 ----------
  _drawArrowLine(cmd) {
    const ctx = this.ctx
    let [p1x, p1y] = this.toPixel(cmd.x1, cmd.y1)
    let [p2x, p2y] = this.toPixel(cmd.x2, cmd.y2)
    const opts = cmd.opts
    const headSize = opts.headSize || 8

    // shrink：箭头端点回缩
    const dx = p2x - p1x, dy = p2y - p1y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len === 0) return
    const ux = dx / len, uy = dy / len
    const ss = opts.shrinkStart || 0
    const se = opts.shrinkEnd || 0
    p1x += ux * ss; p1y += uy * ss
    p2x -= ux * se; p2y -= uy * se

    ctx.save()
    this._applyStyle(ctx, opts)
    ctx.beginPath()
    ctx.moveTo(p1x, p1y)
    ctx.lineTo(p2x, p2y)
    ctx.stroke()

    // 箭头
    const angle = Math.atan2(p2y - p1y, p2x - p1x)
    ctx.fillStyle = opts.stroke || this.options.defaultStroke
    ctx.beginPath()
    ctx.moveTo(p2x, p2y)
    ctx.lineTo(p2x - headSize * Math.cos(angle - 0.35), p2y - headSize * Math.sin(angle - 0.35))
    ctx.lineTo(p2x - headSize * Math.cos(angle + 0.35), p2y - headSize * Math.sin(angle + 0.35))
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // 标签
    if (opts.label) {
      const mx = (p1x + p2x) / 2
      const my = (p1y + p2y) / 2
      const offset = opts.labelOffset || [0, -12]
      this._addLabel(mx + offset[0], my + offset[1], opts.label, {
        color: opts.labelColor || this.options.labelColor,
        font: opts.labelFont || this.options.labelFont,
      })
    }
  }

  // ---------- 带箭头的贝塞尔曲线 ----------
  _drawCurvedArrow(cmd) {
    const ctx = this.ctx
    let [p1x, p1y] = this.toPixel(cmd.x1, cmd.y1)
    const [cpx, cpy] = this.toPixel(cmd.cx, cmd.cy)
    let [p2x, p2y] = this.toPixel(cmd.x2, cmd.y2)
    const opts = cmd.opts
    const headSize = opts.headSize || 8

    // shrink start
    if (opts.shrinkStart) {
      const dx = 2 * (cpx - p1x), dy = 2 * (cpy - p1y) // 贝塞尔切线 at t=0
      const dl = Math.sqrt(dx * dx + dy * dy)
      if (dl > 0) { p1x += dx / dl * opts.shrinkStart; p1y += dy / dl * opts.shrinkStart }
    }
    // shrink end
    if (opts.shrinkEnd) {
      const dx = 2 * (p2x - cpx), dy = 2 * (p2y - cpy) // 贝塞尔切线 at t=1
      const dl = Math.sqrt(dx * dx + dy * dy)
      if (dl > 0) { p2x -= dx / dl * opts.shrinkEnd; p2y -= dy / dl * opts.shrinkEnd }
    }

    ctx.save()
    this._applyStyle(ctx, opts)
    ctx.beginPath()
    ctx.moveTo(p1x, p1y)
    ctx.quadraticCurveTo(cpx, cpy, p2x, p2y)
    ctx.stroke()

    // 箭头方向 = 贝塞尔终点切线
    const tangentX = 2 * (p2x - cpx)
    const tangentY = 2 * (p2y - cpy)
    const angle = Math.atan2(tangentY, tangentX)
    ctx.fillStyle = opts.stroke || this.options.defaultStroke
    ctx.beginPath()
    ctx.moveTo(p2x, p2y)
    ctx.lineTo(p2x - headSize * Math.cos(angle - 0.35), p2y - headSize * Math.sin(angle - 0.35))
    ctx.lineTo(p2x - headSize * Math.cos(angle + 0.35), p2y - headSize * Math.sin(angle + 0.35))
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // 标签
    if (opts.label) {
      // 贝塞尔中点 at t=0.5
      const mx = 0.25 * p1x + 0.5 * cpx + 0.25 * p2x
      const my = 0.25 * p1y + 0.5 * cpy + 0.25 * p2y
      const offset = opts.labelOffset || [0, -12]
      this._addLabel(mx + offset[0], my + offset[1], opts.label, {
        color: opts.labelColor || this.options.labelColor,
        font: opts.labelFont || this.options.labelFont,
      })
    }
  }

  // ---------- 椭圆区域 ----------
  _drawEllipseShape(cmd) {
    const ctx = this.ctx
    const [px, py] = this.toPixel(cmd.cx, cmd.cy)
    const rx = Math.abs(this.toPixelLenX(cmd.rx))
    const ry = Math.abs(this.toPixelLenY(cmd.ry))
    const opts = cmd.opts

    ctx.save()
    this._applyStyle(ctx, opts)
    ctx.beginPath()
    ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2)
    if (opts.fill) {
      ctx.fillStyle = opts.fill
      ctx.fill()
    }
    ctx.stroke()
    ctx.restore()

    // 标签（默认显示在椭圆顶部）
    if (opts.label) {
      const offset = opts.labelOffset || [0, -ry - 14]
      this._addLabel(px + offset[0], py + offset[1], opts.label, {
        color: opts.labelColor || this.options.labelColor,
        font: opts.labelFont || '14px -apple-system, "Inter", sans-serif',
      })
    }
  }

  // ---------- 工具方法 ----------

  /**
   * 预扫描命令队列中所有 point / label，估算其标签占位矩形（像素坐标）。
   * 用于坐标轴刻度数字的碰撞检测——如果某个刻度数字区域与这些标签重叠，就跳过该数字。
   */
  _collectLabelRects() {
    const rects = []
    // 估算参数：TeX 标签在 MathJax 渲染前无法精确测量，这里用保守估计
    const CHAR_W = 8    // 每字符近似宽度
    const LINE_H = 16   // 行高
    const PAD = 4        // 额外内边距

    for (const cmd of this._commands) {
      if (cmd.type === 'point' && cmd.opts.label) {
        const [px, py] = this.toPixel(cmd.x, cmd.y)
        const offset = cmd.opts.labelOffset || [8, -8]
        const lx = px + offset[0]
        const ly = py + offset[1]
        // 估算标签文本宽高（去掉 $ 符号后估算字符数）
        const raw = cmd.opts.label.replace(/\$/g, '')
        const estW = Math.max(raw.length * CHAR_W, 20) + PAD * 2
        const estH = LINE_H + PAD * 2
        rects.push({ x: lx - PAD, y: ly - estH + PAD, w: estW, h: estH })
      } else if (cmd.type === 'label') {
        const [px, py] = this.toPixel(cmd.x, cmd.y)
        const offset = cmd.opts.offset || [0, 0]
        const lx = px + offset[0]
        const ly = py + offset[1]
        const raw = cmd.text.replace(/\$/g, '')
        const estW = Math.max(raw.length * CHAR_W, 20) + PAD * 2
        const estH = LINE_H + PAD * 2
        rects.push({ x: lx - PAD, y: ly - estH + PAD, w: estW, h: estH })
      }
    }
    return rects
  }

  /**
   * 检测给定矩形是否与任何已注册的标签区域重叠
   * @param {{ x: number, y: number, w: number, h: number }} rect
   * @returns {boolean}
   */
  _hitsLabelRect(rect) {
    for (const lr of this._labelRects) {
      // AABB 碰撞检测
      if (
        rect.x < lr.x + lr.w &&
        rect.x + rect.w > lr.x &&
        rect.y < lr.y + lr.h &&
        rect.y + rect.h > lr.y
      ) {
        return true
      }
    }
    return false
  }

  _applyStyle(ctx, opts) {
    ctx.strokeStyle = opts.stroke || this.options.defaultStroke
    ctx.lineWidth = opts.lineWidth || this.options.defaultLineWidth
    if (opts.dash) {
      ctx.setLineDash(opts.dash)
    } else {
      ctx.setLineDash([])
    }
  }

  _texToHTML(text) {
    if (!text) return ''
    return text.replace(/\$(.+?)\$/g, '\\($1\\)')
  }

  _typesetMath() {
    const el = this.container
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise([el]).catch(() => {})
    } else if (window.MathJax && MathJax.Hub) {
      MathJax.Hub.Queue(['Typeset', MathJax.Hub, el])
    }
  }

  _autoStep(min, max) {
    const range = max - min
    const raw = range / 5
    const mag = Math.pow(10, Math.floor(Math.log10(raw)))
    const norm = raw / mag
    if (norm <= 1) return mag
    if (norm <= 2) return 2 * mag
    if (norm <= 5) return 5 * mag
    return 10 * mag
  }

  _round(val, step) {
    // 消除浮点误差
    const dec = Math.max(0, -Math.floor(Math.log10(step)) + 1)
    return parseFloat(val.toFixed(dec))
  }

  _formatTick(val) {
    if (Number.isInteger(val)) return val.toString()
    return parseFloat(val.toPrecision(4)).toString()
  }
}
