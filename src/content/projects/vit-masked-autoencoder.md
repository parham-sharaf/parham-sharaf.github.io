---
title: "Vision Transformer + Masked Autoencoder"
summary: "ViT classifier achieving 73.5% on CIFAR-10, then self-supervised MAE pretraining boosts finetuned accuracy to 76.8%. Full implementation of patchify, attention pooling, and mask reconstruction."
date: 2024-11-25
category: "Deep Learning"
tech:
  - Python
  - PyTorch
  - Vision Transformers
  - Self-Supervised Learning
tags:
  - vision-transformer
  - masked-autoencoder
  - self-supervised
  - transformers
featured: true
status: "shipped"
---

![](/images/cs182_vit_overview.png)

**Pure attention-based image classifier** — no convolutions. 73.5% CIFAR-10 accuracy from scratch, jumping to 76.8% after MAE self-supervised pretraining. Implemented patchify/unpatchify, multiheaded attention pooling, and full transformer encoder-decoder.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">architecture</span><span>ViT: 4 transformer layers, 256-dim embeddings, 4×4 patches</span>
  <span style="color: var(--color-accent);">pretraining</span><span>MAE with 75% mask ratio, encoder-decoder asymmetric</span>
  <span style="color: var(--color-accent);">results</span><span>ViT scratch: 73.5% · MAE finetune: 76.8% CIFAR-10</span>
</div>

## Masked Autoencoder Reconstruction

![](/images/cs182_mae_reconstruction.png)

**Reconstructs images from 25% of patches**. The asymmetric design — heavy encoder, lightweight decoder — learns robust representations by forcing the model to predict missing content from minimal visible context.

## Self-Supervised Learning Analysis

![](/images/cs182_mae_ssl.png)

**The 75% mask ratio is the sweet spot** — too little masking is too easy, too much loses all context. MAE pretraining dramatically improves data efficiency: with only 10% of labels, MAE finetuning reaches 62% while training from scratch only gets 46%.