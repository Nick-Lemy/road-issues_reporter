import { useState, useEffect } from 'react'
import { BarChart3, AlertTriangle, X, Lightbulb, Target, Construction, Ban, AlertOctagon, Car, Pickaxe, Droplet, Blocks, MapPin, Globe, LogIn, LogOut, Shield } from 'lucide-react'
import Map from './components/Map'
import SearchBar from './components/SearchBar'
import SplashScreen from './components/SplashScreen'
import BottomNav from './components/BottomNav'
import { getFavorites, saveFavorite, deleteFavorite } from './utils/favoritesStorage'
import IssueReportModal from './components/IssueReportModal'
import IssuesList from './components/IssuesList'
import MapLegend from './components/MapLegend'
import AdminPanel from './components/AdminPanel'
import LoginPage from './components/LoginPage'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { saveIssue, subscribeToUserIssues, subscribeToActiveIssues } from './services/issueService'
import { startAutoCleanup, stopAutoCleanup } from './services/cleanupService'
import { issueCategories } from './data/issueCategories'
import { t } from './utils/i18n'
import './App.css'

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

// Helper function to format time ago
const getTimeAgo = (timestamp) => {
  if (!timestamp) return 'Just now'

  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hr ago`
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

function AppContent() {
  const { currentUser, logout, isAdmin } = useAuth()
  const [showSplash, setShowSplash] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [language, setLanguage] = useState('English')
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showLegend, setShowLegend] = useState(false)
  const [reportingMode, setReportingMode] = useState(false)
  const [reportRoutePoints, setReportRoutePoints] = useState([])
  const [reportCategory, setReportCategory] = useState('traffic')
  const [refreshReports, setRefreshReports] = useState(0)
  const [focusedIssue, setFocusedIssue] = useState(null)
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [favorites, setFavorites] = useState(getFavorites())
  const [latestRoute, setLatestRoute] = useState(null)
  const [userReports, setUserReports] = useState([])
  const [latestIssues, setLatestIssues] = useState([])

  // Start auto-cleanup on mount
  useEffect(() => {
    startAutoCleanup()
    return () => stopAutoCleanup()
  }, [])

  // Subscribe to latest issues for alerts
  useEffect(() => {
    const unsubscribe = subscribeToActiveIssues((issues) => {
      // Get the 5 most recent issues
      const sorted = [...issues].sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      ).slice(0, 5)
      setLatestIssues(sorted)
    })
    return () => unsubscribe()
  }, [])

  // Load user reports when user changes
  useEffect(() => {
    if (currentUser) {
      // Subscribe to user's own issues
      const unsubscribe = subscribeToUserIssues(currentUser.uid, (issues) => {
        setUserReports(issues)
      })
      return () => unsubscribe()
    } else {
      setUserReports([])
    }
  }, [currentUser])

  // Handle tab changes
  useEffect(() => {
    if (activeTab === 'report' && !reportingMode) {
      handleStartReporting()
    } else if (reportingMode && activeTab !== 'report') {
      handleModalClose()
    }
  }, [activeTab, reportingMode])

  const handleRouteCreated = (route) => {
    setLatestRoute(route)
    // Reset selectedPlace so we can search for the same place again if needed
    setSelectedPlace(null)
  }

  const handleStartReporting = () => {
    setReportingMode(true)
    setReportRoutePoints([])
    // Don't open modal yet - wait for points to be selected
    setIsModalOpen(false)
  }

  const handleIssueSubmit = async (issueData) => {
    console.log('New issue reported:', issueData)

    try {
      await saveIssue(
        issueData,
        currentUser.uid,
        currentUser.email,
        currentUser.displayName || 'Anonymous'
      )
      setIsModalOpen(false)
      setReportingMode(false)
      setReportRoutePoints([])
      setRefreshReports(prev => prev + 1)
      setActiveTab('home')
      alert(t('reportSuccess', language))
    } catch (error) {
      console.error('Error submitting report:', error)
      alert('Failed to submit report. Please try again.')
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setReportingMode(false)
    setReportRoutePoints([])
    setActiveTab('home')
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

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      await logout()
      setActiveTab('home')
    }
  }

  // Show splash screen on first load
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  // Show login page if user is not authenticated
  if (!currentUser) {
    return <LoginPage />
  }

  return (
    <div className="app-container">
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="header-logo-container">
          <img
            src="/icons/icon-96x96.png"
            alt="Dryvupp Logo"
            className="header-logo"
          />
          <h1 className="mobile-header-title">{t('appTitle', language)}</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isAdmin() && (
            <button
              className="language-btn"
              onClick={() => setActiveTab('admin')}
              title="Admin Panel"
            >
              <Shield size={24} />
            </button>
          )}
          {/* <button
            className="language-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={24} />
          </button> */}
          <button
            className="language-btn"
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          >
            <Globe size={24} />
          </button>
        </div>
      </header>

      {/* Language Menu Dropdown */}
      {showLanguageMenu && (
        <div className="language-menu">
          <button
            className={`language-menu-item ${language === 'English' ? 'active' : ''}`}
            onClick={() => {
              setLanguage('English')
              setShowLanguageMenu(false)
            }}
          >
            English
          </button>
          <button
            className={`language-menu-item ${language === 'Kinyarwanda' ? 'active' : ''}`}
            onClick={() => {
              setLanguage('Kinyarwanda')
              setShowLanguageMenu(false)
            }}
          >
            Kinyarwanda
          </button>
          <button
            className={`language-menu-item ${language === 'French' ? 'active' : ''}`}
            onClick={() => {
              setLanguage('French')
              setShowLanguageMenu(false)
            }}
          >
            Français
          </button>
        </div>
      )}

      {/* Main Content - Tab Based */}
      <div className="main-content">

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <>
            {/* Search and Map Section */}
            <div className="content-section" style={{ paddingTop: 12 }}>
              <h2 className="section-title">{t('updatesNear', language)}</h2>
              <div className="search-container">
                <SearchBar
                  onSelect={(place) => setSelectedPlace(place)}
                  language={language}
                />
                <div className="favorites-inline">
                  <button onClick={() => {
                    if (!latestRoute) return alert(t('createRouteFirst', language));
                    const favs = saveFavorite(latestRoute);
                    setFavorites(favs);
                    alert(t('savedFavorite', language));
                  }}>{t('saveFavorite', language)}</button>
                  {favorites.map(f => (
                    <div key={f.id} className="fav-inline-item">
                      <button onClick={() => {
                        setSelectedPlace({ lat: f.end.lat, lng: f.end.lng });
                      }}>{f.name || t('favorite', language)}</button>
                      <button onClick={() => {
                        const newF = deleteFavorite(f.id);
                        setFavorites(newF);
                      }}>{t('deleteFavorite', language)}</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="legend-toggle">
                <button
                  className="legend-toggle-btn"
                  onClick={() => setShowLegend(!showLegend)}
                >
                  <BarChart3 size={20} />
                  <span>{showLegend ? t('hideLegend', language) : t('showLegend', language)}</span>
                </button>
              </div>

              {showLegend && <MapLegend language={language} />}

              <Map
                onIssueSelect={handleIssueClick}
                reportingMode={reportingMode}
                onReportRouteSelect={handleReportRouteSelect}
                reportCategory={reportCategory}
                refreshReports={refreshReports}
                focusIssue={focusedIssue}
                selectedPlace={selectedPlace}
                onRouteCreated={handleRouteCreated}
              />

              {!reportingMode ? (
                <div className="map-hint">
                  <Lightbulb size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  {t('mapHint', language)}
                </div>
              ) : (
                <div className="map-hint-warning">
                  <Target size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  <strong>{t('reportingHint', language)}</strong>
                </div>
              )}
            </div>

            {/* Latest Alerts Section */}
            <div className="alerts-section">
              <h2 className="section-title">{t('latestAlerts', language)}</h2>
              <div className="alerts-list">
                {latestIssues.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#6b7280',
                    fontSize: '14px'
                  }}>
                    No recent issues reported
                  </div>
                ) : (
                  latestIssues.map(issue => {
                    const category = issueCategories.find(cat => cat.id === issue.type) || issueCategories[0]
                    return (
                      <div
                        key={issue.id}
                        className={`alert-card alert-${issue.type}`}
                        onClick={() => handleIssueClick(issue)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="alert-icon">{getReportTypeIcon(issue.type, 32)}</div>
                        <div className="alert-content">
                          <div className="alert-title">{issue.title || category.name}</div>
                          {issue.description && (
                            <div className="alert-subtitle">
                              {issue.description.length > 50
                                ? issue.description.substring(0, 50) + '...'
                                : issue.description}
                            </div>
                          )}
                          <div className="alert-time">{getTimeAgo(issue.createdAt)}</div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* REPORT TAB */}
        {activeTab === 'report' && (
          <div className="tab-content">
            <div className="report-instructions">
              <div className="instruction-card">
                <Target size={48} className="instruction-icon" />
                <h3>{t('reportIssue', language)}</h3>
                <p>{t('reportingHint', language)}</p>
              </div>
            </div>
            <div style={{ paddingInline: 16, paddingBottom: 16 }}>
              <Map
                onIssueSelect={handleIssueClick}
                reportingMode={true}
                onReportRouteSelect={handleReportRouteSelect}
                reportCategory={reportCategory}
                refreshReports={refreshReports}
                focusIssue={focusedIssue}
                selectedPlace={selectedPlace}
                onRouteCreated={handleRouteCreated}
              />
            </ div>

            {/* User Reported Issues */}
            {userReports.length > 0 && (
              <div className="alerts-section">
                <h2 className="section-title">{t('yourReports', language)} ({userReports.length})</h2>
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
          </div>
        )}

        {/* ISSUES TAB */}
        {activeTab === 'issues' && (
          <div className="tab-content">
            <div className="alerts-section">
              <h2 className="section-title">{t('allIssues', language)}</h2>
              <IssuesList onIssueClick={handleIssueClick} />
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="tab-content">
            <div className="profile-section">
              <div className="profile-card">
                <div className="profile-avatar">
                  <MapPin size={48} />
                </div>
                <h3>{currentUser.displayName || 'User'}</h3>
                <p className="profile-subtitle">{currentUser.email}</p>
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
              </div>

              <div className="stats-grid">
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
                  onClick={() => setActiveTab('admin')}
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
                onClick={handleLogout}
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
        )}

        {/* ADMIN TAB */}
        {activeTab === 'admin' && isAdmin() && (
          <div className="tab-content">
            <AdminPanel onClose={() => setActiveTab('home')} />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        language={language}
      />

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