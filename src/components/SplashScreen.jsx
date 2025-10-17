import { useEffect, useState } from 'react'
import { MapPin, Navigation } from 'lucide-react'

export default function SplashScreen({ onComplete }) {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        // Simulate loading progress
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval)
                    setTimeout(() => onComplete(), 300)
                    return 100
                }
                return prev + 20
            })
        }, 200)

        return () => clearInterval(interval)
    }, [onComplete])

    return (
        <div className="splash-screen">
            <div className="splash-content">
                {/* Animated logo */}
                <img
                    style={{ width: 80 }}
                    src="/icons/icon-192x192.png"
                    alt="Dryvupp Logo"
                    className="app-logo-image"
                />

                {/* App name */}
                <h1 style={{ fontSize: 22, paddingBottom: 5, color: '#0098a3' }}>Dryvupp</h1>
                <p style={{ fontSize: 14, paddingBottom: 12, color: '#fd8121' }}>Kigali Road Reports</p>

                {/* Loading bar */}
                <div className="splash-loader">
                    <div
                        className="splash-loader-bar"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <p className="splash-text">Loading your road network...</p>
            </div>
        </div>
    )
}
