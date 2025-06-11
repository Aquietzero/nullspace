// assets/lib/gridworld.js

/**
 * GridWorld类 - 用于Q学习演示的网格世界环境
 */
class GridWorld {
  /**
   * 构造函数
   * @param {HTMLElement} container - 容器元素
   * @param {number} size - 网格大小（例如4表示4x4网格）
   * @param {Object} options - 配置选项
   */
  constructor(id, container, size = 4, options = {}) {
    this.id = id;
    this.container = container;
    this.size = size;
    this.options = Object.assign({
      cellSize: Math.min(container.clientWidth, container.clientHeight) / size,
      learningRate: 0.1,  // 学习率
      discountFactor: 0.9, // 折扣因子
      explorationRate: 0.1, // 探索率
      // ui
      showTriangles: true,
      pathColor: 'black', // 路径颜色
      pathWidth: 3,         // 路径线宽
      textColor: '#333',   // 文本颜色
      textSize: 12,        // 文本大小(px)
    }, options);
    
    // 初始化网格状态
    this.grid = [];
    for (let i = 0; i < size; i++) {
      this.grid[i] = new Array(size).fill(0);
    }
    
    // 初始化Q表
    this.qTable = {};
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        this.qTable[`${i},${j}`] = {
          up: 0,
          right: 0,
          down: 0,
          left: 0
        };
      }
    }
    
    // 定义动作
    this.actions = ['up', 'right', 'down', 'left'];
    
    // 定义奖励点和惩罚点
    this.rewards = [];
    this.penalties = [];
    
    // 当前位置
    this.currentPosition = [0, 0];
    
    // 初始化UI
    this.initUI();
  }
  
  /**
   * 初始化UI
   */
  initUI() {
    // 清空容器
    this.container.innerHTML = '';
    
    // 设置容器样式
    this.container.style.position = 'relative';
    this.container.style.width = `${this.options.cellSize * this.size}px`;
    this.container.style.height = `${this.options.cellSize * this.size}px`;
    this.container.style.border = '2px solid #333';
    this.container.style.boxSizing = 'content-box';
    
    // 创建网格
    this.createGrid();
    
    // 放置智能体
    this.placeAgent();
  }
  
  /**
   * 创建网格
   */
  createGrid() {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.id = `${this.id}-cell-${i}-${j}`;
        cell.style.position = 'absolute';
        cell.style.left = `${j * this.options.cellSize}px`;
        cell.style.top = `${i * this.options.cellSize}px`;
        cell.style.width = `${this.options.cellSize}px`;
        cell.style.height = `${this.options.cellSize}px`;
        cell.style.boxSizing = 'border-box';
        cell.style.border = '0.5px solid #ccc';
        cell.style.backgroundColor = '#fff';
        
        // 创建四个方向的三角形
        this.createTriangles(cell, i, j);
        
        this.container.appendChild(cell);
      }
    }
  }
  
  /**
   * 在单元格中创建四个方向的三角形
   * @param {HTMLElement} cell - 单元格元素
   * @param {number} row - 行索引
   * @param {number} col - 列索引
   */
  createTriangles(cell, row, col) {
    if (!this.options.showTriangles) return;

    this.triangleSize = this.options.cellSize / 5;
    const center = this.options.cellSize / 2;
    const trianglePadding = 5;
    
    // 上三角形
    const upTriangle = document.createElement('div');
    upTriangle.id = `${this.id}-triangle-${row}-${col}-up`;
    upTriangle.style.position = 'absolute';
    upTriangle.style.left = `${center - this.triangleSize / 2}px`;
    upTriangle.style.top = `${trianglePadding}px`;
    upTriangle.style.width = '0';
    upTriangle.style.height = '0';
    upTriangle.style.borderLeft = `${this.triangleSize / 2}px solid transparent`;
    upTriangle.style.borderRight = `${this.triangleSize / 2}px solid transparent`;
    upTriangle.style.borderBottom = `${this.triangleSize / 2}px solid #e6e6e6`; // 更浅的灰色
    cell.appendChild(upTriangle);
    
    // 右三角形
    const rightTriangle = document.createElement('div');
    rightTriangle.id = `${this.id}-triangle-${row}-${col}-right`;
    rightTriangle.style.position = 'absolute';
    rightTriangle.style.right = `${trianglePadding}px`;
    rightTriangle.style.top = `${center - this.triangleSize / 2}px`;
    rightTriangle.style.width = '0';
    rightTriangle.style.height = '0';
    rightTriangle.style.borderTop = `${this.triangleSize / 2}px solid transparent`;
    rightTriangle.style.borderBottom = `${this.triangleSize / 2}px solid transparent`;
    rightTriangle.style.borderLeft = `${this.triangleSize / 2}px solid #e6e6e6`; // 更浅的灰色
    cell.appendChild(rightTriangle);
    
    // 下三角形
    const downTriangle = document.createElement('div');
    downTriangle.id = `${this.id}-triangle-${row}-${col}-down`;
    downTriangle.style.position = 'absolute';
    downTriangle.style.left = `${center - this.triangleSize / 2}px`;
    downTriangle.style.bottom = `${trianglePadding}px`;
    downTriangle.style.width = '0';
    downTriangle.style.height = '0';
    downTriangle.style.borderLeft = `${this.triangleSize / 2}px solid transparent`;
    downTriangle.style.borderRight = `${this.triangleSize / 2}px solid transparent`;
    downTriangle.style.borderTop = `${this.triangleSize / 2}px solid #e6e6e6`; // 更浅的灰色
    cell.appendChild(downTriangle);
    
    // 左三角形
    const leftTriangle = document.createElement('div');
    leftTriangle.id = `${this.id}-triangle-${row}-${col}-left`;
    leftTriangle.style.position = 'absolute';
    leftTriangle.style.left = `${trianglePadding}px`;
    leftTriangle.style.top = `${center - this.triangleSize / 2}px`;
    leftTriangle.style.width = '0';
    leftTriangle.style.height = '0';
    leftTriangle.style.borderTop = `${this.triangleSize / 2}px solid transparent`;
    leftTriangle.style.borderBottom = `${this.triangleSize / 2}px solid transparent`;
    leftTriangle.style.borderRight = `${this.triangleSize / 2}px solid #e6e6e6`; // 更浅的灰色
    cell.appendChild(leftTriangle);
  }
  
  /**
   * 设置奖励点
   * @param {Array<Array<number>>} positions - 奖励点位置数组，例如 [[1,2], [3,3]]
   * @param {number} value - 奖励值
   */
  setRewards(positions, value = 1) {
    this.rewards = positions.map(pos => ({ position: pos, value }));
    
    // 更新UI
    this.rewards.forEach(reward => {
      const [row, col] = reward.position;
      const cell = document.getElementById(`${this.id}-cell-${row}-${col}`);
      if (cell) {
        cell.style.backgroundColor = '#c7f9cc'; // 绿色背景表示奖励
        
        // 添加奖励值文本
        const valueText = document.createElement('div');
        valueText.style.position = 'absolute';
        valueText.style.right = '4px';
        valueText.style.bottom = '2px';
        valueText.style.fontSize = `${this.options.cellSize / 4}px`;
        valueText.style.fontWeight = 'bold';
        valueText.style.color = '#22577a';
        valueText.textContent = `+${reward.value}`;
        cell.appendChild(valueText);
      }
    });
  }
  
  /**
   * 设置惩罚点
   * @param {Array<Array<number>>} positions - 惩罚点位置数组，例如 [[1,1], [2,3]]
   * @param {number} value - 惩罚值（负数）
   */
  setPenalties(positions, value = -1) {
    this.penalties = positions.map(pos => ({ position: pos, value }));
    
    // 更新UI
    this.penalties.forEach(penalty => {
      const [row, col] = penalty.position;
      const cell = document.getElementById(`${this.id}-cell-${row}-${col}`);
      if (cell) {
        cell.style.backgroundColor = '#f49cbb'; // 红色背景表示惩罚
        
        // 添加惩罚值文本
        const valueText = document.createElement('div');
        valueText.style.position = 'absolute';
        valueText.style.right = '4px';
        valueText.style.bottom = '2px';
        valueText.style.fontSize = `${this.options.cellSize / 4}px`;
        valueText.style.fontWeight = 'bold';
        valueText.style.color = '#880d1e';
        valueText.textContent = penalty.value;
        cell.appendChild(valueText);
      }
    });
  }
  
  /**
   * 放置智能体
   */
  placeAgent() {
    const [row, col] = this.currentPosition;
    
    // 移除旧的智能体
    const oldAgent = document.getElementById(`${this.id}-agent`);
    if (oldAgent) {
      oldAgent.remove();
    }
    
    // 创建新的智能体
    const agent = document.createElement('div');
    agent.id = `${this.id}-agent`;
    agent.style.position = 'absolute';
    // 调整位置以适应更小的大小
    agent.style.left = `${col * this.options.cellSize + this.options.cellSize / 2}px`;
    agent.style.top = `${row * this.options.cellSize + this.options.cellSize / 2}px`;
    // 减小智能体大小
    agent.style.width = `${this.options.cellSize / 5}px`;
    agent.style.height = `${this.options.cellSize / 5}px`;
    agent.style.transform = 'translate(-50%, -50%)';
    agent.style.borderRadius = '50%';
    // 将颜色改为黑色
    agent.style.backgroundColor = '#000';
    agent.style.boxShadow = '0 0 3px rgba(0,0,0,0.3)';
    agent.style.zIndex = '10';
    
    this.container.appendChild(agent);
  }
  
  /**
   * 获取当前状态的奖励
   * @returns {number} 奖励值
   */
  getReward() {
    const [row, col] = this.currentPosition;
    
    // 检查是否在奖励点
    for (const reward of this.rewards) {
      const [r, c] = reward.position;
      if (r === row && c === col) {
        return reward.value;
      }
    }
    
    // 检查是否在惩罚点
    for (const penalty of this.penalties) {
      const [r, c] = penalty.position;
      if (r === row && c === col) {
        return penalty.value;
      }
    }
    
    // 默认奖励为小的负值，鼓励智能体尽快找到目标
    return -0.1;
  }
  
  /**
   * 检查当前状态是否为终止状态
   * @returns {boolean} 是否为终止状态
   */
  isTerminal() {
    const [row, col] = this.currentPosition;
    
    // 检查是否在奖励点或惩罚点
    for (const reward of this.rewards) {
      const [r, c] = reward.position;
      if (r === row && c === col) {
        return true;
      }
    }
    
    for (const penalty of this.penalties) {
      const [r, c] = penalty.position;
      if (r === row && c === col) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 重置环境
   * @param {Array<number>} startPosition - 起始位置，默认为[0,0]
   */
  reset(startPosition = [0, 0]) {
    this.currentPosition = startPosition;
    this.placeAgent();
    return this.currentPosition;
  }

  /**
   * 重置训练相关数据（Q表、探索率等）
   */
  resetTraining() {
    // 重置Q表
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        this.qTable[`${i},${j}`] = {
          up: 0,
          right: 0,
          down: 0,
          left: 0
        };
      }
    }
    
    // 重置探索率到初始值
    this.options.explorationRate = 0.1;
    
    // 更新三角形颜色
    this.updateTrianglesColor();
    
    return this.currentPosition;
  }
  
  /**
   * 执行动作
   * @param {string} action - 动作（'up', 'right', 'down', 'left'）
   * @returns {Object} 包含新状态、奖励和是否终止的对象
   */
  step(action) {
    const [row, col] = this.currentPosition;
    let newRow = row;
    let newCol = col;
    
    // 根据动作更新位置
    switch(action) {
      case 'up':
        newRow = Math.max(0, row - 1);
        break;
      case 'right':
        newCol = Math.min(this.size - 1, col + 1);
        break;
      case 'down':
        newRow = Math.min(this.size - 1, row + 1);
        break;
      case 'left':
        newCol = Math.max(0, col - 1);
        break;
    }
    
    // 更新当前位置
    this.currentPosition = [newRow, newCol];
    
    // 更新智能体位置
    this.placeAgent();
    
    // 获取奖励
    const reward = this.getReward();
    
    // 检查是否终止
    const done = this.isTerminal();
    
    return {
      state: this.currentPosition,
      reward,
      done
    };
  }
  
  /**
   * 根据Q值更新三角形颜色
   */
  updateTrianglesColor() {
    // 遍历所有状态
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const stateKey = `${i},${j}`;
        const qValues = this.qTable[stateKey];
        
        // 找出最大和最小Q值，用于归一化
        let maxQ = -Infinity;
        let minQ = Infinity;
        
        for (const action of this.actions) {
          maxQ = Math.max(maxQ, qValues[action]);
          minQ = Math.min(minQ, qValues[action]);
        }
        
        // 确保有范围差异，避免除以零
        const qRange = maxQ - minQ > 0 ? maxQ - minQ : 1;
        
        // 更新每个方向的三角形颜色
        this.actions.forEach(action => {
          const qValue = qValues[action];
          const triangleId = `${this.id}-triangle-${i}-${j}-${action}`;
          const triangle = document.getElementById(triangleId);
          
          if (triangle) {
            // 将Q值映射到颜色（从灰色到蓝色）
            // 使用相对于当前状态的最大最小值进行归一化
            const normalizedQ = (qValue - minQ) / qRange;
            const color = this.getColorForValue(normalizedQ);
            
            // 更新三角形颜色
            switch(action) {
              case 'up':
                triangle.style.borderBottom = `${this.triangleSize / 2}px solid ${color}`;
                break;
              case 'right':
                triangle.style.borderLeft = `${this.triangleSize / 2}px solid ${color}`;
                break;
              case 'down':
                triangle.style.borderTop = `${this.triangleSize / 2}px solid ${color}`;
                break;
              case 'left':
                triangle.style.borderRight = `${this.triangleSize / 2}px solid ${color}`;
                break;
            }
          }
        });
      }
    }
  }
  
  /**
   * 根据值获取颜色（从灰色到蓝色的渐变）
   * @param {number} value - 0到1之间的值
   * @returns {string} 颜色字符串
   */
  getColorForValue(value) {
    // 灰色到蓝色的渐变，起始灰色更浅 (230 -> 更浅的灰色)
    const r = Math.floor(230 - value * 179); // 230 -> 51
    const g = Math.floor(230 - value * 128); // 230 -> 102
    const b = Math.floor(230 + value * 25);  // 230 -> 255
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  /**
   * 选择动作（ε-贪心策略）
   * @param {Array<number>} state - 当前状态
   * @returns {string} 选择的动作
   */
  selectAction(state) {
    const stateKey = state.join(',');
    
    // 探索：以ε的概率随机选择动作
    if (Math.random() < this.options.explorationRate) {
      return this.actions[Math.floor(Math.random() * this.actions.length)];
    }
    
    // 利用：选择Q值最高的动作
    const qValues = this.qTable[stateKey];
    let bestAction = this.actions[0];
    let bestValue = qValues[bestAction];
    
    for (const action of this.actions) {
      if (qValues[action] > bestValue) {
        bestValue = qValues[action];
        bestAction = action;
      }
    }
    
    return bestAction;
  }
  
  /**
   * 更新Q值
   * @param {Array<number>} state - 当前状态
   * @param {string} action - 执行的动作
   * @param {number} reward - 获得的奖励
   * @param {Array<number>} nextState - 下一个状态
   * @param {boolean} done - 是否终止
   */
  updateQValue(state, action, reward, nextState, done) {
    const stateKey = state.join(',');
    const nextStateKey = nextState.join(',');
    
    // 当前状态-动作对的Q值
    const currentQ = this.qTable[stateKey][action];
    
    // 计算下一个状态的最大Q值
    let maxNextQ = 0;
    if (!done) {
      maxNextQ = Math.max(...Object.values(this.qTable[nextStateKey]));
    }
    
    // Q-learning更新公式: Q(s,a) = Q(s,a) + α * [r + γ * max(Q(s',a')) - Q(s,a)]
    const newQ = currentQ + this.options.learningRate * 
                (reward + this.options.discountFactor * maxNextQ - currentQ);
    
    // 更新Q表
    this.qTable[stateKey][action] = newQ;
    
    // 更新UI
    this.updateTrianglesColor();
  }
  
  /**
   * 执行一步Q学习
   * @returns {Object} 包含状态、动作、奖励、下一状态和是否终止的对象
   */
  qLearnStep() {
    // 当前状态
    const state = [...this.currentPosition];
    
    // 选择动作
    const action = this.selectAction(state);
    
    // 执行动作
    const { state: nextState, reward, done } = this.step(action);
    
    // 更新Q值
    this.updateQValue(state, action, reward, nextState, done);
    
    return { state, action, reward, nextState, done };
  }
  
  /**
   * 训练Q学习智能体
   * @param {number} episodes - 训练回合数
   * @param {number} maxSteps - 每回合最大步数
   * @param {Function} callback - 每步回调函数
   */
  /**
   * 显示路径
   * @param {Array<Array<number>>} path - 路径坐标数组，如 [[0,0], [0,1], [1,1]]
   */
  showPath(path) {
    // 移除旧的路径
    const oldPath = document.getElementById(`${this.id}-grid-path`);
    if (oldPath) {
      oldPath.remove();
    }

    // 创建路径容器
    const pathElement = document.createElement('div');
    pathElement.id = 'grid-path';
    pathElement.style.position = 'absolute';
    pathElement.style.top = '0';
    pathElement.style.left = '0';
    pathElement.style.width = '100%';
    pathElement.style.height = '100%';
    pathElement.style.pointerEvents = 'none'; // 防止路径阻挡点击

    // 创建SVG路径
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    
    const pathLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathLine.setAttribute('stroke', this.options.pathColor);
    pathLine.setAttribute('stroke-width', this.options.pathWidth);
    pathLine.setAttribute('fill', 'none');
    pathLine.setAttribute('stroke-linecap', 'round');
    pathLine.setAttribute('stroke-linejoin', 'round');

    // 构建路径数据
    let pathData = '';
    path.forEach(([row, col], index) => {
      const x = col * this.options.cellSize + this.options.cellSize / 2;
      const y = row * this.options.cellSize + this.options.cellSize / 2;
      
      if (index === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
    });

    pathLine.setAttribute('d', pathData);
    svg.appendChild(pathLine);
    pathElement.appendChild(svg);
    this.container.appendChild(pathElement);
  }

  /**
   * 在指定单元格右下角显示文本
   * @param {Array<number>} position - 单元格坐标 [row, col]
   * @param {string} text - 要显示的文本
   */
  showText(position, text) {
    const [row, col] = position;
    const cellId = `${this.id}-cell-${row}-${col}`;
    const cell = document.getElementById(cellId);
    
    if (!cell) return;

    // 移除旧的文本元素
    const oldText = document.getElementById(`${this.id}-text-${row}-${col}`);
    if (oldText) {
      oldText.remove();
    }

    // 创建新的文本元素
    const textElement = document.createElement('div');
    textElement.id = `${this.id}-text-${row}-${col}`;
    textElement.style.position = 'absolute';
    textElement.style.right = '5px';
    textElement.style.bottom = '5px';
    textElement.style.fontSize = `${this.options.textSize}px`;
    textElement.style.color = this.options.textColor;
    textElement.style.fontFamily = 'Arial, sans-serif';
    textElement.style.whiteSpace = 'pre-line';
    textElement.textContent = text;

    cell.appendChild(textElement);
  }

  async train(episodes = 100, maxSteps = 100, callback = null) {
    for (let episode = 0; episode < episodes; episode++) {
      // 重置环境
      this.reset();
      
      for (let step = 0; step < maxSteps; step++) {
        // 执行一步Q学习
        const result = this.qLearnStep();
        
        // 确保每步都更新三角形颜色
        this.updateTrianglesColor();
        
        // 如果有回调函数，调用它
        if (callback) {
          callback(episode, step, result);
        }
        
        // 如果到达终止状态，结束当前回合
        if (result.done) {
          break;
        }
        
        // 添加延迟以便观察
        // await new Promise(resolve => setTimeout(resolve, 200));
        await new Promise(resolve => setTimeout(resolve, 2));
      }
      
      // 每个回合结束后也更新一次颜色
      this.updateTrianglesColor();
    }
  }
}