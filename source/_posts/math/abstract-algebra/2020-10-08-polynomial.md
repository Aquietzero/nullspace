---
layout: post
title: Abstract Algebra - Polynomial
date: 2020-10-08
toc: true
categories:
    - Math
tags:
    - 数学
    - 群论
    - 抽象代数
    - 总结
---

# Definition

## Polynomial

Let $A$ be a commutative ring with unity, and $**x$ an arbitrary symbol**. Every expression of the form

$$
a(x) = a_0 + a_1x + a_2x^2 + \cdots + a_nx^n
$$

is called a polynomial in $x$ with coefficients in $A$, or more simply, **a polynomial in $x$ over $A$**. The expressions $a_kx^k$, for $k \in \{1, \dots, n\}$, are called the **terms** of the polynomial.

## Zero polynomial

The polynomial $0 + 0x + 0x^2 + \cdots$ of whose coefficients are equal to zero is called the zero polynomial, and is symbolized by $0$.

# Polynomial ring

Let $A$ be a ring, the symbol $A[x]$ designates the set of all the polynomials in $x$ whose coefficients are in $A$, with polynomial addition and multiplication.

## Theorem 1

Let $A$ be a commutative ring with unity. Then $A[x]$ is a commutative ring with unity.

## Theorem 2

If $A$ is an integral domain, then $A[x]$ is an integral domain.

<aside>
💡 If $F$ is a field, $F[x]$ is not necessarily a field.

</aside>

## Theorem 3: Division algorithm for polynomials

If $a(x)$ and $b(x)$ arer polynomials over a field $F$, and $b(x) \neq 0$, there exist polynomials $q(x)$ and $r(x)$ over $F$ such that

$$
a(x) = b(x)q(x) + r(x), \text{ and } r(x) = 0 \text{ or } \deg r(x) < \deg b(x)
$$

# Factoring polynomials

Just as every integer can be factored into primes, so every polynomial can be factored into "irreducible" polynomials which cannot be factored further.

## Theorem 1

Every ideal of $F[x]$ is principal.

## Theorem 2

Any two nonzero polynomials $a(x)$ and $b(x)$ in $F[x]$ have a gcd $d(x)$. Furthermore, $d(x)$ can be expressed as a "linear combination"

$$
d(x) = r(x)a(x) + s(x)b(x)
$$

where $r(x)$ and $s(x)$ are in $F[x]$.

## Theorem 3: Factorization into irreducible polynomials

Every polynomial $a(x)$ of positive degree in $F[x]$ can be written as a product

$$
a(x) = kp_1(x)p_2(x)\cdots p_r(x)
$$

where $k$ is a constant in $F$ and $p_1(x), \dots , p_r(x)$ are monic irreducible polynomials of $F[x]$. More importantly, the factorization is unique. 

# Substitution of Polynomials

If $a(x)$ is a polynomial over a field $F$, say

$$
a(x) = a_0 + a_1x + \cdots + a_nx^n
$$

this means that the coefficients $a_0, a_1, \dots , a_n$  are elements of the field $F$, while the letter $x$ is a placeholder **which plays no other role than to occupy a given posititon**.

If $a(x)$ is a polynomial over $F$ and if $c \in F$, then

$$
a_0 + a_1c + \cdots + a_nc^n
$$

is also an element of $F$, obtatined by substituting $c$ for $x$ in the polynomial $a(x)$. This element is denoted by $a(c)$. We may regard $a(x)$ as a function from $F$ to $F$.

<aside>
💡 But the difference between a polynomial and a polynomial function is mainly a difference of viewpoint.

</aside>

## Root

If $a(x) \in F[x]$ and $c \in F$ such that $a(c) = 0$, then we call $c$ a root of $a(x)$.

## Theorem 1

$c$ is a root of $a(x)$ iff $x - c$ is a factor of $a(x)$.

## Theorem 2

If $a(x)$ has distinct roots $c_1, c_2, \dots, c_m$ in $F$, then $(x-c_1)(x-c_2) \cdots (x - c_m)$ is a factor of $a(x)$.

## Theorem 3

If $a(x)$ has degree $n$, it has at most $n$ roots.

## Theorem 4

If $s/t$ is a root of $a(x)$, then $s|a_0$ and $t|a_n$.

## Eisenstein's irreducibility criterion

Let

$$
a(x) = a_0 + a_1x + \cdots + a_nx^n
$$

be a polynomial with integer coefficients. Suppose there is a prime number $p$ which divides every coefficient of $a(x)$ except the leading coefficient $a_n$; suppose $p$ does not divide $a_n$ and $p^2$ does not divide $a_0$. **Then $a(x)$ is irreducible over $\mathbb{Q}$**.

# Fundamental Theorem of Algebra

Every non-constant polynomial with complex coefficients has a complex root.

<aside>
💡 Every polynomial in $\mathbb{C}[x]$ can be factored into irreducibles. Since.Since the irreducible polynomials are all of degree 1, it follows that if $a(x)$ is a polynomial of degree $n$ over $\mathbb{C}$, it can be factored into $a(x)=k(x-c_1)(x-c_2)\cdots (x-c_n)$.
</aside>

Suppose $a(x) \in \mathbb{R}[x]$. If $a+bi$ is a root of $a(x)$, so is $a-bi$.