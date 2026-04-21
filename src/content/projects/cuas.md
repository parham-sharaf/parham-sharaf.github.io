---
title: "cUAS — Counter-UAS Flight Simulation"
summary: "A Python flight-simulation package for interceptor dynamics, mission sequencing, and GNC experiments against moving airborne threats."
date: 2025-06-01
category: "Controls & Autonomy"
tech:
  - Python
  - NumPy / SciPy
  - Pydantic
  - PyVista
  - Matplotlib
  - pytest
tags:
  - simulation
  - guidance
  - controls
  - 6-DOF
featured: true
status: "in-progress"
links:
  github: "https://github.com/yourhandle/cUAS"
---

## What it is

`cUAS` is a counter-UAS (unmanned aerial system) flight-simulation environment
I've been building to experiment with interceptor dynamics, guidance laws, and
mission sequencing against moving aerial threats. It's designed to be the kind
of sandbox where you can compare a PID autopilot against pure-pursuit guidance,
swap out a 3-DOF longitudinal model for a full 6-DOF Skywalker X8-style vehicle,
and then watch the engagement play out in 3D.

## Highlights

- **3-DOF and 6-DOF dynamics.** Swappable equations-of-motion modules. 3-DOF for
  fast iteration on longitudinal guidance; 6-DOF when I need attitude and
  aero-coupling effects to matter.
- **GNC pipeline.** A clean navigation → guidance → controller pipeline with a
  PID autopilot and pure-pursuit guidance that can be independently swapped or
  profiled against each other.
- **Mission segments.** Segment-based missions with `hold`, `climb`, `direct`,
  `altitude-hold`, `dash`, and `pursuit` objectives, composable into sequences
  and driven from YAML.
- **Built-in profiles.** Scramble (rear-aspect chase), hunter (loiter-and-dive),
  and geometric (head-on) intercept scenarios included out of the box.
- **Visualization.** Matplotlib animations for 2D review and PyVista for 3D
  flythroughs. Pre-cached rotated sprite frames so animation stays smooth.
- **Configuration as data.** Pydantic-validated YAML config — no hardcoded
  simulation parameters. `CUAS_CONFIG=path/to/file.yaml uv run cuas --show`.
- **Test coverage.** Pytest suite covering config loading and validation,
  equations-of-motion numerics, GNC pipeline across all objective types, and
  mission sequencing.

## What I've learned building it

The interesting parts were less about any single algorithm and more about the
plumbing — making a simulation tool that stays easy to modify months later.
Typing the segment objectives as dataclasses instead of magic strings paid off
every time I added a new mission mode. Moving all the tunable knobs into a
validated config schema meant I could run ablations without touching code.

> The second-order lesson: a good simulator is a forcing function for clear
> interfaces. Every sloppy boundary shows up as a test that's hard to write.

## What's next

- A proper world model (wind, obstacles, sensors) — currently a stub.
- Monte Carlo sweeps over initial conditions to characterize miss distance
  distributions per guidance law.
- Swap in a learned controller and compare against the classical baselines.
