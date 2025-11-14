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
import { Style, Stroke, Circle, Fill, Text } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';

const MapComponent = ({ pathData, layerGeoJSON, currentStepIndex }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [fullPathData, setFullPathData] = useState(null);

    // Store the full path when initially received
    useEffect(() => {
        if (pathData && !fullPathData && currentStepIndex === -1) {
            setFullPathData(pathData);
        }
    }, [pathData, currentStepIndex, fullPathData]);

    // Create map once (independent of pathData)
    useEffect(() => {
        if (map) return; // Map already exists
        
        console.log('Creating map...');
        
        // Default center (will be updated when path data loads)
        const defaultCenter = fromLonLat([103.77337885065036, 1.296671622982777]);
        
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
                center: defaultCenter,
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
        
        // Force map size update
        map.updateSize();
        
        // Clear any existing route layers
        map.getLayers().getArray()
            .filter(layer => layer.get('name') === 'route' || 
                           layer.get('name') === 'markers' || 
                           layer.get('name') === 'full-path-silhouette')
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
                
                if (coords.length < 2) {
                    console.error('Not enough valid coordinates for a line segment');
                    return;
                }
                
                // Add all coordinates for extent calculation
                allCoordinates.push(...coords);
                
                // Track first and last coordinates for markers
                if (index === 0) {
                    startCoord = coords[0];
                }
                if (index === edges.length - 1) {
                    endCoord = coords[coords.length - 1];
                }
                
                // Create line feature for this edge
                const lineFeature = new Feature({
                    geometry: new LineString(coords),
                    name: `${edge.src || 'unknown'} to ${edge.dest || 'unknown'}`,
                    distance: edge.distance,
                    time: edge.time_cost,
                    layer: layerName
                });
                
                // Add feature to route features
                routeFeatures.push(lineFeature);
                
            } catch (e) {
                console.error('Error processing edge:', e, edge);
            }
        });
        
        // Check for any valid route features
        if (routeFeatures.length === 0) {
            console.error('No valid route features could be created');
            return;
        }
        
        console.log(`Created ${routeFeatures.length} route features`);
        
        // Create start and end markers if coordinates exists
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
        
        // Show silhouette if showing a single step and full path data exists 
        if (currentStepIndex >= 0 && fullPathData && fullPathData.edges) {
            console.log('Adding full path silhouette...');
            const silhouetteFeatures = [];
            
            fullPathData.edges.forEach((edge) => {
                try {
                    if (!edge.geometry) return;
                    
                    const geomStr = edge.geometry.replace(/'/g, '"');
                    const coords = JSON.parse(geomStr);
                    
                    if (!coords || coords.length < 2) return;
                    
                    const lineFeature = new Feature({
                        geometry: new LineString(coords),
                        name: 'silhouette'
                    });
                    
                    silhouetteFeatures.push(lineFeature);
                } catch (e) {
                    console.error('Error creating silhouette:', e);
                }
            });
            
            if (silhouetteFeatures.length > 0) {
                const silhouetteStyle = new Style({
                    stroke: new Stroke({
                        color: 'rgba(0, 119, 255, 0.2)',
                        width: 3
                    })
                });
                
                const silhouetteLayer = new VectorLayer({
                    source: new VectorSource({
                        features: silhouetteFeatures
                    }),
                    style: silhouetteStyle,
                    name: 'full-path-silhouette',
                    zIndex: 0
                });
                
                map.addLayer(silhouetteLayer);
                console.log('Silhouette layer added');
            }
        }
        
        // Style for current route (highlighted)
        const routeStyle = new Style({
            stroke: new Stroke({
                color: '#ff6600',
                width: 5
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
        
        // Add markers layer if markers exists
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
        
        // Center map at midpoint between origin and destination
        if (allCoordinates.length > 0) {
            try {
                // Create a LineString to get extent for fitting
                const line = new LineString(allCoordinates);
                const extent = line.getExtent();
                
                // Fit view with padding
                console.log('Fitting view to extent:', extent);
                
                // Use different zoom settings based on whether showing full path or single step
                if (currentStepIndex >= 0) {
                    // Viewing a single step - zoom in more
                    map.getView().fit(extent, {
                        padding: [100, 100, 100, 100],
                        maxZoom: 20,
                        minZoom: 18,
                        duration: 500
                    });
                } else {
                    // Viewing full path - show entire route
                    map.getView().fit(extent, {
                        padding: [50, 50, 50, 50],
                        maxZoom: 19,
                        duration: 500
                    });
                }
            } catch (e) {
                console.error('Error fitting view to extent:', e);
            }
        }
        
    }, [map, pathData, currentStepIndex, fullPathData]);
    
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
                dataProjection: 'EPSG:3857',
                featureProjection: 'EPSG:3857'
            });

            // Define color palette
            const COLORS = {
                classroom: 'rgba(173, 216, 230, 0.6)',
                lift: 'rgba(255, 200, 87, 0.7)',
                walk: 'rgba(200, 200, 200, 0.4)',
                toilet: 'rgba(255, 182, 193, 0.6)',
                stair: 'rgba(169, 169, 169, 0.6)',
                other: 'rgba(245, 245, 220, 0.5)'
            };

            const STROKE_COLORS = {
                classroom: '#4682B4',
                lift: '#FF8C00',
                walk: '#808080',
                toilet: '#FF69B4',
                stair: '#696969',
                other: '#8B7355'
            };

            // Functions to create text styles
            const createClassroomTextStyle = function () {
                return new Style({
                    text: new Text({
                        font: 'bold 14px Arial',
                        fill: new Fill({
                            color: '#003366'
                        }),
                        stroke: new Stroke({
                            color: '#FFFFFF',
                            width: 3
                        }),
                        overflow: true,
                        offsetY: 0
                    })
                });
            };

            const createStandardTextStyle = function () {
                return new Style({
                    text: new Text({
                        font: 'bold 12px Arial',
                        fill: new Fill({
                            color: '#333333'
                        }),
                        stroke: new Stroke({
                            color: '#FFFFFF',
                            width: 3
                        }),
                        overflow: true,
                        offsetY: 0
                    })
                });
            };

            // Function to get text content based on feature properties
            const getText = function (feature) {
                const properties = feature.getProperties();
                const purpose = properties.Purpose || '';
                const name = properties.Name || '';

                if (purpose === 'Classroom') {
                    return `Classroom: ${name}`;
                } else if (purpose === 'Lift') {
                    return name;
                } else if (name.includes('Toilet')) {
                    return name;
                } else if (name.includes('Stair')) {
                    return name;
                }

                return '';
            };

            // Function to determine if feature should show text
            const shouldShowText = function (feature) {
                const properties = feature.getProperties();
                const purpose = properties.Purpose || '';
                const name = properties.Name || '';

                return purpose === 'Classroom' || 
                       purpose === 'Lift' || 
                       name.includes('Toilet') || 
                       name.includes('Stair');
            };

            // Style function for floor plan features
            const floorplanStyleFunction = function (feature) {
                const properties = feature.getProperties();
                const purpose = properties.Purpose || '';
                const name = properties.Name || '';

                let fillColor = COLORS.other;
                let strokeColor = STROKE_COLORS.other;
                let useClassroomText = false;

                if (purpose === 'Classroom') {
                    fillColor = COLORS.classroom;
                    strokeColor = STROKE_COLORS.classroom;
                    useClassroomText = true;
                } else if (purpose === 'Lift') {
                    fillColor = COLORS.lift;
                    strokeColor = STROKE_COLORS.lift;
                } else if (purpose === 'Walk') {
                    fillColor = COLORS.walk;
                    strokeColor = STROKE_COLORS.walk;
                } else if (name.includes('Toilet')) {
                    fillColor = COLORS.toilet;
                    strokeColor = STROKE_COLORS.toilet;
                } else if (name.includes('Stair')) {
                    fillColor = COLORS.stair;
                    strokeColor = STROKE_COLORS.stair;
                }

                const baseStyle = new Style({
                    fill: new Fill({
                        color: fillColor
                    }),
                    stroke: new Stroke({
                        color: strokeColor,
                        width: 2
                    })
                });

                if (shouldShowText(feature)) {
                    const text = getText(feature);
                    const textStyle = useClassroomText ? createClassroomTextStyle() : createStandardTextStyle();
                    textStyle.getText().setText(text);
                    return [baseStyle, textStyle];
                }

                return baseStyle;
            };

            // Create a vector layer for the floor plan
            const floorplanLayer = new VectorLayer({
                source: new VectorSource({
                    features: features
                }),
                style: floorplanStyleFunction,
                name: 'floorplan',
                zIndex: 0,
                declutter: true
            });

            map.addLayer(floorplanLayer);
            console.log('Styled floor plan layer added to map');

        } catch (error) {
            console.error('Error loading GeoJSON:', error);
        }
    }, [map, layerGeoJSON]);
    
    return (
        <div 
            ref={mapRef} 
            style={{ 
                width: '100%', 
                height: '100%',
                minHeight: '400px',
                border: '1px solid #ccc' 
            }} 
        />
    );
};

export default MapComponent;
