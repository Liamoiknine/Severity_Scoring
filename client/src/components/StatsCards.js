import React, { useState, useEffect } from 'react';
import '../styles/StatsCards.css';

const manifestationMap = {
  'Diabetes Mellitus': 'dm',
  'Optic Atrophy': 'oa',
  'Hearing Loss': 'hl',
  'Diabetes Insipidus': 'di'
};

export default function StatsCards({ manifestation, sex, severity, selectedPlot }) {
  const [statsRaw, setStatsRaw] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const manifestationKey =
    manifestation && Array.isArray(manifestation) && manifestation.length === 2
      ? manifestationMap[manifestation[0]]
      : manifestationMap[manifestation] || 'all';

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (sex) params.append('sex', sex);
        if (severity) params.append('severity', severity);
        if (
          selectedPlot === 'scatter' &&
          Array.isArray(manifestation) &&
          manifestation.length === 2
        ) {
          const secondKey = manifestationMap[manifestation[1]];
          if (secondKey) {
            params.append('manifestation2', secondKey);
          }
        }

        const BASE = process.env.REACT_APP_API_URL || "http://localhost:3456/api";
        const url = `${BASE}/stats/${manifestationKey}?${params.toString()}`;
        const res = await fetch(url, { credentials: 'include' });

        if (!res.ok) {
          const errorData = await res.json();
          if (res.status === 404 && errorData.error && errorData.error.includes('No data found')) {
            setError('NO_DATA');
          } else {
            throw new Error(`API error: ${res.status} - ${errorData.error || res.statusText}`);
          }
        } else {
          const data = await res.json();
          setStatsRaw(data);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [manifestation, sex, severity, selectedPlot]);

  // Get stats to display based on plot type
  const getStatsToDisplay = () => {
    const stats = [];
    
    if (selectedPlot === 'scatter') {
      // For scatter plots: show key correlation and basic stats
      const scatterStats = [
        'Sample Size',
        'Correlation Coefficient',
        'Regression Slope',
        'Regression Intercept'
      ];
      scatterStats.forEach(key => {
        if (statsRaw[key] !== undefined) {
          stats.push({ key, value: statsRaw[key] });
        }
      });
    } else {
      // For box/violin plots: show all basic stats and quartiles (8 stats total)
      const boxViolinStats = [
        'Count',
        'Mean',
        'Median',
        'Standard Deviation',
        'Minimum',
        'First Quartile',
        'Third Quartile',
        'Maximum'
      ];
      boxViolinStats.forEach(key => {
        if (statsRaw[key] !== undefined) {
          stats.push({ key, value: statsRaw[key] });
        }
      });
    }
    
    return stats;
  };

  const statsToDisplay = getStatsToDisplay();

  if (loading) {
    return (
      <div className="stats-cards-container">
        <div className="stats-card loading">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-cards-container">
        <div className="stats-card error">
          {error === 'NO_DATA' ? 'No data available' : `Error: ${error}`}
        </div>
      </div>
    );
  }

  if (statsToDisplay.length === 0) {
    return (
      <div className="stats-cards-container">
        <div className="stats-card">No statistics available</div>
      </div>
    );
  }

  return (
    <div className="stats-cards-container">
      {statsToDisplay.map(({ key, value }) => (
        <div key={key} className="stats-card">
          <div className="stats-card-label">{key}</div>
          <div className="stats-card-value">{value}</div>
        </div>
      ))}
    </div>
  );
}

