import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

const API_BASE = 'http://localhost:5001/api';

const App = () => {
  const [step, setStep] = useState(0); // 0: Mode, 1: Name, 2: Voice, 3: Face, 4: Result
  const [mode, setMode] = useState(''); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [imageBlob, setImageBlob] = useState(null);
  const [status, setStatus] = useState('Idle');
  const [isRecording, setIsRecording] = useState(false);
  const [authResult, setAuthResult] = useState(null);
  
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Audio Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        setAudioBlob(new Blob(audioChunksRef.current, { type: 'audio/wav' }));
        setStatus('Voice Captured');
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setStatus('Recording (4s)...');
      setTimeout(() => stopRecording(), 4000);
    } catch (err) {
      setStatus('Mic Error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const capturePhoto = () => {
    const screenshot = webcamRef.current.getScreenshot();
    if (screenshot) {
      fetch(screenshot).then(res => res.blob()).then(blob => {
        setImageBlob(blob);
        setStatus('Face Captured');
      });
    }
  };

  const handleSubmit = async () => {
    setStatus(mode === 'login' ? 'Verifying...' : 'Registering...');
    const formData = new FormData();
    formData.append('username', username);
    formData.append('audio', audioBlob, 'voice.wav');
    formData.append('image', imageBlob, 'face.jpg');

    try {
      const endpoint = mode === 'login' ? '/verify_voice' : '/register';
      const res = await axios.post(`${API_BASE}${endpoint}`, formData);
      setAuthResult(res.data);
      setStep(4);
    } catch (err) {
      setAuthResult({ success: false, message: 'Server error' });
      setStep(4);
    }
  };

  const reset = () => {
    setStep(0);
    setMode('');
    setUsername('');
    setAudioBlob(null);
    setImageBlob(null);
    setAuthResult(null);
    setStatus('Idle');
  };

  // UI Panels
  const renderStep = () => {
    switch(step) {
      case 0: return (
        <div>
          <h2>Welcome</h2>
          <div style={styles.btnGroup}>
            <button style={styles.btnMain} onClick={() => { setMode('login'); setStep(1); }}>Login</button>
            <button style={styles.btnSecondary} onClick={() => { setMode('register'); setStep(1); }}>Register</button>
          </div>
        </div>
      );
      case 1: return (
        <div>
          <h2>Who are you?</h2>
          <input 
            style={styles.input} 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            placeholder="Enter Username"
          />
          <div style={styles.btnGroup}>
            <button style={styles.btnSecondary} onClick={() => setStep(0)}>Back</button>
            <button style={styles.btnMain} disabled={!username} onClick={() => setStep(2)}>Next</button>
          </div>
        </div>
      );
      case 2: return (
        <div>
          <h2>Voice Verification</h2>
          <p>Click record and speak for 4 seconds</p>
          <button 
            style={{...styles.btnMain, backgroundColor: isRecording ? '#ff4444' : '#007bff'}} 
            onClick={startRecording} 
            disabled={isRecording}
          >
            {isRecording ? 'Recording...' : 'Start Recording'}
          </button>
          <div style={styles.btnGroup}>
            <button style={styles.btnSecondary} onClick={() => setStep(1)}>Back</button>
            <button style={styles.btnMain} disabled={!audioBlob} onClick={() => setStep(3)}>Next</button>
          </div>
        </div>
      );
      case 3: return (
        <div>
          <h2>Face Verification</h2>
          <Webcam ref={webcamRef} screenshotFormat="image/jpeg" style={styles.webcam} />
          <button style={styles.btnMain} onClick={capturePhoto}>Capture Photo</button>
          <div style={styles.btnGroup}>
            <button style={styles.btnSecondary} onClick={() => setStep(2)}>Back</button>
            <button style={styles.btnMain} disabled={!imageBlob} onClick={handleSubmit}>Finish</button>
          </div>
        </div>
      );
      case 4: return (
        <div>
          <h2 style={{color: authResult?.success ? '#28a745' : '#dc3545'}}>
            {authResult?.success ? 'Success!' : 'Failed'}
          </h2>
          <p>{authResult?.message || (authResult?.success ? `Welcome ${username}` : 'Access Denied')}</p>
          <button style={styles.btnMain} onClick={reset}>Restart</button>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.progress}>Step {step + 1} of 5</div>
        {renderStep()}
        <div style={styles.statusBar}>{status}</div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' },
  card: { backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', width: '450px' },
  progress: { fontSize: '12px', color: '#888', marginBottom: '10px', textTransform: 'uppercase' },
  btnGroup: { display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' },
  btnMain: { padding: '12px 25px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  btnSecondary: { padding: '12px 25px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  input: { padding: '12px', width: '100%', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px', boxSizing: 'border-box' },
  webcam: { width: '100%', borderRadius: '10px', marginBottom: '10px' },
  statusBar: { marginTop: '20px', fontSize: '13px', color: '#555', fontStyle: 'italic' }
};

export default App;