import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import MapLayer from './MapLayer';
import Venues from './Venues';
import VenueDetail from './VenueDetail';
import Saved from './Saved';

function App() {
    return (
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map-layer/:from/:to" element={<MapLayer />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/venue/:venueName" element={<VenueDetail />} />
            <Route path="/saved" element={<Saved />} />
          </Routes>
        </Router>
      );
};

export default App;
