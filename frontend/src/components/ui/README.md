# BloodLife design system

Built on MUI 7 — no extra dependencies. Three layers:

| Layer | File | What it is |
|---|---|---|
| Tokens | `src/lib/design-tokens.js` | Raw values: colours, radii, shadows, layout, status→tone map. No React. |
| Theme | `src/lib/theme.js` | `buildTheme(mode)` turns tokens into a MUI theme (palette, type scale, component overrides). Also exposes tokens as `theme.custom.*`. |
| Components | `src/components/ui/*` | Small building blocks the theme can't express. |

## Use the theme first

Buttons, inputs, selects, dialogs, tabs, chips, alerts, tooltips, menus and tables are
styled by the theme. Use MUI's own components — don't wrap them:

```jsx
<Button variant="contained">Save</Button>          // brand red, 40px, 10px radius
<Button variant="outlined" size="small">Filter</Button>
<TextField label="Name" />                           // size="small" for dense forms/toolbars
<Chip label="A+" color="primary" size="small" />     // soft tinted badge
<Table size="small">…</Table>                        // uppercase muted header, row hover
```

Prefer theme values over hex codes so light/dark switching is automatic:
`color="text.secondary"`, `bgcolor="background.paper"`, `borderColor="divider"`,
`(t) => t.custom.shadow.sm`, `(t) => t.custom.tones.success.bg`.

## Components

```jsx
import { PageHeader, SectionCard, StatCard, StatusBadge, TableCard, EmptyState, ResponsiveGrid } from '@/components/ui';
```

| Component | Use for |
|---|---|
| `PageHeader` | Page title, subtitle, action buttons (stacks on phones) |
| `SectionCard` | Standard white card, optional ruled header |
| `StatCard` | KPI tile — `tone`: primary · success · warning · error · info · neutral |
| `StatusBadge` | Any status. Colour comes from `statusTone` in the tokens, so "Pending" is the same everywhere |
| `TableCard` | Card around a `<Table>` with header, toolbar and horizontal scroll on small screens |
| `EmptyState` | Empty lists / tables / search results |
| `ResponsiveGrid` | Auto-wrapping card grid. Use instead of MUI `<Grid>`, whose v7 API dropped `item`/`xs` |

## Scales

- **Spacing:** MUI's 8px unit. `1`=8 (tight) · `2`=16 (default gap) · `3`=24 (card padding, gap between cards) · `4`=32 (between sections).
- **Radius:** `theme.custom.radius` — `md` 10 (buttons, inputs) · `card` 14 · `dialog` 18 · `pill` (badges).
- **Type:** `h1`–`h6`, `subtitle1/2`, `body1/2`, `caption`, `overline`. Display sizes shrink below 900px.
- **Colour:** brand `#B91C2C` / dark `#8F1522`. Semantic: success `#16A34A`, warning `#F59E0B`, error `#DC2626`, info `#2563EB`.

## Notes

- **Brand buttons use `color="primary"` (default).** Existing pages use `color="error"` for
  brand actions; error is now a separate, brighter red, so migrate those as pages are touched.
- Sidebar colours live in `sidebar` (tokens) for the dashboard shells; they are not applied yet.
- Input height/label geometry is deliberately MUI's default — floating labels depend on it.
