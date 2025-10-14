import { mockIssues } from '../data/mockIssues'
import { issueCategories } from '../data/issueCategories'

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

    return (
        <div className="issues-list">
            {mockIssues.map(issue => {
                const category = getCategory(issue.type)
                return (
                    <div
                        key={issue.id}
                        className={`alert-card alert-${issue.type}`}
                        onClick={() => onIssueClick && onIssueClick(issue)}
                        style={{ cursor: onIssueClick ? 'pointer' : 'default' }}
                    >
                        <div className="alert-icon">{category.icon}</div>
                        <div className="alert-content">
                            <div className="alert-title">{issue.title}</div>
                            <div className="alert-subtitle">{issue.location.address}</div>
                            <div className="alert-time">
                                {getTimeAgo(issue.timestamp)} • {issue.status === 'verified' ? '✓ Verified' : 'Pending'}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
