export const mockIssues = [

]

export const getRecentIssues = () => {
    return mockIssues
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
}

export const getIssuesByType = (type) => {
    return mockIssues.filter(issue => issue.type === type)
}

export const getVerifiedIssues = () => {
    return mockIssues.filter(issue => issue.status === 'verified')
}
