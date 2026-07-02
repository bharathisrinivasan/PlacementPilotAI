/**
 * Dashboard Page — Overview of analysis results and quick actions.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Target, FileSearch, BarChart3, Map,
  TrendingUp, Award, AlertTriangle, ArrowRight,
  Sparkles, Zap, CheckCircle2,
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer,
} from 'recharts';
import ScoreRing from '../components/ScoreRing';
import StatsCard from '../components/StatsCard';
import { useAnalysisStore } from '../store/analysisStore';
import { getRoles } from '../services/api';
import './Dashboard.css';

const quickActions = [
  { to: '/resume', icon: FileSearch, label: 'Analyze Resume', desc: 'Upload your resume for AI analysis', color: 'var(--primary)' },
  { to: '/ats', icon: Target, label: 'ATS Optimizer', desc: 'Optimize for job descriptions', color: 'var(--accent)' },
  { to: '/skills', icon: BarChart3, label: 'Skill Gap', desc: 'Identify missing skills', color: 'var(--warning)' },
  { to: '/roadmap', icon: Map, label: 'Career Roadmap', desc: 'Get your preparation plan', color: 'var(--success)' },
];

export default function Dashboard() {
  const { analysisResult, roles, setRoles, selectedRole } = useAnalysisStore();
  const [, setLoading] = useState(true);

  const profile = analysisResult?.profile_data;
  const career = analysisResult?.career_analysis;

  useEffect(() => {
    getRoles()
      .then((data) => setRoles(data.roles))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [setRoles]);

  // Build radar chart data from skills
  const radarData = career
    ? [
        { skill: 'Must-Have', value: career.matching_skills.must_have.length * 10, max: 100 },
        { skill: 'Good-to-Have', value: career.matching_skills.good_to_have.length * 10, max: 100 },
        { skill: 'ATS Score', value: career.ats_score, max: 100 },
        { skill: 'Readiness', value: career.placement_readiness_score, max: 100 },
        { skill: 'Projects', value: profile?.projects?.length ? Math.min(profile.projects.length * 25, 100) : 0, max: 100 },
        { skill: 'Certifications', value: profile?.certifications?.length ? Math.min(profile.certifications.length * 30, 100) : 0, max: 100 },
      ]
    : [];

  const hasResults = !!analysisResult && analysisResult.status === 'success';

  return (
    <div className="page-container">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>
          <Sparkles size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Dashboard
        </h1>
        <p>Your placement preparation at a glance</p>
      </motion.div>

      {!hasResults ? (
        /* ── Empty State ── */
        <motion.div
          className="dashboard-empty"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="dashboard-empty-content glass-card">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Zap size={56} className="dashboard-empty-icon" />
            </motion.div>
            <h2>Welcome to PlacementPilot AI</h2>
            <p>Upload your resume to get started with AI-powered placement preparation</p>
            <Link to="/resume" className="btn btn-primary" style={{ marginTop: 16, fontSize: '1rem', padding: '12px 28px' }}>
              <FileSearch size={18} />
              Analyze Your Resume
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid-4" style={{ marginTop: 24 }}>
            {quickActions.map((action, i) => (
              <Link key={action.to} to={action.to} style={{ textDecoration: 'none' }}>
                <motion.div
                  className="quick-action-card glass-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                >
                  <div className="quick-action-icon" style={{ background: `${action.color}20`, color: action.color }}>
                    <action.icon size={22} />
                  </div>
                  <h4>{action.label}</h4>
                  <p>{action.desc}</p>
                </motion.div>
              </Link>
            ))}
          </div>

          {roles.length > 0 && (
            <motion.div
              className="dashboard-roles glass-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h3><Award size={18} /> Available Roles ({roles.length})</h3>
              <div className="roles-grid">
                {roles.map((role) => (
                  <div key={role.id} className="role-chip">
                    <span>{role.title}</span>
                    <span className={`badge badge-${role.difficulty === 'Hard' || role.difficulty === 'Very Hard' ? 'warning' : 'primary'}`}>
                      {role.difficulty}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      ) : (
        /* ── Results State ── */
        <div className="dashboard-results">
          {/* Score Cards Row */}
          <div className="grid-4">
            <StatsCard icon={TrendingUp} label="Readiness" value={`${career?.placement_readiness_score || 0}%`} subtext="Placement score" color="var(--primary)" delay={0.1} />
            <StatsCard icon={Target} label="ATS Score" value={`${career?.ats_score || 0}%`} subtext="Keyword match" color="var(--accent)" delay={0.2} />
            <StatsCard icon={Award} label="Target Role" value={career?.target_role || selectedRole} color="var(--success)" delay={0.3} />
            <StatsCard icon={AlertTriangle} label="Skill Gaps" value={career?.missing_skills?.must_have?.length || 0} subtext="Must-have missing" color="var(--warning)" delay={0.4} />
          </div>

          {/* Score Rings + Radar */}
          <div className="dashboard-scores-row">
            <motion.div
              className="score-rings-container glass-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3>Your Scores</h3>
              <div className="score-rings-grid">
                <ScoreRing score={career?.placement_readiness_score || 0} label="Readiness" />
                <ScoreRing score={career?.ats_score || 0} label="ATS Score" color="var(--accent)" />
              </div>
            </motion.div>

            {radarData.length > 0 && (
              <motion.div
                className="radar-container glass-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3>Skill Radar</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      dataKey="value"
                      stroke="var(--primary)"
                      fill="var(--primary)"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </div>

          {/* Strengths & Gaps */}
          <div className="grid-2">
            <motion.div
              className="glass-card dashboard-list-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3><CheckCircle2 size={18} style={{ color: 'var(--success)' }} /> Strengths</h3>
              <ul>
                {career?.strengths?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="glass-card dashboard-list-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h3><AlertTriangle size={18} style={{ color: 'var(--warning)' }} /> Areas to Improve</h3>
              <ul>
                {career?.areas_for_improvement?.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Quick Navigation */}
          <div className="grid-4" style={{ marginTop: 8 }}>
            {quickActions.map((action, i) => (
              <Link key={action.to} to={action.to} style={{ textDecoration: 'none' }}>
                <motion.div
                  className="quick-action-card glass-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="quick-action-icon" style={{ background: `${action.color}20`, color: action.color }}>
                    <action.icon size={22} />
                  </div>
                  <h4>{action.label}</h4>
                  <p>{action.desc}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
