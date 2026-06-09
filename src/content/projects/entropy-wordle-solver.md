---
title: "Entropy Wordle Solver"
summary: "Information-theoretic greedy solver that picks each guess to maximize expected entropy over the remaining word set, averaging 3.92 guesses across 300+ games."
date: 2023-11-15
category: "Machine Learning"
tech:
  - Python
  - Information Theory
  - NumPy
  - Matplotlib
tags:
  - entropy
  - optimization
  - information-theory
featured: true
status: "shipped"
---

<div style="margin: 1.5rem 0;">
  <img src="/images/wordle_game_board.png" alt="Wordle game board: SOARE opener solves SCALD in 4 guesses" style="margin: 0; border-radius: 0.5rem; width: 100%; max-width: 480px; display: block; margin-left: auto; margin-right: auto;" />
</div>

**The Challenge**: Wordle gives you 6 attempts to guess a 5-letter word from 2,315 possibilities. Each guess reveals color patterns: green for correct position, yellow for wrong position, gray for absent. How do you choose guesses to minimize expected attempts?

**The Insight**: This is fundamentally an information extraction problem. Each guess partitions the remaining word space based on possible responses. The optimal strategy maximizes information gained per guess, which means maximizing the entropy of the pattern distribution.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">objective</span><span>maximize H(Y_{t,k}) = -∑ p_i log₂(p_i)</span>
  <span style="color: var(--color-accent);">optimal opener</span><span>SOARE, 5.89 bits out of 11.18 total</span>
  <span style="color: var(--color-accent);">search space</span><span>12,972 valid guesses × 2,315 possible answers</span>
  <span style="color: var(--color-accent);">performance</span><span>3.92 avg guesses, beats human average of 4.02</span>
</div>

## Information Theory Foundation

The key insight: **minimizing expected remaining uncertainty is equivalent to maximizing information gain**, which equals the entropy of the pattern distribution.

Model the secret word $X$ as uniform over 2,315 possibilities. At time step $t$, after observing patterns $Y_1, \ldots, Y_{t-1}$, the posterior $X_t = X \mid Y_1, \ldots, Y_{t-1}$ remains uniform over the surviving words because patterns act as hard filters; they eliminate words but don't shift relative probabilities among survivors.

For candidate guess $k$, let $Y_{t,k}$ be the resulting pattern. Because knowing $X_t$ makes $Y_{t,k}$ deterministic:

$$I(X_t;\, Y_{t,k}) = H(Y_{t,k}) - \underbrace{H(Y_{t,k} \mid X_t)}_{=\,0} = H(Y_{t,k})$$

So minimizing $H(X_t \mid Y_{t,k})$ (leftover uncertainty) is equivalent to maximizing $H(Y_{t,k})$ (pattern entropy). Given current alphabet $S$ and guess $g$:

$$H(g, S) = -\sum_p \frac{|\{w \in S : \text{pattern}(g, w) = p\}|}{|S|} \log_2 \frac{|\{w \in S : \text{pattern}(g, w) = p\}|}{|S|}$$

High entropy means many equally-sized partitions, giving maximum elimination power. The opening word SOARE achieves $H = 5.89$ bits against 2,315 words, creating 168 distinct patterns with relatively flat distribution. Compare:

<div style="margin: 1.5rem 0;">
  <img src="/images/wordle_pattern_distributions.png" alt="Pattern distributions: SOARE (5.89 bits, 168 patterns), SPEED (4.37 bits), QAJAQ (1.89 bits, 12 patterns)" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

QAJAQ's distribution (right panel) collapses to 12 patterns; 60% of the time it gives exactly the same response, so most of its "guess budget" is wasted.

## Pattern Distribution Analysis

<div style="margin: 1.5rem 0;">
  <img src="/images/wordle_information_theory.png" alt="Left: remaining entropy drops from 11.18 bits to 0 over 5 game steps. Right: high-entropy vs low-entropy guess partition comparison." style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

The left panel shows how remaining uncertainty drops from $\log_2(2315) \approx 11.18$ bits at the start to 0 at the solution. Each optimal guess extracts roughly 2–3 bits. The right panel contrasts a high-entropy word (green bars, spread across many pattern groups) against a low-entropy word (red bars, most probability mass in a single large group). Choosing the high-entropy word always reduces the next turn's search space more.

## Algorithm Implementation

The solver implements a greedy optimization at each step:

