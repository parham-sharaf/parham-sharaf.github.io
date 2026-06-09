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

![](/images/cs180_p3_tri_hero.png)

A morph between two faces needs to do two things simultaneously: warp the geometry of one face toward the other, and blend the pixel colors. Doing either alone looks wrong — color blending without warping produces a ghost double-exposure; shape warping without blending leaves the wrong texture in the wrong place. The pipeline does both, parameterized by a single scalar α ∈ [0, 1].

## Correspondence and Triangulation

~50 landmark points are manually annotated on each face — eyes, nose tip, mouth corners, jawline, hairline. For the morph at parameter α, the intermediate landmark set is the linear interpolation:

$$\mathbf{p}_\alpha = (1 - \alpha)\,\mathbf{p}_A + \alpha\,\mathbf{p}_B$$

Delaunay triangulation is computed on $\mathbf{p}_\alpha$ and the same triangulation topology is applied to both source point sets. Delaunay is chosen because it maximizes the minimum angle across all triangles — this prevents degenerate sliver triangles whose affine transforms produce visible seams at triangle edges.

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/cs180_p3_tri_parham.jpg" alt="Parham triangulation mesh" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p3_tri_conor.jpg" alt="Conor triangulation mesh" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/cs180_p3_tri_elon.jpg" alt="Elon triangulation mesh" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p3_tri_christian.jpg" alt="Christian triangulation mesh" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

## Affine Warp Per Triangle

For each triangle in the intermediate mesh, we need to find the affine transform that maps it back to the corresponding triangle in each source image. An affine map $T: \mathbb{R}^2 \to \mathbb{R}^2$ has the form $T(\mathbf{x}) = A\mathbf{x} + \mathbf{t}$, or in homogeneous coordinates:

$$\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} = \begin{bmatrix} a & b & t_x \\ c & d & t_y \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} x \\ y \\ 1 \end{bmatrix}$$

Given source triangle vertices $\{(x_1,y_1), (x_2,y_2), (x_3,y_3)\}$ and destination vertices $\{(x_1',y_1'), (x_2',y_2'), (x_3',y_3')\}$, the 6 unknowns $(a, b, c, d, t_x, t_y)$ are solved from the 6 linear equations:

$$\begin{bmatrix} x_1 & y_1 & 1 & 0 & 0 & 0 \\ 0 & 0 & 0 & x_1 & y_1 & 1 \\ x_2 & y_2 & 1 & 0 & 0 & 0 \\ 0 & 0 & 0 & x_2 & y_2 & 1 \\ x_3 & y_3 & 1 & 0 & 0 & 0 \\ 0 & 0 & 0 & x_3 & y_3 & 1 \end{bmatrix} \begin{bmatrix} a \\ b \\ t_x \\ c \\ d \\ t_y \end{bmatrix} = \begin{bmatrix} x_1' \\ y_1' \\ x_2' \\ y_2' \\ x_3' \\ y_3' \end{bmatrix}$$

The warp is applied *inverse*: for every pixel in the output triangle, apply the inverse transform to find the source coordinate, then sample with bilinear interpolation. This avoids holes from forward-mapping. The final pixel at each location is the weighted blend:

$$I_\alpha(\mathbf{x}) = (1-\alpha)\, I_A(T_A^{-1}(\mathbf{x})) + \alpha\, I_B(T_B^{-1}(\mathbf{x}))$$

## Morph Sequence

![](/images/cs180_p3_filmstrip.jpg)

Five frames from a 46-frame morph sequence. The eyes shift early — they're constrained by many nearby landmarks. The jawline transitions more gradually because it spans a larger area with fewer triangle boundaries between source and target positions.

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; margin: 1.5rem 0;">
  <img src="/images/cs180_p3_morph.gif" alt="Full 46-frame morph animation at 30fps" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <div style="font-size: 0.95rem; line-height: 1.6;">

The full animation at 30 fps. One failure mode worth noting: large brightness differences between faces cause the cross-dissolve to produce a visible "fade through gray" artifact mid-morph. A color-matched preprocessing step (histogram matching) largely eliminates this, at the cost of changing the source images.

  </div>
</div>

## Population Mean Face

Given a dataset of 40+ Danish faces with annotated landmarks, the mean face is computed by:

1. Averaging all landmark coordinates to get $\bar{\mathbf{p}}$
2. Warping each face to the mean shape using the same per-triangle affine procedure
3. Averaging the warped pixel values

$$\bar{I}(\mathbf{x}) = \frac{1}{N}\sum_{i=1}^N I_i(T_i^{-1}(\mathbf{x}))$$

<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/cs180_p3_meanface.jpg" alt="Population mean of 40+ Danish faces" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p3_to_mean.jpg" alt="My face warped to mean shape" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p3_caricature.jpg" alt="Caricature at α=1.5 extrapolation" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

**Left:** the population mean. **Center:** my face warped to the mean's geometry — same texture, average proportions. **Right:** caricature at α = 1.5. Instead of interpolating toward the mean, the landmarks are extrapolated *away* from it: $\mathbf{p}_{1.5} = \mathbf{p}_\text{me} + 0.5\,(\mathbf{p}_\text{me} - \bar{\mathbf{p}})$. Whatever made my face geometrically distinctive gets amplified. The effect exaggerates the features that differ most from the population average.

Caricature quality is sensitive to correspondence quality — a poorly placed landmark gets extrapolated into a more severe artifact than the original misplacement. This is a good diagnostic: caricatures reveal which correspondences were lazily annotated.
