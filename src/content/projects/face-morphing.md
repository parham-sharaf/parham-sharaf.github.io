---
title: "Face Morphing with Delaunay Triangulation"
summary: "Smooth warping between two faces via point correspondences, Delaunay triangulation, and affine warps per triangle. Plus: population mean faces and caricature generation by extrapolation."
date: 2024-10-12
category: "Computer Vision"
tech:
  - Python
  - NumPy
  - scikit-image
  - Computer Vision
tags:
  - face-morphing
  - delaunay-triangulation
  - affine-warping
  - image-interpolation
featured: true
status: "shipped"
---

![](/images/cs180_p3_pipeline.png)

**Transforming one face into another smoothly requires warping both shape and appearance**. The geometric problem: given matching landmark points on two faces, how do you move every pixel consistently? The solution — triangulate the landmarks, then apply a different affine transform inside each triangle. Every pixel gets warped by whichever triangle contains it.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">correspondences</span><span>~50 manually-annotated landmark pairs per face</span>
  <span style="color: var(--color-accent);">triangulation</span><span>Delaunay (maximizes smallest angle across all triangles)</span>
  <span style="color: var(--color-accent);">warping</span><span>Per-triangle affine + cross-dissolve of appearance</span>
  <span style="color: var(--color-accent);">applications</span><span>Morph animation, mean faces, caricatures</span>
</div>

## Morph Sequence

![](/images/cs180_p3_sequence.png)

**α is both the shape-blend weight and the color-blend weight**. At α=0 you see the first face. At α=1 you see the second. In between, the shape interpolates landmark-by-landmark, and the appearance is a weighted average of both warped images. The trick: applying different α weights to shape vs color lets you isolate "whose geometry" from "whose appearance."

## Mean Faces and Caricatures

![](/images/cs180_p3_mean.png)

**Take 40+ face photos, annotate correspondences on each, average the landmarks → you get the "mean face" of that population**. Warp any individual face to the mean's shape and you see what they'd look like with average proportions. Warp the mean toward an individual's shape and you see the mean person with their proportions.

**Caricatures work by extrapolation**. Instead of interpolating between self and mean with α ∈ [0, 1], push α > 1 — the face gets *further* from the mean, exaggerating whatever made it distinctive. My caricature (α = 1.5) amplifies everything my face does that the average doesn't: wider jaw here, narrower eyes there, whatever the outlier features are.

The underlying insight: **the mean face is the boring null hypothesis**, and every real face lives in a direction away from it. Caricature is just "keep going in that direction."