/**
 * 深度Q学习智能体
 */
class DeepQLearner {
  /**
   * 构造函数
   * @param {Object} env - 环境对象(必须实现step/reset等方法)
   * @param {Object} options - 配置选项
   */
  constructor(env, options = {}) {
    this.env = env;
    this.options = Object.assign({
      learningRate: 0.001,     // 学习率
      discountFactor: 0.95,    // 折扣因子
      explorationRate: 1.0,    // 初始探索率
      explorationMin: 0.01,    // 最小探索率
      explorationDecay: 0.995, // 探索率衰减率
      batchSize: 32,           // 批量大小
      memorySize: 10000,       // 经验回放缓冲区大小
      updateTargetEvery: 10    // 更新目标网络的频率
    }, options);
    
    // 经验回放缓冲区
    this.memory = [];
    
    // 训练计数器
    this.stepCount = 0;
    
    // 初始化网络
    this.initNetworks();
  }
  
  /**
   * 初始化神经网络
   */
  initNetworks() {
    // 主网络(用于预测)
    this.mainNetwork = this.buildNetwork();
    // 目标网络(用于稳定训练)
    this.targetNetwork = this.buildNetwork();
    // 同步目标网络
    this.updateTargetNetwork();
  }
  
  /**
   * 构建神经网络模型
   */
  buildNetwork() {
    // 这里使用简化的全连接网络
    // 实际应用中可以使用更复杂的结构
    return {
      // 输入层到隐藏层1 (2 -> 64)
      weights1: this.initWeights(2, 64),
      bias1: new Array(64).fill(0),
      // 隐藏层1到隐藏层2 (64 -> 32)
      weights2: this.initWeights(64, 32),
      bias2: new Array(32).fill(0),
      // 隐藏层2到输出层 (32 -> 4)
      weights3: this.initWeights(32, 4),
      bias3: new Array(4).fill(0)
    };
  }
  
  /**
   * 初始化权重
   */
  initWeights(inputSize, outputSize) {
    const weights = [];
    for (let i = 0; i < inputSize; i++) {
      weights[i] = [];
      for (let j = 0; j < outputSize; j++) {
        weights[i][j] = Math.random() * 0.2 - 0.1; // 小随机数
      }
    }
    return weights;
  }
  
  /**
   * 前向传播
   */
  forward(network, state) {
    // 输入层(归一化状态)
    const input = state.map(x => x / this.env.size);
    
    // 隐藏层1
    const hidden1 = new Array(network.weights1[0].length).fill(0);
    for (let i = 0; i < network.weights1.length; i++) {
      for (let j = 0; j < network.weights1[i].length; j++) {
        hidden1[j] += input[i] * network.weights1[i][j];
      }
      hidden1[j] += network.bias1[j];
      hidden1[j] = this.relu(hidden1[j]);
    }
    
    // 隐藏层2
    const hidden2 = new Array(network.weights2[0].length).fill(0);
    for (let i = 0; i < network.weights2.length; i++) {
      for (let j = 0; j < network.weights2[i].length; j++) {
        hidden2[j] += hidden1[i] * network.weights2[i][j];
      }
      hidden2[j] += network.bias2[j];
      hidden2[j] = this.relu(hidden2[j]);
    }
    
    // 输出层
    const output = new Array(network.weights3[0].length).fill(0);
    for (let i = 0; i < network.weights3.length; i++) {
      for (let j = 0; j < network.weights3[i].length; j++) {
        output[j] += hidden2[i] * network.weights3[i][j];
      }
      output[j] += network.bias3[j];
    }
    
    return output;
  }
  
  /**
   * ReLU激活函数
   */
  relu(x) {
    return Math.max(0, x);
  }
  
  /**
   * 选择动作(ε-贪心策略)
   */
  selectAction(state) {
    // 探索
    if (Math.random() < this.options.explorationRate) {
      return this.env.actions[Math.floor(Math.random() * this.env.actions.length)];
    }
    
    // 利用
    const qValues = this.forward(this.mainNetwork, state);
    const bestActionIndex = qValues.indexOf(Math.max(...qValues));
    return this.env.actions[bestActionIndex];
  }
  
  /**
   * 存储经验
   */
  storeExperience(state, action, reward, nextState, done) {
    this.memory.push({ state, action, reward, nextState, done });
    if (this.memory.length > this.options.memorySize) {
      this.memory.shift();
    }
  }
  
