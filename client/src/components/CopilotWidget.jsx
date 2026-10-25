import React, { useState } from 'react';
import { Bot, Send, X, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import api from '../api/client';

export default function CopilotWidget({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'copilot',
      text: 'Hello! I am your AICTE Regulatory & Validation Copilot. Ask me about AICTE Approval Process Handbook (APH) rules, NRI/OCI quotas, APAAR mandates, or validation rule codes (e.g., CAP-01, DUP-02, FMT-01).',
      section: 'AICTE Handbook Grounded Engine',
      ruleCode: 'APH-INDEX',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;

    const userText = query.trim();
    setQuery('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await api.post('/copilot/query', { query: userText });
      const data = res.data;
      setMessages((prev) => [
        ...prev,
        {
          sender: 'copilot',
          text: data.explanation,
          topic: data.topic,
          section: data.section,
          ruleCode: data.ruleCode,
          ruleVersion: data.ruleVersion,
          disclaimer: data.disclaimer,
          relatedRules: data.relatedDbRules,
          suggestedTopics: data.suggestedTopics,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'copilot',
          text: 'Unable to reach the copilot service at this moment. Please verify your connection.',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const askTopic = (topic) => {
    setQuery(topic);
  };

  if (!isOpen) return null;

  return (
    <div className="copilot-panel">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom bg-light">
        <div className="d-flex align-items-center gap-2">
          <div className="bg-primary text-white rounded p-1 d-flex align-items-center justify-content-center" style={{ width: 30, height: 30 }}>
            <Bot size={18} />
          </div>
          <div>
            <div className="fw-bold fs-6 d-flex align-items-center gap-1">
              AICTE Compliance Copilot
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle" style={{ fontSize: '0.65rem' }}>
                Rule Grounded
              </span>
            </div>
            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
              Process Handbook • Predict • Explain
            </div>
          </div>
        </div>
        <button className="btn btn-sm btn-link text-muted p-0" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="p-3 overflow-y-auto" style={{ flexGrow: 1, maxHeight: 380, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.map((m, idx) => (
          <div key={idx} className={`d-flex flex-column ${m.sender === 'user' ? 'align-items-end' : 'align-items-start'}`}>
            <div
              className={`p-2 rounded-3 ${
                m.sender === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-light border text-dark'
              }`}
              style={{ maxWidth: '90%', fontSize: '0.85rem' }}
            >
              {m.topic && (
                <div className="fw-bold mb-1 text-primary d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                  <BookOpen size={13} /> {m.topic}
                </div>
              )}
              <div>{m.text}</div>

              {m.ruleCode && m.ruleCode !== 'NONE' && (
                <div className="mt-2 pt-1 border-top d-flex align-items-center justify-content-between" style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  <span>Rule: <strong>{m.ruleCode}</strong> ({m.ruleVersion || 'v1.0'})</span>
                  {m.section && <span className="text-truncate" style={{ maxWidth: 160 }}>{m.section}</span>}
                </div>
              )}

              {m.suggestedTopics && (
                <div className="mt-2 pt-1 border-top">
                  <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>Suggested queries:</div>
                  <div className="d-flex flex-wrap gap-1">
                    {m.suggestedTopics.map((s, i) => (
                      <button
                        key={i}
                        className="btn btn-xs btn-outline-primary py-0 px-1"
                        style={{ fontSize: '0.7rem' }}
                        onClick={() => askTopic(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {m.disclaimer && (
              <div className="text-muted mt-1 px-1" style={{ fontSize: '0.65rem' }}>
                {m.disclaimer}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="d-flex align-items-center gap-2 text-muted p-2" style={{ fontSize: '0.8rem' }}>
            <Sparkles size={14} className="spinner-border spinner-border-sm" />
            Grounding query in AICTE handbook rules...
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-2 border-top bg-white d-flex gap-2">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Ask AICTE rule / quota / violation..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn btn-sm btn-primary" disabled={!query.trim() || loading}>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
