---
title: "Transformer for News Summarization"
summary: "Self-attention, multi-head attention, and encoder-decoder architecture implemented from scratch. Trained on CNN/DailyMail achieving 35.1 ROUGE-L, outperforming LSTM baseline by 60%."
date: 2024-11-15
category: "Deep Learning"
tech:
  - Python
  - PyTorch
  - Transformers
  - NLP
tags:
  - transformers
  - attention
  - summarization
  - nlp
featured: true
status: "shipped"
---

![](/images/cs182_transformer_overview.png)

**End-to-end Transformer for abstractive summarization** — scaled dot-product attention, positional encoding, layer norm, encoder-decoder stack. Beats LSTM language model baseline by 60% on ROUGE-L. LSTM for headline generation trained in parallel as comparison.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">implementation</span><span>Multi-head attention, positional encoding, encoder-decoder</span>
  <span style="color: var(--color-accent);">performance</span><span>ROUGE-L: 35.1, BLEU-4: 24.8 on CNN/DailyMail</span>
  <span style="color: var(--color-accent);">perplexity</span><span>35.2 on language modeling task</span>
</div>

## Multi-Head Attention

![](/images/cs182_transformer_attention.png)

**Different heads learn different relationships** — syntactic adjacency, coreference resolution, positional patterns, and semantic clustering. This functional specialization emerges without explicit supervision.

## Scaling Behavior

![](/images/cs182_transformer_scaling.png)

**Depth, heads, and sequence length ablations**. Performance saturates around 8 layers and 8 heads. Transformer processes 3× more samples/sec than LSTM thanks to parallelization — no sequential dependency in self-attention.