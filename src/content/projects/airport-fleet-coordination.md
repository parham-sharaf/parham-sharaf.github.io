---
title: "Decentralized Fleet Coordination for Airport Ground Operations"
summary: "Multi-agent coverage control for airport ground vehicles using Buffered Voronoi Cells, Lloyd's algorithm, and game-theoretic demand response. Zero collisions across all test scenarios."
date: 2025-05-01
category: "Robotics"
tech:
  - Python
  - Multi-Agent Systems
  - Optimal Control
  - Game Theory
tags:
  - coverage-control
  - multi-agent
  - voronoi
  - airport
  - decentralized
featured: true
status: "shipped"
paper: "/papers/airport_ground_coordination_math_paper.pdf"
---

<div style="margin: 1.5rem 0;">
  <img src="/images/fleet_3d_closeup.jpg" alt="Ground-support vehicles V10, V21, and V1 positioning near gate cluster G10–G15" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Airport aprons run on tight tolerances. A delayed fuel truck cascades into a gate conflict; a misrouted baggage tug holds an aircraft at the jetbridge. At scale, centralized dispatch becomes the bottleneck; every new gate or vehicle makes the assignment problem harder. This project designs a **fully decentralized** coordination stack for airport ground-support vehicles: each agent sees only its local neighbors, computes its own service target, and filters its own motion for safety. The fleet self-organizes. No dispatcher required.

The final 16-vehicle, 32-gate simulation satisfies every safety constraint (zero vehicle-to-vehicle collisions, zero obstacle penetrations) while converging to within 8% of the centralized coverage optimum.

## The Apron

<div style="margin: 1.5rem 0;">
  <img src="/images/fleet_apron_overview.jpg" alt="SFO-style apron: 16 vehicles, 32 gates across Terminal A and Terminal B, service taxiway, vehicle positions colored by gate demand" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

The environment is an SFO International Terminal apron modeled as a rectangular domain $\Omega = [0, 800\,\text{m}] \times [0, 400\,\text{m}]$ with $M = 32$ gates split across two terminal rows and a service taxiway running between them. The fleet has $N = 16$ heterogeneous ground vehicles (fuel trucks, baggage tugs, catering lifts, and GPU units), each with planar position $p_i(t) \in \Omega$.

The first design decision is where to send vehicles. Gates and parked aircraft are static obstacles, not drivable targets, so each gate $g_j$ is mapped to an apron-side **service standoff point**:

$$s_j = g_j + d_s\,\sigma_j\,e_y, \qquad \sigma_j = \begin{cases}+1, & g_{j,y} < H/2 \\ -1, & g_{j,y} \geq H/2\end{cases}$$

Vehicles converge toward these approach positions, close enough to serve the gate and far enough to avoid the aircraft footprint. The combined coverage domain $\mathcal{Q} = \{s_1,\ldots,s_M\} \cup \mathcal{Q}_{\text{grid}}$ adds a background density grid so vehicles spread across open apron space between demand events.

## System Architecture

<div style="margin: 1.5rem 0;">
  <img src="/images/fleet_pipeline.png" alt="System pipeline: Schedule → Coverage → Safety → Replay → Metrics, closed-loop every Δt = 0.5s" style="margin: 0; border-radius: 0.5rem; width: 100%; background: white; padding: 0.75rem;" />
</div>

The control loop runs at $\Delta t = 0.5\,\text{s}$ using only local sensing and neighbor messages. Each tick: flight events update gate demands; each vehicle computes its Voronoi cell and demand-weighted centroid; the BVC quadratic program projects that centroid command to a collision-free velocity; and the command is integrated through the MuJoCo physics layer. Separation, clearance, and kinematic diagnostics are logged throughout.

The architecture has no shared state, no global solver, and no communication beyond pairwise position sharing with local neighbors within $r_{\text{comm}} = 160\,\text{m}$.

## Coverage Control

