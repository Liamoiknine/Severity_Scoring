import React, { useState } from 'react';
import '../styles/Info2.css';

export default function Info2({ isClosed: externalIsClosed, onToggle, variant = 'visualization' }) {
    const isClosed = externalIsClosed !== undefined ? externalIsClosed : true;
    const [activeTab, setActiveTab] = useState(variant === 'calculator' ? 'calculator' : 'visualization');
    const [showReportForm, setShowReportForm] = useState(false);
    const [reportMessage, setReportMessage] = useState('');
    
    if (isClosed) return null;

    const handleReportIssue = () => {
        const subject = encodeURIComponent('Issue Report');
        const body = encodeURIComponent(
            `Hi Liam,\n\n\n` +
            `I wanted to report this about the site:\n\n\n` +
            `${reportMessage}\n\n\n` +
            `Thanks!`
        );
        window.location.href = `mailto:l.j.oiknine@wustl.edu?subject=${subject}&body=${body}`;
    };

    const visualizationContent = (
        <>
            <h2>Help</h2>
            <p>
                The <strong>control panel</strong> is where you input what data you would like to visualize. Select the manifestation(s) to analyze, and filter by sex or severity score.
            </p>
            <p>
                This tool serves as a visual aid for understanding Wolfram Syndrome based on data from our local registry, curated by the Urano Lab at Washington University in St. Louis. Each data point represents the age at which a patient from our registry (de-identified) first exhibited a specific symptom. The built-in filter for 'severity scores' is grounded in a classification system developed in our research, and orders patients by predicted disease progression (6 being the most severe).
            </p>
            <p>
                Use the <strong>tracking list</strong> to monitor specific patients within the dataset. Enter either one or two mutations into the input fields, and a new "patient" will be added to your tracking list, where you can view their full info and visualize their data with respect to the full distribution.
            </p>
        </>
    );

    const calculatorContent = (
        <>
            <h2>Help</h2>
            <p>
                The <strong>Severity Score Calculator</strong> predicts disease progression for Wolfram Syndrome based on genetic mutations. Enter one or two mutations in standard notation to receive a severity score from 1-6, where 6 indicates the most severe predicted progression.
            </p>
            <p>
                <strong>How to use:</strong> Enter mutations in either protein (p.) or coding sequence (c.) notation in the input fields. The calculator will analyze the mutation(s) and return a severity score based on our research classification system. You can enter a single mutation or two mutations for compound heterozygous cases.
            </p>
            <p>
                <strong>Mutation Notation:</strong> Mutations must be entered in standard form without spaces, spelling errors, or unrecognized characters. See the "Expected Mutation Form" section below for examples of acceptable entries. For questions about mutation notation, email l.j.oiknine@wustl.edu.
            </p>
        </>
    );

    return (
        <div className="help-modal-overlay" onClick={onToggle}>
            <div className="help-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="help-modal-close" onClick={onToggle}>×</button>
                <div className="help-modal-tabs">
                    <button
                        className={`help-modal-tab ${activeTab === 'visualization' ? 'active' : ''}`}
                        onClick={() => setActiveTab('visualization')}
                    >
                        Data Visualization
                    </button>
                    <button
                        className={`help-modal-tab ${activeTab === 'calculator' ? 'active' : ''}`}
                        onClick={() => setActiveTab('calculator')}
                    >
                        Severity Score Calculator
                    </button>
                </div>
                <div className="help-modal-body">
                    <div className="help-modal-body-content" key={activeTab}>
                        {activeTab === 'visualization' ? visualizationContent : calculatorContent}
                    </div>
                    <div className="help-modal-divider"></div>
                    <div className="help-modal-report-section">
                        <p className="help-modal-report-message">
                            If you encounter an issue or have a question, please report it using the button below.
                        </p>
                        {!showReportForm ? (
                            <button 
                                className="help-modal-report-button"
                                onClick={() => setShowReportForm(true)}
                            >
                                Report Issue
                            </button>
                        ) : (
                            <div className="help-modal-report-form">
                                <textarea
                                    className="help-modal-report-textarea"
                                    placeholder="Describe your issue or question here..."
                                    value={reportMessage}
                                    onChange={(e) => setReportMessage(e.target.value)}
                                    rows={4}
                                />
                                <div className="help-modal-report-actions">
                                    <button 
                                        className="help-modal-report-button"
                                        onClick={handleReportIssue}
                                        disabled={!reportMessage.trim()}
                                    >
                                        Send Report
                                    </button>
                                    <button 
                                        className="help-modal-cancel-button"
                                        onClick={() => {
                                            setShowReportForm(false);
                                            setReportMessage('');
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
