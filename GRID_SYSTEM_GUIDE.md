# Responsive Grid Layout System

A fully responsive, mobile-first grid system using CSS Grid technology. Automatically adapts from **1 column on mobile** to **4 columns on desktop**.

## 📋 Quick Start

Visit `/grid-showcase` to see the responsive grid in action!

## 🎯 Features

✅ **Mobile-First Design** - Optimized for small screens first, then enhanced for larger screens  
✅ **4 Responsive Breakpoints** - lg (1024px), md (768px), sm (767px), xs (480px)  
✅ **Equal Height Cards** - All cards maintain consistent height regardless of content  
✅ **No Overflow** - Content smoothly resizes across all devices  
✅ **Smart Spacing** - Gap and padding automatically adjust per breakpoint  
✅ **Clean UI Components** - Pre-styled cards with headers, content, stats, and footers  
✅ **Smooth Animations** - Hover effects and transitions for better UX  
✅ **Dark Theme** - Modern dark design with accent colors

---

## 📐 Breakpoints & Columns

| Breakpoint | Screen Size | Columns | Gap | Use Case |
|-----------|------------|---------|-----|----------|
| **lg** | ≥ 1024px | 4 | 24px | Desktop |
| **md** | 768-1023px | 2 | 18px | Tablet |
| **sm** | ≤ 767px | 1 | 12px | Mobile |
| **xs** | ≤ 480px | 1 | 6px | Extra Small |

---

## 🏗️ Basic HTML Structure

```html
<!-- Container wrapper -->
<div class="grid-container">
  <!-- Row (grid wrapper) -->
  <div class="row">
    <!-- Column 1 -->
    <div class="col">
      <div class="grid-card">
        <!-- Card content -->
      </div>
    </div>
    
    <!-- Column 2 -->
    <div class="col">
      <div class="grid-card">
        <!-- Card content -->
      </div>
    </div>
    
    <!-- Add up to 8+ cards for responsive layout -->
  </div>
</div>
```

---

## 🎨 Card Components

### 1. Grid Card (Main Container)

The `.grid-card` is the main container for content.

```html
<div class="grid-card">
  <!-- Content goes here -->
</div>
```

**Features:**
- Equal height flexbox layout
- Smooth hover animations
- Responsive padding (24px desktop, 12px mobile)
- Glass morphism effect with backdrop blur

---

### 2. Card Header Section

```html
<div class="grid-card-header">
  <!-- Icon (optional) -->
  <div class="grid-card-icon">📱</div>
  
  <!-- Title -->
  <h3 class="grid-card-title">Card Title</h3>
  
  <!-- Subtitle (optional) -->
  <p class="grid-card-subtitle">Subtitle text</p>
</div>
```

**Styling:**
- Icon: 56px × 56px with purple background
- Title: 1.05rem, bold
- Subtitle: 0.85rem, muted color

---

### 3. Card Content Section

```html
<p class="grid-card-content">
  Your main content description goes here. 
  This text has flexible font sizing and proper line height.
</p>
```

**Features:**
- Flexible content height (grows/shrinks as needed)
- Proper spacing between sections
- Secondary text color

---

### 4. Card Stats Section (Optional)

Display statistics or metrics:

```html
<div class="grid-card-stats">
  <div class="stat">
    <div class="stat-value">100%</div>
    <div class="stat-label">Responsive</div>
  </div>
  
  <div class="stat">
    <div class="stat-value">4</div>
    <div class="stat-label">Breakpoints</div>
  </div>
</div>
```

**Styling:**
- Stats are centered with flex layout
- Values: 1.5rem, bold, purple color
- Labels: 0.75rem, uppercase, muted

---

### 5. Card Footer Section

```html
<div class="grid-card-footer">
  <span class="grid-card-badge">Badge Text</span>
  <span class="grid-card-badge">Another Badge</span>
</div>
```

**Features:**
- Flex layout with wrapping
- Multiple badges support
- Custom styling for labels

---

## 🔧 Complete Example

```jsx
import React from 'react';

export default function MyGridPage() {
  return (
    <div className="grid-container">
      <h2 className="section-heading">My Grid Layout</h2>
      
      <div className="row">
        <div className="col">
          <div className="grid-card">
            {/* Header */}
            <div className="grid-card-header">
              <div className="grid-card-icon">💻</div>
              <h3 className="grid-card-title">Web Development</h3>
              <p className="grid-card-subtitle">Frontend & Backend</p>
            </div>
            
            {/* Content */}
            <p className="grid-card-content">
              Build responsive web applications with modern technologies
              and best practices.
            </p>
            
            {/* Stats */}
            <div className="grid-card-stats">
              <div className="stat">
                <div className="stat-value">10+</div>
                <div className="stat-label">Projects</div>
              </div>
              <div className="stat">
                <div className="stat-value">5</div>
                <div className="stat-label">Years</div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="grid-card-footer">
              <span className="grid-card-badge">Popular</span>
            </div>
          </div>
        </div>
        
        {/* Repeat for more cards... */}
      </div>
    </div>
  );
}
```

---

## 🎯 Custom Column Spans

Control how many columns a card spans:

