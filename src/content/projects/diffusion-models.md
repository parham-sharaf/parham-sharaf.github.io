---
title: "Fun With Diffusion Models"
summary: "Sampling from DeepFloyd IF — CFG, SDEdit, inpainting, visual anagrams. Then training a time- and class-conditioned U-Net from scratch on MNIST to learn the diffusion process end-to-end."
date: 2024-11-20
category: "Computer Vision"
tech:
  - Python
  - PyTorch
  - Diffusion Models
  - Generative AI
tags:
  - diffusion
  - generative-models
  - stable-diffusion
  - unet
featured: true
status: "shipped"
---

![](/images/cs180_p5_generation.png)

**Diffusion models learn to denoise — which, running backwards, generates new images from pure noise**. This project explores them in two halves. Part A uses DeepFloyd IF (a pretrained 4B-parameter diffusion model) to build sampling, inpainting, SDEdit, and visual anagram pipelines. Part B trains a much smaller U-Net from scratch on MNIST to demystify what diffusion *actually is* at the training-loop level.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">pretrained</span><span>DeepFloyd IF — 4B-param text-to-image diffusion model</span>
  <span style="color: var(--color-accent);">sampling</span><span>Iterative denoising + classifier-free guidance (CFG)</span>
  <span style="color: var(--color-accent);">editing</span><span>SDEdit, RePaint inpainting, factorized hybrids</span>
  <span style="color: var(--color-accent);">trained</span><span>Time- and class-conditioned U-Net on MNIST from scratch</span>
</div>

## Denoising Pipeline

![](/images/cs180_p5_pipeline.png)

**The forward process adds Gaussian noise in T=1000 steps according to a known schedule**. Classical denoising (Gaussian blur) fails catastrophically — it smooths noise but also destroys signal. A single forward pass of a trained diffusion model does better, predicting the noise and subtracting it. But single-step denoising doesn't recover sharp images from heavy noise; the full iterative process (denoise, add a bit of noise back, denoise again — 30 times) is what produces clean outputs.

## Text-to-Image, Inpainting, SDEdit

**Classifier-free guidance (CFG)** is the trick behind good diffusion samples. Run the U-Net twice per step: once conditioned on the prompt, once unconditionally. Extrapolate *past* the conditional prediction toward the prompt (`guidance_scale` = 7 in the results above). The model gets pushed toward stronger prompt alignment without needing an external classifier.

**SDEdit** adds just a little noise to an input image, then runs the reverse process with a new prompt — the result looks like the input but the content follows the prompt. **Inpainting** is the same trick with a mask: only denoise inside the mask, keep the outside pixels fixed (but renoise+remix during each step so the generator adapts to context).

## Visual Anagrams

![](/images/cs180_p5_anagrams.png)

**One image, two valid interpretations depending on orientation**. The setup: at each denoising step, predict noise for the *upright* image with prompt A, predict noise for the *flipped* image with prompt B, average the two. The model simultaneously pushes the image toward "skull" (upright) and "waterfall" (upside-down) — so the final image satisfies both constraints in one composition. This is optimization, not cleverness: the diffusion process naturally solves the constraint because averaging noise predictions averages the implied gradients.

## Training a U-Net From Scratch

![](/images/cs180_p5_training.png)

**Part B builds diffusion from first principles**. A simple U-Net (encoder-bottleneck-decoder with skip connections) takes a noisy image plus a time embedding (and optionally a class embedding) and predicts the noise. Training: sample an image, sample a random timestep t, add noise according to schedule, train network to predict that noise.

After 5 epochs on MNIST the network learns digit structure. By epoch 20 it produces clean digits from pure noise. Adding class conditioning lets it generate any specific digit — one of each 0–9 shown in the bottom-right panel.

The deeper lesson: **DeepFloyd IF is just this, scaled up by ~6 orders of magnitude**. Same loss function. Same architecture family. Same sampling loop. Understanding MNIST diffusion demystifies Stable Diffusion.