import { useState } from 'react';
import './App.css';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function generateEmailWithGemini({ topic, name, recipient, phone, email, schoolName, classSection, rollNo, dates, letterDate, mode, language, docType }) {
  let prompt = '';

  if (docType === 'school') {
    if (language === 'hindi') {
      prompt = `You are a professional assistant writing a school leave application.

Write a leave application strictly in HINDI based on exactly these details:
- Reason / Context: ${topic}
- Student's Name: ${name || '[आपका नाम]'}
- Addressed To: ${recipient || 'प्रधानाचार्य महोदय'}
- School Name: ${schoolName || '[विद्यालय का नाम]'}
- Class & Section: ${classSection || '[आपकी कक्षा/वर्ग]'}
- Roll No: ${rollNo || '[रोल नंबर]'}
- Dates of Leave: ${dates || '[प्रारंभ तिथि से अंतिम तिथि]'}
- Date of Letter writing: ${letterDate || '[आज की तिथि]'}

CRITICAL INSTRUCTION - FORMAT REQUIREMENTS:
You MUST output the letter in Hindi using EXACTLY the following structure. Do not add English words except for strict nouns if required:

सेवा में,
${recipient || 'प्रधानाचार्य महोदय'}
${schoolName || '[विद्यालय का नाम]'}
[शहर/स्थान का नाम]
दिनांक: ${letterDate || '[आज की तिथि]'}

विषय: अवकाश हेतु प्रार्थना पत्र

महोदय/महोदया,

सविनय निवेदन है कि मैं ${name || '[आपका नाम]'}, आपके विद्यालय की कक्षा ${classSection || '[आपकी कक्षा/वर्ग]'} का छात्र/छात्रा हूँ। मुझे ${dates || '[प्रारंभ तिथि से अंतिम तिथि]'} तक विद्यालय आने में असमर्थता होगी क्योंकि ${topic || '[कारण – उदा. मुझे तेज़ बुखार है/पारिवारिक कार्य है]'}.

अतः आपसे निवेदन है कि मुझे उक्त अवधि के लिए अवकाश प्रदान करने की कृपा करें। मैं विश्वास दिलाता/दिलाती हूँ कि मैं पढ़ाई के इस नुकसान की भरपाई अवश्य कर लूँगा/लूँगी।

सधन्यवाद।

आपका आज्ञाकारी शिष्य / आपकी आज्ञाकारी शिष्या,
${name || '[आपका नाम]'}
कक्षा: ${classSection || '[कक्षा एवं वर्ग]'}
अनुक्रमांक: ${rollNo || '[रोल नंबर]'}

Adjust the sentences naturally to fit the exact reason provided, but stick strictly to this formal Hindi structural layout. Do not add any extra commentary or output.`;

    } else {
      prompt = `You are a professional assistant writing a school leave application.

Write a leave application in English based on exactly these details:
- Reason / Context: ${topic}
- Student's Name: ${name || '[Your Name]'}
- Addressed To: ${recipient || 'The Principal'}
- School Name: ${schoolName || '[School Name]'}
- Class & Section: ${classSection || '[Your Class/Section]'}
- Roll No: ${rollNo || '[Roll Number]'}
- Dates of Leave: ${dates || '[Start Date to End Date]'}
- Date of Letter writing: ${letterDate || '[Current Date]'}

CRITICAL INSTRUCTION - FORMAT REQUIREMENTS:
You MUST output the letter using EXACTLY the following structure:

To
${recipient || 'The Principal'}
${schoolName || '[School Name]'}
[School Name/City]
Date: ${letterDate || '[Current Date]'}

Subject: Application for Leave

Respected Sir/Madam,

I am ${name || '[Your Name]'}, a student of class ${classSection || '[Your Class/Section]'}. I am unable to attend school from ${dates || '[Start Date to End Date]'} due to ${topic || '[reason – e.g., illness, family function]'}.

I kindly request you to grant me leave for the mentioned period. I assure you that I will cover up the missed lessons.

Thank you for your understanding.

Yours obediently,
${name || '[Your Name]'}
Class: ${classSection || '[Class & Section]'}
Roll No.: ${rollNo || '[Roll Number]'}

Adjust the sentences slightly to naturally fit the exact reason provided, but stick strictly to this structural layout. Do not add any extra commentary or output.`;
    }
  } else {
    prompt = `You are a professional email writing assistant.

Write a ${mode === 'formal' ? 'formal and professional' : 'friendly and informal'} email in ${language === 'hindi' ? 'Hindi' : 'English'} language based on the following details:

- Topic / Purpose: ${topic}
- Sender's Name: ${name || 'N/A'}
- Recipient: ${recipient || 'N/A'}
- Sender's Phone: ${phone || 'N/A'}
- Sender's Email: ${email || 'N/A'}

Instructions:
1. Start with "Subject: ..." or "विषय: ..." on the first line.
2. Then write the full email body below.
3. Use a proper greeting, well-structured paragraphs, and a closing signature.
4. If formal, use professional language. If informal, keep it warm and conversational.
5. Include sender's phone and email only in the signature if provided.
6. Make sure the main content is written eloquently in the requested language.
7. Do NOT write any commentary or explanation — output ONLY the email itself.`;
  }

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
    topic: '', name: '', recipient: '', phone: '', email: '',
    schoolName: '', classSection: '', rollNo: '', dates: '', letterDate: ''
  });
  const [docType, setDocType] = useState('email');
  const [mode, setMode] = useState('formal');
  const [language, setLanguage] = useState('english');
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
      setError(`Please enter the ${docType === 'email' ? 'email topic' : 'reason for leave'}!`);
      return;
    }
    setError('');
    setLoading(true);
    setOutput('');

    try {
      const result = await generateEmailWithGemini({ ...form, mode, language, docType });
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

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${docType === 'school' ? 'Leave Application' : 'Email Draft'}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; line-height: 1.6; color: #000; }
            pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; margin: 0; }
            @media print {
              @page { margin: 2cm; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <pre>${output}</pre>
          <script>
            window.onload = function() { 
              window.print(); 
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#nav-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="nav-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
            <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            <path d="M22 6l-10 7L2 6"></path>
          </svg>
          <span>AuraMail <span className="gradient-text">AI</span></span>
        </div>
      </nav>

      <div className="wrapper">
        <header className="hero-section">
          <h1>Write better emails &amp; letters. <br /><span className="gradient-text">10x faster.</span></h1>
          <p className="subtitle">Elevate your communication with advanced AI models.</p>
        </header>

        <div className="card glass-panel">
          <div className="form">
            
            {/* Document Type Selector */}
            <div className="field full">
              <div className="segment-control" style={{ padding: '6px', borderRadius: '16px' }}>
                <div className="segment-bg" style={{ transform: docType === 'email' ? 'translateX(0)' : 'translateX(100%)', borderRadius: '12px' }} />
                <button
                  className={`segment-btn ${docType === 'email' ? 'active' : ''}`}
                  onClick={() => setDocType('email')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M22 6l-10 7L2 6"></path></svg>
                  Email Mode
                </button>
                <button
                  className={`segment-btn ${docType === 'school' ? 'active' : ''}`}
                  onClick={() => setDocType('school')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                  School Letter
                </button>
              </div>
            </div>

            {docType === 'email' ? (
              <>
                {/* Email Fields */}
                <div className="field full">
                  <label>What is the email about? *</label>
                  <div className="input-group">
                    <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    <input name="topic" placeholder="e.g. Leave application for 2 days due to fever" value={form.topic} onChange={handleChange} />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>Your Name</label>
                    <div className="input-group">
                      <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      <input name="name" placeholder="John Doe" value={form.name} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="field">
                    <label>Recipient Name</label>
                    <div className="input-group">
                      <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      <input name="recipient" placeholder="Jane Smith" value={form.recipient} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>Phone Number</label>
                    <div className="input-group">
                      <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      <input name="phone" placeholder="+91 99999 99999" type="tel" value={form.phone} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="field">
                    <label>Email Address</label>
                    <div className="input-group">
                      <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"></circle><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"></path></svg>
                      <input name="email" placeholder="you@company.com" type="email" value={form.email} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* School Letter Fields */}
                <div className="field full">
                  <label>Reason For Leave *</label>
                  <div className="input-group">
                    <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    <input name="topic" placeholder="e.g. High fever, brother's wedding..." value={form.topic} onChange={handleChange} />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>Student Name</label>
                    <div className="input-group">
                      <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      <input name="name" placeholder="John Doe" value={form.name} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="field">
                    <label>Class & Section</label>
                    <div className="input-group">
                      <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20v-6M6 20V10M18 20V4"></path></svg>
                      <input name="classSection" placeholder="e.g. 10th 'A'" value={form.classSection} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>Roll Number</label>
                    <div className="input-group">
                      <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      <input name="rollNo" placeholder="e.g. 21" value={form.rollNo} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="field">
                    <label>School Name</label>
                    <div className="input-group">
                      <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                      <input name="schoolName" placeholder="e.g. DPS Delhi" value={form.schoolName} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>Letter Date (Today's Date)</label>
                    <div className="input-group">
                      <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      <input type="date" name="letterDate" value={form.letterDate} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="field">
                    <label>Leave Dates (From - To)</label>
                    <div className="input-group">
                      <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      <input name="dates" placeholder="e.g. 15 Jan to 17 Jan" value={form.dates} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div className="field full">
                  <label>Addressed To</label>
                  <div className="input-group">
                    <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                    <input name="recipient" placeholder="The Principal" value={form.recipient} onChange={handleChange} />
                  </div>
                </div>
              </>
            )}

            <div className="grid-2">
              <div className="field">
                <label>Style</label>
                <div className="segment-control">
                  <div className="segment-bg" style={{ transform: mode === 'formal' ? 'translateX(0)' : 'translateX(100%)' }} />
                  <button
                    className={`segment-btn ${mode === 'formal' ? 'active' : ''}`}
                    onClick={() => setMode('formal')}
                  >
                    Professional
                  </button>
                  <button
                    className={`segment-btn ${mode === 'informal' ? 'active' : ''}`}
                    onClick={() => setMode('informal')}
                  >
                    Friendly
                  </button>
                </div>
              </div>

              <div className="field">
                <label>Language</label>
                <div className="segment-control">
                  <div className="segment-bg" style={{ transform: language === 'english' ? 'translateX(0)' : 'translateX(100%)' }} />
                  <button
                    className={`segment-btn ${language === 'english' ? 'active' : ''}`}
                    onClick={() => setLanguage('english')}
                  >
                    English
                  </button>
                  <button
                    className={`segment-btn ${language === 'hindi' ? 'active' : ''}`}
                    onClick={() => setLanguage('hindi')}
                  >
                    Hindi
                  </button>
                </div>
              </div>
            </div>

            {error && <div className="error-msg">{error}</div>}
            {retryAfter > 0 && (
              <div className="retry-msg">
                Rate limit reached. Try again in {retryAfter}s.
              </div>
            )}

            <button 
              className="generate-btn" 
              onClick={handleGenerate} 
              disabled={loading || retryAfter > 0}
            >
              <div className="btn-bg"></div>
              <span className="btn-content">
                {loading ? (
                  <><span className="spinner" /> Generating Draft...</>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    {retryAfter > 0 ? `Wait ${retryAfter}s` : 'Generate Email'}
                  </>
                )}
              </span>
            </button>
          </div>
        </div>

        {output && (
          <div className="output-section glass-panel">
            <div className="output-header">
              <span className="output-label">Generated {docType === 'email' ? 'Email' : 'Letter'}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="copy-btn" onClick={handleCopy}>
                  {copied ? (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied</>
                  ) : (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy Text</>
                  )}
                </button>
                <button className="copy-btn" onClick={handleDownloadPDF} style={{ background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> 
                  Save as PDF
                </button>
              </div>
            </div>
            <div className="output-content">
              <pre>{output}</pre>
            </div>
          </div>
        )}

        <footer className="footer">
          Design & Code by <span className="author">avighna</span>
        </footer>
      </div>
    </>
  );
}
