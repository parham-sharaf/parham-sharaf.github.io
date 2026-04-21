---
title: "Procedurally Generated 2D Tile World"
summary: "A seed-driven tile-based world engine in Java — rooms are planted at random, wired together with Dijkstra on an edge-weighted graph, and the whole world is playable, saveable, and fully replayable from its seed."
date: 2023-05-01
category: "Procedural Generation"
tech:
  - Java
  - Dijkstra's Algorithm
  - Graph Theory
  - Persistence
  - StdDraw
tags:
  - games
  - procedural
  - algorithms
featured: true
status: "shipped"
---

![A world generated from seed 7777 — rooms connected by Dijkstra-planned hallways](/images/byow-hero.png)

## What it is

A 2D tile-based world that builds itself. Give it a numeric seed and it plants
rooms across a 30×30 tile grid, wires them together with non-overlapping
hallways, drops you in, and lets you walk around. Quit with `:q` and the
world state is serialized to disk; type `l` next time and you resume exactly
where you left off — same rooms, same player position, same tiles.

## How it works

**Seed-driven generation.** Every random decision — room count, room position,
room dimensions, hallway routing — is pulled from a single `Random` seeded by
the input. Same seed, same world, every time. That property makes the whole
thing reproducible and testable.

**Rooms first, hallways second.** The generator first samples a candidate
count of rooms and tries to place them without collision. Each placed room
becomes a node in an `EdgeWeightedGraph`.

**Dijkstra for connectivity.** To guarantee every room is reachable without
drawing spaghetti, hallways are planned as shortest paths in the room graph
using `DijkstraUndirectedSP`. The result feels designed rather than random —
you get a coherent layout, not a maze.

<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 1.5rem 0;">
  <figure style="margin: 0;">
    <img src="/images/byow-dense.png" alt="Dense seed" style="margin: 0; border-radius: 0.5rem;" />
    <figcaption style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-fg-dim); text-align: center; margin-top: 0.4rem;">seed 7</figcaption>
  </figure>
  <figure style="margin: 0;">
    <img src="/images/byow-hero.png" alt="Balanced seed" style="margin: 0; border-radius: 0.5rem;" />
    <figcaption style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-fg-dim); text-align: center; margin-top: 0.4rem;">seed 7777</figcaption>
  </figure>
  <figure style="margin: 0;">
    <img src="/images/byow-sparse.png" alt="Sparse seed" style="margin: 0; border-radius: 0.5rem;" />
    <figcaption style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-fg-dim); text-align: center; margin-top: 0.4rem;">seed 314159</figcaption>
  </figure>
</div>

*Three different seeds, three different worlds — same engine. Density, room count, and hallway topology all fall out of the seed deterministically.*

**Two front-ends, one engine.** The core engine exposes two modes:

- `interactWithKeyboard()` — full interactive session with rendering.
- `interactWithInputString("n1234sssww:q")` — headless mode where the entire
  session is driven by a deterministic input string. Same engine, no UI.

That dual interface was the key architectural call. Everything interesting
— generation, movement, persistence — lives behind a pure function over
`(seed, input-string) → world-state`, which means the test suite can drive
any scenario end-to-end without ever opening a window.

**Persistence.** On `:q`, the current seed + full input history is written
to disk. On `l`, it's replayed through the headless engine, reconstructing
the exact world state by construction rather than by serializing every tile.
Cheap, tiny save files, guaranteed-consistent restore.

## What I got out of it

The satisfying part was watching the determinism property fall out of the
architecture: once generation and movement were both pure functions of the
input string, save/load stopped being a feature and started being a
consequence. That kind of "the design makes the problem disappear" moment
is the reason this project stuck with me.
