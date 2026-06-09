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

![](/images/cs180_p1_hero.jpg)

**Before color film existed, Sergei Prokudin-Gorskii traveled across the Russian Empire with a camera that exposed three grayscale plates through red, green, and blue filters.** A century later, the plates survive — but the three exposures are slightly offset, and naive stacking produces ghosted, rainbow-fringed chaos.

<div style="margin: 1.5rem 0;">
  <img src="/images/cs180_p1_plates.jpg" alt="Three glass plates — blue, green, red filtered exposures of the same subject" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

**Three glass plates per photograph** — blue, green, and red filtered exposures of the same subject, captured seconds apart. The job: find the (dx, dy) shift that aligns each pair to the blue reference, then stack them into one full-color image.

## The Alignment Problem

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/cs180_p1_emir_ghosted.jpg" alt="Naive stack — channels offset by tens of pixels" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p1_emir_aligned.jpg" alt="After pyramid + NCC alignment" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

**Left:** naive stack without alignment. The red channel sits 125 pixels down and 17 pixels right of the blue — every edge becomes a rainbow fringe. **Right:** after pyramid-search alignment. The shift is too large for brute-force search at full resolution to be fast, and too large for a small search window to find at all.

## Normalized Cross-Correlation

The score function for a candidate shift $(dx, dy)$ is normalized cross-correlation between the shifted channel and the blue reference:

$$\text{NCC}(dx, dy) = \frac{\sum_{x,y} \hat{I}(x,y)\, \hat{R}(x-dx,\, y-dy)}{\left\|\hat{I}\right\| \cdot \left\|\hat{R}\right\|}$$

where $\hat{I}$ and $\hat{R}$ are the zero-mean normalized versions of the target and reference images. NCC is preferred over sum-of-squared differences (SSD) because the blue, green, and red filters have different transmission spectra — the same scene surface can be significantly brighter in one channel than another. NCC is invariant to these per-channel brightness offsets; SSD is not.

The search exhausts all $(dx, dy)$ within a ±15 pixel window at the coarsest pyramid level and takes the argmax.

## Image Pyramid for Large Offsets

Small plates (JPEG inputs) have offsets of a few pixels — brute force over ±15 is fast. Large plates (TIFF inputs, 3000+ pixels tall) have offsets of 50–140 pixels. Searching a ±150 pixel window at full resolution is O(300² × N²) per channel — too slow.

The pyramid downsamples by 2× repeatedly until the image is under ~200px on the longest side (typically 4–5 levels for the large TIFFs). At the coarsest level, a ±15 window search finds the rough alignment. Each finer level refines with a ±2 window centered on the propagated estimate:

$$\text{shift}_\ell = 2 \times \text{shift}_{\ell+1} + \underset{|\delta| \leq 2}{\operatorname{argmax}}\; \text{NCC}(\text{shift}_{\ell+1} \times 2 + \delta)$$

This reduces the search from O(offset²) to O(levels × window²), making large-plate alignment fast.

## Emir Failure and the Fix

The Emir of Bukhara's robe is dyed with a pigment that reflects red light very differently from green or blue — the robe appears nearly white in the red channel and nearly black in the blue. Raw intensity NCC finds a false optimum: it aligns the robe to itself across channels, which is geometrically wrong.

The fix: replace raw intensities with Sobel edge magnitudes before computing NCC. Edges are driven by geometry (fabric folds, embroidery borders), not filter-specific absorption. Gradient-based alignment gives the correct offset for the Emir (green: (9, 49), red: (17, 125)) whereas intensity-based NCC finds the wrong shift.

## Alignment Results

| Image | Green (dy, dx) | Red (dy, dx) |
|:---|:---:|:---:|
| cathedral | (−1, 1) | (−1, 7) |
| church | (−2, 77) | (−15, 41) |
| emir | (9, 49) | (17, 125) |
| harvesters | (−6, 77) | (2, 133) |
| lady | (−10, 61) | (−19, 95) |
| self portrait | (−2, 141) | (−7, 93) |
| three generations | (0, 47) | (−1, 106) |
| train | (−9, 89) | — |

Large-plate images (emir, harvesters, self portrait) have red-channel offsets over 90 pixels — well outside any single-scale search window and only findable via pyramid.

## The Collection

<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/cs180_p1_color_emir.jpg" alt="Emir of Bukhara" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p1_color_lady.jpg" alt="Lady" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p1_color_three_generations.jpg" alt="Three generations" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p1_color_harvesters.jpg" alt="Harvesters" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p1_color_train.jpg" alt="Steam locomotive" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p1_color_melons.jpg" alt="Melons" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p1_color_onion_church.jpg" alt="Onion-domed church" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p1_color_church.jpg" alt="Church" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p1_color_self_portrait.jpg" alt="Self portrait" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p1_color_sculpture.jpg" alt="Sculpture" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p1_color_icon.jpg" alt="Icon" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p1_color_cathedral.jpg" alt="Cathedral" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p1_color_monastery.jpg" alt="Monastery" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs180_p1_color_tobolsk.jpg" alt="Tobolsk" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Remaining failure cases are images with large rotation between exposures (the camera tilted slightly between shots) and images where the subject moved between plates. Neither is fixable with translation-only search — rotation-aware alignment or optical flow would be needed.
