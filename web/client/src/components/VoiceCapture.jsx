import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Square, ArrowLeft, Camera } from 'lucide-react';

const VoiceCapture = ({ mode, isRecording, audioBlob, startRecording, stopRecording, setStep, setStatus, pv, pt }) => (
  <motion.div key="s2" initial={pv.initial} animate={pv.in} exit={pv.out} transition={pt}>
    <h2>{mode === 'login' ? 'Identify Yourself' : 'Voice Setup'}</h2>
    <p className="subtitle" style={{ marginBottom: 30 }}>
      {audioBlob ? "Voice captured successfully!" : "Please read the text below aloud."}
    </p>
    
    <div className="phrase-box">
      "My voice is my password and it verifies my identity"
    </div>

    <div style={{ display: 'flex', justifyContent: 'center', margin: '30px 0' }}>
      {!audioBlob ? (
        <button 
          className={`record-btn ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? <Square size={32} /> : <Mic size={32} />}
        </button>
      ) : (
        <div style={{ padding: 20, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
          <Mic size={32} />
        </div>
      )}
    </div>

    <div className="btn-group">
      <button className="btn btn-secondary" onClick={() => { setStep(mode === 'login' || mode === 'update' ? 0 : 1); setStatus(''); }}>
        <ArrowLeft size={18} /> Back
      </button>
      <button className="btn btn-primary" disabled={!audioBlob} onClick={() => { setStep(3); setStatus('Look at the camera'); }}>
        Next <Camera size={18} />
      </button>
    </div>
  </motion.div>
);

export default VoiceCapture;