```html
<!-- Span 1 column -->
<div class="col col-1"></div>

<!-- Span 2 columns -->
<div class="col col-2"></div>

<!-- Span 3 columns -->
<div class="col col-3"></div>

<!-- Span 4 columns (full width) -->
<div class="col col-4"></div>
```

**Responsive Behavior:**
- **Desktop (lg):** Spans as specified (1-4)
- **Tablet (md):** Max 2 columns
- **Mobile (sm):** Always 1 column (full width)

---

## 📦 Available CSS Classes

### Container Classes
- `.grid-container` - Centered container with max-width (1200px)
- `.row-padded` - Row with padding and responsive gap

### Card Classes
- `.grid-card` - Main card container
- `.grid-card-header` - Header section (icon, title, subtitle)
- `.grid-card-icon` - Icon display (56×56px)
- `.grid-card-title` - Main title text
- `.grid-card-subtitle` - Supporting title text
- `.grid-card-content` - Main content area
- `.grid-card-stats` - Statistics section
- `.stat` - Individual stat item
- `.stat-value` - Stat number/value
- `.stat-label` - Stat label text
- `.grid-card-footer` - Footer section
- `.grid-card-badge` - Badge labels

### Text Classes
- `.section-heading` - Large section heading
- `.section-description` - Section subtitle text

---

## 📱 Responsive Behavior

### Desktop (≥ 1024px)
```css
.row {
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
```
- 4 cards per row
- Large 24px gap
- Full-size padding

### Tablet (768px - 1023px)
```css
.row {
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}
```
- 2 cards per row
- Medium 18px gap
- Adjusted padding

### Mobile (≤ 767px)
```css
.row {
  grid-template-columns: 1fr;
  gap: 12px;
}
```
- 1 card per row (full width)
- Compact 12px gap
- Reduced padding

### Extra Small (≤ 480px)
```css
.row {
  grid-template-columns: 1fr;
  gap: 6px;
}
```
- 1 card per row
- Minimal 6px gap
- Extra-tight spacing

---

## 🎨 Customization

### Change Grid Columns (lg breakpoint)

```css
.row {
  grid-template-columns: repeat(3, 1fr); /* Change from 4 to 3 */
}
```

### Change Gap Spacing

```css
.row {
  gap: 30px; /* Change from 24px to 30px */
}
```

### Modify Card Padding

```css
.grid-card {
  padding: 32px; /* Change from 24px to 32px */
}
```

### Change Card Styling

```css
.grid-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  /* Add custom styles */
}
```

---

## 🚀 Performance Tips

1. **Equal Height Cards** - Use flexbox wrapping for consistent layout
2. **No Overflow** - CSS Grid automatically prevents overflow
3. **Mobile-First** - Styles start mobile and enhance upward
4. **Smooth Animations** - Transitions use 250ms for optimal feel
5. **Touch-Friendly** - Min 44px touch targets on mobile

---

## 🎓 Example Pages Using This Grid

1. **Grid Showcase** - `/grid-showcase`
   - Full demonstration of all grid features
   - 8 card examples with different content types
   - Feature explanations and code examples

2. **Admin Dashboard** - `/admin`
   - Uses grid for stats cards
   - Product management with grid layout
   - Responsive table displays

3. **Top-Up Page** - `/topup/:gameSlug`
   - Package cards in grid layout
   - Payment methods showcase

---

## 📋 CSS Variables Used

```css
/* Spacing */
--space-xs: 4px;
--space-sm: 6px;
--space-md: 12px;
--space-lg: 18px;
--space-xl: 24px;

/* Radius */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;

/* Colors */
--bg-card: rgba(17, 24, 39, 0.8);
--border-color: rgba(255, 255, 255, 0.08);
--text-primary: #f9fafb;
--accent-primary: #8b5cf6;

/* Transitions */
--transition-normal: 250ms ease;
```

---

## ✅ Checklist for Using Grid

- [ ] Import grid CSS (included in `index.css`)
- [ ] Wrap cards in `.row` and `.col`
- [ ] Add `.grid-card` class to card containers
- [ ] Test on desktop, tablet, and mobile screens
- [ ] Verify equal height cards
- [ ] Check spacing and alignment
- [ ] Test hover animations
- [ ] Verify no overflow on small screens

---

## 🐛 Troubleshooting

### Cards Not Responsive
- Ensure `.row` and `.col` classes are applied
- Check browser DevTools to verify CSS Grid is active
- Verify viewport meta tag in HTML

### Unequal Card Heights
- Use `height: 100%` on `.grid-card`
- Ensure all cards have flex layout
- Check for min-height conflicts

### Content Overflow
- Use `overflow: hidden` on cards
- Apply `word-break: break-word` to text
- Ensure images have `max-width: 100%`

### Spacing Issues
- Verify gap values are using CSS variables
- Check responsive breakpoints are loading
- Test with DevTools device emulation

---

## 📚 Learn More

- CSS Grid Documentation: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout
- Responsive Web Design: https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design
- Mobile-First Approach: https://developer.mozilla.org/en-US/docs/Glossary/Mobile_first

---

## 📝 License

This grid system is part of the My React App project and is free to use and customize.
