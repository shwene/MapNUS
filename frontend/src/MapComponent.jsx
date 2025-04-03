import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Style, Icon, Stroke, Circle, Fill } from 'ol/style';
import { transform } from 'ol/proj';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import GeoJSON from 'ol/format/GeoJSON';

const MapComponent = ({ pathData, activeLayer, layerGeoJSON }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [layerFeatures, setLayerFeatures] = useState({});

    // Debug function
    const debugPathData = (pathData) => {
        if (!pathData) {
            console.log('PathData is null or undefined');
            return;
        }
        
        console.log('PathData received:', pathData);
        console.log('Nodes:', pathData.nodes?.length || 0);
        console.log('Edges:', pathData.edges?.length || 0);
        
        // Sample the first edge to check format
        if (pathData.edges?.length > 0) {
            const firstEdge = pathData.edges[0];
            console.log('First edge sample:', firstEdge);
            
            try {
                // Test parsing the geometry
                const geomStr = firstEdge.geometry.replace(/'/g, '"');
                const coords = JSON.parse(geomStr);
                console.log('Parsed coordinates:', coords);
                
                // Test coordinate transformation
                if (coords.length > 0) {
                    try {
                        const transformedCoord = transform(
                            [parseFloat(coords[0][0]), parseFloat(coords[0][1])], 
                            'EPSG:3414', 
                            'EPSG:3857'
                        );
                        console.log('Transformed coordinate:', transformedCoord);
                    } catch (e) {
                        console.error('Transformation error:', e);
                    }
                }
            } catch (e) {
                console.error('Parsing error:', e);
            }
        }
    };
    
    // Define SVY21 projection - this needs to happen first
    useEffect(() => {
        // SVY21 projection definition for Singapore
        proj4.defs('EPSG:3414', '+proj=tmerc +lat_0=1.366666666666667 +lon_0=103.8333333333333 +k=1 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +units=m +no_defs');
        register(proj4);
        
        // Verify projection is registered
        console.log('SVY21 projection registered:', !!proj4.defs('EPSG:3414'));
    }, []);

    // Function to safely convert SVY21 to WGS84
    const svy21ToWGS84 = (x, y) => {
        try {
            // Make sure we're working with numbers
            const numX = parseFloat(x);
            const numY = parseFloat(y);
            
            if (isNaN(numX) || isNaN(numY)) {
                console.error('Invalid coordinates for transformation:', x, y);
                return null;
            }
            
            return transform([numX, numY], 'EPSG:3414', 'EPSG:3857');
        } catch (e) {
            console.error('Transform error:', e, 'for coordinates:', x, y);
            return null;
        }
    };

    // Create map once (independent of pathData)
    useEffect(() => {
        if (map) return; // Map already exists
        
        console.log('Creating map...');
        
        // NUS coordinates
        const nus_clb_coords = fromLonLat([103.77337885065036, 1.296671622982777]);
        
        // Check if container has dimensions
        const container = mapRef.current;
        if (container) {
            console.log('Map container dimensions:', container.clientWidth, 'x', container.clientHeight);
            
            // Force minimum dimensions if needed
            if (container.clientHeight < 10) {
                container.style.height = '400px';
                console.log('Forcing container height to 400px');
            }
        }
        
        // Create new map instance
        const newMap = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    source: new OSM(),
                })
            ],
            view: new View({
                center: nus_clb_coords,
                zoom: 17,
            })
        });
        
        // Wait a bit for map to initialize properly
        setTimeout(() => {
            newMap.updateSize();
            console.log('Map size updated');
        }, 200);
        
        setMap(newMap);
        
        return () => {
            if (newMap) {
                newMap.setTarget(null);
            }
        };
    }, []);

    // Process path data and add to map
    useEffect(() => {
        if (!map || !pathData) {
            console.log('Map or pathData not ready yet');
            return;
        }
        
        console.log('Processing path data...');
        debugPathData(pathData);
        
        // Force map size update
        map.updateSize();
        
        // Clear any existing route layers
        map.getLayers().getArray()
            .filter(layer => layer.get('name') === 'route' || layer.get('name') === 'markers')
            .forEach(layer => map.removeLayer(layer));
        
        // Extract nodes and edges from pathData
        const { nodes, edges } = pathData;
        
        if (!nodes || !nodes.length || !edges || !edges.length) {
            console.error('Missing nodes or edges in pathData');
            return;
        }
        
        // Get start and end nodes
        const startNode = nodes[0];
        const endNode = nodes[nodes.length - 1];
        
        const markerFeatures = [];
        const routeFeatures = [];
        const layerPaths = {};
        
        // Store all valid coordinates for view fitting
        const allCoordinates = [];
        
        // Process edges to create path segments
        console.log(`Processing ${edges.length} edges...`);
        
        let startCoord = null;
        let endCoord = null;
        
        edges.forEach((edge, index) => {
            try {
                if (!edge.geometry) {
                    console.error('Edge is missing geometry property:', edge);
                    return;
                }
                
                const layerName = edge.layer || 'default';
                
                // Parse the geometry
                const geomStr = edge.geometry.replace(/'/g, '"');
                const coords = JSON.parse(geomStr);
                
                if (!coords || !coords.length) {
                    console.error('Empty coordinates in edge geometry');
                    return;
                }
                
                // Transform coordinates and filter out any nulls
                const transformedCoords = coords.map(coord => {
                    if (!Array.isArray(coord) || coord.length < 2) {
                        console.error('Invalid coordinate format:', coord);
                        return null;
                    }
                    
                    const transformed = svy21ToWGS84(coord[0], coord[1]);
                    if (transformed) {
                        allCoordinates.push(transformed);
                    }
                    return transformed;
                }).filter(coord => coord !== null);
                
                if (transformedCoords.length < 2) {
                    console.error('Not enough valid coordinates for a line segment');
                    return;
                }
                
                // Track first and last coordinates for markers
                if (index === 0) {
                    startCoord = transformedCoords[0];
                }
                if (index === edges.length - 1) {
                    endCoord = transformedCoords[transformedCoords.length - 1];
                }
                
                // Create line feature for this edge
                const lineFeature = new Feature({
                    geometry: new LineString(transformedCoords),
                    name: `${edge.src || 'unknown'} to ${edge.dest || 'unknown'}`,
                    distance: edge.distance,
                    time: edge.time_cost,
                    layer: layerName
                });
                
                // Add feature to route features
                routeFeatures.push(lineFeature);
                
                // Group by layer
                if (!layerPaths[layerName]) {
                    layerPaths[layerName] = [];
                }
                layerPaths[layerName].push(lineFeature);
                
            } catch (e) {
                console.error('Error processing edge:', e, edge);
            }
        });
        
        // Check if we have any valid route features
        if (routeFeatures.length === 0) {
            console.error('No valid route features could be created');
            return;
        }
        
        console.log(`Created ${routeFeatures.length} route features`);
        
        // Create start and end markers if we have coordinates
        if (startCoord) {
            const startFeature = new Feature({
                geometry: new Point(startCoord),
                name: startNode.name || 'Start',
                type: 'start'
            });
            markerFeatures.push(startFeature);
        }
        
        if (endCoord) {
            const endFeature = new Feature({
                geometry: new Point(endCoord),
                name: endNode.name || 'End',
                type: 'end'
            });
            markerFeatures.push(endFeature);
        }
        
        // Style for route
        const routeStyle = new Style({
            stroke: new Stroke({
                color: '#0077ff',
                width: 4
            })
        });
        
        // Add route layer to map
        const routeLayer = new VectorLayer({
            source: new VectorSource({
                features: routeFeatures
            }),
            style: routeStyle,
            name: 'route',
            zIndex: 1
        });
        
        map.addLayer(routeLayer);
        console.log('Route layer added to map');
        
        // Style for markers
        const markerStyleFunction = function(feature) {
            const type = feature.get('type');
            if (type === 'start') {
                return new Style({
                    image: new Circle({
                        radius: 7,
                        fill: new Fill({ color: 'green' }),
                        stroke: new Stroke({ color: 'white', width: 2 })
                    })
                });
            } else {
                return new Style({
                    image: new Circle({
                        radius: 7,
                        fill: new Fill({ color: 'red' }),
                        stroke: new Stroke({ color: 'white', width: 2 })
                    })
                });
            }
        };
        
        // Add markers layer if we have markers
        if (markerFeatures.length > 0) {
            const markersLayer = new VectorLayer({
                source: new VectorSource({
                    features: markerFeatures
                }),
                style: markerStyleFunction,
                name: 'markers',
                zIndex: 2
            });
            
            map.addLayer(markersLayer);
            console.log('Markers layer added to map');
        }
        
        // Save layer features for later reference
        setLayerFeatures(layerPaths);
        
        // Fit the map view to show all coordinates
        if (allCoordinates.length > 0) {
            try {
                // Create a LineString to get extent
                const line = new LineString(allCoordinates);
                const extent = line.getExtent();
                
                // Fit view with padding
                console.log('Fitting view to extent:', extent);
                map.getView().fit(extent, {
                    padding: [50, 50, 50, 50],
                    maxZoom: 19,
                    duration: 500 // Animation duration in ms
                });
            } catch (e) {
                console.error('Error fitting view to extent:', e);
            }
        }
        
    }, [map, pathData]);
    
    // Update layer visibility when active layer changes
    useEffect(() => {
        if (!map) return;
        
        // Get the route layer
        const routeLayer = map.getLayers().getArray().find(layer => layer.get('name') === 'route');
        if (!routeLayer) return;
        
        const source = routeLayer.getSource();
        const features = source.getFeatures();
        
        // If no active layer, show all
        if (!activeLayer) {
            features.forEach(feature => {
                feature.setStyle(null); // Use default style
            });
            return;
        }
        
        // Otherwise, highlight active layer features and dim others
        features.forEach(feature => {
            const featureLayer = feature.get('layer');
            if (featureLayer === activeLayer) {
                feature.setStyle(new Style({
                    stroke: new Stroke({
                        color: '#ff6600',
                        width: 5
                    })
                }));
            } else {
                feature.setStyle(new Style({
                    stroke: new Stroke({
                        color: 'rgba(0, 119, 255, 0.3)',
                        width: 2
                    })
                }));
            }
        });
        
    }, [map, activeLayer]);
    
    // Handle GeoJSON layer updates
    useEffect(() => {
        if (!map || !layerGeoJSON) return;
        
        // Remove any existing floor plan layers
        map.getLayers().getArray()
            .filter(layer => layer.get('name') === 'floorplan')
            .forEach(layer => map.removeLayer(layer));
            
        // Create a GeoJSON format parser
        const format = new GeoJSON();
        
        try {
            // Parse the GeoJSON features and transform to the map's projection
            const features = format.readFeatures(layerGeoJSON, {
                dataProjection: 'EPSG:3414',  // SVY21
                featureProjection: 'EPSG:3857' // Web Mercator
            });
            
            // Style for floor plan features
            const floorplanStyle = new Style({
                fill: new Fill({
                    color: 'rgba(255, 235, 205, 0.4)'
                }),
                stroke: new Stroke({
                    color: '#8B4513',
                    width: 1
                })
            });
            
            // Create a vector layer for the floor plan
            const floorplanLayer = new VectorLayer({
                source: new VectorSource({
                    features: features
                }),
                style: floorplanStyle,
                name: 'floorplan',
                zIndex: 0 // Below the route
            });
            
            // Add the floor plan layer to the map
            map.addLayer(floorplanLayer);
            console.log('Floor plan layer added to map');
            
        } catch (error) {
            console.error('Error loading GeoJSON:', error);
        }
    }, [map, layerGeoJSON]);
    
    return (
        <div 
            ref={mapRef} 
            style={{ 
                width: '100%', 
                height: '100%', // Ensure minimum height
                minHeight: '400px',
                border: '1px solid #ccc' 
            }} 
        />
    );
};

export default MapComponent;
