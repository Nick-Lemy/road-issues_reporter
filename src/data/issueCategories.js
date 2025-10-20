export const issueCategories = [
    {
        id: 'pothole',
        name: 'Pothole',
        icon: 'Pickaxe',
        color: '#ef4444',
        lineStyle: {
            color: '#ef4444',
            weight: 5,
            opacity: 0.8,
            dashArray: '1, 10',
            lineCap: 'round'
        }
    },
    {
        id: 'roadworks',
        name: 'Roadworks',
        icon: 'Construction',
        color: '#f59e0b',
        lineStyle: {
            color: '#f59e0b',
            weight: 5,
            opacity: 0.8,
            dashArray: '20, 10, 5, 10',
            lineCap: 'square'
        }
    },
    {
        id: 'accident',
        name: 'Accident',
        icon: 'AlertOctagon',
        color: '#dc2626',
        lineStyle: {
            color: '#dc2626',
            weight: 6,
            opacity: 0.9,
            dashArray: '5, 5',
            lineCap: 'round'
        }
    },
    {
        id: 'closure',
        name: 'Road Closure',
        icon: 'Ban',
        color: '#b91c1c',
        lineStyle: {
            color: '#b91c1c',
            weight: 7,
            opacity: 0.9,
            dashArray: null // solid line
        }
    },
    {
        id: 'flooding',
        name: 'Flooding',
        icon: 'Droplet',
        color: '#3b82f6',
        lineStyle: {
            color: '#3b82f6',
            weight: 5,
            opacity: 0.8,
            dashArray: '10, 5, 2, 5',
            lineCap: 'round'
        }
    },
    {
        id: 'debris',
        name: 'Debris on Road',
        icon: 'Blocks',
        color: '#78716c',
        lineStyle: {
            color: '#78716c',
            weight: 4,
            opacity: 0.7,
            dashArray: '15, 10',
            lineCap: 'round'
        }
    },
    {
        id: 'traffic',
        name: 'Heavy Traffic / Jam',
        icon: 'Car',
        color: '#f97316',
        lineStyle: {
            color: '#f97316',
            weight: 6,
            opacity: 0.9,
            dashArray: '15, 15',
            lineCap: 'round'
        }
    },
    {
        id: 'other',
        name: 'Other',
        icon: 'MapPin',
        color: '#6b7280',
        lineStyle: {
            color: '#6b7280',
            weight: 4,
            opacity: 0.6,
            dashArray: '5, 10',
            lineCap: 'round'
        }
    }
]