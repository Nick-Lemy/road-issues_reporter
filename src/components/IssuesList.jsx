import { useState, useEffect } from 'react'
import { Car, AlertOctagon, Pickaxe, Construction, Ban, Droplet, Blocks, MapPin } from 'lucide-react'
import { issueCategories } from '../data/issueCategories'
import { subscribeToActiveIssues } from '../services/issueService'

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
    const [issues, setIssues] = useState([])

    useEffect(() => {
        const unsubscribe = subscribeToActiveIssues((issuesData) => {
            setIssues(issuesData)
        })

        return () => unsubscribe()
    }, [])

    const getTimeAgo = (timestamp) => {
        const now = Date.now()
        const issueTime = timestamp instanceof Date ? timestamp.getTime() : new Date(timestamp).getTime()
        const minutes = Math.floor((now - issueTime) / (1000 * 60))
        if (minutes < 60) return `${minutes} min ago`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`
        const days = Math.floor(hours / 24)
        return `${days} day${days > 1 ? 's' : ''} ago`
    }

    const getCategory = (type) => {
        return issueCategories.find(cat => cat.id === type) || issueCategories[issueCategories.length - 1]
    }

    return (
        <div className="issues-list">
            {issues.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    No active issues reported
                </div>
            ) : (
                issues.map(issue => {
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
                                <div className="alert-title">{issue.title || 'Road Issue'}</div>
                                {issue.description && <div className="alert-subtitle">{issue.description}</div>}
                                <div className="alert-time">
                                    {getTimeAgo(issue.createdAt)}
                                    {issue.status && ` • ${issue.status}`}
                                </div>
                            </div>
                        </div>
                    )
                })
            )}
        </div>
    )
}
