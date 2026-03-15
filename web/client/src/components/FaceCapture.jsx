import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import { ArrowLeft, RefreshCw, ShieldCheck, User } from 'lucide-react';

const FaceCapture = ({ webcamRef, imageBlob, captureImage, handleSubmit, setStep, setStatus, mode, pv, pt }) => (
  <motion.div key="s3" initial={pv.initial} animate={pv.in} exit={pv.out} transition={pt}>
    <h2>Look at the camera</h2>
    <p className="subtitle" style={{ marginBottom: 20 }}>
      {imageBlob ? "Face captured successfully!" : "Ensure your face is clearly visible."}
    </p>
    
    <div className="webcam-container">
      {/* Always show webcam beneath overlay if captured */}
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="webcam-feed"
        videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
      />
      <div className="webcam-guide"></div>
      
      <AnimatePresence>
        {imageBlob && (
          <motion.div 
            className="flash-overlay"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>
    </div>

    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 30 }}>
      <button className="btn btn-primary" onClick={captureImage}>
        <User size={20} /> {imageBlob ? "Retake Photo" : "Capture Face"}
      </button>
    </div>

    {imageBlob && (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="btn-group">
        <button className="btn btn-secondary" onClick={() => { setStep(2); setStatus('Record your voice'); }}>
          <ArrowLeft size={18} /> Back
        </button>
        <button className="btn btn-primary" disabled={!imageBlob} onClick={handleSubmit}>
          <ShieldCheck size={20} />
          {mode === 'login' ? 'Authenticate' : mode === 'update' ? 'Save Biometrics' : 'Register'}
        </button>
      </motion.div>
    )}
  </motion.div>
);

export default FaceCapture;
