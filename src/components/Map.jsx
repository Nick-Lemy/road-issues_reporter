import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

function Map() {
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)

    useEffect(() => {
        if (mapInstanceRef.current || !mapRef.current) return;

        // Center on Kigali, Rwanda
        mapInstanceRef.current = L.map(mapRef.current).setView([-1.9441, 30.0619], 13);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(mapInstanceRef.current);

        // Add a marker at KN 3 Ave / Giporoso area
        const marker = L.marker([-1.9441, 30.0619]).addTo(mapInstanceRef.current);
        marker.bindPopup('<b>Giporoso</b><br>KN 3 Ave').openPopup();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [])

    return (
        <div className='' ref={mapRef} id="map"></div>
    )
}

export default Map