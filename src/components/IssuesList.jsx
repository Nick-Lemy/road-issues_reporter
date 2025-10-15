import { Car, AlertOctagon, Pickaxe, Construction, Ban, Droplet, Blocks, MapPin } from 'lucide-react'
import { mockIssues } from '../data/mockIssues'
import { issueCategories } from '../data/issueCategories'
import { getReports } from '../utils/reportStorage'

const getIconComponent = (iconName, size = 32) => {
    const icons = {
        Car: <Car size={size} />,
        AlertOctagon: <AlertOctagon size={size} />,
        Pickaxe: <Pickaxe size={size} />,
        Construction: <Construction size={size} />,
        Ban: <Ban size={size} />,
        Droplet: <Droplet size={size} />,
        Blocks: <Blocks size={size} />,
        MapPin: <MapPin size={size} />
    }
    return icons[iconName] || <MapPin size={size} />
}

export default function IssuesList({ onIssueClick }) {
    const getTimeAgo = (timestamp) => {
        const minutes = Math.floor((Date.now() - timestamp) / (1000 * 60))
        if (minutes < 60) return `${minutes} min ago`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`
        const days = Math.floor(hours / 24)
        return `${days} day${days > 1 ? 's' : ''} ago`
    }

    const getCategory = (type) => {
        return issueCategories.find(cat => cat.id === type) || issueCategories[issueCategories.length - 1]
    }

    // Combine mock issues and user reports
    const userReports = getReports()
    const allIssues = [...mockIssues, ...userReports]

    return (
        <div className="issues-list">
            {allIssues.map(issue => {
                const category = getCategory(issue.type)
                return (
                    <div
                        key={issue.id}
                        className={`alert-card alert-${issue.type}`}
                        onClick={() => onIssueClick && onIssueClick(issue)}
                        style={{ cursor: onIssueClick ? 'pointer' : 'default' }}
                    >
                        <div className="alert-icon">{getIconComponent(category.icon)}</div>
                        <div className="alert-content">
                            <div className="alert-title">{issue.title}</div>
                            <div className="alert-subtitle">
                                {issue.location?.address || issue.description || 'Road section issue'}
                            </div>
                            <div className="alert-time">
                                {getTimeAgo(issue.timestamp)} • {issue.status === 'verified' ? '✓ Verified' : issue.status || 'Pending'}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
