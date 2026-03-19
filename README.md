# CodePen Collection

A demo site for [@cliffpyles](https://codepen.io/cliffpyles) CodePen pens. Displays a grid of pens with links to CodePen and a detailed pen log that updates when new pens are synced.

## Setup

```bash
npm install
```

## Sync Pens

Fetch your public pens from CodePen:

```bash
npm run sync
```

The sync script tries several unofficial CodePen APIs. If they're unavailable, it falls back to `src/data/pens.manual.json` — add your pens there in the same JSON structure.

**When you add new pens** to your CodePen profile and run `npm run sync`, they automatically appear in the log with full details (title, description, views, loves, comments, first-seen date).

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Manual Pens

If the API is down, edit `src/data/pens.manual.json`:

```json
[
  {
    "id": "your-pen-id",
    "title": "Pen Title",
    "details": "Description",
    "link": "https://codepen.io/cliffpyles/pen/your-pen-id",
    "views": "0",
    "loves": "0",
    "comments": "0",
    "images": {
      "small": "https://...",
      "large": "https://..."
    },
    "user": {
      "username": "cliffpyles",
      "nicename": "Cliff Pyles"
    }
  }
]
```

Then run `npm run sync` to merge them into the main data file.
