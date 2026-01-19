'use client';

import { useState } from 'react';

export type View = 'daily' | 'foods' | 'meals' | 'exercises' | 'movement-patterns' | 'workouts' | 'cups' | 'supplements' | 'compounds' | 'stats' | 'mesocycle' | 'supplement-cycle' | 'weight' | 'comparison-tool' | 'themes';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

interface NavItem {
  view: View;
  label: string;
  icon: string;
}

interface DropdownNavItem {
  label: string;
  icon: string;
  children: NavItem[];
}

type NavEntry = NavItem | DropdownNavItem;

const isDropdown = (item: NavEntry): item is DropdownNavItem => {
  return 'children' in item;
};

const navItems: NavEntry[] = [
  { view: 'daily', label: 'Daily Log', icon: '📅' },
  { view: 'weight', label: 'Weight', icon: '⚖️' },
  { view: 'foods', label: 'Foods', icon: '🥕' },
  { view: 'meals', label: 'Meals', icon: '🥗' },

  { view: 'exercises', label: 'Exercises', icon: '💪' },
  { view: 'workouts', label: 'Workouts', icon: '🏆' },
  { view: 'movement-patterns', label: 'Movement Patterns', icon: '🌀' },
  { view: 'mesocycle', label: 'Mesocycles', icon: '📆' },

  { view: 'cups', label: 'Cups', icon: '🥤' },
  { view: 'compounds', label: 'Compounds', icon: '🧬' },

  { view: 'supplements', label: 'Supplements', icon: '⚡' },
  { view: 'supplement-cycle', label: 'Supplement Cycle', icon: '🔁' },
  { view: 'comparison-tool', label: 'Comparison Tool', icon: '📸' },

  { view: 'stats', label: 'Stats', icon: '📊' },
  { view: 'themes', label: 'Themes', icon: '🎨' },
];

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const isChildActive = (item: DropdownNavItem) => {
    return item.children.some(child => child.view === currentView);
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <h2 className="sidebar-title">Fitness Tracker</h2>}
        <button 
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          if (isDropdown(item)) {
            return (
              <div 
                key={item.label} 
                className={`sidebar-dropdown ${isChildActive(item) ? 'active' : ''}`}
              >
                <div 
                  className={`sidebar-nav-item sidebar-dropdown-trigger ${isChildActive(item) ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="nav-label">{item.label}</span>
                      <span className="dropdown-arrow">▾</span>
                    </>
                  )}
                </div>
                <div className="sidebar-dropdown-menu">
                  {item.children.map((child) => (
                    <button
                      key={child.view}
                      className={`sidebar-dropdown-item ${currentView === child.view ? 'active' : ''}`}
                      onClick={() => onViewChange(child.view)}
                    >
                      <span className="nav-icon">{child.icon}</span>
                      <span className="nav-label">{child.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          }
          
          return (
            <button
              key={item.view}
              className={`sidebar-nav-item ${currentView === item.view ? 'active' : ''}`}
              onClick={() => onViewChange(item.view)}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <p className="sidebar-hint">Built by: _Nich</p>
        )}
      </div>
    </aside>
  );
}

