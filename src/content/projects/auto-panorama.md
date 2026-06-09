---
title: "Auto-Stitching Photo Mosaics"
summary: "Building a panorama pipeline from scratch — Harris corner detection, Adaptive Non-Maximal Suppression, feature matching, RANSAC for homography estimation, and Laplacian-pyramid blending."
date: 2024-10-28
category: "Computer Vision"
tech:
  - Python
  - NumPy
  - OpenCV
  - Computer Vision
tags:
  - panorama
  - feature-detection
  - ransac
  - homography
featured: true
status: "shipped"
---

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin: 1.5rem 0;">
  <img src="/images/cs180_p4_mosaic_ladder.jpg" alt="Ladder scene panorama — seamlessly stitched from two overlapping photos" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p4_mosaic_outside.jpg" alt="Exterior courtyard panorama" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Taking two overlapping photos and producing a seamless panorama is a cascade of five hard problems: finding distinctive points, distributing them evenly, matching them across views, filtering bad matches robustly, and blending without seams. Each step uses well-established CV techniques; composing them end-to-end is where it gets interesting.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">detection</span><span>Harris corners + Adaptive Non-Maximal Suppression (ANMS)</span>
  <span style="color: var(--color-accent);">descriptors</span><span>40×40 patches sampled at 8×8, bias/gain normalized</span>
  <span style="color: var(--color-accent);">matching</span><span>Nearest-neighbor + Lowe's ratio test (threshold 0.8)</span>
  <span style="color: var(--color-accent);">robust fit</span><span>RANSAC — 4-point DLT, 1000 iterations, 2px inlier threshold</span>
  <span style="color: var(--color-accent);">blending</span><span>Laplacian pyramid with linear ramp mask over overlap region</span>
</div>

## Harris Corners and ANMS

<div style="margin: 1.5rem 0;">
  <img src="/images/cs180_p4_detection.png" alt="Raw Harris response, strength-colored corners, and ANMS-distributed corners" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

The Harris corner response measures how much the image changes when you shift a window in any direction:

$$R = \det(M) - k\,(\text{tr}\,M)^2, \qquad M = \begin{bmatrix} \sum I_x^2 & \sum I_x I_y \\ \sum I_x I_y & \sum I_y^2 \end{bmatrix}$$

where $I_x, I_y$ are image gradients computed over the window. $R > 0$ indicates a corner (both eigenvalues large), $R < 0$ an edge (one large eigenvalue), $|R| \approx 0$ a flat region.

Raw Harris over-detects — textured regions produce dense clusters of high-$R$ points while sparse areas get nothing. **ANMS** fixes this by enforcing spatial spread: a corner at position $\mathbf{x}_i$ is suppressed unless it is the strongest corner within radius $r_i$, where $r_i$ is its suppression radius. Keeping the top-$N$ corners by $r_i$ yields a spatially uniform distribution, which matters for matching: uniformly distributed features constrain the homography better than clustered ones.

## Feature Descriptors and Matching

Each surviving corner gets a descriptor: sample a 40×40 patch around it, downsample to 8×8, normalize to zero mean and unit variance (bias/gain normalization). Normalization makes descriptors invariant to local brightness and contrast changes — the same surface lit differently will match.

Matching: for each descriptor in image A, find the two nearest neighbors in image B (by SSD). Accept the match only if:

$$\frac{d_1}{d_2} < 0.8$$

Lowe's ratio test rejects ambiguous matches — if the best match is nearly as good as the second-best, the feature is probably in a repeated-texture region and the match is unreliable. This eliminates most false positives cheaply, before RANSAC.

## RANSAC Homography Estimation

<div style="margin: 1.5rem 0;">
  <img src="/images/cs180_p4_matching.png" alt="All feature matches (many outliers) vs RANSAC inliers only" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Even after the ratio test, outliers remain from repeated structures (railings, windows). RANSAC handles them:

1. Sample 4 random point correspondences
2. Solve for the homography $H$ using the Direct Linear Transform (DLT): stack the 4 point equations into $Ah = 0$ and solve via SVD
3. Count inliers: points $\mathbf{p}_i$ where $\|H\mathbf{p}_i - \mathbf{p}'_i\|_2 < 2$ pixels
4. Repeat 1000 times, keep the $H$ with the most inliers
5. Refit $H$ using all inliers from the best iteration

The DLT for each point pair $(\mathbf{p}, \mathbf{p}') = ((x,y,1), (x',y',1))$ contributes two rows to $A$:

$$\begin{bmatrix} -x & -y & -1 & 0 & 0 & 0 & x'x & x'y & x' \\ 0 & 0 & 0 & -x & -y & -1 & y'x & y'y & y' \end{bmatrix}$$

With 4 points: 8×9 system, null space gives the 9 entries of $H$ (up to scale). The green lines above are the 1000-iteration RANSAC inliers; red matches were correctly rejected.

## Warping and Blending

With $H$ in hand, warp image A into image B's coordinate frame using inverse warping — for each output pixel, apply $H^{-1}$ to find the source coordinate, then bilinear-interpolate. Forward warping would leave holes; inverse warping doesn't.

The overlap region is blended with a Laplacian pyramid: construct the pyramid for each warped image, blend each level using a mask that ramps linearly across the overlap, reconstruct. This makes the seam invisible because color transitions happen gradually at low frequencies while sharp detail is composited cleanly at high frequencies.

## Results

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin: 1.5rem 0;">
  <img src="/images/cs180_p4_mosaic_pcb.jpg" alt="PCB close-up panorama — fine detail aligned across two views" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p4_hero.jpg" alt="Hero panorama result" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

The pipeline succeeds across very different scene types — architectural geometry (ladder/exterior), fine electronic detail (PCB), and indoor scenes. Failure modes: scenes with insufficient overlap, scenes where all features lie in a plane (degenerate homography), and scenes with moving objects in the overlap region (RANSAC can't recover a consistent $H$ when the scene itself changes between frames).

## Why the Pipeline Composes

Each stage absorbs noise from the previous. Harris over-detects → ANMS filters spatially. Matching over-connects → ratio test filters ambiguous pairs. Ratio test leaves outliers → RANSAC filters geometrically inconsistent ones. The pipeline is deliberately redundant: classical CV survives individual component failures because each stage imposes an independent constraint, and errors have to defeat all of them simultaneously.
