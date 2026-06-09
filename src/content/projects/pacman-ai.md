---
title: "Pacman AI: A Tour of Classical AI"
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

<div style="margin: 1.5rem 0;">
  <img src="/images/cs188_hero.gif" alt="Live HMM ghost tracking: Pacman hunts 4 invisible ghosts using noisy distance readings; belief distributions (colored cells) update every timestep as Pacman moves" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

**One game, four flavors of AI**. Pacman is deceptively simple, but solving it *well* requires four completely different paradigms. Navigate a maze (search). Beat opponents (game theory). Track invisible ghosts (Bayesian inference). Learn from scratch (reinforcement learning). Each of these is a classical AI topic; this project builds a Pacman agent that does all of them.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">search</span><span>DFS, BFS, UCS, A* with custom admissible heuristics</span>
  <span style="color: var(--color-accent);">adversarial</span><span>Minimax, Alpha-Beta pruning, Expectimax + multi-feature evaluation</span>
  <span style="color: var(--color-accent);">inference</span><span>Exact HMM inference, particle filtering (single + joint)</span>
  <span style="color: var(--color-accent);">learning</span><span>Value Iteration, Q-Learning, Approximate Q-Learning with features</span>
</div>

## Part 1: Search

<div style="margin: 1.5rem 0;">
  <img src="/images/cs188_search_maze.png" alt="Same maze, four frontiers: DFS (deep), BFS (broad), A* Manhattan, A* custom heuristic" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

**Four algorithms, same maze, wildly different frontiers.** DFS plunges down one corridor ignoring the goal. BFS sprays uniformly outward. A* with Manhattan distance elongates toward the target. A* with a custom heuristic (max distance to any unvisited corner) tightens the beam dramatically.

<div style="margin: 1.5rem 0;">
  <img src="/images/cs188_search_efficiency.png" alt="Node expansion count: DFS 3964 vs A*+custom 106 on mediumMaze" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

**The efficiency gap grows exponentially with maze size.** On mediumMaze: 3964 DFS nodes vs 106 with A*+custom. On contestMaze: 3189 BFS nodes vs 537. The heuristic doesn't change *what's* possible; it changes *how much you have to look at* to find the answer. A well-designed heuristic can be the difference between tractable and intractable.

## Part 2: Adversarial Search

<div style="margin: 1.5rem 0;">
  <img src="/images/cs188_game_tree.png" alt="Minimax vs Expectimax game tree: different backup operators at chance/adversary nodes" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Minimax and Expectimax use the same tree structure but different backup operators at ghost nodes:

$$V_\text{minimax}(s) = \begin{cases} \max_a\, V(s') & \text{Pacman's turn} \\ \min_a\, V(s') & \text{ghost's turn (worst case)} \end{cases}$$

