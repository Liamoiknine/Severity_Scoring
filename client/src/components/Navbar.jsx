import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = ({title, current}) => {
  // For dynamic sizing and content adjustments for sidebar
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header class="head">
      <div className="navbar-container">
        <h3>{title}</h3>
        
        {/* Large screen view */}
        <nav className="desktop-nav">
        {current === 'vis' ? <>
            <Link to="/"><strong>Visualize Our Data</strong></Link>
            <Link to="/calculator">Calculate Severity Score</Link>        
        </>
        : <>
            <Link to="/">Visualize Our Data</Link>
            <Link to="/calculator"><strong>Calculate Severity Score</strong></Link>
        </>
        }

        </nav>

        {/* Smaller screen view - collapse to hamburger menu*/}
        <button 
          className="mobile-menu-button"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
          >
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Hamburger menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-links">
          <Link 
            to="/" 
            onClick={() => setIsMenuOpen(false)}
          >
            Visualize Our Data
          </Link>
          <Link 
            to="/calculator" 
            onClick={() => setIsMenuOpen(false)}
          >
            Calculate Severity Score
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;