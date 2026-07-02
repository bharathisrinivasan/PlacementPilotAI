/**
 * Skill Gap Page — Visualize skill strengths and gaps.
 */

import { motion } from 'framer-motion';
import { BarChart3, CheckCircle2, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAnalysisStore } from '../store/analysisStore';
import './SkillGap.css';

export default function SkillGap() {
  const { analysisResult } = useAnalysisStore();
  const career = analysisResult?.career_analysis;

  const hasData = !!career;

  const importanceColor = (imp: string) => {
    if (imp === 'Critical') return 'var(--error)';
    if (imp === 'High') return 'var(--warning)';
    return 'var(--primary)';
  };

  // Build chart data
  const chartData = career ? [
    { name: 'Must-Have Match', value: career.matching_skills.must_have.length, color: '#10B981' },
    { name: 'Must-Have Missing', value: career.missing_skills.must_have.length, color: '#EF4444' },
    { name: 'Good-to-Have Match', value: career.matching_skills.good_to_have.length, color: '#22D3EE' },
    { name: 'Good-to-Have Missing', value: career.missing_skills.good_to_have.length, color: '#F59E0B' },
  ] : [];

  return (
    <div className="page-container">
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1><BarChart3 size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Skill Gap Analysis</h1>
        <p>Identify your strengths and areas that need improvement</p>
      </motion.div>

      {!hasData ? (
        <div className="empty-state glass-card">
          <BarChart3 size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>No Skill Analysis Available</h3>
          <p>Analyze your resume first to see skill gap insights.</p>
        </div>
      ) : (
        <div className="skill-gap-results">
          {/* Chart */}
          <motion.div className="glass-card skill-chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3><TrendingUp size={18} /> Skill Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} barSize={40}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                  cursor={{ fill: 'rgba(99,102,241,0.08)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <div className="grid-2">
            {/* Matching Must-Have */}
            <motion.div className="glass-card skill-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <h3><CheckCircle2 size={18} style={{ color: 'var(--success)' }} /> Strong Skills (Must-Have)</h3>
              <div className="skill-tags">
                {career.matching_skills.must_have.map((s, i) => (
                  <span key={i} className="badge badge-success">{s}</span>
                ))}
              </div>
            </motion.div>

            {/* Matching Good-to-Have */}
            <motion.div className="glass-card skill-section" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <h3><CheckCircle2 size={18} style={{ color: 'var(--accent)' }} /> Strong Skills (Good-to-Have)</h3>
              <div className="skill-tags">
                {career.matching_skills.good_to_have.map((s, i) => (
                  <span key={i} className="badge badge-accent">{s}</span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Missing Must-Have (Priority) */}
          <motion.div className="glass-card skill-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h3><XCircle size={18} style={{ color: 'var(--error)' }} /> Missing Must-Have Skills</h3>
            <div className="missing-skills-list">
              {career.missing_skills.must_have.map((s, i) => (
                <motion.div
                  key={i}
                  className="missing-skill-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                >
                  <div className="missing-skill-header">
                    <span className="missing-skill-name">{s.skill}</span>
                    <span className="badge" style={{ background: `${importanceColor(s.importance)}20`, color: importanceColor(s.importance), border: `1px solid ${importanceColor(s.importance)}40` }}>
                      {s.importance}
                    </span>
                  </div>
                  <p className="missing-skill-reason">{s.reason}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Missing Good-to-Have */}
          {career.missing_skills.good_to_have.length > 0 && (
            <motion.div className="glass-card skill-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <h3><AlertTriangle size={18} style={{ color: 'var(--warning)' }} /> Missing Good-to-Have Skills</h3>
              <div className="missing-skills-list">
                {career.missing_skills.good_to_have.map((s, i) => (
                  <div key={i} className="missing-skill-card missing-skill-card--secondary">
                    <div className="missing-skill-header">
                      <span className="missing-skill-name">{s.skill}</span>
                      <span className="badge badge-warning">{s.importance}</span>
                    </div>
                    <p className="missing-skill-reason">{s.reason}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
