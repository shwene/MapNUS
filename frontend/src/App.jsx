import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import MapLayer from './MapLayer'; 

function App() {
    return (
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map-layer/:from/:to" element={<MapLayer />} />
          </Routes>
        </Router>
      );
};

export default App;

