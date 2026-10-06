---
title: "Does a Merge Planner Need a Model of the Traffic?"
summary: "Three planners share one control interface and differ only in what they believe about the car behind them: nothing, everything, or whatever they can learn. Across 41,130 episodes on 914 held-out Waymo scenes, a correct model of the follower is worth everything in one narrow band of gap sizes and nothing outside it, and the moment it is wrong, the planner that trusted it drops to zero. A learned policy wins the opposite regime, but a control proves it wins by acting early rather than by understanding anything."
date: 2026-08-07
category: "Machine Learning"
tech:
  - Python
  - JAX
  - Waymax
  - PPO
  - Model Predictive Control
  - DuckDB
tags:
  - autonomous-driving
  - motion-planning
  - reinforcement-learning
  - interaction-modeling
  - model-predictive-control
  - experiment-design
featured: true
status: "research"
heroImage: "/images/waymax-merge/branch_fan.png"
---

A car merging into dense traffic needs a gap that may not exist yet but might open, if the driver behind decides to let it. **How much is it worth to know how traffic will react to you?**

Three planners, one `(lateral, speed)` setpoint interface, one tracker. Only the decision layer differs, so every difference in outcome is attributable to it.

| | believes about the follower |
|:---|:---|
| **Arm 1** | nothing: predicts constant velocity |
| **Arm 2** | everything: its rollout imports its constants *from the module that drives the follower* |
| **Arm 3** | whatever PPO learns from interaction |

## What "refusing to merge" actually looks like

<figure style="margin: 2rem 0;">
  <img src="/images/waymax-merge/branch_fan.gif" alt="Both planners' candidate manoeuvres drawn every step: 105 trajectories fanned ahead of the ego, red where the headway rule refuses them and green where feasible, with the chosen branch in white." style="width: 100%; margin: 0; border-radius: 0.5rem;" />
  <figcaption style="text-align: center; font-size: 0.875rem; opacity: 0.65; margin-top: 0.5rem;">G = 3.0 s. Each step both planners enumerate 105 candidate manoeuvres, roll every one 66 steps forward, and test each against the headway rule: <span style="color:#e0776c">red refused</span>, <span style="color:#56b08a">green feasible</span>, white chosen. Shaded zones are the clearance the rule demands. <strong>Arm 1 refuses 6,615 of 6,615 evaluations</strong>; its counter never leaves zero. Arm 2's climbs 2 → 70 and jumps the moment the follower lifts off.</figcaption>
</figure>

Arm 1 is not idle. It searches exhaustively and finds nothing, 105 times a step, for the whole episode.

## The result

<figure style="margin: 2rem 0;">
  <img src="/images/waymax-merge/merge_matrix.png" alt="A five by nine matrix of safe-merge rates: five arms against three gap sizes crossed with three follower behaviours, shaded on a single-hue sequential scale." style="width: 100%; margin: 0; border-radius: 0.5rem;" />
  <figcaption style="text-align: center; font-size: 0.875rem; opacity: 0.65; margin-top: 0.5rem;">Every cell of the study. Success requires settling in-lane <em>and</em> holding headway front and rear, the same rule the planners enforce, applied to what actually happened.</figcaption>
</figure>

**The top row is the ceiling**, and it changes how every other row reads. It is the best a policy can do that only decides *when* to commit, found by sweeping every commit time across the episode and asking whether any of them yields a legal merge.

**Three cells where 0.0% is the correct answer, not a failure.** An ego centred in a slot of `G` seconds holds `G/2` seconds of headway each side and needs 1.5, so at G = 3.0 the slack is algebraically zero. Against a follower that cannot be induced to concede, no policy should merge there, and none does.

**One cell where 88.9% beats a ceiling of zero.** At G = 3.0 against a *yielding* follower, timing alone achieves nothing, because the oracle never encroaches and so the follower never lifts off. Arm 2 scores 88.9% by **creating the gap rather than waiting for one**. That is the cleanest evidence in the project that its handed-over model buys genuine interaction rather than better timing.

