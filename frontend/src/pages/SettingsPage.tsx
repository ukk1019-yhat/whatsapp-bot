import React, { useEffect, useState } from 'react';
import { Bot, Check, Clock, Phone, Save, Shield, Sliders } from 'lucide-react';
import { api } from '../api/client';
import { useBrand } from '../context/BrandContext';
import { Business, BusinessSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const { selectedBrandId, businesses } = useBrand();
  const [currentBiz, setCurrentBiz] = useState<Business | null>(null);
  const [prompt, setPrompt] = useState('');
  const [threshold, setThreshold] = useState(0.8);
  const [autoHandoff, setAutoHandoff] = useState(true);
  const [welcomeMsg, setWelcomeMsg] = useState('');
  const [fallbackMsg, setFallbackMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const targetBizId = selectedBrandId === 'all' ? businesses[0]?.id : selectedBrandId;

  useEffect(() => {
    async function loadSettings() {
      if (!targetBizId) return;
      try {
        const biz = await api.getBusinessById(targetBizId);
        setCurrentBiz(biz);
        if (biz.settings) {
          setPrompt(biz.settings.system_prompt || '');
          setThreshold(biz.settings.confidence_threshold || 0.8);
          setAutoHandoff(biz.settings.auto_handoff_on_pricing);
          setWelcomeMsg(biz.settings.welcome_message || '');
          setFallbackMsg(biz.settings.fallback_message || '');
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      }
    }
    loadSettings();
  }, [targetBizId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBizId || isSaving) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateBusinessSettings(targetBizId, {
        system_prompt: prompt,
        confidence_threshold: threshold,
        auto_handoff_on_pricing: autoHandoff,
        welcome_message: welcomeMsg,
        fallback_message: fallbackMsg,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(`Save failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          AI Rules & WhatsApp Business Configuration
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Tune grounding mandates, hallucination prevention thresholds, and escalation contacts for {currentBiz?.display_name || 'Business'}.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* WhatsApp Profile Info */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={18} color="#2563eb" />
              <span>WhatsApp Cloud API Connection</span>
            </div>
            <span className="badge badge-active">{currentBiz?.status?.toUpperCase()}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', fontSize: '0.85rem' }}>
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Brand Name:</span>
              <div style={{ fontWeight: 600 }}>{currentBiz?.display_name}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Dedicated Phone Number ID:</span>
              <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{currentBiz?.whatsapp_phone_number_id}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Display Phone:</span>
              <div style={{ fontWeight: 600 }}>{currentBiz?.whatsapp_display_phone_number || 'Default line'}</div>
            </div>
          </div>
        </div>

        {/* AI System Instructions */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={18} color="#7c3aed" />
              <span>AI System Grounding Prompt</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{prompt.length} chars</span>
          </div>

          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Define specific persona rules, verified domain boundaries, and lead collection questions. Customer input and retrieved documents are treated as untrusted data.
          </p>

          <textarea
            rows={8}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            required
          />
        </div>

        {/* Confidence & Safety Thresholds */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="#059669" />
              <span>Safety Thresholds & Escalation Rules</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Confidence Threshold for Automatic Replies:
                </label>
                <span style={{ fontWeight: 700, color: '#2563eb' }}>{Math.round(threshold * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                If AI confidence drops below {Math.round(threshold * 100)}%, reply is held and automatically escalated to human advisors.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="autoHandoffPricing"
                checked={autoHandoff}
                onChange={(e) => setAutoHandoff(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="autoHandoffPricing" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Automatically escalate custom quote negotiations, refunds, and unverified pricing requests to human staff
              </label>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Fallback Message (When information is unverified or under review):
              </label>
              <input
                type="text"
                value={fallbackMsg}
                onChange={(e) => setFallbackMsg(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            <Save size={16} /> <span>{isSaving ? 'Saving Changes...' : 'Save Business Settings'}</span>
          </button>
          {saveSuccess && (
            <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} /> Settings saved and active immediately!
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
