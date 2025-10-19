import {
    collection,
    addDoc,
    query,
    getDocs,
    deleteDoc,
    doc,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

const ISSUES_COLLECTION = 'issues';

// Save a new issue report
export const saveIssue = async (issueData, userId, userEmail, displayName) => {
    try {
        // Serialize route points to plain objects (remove any Leaflet-specific properties)
        const serializedRoutePoints = issueData.routePoints?.map(point => ({
            lat: typeof point.lat === 'function' ? point.lat() : point.lat,
            lng: typeof point.lng === 'function' ? point.lng() : point.lng,
        })) || [];

        // Serialize start and end locations
        const serializedStartLocation = issueData.startLocation ? {
            lat: typeof issueData.startLocation.lat === 'function'
                ? issueData.startLocation.lat()
                : issueData.startLocation.lat,
            lng: typeof issueData.startLocation.lng === 'function'
                ? issueData.startLocation.lng()
                : issueData.startLocation.lng,
        } : null;

        const serializedEndLocation = issueData.endLocation ? {
            lat: typeof issueData.endLocation.lat === 'function'
                ? issueData.endLocation.lat()
                : issueData.endLocation.lat,
            lng: typeof issueData.endLocation.lng === 'function'
                ? issueData.endLocation.lng()
                : issueData.endLocation.lng,
        } : null;

        const issueWithMeta = {
            type: issueData.type || 'other',
            title: issueData.title || '',
            description: issueData.description || '',
            routePoints: serializedRoutePoints,
            startLocation: serializedStartLocation,
            endLocation: serializedEndLocation,
            userId,
            userEmail,
            displayName,
            createdAt: Timestamp.now(),
            status: 'pending',
            // Duration in hours (default 24 hours if not specified)
            duration: issueData.duration || 24,
            // Calculate expiry timestamp
            expiresAt: Timestamp.fromDate(
                new Date(Date.now() + (issueData.duration || 24) * 60 * 60 * 1000)
            ),
        };

        const docRef = await addDoc(collection(db, ISSUES_COLLECTION), issueWithMeta);
        return { id: docRef.id, ...issueWithMeta };
    } catch (error) {
        console.error('Error saving issue:', error);
        throw error;
    }
};

// Get all active issues (not expired)
export const getActiveIssues = async () => {
    try {
        const now = Timestamp.now();
        const q = query(
            collection(db, ISSUES_COLLECTION),
            where('expiresAt', '>', now),
            orderBy('expiresAt'),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const issues = [];
        querySnapshot.forEach((doc) => {
            issues.push({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore Timestamps to JS Date for compatibility
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                expiresAt: doc.data().expiresAt?.toDate?.() || new Date(),
            });
        });

        return issues;
    } catch (error) {
        console.error('Error getting issues:', error);
        return [];
    }
};

// Get all issues for admin (including expired)
export const getAllIssuesForAdmin = async () => {
    try {
        const q = query(
            collection(db, ISSUES_COLLECTION),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const issues = [];
        querySnapshot.forEach((doc) => {
            issues.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                expiresAt: doc.data().expiresAt?.toDate?.() || new Date(),
            });
        });

        return issues;
    } catch (error) {
        console.error('Error getting all issues:', error);
        return [];
    }
};

// Delete an issue (admin only)
export const deleteIssue = async (issueId) => {
    try {
        await deleteDoc(doc(db, ISSUES_COLLECTION, issueId));
        return true;
    } catch (error) {
        console.error('Error deleting issue:', error);
        throw error;
    }
};

// Delete expired issues (cleanup function)
export const deleteExpiredIssues = async () => {
    try {
        const now = Timestamp.now();
        const q = query(
            collection(db, ISSUES_COLLECTION),
            where('expiresAt', '<=', now)
        );

        const querySnapshot = await getDocs(q);
        const deletePromises = [];

        querySnapshot.forEach((document) => {
            deletePromises.push(deleteDoc(doc(db, ISSUES_COLLECTION, document.id)));
        });

        await Promise.all(deletePromises);
        return deletePromises.length;
    } catch (error) {
        console.error('Error deleting expired issues:', error);
        return 0;
    }
};

// Real-time listener for active issues
export const subscribeToActiveIssues = (callback) => {
    const now = Timestamp.now();
    const q = query(
        collection(db, ISSUES_COLLECTION),
        where('expiresAt', '>', now),
        orderBy('expiresAt'),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
        const issues = [];
        querySnapshot.forEach((doc) => {
            issues.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                expiresAt: doc.data().expiresAt?.toDate?.() || new Date(),
            });
        });
        callback(issues);
    }, (error) => {
        console.error('Error in issues subscription:', error);
    });
};

// Real-time listener for all issues (admin)
export const subscribeToAllIssues = (callback) => {
    const q = query(
        collection(db, ISSUES_COLLECTION),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
        const issues = [];
        querySnapshot.forEach((doc) => {
            issues.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                expiresAt: doc.data().expiresAt?.toDate?.() || new Date(),
            });
        });
        callback(issues);
    }, (error) => {
        console.error('Error in issues subscription:', error);
    });
};

// Update issue status
export const updateIssueStatus = async (issueId, status) => {
    try {
        await updateDoc(doc(db, ISSUES_COLLECTION, issueId), {
            status,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error('Error updating issue status:', error);
        throw error;
    }
};

// Get user's own issues
export const getUserIssues = async (userId) => {
    try {
        const q = query(
            collection(db, ISSUES_COLLECTION),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const issues = [];
        querySnapshot.forEach((doc) => {
            issues.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                expiresAt: doc.data().expiresAt?.toDate?.() || new Date(),
            });
        });

        return issues;
    } catch (error) {
        console.error('Error getting user issues:', error);
        return [];
    }
};

// Real-time listener for user's own issues
export const subscribeToUserIssues = (userId, callback) => {
    const q = query(
        collection(db, ISSUES_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
        const issues = [];
        querySnapshot.forEach((doc) => {
            issues.push({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                expiresAt: doc.data().expiresAt?.toDate?.() || new Date(),
            });
        });
        callback(issues);
    }, (error) => {
        console.error('Error in user issues subscription:', error);
    });
};
