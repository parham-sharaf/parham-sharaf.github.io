---
title: "Filters & Frequencies — Edges, Hybrid Images, and Blending"
summary: "Working in the frequency domain to extract edges, create hybrid images that change meaning with viewing distance, and blend images seamlessly via Laplacian pyramids. Ends with the famous 'oraple.'"
date: 2024-09-25
category: "Computer Vision"
tech:
  - Python
  - NumPy
  - SciPy
  - Computer Vision
tags:
  - image-filters
  - frequency-domain
  - hybrid-images
  - pyramid-blending
featured: true
status: "shipped"
---

<div style="margin: 1.5rem 0;">
  <img src="/images/cs180_p2_hybrids.png" alt="Hybrid images: Derek+Nutmeg, Fish+Ocean, Muscle+Skeleton, Flower+Ladybug" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Most of classical image processing is frequency analysis in disguise. Edge detection is a high-pass filter. Sharpening adds back high frequencies. Hybrid images combine one image's high frequencies with another's low frequencies — your visual system resolves the ambiguity based on viewing distance. Seamless blending works by splitting images into frequency bands, blending each band separately, then reconstructing.

## Edge Detection

<div style="margin: 1.5rem 0;">
  <img src="/images/cs180_p2_edges.png" alt="Cameraman: partial derivatives ∂I/∂x and ∂I/∂y, gradient magnitude, binarized edges" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Edges appear where image intensity changes rapidly. The partial derivative in x is approximated with a finite difference kernel $D_x = [-1, 1]$, and similarly $D_y = [-1; 1]$ for y. The gradient magnitude is:

$$|\nabla I| = \sqrt{\left(\frac{\partial I}{\partial x}\right)^2 + \left(\frac{\partial I}{\partial y}\right)^2}$$

The problem with differentiating noisy images directly: differentiation amplifies high-frequency noise, turning a single noisy pixel into a sharp spike in the derivative. The fix is the **Derivative-of-Gaussian (DoG)** filter — convolve the Gaussian with the difference kernel first, then apply that single filter to the image:

$$\text{DoG}_x = \frac{\partial}{\partial x}(G_\sigma * I) = \left(\frac{\partial G_\sigma}{\partial x}\right) * I$$

Convolution is associative, so computing $G_\sigma * D_x$ once and applying it produces identical results to smoothing then differentiating — with one fewer convolution pass. The Gaussian suppresses noise at scales below $\sigma$ before the derivative sees it.

## Unsharp Masking

<div style="margin: 1.5rem 0;">
  <img src="/images/cs180_p2_sharpening.png" alt="Taj Mahal and Inception frame: original, blurred, sharpened" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Sharpening amplifies edges without changing overall brightness. The low-frequency content of an image is $G_\sigma * I$; subtracting it from the original isolates high frequencies $(I - G_\sigma * I)$. Adding those back scaled by $\alpha$ gives the unsharp mask formula:

$$I_\text{sharp} = I + \alpha(I - G_\sigma * I) = (1 + \alpha)I - \alpha\, G_\sigma * I$$

Rearranging: $I_\text{sharp} = ((1+\alpha)\delta - \alpha G_\sigma) * I$ — a single combined filter. The result exaggerates edges, which the visual system reads as increased sharpness even though no new information was added. Over-sharpening ($\alpha$ too large) produces visible ringing artifacts (Gibbs phenomenon) around sharp edges.

## Hybrid Images

Look at the flower-ladybug image in the hero: up close you see the ladybug's high-frequency detail; from a distance the flower's low-frequency shape dominates. The construction:

$$I_\text{hybrid} = \underbrace{G_{\sigma_1} * I_A}_{\text{low freq of A}} + \underbrace{(I_B - G_{\sigma_2} * I_B)}_{\text{high freq of B}}$$

$\sigma_1$ and $\sigma_2$ set the cutoff frequency. The choice of which image contributes low vs high frequencies determines what you see close vs far. The human visual system's spatial frequency sensitivity drops sharply above about 6 cycles/degree — so at distance, only the low-frequency image is visible. The two frequency bands occupy non-overlapping parts of the spectrum and don't interfere with each other.

Alignment of the two images at the semantic level (eyes to eyes, faces at same scale) is critical — misaligned anchors produce jarring hybrids.

## Multiresolution Blending

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin: 1.5rem 0; align-items: start;">
  <img src="/images/cs180_p2_blending.png" alt="Blending results: oraple, Joker+Harley, Eye+NYC skyline" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p2_laplacian_pyramid.jpg" alt="Laplacian pyramid levels 0, 2, 4 and final blend for the oraple" style="margin: 0; border-radius: 0.5rem; width: 100%; background: white; padding: 0.25rem;" />
</div>

Naive alpha-blending at a seam leaves a visible transition because high-frequency mismatches (sharp edges) are blended with the same soft transition used for low-frequency color differences. The fix: blend each frequency band independently with a mask appropriate to that band's scale.

The **Laplacian pyramid** decomposes an image into frequency bands. Let $G_k$ be the $k$-th level of a Gaussian pyramid (each level downsampled by 2× from the previous). The Laplacian level $k$ is:

$$L_k = G_k - \text{upsample}(G_{k+1})$$

Each $L_k$ captures a band of frequencies centered around the Nyquist frequency of level $k$. To blend:

1. Build Laplacian pyramids $L^A$, $L^B$ for both images
2. Build a Gaussian pyramid $G^M$ from the mask
3. Blend each level: $L^S_k = G^M_k \cdot L^A_k + (1 - G^M_k) \cdot L^B_k$
4. Reconstruct by summing upsampled levels

At high-frequency levels, the mask is crisp (sharp cut between left and right). At low-frequency levels, the mask has been blurred many times — so the color transition is gradual. The right panel above shows pyramid levels 0, 2, and 4 for the oraple: high frequencies are cut sharply at the seam; low frequencies blend smoothly across the whole image.
