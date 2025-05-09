import React, { useState, useEffect } from 'react';
import '../styles/StatsTable.css';

const manifestationsMap = {
  'Diabetes Mellitus': 'dm',
  'Optic Atrophy': 'oa',
  'Hearing Loss': 'hl',
  'Diabetes Insipidus': 'di'
};

// Prints statistics calculated on server side based on current selection
export default function StatsTable({ manifestation, sex, severity, selectedPlot }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  let manifestationKey;
  if (manifestation) {
    // For scatter plot, we need to handle an array of manifestations
    if (Array.isArray(manifestation) && manifestation.length === 2) {
      manifestationKey = manifestationsMap[manifestation[0]];
    } else {
      manifestationKey = manifestationsMap[manifestation];
    }
  } else {
    manifestationKey = 'all';
  }

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (sex) {
          params.append('sex', sex);
        }
        if (severity) {
          params.append('severity', severity);
        }

        // For scatter plot, add the second manifestation
        if (selectedPlot === 'scatter' && Array.isArray(manifestation) && manifestation.length === 2) {
          params.append('manifestation2', manifestationsMap[manifestation[1]]);
        }

        const url = `http://localhost:3456/api/stats/${manifestationKey}?${params.toString()}`;
        const res = await fetch(url);

        //error handling
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(`API error: ${res.status} - ${errorData.error || res.statusText}`);
        }
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [manifestation, sex, severity, selectedPlot]);

  if (loading) {
    return <p>Loading statistics{manifestation ? ` for ${Array.isArray(manifestation) ? manifestation.join(' vs ') : manifestation}` : ''}…</p>;
  }

  if (error) {
    return <p>Error loading stats{manifestation ? ` for ${Array.isArray(manifestation) ? manifestation.join(' vs ') : manifestation}` : ''}: {error}</p>;
  }

  return (
    <div className="stats-table">
      <h3>Statistics{manifestation ? ` for ${Array.isArray(manifestation) ? manifestation.join(' vs ') : manifestation}` : ' for All Data'}</h3>
      <div className="stat-items">
        {Object.entries(stats).map(([statName, statValue]) => (
          <div key={statName} className="stat-item">
            <div className="stat-label">
              <span>{statName}</span>
            </div>
            <span className="stat-value">{statValue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
