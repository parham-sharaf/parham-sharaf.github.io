---
title: "Entropy Wordle Solver"
summary: "Information-theoretic greedy solver that picks each guess to maximize expected entropy over the remaining word set — averaging 3.92 guesses across 300+ games."
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

![](/images/wordle_pattern_distributions.png)

**The Challenge**: Wordle gives you 6 attempts to guess a 5-letter word from 2,315 possibilities. Each guess reveals color patterns (green=correct position, yellow=wrong position, gray=not in word). How do you choose guesses to **minimize expected attempts**?

**The Insight**: This is fundamentally an **information extraction problem**. Each guess partitions the remaining word space based on possible responses. The optimal strategy maximizes information gained per guess — which means maximizing entropy of the pattern distribution.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">objective</span><span>maximize H(Y_{t,k}) = -∑ p_i log₂(p_i)</span>
  <span style="color: var(--color-accent);">intuition</span><span>uniform patterns → maximum information gain</span>
  <span style="color: var(--color-accent);">optimal opener</span><span>SOARE (5.89 bits from 11.18 total)</span>
  <span style="color: var(--color-accent);">search space</span><span>12,972 valid guesses × 2,315 possible answers</span>
  <span style="color: var(--color-accent);">performance</span><span>3.92 avg guesses (beats human average)</span>
</div>

## Information Theory Foundation

The key mathematical insight: **minimizing expected remaining uncertainty is equivalent to maximizing information gain**, which equals the entropy of the pattern distribution.

Given current word set S and candidate guess g, the entropy is:
```
H(g,S) = -∑ p(pattern) × log₂(p(pattern))
```

Where each pattern probability is `|words matching pattern| / |S|`.

**Why this works**: High entropy means the guess creates many equally-sized partitions of the word space. Low entropy means most words give the same pattern (wasted guess) or create one huge partition plus tiny ones (minimal elimination).

**Example**: Guess "SOARE" against 2,315 words creates 168 distinct patterns with fairly uniform distribution (entropy ≈ 5.89 bits). Guess "QAJAQ" creates only 12 patterns with highly skewed distribution (entropy ≈ 1.89 bits).

## Algorithm Implementation

The solver implements a **greedy optimization** at each step:

```python
def find_optimal_guess(remaining_words, candidate_guesses):
    best_guess, max_entropy = None, 0
    
    for guess in candidate_guesses:
        # Partition remaining words by pattern
        pattern_groups = partition_by_pattern(guess, remaining_words)
        
        # Calculate entropy of partition sizes  
        entropy = calculate_entropy(pattern_groups)
        
        if entropy > max_entropy:
            max_entropy, best_guess = entropy, guess
            
    return best_guess
```

**Computational Challenge**: Evaluating every guess against every remaining word at each step creates O(|guesses| × |words|) complexity. For early game states, this means ~12k × 2k = 24M pattern computations per turn.

**Optimization Strategy**: 
1. **Precompute pattern table**: Store all guess-answer pattern pairs offline (5-minute preprocessing)
2. **Early stopping**: Once entropy difference <0.01 bits, accept current best
3. **Candidate filtering**: Limit search to top 1000 most promising guesses based on letter frequency

## Pattern Distribution Analysis

Different guess types create fundamentally different information structures:

![](/images/wordle_information_theory.png)

**Optimal guesses** (SOARE, CRANE, SLATE) have:
- Many distinct patterns (150-200)
- Relatively uniform probabilities
- High entropy (5.5-6.0 bits)

**Poor guesses** (QAJAQ, XYSTS) have:
- Few distinct patterns (<50)  
- Heavily skewed probabilities
- Low entropy (<3.0 bits)

**The intuition**: Good opening words contain common letters in diverse positions, creating many possible feedback scenarios. Bad words contain rare letters or repeated patterns, leading to predictable (low-information) responses.

## Advanced Optimizations

Several sophisticated optimizations improve performance:

### **1. Opening Book**
Since the first move is always from the full 2,315-word set, precompute the optimal opener rather than recalculating each game. Analysis shows "SOARE" is optimal, beating "CRANE" by 0.02 bits.

