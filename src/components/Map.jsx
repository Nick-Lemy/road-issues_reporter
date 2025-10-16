import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import 'leaflet-routing-machine'
import { Navigation, X, MapPin, Satellite } from 'lucide-react'
import { initialTrafficSegments, startTrafficSimulator } from '../data/mockTraffic'
import { getFavorites } from '../utils/favoritesStorage'
// Map accepts prop `selectedPlace` to navigate to, and `onRouteCreated` callback
import { onReportsUpdated } from '../utils/reportStorage'
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
    focusIssue,  // New prop to focus on a specific issue
    selectedPlace,
    onRouteCreated
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
    const [trafficSegments, setTrafficSegments] = useState(initialTrafficSegments)
    const trafficLayerRef = useRef([])

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

    // Render traffic segments
    const renderTraffic = (segments) => {
        if (!mapInstanceRef.current) return;

        // Clear old
        trafficLayerRef.current.forEach(t => t.remove && t.remove());
        trafficLayerRef.current = [];

        segments.forEach(seg => {
            const color = seg.congestion === 'green' ? '#10b981' : seg.congestion === 'yellow' ? '#f59e0b' : '#ef4444';
            const poly = L.polyline(seg.coords, {
                color,
                weight: 8,
                opacity: 0.6
            }).addTo(mapInstanceRef.current);

            poly.bindPopup(`<strong>${seg.name}</strong><br/>Congestion: ${seg.congestion}`);
            poly.on('click', () => {
                // show incidents near this segment
                alert(`${seg.name}\nCongestion: ${seg.congestion}`);
            });

            trafficLayerRef.current.push(poly);
        });
    }
    // Map will respond to `selectedPlace` prop externally (App) to create routes

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

    const createRoute = useCallback((start, end) => {
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
        // Listen for routesfound once and report summary
        routingControlRef.current.on('routesfound', function (e) {
            try {
                const route = e.routes[0];
                const summary = route.summary || { totalDistance: route.summary?.totalDistance, totalTime: route.summary?.totalTime };
                if (onRouteCreated) {
                    onRouteCreated({ start, end, summary, distance: route.summary.totalDistance, time: route.summary.totalTime });
                }
            } catch (err) {
                console.warn('Could not extract route summary', err);
            }
        });
    }, [onRouteCreated]);

    // If parent requested routing to a searched place, create route
    useEffect(() => {
        if (!selectedPlace) return;
        const end = { lat: selectedPlace.lat, lng: selectedPlace.lng };
        const start = userLocation ? { lat: userLocation[0], lng: userLocation[1] } : mapInstanceRef.current.getCenter();
        createRoute(start, end);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedPlace]);

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
            console.log('🌍 Requesting geolocation...');
            console.log('📍 Protocol:', window.location.protocol);
            console.log('🔗 Hostname:', window.location.hostname);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('✅ Geolocation success:', position);
                    const { latitude, longitude, accuracy } = position.coords;

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
                        .bindPopup(`
                            <div style="text-align: center;">
                                <strong>📍 Your Location</strong><br/>
                                <small>Accuracy: ±${Math.round(accuracy)}m</small>
                            </div>
                        `);

                    setUserLocation([latitude, longitude]);
                    console.log('✅ User location marker added');
                },
                (error) => {
                    console.error('❌ Geolocation error:', error);
                    console.error('Error code:', error.code);
                    console.error('Error message:', error.message);

                    // Detect device/browser type
                    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
                    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
                    const isSecure = window.location.protocol === 'https:';

                    let message = '';
                    let instruction = '';

                    if (error.code === 1) { // PERMISSION_DENIED
                        message = '📍 Location Access Denied';

                        if (isIOS || isSafari) {
                            instruction =
                                '📱 For iOS/Safari:\n\n' +
                                '1. Open Settings → Safari → Location\n' +
                                '2. Change to "Ask" or "Allow"\n' +
                                '3. Reload this page\n' +
                                '4. Tap "Allow" when prompted\n\n' +
                                'Or use the "📍 My Location" button anytime!';
                        } else {
                            instruction =
                                '🔒 Please enable location access:\n\n' +
                                '1. Click the lock icon (🔒) in the address bar\n' +
                                '2. Change Location to "Allow"\n' +
                                '3. Reload the page\n\n' +
                                'Or use the "📍 My Location" button!';
                        }
                    } else if (error.code === 2) {
                        message = '📍 Location Unavailable';
                        instruction =
                            '⚠️ Your device location is unavailable:\n\n' +
                            '1. Enable Location Services in device settings\n' +
                            '2. Make sure you have GPS signal\n' +
                            '3. Try again in a moment\n\n' +
                            'Map will center on Kigali as fallback.';
                    } else if (error.code === 3) {
                        message = '📍 Location Request Timeout';
                        instruction =
                            '⏱️ The location request took too long.\n\n' +
                            'Please try the "📍 My Location" button to retry.';
                    }

                    console.warn('⚠️', message, '\n', instruction);

                    // Show user-friendly alert
                    if (!isSecure) {
                        alert(
                            '⚠️ LOCATION REQUIRES HTTPS\n\n' +
                            'Your browser blocks location access on non-secure connections.\n\n' +
                            '✅ Good news: This works on your deployed Netlify site (HTTPS)!\n\n' +
                            'For now, the map will center on Kigali. You can use the "📍 My Location" button once deployed.'
                        );
                    } else {
                        // Only show alert if it's a permission issue on HTTPS
                        if (error.code === 1) {
                            alert(message + '\n\n' + instruction);
                        }
                    }

                    // Map stays at Kigali as fallback
                },
                {
                    enableHighAccuracy: true,  // Use GPS for better accuracy on mobile
                    timeout: 15000,            // Wait up to 15 seconds
                    maximumAge: 0              // Don't use cached location
                }
            );
        } else {
            console.error('❌ Geolocation not supported');
            alert('⚠️ Geolocation Not Supported\n\nYour browser does not support location services.');
        }

        // Add issue markers and reported issues
        addIssueMarkers();
        displayReportedIssues();

        // Start traffic simulator
        const stopSim = startTrafficSimulator((segments) => {
            setTrafficSegments(segments);
            renderTraffic(segments);
        }, 8000);

        // Listen for report updates from other tabs
        const stopListening = onReportsUpdated((updatedReports) => {
            console.log('Reports updated via BroadcastChannel', updatedReports);
            // Refresh displayed reported issues
            displayReportedIssues();
        });

        return () => {
            stopSim && stopSim();
            stopListening && stopListening();
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
            alert('⚠️ Geolocation Not Supported\n\nYour browser does not support location services.');
            return;
        }

        console.log('🎯 My Location button clicked');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('✅ Location retrieved:', position);
                const { latitude, longitude, accuracy } = position.coords;
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
                    .bindPopup(`
                        <div style="text-align: center;">
                            <strong>📍 Your Location</strong><br/>
                            <small>Accuracy: ±${Math.round(accuracy)}m</small>
                        </div>
                    `);

                // Zoom to user location
                mapInstanceRef.current.setView(userPos, 15);

                console.log('✅ Centered map on user location');
            },
            (error) => {
                console.error('❌ Location error:', error);

                // Detect device/browser
                const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
                const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
                const isSecure = window.location.protocol === 'https:';

                let errorMessage = '📍 Unable to Get Your Location\n\n';

                if (error.code === 1) { // PERMISSION_DENIED
                    if (!isSecure) {
                        errorMessage +=
                            '⚠️ HTTPS Required:\n' +
                            'Location access requires a secure connection.\n\n' +
                            '✅ This will work on your deployed Netlify site!\n\n' +
                            'For local development, use HTTPS or test on deployment.';
                    } else if (isIOS || isSafari) {
                        errorMessage +=
                            '📱 iOS/Safari Instructions:\n\n' +
                            '1. Open Settings\n' +
                            '2. Go to Safari → Location\n' +
                            '3. Change to "Ask" or "Allow"\n' +
                            '4. Reload this page\n' +
                            '5. Tap "Allow" when prompted\n\n' +
                            'Then try "My Location" button again!';
                    } else {
                        errorMessage +=
                            '🔒 Permission Instructions:\n\n' +
                            '1. Click the lock icon (🔒) in your address bar\n' +
                            '2. Find "Location" permissions\n' +
                            '3. Change to "Allow"\n' +
                            '4. Reload the page\n\n' +
                            'Then try again!';
                    }
                } else if (error.code === 2) {
                    errorMessage +=
                        '⚠️ Location Unavailable:\n\n' +
                        '• Enable Location Services in device settings\n' +
                        '• Make sure you have GPS signal\n' +
                        '• Try moving to an open area\n' +
                        '• Wait a moment and try again';
                } else if (error.code === 3) {
                    errorMessage +=
                        '⏱️ Request Timeout:\n\n' +
                        'The location request took too long.\n\n' +
                        '• Check your GPS signal\n' +
                        '• Try again in a moment';
                } else {
                    errorMessage +=
                        'An unknown error occurred.\n\n' +
                        'Please check your device settings and try again.';
                }

                alert(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
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
                    <Navigation size={18} />
                    <span>{routingMode ? 'Click map for points' : 'Get Directions'}</span>
                </button>
                {routingControlRef.current && (
                    <button
                        className="map-control-btn"
                        onClick={clearRoute}
                    >
                        <X size={18} />
                        <span>Clear Route</span>
                    </button>
                )}
                <button
                    className="map-control-btn"
                    onClick={showUserLocation}
                    title="Show your current location"
                >
                    <MapPin size={18} />
                    <span>My Location</span>
                </button>
                <button
                    className={`map-control-btn ${isSatelliteView ? 'active' : ''}`}
                    onClick={toggleSatelliteView}
                    title={isSatelliteView ? 'Switch to street view' : 'Switch to satellite view'}
                >
                    <Satellite size={18} />
                    <span>{isSatelliteView ? 'Street View' : 'Satellite'}</span>
                </button>
            </div>
            {routingMode && !reportingMode && (
                <div className="routing-instructions">
                    {routePoints.length === 0 ? (
                        <span><MapPin size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Click on the map to set your <strong>starting point (A)</strong></span>
                    ) : (
                        <span><Navigation size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Now click on the map to set your <strong>destination (B)</strong></span>
                    )}
                </div>
            )}
            {reportingMode && (
                <div className="reporting-instructions">
                    {reportPoints.length === 0 ? (
                        <span><MapPin size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Click where the road issue <strong>begins (Point A)</strong></span>
                    ) : reportPoints.length === 1 ? (
                        <span><Navigation size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Click where the road issue <strong>ends (Point B)</strong></span>
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