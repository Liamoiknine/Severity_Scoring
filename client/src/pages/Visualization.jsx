import React, { useState, useEffect } from 'react';
import InputFields from '../components/InputFields';
import TrackingList from '../components/TrackingList';
import D3ScatterPlot from '../components/D3ScatterPlot';
import D3ViolinPlot from '../components/D3ViolinPlot';
import D3BoxPlot from '../components/D3BoxPlot';
import StatsTable from '../components/StatsTable';
import Info from '../components/Info';
import { scroller } from 'react-scroll';
import '../styles/Visualization.css';
import Navbar from '../components/Navbar';


// Auxialiary Functions:

// Define the input field groups
const fieldConfig = {
  Manifestations: {
    Age_of_Onset_of: ["Diabetes Mellitus", "Optic Atrophy", "Diabetes Insipidus", "Hearing Loss"]
  },
  Selectors: {
    Sex: ["Male", "Female"],
    Severity_Score: [1, 2, 3, 4, 5, 6]
  }
}

// Define the default inputs
const defaultInputs = {
  Manifestations: {
    Age_of_Onset_of: ["Diabetes Mellitus", "Optic Atrophy"]
  },
  Selectors: {
    Sex: null,
    Severity_Score: null
  }
}

// Map a specific manifestation name to its key
const getManifestationKey = (manifestation) => {
  const keyMap = {
    'Diabetes Mellitus': 'dm',
    'Optic Atrophy': 'oa',
    'Diabetes Insipidus': 'di',
    'Hearing Loss': 'hl'
  };
  return keyMap[manifestation];
};

/*
States:
  1) inputs: 
  2) selectedPlot: tracks which type of plot is selected to be displayed
  3) apiData: stores data fetched from backend
  4) loading: tracks whether data is currently being fetched
  5) error: captures any fetch errors
*/

