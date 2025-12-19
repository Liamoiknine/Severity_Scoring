import React, { useState, useEffect, useRef } from 'react';
import TrackingList from '../components/TrackingList';
import D3ScatterPlot from '../components/D3ScatterPlot';
import D3ViolinPlot from '../components/D3ViolinPlot';
import D3BoxPlot from '../components/D3BoxPlot';
import StatsCards from '../components/StatsCards';
import PatientInfoPanel from '../components/PatientInfoPanel';
import Info from '../components/Info';
import FilterBar from '../components/FilterBar';
import StartupPopup from '../components/StartupPopup';
import { scroller } from 'react-scroll';
import '../styles/Visualization.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import colors from '../config/colors';


// Auxialiary Functions:

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
  const [isInfoClosed, setIsInfoClosed] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [shouldScrollToPanel, setShouldScrollToPanel] = useState(false);
  const patientInfoPanelRef = useRef(null);

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

        const BASE = process.env.REACT_APP_API_URL || "http://localhost:3456/api";
        const url = `${BASE}/patients?${queryParams.toString()}`;
        console.log('Fetching data from:', url);
        const patientsResponse = await fetch(url, { credentials: 'include' });
        //error handling
        if (!patientsResponse.ok) {
          const errorData = await patientsResponse.json();
          console.error('API Error:', {
            status: patientsResponse.status,
            statusText: patientsResponse.statusText,
            error: errorData
          });
          // Check if this is a "no data" case (404 with "No patients found" message)
          if (patientsResponse.status === 404 && errorData.error && errorData.error.includes('No patients found')) {
            setError('NO_DATA'); // Special flag for no data case
            setApiData([]); // Set empty array for no data
          } else {
          throw new Error(`API error: ${patientsResponse.status} - ${errorData.error || patientsResponse.statusText}`);
        }
        } else {
        const patientsData = await patientsResponse.json();
        //set apiData to the patients data
        setApiData(patientsData);
        console.log('Updated apiData state:', patientsData);
        }
        setLoading(false);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    }; // End of fetch request

    fetchData();
  }, [inputs]); //runs when inputs change

  // Auto-scroll to patient info panel only when "See All" is clicked
  useEffect(() => {
    if (shouldScrollToPanel && selectedPatient && patientInfoPanelRef.current) {
      // Small delay to ensure the panel is rendered
      setTimeout(() => {
        patientInfoPanelRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
        // Reset the scroll flag after scrolling
        setShouldScrollToPanel(false);
      }, 100);
    }
  }, [shouldScrollToPanel, selectedPatient]);

  // Updates the inputs stat variable based on user input changes
  const handleInputChange = (group, field, value) => {
    setInputs(prev => {
      const updatedGroup = { ...prev[group] };

      if (group === 'Selectors') {
        //if value clicked was already selected, deselect it
        if (updatedGroup[field] === value) {
          updatedGroup[field] = null;
        } else {
          // select new value without clearing other selector fields
          // This allows both sex and severity to be selected simultaneously
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
      if (error === 'NO_DATA') {
        return <p>No patients found for this combination of filters.</p>;
      }
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
        // sex & severity checks
        const sexValue =
          inputs.Selectors.Sex === 'Male' ? 0 :
            inputs.Selectors.Sex === 'Female' ? 1 :
              null;
        const matchesSex = sexValue == null || item.sex === sexValue;
        const matchesSeverity = !inputs.Selectors.Severity_Score || item.severity === inputs.Selectors.Severity_Score;

        // manifestation checks
        const selectedManifestations = inputs.Manifestations.Age_of_Onset_of || [];
        const selected_1 = getManifestationKey(selectedManifestations[0]);
        const selected_2 = getManifestationKey(selectedManifestations[1]);

        const matchesManifestation = item[selected_1] != null && item[selected_2] != null;
        
        return matchesSex && matchesSeverity && matchesManifestation;
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

      // Return a single data point with both manifestations and full patient data
      return [{
        manifestation1: selectedManifestations[0],
        manifestation2: selectedManifestations[1],
        ageOfOnset1: item[manifestation1Key],
        ageOfOnset2: item[manifestation2Key],
        // Include full patient data for click functionality
        patientData: {
          allele_1: item.allele_1,
          allele_2: item.allele_2,
          inheritance: item.inheritance,
          sex: item.sex,
          age: item.age,
          severity: item.severity,
          dm: item.dm,
          oa: item.oa,
          di: item.di,
          hl: item.hl,
          id: item.id
        }
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
            color={colors.chartPrimary}
            filteredData={filterTracked}
            onPointClick={setSelectedPatient}
            onSeeAllClick={() => setShouldScrollToPanel(true)}
          />
        );
      case 'box':
        return (
          <D3BoxPlot
            data={distributionData}
            xKey="manifestation"
            yKey="value"
            title="Age of Onset Distribution by Manifestation"
            color={colors.chartPrimary}
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
            color={colors.chartPrimary}
            filteredData={filterTracked}
          />
        );
      default:
        return <p className="placeholder">Select a visualization type</p>;
    }
  };


  return (
    <>
    <StartupPopup />
    <Navbar 
      title="Data Visualization" 
      current="vis"
      showHelpButton={true}
      onHelpClick={() => setIsInfoClosed(!isInfoClosed)}
    ></Navbar>
    <div className="app">
    <div className="filter-bar-container-wrapper">
      <FilterBar
        inputs={inputs}
        onInputChange={handleInputChange}
        selectedPlot={selectedPlot}
        setInputs={setInputs}
        onPlotChange={(newPlotType) => {
          setSelectedPlot(newPlotType);

          // If switching to scatter plot, set default manifestations (keep existing Selectors)
          if (newPlotType === 'scatter') {
            setInputs(prev => ({
              ...prev,
              Manifestations: {
                Age_of_Onset_of: ["Diabetes Mellitus", "Optic Atrophy"]
              }
            }));
          }
          // If switching away from scatter plot, clear all manifestation selections and reset patient info
          else if (selectedPlot === 'scatter') {
            setInputs(prev => ({
              ...prev,
              Manifestations: {
                Age_of_Onset_of: null
              }
            }));
            // Reset patient info panel when switching away from scatter plot
            setSelectedPatient(null);
            setShouldScrollToPanel(false);
          }
        }}
      />
      <button
        className='tracking-toggle-new'
        onClick={() => setIsTrackingOpen(open => !open)}
      >
        {isTrackingOpen ? 'Hide Tracking List' : 'Show Tracking List'}
      </button>
    </div>
      
      {/*This section contains the (title and subtite) + the toggle button + visualization container + statistics panel */}
      <section className="visualization-header">
        <Info isClosed={isInfoClosed} onToggle={() => setIsInfoClosed(true)}></Info>
      </section>
      <section className="visualization-section">
        {/* vis container = container for vis-main */}
        <div className="visualization-container">
          {/* vis main = the vis-area + tracking list if opened */}
          <div className={`visualization-main${isTrackingOpen ? ' with-tracking' : ''}`}>
            <div className="visualization-area">
              {renderVisualization()}
            </div>

            {isTrackingOpen && (<TrackingList
              onListChange={setTrackedMutations}
            />)}

          </div>
        </div>
        <div className={`stats-row ${selectedPlot === 'scatter' ? 'with-patient-info' : 'full-width'}`}>
          <div className={`stats-cards-wrapper ${selectedPlot === 'scatter' ? 'half-width' : 'full-width'}`}>
            <StatsCards
              manifestation={inputs.Manifestations.Age_of_Onset_of}
              sex={inputs.Selectors.Sex}
              severity={inputs.Selectors.Severity_Score}
              selectedPlot={selectedPlot}
            />
          </div>
          {selectedPlot === 'scatter' && (
            <div className="patient-info-panel-container" ref={patientInfoPanelRef}>
              <PatientInfoPanel patientData={selectedPatient} />
            </div>
          )}
        </div>


      </section>
    </div>
    <Footer />
    </>
  );
}

export default Visualization;
