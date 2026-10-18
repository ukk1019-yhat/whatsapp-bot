import React from 'react';
import {
  Activity,
  Bot,
  FileText,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'inbox', label: 'Live Inbox', icon: MessageSquare },
    { id: 'leads', label: 'Lead CRM', icon: Users },
    { id: 'knowledge', label: 'Knowledge Base', icon: Layers },
    { id: 'simulator', label: 'AI Simulator', icon: Bot },
    { id: 'settings', label: 'AI & Business Config', icon: Settings },
    { id: 'audit', label: 'Audit Logs', icon: ShieldCheck },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <Bot size={26} color="#38bdf8" />
          <span>OmniBrand WA</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
          Edu Alt Tech & Setsuzoku Automation
        </p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
              style={{ border: 'none', background: 'transparent', width: '100%', textAlign: 'left' }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div>
          <div className="user-badge" style={{ fontWeight: 600 }}>{user?.fullName}</div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {user?.role === 'super_admin' ? 'Super Admin' : user?.businessName || 'Brand Admin'}
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign Out"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '6px',
          }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};
