import { useState } from 'react';
import './App.css';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function generateEmailWithGemini({ topic, name, recipient, phone, email, mode }) {
  const prompt = `You are a professional email writing assistant.

Write a ${mode === 'formal' ? 'formal and professional' : 'friendly and informal'} email based on the following details:

- Topic / Purpose: ${topic}
- Sender's Name: ${name || 'N/A'}
- Recipient: ${recipient || 'N/A'}
- Sender's Phone: ${phone || 'N/A'}
- Sender's Email: ${email || 'N/A'}

Instructions:
1. Start with "Subject: ..." on the first line.
2. Then write the full email body below.
3. Use a proper greeting, well-structured paragraphs, and a closing signature.
4. If formal, use professional language. If informal, keep it warm and conversational.
5. Include sender's phone and email only in the signature if provided.
6. Use placeholders like [Date], [Company Name] only if genuinely needed.
7. Do NOT write any commentary or explanation — output ONLY the email itself.`;

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Gemini API Error');
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

export default function App() {
  const [form, setForm] = useState({
    topic: '', name: '', recipient: '', phone: '', email: ''
  });
  const [mode, setMode] = useState('formal');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGenerate = async () => {
    if (!form.topic.trim()) {
      setError('Please enter the email topic!');
      return;
    }
    setError('');
    setLoading(true);
    setOutput('');

    try {
      const result = await generateEmailWithGemini({ ...form, mode });
      setOutput(result);
    } catch (err) {
      const msg = err.message || 'Something went wrong';
      if (msg.includes('Quota exceeded') || msg.includes('429')) {
        setError('⚠️ Quota Limit Reached: You have reached the free tier limit. Please wait a minute or upgrade your plan.');
        
        // Extract retry time if available
        const retryMatch = msg.match(/retry in ([\d.]+)s/);
        if (retryMatch) {
          const seconds = Math.ceil(parseFloat(retryMatch[1]));
          setRetryAfter(seconds);
          const interval = setInterval(() => {
            setRetryAfter(prev => {
              if (prev <= 1) {
                clearInterval(interval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } else {
        setError(`Error: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="wrapper">
      <div className="card">
        {/* Header */}
        <header className="header">
          <div className="header-icon">✉️</div>
          <h1>Email Writer <span className="gradient-text">AI</span></h1>
          <p className="subtitle">High-quality professional emails in seconds — Powered by Gemini 2.5 Flash</p>
        </header>

        {/* Form */}
        <div className="form">
          {/* Topic */}
          <div className="field full">
            <label>What is the email about? *</label>
            <input
              name="topic"
              placeholder="e.g. Leave application for 2 days due to fever"
              value={form.topic}
              onChange={handleChange}
            />
          </div>

          {/* Name + Recipient */}
          <div className="grid-2">
            <div className="field">
              <label>Your Name</label>
              <input name="name" placeholder="Enter your full name" value={form.name} onChange={handleChange} />
            </div>
            <div className="field">
              <label>Recipient Name / Role</label>
              <input name="recipient" placeholder="e.g. HR Manager, Sir" value={form.recipient} onChange={handleChange} />
            </div>
          </div>

          {/* Phone + Email */}
          <div className="grid-2">
            <div className="field">
              <label>Your Phone Number</label>
              <input name="phone" placeholder="+91 99999 99999" type="tel" value={form.phone} onChange={handleChange} />
            </div>
            <div className="field">
              <label>Your Email Address</label>
              <input name="email" placeholder="you@example.com" type="email" value={form.email} onChange={handleChange} />
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="field full">
            <label>Writing Style</label>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${mode === 'formal' ? 'active' : ''}`}
                onClick={() => setMode('formal')}
              >
                🏢 Formal
              </button>
              <button
                className={`toggle-btn ${mode === 'informal' ? 'active' : ''}`}
                onClick={() => setMode('informal')}
              >
                😊 Informal
              </button>
            </div>
          </div>

          {/* Error */}
          {error && <div className="error-msg">{error}</div>}
          
          {/* Retry Countdown */}
          {retryAfter > 0 && (
            <div className="retry-msg">
              🔄 Please wait <span className="retry-timer">{retryAfter}s</span> before retrying.
            </div>
          )}

          {/* Generate Button */}
          <button 
            className="generate-btn" 
            onClick={handleGenerate} 
            disabled={loading || retryAfter > 0}
          >
            {loading ? (
              <>
                <span className="spinner" /> Generating with AI...
              </>
            ) : (
              <>⚡ {retryAfter > 0 ? `Wait ${retryAfter}s` : 'Generate Email'}</>
            )}
          </button>
        </div>

        {/* Output */}
        {output && (
          <div className="output-section">
            <div className="output-header">
              <span className="output-label">✨ Generated Email</span>
              <button className="copy-btn" onClick={handleCopy}>
                {copied ? '✅ Copied!' : '📋 Copy Email'}
              </button>
            </div>
            <div className="output-card">
              <pre>{output}</pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="footer">
          Made by <span className="author">avighna</span>
        </footer>
      </div>
    </div>
  );
}
