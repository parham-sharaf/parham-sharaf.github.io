---
title: "MPC for UR5e Robotic Arm — Warehouse Sorting"
summary: "Model Predictive Control for a UR5e manipulator with analytical DH kinematics and real-time obstacle avoidance. Picks and stacks colored cubes around obstacles using a receding-horizon CasADi/IPOPT solver, replanning every timestep in MuJoCo."
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

![](/images/mpc_hero.jpg)

**UR5e approaching the red cube — cyan dots are the MPC's 20-step end-effector horizon, solved live.** The arm sees a red wall obstacle and an orange ceiling panel blocking the shelf. No path was pre-programmed; the receding horizon finds the route at every timestep.

## Live in MuJoCo

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; align-items: start; margin: 1.5rem 0;">
  <img src="/images/mpc_motion.gif" alt="Full pick-and-sort simulation — UR5e sorting cubes with MPC trajectory overlay" style="margin: 0; border-radius: 0.5rem;" />
  <div style="font-size: 0.95rem; line-height: 1.6;">
    The full loop: three colored cubes on the table, a wall obstacle blocking the shelf, a ceiling panel above. The arm picks each cube, lifts through the gap, arcs to the shelf, and releases. Cyan dots show where the MPC predicts the end-effector will be over the next 20 steps — recalculated every control tick via CasADi/IPOPT in ~30ms.
  </div>
</div>

## Around the Obstacle

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/mpc_nav.jpg" alt="MPC planning arc around the red wall obstacle — yellow trajectory horizon" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/mpc_grasp.jpg" alt="Arm grasping the red cube — gripper closed, cube locked" style="margin: 0; border-radius: 0.5rem;" />
</div>

The yellow trajectory (arm carrying the cube) shows the MPC solution arcing over the wall obstacle — the optimizer routes through the gap between the wall and ceiling without any hand-coded waypoints. Obstacle avoidance is a soft constraint on the IPOPT NLP: sphere proxies on the end-effector get penalized for violating clearance.

## Paper Results

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/mpc_trajectories.jpg" alt="End-effector 3D trajectories — 4 cube sorting runs" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/mpc_convergence.jpg" alt="End-effector position error — all runs converge within 3cm tolerance" style="margin: 0; border-radius: 0.5rem;" />
</div>

Four cube-sorting runs. Each trajectory naturally arcs around the obstacle — the optimizer finds the clearance geometry without explicit path planning. All runs converge within the 3cm tolerance by ~17–19s.

## Safety Constraints

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/mpc_clearance.jpg" alt="Obstacle clearance margin over time — stays above safety threshold" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/mpc_joints.jpg" alt="Joint angle profiles — all 6 DOF within limits" style="margin: 0; border-radius: 0.5rem;" />
</div>

Clearance margin stays above the safety threshold throughout. Joint profiles are smooth — the receding horizon doesn't produce jerky commands even while replanning at every step. The NLP uses analytical DH-parameter FK (no autodiff), keeping Jacobian evaluations fast enough for real-time control.
