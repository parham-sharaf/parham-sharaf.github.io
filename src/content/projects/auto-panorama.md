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

![](/images/cs180_p4_hero.jpg)

**Taking two overlapping photos and producing a seamless panorama is a cascade of five hard problems**: finding distinctive points (corner detection), distributing them evenly (ANMS), matching them across views (feature descriptors + similarity search), filtering out bad matches (RANSAC), and blending the final warped images without seams (pyramids). Each step uses well-established CV techniques; chaining them is where everything gets interesting.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">detection</span><span>Harris corners + Adaptive Non-Maximal Suppression</span>
  <span style="color: var(--color-accent);">matching</span><span>40×40 feature patches + Lowe's ratio test</span>
  <span style="color: var(--color-accent);">robust fit</span><span>RANSAC (4-point DLT, 1000 iterations)</span>
  <span style="color: var(--color-accent);">blending</span><span>Laplacian pyramid with linear ramp mask</span>
</div>

## Feature Detection

![](/images/cs180_p4_detection.png)

**Harris corners find distinctive points — but they cluster**. Textured regions (like grass or a corner of a building) produce hundreds of nearby strong corners, while other interesting areas get ignored. **ANMS distributes corners spatially** by keeping only those whose response is stronger than all neighbors within some radius. The result: features spread evenly across the image, which makes downstream matching more reliable.

## Feature Matching + RANSAC

![](/images/cs180_p4_matching.png)

**Matching features naively gives you hundreds of candidates, most of them wrong**. Lowe's ratio test (accept a match only if its nearest-neighbor distance is much smaller than second-nearest) filters aggressive false positives, but still leaves outliers caused by repeated patterns.

**RANSAC is the robust estimator**. Sample 4 random matches, compute the homography they imply, count how many *other* matches agree with that homography. Repeat 1000 times, keep the homography with the most inliers. The green lines in the second panel are the RANSAC-verified matches; the red outliers got discarded because no consistent homography could explain them.

**The outcome**: a 3×3 homography matrix H that maps points from image A's coordinate frame into image B's. Warp image A through H, overlay on image B, blend with a pyramid — panorama done.

## Why the Pipeline Works End-to-End

Each stage absorbs noise from the previous. Harris over-detects — ANMS filters. Matching over-connects — ratio test filters. Ratio test still leaves outliers — RANSAC filters. Even if each stage has 50% error, stacking four independent filters reduces the final error rate to ≈6%. The pipeline is **deliberately redundant**: the whole point of classical computer vision is surviving the failures of individual components.