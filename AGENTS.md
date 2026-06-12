<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Design System

**Tailwind version:** v4. No `tailwind.config.*` file exists. Tailwind is loaded via `@import "tailwindcss"` in `app/globals.css`. There is no `@theme` block. All design tokens are `:root` CSS custom properties in `globals.css`. Do not create a `tailwind.config.*` file.

**JS token file:** `lib/config/design-tokens.ts` exports `TOKENS` — a `const` object with hex values for use in Recharts SVG attributes and Satori OG images (contexts that cannot read CSS vars). Keep in sync with `globals.css` manually. Do NOT use `TOKENS` in JSX classNames.

### CSS Custom Properties (`app/globals.css` `:root`)

**Brand — deep forest teal:**
```
--teal:       #0D6E78
--teal-dark:  #0A5860
--teal-light: #E3F4F6
--teal-mid:   #B2DDE2
--teal-wash:  #f0fafb
```

**Accent — warm terracotta (all primary CTAs):**
```
--accent:       #B8502A    (WCAG AA 4.5:1 on white)
--accent-dark:  #9E4220
--accent-light: #FEF0E8
```

**Text:**
```
--ink:   #1C1917
--ink2:  #44403C
--muted: #78716C
--faint: #C4BBB3
```

**Backgrounds:**
```
--off:          #FAF8F5
--light:        #F0EBE3
--card:         #FFFFFF
--border:       #E8E2D9
--border-hover: #d4cdc5
--off-bg:       var(--off)    (legacy alias)
```

**State colors:**
```
--green:         #16A34A    --green-bg:     #DCFCE7    --green-text:   #166534    --green-border: #bbf7d0
--warn:          #D97706    --warn-bg:      #FEF3C7    --warn-text:    #92400E    --warn-border:  #fde68a
--danger:        #DC2626    --danger-bg:    #FEE2E2    --danger-text:  #991B1B    --danger-dark:  #B91C1C    --danger-border: #fca5a5
```

**Role badges:**
```
--role-vet-bg: #EFF6FF    --role-vet:    #1D4ED8
--role-sitter-bg: #FFFBEB --role-sitter: #92400E
--role-admin-bg: #F3E8FF  --role-admin:  #6B21A8
```

**Additional palettes:**
```
--secondary: #EC4899    --secondary-dark: #BE185D    --secondary-bg: #FDF2F8
--info:      #2563EB    --info-bg:        #EFF6FF
--twin:      #7C3AED    --twin-bg:        #EDE9FE
--warm-bg:   #FFFBEB    --warm-text:      #B45309
--star:      #FBBF24
```

**Shadows:**
```
--shadow-sm        --shadow-md        --shadow-lg
--brand-shadow     --secondary-shadow --cta-shadow    --tooltip-shadow
```

### Semantic CSS Classes (defined in `globals.css` — use these, not arbitrary Tailwind values)

| Class | Purpose |
|-------|---------|
| `.card` | White card, `--border`, 16px radius, `--shadow-sm` |
| `.card-hover` | Hover: `--shadow-md` + `--border-hover` |
| `.btn-primary` | Terracotta fill, white text, 10px radius |
| `.btn-outline` | Transparent, `--ink2` text, border |
| `.btn-ghost` | Transparent, `--muted` text |
| `.btn-on-teal` | White fill for use on teal backgrounds |
| `.btn-on-teal-ghost` | White/10 fill for use on teal backgrounds |
| `.form-input` | Styled input with teal focus ring |
| `.signal-healthy` | `--green-bg` / `--green-text` pill badge |
| `.signal-watch` | `--warn-bg` / `--warn-text` pill badge |
| `.signal-concern` | `--danger-bg` / `--danger-text` pill badge |
| `.alert-error` | Error box |
| `.alert-success` | Success box |
| `.nav-link` | Base nav link |
| `.nav-link-active` | Active nav state |
| `.nav-link-inactive` | Default nav state |
| `.eyebrow-badge` | Teal pill for hero eyebrow labels |
| `.section-inner` | Max-width 1100px container |
| `.prose-legal` | Legal/terms long-form content styles |

### Typography

System font stack via `--font-sans`: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif.

### RTL Support

Arabic only. `dir="rtl"` injected by `app/[locale]/layout.tsx`. Use logical Tailwind props: `ms-*`, `me-*`, `ps-*`, `pe-*`. Never `ml-*`, `mr-*`, `pl-*`, `pr-*`. Use `.flip-rtl` for icons needing mirror.

### SSOT Rule

All design tokens live in `app/globals.css` only. Tailwind config MUST reference CSS vars (`'var(--name)'`), never literal values. Components MUST use semantic Tailwind classes, never arbitrary values like `bg-[#hex]`.

**Violations to fix when touching UI:**
- `bg-[#hex]` / `text-[#hex]` in className → CSS var + semantic class
- `style={{ color: '#hex' }}` → CSS var + className
- Literal hex in tailwind.config → `'var(--color-name)'`
- Same token defined in 2+ files → consolidate to globals.css

**Audit:** `grep -r '\[#' src/` — every result is a violation.
