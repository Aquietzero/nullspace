---
layout: post
title: BSP Tree Hierarchies
date: 2022-04-13
tags:
    - 游戏引擎
    - 碰撞检测
    - 读书笔记
---

Of the many spatial partitioning methods available, the BSP tree is the most versatile. **It can perform the same tasks as the k-d tree, the quadtree, or the octree, but not vice versa.**

# BSP Trees

A binary space-partitioning tree (or BSP tree) is a binary tree structure that recursively partitions space into pairs of subspaces **with respect to dividing planes of arbitrary position and orientation.** If the space being partitioned is n-dimensional, the dividing planes are (n-1)-dimensional hyperplanes.

![The successive division of a square into four convex subspaces and the cor- responding BSP tree. (a) The initial split. (b) The first second-level split. (c) The second second-level split.](/assets/images/2022-04-13-bsp-tree-hierarchies/bsp-trees.png)

The successive division of a square into four convex subspaces and the cor- responding BSP tree. (a) The initial split. (b) The first second-level split. (c) The second second-level split.

![The recursive division of space in half can be used as (a) a spatial partitioning over a number of objects. It can also be used as (b) a volume or boundary representation of an object.](/assets/images/2022-04-13-bsp-tree-hierarchies/recursive-division.png)

The recursive division of space in half can be used as (a) a spatial partitioning over a number of objects. It can also be used as (b) a volume or boundary representation of an object.

Usage of BSP Trees:

- Solve the hidden-surface problem. The BSP built in preprocessing phase can be traversed at runtime to give the correct (back-to-front or front-to-back) sorting order of objects or individual polygons from an arbitrary viewpoint.
- Ray tracing.
- Constructive solid geometry (CSG).
- Robot motion.
- Path planning.
- Spatial partitioning.
- Volume representation.

<aside>
💡 Constructing a BSP tree from stratch or recomputing parts of a tree is sufficiently expensive that they are rarely built or modified at runtime. For this reason, **BSP trees are primarily used to hold static background geometry. Collision detection among moving objects is usually handled throught some other method.**

</aside>

# Types of BSP Trees

## Node-storing BSP Trees

A node-storing (or node-based) BSP tree is autopartitioning, thus selecting supporting planes of faces from the geometry as the dividing planes used during construction.

<aside>
💡 With the advent of 3D graphics hardware, using node-storing trees no longer makes sense in that they excessively divide the geometry into individual polygons.

</aside>

![(a) The original 12-polygon input geometry. (b)The initial dividing plane is selected to pass through face *A* (and face *G*). (c) For the next ply of the tree dividing planes are selected to pass through faces *B* and *H*.](/assets/images/2022-04-13-bsp-tree-hierarchies/polygon-geometry.png)

(a) The original 12-polygon input geometry. (b)The initial dividing plane is selected to pass through face *A* (and face *G*). (c) For the next ply of the tree dividing planes are selected to pass through faces *B* and *H*.

## Leaf-storing BSP Trees

Leaf-storing BSP tree refers to any BSP tree in which geometry is stored in the leaves of the tree rather than in the internal nodes.

![First steps of the construction of a leaf-storing BSP tree, using the same geometry as before.](/assets/images/2022-04-13-bsp-tree-hierarchies/leaf-storing-bsp-trees.png)

First steps of the construction of a leaf-storing BSP tree, using the same geometry as before.

## Solid-leaf BSP Trees

Solid-leaf BSP trees are built to represent the solid volume occupied by the input geometry. That is, dividing planes are ultimately selected to separate the solid volume from the exterior of the object.

![A solid figure cut by a number of dividing planes and the resulting solid-leaf BSP tree.](/assets/images/2022-04-13-bsp-tree-hierarchies/dividing-planes.png)

A solid figure cut by a number of dividing planes and the resulting solid-leaf BSP tree.

# Building the BSP Tree

Building a BSP tree involves three steps.

1. Selection of a partitioning plane.
2. Partitioning of the input geometry into two sets with respect to the plane; the geometry in front of the plane and the geometry behind it. Geometry that straddles the plane is split to the plane before partitioning.
3. The forming of a tree by connecting with a new tree node the two subtrees created by recursively calling the construction algorithm with the two partitioned sets obtained in the previous step.

