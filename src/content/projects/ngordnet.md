---
title: "ngordnet — NGram × WordNet Explorer"
summary: "An interactive tool that fuses WordNet's hypernym/hyponym graph with Google Books NGram frequency data to ask questions like: 'how has the language around transportation evolved over two centuries?' Browser UI, Java backend, real data."
date: 2023-04-15
category: "NLP & Data"
tech:
  - Java
  - WordNet
  - Google Ngrams
  - Graph Traversal
  - HTTP Server
tags:
  - nlp
  - data-viz
  - graphs
featured: true
status: "shipped"
---

![A sample query — relative frequency of *queen*, *question*, *quantum*, and *quiet* in books published between 1900 and 2000, computed from the Google Books NGrams corpus.](/images/ngordnet-plot.png)

## What it is

`ngordnet` takes two large open datasets — **WordNet**'s semantic graph of
English and **Google Books NGrams**' word-frequency time series — and lets
you cross them in a browser. You type in a concept like *transportation* or
*grief*, pick a year range, and get back a plot of how every word under
that concept (its full hyponym subtree) has been used in books over time.

It's a small tool, but it turns two static datasets into something you can
actually interrogate. The plot above shows what a single-word query looks like:
*question* dominates the 20th century, *quantum* emerges after 1920 and climbs
with the rise of physics, and the two everyday words — *queen* and *quiet* —
hold roughly steady.

## What's interesting about it

**A directed acyclic graph over English.** WordNet encodes the
"is-a" relation: *canine* is a hypernym of *dog*, *vehicle* is a hypernym of
*car*, and so on. Loading it in means parsing a sparse DAG representation
and reasoning about transitive closures — the hyponyms of *vehicle* are
every concept reachable via descendant edges.

**DFS over the semantic DAG.** Given an input word, the tool performs a
depth-first traversal to collect the full hyponym set, then joins those
words against the NGram frequency table.

**Streaming ingestion.** Google's NGram files are huge. The ingestion
pipeline reads them once, aggregates counts per-word-per-year into
`TimeSeries` objects keyed by word, and discards the raw text. Memory stays
bounded; queries stay fast.

**HTTP-served browser UI.** The Java backend exposes endpoints (`/ngrams`,
`/hyponyms`, `/history`) that the front-end hits to fetch data on demand.
The plotting layer turns the results into inline SVG charts.

## What I got out of it

Writing this was the first time I really appreciated that a *data structure*
and a *UI* are the same idea viewed from different angles. The DAG isn't
interesting on its own — it becomes interesting when you can pivot around
it interactively. Most of the complexity ended up being in the plumbing
between the graph, the time-series store, and the HTTP layer, and that's
where most of the learning happened too.
