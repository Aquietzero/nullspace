---
layout: post
title: 'Modeling reinforcement learning problems: Markov decision processes'
date: 2023-10-28
categories:
    - Reading
tags:
    - 深度学习
    - 强化学习
    - 人工智能
---

# Policy

A **policy** is a function that maps a state to a probability distribution over the set of possible actions in that state.

$$
\pi: s \to P(A | s), s \in S
$$

$P(A|s)$ is a probability distribution over the set of actions $A$, given state $s$.

# Optimal Policy

The **optimal policy** is the strategy that maximizes rewards.

$$
\pi*: \arg\max E(R | \pi)
$$

If we know the expected reward for following any possible policy $\pi$, the optimal policy $\pi*$ is a policy that produces the maximum possible rewards.

The whole goal of a reinforcement learning algorithm is to choose the actions that lead to the maximal expected rewards. But there are two ways we can train our agent to do this:

- Directly —— We can teach the agent to learn what actions are best, given what state it is in.
- Indirectly —— We can teach the agent to learn which states are most valuable, and then to take actions that leads us to the idea of value functions.

# Value functions

**Value functions** are functions that map a state or a state-action pair to the **expected value** (the expected reward) of being in some state or taking some action in some state.

$$
V_\pi: s \to E(R|s, \pi)
$$

The policy is what determines observed rewards, and the value function is a reflection of observed rewards.

# Q function

Q function is a type of value functions, which adds action into consideration.

$$
Q_\pi: (s|a) \to E(R|s, a, \pi)
$$

# Summary

- State spaces are the set of all possible states a system can be in. In Chess, this would be the set of all valid board configurations. An action is a function that maps a state, $s$, to a new state, $s'$. An action may be stochastic, such that it maps a state, $s$, probabilistically to a new state, $s'$. There may be some probability distribution over the set of possible new states from which one is selected. The action-space is the set of all possible actions for a particular state.
- The environment is the source of states, actions, and rewards. If we’re building an RL algorithm to play a game, then the game is the environment. A model of an environment is an approximation of the state space, action space, and transition probabilities.
- Rewards are signals produced by the environment that indicate the relative success of taking an action in a given state. An expected reward is a statistical concept that informally refers to the long-term average value of some random variable $X$ **(in our case, the reward), denoted $E[X]$. For example, in the *n-*armed bandit case, $E[R|a]$ (the expected reward given action $a$) is the long-term average reward of taking each of the *n* actions. If we knew the probability distribution over the actions, $a$, then we could calculate the precise value of the expected reward for a game of $N$ **plays as $E[R|a_i] = \sum^N_{i=1} a_i p_i \cdot r$, where $N$ **is the number of plays of the game, $p_i$ **refers to the probability of action $a_i$, and $r$ **refers to the maximum possible reward.
- An agent is an RL algorithm that learns to behave optimally in a given environment. Agents are often implemented as a deep neural network. The goal of the agent is to maximize expected rewards, or equivalently, to navigate to the highest value state.
- A policy is a particular strategy. Formally, it’s a function that either accepts a state and produces an action to take or produces a probability distribution over the action space, given the state. A common policy is the epsilon-greedy strategy, where with probability $\varepsilon$ we take a random action in the action space, and with probability $\varepsilon - 1$ we choose the best action we know of so far.
- In general, a value function is any function that returns expected rewards given some relevant data. Without additional context, it typically refers to a state-value function, which is a function that accepts a state and returns the expected reward of starting in that state and acting according to some policy. The Q value is the expected reward given a state-action pair, and the Q function is a function that produces Q values when given a state-action pair.
- The Markov decision process is a decision-making process by which it is possible to make the best decisions without reference to a history of prior states.