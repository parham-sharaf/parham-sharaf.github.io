---
title: "Image Geolocation with k-NN & Linear Regression"
summary: "Computer vision system predicting photo locations from visual features. Combines k-nearest neighbors with regression models, achieving 127km median error on global street-view dataset."
date: 2024-05-01
category: "Machine Learning"
tech:
  - Python
  - OpenCV
  - Scikit-learn
  - Computer Vision
  - Machine Learning
tags:
  - computer-vision
  - geolocation
  - k-nearest-neighbors
  - image-processing
featured: true
status: "shipped"
---

![](/images/cs189_geolocation_overview.png)

**Predict photo locations from visual content alone**. Multi-stage k-NN + regression pipeline achieving 127km median error globally. Extracts geographic signals from architecture, vegetation, and lighting.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">features</span><span>HOG + color histograms + SIFT keypoints + metadata</span>
  <span style="color: var(--color-accent);">performance</span><span>127km median error, 34% within 25km</span>
  <span style="color: var(--color-accent);">coverage</span><span>50k+ geotagged images, global dataset</span>
</div>

![](/images/cs189_geolocation_performance.png)

## Algorithm Performance

![](/images/cs189_geolocation_analysis.png)

**k-NN Optimization**: Distance-weighted k-NN with k=20 optimal. Performance improves dramatically with training data size — benefits from geographic clustering.

![](/images/cs189_geolocation_features.png)

**Feature Engineering**: HOG captures architectural patterns, color profiles vary by climate zone. SIFT keypoint density correlates with urbanization level.

![](/images/cs189_geolocation_distance.png)

**Geographic Analysis**: Performance inversely correlates with population density. Europe achieves 89km median error due to distinctive architecture and dense training coverage.