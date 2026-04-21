# Portfolio

Personal site built with [Astro](https://astro.build), Tailwind CSS v4, and content collections. Designed to be minimal, fast, and trivial to extend — add a new project by dropping a single Markdown file.

## Stack

- **Astro 6** — content-first, zero-JS by default
- **Tailwind CSS v4** — themed with CSS variables in `src/styles/global.css`
- **Typography** — Geist + Geist Mono from Google Fonts
- **Content Collections** — typed frontmatter, schema-validated

## Structure

```
src/
├── config.ts                  # name, bio, social links (edit me)
├── content.config.ts          # project schema
├── content/
│   └── projects/              # one .md file per project
├── layouts/Base.astro         # site shell
├── components/
│   ├── Nav.astro
│   ├── Footer.astro
│   └── ProjectCard.astro
├── pages/
│   ├── index.astro            # hero + featured + recent
│   ├── about.astro
│   └── projects/
│       ├── index.astro        # grouped by year
│       └── [slug].astro       # individual project page
└── styles/global.css          # theme tokens + utilities
```

## Adding a project

Create `src/content/projects/my-project.md`:

```md
---
title: "Project name"
summary: "One-liner that shows on cards and hero."
date: 2025-01-15
category: "Robotics"
tech: ["Python", "ROS"]
tags: ["autonomy"]
featured: true
status: "shipped"       # shipped | in-progress | archived | research
links:
  github: "https://github.com/..."
  paper: "https://arxiv.org/..."
---

## What it is

Write the body in Markdown. Use headings, lists, code blocks, images.
```

The file's name becomes its URL slug: `/projects/my-project`.

## Develop

```bash
npm run dev        # localhost:4321
npm run build      # static build to dist/
npm run preview    # preview the build
```

## Deploy

Push to GitHub, connect the repo to [Vercel](https://vercel.com) or [Cloudflare Pages](https://pages.cloudflare.com), and it ships. Both are free for this kind of site.
