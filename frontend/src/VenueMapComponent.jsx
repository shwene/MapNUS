import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Circle, Fill, Stroke, Text } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';

const VenueMapComponent = ({ coordinate, layerGeoJSON, venueName }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);

    // Create map once
    useEffect(() => {
        if (map) return;
        
        console.log('Creating venue map...');
        
        // Default center
        const defaultCenter = coordinate || [11552098.141214574, 144164.37145758767];
        
        const container = mapRef.current;
        if (container && container.clientHeight < 10) {
            container.style.height = '400px';
        }
        
        const newMap = new Map({
            target: mapRef.current,
            layers: [
                new TileLayer({
                    source: new OSM(),
                })
            ],
            view: new View({
                center: defaultCenter,
                zoom: 19,
            })
        });
        
        setTimeout(() => {
            newMap.updateSize();
        }, 200);
        
        setMap(newMap);
        
        return () => {
            if (newMap) {
                newMap.setTarget(null);
            }
        };
    }, []);

    // Add venue marker
    useEffect(() => {
        if (!map || !coordinate) return;
        
        console.log('Adding venue marker at:', coordinate);
        
        // Remove existing marker layer
        map.getLayers().getArray()
            .filter(layer => layer.get('name') === 'venue-marker')
            .forEach(layer => map.removeLayer(layer));
        
        // Create marker feature
        const markerFeature = new Feature({
            geometry: new Point(coordinate),
            name: venueName
        });
        
        // Marker style
        const markerStyle = new Style({
            image: new Circle({
                radius: 10,
                fill: new Fill({ color: '#ff6600' }),
                stroke: new Stroke({ color: 'white', width: 3 })
            }),
            text: new Text({
                text: venueName,
                offsetY: -20,
                font: 'bold 14px Arial',
                fill: new Fill({ color: '#1e3a8a' }),
                stroke: new Stroke({ color: 'white', width: 3 }),
                backgroundFill: new Fill({ color: 'rgba(255, 255, 255, 0.8)' }),
                padding: [4, 8, 4, 8]
            })
        });
        
        // Create marker layer
        const markerLayer = new VectorLayer({
            source: new VectorSource({
                features: [markerFeature]
            }),
            style: markerStyle,
            name: 'venue-marker',
            zIndex: 2
        });
        
        map.addLayer(markerLayer);
        
        // Center map on coordinate
        map.getView().animate({
            center: coordinate,
            zoom: 19,
            duration: 500
        });
        
    }, [map, coordinate, venueName]);

    // Add floor plan layer
    useEffect(() => {
        if (!map || !layerGeoJSON) return;

        console.log('Adding floor plan layer...');

        // Remove existing floor plan layers
        map.getLayers().getArray()
            .filter(layer => layer.get('name') === 'floorplan')
            .forEach(layer => map.removeLayer(layer));

        const format = new GeoJSON();

        try {
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

            const createClassroomTextStyle = function () {
                return new Style({
                    text: new Text({
                        font: 'bold 14px Arial',
                        fill: new Fill({ color: '#003366' }),
                        stroke: new Stroke({ color: '#FFFFFF', width: 3 }),
                        overflow: true,
                        offsetY: 0
                    })
                });
            };

            const createStandardTextStyle = function () {
                return new Style({
                    text: new Text({
                        font: 'bold 12px Arial',
                        fill: new Fill({ color: '#333333' }),
                        stroke: new Stroke({ color: '#FFFFFF', width: 3 }),
                        overflow: true,
                        offsetY: 0
                    })
                });
            };

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

            const shouldShowText = function (feature) {
                const properties = feature.getProperties();
                const purpose = properties.Purpose || '';
                const name = properties.Name || '';

                return purpose === 'Classroom' || 
                       purpose === 'Lift' || 
                       name.includes('Toilet') || 
                       name.includes('Stair');
            };

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
                    fill: new Fill({ color: fillColor }),
                    stroke: new Stroke({ color: strokeColor, width: 2 })
                });

                if (shouldShowText(feature)) {
                    const text = getText(feature);
                    const textStyle = useClassroomText ? createClassroomTextStyle() : createStandardTextStyle();
                    textStyle.getText().setText(text);
                    return [baseStyle, textStyle];
                }

                return baseStyle;
            };

            const floorplanLayer = new VectorLayer({
                source: new VectorSource({ features: features }),
                style: floorplanStyleFunction,
                name: 'floorplan',
                zIndex: 0,
                declutter: true
            });

            map.addLayer(floorplanLayer);
            console.log('Floor plan layer added');

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
                minHeight: '400px'
            }} 
        />
    );
};

export default VenueMapComponent;
