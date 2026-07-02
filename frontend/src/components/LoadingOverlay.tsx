/**
 * LoadingOverlay — Full-screen loading state with step indicators.
 */

import { motion } from 'framer-motion';
import { Brain, FileSearch, Target, BookOpen } from 'lucide-react';
import type { AnalysisStep } from '../types';
import './LoadingOverlay.css';

const steps = [
  { key: 'uploading', icon: FileSearch, label: 'Processing Resume', desc: 'Extracting and validating your resume...' },
  { key: 'parsing', icon: Brain, label: 'Profile Intelligence', desc: 'AI is analyzing your skills and experience...' },
  { key: 'analyzing', icon: Target, label: 'Career Analysis', desc: 'Comparing your profile against role requirements...' },
  { key: 'coaching', icon: BookOpen, label: 'Generating Roadmap', desc: 'Creating your personalized preparation plan...' },
];

interface LoadingOverlayProps {
  step: AnalysisStep;
}

export default function LoadingOverlay({ step }: LoadingOverlayProps) {
  if (step === 'idle' || step === 'complete' || step === 'error') return null;

  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <motion.div
      className="loading-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="loading-content">
        <div className="loading-spinner-wrapper">
          <motion.div
            className="loading-spinner-ring"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          <Brain size={28} className="loading-brain-icon" />
        </div>

        <h3 className="loading-title">AI Analysis in Progress</h3>

        <div className="loading-steps">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === currentIndex;
            const isComplete = i < currentIndex;

            return (
              <motion.div
                key={s.key}
                className={`loading-step ${isActive ? 'loading-step--active' : ''} ${
                  isComplete ? 'loading-step--complete' : ''
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="loading-step-icon">
                  <Icon size={16} />
                </div>
                <div className="loading-step-info">
                  <span className="loading-step-label">{s.label}</span>
                  {isActive && (
                    <motion.span
                      className="loading-step-desc"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {s.desc}
                    </motion.span>
                  )}
                </div>
                {isComplete && <span className="loading-step-check">✓</span>}
                {isActive && <div className="spinner" style={{ width: 16, height: 16 }} />}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
