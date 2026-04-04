# Signalboard — Interface Design System

## Direction: Warm Instrument

**Who:** Creative director or strategist building a design brief between meetings. The work is serious; the tool should feel like a precision instrument in a warm studio — not a dev tool, not a marketing product.

**Feel:** Dense, warm, deliberate. Every element earns its place. Nothing decorates.

---

## Palette

All tokens defined as CSS custom properties in `apps/web/src/app/globals.css` and mapped to Tailwind via `@theme inline`.

| Token | Value | Use |
|---|---|---|
| `--sb-base` / `bg-sb-base` | `#100F0E` | Page background, canvas floor |
| `--sb-surface-1` / `bg-sb-surface-1` | `#1A1816` | Cards, panels, inputs |
| `--sb-surface-2` / `bg-sb-surface-2` | `#231F1B` | Hover states, dropdowns |
| `--sb-border` | `rgba(255,255,255,0.06)` | Default separation — barely visible |
| `--sb-border-hover` | `rgba(255,255,255,0.10)` | Interactive hover |
| `--sb-border-emphasis` | `rgba(255,255,255,0.14)` | Section dividers, focus |
| `--sb-text-primary` / `text-sb-text-primary` | `#F0EBE3` | Primary text — slightly warm white |
| `--sb-text-secondary` / `text-sb-text-secondary` | `#A39888` | Supporting text |
| `--sb-text-muted` / `text-sb-text-muted` | `#5C524A` | Labels, metadata, placeholders |
| `--sb-accent` / `text-sb-accent` / `bg-sb-accent` | `#C9944A` | Amber — marks, selections, CTAs |
| `--sb-accent-soft` | `rgba(201,148,74,0.12)` | Selected state backgrounds |
| `--sb-accent-dim` | `rgba(201,148,74,0.45)` | Accent borders |
| `--sb-destructive` / `text-sb-destructive` | `#C45050` | Delete/error only |

**Rule:** Never reach for `neutral-*`. Use only `sb-*` tokens. Warm palette throughout.

---

## Depth strategy: Border-only

No shadows. Borders only.

- Default border: `border-[rgba(255,255,255,0.06)]` — invisible unless you look
- Hover: `border-[rgba(255,255,255,0.14)]`
- Focus (inputs): `border-[rgba(201,148,74,0.40)]` — amber focus ring
- Accent selection border: `border-[rgba(201,148,74,0.50)]`
- Cards: `border border-[rgba(255,255,255,0.08)]` on `bg-sb-surface-1`

---

## Typography

| Role | Classes |
|---|---|
| Section / panel labels | `text-[9px] tracking-[0.15em] uppercase font-medium text-sb-accent opacity-60` |
| Body text | `text-xs text-sb-text-secondary leading-relaxed` |
| Primary text | `text-xs text-sb-text-primary` |
| Metadata / status | `text-[11px] text-sb-text-muted` |
| Asset tags | `text-[9px] tracking-[0.12em] uppercase text-sb-text-muted` |
| Button labels | `text-[10px] tracking-[0.06–0.15em] uppercase font-medium` |
| Text note body | `font-mono text-xs leading-relaxed` |

---

## Spacing

Base unit: 4px. Component padding: 12–16px (`p-3` / `p-4`). Panel headers: `px-4 py-3.5`. Section gaps: `space-y-5`. Tag gaps: `gap-1 / gap-1.5`.

---

## Signature: Confidence thread

Each analyzed asset card shows a 2px vertical amber strip on the left edge. Opacity maps directly to `analysis.confidence` (0–1), minimum 0.2 so there's always a faint mark after analysis completes.

```tsx
{analysis && (
  <div
    className="absolute left-0 top-0 bottom-0 w-0.5"
    style={{ backgroundColor: `rgba(201, 148, 74, ${Math.max(0.2, confidence).toFixed(2)})` }}
  />
)}
```

Card must have `relative overflow-hidden` for this to clip correctly.

---

## Key component patterns

### Canvas asset cards (TextNode, ImageNode, UrlNode)
- `bg-sb-surface-1 border border-[rgba(255,255,255,0.08)] rounded relative group overflow-hidden`
- Confidence thread as above
- Delete button: `opacity-0 group-hover:opacity-100` top-right, `hover:text-sb-destructive`
- Tags: `text-[9px] tracking-[0.12em] uppercase bg-sb-base text-sb-text-muted px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.06)]`
- Tag section separator: `border-t border-[rgba(255,255,255,0.06)] pt-2.5`

### Panel headers (ClarificationPanel, OutputPanel)
- `px-4 py-3.5 border-b border-[rgba(255,255,255,0.06)]`
- Section label: amber `text-[10px] tracking-[0.15em] uppercase opacity-70`
- Subtitle: `text-[11px] text-sb-text-muted`

### Primary CTA buttons
- `bg-sb-accent text-sb-base rounded hover:opacity-90 transition-opacity`
- Text: `text-xs font-medium` or `text-[10px] tracking-[0.08em] uppercase`

### Secondary / ghost buttons
- `border border-[rgba(255,255,255,0.08)] text-sb-text-muted rounded hover:border-[rgba(255,255,255,0.14)] hover:text-sb-text-primary transition-colors`

### Selected state (options, type selectors)
- `border-[rgba(201,148,74,0.50)] bg-[rgba(201,148,74,0.10)] text-sb-accent`

### Input fields
- `bg-sb-surface-1 border border-[rgba(255,255,255,0.08)] focus:border-[rgba(201,148,74,0.40)] outline-none text-sb-text-primary placeholder-sb-text-muted transition-colors`

### Confidence note box (OutputPanel)
- `border border-[rgba(201,148,74,0.20)] rounded p-3 bg-[rgba(201,148,74,0.05)]`

### Answered question card
- Collapsed, `opacity-50`, border `rgba(255,255,255,0.06)` — visually recedes

---

## ReactFlow

- Canvas background: `style={{ background: "#100F0E" }}` on `<ReactFlow>` + `colorMode="dark"`
- `<Background variant={BackgroundVariant.Dots} gap={28} size={1} color="rgba(255,255,255,0.08)" />`
- Controls overridden in globals.css: surface-1 background, sb-border borders, sb-accent on hover

---

## What was rejected

| Default | Replaced with |
|---|---|
| `neutral-950/800/700` surfaces | Warm `sb-base / surface-1 / surface-2` |
| Blue selection state | Amber `rgba(201,148,74,0.10/0.50)` |
| White primary CTA | Amber `bg-sb-accent text-sb-base` |
| Green answered state | Muted collapsed amber card |
| Blue drag-drop overlay | Amber `rgba(201,148,74,0.08)` with dashed amber border |
| Numeric `neutral-*` Tailwind tokens | Named `sb-*` tokens with product vocabulary |
