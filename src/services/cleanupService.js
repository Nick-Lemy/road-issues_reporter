import { deleteExpiredIssues } from './issueService';

// Cleanup interval in milliseconds (default: 1 hour)
const CLEANUP_INTERVAL = 60 * 60 * 1000;

let cleanupTimer = null;

export const startAutoCleanup = () => {
    // Run cleanup immediately
    deleteExpiredIssues().catch(error => {
        console.error('Error in auto-cleanup:', error);
    });

    // Then run periodically
    cleanupTimer = setInterval(async () => {
        try {
            const count = await deleteExpiredIssues();
            if (count > 0) {
                console.log(`Auto-cleanup: Deleted ${count} expired issue(s)`);
            }
        } catch (error) {
            console.error('Error in auto-cleanup:', error);
        }
    }, CLEANUP_INTERVAL);

    console.log('Auto-cleanup service started');
};

export const stopAutoCleanup = () => {
    if (cleanupTimer) {
        clearInterval(cleanupTimer);
        cleanupTimer = null;
        console.log('Auto-cleanup service stopped');
    }
};
