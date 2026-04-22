---
title: "Decision Trees & Ensemble Methods"
summary: "From-scratch implementation of decision trees with pruning, random forests, and AdaBoost. Comprehensive analysis of overfitting, feature selection, and ensemble performance on real datasets."
date: 2024-03-10
category: "Machine Learning"
tech:
  - Python
  - NumPy
  - Scikit-learn
  - Machine Learning
tags:
  - decision-trees
  - ensemble-methods
  - random-forest
  - adaboost
featured: true
status: "shipped"
---

![](/images/cs189_decision_overview.png)

**Complete decision tree algorithms from first principles** — tree construction, pruning, Random Forest, and AdaBoost. Matches scikit-learn performance with full algorithmic transparency.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">algorithms</span><span>Decision Tree, Random Forest, AdaBoost from scratch</span>
  <span style="color: var(--color-accent);">performance</span><span>Random Forest: 94.2% wine dataset, AdaBoost: 89.7% spam</span>
  <span style="color: var(--color-accent);">analysis</span><span>Bias-variance decomposition, cost-complexity pruning</span>
</div>

![](/images/cs189_decision_performance.png)

## Overfitting Analysis

![](/images/cs189_decision_depth.png)

**Depth vs Accuracy**: Training accuracy increases monotonically while validation peaks at depth 9. Cost-complexity pruning reduces tree size 40% while improving generalization.

![](/images/cs189_decision_ensemble.png)

## Ensemble Methods

**Bootstrap Aggregating**: Out-of-bag error estimation provides unbiased performance validation without separate test set. Feature subsampling creates diverse trees.

![](/images/cs189_decision_boosting.png)

**AdaBoost Evolution**: Sample weights amplify hard examples. Sequential weak learners focus on previously misclassified data points.

![](/images/cs189_decision_features.png)

**Feature Importance**: Gini importance reveals alcohol content and volatile acidity dominate wine quality prediction. Information gain distribution shows typical exponential decay.