---
title: "MPC for UR7e Robotic Arm — Warehouse Sorting"
summary: "Constrained joint-space Model Predictive Control for a UR7e manipulator. An RGB-D perception pipeline localizes objects and obstacles; a receding-horizon CasADi/IPOPT solver generates collision-free joint trajectories at 12 Hz — validated in MuJoCo and deployed on real hardware."
date: 2025-12-20
category: "Robotics"
tech:
  - Python
  - MuJoCo
  - CasADi
  - ROS2
  - Optimal Control
tags:
  - mpc
  - robotics
  - trajectory-optimization
  - mujoco
  - kinematics
featured: true
status: "shipped"
paper: "/papers/mpc_ur5e_sorting_paper.pdf"
---

## Demo

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin: 1.5rem 0; align-items: stretch;">
  <div style="display: flex; flex-direction: column; gap: 0.4rem;">
    <div style="font-size: 0.75rem; text-align: center; font-family: monospace; color: var(--color-fg-dim); letter-spacing: 0.05em; text-transform: uppercase;">Simulation (MuJoCo)</div>
    <img src="/images/mpc_demo.gif" alt="MPC simulation: arm picking and placing colored cubes around obstacle" style="margin: 0; border-radius: 0.5rem; width: 100%; height: 300px; object-fit: cover;" />
  </div>
  <div style="display: flex; flex-direction: column; gap: 0.4rem;">
    <div style="font-size: 0.75rem; text-align: center; font-family: monospace; color: var(--color-fg-dim); letter-spacing: 0.05em; text-transform: uppercase;">On Real Hardware</div>
    <video autoplay loop muted playsinline style="margin: 0; border-radius: 0.5rem; width: 100%; height: 300px; object-fit: cover;">
      <source src="/images/mpc_landing.mp4" type="video/mp4" />
    </video>
  </div>
</div>

The same MPC pipeline running in simulation and on the physical UR7e. The receding-horizon solver replans every control tick — no hand-coded waypoints, no pre-scripted trajectories. The arm detects cube colors via an RGB-D camera, plans a collision-free joint-space path around the obstacle bin, grasps each cube, and drops it in the correct zone.

## System Architecture

<div style="margin: 1.5rem 0;">
  <img src="/images/mpc_architecture.png" alt="Two-phase system architecture: Reaching Phase and Moving Phase" style="margin: 0; border-radius: 0.5rem; width: 100%; background: white; padding: 0.5rem;" />
</div>

The system operates in two alternating phases that share the same perception stack but use different controllers.

**Reaching Phase** — the arm moves to a grasp pose. The RGB-D point cloud feeds into an object classifier (identifying cube colors $\mathbf{c} = (c_1, \ldots, c_n)$) and a point cloud processor (localizing object positions $\mathbf{x}_{\text{obj},i} = (x_{\text{obj},i},\, y_{\text{obj},i},\, z_{\text{obj},i})$ and the obstacle bounding box $\mathbf{x}_{\text{obs}},\, w_{\text{obs}},\, h_{\text{obs}}$). A pick-order planner selects the next target cube and passes its 3D position to an inverse kinematics solver, which computes a target joint configuration $\mathbf{q}^* \in \mathbb{R}^6$. Joint velocities $\mathbf{u}$ drive the UR7e to that pose.

**Moving Phase** — MPC takes over for the transport. The camera continuously updates the obstacle AABB $\mathbf{x}_{\text{obs},i}$ and the predefined goal positions $\mathbf{x}_{\text{goal},c}$ for each color class. The MPC solves a receding-horizon optimization each tick and outputs joint velocity commands $\mathbf{u}$ to carry the held cube to the drop zone while maintaining obstacle clearance throughout the trajectory.

## Physical Setup

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/mpc_task_design.jpg" alt="Top-down view: red and black cubes, blue obstacle bin, and two drop-off zones" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/mpc_setup_labeled.jpg" alt="Lab setup: Intel RealSense camera, Robotiq gripper, blue obstacle bin, red and black cubes, and two drop-off zones" style="margin: 0; border-radius: 0.5rem;" />
</div>

The workspace has multiple red and black cubes, a rigid blue plastic bin acting as the obstacle, and two rectangular drop zones marked on the table surface. An Intel RealSense RGB-D435i camera is mounted overhead to stream point-cloud and color data. The UR7e carries a Robotiq 2F-85 parallel-jaw gripper. The obstacle is deliberately positioned between the pick region and the drop zones — the arm must always plan a non-trivial detour, which makes straight-line Cartesian planning insufficient and validates the MPC's obstacle avoidance behavior.

