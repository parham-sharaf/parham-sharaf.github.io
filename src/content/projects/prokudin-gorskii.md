---
title: "Colorizing 1907 Russian Empire Photographs"
summary: "Reconstructing color from Sergei Prokudin-Gorskii's glass plate negatives (captured 1907–1915) using image pyramids and normalized cross-correlation alignment."
date: 2024-09-10
category: "Computer Vision"
tech:
  - Python
  - NumPy
  - scikit-image
  - Computer Vision
tags:
  - image-alignment
  - computational-photography
  - historical-photography
featured: true
status: "shipped"
---

![](/images/cs180_p1_hero.png)

**Before color film existed, Sergei Prokudin-Gorskii traveled across the Russian Empire with a custom camera that took three grayscale exposures through red, green, and blue filters**. A century later, his 2000+ glass plates survive — but aligning the three channels back into color images is non-trivial: tiny mechanical shifts between exposures mean naive stacking produces ghosted, rainbow-fringed chaos.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">input</span><span>3 stacked grayscale plates (B, G, R) from glass negatives</span>
  <span style="color: var(--color-accent);">method</span><span>Image pyramid + normalized cross-correlation search</span>
  <span style="color: var(--color-accent);">output</span><span>Aligned RGB composite, 14 Prokudin-Gorskii photographs</span>
</div>

## The Alignment Pipeline

![](/images/cs180_p1_pipeline.png)

**Why NCC over SSD?** Normalized cross-correlation is invariant to global brightness differences between plates (which differ because each filter absorbs light differently). Sum-of-squared-differences, by contrast, can be dominated by overall intensity mismatch rather than structural alignment.

**Why pyramids?** Brute-force search for the right (x, y) offset at full resolution means evaluating millions of candidate offsets per plate for large images (the original TIFFs are 10,000 pixels tall). Image pyramids turn this O(n²) search into O(log n): align at the coarsest level, then refine offsets at each successive resolution. A 100× speedup with no accuracy loss.

**Edge-based refinement**: the emir image has colored clothing that confuses intensity-based alignment — the red robe looks bright in the red channel but dim in blue/green. Switching to gradient-magnitude alignment (where the structural *edges* drive the correlation rather than raw pixel values) resolves this. The emir image visible above was aligned via edge features.