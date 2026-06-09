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

<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; margin: 1.5rem 0; align-items: start;">
  <img src="/images/cs180_p6_novel_views.gif" alt="360° turntable render of Lego truck synthesized from trained NeRF" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p6_novel_views_interp.gif" alt="Interpolated novel view sequence around the Lego scene" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p6_lego_depth_map_video.gif" alt="Depth map video: distance to surface encoded per-pixel" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

**A NeRF is a neural network whose weights *are* the 3D scene**. Given a 5D input (3D point location + viewing direction), the MLP outputs the RGB color and volume density at that point. Volumetric rendering integrates along camera rays to produce an image. Train on a few dozen photos of the object from known viewpoints, and the network learns a continuous 3D field you can then render from any new angle.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">input</span><span>5D: position (x, y, z) + view direction (θ, φ)</span>
  <span style="color: var(--color-accent);">output</span><span>4D: RGB color + volume density σ</span>
  <span style="color: var(--color-accent);">architecture</span><span>8-layer MLP with positional encoding (frequency bands)</span>
  <span style="color: var(--color-accent);">training data</span><span>100 photos of Lego truck with known camera poses</span>
</div>

## Part 1: Fitting a Neural Field to a 2D Image

<div style="margin: 1.5rem 0;">
  <img src="/images/cs180_p6_2d_arch.png" alt="2D neural field architecture: x (2D) → PE → 3× Linear(256)/ReLU → Linear(3)/Sigmoid → rgb (3D)" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin: 1.5rem 0; align-items: start;">
  <img src="/images/cs180_p6_2d_psnr.png" alt="2D NeRF PSNR over training: starts at ~12 dB, converges to ~22 dB by 1000 iterations" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p6_2d_render.png" alt="Rendered output of the 2D neural field fitted to a fox image" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

**Before 3D, warm up with 2D**. Train an MLP to map (x, y) pixel coordinates → RGB color. With no positional encoding, the MLP produces a blurry low-frequency approximation of the image; neural networks naturally learn smooth functions and can't express sharp edges with raw coordinates as input.

**Positional encoding fixes this**. Each coordinate $p$ is expanded into sin/cos pairs at $L = 10$ frequency octaves:

$$\gamma(p) = \bigl(\sin(2^0\pi p),\, \cos(2^0\pi p),\, \sin(2^1\pi p),\, \cos(2^1\pi p),\, \ldots,\, \sin(2^{L-1}\pi p),\, \cos(2^{L-1}\pi p)\bigr)$$

Applied to both x and y, the 2D input expands to 40 features. This gives the network a rich Fourier basis; instead of learning high-frequency functions from scratch (which smooth MLPs resist), it just weights the provided sinusoids. PSNR jumps from ~12 dB (unrecognizable) to ~28 dB (nearly indistinguishable from ground truth).

## Part 2: 3D NeRF on Lego

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin: 1.5rem 0; align-items: start;">
  <img src="/images/cs180_p6_rays_100.png" alt="100 rays cast from cameras through the scene" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p6_rays_500.png" alt="500 rays, denser coverage of the scene" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p6_rays_1000.png" alt="1000 rays, nearly full scene coverage" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p6_rays_final.png" alt="Final render, all camera rays producing the complete image" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

**Ray sampling is the central bridge between the network and the image**. For each target pixel, a ray $\mathbf{r}(t) = \mathbf{o} + t\mathbf{d}$ is cast from camera origin $\mathbf{o}$ through the pixel. $N$ points are sampled along the ray; the NeRF is queried at each for color $\mathbf{c}_i$ and density $\sigma_i$. These are composited via the **volume rendering integral**:

$$C(\mathbf{r}) = \int_{t_n}^{t_f} T(t)\,\sigma\!\bigl(\mathbf{r}(t)\bigr)\,\mathbf{c}\!\bigl(\mathbf{r}(t), \mathbf{d}\bigr)\,dt, \qquad T(t) = \exp\!\left(-\int_{t_n}^{t} \sigma\!\bigl(\mathbf{r}(s)\bigr)\,ds\right)$$

$T(t)$ is transmittance, the probability the ray reaches $t$ without being absorbed. The integral weights each point's color by how much of the ray's "budget" is deposited there. In practice, the continuous integral is replaced by the discrete approximation used during training:

$$\hat{C}(\mathbf{r}) = \sum_{i=1}^{N} T_i\,\bigl(1 - e^{-\sigma_i \delta_i}\bigr)\,\mathbf{c}_i, \qquad T_i = \exp\!\left(-\sum_{j<i}\sigma_j \delta_j\right), \qquad \delta_i = t_{i+1} - t_i$$

The visualization above shows rays sampled in increasing count (100 → 1000 → final full render). Each ray contributes one pixel. 100k+ rays per image × 100 training images = ~10M training examples.

<div style="margin: 1.5rem 0;">
  <img src="/images/cs180_p6_architecture.jpg" alt="NeRF 8-layer MLP architecture: position PE → 8× Linear(256)/ReLU with skip connection → density branch; view direction PE concatenated in → Linear(256) → Linear(128) → Linear(3)/Sigmoid → RGB" style="margin: 0; border-radius: 0.5rem; width: 100%; background: white; padding: 0.5rem;" />
</div>

**The architecture, an 8-layer MLP with skip connection, is remarkably simple for what it accomplishes.** The position $(x, y, z)$ is expanded via positional encoding ($L = 10$, giving 60 features) and passed through 8 Linear(256)/ReLU layers with a skip connection at layer 5. Density $\sigma$ branches off the 8th layer. The viewing direction $\mathbf{d}$ is positional-encoded separately ($L = 4$, 24 features) and concatenated before the color head: Linear(256) → Linear(128) → Linear(3)/Sigmoid → RGB.

<div style="margin: 1.5rem 0;">
  <img src="/images/cs180_p6_psnr.png" alt="PSNR curve over 1000 training iterations on the Lego scene; rises steeply to ~19 dB then gradually to ~23.5 dB" style="margin: 0; border-radius: 0.5rem; width: 100%; background: white; padding: 0.5rem;" />
</div>

PSNR reaches ~23.5 dB after 1000 iterations on the Lego scene.

## Novel View Synthesis

**The payoff: render the scene from viewpoints no camera ever saw**. Once the NeRF is trained, any new (camera origin, viewing direction) combination can be rendered by casting rays and querying the MLP. The GIFs above show full 360° turntable renders synthesized from the learned field; the model has captured not just surface appearance but the full volumetric structure.

**Depth maps fall out for free**. The volume density σ tells us where surfaces are along each ray; integrating ray distance weighted by density gives expected surface depth. No explicit depth supervision during training; the geometry emerges implicitly from the multi-view constraint.

The profound part: **a small MLP (~1M parameters) compresses 100 photos of a scene into a single continuous 3D function**. The representation is implicit: no mesh, no voxels, no point cloud. Just weights in a neural network, and a rendering equation that makes those weights correspond to a visual world.