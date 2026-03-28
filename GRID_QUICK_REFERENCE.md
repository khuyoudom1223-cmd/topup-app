# Grid System Quick Reference

## 🚀 One-Minute Setup

```html
<!-- Wrapper container -->
<div class="grid-container">
  <!-- Grid row -->
  <div class="row">
    <!-- Card column -->
    <div class="col">
      <div class="grid-card">
        <div class="grid-card-header">
          <div class="grid-card-icon">📱</div>
          <h3 class="grid-card-title">Title</h3>
        </div>
        <p class="grid-card-content">Content here...</p>
        <div class="grid-card-footer">
          <span class="grid-card-badge">Tag</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 📐 Grid Breakdown

```
Desktop (≥1024px)    Tablet (768-1023px)    Mobile (≤767px)
┌─────┬─────┐        ┌─────┬─────┐        ┌─────────────┐
│ 1   │ 2   │        │ 1   │ 2   │        │ 1           │
├─────┼─────┤        ├─────┴─────┤        ├─────────────┤
│ 3   │ 4   │        │ 3   │ 4   │        │ 2           │
└─────┴─────┘        └─────┴─────┘        ├─────────────┤
                                           │ 3           │
2 rows × 2 cols      2 rows × 2 cols      ├─────────────┤
Gap: 24px            Gap: 18px             │ 4           │
                                           └─────────────┘
                                           Gap: 12px
```

---

## 🎨 Card Anatomy

```
┌─────────────────────────────────┐
│  📱  ICON                        │
│                                 │
│  TITLE                          │
│  Subtitle                       │
├─────────────────────────────────┤
│  Card content description...    │
│  Multiple lines supported.      │
│                                 │
│  Flexible content area that     │
│  grows/shrinks as needed.       │
├─────────────────────────────────┤
│  STAT 1      STAT 2             │
│  Value 1     Value 2            │
├─────────────────────────────────┤
│  [Badge]  [Badge]               │
└─────────────────────────────────┘
```

---

## 📋 Class Reference

### Core Classes
```
.grid-container    Container with max-width & padding
.row              Grid wrapper (auto 4→2→1 columns)
.col              Grid column cell
.grid-card        Card container with flexbox

.col-1            Span 1 column
.col-2            Span 2 columns
.col-3            Span 3 columns
.col-4            Span 4 columns (full width)
```

### Card Component Classes
```
.grid-card-header     Icon, title, subtitle section
.grid-card-icon       56×56px icon with background
.grid-card-title      Main title (1.05rem)
.grid-card-subtitle   Supporting text (0.85rem)

.grid-card-content    Main content area (flexible)

.grid-card-stats      Stats comparison section
.stat                 Individual stat
.stat-value          Stat number (1.5rem, purple)
.stat-label          Stat text (0.75rem)

.grid-card-footer     Badge section
.grid-card-badge      Tag/label element
```

---

## 🎯 Responsive Breakpoints

```css
/* Desktop - 4 columns */
@media (min-width: 1024px) {
  .row { grid-template-columns: repeat(4, 1fr); gap: 24px; }
}

/* Tablet - 2 columns */
@media (max-width: 1023px) and (min-width: 768px) {
  .row { grid-template-columns: repeat(2, 1fr); gap: 18px; }
}

/* Mobile - 1 column */
@media (max-width: 767px) {
  .row { grid-template-columns: 1fr; gap: 12px; }
}

/* Extra small - 1 column, tight */
@media (max-width: 480px) {
  .row { grid-template-columns: 1fr; gap: 6px; }
}
```

---

## 🔢 Spacing Values

| Variable | Desktop | Tablet | Mobile | Extra Sm |
|----------|---------|--------|--------|----------|
| Gap | 24px | 18px | 12px | 6px |
| Padding | 24px | 18px | 12px | 12px |
| Card Pad | 24px | 24px | 12px | 12px |

---

## 🎨 Color Tokens

```css
--bg-card: rgba(17, 24, 39, 0.8);
--bg-card-hover: rgba(31, 41, 55, 0.9);
--border-color: rgba(255, 255, 255, 0.08);
--border-color-hover: rgba(255, 255, 255, 0.15);

--text-primary: #f9fafb;
--text-secondary: #9ca3af;
--text-muted: #6b7280;

--accent-primary: #8b5cf6;
--accent-secondary: #06b6d4;
```

---

## ⚡ Common Patterns

### 1. Full-Width Card (No Other Cards)
```html
<div class="row">
  <div class="col col-4">
    <div class="grid-card">...</div>
  </div>
</div>
```

### 2. Mixed Layout (Wide + Narrow)
```html
<div class="row">
  <div class="col col-2"><!-- Wide card --></div>
  <div class="col col-2"><!-- Wide card --></div>
  <div class="col col-1"><!-- Narrow card --></div>
  <div class="col col-1"><!-- Narrow card --></div>
</div>
```

### 3. Hero + Grid
```html
<div class="hero">Hero section</div>
<div class="grid-container">
  <h2 class="section-heading">Section Title</h2>
  <div class="row">
    <!-- Cards here -->
  </div>
</div>
```

### 4. Multiple Sections
```html
<div class="grid-container">
  <!-- Section 1 -->
  <div class="row"><!-- 4-8 cards --></div>
  
  <!-- Section 2 -->
  <div class="row"><!-- 4-8 cards --></div>
</div>
```

---

## 🎨 Hover Effects

Cards automatically have:
- Border color transition
- Background color change
- Shadow effect
- 4px upward translateY

```css
.grid-card:hover {
  border-color: var(--border-color-hover);
  background: var(--bg-card-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-4px);
}
```

---

## ✅ Quick Checklist

- [ ] Use `.grid-container` for outer wrapper
- [ ] Use `.row` for grid container
- [ ] Use `.col` for each column child
- [ ] Use `.grid-card` for card container
- [ ] Add card content using card component classes
- [ ] Test responsiveness at 1024px, 768px, 480px
- [ ] Verify equal card heights
- [ ] Check hover animations work

---

## 🐛 Common Issues & Fixes

### Cards Different Heights
**Fix:** Use `.grid-card { height: 100%; }`

### Text Overflowing
**Fix:** Add `word-break: break-word;` to text elements

### Columns Not Responsive
**Fix:** Verify media queries are in CSS (check browser DevTools)

### Gaps Not Showing
**Fix:** Ensure `.row` has gap property (check CSS)

### Cards Too Wide on Mobile
**Fix:** Verify container has padding or use margin

---

## 📞 Support Links

- Demo: `/grid-showcase`
- Docs: `GRID_SYSTEM_GUIDE.md`
- CSS: `src/index.css`
- Component: `src/pages/GridShowcasePage.jsx`

---

## 🚀 Ready to Use!

The grid system is fully integrated and ready to use in any page.

Just copy the HTML structure and customize with your content!
