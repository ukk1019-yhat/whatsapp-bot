import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { useBrand } from '../context/BrandContext';

export const AuditLogsPage: React.FC = () => {
  const { selectedBrandId } = useBrand();
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      setIsLoading(true);
      try {
        const bizId = selectedBrandId === 'all' ? undefined : selectedBrandId;
        const data = await api.getAuditLogs(bizId);
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLogs();
  }, [selectedBrandId]);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(l.details).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Security & Administrative Audit Logs</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Immutable audit record of all prompt modifications, live human takeovers, KB publications, and opt-out actions.
        </p>
      </div>

      <div style={{ maxWidth: '400px' }}>
        <input
          type="text"
          placeholder="Filter audit logs by action or entity..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Timestamp</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Action</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Target Entity</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No audit log entries recorded.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1e3a8a' }}>
                    {log.action}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-active">{log.entity_type}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
