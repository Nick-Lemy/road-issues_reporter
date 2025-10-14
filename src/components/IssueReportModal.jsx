import { useState, useEffect } from 'react'
import { issueCategories } from '../data/issueCategories'

export default function IssueReportModal({ isOpen, onClose, onSubmit, routePoints, onCategoryChange, selectedCategory }) {
    const [formData, setFormData] = useState({
        type: 'traffic',
        title: '',
        description: ''
    })

    useEffect(() => {
        if (selectedCategory) {
            setFormData(prev => ({ ...prev, type: selectedCategory }))
        }
    }, [selectedCategory])

    const handleCategoryChange = (newType) => {
        setFormData(prev => ({ ...prev, type: newType }))
        if (onCategoryChange) {
            onCategoryChange(newType)
        }
    }

    if (!isOpen) return null

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!routePoints || routePoints.length !== 2) {
            alert('Please select two points on the map to define the road section')
            return
        }

        const reportData = {
            ...formData,
            routePoints: routePoints,
            startLocation: {
                lat: routePoints[0].lat,
                lng: routePoints[0].lng
            },
            endLocation: {
                lat: routePoints[1].lat,
                lng: routePoints[1].lng
            }
        }

        onSubmit(reportData)

        setFormData({
            type: 'traffic',
            title: '',
            description: ''
        })
    }

    const category = issueCategories.find(cat => cat.id === formData.type)

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Report Road Issue</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    {routePoints && routePoints.length === 2 ? (
                        <div className="route-preview">
                            <div className="route-preview-header">
                                <span className="route-icon">🛣️</span>
                                <span>Road section selected</span>
                            </div>
                            <div className="route-preview-line" style={{
                                background: category?.color || '#6b7280',
                                height: '6px',
                                borderRadius: '3px',
                                margin: '8px 0'
                            }}></div>
                        </div>
                    ) : (
                        <div className="route-instruction">
                            ℹ️ Please select two points on the map to define the problematic road section
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Issue Type *</label>
                        <div className="category-grid">
                            {issueCategories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    className={`category-card ${formData.type === cat.id ? 'selected' : ''}`}
                                    onClick={() => handleCategoryChange(cat.id)}
                                    style={{
                                        borderColor: formData.type === cat.id ? cat.color : '#e5e7eb'
                                    }}
                                >
                                    <span className="category-icon">{cat.icon}</span>
                                    <span className="category-name">{cat.name}</span>
                                    {formData.type === cat.id && (
                                        <div
                                            className="category-line-preview"
                                            style={{
                                                background: cat.color,
                                                opacity: cat.lineStyle.opacity,
                                                height: '4px',
                                                marginTop: '4px',
                                                borderRadius: '2px'
                                            }}
                                        ></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Title *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Brief description of the issue"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Provide more details about the issue..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={!routePoints || routePoints.length !== 2}
                        >
                            Submit Report
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
