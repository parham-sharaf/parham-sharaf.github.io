---
title: "MCMC Cipher Decoder"
summary: "Metropolis-Hastings breaking substitution ciphers against bigram frequencies — watch garbled text slowly resolve into English over MCMC iterations."
date: 2023-10-28
category: "Machine Learning"
tech:
  - Python
  - NumPy
  - Matplotlib
  - MCMC
  - Information Theory
tags:
  - mcmc
  - cryptography
  - probability
featured: true
status: "shipped"
---

![](/images/cipher_comparison.png)

**The Problem**: Given a substitution cipher with 27! possible permutations (~10²⁸ states), how can we efficiently search this astronomical space to decode encrypted text? Traditional frequency analysis fails on short messages, and brute force is computationally impossible.

**The Solution**: Treat cipher-breaking as a Bayesian inference problem. Use Metropolis-Hastings MCMC to sample from the posterior distribution of ciphers, guided by English language statistics extracted from literary corpora.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">state space</span><span>X = {σ : σ is a permutation of alphabet}, |X| = 27!</span>
  <span style="color: var(--color-accent);">proposals</span><span>σ' ← swap two random characters in σ</span>
  <span style="color: var(--color-accent);">acceptance</span><span>A(σ, σ') = min{1, f(σ')/f(σ)}</span>
  <span style="color: var(--color-accent);">likelihood</span><span>f(σ) = ∏ᵢ P(cᵢ₊₁|cᵢ) for decoded sequence</span>
  <span style="color: var(--color-accent);">corpus</span><span>bigram frequencies from 100k lines of War and Peace</span>
</div>

## The Algorithm

The key insight is that **we don't need to evaluate all possible ciphers** — we just need to sample from the ones that produce English-like text. MCMC lets us explore this space intelligently by:

1. **Starting from chaos**: Begin with a random permutation (complete gibberish)
2. **Proposing local changes**: Swap two letters and evaluate the new cipher
3. **Accepting based on likelihood**: Better English → higher acceptance probability
4. **Gradually converging**: The chain naturally drifts toward readable text

This transforms an intractable combinatorial search into a guided random walk through cipher space.

## Language Modeling

The foundation is a bigram model learned from War and Peace (3.2MB of text). Rather than crude letter frequencies, we capture **transition probabilities** between character pairs — the statistical signature of English.

![](/images/bigram_heatmap.png)

**Key patterns emerge**: High probability transitions like TH, ER, ON, AN (dark regions) vs impossible combinations like QX, ZJ (light regions). The model knows that 'U' almost always follows 'Q', that spaces frequently precede vowels, and that double letters occur in predictable patterns.

**Technical challenge**: Handling the 27×27 transition matrix required careful smoothing with Laplace smoothing (adding 1 to all counts) to avoid zero probabilities that would break the log-likelihood computation.

## MCMC Implementation Deep Dive

The Metropolis-Hastings implementation had several non-obvious challenges:

**Proposal Distribution**: Simple character swaps create a symmetric proposal distribution, simplifying the acceptance ratio to just likelihood ratios. More complex proposals (like 3-way swaps) would require tracking proposal probabilities.

**Numerical Stability**: Computing products of probabilities across 500+ character sequences led to underflow. Solution: work in log-space and use `exp(log_new - log_old)` for acceptance ratios.

**Convergence Diagnostics**: Unlike standard MCMC, we can't rely on trace plots of parameters. Instead, I track the log-likelihood trajectory and monitor text readability as a proxy for convergence.

![](/images/mcmc_convergence.png)

![](/images/algorithm-analysis.png)

**Convergence Diagnostics**: MCMC chains exhibit classic burn-in behavior with rapid initial improvement followed by steady convergence. The algorithm consistently reaches high-likelihood solutions across multiple runs, validating the approach.

## Decoding Evolution

The most compelling aspect is watching **meaning emerge from chaos**. The algorithm doesn't decode linearly — it's more like adjusting radio static until signals lock in:

![](/images/decoding_progression.png)

**Early iterations (≤500)**: Complete gibberish with random character swaps
**Middle phase (1000-2000)**: Word-like patterns emerge; vowel/consonant placement improves  
**Convergence (2000+)**: Readable English with only occasional character errors

**Failure modes I discovered**: 
- **Rare letter confusion**: Letters like X, Z, Q appear infrequently, so their mappings remain uncertain
- **Local minima**: Sometimes the chain gets stuck in plausible-but-incorrect decodings
- **Short message vulnerability**: With <100 characters, there's insufficient statistical signal

## Performance Analysis

Compared this MCMC approach against traditional methods:

**Frequency Analysis**: Fails completely on the 538-character test message (too short for reliable statistics)

**Dictionary Attacks**: Could work but requires massive computational overhead — testing every word against every possible substitution

**Hill Climbing**: Gets trapped in local optima. MCMC's stochastic acceptance allows escape from suboptimal solutions

**Results**: MCMC successfully decoded the message in ~8000 iterations (2 minutes on modern hardware), while maintaining the flexibility to handle any substitution cipher without preprocessing.

## Applications & Extensions

This same framework generalizes to other cryptanalytic problems:

**Vigenère Ciphers**: Extend to bigram models across different key positions
**Transposition Ciphers**: Change the state space from permutations to arrangements
**Unknown Languages**: Use n-gram models from target language corpora

The broader lesson: **MCMC transforms discrete optimization problems into probabilistic inference**, opening up problems that would be intractable for traditional search algorithms.

**Code Architecture**: Modular design with separate classes for corpus processing, MCMC sampling, and convergence analysis makes it easy to swap different language models or proposal distributions.

This project demonstrates how **probabilistic thinking can crack problems that seem computationally impossible** — a key skill for ML engineers working on complex search and optimization challenges.