```cpp
// Constructs BSP tree from an input vector of polygons. Pass ‘depth’ as 0 on entry
BSPNode *BuildBSPTree(std::vector<Polygon *> &polygons, int depth) {
    // Return NULL tree if there are no polygons
    if (polygons.empty()) return NULL;

    // Get number of polygons in the input vector
    int numPolygons = polygons.size();

    // If criterion for a leaf is matched, create a leaf node from remaining polygons
    if (depth >= MAX_DEPTH || numPolygons <= MIN_LEAF_SIZE) || ...etc...)
        return new BSPNode(polygons);

    // Select best possible partitioning plane based on the input geometry
    Plane splitPlane = **PickSplittingPlane**(polygons);

    std::vector<Polygon *> frontList, backList;

    // Test each polygon against the dividing plane, adding them
    // to the front list, back list, or both, as appropriate
    for (int i = 0; i < numPolygons; i++) {
        Polygon *poly = polygons[i], *frontPart, *backPart;
        switch (**ClassifyPolygonToPlane**(poly, splitPlane)) {
            case COPLANAR_WITH_PLANE:
                // What’s done in this case depends on what type of tree is being
                // built. For a node-storing tree, the polygon is stored inside
                // the node at this level (along with all other polygons coplanar
                // with the plane). Here, for a leaf-storing tree, coplanar polygons
                // are sent to either side of the plane. In this case, to the front
                // side, by falling through to the next case
            case IN_FRONT_OF_PLANE:
                frontList.push_back(poly);
                break;
            case BEHIND_PLANE:
                backList.push_back(poly);
                break;
            case STRADDLING_PLANE:
                // Split polygon to plane and send a part to each side of the plane
                **SplitPolygon**(*poly, splitPlane, &frontPart, &backPart);
                frontList.push_back(frontPart);
                backList.push_back(backPart);
                break;
        }
    }
    // Recursively build child subtrees and return new tree root combining them
    BSPNode *frontTree = BuildBSPTree(frontList, depth + 1);
    BSPNode *backTree = BuildBSPTree(backList, depth + 1);
    return new BSPNode(frontTree, backTree);
}
```

For a node-storing tree and a solid-leaf tree, the recursive construction proceeds until the set of remaining input polygons becomes empty. The construction of a leaf-storing BSP tree is typically stopped when:

- The leaf contains less than some preset number of polygons.
- A fixed cutoff depth has been reached.
- A good dividing plane cannot be found.

## Selecting Dividing Planes

Autopartitioning by restricting the dividing planes as the supporting planes of the geometry may not be an optimal solution.

![(a) A configuration of 12 faces wherein all possible auto-partitioned dividing planes end up splitting four faces. (b) Using arbitrary splits can allow the configuration to be partitioned in such a way that the problem disappears or is reduced.](/assets/images/2022-04-13-bsp-tree-hierarchies/selecting-dividing-planes.png)

Another problem of using just auto-partitioning is that for convex shapes, the resulting tree will in some sense be maximally unbalanced, with a depth equal to the number of faces in the sphere.

![(a)An auto partitioned BSP tree for a polygonal sphere has worst-case *O*(*n*) height. (b) Allowing arbitrary cuts across the sphere, tree height is reduced to *O*(log *n*). (c) Naylor’s hybrid approach of alternating auto-partitioning and general cuts also allows a boundary representation of the sphere to have *O*(log *n*) height, additionally providing early outs.](/assets/images/2022-04-13-bsp-tree-hierarchies/auto-partitioned-bsp-tree.png)

## Evaluating Dividing Planes

Two strategies particularly relevant to collision detection are to pick planes so as to minimize splitting of geometry and to attempt to balance the geometry equally on both sides of the splitting plane.

![Part of a city grid split to minimize straddling polygons (*A*), balance the number of polygons on either side of the dividing plane (*B*), and compromise between minimizing straddling and balancing of polygons (*C* ).](/assets/images/2022-04-13-bsp-tree-hierarchies/part-of-a-city-grid.png)

