import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Papa from 'papaparse';
import VenueMapComponent from './VenueMapComponent';
import './VenueDetail.css';

import homeIcon from './assets/home.png';
import unlikedIcon from './assets/unliked.png';
import likedIcon from './assets/liked.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function VenueDetail() {
  const { venueName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [venueData, setVenueData] = useState(null);
  const [layerGeoJSON, setLayerGeoJSON] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [venueInfo, setVenueInfo] = useState({ layer: null, group: null });

  // Load venue info from CSV if not passed via state
  useEffect(() => {
    const loadVenueInfo = async () => {
      // Check if layer and group info passed from navigation state
      if (location.state?.layer && location.state?.group) {
        setVenueInfo({
          layer: location.state.layer,
          group: location.state.group
        });
        return;
      }

      // Else, fetch from CSV
      try {
        const response = await fetch('/locations.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const venue = results.data.find(row => row.Name === venueName);
            if (venue) {
              setVenueInfo({
                layer: venue.Parent_Layer,
                group: venue.Group
              });
            }
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
          }
        });
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };

    loadVenueInfo();
  }, [venueName, location.state]);

  // Check if venue is saved
  useEffect(() => {
    const savedVenues = JSON.parse(localStorage.getItem('savedVenues') || '[]');
    setIsSaved(savedVenues.includes(venueName));
  }, [venueName]);

  // Fetch venue coordinate from backend
  useEffect(() => {
    const fetchVenueData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/venue/${encodeURIComponent(venueName)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch venue data');
        }
        const result = await response.json();
        setVenueData(result);
        setLoading(false);
      } catch (err) {
        setError(`Error fetching venue data: ${err.message}`);
        setLoading(false);
      }
    };

    fetchVenueData();
  }, [venueName]);

  // Fetch layer GeoJSON
  useEffect(() => {
    const fetchLayerGeoJSON = async () => {
      if (!venueInfo.layer || venueInfo.layer === 'Unknown') return;
      
      try {
        const geojsonPath = `/layers/${venueInfo.layer}.geojson`;
        const response = await fetch(geojsonPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch layer GeoJSON for ${venueInfo.layer}`);
        }
        const result = await response.json();
        setLayerGeoJSON(result);
      } catch (err) {
        console.error(`Error fetching layer GeoJSON: ${err.message}`);
        setLayerGeoJSON(null);
      }
    };

    fetchLayerGeoJSON();
  }, [venueInfo.layer]);

  // Toggle saved venue
  const toggleSaved = () => {
    const savedVenues = JSON.parse(localStorage.getItem('savedVenues') || '[]');
    
    if (isSaved) {
      const updated = savedVenues.filter(name => name !== venueName);
      localStorage.setItem('savedVenues', JSON.stringify(updated));
      setIsSaved(false);
    } else {
      savedVenues.push(venueName);
      localStorage.setItem('savedVenues', JSON.stringify(savedVenues));
      setIsSaved(true);
    }
  };

  if (loading) {
    return (
      <div className="venue-loading-container">
        <div className="loading-spinner"></div>
        <p>Loading venue {venueName}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="venue-error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/venues')}>Back to Venues</button>
      </div>
    );
  }

  return (
    <div className="venue-detail-container">
      {/* Navigation Bar */}
      <nav className="venue-nav">
        <button className="venue-home-btn" onClick={() => navigate('/')}>
          <img src={homeIcon} alt="Home" className="home-icon" />
        </button>
        <h2 className="venue-nav-title">{venueName}</h2>
        <button className="venue-save-btn" onClick={toggleSaved}>
          <img 
            src={isSaved ? likedIcon : unlikedIcon} 
            alt={isSaved ? "Saved" : "Not saved"} 
            className="save-icon"
          />
        </button>
      </nav>

      {/* Map View */}
      <div className="venue-map-container">
        <VenueMapComponent 
          coordinate={venueData?.coordinate}
          layerGeoJSON={layerGeoJSON}
          venueName={venueName}
        />
      </div>

      {/* Status Bar */}
      <div className="venue-status-bar">
        <div className="venue-info">
          <span className="venue-group-label">Located At</span>
          <span className="venue-group-value">{venueInfo.group || 'Unknown'}</span>
        </div>
      </div>
    </div>
  );
}

export default VenueDetail;