## Perception — RViz Visualization

<div style="margin: 1.5rem 0;">
  <img src="/images/mpc_rviz.gif" alt="Published cube positions and obstacle bounding box in RViz point cloud" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

The perception node processes the RealSense depth stream in real time. DBSCAN clustering segments the point cloud into individual objects, and axis-aligned bounding boxes (AABBs) are fit to the obstacle cluster. Color classification assigns each cube to a class. The RViz visualization shows published cube positions and the inflated obstacle AABB before y-axis extension — the colored markers correspond to detected red and black cubes, and the transparent box is the inflated obstacle region passed directly into the MPC collision constraint.

## MPC Formulation

The MPC operates in **joint space**. The state at discrete time $k$ is the 6-DoF joint configuration $\mathbf{q}_k \in \mathbb{R}^6$, and the control input is a bounded joint position increment $\Delta\mathbf{q}_k \in \mathbb{R}^6$. The prediction model is a simple integrator:

$$\mathbf{q}_{k+1} = \mathbf{q}_k + \Delta\mathbf{q}_k$$

with sample period $\Delta t = 0.08\,\text{s}$ and prediction horizon $N = 30$ steps. Choosing joint position increments (rather than joint velocities or Cartesian targets) keeps the prediction model linear and lets joint limits be enforced as hard box constraints directly on the optimization variables.

### Cost Function

At each control cycle the MPC minimizes:

$$J = \sum_{k=0}^{N-1} \left( \|\,p(\mathbf{q}_k) - p^*\|^2_{Q_p} + \|\Delta\mathbf{q}_k\|^2_R \right) + \|\,p(\mathbf{q}_N) - p^*\|^2_{Q_{p,N}} + w_{\text{face}}\, s_{\text{face}}^2 + w_{\text{tab}} \sum_k s_{\text{tab},k}^2$$

where $p(\mathbf{q}_k)$ is the end-effector position from forward kinematics, $p^*$ is the desired drop position (computed via IK), $Q_p = I$, $R \ll Q_p$, and $Q_{p,N} = 10\,Q_p$ (a heavier terminal weight to drive convergence to goal). The slack terms $s_{\text{face}}$ and $s_{\text{tab},k}$ soften the orientation and table-clearance constraints to maintain solver feasibility under perception noise.

### Constraints

**(i) Joint limits and step bounds:**

$$|\mathbf{q}_{k,i}| \le 2\pi, \qquad |\Delta\mathbf{q}_{k,i}| \le 0.15\,\text{rad} \quad \forall\, i,\, k$$

The per-step bound of $\pm 0.15\,\text{rad}$ directly reflects the position-increment interface of the UR7e's low-level controller, approximating actuator velocity limits.

**(ii) Obstacle avoidance.** The gripper and grasped object are approximated by **three proxy spheres** centered at $[0,0,0]$, $[0,0,0.02]$, $[0,0,0.03]\,\text{m}$ in the tool frame, each with inflated radius $r_i \in [0.03, 0.05]\,\text{m}$. At every horizon step the Euclidean distance from each sphere center $c_i(\mathbf{q}_k)$ (computed via forward kinematics) to the obstacle AABB $\mathcal{B}$ must satisfy:

$$d\bigl(c_i(\mathbf{q}_k),\, \mathcal{B}\bigr) \;\ge\; r_i \qquad \forall\, i \in \{1,2,3\},\; k$$

The instantaneous obstacle clearance margin is $m_{\text{obs}}(\mathbf{q}) \triangleq \min_i \bigl( d(c_i(\mathbf{q}), \mathcal{B}) - r_i \bigr)$. Collision-free motion corresponds to $m_{\text{obs}} \ge 0$.

**(iii) Table clearance.** A soft vertical floor constraint prevents the arm from colliding with the tabletop during transport, relaxed via slack $s_{\text{tab},k} \ge 0$:

$$z_{\text{table}} + \epsilon_{\text{tab}} \;\le\; c_i^z(\mathbf{q}_k) + s_{\text{tab},k}$$

The effective floor height is phase-dependent — stricter on descent to the grasp pose, relaxed during transport to allow the arm to skim over the obstacle.

**(iv) Terminal orientation.** A down-facing tool-frame orientation is enforced softly only at the terminal step $N$ via slack $s_{\text{face}} \ge 0$. Intermediate orientation is left unconstrained, which gives the optimizer freedom to find non-obvious collision-avoiding paths without locking the gripper angle along the entire trajectory.

### Receding Horizon Implementation

