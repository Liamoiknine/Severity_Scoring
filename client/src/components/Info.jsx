import React, { useState, useEffect } from 'react';
import '../styles/Info.css';

export default function Info() {
    const [isClosed, setIsClosed] = useState(true);

    useEffect(() => {
        if(!isClosed){
            window.scrollTo(0, 0);
        }
      }, [isClosed]);

    return (
        <>
            <div className={`container-wrapper ${isClosed ? 'closed' : ''}`}>
                <div className="container">
                    <div className="info-component">
                        <div className="control-desc item">
                            <p>
                                The <strong>control panel</strong> is where you input what data you would like to visualize. Select the manifestation(s) to analyze, and filter by sex or severity score.
                            </p>
                        </div>

                        <div className="gen-desc item">
                            <p>
                                This tool serves as a visual aid for understanding Wolfram Syndrome based on data from our local registry, curated by the Urano Lab at Washington University in St. Louis. Each data point represents the age at which a patient from our registry (de-identified) first exhibited a specific symptom. The built-in filter for ‘severity scores’ is grounded in a classification system developed in our research, and orders patients by predicted disease progression (6 being the most severe).
                            </p>
                        </div>

                        <div className="tracking-desc item">
                            <p>
                                Use the <strong>tracking list </strong> to monitor specific patients within the dataset. Enter either one or two mutations into the input fields, and a new “patient” will be added to your tracking list, where you can view their full info and visualize their data with respect to the full distribution.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {
                isClosed ?  
                    <button
                    className='btn-closed'
                    onClick={()=> setIsClosed(false)}
                    >
                        ?
                    </button>
                :  
                <>
                    <button
                    className='btn-closed'
                    onClick={()=> setIsClosed(true)}
                    >
                        ?
                    </button>
                    <button
                        className='close'
                        onClick={() => setIsClosed(true)}
                    >
                    Got it
                    </button>
            </>
            }

        </>
    );
}
