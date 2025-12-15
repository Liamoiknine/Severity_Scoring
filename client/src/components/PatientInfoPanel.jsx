import React from 'react';
import '../styles/PatientInfoPanel.css';
import colors from '../config/colors';

export default function PatientInfoPanel({ patientData }) {
    if (!patientData) {
        return (
            <div className="patient-info-panel">
                <h3>Patient Information</h3>
                <p className="no-selection">Click on a data point in the scatter plot to view patient details.</p>
            </div>
        );
    }

    const formatSex = (sex) => {
        if (sex === 0) return 'Male';
        if (sex === 1) return 'Female';
        return '—';
    };

    const formatAge = (age) => {
        if (age === null || age === undefined) return '—';
        return `${age} years`;
    };

    const formatAgeOfOnset = (age) => {
        if (age === null || age === undefined) return 'Not reported';
        return `${age} years`;
    };

    return (
        <div className="patient-info-panel">
            <h3>Selected Patient Info</h3>
            <div className="patient-info-content">
                <div className="info-section">
                    <h4>Basic Information</h4>
                    <div className="info-row info-row-even">
                        <span className="info-label">Patient ID:</span>
                        <span className="info-value">{patientData.id || '—'}</span>
                    </div>
                    <div className="info-row info-row-odd">
                        <span className="info-label">Allele 1:</span>
                        <span className="info-value">{patientData.allele_1 || '—'}</span>
                    </div>
                    <div className="info-row info-row-even">
                        <span className="info-label">Allele 2:</span>
                        <span className="info-value">{patientData.allele_2 || '—'}</span>
                    </div>
                    <div className="info-row info-row-odd">
                        <span className="info-label">Inheritance:</span>
                        <span className="info-value">{patientData.inheritance || '—'}</span>
                    </div>
                    <div className="info-row info-row-even">
                        <span className="info-label">Sex:</span>
                        <span className="info-value">{formatSex(patientData.sex)}</span>
                    </div>
                    <div className="info-row info-row-odd">
                        <span className="info-label">Age:</span>
                        <span className="info-value">{formatAge(patientData.age)}</span>
                    </div>
                    <div className="info-row info-row-even">
                        <span className="info-label">Severity Score:</span>
                        <span className="info-value">{patientData.severity !== null && patientData.severity !== undefined ? patientData.severity : '—'}</span>
                    </div>
                </div>

                <div className="info-section">
                    <h4>Age of Onset by Manifestation</h4>
                    <div className="info-row info-row-odd">
                        <span className="info-label">Diabetes Mellitus:</span>
                        <span className="info-value">{formatAgeOfOnset(patientData.dm)}</span>
                    </div>
                    <div className="info-row info-row-even">
                        <span className="info-label">Optic Atrophy:</span>
                        <span className="info-value">{formatAgeOfOnset(patientData.oa)}</span>
                    </div>
                    <div className="info-row info-row-odd">
                        <span className="info-label">Diabetes Insipidus:</span>
                        <span className="info-value">{formatAgeOfOnset(patientData.di)}</span>
                    </div>
                    <div className="info-row info-row-even">
                        <span className="info-label">Hearing Loss:</span>
                        <span className="info-value">{formatAgeOfOnset(patientData.hl)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

