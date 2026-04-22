---
title: "Neural Network from Scratch"
summary: "Pure NumPy implementation achieving 99.6% MNIST accuracy through optimized gradient descent, backpropagation, and regularization techniques."
date: 2024-02-15
category: "Machine Learning"
tech:
  - Python
  - NumPy
  - Machine Learning
  - Optimization
tags:
  - neural-networks
  - gradient-descent
  - backpropagation
featured: true
status: "shipped"
---

![](/images/cs189_neural_optimization.png)

**Pure NumPy neural network achieving 99.6% MNIST accuracy**. Hand-coded gradients, optimized SGD, and regularization — no frameworks, complete algorithmic transparency.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">architecture</span><span>784→128→64→10 fully connected with ReLU</span>
  <span style="color: var(--color-accent);">performance</span><span>99.6% test accuracy, 2-minute training</span>
  <span style="color: var(--color-accent);">implementation</span><span>400 lines pure NumPy, gradient verification</span>
</div>

![](/images/cs189_neural_performance.png)

## Training Results

![](/images/cs189_neural_convergence.png)

**Convergence Analysis**: Loss decreases smoothly, gradients decay exponentially, learning rate schedule prevents overshooting.

![](/images/cs189_neural_accuracy.png)

**Performance Breakdown**: Per-digit accuracy analysis reveals systematic patterns. Digits 8/9 most challenging due to visual similarity.

![](/images/cs189_neural_activations.png)

**Activation Function Comparison**: ReLU eliminates vanishing gradients, enabling 10× faster training than sigmoid while achieving superior accuracy.