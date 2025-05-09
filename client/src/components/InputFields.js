import React from 'react';
import '../styles/InputFields.css';

// Defines our specific layout of input field --> relays inputs to parent component
export default function InputFields({ config, inputs, onInputChange, selectedPlot }) {
  return (
    <div className="input-section">
      {Object.entries(config).map(([group, fields]) => (
        <div key={group} className="input-group">
          <h3>{group.replace(/_/g, ' ')}</h3>

          {Object.entries(fields).map(([field, options]) => {
            // Determine which control to render based on the field
            let control;
            if (field === 'Age_Range') {
              // Two number inputs for min and max
              control = (
                <>
                  <input
                    type="number"
                    min={options[0]}
                    max={options[1]}
                    value={inputs[group][field].min}
                    onChange={e =>
                      onInputChange(group, field, { min: Number(e.target.value) })
                    }
                  />
                  <span>to</span>
                  <input
                    type="number"
                    min={options[0]}
                    max={options[1]}
                    value={inputs[group][field].max}
                    onChange={e =>
                      onInputChange(group, field, { max: Number(e.target.value) })
                    }
                  />
                </>
              );
            } else if (field === 'Age_of_Onset_of') {
              // Special handling for manifestations selection
              const selectedManifestations = inputs[group][field] || [];
              const selectedCount = Array.isArray(selectedManifestations) ? selectedManifestations.length : 0;

              // Add a message based on the plot type
              let message = null;
              if (selectedPlot === 'scatter') {
                if (selectedCount < 2) {
                  message = <div className="selection-message">Select {2 - selectedCount} more manifestation(s) for scatter plot</div>;
                } else if (selectedCount > 2) {
                  message = <div className="selection-message">Too many selections. Click on a selected manifestation to deselect it.</div>;
                } else {
                  message = <div className="selection-message">Two manifestations selected. Scatter plot will show age of onset of one vs the other.</div>;
                }
              } else {
                // For box and violin plots
                if (typeof selectedManifestations === 'string' && selectedManifestations) {
                  message = <div className="selection-message">Showing data for {selectedManifestations}</div>;
                } else {
                  message = <div className="selection-message">Select a manifestation to filter data, or none to show all</div>;
                }
              }

              control = (
                <>
                  {options.map(opt => (
                    <button
                      key={opt}
                      className={
                        Array.isArray(selectedManifestations)
                          ? selectedManifestations.includes(opt) ? 'selected' : ''
                          : selectedManifestations === opt ? 'selected' : ''
                      }
                      onClick={() => onInputChange(group, field, opt)}
                    >
                      {opt}
                    </button>
                  ))}
                  {message}
                </>
              );
            } else {
              // Render a button for each preset option
              control = options.map(opt => (
                <button
                  key={opt}
                  className={inputs[group][field] === opt ? 'selected' : ''}
                  onClick={() => onInputChange(group, field, opt)}
                >
                  {opt}
                </button>
              ));
            }

            return (
              <div key={field} className="input-field">
                <label className="field-label">
                  {field
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase())
                  }
                </label>

                <div className="button-control">
                  {control}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