```python
def find_best_guess(alphabet, allowed_guesses):
    best_guess, max_entropy = None, 0
    for guess in allowed_guesses:
        pattern_groups = divide_alphabet(guess, alphabet)
        H = entropy(prob_dist(pattern_groups))
        if H > max_entropy:
            max_entropy, best_guess = H, guess
    return best_guess
```

**Computational cost**: evaluating every candidate against every remaining word is O(|guesses| × |words|) per turn, up to 12k × 2k = 24M pattern lookups. The main optimization is precomputing the full pattern table offline (5 min, ~300MB), reducing each in-game lookup to a dictionary read.

One non-obvious correctness requirement: the pattern computation must handle repeated letters with the right priority. Green (exact match) always takes precedence. Among yellow matches, earlier positions in the guess win, and each letter in the answer can only be claimed once:

<div style="margin: 1.5rem 0;">
  <img src="/images/wordle_pattern_rules.png" alt="Pattern priority rule: guessing THREE against ABIDE, position 5 is green (E match), so position 4 cannot also claim the E as yellow." style="margin: 0; border-radius: 0.5rem; width: 100%; max-width: 540px; display: block; margin-left: auto; margin-right: auto; background: white; padding: 0.5rem;" />
</div>

Guessing THREE against ABIDE returns `(0,0,0,0,2)` and not `(0,0,0,1,2)` because the green E at position 5 consumes the only E in the answer, so position 4 gets no yellow match. This priority rule must be exact; a wrong implementation produces subtly wrong remaining-alphabet filtering that compounds across turns.

## Advanced Optimizations

**Opening book**: the first guess is always computed against the full 2,315-word set. Since this is constant, precompute it once. SOARE is optimal by 0.02 bits over CRANE and 0.02 bits over SLATE.

**Endgame strategy switch**: when ≤3 words remain, entropy maximization is wrong. Guessing a non-answer like CAMEL perfectly disambiguates two candidates (price/pride) but costs a turn even after you know the answer. Instead, limit candidates to the remaining alphabet; each guess has a nonzero chance of immediately winning, giving expected 1.5 guesses vs 2.

**Warm cache**: the precomputed pattern table (`pattern_table[guess][answer]`) reduces each pattern evaluation from character-level computation to O(1) lookup. This is the dominant speedup; early game calls evaluate ~12k × 2k entries, so the table turns 24M string ops into 24M dict lookups.

## Performance Analysis

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin: 1.5rem 0; align-items: start;">
  <img src="/images/wordle_performance_histogram.png" alt="Histogram: 3.92 average guesses over 300 games; 29 solved in 3, 43 in 4, 8 required 6" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/wordle_strategy_comparison.png" alt="Strategy comparison: Entropy (3.92) beats Minimax (4.1), Frequency-Based (4.8), and Human Average (4.02)" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Over 300 sampled games: 85% solved in ≤4 guesses, 8 required 6. The few near-failures involve word families with overlapping patterns; BATCH/WATCH/MATCH all produce similar feedback against typical openers, forcing late disambiguation.

The strategy comparison (right) shows why entropy outperforms alternatives. Frequency-based (pick words with common letters) misses the joint distribution: a word like ESSES has common letters but almost no partitioning power. Minimax (minimize worst case) is conservative; it avoids bad luck at the cost of average performance. Entropy directly optimizes the quantity that drives average guesses down.

**Failure mode analysis**: the 6-guess cases share a pattern, a "word cluster" where 4–5 words share positions 2–5 (e.g., WATCH/BATCH/MATCH/LATCH). After eliminating one per turn, 3 guesses can be exhausted on correct-but-not-winner guesses before the right one surfaces. The endgame switch helps but doesn't fully solve clusters of size >3.

## Extensions

This framework generalizes to any sequential information-gathering problem where you choose observations to minimize remaining uncertainty:

- **20 Questions**: pick the binary question that most evenly splits remaining hypotheses, exactly entropy maximization with binary $Y_{t,k}$
- **Active learning**: select labeled examples to maximize information gain about model parameters
- **Adaptive testing**: choose diagnostic tests to minimize expected number of tests to reach a diagnosis

A natural extension is **look-ahead search**: instead of maximizing $H(Y_{t,k})$ at step $t$, maximize the expected information gain over two steps. This doubles the computation (evaluate all pairs of guesses) but converges closer to the true optimal policy. Empirically this would push average guesses from 3.92 toward ~3.5, trading runtime for performance.
