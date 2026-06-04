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

**Delaunay triangulation meshes on two faces — ~50 manually-annotated landmarks each, triangulated to maximize minimum angles.** Every pixel in the morph is warped by its containing triangle via affine transform. The mesh is what makes smooth identity transitions possible.

## The Triangulation

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/cs180_p3_tri_parham.jpg" alt="Parham triangulation" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p3_tri_conor.jpg" alt="Conor triangulation" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p3_tri_elon.jpg" alt="Elon triangulation" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p3_tri_christian.jpg" alt="Christian triangulation" style="margin: 0; border-radius: 0.5rem;" />
</div>

~50 manually-annotated landmarks per face. Delaunay triangulation builds a mesh that maximizes the smallest angle, avoiding sliver triangles that would warp poorly. Every pixel gets warped by whichever triangle contains it.

## Morph Sequence

![](/images/cs180_p3_filmstrip.jpg)

Five frames from a 46-frame morph. α controls both the shape blend and the cross-dissolve weight — landmarks march across, pixels fade across, and the identity slowly shifts.

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; align-items: start; margin: 1.5rem 0;">
  <img src="/images/cs180_p3_morph.gif" alt="Morph animation" style="margin: 0; border-radius: 0.5rem;" />
  <div style="font-size: 0.95rem; line-height: 1.6;">
    The full animation: 46 frames at 30fps. Notice the eyes shift first — they're the strongest landmarks. The jawline takes longer because it crosses many more triangles, each contributing a partial pull.
  </div>
</div>

## Mean Face & Caricature

<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/cs180_p3_meanface.jpg" alt="Population mean face" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p3_to_mean.jpg" alt="My face warped to mean shape" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/cs180_p3_caricature.jpg" alt="Caricature — α=1.5 extrapolation" style="margin: 0; border-radius: 0.5rem;" />
</div>

**Left:** the population mean of 40+ Danish faces — landmark-averaged, then appearance-averaged. **Center:** my face warped to the mean's shape (still my texture, average proportions). **Right:** a caricature at α=1.5 — instead of interpolating *toward* the mean, extrapolate *away* from it. Whatever made my face distinctive gets exaggerated.
