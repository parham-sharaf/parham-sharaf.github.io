---
title: "Neural Radiance Fields (NeRF)"
summary: "Training an MLP to represent a 3D scene as a continuous function from (x, y, z, θ, φ) to (RGB, density). Volume rendering turns the field back into images; the field itself is the 3D model."
date: 2024-12-10
category: "Computer Vision"
tech:
  - Python
  - PyTorch
  - Neural Rendering
  - 3D Vision
tags:
  - nerf
  - neural-rendering
  - volumetric-rendering
  - 3d-reconstruction
featured: true
status: "shipped"
---

![](/images/cs180_p6_novel_views.gif)

**A NeRF is a neural network whose weights *are* the 3D scene**. Given a 5D input — 3D point location + viewing direction — the MLP outputs the RGB color and volume density at that point. Volumetric rendering integrates along camera rays to produce an image. Train on a few dozen photos of the object from known viewpoints, and the network learns a continuous 3D field you can then render from any new angle.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">input</span><span>5D: position (x, y, z) + view direction (θ, φ)</span>
  <span style="color: var(--color-accent);">output</span><span>4D: RGB color + volume density σ</span>
  <span style="color: var(--color-accent);">architecture</span><span>8-layer MLP with positional encoding (frequency bands)</span>
  <span style="color: var(--color-accent);">training data</span><span>100 photos of Lego truck with known camera poses</span>
</div>

## Part 1 — Fitting a Neural Field to a 2D Image

![](/images/cs180_p6_2d.png)

**Before 3D, warm up with 2D**. Train an MLP to map (x, y) pixel coordinates → RGB color. With no positional encoding, the MLP produces a blurry low-frequency approximation of the image — neural networks naturally learn smooth functions and can't express sharp edges with raw coordinates as input.

**Positional encoding fixes this**. Expand (x, y) into sin/cos at multiple frequency bands (2⁰, 2¹, ..., 2⁹). This gives the MLP a rich basis where high-frequency details become linearly separable. PSNR jumps from ~12 dB (unrecognizable) to ~28 dB (nearly indistinguishable from ground truth).

## Part 2 — 3D NeRF on Lego

![](/images/cs180_p6_rays.png)

**Ray sampling is the central bridge between the network and the image**. For each target pixel: cast a ray from the camera origin through the pixel into the scene; sample dozens of 3D points along that ray; query the NeRF at each point for color and density; composite them according to volumetric rendering equations (transmittance-weighted color integration).

The visualization above shows rays being sampled in increasing count (100 → 1000 → final full render). Each ray contributes one pixel. 100k+ rays per image × 100 training images = ~10M training examples.

![](/images/cs180_p6_nerf.png)

**The architecture — 8-layer MLP with skip connection — is remarkably simple for what it accomplishes**. Positional encoding expands the 5D input into hundreds of sinusoidal features. The hidden dimension is 256. Density prediction branches off early; color prediction comes later after view-direction is concatenated in. PSNR reaches ~27 dB after 5000 iterations on the Lego scene.

## Novel View Synthesis

![](/images/cs180_p6_novel_views_interp.gif)

**The payoff: render the scene from viewpoints no camera ever saw**. Once the NeRF is trained, any new (camera origin, viewing direction) combination can be rendered by casting rays and querying the MLP. The GIFs above show full 360° turntable renders synthesized from the learned field — the model has captured not just surface appearance but the full volumetric structure.

![](/images/cs180_p6_lego_depth_map_video.gif)

**Depth maps fall out for free**. The volume density σ tells us where surfaces are along each ray — integrating ray distance weighted by density gives expected surface depth. No explicit depth supervision during training; the geometry emerges implicitly from the multi-view constraint.

The profound part: **a small MLP (~1M parameters) compresses 100 photos of a scene into a single continuous 3D function**. The representation is implicit — no mesh, no voxels, no point cloud. Just weights in a neural network, and a rendering equation that makes those weights correspond to a visual world.