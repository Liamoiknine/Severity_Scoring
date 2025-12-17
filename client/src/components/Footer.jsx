import "../styles/Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <p className="footer-text">
            © {currentYear} Severity Scoring Tool. All rights reserved.
          </p>
          <p className="footer-disclaimer">
            This tool provides a preliminary assessment only. For clinical applications, please consult with a genetic specialist.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

