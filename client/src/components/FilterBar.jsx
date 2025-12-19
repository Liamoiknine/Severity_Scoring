import React, { useState, useEffect, useRef } from 'react';
import '../styles/FilterBar.css';

const fieldConfig = {
  Manifestations: {
    Age_of_Onset_of: ["Diabetes Mellitus", "Optic Atrophy", "Diabetes Insipidus", "Hearing Loss"]
  },
  Selectors: {
    Sex: ["Male", "Female"],
    Severity_Score: [1, 2, 3, 4, 5, 6]
  }
};

export default function FilterBar({ inputs, onInputChange, selectedPlot, onPlotChange, setInputs }) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const filterBarRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterBarRef.current && !filterBarRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const handleDropdownToggle = (group, field) => {
    let key;
    if (group === 'plot' && field === 'type') {
      key = 'plot-type';
    } else if (group === 'manifestation') {
      key = `manifestation-${field}`;
    } else {
      key = `${group}-${field}`;
    }
    setOpenDropdown(openDropdown === key ? null : key);
  };

  const handleOptionClick = (group, field, value) => {
    onInputChange(group, field, value);
    // For non-manifestation fields, close dropdown after selection
    if (field !== 'Age_of_Onset_of') {
      setOpenDropdown(null);
    }
  };

  const getDisplayValue = (group, field) => {
    const value = inputs[group]?.[field];
    
    if (field === 'Age_of_Onset_of') {
      if (selectedPlot === 'scatter') {
        const selected = Array.isArray(value) ? value : (value ? [value] : []);
        if (selected.length === 0) return 'Select Manifestations';
        if (selected.length === 1) return `${selected[0]} + 1 more`;
        if (selected.length === 2) return `${selected[0]} vs ${selected[1]}`;
        return `${selected.length} selected`;
      } else {
        return value || 'All Manifestations';
      }
    } else if (field === 'Sex') {
      return value || 'All Sexes';
    } else if (field === 'Severity_Score') {
      return value ? `Severity ${value}` : 'All Severities';
    }
    return 'Select';
  };

  const plotTypes = [
    { value: 'scatter', label: 'Scatter Plot' },
    { value: 'box', label: 'Box Plot' },
    { value: 'violin', label: 'Violin Plot' }
  ];

  const handlePlotChange = (plotType) => {
    if (onPlotChange) {
      onPlotChange(plotType);
    }
    setOpenDropdown(null);
  };

  const handleManifestationClick = (manifestationIndex, value) => {
    // Get current selections - maintain as array with up to 2 elements
    const currentSelections = Array.isArray(inputs.Manifestations?.Age_of_Onset_of) 
      ? [...inputs.Manifestations.Age_of_Onset_of] 
      : [];
    
    // Build new array maintaining index positions
    const newSelections = [null, null];
    
    // Preserve existing selections at their indices
    if (currentSelections[0]) newSelections[0] = currentSelections[0];
    if (currentSelections[1]) newSelections[1] = currentSelections[1];
    
    const otherIndex = manifestationIndex === 0 ? 1 : 0;
    const currentValue = newSelections[manifestationIndex];
    const otherValue = newSelections[otherIndex];
    
    // Handle selection logic
    if (currentValue === value) {
      // Deselecting: clear this position
      newSelections[manifestationIndex] = null;
    } else if (otherValue === value) {
      // Swapping: move value from other position to this position
      newSelections[manifestationIndex] = value;
      newSelections[otherIndex] = currentValue;
    } else {
      // Setting new value
      newSelections[manifestationIndex] = value;
    }
    
    // Filter out nulls to get the final array
    const finalSelections = newSelections.filter(v => v !== null);
    
    // Update state directly if setInputs is available, otherwise use onInputChange
    if (setInputs) {
      setInputs(prev => ({
        ...prev,
        Manifestations: {
          ...prev.Manifestations,
          Age_of_Onset_of: finalSelections
        }
      }));
    } else {
      // Fallback: use onInputChange but we need to work around its toggle logic
      // Remove all current selections first, then add back the new ones
      currentSelections.forEach(sel => {
        if (sel && !finalSelections.includes(sel)) {
          onInputChange('Manifestations', 'Age_of_Onset_of', sel);
        }
      });
      finalSelections.forEach(sel => {
        if (!currentSelections.includes(sel)) {
          onInputChange('Manifestations', 'Age_of_Onset_of', sel);
        }
      });
    }
    
    setOpenDropdown(null);
  };

  return (
    <div className="filter-bar" ref={filterBarRef}>
      <div className="filter-bar-container">
        {/* Visualization Type Dropdown */}
        <div className="filter-dropdown">
          <button
            className={`filter-dropdown-button ${openDropdown === 'plot-type' ? 'open' : ''} has-selection`}
            onClick={() => handleDropdownToggle('plot', 'type')}
          >
            <span className="filter-value">
              {plotTypes.find(p => p.value === selectedPlot)?.label || 'Visualization'}
            </span>
            <span className="filter-arrow"></span>
          </button>
          
          {openDropdown === 'plot-type' && (
            <div className="filter-dropdown-menu">
              {plotTypes.map(plot => {
                const isSelected = selectedPlot === plot.value;
                return (
                  <button
                    key={plot.value}
                    className={`filter-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handlePlotChange(plot.value)}
                  >
                    {plot.label}
                    {isSelected && <span className="checkmark">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Manifestations - Two separate dropdowns for scatter, single for others */}
        {selectedPlot === 'scatter' ? (
          <>
            {/* First Manifestation Dropdown */}
            <div className="filter-dropdown">
              <button
                className={`filter-dropdown-button ${openDropdown === 'manifestation-0' ? 'open' : ''} ${inputs.Manifestations?.Age_of_Onset_of?.[0] ? 'has-selection' : ''}`}
                onClick={() => handleDropdownToggle('manifestation', '0')}
              >
                <span className="filter-value">
                  {inputs.Manifestations?.Age_of_Onset_of?.[0] || 'Manifestation 1'}
                </span>
                <span className="filter-arrow"></span>
              </button>
              
              {openDropdown === 'manifestation-0' && (
                <div className="filter-dropdown-menu">
                  {fieldConfig.Manifestations.Age_of_Onset_of.map(opt => {
                    const isSelected = inputs.Manifestations?.Age_of_Onset_of?.[0] === opt;
                    const isSelectedInOther = inputs.Manifestations?.Age_of_Onset_of?.[1] === opt;
                    return (
                      <button
                        key={opt}
                        className={`filter-option ${isSelected ? 'selected' : ''} ${isSelectedInOther ? 'disabled' : ''}`}
                        onClick={() => !isSelectedInOther && handleManifestationClick(0, opt)}
                        disabled={isSelectedInOther}
                      >
                        {opt}
                        {isSelected && <span className="checkmark">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Second Manifestation Dropdown */}
            <div className="filter-dropdown">
              <button
                className={`filter-dropdown-button ${openDropdown === 'manifestation-1' ? 'open' : ''} ${inputs.Manifestations?.Age_of_Onset_of?.[1] ? 'has-selection' : ''}`}
                onClick={() => handleDropdownToggle('manifestation', '1')}
              >
                <span className="filter-value">
                  {inputs.Manifestations?.Age_of_Onset_of?.[1] || 'Manifestation 2'}
                </span>
                <span className="filter-arrow"></span>
              </button>
              
              {openDropdown === 'manifestation-1' && (
                <div className="filter-dropdown-menu">
                  {fieldConfig.Manifestations.Age_of_Onset_of.map(opt => {
                    const isSelected = inputs.Manifestations?.Age_of_Onset_of?.[1] === opt;
                    const isSelectedInOther = inputs.Manifestations?.Age_of_Onset_of?.[0] === opt;
                    return (
                      <button
                        key={opt}
                        className={`filter-option ${isSelected ? 'selected' : ''} ${isSelectedInOther ? 'disabled' : ''}`}
                        onClick={() => !isSelectedInOther && handleManifestationClick(1, opt)}
                        disabled={isSelectedInOther}
                      >
                        {opt}
                        {isSelected && <span className="checkmark">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          // Single manifestation dropdown for box/violin plots
          Object.entries(fieldConfig.Manifestations).map(([field, options]) => {
            const dropdownKey = `Manifestations-${field}`;
            const isOpen = openDropdown === dropdownKey;
            const selectedValue = inputs.Manifestations?.[field];

            return (
              <div key={dropdownKey} className="filter-dropdown">
                <button
                  className={`filter-dropdown-button ${isOpen ? 'open' : ''} ${selectedValue ? 'has-selection' : ''}`}
                  onClick={() => handleDropdownToggle('Manifestations', field)}
                >
                  <span className="filter-value">
                    {selectedValue || 'Manifestation'}
                  </span>
                  <span className="filter-arrow"></span>
                </button>
                
                {isOpen && (
                  <div className="filter-dropdown-menu">
                    <button
                      className={`filter-option ${!selectedValue ? 'selected' : ''}`}
                      onClick={() => handleOptionClick('Manifestations', field, null)}
                    >
                      All Manifestations
                      {!selectedValue && <span className="checkmark">✓</span>}
                    </button>
                    {options.map(opt => {
                      const isSelected = selectedValue === opt;
                      return (
                        <button
                          key={opt}
                          className={`filter-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleOptionClick('Manifestations', field, opt)}
                        >
                          {opt}
                          {isSelected && <span className="checkmark">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Selectors (Sex and Severity Score) */}
        {Object.entries(fieldConfig.Selectors).map(([field, options]) => {
          const dropdownKey = `Selectors-${field}`;
          const isOpen = openDropdown === dropdownKey;
          const selectedValue = inputs.Selectors?.[field];

          return (
            <div key={dropdownKey} className="filter-dropdown">
              <button
                className={`filter-dropdown-button ${isOpen ? 'open' : ''} ${selectedValue ? 'has-selection' : ''}`}
                onClick={() => handleDropdownToggle('Selectors', field)}
              >
                <span className="filter-value">
                  {selectedValue 
                    ? (field === 'Severity_Score' ? `Severity ${selectedValue}` : selectedValue)
                    : field.replace(/_/g, ' ')
                  }
                </span>
                <span className="filter-arrow"></span>
              </button>
              
              {isOpen && (
                <div className="filter-dropdown-menu">
                  <button
                    className={`filter-option ${!selectedValue ? 'selected' : ''}`}
                    onClick={() => handleOptionClick('Selectors', field, null)}
                  >
                    All {field === 'Sex' ? 'Sexes' : 'Severities'}
                    {!selectedValue && <span className="checkmark">✓</span>}
                  </button>
                  {options.map(opt => {
                    const isSelected = selectedValue === opt;
                    return (
                      <button
                        key={opt}
                        className={`filter-option ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleOptionClick('Selectors', field, opt)}
                      >
                        {field === 'Severity_Score' ? `Severity ${opt}` : opt}
                        {isSelected && <span className="checkmark">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

