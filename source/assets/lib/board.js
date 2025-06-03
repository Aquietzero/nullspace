// assets/lib/board.js

/**
 * 围棋棋盘类
 */
class Board {
  /**
   * 构造函数
   * @param {HTMLElement} container - 棋盘容器元素
   * @param {number} size - 棋盘大小（默认为19路棋盘）
   */
  constructor(container, size = 19, opts = {}) {
    this.container = container;
    this.size = size;
    this.board = []; // 存储棋盘状态
    this.cellSize = 0; // 每个格子的尺寸
    this.opts = opts;
    
    // 初始化棋盘状态
    for (let i = 0; i < size; i++) {
      this.board[i] = new Array(size).fill(null);
    }
    
    this.initBoard();
  }
  
  /**
   * 初始化棋盘DOM
   */
  initBoard() {
    // 清空容器
    this.container.innerHTML = '';
    
    // 设置棋盘样式
    this.container.style.position = 'relative';
    if (this.opts.noBorder) {
      this.container.style.border = 'none';
    } else {
      this.container.style.border = '2px solid #000';
    }
    
    // 计算格子大小
    const containerWidth = this.container.clientWidth;
    this.cellSize = containerWidth / (this.size - 1);
    
    // 绘制棋盘线
    this.drawGrid();
  }
  
  /**
   * 绘制棋盘网格线
   */
  drawGrid() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    
    // 绘制横线
    for (let i = 1; i < this.size - 1; i++) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', i * this.cellSize);
      line.setAttribute('x2', '100%');
      line.setAttribute('y2', i * this.cellSize);
      line.setAttribute('stroke', '#000');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    }
    
    // 绘制竖线
    for (let i = 1; i < this.size - 1; i++) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', i * this.cellSize);
      line.setAttribute('y1', '0');
      line.setAttribute('x2', i * this.cellSize);
      line.setAttribute('y2', '100%');
      line.setAttribute('stroke', '#000');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    }
    
    this.container.appendChild(svg);
  }
  
  /**
   * 在指定位置落子
   * @param {[number, number]} move - 落子位置 [x, y]
   * @param {'black' | 'white'} player - 玩家颜色
   */
  play(move, player) {
    const [x, y] = move;
    
    // 检查位置是否有效
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
      console.error('落子位置超出棋盘范围');
      return;
    }
    
    // 检查该位置是否已有棋子
    if (this.board[x][y] !== null) {
      console.error('该位置已有棋子');
      return;
    }
    
    // 更新棋盘状态
    this.board[x][y] = player;
    
    // 渲染棋子
    this.renderStone(x, y, player);
  }
  
  /**
   * 渲染棋子
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @param {'black' | 'white'} color - 棋子颜色
   */
  renderStone(x, y, color) {
    const stone = document.createElement('div');
    stone.style.fontFamily = 'sans-serif';
    stone.style.position = 'absolute';
    stone.style.boxSizing = 'border-box';
    stone.style.width = `${this.cellSize * 0.8}px`;
    stone.style.height = `${this.cellSize * 0.8}px`;
    stone.style.borderRadius = '50%';
    stone.style.backgroundColor = color === 'black' ? '#000' : '#fff';
    stone.style.border = color === 'white' ? '2px solid #000' : 'none';
    
    // 计算棋子位置
    const left = x * this.cellSize - this.cellSize * 0.4;
    const top = y * this.cellSize - this.cellSize * 0.4;
    
    stone.style.left = `${left}px`;
    stone.style.top = `${top}px`;
    
    this.container.appendChild(stone);
  }

  // 在Board类中添加tryToPlay方法
/**
 * 尝试落子（用于演示或提示），渲染灰色棋子并显示数字值
 * @param {[number, number]} move - 落子位置 [x, y]
 * @param {'black' | 'white'} player - 玩家颜色（仅用于逻辑判断）
 * @param {number} value - 要显示的数字值
 */
tryToPlay(move, player, value, opts) {
    const [x, y] = move;
    
    // 检查位置是否有效
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
      console.error('落子位置超出棋盘范围');
      return;
    }
    
    // 检查该位置是否已有棋子
    if (this.board[x][y] !== null) {
      console.error('该位置已有棋子');
      return;
    }
    
    // 渲染尝试落子的棋子
    this.renderTryStone(x, y, player, value, opts);
  }
  
  /**
   * 渲染尝试落子的棋子（灰色带数字）
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @param {number} value - 要显示的数字值
   */
  renderTryStone(x, y, player, value, opts = {}) {
    const stone = document.createElement('div');
    stone.style.fontFamily = 'sans-serif';
    stone.style.fontSize = '14px';
    stone.style.position = 'absolute';
    stone.style.boxSizing = 'border-box';
    stone.style.width = `${this.cellSize * 0.8}px`;
    stone.style.height = `${this.cellSize * 0.8}px`;
    stone.style.borderRadius = '50%';
    stone.style.display = 'flex';
    stone.style.justifyContent = 'center';
    stone.style.alignItems = 'center';
    stone.style.fontWeight = 'bold';
    if (player === 'white') {
        stone.style.color = 'black';
        stone.style.backgroundColor = 'white';
        stone.style.border = '1px solid black';
    } else {
        stone.style.color = 'white';
        stone.style.backgroundColor = 'black';
        stone.style.border = '1px solid black';
    }
    if (opts.backgroundColor) {
        stone.style.backgroundColor = opts.backgroundColor;
        stone.style.border = `1px solid ${opts.backgroundColor}`;
    }
    
    // 添加数字文本
    const text = document.createElement('span');
    text.textContent = value.toString();
    stone.appendChild(text);
    
    // 计算棋子位置
    const left = x * this.cellSize - this.cellSize * 0.4;
    const top = y * this.cellSize - this.cellSize * 0.4;
    
    stone.style.left = `${left}px`;
    stone.style.top = `${top}px`;
    
    this.container.appendChild(stone);
  }
}