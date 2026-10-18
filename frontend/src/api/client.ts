import {
  AnalyticsSummary,
  Business,
  BusinessSettings,
  ConversationSummary,
  FAQItem,
  KnowledgeDocument,
  LeadItem,
  LeadStatus,
  MessageItem,
  ServiceItem,
  User,
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Businesses
  async getBusinesses(): Promise<Business[]> {
    const res = await fetch(`${API_BASE}/businesses`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async getBusinessById(id: string): Promise<Business> {
    const res = await fetch(`${API_BASE}/businesses/${id}`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async updateBusinessSettings(id: string, settings: Partial<BusinessSettings>): Promise<BusinessSettings> {
    const res = await fetch(`${API_BASE}/businesses/${id}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(settings),
    });
    return handleResponse(res);
  },

  // Conversations & Messages
  async getConversations(businessId?: string, status?: string): Promise<ConversationSummary[]> {
    const params = new URLSearchParams();
    if (businessId) params.append('businessId', businessId);
    if (status) params.append('status', status);

    const res = await fetch(`${API_BASE}/conversations?${params.toString()}`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async getConversationMessages(conversationId: string): Promise<MessageItem[]> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async sendAgentMessage(conversationId: string, text: string): Promise<{ success: boolean; messageId: string }> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ text }),
    });
    return handleResponse(res);
  },

  async initiateHandoff(conversationId: string, reason?: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/handoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ reason }),
    });
    return handleResponse(res);
  },

  async releaseHandoff(conversationId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Leads
  async getLeads(businessId?: string, status?: string): Promise<LeadItem[]> {
    const params = new URLSearchParams();
    if (businessId) params.append('businessId', businessId);
    if (status) params.append('status', status);

    const res = await fetch(`${API_BASE}/leads?${params.toString()}`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async updateLeadStatus(leadId: string, status: LeadStatus, notes?: string): Promise<LeadItem> {
    const res = await fetch(`${API_BASE}/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ status, notes }),
    });
    return handleResponse(res);
  },

  getExportLeadsUrl(businessId?: string): string {
    return `${API_BASE}/leads/export${businessId ? `?businessId=${businessId}` : ''}`;
  },

  // Knowledge Base
  async getServices(businessId: string): Promise<ServiceItem[]> {
    const res = await fetch(`${API_BASE}/knowledge/services?businessId=${businessId}`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async createService(service: Partial<ServiceItem> & { business_id: string }): Promise<ServiceItem> {
    const res = await fetch(`${API_BASE}/knowledge/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(service),
    });
    return handleResponse(res);
  },

  async getFAQs(businessId: string): Promise<FAQItem[]> {
    const res = await fetch(`${API_BASE}/knowledge/faqs?businessId=${businessId}`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async createFAQ(faq: Partial<FAQItem> & { business_id: string }): Promise<FAQItem> {
    const res = await fetch(`${API_BASE}/knowledge/faqs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(faq),
    });
    return handleResponse(res);
  },

  async getDocuments(businessId: string): Promise<KnowledgeDocument[]> {
    const res = await fetch(`${API_BASE}/knowledge/documents?businessId=${businessId}`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async createDocument(doc: { business_id: string; title: string; source_type: string; content_raw: string }): Promise<KnowledgeDocument> {
    const res = await fetch(`${API_BASE}/knowledge/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(doc),
    });
    return handleResponse(res);
  },

  async publishDocument(docId: string): Promise<{ success: boolean; document: KnowledgeDocument }> {
    const res = await fetch(`${API_BASE}/knowledge/documents/${docId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Analytics & Logs
  async getAnalyticsSummary(businessId?: string): Promise<AnalyticsSummary> {
    const params = new URLSearchParams();
    if (businessId) params.append('businessId', businessId);
    const res = await fetch(`${API_BASE}/analytics/summary?${params.toString()}`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async getAuditLogs(businessId?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (businessId) params.append('businessId', businessId);
    const res = await fetch(`${API_BASE}/analytics/audit-logs?${params.toString()}`, {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async getHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  // Simulator
  async runSimulator(payload: { businessSlug: 'edu-alt-tech' | 'setsuzoku'; fromPhone: string; messageText: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/health/simulator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },
};
