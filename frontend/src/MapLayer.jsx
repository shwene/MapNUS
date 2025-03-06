import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MapComponent from './MapComponent';

function MapLayer() {
  const { from, to } = useParams();   // Get the argument from the URL
  const [data, setData] = useState(null);  // Store the fetched data
  const [loading, setLoading] = useState(true);  // Loading state
  const [error, setError] = useState(null);  // Error state

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/map/path?origin=${from}&dest=${to}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError('Error fetching data');
        setLoading(false);
      }
    };
  
    fetchData();
  }, [from, to]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <MapComponent locations={data} />
    </div>
  );
}

export default MapLayer;
