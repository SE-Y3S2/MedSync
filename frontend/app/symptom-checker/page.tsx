'use client';

import React, { useState, useEffect } from 'react';
import { symptomApi } from '../services/api';
import { Card, Button, Badge, showToast } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Hourglass, Search, ScrollText, Brain, AlertTriangle, FileText } from 'lucide-react';

const commonSymptoms = [
  'Headache', 'Fever', 'Cough', 'Sore throat', 'Chest pain',
  'Shortness of breath', 'Nausea', 'Stomach pain', 'Rash',
  'Joint pain', 'Back pain', 'Dizziness', 'Fatigue',
  'Blurred vision', 'Anxiety', 'Insomnia', 'Wheezing',
  'Frequent urination', 'Ear pain', 'Numbness'
];

const urgencyColors: Record<string, string> = {
  low: 'var(--success)',
  medium: 'var(--warning)',
  high: 'var(--error)',
  emergency: 'var(--emergency)'
};

export default function SymptomCheckerPage() {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user?.id) return;
    try {
      const data = await symptomApi.getHistory(user.id);
      setHistory(data);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleChip = (symptom: string) => {
    setSelectedChips(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const allSymptoms = [...selectedChips, symptoms].filter(Boolean).join(', ');
    if (!allSymptoms.trim()) {
      showToast('Please enter or select at least one symptom.', 'warning');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await symptomApi.analyzeSymptoms(allSymptoms, user?.id);
      setResult(data);
      fetchHistory();
    } catch (error) {
      showToast('Error analyzing symptoms.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setSymptoms('');
    setSelectedChips([]);
    setResult(null);
  };

  return (
    <div className="animate-in">
      <h1 className="page-title">AI Symptom Checker</h1>
      <p className="page-subtitle">
        Describe your symptoms and receive AI-powered specialist recommendations with urgency assessment
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: showHistory ? '1fr 380px' : '1fr', gap: '24px' }}>
        <div>
          <Card title="How are you feeling?" icon={<Stethoscope size={20} />}>
            <form onSubmit={handleAnalyze}>
              {/* Quick Symptom Chips */}
              <div style={{ marginBottom: '20px' }}>
                <label className="med-label">Quick Select Common Symptoms</label>
                <div className="chips-container">
                  {commonSymptoms.map((symptom) => (
                    <button
                      key={symptom}
                      type="button"
                      className={`symptom-chip ${selectedChips.includes(symptom) ? 'selected' : ''}`}
                      onClick={() => toggleChip(symptom)}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected chips display */}
              {selectedChips.length > 0 && (
                <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary)' }}>
                    Selected: {selectedChips.join(', ')}
                  </span>
                </div>
              )}

              {/* Text input */}
              <div className="med-input-group">
                <label className="med-label">Describe Additional Symptoms</label>
                <textarea
                  className="med-input"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={3}
                  placeholder="E.g., I've been experiencing dull chest pain for the last 3 days along with shortness of breath..."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button type="submit" disabled={loading} icon={loading ? <Hourglass size={16} /> : <Search size={16} />}>
                  {loading ? 'Analyzing...' : 'Analyze Symptoms'}
                </Button>
                <Button variant="secondary" onClick={clearForm}>Clear</Button>
                {user?.id && (
<<<<<<< Updated upstream
                  <Button variant="secondary" onClick={() => setShowHistory(!showHistory)} icon={<ScrollText size={16} />}>
=======
                  <Button variant="secondary" onClick={() => setShowHistory(!showHistory)} icon="📜">
>>>>>>> Stashed changes
                    {showHistory ? 'Hide' : 'Show'} History
                  </Button>
                )}
              </div>

              <p className="disclaimer" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>This AI tool provides preliminary suggestions based on keyword analysis. It is NOT a replacement for professional medical advice, diagnosis, or treatment.</span>
              </p>
            </form>
          </Card>

          {/* ── Results ── */}
          {result && (
            <Card title="AI Analysis Results" icon={<Brain size={20} />}>
              {/* Overall urgency & AI Summary */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <span style={{ fontWeight: 600 }}>Overall Urgency:</span>
                  <Badge text={result.overallUrgency.toUpperCase()} variant={result.overallUrgency} />
                  {result.overallUrgency === 'emergency' && (
                    <span style={{ color: 'var(--emergency)', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={16} /> SEEK IMMEDIATE MEDICAL ATTENTION
                    </span>
                  )}
                </div>

                {result.aiSummary && (
                  <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--primary)' }}>
                    <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-primary)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <FileText size={20} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--primary)' }} />
                      <span><strong>AI Insights:</strong> {result.aiSummary}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Matched Specialties */}
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>
                Recommended Specialties ({result.results.length})
              </h3>

              {result.results.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className={`result-card urgency-${item.urgency}`}
                  style={{ animationDelay: `${idx * 0.15}s` }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{item.specialty}</h4>
                    <Badge text={item.urgency.toUpperCase()} variant={item.urgency} />
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    {item.suggestions}
                  </p>
                  {item.matchedKeywords && item.matchedKeywords.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {item.matchedKeywords.map((kw: string, kwIdx: number) => (
                        <span key={kwIdx} style={{
                          padding: '3px 8px', fontSize: '0.75rem', borderRadius: '10px',
                          background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)'
                        }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Disclaimer */}
              <div style={{ marginTop: '20px', padding: '16px', background: '#fffbeb', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a' }}>
                <p style={{ fontSize: '0.85rem', color: '#92400e', fontStyle: 'italic' }}>
                  {result.disclaimer}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* ── History Sidebar ── */}
        {showHistory && (
          <div className="animate-in">
            <Card title="Past Checks" icon={<ScrollText size={20} />}>
              {history.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><ScrollText size={48} /></div>
                  <h3>No History</h3>
                  <p>Your past symptom checks will appear here.</p>
                </div>
              ) : (
                history.map((item: any, idx: number) => (
                  <div key={idx} className="history-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <Badge text={item.overallUrgency?.toUpperCase() || 'LOW'} variant={item.overallUrgency || 'low'} />
                      <small style={{ color: 'var(--text-muted)' }}>
                        {new Date(item.timestamp).toLocaleDateString()}
                      </small>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      {item.symptoms.length > 60 ? item.symptoms.substring(0, 60) + '...' : item.symptoms}
                    </p>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {item.results.map((r: any, rIdx: number) => (
                        <span key={rIdx} style={{
                          fontSize: '0.7rem', padding: '2px 6px',
                          background: 'var(--primary-light)', color: 'var(--primary)',
                          borderRadius: '10px'
                        }}>{r.specialty}</span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
