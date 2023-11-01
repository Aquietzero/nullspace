---
layout: post
title: Abstract Algebra - Functions
date: 2020-09-25
toc: true
categories:
    - Math
tags:
    - 数学
    - 群论
    - 抽象代数
    - 总结
---

# Function

## Classes of Functions

### Injective

A function $f:A \to B$ is called **injective** if each element of $B$ is the image of no more than one element of $A$. (单射)

### Surjective

A function $f: A \to B$ is called **surjective** if each element of $B$ is the image of at least one element of $A$. (满射)

### Bijective

A function $f: A \to B$ is called **bijective** if it is both injective and surjective, which defines a one to one mapping between $A$ and $B$.

### Inverse

A function $f:A \to B$ has an inverse if and only if it is a bijective.

# Permutation

A bijective function $f$ from $A \to A$ is called a **permutaion** of a set $A$.

## Groups of permutation

All the permutation of $A$, which the operation $\circ$ of composition, is a group, where

1. The identity is $\varepsilon$, where $\varepsilon(x) = x, \forall \ x \in A$ .
2. The inverse is $f^{-1}$ which satisfies $[f \circ f^{-1}](x) = \varepsilon(x)$.

# Isomorphism

Let $G_1$ and $G_2$ be groups. A bijective function $f: G_1 \to G_2$ with the property that for any two elements $a$ and $b$ in $G_1$ that $f(ab) = f(a)f(b)$ is called an isomorphism from $G_1$ to $G_2$.

<aside>
💡 If there exists such an isomorphism $f$, then we call $G_1$ is isomorphic to $G_2$, which is symbolized as $G_1 \cong G_2$.

</aside>

The logic behind the concise notation above is that $f$ is bijective from $G_1$ to $G_2$. For $a$ and $b$ in $G_1$, $f$ maps $a$ to $a'$ in $G_2$ and also $b$. More importantly, in this context a same operation is discussed on $G_1$ and $G_2$, so $f(ab)$ maps $ab$ uniquely to $a'b'$ in $G_2$ since

$$
f(ab) = a'b' = f(a)f(b)
$$

And another pre-requisite which needs to pay attention is that $G_1$ and $G_2$ are groups.

<aside>
💡 Another attention have to be paid is that the operation on $G_1$ and $G_2$ can be different.

</aside>

## Cayley's Theorem

Every group is isomorphic to a group of permutations.

## How to recognize isomorphism

1. Make an educated guess, and come up with a function $f: G_1 \to G_2$ which looks as though it might be an isomorphism.
2. Check that $f$ is bijective.
3. Check that $f$ satisfies the identity $f(ab) = f(a)f(b)$.

## Automorphism

By an automorphism (自同构，自守)  of $G$ we mean an isomorphism $f:G \to G$.

# Partition And Equivalence Relations

## Partition

By a partition of a set $A$ we mean a family $\{ A_i: i \in I \}$ of nonempty subsets of $A$ such that

- If any two classes, say $A_i$ and $A_j$, have a common element $x$ (that is, are not distinct), then $A_i = A_j$.
- Every element $x$ of $A$ lies in one of the classes.

## Equivalence Relation

By an equivalence relation on a set $A$ we mean a relation $\backsim$ which is

- Reflexive: $x \backsim x$ for every $x \in A$.
- Symmetric: if $x \backsim y$, then $y \backsim x$.
- Transitive: if $x \backsim y$ and $y \backsim z$, then $x \backsim z$.

## Equivalence Class

Let $\backsim$ be an equivalence relation on $A$ and $x$ an element of $A$. The set of all the elements equivalent to $x$ is called the equivalence class of $x$, and it's denoted by $[x]$. That is

$$
[x] = \{ y \in A: y \backsim x\}
$$

# Homomorphism

## Homomorphism for Groups

If $G$ and $H$ are groups, a homomorphism from $G$ to $H$ is a function: $f: G \to H$ such that for any two elements $a$ and $b$ in $G$,

$$
f(ab) = f(a)f(b)
$$

<aside>
💡 If there exists a homomorphism from $G$ **onto** $H$, we say that $H$ is a **homomorphic image** of $G$.

</aside>

## Homomorphism for Rings

A homomorphism from a ring $A$ to a ring $B$ is a function $f:A \to B$ satisfying the identities

$$
f(x_1 + x_2) = f(x_1)f(x_2) \\
f(x_1x_2) = f(x_1)f(x_2)
$$

## Kernel

Let $f: G \to H$ be a homomorphism. The kernel of $f$ is the set $K$ of all the elements of $G$ which are carried by $f$ onto the neutral eleemnt of $H$. That is,

$$
K = \{ x \in G: f(x) = e\}
$$

<aside>
💡 The kernel of a group $G$ is a normal subgroup of $G$. And the kernel of a ring $A$ is an ideal of $A$.

</aside>

## Basic Theorems

Let $G$ and $H$ be groups, and $f: G \to H$ a homomorphism. Then

- $f(e) = e$.
- $f(a^{-1}) = [f(a)]^{-1}, \forall \  a \in G$.

Let $f: G \to H$ be a homomorphism.

- The kernel of $f$ is a normal subgroup of $G$.
- The range of $f$ is a subgroup of $H$.

Let $f: G \to H$ be a homomorphism with kernel $K$. Then $f(a) = f(b)$ iff $Ka = Kb$.

## Fundermental Homomorphism Theorem

## FHT for Groups

Let $f: G \to H$ be a homomorphism of $G$ onto $H$. If $K$ is the kernel of $f$, then

$$
H \cong G/K
$$

<aside>
💡 It asserts that every homomorphic image of $G$ is isomorphic to a quotient group of $G$. Which specific quotient group of $G$ ? Well, if $f$ is a homomorphism from $G$ onto $H$, then $H$ is isomorphic to the quotient group of $G$ by the kernel of $f$.

</aside>

## FHT for Rings

Let $f: A \to B$ be a homomorphism from a ring $A$  onto a ring $B$, and let $K$ be the kernel of $f$. Then

$$
B \cong A/K
$$
