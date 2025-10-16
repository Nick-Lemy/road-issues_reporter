// Mock traffic data for Kigali - simplified polylines and congestion state
// Each segment has an id, name, coordinates (array of lat,lng pairs), and congestion state

export const initialTrafficSegments = [
    {
        id: 'kk_1',
        name: 'KN 1 Ave (Example)',
        coords: [
            [-1.940, 30.058],
            [-1.941, 30.060],
            [-1.942, 30.062]
        ],
        congestion: 'green' // green, yellow, red
    },
    {
        id: 'kk_2',
        name: 'KN 2 Rd (Example)',
        coords: [
            [-1.946, 30.058],
            [-1.944, 30.060],
            [-1.943, 30.063]
        ],
        congestion: 'yellow'
    },
    {
        id: 'kk_3',
        name: 'KN 3 St (Example)',
        coords: [
            [-1.950, 30.055],
            [-1.948, 30.058],
            [-1.945, 30.060]
        ],
        congestion: 'red'
    }
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
