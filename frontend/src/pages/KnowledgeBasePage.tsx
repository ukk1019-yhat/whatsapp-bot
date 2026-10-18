import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  FileText,
  HelpCircle,
  Layers,
  Plus,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { api } from '../api/client';
import { useBrand } from '../context/BrandContext';
import { FAQItem, KnowledgeDocument, ServiceItem } from '../types';

export const KnowledgeBasePage: React.FC = () => {
  const { selectedBrandId, selectedBusiness, businesses } = useBrand();
  const [activeTab, setActiveTab] = useState<'services' | 'faqs' | 'documents'>('services');

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New Service Modal / Form State
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceLink, setNewServiceLink] = useState('');

  // New FAQ Form State
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [newFaqCategory, setNewFaqCategory] = useState('General');

  // New Document Form State
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');

  const targetBizId = selectedBrandId === 'all' ? businesses[0]?.id : selectedBrandId;

  const loadData = async () => {
    if (!targetBizId) return;
    setIsLoading(true);
    try {
      const [svc, f, docs] = await Promise.all([
        api.getServices(targetBizId),
        api.getFAQs(targetBizId),
        api.getDocuments(targetBizId),
      ]);
      setServices(svc);
      setFaqs(f);
      setDocuments(docs);
    } catch (err) {
      console.error('Error loading knowledge base', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetBizId]);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBizId || !newServiceName) return;
    try {
      await api.createService({
        business_id: targetBizId,
        name: newServiceName,
        category: newServiceCategory || 'General Offering',
        description: newServiceDesc,
        verified_price: newServicePrice || 'Contact for consultation',
        registration_link: newServiceLink || undefined,
        is_verified: true,
        is_active: true,
      });
      setShowAddService(false);
      setNewServiceName('');
      setNewServiceDesc('');
      setNewServicePrice('');
      setNewServiceLink('');
      await loadData();
    } catch (err) {
      alert(`Error creating service: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCreateFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBizId || !newFaqQuestion) return;
    try {
      await api.createFAQ({
        business_id: targetBizId,
        question: newFaqQuestion,
        answer: newFaqAnswer,
        category: newFaqCategory,
        status: 'published',
      });
      setShowAddFaq(false);
      setNewFaqQuestion('');
      setNewFaqAnswer('');
      await loadData();
    } catch (err) {
      alert(`Error creating FAQ: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBizId || !newDocTitle || !newDocContent) return;
    try {
      await api.createDocument({
        business_id: targetBizId,
        title: newDocTitle,
        source_type: 'manual_text',
        content_raw: newDocContent,
      });
      setShowAddDoc(false);
      setNewDocTitle('');
      setNewDocContent('');
      await loadData();
    } catch (err) {
      alert(`Error creating document: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handlePublishDocument = async (docId: string) => {
    try {
      await api.publishDocument(docId);
      await loadData();
    } catch (err) {
      alert(`Error publishing document: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Approved Knowledge Base & Grounding Engine</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Manage verified course catalogs, technology services, and brand documents. Strict review-and-publish workflow prevents hallucinations.
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          Verified Services & Courses ({services.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'faqs' ? 'active' : ''}`}
          onClick={() => setActiveTab('faqs')}
        >
          Verified FAQs ({faqs.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Knowledge Documents & Review Pipeline ({documents.length})
        </button>
      </div>

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setShowAddService(!showAddService)}>
              <Plus size={16} /> <span>Add Verified Service</span>
            </button>
          </div>

          {showAddService && (
            <div className="card" style={{ background: '#f8fafc', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>New Verified Service / Course</h3>
              <form onSubmit={handleCreateService} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Service / Course Name (e.g. AI for High School Students)"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Category (e.g. Student Bootcamps, Web Dev, Mobile App)"
                  value={newServiceCategory}
                  onChange={(e) => setNewServiceCategory(e.target.value)}
                />
                <textarea
                  placeholder="Full verified description..."
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  rows={3}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Verified Price (e.g. ₹4,999 or Scoped per consultation)"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Verified Registration Link (e.g. https://...)"
                    value={newServiceLink}
                    onChange={(e) => setNewServiceLink(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-success">Save to Knowledge Base</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddService(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
            {services.map((svc) => (
              <div key={svc.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="badge badge-active">
                    <ShieldCheck size={12} /> Verified Service
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{svc.category}</span>
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{svc.name}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{svc.description}</p>
                <div style={{ background: '#f1f5f9', padding: '8px 10px', borderRadius: '6px', fontSize: '0.8rem', marginTop: 'auto' }}>
                  <div><strong>Verified Price:</strong> {svc.verified_price || 'Available upon consultation'}</div>
                  {svc.schedule_details && <div><strong>Schedule:</strong> {svc.schedule_details}</div>}
                  {svc.registration_link && (
                    <div style={{ wordBreak: 'break-all' }}>
                      <strong>Link:</strong> <a href={svc.registration_link} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>{svc.registration_link}</a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQs Tab */}
      {activeTab === 'faqs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setShowAddFaq(!showAddFaq)}>
              <Plus size={16} /> <span>Add Verified FAQ</span>
            </button>
          </div>

          {showAddFaq && (
            <div className="card" style={{ background: '#f8fafc', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>New Verified Q&A Pair</h3>
              <form onSubmit={handleCreateFAQ} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Frequently Asked Question"
                  value={newFaqQuestion}
                  onChange={(e) => setNewFaqQuestion(e.target.value)}
                  required
                />
                <textarea
                  placeholder="Verified, accurate answer grounded on company policies..."
                  value={newFaqAnswer}
                  onChange={(e) => setNewFaqAnswer(e.target.value)}
                  rows={3}
                  required
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-success">Add FAQ</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddFaq(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq) => (
              <div key={faq.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e3a8a' }}>Q: {faq.question}</span>
                  <span className="badge badge-active">{faq.status}</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>A: {faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents & Review/Publish Tab */}
      {activeTab === 'documents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setShowAddDoc(!showAddDoc)}>
              <Upload size={16} /> <span>Upload / Add Document Draft</span>
            </button>
          </div>

          {showAddDoc && (
            <div className="card" style={{ background: '#f8fafc', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>New Knowledge Document Draft</h3>
              <form onSubmit={handleCreateDocument} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Document Title (e.g. 2026 Academic Prospectus or Tech Capability Brief)"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  required
                />
                <textarea
                  placeholder="Paste verified document text here. Chunks will be automatically generated upon submission..."
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  rows={5}
                  required
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-success">Save as Draft Chunks</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddDoc(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {documents.map((doc) => {
              const isPublished = doc.status === 'published';
              return (
                <div key={doc.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <FileText size={18} color="#2563eb" />
                      <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{doc.title}</h4>
                      <span className={`badge ${isPublished ? 'badge-active' : 'badge-takeover'}`}>
                        {doc.status.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '700px' }}>
                      {doc.content_raw.substring(0, 150)}...
                    </p>
                  </div>

                  <div>
                    {!isPublished ? (
                      <button className="btn btn-success" onClick={() => handlePublishDocument(doc.id)}>
                        <CheckCircle size={14} /> <span>Review & Publish</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>
                        Active in AI Grounding Context
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
