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

![](/images/cs180_p2_hybrids.png)

**Most of classical image processing is frequency analysis in disguise**. Edge detection is a high-pass filter. Sharpening is the same operation with the original added back. Hybrid images combine one picture's high frequencies with another's low frequencies — your brain picks which one to see based on viewing distance. Seamless image blending splits images into frequency bands, blends each band with an appropriately-sized mask, then reconstructs.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">edge detection</span><span>Finite difference + Gaussian-smoothed derivatives (DoG)</span>
  <span style="color: var(--color-accent);">sharpening</span><span>Unsharp mask: I + α(I − G*I)</span>
  <span style="color: var(--color-accent);">hybrid images</span><span>Low-freq(A) + High-freq(B) → dual-interpretation</span>
  <span style="color: var(--color-accent);">blending</span><span>Laplacian pyramid with Gaussian-blurred mask</span>
</div>

## Edge Detection

![](/images/cs180_p2_edges.png)

**Partial derivatives encode edge orientation**; their magnitude encodes edge strength. Gaussian smoothing before differentiation (Derivative-of-Gaussian filters) dramatically reduces noise — a first-order derivative applied to noisy pixels just produces more noise.

## Unsharp Masking

![](/images/cs180_p2_sharpening.png)

**Sharpening is artificial, but in a controlled way**. The blurred version of an image contains only low frequencies; subtracting it from the original isolates high frequencies. Adding those high frequencies back, scaled by α, amplifies edges without changing overall tonality. Applied here to a Taj Mahal photograph and an Inception film frame.

## Hybrid Images

Look closely: flowers and a ladybug. Step back: just a ladybug. Get closer to your screen: just a flower. **Hybrid images exploit the fact that low-frequency content dominates perception at distance, while high-frequency content dominates up close**. Each image here combines high-frequency components of one photo with low-frequency components of another.

## Multiresolution Blending

![](/images/cs180_p2_blending.png)

**The "oraple" — half orange, half apple** — is the classic demo. Naive cut-and-paste produces a hard visible seam. Laplacian pyramid blending splits each image into frequency bands, applies a mask of appropriate softness to each band (hard cut for high frequencies, soft blur for low), then sums the result. The transition becomes invisible because high-frequency mismatches are localized while low-frequency color differences are gradually interpolated.