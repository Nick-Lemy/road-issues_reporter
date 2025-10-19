import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, AlertCircle, Clock, User, Calendar, MapPin, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToAllIssues, deleteIssue, deleteExpiredIssues } from '../services/issueService';
import { issueCategories } from '../data/issueCategories';

export default function AdminPanel({ onClose }) {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [filter, setFilter] = useState('all'); // all, active, expired
    const { isAdmin } = useAuth();

    useEffect(() => {
        if (!isAdmin()) return;

        setLoading(true);
        const unsubscribe = subscribeToAllIssues((issuesData) => {
            setIssues(issuesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isAdmin]);

    const handleDelete = async (issueId) => {
        if (!window.confirm('Are you sure you want to delete this issue?')) return;

        setDeleting(issueId);
        try {
            await deleteIssue(issueId);
        } catch (error) {
            alert('Error deleting issue: ' + error.message);
        } finally {
            setDeleting(null);
        }
    };

    const handleCleanup = async () => {
        if (!window.confirm('Delete all expired issues?')) return;

        setLoading(true);
        try {
            const count = await deleteExpiredIssues();
            alert(`Deleted ${count} expired issue(s)`);
        } catch (error) {
            alert('Error cleaning up: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getCategory = (type) => {
        return issueCategories.find(cat => cat.id === type) || issueCategories[issueCategories.length - 1];
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString();
    };

    const isExpired = (expiresAt) => {
        return new Date(expiresAt) < new Date();
    };

    const getFilteredIssues = () => {
        if (filter === 'active') {
            return issues.filter(issue => !isExpired(issue.expiresAt));
        } else if (filter === 'expired') {
            return issues.filter(issue => isExpired(issue.expiresAt));
        }
        return issues;
    };

    const filteredIssues = getFilteredIssues();

    if (!isAdmin()) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
                <h2>Access Denied</h2>
                <p>You do not have permission to access this page.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '0', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
                padding: '16px',
                background: '#0098a3',
                color: 'white'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'white'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                    Admin Panel - Issue Management
                </h2>
            </div>

            <div style={{ padding: '0 16px 80px 16px' }}>
                {/* Stats and Actions */}
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{
                            background: '#f3f4f6',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            fontSize: '14px'
                        }}>
                            <strong>Total:</strong> {issues.length}
                        </div>
                        <div style={{
                            background: '#dcfce7',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            fontSize: '14px'
                        }}>
                            <strong>Active:</strong> {issues.filter(i => !isExpired(i.expiresAt)).length}
                        </div>
                        <div style={{
                            background: '#fee2e2',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            fontSize: '14px'
                        }}>
                            <strong>Expired:</strong> {issues.filter(i => isExpired(i.expiresAt)).length}
                        </div>
                    </div>

                    <button
                        onClick={handleCleanup}
                        disabled={loading}
                        style={{
                            padding: '10px 16px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}
                    >
                        Clean Expired
                    </button>
                </div>

                {/* Filter Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '20px',
                    borderBottom: '2px solid #e5e7eb'
                }}>
                    {['all', 'active', 'expired'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            style={{
                                padding: '8px 16px',
                                background: filter === tab ? '#0098a3' : 'transparent',
                                color: filter === tab ? 'white' : '#6b7280',
                                border: 'none',
                                borderRadius: '8px 8px 0 0',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                textTransform: 'capitalize'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Issues List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        Loading issues...
                    </div>
                ) : filteredIssues.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        No issues found
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredIssues.map(issue => {
                            const category = getCategory(issue.type);
                            const expired = isExpired(issue.expiresAt);

                            return (
                                <div
                                    key={issue.id}
                                    style={{
                                        border: `2px solid ${expired ? '#fecaca' : category.color}`,
                                        borderRadius: '12px',
                                        padding: '16px',
                                        background: expired ? '#fef2f2' : 'white',
                                        opacity: expired ? 0.7 : 1
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            {/* Header */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <div style={{
                                                    background: category.color,
                                                    color: 'white',
                                                    padding: '4px 12px',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: '600'
                                                }}>
                                                    {category.name}
                                                </div>
                                                {expired && (
                                                    <div style={{
                                                        background: '#ef4444',
                                                        color: 'white',
                                                        padding: '4px 12px',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        fontWeight: '600'
                                                    }}>
                                                        EXPIRED
                                                    </div>
                                                )}
                                            </div>                                        {/* Title */}
                                            <h3 style={{ margin: '8px 0', fontSize: '16px', fontWeight: '600' }}>
                                                {issue.title || 'No title'}
                                            </h3>

                                            {/* Description */}
                                            {issue.description && (
                                                <p style={{ margin: '8px 0', fontSize: '14px', color: '#6b7280' }}>
                                                    {issue.description}
                                                </p>
                                            )}

                                            {/* Meta Information */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                                gap: '12px',
                                                marginTop: '12px',
                                                fontSize: '13px',
                                                color: '#4b5563'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <User size={14} />
                                                    <strong>Reporter:</strong> {issue.displayName || issue.userEmail}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Calendar size={14} />
                                                    <strong>Created:</strong> {formatDate(issue.createdAt)}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Clock size={14} />
                                                    <strong>Expires:</strong> {formatDate(issue.expiresAt)}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <AlertCircle size={14} />
                                                    <strong>Duration:</strong> {issue.duration}h
                                                </div>
                                            </div>

                                            {/* Location Info */}
                                            {issue.routePoints && issue.routePoints.length > 0 && (
                                                <div style={{
                                                    marginTop: '12px',
                                                    padding: '8px',
                                                    background: '#f9fafb',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    color: '#6b7280'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <MapPin size={14} />
                                                        <strong>Location:</strong>
                                                        {issue.routePoints[0]?.lat.toFixed(4)}, {issue.routePoints[0]?.lng.toFixed(4)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <button
                                            onClick={() => handleDelete(issue.id)}
                                            disabled={deleting === issue.id}
                                            style={{
                                                padding: '8px 12px',
                                                background: deleting === issue.id ? '#9ca3af' : '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: deleting === issue.id ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                fontSize: '14px',
                                                marginLeft: '12px'
                                            }}
                                        >
                                            <Trash2 size={16} />
                                            {deleting === issue.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}