```cpp
// Given a vector of polygons, attempts to compute a good splitting plane
Plane PickSplittingPlane(std::vector<Polygon *> &polygons) {
    // Blend factor for optimizing for balance or splits (should be tweaked)
    const float K = 0.8f;
    // Variables for tracking best splitting plane seen so far
    Plane bestPlane;
    float bestScore = FLT_MAX;

    // Try the plane of each polygon as a dividing plane
    for (int i = 0; i < polygons.size(); i++) {
        int numInFront = 0, numBehind = 0, numStraddling = 0;
        Plane plane = GetPlaneFromPolygon(polygons[i]);
        // Test against all other polygons
        for (int j = 0; j < polygons.size(); j++) {
            // Ignore testing against self
            if (i == j) continue;
            // Keep standing count of the various poly-plane relationships
            switch (ClassifyPolygonToPlane(polygons[j], plane)) {
                case POLYGON_COPLANAR_WITH_PLANE:
                    /* Coplanar polygons treated as being in front of plane */
                case POLYGON_IN_FRONT_OF_PLANE:
                    numInFront++;
                    break;
                case POLYGON_BEHIND_PLANE:
                    numBehind++;
                    break;
                case POLYGON_STRADDLING_PLANE:
                        numStraddling++;
                break;
            }
        }
        // Compute score as a weighted combination (based on K, with K in range
        // 0..1) between balance and splits (lower score is better)
        float score = K * numStraddling + (1.0f - K) * Abs(numInFront - numBehind);
        if (score < bestScore) {
            bestScore = score;
            bestPlane = plane;
        }
    }
    return bestPlane;
}
```

<aside>
💡 The variable **K** controlling the blending of the least-crossed and balancing strategies is given as a constant. **In practice, it can be made to vary with the depth of the current node during construction.**

</aside>

## Classifying Polygons with Respect to a Plane

After a dividing plane has been selected all polygons must be partitioned with respect to this plane into one of the following four categories.

- Polygons that lie in front of the dividing plane.
- Polygons that lie behind the dividing plane.
- Polygons straddling the dividing plane.
- Polygons coincident with the dividing plane.

```cpp
// Classify point p to a plane thickened by a given thickness epsilon
int ClassifyPointToPlane(Point p, Plane plane) {
    // Compute signed distance of point from plane
    float dist = Dot(plane.n, p) - plane.d;

    // Classify p based on the signed distance
    if (dist > PLANE_THICKNESS_EPSILON)
        return POINT_IN_FRONT_OF_PLANE;
    if (dist < -PLANE_THICKNESS_EPSILON)
        return POINT_BEHIND_PLANE;
    return POINT_ON_PLANE;
}
```

Considering with the floating point accuracy, **thick planes** are used. Rules of classifying different categories.

![Triangle *ABC* lies behind the plane and triangle *DEF* lies in front of the plane. Triangle *GHI* straddles the plane and triangle *JKL* lies on the plane.](/assets/images/2022-04-13-bsp-tree-hierarchies/thick-planes.png)

```cpp
// Return value specifying whether the polygon ‘poly’ lies in front of, // behind of, on, or straddles the plane ‘plane’
int ClassifyPolygonToPlane(Polygon *poly, Plane plane) {
    // Loop over all polygon vertices and count how many vertices
    // lie in front of and how many lie behind of the thickened plane int numInFront = 0, numBehind = 0;
    int numVerts = poly->NumVertices();
    for (int i = 0; i < numVerts; i++) {
        Point p = poly->GetVertex(i);
        switch (ClassifyPointToPlane(p, plane)) {
            case POINT_IN_FRONT_OF_PLANE:
                numInFront++;
                break;
            case POINT_BEHIND_PLANE:
                numBehind++;
                break;
        }
    }
    // If vertices on both sides of the plane, the polygon is straddling
    if (numBehind != 0 && numInFront != 0)
        return POLYGON_STRADDLING_PLANE;
    // If one or more vertices in front of the plane and no vertices behind // the plane, the polygon lies in front of the plane
    if (numInFront != 0)
        return POLYGON_IN_FRONT_OF_PLANE;
    // Ditto, the polygon lies behind the plane if no vertices in front of // the plane, and one or more vertices behind the plane
    if (numBehind != 0)
        return POLYGON_BEHIND_PLANE;
    // All vertices lie on the plane so the polygon is coplanar with the plane
    return POLYGON_COPLANAR_WITH_PLANE;
}
```

## Splitting Polygons Against a Plane

