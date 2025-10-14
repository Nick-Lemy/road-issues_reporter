import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import 'leaflet-routing-machine'
import { mockIssues } from '../data/mockIssues'
import { issueCategories } from '../data/issueCategories'
import { getReports } from '../utils/reportStorage'
// import { useCurrentPosition } from '../hooks/useGeolocation'

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function Map({
    onIssueSelect,
    reportingMode,
    onReportRouteSelect,
    reportCategory,
    refreshReports,
    focusIssue  // New prop to focus on a specific issue
}) {
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const routingControlRef = useRef(null)
    const markersRef = useRef([])
    const routeMarkersRef = useRef([])
    const reportLinesRef = useRef([])
    const previewLineRef = useRef(null)
    const userLocationMarkerRef = useRef(null)
    const streetLayerRef = useRef(null)
    const satelliteLayerRef = useRef(null)
    const [routingMode, setRoutingMode] = useState(false)
    const [routePoints, setRoutePoints] = useState([])
    const [reportPoints, setReportPoints] = useState([])
    const [isSatelliteView, setIsSatelliteView] = useState(false)
    const [userLocation, setUserLocation] = useState(null)

    const addIssueMarkers = () => {
        if (!mapInstanceRef.current) return;

        // Clear existing issue markers only
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        mockIssues.forEach(issue => {
            const category = issueCategories.find(cat => cat.id === issue.type);

            // Create custom icon
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-pin" style="background-color: ${category?.color || '#6b7280'}">
                        <span class="marker-emoji">${category?.icon || '📍'}</span>
                       </div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -40]
            });

            const marker = L.marker([issue.location.lat, issue.location.lng], {
                icon: customIcon
            }).addTo(mapInstanceRef.current);

            marker.bindPopup(`
                <div class="marker-popup">
                    <h3>${issue.title}</h3>
                    <p>${issue.description}</p>
                    <p class="popup-location">${issue.location.address}</p>
                    <button onclick="alert('View Details')" class="popup-btn">View Details</button>
                </div>
            `);

            marker.on('click', () => {
                if (onIssueSelect) {
                    onIssueSelect(issue);
                }
            });

            markersRef.current.push(marker);
        });
    }

    const displayReportedIssues = () => {
        if (!mapInstanceRef.current) return;

        // Clear existing report lines
        reportLinesRef.current.forEach(line => {
            if (line.remove) line.remove();
            if (line.getPlan) mapInstanceRef.current.removeControl(line);
        });
        reportLinesRef.current = [];

        const reports = getReports();

        reports.forEach(report => {
            const category = issueCategories.find(cat => cat.id === report.type);
            if (!category || !report.routePoints || report.routePoints.length !== 2) return;

            const lineStyle = category.lineStyle;

            // Create a temporary routing control to get the route
            const tempRouting = L.Routing.control({
                waypoints: [
                    L.latLng(report.routePoints[0].lat, report.routePoints[0].lng),
                    L.latLng(report.routePoints[1].lat, report.routePoints[1].lng)
                ],
                router: L.Routing.osrmv1({
                    serviceUrl: 'https://router.project-osrm.org/route/v1'
                }),
                createMarker: function () { return null; },
                addWaypoints: false,
                routeWhileDragging: false,
                draggableWaypoints: false,
                fitSelectedRoutes: false,
                showAlternatives: false
            });

            // Listen for route calculation
            tempRouting.on('routesfound', function (e) {
                const routes = e.routes;
                const route = routes[0];

                if (route && route.coordinates) {
                    // Create a styled polyline with the route coordinates
                    const polyline = L.polyline(route.coordinates, {
                        color: lineStyle.color,
                        weight: lineStyle.weight,
                        opacity: lineStyle.opacity,
                        dashArray: lineStyle.dashArray,
                        lineCap: lineStyle.lineCap
                    }).addTo(mapInstanceRef.current);

                    polyline.bindPopup(`
                        <div class="marker-popup">
                            <h3>${category.icon} ${report.title}</h3>
                            <p>${report.description || 'No description provided'}</p>
                            <p class="popup-time">Reported: ${new Date(report.timestamp).toLocaleString()}</p>
                            <span class="popup-status ${report.status}">${report.status}</span>
                        </div>
                    `);

                    reportLinesRef.current.push(polyline);
                }

                // Remove the temporary routing control
                mapInstanceRef.current.removeControl(tempRouting);
            });

            // Add to map to trigger route calculation
            tempRouting.addTo(mapInstanceRef.current);
        });
    }

    const updatePreviewLine = () => {
        if (!mapInstanceRef.current || !reportingMode || reportPoints.length !== 2) {
            if (previewLineRef.current) {
                if (previewLineRef.current.remove) {
                    previewLineRef.current.remove();
                }
                previewLineRef.current = null;
            }
            return;
        }

        const category = issueCategories.find(cat => cat.id === reportCategory) || issueCategories[0];
        const lineStyle = category.lineStyle;

        if (previewLineRef.current) {
            if (previewLineRef.current.remove) {
                previewLineRef.current.remove();
            }
        }

        console.log('Creating preview route from', reportPoints[0], 'to', reportPoints[1]);

        // Create temporary routing to get the route path
        const tempRouting = L.Routing.control({
            waypoints: [
                L.latLng(reportPoints[0].lat, reportPoints[0].lng),
                L.latLng(reportPoints[1].lat, reportPoints[1].lng)
            ],
            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1'
            }),
            createMarker: function () { return null; },
            addWaypoints: false,
            routeWhileDragging: false,
            draggableWaypoints: false,
            fitSelectedRoutes: false,
            showAlternatives: false
        });

        tempRouting.on('routesfound', function (e) {
            const routes = e.routes;
            const route = routes[0];

            console.log('Route found with', route.coordinates.length, 'points');

            if (route && route.coordinates) {
                // Create styled polyline with the route
                previewLineRef.current = L.polyline(route.coordinates, {
                    color: lineStyle.color,
                    weight: lineStyle.weight,
                    opacity: lineStyle.opacity,
                    dashArray: lineStyle.dashArray,
                    lineCap: lineStyle.lineCap
                }).addTo(mapInstanceRef.current);
            }

            // Remove the temporary routing control
            mapInstanceRef.current.removeControl(tempRouting);
        });

        // Add to map to trigger calculation
        tempRouting.addTo(mapInstanceRef.current);
    }

    const getUserLocation = () => {
        if (!navigator.geolocation) {
            console.log('Geolocation is not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.setView([latitude, longitude], 15);
                    console.log('Centered on user location:', latitude, longitude);
                }
            },
            (error) => {
                console.error('Error getting location:', error);
                // Fallback to Kigali if geolocation fails
            }
        );
    }

    const createRoute = (start, end) => {
        if (!mapInstanceRef.current) return;

        // Remove existing routing control
        if (routingControlRef.current) {
            mapInstanceRef.current.removeControl(routingControlRef.current);
            routingControlRef.current = null;
        }

        // Create new routing control
        routingControlRef.current = L.Routing.control({
            waypoints: [
                L.latLng(start.lat, start.lng),
                L.latLng(end.lat, end.lng)
            ],
            routeWhileDragging: true,
            showAlternatives: true,
            lineOptions: {
                styles: [
                    { color: '#2563eb', opacity: 0.8, weight: 6 }
                ]
            },
            altLineOptions: {
                styles: [
                    { color: '#9ca3af', opacity: 0.6, weight: 4 }
                ]
            },
            createMarker: function (i, waypoint) {
                const label = i === 0 ? 'A' : 'B';
                const color = i === 0 ? '#10b981' : '#ef4444';
                return L.marker(waypoint.latLng, {
                    icon: L.divIcon({
                        className: 'route-marker',
                        html: `<div class="route-marker-pin" style="background-color: ${color}">${label}</div>`,
                        iconSize: [35, 35],
                        iconAnchor: [17, 35]
                    }),
                    draggable: true
                });
            }
        }).addTo(mapInstanceRef.current);

        console.log('Route created from', start, 'to', end);
    }

    // Initialize map
    useEffect(() => {
        if (mapInstanceRef.current || !mapRef.current) return;

        // Center on Kigali, Rwanda (default)
        mapInstanceRef.current = L.map(mapRef.current).setView([-1.9441, 30.0619], 13);

        // Street layer (OpenStreetMap)
        streetLayerRef.current = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(mapInstanceRef.current);

        // Satellite layer (Esri World Imagery)
        satelliteLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
        });

        // Try to get user location and center map on it
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    // Center map on user location
                    mapInstanceRef.current.setView([latitude, longitude], 14);

                    // Add user location marker
                    const userLocationIcon = L.divIcon({
                        className: 'user-location-marker',
                        html: `
                            <div class="pulse-container">
                                <div class="pulse-ring"></div>
                                <div class="pulse-dot"></div>
                            </div>
                        `,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    });

                    userLocationMarkerRef.current = L.marker([latitude, longitude], {
                        icon: userLocationIcon,
                        zIndexOffset: 1000
                    })
                        .addTo(mapInstanceRef.current)
                        .bindPopup('📍 Your Location');

                    setUserLocation([latitude, longitude]);
                },
                (error) => {
                    console.log('Could not get user location, using default (Kigali):', error);
                    // Stay centered on Kigali if geolocation fails
                },
                {
                    enableHighAccuracy: false,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        }

        // Add issue markers and reported issues
        addIssueMarkers();
        displayReportedIssues();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Refresh reported issues when refreshReports changes
    useEffect(() => {
        displayReportedIssues();
    }, [refreshReports])

    // Handle reporting mode
    useEffect(() => {
        if (reportingMode) {
            getUserLocation();
            setReportPoints([]);
            // Clear any existing preview
            if (previewLineRef.current) {
                previewLineRef.current.remove();
                previewLineRef.current = null;
            }
        } else {
            setReportPoints([]);
            if (previewLineRef.current) {
                previewLineRef.current.remove();
                previewLineRef.current = null;
            }
            routeMarkersRef.current.forEach(marker => marker.remove());
            routeMarkersRef.current = [];
        }
    }, [reportingMode])

    // Update preview line when category or points change
    useEffect(() => {
        if (reportingMode && reportPoints.length === 2) {
            updatePreviewLine();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reportCategory, reportPoints, reportingMode])

    // Handle focusing on a specific issue when clicked from the list
    useEffect(() => {
        if (!mapInstanceRef.current || !focusIssue) return;

        // Check if it's a mock issue (has location.lat/lng)
        if (focusIssue.location && focusIssue.location.lat && focusIssue.location.lng) {
            mapInstanceRef.current.setView([focusIssue.location.lat, focusIssue.location.lng], 17);

            // Find and open the marker popup
            markersRef.current.forEach(marker => {
                const markerLatLng = marker.getLatLng();
                if (markerLatLng.lat === focusIssue.location.lat && markerLatLng.lng === focusIssue.location.lng) {
                    marker.openPopup();
                }
            });
        }
        // Check if it's a reported issue (has routePoints)
        else if (focusIssue.routePoints && focusIssue.routePoints.length === 2) {
            // Center on the midpoint of the route
            const lat1 = focusIssue.routePoints[0].lat;
            const lng1 = focusIssue.routePoints[0].lng;
            const lat2 = focusIssue.routePoints[1].lat;
            const lng2 = focusIssue.routePoints[1].lng;
            const centerLat = (lat1 + lat2) / 2;
            const centerLng = (lng1 + lng2) / 2;

            mapInstanceRef.current.setView([centerLat, centerLng], 16);

            // Find and open the polyline popup
            reportLinesRef.current.forEach(line => {
                // Open the popup at the center of the route
                if (line.openPopup) {
                    line.openPopup([centerLat, centerLng]);
                }
            });
        }
    }, [focusIssue])

    // Handle map clicks for navigation routing
    useEffect(() => {
        if (!mapInstanceRef.current) return;

        const handleMapClick = (e) => {
            // Handle reporting mode
            if (reportingMode) {
                console.log('Map clicked in reporting mode:', e.latlng);

                const newPoints = [...reportPoints, e.latlng];

                if (newPoints.length === 1) {
                    // First point - add marker for start
                    const tempMarker = L.marker(e.latlng, {
                        icon: L.divIcon({
                            className: 'route-marker',
                            html: '<div class="route-marker-start">A</div>',
                            iconSize: [30, 30],
                            iconAnchor: [15, 15]
                        })
                    }).addTo(mapInstanceRef.current);
                    routeMarkersRef.current.push(tempMarker);
                    setReportPoints(newPoints);
                } else if (newPoints.length === 2) {
                    // Second point - add marker and notify parent
                    const tempMarker = L.marker(e.latlng, {
                        icon: L.divIcon({
                            className: 'route-marker',
                            html: '<div class="route-marker-end">B</div>',
                            iconSize: [30, 30],
                            iconAnchor: [15, 15]
                        })
                    }).addTo(mapInstanceRef.current);
                    routeMarkersRef.current.push(tempMarker);
                    setReportPoints(newPoints);

                    // Notify parent component
                    if (onReportRouteSelect) {
                        onReportRouteSelect(newPoints);
                    }
                }
                return;
            }

            // Handle navigation routing mode
            if (!routingMode) return;

            console.log('Map clicked in routing mode:', e.latlng);

            const newPoints = [...routePoints, e.latlng];

            if (newPoints.length === 1) {
                // First point - add marker for start
                const tempMarker = L.marker(e.latlng, {
                    icon: L.divIcon({
                        className: 'route-marker',
                        html: '<div class="route-marker-start">A</div>',
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    })
                }).addTo(mapInstanceRef.current);
                routeMarkersRef.current.push(tempMarker);
                setRoutePoints(newPoints);
            } else if (newPoints.length === 2) {
                // Second point - create the route
                console.log('Creating route with points:', newPoints);
                createRoute(newPoints[0], newPoints[1]);

                // Clear temporary markers
                routeMarkersRef.current.forEach(marker => marker.remove());
                routeMarkersRef.current = [];

                setRoutingMode(false);
                setRoutePoints([]);
            }
        };

        mapInstanceRef.current.on('click', handleMapClick);

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.off('click', handleMapClick);
            }
        };
    }, [routingMode, routePoints, reportingMode, reportPoints, reportCategory, onReportRouteSelect])

    const toggleRoutingMode = () => {
        const newRoutingMode = !routingMode;
        console.log('Toggling routing mode:', newRoutingMode);
        setRoutingMode(newRoutingMode);
        setRoutePoints([]);

        // Clear temporary route markers
        routeMarkersRef.current.forEach(marker => marker.remove());
        routeMarkersRef.current = [];

        if (!newRoutingMode && routingControlRef.current) {
            mapInstanceRef.current.removeControl(routingControlRef.current);
            routingControlRef.current = null;
        }
    }

    const clearRoute = () => {
        console.log('Clearing route');
        if (routingControlRef.current) {
            mapInstanceRef.current.removeControl(routingControlRef.current);
            routingControlRef.current = null;
        }
        routeMarkersRef.current.forEach(marker => marker.remove());
        routeMarkersRef.current = [];
        setRoutePoints([]);
        setRoutingMode(false);
    }

    const toggleSatelliteView = () => {
        if (!mapInstanceRef.current || !streetLayerRef.current || !satelliteLayerRef.current) return;

        if (isSatelliteView) {
            // Switch to street view
            mapInstanceRef.current.removeLayer(satelliteLayerRef.current);
            mapInstanceRef.current.addLayer(streetLayerRef.current);
            setIsSatelliteView(false);
        } else {
            // Switch to satellite view
            mapInstanceRef.current.removeLayer(streetLayerRef.current);
            mapInstanceRef.current.addLayer(satelliteLayerRef.current);
            setIsSatelliteView(true);
        }
    }

    const showUserLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const userPos = [latitude, longitude];

                setUserLocation(userPos);

                // Remove existing user location marker if any
                if (userLocationMarkerRef.current) {
                    userLocationMarkerRef.current.remove();
                }

                // Create custom icon for user location with pulsing effect
                const userLocationIcon = L.divIcon({
                    className: 'user-location-marker',
                    html: `
                        <div class="pulse-container">
                            <div class="pulse-ring"></div>
                            <div class="pulse-dot"></div>
                        </div>
                    `,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                });

                // Add marker and center map
                userLocationMarkerRef.current = L.marker(userPos, {
                    icon: userLocationIcon,
                    zIndexOffset: 1000
                })
                    .addTo(mapInstanceRef.current)
                    .bindPopup('📍 Your Location');

                // Zoom to user location
                mapInstanceRef.current.setView(userPos, 15);
            },
            (error) => {
                let errorMessage = 'Unable to retrieve your location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied. Please enable location permissions.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.';
                        break;
                }
                alert(errorMessage);
            }
        );
    }

    return (
        <div className="map-container">
            <div className="map-controls">
                <button
                    className={`map-control-btn ${routingMode ? 'active' : ''}`}
                    onClick={toggleRoutingMode}
                    title="Click map to set start (A) and end (B) points"
                    disabled={reportingMode}
                >
                    {routingMode ? '🗺️ Click map for points' : '🧭 Get Directions'}
                </button>
                {routingControlRef.current && (
                    <button
                        className="map-control-btn"
                        onClick={clearRoute}
                    >
                        ✕ Clear Route
                    </button>
                )}
                <button
                    className="map-control-btn"
                    onClick={showUserLocation}
                    title="Show your current location"
                >
                    📍 My Location
                </button>
                <button
                    className={`map-control-btn ${isSatelliteView ? 'active' : ''}`}
                    onClick={toggleSatelliteView}
                    title={isSatelliteView ? 'Switch to street view' : 'Switch to satellite view'}
                >
                    {isSatelliteView ? '🗺️ Street View' : '🛰️ Satellite'}
                </button>
            </div>
            {routingMode && !reportingMode && (
                <div className="routing-instructions">
                    {routePoints.length === 0 ? (
                        <span>📍 Click on the map to set your <strong>starting point (A)</strong></span>
                    ) : (
                        <span>🎯 Now click on the map to set your <strong>destination (B)</strong></span>
                    )}
                </div>
            )}
            {reportingMode && (
                <div className="reporting-instructions">
                    {reportPoints.length === 0 ? (
                        <span>📍 Click where the road issue <strong>begins (Point A)</strong></span>
                    ) : reportPoints.length === 1 ? (
                        <span>🎯 Click where the road issue <strong>ends (Point B)</strong></span>
                    ) : (
                        <span>✓ Road section selected! Choose issue type and fill the form</span>
                    )}
                </div>
            )}
            <div ref={mapRef} id="map"></div>
        </div>
    )
}

export default Map