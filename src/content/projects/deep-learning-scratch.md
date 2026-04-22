---
title: "Deep Learning from Scratch"
summary: "Backpropagation, BatchNorm, Dropout, and CNNs implemented from first principles in NumPy — then PyTorch deployment achieving 74.8% on CIFAR-10."
date: 2024-10-15
category: "Deep Learning"
tech:
  - Python
  - NumPy
  - PyTorch
  - Deep Learning
tags:
  - neural-networks
  - backpropagation
  - convolutional-networks
  - batch-normalization
featured: true
status: "shipped"
---

![](/images/cs182_dl_overview.png)

**Every component of modern deep learning, hand-coded**. Vectorized backprop, BatchNorm, Dropout, CNN layers — gradient-checked to 1e-9 tolerance. Deployed to PyTorch for 74.8% CIFAR-10 accuracy.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">layers</span><span>Affine, ReLU, Conv2D, MaxPool, BatchNorm, Dropout</span>
  <span style="color: var(--color-accent);">optimizers</span><span>SGD, Momentum, RMSProp, Adam — all from scratch</span>
  <span style="color: var(--color-accent);">performance</span><span>74.8% CIFAR-10 with CNN + BN + Dropout</span>
</div>

## BatchNorm Deep Dive

![](/images/cs182_dl_batchnorm.png)

**Enables deep networks**: Without BN, 15+ layer networks fail to train (15% accuracy). With BN, the same depth reaches 84%. Also provides robustness to learning rate choice across 5 orders of magnitude.

## Dropout Regularization

![](/images/cs182_dl_dropout.png)

**Prevents overfitting through stochastic neuron masking**. Optimal dropout rate of 0.4 closes the train-val gap. Inverted dropout scales activations at train time for deterministic inference.

## Convolutional Networks

![](/images/cs182_dl_cnn.png)

**CNN beats FC with 10× fewer parameters**. Hierarchical feature learning — edges → textures → parts → objects. Weakest classes (cat, bird, dog) share visual similarity; strongest (car, truck, plane) have distinctive shapes.