During BSP tree construction, when a polygon is found straddling a dividing plane it must be split in two.

The act of clipping the polygon against a plane is commonly performed using the **Sutherland-Hodgman clipping algorithm**.

![Clipping the polygon *ABDE* illustrates the four cases of the Sutherland-Hodgman polygon-clipping algorithm. The points of the output polygon *BCFA* are shown in gray in the cases in which they are output.](/assets/images/2022-04-13-bsp-tree-hierarchies/splitting-polygons-against-a-plane.png)

Clipping the polygon *ABDE* illustrates the four cases of the Sutherland-Hodgman polygon-clipping algorithm. The points of the output polygon *BCFA* are shown in gray in the cases in which they are output.

The algorithm proceeds one polygon edge at a time and has four cases based on what sides of the clipping plane the edge startpoints and endpoints lie.

![Output rules for the modified Sutherland–Hodgman clipping algorithm dealing with a thickened plane and retaining both parts of the polygon. The rules are given in terms of the directed segment *AB*. *I* represents the intersection point of *AB* with the clipping plane.](/assets/images/2022-04-13-bsp-tree-hierarchies/output-rules-for-the-clipping-algo.png)

![A potential problem with the modified clipping algorithm is that the resulting pieces (shown in dark gray) may overlap.](/assets/images/2022-04-13-bsp-tree-hierarchies/protential-problem-of-clipping-algo.png)

For robust clipping of the polygon, so that no overlap exists between the generated pieces, a full set of all nine possible cases is necessary.

![The final modified clipping algorithm for robustly clipping a polygon against a thick plane.](/assets/images/2022-04-13-bsp-tree-hierarchies/final-modified-clipping-algo.png)

```cpp
void SplitPolygon(Polygon &poly, Plane plane, Polygon **frontPoly, Polygon **backPoly) {
    int numFront = 0, numBack = 0;
    Point frontVerts[MAX_POINTS], backVerts[MAX_POINTS];

    // Test all edges (a, b) starting with edge from last to first vertex
    int numVerts = poly.NumVertices();
    Point a = poly.GetVertex(numVerts – 1);
    int aSide = ClassifyPointToPlane(a, plane);

    // Loop over all edges given by vertex pair (n - 1, n)
    for (int n = 0; n < numVerts; n++) {
        Point b = poly.GetVertex(n);
        int bSide = ClassifyPointToPlane(b, plane);
        if (bSide == POINT_IN_FRONT_OF_PLANE) {
            if (aSide == POINT_BEHIND_PLANE) {
                // Edge (a, b) straddles, output intersection point to both sides
                Point i = IntersectEdgeAgainstPlane(a, b, plane);
                assert(ClassifyPointToPlane(i, plane) == POINT_ON_PLANE);
                frontVerts[numFront++] = backVerts[numBack++] = i;
            }
            // In all three cases, output b to the front side
            frontVerts[numFront++] = b;
        } else if (bSide == POINT_BEHIND_PLANE) {
            if (aSide == POINT_IN_FRONT_OF_PLANE) {
                // Edge (a, b) straddles plane, output intersection point
                Point i = IntersectEdgeAgainstPlane(a, b, plane);
                assert(ClassifyPointToPlane(i, plane) == POINT_ON_PLANE);
                frontVerts[numFront++] = backVerts[numBack++] = i;
            } else if (aSide == POINT_ON_PLANE) {
                // Output a when edge (a, b) goes from ‘on’ to ‘behind’ plane
                backVerts[numBack++] = a;
            }
            // In all three cases, output b to the back side
            backVerts[numBack++] = b;
        } else {
            // b is on the plane. In all three cases output b to the front side
            frontVerts[numFront++] = b;
            // In one case, also output b to back side
            if (aSide == POINT_BEHIND_PLANE)
                backVerts[numBack++] = b;
        }
        // Keep b as the starting point of the next edge
        a = b;
        aSide = bSide;
    }

    // Create (and return) two new polygons from the two vertex lists
    *frontPoly = new Polygon(numFront, frontVerts);
    *backPoly = new Polygon(numBack, backVerts);
}
```

## Splitting Robustness

Consider the situation below. Two triangles $ABC$ and $CBD$ are given with their points in counterclockwise. When splitting, due to the differences between floating point arithmetic and real arithmetic, intersecting $BC$ against a plane $P$ does not, in general, result in the same intersection point as intersecting $CB$ with the same plane.