**And the planners' 1.2% against a closer is now unambiguously a miss.** The ceiling there is 99.2%: a safe merge existed in essentially every scene, available from step 0, and both planners failed to take it.

## Where the learned policy genuinely wins

Paired McNemar on identical scenes, arm 3 against the better planner in each cell:

| cell | arm 3 | best planner | planner-only wins | arm3-only wins | p |
|:---|---:|---:|---:|---:|---:|
| G = 4.0, **closes** | 98.2% | 1.2% | **0** | **887** | 1.9 × 10⁻²⁶⁷ |
| G = 3.5, **closes** | 34.6% | 0.0% | **0** | **316** | 1.5 × 10⁻⁹⁵ |
| G = 4.0, yields | 98.6% | 96.3% | **0** | **21** | 9.5 × 10⁻⁷ |
| G = 4.0, ignores | 98.6% | 96.3% | **0** | **21** | 9.5 × 10⁻⁷ |
| G = 3.5, yields | 81.0% | 97.4% | 166 | 16 | 1.3 × 10⁻³² |
| G = 3.0, yields | 0.0% | 88.9% | 813 | 0 | 3.7 × 10⁻²⁴⁵ |

In the four cells it wins, **it never loses a scenario the planner wins**. That is strict dominance, not a better average. The most interesting is G = 4.0 against a *yielding* follower: the traffic arm 2's model describes exactly, where a policy with no model still wins 21 scenes and loses none.

## What the learning actually bought

<figure style="margin: 2rem 0;">
  <img src="/images/waymax-merge/merge_training.png" alt="Untrained against trained safe-merge rate for each of the nine cells, showing large gains everywhere a merge is feasible." style="width: 100%; margin: 0; border-radius: 0.5rem;" />
  <figcaption style="text-align: center; font-size: 0.875rem; opacity: 0.65; margin-top: 0.5rem;">The action head is <em>initialised</em> to "merge immediately" (a deliberate fix for an exploration failure), so the untrained network is a real baseline, not a random one.</figcaption>
</figure>

The untrained network settles in-lane 98–99.5% of the time in every cell. It merges just as often as the trained one; it merges **illegally**. PPO is worth **+83 points** at G = 4.0 against a closer, and what it learned is *when to commit*, not who it is facing.

## Each arm, doing its thing

<figure style="margin: 2rem 0;">
  <img src="/images/waymax-merge/arm1_vs_arm2.gif" alt="Arm 1 and arm 2 on the same 26-object Waymo scene. Arm 1 holds its starting offset for the whole episode; arm 2 moves to the lane edge, holds there for three seconds, then merges." style="width: 100%; margin: 0; border-radius: 0.5rem;" />
  <figcaption style="text-align: center; font-size: 0.875rem; opacity: 0.65; margin-top: 0.5rem;"><strong>G = 3.0, the gap that needs negotiating.</strong> Arm 1 flat at its starting offset for six seconds. Arm 2 descends to the lane edge at 1.9 m, <strong>holds from t = 2 s to t = 4.5 s</strong> while the follower decides, then commits.</figcaption>
</figure>

<figure style="margin: 2rem 0;">
  <img src="/images/waymax-merge/safety_rule.gif" alt="The headway zones the merge rule demands, shaded red while violated and green once clear, with the follower tinted by how hard it is braking." style="width: 100%; margin: 0; border-radius: 0.5rem;" />
  <figcaption style="text-align: center; font-size: 0.875rem; opacity: 0.65; margin-top: 0.5rem;"><strong>The mechanism, close up.</strong> Shaded zones are the headway demanded front and rear. The follower is tinted by its own braking: grey at zero, saturated at the −4 m/s² clamp. The causal chain in one frame: ego encroaches → follower reddens → rear zone clears → merge fires.</figcaption>
</figure>

