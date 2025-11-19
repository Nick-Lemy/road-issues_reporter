import { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/pointsService';
import { useAuth } from '../contexts/AuthContext';
import { Crown, Trophy, Medal } from 'lucide-react';

function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser, isAdmin } = useAuth();

    useEffect(() => {
        loadLeaderboard();

        // Refresh leaderboard every 30 seconds while component is mounted
        const interval = setInterval(() => {
            loadLeaderboard();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const loadLeaderboard = async () => {
        setLoading(true);
        const data = await getLeaderboard(50);
        console.log('Leaderboard data:', data);
        setLeaderboard(data);
        setLoading(false);
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return <Crown className="rank-icon gold" size={24} />;
        if (rank === 2) return <Trophy className="rank-icon silver" size={20} />;
        if (rank === 3) return <Medal className="rank-icon bronze" size={20} />;
        return null;
    };

    const isCurrentUser = (userId) => {
        return currentUser && currentUser.uid === userId;
    };

    if (loading) {
        return (
            <div className="leaderboard-container">
                <div className="leaderboard-header">
                    <h2>Leaderboard</h2>
                    <p className="subtitle">Top contributors to road safety</p>
                </div>
                <div className="loading-state">Loading rankings...</div>
            </div>
        );
    }

    return (
        <div className="leaderboard-container">
            <div className="leaderboard-header">
                <h2>Leaderboard</h2>
                <p className="subtitle">Top contributors to road safety</p>
                <p className="points-info">Earn 5 points for each issue reported</p>
                <button
                    onClick={loadLeaderboard}
                    style={{
                        marginTop: '12px',
                        padding: '8px 16px',
                        background: '#0098a3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    Refresh Rankings
                </button>
            </div>

            <div className="leaderboard-list">
                {leaderboard.map((user, index) => {
                    const rank = index + 1;
                    const isCurrentUserRow = isCurrentUser(user.userId);

                    return (
                        <div
                            key={user.userId}
                            className={`leaderboard-item ${isCurrentUserRow ? 'current-user' : ''} ${rank <= 3 ? 'top-three' : ''}`}
                        >
                            <div className="rank-section">
                                {getRankIcon(rank)}
                                <span className={`rank-number ${rank === 1 ? 'first' : ''}`}>
                                    #{rank}
                                </span>
                            </div>

                            <div className="user-info">
                                <div className="user-name">
                                    {isAdmin() ? user.displayName : (user.displayName?.split(' ')[0] || user.displayName)}
                                    {isCurrentUserRow && <span className="you-badge">You</span>}
                                </div>
                                {isAdmin() && (
                                    <div className="user-email">{user.email}</div>
                                )}
                            </div>

                            <div className="stats-section">
                                <div className="stat-item">
                                    <span className="stat-value">{user.points}</span>
                                    <span className="stat-label">points</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">{user.issuesReported}</span>
                                    <span className="stat-label">reports</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {leaderboard.length === 0 && (
                <div className="empty-state">
                    <p>No rankings yet. Be the first to report an issue!</p>
                </div>
            )}
        </div>
    );
}

export default Leaderboard;
