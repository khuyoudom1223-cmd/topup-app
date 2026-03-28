import React from 'react';
import './GridShowcasePage.css';

export default function GridShowcasePage() {
  const cardData = [
    {
      id: 1,
      icon: '💻',
      title: 'Responsive Design',
      subtitle: 'Mobile-first approach',
      description: 'Seamlessly adapts to any screen size with smart grid layouts.',
      badge: 'Featured',
      stats: [
        { value: '100%', label: 'Responsive' },
        { value: '4', label: 'Breakpoints' }
      ]
    },
    {
      id: 2,
      icon: '⚡',
      title: 'High Performance',
      subtitle: 'Lightning fast',
      description: 'Optimized CSS Grid for smooth animations and transitions.',
      badge: 'Pro',
      stats: [
        { value: '60fps', label: 'Smooth' },
        { value: '<100ms', label: 'Layout' }
      ]
    },
    {
      id: 3,
      icon: '🎨',
      title: 'Design System',
      subtitle: 'Consistent styling',
      description: 'Built-in design tokens for colors, spacing, and typography.',
      badge: 'Premium',
      stats: [
        { value: '500+', label: 'Tokens' },
        { value: '∞', label: 'Custom' }
      ]
    },
    {
      id: 4,
      icon: '🔧',
      title: 'Easy to Customize',
      subtitle: 'Fully flexible',
      description: 'Modify the grid layout and card styles to match your brand.',
      badge: 'Flexible',
      stats: [
        { value: '10+', label: 'Variants' },
        { value: '∞', label: 'Colors' }
      ]
    },
    {
      id: 5,
      icon: '📱',
      title: 'Mobile Optimized',
      subtitle: 'Touch-friendly',
      description: 'Perfect touch targets and gestures for mobile devices.',
      badge: 'Modern',
      stats: [
        { value: '44px', label: 'Min Target' },
        { value: '100%', label: 'Mobile' }
      ]
    },
    {
      id: 6,
      icon: '✨',
      title: 'Smooth Animation',
      subtitle: 'Delightful UX',
      description: 'Elegant hover effects and transitions for better user experience.',
      badge: 'Interactive',
      stats: [
        { value: '250ms', label: 'Duration' },
        { value: '4px', label: 'Lift' }
      ]
    },
    {
      id: 7,
      icon: '🎯',
      title: 'Accessibility First',
      subtitle: 'WCAG 2.1 AA',
      description: 'Semantic HTML and keyboard navigation for all users.',
      badge: 'Inclusive',
      stats: [
        { value: 'AA', label: 'Compliant' },
        { value: '100%', label: 'Keyboard' }
      ]
    },
    {
      id: 8,
      icon: '🚀',
      title: 'Production Ready',
      subtitle: 'Deploy anywhere',
      description: 'Thoroughly tested and ready for production environments.',
      badge: 'Stable',
      stats: [
        { value: '✓', label: 'Tested' },
        { value: '0', label: 'Bugs' }
      ]
    }
  ];

  return (
    <div className="grid-showcase-page">
      {/* Hero Section */}
      <div className="showcase-hero">
        <div className="hero-content">
          <h1 className="hero-title">Responsive Grid Layout System</h1>
          <p className="hero-subtitle">
            Mobile-first, fully responsive grid with CSS Grid technology.
            <br />
            Scales from 1 column on mobile to 4 columns on desktop.
          </p>
          <div className="hero-badges">
            <span className="hero-badge">4 Columns (Desktop)</span>
            <span className="hero-badge">2 Columns (Tablet)</span>
            <span className="hero-badge">1 Column (Mobile)</span>
          </div>
        </div>
      </div>

      {/* Grid Showcase */}
      <div className="grid-container">
        <div className="showcase-section">
          <h2 className="section-heading">Grid Cards Showcase</h2>
          <p className="section-description">
            Resize your browser to see the responsive grid in action
          </p>

          <div className="row">
            {cardData.map((card) => (
              <div key={card.id} className="col">
                <div className="grid-card" style={{ '--stagger-delay': `${card.id * 0.05}s` }}>
                  <div className="grid-card-header">
                    <div className="grid-card-icon">{card.icon}</div>
                    <h3 className="grid-card-title">{card.title}</h3>
                    <p className="grid-card-subtitle">{card.subtitle}</p>
                  </div>

                  <p className="grid-card-content">{card.description}</p>

                  <div className="grid-card-stats">
                    {card.stats.map((stat, idx) => (
                      <div key={idx} className="stat">
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid-card-footer">
                    <span className="grid-card-badge">{card.badge}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="grid-container">
          <h2 className="section-heading">Layout Features</h2>

          <div className="row">
            <div className="col">
              <div className="feature-box">
                <h3>🎯 Desktop (lg)</h3>
                <p>Display 4 columns in one row</p>
                <code className="code-snippet">grid-template-columns: repeat(4, 1fr)</code>
              </div>
            </div>

            <div className="col">
              <div className="feature-box">
                <h3>📱 Tablet (md)</h3>
                <p>Display 2 columns per row</p>
                <code className="code-snippet">grid-template-columns: repeat(2, 1fr)</code>
              </div>
            </div>

            <div className="col">
              <div className="feature-box">
                <h3>📲 Mobile (sm)</h3>
                <p>Display 1 column per row</p>
                <code className="code-snippet">grid-template-columns: 1fr</code>
              </div>
            </div>

            <div className="col">
              <div className="feature-box">
                <h3>✨ Extra Small (xs)</h3>
                <p>Optimized for compact phones</p>
                <code className="code-snippet">Tighter spacing & padding</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Example Section */}
      <div className="grid-container">
        <div className="code-section">
          <h2 className="section-heading">HTML Structure</h2>
          <div className="code-example">
            <pre>{`<div class="row">
  <div class="col">
    <div class="grid-card">
      <div class="grid-card-header">
        <div class="grid-card-icon">📱</div>
        <h3 class="grid-card-title">Card Title</h3>
        <p class="grid-card-subtitle">Subtitle</p>
      </div>

      <p class="grid-card-content">
        Card description content goes here...
      </p>

      <div class="grid-card-stats">
        <div class="stat">
          <div class="stat-value">100%</div>
          <div class="stat-label">Responsive</div>
        </div>
      </div>

      <div class="grid-card-footer">
        <span class="grid-card-badge">Badge</span>
      </div>
    </div>
  </div>
</div>`}</pre>
          </div>
        </div>
      </div>

      {/* Spacing & Breakpoints Info */}
      <div className="grid-container info-section">
        <h2 className="section-heading">Spacing & Breakpoints</h2>

        <div className="row">
          <div className="col col-2">
            <div className="info-box">
              <h3>📏 Gap Spacing</h3>
              <ul className="spacing-list">
                <li><strong>Desktop (lg):</strong> 24px gap</li>
                <li><strong>Tablet (md):</strong> 18px gap</li>
                <li><strong>Mobile (sm):</strong> 12px gap</li>
                <li><strong>Extra Small (xs):</strong> 6px gap</li>
              </ul>
            </div>
          </div>

          <div className="col col-2">
            <div className="info-box">
              <h3>🎬 Breakpoints</h3>
              <ul className="spacing-list">
                <li><strong>lg:</strong> ≥ 1024px</li>
                <li><strong>md:</strong> 768px - 1023px</li>
                <li><strong>sm:</strong> ≤ 767px</li>
                <li><strong>xs:</strong> ≤ 480px</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Features Highlight */}
      <div className="highlight-section">
        <div className="grid-container">
          <h2 className="section-heading">Key Features</h2>

          <div className="row">
            <div className="col">
              <div className="highlight-card">
                <h4>Equal Height Cards</h4>
                <p>All cards maintain the same height regardless of content length</p>
              </div>
            </div>

            <div className="col">
              <div className="highlight-card">
                <h4>No Overflow</h4>
                <p>Content scales smoothly across all devices without breaking layout</p>
              </div>
            </div>

            <div className="col">
              <div className="highlight-card">
                <h4>Mobile-First</h4>
                <p>Starts with mobile design and progressively enhances for larger screens</p>
              </div>
            </div>

            <div className="col">
              <div className="highlight-card">
                <h4>Dark Theme</h4>
                <p>Modern dark UI with smooth transitions and hover effects</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
