/**
 * Sidebar — Main navigation with icons and active state highlighting.
 */

import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileSearch,
  Target,
  BarChart3,
  Map,
  BookOpen,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/resume', icon: FileSearch, label: 'Resume Analysis' },
  { path: '/ats', icon: Target, label: 'ATS Optimization' },
  { path: '/skills', icon: BarChart3, label: 'Skill Gap' },
  { path: '/roadmap', icon: Map, label: 'Career Roadmap' },
  { path: '/resources', icon: BookOpen, label: 'Resources' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <motion.div
          className="logo-icon"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles size={24} />
        </motion.div>
        <div className="logo-text">
          <span className="logo-title">PlacementPilot</span>
          <span className="logo-badge">
            <Zap size={10} /> AI
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item--active' : ''}`
            }
          >
            {({ isActive }) => (
              <motion.div
                className="nav-item-inner"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {isActive && (
                  <motion.div
                    className="nav-active-indicator"
                    layoutId="activeNav"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <item.icon size={18} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-version">v1.0.0</div>
      </div>
    </aside>
  );
}
