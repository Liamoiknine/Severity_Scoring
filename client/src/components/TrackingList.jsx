import React, { useState, useEffect, useCallback, useRef } from 'react';
import AutoCompleteSearch from './AutoCompleteSearch';
import '../styles/TrackingList.css';

export default function TrackingList({ onListChange }) {
  const [allele1, setAllele1] = useState('');
  const [allele2, setAllele2] = useState('');
  const [mutations, setMutations] = useState([]);
  const [error, setError] = useState(null);

  const allele1Ref = useRef();
  const allele2Ref = useRef();

  const getCurrentList = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/get_mutation_list`, {
        credentials: 'include'
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load list');
      }
      const list = await res.json();
      const updated = list.map((item, idx) => ({
        ...item,
        expanded: false,
        name: `Patient ${idx + 1}`
      }));
      setMutations(updated);
      onListChange?.(updated);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }, [onListChange]);

  useEffect(() => {
    getCurrentList();
  }, [getCurrentList]);

  const handleAdd = async () => {
    setError(null);
    if (!allele1) {
      setError('Must input a value for allele 1');
      return;
    }

    try {
      const prevCount = mutations.length;

      const queryParams = new URLSearchParams();
      queryParams.append('allele1', allele1);
      queryParams.append('allele2', allele2 ?? null);

      const url = `${process.env.REACT_APP_API_URL}/check_alleles?${queryParams.toString()}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json();
        setError('Query Failed. Try again later.')
        throw new Error(`${res.status}: ${err.error || res.statusText}`);
      }

      const resList = await fetch(`${process.env.REACT_APP_API_URL}/get_mutation_list`, {
        credentials: 'include'
      });
      const newList = await resList.json();
      const updated = newList.map((item, idx) => ({
        ...item,
        expanded: false,
        name: `Patient ${idx + 1}`
      }));

      if (updated.length > prevCount) {
        setAllele1('');
        setAllele2('');
        allele1Ref.current?.clear();
        allele2Ref.current?.clear();
      }
      else{
        setError("Invalid entry. Try again with a valid combination of alleles that exist in our registry.")
        setAllele1('');
        setAllele2('');
        allele1Ref.current?.clear();
        allele2Ref.current?.clear();
      }

      setMutations(updated);
      onListChange?.(updated);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error fetching data: ' + err.message);
    }
  };

  const handleDelete = async (a1, a2) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/remove_mutation`, {
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

  const toggleExpand = index => {
    setMutations(prev => {
      const updated = prev.map((m, i) =>
        i === index ? { ...m, expanded: !m.expanded } : m
      );
      onListChange?.(updated);
      return updated;
    });
    setError(null);
  };

  return (
    <div className="tracking-list">
      <h3>Add a Patient</h3>
      {error && <div className="alert-error">{error}</div>}

      <div className="tracking-inputs">
        <AutoCompleteSearch
          ref={allele1Ref}
          placeholder="First Allele"
          dataKey="allele_1"
          onSelect={val => setAllele1(val)}
        />
        <AutoCompleteSearch
          key={allele1} // Forces re-init when allele1 changes
          ref={allele2Ref}
          placeholder="Second Allele (optional)"
          dataKey="allele_2"
          a1_value={allele1}
          onSelect={val => setAllele2(val)}
        />
        <button className="add-button" onClick={handleAdd}>Add</button>
      </div>

      <h3>Tracking List</h3>
      <ul className="mutation-list">
        {mutations.map((m, idx) => (
          <li key={idx}>
            <button
              className="mutation-button"
              onClick={() => toggleExpand(idx)}
            >
              <strong>{m.name}</strong>
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
                <p><strong>Sex:</strong> {(m.sex === 0 ? "Male" : "Female") || '—'}</p>
                <p><strong>Severity:</strong> {m.severity || '—'}</p>
                <p><strong>Diabetes Mellitus:</strong> {m.dm || 'None'}</p>
                <p><strong>Optic Atrophy:</strong> {m.oa || 'None'}</p>
                <p><strong>Diabetes Insipidus:</strong> {m.di || 'None'}</p>
                <p><strong>Hearing Loss:</strong> {m.hl || 'None'}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
