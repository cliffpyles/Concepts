# Concepts

A collection of concepts, demos, and experiments.

Syncs with projects found on GitHub, CodePen, Colab Notebooks, and other external resources.

## Setup

```bash
npm install
```

After cloning, run `npm run sync` (with `.env` configured) to generate the gallery data.

## Sync from CodePen

Fetch your public pens from CodePen via the GraphQL API:

1. Copy `.env.example` to `.env`
2. Log in at [codepen.io](https://codepen.io) and open DevTools
3. Fill in `CODEPEN_USER_ID`, `CODEPEN_SESSION`, and `CODEPEN_CSRF_TOKEN` (see `.env.example` for where to find these)
4. Run:

```bash
npm run sync
```

**When you add new pens** to your CodePen profile and run `npm run sync`, they automatically appear in the log with full details (title, views, loves, comments, first-seen date). Only public pens are synced; private pens are ignored.

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```
