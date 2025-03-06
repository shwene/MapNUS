import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
    const navigate = useNavigate(); // Hook to programmatically navigate
      
    const handleSubmit = (event) => {
        event.preventDefault();
        const formEL = event.currentTarget;
        const formData = new FormData(formEL);
        const from = formData.get("from");
        const to = formData.get("to");

        // Construct the URL with query params
        const queryUrl = `/map-layer/${encodeURIComponent(from)}/${encodeURIComponent(to)}`;
        
        // Navigate to the React page
        navigate(queryUrl);
    };

    return (
        <div className="container">
          <div className="search-box">
            <h1><span className="black">Map</span><span className="orange">NUS</span></h1>
            <p className="subheading">Find your ideal path, from LT16 to ERC-SR11.</p>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                id="from-input"
                name="from"
                placeholder="From: enter your starting location"
                required
              />
              <input
                type="text"
                id="to-input"
                name="to"
                placeholder="To: enter your ending location"
                required
              />
              <button type="submit">Go</button>
            </form>
          </div>
        </div>
    );
}

export default Home;