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
                <div className="splash-logo">
                    <div className="logo-circle">
                        <img
                            src="/icons/icon-192x192.png"
                            alt="Dryvupp Logo"
                            className="app-logo-image"
                        />
                    </div>
                </div>

                {/* App name */}
                <h1 className="splash-title">Dryvupp</h1>
                <p className="splash-subtitle">Kigali Road Reports</p>

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
