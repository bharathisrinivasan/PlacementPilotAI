/**
 * StatsCard — Dashboard stat card with glassmorphism and icon.
 */

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import './StatsCard.css';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
  delay?: number;
}

export default function StatsCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = 'var(--primary)',
  delay = 0,
}: StatsCardProps) {
  return (
    <motion.div
      className="stats-card glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="stats-card-icon" style={{ background: `${color}20`, color }}>
        <Icon size={20} />
      </div>
      <div className="stats-card-info">
        <span className="stats-card-label">{label}</span>
        <span className="stats-card-value">{value}</span>
        {subtext && <span className="stats-card-subtext">{subtext}</span>}
      </div>
    </motion.div>
  );
}
