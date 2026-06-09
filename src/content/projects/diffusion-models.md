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

<div style="margin: 1.5rem 0;">
  <img src="/images/cs180_p5_generation.png" alt="DeepFloyd IF text-to-image samples at various guidance scales" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Diffusion models learn to denoise — and denoising, run in reverse, generates new images from pure noise. This project covers them in two halves: using DeepFloyd IF (a pretrained 4B-parameter model) to build CFG sampling, SDEdit, inpainting, and visual anagram pipelines; then training a small U-Net from scratch on MNIST to understand what diffusion actually is at the training-loop level.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">pretrained</span><span>DeepFloyd IF — 4B-param text-to-image diffusion model</span>
  <span style="color: var(--color-accent);">sampling</span><span>Iterative DDPM denoising + classifier-free guidance (CFG)</span>
  <span style="color: var(--color-accent);">editing</span><span>SDEdit, RePaint inpainting, visual anagrams via averaged noise</span>
  <span style="color: var(--color-accent);">trained</span><span>Time- and class-conditioned U-Net on MNIST, from scratch</span>
</div>

## The Forward Process

The forward process gradually destroys an image by adding Gaussian noise over $T = 1000$ steps. Each step follows:

$$q(\mathbf{x}_t \mid \mathbf{x}_{t-1}) = \mathcal{N}\!\left(\mathbf{x}_t;\, \sqrt{1 - \beta_t}\,\mathbf{x}_{t-1},\, \beta_t \mathbf{I}\right)$$

where $\{\beta_t\}$ is a fixed noise schedule (linear or cosine). The key identity — the **reparameterization** — lets us jump directly to any timestep without stepping through all previous ones:

$$\mathbf{x}_t = \sqrt{\bar{\alpha}_t}\,\mathbf{x}_0 + \sqrt{1 - \bar{\alpha}_t}\,\boldsymbol{\varepsilon}, \qquad \boldsymbol{\varepsilon} \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$$

where $\bar{\alpha}_t = \prod_{s=1}^t (1 - \beta_s)$. At $t = 0$, $\bar{\alpha}_0 = 1$ and $\mathbf{x}_0$ is clean. At $t = T$, $\bar{\alpha}_T \approx 0$ and $\mathbf{x}_T$ is pure noise.

<div style="margin: 1.5rem 0;">
  <img src="/images/cs180_p5_pipeline.png" alt="Forward noise at t=250/500/750, classical denoising failure, one-step neural denoising, 30-step iterative result" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Classical denoising (Gaussian blur) fails: it smooths noise but also destroys all signal. A single forward pass of the trained U-Net does better — it predicts $\boldsymbol{\varepsilon}$ and subtracts it — but one-step denoising from $t=1000$ still produces blurry results. The full iterative process (30 steps: denoise, add a small amount of noise back, denoise again) recovers sharp images because each step only asks the network for a small correction, keeping its predictions in-distribution.

## Classifier-Free Guidance

The standard DDPM sampling loop produces diverse but often prompt-misaligned outputs. **Classifier-free guidance (CFG)** trades diversity for prompt fidelity without a separate classifier. At each denoising step, run the U-Net twice — once conditioned on the text prompt, once unconditioned — and extrapolate:

$$\tilde{\boldsymbol{\varepsilon}}_\theta = \boldsymbol{\varepsilon}_\theta(\mathbf{x}_t, \varnothing) + w \bigl(\boldsymbol{\varepsilon}_\theta(\mathbf{x}_t, \mathbf{c}) - \boldsymbol{\varepsilon}_\theta(\mathbf{x}_t, \varnothing)\bigr)$$

The guidance scale $w$ controls the trade-off: $w = 1$ is standard sampling; $w = 7$ pushes strongly toward the conditional. The model is simultaneously trained on conditioned and unconditioned inputs (by randomly dropping the conditioning during training), which is why a single model handles both roles.

## SDEdit and Inpainting

**SDEdit**: add noise to an existing image up to some timestep $t^* < T$, then denoise with a new prompt. The amount of noise added controls the edit strength — small $t^*$ makes minimal changes (preserves structure), large $t^*$ allows major transformations (loses structure). The result inherits the original image's low-frequency layout while adapting content to the prompt.

**Inpainting (RePaint)**: at each denoising step, keep the known region by renoising it to match the current timestep, then splice it onto the generated region before the next step:

$$\mathbf{x}_{t-1}[\text{known}] \leftarrow \sqrt{\bar{\alpha}_{t-1}}\,\mathbf{x}_0[\text{known}] + \sqrt{1 - \bar{\alpha}_{t-1}}\,\boldsymbol{\varepsilon}$$

This forces the known region to stay on-distribution for timestep $t-1$, while letting the model generate coherent content inside the mask that blends with its context.

## Visual Anagrams

<div style="margin: 1.5rem 0;">
  <img src="/images/cs180_p5_anagrams.png" alt="Visual anagrams: skull upright / waterfall upside-down, and other dual-interpretation images" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

One image, two prompts, depending on orientation. At each denoising step, predict noise for the upright image under prompt A and for the flipped image under prompt B, then average:

$$\tilde{\boldsymbol{\varepsilon}} = \frac{1}{2}\Bigl(\boldsymbol{\varepsilon}_\theta(\mathbf{x}_t, \mathbf{c}_A) + \text{flip}\bigl(\boldsymbol{\varepsilon}_\theta(\text{flip}(\mathbf{x}_t), \mathbf{c}_B)\bigr)\Bigr)$$

Averaging noise predictions averages the score function gradients — the generator simultaneously follows the gradient toward "skull" and the gradient toward "waterfall upside-down." Because the two gradients point in compatible directions (the image has to satisfy both constraints), the denoising process finds a composition that works for both views.

## Training a U-Net From Scratch

<div style="margin: 1.5rem 0;">
  <img src="/images/cs180_p5_training.png" alt="U-Net samples: epoch 5 (noisy), epoch 20 (clean), time-conditioned, class-conditioned 0–9" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Part B builds diffusion from first principles on MNIST. The U-Net takes a noisy image $\mathbf{x}_t$ and timestep $t$ (encoded as a sinusoidal embedding) and predicts the noise $\boldsymbol{\varepsilon}$. The training objective is simple MSE on the noise prediction:

$$\mathcal{L} = \mathbb{E}_{t, \mathbf{x}_0, \boldsymbol{\varepsilon}}\!\left[\left\|\boldsymbol{\varepsilon} - \boldsymbol{\varepsilon}_\theta\!\left(\sqrt{\bar{\alpha}_t}\,\mathbf{x}_0 + \sqrt{1-\bar{\alpha}_t}\,\boldsymbol{\varepsilon},\, t\right)\right\|^2\right]$$

Each training step: sample $\mathbf{x}_0$, sample $t \sim \text{Uniform}(1, T)$, sample $\boldsymbol{\varepsilon} \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$, compute $\mathbf{x}_t$ via the reparameterization, predict noise, backprop. The model never sees a clean image during the forward pass — only noisy ones at random timesteps.

By epoch 5 the network learns digit structure but samples are noisy. By epoch 20 it produces clean, diverse digits. Adding class conditioning (embedding the digit label alongside the timestep) lets it generate specific digits on demand — the bottom-right panel shows one of each 0–9.

DeepFloyd IF uses the same loss, the same architecture family (encoder-bottleneck-decoder with skip connections), and the same sampling loop — just scaled up by ~6 orders of magnitude in parameters and trained on a much larger dataset with text conditioning. The MNIST version is a complete, working proof-of-concept of the same mechanism.
