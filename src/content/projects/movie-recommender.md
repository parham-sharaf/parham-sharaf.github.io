---
title: "Collaborative Filtering Movie Recommender"
summary: "SVD-based matrix factorization system with 0.89 RMSE on MovieLens dataset. Handles sparse ratings, cold start problems, and scales to 100k+ users through optimized gradient descent."
date: 2024-04-05
category: "Machine Learning"
tech:
  - Python
  - NumPy
  - Matrix Factorization
  - Collaborative Filtering
tags:
  - recommender-systems
  - matrix-factorization
  - svd
  - optimization
featured: true
status: "shipped"
---

![](/images/cs189_recommender_overview.png)

**SVD matrix factorization achieving 0.89 RMSE** on MovieLens 100K dataset. Handles 94% sparsity through stochastic gradient descent with bias modeling and regularization.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">algorithm</span><span>SVD matrix factorization with bias terms</span>
  <span style="color: var(--color-accent);">scalability</span><span>100k users, 1.7k movies, 10M+ potential ratings</span>
  <span style="color: var(--color-accent);">performance</span><span>0.89 RMSE, beats all baseline methods</span>
</div>

![](/images/cs189_recommender_performance.png)

## Training Dynamics

![](/images/cs189_recommender_convergence.png)

**SGD Optimization**: Loss converges rapidly in 20 epochs. Optimal learning rate α=0.01, regularization λ=0.1 prevents overfitting to sparse patterns.

![](/images/cs189_recommender_analysis.png)

**User Behavior Patterns**: Rating distribution skews positive. Cold start performance improves rapidly with just 5 initial ratings.

![](/images/cs189_recommender_factors.png)

**Latent Factor Analysis**: K=50 factors optimal — fewer underfit complex preferences, more overfit to training sparsity. Training time scales linearly with dimensionality.