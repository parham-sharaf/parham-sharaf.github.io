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

![](/images/cs180_p1_plates.jpg)

**Three glass plates per photograph** — blue, green, and red filtered exposures of the same subject, captured seconds apart. Each looks like a tinted black-and-white image. The job: find the (x, y) shift that aligns each pair, then stack them into one full-color image.

## The Alignment Problem

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/cs180_p1_emir_ghosted.jpg" alt="Naive stack — channels offset by tens of pixels" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p1_emir_aligned.jpg" alt="After pyramid + NCC alignment" style="margin: 0; border-radius: 0.5rem;" />
</div>

**Left:** stacking the three plates without alignment. The R channel sits 104 pixels down and 56 right of the B channel — every edge becomes a rainbow. **Right:** after pyramid-search NCC alignment. Pyramid downsampling cuts the search from O(n²) brute force to O(log n); normalized cross-correlation handles the brightness mismatch between filters that would dominate a sum-of-squared-differences score.

## The Collection

<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/cs180_p1_color_emir.jpg" alt="Emir of Bukhara" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p1_color_lady.jpg" alt="Lady" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p1_color_three_generations.jpg" alt="Three generations" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p1_color_harvesters.jpg" alt="Harvesters" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p1_color_train.jpg" alt="Steam locomotive" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p1_color_melons.jpg" alt="Melons" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p1_color_onion_church.jpg" alt="Onion-domed church" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p1_color_church.jpg" alt="Church" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p1_color_self_portrait.jpg" alt="Self portrait" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p1_color_sculpture.jpg" alt="Sculpture" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p1_color_icon.jpg" alt="Icon" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p1_color_cathedral.jpg" alt="Cathedral" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p1_color_monastery.jpg" alt="Monastery" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p1_color_tobolsk.jpg" alt="Tobolsk" style="margin: 0; border-radius: 0.5rem;" />
</div>

The emir's robe was the hardest plate — its red dye absorbs differently in each filter, so intensity-based alignment fails. Switching to gradient-magnitude features (where edges drive the correlation, not raw pixels) fixes it.
