import React, { useState, useEffect } from 'react';
import '../styles/StartupPopup.css';

function StartupPopup() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Check if popup has been shown before
    const hasSeenPopup = localStorage.getItem('hasSeenStartupPopup');
    
    if (!hasSeenPopup) {
      // Show popup on first load
      setShowPopup(true);
    }
  }, []);

  const handleClose = () => {
    setShowPopup(false);
    // Mark that user has seen the popup
    localStorage.setItem('hasSeenStartupPopup', 'true');
  };

  if (!showPopup) {
    return null;
  }

  return (
    <div className="startup-popup-overlay" onClick={handleClose}>
      <div className="startup-popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="startup-popup-close" onClick={handleClose}>×</button>
        <div className="startup-popup-body">
          <h2>Welcome!</h2>
          <p>
            Please note that this application is running on a free-tier server that spins down after inactivity.
            The first load may take 30-60 seconds while the server starts up.
          </p>
          <p>
            Thank you for your patience!
          </p>
          <button className="startup-popup-button" onClick={handleClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

export default StartupPopup;

