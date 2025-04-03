import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MapComponent from './MapComponent';
import './MapLayer.css';

function MapLayer() {
  const { from, to } = useParams();
  const [pathData, setPathData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLayer, setActiveLayer] = useState(null);
  const [layerGeoJSON, setLayerGeoJSON] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/map/path?origin=${encodeURIComponent(from)}&dest=${encodeURIComponent(to)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setPathData(result);
        setLoading(false);
      } catch (err) {
        setError(`Error fetching data: ${err.message}`);
        setLoading(false);
      }
    };
 
    fetchData();
  }, [from, to]);
  
  // Function to fetch layer GeoJSON directly from file system
  const fetchLayerGeoJSON = async (layerName) => {
    if (!layerName) {
      setLayerGeoJSON(null);
      return;
    }
    
    try {
      // Construct the path to the GeoJSON file
      const geojsonPath = `/layers/${layerName}_FLOORPLAN.geojson`;
      
      const response = await fetch(geojsonPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch layer GeoJSON for ${layerName}`);
      }
      const result = await response.json();
      setLayerGeoJSON(result);
    } catch (err) {
      console.error(`Error fetching layer GeoJSON: ${err.message}`);
      setLayerGeoJSON(null);
    }
  };
  
  // Handle layer click
  const handleLayerClick = (layerName) => {
    if (activeLayer === layerName) {
      // If clicking the active layer, deselect it
      setActiveLayer(null);
      setLayerGeoJSON(null);
    } else {
      setActiveLayer(layerName);
      fetchLayerGeoJSON(layerName);
    }
  };
  
  // Get unique layers from path data
  const getUniqueLayers = () => {
    if (!pathData || !pathData.edges) return [];
    
    const layerSet = new Set();
    pathData.edges.forEach(edge => {
      if (edge.layer) layerSet.add(edge.layer);
    });
    
    return Array.from(layerSet);
  };
  
  // Format time (seconds to minutes and seconds)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };
  
  // Back to home function
  const goBack = () => {
    navigate('/');
  };
  
  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading route from {from} to {to}...</p>
    </div>
  );
  
  if (error) return (
    <div className="error-container">
      <h2>Error</h2>
      <p>{error}</p>
      <button onClick={goBack}>Back to Search</button>
    </div>
  );
  
  const layers = getUniqueLayers();
  
  return (
    <div className="map-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>MapNUS</h2>
          <button className="back-button" onClick={goBack}>New Search</button>
        </div>
        
        <div className="route-summary">
          <h3>Route Information</h3>
          <div className="route-details">
            <div className="detail-item">
              <span className="detail-label">From:</span>
              <span className="detail-value">{from}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">To:</span>
              <span className="detail-value">{to}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Distance:</span>
              <span className="detail-value">{pathData.total_distance.toFixed(2)} meters</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Walking Time:</span>
              <span className="detail-value">{formatTime(pathData.total_time_cost)}</span>
            </div>
          </div>
        </div>
        
        <div className="layers-section">
          <h3>Building Floors</h3>
          <div className="layers-list">
            {layers.map((layer) => (
              <div 
                key={layer}
                className={`layer-item ${activeLayer === layer ? 'active' : ''}`}
                onClick={() => handleLayerClick(layer)}
              >
                {layer}
              </div>
            ))}
          </div>
        </div>
        
        <div className="directions-section">
          <h3>Step by Step Directions</h3>
          <div className="directions-list">
            {pathData.edges.map((edge, index) => (
              <div 
                key={index}
                className={`direction-item ${activeLayer === edge.layer ? 'active' : ''}`}
                onClick={() => handleLayerClick(edge.layer)}
              >
                <div className="direction-step">{index + 1}</div>
                <div className="direction-content">
                  <div className="direction-title">
                    {edge.src} to {edge.dest}
                  </div>
                  <div className="direction-details">
                    <span>{edge.distance.toFixed(2)}m</span>
                    <span>·</span>
                    <span>{formatTime(edge.time_cost)}</span>
                    <span className="direction-layer">{edge.layer}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="map-view">
        <MapComponent 
          pathData={pathData} 
          activeLayer={activeLayer}
          layerGeoJSON={layerGeoJSON}
        />
      </div>
    </div>
  );
}

export default MapLayer;