Gate demand changes continuously: a flight lands and eight service vehicles are needed at once; thirty minutes later that gate is quiet and three others are busy. The coverage controller tracks this without any explicit task assignment.

<div style="margin: 1.5rem 0;">
  <img src="/images/fleet_demand_pulse.gif" alt="Demand pulse triggered by a flight arrival: nearby vehicles detect the centroid shift and begin converging" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Each gate $g_j$ carries a service demand $\phi_j(t) \geq 0$ that spikes on flight arrival and decays exponentially:

$$\phi_j(t) = \phi_0 + \sum_{\ell:\, k_\ell = j} a_\ell\; e^{-\lambda_\ell(t - \tau_\ell)}\;\mathbf{1}_{t \geq \tau_\ell}$$

The coverage objective is the **demand-weighted quantization cost**, a measure of how far high-demand gates are from the nearest vehicle:

$$H(P,t) = \sum_{i=1}^{N}\; \sum_{q \in V_i(P)}\; \frac{1}{2}\|q - p_i\|^2\,\rho(q,t)$$

where $V_i(P) = \{q \in \mathcal{Q} : \|q - p_i\| \leq \|q - p_k\|,\; \forall k \neq i\}$ is vehicle $i$'s Voronoi cell and $\rho(q,t)$ is the demand density at point $q$. Minimizing $H$ drives vehicles toward high-demand regions.

**Lloyd's algorithm** gives the gradient descent step: move each vehicle toward the demand-weighted centroid of its Voronoi cell,

$$c_i(P,t) = \frac{\displaystyle\sum_{q \in V_i(P)} q\;\rho(q,t)}{\displaystyle\sum_{q \in V_i(P)} \rho(q,t)}, \qquad u_i^{\text{des}} = k\,(c_i - p_i)$$

The command is speed-capped and tapered as the vehicle approaches its centroid to prevent overshoot near convergence:

$$\tilde{u}_i = \alpha_i\,u_i^{\text{des}}, \qquad \alpha_i = \min\!\left\{1,\; \frac{v_{\max}\min\!\left(1,\,\|c_i - p_i\|/r_s\right)}{\|u_i^{\text{des}}\| + \varepsilon}\right\}$$

This $\tilde{u}_i$ is the desired command before safety filtering.

<div style="margin: 1.5rem 0;">
  <img src="/images/fleet_voronoi_evolution.gif" alt="Voronoi cells reforming continuously as vehicles respond to shifting gate demand" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

<div style="margin: 1.5rem 0;">
  <img src="/images/fleet_voronoi_partition.png" alt="Demand-weighted Voronoi partition at t = 330s: colored cells, density-weighted centroids marked with stars" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

The snapshot at $t = 330\,\text{s}$ shows cell boundaries biased toward high-demand gates; the density-weighted centroid $C_v$ (star markers) sits closer to busy gates than to the geometric cell center. Vehicles chase their moving centroid targets; cells reform on every tick. No agent ever needs to know the global demand state.

<div style="margin: 1.5rem 0;">
  <img src="/images/fleet_3d_voronoi_wide.jpg" alt="3D view of the apron mid-simulation: Voronoi demand cells as ground-plane color regions, trajectory lines connecting vehicles to centroids" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

## Collision Avoidance

The coverage law alone says nothing about collisions. Rather than stacking a separate avoidance layer on top, the design uses **Buffered Voronoi Cells**, a safety filter that wraps the coverage command in a convex QP. The result is a single optimization per vehicle per tick that simultaneously targets the coverage objective and guarantees collision freedom.

<div style="margin: 1.5rem 0;">
  <img src="/images/fleet_bvc_construction.gif" alt="Buffered Voronoi Cell forming from halfplane constraints as neighbors close in" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

For vehicle $i$ with neighbor $j$, the BVC halfplane constrains the next position $p_i^+ = p_i + u_i\Delta t$:

$$(p_j - p_i)^T p_i^+ \leq \frac{\|p_j\|^2 - \|p_i\|^2 - \delta^2}{2}$$

