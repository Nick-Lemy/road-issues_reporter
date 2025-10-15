import { useState } from 'react'
import { BarChart3, AlertTriangle, X, Lightbulb, Target, Construction, Ban, AlertOctagon, Car, Pickaxe, Droplet, Blocks, MapPin } from 'lucide-react'
import Map from './components/Map'
import IssueReportModal from './components/IssueReportModal'
import IssuesList from './components/IssuesList'
import MapLegend from './components/MapLegend'
import { saveReport, getReports } from './utils/reportStorage'
import './App.css'

const ALERTS = [
  {
    id: 1,
    type: 'roadworks',
    title: 'Roadworks on KG 7 Ave — expect delays',
    time: '10 min ago',
    icon: 'Construction'
  },
  {
    id: 2,
    type: 'closure',
    title: 'Road closure at Gishushu',
    subtitle: 'for event until 3 PM',
    time: '30 min ago',
    icon: 'Ban'
  },
  {
    id: 3,
    type: 'accident',
    title: 'Accident on KN 3 Ave — alternate route',
    subtitle: 'recommended',
    time: '1 hr ago',
    icon: 'AlertOctagon'
  }
]

const getIconComponent = (iconName, size = 24) => {
  const icons = {
    Construction: <Construction size={size} />,
    Ban: <Ban size={size} />,
    AlertOctagon: <AlertOctagon size={size} />
  }
  return icons[iconName] || <AlertTriangle size={size} />
}

const getReportTypeIcon = (type, size = 24) => {
  const icons = {
    traffic: <Car size={size} />,
    accident: <AlertOctagon size={size} />,
    pothole: <Pickaxe size={size} />,
    roadworks: <Construction size={size} />,
    closure: <Ban size={size} />,
    flooding: <Droplet size={size} />,
    debris: <Blocks size={size} />,
    other: <MapPin size={size} />
  }
  return icons[type] || <MapPin size={size} />
}

function App() {
  const [language, setLanguage] = useState('English')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const [reportingMode, setReportingMode] = useState(false)
  const [reportRoutePoints, setReportRoutePoints] = useState([])
  const [reportCategory, setReportCategory] = useState('traffic')
  const [refreshReports, setRefreshReports] = useState(0)
  const [focusedIssue, setFocusedIssue] = useState(null)

  const handleStartReporting = () => {
    setReportingMode(true)
    setReportRoutePoints([])
    // Don't open modal yet - wait for points to be selected
    setIsModalOpen(false)
  }

  const handleIssueSubmit = (issueData) => {
    console.log('New issue reported:', issueData)
    saveReport(issueData)
    setIsModalOpen(false)
    setReportingMode(false)
    setReportRoutePoints([])
    setRefreshReports(prev => prev + 1)
    alert('✓ Thank you! Your report has been submitted successfully.')
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setReportingMode(false)
    setReportRoutePoints([])
  }

  const handleIssueClick = (issue) => {
    console.log('Selected issue:', issue)
    setFocusedIssue(issue)
    // Scroll to map
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReportRouteSelect = (points) => {
    setReportRoutePoints(points)
    // Open modal once both points are selected
    setIsModalOpen(true)
  }

  const handleCategoryChange = (category) => {
    setReportCategory(category)
  }

  const userReports = getReports()

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
        <button className="action-btn" onClick={() => setShowLegend(!showLegend)}>
          <BarChart3 size={24} className="action-icon" />
          <span>{showLegend ? 'Hide' : 'Show'} Legend</span>
        </button>
        {!reportingMode ? (
          <button className="action-btn" onClick={handleStartReporting}>
            <AlertTriangle size={24} className="action-icon" />
            <span>Report Road Issue</span>
          </button>
        ) : (
          <button className="action-btn active-reporting" onClick={handleModalClose}>
            <X size={24} className="action-icon" />
            <span>Cancel Reporting</span>
          </button>
        )}
      </div>

      {/* Search and Map Section */}
      <div className="content-section">
        <h2 className="section-title">Updates near Kigali</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search for location or issue..."
            className="search-input"
          />
        </div>

        {showLegend && <MapLegend />}

        <Map
          onIssueSelect={handleIssueClick}
          reportingMode={reportingMode}
          onReportRouteSelect={handleReportRouteSelect}
          reportCategory={reportCategory}
          refreshReports={refreshReports}
          focusIssue={focusedIssue}
        />

        {!reportingMode ? (
          <div className="map-hint">
            <Lightbulb size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            Click "Get Directions" to find routes, or "Report Road Issue" to mark problematic road sections!
          </div>
        ) : (
          <div className="map-hint-warning">
            <Target size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            <strong>Reporting Mode Active:</strong> Click two points on the map to select the road section with the issue. Click "Cancel Reporting" to stop.
          </div>
        )}
      </div>

      {/* Latest Alerts Section */}
      <div className="alerts-section">
        <h2 className="section-title">Latest Verified Alerts</h2>
        <div className="alerts-list">
          {ALERTS.map(alert => (
            <div key={alert.id} className={`alert-card alert-${alert.type}`}>
              <div className="alert-icon">{getIconComponent(alert.icon, 32)}</div>
              <div className="alert-content">
                <div className="alert-title">{alert.title}</div>
                {alert.subtitle && <div className="alert-subtitle">{alert.subtitle}</div>}
                <div className="alert-time">{alert.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Reported Issues */}
      {userReports.length > 0 && (
        <div className="alerts-section">
          <h2 className="section-title">Your Reported Issues ({userReports.length})</h2>
          <div className="user-reports-list">
            {userReports.map(report => (
              <div
                key={report.id}
                className={`alert-card alert-${report.type}`}
                onClick={() => handleIssueClick(report)}
                style={{ cursor: 'pointer' }}
              >
                <div className="alert-icon">
                  {getReportTypeIcon(report.type, 32)}
                </div>
                <div className="alert-content">
                  <div className="alert-title">{report.title}</div>
                  {report.description && <div className="alert-subtitle">{report.description}</div>}
                  <div className="alert-time">
                    {new Date(report.timestamp).toLocaleString()} • {report.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Issues Section */}
      <div className="alerts-section">
        <h2 className="section-title">All Reported Issues</h2>
        <IssuesList onIssueClick={handleIssueClick} />
      </div>

      {/* Issue Report Modal */}
      <IssueReportModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleIssueSubmit}
        routePoints={reportRoutePoints}
        onCategoryChange={handleCategoryChange}
        selectedCategory={reportCategory}
      />
    </div>
  )
}

export default App