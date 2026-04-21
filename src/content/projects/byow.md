---
title: "Procedurally Generated 2D Tile World"
summary: "A seed-driven tile world with procedurally generated rooms, Dijkstra-planned hallways, a walkable avatar, line-of-sight exploration, and deterministic save/load."
date: 2023-05-01
category: "Procedural Generation"
tech:
  - Java
  - Dijkstra's Algorithm
  - Graph Theory
  - Persistence
tags:
  - games
  - procedural
  - algorithms
featured: true
status: "shipped"
---

![](/images/byow-hero.png)

Every world is deterministic in its seed. Change the seed, get a new world — same engine, same rules.

<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/byow-hero.png" alt="" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/byow-world-gold.png" alt="" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/byow-world-explore.png" alt="" style="margin: 0; border-radius: 0.5rem;" />
</div>

## Line of sight

Toggle `M` and the world collapses to a radius-8 spotlight around your avatar. Exploration becomes real.

<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/byow-los-white.png" alt="" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/byow-los-gold.png" alt="" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/byow-los-pink.png" alt="" style="margin: 0; border-radius: 0.5rem;" />
</div>

## Controls

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1rem 0;">
  <span style="color: var(--color-accent);">N &lt;seed&gt; S</span><span>new world from seed</span>
  <span style="color: var(--color-accent);">W A S D</span><span>move avatar</span>
  <span style="color: var(--color-accent);">M</span><span>toggle line of sight</span>
  <span style="color: var(--color-accent);">C</span><span>cycle avatar</span>
  <span style="color: var(--color-accent);">:Q</span><span>save &amp; quit</span>
  <span style="color: var(--color-accent);">L</span><span>reload last save</span>
</div>
