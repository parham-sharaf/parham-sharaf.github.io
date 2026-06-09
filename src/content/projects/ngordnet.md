---
title: "ngordnet: Semantic Evolution Explorer"
summary: "Interactive tool fusing WordNet's semantic graph with Google Books NGram data to explore how language evolves. Query 'transportation' and watch centuries of linguistic change unfold."
date: 2023-04-15
category: "NLP & Data Engineering"
tech:
  - Java
  - WordNet
  - Google Ngrams
  - Graph Algorithms
  - HTTP Server
  - Data Visualization
tags:
  - nlp
  - data-viz
  - graphs
  - linguistics
featured: true
status: "shipped"
---

<div style="margin: 1.5rem 0;">
  <img src="/images/ngordnet-hero.png" alt="Left: WordNet hyponym DAG rooted at 'transportation'. Right: aggregate Google NGram frequency 1900–2007 for all hyponyms; automobile rises, horse_carriage falls, internet spikes." style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

Query "transportation" and the tool expands it through WordNet's semantic hierarchy to find every descendant concept (vehicle, automobile, bicycle, carriage, and hundreds more), then aggregates their Google Books frequencies across 200 years. The result is a single curve showing how the entire concept of transportation shifted over time, not just one word.

<div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--color-fg-muted); display: grid; grid-template-columns: auto 1fr; gap: 0.4rem 1.5rem; margin: 1.5rem 0;">
  <span style="color: var(--color-accent);">datasets</span><span>WordNet 3.0 (155K synsets, 206K word senses) + Google Books NGrams (500GB, 8M books)</span>
  <span style="color: var(--color-accent);">graph</span><span>Directed acyclic graph over English hypernym/hyponym relations</span>
  <span style="color: var(--color-accent);">query</span><span>Hyponym BFS expansion → frequency aggregation across all descendants</span>
  <span style="color: var(--color-accent);">performance</span><span>&lt;100ms for typical queries; memoized traversal results</span>
</div>

## The Data Model

WordNet encodes the "is-a" hierarchy of English as a **directed acyclic graph**. Each node is a *synset*, a set of synonymous words expressing the same concept. Edges point from hyponym (specific) to hypernym (general): `automobile → vehicle → conveyance → artifact → object`. The graph has 155K synsets connected by ~166K hypernym edges.

The core challenge is that a single word can belong to multiple synsets ("dog" is both a domestic animal and a verb meaning to follow) and synsets can have multiple hypernyms (multiple inheritance). The in-memory representation maps `word → Set<Integer synset_id>` and maintains a separate `synset_id → List<Integer child_ids>` adjacency list for traversal. Both are built in a single pass over the WordNet files.

Google Books NGrams stores per-word frequency normalized by total corpus size in each year: `(word, year) → count / total_words_that_year`. This relative frequency makes 1850 and 2000 comparable despite the corpus growing 100×. The full dataset is 500GB; I load only the vocabulary present in WordNet, reducing the working set to ~200MB in heap.

## Hyponym Expansion

The core query walks the DAG downward from a root word:

```java
public Set<String> hyponyms(String word) {
    Set<Integer> visited = new HashSet<>();
    Queue<Integer> queue = new ArrayDeque<>();
    Set<String> result = new HashSet<>();

    for (int synset : wordToSynsets.getOrDefault(word, Set.of()))
        queue.add(synset);

    while (!queue.isEmpty()) {
        int s = queue.poll();
        if (!visited.add(s)) continue;
        result.addAll(synsetToWords.get(s));
        for (int child : children.getOrDefault(s, List.of()))
            queue.add(child);
    }
    return result;
}
```

BFS over the synset graph (not the word graph) handles multiple inheritance correctly. A synset visited by two paths is processed once. Typical queries return 50–500 words; "entity" returns ~40K, which is why depth-limiting matters for broad root concepts.

## Frequency Aggregation

Once the hyponym set is computed, aggregate across time:

$$f_\text{concept}(t) = \sum_{w \in \text{hyponyms}(\text{root})} f_w(t)$$

where $f_w(t)$ is the NGram relative frequency of word $w$ in year $t$. This lets a single query represent an entire semantic category. Querying "automobile" (one word) vs "vehicle" (all descendants) produces very different curves; the former tracks only the word "automobile" while the latter captures car, truck, van, bus, motorcycle, and dozens of regional variants.

<div style="margin: 1.5rem 0;">
  <img src="/images/ngordnet-plot.png" alt="NGordnet UI: word frequency plot for 'fish' vs 'dog' vs 'cat', 1900–2000" style="margin: 0; border-radius: 0.5rem; width: 100%; background: white; padding: 0.5rem;" />
</div>

## What the Data Reveals

<div style="margin: 1.5rem 0;">
  <img src="/images/ngordnet-queries.png" alt="Left: horse vs automobile hyponym frequency crossover ~1910. Right: communication sub-concepts rotating; telegraph declining, telephone rising then flat, email/internet spiking, while aggregate stays stable." style="margin: 0; border-radius: 0.5rem; width: 100%;" />
</div>

**Left, "horse" vs "automobile" (1840–1950)**: The crossover happens around 1910, not the 1920s as popular history suggests. The NGram signal predates mass production because "automobile" entered the written record as speculation (patents, journal articles, newspaper coverage) before the cars themselves were common.

**Right, "communication" hyponyms (1900–2000)**: Telegraph declines, telephone rises then plateaus, radio peaks around WWII, email/internet spikes after 1990. But the *aggregate* stays nearly flat throughout. The concept of "communication" didn't grow; its vocabulary rotated. This is only visible when you query at the semantic level rather than tracking individual words.

## Architecture

Java backend loads both datasets at startup (~3s), then serves queries over a lightweight HTTP server (Java's built-in `com.sun.net.httpserver`). The `/hyponyms` endpoint returns the word set; `/history` returns a JSON time series for a word; `/ngordnet` combines both: expand then aggregate. Memoization on the hyponym traversal keeps repeated queries at ~1ms; cache misses take 20–50ms for typical depth queries.

The frontend is a provided browser interface that plots the time series returned by `/ngordnet` as a D3.js line chart. The interesting work is entirely in the backend: data loading, graph traversal, and aggregation.
