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

## All Four Sorting Runs

<div style="margin: 1.5rem 0;">
  <img src="/images/mpc_trajectories.png" alt="All four cube-sorting trajectories overlaid — red and black cubes, obstacle box visible" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Four sorting runs overlaid in one view. Red and black cubes each follow distinct arcs around the same obstacle. The semi-transparent blue box is the obstacle AABB used by the MPC solver. Diamond markers show cube pickup locations; stars show drop targets.

## Convergence & Safety

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/mpc_convergence.png" alt="End-effector position error — converges within 3 cm tolerance" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/mpc_clearance.png" alt="Obstacle clearance margin — stays above safety threshold throughout" style="margin: 0; border-radius: 0.5rem;" />
</div>

Left: position error converges below the 3 cm tolerance by the end of the approach phase. The green fill shows where error is safely below threshold. Right: obstacle clearance stays above zero throughout — the closest the end-effector gets is 7.9 cm from the wall, well above the 2 cm safety margin enforced by the NLP.

## Joint Profiles & Solve Time

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/mpc_joints.png" alt="All 6 joint angle profiles — smooth trajectories within limits" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/mpc_solve_time.png" alt="MPC solve time per iteration — steady ~10ms after warm-start" style="margin: 0; border-radius: 0.5rem;" />
</div>

Left: all six joint profiles are smooth — the receding horizon doesn't produce jerky commands even while replanning at every step. Dotted gray lines mark joint limits; no joint comes close. Right: the first solve is slower (~38 ms, warm-start cold-start spike), then steady at ~10 ms — fast enough for real-time control at the 50 ms timestep.
