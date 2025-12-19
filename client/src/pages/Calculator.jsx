// src/Calculator.jsx
import React, { useState, useEffect, useRef } from "react";
import MutationForm from "../components/MutationForm";
import ScoreCard from "../components/ScoreCard";
import "../styles/Calculator.css";
import { getScore } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Info2 from "../components/Info2";

const Calculator = () => {
  const [score, setScore] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState();
  const [showInfo, setShowInfo] = useState(false);
  const [isInfoClosed, setIsInfoClosed] = useState(true);
  const infoRef = useRef(null);

  const calculateMutationScore = async (m1, m2) => {
    setError(null);
    setScore(null);
    setIsCalculating(true);

    const MIN_DURATION = 1000; // 2 seconds
    const startTime = Date.now();

    try {
      const response = await getScore(m1, m2);
      if (response.error) {
        setError(response.error);
        setIsCalculating(false);
      } else {
        setScore(response.score);
        console.log(`Score ${response.score} for, { m1, m2 }`);
      }
    } catch (err) {
      console.error("Failed to get score:", err);
      setError("Request failed. Try again or contact support @l.j.oiknine@wustl.edu");
      setIsCalculating(false);
    } finally {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_DURATION - elapsed);
      setTimeout(() => setIsCalculating(false), remainingTime);
    }
  };

  useEffect(() => {
    if (showInfo && infoRef.current) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        infoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [showInfo]);

  return (
    <>
      <Navbar 
        title="Severity Score Calculator" 
        current="calc"
        showHelpButton={true}
        onHelpClick={() => setIsInfoClosed(!isInfoClosed)}
      ></Navbar>
      <div className="page-container">
        <Info2 isClosed={isInfoClosed} onToggle={() => setIsInfoClosed(true)} variant="calculator" />
        <main className="main">
          <section className="card">
            {error && <div id="error">{error}</div>}
            <MutationForm
              onSubmit={calculateMutationScore}
              isCalculating={isCalculating}
            />
          </section>

          <section className="card">
            <ScoreCard score={score} isCalculating={isCalculating} />
          </section>
        </main>

        <div className="info" ref={infoRef}>
          {showInfo ? (
            <div className="info-expanded">
  <button onClick={() => setShowInfo(false)}>Hide Expected Mutation Form</button>
  <div className="info-content">
    <div className="left-side">
      <h4>Expected Notation Form:</h4>
      <p>
        Mutation entries are expected in standard form of either protein or coding sequence notation. Deviations from these standards could result in failures or miscalculations-- this includes spaces within the entry, spelling errors, and extraneous or unrecognized characters. See the examples of acceptable entries for reference, or consult other online resources for determining notation for a given mutation. Email l.j.oiknine@wustl.edu with any specific concerns.
      </p>
    </div>
    <div className="right-side">
      <h4>Examples:</h4>
      <table>
        <thead>
          <tr>
            <th>Protein (p.)</th>
            <th>Coding (c.)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>p.Pro346Leu*</td>
            <td>c.1037C&gt;T</td>
          </tr>
          <tr>
            <td>p.Ile421Hisfs*122</td>
            <td>c.1260dup</td>
          </tr>
          <tr>
            <td>p.Val415del</td>
            <td>c.1243_1245delGTG</td>
          </tr>
          <tr>
            <td>p.Phe354del</td>
            <td>c.1060_1062delTTC</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

          ) : (
            <div className="info-collapsed">
              <button onClick={() => setShowInfo(true)}>See Expected Mutation Form</button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Calculator;
