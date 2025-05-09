import React from 'react';
import PropTypes from 'prop-types';

// Displays card of information with props
export default function InfoCard({ icon, title, subtitle, description }) {
    return (
        <div className="info-card">
            <div className="icon">{icon}</div>
            <h3>{title}</h3>
            <p className="subtitle">{subtitle}</p>
            <p>{description}</p>
        </div>
    );
}

InfoCard.propTypes = {
    icon: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired
}; 