const STORAGE_KEY = 'road_reports';

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
};

export const clearAllReports = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export const updateReport = (id, updates) => {
    const reports = getReports();
    const updated = reports.map(report =>
        report.id === id ? { ...report, ...updates } : report
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