function Visualization() {
  // State definitions
  const [inputs, setInputs] = useState(defaultInputs)
  const [selectedPlot, setSelectedPlot] = useState('scatter');
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(true);
  const [trackedMutations, setTrackedMutations] = useState([]);
  const [infoState, setInfoState] = useState("open")

  // runs upon start up
  useEffect(() => {
    // This functions gets all patient data and sets apiData variable
    const fetchData = async () => {
      try {
        setLoading(true);

        // Build query parameters based on selected inputs
        const queryParams = new URLSearchParams();

        // Add Selectors parameters if they exist
        if (inputs.Selectors.Sex) {
          queryParams.append('sex', inputs.Selectors.Sex);
        }
        if (inputs.Selectors.Severity_Score) {
          queryParams.append('severity', inputs.Selectors.Severity_Score);
        }
        // Add Manifestations parameters if they exist
        if (inputs.Manifestations.Age_of_Onset_of) {
          queryParams.append('manifestation', inputs.Manifestations.Age_of_Onset_of);
        }

        const url = `http://localhost:3456/api/patients?${queryParams.toString()}`;
        console.log('Fetching data from:', url);
        const patientsResponse = await fetch(url);
        //error handling
        if (!patientsResponse.ok) {
          const errorData = await patientsResponse.json();
          console.error('API Error:', {
            status: patientsResponse.status,
            statusText: patientsResponse.statusText,
            error: errorData
          });
          throw new Error(`API error: ${patientsResponse.status} - ${errorData.error || patientsResponse.statusText}`);
        }

        const patientsData = await patientsResponse.json();
        //set apiData to the patients data
        setApiData(patientsData);
        console.log('Updated apiData state:', patientsData);
        setLoading(false);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    }; // End of fetch request

    fetchData();
  }, [inputs]); //runs when inputs change

  // Updates the inputs stat variable based on user input changes
  const handleInputChange = (group, field, value) => {
    setInputs(prev => {
      const updatedGroup = { ...prev[group] };

      if (group === 'Selectors') {
        //if value clicked was already selected, deselect it
        if (updatedGroup[field] === value) {
          updatedGroup[field] = null;
        } else {
          // deselect all other values
          Object.keys(updatedGroup).forEach(key => {
            updatedGroup[key] = null;
          });
          // select new value
          updatedGroup[field] = value;
        }
      } else if (field === 'Age_of_Onset_of') {
        // Different behavior based on selected plot type
        if (selectedPlot === 'scatter') {
          // For scatter plot, we want to allow selecting exactly two
          const currentSelections = updatedGroup[field] || [];

          // If the value is already selected, remove it
          if (currentSelections.includes(value)) {
            updatedGroup[field] = currentSelections.filter(item => item !== value);
          }
          // If we already have two selections, replace the first one
          else if (currentSelections.length >= 2) {
            updatedGroup[field] = [currentSelections[1], value];
          }
          // Otherwise, add the new selection
          else {
            updatedGroup[field] = [...currentSelections, value];
          }
        } else {
          // For box and violin plots, behave like before - toggle single selection
          updatedGroup[field] = updatedGroup[field] === value ? null : value;
        }
      }

      return {
        ...prev,
        [group]: updatedGroup
      };
    });
  };


  const renderVisualization = () => {
    if (loading) {
      return <p>Loading data...</p>;
    }

    if (error) {
      return <p>Error loading data: {error}</p>;
    }

    if (!apiData || apiData.length === 0) {
      console.log('No API data available');
      return <p>No data available</p>;
    }

    // Filter data based on selected inputs
    const filteredData = apiData.filter(item => {
      // Check if the item matches all selected criteria
      const sexValue = inputs.Selectors.Sex === 'Male' ? 0
        : inputs.Selectors.Sex === 'Female' ? 1
          : null;

      const matchesSex = sexValue == null || item.sex === sexValue;
      const matchesSeverity = !inputs.Selectors.Severity_Score || item.severity === inputs.Selectors.Severity_Score;
      return matchesSex && matchesSeverity;
    });

    // determine filterTracked
    let filterTracked = null;
    if (selectedPlot === "scatter") {
      filterTracked = trackedMutations.filter(item => {
        const selectedManifestations = inputs.Manifestations.Age_of_Onset_of || [];
        const selected_1 = getManifestationKey(selectedManifestations[0]);
        const selected_2 = getManifestationKey(selectedManifestations[1]);

        const matchesManifestation = item[selected_1] != null && item[selected_2] != null
        return matchesManifestation;
      });
    }
    else {
      filterTracked = trackedMutations.filter(item => {
        // sex & severity checks (unchanged)
        const sexValue =
          inputs.Selectors.Sex === 'Male' ? 0 :
            inputs.Selectors.Sex === 'Female' ? 1 :
              null;
        const matchesSex = sexValue == null || item.sex === sexValue;
        const matchesSeverity = !inputs.Selectors.Severity_Score || item.severity === inputs.Selectors.Severity_Score;

        const sel = inputs.Manifestations.Age_of_Onset_of;
        const key = sel && getManifestationKey(sel);
        const matchesManifestation = key != null && item[key] != null;

        return matchesSex && matchesSeverity && matchesManifestation;
      });
    }




    // Returns an array of dicts of the form {manifestation: xxx, ageOfOnset: xxx} for each manifestations for each patient
    const scatterData = filteredData.flatMap(item => {
      // Get the selected manifestations
      const selectedManifestations = inputs.Manifestations.Age_of_Onset_of || [];

      // If we don't have exactly two manifestations selected, return empty array
      if (selectedManifestations.length !== 2) {
        return [];
      }

      // Get the keys for the selected manifestations
      const manifestation1Key = getManifestationKey(selectedManifestations[0]);
      const manifestation2Key = getManifestationKey(selectedManifestations[1]);

      // Only include patients that have both manifestations
      if (item[manifestation1Key] === null || item[manifestation2Key] === null) {
        return [];
      }

      // Return a single data point with both manifestations
      return [{
        manifestation1: selectedManifestations[0],
        manifestation2: selectedManifestations[1],
        ageOfOnset1: item[manifestation1Key],
        ageOfOnset2: item[manifestation2Key]
      }];
    });

    console.log('Processed scatter data:', scatterData);

    // Create list of dicts of the form {manifestation: xxx, value: xxx}
    const distributionData = filteredData.flatMap(item => {
      // If a manifestation is selected, only include that one
      const selectedManifestation = inputs.Manifestations.Age_of_Onset_of;
      let manifestations;
      if (selectedManifestation && typeof selectedManifestation === 'string') {
        manifestations = [{ key: getManifestationKey(selectedManifestation), name: selectedManifestation }];
      }
      else {
        manifestations = [
          { key: 'dm', name: 'Diabetes Mellitus' },
          { key: 'di', name: 'Diabetes Insipidus' },
          { key: 'hl', name: 'Hearing Loss' },
          { key: 'oa', name: 'Optic Atrophy' }
        ];
      }

      return manifestations
        .map(manifestation => ({
          manifestation: manifestation.name,
          value: item[manifestation.key] || null
        }));
    }).filter(item => item.value !== null); // Remove null values

    console.log('Processed distribution data:', distributionData);

    console.log("TRACKED", trackedMutations)
    console.log("FILTERED", filterTracked)

    // returns selected plot
    switch (selectedPlot) {
      case 'scatter':
        return (
          <D3ScatterPlot
            data={scatterData}
            xKey="ageOfOnset1"
            yKey="ageOfOnset2"
            title={`Age of Onset: ${inputs.Manifestations.Age_of_Onset_of[0] || ''} vs ${inputs.Manifestations.Age_of_Onset_of[1] || ''}`}
            color="#6b2fb3"
            filteredData={filterTracked}
          />
        );
      case 'box':
        return (
          <D3BoxPlot
            data={distributionData}
            xKey="manifestation"
            yKey="value"
            title="Age of Onset Distribution by Manifestation"
            color="#6b2fb3"
            filteredData={filterTracked}
          />
        );
      case 'violin':
        return (
          <D3ViolinPlot
            data={distributionData}
            xKey="manifestation"
            yKey="value"
            title="Age of Onset Patterns by Manifestation"
            color="#6b2fb3"
            filteredData={filterTracked}
          />
        );
      default:
        return <p className="placeholder">Select a visualization type</p>;
    }
  };


  return (
    <>
    <Navbar title="Data Visualization" current="vis"></Navbar>
    <div className="app">
      
      {/*This section contains the (title and subtite) + the toggle button + visualization container + statistics panel */}
      <section className="visualization-header">
        <Info></Info>
      </section>
      <section className="visualization-section">
        {/* vis container = container for vis-main */}
        <div className="visualization-container">
          <button
            className='tracking-toggle'
            onClick={() => setIsTrackingOpen(open => !open)}
          >
            {isTrackingOpen ? 'Hide Tracking List' : 'Show Tracking List'}
          </button>
          {/* vis main =  controls panel + the vis-area + tracking list if opened */}
          <div className={`visualization-main${isTrackingOpen ? ' with-tracking' : ''}`}>
            <div className="controls-panel">
              <InputFields
                config={selectedPlot === 'scatter' ? { Manifestations: fieldConfig.Manifestations } : fieldConfig}
                inputs={inputs}
                onInputChange={handleInputChange}
                selectedPlot={selectedPlot}
              />
              <div className="plot-selector">
                <h4>Visualization Type</h4>
                <select
                  value={selectedPlot}
                  onChange={(e) => {
                    const newPlotType = e.target.value;
                    setSelectedPlot(newPlotType);

                    // If switching to scatter plot, set default manifestations
                    if (newPlotType === 'scatter') {
                      setInputs(prev => ({
                        ...prev,
                        Selectors: {
                          Sex: null,
                          Severity_Score: null
                        },
                        Manifestations: {
                          Age_of_Onset_of: ["Diabetes Mellitus", "Optic Atrophy"]
                        }
                      }));
                    }
                    // If switching away from scatter plot, clear all manifestation selections
                    else if (selectedPlot === 'scatter') {
                      setInputs(prev => ({
                        ...prev,
                        Manifestations: {
                          Age_of_Onset_of: null
                        }
                      }));
                    }
                  }}
                >
                  <option value="scatter">Scatter Plot</option>
                  <option value="box">Box Plot</option>
                  <option value="violin">Violin Plot</option>
                </select>
              </div>
            </div>

            <div className="visualization-area">
              {renderVisualization()}
            </div>

            {isTrackingOpen && (<TrackingList
              onListChange={setTrackedMutations}
            />)}

          </div>
        </div>
        <div className="statistics-panel">
          <StatsTable
            manifestation={inputs.Manifestations.Age_of_Onset_of}
            sex={inputs.Selectors.Sex}
            severity={inputs.Selectors.Severity_Score}
            selectedPlot={selectedPlot}
          />
        </div>


      </section>
    </div>
    </>
  );
}

export default Visualization;
