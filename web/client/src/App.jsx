import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, UserPlus, LogIn, Mic, Camera, CheckCircle,
  XCircle, ArrowLeft, Trash2, RefreshCw, LogOut, ScanFace, Users, Clock
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const formatDateTime = (str) => {
  if (!str) return '—';
  const d = new Date(str.replace(' ', 'T'));
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

const App = () => {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState('');
  const [username, setUsername] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [imageBlob, setImageBlob] = useState(null);
  const [status, setStatus] = useState('Select an authentication method');
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(4);
  const [authResult, setAuthResult] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [dashboardOrigin, setDashboardOrigin] = useState(0);

  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const pv = { initial: { opacity: 0, x: 20 }, in: { opacity: 1, x: 0 }, out: { opacity: 0, x: -20 } };
  const pt = { type: 'tween', ease: 'anticipate', duration: 0.4 };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) =>
        e.data.size > 0 && audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        setAudioBlob(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
        setStatus('Voice captured successfully');
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatus('Recording...');
      setTimeLeft(4);
      const timer = setInterval(() =>
        setTimeLeft(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; }), 1000);
      setTimeout(() => stopRecording(), 4000);
    } catch {
      setStatus('Microphone access denied or error occurred');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const capturePhoto = () => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      fetch(screenshot).then(r => r.blob()).then(blob => {
        setImageBlob(blob);
        setStatus('Face captured. Ready to verify.');
      });
    }
  };

  const handleSubmit = async () => {
    setStep(4);
    setStatus('Verifying identity...');
    try {
      if (mode === 'login') {
        const voiceForm = new FormData();
        voiceForm.append('audio', audioBlob, 'voice.webm');
        const resVoice = await axios.post(`${API_BASE}/verify_voice`, voiceForm);
        if (!resVoice.data.success) {
          setAuthResult({ success: false, message: 'Voice recognition failed. Access Denied.' });
          setStatus(''); setStep(5); return;
        }
        const recognizedUser = resVoice.data.user;
        const faceForm = new FormData();
        faceForm.append('image', imageBlob, 'face.jpg');
        faceForm.append('username', recognizedUser);
        const resFace = await axios.post(`${API_BASE}/verify_face`, faceForm);
        if (!resFace.data.success) {
          setAuthResult({ success: false, message: 'Face recognition failed. Access Denied.' });
          setStatus(''); setStep(5); return;
        }
        setUsername(recognizedUser);
        setAuthResult({ success: true, message: `Welcome back, ${recognizedUser}!` });
        setStatus('');
        setStep(6);
      } else {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('audio', audioBlob, 'voice.webm');
        formData.append('image', imageBlob, 'face.jpg');
        const res = await axios.post(`${API_BASE}/register`, formData);
        setAuthResult(res.data);
        setStatus('');
        setStep(mode === 'update' ? 6 : 5);
      }
    } catch {
      setAuthResult({ success: false, message: 'Server communication error occurred.' });
      setStatus(''); setStep(5);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account?')) return;
    try {
      const res = await axios.post(`${API_BASE}/delete_user`, { username });
      if (res.data.success) reset();
    } catch { /* silent */ }
  };

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get(`${API_BASE}/users`);
      if (res.data.success) setAllUsers(res.data.users);
    } catch { /* silent */ }
    setLoadingUsers(false);
  };

  const reset = () => {
    setStep(0); setMode(''); setUsername('');
    setAudioBlob(null); setImageBlob(null); setAuthResult(null);
    setStatus('Select an authentication method');
  };

  // ── Full-page dashboard (step 7) ──
  if (step === 7) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}
        style={{ minHeight: '100vh', width: '100%', background: 'var(--bg-color)', fontFamily: 'Inter, sans-serif' }}>

        {/* Sticky top nav */}
        <div style={{
          background: '#fff', borderBottom: '1px solid var(--border)', padding: '0 40px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 6px rgba(0,0,0,0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={24} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>SpeakerAuth</span>
            <span style={{ marginLeft: 4, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>Dashboard</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" style={{ padding: '8px 14px' }} onClick={fetchAllUsers} title="Refresh">
              <RefreshCw size={15} />
            </button>
            <button className="btn btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setStep(dashboardOrigin)}>
              <ArrowLeft size={15} /> {dashboardOrigin === 6 ? 'My Dashboard' : 'Home'}
            </button>
          </div>
        </div>

        {/* Page body */}
        <div style={{ padding: '36px 40px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: 4 }}>User Overview</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>All registered users and their login activity.</p>
          </div>

          {/* Stat tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { label: 'Total Users', value: allUsers.length, color: 'var(--primary)', bg: 'rgba(37,99,235,0.07)', icon: <Users size={22} /> },
              { label: 'Total Logins', value: allUsers.reduce((s, u) => s + u.total_logins, 0), color: 'var(--success)', bg: 'rgba(16,185,129,0.07)', icon: <ShieldCheck size={22} /> },
              { label: 'Active Users', value: allUsers.filter(u => u.total_logins > 0).length, color: '#f59e0b', bg: 'rgba(245,158,11,0.07)', icon: <LogIn size={22} /> },
            ].map(tile => (
              <div key={tile.label} style={{ background: '#fff', borderRadius: 16, padding: '22px 24px', border: '1px solid var(--border)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: tile.bg, color: tile.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {tile.icon}
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>{tile.label}</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, color: tile.color, lineHeight: 1 }}>{tile.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Users table */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 2fr', padding: '14px 24px', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
              {['User', 'Total Logins', 'Last Login'].map(h => (
                <span key={h} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
              ))}
            </div>
            {loadingUsers ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
            ) : allUsers.length === 0 ? (
              <div style={{ padding: '50px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Users size={40} style={{ marginBottom: 12, opacity: 0.25 }} />
                <p>No registered users yet.</p>
              </div>
            ) : allUsers.map((u, idx) => (
              <div key={u.username}
                style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 2fr', padding: '16px 24px', alignItems: 'center', borderBottom: idx < allUsers.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: `hsl(${(idx * 47) % 360}, 60%, 90%)`, color: `hsl(${(idx * 47) % 360}, 60%, 35%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>
                    {u.username[0].toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{u.username}</span>
                </div>
                <div>
                  <span style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
                    {u.total_logins}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <Clock size={13} />
                  <span>{u.last_login ? formatDateTime(u.last_login) : '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Auth card (all other steps) ──
  return (
    <div className="app-container">
      <div className="auth-card">

        {step <= 3 && (
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${(step / 3) * 100}%` }} />
          </div>
        )}

        <AnimatePresence mode="wait">

          {step === 0 && (
            <motion.div key="s0" initial={pv.initial} animate={pv.in} exit={pv.out} transition={pt}>
              <h2>Secure Access</h2>
              <p className="subtitle">Choose how you want to proceed</p>
              <div className="mode-grid">
                <button className="mode-btn" onClick={() => { setMode('login'); setStep(2); setStatus('Record your voice'); }}>
                  <LogIn size={32} /><span>Login</span>
                </button>
                <button className="mode-btn" onClick={() => { setMode('register'); setStep(1); setStatus('Choose a username'); }}>
                  <UserPlus size={32} /><span>Register</span>
                </button>
              </div>
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-secondary" style={{ width: '100%' }}
                  onClick={() => { setDashboardOrigin(0); fetchAllUsers(); setStep(7); }}>
                  <Users size={20} /> View Dashboard
                </button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={pv.initial} animate={pv.in} exit={pv.out} transition={pt}>
              <h2>Identity Check</h2>
              <p className="subtitle">Choose a username for your new profile</p>
              <div className="input-group">
                <label className="input-label">Username</label>
                <input className="modern-input" value={username}
                  onChange={e => setUsername(e.target.value)} placeholder="e.g. john_doe" autoFocus />
              </div>
              <div className="btn-group">
                <button className="btn btn-secondary" onClick={() => { setStep(0); setStatus('Select an authentication method'); }}>
                  <ArrowLeft size={18} /> Back
                </button>
                <button className="btn btn-primary" disabled={!username.trim()}
                  onClick={() => { setStep(2); setStatus('Record your voice'); }}>
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={pv.initial} animate={pv.in} exit={pv.out} transition={pt}>
              <h2>Voice Print</h2>
              <p className="subtitle">Record 4 seconds of your voice.</p>
              <div className="waveform-container">
                {[1,2,3,4,5,6,7,8,9,10].map(i => (
                  <motion.div key={i} className="wave-bar"
                    animate={{ height: isRecording ? [20, Math.random() * 80 + 20, 20] : 10 }}
                    transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5 }} />
                ))}
              </div>
              <button className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`}
                onClick={startRecording} disabled={isRecording}
                style={{ width: '100%', marginBottom: 24 }}>
                <Mic size={20} />
                {isRecording ? `Recording... ${timeLeft}s` : (audioBlob ? 'Re-record' : 'Start Recording')}
              </button>
              <div className="btn-group">
                <button className="btn btn-secondary" disabled={isRecording}
                  onClick={() => {
                    if (mode === 'login') { setStep(0); setStatus('Select an authentication method'); }
                    else if (mode === 'update') setStep(6);
                    else { setStep(1); setStatus('Enter username'); }
                  }}>
                  <ArrowLeft size={18} /> Back
                </button>
                <button className="btn btn-primary" disabled={!audioBlob || isRecording}
                  onClick={() => { setStep(3); setStatus('Position your face'); }}>
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={pv.initial} animate={pv.in} exit={pv.out} transition={pt}>
              <h2>Facial Scan</h2>
              <p className="subtitle">
                {imageBlob ? 'Photo captured! Ready to proceed.' : 'Position your face and capture a photo.'}
              </p>
              <div className="media-container">
                {!imageBlob ? (
                  <Webcam ref={webcamRef} screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: 'user' }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={URL.createObjectURL(imageBlob)} alt="Captured"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <button className="btn btn-secondary"
                onClick={imageBlob ? () => setImageBlob(null) : capturePhoto}
                style={{ width: '100%', marginBottom: 24 }}>
                <Camera size={20} />
                {imageBlob ? 'Retake Photo' : 'Capture Photo'}
              </button>
              <div className="btn-group">
                <button className="btn btn-secondary" onClick={() => { setStep(2); setStatus('Record your voice'); }}>
                  <ArrowLeft size={18} /> Back
                </button>
                <button className="btn btn-primary" disabled={!imageBlob} onClick={handleSubmit}>
                  <ShieldCheck size={20} />
                  {mode === 'login' ? 'Authenticate' : mode === 'update' ? 'Save Biometrics' : 'Register'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="s4" initial={pv.initial} animate={pv.in} exit={pv.out} transition={pt} style={{ paddingBlock: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {[1, 2, 3].map(i => (
                    <motion.div key={i}
                      style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', border: '2px solid var(--primary)', opacity: 0 }}
                      animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                      transition={{ repeat: Infinity, duration: 2, delay: i * 0.5, ease: 'easeOut' }} />
                  ))}
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                      <ScanFace size={40} color="var(--primary)" />
                    </motion.div>
                  </div>
                </div>
                <h2>Verifying Identity</h2>
                <p className="subtitle">Please wait while we process your biometrics…</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[0, 1, 2].map(i => (
                    <motion.div key={i}
                      style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }}
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="s5" initial={pv.initial} animate={pv.in} exit={pv.out} transition={pt}>
              <div className={`result-icon ${authResult?.success ? 'result-success' : 'result-error'}`}>
                {authResult?.success ? <CheckCircle size={32} /> : <XCircle size={32} />}
              </div>
              <h2>{authResult?.success ? 'Success!' : 'Failed'}</h2>
              <p className="subtitle" style={{ color: authResult?.success ? 'var(--success)' : 'var(--danger)', fontSize: '1.1rem' }}>
                {authResult?.message ?? (authResult?.success ? `Action completed for ${username}` : 'Access Denied')}
              </p>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 30 }} onClick={reset}>
                Done
              </button>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div key="s6" initial={pv.initial} animate={pv.in} exit={pv.out} transition={pt}>
              <h2>Dashboard</h2>
              <p className="subtitle">Welcome back, <strong>{username}</strong>!</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 32 }}>
                <button className="btn btn-primary" onClick={() => {
                  setMode('update'); setAudioBlob(null); setImageBlob(null);
                  setStep(2); setStatus('Update your voice print');
                }}>
                  <RefreshCw size={20} /> Update Biometrics
                </button>
                <button className="btn btn-secondary" onClick={() => {
                  setDashboardOrigin(6); fetchAllUsers(); setStep(7);
                }}>
                  <Users size={20} /> View All Users
                </button>
                <button className="btn btn-danger" onClick={handleDeleteAccount}>
                  <Trash2 size={20} /> Delete Account
                </button>
                <button className="btn btn-secondary" onClick={reset}>
                  <LogOut size={20} /> Sign Out
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {status && (
          <div className="status-bar">
            <div className={`status-dot ${isRecording || step === 4 ? 'active' : ''}`} />
            <span>{status}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;