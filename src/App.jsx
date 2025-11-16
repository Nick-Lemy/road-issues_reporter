import { useState, useEffect } from 'react'
import { BarChart3, AlertTriangle, X, Lightbulb, Target, Construction, Ban, AlertOctagon, Car, Pickaxe, Droplet, Blocks, MapPin, LogIn, LogOut, Shield, BellIcon, Moon, Sun } from 'lucide-react'
import Map from './components/Map'
import SearchBar from './components/SearchBar'
import SplashScreen from './components/SplashScreen'
import BottomNav from './components/BottomNav'
import BottomSheet from './components/BottomSheet'
import Leaderboard from './components/Leaderboard'
import Profile from './components/Profile'
import { getFavorites, saveFavorite, deleteFavorite } from './utils/favoritesStorage'
import IssueReportModal from './components/IssueReportModal'
import IssuesList from './components/IssuesList'
import MapLegend from './components/MapLegend'
import AdminPanel from './components/AdminPanel'
import LoginPage from './components/LoginPage'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { saveIssue, subscribeToUserIssues, subscribeToActiveIssues } from './services/issueService'
import { startAutoCleanup, stopAutoCleanup } from './services/cleanupService'
import { requestNotificationPermission, monitorFavoriteRoutes, showNotification } from './services/notificationService'
import { awardPointsForIssue, getUserPoints } from './services/pointsService'
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
  const [allActiveIssues, setAllActiveIssues] = useState([])
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [userPoints, setUserPoints] = useState({ points: 0, issuesReported: 0 })
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved === 'true'
  })

  // Apply dark mode class to body and persist to localStorage
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  // Check for service worker updates and handle cache refresh
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('Cache updated to version:', event.data.version)
          setShowUpdatePrompt(true)
        }
      })

      // Check for updates every 5 minutes
      const checkForUpdates = () => {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            registration.update()
          }
        })
      }

      // Check immediately
      checkForUpdates()

      // Then check every 5 minutes
      const interval = setInterval(checkForUpdates, 5 * 60 * 1000)

      return () => clearInterval(interval)
    }
  }, [])

  const handleRefreshApp = () => {
    setShowUpdatePrompt(false)
    window.location.reload()
  }

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission().then(permission => {
      setNotificationsEnabled(permission === 'granted')
      if (permission === 'granted') {
        showNotification('Dryvupp Notifications Enabled', {
          body: 'You\'ll receive alerts about traffic on your saved routes',
          tag: 'welcome'
        })
      }
    })
  }, [])

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

      // Store all issues for route monitoring
      setAllActiveIssues(issues)
    })
    return () => unsubscribe()
  }, [])

  // Monitor favorite routes for traffic issues
  useEffect(() => {
    if (notificationsEnabled && favorites.length > 0 && allActiveIssues.length > 0) {
      // Check every 5 minutes
      const interval = setInterval(() => {
        monitorFavoriteRoutes(favorites, allActiveIssues)
      }, 5 * 60 * 1000)

      // Check immediately
      monitorFavoriteRoutes(favorites, allActiveIssues)

      return () => clearInterval(interval)
    }
  }, [favorites, allActiveIssues, notificationsEnabled])

  // Load user reports when user changes
  useEffect(() => {
    if (currentUser) {
      // Subscribe to user's own issues
      const unsubscribe = subscribeToUserIssues(currentUser.uid, (issues) => {
        setUserReports(issues)
      })

      // Load user points
      getUserPoints(currentUser.uid).then(points => {
        setUserPoints(points)
      })

      return () => unsubscribe()
    } else {
      setUserReports([])
      setUserPoints({ points: 0, issuesReported: 0 })
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

      // Award points to user for reporting
      await awardPointsForIssue(currentUser.uid)
      
      // Reload user point
      const updatedPoints = await getUserPoints(currentUser.uid)
      setUserPoints(updatedPoints)

      setIsModalOpen(false)
      setReportingMode(false)
      setReportRoutePoints([])
      setRefreshReports(prev => prev + 1)
      setActiveTab('home')
      alert(t('reportSuccess', language) + '\n+5 points earned!')
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
      {/* Full Screen Map - Visible only on home and report tabs */}
      {(activeTab === 'home' || activeTab === 'report') && (
        <Map
          key={activeTab} // Force remount when switching between home and report
          onIssueSelect={handleIssueClick}
          reportingMode={reportingMode || activeTab === 'report'}
          onReportRouteSelect={handleReportRouteSelect}
          reportCategory={reportCategory}
          refreshReports={refreshReports}
          focusIssue={focusedIssue}
          selectedPlace={selectedPlace}
          onRouteCreated={handleRouteCreated}
        />
      )}

      {/* Floating Search Bar - Only on home tab */}
      {activeTab === 'home' && (
        <div className="floating-search-bar">
          <SearchBar
            onSelect={(place) => setSelectedPlace(place)}
            language={language}
          />
        </div>
      )}

      {/* Draggable Bottom Sheet - Only for tabs with map */}
      {(activeTab === 'home' || activeTab === 'report') && (
        <BottomSheet minHeight={120} maxHeight={window.innerHeight - 140}>

          {/* HOME TAB */}
          {activeTab === 'home' && (
            <>
              {/* Search and Map Section */}
              <div className="content-section" style={{ paddingTop: 12 }}>
                <h2 className="section-title">{t('updatesNear', language)}</h2>
                <div className="search-container">
                  <div className="favorites-inline">
                    <button
                      onClick={() => {
                        if (!latestRoute) return alert(t('createRouteFirst', language));
                        if (favorites.length >= 2) {
                          alert('You can save up to 2 routes in the free version. Delete one first.');
                          return;
                        }
                        const favs = saveFavorite(latestRoute);
                        setFavorites(favs);
                        alert(t('savedFavorite', language));
                      }}
                      disabled={favorites.length >= 2}
                    >
                      {t('saveFavorite', language)} ({favorites.length}/2)
                    </button>

                    {!notificationsEnabled && favorites.length > 0 && (
                      <button
                        onClick={async () => {
                          const permission = await requestNotificationPermission();
                          if (permission === 'granted') {
                            setNotificationsEnabled(true);
                            alert('Notifications enabled! You\'ll receive alerts about traffic on your saved routes.');
                          } else {
                            alert('Notifications permission denied. Enable it in your browser settings.');
                          }
                        }}
                        style={{
                          background: '#f59e0b',
                          color: 'white'
                        }}
                      >
                        🔔 Enable Traffic Alerts
                      </button>
                    )}

                    {favorites.map(f => (
                      <div key={f.id} className="fav-inline-item">
                        <button onClick={() => {
                          setSelectedPlace({ lat: f.end.lat, lng: f.end.lng });
                        }}>
                          📍 {f.name || 'Saved Route'}
                          {f.penaltyMinutes > 0 && ` (+${Math.round(f.penaltyMinutes)}min traffic)`}
                        </button>
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

              {/* All Issues */}
              <div className="alerts-section">
                <h2 className="section-title">{t('allIssues', language)}</h2>
                <IssuesList onIssueClick={handleIssueClick} />
              </div>
            </div>
          )}
        </BottomSheet>
      )}

      {/* Full Screen Content - For tabs without map (leaderboard, profile, admin) */}
      {(activeTab === 'leaderboard' || activeTab === 'profile' || activeTab === 'admin') && (
        <div className="full-screen-content">
          {/* LEADERBOARD TAB */}
          {activeTab === 'leaderboard' && (
            <div className="tab-content">
              <Leaderboard />
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <Profile
              userReports={userReports}
              favorites={favorites}
              onAdminClick={() => setActiveTab('admin')}
              onLogout={handleLogout}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              language={language}
              setLanguage={setLanguage}
              notificationsEnabled={notificationsEnabled}
              setNotificationsEnabled={setNotificationsEnabled}
              t={t}
            />
          )}

          {/* ADMIN TAB */}
          {activeTab === 'admin' && isAdmin() && (
            <div className="tab-content">
              <AdminPanel onClose={() => setActiveTab('home')} />
            </div>
          )}
        </div>
      )}

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

      {/* Update Prompt */}
      {showUpdatePrompt && (
        <div className="update-prompt-overlay">
          <div className="update-prompt">
            <h3>🚀 New Update Available!</h3>
            <p>A new version of Dryvupp is available. Refresh to get the latest features and improvements.</p>
            <div className="update-prompt-actions">
              <button onClick={handleRefreshApp} className="btn-primary">
                Refresh Now
              </button>
              <button onClick={() => setShowUpdatePrompt(false)} className="btn-secondary">
                Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App