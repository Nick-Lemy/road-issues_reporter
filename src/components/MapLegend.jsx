import { issueCategories } from '../data/issueCategories'
import { Pickaxe, Construction, AlertOctagon, Ban, Droplet, Blocks, Car, MapPin } from 'lucide-react'
import { t } from '../utils/i18n'

const getIconComponent = (iconName) => {
    const icons = {
        Pickaxe: <Pickaxe size={20} />,
        Construction: <Construction size={20} />,
        AlertOctagon: <AlertOctagon size={20} />,
        Ban: <Ban size={20} />,
        Droplet: <Droplet size={20} />,
        Blocks: <Blocks size={20} />,
        Car: <Car size={20} />,
        MapPin: <MapPin size={20} />
    }
    return icons[iconName] || <MapPin size={20} />
}

export default function MapLegend({ language = 'English' }) {
    return (
        <div className="map-legend">
            <h3 className="legend-title">📊 {t('legend', language)}</h3>
            <div className="legend-items-grid">
                {issueCategories.map(category => (
                    <div key={category.id} className="legend-item-card">
                        <div className="legend-item-header">
                            <span className="legend-icon" style={{ color: category.color }}>
                                {getIconComponent(category.icon)}
                            </span>
                            <span className="legend-label">
                                {t(`issueTypes.${category.id}`, language)}
                            </span>
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
                    <span className="legend-label">{t('navigationRoute', language)}</span>
                </div>
            </div>
        </div>
    )
}