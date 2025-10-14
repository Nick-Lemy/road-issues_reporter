export const mockIssues = [
    {
        id: 1,
        type: 'pothole',
        title: 'Large pothole on KG 7 Ave',
        description: 'Deep pothole near the roundabout, affecting traffic flow',
        location: {
            lat: -1.9441,
            lng: 30.0619,
            address: 'KG 7 Ave, Kigali'
        },
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
        status: 'verified',
        reporter: 'John D.'
    },
    {
        id: 2,
        type: 'roadworks',
        title: 'Roadworks on KN 3 Ave',
        description: 'Road maintenance causing delays, expect 20-30 min delays',
        location: {
            lat: -1.9506,
            lng: 30.1044,
            address: 'KN 3 Ave, Gishushu'
        },
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
        status: 'verified',
        reporter: 'City Official'
    },
    {
        id: 3,
        type: 'accident',
        title: 'Minor accident at Kimironko',
        description: 'Two vehicles involved, traffic slowed',
        location: {
            lat: -1.9576,
            lng: 30.1265,
            address: 'Kimironko, Kigali'
        },
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hr ago
        status: 'verified',
        reporter: 'Traffic Police'
    },
    {
        id: 4,
        type: 'closure',
        title: 'Road closure for event',
        description: 'KG 11 Ave closed for community event until 3 PM',
        location: {
            lat: -1.9355,
            lng: 30.0878,
            address: 'KG 11 Ave, Kigali'
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hrs ago
        status: 'verified',
        reporter: 'City Council'
    },
    {
        id: 5,
        type: 'flooding',
        title: 'Flooded road after rain',
        description: 'Heavy rain caused flooding, proceed with caution',
        location: {
            lat: -1.9706,
            lng: 30.0925,
            address: 'Nyabugogo, Kigali'
        },
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hrs ago
        status: 'pending',
        reporter: 'Marie K.'
    }
]

export const getRecentIssues = () => {
    return mockIssues
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
}

export const getIssuesByType = (type) => {
    return mockIssues.filter(issue => issue.type === type)
}

export const getVerifiedIssues = () => {
    return mockIssues.filter(issue => issue.status === 'verified')
}
