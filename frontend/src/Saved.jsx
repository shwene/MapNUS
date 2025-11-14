import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Saved.css';

import homeIcon from './assets/home.png';

function Saved() {
  const navigate = useNavigate();
  const [savedVenues, setSavedVenues] = useState([]);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [venuesOpen, setVenuesOpen] = useState(true);
  const [pathsOpen, setPathsOpen] = useState(true);

  // Load saved items from localStorage
  useEffect(() => {
    const venues = JSON.parse(localStorage.getItem('savedVenues') || '[]');
    let routes = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
    
    let needsMigration = false;
    const migratedRoutes = routes.map(route => {
      if (!route.includes('~~~')) {
        needsMigration = true;
        return route;
      }
      return route;
    });
    
    // If migration happened, save the updated format
    if (needsMigration) {
      console.warn('Old route format detected. Please re-save your routes for proper display.');
    }
    
    setSavedVenues(venues);
    setSavedRoutes(migratedRoutes);
  }, []);

  // Navigate to venue
  const handleVenueClick = (venueName) => {
    navigate(`/venue/${encodeURIComponent(venueName)}`);
  };

  // Navigate to route
  const handleRouteClick = (routeKey) => {
    let from, to;
    
    if (routeKey.includes('~~~')) {
      // New format
      [from, to] = routeKey.split('~~~');
    } else {
      // Old format - show error
      alert('This route uses an old format. Please remove it and save it again from the map page.');
      return;
    }
    
    navigate(`/map-layer/${encodeURIComponent(from)}/${encodeURIComponent(to)}`);
  };

  // Remove venue from saved
  const removeVenue = (venueName, e) => {
    e.stopPropagation(); // Prevent navigation when clicking remove
    const updated = savedVenues.filter(v => v !== venueName);
    localStorage.setItem('savedVenues', JSON.stringify(updated));
    setSavedVenues(updated);
  };

  // Remove route from saved
  const removeRoute = (routeKey, e) => {
    e.stopPropagation(); // Prevent navigation when clicking remove
    const updated = savedRoutes.filter(r => r !== routeKey);
    localStorage.setItem('savedRoutes', JSON.stringify(updated));
    setSavedRoutes(updated);
  };

  // Format route key for display
  const formatRoute = (routeKey) => {
    const [from, to] = routeKey.split('~~~');
    return `From ${from} to ${to}`;
  };

  return (
    <div className="saved-container">
      {/* Navigation Bar */}
      <nav className="saved-nav">
        <button className="saved-home-btn" onClick={() => navigate('/')}>
          <img src={homeIcon} alt="Home" className="home-icon" />
        </button>
        <h2 className="saved-nav-title">Saved</h2>
        <div className="saved-nav-spacer"></div>
      </nav>

      {/* Content Area */}
      <div className="saved-content">
        {/* Check if there are any saved items */}
        {savedVenues.length === 0 && savedRoutes.length === 0 ? (
          <div className="saved-empty">
            <div className="empty-icon">❤️</div>
            <h3>No saved items yet</h3>
            <p>Save your favorite venues and routes to access them quickly!</p>
          </div>
        ) : (
          <>
            {/* Saved Venues Section */}
            <div className="saved-section">
              <button 
                className="section-header"
                onClick={() => setVenuesOpen(!venuesOpen)}
              >
                <span className="section-title">
                  <span className="section-icon">📍</span>
                  Venues
                  <span className="section-count">({savedVenues.length})</span>
                </span>
                <span className={`chevron ${venuesOpen ? 'open' : ''}`}>▼</span>
              </button>
              
              {venuesOpen && (
                <div className="section-content">
                  {savedVenues.length > 0 ? (
                    <div className="saved-items">
                      {savedVenues.map((venue) => (
                        <div
                          key={venue}
                          className="saved-item"
                          onClick={() => handleVenueClick(venue)}
                        >
                          <span className="item-name">{venue}</span>
                          <button 
                            className="remove-btn"
                            onClick={(e) => removeVenue(venue, e)}
                            title="Remove from saved"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="section-empty">
                      <p>No saved venues</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Saved Paths Section */}
            <div className="saved-section">
              <button 
                className="section-header"
                onClick={() => setPathsOpen(!pathsOpen)}
              >
                <span className="section-title">
                  <span className="section-icon">🗺️</span>
                  Paths
                  <span className="section-count">({savedRoutes.length})</span>
                </span>
                <span className={`chevron ${pathsOpen ? 'open' : ''}`}>▼</span>
              </button>
              
              {pathsOpen && (
                <div className="section-content">
                  {savedRoutes.length > 0 ? (
                    <div className="saved-items">
                      {savedRoutes.map((route) => (
                        <div
                          key={route}
                          className="saved-item"
                          onClick={() => handleRouteClick(route)}
                        >
                          <span className="item-name">{formatRoute(route)}</span>
                          <button 
                            className="remove-btn"
                            onClick={(e) => removeRoute(route, e)}
                            title="Remove from saved"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="section-empty">
                      <p>No saved paths</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Saved;
