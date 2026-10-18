import React, { useEffect, useState } from 'react';
import { CheckCircle2, Globe, Shield } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const { businesses, selectedBrandId, setSelectedBrandId } = useBrand();
  const [healthStatus, setHealthStatus] = useState<string>('checking');

  useEffect(() => {
    async function checkHealth() {
      try {
        const h = await api.getHealth();
        setHealthStatus(h.whatsappIntegration?.status === 'connected' ? 'connected' : 'test_mode');
      } catch (err) {
        setHealthStatus('offline');
      }
    }
    checkHealth();
  }, []);

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <header className="top-navbar">
      <div className="brand-switcher-wrapper">
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Active Brand:
        </span>

        {isSuperAdmin && (
          <button
            className={`brand-pill ${selectedBrandId === 'all' ? 'active-all' : ''}`}
            onClick={() => setSelectedBrandId('all')}
          >
            <Globe size={14} />
            <span>All Businesses</span>
          </button>
        )}

        {businesses.map((biz) => {
          const isEdu = biz.slug === 'edu-alt-tech';
          const isActive = selectedBrandId === biz.id;
          const activeClass = isActive ? (isEdu ? 'active-edu' : 'active-setsu') : '';

          return (
            <button
              key={biz.id}
              className={`brand-pill ${activeClass}`}
              onClick={() => setSelectedBrandId(biz.id)}
            >
              <span>{isEdu ? '🎓' : '⚡'}</span>
              <span>{biz.display_name}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor:
                healthStatus === 'connected' ? 'var(--success)' : 'var(--warning)',
            }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>
            WhatsApp API: <strong>{healthStatus === 'connected' ? 'Meta Cloud API Live' : 'Test Sandbox Active'}</strong>
          </span>
        </div>

        <div
          style={{
            fontSize: '0.75rem',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: '#f1f5f9',
            color: 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          {user?.role.toUpperCase()}
        </div>
      </div>
    </header>
  );
};
