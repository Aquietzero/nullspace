---
layout: post
title: Collision Detection Design Issues 
date: 2022-03-12
tags:
    - 游戏引擎
    - 碰撞检测
    - 读书笔记
---

# Collision Algorithm Design Factors

There are serveral factors affecting the choices made in designing a collision detecton system.

- **Application domain representation.** The geometrical representations used for the scene and its objects have a direct bearing on the algorithms used. With fewer restrictions put on these representations, more general collision detection solutions have to be used, with possible performance repercussions.
- **Different types of queries.**
- **Environment simulation parameters.** These include how many objects there are, their relative sizes and positions, if and how they move, if they are allowed to interpenetrate, and whether they are rigid or flexible.
- **Performance.** With time and space always being a trade-off, several features are usually balanced to meet stated performance requirements.
- **Robustness.** Not all applications requier the same level of physical simulation.
- **Ease of implementation and use.**

# Application Domain Representation

To select appropriate collision detection algorithms, it is important to consider the types of geometrical representations that will be used for the scene and its objects.

## Object Representations

Polygonal objects are defined in terms of their vertices, edges, and faces. When constructed in this way, objects are said to have an **explicit representation**. **Implicit objects** refer to sphere, cones, cylinders, ellipsoids, tori, and other geometric primitives that are not explicitly defined in such a manner but through a methematical expression.

Geometric primitives such as spheres, boxes, and cylinders are also the building blocks of objects constructed via the **constructive solid geometry (CSG) framework**. CSG objects are recursively formed through applying set-theoretic operations (such as union, intersection, or difference) on basic geometric shapes or other CSG objects.

![(a) A cube with a cylindrical hole through it. (b) The CSG construction three for the left-hand object, where a cylinder is subtracted from the cube.](/assets/images/2022-03-12-collision-detection-design-issues/csg.png)

(a) A cube with a cylindrical hole through it. (b) The CSG construction three for the left-hand object, where a cylinder is subtracted from the cube.

## Collision Versus Rendering Geometry

Although it is possible to pass rendering geometry directly into a collision system, there are several reasons it is better to have separate geometry with which collision detection is performed.

- Graphics platforms have advanced to the point where rendering geometry is becoming to complex to be used to perform collision detection or physics. **Simplified geometric shapes, or bounding volumes, are frequently used to accelerate collision queries regardless of what geometry representation is used.**
- For modern hardware, geometry tends to be given in very specific formats, which lend themselves to fast rendering but not to collision detection.
- The required data and data organization of rendering geometry and collision geometry are likely to vary drastically.
- Sometimes the collision geometry differs from the rendered geometry by design.
- For simulation purposes, collision data must be kept around even when rendering data can be thrown out as not visible.
- The original geometry might be given as a polygon soup or mesh, whereas the simulation requires a solid-object representation.

## Collision Algorithm Specialization

Rather than having one all-encompassing collision detection system, it is often wise to provide specialized collision systems for specific scenarios.

# Types of Queries

- **Interference detection** or **intersection testing** problem: answering the boolean question of whether two (static) objects, A and B, are overlapping at their given positions and orientations.
- **Intersection finding**: involving finding one or more points of contact.
- **Approximate queries**: the answers are only required to be accurate up to a given tolerance.
- If objects penetrate, some application require finding the **penetration depth**. The penetration depth is usually defined in terms of the **minimum translational distance**: the length of the shortest movement vector that would separate the objects.
- The **separation distance** between two disjoint objects A and B is defined as the minimum of the distance between poitns in A and points in B.

# Environment Simulation Parameters

## Number of Objects

Because any one object can potentially collide with any other object, a simulation with $n$ objects requires $(n-1)+(n-2)+\cdots+1 = O(n^2)$ pairwise tests, worst case. **To really speed up the process, the number of pairs tested must be reduced.** The reduction is performed by separating the collision handling of multiple objects into two phases: the **broad phase** and the **narrow phase**.

- The broad phase identifies smaller groups of objects that may be colliding and quickly excludes those that definitely are not.
- The narrow phase constitutes the pairwise tests within subgroups.

![The broad phase identifies disjoint groups of possibly intersecting objects.](/assets/images/2022-03-12-collision-detection-design-issues/broad-phase.png)

The broad phase identifies disjoint groups of possibly intersecting objects.

## Sequential Versus Simultaneous Motion

In real life, objects are moving **simultaneously** during a given movement time step, with any eventual collisions resolved within the time step. But simultaneous updates remain expensive and are therefore often reserved for accurate rigid-body simulations. For these, an alternative option is to resolve motion **sequentially**. That is, objects are moved one object at a time and any collisions are detected and resolved before the process continues with the next object.

![(a) Top: If both objects move simultaneously, there is no collision. Bottom: If the circle object moves before the triangle, the objects collide. In (b), again there is no collision for simultaneous movement, but for sequential movement the objects collide. (c) The objects collide under simultaneous movement, but not under sequential movement.](/assets/images/2022-03-12-collision-detection-design-issues/sequential-versus-simultaneous-motion.png)

<aside>
💡 Clearly, sequential movement is not a physically accurate movement model. But for games, the problems introduced by a sequential movement model can often be ignored. The high frame rate of games often makes the movement step so small that the overlap is also small and not really noticeable.

</aside>

## Discrete Versus Continuous Motion

**Static collision detection** involves detecting intersection between the objects, at discrete points in time, during their motion. At each such point in time the objects are treated as if they were stationary at their current positions with zero velocities.

**Dynamic collision detection** considers the full continuous motion of the objects over the given time interval.

<aside>
💡 The volume covered by an object in continuous motion over a given time interval is called the **swept volume**. If the swept volumes of two moving objects do not intersect, there is no intersection between the objects.

</aside>

# Performance

For the best possible visuals games must run at 60 fps. This frame rate leaves 16.7 ms to prepare each game frame. Depending on the type of game, collision detection may accout for 10 to 30% of a frame, in turn **leaving 2 to 5 ms for collision detection**.

# Robustness

Robustness is used to refer to a program’s capability of dealing with numerical computations and geometrical configurations that in some way are difficult to handle. Robustness problems can be broadly categorized into two classes: those due to lack of **numerical robustness** and those due to lack of **geometrical robustness**.