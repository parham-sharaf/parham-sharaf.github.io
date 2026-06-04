---
title: "Classical ML from Scratch"
summary: "Two learning paradigms built from NumPy up — tree-based spam classification (decision tree, Random Forest, AdaBoost) and SVD/ALS matrix factorization for movie recommendations. No frameworks; matched scikit-learn on both."
date: 2025-02-10
category: "Machine Learning"
tech:
  - Python
  - NumPy
  - SciPy
  - Machine Learning
tags:
  - decision-trees
  - random-forest
  - adaboost
  - collaborative-filtering
  - matrix-factorization
featured: true
status: "shipped"
---

![](/images/ml_spam_tree.png)

**The full spam decision tree — depth 9, 32 word-frequency features, hand-grown via information gain.** Every split is a threshold on a real word ("exclamation ≤ 0.5", "dollar ≤ 2.5"). The tree memorizes training data perfectly by depth 15; the interesting problem is why that's wrong, and what to do about it.

## Part 1 — Spam Classifier

### Structure in the Data

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; align-items: start; margin: 1.5rem 0;">
  <img src="/images/ml_spam_tsne.png" alt="t-SNE of 5,629 emails on log word-frequency features — spam clusters emerge" style="margin: 0; border-radius: 0.5rem;" />
  <div style="font-size: 0.95rem; line-height: 1.6;">
    t-SNE on log-transformed word frequencies for all 5,629 emails. The spam and ham populations aren't cleanly separable — they share the same feature space — but tight spam sub-clusters are visible. Those clusters correspond to template-based spam: batches of near-identical emails with the same word profile. A single decision stump on "exclamation" already carves off a large chunk.
  </div>
</div>

### Which Words Give It Away

<img src="/images/ml_spam_features.png" alt="Random Forest feature importance — exclamation and dollar signs dominate spam prediction" style="margin: 1.5rem 0; border-radius: 0.5rem; width: 100%;" />

**Exclamation mark frequency is the single strongest predictor — 3× more important than dollar signs.** Spam writers use exclamation to create urgency; ham almost never does. "Parenthesis" and "semicolon" ranking high is less obvious — it reflects HTML formatting artifacts in the email corpus. "Drug", "prescription", and "pain" rank low because 2004 spam was more financially-themed than medically-themed.

### Overfitting & Ensembles

The splitting criterion is information gain:

$$IG(S, A) = H(S) - \sum_{v} \frac{|S_v|}{|S|} H(S_v), \quad H(S) = -\sum_k p_k \log_2 p_k$$

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/ml_dt_overfit.png" alt="Single tree overfitting — train accuracy climbs, val peaks at depth 10 then falls" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/ml_adaboost.png" alt="AdaBoost ensemble error convergence — val error drops as learner weights decay" style="margin: 0; border-radius: 0.5rem;" />
</div>

**Left:** training accuracy climbs monotonically while validation peaks at depth 10. A depth-20 tree has memorized noise. Random Forest (dashed) beats the best single tree by staying shallow across 200 bootstrapped trees — bagging reduces variance without touching bias.

**Right:** AdaBoost drives ensemble error down over 15 rounds. Learner weight α decays because later stumps face harder examples — the residual errors left by all previous rounds — and so each stump is less confident. The ensemble improves anyway by accumulating many weak signals.

---

## Part 2 — Movie Recommender

### The Problem is the Sparsity

<img src="/images/ml_rating_matrix.png" alt="200 users × 100 movies rating matrix — 64% sparse, sorted by mean rating" style="margin: 1.5rem 0; border-radius: 0.5rem; width: 100%;" />

The rating matrix: 24,983 users × 100 movies, 64% empty. Each row is a user's taste; each column is a movie's reception. Sorted by mean rating, a faint diagonal gradient is visible — positive users cluster top-right, negative users cluster bottom-left — but the structure is mostly hidden in the noise of missing entries. The goal is to fill in the blanks from the pattern of what is observed.

### Factorization

Find two matrices $U \in \mathbb{R}^{n \times d}$ and $V \in \mathbb{R}^{m \times d}$ that minimize reconstruction error on observed ratings only:

$$\min_{U,\,V} \sum_{(i,j)\,\in\,\Omega} \left(R_{ij} - \mathbf{u}_i^\top \mathbf{v}_j\right)^2 + \lambda \left(\|U\|_F^2 + \|V\|_F^2\right)$$

Alternating Least Squares (ALS) solves this by fixing $V$ and solving for $U$ in closed form, then swapping. Each subproblem is a ridge regression — $\mathbf{u}_i = (V_{J_i}^\top V_{J_i} + \lambda I)^{-1} V_{J_i}^\top \mathbf{r}_i$ where $J_i$ is the set of movies user $i$ has rated.

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/ml_movie_similarity.png" alt="Movie-movie cosine similarity heatmap (ALS latent vectors, ward-clustered) and ALS convergence curve" style="margin: 0; border-radius: 0.5rem;" />
</div>

**Left:** cosine similarity between learned movie vectors after 20 ALS iterations. The block structure reveals groups of movies the model has learned are interchangeable — users who liked one tend to like the others. **Right:** ALS convergence — train MSE drops sharply in the first 5 iterations and plateaus; validation accuracy (predicting rating sign) reaches 72% and holds.

SVD with $d=10$ singular vectors provides the warm start. ALS then refines on observed entries only — which SVD can't do since it requires a dense matrix.
