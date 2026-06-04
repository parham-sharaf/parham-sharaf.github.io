---
title: "Deep Learning from Scratch"
summary: "The full arc: backpropagation in raw NumPy, CNNs with BatchNorm and Dropout trained to 78% on CIFAR-10, multi-head self-attention for text summarization, and a Masked Autoencoder that reconstructs images from 25% of their patches — then transfers those features to downstream tasks."
date: 2025-02-20
category: "Machine Learning"
tech:
  - Python
  - NumPy
  - PyTorch
  - CIFAR-10
tags:
  - deep-learning
  - cnn
  - backpropagation
  - batchnorm
  - transformer
  - masked-autoencoder
  - self-supervised
featured: true
status: "shipped"
---

![](/images/attn_heatmaps.png)

**4 attention heads on 3 sentences — each head independently learns different relationships: syntactic structure, named entity routing, long-range dependencies.** This project builds everything behind that from scratch: the forward pass in NumPy, CNNs with BatchNorm, the full attention mechanism, and a Masked Autoencoder for self-supervised pretraining.

---

## Part 1 — Backprop by Hand

Before touching PyTorch, the full forward and backward pass was written in NumPy: convolution as a loop over patches, pooling with argmax masks for gradient routing, softmax cross-entropy, and the chain rule applied manually through every layer. No autograd.

The goal was to feel where gradients actually go — which layers throttle them, what happens when activations are poorly conditioned, why depth alone doesn't guarantee a trainable network.

### Learned Filters

<img src="/images/dl_cnn_filters.png" alt="32 learned Conv1 kernels — color-opponent and edge-detector patterns emerge from CIFAR-10" style="margin: 1.5rem 0; border-radius: 0.5rem; width: 100%;" />

**32 first-layer filters after training on CIFAR-10.** Color-opponent pairs and oriented edge detectors emerge without being specified — the same structure Hubel and Wiesel found in V1 cortex, now arising from gradient descent on 50,000 photographs.

---

## Part 2 — BatchNorm, Dropout, and Why They Work

Same architecture (Conv32→Conv64→Conv128→FC256→FC10), trained with and without BatchNorm across a range of learning rates.

$$\hat{x}_i = \frac{x_i - \mu_\mathcal{B}}{\sqrt{\sigma_\mathcal{B}^2 + \epsilon}}, \quad y_i = \gamma \hat{x}_i + \beta$$

<img src="/images/dl_batchnorm.png" alt="BatchNorm training curves and LR sensitivity sweep — BN model is 2.2% better and robust across a 100× LR range" style="margin: 1.5rem 0; border-radius: 0.5rem; width: 100%;" />

**The LR sweep is the telling result.** The BN model holds near-peak accuracy across a 100× range of learning rates. The plain model has a narrow sweet spot. That robustness — not the 2% accuracy bump — is why BatchNorm became standard.

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/dl_gradient_flow.png" alt="Gradient L2 norms by layer — without BN, norms are large and uneven early; with BN they stay consistent through depth" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/dl_cifar_results.png" alt="Per-class accuracy and confusion matrix — trucks 88.9%, cats 61.2%, cat-dog the biggest confusion" style="margin: 0; border-radius: 0.5rem;" />
</div>

**Left:** gradient norms on one backward pass. Without BN, early layers get large uneven gradients. With BN, they stay consistent from FC2 back to Conv1. **Right:** final results — 78.4% overall. Trucks (88.9%) and ships (86.2%) are easy; cats (61.2%) are the hardest. The confusion matrix shows exactly where the model breaks: cat-dog is the single largest off-diagonal entry, two quadrupeds at similar scale and texture.

---

## Part 3 — Multi-Head Self-Attention

<img src="/images/attn_heatmaps.png" alt="Self-attention heatmaps — 4 heads × 3 sentences, each head learns different syntactic and semantic relationships" style="margin: 1.5rem 0; border-radius: 0.5rem; width: 100%;" />

**4 attention heads on 3 news sentences — no two heads are doing the same thing.** One tracks syntactic structure (near-diagonal), one routes through named entities, one connects long-range dependencies. The multi-head structure lets each head specialize on different relationship types within the same sequence.

$$\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V, \quad \text{MultiHead} = \text{Concat}(\text{head}_1, \ldots, \text{head}_h)W^O$$

A full encoder-decoder Transformer was trained for news summarization — separate stacks, cross-attention in the decoder, sinusoidal positional encodings. Teacher forcing during training (feed the correct prefix, not the model's own output) makes gradients sharp but creates a distribution gap at inference that beam search partially closes.

---

## Part 4 — Masked Autoencoder

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/attn_vit_patchify.png" alt="Image patchification — 32×32 image split into 4×4 patches, each becomes a token" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/attn_mae_reconstruction.png" alt="MAE: original, 25% visible patches, reconstructed — across car/dog/horse/ship/bird" style="margin: 0; border-radius: 0.5rem;" />
</div>

A 32×32 image is divided into 64 non-overlapping 4×4 patches, each linearly projected into a token — the same operation as a word embedding, just for image regions. 75% of patches are then masked at random. Only the visible 25% pass through the encoder; the decoder reconstructs the missing pixels.

The asymmetry is the point: heavy masking prevents the model from just interpolating neighbors, so the encoder is forced to build globally coherent scene representations. The decoder is thrown away after pretraining.

### Transfer

<img src="/images/attn_ssl_efficiency.png" alt="MAE pretrained features vs scratch — at 1% labels, pretraining is 57% more accurate" style="margin: 1.5rem 0; border-radius: 0.5rem; width: 100%;" />

After pretraining on unlabeled CIFAR-10, the encoder is frozen and a single linear layer is trained on top. At 1% of labeled data (~500 images), the pretrained encoder is **57% more accurate** than raw pixels. The gap shrinks as more labels are added — self-supervision is most valuable exactly when labeled data is scarce, which is most of the time in practice.
