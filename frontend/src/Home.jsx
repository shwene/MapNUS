import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import './Home.css';

import catLogo from './assets/cat-logo.png';
import heartIcon from './assets/heart-icon.png';
import searchIcon from './assets/search-icon.png';

function Home() {
  const navigate = useNavigate();
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [fromDropdownOpen, setFromDropdownOpen] = useState(false);
  const [toDropdownOpen, setToDropdownOpen] = useState(false);
  const [fromSelected, setFromSelected] = useState(null);
  const [toSelected, setToSelected] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const fromRef = useRef(null);
  const toRef = useRef(null);

  // Load CSV data on component mount
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const response = await fetch('/locations.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Transform CSV data and trim whitespace
            const locationData = results.data.map(row => ({
              name: (row.Name || '').trim(),
              group: (row.Group || '').trim(),
              layer: (row.Parent_Layer || '').trim()
            }));
            setLocations(locationData);
            setLoading(false);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading CSV:', error);
        setLoading(false);
      }
    };

    loadLocations();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fromRef.current && !fromRef.current.contains(event.target)) {
        setFromDropdownOpen(false);
      }
      if (toRef.current && !toRef.current.contains(event.target)) {
        setToDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter and group locations
  const getFilteredLocations = (searchValue) => {
    const filtered = locations.filter(loc => 
      loc.name.toLowerCase().includes(searchValue.toLowerCase())
    );
    
    // Group by category
    const grouped = {};
    filtered.forEach(loc => {
      const groupName = loc.group || 'Unknown';
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(loc);
    });
    
    return grouped;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (fromSelected && toSelected) {
      const queryUrl = `/map-layer/${encodeURIComponent(fromSelected)}/${encodeURIComponent(toSelected)}`;
      navigate(queryUrl);
    }
  };

  const handleFromSelect = (name) => {
    setFromSelected(name);
    setFromValue(name);
    setFromDropdownOpen(false);
  };

  const handleToSelect = (name) => {
    setToSelected(name);
    setToValue(name);
    setToDropdownOpen(false);
  };

  const fromFiltered = getFilteredLocations(fromValue);
  const toFiltered = getFilteredLocations(toValue);

  // Show loading state
  if (loading) {
    return (
      <div className="home-container">
        <div className="home-main">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Main Content */}
      <div className="home-main">
        {/* Logo */}
        <div className="logo-container">
          <div className="logo-circle">
            <img src={catLogo} alt="MapNUS Logo" className="logo-icon-img" />
          </div>
        </div>

        {/* Title */}
        <h1 className="home-title">
          Map<span className="title-accent">NUS</span>
        </h1>
        <p className="home-subtitle">
          Wander Smart. Your Campus Guide.
        </p>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="search-form">
          <div className="form-card">
            {/* From Input */}
            <div className={`input-group ${fromDropdownOpen ? 'input-group-active' : ''}`} ref={fromRef}>
              <label className="input-label">From</label>
              <input
                type="text"
                value={fromValue}
                onChange={(e) => {
                  setFromValue(e.target.value);
                  setFromSelected(null);
                  setFromDropdownOpen(true);
                }}
                onFocus={() => setFromDropdownOpen(true)}
                placeholder="Choose your origin"
                className="form-input"
                required
              />
              
              {fromDropdownOpen && (
                <div className="dropdown">
                  {Object.keys(fromFiltered).length > 0 ? (
                    Object.keys(fromFiltered).sort().map((group) => (
                      <div key={group} className="dropdown-group">
                        <div className="dropdown-group-title">
                          {group}
                        </div>
                        {fromFiltered[group].map((loc) => (
                          <div
                            key={loc.name}
                            onClick={() => handleFromSelect(loc.name)}
                            className="dropdown-item"
                          >
                            {loc.name}
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-empty">
                      No locations found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* To Input */}
            <div className={`input-group ${toDropdownOpen ? 'input-group-active' : ''}`} ref={toRef}>
              <label className="input-label">To</label>
              <input
                type="text"
                value={toValue}
                onChange={(e) => {
                  setToValue(e.target.value);
                  setToSelected(null);
                  setToDropdownOpen(true);
                }}
                onFocus={() => setToDropdownOpen(true)}
                placeholder="Choose your destination"
                className="form-input"
                required
              />
              
              {toDropdownOpen && (
                <div className="dropdown">
                  {Object.keys(toFiltered).length > 0 ? (
                    Object.keys(toFiltered).sort().map((group) => (
                      <div key={group} className="dropdown-group">
                        <div className="dropdown-group-title">
                          {group}
                        </div>
                        {toFiltered[group].map((loc) => (
                          <div
                            key={loc.name}
                            onClick={() => handleToSelect(loc.name)}
                            className="dropdown-item"
                          >
                            {loc.name}
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-empty">
                      No locations found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!fromSelected || !toSelected}
              className="submit-button"
            >
              Let's Go! 🚀
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <div className="bottom-nav-content">
          {/* Saved Button */}
          <button
            onClick={() => navigate('/saved')}
            className="nav-button"
          >
            <div className="nav-icon">
              <img src={heartIcon} alt="Saved" className="nav-icon-img" />
            </div>
            <span className="nav-label">Saved</span>
          </button>

          {/* Venues Button */}
          <button
            onClick={() => navigate('/venues')}
            className="nav-button"
          >
            <div className="nav-icon">
              <img src={searchIcon} alt="Venues" className="nav-icon-img" />
            </div>
            <span className="nav-label">Venues</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
