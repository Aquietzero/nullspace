/**
 * Candlestick Chart - 简单 K 线图组件
 * 用于博客文章中的价格行为示例
 *
 * 用法：
 *   <canvas id="my-chart" style="width:600px; height:300px;"></canvas>
 *   <script>
 *     const chart = new Candlestick('my-chart', {
 *       data: [
 *         { o: 100, h: 110, l: 95, c: 105 },
 *         { o: 105, h: 115, l: 100, c: 98 },
 *         ...
 *       ]
 *     });
 *   </script>
 */
class Candlestick {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // 配色方案: 'greenUp' (绿涨红跌, 默认) 或 'redUp' (红涨绿跌)
    this.colorScheme = options.colorScheme || 'greenUp';

    // 数据: 每条 { o, h, l, c }
    this.data = options.data || [];

    // 布局
    this.padding = { top: 20, right: 60, bottom: 20, left: 10 };

    // 状态
    this.hoveredIndex = -1;

    this._init();
    this._bindEvents();
    this.render();
  }

  _init() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;

    // 绘图区域
    this.plotX = this.padding.left;
    this.plotY = this.padding.top;
    this.plotW = this.width - this.padding.left - this.padding.right;
    this.plotH = this.height - this.padding.top - this.padding.bottom;
  }

  _getColors() {
    if (this.colorScheme === 'redUp') {
      return { up: '#e74c3c', down: '#27ae60' };
    }
    return { up: '#27ae60', down: '#e74c3c' };
  }

  _priceRange() {
    if (this.data.length === 0) return { min: 0, max: 100 };
    let min = Infinity, max = -Infinity;
    for (const d of this.data) {
      if (d.l < min) min = d.l;
      if (d.h > max) max = d.h;
    }
    const margin = (max - min) * 0.08 || 1;
    return { min: min - margin, max: max + margin };
  }

  _priceToY(price) {
    const { min, max } = this._priceRange();
    return this.plotY + this.plotH - ((price - min) / (max - min)) * this.plotH;
  }

  _indexToX(i) {
    const count = this.data.length;
    const candleWidth = this.plotW / count;
    return this.plotX + candleWidth * i + candleWidth / 2;
  }

  _candleWidth() {
    const count = this.data.length;
    const candleWidth = this.plotW / count;
    return Math.max(1, candleWidth * 0.6);
  }

  _bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this._handleHover(x, y);
    });

    this.canvas.addEventListener('mouseleave', () => {
      if (this.hoveredIndex !== -1) {
        this.hoveredIndex = -1;
        this.render();
      }
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this._handleClick(x, y);
    });
  }

  _handleHover(mx, my) {
    const count = this.data.length;
    if (count === 0) return;
    const candleWidth = this.plotW / count;
    const idx = Math.floor((mx - this.plotX) / candleWidth);
    const newIdx = (idx >= 0 && idx < count) ? idx : -1;
    if (newIdx !== this.hoveredIndex) {
      this.hoveredIndex = newIdx;
      this.render();
    }
  }

  _handleClick(mx, my) {
    // 检测图例点击
    const legendY = this.padding.top + 2;
    const legendX = this.plotX + 4;
    if (mx >= legendX && mx <= legendX + 120 && my >= legendY && my <= legendY + 16) {
      this.colorScheme = this.colorScheme === 'greenUp' ? 'redUp' : 'greenUp';
      this.render();
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this._drawYAxis();
    this._drawCandles();
    this._drawLegend();

    if (this.hoveredIndex >= 0 && this.hoveredIndex < this.data.length) {
      this._drawTooltip();
    }
  }

  _drawYAxis() {
    const ctx = this.ctx;
    const { min, max } = this._priceRange();
    const ticks = 5;
    const step = (max - min) / ticks;

    ctx.save();
    ctx.strokeStyle = '#eee';
    ctx.fillStyle = '#999';
    ctx.font = '11px "JetBrains Mono", "SF Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= ticks; i++) {
      const price = min + step * i;
      const y = this._priceToY(price);

      // 网格线
      ctx.beginPath();
      ctx.setLineDash([2, 3]);
      ctx.moveTo(this.plotX, y);
      ctx.lineTo(this.plotX + this.plotW, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 价格标签
      ctx.fillText(price.toFixed(1), this.plotX + this.plotW + 6, y);
    }
    ctx.restore();
  }

  _drawCandles() {
    const ctx = this.ctx;
    const colors = this._getColors();
    const cw = this._candleWidth();

    for (let i = 0; i < this.data.length; i++) {
      const d = this.data[i];
      const x = this._indexToX(i);
      const isUp = d.c >= d.o;
      const color = isUp ? colors.up : colors.down;

      const yHigh = this._priceToY(d.h);
      const yLow = this._priceToY(d.l);
      const yOpen = this._priceToY(d.o);
      const yClose = this._priceToY(d.c);

      // 影线
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // 实体
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(Math.abs(yClose - yOpen), 1);

      if (isUp) {
        // 阳线：空心或填充
        ctx.fillStyle = color;
        ctx.fillRect(x - cw / 2, bodyTop, cw, bodyHeight);
      } else {
        // 阴线：填充
        ctx.fillStyle = color;
        ctx.fillRect(x - cw / 2, bodyTop, cw, bodyHeight);
      }

      // hover 高亮
      if (i === this.hoveredIndex) {
        ctx.save();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 2]);
        ctx.strokeRect(x - cw / 2 - 2, bodyTop - 2, cw + 4, bodyHeight + 4);
        ctx.setLineDash([]);
        ctx.restore();
      }
    }
  }

  _drawLegend() {
    const ctx = this.ctx;
    const colors = this._getColors();
    const x = this.plotX + 4;
    const y = this.padding.top + 2;

    ctx.save();
    ctx.font = '11px "JetBrains Mono", "SF Mono", monospace';

    // 切换按钮
    const label = this.colorScheme === 'greenUp' ? '绿涨红跌' : '红涨绿跌';

    // 涨色块
    ctx.fillStyle = colors.up;
    ctx.fillRect(x, y, 10, 10);

    // 跌色块
    ctx.fillStyle = colors.down;
    ctx.fillRect(x + 14, y, 10, 10);

    // 文字
    ctx.fillStyle = '#666';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(label + ' ↔', x + 28, y);

    // 光标提示
    this.canvas.style.cursor = 'default';
    ctx.restore();
  }

  _drawTooltip() {
    const ctx = this.ctx;
    const d = this.data[this.hoveredIndex];
    const x = this._indexToX(this.hoveredIndex);

    const lines = [
      `O: ${d.o.toFixed(2)}`,
      `H: ${d.h.toFixed(2)}`,
      `L: ${d.l.toFixed(2)}`,
      `C: ${d.c.toFixed(2)}`
    ];

    ctx.save();
    ctx.font = '11px "JetBrains Mono", "SF Mono", monospace';

    const lineHeight = 16;
    const boxW = 90;
    const boxH = lines.length * lineHeight + 10;

    // tooltip 位置（避免超出边界）
    let tx = x + 10;
    let ty = this.padding.top + 20;
    if (tx + boxW > this.width - this.padding.right) {
      tx = x - boxW - 10;
    }

    // 背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tx, ty, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    // 文字
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], tx + 8, ty + 6 + i * lineHeight);
    }

    ctx.restore();
  }

  // 更新数据
  setData(data) {
    this.data = data;
    this.hoveredIndex = -1;
    this.render();
  }

  // 切换配色
  setColorScheme(scheme) {
    this.colorScheme = scheme;
    this.render();
  }
}
