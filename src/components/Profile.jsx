import { useState, useEffect } from 'react';
import { MapPin, Shield, Edit2, Save, X, User, Mail, Phone, Moon, Sun, BellIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../config/firebase';
import { getUserPoints } from '../services/pointsService';
import { requestNotificationPermission, showNotification } from '../services/notificationService';

export default function Profile({ 
    userReports, 
    favorites, 
    onAdminClick, 
    onLogout,
    darkMode,
    setDarkMode,
    language,
    setLanguage,
    notificationsEnabled,
    setNotificationsEnabled,
    t 
}) {
    const { currentUser, isAdmin, userProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [userPoints, setUserPoints] = useState({ points: 0, issuesReported: 0 });

    useEffect(() => {
        if (currentUser) {
            loadUserData();
        }
    }, [currentUser]);

    const loadUserData = async () => {
        if (!currentUser) return;
        
        // Set initial values
        setDisplayName(currentUser.displayName || '');
        
        // Fetch user profile from Firestore
        try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setPhoneNumber(userData.phoneNumber || '');
            }
            
            // Fetch user points
            const points = await getUserPoints(currentUser.uid);
            setUserPoints(points);
        } catch (err) {
            console.error('Error loading user data:', err);
        }
    };

    const handleSave = async () => {
        if (!displayName.trim()) {
            setError('Name cannot be empty');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Update Firebase Auth profile
            await updateProfile(currentUser, { displayName: displayName.trim() });

            // Update Firestore user document
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                displayName: displayName.trim(),
                phoneNumber: phoneNumber.trim(),
                updatedAt: new Date().toISOString()
            });

            setSuccess('Profile updated successfully!');
            setIsEditing(false);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        // Reset to original values
        setDisplayName(currentUser.displayName || '');
        loadUserData();
        setIsEditing(false);
        setError('');
    };

    if (!currentUser) return null;

    return (
        <div className="tab-content">
            <div className="profile-section">
                <div className="profile-card">
                    <div className="profile-avatar">
                        <MapPin size={48} />
                    </div>

                    {!isEditing ? (
                        <>
                            <h3>{currentUser.displayName || 'User'}</h3>
                            <p className="profile-subtitle">{currentUser.email}</p>
                            {userProfile?.phoneNumber && (
                                <p className="profile-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', marginTop: '4px' }}>
                                    <Phone size={14} />
                                    {userProfile.phoneNumber}
                                </p>
                            )}
                            {isAdmin() && (
                                <div style={{
                                    marginTop: '8px',
                                    padding: '4px 12px',
                                    background: '#fbbf24',
                                    color: '#78350f',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}>
                                    ADMIN
                                </div>
                            )}
                            <button
                                onClick={() => setIsEditing(true)}
                                style={{
                                    marginTop: '16px',
                                    padding: '8px 16px',
                                    background: '#0098a3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    margin: '16px auto 0'
                                }}
                            >
                                <Edit2 size={16} />
                                Edit Profile
                            </button>
                        </>
                    ) : (
                        <div style={{ width: '100%', maxWidth: '300px', margin: '16px auto' }}>
                            {error && (
                                <div style={{
                                    background: '#fee2e2',
                                    color: '#991b1b',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    marginBottom: '12px',
                                    textAlign: 'left'
                                }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ marginBottom: '12px', textAlign: 'left' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: '#4b5563'
                                }}>
                                    <User size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Enter your name"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '12px', textAlign: 'left' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: '#4b5563'
                                }}>
                                    <Mail size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={currentUser.email}
                                    disabled
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '14px',
                                        background: '#f3f4f6',
                                        color: '#6b7280',
                                        cursor: 'not-allowed',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: '#4b5563'
                                }}>
                                    <Phone size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="Enter your phone number"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        background: loading ? '#9ca3af' : '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Save size={16} />
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        background: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <X size={16} />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {success && (
                    <div style={{
                        background: '#d1fae5',
                        color: '#065f46',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        marginBottom: '16px',
                        fontWeight: '500'
                    }}>
                        {success}
                    </div>
                )}

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-number">{userPoints.points}</div>
                        <div className="stat-label">Points</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{userReports.length}</div>
                        <div className="stat-label">{t('yourReports', language)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{favorites.length}</div>
                        <div className="stat-label">{t('favorite', language)}</div>
                    </div>
                </div>

                {isAdmin() && (
                    <button
                        onClick={onAdminClick}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#0098a3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <Shield size={20} />
                        Admin Panel
                    </button>
                )}

                <button
                    onClick={onLogout}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        marginBottom: '16px'
                    }}
                >
                    Sign Out
                </button>

                <div className="settings-section">
                    <h3 className="section-title">Settings</h3>

                    <div className="setting-item">
                        <span style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                            {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                            <p>Dark Mode</p>
                        </span>
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            style={{
                                padding: '6px 12px',
                                background: darkMode ? '#10b981' : '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            {darkMode ? 'Enabled ✓' : 'Disabled'}
                        </button>
                    </div>

                    <div className="setting-item">
                        <span style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                            <BellIcon />
                            <p>Traffic Notifications</p>
                        </span>
                        <button
                            onClick={async () => {
                                if (notificationsEnabled) {
                                    alert('Notifications are enabled. To disable, go to browser settings.');
                                } else {
                                    const permission = await requestNotificationPermission();
                                    if (permission === 'granted') {
                                        setNotificationsEnabled(true);
                                        showNotification('Notifications Enabled', {
                                            body: 'You\'ll receive traffic alerts for your saved routes'
                                        });
                                    }
                                }
                            }}
                            style={{
                                padding: '6px 12px',
                                background: notificationsEnabled ? '#10b981' : '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            {notificationsEnabled ? 'Enabled ✓' : 'Disabled'}
                        </button>
                    </div>

                    <div className="setting-item">
                        <span>Language</span>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="language-select"
                        >
                            <option value="English">English</option>
                            <option value="Kinyarwanda">Kinyarwanda</option>
                            <option value="French">Français</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
