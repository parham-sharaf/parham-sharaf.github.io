---
title: "Decentralized Fleet Coordination for Airport Ground Operations"
summary: "Multi-agent coverage control for airport ground vehicles using Buffered Voronoi Cells, Lloyd's algorithm, and game-theoretic demand response — zero collisions across all test scenarios."
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

![](/images/fleet_hero.jpg)

**12 ground service vehicles. No central dispatcher. Every gate covered, zero collisions.** Each agent sees only its local Voronoi cell and its neighbors' positions — the fleet self-organizes to match demand as flights arrive and depart.

## The Apron

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/fleet_3d_top.jpg" alt="SFO apron — all vehicle layers" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/fleet_3d_orbit.jpg" alt="3D orbital view mid-simulation" style="margin: 0; border-radius: 0.5rem;" />
</div>

SFO international terminal modeled at scale: 7 gate clusters, 8 vehicle types (fuel, catering, deice, GPU, water, belt loader, bus, maintenance). The coverage problem — keep the right vehicles close to the right gates at the right time — is dynamic, multi-type, and decentralized by design.

## Voronoi Coverage

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; align-items: start; margin: 1.5rem 0;">
  <img src="/images/fleet_voronoi_evolution.gif" alt="Voronoi cells reforming as vehicles move" style="margin: 0; border-radius: 0.5rem;" />
  <div style="font-size: 0.95rem; line-height: 1.6;">
    Each agent owns the Voronoi cell of the apron closest to it. Lloyd's algorithm drives vehicles toward the weighted centroid of their cell — where the demand field is highest. As planes push back and new flights arrive, demand shifts and cells reform. No messages to a central controller; agents converge on their own.
  </div>
</div>

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/fleet_voronoi_3d.jpg" alt="3D Voronoi partition over apron" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/fleet_demand_field.jpg" alt="Demand field heatmap, peak-hour" style="margin: 0; border-radius: 0.5rem;" />
</div>

## BVC Collision Avoidance

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; align-items: start; margin: 1.5rem 0;">
  <img src="/images/fleet_bvc_construction.gif" alt="Buffered Voronoi Cell being constructed around a vehicle" style="margin: 0; border-radius: 0.5rem;" />
  <div style="font-size: 0.95rem; line-height: 1.6;">
    <strong>Buffered Voronoi Cells</strong> shrink each agent's feasible region by half the distance to each neighbor — any movement within the BVC is guaranteed collision-free. Lloyd commands are projected onto the BVC via a QP. Result: the coverage law and the safety constraint compose cleanly, with no separate collision-avoidance layer needed.
  </div>
</div>

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/fleet_bvc.jpg" alt="BVC half-plane construction diagram" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/fleet_comms.jpg" alt="Communication graph — local neighbor topology" style="margin: 0; border-radius: 0.5rem;" />
</div>

## Demand Response

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; align-items: start; margin: 1.5rem 0;">
  <img src="/images/fleet_demand_pulse.gif" alt="Demand field pulsing as a flight arrives at a gate" style="margin: 0; border-radius: 0.5rem;" />
  <div style="font-size: 0.95rem; line-height: 1.6;">
    Flight arrival triggers a demand pulse at the target gate. The demand field φ(x,t) peaks at the gate position and decays spatially. Nearby vehicles detect the shift in their centroid target and converge — no explicit task assignment, no auction protocol. The nearest available vehicle wins by physics.
  </div>
</div>

## Simulation Results

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/fleet_simulation.gif" alt="Full simulation — 12 vehicles, SFO layout" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/fleet_trajectories.jpg" alt="Agent trajectories colored by vehicle type" style="margin: 0; border-radius: 0.5rem;" />
</div>

<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/fleet_vehicle_dynamics.jpg" alt="Per-vehicle coverage and velocity profiles" style="margin: 0; border-radius: 0.5rem;" />
  <img src="/images/fleet_apron_overview.jpg" alt="SFO apron layout annotated" style="margin: 0; border-radius: 0.5rem;" />
</div>

Zero inter-vehicle collisions across simple, medium, and stress-test scenarios. Coverage cost (H(P,φ)) converges to within 8% of the centralized optimum. Average response time to a demand pulse: 23 seconds at realistic ground vehicle speeds.
