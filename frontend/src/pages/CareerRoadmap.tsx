/**
 * Career Roadmap Page — Timeline view of preparation plan.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Map, Calendar, Target, CheckSquare, Clock, FolderKanban, Sparkles } from 'lucide-react';
import { useAnalysisStore } from '../store/analysisStore';
import './CareerRoadmap.css';

export default function CareerRoadmap() {
  const { analysisResult } = useAnalysisStore();
  const coaching = analysisResult?.coaching_plan;
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0);

  const hasData = !!coaching?.roadmap;

  return (
    <div className="page-container">
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1><Map size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Career Roadmap</h1>
        <p>Your personalized week-by-week preparation plan</p>
      </motion.div>

      {!hasData ? (
        <div className="empty-state glass-card">
          <Map size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>No Roadmap Available</h3>
          <p>Analyze your resume first to generate a personalized career roadmap.</p>
        </div>
      ) : (
        <div className="roadmap-content">
          {/* Overview */}
          <motion.div className="roadmap-overview glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="overview-stats">
              <div className="overview-stat">
                <Calendar size={20} style={{ color: 'var(--primary)' }} />
                <div>
                  <span className="overview-value">{coaching.roadmap.total_weeks}</span>
                  <span className="overview-label">Weeks Total</span>
                </div>
              </div>
              <div className="overview-stat">
                <Target size={20} style={{ color: 'var(--accent)' }} />
                <div>
                  <span className="overview-value">{coaching.roadmap.phases?.length || 0}</span>
                  <span className="overview-label">Phases</span>
                </div>
              </div>
              <div className="overview-stat">
                <FolderKanban size={20} style={{ color: 'var(--success)' }} />
                <div>
                  <span className="overview-value">{coaching.suggested_projects?.length || 0}</span>
                  <span className="overview-label">Projects</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Phases Timeline */}
          <div className="roadmap-timeline">
            {coaching.roadmap.phases?.map((phase, pi) => (
              <motion.div
                key={pi}
                className={`phase-card glass-card ${expandedPhase === pi ? 'phase-card--expanded' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + pi * 0.1 }}
              >
                <div className="phase-header" onClick={() => setExpandedPhase(expandedPhase === pi ? null : pi)}>
                  <div className="phase-number">Phase {phase.phase_number}</div>
                  <div className="phase-info">
                    <h3>{phase.phase_name}</h3>
                    <p>{phase.focus_area}</p>
                  </div>
                  <span className="badge badge-primary">
                    <Clock size={12} /> {phase.duration_weeks} weeks
                  </span>
                </div>

                {expandedPhase === pi && (
                  <motion.div
                    className="phase-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {phase.weekly_goals?.map((week, wi) => (
                      <div key={wi} className="week-card">
                        <div className="week-header">
                          <span className="week-number">Week {week.week}</span>
                          <h4>{week.title}</h4>
                        </div>
                        <div className="week-objectives">
                          {week.objectives?.map((obj, oi) => (
                            <div key={oi} className="objective-item">
                              <CheckSquare size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                              <span>{obj}</span>
                            </div>
                          ))}
                        </div>
                        {week.daily_tasks?.length > 0 && (
                          <div className="daily-tasks">
                            {week.daily_tasks.map((task, ti) => (
                              <div key={ti} className="daily-task">
                                <span className="task-day">{task.day}</span>
                                <span className="task-desc">{task.task}</span>
                                <span className="task-hours">{task.hours}h</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="week-milestone">
                          <Sparkles size={14} /> <strong>Milestone:</strong> {week.milestone}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Suggested Projects */}
          {coaching.suggested_projects?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <h2 style={{ marginBottom: 16 }}><FolderKanban size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Suggested Projects</h2>
              <div className="projects-list">
                {coaching.suggested_projects.map((proj, i) => (
                  <div key={i} className="glass-card project-detail-card">
                    <div className="project-detail-header">
                      <h4>{proj.title}</h4>
                      <div className="project-meta">
                        <span className="badge badge-primary">{proj.difficulty}</span>
                        <span className="badge badge-accent"><Clock size={10} /> {proj.estimated_hours}h</span>
                      </div>
                    </div>
                    <p className="project-desc">{proj.description}</p>
                    <div className="skill-tags" style={{ marginTop: 10 }}>
                      {proj.skills_developed?.map((s, j) => (
                        <span key={j} className="badge badge-primary">{s}</span>
                      ))}
                    </div>
                    {proj.steps?.length > 0 && (
                      <div className="project-steps">
                        {proj.steps.map((step, si) => (
                          <div key={si} className="project-step">
                            <span className="step-num">{si + 1}</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="project-portfolio"><Sparkles size={12} /> Portfolio Value: {proj.portfolio_value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Final Recommendations */}
          {coaching.final_recommendations && (
            <motion.div className="glass-card final-recs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <h3><Sparkles size={18} /> Final Recommendations</h3>
              <div className="recs-grid">
                <div className="rec-block">
                  <h4>Top Priorities</h4>
                  <ul>{coaching.final_recommendations.top_priorities?.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>
                <div className="rec-block">
                  <h4>Quick Wins</h4>
                  <ul>{coaching.final_recommendations.quick_wins?.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>
                <div className="rec-block">
                  <h4>Long-Term Goals</h4>
                  <ul>{coaching.final_recommendations.long_term_goals?.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>
              </div>
              {coaching.final_recommendations.motivation && (
                <div className="motivation-box">
                  <p>💪 {coaching.final_recommendations.motivation}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
