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

## Adding Sandbox Components

Sandbox experiments run in an isolated iframe with full CSS/JS isolation from the main app.

### Quick start (recommended)

Create a new sandbox with scaffolded files and auto-registration:

```bash
npm run create:sandbox <experiment-id> [title]
```

Example:

```bash
npm run create:sandbox my-demo
npm run create:sandbox my-demo "My Cool Demo"
```

This creates `src/sandbox/<experiment-id>/` with `index.tsx`, `styles.css`, and `README.md`, then runs `sync:sandbox` so it appears at `/sandbox/<experiment-id>` and in the gallery.

### Manual setup

1. **Create a folder** under `src/sandbox/<experiment-id>/`. The folder name becomes the URL slug (e.g. `fluid-interactions` → `/sandbox/fluid-interactions`).

2. **Add `index.tsx`** — your main React component. It will be lazy-loaded when the sandbox route is visited.

3. **Add `README.md`** with required frontmatter so the sync script can register it:

   ```yaml
   ---
   id: my-experiment-01
   title: My Experiment Title
   createdAt: "2026-03-20T10:00:00.000Z"
   updatedAt: "2026-03-21T14:30:00.000Z"
   techStack:
     react: true
     css: true
   ---

   # My Experiment Title

   Brief description of what this sandbox demonstrates.
   ```

4. **Run the sync script** to regenerate the registry:

   ```bash
   npm run sync:sandbox
   ```

5. Visit `/sandbox/<experiment-id>` to see your experiment. It will also appear in the gallery.

See `src/sandbox/fluid-interactions/` for a reference implementation.

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```
