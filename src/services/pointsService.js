import { db } from '../config/firebase';
import { collection, doc, getDoc, setDoc, updateDoc, increment, query, orderBy, limit, getDocs } from 'firebase/firestore';

const POINTS_PER_ISSUE = 5;

// Award points to a user for reporting an issue
export const awardPointsForIssue = async (userId) => {
    try {
        console.log('Awarding points to user:', userId);
        const userPointsRef = doc(db, 'userPoints', userId);
        const userPointsSnap = await getDoc(userPointsRef);

        if (userPointsSnap.exists()) {
            console.log('User exists, updating points');
            // Update existing points
            await updateDoc(userPointsRef, {
                points: increment(POINTS_PER_ISSUE),
                issuesReported: increment(1),
                lastUpdated: new Date().toISOString()
            });
        } else {
            console.log('New user, creating points record');
            // Create new points record
            await setDoc(userPointsRef, {
                userId: userId,
                points: POINTS_PER_ISSUE,
                issuesReported: 1,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            });
        }

        console.log('Points awarded successfully');
        return true;
    } catch (error) {
        console.error('Error awarding points:', error);
        return false;
    }
};

// Get user points
export const getUserPoints = async (userId) => {
    try {
        const userPointsRef = doc(db, 'userPoints', userId);
        const userPointsSnap = await getDoc(userPointsRef);

        if (userPointsSnap.exists()) {
            return userPointsSnap.data();
        }
        return { points: 0, issuesReported: 0 };
    } catch (error) {
        console.error('Error getting user points:', error);
        return { points: 0, issuesReported: 0 };
    }
};

// Get top users leaderboard
export const getLeaderboard = async (limitCount = 50) => {
    try {
        console.log('Fetching leaderboard...');
        const pointsQuery = query(
            collection(db, 'userPoints'),
            orderBy('points', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(pointsQuery);
        console.log('Found', snapshot.docs.length, 'users with points');
        const leaderboard = [];

        for (const docSnap of snapshot.docs) {
            const pointsData = docSnap.data();
            console.log('Processing user:', pointsData.userId, 'with', pointsData.points, 'points');

            // Get user data
            const userRef = doc(db, 'users', pointsData.userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                leaderboard.push({
                    userId: pointsData.userId,
                    displayName: userData.displayName || 'Anonymous',
                    email: userData.email,
                    phoneNumber: userData.phoneNumber || '',
                    points: pointsData.points || 0,
                    issuesReported: pointsData.issuesReported || 0
                });
            } else {
                console.warn('User document not found for:', pointsData.userId);
            }
        }

        console.log('Final leaderboard:', leaderboard);
        return leaderboard;
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        console.error('Error details:', error.message);
        return [];
    }
};
