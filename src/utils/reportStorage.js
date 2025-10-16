const STORAGE_KEY = 'road_reports';
const CHANNEL_NAME = 'road_reports_channel';
let bc = null;
try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel(CHANNEL_NAME);
    }
} catch (e) {
    console.warn('BroadcastChannel unavailable', e);
}

export const saveReport = (report) => {
    const reports = getReports();
    const newReport = {
        ...report,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        status: 'pending'
    };
    reports.push(newReport);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    if (bc) bc.postMessage({ type: 'reports-updated', payload: reports });
    return newReport;
};

export const getReports = () => {
    try {
        const reports = localStorage.getItem(STORAGE_KEY);
        return reports ? JSON.parse(reports) : [];
    } catch (error) {
        console.error('Error loading reports:', error);
        return [];
    }
};

export const deleteReport = (id) => {
    const reports = getReports();
    const filtered = reports.filter(report => report.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    if (bc) bc.postMessage({ type: 'reports-updated', payload: filtered });
};

export const clearAllReports = () => {
    localStorage.removeItem(STORAGE_KEY);
    if (bc) bc.postMessage({ type: 'reports-updated', payload: [] });
};

export const updateReport = (id, updates) => {
    const reports = getReports();
    const updated = reports.map(report =>
        report.id === id ? { ...report, ...updates } : report
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (bc) bc.postMessage({ type: 'reports-updated', payload: updated });
};

export const onReportsUpdated = (handler) => {
    if (!bc) return () => { };
    const listener = (ev) => {
        if (ev && ev.data && ev.data.type === 'reports-updated') {
            handler(ev.data.payload);
        }
    };
    bc.addEventListener('message', listener);
    return () => bc.removeEventListener('message', listener);
};
