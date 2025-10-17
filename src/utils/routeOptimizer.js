// Route optimization based on road issues
// Time penalties in minutes for different issue types
export const ISSUE_TIME_PENALTIES = {
    'closure': Infinity, // Block this route completely
    'accident': 15,      // 15 min delay
    'traffic': 10,       // 10 min delay
    'roadworks': 8,      // 8 min delay
    'flooding': 12,      // 12 min delay
    'debris': 5,         // 5 min delay
    'pothole': 2,        // 2 min delay (slow down)
    'other': 3           // 3 min delay
};

/**
 * Check if a route intersects with a reported issue
 * @param {Array} routeCoords - Array of [lat, lng] coordinates
 * @param {Object} issue - Issue object with routePoints
 * @returns {boolean} - True if route intersects with issue
 */
export function routeIntersectsIssue(routeCoords, issue) {
    if (!issue.routePoints || issue.routePoints.length !== 2) return false;

    const issueStart = [issue.routePoints[0].lat, issue.routePoints[0].lng];
    const issueEnd = [issue.routePoints[1].lat, issue.routePoints[1].lng];

    // Simple bounding box check
    const issueBounds = {
        minLat: Math.min(issueStart[0], issueEnd[0]),
        maxLat: Math.max(issueStart[0], issueEnd[0]),
        minLng: Math.min(issueStart[1], issueEnd[1]),
        maxLng: Math.max(issueStart[1], issueEnd[1])
    };

    // Expand bounds slightly to account for nearby roads
    const buffer = 0.005; // ~500m
    issueBounds.minLat -= buffer;
    issueBounds.maxLat += buffer;
    issueBounds.minLng -= buffer;
    issueBounds.maxLng += buffer;

    // Check if any route coordinate falls within issue bounds
    for (let coord of routeCoords) {
        const lat = coord.lat || coord[0];
        const lng = coord.lng || coord[1];

        if (lat >= issueBounds.minLat && lat <= issueBounds.maxLat &&
            lng >= issueBounds.minLng && lng <= issueBounds.maxLng) {
            return true;
        }
    }

    return false;
}

/**
 * Calculate total time penalty for a route based on intersecting issues
 * @param {Array} routeCoords - Array of route coordinates
 * @param {Array} issues - Array of reported issues
 * @returns {Object} - { penalty: number (minutes), blockedIssues: array, affectedIssues: array }
 */
export function calculateRoutePenalty(routeCoords, issues) {
    let totalPenalty = 0;
    const affectedIssues = [];
    const blockedIssues = [];

    for (let issue of issues) {
        if (routeIntersectsIssue(routeCoords, issue)) {
            const penalty = ISSUE_TIME_PENALTIES[issue.type] || 0;

            if (penalty === Infinity) {
                // Route is blocked
                blockedIssues.push(issue);
                return { penalty: Infinity, blockedIssues, affectedIssues };
            }

            totalPenalty += penalty;
            affectedIssues.push({ issue, penalty });
        }
    }

    return { penalty: totalPenalty, blockedIssues, affectedIssues };
}

/**
 * Rank routes by adjusted travel time (base time + penalties)
 * @param {Array} routes - Array of route objects from Leaflet Routing Machine
 * @param {Array} issues - Array of reported issues
 * @returns {Array} - Sorted routes with penalty info
 */
export function rankRoutes(routes, issues) {
    const rankedRoutes = routes.map((route, index) => {
        const { penalty, blockedIssues, affectedIssues } = calculateRoutePenalty(route.coordinates, issues);

        const baseTimeMinutes = route.summary.totalTime / 60;
        const adjustedTimeMinutes = penalty === Infinity ? Infinity : baseTimeMinutes + penalty;

        return {
            ...route,
            originalIndex: index,
            baseTimeMinutes,
            penaltyMinutes: penalty,
            adjustedTimeMinutes,
            isBlocked: penalty === Infinity,
            blockedIssues,
            affectedIssues,
            recommendationScore: penalty === Infinity ? -1 : adjustedTimeMinutes
        };
    });

    // Filter out blocked routes and sort by adjusted time
    const validRoutes = rankedRoutes
        .filter(r => !r.isBlocked)
        .sort((a, b) => a.adjustedTimeMinutes - b.adjustedTimeMinutes);

    const blockedRoutes = rankedRoutes.filter(r => r.isBlocked);

    return { validRoutes, blockedRoutes };
}

/**
 * Format time with penalties for display
 * @param {number} baseMinutes - Base travel time in minutes
 * @param {number} penaltyMinutes - Penalty in minutes
 * @returns {string} - Formatted string like "25 min (+10 min delay)"
 */
export function formatTimeWithPenalty(baseMinutes, penaltyMinutes) {
    const totalMinutes = Math.round(baseMinutes + penaltyMinutes);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const baseTimeStr = hours > 0
        ? `${hours} hr ${minutes} min`
        : `${minutes} min`;

    if (penaltyMinutes > 0) {
        return `${baseTimeStr} (+${Math.round(penaltyMinutes)} min delay)`;
    }

    return baseTimeStr;
}
