/**
 * Resume Analysis Page — Upload and analyze resumes.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSearch, Brain, Code, GraduationCap, Award,
  Briefcase, FolderKanban, AlertTriangle, Send, ClipboardPaste,
} from 'lucide-react';
import FileUpload from '../components/FileUpload';
import LoadingOverlay from '../components/LoadingOverlay';
import { useAnalysisStore } from '../store/analysisStore';
import { analyzeResume, analyzeResumeText, getRoles } from '../services/api';
import './ResumeAnalysis.css';

export default function ResumeAnalysis() {
  const {
    selectedRole, setSelectedRole,
    analysisResult, setAnalysisResult,
    analysisStep, setAnalysisStep,
    roles, setRoles,
    setError, error,
    resumeText, setResumeText,
    jobDescription, setJobDescription,
  } = useAnalysisStore();

  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');

  useEffect(() => {
    if (roles.length === 0) {
      getRoles().then((d) => setRoles(d.roles)).catch(() => {});
    }
  }, [roles.length, setRoles]);

  const handleAnalyze = async () => {
    if (!selectedRole) {
      setError('Please select a target role');
      return;
    }
    if (mode === 'upload' && !file) {
      setError('Please upload a resume PDF');
      return;
    }
    if (mode === 'paste' && !resumeText.trim()) {
      setError('Please paste your resume text');
      return;
    }

    setError(null);
    setAnalysisStep('uploading');

    // The backend runs a 3-agent pipeline in a single API call (~30-90s).
    // Auto-advance the loading overlay through each stage to match the pipeline:
    //   uploading (0s) → parsing (2s) → analyzing (12s) → coaching (30s)
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setAnalysisStep('parsing'),   2000));
    timers.push(setTimeout(() => setAnalysisStep('analyzing'), 12000));
    timers.push(setTimeout(() => setAnalysisStep('coaching'),  30000));

    const clearTimers = () => timers.forEach(clearTimeout);

    try {
      let result;
      if (mode === 'upload' && file) {
        result = await analyzeResume(file, selectedRole, jobDescription);
      } else {
        result = await analyzeResumeText(resumeText, selectedRole, jobDescription);
      }
      clearTimers();
      setAnalysisResult(result);
    } catch (err: any) {
      clearTimers();
      setError(err.message || 'Analysis failed. Please try again.');
    }
  };

  const profile = analysisResult?.profile_data;
  const hasResults = analysisResult?.status === 'success' && profile;

  return (
    <div className="page-container">
      <AnimatePresence>
        {analysisStep !== 'idle' && analysisStep !== 'complete' && analysisStep !== 'error' && (
          <LoadingOverlay step={analysisStep} />
        )}
      </AnimatePresence>

      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1><FileSearch size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Resume Analysis</h1>
        <p>Upload your resume and let AI extract your professional profile</p>
      </motion.div>

      {/* Input Section */}
      <motion.div className="resume-input-section glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button className={`mode-btn ${mode === 'upload' ? 'mode-btn--active' : ''}`} onClick={() => setMode('upload')}>
            <FileSearch size={16} /> Upload PDF
          </button>
          <button className={`mode-btn ${mode === 'paste' ? 'mode-btn--active' : ''}`} onClick={() => setMode('paste')}>
            <ClipboardPaste size={16} /> Paste Text
          </button>
        </div>

        <div className="resume-input-grid">
          <div className="resume-input-left">
            {mode === 'upload' ? (
              <FileUpload onFileSelect={setFile} />
            ) : (
              <textarea
                className="input resume-textarea"
                placeholder="Paste your resume text here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={12}
              />
            )}
          </div>
          <div className="resume-input-right">
            <label className="input-label">Target Role *</label>
            <select className="input" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
              <option value="">Select a role...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>

            <label className="input-label" style={{ marginTop: 16 }}>Job Description (Optional)</label>
            <textarea
              className="input"
              placeholder="Paste a specific job description for ATS matching..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={5}
            />

            <button
              className="btn btn-primary analyze-btn"
              onClick={handleAnalyze}
              disabled={analysisStep !== 'idle' && analysisStep !== 'complete' && analysisStep !== 'error'}
            >
              <Brain size={18} />
              Analyze Resume
              <Send size={16} />
            </button>

            {error && (
              <motion.p className="error-message" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AlertTriangle size={14} /> {error}
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Results */}
      {hasResults && (
        <motion.div className="resume-results" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {/* Summary */}
          <div className="glass-card result-section">
            <h3><Brain size={18} /> Professional Summary</h3>
            <p className="result-summary">{profile.summary}</p>
          </div>

          <div className="grid-2">
            {/* Technical Skills */}
            <div className="glass-card result-section">
              <h3><Code size={18} /> Technical Skills</h3>
              <div className="skill-tags">
                {profile.technical_skills?.map((s, i) => (
                  <span key={i} className="badge badge-primary">{s}</span>
                ))}
              </div>
            </div>

            {/* Programming Languages */}
            <div className="glass-card result-section">
              <h3><Code size={18} /> Languages & Frameworks</h3>
              <div className="skill-tags">
                {profile.programming_languages?.map((s, i) => (
                  <span key={i} className="badge badge-accent">{s}</span>
                ))}
                {profile.frameworks_and_tools?.map((s, i) => (
                  <span key={i} className="badge badge-primary">{s}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid-2">
            {/* Education */}
            <div className="glass-card result-section">
              <h3><GraduationCap size={18} /> Education</h3>
              {profile.education?.map((edu, i) => (
                <div key={i} className="result-item">
                  <strong>{edu.degree} in {edu.field}</strong>
                  <span className="badge badge-primary">{edu.level}</span>
                  <p className="result-item-sub">{edu.graduation_status}</p>
                </div>
              ))}
            </div>

            {/* Certifications */}
            <div className="glass-card result-section">
              <h3><Award size={18} /> Certifications</h3>
              <div className="skill-tags">
                {profile.certifications?.length ? (
                  profile.certifications.map((c, i) => (
                    <span key={i} className="badge badge-success">{c}</span>
                  ))
                ) : (
                  <p className="text-muted">No certifications found</p>
                )}
              </div>
            </div>
          </div>

          {/* Projects */}
          <div className="glass-card result-section">
            <h3><FolderKanban size={18} /> Projects</h3>
            <div className="projects-grid">
              {profile.projects?.map((proj, i) => (
                <div key={i} className="project-card">
                  <h4>{proj.title}</h4>
                  <p>{proj.description}</p>
                  <div className="skill-tags" style={{ marginTop: 8 }}>
                    {proj.technologies_used?.map((t, j) => (
                      <span key={j} className="badge badge-accent">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Internships */}
          {profile.internships?.length > 0 && (
            <div className="glass-card result-section">
              <h3><Briefcase size={18} /> Internships & Experience</h3>
              {profile.internships.map((intern, i) => (
                <div key={i} className="result-item">
                  <strong>{intern.role}</strong>
                  <span className="badge badge-primary">{intern.duration}</span>
                  <p className="result-item-sub">{intern.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {profile.warnings?.length > 0 && (
            <div className="glass-card result-section warnings-section">
              <h3><AlertTriangle size={18} /> Warnings & Suggestions</h3>
              <ul>
                {profile.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
