---
id: scrollable-chat-01
title: Scrollable Chat
createdAt: "2026-03-19T19:16:24.734Z"
updatedAt: "2026-03-19T19:16:24.734Z"
techStack:
  react: true
  css: true
---

# Scrollable Chat

A production-quality scrollable chat UI built with modern CSS (2024-2026) and semantic HTML. Demonstrates how to create a chat that auto-scrolls on new messages, allows scrolling up to read history, and shows a return-to-bottom button when scrolled up—with maximum CSS-driven behavior for performance and accessibility.

## Features

- **Auto-scroll on new messages** — When you're at the bottom, new messages keep you there (no layout jump)
- **Return-to-bottom button** — Appears when you scroll up; click to jump back to latest messages
- **Enter to send, Shift+Enter for newline** — Standard chat input behavior
- **Simulated messages** — New assistant messages every 8 seconds to demonstrate auto-scroll

## Modern CSS Features Used

### Scroll and Layout (Chat-Critical)

| Feature | Use Case |
|---------|----------|
| **overflow-anchor** | CSS-only pin-to-bottom: `overflow-anchor: none` on messages, `overflow-anchor: auto` on bottom anchor. When user is at bottom, new messages keep them there without JS. |
| **@container scroll-state(scrollable: bottom)** | Show/hide return-to-bottom button when user can scroll down. Replaces JS scroll listeners. |
| **scroll-margin** | Fine-tune `scrollIntoView` for the bottom anchor. |

### Fallbacks

- **animation-timeline: scroll()** — When scroll-state not supported, uses scroll-driven animation for return button visibility
- **Always show button** — When neither scroll-state nor scroll() supported (degraded but functional)

### Color and Contrast

| Feature | Use Case |
|---------|----------|
| **oklch()** | Theme tokens; perceptually uniform colors |
| **color-mix()** | Variants from base colors |
| **oklch(from ... round(1.21 - l) 0 0)** | Cross-browser accessible contrast: pick black/white for readable text on dynamic backgrounds |

### Layout and Styling

| Feature | Use Case |
|---------|----------|
| **@scope** | Component-scoped styles without BEM |
| **:has()** | Conditional layout (user vs assistant message alignment) |
| **font-variant-numeric: tabular-nums** | Timestamps without layout shift when numbers change |
| **backdrop-filter** | Frosted return button |

### Accessibility

- **Semantic HTML** — `<main>`, `role="log"`, `aria-live="polite"`, `<article>`, `<form>`
- **prefers-reduced-motion** — Disables animations when requested
- **Focus styles** — Visible focus rings on interactive elements

## Browser Support

| Feature | Support |
|---------|---------|
| overflow-anchor | Chrome 56+, Firefox 66+, Edge 79+ |
| @container scroll-state | Chrome 133+ |
| animation-timeline: scroll() | Chrome 115+, Safari 17.5+, Firefox 110+ |
| oklch() | Chrome 111+, Safari 15.4+, Firefox 113+ |
| @scope | Chrome 134+, Safari (in development) |

**Recommended**: Chrome 133+ for full scroll-state support. overflow-anchor works in Chrome, Firefox, and Edge.

## References

- [Pin Scrolling to Bottom - CSS-Tricks](https://css-tricks.com/pin-scrolling-to-bottom/)
- [Approximating contrast-color() - CSS-Tricks](https://css-tricks.com/approximating-contrast-color-with-other-css-features/)
- [sibling-index() - CSS-Tricks](https://css-tricks.com/almanac/functions/s/sibling-index/)
- [scroll() - CSS-Tricks](https://css-tricks.com/almanac/functions/s/scroll/)
