/**
 * Settings Page — API status, diagnostics, and environment info.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, CheckCircle, XCircle, RefreshCw, Server, Cpu, Key } from 'lucide-react';
import { checkHealth } from '../services/api';
import type { HealthResponse } from '../types';
import './Settings.css';

export default function Settings() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = () => {
    setLoading(true);
    setError(null);
    checkHealth()
      .then(setHealth)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHealth(); }, []);

  const StatusBadge = ({ ok }: { ok: boolean }) => (
    <span className={`status-badge ${ok ? 'status-badge--ok' : 'status-badge--error'}`}>
      {ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
      {ok ? 'Connected' : 'Error'}
    </span>
  );

  return (
    <div className="page-container">
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1><SettingsIcon size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Settings</h1>
        <p>System status, diagnostics, and configuration</p>
      </motion.div>

      {/* API Status */}
      <motion.div className="glass-card settings-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="settings-section-header">
          <h3><Server size={18} /> API Status</h3>
          <button className="btn btn-secondary" onClick={fetchHealth} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="settings-error">
            <XCircle size={18} />
            <p>Cannot connect to backend: {error}</p>
            <p className="settings-hint">Make sure the backend server is running on http://localhost:8000</p>
          </div>
        ) : health ? (
          <div className="settings-grid">
            <div className="setting-item">
              <span className="setting-label">Backend Status</span>
              <StatusBadge ok={health.status === 'healthy'} />
            </div>
            <div className="setting-item">
              <span className="setting-label">Version</span>
              <span className="setting-value">{health.version}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label"><Key size={14} /> API Key</span>
              <StatusBadge ok={health.api_key_configured} />
            </div>
            <div className="setting-item">
              <span className="setting-label">MCP Server</span>
              <span className="setting-value">{health.mcp_server_status}</span>
            </div>
          </div>
        ) : (
          <div className="skeleton" style={{ height: 120 }} />
        )}
      </motion.div>

      {/* Agent Diagnostics */}
      {health?.agents && (
        <motion.div className="glass-card settings-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3><Cpu size={18} /> Agent Diagnostics</h3>
          <div className="settings-grid">
            {Object.entries(health.agents).map(([name, status]) => (
              <div key={name} className="setting-item">
                <span className="setting-label">{name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                <span className={`badge ${status === 'ready' ? 'badge-success' : 'badge-error'}`}>{status}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Environment */}
      <motion.div className="glass-card settings-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h3><SettingsIcon size={18} /> Environment</h3>
        <div className="settings-grid">
          <div className="setting-item">
            <span className="setting-label">Frontend</span>
            <span className="setting-value">React + TypeScript + Vite</span>
          </div>
          <div className="setting-item">
            <span className="setting-label">Backend</span>
            <span className="setting-value">FastAPI + Python</span>
          </div>
          <div className="setting-item">
            <span className="setting-label">AI Framework</span>
            <span className="setting-value">Google ADK + Gemini</span>
          </div>
          <div className="setting-item">
            <span className="setting-label">Protocol</span>
            <span className="setting-value">MCP (Model Context Protocol)</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