![(a) Original geometry of two triangles intersecting a plane. (b) Inconsistent handling of the shared edge results in two different intersection points, **which introduces cracking**. (c) The correct result when the shared edge is handled consistently.](/assets/images/2022-04-13-bsp-tree-hierarchies/splitting-robustness.png)

To robustly deal with this case, the clipping code must always intersect the given edge consistently as either $BC$ or $CB$, but not both.

```cpp
...
if (bSide == POINT_IN_FRONT_OF_PLANE) {
    if (aSide == POINT_BEHIND_PLANE) {
    // Edge (a, b) straddles, output intersection point to both sides.
    // Consistently clip edge as ordered going from in front -> behind
    Point i = IntersectEdgeAgainstPlane(b, a, plane);
    ...
}
...
```

# Using the BSP Tree

## Testing a Point Against a Solid-leaf BSP Tree

Testing if a point lies in empty or solid space of a solid-leaf BSP tree is a largely straightforward application. At each node, the point is evaluated with respect to the dividing plane at that node. If the point lies in front of the plane, the child node representing the front tree is visited, and vice versa. Traversal continues until a leaf node is reached, at which point the solidity of the leaf indicates the result.

```cpp
int PointInSolidSpace(BSPNode *node, Point p) {
    while (!node->IsLeaf()) {
        // Compute distance of point to dividing plane
        float dist = Dot(node->plane.n, p) - node->plane.d;
        if (dist > EPSILON) {
            // Point in front of plane, so traverse front of tree
            node = node->child[0];
        } else if (dist < -EPSILON) {
            // Point behind of plane, so traverse back of tree
            node = node->child[1];
        } else {
            // Point on dividing plane; must traverse both sides
            int front = PointInSolidSpace(node->child[0], p);
            int back = PointInSolidSpace(node->child[1], p);
            // If results agree, return that, else point is on boundary
            return (front == back) ? front : POINT_ON_BOUNDARY;
        }
    }
    // Now at a leaf, inside/outside status determined by solid flag
    return node->IsSolid() ? POINT_INSIDE : POINT_OUTSIDE;
}
```

## Intersecting a Ray Against a Solid-leaf BSP Tree

The routine to intersect the ray $R(t) = P + t\bold{d}, t \in [t_{min}, t_{max}]$ against a solid-leaf BSP tree as follows. The time $t_{hit}$ of the first intersection with a solid leaf is returned when such an intersection exists.

```cpp
// Intersect ray/segment R(t) = p + t*d, tmin <= t <= tmax, against bsp tree
// ’node’, returning time thit of first intersection with a solid leaf, if any
int RayIntersect(BSPNode *node, Point p, Vector d, float tmin, float tmax, float *thit) {
    std::stack<BSPNode *> nodeStack;
    std::stack<float> timeStack;

    assert(node != NULL);

    while (1) {
        if (!node->IsLeaf()) {
            float denom = Dot(node->plane.n, d);
            float dist = node->plane.d - Dot(node->plane.n, p);
            int nearIndex = dist > 0.0f;
            // If denom is zero, ray runs parallel to plane. In this case,
            // just fall through to visit the near side (the one p lies on)
            if (denom != 0.0f) {
                float t = dist / denom;
                if (0.0f <= t && t <= tmax) {
                    if (t >= tmin) {
                        // Straddling, push far side onto stack,then visit near side
                        nodeStack.push(node->child[1 ∧ nearIndex]);
                        timeStack.push(tmax);
                        tmax = t;
                    } else nearIndex = 1 ∧ nearIndex; // 0 <= t < tmin, visit far side
                }
            }        
            node = node->child[nearIndex];
        } else {
            // Now at a leaf. If it is solid, there’s a hit at time tmin, so exit
            if (node->IsSolid()) {
                *thit = tmin;
                return 1;
            }
            // Exit if no more subtrees to visit, else pop off a node and continue
            if (nodeStack.empty()) break;
            tmin = tmax;
            node = nodeStack.top(); nodeStack.pop();
            tmax = timeStack.top(); timeStack.pop();
        }
    }
    
    // No hit
    return 0;
}
```