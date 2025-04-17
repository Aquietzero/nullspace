class Plot {
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
    
    // 坐标系设置
    this.width = rect.width;
    this.height = rect.height;
    this.ctx.translate(this.width/2, this.height/2);
    this.ctx.scale(1, -1);
    
    // 绘制坐标轴
    this._drawAxes();
  }

  _drawAxes() {
    this.ctx.strokeStyle = '#ddd';
    this.ctx.beginPath();
    this.ctx.moveTo(-this.width/2, 0);
    this.ctx.lineTo(this.width/2, 0);
    this.ctx.moveTo(0, -this.height/2);
    this.ctx.lineTo(0, this.height/2);
    this.ctx.stroke();

    // 绘制刻度
    const scaleFactor = this.width/10;
    this.ctx.scale(1, -1);
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = '#ccc';
    for(let i=-5; i<=5; i++) {
      if(i !== 0) {
        this.ctx.fillText(i, i*scaleFactor, 10);
        this.ctx.fillText(i, -15, -i*scaleFactor+5);
      }
    }
    this.ctx.scale(1, -1);
  }

  draw(func, options = {}) {
    const scaleFactor = this.width/10;
    this.ctx.strokeStyle = options.color || 'red';
    this.ctx.beginPath();
    
    for(let x=-5; x<=5; x+=0.1) {
      const y = func(x);
      const screenX = x * scaleFactor;
      const screenY = y * scaleFactor;
      
      if(x === -5) {
        this.ctx.moveTo(screenX, screenY);
      } else {
        this.ctx.lineTo(screenX, screenY);
      }
    }
    this.ctx.stroke();

    // 标记函数表达式
    if (!options.label) return;
    const {x: labelX, y: labelY} = options.labelPosition;
    this.ctx.scale(1, -1);
    this.ctx.fillStyle = options.color || 'black';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(
      options.label || 'y = f(x)',
      labelX ? labelX(this.width) : this.width/4,
      labelY ? labelY(this.height) : -this.height/4);
    this.ctx.scale(1, -1);
  }

  drawPoints(points, options = {}) {
    const scaleFactor = this.width/10;
    
    // 绘制所有点
    points.forEach(point => {
      const [x, y] = point;
      const screenX = x * scaleFactor;
      const screenY = y * scaleFactor;
      const radius = options.radius || 5;

      // 绘制点
      this.ctx.beginPath();
      this.ctx.fillStyle = options.color || 'blue';
      this.ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
      this.ctx.fill();

      // 显示坐标标签
      if (options.showCoordinates) {
        this.ctx.scale(1, -1);
        this.ctx.fillStyle = options.labelColor || '#666';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';  // 改为左对齐
        this.ctx.textBaseline = 'top'; // 改为顶部对齐
        this.ctx.fillText(`(${x},${y})`, screenX + 20, -screenY - 5);
        this.ctx.scale(1, -1);
      }

      // 绘制到函数的距离
      if (options.showDistance && options.func) {
        const funcY = options.func(x) * scaleFactor;
        this.ctx.strokeStyle = options.distanceColor || '#888';
        this.ctx.setLineDash([2, 2]);
        this.ctx.beginPath();
        this.ctx.moveTo(screenX, screenY);
        this.ctx.lineTo(screenX, funcY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }
    });
  }

  drawArrow(startPoint, endPoint, options = {}) {
    const scaleFactor = this.width/10;
    const [x1, y1] = startPoint;
    const [x2, y2] = endPoint;
    
    // 转换为画布坐标
    const startX = x1 * scaleFactor;
    const startY = y1 * scaleFactor;
    const endX = x2 * scaleFactor;
    const endY = y2 * scaleFactor;

    // 绘制箭头线
    this.ctx.strokeStyle = options.color || '#000';
    this.ctx.lineWidth = options.width || 2;
    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    // 计算箭头角度
    const angle = Math.atan2(endY - startY, endX - startX);
    const arrowSize = options.size || 12;

    // 绘制箭头头部
    this.ctx.fillStyle = options.color || '#000';
    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - arrowSize * Math.cos(angle - Math.PI/6),
      endY - arrowSize * Math.sin(angle - Math.PI/6)
    );
    this.ctx.lineTo(
      endX - arrowSize * Math.cos(angle + Math.PI/6),
      endY - arrowSize * Math.sin(angle + Math.PI/6)
    );
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawRect(topLeft, width, height, options = {}) {
    const scaleFactor = this.width/10;
    const [x, y] = topLeft;
    const screenX = x * scaleFactor;
    const screenY = y * scaleFactor;
    const screenWidth = width * scaleFactor;
    const screenHeight = height * scaleFactor;

    // 绘制矩形填充
    this.ctx.fillStyle = options.fillColor || 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.rect(screenX, screenY, screenWidth, screenHeight);
    this.ctx.fill();

    // 绘制矩形边框
    this.ctx.strokeStyle = options.strokeColor || '#000';
    this.ctx.lineWidth = options.strokeWidth || 2;
    this.ctx.beginPath();
    this.ctx.rect(screenX, screenY, screenWidth, screenHeight);
    this.ctx.stroke();
  }
}