---
title: "Build Your Own World"
summary: "Procedurally generated tile-based dungeons with Dijkstra-routed hallways, circular line-of-sight, and deterministic save/load via seed replay. Written in Java from scratch."
date: 2023-05-01
category: "Game Development"
tech:
  - Java
  - StdDraw
  - Algs4
  - Procedural Generation
tags:
  - games
  - procedural
  - graphics
  - systems
featured: true
status: "shipped"
---

<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/byow-hero.png" alt="Default tileset world" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/byow-world-gold.png" alt="Golden temple theme" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/byow-world-explore.png" alt="Multi-room structure" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Infinite deterministic tile worlds from a single 64-bit seed. The same seed produces the same world on any machine — room placement, hallway routing, and player spawn are all seeded from a single `java.util.Random`. Three distinct tile themes applied to the same underlying grid.

## Room Placement

Rooms are placed by repeated random sampling. Each attempt picks a random `(x, y)` origin and a random `(w, h)` dimension capped at 6×6 tiles:

```java
Point point = new Point(randomX(), randomY());
Dimension dim = roomDimension(point);
Rectangle room = new Rectangle(point, dim);
if (!intersectsExistingRooms(this.rooms, room.getBounds())) {
    this.rooms.add(room);
    connectRooms(room);
}
```

Rooms that intersect any existing room are discarded. The loop runs until `maxNumRooms` non-overlapping rooms are placed — a number itself randomly drawn between 5 and 45 per seed. Boundary clipping handles rooms that would otherwise overflow the 80×30 grid.

## Hallway Routing

The hard part is connecting rooms without creating an illegible tangle of corridors. Every room is a node in a weighted graph (`EdgeWeightedGraph` from Algs4), with edge weights equal to Euclidean distance between room origins. To find a compact spanning connection order, the generator runs a greedy nearest-neighbor traversal using `DijkstraUndirectedSP`:

1. Start at room 0.
2. Run Dijkstra from the current room to all others.
3. Move to the unvisited room with minimum graph distance.
4. Repeat until all rooms are visited.

This produces a visitation order that tends to connect nearby rooms first, avoiding long cross-world corridors. Each consecutive pair in the order gets an L-shaped hallway: one horizontal segment and one vertical segment meeting at a corner.

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/byow-architecture-analysis.png" alt="Room and hallway layout analysis" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/byow-los-white.png" alt="Full visibility mode showing world structure" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Wall generation is a post-processing pass: every room and hallway rectangle is expanded by 1 tile in each direction, and any `NOTHING` tile in that border becomes `WALL`. Floor tiles never get overwritten, so overlapping borders produce doorways automatically.

## Line of Sight

Toggling `M` switches from full visibility to a constrained view. The constraint is an ellipse of radius 8 centered on the player:

```java
public TETile[][] getConsTiles(Point p) {
    int radius = 8;
    Shape circle = new Ellipse2D.Double(p.x - radius/2, p.y - radius/2, radius, radius);
    // tiles outside the ellipse → NOTHING
}
```

Only tiles whose `(i, j)` coordinates fall inside the ellipse are copied to the render buffer — everything else stays dark. This is a visibility *mask*, not shadow casting: it doesn't account for walls occluding distant tiles, but it creates effective exploration tension because you can't see around corners into adjacent rooms.

<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/byow-los-white.png" alt="Full visibility" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/byow-los-gold.png" alt="Line-of-sight — golden theme" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/byow-los-pink.png" alt="Line-of-sight — pink theme" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

## Save and Load

Save state is three lines in `world.txt`: the seed, the player's `(x, y)` position, and the full movement recording string (every `WASD` and `M` keypress concatenated). Load works by replaying:

```
seed
playerX playerY
WWDDSSWWMWWASD...
```

On load, the engine reconstructs the world from the seed (deterministic — same output every time), places the player at the saved position, then feeds the recorded input string back through the game loop. The result is bit-exact state recovery without serializing the tile array.

The tradeoff: recording length grows with play time. A multi-hour session would produce a correspondingly long replay string, making load time O(actions) rather than O(1). For this project scope that's acceptable.

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 1.5rem 0;">
  <img src="/images/byow-minimap-system.png" alt="Minimap and HUD overlay" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
  <img src="/images/byow-lighting-comparison.png" alt="Lighting comparison across themes" style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

## Controls

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1rem 0;">
  <span style="color: var(--color-accent);">N &lt;seed&gt; S</span><span>Generate new world from seed</span>
  <span style="color: var(--color-accent);">W A S D</span><span>Move on tile grid (floor tiles only)</span>
  <span style="color: var(--color-accent);">M</span><span>Toggle circular line-of-sight mask</span>
  <span style="color: var(--color-accent);">C</span><span>Cycle avatar (5 options)</span>
  <span style="color: var(--color-accent);">:Q</span><span>Save seed + position + recording, quit</span>
  <span style="color: var(--color-accent);">L</span><span>Load and replay saved session</span>
</div>
