import { Home, AlertTriangle, List, User } from 'lucide-react'
import { t } from '../utils/i18n'

export default function BottomNav({ activeTab, onTabChange, language }) {
    const tabs = [
        { id: 'home', icon: Home, label: t('navHome', language) },
        { id: 'report', icon: AlertTriangle, label: t('navReport', language) },
        { id: 'issues', icon: List, label: t('navIssues', language) },
        { id: 'profile', icon: User, label: t('navProfile', language) }
    ]

    return (
        <nav style={{ zIndex: 40 }} className="bottom-nav">
            {tabs.map(tab => {
                const Icon = tab.icon
                return (
                    <button
                        key={tab.id}
                        className={`bottom-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        <Icon size={24} className="bottom-nav-icon" />
                        <span className="bottom-nav-label">{tab.label}</span>
                    </button>
                )
            })}
        </nav>
    )
}
