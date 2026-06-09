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

<div style="margin: 1.5rem 0;">
  <img src="/images/mcmc_cipher_comparison.png" alt="Before: raw ciphertext VTBALNDMNY... After: AMONG US COLLOQUIALLY TERMED AMOGUS TEACHES US TO PUNISH THE MINORITY..." style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

**The Problem**: Given a substitution cipher with 27! possible permutations (~10²⁸ states), how can we efficiently search this astronomical space to decode encrypted text? Traditional frequency analysis fails on short messages, and brute force is computationally impossible.

**The Solution**: Treat cipher-breaking as a Bayesian inference problem. Use Metropolis-Hastings MCMC to sample from the posterior distribution of ciphers, guided by English language statistics extracted from literary corpora.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">state space</span><span>X = {σ : σ is a permutation of alphabet}, |X| = 27!</span>
  <span style="color: var(--color-accent);">proposals</span><span>σ' ← swap two random characters in σ (symmetric)</span>
  <span style="color: var(--color-accent);">acceptance</span><span>A(σ, σ') = min{1, f(σ')/f(σ)}</span>
  <span style="color: var(--color-accent);">likelihood</span><span>f(σ) = ∏ᵢ P(cᵢ₊₁|cᵢ) for bigram transitions in decoded text</span>
  <span style="color: var(--color-accent);">corpus</span><span>100,000 lines of War and Peace → 27×27 bigram matrix</span>
</div>

## Algorithm

The Metropolis-Hastings procedure transforms an intractable combinatorial search into a guided random walk through cipher space:

1. **Start from chaos** — initialize with a random permutation; decoded text is complete gibberish
2. **Propose local changes** — swap two letters in the current cipher, producing a neighboring permutation
3. **Accept based on likelihood** — if the proposed cipher decodes the message to more English-like text ($f(\sigma') > f(\sigma)$), accept always; if worse, accept with probability $f(\sigma')/f(\sigma)$
4. **Iterate** — the chain drifts toward high-likelihood ciphers, i.e. those that produce plausible English

Because the proposal distribution is symmetric (swapping A↔B is equally likely as B↔A), the Hastings correction cancels and the acceptance ratio simplifies to the likelihood ratio alone:

$$A(\sigma, \sigma') = \min\!\left\{1,\; \frac{f(\sigma')}{f(\sigma)}\right\}$$

The stochastic acceptance is critical — it lets the chain escape local optima that a hill-climber would be trapped in permanently.

## Language Modeling

The likelihood function $f(\sigma)$ is a bigram model learned from War and Peace (100k lines, 3.2MB). Rather than crude unigram letter frequencies, it captures **character transition probabilities** — the statistical fingerprint of English.

<div style="margin: 1.5rem 0;">
  <img src="/images/bigram_heatmap.png" alt="27×27 English bigram frequency heatmap — Q→U is bright yellow, most transitions are near-zero purple" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

The Q→U cell glows brightest (yellow): "Q" is followed by "U" ~95% of the time in English. High-frequency transitions like TH, ER, ON, IN (warm blue) are common letter pairs. Near-zero transitions like QX, ZJ (dark purple) are essentially impossible in English. The likelihood under a proposed cipher $\sigma$ is:

$$f(\sigma) = \prod_{i=1}^{N-1} M_{\sigma(c_i),\; \sigma(c_{i+1})}$$

where $M$ is the 27×27 transition matrix and $c_i$ is the $i$-th character of the ciphertext. Computing in log-space and using $\exp(\log f(\sigma') - \log f(\sigma))$ for the ratio avoids underflow on 500+ character sequences.

**Laplace smoothing**: add 1 to all bigram counts before normalizing, so no transition has probability zero. Without this, a single impossible bigram produces $f(\sigma) = 0$ and the chain gets permanently stuck.

## Convergence & Analysis

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin: 1.5rem 0; align-items: start;">
  <img src="/images/mcmc_convergence.png" alt="Log-likelihood over iterations for 5 independent runs — all converge to same plateau around iteration 2000" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/mcmc_analysis.png" alt="Left: acceptance rate decays from ~60% to ~28% (steady state). Right: correct character mappings climb from 1/27 to ~24/27 over 8000 iterations." style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Five independent chains (left) all converge to the same log-likelihood plateau around iteration 2,000, regardless of starting permutation. The rapid rise corresponds to the burn-in phase — early swaps almost always improve the cipher because starting from random, any change is likely helpful. As the chain approaches the high-likelihood region, improvements become harder to find.

The right pair shows the two complementary diagnostics: acceptance rate drops from ~60% early (many improvements available) to a steady ~28% at convergence (most proposals are lateral moves or slight regressions). Correct character mappings climb from 1/27 (random) to ~24/27 by 8,000 iterations — the remaining 3 characters are rare letters (X, Q, Z) that appear too infrequently to get reliable bigram signal.

## Decoding Evolution

<div style="margin: 1.5rem 0;">
  <img src="/images/mcmc_decoding_progression.png" alt="6-step progression: raw ciphertext → burn-in → structure emerging → nearly readable → converging → decoded" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

The algorithm doesn't decode linearly. At 500 iterations (orange row), the chain has found vowel/consonant structure — you can see word-like groupings — but most letters are still wrong. At 1,000 iterations, "AMOIN US" is already recognizable as "AMONG US". At 2,000, 90% of the text is correct but rare letters like W remain mapped incorrectly ("XHO" instead of "WHO"). By 8,000 iterations the message is fully recovered.

**Failure modes**: Three classes of errors resist the algorithm:

- **Rare letter ambiguity** — X, Z, Q appear so rarely that swapping their mappings barely changes $f(\sigma)$; the chain can't distinguish correct vs. incorrect assignments
- **Local minima** — word clusters where one cipher maps three plausible words; the chain accepts and gets stuck at a local optimum that looks like valid English
- **Short message vulnerability** — with fewer than ~100 characters, the bigram statistics have too much variance to reliably distinguish the true cipher from nearby alternatives

## Performance & Failure Analysis

**Vs. frequency analysis**: Unigram frequency (E is most common, map the most frequent cipher character to E, etc.) fails completely on a 538-character message — there's too much variance for letter-frequency matching to work reliably at this message length.

**Vs. hill climbing**: A greedy hill-climber accepts only improving swaps. It reaches a local maximum much faster but gets trapped there permanently. MCMC's stochastic acceptance ($\exp(\Delta \log f)$ with $\Delta < 0$) allows occasional downward moves, providing the escape mechanism that lets the chain explore the full posterior.

**Vs. simulated annealing**: Annealing would lower the acceptance temperature over time, trading exploration for exploitation. For this problem the fixed-temperature Metropolis-Hastings works well because the target distribution is unimodal — there's essentially one correct cipher and the posterior concentrates around it.

The MCMC approach decodes the 592-character message in ~8,000 iterations (≈2 minutes on a laptop), handling any substitution cipher without cipher-specific preprocessing.

## Extensions

The same framework applies to any discrete combinatorial optimization where a likelihood function over states can be defined from domain statistics:

- **Vigenère cipher**: extend to position-dependent bigram models keyed to the period
- **Transposition cipher**: change the state space from permutations to column orderings; proposals become column swaps
- **Unknown-language decoding**: swap in an n-gram matrix from any target corpus

The broader principle: when the true posterior is hard to compute but easy to evaluate (likelihood ratios only), Metropolis-Hastings converts a search problem into a sampling problem — and sampling is tractable even when search is not.
