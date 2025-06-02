// src/components/ScoreCard.jsx
import React from "react";
import PropTypes from "prop-types";
import "../styles/ScoreCard.css";

const descriptions = {
    1: "Very mild: Genetic changes are typically less disruptive. Symptoms may appear later in life and progress slowly.",
    2: "Mild: Mutations are slightly more impactful, with symptoms like diabetes possibly appearing somewhat earlier.",
    3: "Moderate: Both mutations affect key areas of the protein, which may lead to earlier or more noticeable symptoms.",
    4: "Moderate to significant: One mutation is more severe, though the other is milder. Symptoms may begin in mid-childhood.",
    5: "Severe: At least one major mutation affects a critical part of the protein, often leading to early symptom onset.",
    6: "Very severe: Both mutations are highly disruptive. Symptoms such as diabetes and vision problems typically begin very early in life."
  };
  

const ScoreCard = ({ score, isCalculating }) => {

  const getProgressColorClass = (score) => {
    if (score <= 2) return "progress-green";
    if (score <= 4) return "progress-amber";
    return "progress-red";
  };

  return (
    <div className="score-card">
      <div className="score-card-header">
        <h2 className="score-card-title">Disease Severity Score</h2>
      </div>
      <div className="score-card-content">
        {isCalculating ? (
          <div className="centered-content">
            <div className="loader" />
            <p className="loading-text">Calculating score...</p>
          </div>
        ) : score === null ? (
          <div className="centered-content">
            <div className="help-icon">?</div>
            <p className="help-text">
              Enter mutation details and click “Calculate Score” to see the impact assessment
            </p>
          </div>
        ) : (
          <>
            <div className="score-display">
              <div className="score-circle">
                <span className="score-number">{score}</span>
              </div>
            </div>
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className={`progress-indicator ${getProgressColorClass(score)}`}
                  style={{ width: `${(score / 6) * 100}%` }}
                />
              </div>
              <div className="progress-labels">
                <span>Low Impact</span>
                <span>High Impact</span>
              </div>
            </div>
            <p className="description">{descriptions[score]}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ScoreCard;