Rather than applying only the first computed increment (standard MPC), the first **three** increments ($\approx 0.24\,\text{s}$ of motion) are executed before replanning. This reduces solver invocation frequency while keeping responsiveness adequate for the task. The loop terminates when $\|p(\mathbf{q}) - p^*\| \le 3\,\text{cm}$ or after 40 solver iterations. Warm-starting with the previous horizon solution is the primary driver of the ~3× speedup from cold to steady-state solve time.

## MuJoCo Simulation

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/mpc_sim_pt1.png" alt="MuJoCo sim — arm approaching cubes" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/mpc_sim_pt2.png" alt="MuJoCo sim — arm grasping cube" style="margin: 0; border-radius: 0.5rem;" />
</div>
<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/mpc_sim_pt3.png" alt="MuJoCo sim — arm carrying cube over obstacle" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/mpc_sim_pt4.png" alt="MuJoCo sim — cube placed in drop zone" style="margin: 0; border-radius: 0.5rem;" />
</div>

The MuJoCo environment mirrors the real lab setup: colored drop zones, the static obstacle bin, and a Robotiq gripper. The cyan markers visualize the MPC's predicted end-effector path over the $N = 30$ horizon steps in real time. The four frames show the full task sequence — approach, grasp, obstacle transit, and placement.

## Results — On Real Hardware

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/mpc_hw_overview.jpg" alt="Hardware setup — UR7e with cubes and sorting zones" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/mpc_hw_sorted.jpg" alt="Red cubes successfully sorted into the red zone" style="margin: 0; border-radius: 0.5rem;" />
</div>

<div style="margin: 1rem 0;">
  <video autoplay loop muted playsinline style="margin: 0; border-radius: 0.5rem; width: 100%;">
    <source src="/images/mpc_hw_clip.mp4" type="video/mp4" />
  </video>
</div>

Red cubes in the red zone, black cubes in the black zone — fully autonomous end-to-end. The arm reclassifies each cube's color from the live camera feed, routes around the obstacle bin, and places each cube in the correct zone with no human intervention between picks.

## Trajectory Analysis

<div style="margin: 1.5rem 0;">
  <img src="/images/mpc_trajectories.png" alt="End-effector Cartesian trajectory around the obstacle AABB" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

The executed end-effector Cartesian trajectory (blue) for a representative transport phase. Starting from the initial grasp pose (green dot), the MPC generates a smooth path that intentionally arcs around the obstacle AABB (red box) before converging to the target drop position (red ×). The detour is not hand-coded — it emerges from the obstacle clearance constraint at each horizon step. At no point does the optimizer force a fixed height; the arm finds its own clearance strategy, trading off goal progress against constraint satisfaction at every tick.

## Convergence & Safety

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/mpc_convergence.png" alt="End-effector position error converges to within 3 cm tolerance" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/mpc_clearance.png" alt="Obstacle clearance margin stays strictly positive throughout" style="margin: 0; border-radius: 0.5rem;" />
</div>

The end-effector position error $\|p(\mathbf{q}) - p^*\|$ decreases steadily from an initial offset of $\approx 0.7\,\text{m}$ to within the $3\,\text{cm}$ stopping tolerance. Small non-monotonic fluctuations near convergence are expected in closed-loop MPC — each replan trades off goal progress against the obstacle and table constraints, so the path is not strictly greedy. The obstacle clearance margin $m_{\text{obs}}(\mathbf{q})$ remains strictly positive throughout the entire trajectory, confirming collision-free behavior even during the obstacle detour. The soft slack variables prevent constraint infeasibility under perception noise without relaxing the hard obstacle constraint.

## Joint Profiles & Solve Time

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/mpc_joints.png" alt="All 6 joint increment commands smooth and within ±0.15 rad bounds" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/mpc_solve_time.png" alt="Solve time: cold start ~38ms, steady state mean ~11.7ms" style="margin: 0; border-radius: 0.5rem;" />
</div>

Joint increment commands $\Delta\mathbf{q}_{k,i}$ remain within the enforced $\pm 0.15\,\text{rad}$ per-step bounds across all six joints throughout the trajectory — no aggressive joint motion, consistent with the position-increment interface assumption. Solve time drops from $\approx 38\,\text{ms}$ on the cold start (no prior solution to warm-start from) to a steady-state mean of $\approx 11.7\,\text{ms}$, well within the $80\,\text{ms}$ control timestep ($\Delta t = 0.08\,\text{s}$). Warm-starting with the previous horizon's solution is the dominant factor in the speedup — the optimizer starts already near the previous optimum and converges in far fewer IPOPT iterations.
