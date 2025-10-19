import { useState } from 'react';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, signup } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                if (!displayName.trim()) {
                    setError('Please enter your name');
                    setLoading(false);
                    return;
                }
                await signup(email, password, displayName);
            }
            // No need to do anything - the auth state change will be handled by AuthContext
        } catch (err) {
            let errorMessage = 'An error occurred. Please try again.';

            if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address.';
            } else if (err.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters.';
            } else if (err.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email.';
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password.';
            } else if (err.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password.';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
            padding: '20px'
        }}>
            <div style={{
                maxWidth: '400px',
                width: '100%',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    background: '#0098a3',
                    padding: '24px',
                    textAlign: 'center',
                    color: 'white'
                }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: '600'
                    }}>
                        Road Issues Reporter
                    </h1>
                </div>

                {/* Form */}
                <div style={{ padding: '24px' }}>
                    <div style={{
                        display: 'flex',
                        marginBottom: '24px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        border: '1px solid #e5e7eb'
                    }}>
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(true);
                                setError('');
                            }}
                            style={{
                                flex: 1,
                                padding: '10px',
                                background: isLogin ? '#0098a3' : 'white',
                                color: isLogin ? 'white' : '#6b7280',
                                border: 'none',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(false);
                                setError('');
                            }}
                            style={{
                                flex: 1,
                                padding: '10px',
                                background: !isLogin ? '#0098a3' : 'white',
                                color: !isLogin ? 'white' : '#6b7280',
                                border: 'none',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}
                        >
                            Sign Up
                        </button>
                    </div>

                    {error && (
                        <div style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            padding: '12px',
                            borderRadius: '4px',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '13px',
                            border: '1px solid #fecaca'
                        }}>
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: '#4b5563'
                                }}>
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required={!isLogin}
                                    placeholder="Enter your name"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: '4px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#0098a3'}
                                    onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                />
                            </div>
                        )}

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '6px',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#4b5563'
                            }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your email"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#0098a3'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '6px',
                                fontSize: '13px',
                                fontWeight: '500',
                                color: '#4b5563'
                            }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Enter your password"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#0098a3'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: loading ? '#9ca3af' : '#0098a3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
