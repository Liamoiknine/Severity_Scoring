import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = ({ title, current, onHelpClick, showHelpButton }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path) => {
    // Use current prop if available (more reliable)
    if (current) {
      if (path === "/" && current === "vis") return true;
      if (path === "/calculator" && current !== "vis") return true;
    }
    // Fallback to location pathname
    return location.pathname === path;
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <img src="/favicon.ico" alt="Lab Logo" className="navbar-logo" />
            <h1 className="navbar-title">Urano Lab Software</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="navbar-nav">
          <Link
            to="/"
            className={`nav-link ${isActive("/") ? "active" : ""}`}
          >
            Data Visualization
          </Link>
          <Link
            to="/calculator"
            className={`nav-link ${isActive("/calculator") ? "active" : ""}`}
          >
            Severity Score Calculator
          </Link>
            {showHelpButton && (
              <button
                className="nav-link nav-help-button"
                onClick={onHelpClick}
              >
                Help
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className={`mobile-menu-button ${isMenuOpen ? "open" : ""}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMenuOpen ? "active" : ""}`}>
          <nav className="mobile-nav">
          <Link
            to="/"
            className={`mobile-nav-link ${isActive("/") ? "active" : ""}`}
            onClick={closeMenu}
          >
            Data Visualization
          </Link>
          <Link
            to="/calculator"
            className={`mobile-nav-link ${isActive("/calculator") ? "active" : ""}`}
            onClick={closeMenu}
          >
            Severity Score Calculator
          </Link>
            {showHelpButton && (
              <button
                className="mobile-nav-link mobile-help-button"
                onClick={() => {
                  onHelpClick();
                  closeMenu();
                }}
              >
                Help
              </button>
            )}
          </nav>
        </div>
      </header>
    </>
  );
};

export default Navbar;