'use client';

import { useTheme } from '../../ThemeContext';

export default function ThemeManager() {
  const { themes, currentTheme, setTheme } = useTheme();

  return (
    <div className="manager-container">
      <div className="manager-header">
        <h1>🎨 Themes</h1>
        <p className="manager-subtitle">Customize the look and feel of your fitness tracker</p>
      </div>

      <div className="themes-grid">
        {themes.map((theme) => {
          const isActive = currentTheme.id === theme.id;
          
          return (
            <button
              key={theme.id}
              className={`theme-card ${isActive ? 'active' : ''}`}
              onClick={() => setTheme(theme.id)}
            >
              <div className="theme-preview">
                <div 
                  className="theme-preview-bg"
                  style={{ background: theme.colors['bg-primary'] }}
                >
                  <div 
                    className="theme-preview-sidebar"
                    style={{ background: theme.colors['bg-secondary'] }}
                  >
                    <div 
                      className="theme-preview-nav-item"
                      style={{ background: theme.colors['bg-hover'] }}
                    />
                    <div 
                      className="theme-preview-nav-item active"
                      style={{ background: theme.colors['accent-primary'] }}
                    />
                    <div 
                      className="theme-preview-nav-item"
                      style={{ background: theme.colors['bg-hover'] }}
                    />
                  </div>
                  <div className="theme-preview-content">
                    <div 
                      className="theme-preview-card"
                      style={{ 
                        background: theme.colors['bg-card'],
                        borderColor: theme.colors['border-color']
                      }}
                    >
                      <div 
                        className="theme-preview-text"
                        style={{ background: theme.colors['text-primary'] }}
                      />
                      <div 
                        className="theme-preview-text short"
                        style={{ background: theme.colors['text-secondary'] }}
                      />
                    </div>
                    <div className="theme-preview-buttons">
                      <div 
                        className="theme-preview-btn"
                        style={{ background: theme.colors['accent-primary'] }}
                      />
                      <div 
                        className="theme-preview-btn"
                        style={{ background: theme.colors['accent-secondary'] }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="theme-info">
                <div className="theme-name-row">
                  <h3 className="theme-name">{theme.name}</h3>
                  {isActive && <span className="theme-active-badge">Active</span>}
                </div>
                <p className="theme-description">{theme.description}</p>
              </div>

              <div className="theme-colors-preview">
                <div 
                  className="color-dot" 
                  style={{ background: theme.colors['accent-primary'] }}
                  title="Primary accent"
                />
                <div 
                  className="color-dot" 
                  style={{ background: theme.colors['accent-secondary'] }}
                  title="Secondary accent"
                />
                <div 
                  className="color-dot" 
                  style={{ background: theme.colors['accent-success'] }}
                  title="Success"
                />
                <div 
                  className="color-dot" 
                  style={{ background: theme.colors['accent-warning'] }}
                  title="Warning"
                />
                <div 
                  className="color-dot" 
                  style={{ background: theme.colors['accent-danger'] }}
                  title="Danger"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
