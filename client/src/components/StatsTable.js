import React, { useState, useEffect } from 'react';
import '../styles/StatsTable.css';

const manifestationMap = {
  'Diabetes Mellitus': 'dm',
  'Optic Atrophy': 'oa',
  'Hearing Loss': 'hl',
  'Diabetes Insipidus': 'di'
};

// Define your preferred stat display order
const STAT_ORDER = [
  'Sample Size',
  'Count',
  'Mean',
  'Median',
  'Standard Deviation',
  'Minimum',
  'First Quartile',
  'Third Quartile',
  'Maximum',
  'Correlation Coefficient',
  'Regression Slope',
  'Regression Intercept',
  'Diabetes Mellitus Mean',
  'Diabetes Mellitus Std Dev',
  'Optic Atrophy Mean',
  'Optic Atrophy Std Dev',
  'Hearing Loss Mean',
  'Hearing Loss Std Dev',
  'Diabetes Insipidus Mean',
  'Diabetes Insipidus Std Dev'
];

export default function StatsTable({ manifestation, sex, severity, selectedPlot }) {
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
        const res = await fetch(url);

        if (!res.ok) {
          const errorData = await res.json();
          // Check if this is a "no data" case (404 with "No data found" message)
          if (res.status === 404 && errorData.error && errorData.error.includes('No data found')) {
            setError('NO_DATA'); // Special flag for no data case
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

  const displayManifestation =
    manifestation && Array.isArray(manifestation)
      ? manifestation.join(' vs ')
      : manifestation || 'All Data';

  // Organize stats into logical groups
  const organizeStats = () => {
    const groups = {
      basic: [],
      quartiles: [],
      correlation: [],
      multiManifestation: []
    };

    STAT_ORDER.forEach((key) => {
      if (!(key in statsRaw)) return;
      
      const value = statsRaw[key];
      
      if (key.includes('Quartile') || key === 'Minimum' || key === 'Maximum') {
        groups.quartiles.push([key, value]);
      } else if (key.includes('Correlation') || key.includes('Regression')) {
        groups.correlation.push([key, value]);
      } else if (key.includes('Mean') && (key.includes('Diabetes') || key.includes('Optic') || key.includes('Hearing') || key.includes('Insipidus'))) {
        groups.multiManifestation.push([key, value]);
      } else {
        groups.basic.push([key, value]);
      }
    });

    return groups;
  };

  const statGroups = organizeStats();

  return (
    <div className="stats-table-container">
      <h2>Statistics for {displayManifestation}</h2>
      {loading && (
        <div className="stats-content">
          <p>Loading statistics for {displayManifestation}…</p>
        </div>
      )}
      {!loading && error && (
        <div className="stats-content">
          {error === 'NO_DATA' ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              padding: '20px',
              textAlign: 'center'
            }}>
              <p>No patients found for this combination of filters.</p>
            </div>
          ) : (
            <p>Error loading stats for {displayManifestation}: {error}</p>
          )}
        </div>
      )}
      {!loading && !error && (
      <div className="stats-content">
        {/* Basic Statistics */}
        {statGroups.basic.length > 0 && (
          <div className="stat-group">
            <h3 className="stat-group-title">Summary Statistics</h3>
            <div className="stats-grid">
              {statGroups.basic.map(([key, value]) => (
                <div className="stats-grid-item" key={key}>
                  <div className="stat-label">{key}</div>
                  <div className="stat-value">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quartiles */}
        {statGroups.quartiles.length > 0 && (
          <div className="stat-group">
            <h3 className="stat-group-title">Distribution</h3>
            <div className="stats-grid">
              {statGroups.quartiles.map(([key, value]) => (
                <div className="stats-grid-item" key={key}>
                  <div className="stat-label">{key}</div>
                  <div className="stat-value">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Correlation Stats */}
        {statGroups.correlation.length > 0 && (
          <div className="stat-group">
            <h3 className="stat-group-title">Correlation Analysis</h3>
            <div className="stats-grid">
              {statGroups.correlation.map(([key, value]) => (
                <div className="stats-grid-item" key={key}>
                  <div className="stat-label">{key}</div>
                  <div className="stat-value">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Multi-manifestation stats */}
        {statGroups.multiManifestation.length > 0 && (
          <div className="stat-group">
            <h3 className="stat-group-title">Manifestation Comparison</h3>
      <div className="stats-grid">
              {statGroups.multiManifestation.map(([key, value]) => (
          <div className="stats-grid-item" key={key}>
            <div className="stat-label">{key}</div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
