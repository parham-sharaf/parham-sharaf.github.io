---
title: "MPC for UR5e Robotic Arm — Warehouse Sorting"
summary: "Model Predictive Control for a UR5e manipulator with analytical DH kinematics and real-time obstacle avoidance. Picks and stacks colored cubes around obstacles using a receding-horizon CasADi/IPOPT solver, replanning every timestep in MuJoCo — deployed on real hardware."
date: 2025-12-20
category: "Robotics"
tech:
  - Python
  - MuJoCo
  - CasADi
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

## On Real Hardware

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; align-items: start; margin: 1.5rem 0;">
  <img src="/images/mpc_hardware.gif" alt="UR5e sorting colored cubes on real hardware using MPC" style="margin: 0; border-radius: 0.5rem;" />
  <div style="font-size: 0.95rem; line-height: 1.7;">
    The full sorting loop running on a physical UR5e: the arm detects red and black cubes via a depth camera, plans a collision-free trajectory with a receding-horizon CasADi/IPOPT solver, grasps each cube with the Robotiq 2F-85 gripper, and places it in the correct labeled zone — no hand-coded waypoints, replanning every control tick.
  </div>
</div>

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/mpc_hw_overview.jpg" alt="Hardware setup — UR5e with cubes and sorting zones" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/mpc_hw_sorted.jpg" alt="Red cubes successfully sorted into the red zone" style="margin: 0; border-radius: 0.5rem;" />
</div>

Red cubes in the red zone, black cubes in the black zone — fully autonomous. The arm reclassifies each cube's color from the camera feed and routes it to the correct drop location while avoiding the obstacle wall separating the pickup region from the placement region.

## MuJoCo Simulation

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/mpc_sim_pt1.png" alt="MuJoCo sim — arm approaching cubes" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/mpc_sim_pt2.png" alt="MuJoCo sim — arm grasping cube" style="margin: 0; border-radius: 0.5rem;" />
</div>
<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/mpc_sim_pt3.png" alt="MuJoCo sim — arm carrying cube over obstacle" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/mpc_sim_pt4.png" alt="MuJoCo sim — cube placed in drop zone" style="margin: 0; border-radius: 0.5rem;" />
</div>

The MuJoCo environment matches the real lab setup: colored drop zones, an obstacle wall, and a Robotiq gripper. The MPC horizon visualizes the predicted end-effector path (cyan markers) in real time. Each frame of the 20-step horizon is solved live via IPOPT in ~10 ms.

## Trajectory Analysis

<div style="margin: 1.5rem 0;">
  <img src="/images/mpc_trajectories.png" alt="Top-down workspace view and side elevation showing obstacle clearance" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Left: top-down view of four sorting runs — trajectories route around the obstacle wall to reach the drop zones. Right: side elevation showing the arm lifting over the wall (z = 0.5 m) without any pre-programmed height constraint.

## Convergence & Safety

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/mpc_convergence.png" alt="Position error converges within 3 cm tolerance" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/mpc_clearance.png" alt="Obstacle clearance stays above safety threshold" style="margin: 0; border-radius: 0.5rem;" />
</div>

Position error converges below 3 cm by end of approach. Obstacle clearance stays above zero throughout — minimum 7.9 cm from the wall, well above the 2 cm NLP safety margin.

## Joint Profiles & Solve Time

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/mpc_joints.png" alt="All 6 joint profiles — smooth within limits" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/mpc_solve_time.png" alt="Solve time: ~38ms warm-start, ~10ms steady state" style="margin: 0; border-radius: 0.5rem;" />
</div>

Joint profiles are smooth across all six DOF — the receding horizon doesn't produce jerky commands even replanning every tick. Solve time drops from 38 ms (cold warm-start) to a steady ~10 ms, well within the 50 ms control timestep.
