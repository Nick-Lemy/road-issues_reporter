// Mock traffic data for Kigali - simplified polylines and congestion state
// Each segment has an id, name, coordinates (array of lat,lng pairs), and congestion state

export const initialTrafficSegments = [

];

// Simple simulator to randomly change congestion over time
export function startTrafficSimulator(callback, interval = 8000) {
    let segments = JSON.parse(JSON.stringify(initialTrafficSegments));
    const colors = ['green', 'yellow', 'red'];

    const tick = () => {
        // Randomly change 0-2 segments
        const changes = Math.floor(Math.random() * 3);
        for (let i = 0; i < changes; i++) {
            const idx = Math.floor(Math.random() * segments.length);
            segments[idx].congestion = colors[Math.floor(Math.random() * colors.length)];
        }
        callback(segments);
    };

    const id = setInterval(tick, interval);
    // Initial callback
    callback(segments);

    return () => clearInterval(id);
}
