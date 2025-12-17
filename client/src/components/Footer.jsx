import { Link } from "react-router-dom";
import "../styles/Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-brand">
            <img src="/favicon.ico" alt="Washington University in St. Louis" className="footer-logo" />
            <div className="footer-brand-text">
              <h3 className="footer-brand-title">Urano Lab</h3>
              <p className="footer-brand-subtitle">Washington University in St. Louis</p>
            </div>
          </div>

          <div className="footer-links-section">
            <h4 className="footer-section-title">Quick Links</h4>
            <nav className="footer-nav">
              <Link to="/" className="footer-link">Visualize Our Data</Link>
              <Link to="/calculator" className="footer-link">Calculate Severity Score</Link>
            </nav>
          </div>

          <div className="footer-contact-section">
            <h4 className="footer-section-title">Contact</h4>
            <div className="footer-contact-info">
              <a href="mailto:l.j.oiknine@wustl.edu" className="footer-email">
                l.j.oiknine@wustl.edu
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-disclaimer">
            This tool provides a preliminary assessment only. For clinical applications, please consult with a genetic specialist.
          </p>
          <p className="footer-copyright">
            © {currentYear} Urano Lab, Washington University in St. Louis. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