### **2. Endgame Strategy Switch**
When ≤3 words remain, switch from entropy maximization to **expected guesses minimization**. With small word sets, it's often better to guess a possible answer (50% chance of immediate win) than an optimal entropy word.

### **3. Dynamic Candidate Pruning**
As word set shrinks, adaptively reduce the candidate guess set. Large sets benefit from exploring obscure high-entropy words; small sets should focus on likely answers.

## Performance Analysis & Benchmarking

![](/images/performance-comparisons.png)

Comprehensive analysis shows the entropy approach significantly outperforming alternative strategies:

![](/images/wordle_performance_histogram.png)

**Key Results**:
- **Average**: 3.92 guesses (vs 4.02 human average)
- **Success rate**: 100% within 6 guesses
- **Distribution**: 85% solved in ≤4 guesses, only 3% require 6 guesses

**Failure Analysis**: The few 6-guess games typically involve:
- Word families with identical letter patterns (BATCH/WATCH/MATCH)
- Words with uncommon letter combinations that resist entropy-based elimination
- Cases where optimal entropy words aren't valid guesses, forcing suboptimal choices

### **Comparison vs Alternative Strategies**

I implemented several baselines for comparison:

**Random Guessing**: 7.2 average guesses (many failures)
**Frequency-Based**: Choose words with most common letters → 4.8 average  
**Minimax**: Minimize worst-case remaining words → 4.1 average
**Entropy + Minimax Hybrid**: **3.85 average** (slight improvement)

The entropy approach significantly outperforms simpler heuristics, validating the information-theoretic foundation.

## Real-World Application Insights

This project demonstrates several broader engineering principles:

### **1. Mathematical Modeling**
Transforming an intuitive game into a rigorous optimization problem using information theory. The connection between "good guesses" and "high entropy" isn't obvious but proves mathematically sound.

### **2. Algorithm Analysis**
Understanding when greedy approaches work (here: diminishing returns from look-ahead) vs when they fail. The entropy heuristic works because Wordle has strong locality properties.

### **3. Performance Engineering**  
Balancing computational cost vs solution quality. The precomputed pattern table trades memory (300MB) for 100x speedup in gameplay.

### **4. Failure Mode Analysis**
Systematic investigation of edge cases reveals algorithm limitations and suggests improvements (like the endgame strategy switch).

## Code Architecture & Testing

Built with clean separation of concerns:

```python
class WordleEngine:      # Game logic, pattern computation
class EntropyOptimizer:  # Core algorithm implementation  
class PerformanceAnalyzer: # Benchmarking and statistics
class StrategyComparator:  # Baseline implementations
```

**Testing Strategy**: 
- Unit tests for pattern computation edge cases (repeated letters, etc.)
- Property-based testing for entropy calculations
- Full game simulation across entire word corpus
- A/B testing different optimization variants

## Extensions & Future Work

This framework generalizes to other **sequential information gathering** problems:

**20 Questions**: Optimal question selection to minimize expected queries
**Medical Diagnosis**: Choosing tests to maximize diagnostic information  
**Database Query Optimization**: Selecting indices to minimize expected lookup time

**Technical Improvements**:
- **Look-ahead search**: Consider 2-step entropy optimization (computationally expensive)
- **Adaptive word lists**: Update based on observed Wordle answer patterns
- **Multi-objective optimization**: Balance average performance vs worst-case robustness

The core lesson: **Information theory provides principled approaches to search and optimization problems** that often outperform domain-specific heuristics. Understanding entropy as a measure of "surprise" or "information content" is crucial for ML engineers working on recommendation systems, active learning, or experimental design.

## Game Trace Example

Here's how the algorithm performs step-by-step on a challenging word:

![](/images/wordle_example_trace.png)

**Turn 1**: SOARE → eliminates 2000+ words, reveals vowel positions  
**Turn 2**: Strategic consonant placement based on remaining entropy
**Turn 3**: Final elimination using pattern constraints → success

This demonstrates how **principled information maximization** leads to efficient, systematic solving rather than lucky guessing.