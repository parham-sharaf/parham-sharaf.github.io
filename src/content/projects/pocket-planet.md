---
title: "Pocket Planet"
summary: "A 100×100 world carved from Perlin noise, then colonized by simulated plants that mutate, compete, and converge on the terrain they're fittest for."
date: 2023-04-01
category: "Procedural Generation"
tech:
  - Python
  - NumPy
  - Perlin Noise
  - Evolutionary Simulation
tags:
  - procedural
  - simulation
  - evolution
featured: true
status: "shipped"
---

<div style="margin: 1.5rem 0;">
  <img src="/images/pocket-planet-triptych.png" alt="Three stages: generation 0 (random scatter), generation 50 (biome clustering emerging), generation 150 (fully converged, each terrain type colonized by specialized organisms)" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

A 100×100 terrain generated from multi-octave Perlin noise is seeded with organisms, each carrying a 5-dimensional genome encoding their ecological niche. Organisms reproduce, mutate, disperse spatially, and compete, with selection pressure proportional to how well their genome matches the local terrain. After ~100 generations, the simulation self-organizes into stable biomes: mountain specialists in the highlands, coastal generalists at the margins, forest species in between.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">terrain</span><span>$H(x,y) = \sum_k 2^{-k} P_k(x,y)$, Perlin octaves with smoothstep $s(t) = 6t^5 - 15t^4 + 10t^3$</span>
  <span style="color: var(--color-accent);">fitness</span><span>$f = 1 - \|d - d^*(x)\|_2$, genome distance to terrain's optimal DNA</span>
  <span style="color: var(--color-accent);">mutation</span><span>$d' = \text{normalize}(\text{clip}(d + u,\, 0, 1)),\;\; u \sim \text{Uniform}(-\sigma, \sigma)^5$</span>
  <span style="color: var(--color-accent);">offspring</span><span>$N \sim \text{Binomial}(n_\text{max},\, f)$, fitter organisms produce more children</span>
  <span style="color: var(--color-accent);">competition</span><span>$P(i\text{ wins}) \propto \exp(\beta \cdot f_i)$, Boltzmann tournament selection</span>
  <span style="color: var(--color-accent);">dispersal</span><span>$(x', y') \sim \mathcal{N}((x,y),\, \sigma^2 I)$, offspring land near parent</span>
</div>

## Terrain and Fitness

The terrain is five biome types (coast, plains, forest, mountain, desert), each associated with an optimal genome $d^*(x) \in [0,1]^5$. Fitness is the complement of L2 distance between an organism's genome and the local optimum:

$$f(x, d) = 1 - \|d - d^*(x)\|_2$$

Soft boundaries, no hard biome walls. An organism with a forest genome can survive on plains but at reduced fitness, so it produces fewer offspring and loses competition. The fitness landscape has a smooth gradient structure that rewards specialization without making cross-biome survival impossible.

Each terrain cell's optimal DNA is fixed at initialization. The evolutionary challenge: the population as a whole must simultaneously cover all five biome types, with different sub-populations converging on different optima.

## The Evolutionary Dynamics

Each generation follows four steps:

1. **Reproduction**: each organism draws $N \sim \text{Binomial}(n_\text{max}, f)$ offspring (fitter organisms get more children on average)
2. **Mutation**: each offspring's genome is perturbed by $u \sim \text{Uniform}(-\sigma, \sigma)^5$, clipped and renormalized to stay on the unit hypercube
3. **Dispersal**: offspring are placed at $\mathcal{N}(\text{parent position}, \sigma_d^2 I)$, spatially close but not identical
4. **Competition**: when cells exceed carrying capacity, survivors are drawn via Boltzmann tournament: $P(i \text{ wins}) \propto \exp(\beta f_i)$

The Boltzmann temperature $\beta$ is the key hyperparameter. High $\beta$: selection is harsh, fitter organisms almost always win, population converges fast but can get stuck at local optima. Low $\beta$: near-random drift, slow convergence, more exploration. The critical insight is that $\beta$ should be low early (when the population needs to explore all five biome types) and high late (once colonization is complete, selection pressure drives specialization). Adaptive $\beta$ that increases with mean population fitness converges ~2× faster than fixed $\beta$.

## Colonization

<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin: 1.5rem 0;">
  <img src="/images/pocket-planet-step-10.png" alt="Generation 10: sparse coastal seeding, organisms are generalists with mediocre fitness everywhere" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/pocket-planet-step-20.png" alt="Generation 20: inland expansion begins, weak biome clustering visible near mountains" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/pocket-planet-step-30.png" alt="Generation 30: distinct biome patches forming, genetic distance between regions increasing" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

<div style="margin: 1.5rem 0;">
  <img src="/images/pocket-planet-evolution.gif" alt="Timelapse: organisms colonizing terrain from coast inward, biome patches forming and stabilizing over 150 generations" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Colonization proceeds in waves. Coastal organisms land first because the terrain is seeded along the shoreline. They're generalists: mediocre fitness everywhere, but enough to reproduce. Their offspring disperse inland. The first inland migrants encounter mountain or forest terrain where their coastal genome is suboptimal, but they can survive until better-adapted competitors arrive. Coastal DNA is eventually displaced inland by locally optimized genomes; the coastal margin retains specialized coastal organisms.

The speciation boundary forms ~generation 50–70. Before that point, a mountain organism and a coastal organism would interbreed if they met (no reproductive isolation in the model). But dispersal is spatially constrained; mountain organisms rarely reach the coast and vice versa. Geographic isolation does the work that explicit barriers would do in a more complex model.

## Convergence

<div style="margin: 1.5rem 0;">
  <img src="/images/pocket-planet-convergence.png" alt="Three panels: mean fitness rising to ~0.92 over 150 generations (left); biome coverage curves, coastal fills first, mountain last (center); within-biome variance declining while between-biome genetic distance rises, the speciation signature (right)." style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Three metrics track whether the simulation is working:

**Mean fitness** (left): rises from ~0.30 (random genomes) to ~0.92, following a logistic curve. The plateau represents the fundamental trade-off at biome edges; organisms at the mountain/forest boundary can't perfectly match either optimum, so mean fitness never reaches 1.0.

**Coverage** (center): coastal terrain fills first (~generation 25), forest/plains next (~40), mountain last (~70). The ordering reflects dispersal distance from the coastal seed; mountain terrain is hardest to reach and hardest to survive in before local adaptation arrives.

**Genetic divergence** (right): within-biome variance (how similar organisms in the same biome are to each other) drops over time as local selection pressure pushes genomes toward the biome optimum. Between-biome distance (how different mountain organisms are from coastal organisms) rises. The crossover, where between-biome distance exceeds within-biome variance, marks the onset of functional speciation.
