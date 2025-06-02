// src/components/MutationForm.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import "../styles/MutationForm.css";

const MutationForm = ({ onSubmit, isCalculating }) => {
  const [mutation1, setMutation1] = useState("");
  const [mutation2, setMutation2] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mutation1.trim() && mutation2.trim()) {
      onSubmit(mutation1, mutation2);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mutation-form">
      <div className="inputs">
        <label htmlFor="mutation1" className="label">
          Mutation 1
        </label>
        <input
          id="mutation1"
          type="text"
          className="input"
          placeholder="e.g., c.2663C>A or p.S888X"
          value={mutation1}
          onChange={(e) => setMutation1(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="mutation2" className="label">
          Mutation 2
        </label>
        <input
          id="mutation2"
          type="text"
          className="input"
          placeholder="e.g., c.1060_1062delTTC or p.Phe354del"          
          value={mutation2}
          onChange={(e) => setMutation2(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        className="btn"
        disabled={isCalculating || !mutation1.trim() || !mutation2.trim()}
      >
        {isCalculating ? "Calculating…" : "Calculate Score"}
      </button>
    </form>
  );
};

export default MutationForm;