where $\delta$ is the safety radius. Any velocity $u_i$ whose resulting $p_i^+$ lies inside the Buffered Voronoi Cell is provably collision-free. The safety-filtered command is the smallest deviation from $\tilde{u}_i$ that satisfies all neighbor halfplanes:

$$u_i^* = \arg\min_{u \in \mathbb{R}^2}\; \|u - \tilde{u}_i\|^2 \qquad \text{s.t.}\quad (p_j - p_i)^T(p_i + u\Delta t) \leq \frac{\|p_j\|^2 - \|p_i\|^2 - \delta^2}{2},\quad \forall j \neq i$$

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin: 1.5rem 0;">
  <img src="/images/fleet_bvc.jpg" alt="Voronoi cell V₀ vs Buffered Voronoi Cell BVC₀: three neighbor halfplanes carve the safe feasible region" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/fleet_comms.jpg" alt="Local communication graph: 8 edges, avg degree 1.3, r_comm = 160 m" style="margin: 0; border-radius: 0.5rem;" />
</div>

The BVC construction (left) shows three neighbor halfplanes carving the safe feasible region $BVC_0$ out of the full Voronoi cell $V_0$; any command landing $p_i^+$ in the dark region is provably safe. The communication graph (right) shows why the approach scales: each vehicle only shares positions with local neighbors within 160 m, averaging 1.3 neighbors per agent. There is no broadcast, no global state.

Gates and parked aircraft add a second class of static exclusion zones $\mathcal{O}_m = \{p : \|p - o_m\| \leq r_m\}$ with radii $r_m = 16\,\text{m}$ for gates and $20\,\text{m}$ for parked aircraft. Each nearby obstacle contributes a tangent halfplane to the QP: $n_{im}^T(p_i + u\Delta t - o_m) \geq r_m$, where $n_{im} = (p_i - o_m)/\|p_i - o_m\|$.

<div style="margin: 1.5rem 0;">
  <img src="/images/fleet_3d_gate_level.jpg" alt="Gate-level view: circular BVC exclusion zones around parked aircraft at G0 and G1 force vehicles to service approach positions" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

The gate-level view shows the exclusion zones in practice: vehicles approach gates from the apron side, held back from the aircraft footprint by the obstacle halfplane constraints. The demand-field glow at each gate shows where centroid targets are pulling them.

<div style="margin: 1.5rem 0;">
  <img src="/images/fleet_bvc_ablation.jpg" alt="Stress-test ablation: BVC on vs. off: obstacle clearance goes negative within 20s without BVC; stays positive throughout with BVC" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

The ablation runs the same stress scenario with and without BVC. Without it, vehicles penetrate static obstacles within the first 20 seconds: clearance drops to −4 m and never recovers (red). With BVC on, pairwise separation stays above the 10 m safety limit and obstacle clearance remains strictly positive throughout (green). The safety guarantee holds in practice, not just in theory.

## Simulation

<div style="margin: 1.5rem 0;">
  <img src="/images/fleet_simulation.gif" alt="16-vehicle apron coordination: coverage control + BVC safety, MuJoCo physics backend" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

The full simulation runs 16 vehicles on the 32-gate SFO layout with MuJoCo integrating the force/torque dynamics. Each vehicle state is $x_i = [p_{ix},\; p_{iy},\; \theta_i,\; v_{ix},\; v_{iy},\; \omega_i]^T$; a first-order smoother low-passes the BVC output before it enters the physics layer, and longitudinal and lateral force controllers track the smoothed command while a yaw torque controller drives heading:

$$v_i^{\text{cmd}} = v_i + \frac{\Delta t}{\tau + \Delta t}(u_i^* - v_i), \qquad \tau_i = I_z\,k_\omega(\omega_i^{\text{tar}} - \omega_i)$$

