/**
 * Notification Service
 * Handles browser notifications for traffic alerts
 */

/**
 * Request notification permission from the user
 * @returns {Promise<string>} Permission status
 */
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission !== 'denied') {
        const result = await Notification.requestPermission();
        return result;
    }

    return Notification.permission;
};

/**
 * Show a notification
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 */
export const showNotification = (title, options = {}) => {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return;
    }

    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            icon: '/icons/icon-96x96.png',
            badge: '/icons/icon-96x96.png',
            ...options
        });

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        return notification;
    } else {
        console.warn('Notification permission not granted');
    }
};

/**
 * Check if there are severe traffic issues on a route
 * @param {Array} routeCoordinates - Route coordinates
 * @param {Array} issues - All active issues
 * @returns {Array} Issues affecting this route
 */
export const checkRouteForIssues = (routeCoordinates, issues) => {
    if (!routeCoordinates || !issues || issues.length === 0) {
        return [];
    }

    const affectedIssues = [];
    const routeThreshold = 0.01; // ~1km threshold

    issues.forEach(issue => {
        if (!issue.routePoints || issue.routePoints.length < 2) return;

        // Check if issue intersects with route
        const issueStart = issue.routePoints[0];
        const issueEnd = issue.routePoints[1];

        // Simple proximity check
        for (let i = 0; i < routeCoordinates.length - 1; i++) {
            const routePoint = routeCoordinates[i];

            const distToStart = calculateDistance(
                { lat: routePoint.lat, lng: routePoint.lng },
                issueStart
            );
            const distToEnd = calculateDistance(
                { lat: routePoint.lat, lng: routePoint.lng },
                issueEnd
            );

            if (distToStart < routeThreshold || distToEnd < routeThreshold) {
                affectedIssues.push(issue);
                break;
            }
        }
    });

    return affectedIssues;
};

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(point2.lat - point1.lat);
    const dLng = toRad(point2.lng - point1.lng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Monitor saved routes for traffic issues
 * @param {Array} favoriteRoutes - User's favorite routes
 * @param {Array} issues - Current active issues
 */
export const monitorFavoriteRoutes = (favoriteRoutes, issues) => {
    if (!favoriteRoutes || favoriteRoutes.length === 0) return;
    if (!issues || issues.length === 0) return;

    favoriteRoutes.forEach(route => {
        if (!route.routeCoordinates) return;

        const affectedIssues = checkRouteForIssues(route.routeCoordinates, issues);

        // Check for severe issues
        const severeIssues = affectedIssues.filter(issue =>
            issue.type === 'accident' ||
            issue.type === 'closure' ||
            issue.type === 'flooding'
        );

        if (severeIssues.length > 0) {
            const routeName = route.name || `Route to ${route.end?.name || 'destination'}`;
            showNotification(
                `⚠️ Traffic Alert: ${routeName}`,
                {
                    body: `${severeIssues.length} severe issue(s) detected on your route: ${severeIssues[0].title}`,
                    tag: `route-alert-${route.id}`,
                    requireInteraction: false
                }
            );
        } else if (affectedIssues.length > 0) {
            const routeName = route.name || `Route to ${route.end?.name || 'destination'}`;
            showNotification(
                `Traffic Update: ${routeName}`,
                {
                    body: `${affectedIssues.length} issue(s) detected on your route`,
                    tag: `route-alert-${route.id}`,
                    requireInteraction: false
                }
            );
        }
    });
};

/**
 * Get notification permission status
 */
export const getNotificationPermission = () => {
    if (!('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission;
};
