---
layout: post
title: AI学习时间 11 - Q学习
date: 2025-06-11
categories:
    - AI
tags:
    - AI
    - 学习
    - 强化学习
    - Q学习
---

<script src="/assets/lib/girdworld.js" /></script>

<div class="theme-color-blue" markdown=1>
`#强化学习` `#Q学习`
</div>

# 复习

- **强化学习四要素**
    - **智能体**：是强化学习的核心，它可以根据当前的环境状态，选择最优的行动。
    - **环境**：是智能体的外部世界，它可以提供奖励信号，也可以提供惩罚信号。
    - **状态**：是环境的一个快照，它可以用来描述当前的环境状态。
    - **动作**：是智能体的一个决策，它可以改变环境的状态。
- **价值函数**：可以将状态，或者动作映射为一个数值（价值）。
- **选择策略**：可以根据价值函数计算出来的价值，通过 **探索** 或者 **利用** 来选择一个动作。

# Q 函数

## 未来加权收益

上次提到 **状态价值函数**，以及 **动作价值函数**，都可以被称为 Q 函数。Q 是 Quality 的缩写，代表当前状态，或者在当前状态下执行一个动作的 **质量**。Q 函数是强化学习中常用的一种价值函数，它可以将状态和动作映射为一个数值（价值）。

Q 函数通过衡量未来的加权收益，来衡量当前状态或者动作的好坏。回到我们熟悉的加权平均，可以看如下公式：

$$
Q(s, a) = w_1 R_1 + w_2 R_2 + \dots + w_t R_t = \sum_{i=1}^t w_i R_i
$$

这个加权平均公式是一个通用的公式，在每一步都有不同收益的时候可以这样使用。但对于一些奖励很稀疏的场景，比如下棋，只有下到最后才会有一个收益，那么在当前时刻到最后之间的每一步，则会采用一个固定的折扣因子来衰减未来的收益。

$$
Q(s, a) = R + \gamma R + \gamma^2 R + \dots + \gamma^{t-1} R
$$

其中 $\gamma$ 是折扣因子，$R$ 是最后的收益。

而期望值本身是一个加权平均，所以上面的加权平均可以简写为 $Q(s, a) = \mathbb{E}[R | \pi, s, a]$，其中 $\pi$ 代表策略，$s$ 代表状态，$a$ 代表动作。这个简洁的表示可以理解为 **当前的智能体策略为 $\pi$，当前状态 $s$ 下执行动作 $a$ 后，得到奖励 $R$ 的期望**。

$$
Q(s, a) = \mathbb{E}[R_{t+1} + \gamma R_{t+2} + \cdots | S_t = s, A_t = a]
$$

其中，$R_{t+1}$ 是智能体在状态 $s$ 采取动作 $a$ 后得到的奖励，$\gamma$ 是折扣因子，它可以用来平衡未来奖励和当前奖励的重要性。

## 改进的 Q 函数

原始的 Q 函数用来衡量状态或者动作的价值，是将状态和动作映射为一个值。

```mermaid
graph LR
    S[状态s] --> Q["Q(s, a)"]
    A[动作a] --> Q["Q(s, a)"]
    Q --->|计算出一个值| V["比如 0.9"]
```

使用中我们需要为每个动作计算一个 Q 值，然后再进行决策。比如在 GridWorld 里，有上下左右四个动作。

```ts
upQ = getQ(state, ACTION.UP)
leftQ = getQ(state, ACTION.LEFT)
rightQ = getQ(state, ACTION.RIGHT)
downQ = getQ(state, ACTION.DOWN)
```

但后面我们会知道，计算一个 Q 值消耗是很大的，如果使用深度学习，Q 值需要使用神经网络进行计算，计算量巨大，如果我们可选动作非常多，那么在某一个状态下，需要计算非常多的 Q 值。一个更为合理的改进版是，使用 Q 函数一次过计算所有动作的 Q 值，也就是计算当前状态下所有动作的 Q 值分布。

```mermaid
graph LR
    S[状态s] --> Q["Q'(s)"]
    Q --->|计算出一个分布| V["0.1<br>0.9<br>-0.2<br>-0.7<br>"]
```

这样在使用中我们可以根据当前状态一次过计算所有的 Q 值，减少了计算量，同时也很符合直觉。

```ts
actionsQ = getActionsQ(state)
```

一旦有了这些 Q 值，我们就可以采用上次提到的 **$\varepsilon$-贪心策略** 来进行决策。

```mermaid
graph LR
    S[状态s] --> Q["Q'(s)"]
    Q --->|预测| V["0.1<br>0.9<br>-0.2<br>-0.7"]
    V --->|以概率 p 执行| Random[随机动作]
    V --->|以概率 1 - p 执行| Best[最优动作]
```

# Q 学习

**Q 学习**是一种强化学习的方法，它可以通过与环境的交互来学习如何采取行动，从而最大化预期的累积奖励。在 Q 学习中，智能体通过观察环境的状态并采取行动来影响环境的状态转移和奖励。目标是让智能体在与环境的交互中逐渐学习到一个最优的策略，使得累积奖励最大化。

## Q 值的更新

在学习的过程中，Q 学习使用 Q 函数来估计当前状态下执行每个动作的价值，然后根据这个价值来选择最优的动作。