The 3D replay visualizes the same MuJoCo trajectory in a browser viewer: Voronoi cell boundaries, BVC circles, demand overlays, and vehicle labels are all rendered live from the logged state sequence.

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin: 1.5rem 0;">
  <div style="display: flex; flex-direction: column; gap: 0.4rem;">
    <div style="font-size: 0.75rem; text-align: center; font-family: monospace; color: var(--color-fg-dim); letter-spacing: 0.05em; text-transform: uppercase;">Voronoi cells, 3D ground plane</div>
    <img src="/images/fleet_3d_voronoi_cells.jpg" alt="3D replay: Voronoi cells rendered as colored ground-plane polygons, updating live" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  </div>
  <div style="display: flex; flex-direction: column; gap: 0.4rem;">
    <div style="font-size: 0.75rem; text-align: center; font-family: monospace; color: var(--color-fg-dim); letter-spacing: 0.05em; text-transform: uppercase;">Fleet overview, demand overlay</div>
    <img src="/images/fleet_3d_apron.jpg" alt="3D replay orbital view: demand-weighted Voronoi overlay highlights high-demand gate region" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  </div>
</div>

## Results

<div style="margin: 1.5rem 0;">
  <img src="/images/fleet_trajectories.jpg" alt="Vehicle trajectories under coverage control + BVC over 600s: all vehicles colored by ID, gate positions marked" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Trajectories confirm the coverage law working as intended: vehicles fan out from starting positions to cover both terminal rows, converging on demand-weighted centroids without colliding. The curving paths near busy gate clusters are not hand-coded; they emerge from the BVC projection deflecting each vehicle around its neighbors as they converge on the same region.

<div style="margin: 1.5rem 0;">
  <img src="/images/fleet_safety_headroom.jpg" alt="SFO replay safety diagnostics: minimum vehicle separation over time, speed histogram, acceleration histogram, yaw rate histogram" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

The safety headroom plots show the full 300-second, 16-vehicle replay. Minimum pairwise separation (top-left) starts near 20 m as vehicles fan out from clustered starting positions, grows to over 130 m at peak distribution, and stays above the 10 m safety radius throughout. The three histograms show that the fleet operates well within actuator limits in normal service; the 95th-percentile speed is 3.95 m/s against a 5 m/s cap, and 95th-percentile acceleration is 0.52 m/s² against a 1.5 m/s² limit.

| Metric | Value | Limit |
|:---|---:|---:|
| Vehicle safety violations | **0** | 0 |
| Obstacle penetrations | **0** | 0 |
| Minimum vehicle separation | **31.6 m** | > 10 m |
| Min gate / aircraft clearance | **0.750 m** | > 0 |
| Max speed | **4.997 m/s** | 5 m/s |
| 95th percentile acceleration | **0.242 m/s²** | < 1.5 m/s² |
| Max yaw rate | **0.619 rad/s** | 0.8 rad/s |

## Extensions

Two higher-level analyses extend the base controller.

**Worst-case demand game.** The coverage cost $H(P,\phi)$ is a function of both fleet positions and the demand distribution. If an adversary could allocate demand to maximally hurt coverage, concentrating it at the gates farthest from the current fleet configuration, what positioning would the fleet choose to stay robust? The minimax problem

$$\min_P\;\max_{\phi \in \Phi_B}\; H(P,\phi), \qquad \Phi_B = \left\{\phi \in \mathbb{R}_+^M : \textstyle\sum_j \phi_j = B\right\}$$

is solved via best-response iteration: the fleet takes a Lloyd step, then an adversary reallocates demand toward the currently worst-served gates, and the process repeats. The resulting positions are more robust to unexpected demand spikes than the unconstrained Lloyd solution.

**MAPPO extension.** Lloyd's algorithm is reactive; it responds to current demand but cannot anticipate future arrivals. A MAPPO policy replaces the centroid command with a learned action conditioned on each agent's local observation (own state, neighbor positions, local gate demand, time features). A centralized critic uses fleet-level information during training but is not available at deployment. The BVC filter stays in the loop as a hard safety layer: the policy proposes, the QP clears it for collision.
