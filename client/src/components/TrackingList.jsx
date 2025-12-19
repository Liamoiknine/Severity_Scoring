import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaTrash, FaEdit } from 'react-icons/fa';
import '../styles/TrackingList.css';

const BASE = process.env.REACT_APP_API_URL || "http://localhost:3456/api";

export default function TrackingList({ onListChange }) {
  const [mutations, setMutations] = useState([]);
  const [error, setError] = useState(null);
  const [showFullList, setShowFullList] = useState(false);
  const [allCombinations, setAllCombinations] = useState([]);
  const [wolframPatients, setWolframPatients] = useState([]);
  const [dominantVariants, setDominantVariants] = useState([]);
  const [activeSection, setActiveSection] = useState('wolfram'); // 'wolfram' or 'dominant'
  const [filterAllele1, setFilterAllele1] = useState('');
  const [filterAllele2, setFilterAllele2] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedColor, setEditedColor] = useState('#ff0000');

  const modalAllele1Ref = useRef();
  const modalAllele2Ref = useRef();

  const getCurrentList = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/get_mutation_list`, {
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
        name: item.name || `Patient ${idx + 1}`,
        color: item.color || '#ff0000'
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

  const handleDelete = async (a1, a2) => {
    try {
      const res = await fetch(`${BASE}/remove_mutation`, {
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

  const handleEditClick = (patient, index) => {
    setEditingPatient({ ...patient, index });
    setEditedName(patient.name || `Patient ${index + 1}`);
    setEditedColor(patient.color || '#ff0000');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPatient) return;
    
    try {
      const response = await fetch(`${BASE}/update_mutation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          allele1: editingPatient.allele1,
          allele2: editingPatient.allele2 || '',
          name: editedName,
          color: editedColor
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update patient');
      }

      // Refresh the list to get updated data
      await getCurrentList();
      
      setShowEditModal(false);
      setEditingPatient(null);
      setEditedName('');
      setEditedColor('#ff0000');
    } catch (err) {
      console.error('Error updating patient:', err);
      setError('Error updating patient: ' + err.message);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingPatient(null);
    setEditedName('');
    setEditedColor('#ff0000');
  };

  const fetchAllCombinations = async () => {
    try {
      const res = await fetch(`${BASE}/get_all_allele_combinations`, {
        credentials: 'include'
      });
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error(`Server returned non-JSON response (status: ${res.status}). Please ensure the server is running and the endpoint exists.`);
      }
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load combinations');
      }
      const combinations = await res.json();
      
      // Separate into two groups: Wolfram Patients (both alleles) and Dominant variant (only allele1)
      // Dominant variant: allele2 is null, undefined, empty string, or any falsy value
      const wolfram = combinations.filter(combo => combo.allele2 != null && combo.allele2 !== '');
      const dominant = combinations.filter(combo => combo.allele2 == null || combo.allele2 === '');
      
      setWolframPatients(wolfram);
      setDominantVariants(dominant);
      setAllCombinations(combinations);
      setShowFullList(true);
    } catch (err) {
      console.error('Error fetching combinations:', err);
      setError('Failed to load allele combinations: ' + err.message);
    }
  };

  const handleCloseModal = () => {
    setShowFullList(false);
    setFilterAllele1('');
    setFilterAllele2('');
    if (modalAllele1Ref.current) modalAllele1Ref.current.value = '';
    if (modalAllele2Ref.current) modalAllele2Ref.current.value = '';
  };

  // Filter patients based on search criteria
  const getFilteredWolframPatients = () => {
    return wolframPatients.filter(combo => {
      const matchesAllele1 = !filterAllele1 || combo.allele1.toLowerCase().includes(filterAllele1.toLowerCase());
      const matchesAllele2 = !filterAllele2 || (combo.allele2 && combo.allele2.toLowerCase().includes(filterAllele2.toLowerCase()));
      return matchesAllele1 && matchesAllele2;
    });
  };

  const getFilteredDominantVariants = () => {
    return dominantVariants.filter(combo => {
      const matchesAllele1 = !filterAllele1 || combo.allele1.toLowerCase().includes(filterAllele1.toLowerCase());
      // Dominant variants don't have allele2, so ignore allele2 filter for them
      return matchesAllele1;
    });
  };

  const isPatientInList = (allele1, allele2) => {
    return mutations.some(m => {
      // Normalize allele2 values - treat null, undefined, empty string, and "null" string as equivalent
      const normalizeAllele2 = (val) => {
        if (val === null || val === undefined || val === '' || val === 'null') {
          return null;
        }
        return val;
      };
      
      const mAllele2 = normalizeAllele2(m.allele2);
      const checkAllele2 = normalizeAllele2(allele2);
      
      // Compare allele1 (must match exactly)
      if (m.allele1 !== allele1) {
        return false;
      }
      
      // Compare allele2 (both normalized to null if empty/null/undefined)
      return mAllele2 === checkAllele2;
    });
  };

  const handleSelectPatient = async (allele1, allele2) => {
    setError(null);
    
    try {
      const prevCount = mutations.length;

      const queryParams = new URLSearchParams();
      queryParams.append('allele1', allele1);
      // For dominant variants (null/undefined), send empty string; backend treats empty string as None
      if (allele2 === null || allele2 === undefined || allele2 === '') {
        queryParams.append('allele2', '');
      } else {
        queryParams.append('allele2', allele2);
      }

      const url = `${BASE}/check_alleles?${queryParams.toString()}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        const err = await res.json();
        setError('Query Failed. Try again later.')
        throw new Error(`${res.status}: ${err.error || res.statusText}`);
      }

      const result = await res.json();
      
      // Backend returns null if patient is already in list or if combination doesn't exist
      if (result === null) {
        // Refresh the list to check current state
        const resList = await fetch(`${BASE}/get_mutation_list`, {
          credentials: 'include'
        });
        const currentList = await resList.json();
        const updated = currentList.map((item, idx) => ({
          ...item,
          expanded: false,
          name: item.name || `Patient ${idx + 1}`,
          color: item.color || '#ff0000'
        }));
        setMutations(updated);
        
        // Check if it's because it's already in the list
        const isAlreadyAdded = isPatientInList(allele1, allele2);
        if (isAlreadyAdded) {
          setError("Patient already in tracking list.");
        } else {
          setError("Invalid entry. This combination does not exist in our registry.");
        }
        return;
      }

      // Patient was successfully added, refresh the list
      const resList = await fetch(`${BASE}/get_mutation_list`, {
        credentials: 'include'
      });
      const newList = await resList.json();
      const updated = newList.map((item, idx) => ({
        ...item,
        expanded: false,
        name: item.name || `Patient ${idx + 1}`,
        color: item.color || '#ff0000'
      }));

      setMutations(updated);
      onListChange?.(updated);
      setShowFullList(false); // Close modal after successful add
    } catch (err) {
      console.error('Error adding patient:', err);
      setError('Error adding patient: ' + err.message);
    }
  };

  return (
    <div className="tracking-list">
      {error && <div className="alert-error">{error}</div>}

      <h3>Tracking List</h3>
      
      <p className="tracking-instruction">
        Add patients to track their data across visualizations. Click "Add Patient" to select from available combinations.
      </p>

      <div className="tracking-inputs">
        <button className="see-full-list-button" onClick={fetchAllCombinations}>Add Patient</button>
        <div className="see-full-list-divider"></div>
      </div>

      <ul className="mutation-list">
        {mutations.map((m, idx) => (
          <li key={idx} style={m.color ? { borderLeft: `4px solid ${m.color}` } : {}}>
            <div>
            <button
              className="mutation-button"
              onClick={() => toggleExpand(idx)}
                style={m.color ? { color: m.color } : {}}
            >
              <strong>{m.name}</strong>
              </button>
              <div className="action-buttons">
                <button
                  className="edit-button"
                  onClick={() => handleEditClick(m, idx)}
                  aria-label="Edit patient"
                >
                  <FaEdit />
            </button>
            <button
              className="delete-button"
              onClick={() => handleDelete(m.allele1, m.allele2)}
                  aria-label="Delete patient"
            >
                  <FaTrash />
            </button>
              </div>
            </div>
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

      {/* Modal for showing all allele combinations */}
      {showFullList && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>All Allele Combinations</h3>
              <button className="modal-close-button" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-tabs">
              <button 
                className={`modal-tab ${activeSection === 'wolfram' ? 'active' : ''}`}
                onClick={() => setActiveSection('wolfram')}
              >
                Wolfram Patients
              </button>
              <div className="modal-tab-separator"></div>
              <button 
                className={`modal-tab ${activeSection === 'dominant' ? 'active' : ''}`}
                onClick={() => setActiveSection('dominant')}
              >
                Dominant Variant
              </button>
            </div>
            <div className="modal-search-filters">
              <div className="modal-search-input-wrapper">
                <label htmlFor="modal-allele1-search">Filter by Allele 1:</label>
                <input
                  id="modal-allele1-search"
                  ref={modalAllele1Ref}
                  type="text"
                  className="modal-search-input"
                  placeholder="Search Allele 1..."
                  value={filterAllele1}
                  onChange={(e) => setFilterAllele1(e.target.value)}
                />
              </div>
              <div className="modal-search-input-wrapper">
                <label htmlFor="modal-allele2-search">Filter by Allele 2:</label>
                <input
                  id="modal-allele2-search"
                  ref={modalAllele2Ref}
                  type="text"
                  className="modal-search-input"
                  placeholder="Search Allele 2..."
                  value={filterAllele2}
                  onChange={(e) => setFilterAllele2(e.target.value)}
                  disabled={activeSection === 'dominant'}
                />
              </div>
            </div>
            <div className="modal-content">
              {/* Wolfram Patients Section */}
              {activeSection === 'wolfram' && (
                <ul className="allele-combinations-list">
                  {getFilteredWolframPatients().map((combo, idx) => {
                    const isAdded = isPatientInList(combo.allele1, combo.allele2);
                    return (
                      <li 
                        key={idx} 
                        className={`allele-combination-item ${isAdded ? 'added' : ''}`}
                      >
                        <span className="allele-combination-text">
                          <strong>Allele 1:</strong> {combo.allele1}, <strong>Allele 2:</strong> {combo.allele2}
                          {isAdded && <span className="added-badge"> (Added)</span>}
                        </span>
                        {!isAdded && (
                          <button 
                            className="add-patient-button"
                            onClick={() => handleSelectPatient(combo.allele1, combo.allele2)}
                          >
                            Add
                          </button>
                        )}
                      </li>
                    );
                  })}
                  {getFilteredWolframPatients().length === 0 && (
                    <li className="allele-combination-item">No patients found</li>
                  )}
                </ul>
              )}

              {/* Dominant Variant Section */}
              {activeSection === 'dominant' && (
                <ul className="allele-combinations-list">
                  {getFilteredDominantVariants().map((combo, idx) => {
                    const isAdded = isPatientInList(combo.allele1, null);
                    return (
                      <li 
                        key={idx} 
                        className={`allele-combination-item ${isAdded ? 'added' : ''}`}
                      >
                        <span className="allele-combination-text">
                          <strong>Allele 1:</strong> {combo.allele1}
                          {isAdded && <span className="added-badge"> (Added)</span>}
                        </span>
                        {!isAdded && (
                          <button 
                            className="add-patient-button"
                            onClick={() => handleSelectPatient(combo.allele1, null)}
                          >
                            Add
                          </button>
                        )}
                      </li>
                    );
                  })}
                  {getFilteredDominantVariants().length === 0 && (
                    <li className="allele-combination-item">No patients found</li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {showEditModal && editingPatient && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-container edit-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Patient</h3>
              <button className="modal-close-button" onClick={handleCancelEdit}>×</button>
            </div>
            <div className="edit-modal-content">
              <div className="edit-patient-info">
                <h4>Patient Information</h4>
                <div className="edit-info-grid">
                  <div className="edit-info-item">
                    <strong>First Allele:</strong> {editingPatient.allele1}
                  </div>
                  <div className="edit-info-item">
                    <strong>Second Allele:</strong> {editingPatient.allele2 || '—'}
                  </div>
                  <div className="edit-info-item">
                    <strong>Sex:</strong> {(editingPatient.sex === 0 ? "Male" : "Female") || '—'}
                  </div>
                  <div className="edit-info-item">
                    <strong>Severity:</strong> {editingPatient.severity || '—'}
                  </div>
                  <div className="edit-info-item">
                    <strong>Diabetes Mellitus:</strong> {editingPatient.dm || 'None'}
                  </div>
                  <div className="edit-info-item">
                    <strong>Optic Atrophy:</strong> {editingPatient.oa || 'None'}
                  </div>
                  <div className="edit-info-item">
                    <strong>Diabetes Insipidus:</strong> {editingPatient.di || 'None'}
                  </div>
                  <div className="edit-info-item">
                    <strong>Hearing Loss:</strong> {editingPatient.hl || 'None'}
                  </div>
                </div>
              </div>

              <div className="edit-form-fields">
                <div className="edit-field">
                  <label htmlFor="edit-patient-name">Patient Name:</label>
                  <input
                    id="edit-patient-name"
                    type="text"
                    className="edit-input"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Enter patient name"
                  />
                </div>

                <div className="edit-field">
                  <label htmlFor="edit-patient-color">Patient Color:</label>
                  <div className="color-picker-wrapper">
                    <input
                      id="edit-patient-color"
                      type="color"
                      className="color-picker"
                      value={editedColor}
                      onChange={(e) => setEditedColor(e.target.value)}
                    />
                    <span className="color-preview" style={{ backgroundColor: editedColor }}></span>
                    <span className="color-value">{editedColor}</span>
                  </div>
                </div>
              </div>

              <div className="edit-modal-actions">
                <button className="edit-save-button" onClick={handleSaveEdit}>
                  Save
                </button>
                <button className="edit-cancel-button" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
