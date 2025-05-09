import React, { useState, useEffect, useCallback} from 'react';
import AutoCompleteSearch from './AutoCompleteSearch';
import '../styles/TrackingList.css';

// Tracks a list of patients using server-side sessions, displays them in a collapsable sidebar
export default function TrackingList({ onListChange }) {
  const [allele1, setAllele1] = useState('');
  const [allele2, setAllele2] = useState('');
  const [mutations, setMutations] = useState([]);
  const [error, setError] = useState(null)

  const getCurrentList = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3456/api/get_mutation_list', {
        credentials: 'include'
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load list');
      }
      const list = await res.json();
      let updated = list.map((item, idx) => ({
          ...item,
          expanded: false,
          name: "Variant ("+(idx +1)+ ")"
        }));
      
      setMutations(updated);
      onListChange?.(updated);

    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }, [onListChange]);


  // On load, query get current mutation list
  useEffect(() => {
    getCurrentList()
  }, [getCurrentList]);

  // Add a new mutation (with collapsed details)
  const handleAdd = async () => {
    setError(null)
    if (!allele1){
      setError("Must input a value for allele 1")
      return;
    };
    

    // Query the database to see if the input alleles match a patient
    try{
      // Build query parameters based on selected inputs
      const queryParams = new URLSearchParams();
      queryParams.append('allele1', allele1);
      queryParams.append('allele2', allele2 ?? null)

      const url = `http://localhost:3456/api/check_alleles?${queryParams.toString()}`;
      console.log('Fetching data from:', url);
      const res = await fetch(url, { credentials: 'include' });
      
      if (!res.ok) {
        setError("Process Failed, try again.")
        const err = await res.json();
        throw new Error(`${res.status}: ${err.error || res.statusText}`);
      }

      setAllele1('');
      setAllele2('');

      await getCurrentList()
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error fetching data:', err.message);
    }
  };

  // Delete a mutation, then re-fetch
  const handleDelete = async (a1, a2) => {
    try {
      const res = await fetch('http://localhost:3456/api/remove_mutation', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allele1: a1, allele2: a2 })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Delete failed');
      }
      await getCurrentList();
    } catch (err) {
      console.error('Deletion error:', err);
      setError(err.message);
    }
  };

  // Toggle expansion for a given mutation
  const toggleExpand = index => {
    setMutations(prev => {
      const updated = prev.map((m, i) =>
        i === index ? { ...m, expanded: !m.expanded } : m
      );
      onListChange?.(updated); // CHANGED: notify parent of toggled list
      return updated;
    });
    setError(null)
  };

  return (
    <div className="tracking-list">
      <h3>Tracking List</h3>
      { error &&
        (<div className="alert-error">{error}</div>)
      }
      
      <div className="tracking-inputs">
        <AutoCompleteSearch
          placeholder='First Allele'
          dataKey = "allele_1"
          onSelect={val => setAllele1(val)}
        />
        <AutoCompleteSearch
          placeholder='Second Allele (optional)'
          dataKey = "allele_2"
          onSelect={val => setAllele2(val)}
        />
        <button onClick={handleAdd}>
          Add
        </button>
      </div>
      <ul className="mutation-list">
        {mutations.map((m, idx) => (
          <li key={idx}>
            <button
              className="mutation-button"
              onClick={() => toggleExpand(idx)}
            ><strong>{m.name}</strong>
            </button>

            <button
              className="delete-button"
              onClick={() => handleDelete(m.allele1, m.allele2)}
            >
              Delete
            </button>

            {m.expanded && (
              <div className="mutation-details">
                <p><strong>First Allele:</strong> {m.allele1}</p>
                <p><strong>Second Allele:</strong> {m.allele2 || '—'}</p>
                <p><strong>Sex:</strong> {(m.sex == 0 ? "Male" : "Female" )|| '—'}</p>
                <p><strong>Severity:</strong> {m.severity || '—'}</p>
                <p><strong>Diabetes Mellitus:</strong> { m.dm || 'None'}</p>
                <p><strong>Optic Atrophy</strong> { m.oa || 'None'}</p>
                <p><strong>Diabetes Insipidus</strong> { m.di || 'None'}</p>
                <p><strong>Hearing Loss</strong> { m.hl || 'None'}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}