  /**
   * 从经验回放中采样
   */
  sampleBatch(batchSize) {
    const batch = [];
    for (let i = 0; i < batchSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.memory.length);
      batch.push(this.memory[randomIndex]);
    }
    return batch;
  }
  
  /**
   * 训练一个批次
   */
  trainBatch(batchSize) {
    if (this.memory.length < batchSize) return;
    
    const batch = this.sampleBatch(batchSize);
    
    for (const experience of batch) {
      const { state, action, reward, nextState, done } = experience;
      const actionIndex = this.env.actions.indexOf(action);
      
      // 计算目标Q值
      let targetQ = reward;
      if (!done) {
        const nextQValues = this.forward(this.targetNetwork, nextState);
        targetQ += this.options.discountFactor * Math.max(...nextQValues);
      }
      
      // 计算当前Q值
      const currentQValues = this.forward(this.mainNetwork, state);
      
      // 计算损失
      const loss = targetQ - currentQValues[actionIndex];
      
      // 反向传播更新权重(简化版)
      this.updateWeights(state, actionIndex, loss);
    }
  }
  
  /**
   * 更新权重(简化版反向传播)
   */
  updateWeights(state, actionIndex, loss) {
    const learningRate = this.options.learningRate;
    
    // 更新输出层权重
    for (let i = 0; i < this.mainNetwork.weights3.length; i++) {
      this.mainNetwork.weights3[i][actionIndex] += learningRate * loss;
    }
    this.mainNetwork.bias3[actionIndex] += learningRate * loss;
  }
  
  /**
   * 更新目标网络
   */
  updateTargetNetwork() {
    this.targetNetwork = JSON.parse(JSON.stringify(this.mainNetwork));
  }
  
  /**
   * 训练智能体
   */
  async train(episodes = 100, maxSteps = 100, callback = null) {
    // 记录历史奖励用于计算平均
    const episodeRewards = [];
    
    // 打印训练开始信息
    console.log(`开始训练，共${episodes}回合，每回合最多${maxSteps}步`);
    console.log('初始探索率:', this.options.explorationRate);
    
    for (let episode = 0; episode < episodes; episode++) {
      // 重置环境
      let state = this.env.reset();
      let totalReward = 0;
      
      // 每10回合打印一次表头
      if (episode % 10 === 0) {
        console.log('回合\t探索率\t总奖励\t平均奖励\t最大奖励\t最小奖励');
      }
      
      // 打印训练进度头信息(每10回合打印一次)
      if (episode % 10 === 0) {
        console.log('回合\t探索率\t平均奖励\t最大奖励\t最小奖励');
      }
      
      for (let step = 0; step < maxSteps; step++) {
        this.stepCount++;
        
        // 选择动作
        const action = this.selectAction(state);
        
        // 执行动作
        const { state: nextState, reward, done } = this.env.step(action);
        totalReward += reward;
        
        // 存储经验
        this.storeExperience(state, action, reward, nextState, done);
        
        // 训练网络
        this.trainBatch(this.options.batchSize);
        
        // 定期更新目标网络
        if (this.stepCount % this.options.updateTargetEvery === 0) {
          this.updateTargetNetwork();
        }
        
        // 如果有回调函数，调用它
        if (callback) {
          callback(episode, step, { state, action, reward, nextState, done, totalReward });
        }
        
        // 转移到下一个状态
        state = nextState;
        
        // 如果到达终止状态，结束当前回合
        if (done) break;
        
        // 添加延迟以便观察
        await new Promise(resolve => setTimeout(resolve, 2));
      }
      
      // 记录本轮奖励
      episodeRewards.push(totalReward);
      
      // 衰减探索率
      this.options.explorationRate = Math.max(
        this.options.explorationMin,
        this.options.explorationRate * this.options.explorationDecay
      );
      
      // 每回合结束后打印进度
      const avgReward = episodeRewards.reduce((a, b) => a + b, 0) / episodeRewards.length;
      const maxReward = Math.max(...episodeRewards);
      const minReward = Math.min(...episodeRewards);
      
      console.log(
        `${episode}\t${this.options.explorationRate.toFixed(4)}\t` +
        `${avgReward.toFixed(2)}\t${maxReward}\t${minReward}`
      );
    }
    
    // 训练结束后打印总结
    const finalAvg = episodeRewards.reduce((a, b) => a + b, 0) / episodeRewards.length;
    console.log(`训练完成！平均奖励: ${finalAvg.toFixed(2)}`);
  }
  
  /**
   * 获取动作值
   */
  getActionValues(state) {
    const qValues = this.forward(this.mainNetwork, state);
    return {
      up: qValues[0],
      right: qValues[1],
      down: qValues[2],
      left: qValues[3]
    };
  }

  /**
   * 序列化智能体状态
   */
  serialize() {
    return {
      mainNetwork: this.mainNetwork,
      options: this.options
    };
  }

  /**
   * 反序列化智能体状态
   */
  deserialize(data) {
    this.mainNetwork = data.mainNetwork;
    this.options = data.options;
    this.updateTargetNetwork();
  }

  /**
   * 在随机环境中测试智能体
   * @param {number} testCount - 测试环境数量
   * @param {number} maxSteps - 每环境最大步数
   * @param {Function} envGenerator - 环境生成函数
   */
  async test(testCount = 100, maxSteps = 100, envGenerator = null) {
    let successCount = 0;
    let totalReward = 0;

    for (let i = 0; i < testCount; i++) {
      // 生成随机环境
      const env = envGenerator ? envGenerator() : this.generateRandomEnv();
      
      // 重置环境
      let state = env.reset();
      let episodeReward = 0;
      let done = false;

      for (let step = 0; step < maxSteps && !done; step++) {
        // 选择动作(完全利用，不探索)
        const action = this.selectAction(state);
        
        // 执行动作
        const { state: nextState, reward, done: isDone } = env.step(action);
        
        episodeReward += reward;
        done = isDone;
        state = nextState;
      }

      // 统计成功次数(奖励大于0视为成功)
      if (episodeReward > 0) {
        successCount++;
      }
      totalReward += episodeReward;
    }

    return {
      successRate: successCount / testCount,
      averageReward: totalReward / testCount
    };
  }

  /**
   * 生成随机环境(默认实现)
   */
  generateRandomEnv() {
    const size = this.env.size;
    const newEnv = new GridWorld('test-env', this.env.container, size);
    
    // 随机设置奖励点(1个)
    const rewardPos = [
      Math.floor(Math.random() * size),
      Math.floor(Math.random() * size)
    ];
    newEnv.setRewards([rewardPos], 10);
    
    // 随机设置惩罚点(1-3个)
    const penaltyCount = 1 + Math.floor(Math.random() * 3);
    const penalties = [];
    for (let i = 0; i < penaltyCount; i++) {
      let pos;
      do {
        pos = [
          Math.floor(Math.random() * size),
          Math.floor(Math.random() * size)
        ];
      } while (pos[0] === rewardPos[0] && pos[1] === rewardPos[1]);
      penalties.push(pos);
    }
    newEnv.setPenalties(penalties, -5);
    
    return newEnv;
  }
}
