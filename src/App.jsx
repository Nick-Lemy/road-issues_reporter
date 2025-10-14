import { useState } from 'react'
import Map from './components/Map'
import './App.css'

const ALERTS = [
  {
    id: 1,
    type: 'roadworks',
    title: 'Roadworks on KG 7 Ave — expect delays',
    time: '10 min ago',
    icon: '🚧'
  },
  {
    id: 2,
    type: 'closure',
    title: 'Road closure at Gishushu',
    subtitle: 'for event until 3 PM',
    time: '30 min ago',
    icon: '🚫'
  },
  {
    id: 3,
    type: 'accident',
    title: 'Accident on KN 3 Ave — alternate route',
    subtitle: 'recommended',
    time: '1 hr ago',
    icon: '⚠️'
  }
]

function App() {
  const [language, setLanguage] = useState('English')

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1 className="header-title">Kigali Real-Time Road Info</h1>
        <div className="language-selector">
          <button
            className={language === 'English' ? 'lang-active' : ''}
            onClick={() => setLanguage('English')}
          >
            English
          </button>
          <button
            className={language === 'Kinyarwanda' ? 'lang-active' : ''}
            onClick={() => setLanguage('Kinyarwanda')}
          >
            Kinyarwanda
          </button>
          <button
            className={language === 'French' ? 'lang-active' : ''}
            onClick={() => setLanguage('French')}
          >
            French
          </button>
        </div>
      </header>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="action-btn">
          <span className="action-icon">📍</span>
          <span>Live Traffic Updates</span>
        </button>
        <button className="action-btn">
          <span className="action-icon">⚠️</span>
          <span>Report a Road Issue</span>
        </button>
      </div>

      {/* Search and Map Section */}
      <div className="content-section">
        <h2 className="section-title">Updates near K1</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search"
            className="search-input"
          />
        </div>
        <Map />
      </div>

      {/* Alerts Section */}
      <div className="alerts-section">
        <h2 className="section-title">Latest Verified Alerts</h2>
        <div className="alerts-list">
          {ALERTS.map(alert => (
            <div key={alert.id} className={`alert-card alert-${alert.type}`}>
              <div className="alert-icon">{alert.icon}</div>
              <div className="alert-content">
                <div className="alert-title">{alert.title}</div>
                {alert.subtitle && <div className="alert-subtitle">{alert.subtitle}</div>}
                <div className="alert-time">{alert.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
