class Graph {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.init();
  }

  init() {
    // 高清适配
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    
    // 保存画布尺寸
    this.width = rect.width;
    this.height = rect.height;
  }

  histogram(data, options = {}) {
    const { 
      padding = 40,
      barColor = '#4a8fe7',
      borderColor = '#2c6cb8',
      labelColor = '#333',
      xLabel = '',
      yLabel = ''
    } = options;

    // 计算最大值和柱子数量
    const maxValue = Math.max(...data.map(item => item.value));
    const barCount = data.length;
    
    // 动态计算柱宽和间距
    const availableWidth = this.width - padding * 2;
    const barWidth = Math.min(availableWidth / (barCount * 1.5), 60);
    const barGap = (availableWidth - barWidth * barCount) / (barCount + 1);
    
    // 计算绘图区域高度
    const plotHeight = this.height - padding * 2;
    
    // 绘制坐标轴
    this.ctx.strokeStyle = '#000';
    this.ctx.beginPath();
    // x轴
    this.ctx.moveTo(padding, this.height - padding);
    this.ctx.lineTo(this.width - padding, this.height - padding);
    // y轴
    this.ctx.moveTo(padding, padding);
    this.ctx.lineTo(padding, this.height - padding);
    this.ctx.stroke();

    // 绘制坐标轴标签
    this.ctx.fillStyle = '#000';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(xLabel, this.width - padding/2, this.height - padding/2);
    this.ctx.textAlign = 'right';
    this.ctx.fillText(yLabel, padding, padding);

    // 绘制柱子
    data.forEach((item, index) => {
      const x = padding + barGap * (index + 1) + barWidth * index;
      const height = (item.value / maxValue) * plotHeight;
      
      // 绘制柱子
      this.ctx.fillStyle = item.color || barColor;
      this.ctx.strokeStyle = borderColor;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.rect(x, this.height - padding - height, barWidth, height);
      this.ctx.fill();
      this.ctx.stroke();

      // 绘制柱子标签
      this.ctx.fillStyle = labelColor;
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(item.label, x + barWidth/2, this.height - padding + 20);
    });
  }
}