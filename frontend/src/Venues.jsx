import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import './Venues.css';

import homeIcon from './assets/home.png';

function Venues() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const searchRef = useRef(null);

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
            // Filter out bus stops and transform data
            // Trim all values to remove whitespace
            const locationData = results.data
              .filter(row => row.Name && !row.Name.startsWith('Busstop'))
              .map(row => ({
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

  // Filter and group locations
  const getFilteredLocations = () => {
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

  const handleVenueClick = (venueName, layer, group) => {
    // Navigate to venue detail page
    navigate(`/venue/${encodeURIComponent(venueName)}`, {
      state: { layer, group }
    });
  };

  const filteredLocations = getFilteredLocations();
  
  // Sort groups alphabetically
  const sortedGroups = Object.keys(filteredLocations).sort();

  if (loading) {
    return (
      <div className="venues-loading">
        <div className="loading-spinner"></div>
        <p>Loading venues...</p>
      </div>
    );
  }

  return (
    <div className="venues-container">
      {/* Navigation Bar */}
      <nav className="venues-nav">
        <button className="venues-home-btn" onClick={() => navigate('/')}>
          <img src={homeIcon} alt="Home" className="home-icon" />
        </button>
        <h2 className="venues-nav-title">Explore Venues</h2>
        <div className="venues-nav-spacer"></div>
      </nav>

      {/* Content Area */}
      <div className="venues-content">
        {/* Search Bar */}
        <div className="venues-search-section">
          <div className="venues-search-container" ref={searchRef}>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
              }}
              placeholder="Search venues..."
              className="venues-search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        {/* Venues List */}
        <div className="venues-list-container">
          {sortedGroups.length > 0 ? (
            sortedGroups.map((group) => (
              <div key={group} className="venue-group">
                <h3 className="venue-group-title">{group}</h3>
                <div className="venue-group-items">
                  {filteredLocations[group].map((venue) => (
                    <button
                      key={venue.name}
                      className="venue-item"
                      onClick={() => handleVenueClick(venue.name, venue.layer, venue.group)}
                    >
                      <span className="venue-name">{venue.name}</span>
                      <span className="venue-arrow">→</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="venues-empty">
              <p>No venues found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Venues;
