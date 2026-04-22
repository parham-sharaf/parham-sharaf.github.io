---
title: "Pacman AI — A Tour of Classical AI"
summary: "End-to-end AI agent built across four paradigms: A* pathfinding, Minimax/Expectimax game trees, HMM + particle filter tracking, and Q-learning. Each piece solves one Pacman problem; together they cover the full classical AI curriculum."
date: 2024-08-05
category: "Artificial Intelligence"
tech:
  - Python
  - AI
  - Search Algorithms
  - Game Theory
  - Bayesian Inference
  - Reinforcement Learning
tags:
  - search
  - minimax
  - hmm
  - particle-filter
  - q-learning
  - mdp
featured: true
status: "shipped"
---

![](/images/cs188_hero.png)

**One game, four flavors of AI**. Pacman is deceptively simple — but solving it *well* requires four completely different paradigms. Navigate a maze (search). Beat opponents (game theory). Track invisible ghosts (Bayesian inference). Learn from scratch (reinforcement learning). Each of these is a classical AI topic; this project builds a Pacman agent that does all of them.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">search</span><span>DFS, BFS, UCS, A* with custom admissible heuristics</span>
  <span style="color: var(--color-accent);">adversarial</span><span>Minimax, Alpha-Beta pruning, Expectimax + multi-feature evaluation</span>
  <span style="color: var(--color-accent);">inference</span><span>Exact HMM inference, particle filtering (single + joint)</span>
  <span style="color: var(--color-accent);">learning</span><span>Value Iteration, Q-Learning, Approximate Q-Learning with features</span>
</div>

## Part 1 — Search: How Do You Reach a Goal?

![](/images/cs188_search_maze.png)

**Four algorithms, same maze, wildly different frontiers**. DFS plunges down one corridor ignoring the goal. BFS sprays uniformly outward. A* with Manhattan distance elongates toward the target. A* with a custom heuristic (max distance to any unvisited corner) tightens the beam dramatically.

![](/images/cs188_search_efficiency.png)

**The efficiency gap grows exponentially with maze size**. On mediumMaze: 3964 DFS nodes vs 106 with A*+custom. On contestMaze: 3189 BFS nodes vs 537. The heuristic doesn't change *what's* possible — it changes *how much you have to look at* to find the answer. A well-designed heuristic can be the difference between tractable and intractable.

## Part 2 — Adversarial Search: How Do You Beat Opponents?

![](/images/cs188_game_tree.png)

**Minimax vs Expectimax — a critical modeling choice**. Minimax assumes ghosts play optimally against Pacman (worst-case reasoning). Expectimax models ghosts as making random or probabilistic choices (expected-value reasoning). Same tree structure, completely different backups at internal nodes.

![](/images/cs188_agent_performance.png)

**The biggest score gains come from the evaluation function, not the algorithm**. When search depth is limited, leaf evaluation dominates — features like "distance to closest food," "ghost proximity," and "scared-timer bonus" turn a depth-3 agent into a 2150-score monster. Alpha-Beta pruning compounds this: 90% fewer nodes evaluated at depth 7 means you can afford deeper search on the same compute.

**The subtle lesson**: assuming ghosts are optimal when they're actually random costs you. Expectimax against random ghosts wins 95% of games; Minimax only wins 72% because it's too cautious — it dodges threats that ghosts wouldn't actually execute.

## Part 3 — Inference: How Do You Handle Hidden State?

![](/images/cs188_belief_evolution.png)

**Ghosts are invisible — you only get noisy Manhattan-distance readings**. This is a textbook HMM setup: hidden state (positions), noisy observations (distances), and a transition model (ghost movement). Bayes' rule updates beliefs after each observation; the transition model propagates them forward in time.

Over 25 timesteps, belief entropy drops from 4.5 bits (uniform uncertainty) to under 0.5 bits (locked on). Each sensor reading multiplies in information; the transition model spreads it out again. The balance between the two is the core HMM computation.

![](/images/cs188_particle_filter.png)

**Particle filters scale where exact inference can't**. For N² positions and K ghosts, exact inference is O(N²ᴷ) — fine for one ghost, intractable for four. Particle filters approximate the posterior with samples: each particle is a weighted guess at the ghost's position, reweighted by observations and resampled after transitions.

At 1000 particles, capture rate matches exact inference (97%) at a fraction of the compute. The classic tradeoff — accuracy per compute unit scales linearly with particle count until you hit diminishing returns.

## Part 4 — Reinforcement Learning: How Do You Learn Optimal Behavior?

![](/images/cs188_value_iteration.png)

**Value Iteration propagates value outward from reward**. Starting from V(s)=0 everywhere, each iteration applies the Bellman backup: V(s) ← max_a Σ P(s'|s,a)[R + γV(s')]. Values flow from the +1 terminal through connected states. By k=100, the policy has converged — each state's value reflects its optimal discounted long-term return.

But Value Iteration requires the MDP to be *known* — transitions and rewards handed to you. Real agents don't get that. Q-Learning learns Q(s,a) directly from experience, with no model required.

![](/images/cs188_rl_results.png)

**Why features matter for generalization**: Pacman has more state configurations than atoms in the universe. Tabular Q-learning can't enumerate them — it fails catastrophically on any Pacman layout beyond Gridworld. Approximate Q-learning with hand-crafted features — Q(s,a) = w · f(s,a) with features like "food distance," "ghost 1-step-away," "scared timer > 0" — generalizes across states. Tabular Q: -500 on smallClassic. Approximate Q with the same training: +1420. A 2000-point swing from a handful of features and learned linear weights.

## The Common Thread

These four paradigms answer progressively harder versions of the same question — *"what action should I take?"*:

- **Search**: fully known, single agent, deterministic
- **Game trees**: fully known, adversarial, deterministic or stochastic
- **HMM inference**: partially observed state, known dynamics
- **Q-Learning**: unknown dynamics and reward, must learn from experience

The progression mirrors real-world robotics and autonomous systems. Search powers route planning. Game theory drives competitive multi-agent systems. Particle filters run SLAM in self-driving cars. Q-learning foundations underpin modern deep RL (DQN, AlphaGo). Pacman is a toy environment — but the math here is the math that ships in production AI systems.