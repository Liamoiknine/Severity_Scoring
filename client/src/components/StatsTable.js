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

        const url = `http://localhost:3456/api/stats/${manifestationKey}?${params.toString()}`;
        const res = await fetch(url);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(`API error: ${res.status} - ${errorData.error || res.statusText}`);
        }

        const data = await res.json();
        setStatsRaw(data);
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

  if (loading) {
    return <p>Loading statistics for {displayManifestation}…</p>;
  }

  if (error) {
    return <p>Error loading stats for {displayManifestation}: {error}</p>;
  }

  // Sort the stats into the defined display order
  const orderedStats = STAT_ORDER
    .filter((key) => key in statsRaw)
    .map((key) => [key, statsRaw[key]]);

  return (
    <div className="stats-table-container">
      <h2>Statistics for {displayManifestation}</h2>
      <div className="stats-grid">
        {orderedStats.map(([key, value]) => (
          <div className="stats-grid-item" key={key}>
            <div className="stat-label">{key}</div>
            <div className="stat-value">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
