import { issueCategories } from '../data/issueCategories'

export default function MapLegend() {
    return (
        <div className="map-legend">
            <h3 className="legend-title">📊 Issue Types & Line Patterns</h3>
            <div className="legend-items-grid">
                {issueCategories.map(category => (
                    <div key={category.id} className="legend-item-card">
                        <div className="legend-item-header">
                            <span className="legend-icon">{category.icon}</span>
                            <span className="legend-label">{category.name}</span>
                        </div>
                        <svg width="100%" height="8" style={{ marginTop: '6px' }}>
                            <line
                                x1="0"
                                y1="4"
                                x2="100%"
                                y2="4"
                                stroke={category.color}
                                strokeWidth={category.lineStyle.weight / 2}
                                strokeOpacity={category.lineStyle.opacity}
                                strokeDasharray={category.lineStyle.dashArray || 'none'}
                                strokeLinecap={category.lineStyle.lineCap}
                            />
                        </svg>
                    </div>
                ))}
            </div>
            <div className="legend-route-info">
                <div className="legend-item">
                    <div className="route-line"></div>
                    <span className="legend-label">Navigation Route (Get Directions)</span>
                </div>
            </div>
        </div>
    )
}