$$V_\text{expectimax}(s) = \begin{cases} \max_a\, V(s') & \text{Pacman's turn} \\ \mathbb{E}_{a \sim \pi_\text{ghost}}[V(s')] & \text{ghost's turn (expected value)} \end{cases}$$

The choice of which model to use is a modeling decision about the opponent. If the ghost plays optimally against you, Minimax is correct. If the ghost moves randomly (as in the default Pacman implementation), Minimax is *wrong*; it pessimistically avoids threats that will never materialize.

<div style="margin: 1.5rem 0;">
  <img src="/images/cs188_agent_performance.png" alt="Agent score vs depth and evaluation function quality; eval function dominates over algorithm choice" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

**The evaluation function matters more than the algorithm.** With limited search depth, leaf evaluation dominates. The agent only sees 3–7 plies ahead, so the quality of the leaf estimate determines everything. The evaluation function I used:

$$e(s) = w_1 \cdot \frac{1}{d_\text{food}} - w_2 \cdot \mathbf{1}[d_\text{ghost} < 3] + w_3 \cdot \mathbf{1}[\text{ghost scared}] \cdot \frac{1}{d_\text{ghost}} - w_4 \cdot |\text{food remaining}|$$

where $w_3 \gg w_2$; when a ghost is scared, chasing it (for 200 points) outweighs the normal ghost-avoidance penalty. Getting those weights right turned a depth-3 agent scoring ~800 into one scoring 2150.

Expectimax against random ghosts wins 95% of games; Minimax only 72%, as it dodges threats the random ghost never executes, eating worse food paths in the process. Alpha-Beta pruning evaluates 90% fewer nodes at depth 7 by safely pruning branches that can't affect the root decision.

## Part 3: Inference

<div style="margin: 1.5rem 0;">
  <img src="/images/cs188_hmm_live.gif" alt="Live HMM ghost tracking: orange clusters show belief concentrated near one ghost, teal near another; belief updates each timestep as Pacman collects noisy distance readings" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

**Ghosts are invisible. You only get noisy Manhattan-distance readings.** This is a textbook HMM: hidden state $X_t$ (ghost position), observation $e_t$ (noisy distance reading), transition model $P(X_t \mid X_{t-1})$ (ghost movement), and emission model $P(e_t \mid X_t)$.

Each timestep is a two-step belief update. First predict (propagate through the transition model), then condition on the new observation:

$$\underbrace{B'(X_t) = \sum_{X_{t-1}} P(X_t \mid X_{t-1})\, B(X_{t-1})}_{\text{predict: spread belief through transition}}$$

$$\underbrace{B(X_t) \propto P(e_t \mid X_t) \cdot B'(X_t)}_{\text{update: weight by observation likelihood, renormalize}}$$

Over 25 timesteps, belief entropy drops from 4.5 bits (uniform over all positions) to under 0.5 bits (concentrated on 1–2 cells). The prediction step spreads entropy; the update step concentrates it. Belief converges fast because the emission model is relatively tight; sensor readings within ±1 of true distance are most likely.

<div style="margin: 1.5rem 0;">
  <img src="/images/cs188_particle_filter.png" alt="Particle filter: 1000 samples track ghost positions, capture rate matches exact inference at 97%" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

**Particle filters scale where exact inference can't.** For N² positions and K ghosts, exact inference is O(N²ᴷ), fine for one ghost but intractable for four. Particle filters approximate the posterior with samples: each particle is a weighted guess at the ghost's position, reweighted by observations and resampled after transitions.

At 1000 particles, capture rate matches exact inference (97%) at a fraction of the compute. The classic tradeoff: accuracy per compute unit scales linearly with particle count until you hit diminishing returns.

## Part 4: Reinforcement Learning

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin: 1.5rem 0; align-items: start;">
  <img src="/images/cs188_real_vi.png" alt="Value iteration output: BookGrid after 100 iterations; V-values 0.64→0.74→0.85→1.00 along optimal path, policy arrows pointing toward +1 terminal" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/cs188_real_ql.png" alt="Q-learning in progress: learned Q-values per action shown as triangles in each cell; 0.50 east from center-left, -0.94 near the -1 terminal" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

**Left: Value Iteration** (100 sweeps on BookGrid): each cell shows $V^*(s)$ and the optimal policy arrow. Values flow inward from the +1 terminal, 0.85 to 0.74 to 0.64 stepping away. The −1.00 terminal suppresses adjacent values. **Right: Q-Learning mid-training**: Q-values per action encoded as triangles. After ~30 episodes, the agent has learned to move east toward the +1 and avoid the −0.94 terminal.

**Value Iteration** solves for the optimal policy when the MDP is fully known. Each sweep applies the Bellman backup to every state:

$$V(s) \leftarrow \max_a \sum_{s'} P(s' \mid s, a)\bigl[R(s, a, s') + \gamma V(s')\bigr]$$

Values flow outward from reward states; in the Gridworld above, from the +1 terminal through all reachable states. By $k = 100$ iterations the policy has converged.

But Value Iteration requires knowing $P$ and $R$ in advance. Q-Learning removes that assumption: it learns $Q(s, a)$ directly from experience using the **temporal-difference update**:

$$Q(s, a) \leftarrow Q(s, a) + \alpha \underbrace{\bigl[r + \gamma \max_{a'} Q(s', a') - Q(s, a)\bigr]}_{\delta \;=\; \text{TD error}}$$

The TD error $\delta$ is the gap between what the agent expected ($Q(s,a)$) and what it actually got ($r + \gamma \max_{a'} Q(s', a')$). With $\varepsilon$-greedy exploration (taking a random action with probability $\varepsilon$, greedy otherwise), the agent gradually shifts from exploration to exploitation as $\varepsilon$ decays.

<div style="margin: 1.5rem 0;">
  <img src="/images/cs188_rl_results.png" alt="Tabular Q (-500) vs Approximate Q (+1420) on smallClassic: 2000-point gap from a handful of features" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

**Tabular Q collapses on real Pacman** because the state space is astronomical: board layout × food positions × ghost positions × scared timers. Tabular Q can only learn values for states it has actually visited, and it never visits most of them. On smallClassic after 2000 training episodes: average score **−500**.

**Approximate Q-Learning** represents $Q$ as a linear function of hand-crafted features:

$$Q(s, a) = \mathbf{w} \cdot \mathbf{f}(s, a) = \sum_i w_i f_i(s, a)$$

Features: $1/d_\text{closest-food}$, $\mathbf{1}[\text{ghost within 1 step}]$, $\mathbf{1}[\text{ghost scared} \wedge d_\text{ghost} < 5]$, $-|\text{food remaining}|$. The weight update follows from substituting into the TD rule:

$$w_i \leftarrow w_i + \alpha \cdot \delta \cdot f_i(s, a)$$

Same 2000 training episodes, same layout: average score **+1420**. The 2000-point gap comes entirely from generalization; the weights learned on visited states apply immediately to unseen configurations with the same feature values. The learned weights prioritize food collection over ghost avoidance until ghosts are dangerously close, and flip to ghost-chasing when they turn scared.

## The Common Thread

These four paradigms answer progressively harder versions of the same question, *"what action should I take?"*:

- **Search**: fully known, single agent, deterministic
- **Game trees**: fully known, adversarial, deterministic or stochastic
- **HMM inference**: partially observed state, known dynamics
- **Q-Learning**: unknown dynamics and reward, must learn from experience

The progression mirrors real-world robotics and autonomous systems. Search powers route planning. Game theory drives competitive multi-agent systems. Particle filters run SLAM in self-driving cars. Q-learning foundations underpin modern deep RL (DQN, AlphaGo). Pacman is a toy environment, but the math here is the math that ships in production AI systems.