$$
\overbrace{Q(S_t, A_t)}^\text{更新的 Q 值} 
= 
\overbrace{Q(S_t, A_t)}^\text{当前的 Q 值} +
\alpha[
\underbrace{R_{t+1}}_\text{奖励} + 
\gamma \underbrace{\max Q(S_{t+1}, a)}_\text{所有动作里的最大 Q 值} -
Q(S_t, A_t)
]
$$

其中 $\alpha$ 是学习率，$\gamma$ 是折扣因子。

要理解这个公式，可以简单将 Q 值看成是一个巨大的表格，而查表则通过状态与动作进行。整个学习过程，就是对这个表的更新的过程，而更新的依据是奖励以及下一个状态的最大 Q 值。在 GridWorld 例子里，每个状态下有四个动作可以执行，上下左右，公式里的 $\max Q(S_{t+1}, a)$ 就是下一个状态下所有动作里的最大 Q 值。也就是从

$$
\begin{align*}
Q(S_{t+1}, A_\text{上}) \\
Q(S_{t+1}, A_\text{下}) \\
Q(S_{t+1}, A_\text{左}) \\
Q(S_{t+1}, A_\text{右}) \\
\end{align*}
$$

中选出最大的 Q 值。也就是说，如果当前状态下往上走，能达到下一个最大值，那就增大往上走的概率。另外关注公式里的 $R_{t+1}$，这个值代表下一步的奖励，这个是折扣奖励。如果这个值是正的，那证明下一步会导向一个更好的结果，所以整体会增加 Q 值。如果这个值是负的，那证明下一步会导向一个更坏的结果，所以整体会减小 Q 值。

通过下面代码可能可以更简单地加深理解。

```ts
const updateQValue = (state, action, reward, nextState) => {
    // 当前状态的 Q 值
    const currentQ = this.qTable[state][action];

    // 计算下一个状态的最大Q值
    let maxNextQ = 0;
    if (!done) {
        maxNextQ = Math.max(...Object.values(this.qTable[nextState]));
    }
    
    // 更新公式: Q(s,a) = Q(s,a) + α * [r + γ * max(Q(s',a')) - Q(s,a)]
    const newQ = currentQ + learningRate * 
                (reward + discountFactor * maxNextQ - currentQ);
    
    // 更新 Q 表
    this.qTable[state][action] = newQ;
}
```

## 训练过程

训练过程就是让智能体自由探索，不断更新 Q 值的过程。在每一个探索循环中：

1. 获取当前状态
2. 选择一个动作
3. 执行动作
4. 更新 Q 值

下面的伪代码展示了每一步需要做的事情。

```ts
step() {
    // 当前状态
    const state = this.getState();
  
    // 选择动作
    const action = this.selectAction(state);
  
    // 执行动作
    const { state: nextState, reward, done } = this.step(action);
  
    // 更新Q值
    this.updateQValue(state, action, reward, nextState, done);
  
    return { state, action, reward, nextState, done };
}
```

终止条件有两个

1. 到达奖励点，或者惩罚点
2. Q 值已经够好了

对于第一点来说很容易判断，因为那是游戏规则，只要判断智能体在目的地了，就可以结束“当前一个循环”，而将智能体至于起点，重新开始。这个属于小循环结束的终止条件。

但对于第二点来说，Q 值何为之“够好”呢？在 GridWorld 例子里，我们的 Q 值实际上是存放在一个巨大的表里的，由于 GridWorld 是一个有限的世界，路径其实也是可以枚举的，所以我们可以知道在这个世界里，是有一个最优的解的，而尝试并不会使策略停留在一个“局部最优”的状态，因为在局部最优的时候，依然存在朝向最优解的方向，所以到达最优解之后，不能再进一步优化了。所以结束条件是 Q 值表没有发生任何变化了。

```ts
async train(episodes = 100, maxSteps = 100, callback = null) {
  for (let episode = 0; episode < episodes; episode++) {
      // 重置环境
      this.reset();
    
      for (let step = 0; step < maxSteps; step++) {
          // 获取当前 Q 值表
          const qTable = this.getQTable();
        
          // 执行一步Q学习
          const result = this.step();
        
          // 如果到达终止状态，结束当前回合
          if (result.done) {
            break;
          }
        
          // 获取更新后的 Q 值表
          const updatedQTable = this.getQTable();

          // 检查 Q 值表是否发生变化
          if (diff(qTable, updatedQTable) < EPSILON) {
              // Q 值表没有发生变化，结束当前回合
              break;
          }
      }
  }
}
```

# GridWorld 例子

<div id="gridworld" style="width: 400px; height: 400px;"></div>
<div id="step-button">step</div>
<div id="train-button">train</div>

<script src="/assets/lib/gridworld.js"></script>
<script>
  // 创建GridWorld实例
  const container = document.getElementById('gridworld');
  const gridworld = new GridWorld(container, 6);
  
  // 设置奖励点和惩罚点
  gridworld.setRewards([[5, 5]], 1);  // 两个奖励点，值为1
  gridworld.setPenalties([[1, 1], [2, 2], [5, 0], [2, 4]], -1); // 两个惩罚点，值为-1
  
  // 执行一步Q学习
  document.getElementById('step-button').addEventListener('click', () => {
    const result = gridworld.qLearnStep();
    console.log(result);
  });
  
  // 或者自动训练
  document.getElementById('train-button').addEventListener('click', async () => {
    await gridworld.train(500, 20, (episode, step, result) => {
      console.log(`Episode ${episode}, Step ${step}:`, result);
    });
  });
</script>