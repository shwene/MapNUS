import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj'; // Import projection function
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Icon } from 'ol/style';

const MapComponent = ({ locations }) => {
    const mapRef = useRef(null); // Reference to the map container
    const nus_clb_coords = fromLonLat([103.77337885065036, 1.296671622982777]);

    const iconStyle = new Style({
        image: new Icon({
          anchor: [0.5, 46],
          anchorXUnits: "fraction",
          anchorYUnits: "pixels",
          src: "https://openlayers.org/en/latest/examples/data/icon.png",
        }),
      })

    // Convert locations into OpenLayers features
    const iconFeatures = locations.map((location) => {
        const feature = new Feature({
            geometry: new Point(fromLonLat([location.x, location.y])),
            name: location.name,
        });
        feature.setStyle(iconStyle);
        return feature;
    });

    //Update the vector layer with new markers
    const vectorLayer = new VectorLayer({
        source: new VectorSource({
            features: iconFeatures,
        }),
    });

    useEffect(() => {
        const map = new Map({
            target: mapRef.current, // Attach the map to the div
            layers: [
                new TileLayer({
                    source: new OSM(),
                }),
                vectorLayer
            ],
            view: new View({
                center: nus_clb_coords,
                zoom: 17,
            }),
        });
        return () => map.setTarget(null); // Cleanup on unmount
    }, []);

    return <div ref={mapRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default MapComponent;
