import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MapComponent from './MapComponent';
import './MapLayer.css';

import unlikedIcon from './assets/unliked.png';
import likedIcon from './assets/liked.png';
import skipBackward from './assets/skip-backward.png';
import rewind from './assets/rewind.png';
import play from './assets/play.png';
import pause from './assets/pause.png';
import fastForward from './assets/fast-forward.png';
import skipForward from './assets/skip-forward.png';
import homeIcon from './assets/home.png';

// Direction icons
import straightArrow from './assets/straight-arrow.png';
import leftArrow from './assets/left-arrow.png';
import rightArrow from './assets/right-arrow.png';
import uturnArrow from './assets/uturn-arrow.png';
import stairsUp from './assets/stairs-up.png';
import stairsDown from './assets/stairs-down.png';
import liftIcon from './assets/lift.png';

const DIRECTION_ICONS = {
  'Go Straight': straightArrow,
  'Turn Left': leftArrow,
  'Turn Right': rightArrow,
  'Turn Around': uturnArrow,
  'Go Up': stairsUp,
  'Go Down': stairsDown,
  'Take Lift': liftIcon
};

function MapLayer() {
  const { from, to } = useParams();
  const [pathData, setPathData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 means showing full path
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [layerGeoJSON, setLayerGeoJSON] = useState(null);
  const [layerCache, setLayerCache] = useState({});
  const navigate = useNavigate();
  const playIntervalRef = useRef(null);
  
  // Check if route is saved
  useEffect(() => {
    const savedRoutes = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
    const routeKey = `${from}~~~${to}`;
    setIsSaved(savedRoutes.includes(routeKey));
  }, [from, to]);
  
  // Fetch path data
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
  
  // Fetch layer GeoJSON when step changes
  useEffect(() => {
    if (currentStepIndex >= 0 && pathData?.edges[currentStepIndex]) {
      const step = pathData.edges[currentStepIndex];
      if (step.layer && step.layer !== 'Unknown') {
        fetchLayerGeoJSON(step.layer);
      } else {
        setLayerGeoJSON(null);
      }
    } else {
      setLayerGeoJSON(null);
    }
  }, [currentStepIndex, pathData]);
  
  // Play functionality
  useEffect(() => {
    if (isPlaying && pathData) {
      playIntervalRef.current = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= pathData.edges.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2500); // 2.5 seconds
      
      return () => {
        if (playIntervalRef.current) {
          clearInterval(playIntervalRef.current);
        }
      };
    }
  }, [isPlaying, pathData]);
  
  const fetchLayerGeoJSON = async (layerName) => {
    // Check cache first
    if (layerCache[layerName]) {
      console.log(`Using cached GeoJSON for ${layerName}`);
      setLayerGeoJSON(layerCache[layerName]);
      return;
    }
    
    // Fetch from server if not cached
    try {
      console.log(`Fetching GeoJSON for ${layerName}`);
      const geojsonPath = `/layers/${layerName}.geojson`;
      const response = await fetch(geojsonPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch layer GeoJSON for ${layerName}`);
      }
      const result = await response.json();
      
      // Store in cache
      setLayerCache(prev => ({
        ...prev,
        [layerName]: result
      }));
      
      setLayerGeoJSON(result);
    } catch (err) {
      console.error(`Error fetching layer GeoJSON: ${err.message}`);
      setLayerGeoJSON(null);
    }
  };
  
  // Navigation functions
  const goToFirstStep = () => {
    if (!isPlaying && pathData) {
      setCurrentStepIndex(0);
    }
  };
  
  const goToPreviousStep = () => {
    if (!isPlaying && pathData && currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };
  
  const togglePlay = () => {
    if (pathData) {
      if (currentStepIndex < 0) {
        setCurrentStepIndex(0);
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const goToNextStep = () => {
    if (!isPlaying && pathData && currentStepIndex < pathData.edges.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };
  
  const goToLastStep = () => {
    if (!isPlaying && pathData) {
      setCurrentStepIndex(pathData.edges.length - 1);
    }
  };
  
  // Toggle saved route
  const toggleSaved = () => {
    const savedRoutes = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
    const routeKey = `${from}~~~${to}`;
    
    if (isSaved) {
      const updated = savedRoutes.filter(key => key !== routeKey);
      localStorage.setItem('savedRoutes', JSON.stringify(updated));
      setIsSaved(false);
    } else {
      savedRoutes.push(routeKey);
      localStorage.setItem('savedRoutes', JSON.stringify(savedRoutes));
      setIsSaved(true);
    }
  };
  
  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    
    if (mins === 0 && secs === 0) return '<1 minute';
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins} minute${mins > 1 ? 's' : ''}`;
    return `${mins}m ${secs}s`;
  };
  
  const formatTimeMinutes = (seconds) => {
    const mins = Math.round(seconds / 60);
    if (mins === 0) return '<1 minute';
    return `${mins} minute${mins > 1 ? 's' : ''}`;
  };
  
  // Get current step data
  const getCurrentStepData = () => {
    if (currentStepIndex < 0 || !pathData) {
      return {
        source: from,
        destination: to,
        distance: pathData?.total_distance || 0,
        time: pathData?.total_time_cost || 0,
        isTotal: true
      };
    }
    
    const step = pathData.edges[currentStepIndex];
    return {
      source: step.src,
      destination: step.dest,
      distance: step.distance,
      time: step.time_cost,
      direction: step.direction,
      isTotal: false
    };
  };
  
  // Calculate progress
  const getProgress = () => {
    if (!pathData || currentStepIndex < 0) return 0;
    return ((currentStepIndex + 1) / pathData.edges.length) * 100;
  };
  
  // Get data for map visualization
  const getMapData = () => {
    if (!pathData) return null;
    
    if (currentStepIndex < 0) {
      return pathData; // Show full path
    }
    
    // Show only current step
    const step = pathData.edges[currentStepIndex];
    return {
      nodes: pathData.nodes,
      edges: [step],
      total_distance: pathData.total_distance,
      total_time_cost: pathData.total_time_cost
    };
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
      <button onClick={() => navigate('/')}>Back to Home</button>
    </div>
  );
  
  const currentStep = getCurrentStepData();
  const progress = getProgress();
  const mapData = getMapData();
  
  return (
    <div className="map-layer-container">
      {/* Navigation Bar */}
      <nav className="top-nav">
        <button className="nav-back-btn" onClick={() => navigate('/')}>
          <img src={homeIcon} alt="Home" className="home-icon" />
        </button>
        <h2 className="nav-title">{from} to {to}</h2>
        <button className="nav-save-btn" onClick={toggleSaved}>
          <img 
            src={isSaved ? likedIcon : unlikedIcon} 
            alt={isSaved ? "Saved" : "Not saved"} 
            className="save-icon"
          />
        </button>
      </nav>
      
      {/* Map View with Direction Indicator */}
      <div className="map-view-container">
        <MapComponent 
          pathData={mapData}
          layerGeoJSON={layerGeoJSON}
          currentStepIndex={currentStepIndex}
        />
        
        {/* Direction Indicator */}
        {currentStep.direction && (
          <div className="direction-indicator">
            <img 
              src={DIRECTION_ICONS[currentStep.direction]} 
              alt={currentStep.direction}
              className="direction-icon"
            />
            <span className="direction-label">{currentStep.direction}</span>
          </div>
        )}
      </div>
      
      {/* Status Bar */}
      <div className="status-bar">
        {/* First Row: Controls */}
        <div className="controls-row">
          <button 
            className="control-btn"
            onClick={goToFirstStep}
            disabled={isPlaying}
          >
            <img src={skipBackward} alt="First step" />
          </button>
          <button 
            className="control-btn"
            onClick={goToPreviousStep}
            disabled={isPlaying}
          >
            <img src={rewind} alt="Previous step" />
          </button>
          <button 
            className={`control-btn play-btn ${isPlaying ? 'active' : ''}`}
            onClick={togglePlay}
          >
            <img src={isPlaying ? pause : play} alt={isPlaying ? "Pause" : "Play"} />
          </button>
          <button 
            className="control-btn"
            onClick={goToNextStep}
            disabled={isPlaying}
          >
            <img src={fastForward} alt="Next step" />
          </button>
          <button 
            className="control-btn"
            onClick={goToLastStep}
            disabled={isPlaying}
          >
            <img src={skipForward} alt="Last step" />
          </button>
        </div>
        
        {/* Second Row: Progress Bar */}
        <div className="progress-row">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        {/* Third Row: Source and Destination */}
        <div className="info-row">
          <span className="step-info">{currentStep.source} to {currentStep.destination}</span>
        </div>
        
        {/* Fourth Row: Distance and Time */}
        <div className="stats-row">
          {currentStep.isTotal ? (
            <span className="stats-text">
              {currentStep.distance.toFixed(0)}m · {formatTimeMinutes(currentStep.time)}
            </span>
          ) : (
            <span className="stats-text">
              {currentStep.distance.toFixed(0)}m (of {pathData.total_distance.toFixed(0)}m) · {formatTime(currentStep.time)} (of {formatTimeMinutes(pathData.total_time_cost)})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default MapLayer;