<figure style="margin: 2rem 0;">
  <img src="/images/waymax-merge/arm2_followers.gif" alt="Arm 2 on one scene against three follower behaviours: yielding, ignoring, and closing the gap." style="width: 100%; margin: 0; border-radius: 0.5rem;" />
  <figcaption style="text-align: center; font-size: 0.875rem; opacity: 0.65; margin-top: 0.5rem;"><strong>The same planner, three kinds of traffic.</strong> Its model says the follower will yield. Where that holds it merges 88.9% of the time; where it does not, the follower never concedes, the safety check never passes, and arm 2 waits out the episode. A confidently wrong model made it <em>useless, not unsafe</em>.</figcaption>
</figure>

<figure style="margin: 2rem 0;">
  <img src="/images/waymax-merge/three_arms_closer.gif" alt="All three arms against a follower that closes the gap at G = 3.5." style="width: 100%; margin: 0; border-radius: 0.5rem;" />
  <figcaption style="text-align: center; font-size: 0.875rem; opacity: 0.65; margin-top: 0.5rem;"><strong>G = 3.5 against a closer.</strong> Both planners refuse: 0.0% across 914 scenes. The learned policy commits early and is clear of the conflict before the gap shuts.</figcaption>
</figure>

## The learned policy is not adaptive

<figure style="margin: 2rem 0;">
  <img src="/images/waymax-merge/merge_control.png" alt="Scatter of the adaptive policy's safe-merge rate against the control policy's across nine matched cells, all points on the identity line." style="width: 100%; margin: 0; border-radius: 0.5rem;" />
  <figcaption style="text-align: center; font-size: 0.875rem; opacity: 0.65; margin-top: 0.5rem;">The control is the same architecture, budget, corpus and seed, trained <em>only</em> against a yielding follower.</figcaption>
</figure>

A policy that never encountered a closing follower handles one just as well: **98.5% vs 98.2%**, largest gap across nine matched cells 3.0 points.

So two things are true at once: **training matters enormously** (14.9% → 98.2% over the untrained initialisation) and **training on the hard case matters not at all**. What PPO learned is a general commit-timing skill, acquired from cooperative traffic and transferred intact to traffic it never saw. It is not adaptivity: the ego never infers who it faces.

Earliness is not free. At G = 3.5 against a yielder arm 3 scores **81.0%** against arm 2's 97.4%, settling in-lane 99.7% of the time. It merges almost always, and about a fifth of those merges are illegal. At G = 3.0 it is a flat **0.0%**: it cannot negotiate at all.

That failure is arithmetic, not incentive. The nudge is ~40 *consecutive* steps holding at the lane edge; the converged policy's mean sits 2.9σ from that hold, and PPO's exploration noise is drawn independently per step. Independent noise finds reflexes, never sustained commitments.

## What I got wrong

Every arm-3 number this project produced before the audit was invalid. None of the bugs announced themselves.

| | defect | consequence |
|:---|:---|:---|
| **1** | 72% of every PPO gradient was post-terminal padding | the advantage normaliser was set by frozen states; ¾ of the gradient pushed down actions taken after the episode ended, concentrated on the episodes that merged *earliest* |
| **2** | "best checkpoint" compared a single training batch | for a policy whose true rate is 65.5%, the max over 391 batches averages 74.1%. The run reported 76.2%; the whole signal was sampling noise |
| **3** | the database stored the loose criterion | a policy scores 98.5% on "ended up in the lane" while holding 0.37 s of time-to-collision, against the planner's 34.5 s |
| **4** | 68 scenes could not measure the effect | "collision rate doubles" was 3 episodes against 6, Fisher p = 0.49 |
| **5** | the collision metric counted the wrong cars | none of arm 1's collisions involved the leader or follower; two happened at step 0, inside a parked car |

<figure style="margin: 2rem 0;">
  <img src="/images/waymax-merge/merge_audit.png" alt="Left: the advantage distribution of real transitions against post-terminal padding. Right: a histogram of maxima over 391 training batches against the policy's true rate." style="width: 100%; margin: 0; border-radius: 0.5rem;" />
