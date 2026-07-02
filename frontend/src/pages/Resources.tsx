/**
 * Resources Page — Curated learning resources.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, Filter, Star } from 'lucide-react';
import { getResources } from '../services/api';
import type { ResourceItem } from '../types';
import './Resources.css';

export default function Resources() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResources()
      .then((data) => {
        setResources(data.resources);
        setCategories(['All', ...data.categories]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? resources : resources.filter((r) => r.type === filter);

  return (
    <div className="page-container">
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1><BookOpen size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />Learning Resources</h1>
        <p>Curated resources to help you prepare for placements</p>
      </motion.div>

      {/* Filter */}
      <motion.div className="resources-filter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Filter size={16} style={{ color: 'var(--text-muted)' }} />
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${filter === cat ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="grid-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 140 }} />
          ))}
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map((resource, i) => (
            <motion.a
              key={resource.name}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="resource-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <div className="resource-card-header">
                <Star size={16} style={{ color: resource.free ? 'var(--success)' : 'var(--warning)' }} />
                <span className={`badge ${resource.free ? 'badge-success' : 'badge-warning'}`}>
                  {resource.free ? 'Free' : 'Paid'}
                </span>
              </div>
              <h4>{resource.name}</h4>
              <span className="badge badge-primary">{resource.type}</span>
              <div className="resource-link">
                Visit <ExternalLink size={12} />
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </div>
  );
}
