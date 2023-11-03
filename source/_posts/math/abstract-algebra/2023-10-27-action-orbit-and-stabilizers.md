---
layout: post
title: Abstract Algebra - Action, Orbit and Stabilizers
date: 2020-10-27
toc: true
categories:
    - Math
tags:
    - 数学
    - 群论
    - 抽象代数
    - 总结
---

# Action

An action of a group $G$ on a set $X$ is a homomorphism from $G$ to $S_X$.

<aside>
💡 We imagine the elements of $G$ permuting the points of $X$ in a way that is **compatible with the algebraic structure of $G$**.

</aside>

# Orbit

Given an action of $G$ on $X$ and a point $x \in X$, the set of all images $g(x)$, as $g$ varies through $G$, is called the orbit of $x$ and written $G(x)$.

# Stabilizer

If $x$ is a point of $X$, the elements of $G$ which leave $x$ fixed form a subgroup of $G$ called the stabilizer $G_x$ of $x$.

# Some examples

## Example 1

The infinite cyclic group $\mathbb{Z}$ acts on the real line by translation. The integer $n \in \mathbb{Z}$ sends the real number $x$ to $n + x$. If $m$ and $n$ are integers, then

$$
(m + n) + x = m + (n + x)
$$

This is an action. The orbit of $x$ consists of all translates $n + x$ where $n \in \mathbb{Z}$. The stabilizer is $\{0\}$ since $0+x = x$ for all $x \in \mathbb{R}$.

## Example 2

Let $n \in \mathbb{Z}$ sends $x \in \mathbb{R}$ to $(-1)^nx$. The permutation associated to every even integer is the identity permutation of $\mathbb{R}$, and that associated to all the odd integers is $x \to -x$. Since $(-1)^{m + n} = (-1)^m(-1)^n$ for every two integers $m$ and $n$. The orbit of $x$ is just $\{-x, x \}$ where $x \neq 0$, otherwise is $\{0\}$. The stabilizer is $2\mathbb{Z}$ if $x \neq 0$ and $\mathbb{Z}$ when $x = 0$.

So this is also an action.

<aside>
💡 We can see from the above examples that a same group $(\mathbb{Z}, +)$ can **action** on a set $X$ in different ways.

</aside>

# Theorems

## Theorem 1

Points in the same orbit have conjugate stabilizers.

<aside>
💡 Suppose $x$ and $y$ belong to the same orbit, say $g(x) = y$, then we have $gG_xg^{-1} = G_y$.

</aside>

## Orbit-Stabilizer Theorem

For each $x \in X$, the correspondence $g(x) \to gG_x$ is a bijection between $G(x)$ and the set of let cosets of $G_x$ in $G$.

$$
G(x) \cong G/G_x
$$

<aside>
💡 Consider the similarity between the Orbit-Stabilizer Theorem and the Fundemental Homomorphism Theorem.

</aside>

## Theorem 2

If $G$ is finite, the size of each orbit is a divisor of the order of $G$.

$$
|G(x)| = |G|/|G_x|
$$

## The Counting Theorem

Suppose we have an action of a finite group $G$ on a set $X$. Write $X^g$ for the subset of $X$ consisting of those points which are left fixed by the element $g$ of $G$. The number of distinct orbits, denoted by $|X/G|$, is