</figure>

Defect 5 turned out to be worse than a metric bug. Forcing an immediate merge into the tightest slot in the study:

<figure style="margin: 2rem 0;">
  <img src="/images/waymax-merge/merge_geometry.png" alt="Closest approach to a conflict vehicle against gap size, always far above the 4.8 metre distance at which vehicle boxes would overlap." style="width: 100%; margin: 0; border-radius: 0.5rem;" />
  <figcaption style="text-align: center; font-size: 0.875rem; opacity: 0.65; margin-top: 0.5rem;">Zero merge-conflict collisions across all 41,130 episodes, not because the planners are safe, but because <strong>the design cannot produce one</strong>. The author centres the ego in a slot that always physically fits it.</figcaption>
</figure>

Every collision-based claim is therefore retracted. Any future safety result here needs a redesigned scenario author, or must rest on headway margin alone.

**And fixing defect 1 bought nothing.** The un-fixed ablation scores within noise everywhere and is *significantly better* at one cell (40.8% vs 34.6% at G = 3.5 against a closer). A real correctness bug with no measurable performance cost.

## Corpus and machinery

<figure style="margin: 2rem 0;">
  <img src="/images/waymax-merge/merge_corpus.png" alt="Mining funnel from 40,220 scanned scenes to 2,003 usable, split into train, validation and test." style="width: 100%; margin: 0; border-radius: 0.5rem;" />
</figure>

A scene qualifies only if every gap size can be authored on it and the ego has road left to drive the full episode, which keeps the comparison paired across the gap axis instead of mixing scene difficulty into it. The split is a pure function of the scenario id hashed with `hashlib`, not Python's builtin `hash`: the builtin is salted per process and would have put a scene in *train* inside the trainer and *test* inside the evaluator, with nothing to report an error.

Throughput came from one observation: the environment's cost is kernel-launch overhead on 32-element arrays, not arithmetic, so batching divides the fixed cost by B: **21.7× at B = 128**. The blocker was the IDM policy's desired speed being a Python constant baked in at trace time, capping a batch at the largest same-speed group (measured: 8). Carrying it as a traced array lets one compilation serve the whole corpus, with no change to the IDM implementation, which matters, because that class is the oracle everything else is validated against.

## Conclusion

**Modelling the interaction buys one narrow band of gap sizes; acting fast buys the rest; neither buys both.**

Arm 2's handed-over model is decisive in exactly one cell: G = 3.0 against a yielding follower, where the best timing-only policy scores 0.0% and arm 2 scores 88.9% by inducing the gap. Everywhere else it is worth nothing, and against a follower it has mispredicted it is worth less than nothing.

Arm 3 inverts that profile without ever representing the interaction. It strictly dominates both planners in four cells and never wins a scene by merging unsafely, but it cannot negotiate, and the skill it learned is timing rather than understanding, as proven by a control that matches it exactly having never seen the hard case.

Three things I would not claim. That reinforcement learning solves this: it cannot learn the negotiation, and the reason is structural: the manoeuvre requires ~40 consecutive committed steps against per-step independent exploration noise. That the fix to the padding defect mattered: it did not, measurably, anywhere. And that anything here says much about safety: a merge collision is geometrically impossible in this scenario design, so every collision-based claim is retracted and the comparison rests on headway margin alone.

The honest next step is distillation from arm 2 followed by fine-tuning, converting an exploration problem into supervised learning, testing *representability* rather than *discoverability*.

The part worth taking seriously is the audit. Five defects, four of them invisible in every aggregate I was looking at, each found by measuring something specific rather than reading code: tracing one episode's collision to the car it actually hit, simulating what a selection rule reports on pure noise, checking what fraction of a tensor was real, forcing a merge into the tightest slot to see whether the safety metric could fire at all. All five are pinned by tests.
