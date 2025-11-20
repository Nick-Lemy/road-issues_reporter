import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, AlertCircle, Clock, User, Calendar, MapPin, CheckCircle, Users, Shield, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToAllIssues, deleteIssue, deleteExpiredIssues } from '../services/issueService';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { issueCategories } from '../data/issueCategories';

const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL;

export default function AdminPanel({ onClose }) {
    const [issues, setIssues] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [filter, setFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('issues');
    const [updatingRole, setUpdatingRole] = useState(null);
    const { isAdmin, currentUser } = useAuth();

    const isSuperAdmin = () => {
        return currentUser?.email === SUPER_ADMIN_EMAIL;
    };

    useEffect(() => {
        if (!isAdmin()) return;

        if (activeTab === 'issues') {
            setLoading(true);
            const unsubscribe = subscribeToAllIssues((issuesData) => {
                setIssues(issuesData);
                setLoading(false);
            });
            return () => unsubscribe();
        } else if (activeTab === 'users' && isSuperAdmin()) {
            loadUsers();
        }
    }, [isAdmin, activeTab]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersData = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort users: super admin first, then admins, then regular users
            usersData.sort((a, b) => {
                if (a.email === SUPER_ADMIN_EMAIL) return -1;
                if (b.email === SUPER_ADMIN_EMAIL) return 1;
                if (a.role === 'admin' && b.role !== 'admin') return -1;
                if (a.role !== 'admin' && b.role === 'admin') return 1;
                return a.displayName?.localeCompare(b.displayName || '') || 0;
            });
            setUsers(usersData);
        } catch (error) {
            console.error('Error loading users:', error);
            alert('Error loading users: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleToggle = async (userId, currentRole, userEmail) => {
        if (!isSuperAdmin()) {
            alert('Only the super admin can change user roles.');
            return;
        }

        if (userEmail === SUPER_ADMIN_EMAIL) {
            alert('Cannot change the super admin role.');
            return;
        }

        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const confirmMessage = `Change this user to ${newRole.toUpperCase()}?`;
        
        if (!window.confirm(confirmMessage)) return;

        setUpdatingRole(userId);
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                role: newRole,
                updatedAt: new Date().toISOString()
            });
            
            // Update local state
            setUsers(users.map(user => 
                user.id === userId ? { ...user, role: newRole } : user
            ));
            
            alert(`User role updated to ${newRole} successfully!`);
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Error updating user role: ' + error.message);
        } finally {
            setUpdatingRole(null);
        }
    };

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
        <div style={{ padding: '0', minHeight: '100vh', background: '#f9fafb' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #0098a3 0%, #00b4c5 100%)',
                color: 'white',
                padding: '20px 16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
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
                            color: 'white',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>
                            Admin Panel
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                            {isSuperAdmin() ? '🌟 Super Admin Access' : 'Admin Access'}
                        </p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setActiveTab('issues')}
                        style={{
                            padding: '10px 20px',
                            background: activeTab === 'issues' ? 'white' : 'rgba(255, 255, 255, 0.2)',
                            color: activeTab === 'issues' ? '#0098a3' : 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <AlertCircle size={16} />
                        Issues
                    </button>
                    {isSuperAdmin() && (
                        <button
                            onClick={() => setActiveTab('users')}
                            style={{
                                padding: '10px 20px',
                                background: activeTab === 'users' ? 'white' : 'rgba(255, 255, 255, 0.2)',
                                color: activeTab === 'users' ? '#0098a3' : 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Users size={16} />
                            User Management
                        </button>
                    )}
                </div>
            </div>

            <div style={{ padding: '20px 16px 80px 16px' }}>
                {/* Issues Tab */}
                {activeTab === 'issues' && (
                    <div>
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
                                                        opacity: expired ? 0.7 : 1,
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                        transition: 'transform 0.2s, box-shadow 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
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
                        )}

                        {/* Users Tab */}
                        {activeTab === 'users' && isSuperAdmin() && (
                            <div>
                                <div style={{
                                    background: 'white',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    marginBottom: '20px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <ShieldAlert size={20} style={{ color: '#f59e0b' }} />
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                                            Super Admin Controls
                                        </h3>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                                        Manage user roles and permissions. Only you can access this section.
                                    </p>
                                </div>

                                {loading ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                        Loading users...
                                    </div>
                                ) : (
                                    <div style={{
                                        background: 'white',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                    }}>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr auto auto',
                                            gap: '16px',
                                            padding: '12px 16px',
                                            background: '#f3f4f6',
                                            fontWeight: '600',
                                            fontSize: '13px',
                                            color: '#4b5563',
                                            borderBottom: '2px solid #e5e7eb'
                                        }}>
                                            <div>USER</div>
                                            <div>ROLE</div>
                                            <div>ACTION</div>
                                        </div>
                                        {users.map(user => {
                                            const isSuperAdminUser = user.email === SUPER_ADMIN_EMAIL;
                                            const isAdminUser = user.role === 'admin';

                                            return (
                                                <div
                                                    key={user.id}
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr auto auto',
                                                        gap: '16px',
                                                        padding: '16px',
                                                        borderBottom: '1px solid #e5e7eb',
                                                        alignItems: 'center',
                                                        background: isSuperAdminUser ? '#fef3c7' : 'white',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isSuperAdminUser) e.currentTarget.style.background = '#f9fafb';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isSuperAdminUser) e.currentTarget.style.background = 'white';
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                                                            {user.displayName || 'No name'}
                                                            {isSuperAdminUser && (
                                                                <span style={{
                                                                    marginLeft: '8px',
                                                                    fontSize: '12px',
                                                                    background: '#f59e0b',
                                                                    color: 'white',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '4px',
                                                                    fontWeight: '700'
                                                                }}>
                                                                    SUPER ADMIN
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                                            {user.email}
                                                        </div>
                                                        {user.phoneNumber && (
                                                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                                                                📞 {user.phoneNumber}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <span style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            background: isAdminUser ? '#dbeafe' : '#f3f4f6',
                                                            color: isAdminUser ? '#1e40af' : '#6b7280',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}>
                                                            {isAdminUser ? <Shield size={14} /> : <User size={14} />}
                                                            {isAdminUser ? 'Admin' : 'User'}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <button
                                                            onClick={() => handleRoleToggle(user.id, user.role, user.email)}
                                                            disabled={updatingRole === user.id || isSuperAdminUser}
                                                            style={{
                                                                padding: '8px 16px',
                                                                background: isSuperAdminUser ? '#d1d5db' : (isAdminUser ? '#fbbf24' : '#0098a3'),
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                cursor: isSuperAdminUser || updatingRole === user.id ? 'not-allowed' : 'pointer',
                                                                fontSize: '13px',
                                                                fontWeight: '600',
                                                                transition: 'all 0.2s',
                                                                opacity: updatingRole === user.id ? 0.6 : 1
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (!isSuperAdminUser && updatingRole !== user.id) {
                                                                    e.target.style.transform = 'scale(1.05)';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.target.style.transform = 'scale(1)';
                                                            }}
                                                        >
                                                            {updatingRole === user.id ? 'Updating...' : (
                                                                isSuperAdminUser ? 'Protected' : (isAdminUser ? 'Remove Admin' : 'Make Admin')
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            );
        }