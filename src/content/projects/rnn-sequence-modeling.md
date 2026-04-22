---
title: "RNN Sequence Modeling"
summary: "Recurrent networks from scratch — forward pass, backpropagation through time, and gradient flow analysis. Vectorized NumPy implementation validated to 5e-5 tolerance."
date: 2024-11-02
category: "Deep Learning"
tech:
  - Python
  - NumPy
  - PyTorch
  - Sequence Models
tags:
  - rnn
  - lstm
  - sequence-modeling
  - backpropagation
featured: true
status: "shipped"
---

![](/images/cs182_rnn_overview.png)

**RNN forward and backward passes, hand-derived and vectorized**. Gradient-checked implementation with 5e-5 max error. Sequence targets (x, y) predicted across 10 timesteps, validated across four sample batches.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">implementation</span><span>Forward pass (all_h, last_h), BPTT, gradient check</span>
  <span style="color: var(--color-accent);">validation</span><span>Max error 5e-5 across all components</span>
  <span style="color: var(--color-accent);">architectures</span><span>Vanilla RNN, LSTM, GRU — compared head-to-head</span>
</div>

## Gradient Flow Analysis

![](/images/cs182_rnn_gradients.png)

**The vanishing gradient problem in action**. Vanilla RNN gradients collapse to 1e-7 at 50 timesteps — LSTM maintains 1e-1. Hidden state evolution shows how cell gates preserve long-range information that vanilla RNNs lose.