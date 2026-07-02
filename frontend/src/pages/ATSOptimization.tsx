/**
 * ATS Optimization Page — Compare resume against job descriptions.
 */

import { motion } from 'framer-motion';
import { Target, CheckCircle2, XCircle, Lightbulb, FileText } from 'lucide-react';
import ScoreRing from '../components/ScoreRing';
import { useAnalysisStore } from '../store/analysisStore';
import './ATSOptimization.css';

export default function ATSOptimization() {
  const { analysisResult } = useAnalysisStore();
  const career = analysisResult?.career_analysis;
  const ats = career?.ats_analysis;
  const jd = career?.jd_specific_analysis;

  const hasATS = !!career && !!ats;

  return (
    <div className="page-container">
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1><Target size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />ATS Optimization</h1>
        <p>Optimize your resume for Applicant Tracking Systems</p>
      </motion.div>

      {!hasATS ? (
        <motion.div className="empty-state glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Target size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>No ATS Analysis Available</h3>
          <p>Go to <strong>Resume Analysis</strong> to upload your resume and include a Job Description for ATS optimization.</p>
        </motion.div>
      ) : (
        <div className="ats-results">
          {/* Score Header */}
          <motion.div className="ats-score-header glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="ats-scores-row">
              <ScoreRing score={career.ats_score} label="ATS Score" color="var(--accent)" size={160} />
              {jd && <ScoreRing score={jd.jd_match_score} label="JD Match" color="var(--primary)" size={160} />}
            </div>
            <p className="ats-assessment">{career.overall_assessment}</p>
          </motion.div>

          <div className="grid-2">
            {/* Matched Keywords */}
            <motion.div className="glass-card ats-section" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <h3><CheckCircle2 size={18} style={{ color: 'var(--success)' }} /> Matched Keywords ({ats.matched_keywords?.length || 0})</h3>
              <div className="skill-tags">
                {ats.matched_keywords?.map((k, i) => (
                  <span key={i} className="badge badge-success">{k}</span>
                ))}
              </div>
            </motion.div>

            {/* Missing Keywords */}
            <motion.div className="glass-card ats-section" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <h3><XCircle size={18} style={{ color: 'var(--error)' }} /> Missing Keywords ({ats.missing_keywords?.length || 0})</h3>
              <div className="skill-tags">
                {ats.missing_keywords?.map((k, i) => (
                  <span key={i} className="badge badge-error">{k}</span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Keyword Suggestions */}
          <motion.div className="glass-card ats-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h3><Lightbulb size={18} style={{ color: 'var(--warning)' }} /> Keyword Suggestions</h3>
            <div className="suggestion-list">
              {ats.keyword_suggestions?.map((s, i) => (
                <div key={i} className="suggestion-item">
                  <span className="suggestion-bullet">→</span>
                  {s}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Section Improvements */}
          {ats.section_improvements?.length > 0 && (
            <motion.div className="glass-card ats-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <h3><FileText size={18} /> Section Improvements</h3>
              <div className="improvements-list">
                {ats.section_improvements.map((imp, i) => (
                  <div key={i} className="improvement-item">
                    <span className="improvement-section">{imp.section}</span>
                    <p>{imp.suggestion}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* JD-Specific Analysis */}
          {jd && (
            <div className="grid-2">
              <motion.div className="glass-card ats-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                <h3><CheckCircle2 size={18} style={{ color: 'var(--success)' }} /> JD Matched</h3>
                <div className="skill-tags">
                  {jd.jd_matched_keywords?.map((k, i) => (
                    <span key={i} className="badge badge-success">{k}</span>
                  ))}
                </div>
              </motion.div>
              <motion.div className="glass-card ats-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                <h3><XCircle size={18} style={{ color: 'var(--error)' }} /> JD Missing</h3>
                <div className="skill-tags">
                  {jd.jd_missing_keywords?.map((k, i) => (
                    <span key={i} className="badge badge-error">{k}</span>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
