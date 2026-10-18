import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle,
  FileSpreadsheet,
  Headphones,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { api } from '../api/client';
import { useBrand } from '../context/BrandContext';
import { AnalyticsSummary } from '../types';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { selectedBrandId, selectedBusiness } = useBrand();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const bizId = selectedBrandId === 'all' ? undefined : selectedBrandId;
        const [sum, logs] = await Promise.all([
          api.getAnalyticsSummary(bizId),
          api.getAuditLogs(bizId),
        ]);
        setAnalytics(sum);
        setRecentLogs(logs.slice(0, 6));
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedBrandId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
            {selectedBusiness ? `${selectedBusiness.display_name} Operations` : 'Executive Multi-Brand Overview'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Real-time WhatsApp conversations, grounded AI responses, CRM pipeline & human takeovers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => onNavigate('simulator')}>
            <Bot size={16} />
            <span>Open Simulator</span>
          </button>
          <a
            href={api.getExportLeadsUrl(selectedBrandId === 'all' ? undefined : selectedBrandId)}
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <FileSpreadsheet size={16} />
            <span>Export Leads CSV</span>
          </a>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="stat-label">Total Conversations</span>
            <MessageSquare size={18} color="#2563eb" />
          </div>
          <div className="stat-value">{analytics?.totalConversations || 0}</div>
          <div className="stat-subtitle">{analytics?.activeConversations || 0} currently active threads</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="stat-label">Total WhatsApp Leads</span>
            <Users size={18} color="#10b981" />
          </div>
          <div className="stat-value">{analytics?.totalLeads || 0}</div>
          <div className="stat-subtitle" style={{ color: 'var(--success)' }}>
            <strong>{analytics?.qualifiedLeads || 0}</strong> qualified in pipeline
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="stat-label">AI Automation Rate</span>
            <Sparkles size={18} color="#7c3aed" />
          </div>
          <div className="stat-value">{analytics?.aiResponseRate || 100}%</div>
          <div className="stat-subtitle">Grounded zero-hallucination rate</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="stat-label">Human Takeovers</span>
            <Headphones size={18} color="#f59e0b" />
          </div>
          <div className="stat-value" style={{ color: analytics?.activeHandoffs ? '#d97706' : 'inherit' }}>
            {analytics?.activeHandoffs || 0}
          </div>
          <div className="stat-subtitle">Paused conversations with live agents</div>
        </div>
      </div>

      {/* Brand Profile Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Edu Alt Tech Card */}
        <div className="card" style={{ borderTop: '4px solid var(--edu-primary)' }}>
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>🎓</span>
              <span>Edu Alt Tech</span>
            </div>
            <span className="badge badge-edu">Education Technology</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Dedicated WhatsApp bot for student future-skills bootcamps, teacher certifications, and K-12 school curriculum partnerships.
          </p>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div><strong>Verified Catalog:</strong> AI Student Bootcamp (₹4,999), Teacher Certification, School Partnerships</div>
            <div><strong>Safety Policy:</strong> Strict pricing verification. Never invents fees, batch times, or certificates.</div>
            <div><strong>Website:</strong> <a href="https://www.edualttech.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--edu-primary)' }}>edualttech.com</a></div>
          </div>
        </div>

        {/* Setsuzoku Card */}
        <div className="card" style={{ borderTop: '4px solid var(--setsu-primary)' }}>
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>⚡</span>
              <span>Setsuzoku</span>
            </div>
            <span className="badge badge-setsu">Technology & Digital</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Dedicated WhatsApp consultant for custom web apps, mobile engineering (iOS/Android), enterprise AI automation, and SEO.
          </p>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div><strong>Verified Catalog:</strong> Web & SaaS Dev, Mobile Apps, Enterprise AI & RAG, Digital SEO</div>
            <div><strong>Safety Policy:</strong> Custom architectural scoping. Strictly no fabricated quotes or fixed delivery promises.</div>
            <div><strong>Consultation:</strong> Lead qualification & human architect scheduling</div>
          </div>
        </div>
      </div>

      {/* Recent Security & Event Audit Trail */}
      <div className="card">
        <div className="card-title">
          <span>Recent Activity & Audit Trail</span>
          <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 10px' }} onClick={() => onNavigate('audit')}>
            View All Logs
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '12px 0' }}>No recent audit events.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle size={16} color="#10b981" />
                  <span style={{ fontWeight: 600 }}>{log.action}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({log.entity_type})</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {new Date(log.created_at).toLocaleTimeString()} - {new Date(log.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
