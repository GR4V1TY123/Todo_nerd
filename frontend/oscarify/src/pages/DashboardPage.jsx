import { Link, useNavigate } from 'react-router-dom'
import { useState, useCallback } from 'react'

const BOOK_COLORS = [
  { spine: '#1B4332', cover: '#2D6A4F', accent: '#95D5B2' },
  { spine: '#7F1D1D', cover: '#B91C1C', accent: '#FCA5A5' },
  { spine: '#1E3A5F', cover: '#2563EB', accent: '#93C5FD' },
  { spine: '#92400E', cover: '#D97706', accent: '#FCD34D' },
  { spine: '#4A3570', cover: '#7B5EA7', accent: '#C4BAD8' },
  { spine: '#065F46', cover: '#10B981', accent: '#6EE7B7' },
  { spine: '#831843', cover: '#DB2777', accent: '#F9A8D4' },
  { spine: '#3730A3', cover: '#6366F1', accent: '#A5B4FC' },
]

function DashboardPage() {
  const navigate = useNavigate()
  const [showResources, setShowResources] = useState(true)
  const [selectedBook, setSelectedBook] = useState(null)

  const recentProjects = [
    { id: 1, title: 'testing', meta: '1 document', updated: '2 hours ago', icon: '📝' },
    { id: 2, title: 'My Novel', meta: '3 documents', updated: '1 day ago', icon: '📖' },
  ]

  const allProjects = [
    { id: 1, title: 'testing', meta: '1 document', updated: '2 hours ago', icon: '📝' },
    { id: 2, title: 'My Novel', meta: '3 documents', updated: '1 day ago', icon: '📖' },
    { id: 3, title: 'Short Story Collection', meta: '5 documents', updated: '3 days ago', icon: '📚' },
    { id: 4, title: 'Screenplay Draft', meta: '2 documents', updated: '1 week ago', icon: '🎬' },
  ]

  const totalDocs = allProjects.reduce((sum, p) => {
    const n = parseInt(p.meta)
    return sum + (isNaN(n) ? 0 : n)
  }, 0)

  const handleProjectClick = useCallback((project, color) => {
    setSelectedBook({ ...project, color, target: `/editor/${project.id}` })
  }, [])

  const handleNewProject = useCallback(() => {
    setSelectedBook({ id: 0, title: 'New Project', meta: 'Starting fresh', updated: 'Just now', icon: '✨', color: { spine: '#6B7280', cover: '#9CA3AF', accent: '#D1D5DB' }, target: '/editor' })
  }, [])

  const handleOpenBook = useCallback(() => {
    if (selectedBook) navigate(selectedBook.target)
  }, [navigate, selectedBook])

  const handleClosePopup = useCallback(() => {
    setSelectedBook(null)
  }, [])

  const handleSearchClick = () => {
    alert('Search will be available soon in oscarify.ai.')
  }

  const handleNotificationsClick = () => {
    alert('Notifications will be connected to your oscarify.ai account soon.')
  }

  const handleSettingsClick = () => {
    alert('Settings will be configurable once the backend is connected.')
  }

  const handleResourceClick = (e, label) => {
    e.preventDefault()
    alert(`${label} will open here once it is connected to the backend.`)
  }

  /* Renders one book */
  const renderBook = (project, i, isNew = false) => {
    if (isNew) {
      return (
        <div key="new" className="bs-book bs-book-new" onClick={handleNewProject}>
          <div className="bs-book-spine bs-book-spine-new">
            <span className="bs-book-spine-plus">+</span>
          </div>
        </div>
      )
    }
    const color = BOOK_COLORS[i % BOOK_COLORS.length]
    return (
      <div
        key={project.id}
        className="bs-book"
        onClick={() => handleProjectClick(project, color)}
        style={{ '--book-spine': color.spine, '--book-cover': color.cover, '--book-accent': color.accent }}
      >
        <div className="bs-book-spine">
          <span className="bs-book-spine-title">{project.title}</span>
          <span className="bs-book-spine-meta">{project.meta}</span>
        </div>
        {/* Tooltip card */}
        <div className="bs-book-tooltip">
          <div className="bs-book-tooltip-swatch" style={{ background: `linear-gradient(90deg, ${color.spine}, ${color.cover})` }} />
          <span className="bs-book-tooltip-title">{project.title}</span>
          <span className="bs-book-tooltip-meta">{project.meta} · {project.updated}</span>
          <button
            className="bs-book-menu"
            onClick={(e) => {
              e.stopPropagation()
              alert('Project options will appear here once connected to the backend.')
            }}
          >Open →</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bs-page">
      {/* Header */}
      <header className="bs-header">
        <div className="bs-header-left">
          <Link to="/" className="logo">
            <svg className="logo-icon" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="6" fill="#7B5EA7"/>
              <path d="M8 12h16M8 16h12M8 20h14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div className="logo-text">
              <span className="logo-sudo">oscarify.ai</span>
              <span className="logo-write"></span>
            </div>
          </Link>
        </div>
        <div className="bs-header-right">
          <button className="header-icon-btn" title="Search" onClick={handleSearchClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
          <button className="header-icon-btn" title="Notifications" onClick={handleNotificationsClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
          </button>
          <button className="header-icon-btn" title="Settings" onClick={handleSettingsClick}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <div style={{ 
            width: 32, height: 32, borderRadius: '50%', 
            background: 'linear-gradient(135deg, #7B5EA7, #4A3570)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 14, fontWeight: 500
          }}>U</div>
        </div>
      </header>

      {/* Main Content */}
      <div className="bs-content">
        {/* Welcome + Stats */}
        <div className="bs-welcome">
          <h1 className="bs-welcome-title">Your Library</h1>
          <p className="bs-welcome-sub">Pick a book from the shelf to continue writing</p>
        </div>

        {/* Quick Actions */}
        <div className="bs-quick-actions">
          <button className="bs-quick-btn" onClick={handleNewProject}>
            <span className="bs-quick-icon">+</span>
            New Project
          </button>
          <button className="bs-quick-btn" onClick={handleSearchClick}>
            <span className="bs-quick-icon">⌕</span>
            Search
          </button>
          <button className="bs-quick-btn" onClick={() => alert('Import coming soon.')}>
            <span className="bs-quick-icon">↓</span>
            Import
          </button>
          <button className="bs-quick-btn" onClick={() => alert('Templates coming soon.')}>
            <span className="bs-quick-icon">❖</span>
            Templates
          </button>
        </div>

        {/* Layout: sidebar + shelves */}
        <div className="bs-shelf-area">
          {/* Resources sidebar */}
          {showResources && (
            <div className="bs-resources">
              <button className="bs-resources-close" onClick={() => setShowResources(false)}>×</button>
              <div className="bs-resources-icon">📚</div>
              <h4 className="bs-resources-title">Get Started</h4>
              <div className="bs-resources-links">
                <a href="#" onClick={(e) => handleResourceClick(e, 'Getting Started Guide')}>Guide</a>
                <a href="#" onClick={(e) => handleResourceClick(e, 'Video Tutorials')}>Tutorials</a>
                <a href="#" onClick={(e) => handleResourceClick(e, 'Community Forum')}>Community</a>
                <a href="#" onClick={(e) => handleResourceClick(e, 'Help Center')}>Help</a>
              </div>
            </div>
          )}

          {/* Shelves column */}
          <div className="bs-shelves">
            {/* Recent shelf */}
            <div className="bs-shelf-section">
              <h2 className="bs-shelf-label">Recently Opened</h2>
              <div className="bs-shelf">
                <div className="bs-shelf-backwall" />
                <div className="bs-shelf-books">
                  {recentProjects.map((p, i) => renderBook(p, i))}
                </div>
                <div className="bs-shelf-plank" />
                <div className="bs-shelf-shadow" />
              </div>
            </div>

            {/* All projects shelf */}
            <div className="bs-shelf-section">
              <h2 className="bs-shelf-label">All Projects</h2>
              <div className="bs-shelf">
                <div className="bs-shelf-backwall" />
                <div className="bs-shelf-books">
                  {renderBook(null, 0, true)}
                  {allProjects.map((p, i) => renderBook(p, i))}
                </div>
                <div className="bs-shelf-plank" />
                <div className="bs-shelf-shadow" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Book detail popup */}
      {selectedBook && (
        <div className="bs-popup-overlay" onClick={handleClosePopup}>
          <div className="bs-popup-book-container" onClick={e => e.stopPropagation()}>
            <button className="bs-popup-close" onClick={handleClosePopup}>×</button>
            <div
              className="bs-popup-book"
              style={{
                '--book-spine': selectedBook.color?.spine,
                '--book-cover': selectedBook.color?.cover,
                '--book-accent': selectedBook.color?.accent,
              }}
            >
              <div className="bs-popup-book-pages" />
              <div className="bs-popup-book-cover">
                <span className="bs-popup-book-icon">{selectedBook.icon}</span>
                <span className="bs-popup-book-cover-title">{selectedBook.title}</span>
                <div className="bs-popup-book-cover-divider" />
                <span className="bs-popup-book-cover-meta">{selectedBook.meta}</span>
                <span className="bs-popup-book-cover-updated">Updated {selectedBook.updated}</span>
                <button className="bs-popup-open-btn" onClick={handleOpenBook}>
                  Open <span className="bs-popup-open-arrow">→</span>
                </button>
              </div>
              <div className="bs-popup-book-spine">
                <span>{selectedBook.title}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
