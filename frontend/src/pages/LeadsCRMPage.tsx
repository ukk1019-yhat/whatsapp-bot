import React, { useEffect, useState } from 'react';
import {
  Calendar,
  DollarSign,
  Download,
  Filter,
  GraduationCap,
  Phone,
  Search,
  User,
} from 'lucide-react';
import { api } from '../api/client';
import { useBrand } from '../context/BrandContext';
import { LeadItem, LeadStatus } from '../types';

const PIPELINE_COLUMNS: Array<{ id: LeadStatus; label: string; color: string }> = [
  { id: 'new', label: 'New Inquiries', color: '#64748b' },
  { id: 'contacted', label: 'Contacted', color: '#0284c7' },
  { id: 'qualified', label: 'Qualified', color: '#7c3aed' },
  { id: 'consultation_requested', label: 'Consultation Requested', color: '#d97706' },
  { id: 'proposal_pending', label: 'Proposal Pending', color: '#ea580c' },
  { id: 'converted', label: 'Converted / Enrolled', color: '#16a34a' },
  { id: 'closed', label: 'Closed / Archived', color: '#94a3b8' },
];

export const LeadsCRMPage: React.FC = () => {
  const { selectedBrandId } = useBrand();
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const bizId = selectedBrandId === 'all' ? undefined : selectedBrandId;
      const data = await api.getLeads(bizId);
      setLeads(data);
    } catch (err) {
      console.error('Failed to load leads', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [selectedBrandId]);

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await api.updateLeadStatus(leadId, newStatus);
      await fetchLeads();
    } catch (err) {
      alert(`Failed to update status: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const filteredLeads = leads.filter(
    (l) =>
      (l.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.organization_or_school || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.requirements || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone_number.includes(searchTerm)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Sales & Admissions CRM Pipeline</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Auto-captured WhatsApp leads, school partnerships, custom development scoping & discovery requests.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <a
            href={api.getExportLeadsUrl(selectedBrandId === 'all' ? undefined : selectedBrandId)}
            className="btn btn-secondary"
            style={{ textDecoration: 'none' }}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ maxWidth: '400px' }}>
        <input
          type="text"
          placeholder="Search leads by customer, school, requirements..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Kanban Pipeline Columns */}
      <div className="kanban-board">
        {PIPELINE_COLUMNS.map((col) => {
          const colLeads = filteredLeads.filter((l) => l.status === col.id);
          return (
            <div key={col.id} className="kanban-column">
              <div className="kanban-header">
                <span style={{ color: col.color }}>{col.label}</span>
                <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                  {colLeads.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {colLeads.map((lead) => {
                  const isEdu = lead.business_id.includes('1111');
                  return (
                    <div key={lead.id} className="kanban-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span className={`badge ${isEdu ? 'badge-edu' : 'badge-setsu'}`}>
                          {isEdu ? 'Edu Alt Tech' : 'Setsuzoku'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(lead.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {lead.customer_name || 'Anonymous Lead'}
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={12} /> {lead.phone_number}
                      </div>

                      {lead.organization_or_school && (
                        <div style={{ fontSize: '0.8rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <GraduationCap size={12} /> {lead.organization_or_school}
                        </div>
                      )}

                      {lead.requirements && (
                        <div style={{ fontSize: '0.8rem', background: '#f8fafc', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                          {lead.requirements}
                        </div>
                      )}

                      {(lead.budget_range || lead.expected_timeline) && (
                        <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {lead.budget_range && <span>💰 {lead.budget_range}</span>}
                          {lead.expected_timeline && <span>⏱️ {lead.expected_timeline}</span>}
                        </div>
                      )}

                      {/* Status Selector */}
                      <div style={{ marginTop: '4px' }}>
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                          style={{ fontSize: '0.75rem', padding: '4px 6px' }}
                        >
                          {PIPELINE_COLUMNS.map((p) => (
                            <option key={p.id} value={p.id}>
                              Move to: {p.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}

                {colLeads.length === 0 && (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                    No leads in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
