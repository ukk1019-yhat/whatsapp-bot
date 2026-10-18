import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bot,
  Check,
  CheckCheck,
  Headphones,
  Play,
  RotateCcw,
  Send,
  User,
} from 'lucide-react';
import { api } from '../api/client';
import { useBrand } from '../context/BrandContext';
import { ConversationSummary, MessageItem } from '../types';

export const InboxPage: React.FC = () => {
  const { selectedBrandId } = useBrand();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [replyText, setReplyText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchConversations = async () => {
    try {
      const bizId = selectedBrandId === 'all' ? undefined : selectedBrandId;
      const data = await api.getConversations(bizId);
      setConversations(data);
      if (data.length > 0 && !selectedConvId) {
        setSelectedConvId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching conversations', err);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      setIsLoading(true);
      const msgs = await api.getConversationMessages(convId);
      setMessages(msgs);
    } catch (err) {
      console.error('Error loading messages', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [selectedBrandId]);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
    }
  }, [selectedConvId]);

  const activeConv = conversations.find((c) => c.id === selectedConvId) || null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !replyText.trim() || isSending) return;

    try {
      setIsSending(true);
      await api.sendAgentMessage(selectedConvId, replyText.trim());
      setReplyText('');
      await fetchMessages(selectedConvId);
      await fetchConversations();
    } catch (err) {
      alert(`Failed to send message: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleTakeover = async () => {
    if (!selectedConvId || !activeConv) return;
    try {
      if (activeConv.isHumanTakeover) {
        await api.releaseHandoff(selectedConvId);
      } else {
        await api.initiateHandoff(selectedConvId, 'Operator manual takeover from dashboard');
      }
      await fetchConversations();
    } catch (err) {
      alert(`Takeover action failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactPhone.includes(searchTerm) ||
      (c.lastMessagePreview || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="inbox-container">
      {/* Left List Pane */}
      <div className="inbox-sidebar">
        <div className="inbox-search">
          <input
            type="text"
            placeholder="Search conversations by phone, name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="inbox-list">
          {filteredConversations.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No WhatsApp conversations found.
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = c.id === selectedConvId;
              const isEdu = c.business_id.includes('1111');
              return (
                <div
                  key={c.id}
                  className={`inbox-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedConvId(c.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.contactName}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {c.last_customer_message_at
                        ? new Date(c.last_customer_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span className={`badge ${isEdu ? 'badge-edu' : 'badge-setsu'}`}>
                      {isEdu ? 'Edu Alt Tech' : 'Setsuzoku'}
                    </span>
                    {c.isHumanTakeover ? (
                      <span className="badge badge-takeover">
                        <Headphones size={10} /> Human Agent
                      </span>
                    ) : (
                      <span className="badge badge-active">
                        <Bot size={10} /> AI Grounded
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {c.lastMessagePreview || 'No messages yet'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Chat Pane */}
      <div className="inbox-chat">
        {activeConv ? (
          <>
            {/* Header */}
            <div className="chat-header">
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{activeConv.contactName}</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {activeConv.contactPhone} {activeConv.contactOrg ? `• ${activeConv.contactOrg}` : ''}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  className={`btn ${activeConv.isHumanTakeover ? 'btn-success' : 'btn-danger'}`}
                  onClick={handleToggleTakeover}
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  {activeConv.isHumanTakeover ? (
                    <>
                      <Play size={14} /> Resume AI Automation
                    </>
                  ) : (
                    <>
                      <Headphones size={14} /> Take Over (Pause AI)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="chat-messages">
              {isLoading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                  Loading chat history...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                  No messages recorded in this conversation yet.
                </div>
              ) : (
                messages.map((m) => {
                  const isCustomer = m.sender_type === 'customer';
                  const isAi = m.sender_type === 'ai';
                  const isHuman = m.sender_type === 'human_agent';

                  return (
                    <div
                      key={m.id}
                      className={`chat-bubble ${isCustomer ? 'customer' : isAi ? 'ai' : 'human'}`}
                    >
                      <div
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          marginBottom: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <span>
                          {isCustomer ? 'Customer' : isAi ? '🤖 AI Grounded Bot' : '👤 Support Agent'}
                        </span>
                        <span style={{ fontWeight: 400, opacity: 0.7 }}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div style={{ whiteSpace: 'pre-line' }}>{m.content}</div>

                      {!isCustomer && (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            marginTop: '4px',
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            gap: '4px',
                          }}
                        >
                          <span>{m.delivery_status}</span>
                          {m.delivery_status === 'delivered' || m.delivery_status === 'read' ? (
                            <CheckCheck size={12} color="#2563eb" />
                          ) : (
                            <Check size={12} />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Live Reply Input */}
            <form className="chat-input-bar" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder={
                  activeConv.isHumanTakeover
                    ? 'Type your reply directly to the WhatsApp user...'
                    : 'Replying will automatically initiate human takeover and pause AI...'
                }
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={isSending}
              />
              <button type="submit" className="btn btn-primary" disabled={isSending || !replyText.trim()}>
                <Send size={16} />
                <span>Send</span>
              </button>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            Select a conversation from the left to view message history.
          </div>
        )}
      </div>
    </div>
  );
};
