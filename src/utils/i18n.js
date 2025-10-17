// Translation system for Dryvupp
export const translations = {
    en: {
        // Header
        appTitle: "Dryvupp",

        // Navigation
        navHome: "Home",
        navReport: "Report",
        navIssues: "Issues",
        navProfile: "Profile",

        // Actions
        showLegend: "Show Legend",
        hideLegend: "Hide Legend",
        reportIssue: "Report Road Issue",
        cancelReporting: "Cancel Reporting",
        getDirections: "Get Directions",
        navigate: "Navigate",

        // Search
        searchPlaceholder: "Search for a place...",
        searchNoResults: "No results found",
        searching: "Searching...",

        // Map hints
        mapHint: "Click \"Get Directions\" to find routes, or \"Report Road Issue\" to mark problematic road sections!",
        reportingHint: "Reporting Mode Active: Click two points on the map to select the road section with the issue. Click \"Cancel Reporting\" to stop.",

        // Favorites
        saveFavorite: "Save current route",
        favorite: "Favorite",
        deleteFavorite: "Delete",
        createRouteFirst: "Create a route first",
        savedFavorite: "Saved favorite",

        // Issue types
        issueTypes: {
            pothole: "Pothole",
            roadworks: "Roadworks",
            accident: "Accident",
            closure: "Road Closure",
            flooding: "Flooding",
            debris: "Debris on Road",
            traffic: "Heavy Traffic / Jam",
            other: "Other"
        },

        // Sections
        latestAlerts: "Latest Verified Alerts",
        yourReports: "Your Reported Issues",
        allIssues: "All Reported Issues",
        updatesNear: "Updates near Kigali",
        legend: "Issue Types & Line Patterns",
        navigationRoute: "Navigation Route (Get Directions)",

        // Report modal
        reportTitle: "Report Road Issue",
        selectCategory: "Select Category",
        issueDescription: "Issue Description",
        descriptionPlaceholder: "Describe the issue (optional)",
        submitReport: "Submit Report",
        cancel: "Cancel",
        reportSuccess: "✓ Thank you! Your report has been submitted successfully.",

        // Status
        pending: "Pending",
        verified: "Verified",
        resolved: "Resolved",

        // Time
        minAgo: "min ago",
        hrAgo: "hr ago",

        // Loading
        loading: "Loading..."
    },

    rw: { // Kinyarwanda
        // Header
        appTitle: "Dryvupp",

        // Navigation
        navHome: "Ahabanza",
        navReport: "Tanga Raporo",
        navIssues: "Ibibazo",
        navProfile: "Umwirondoro",

        // Actions
        showLegend: "Erekana Ibisobanuro",
        hideLegend: "Hisha Ibisobanuro",
        reportIssue: "Tanga Ikibazo cy'Umuhanda",
        cancelReporting: "Hagarika Gutanga Raporo",
        getDirections: "Shakisha Inzira",
        navigate: "Genda",

        // Search
        searchPlaceholder: "Shakisha ahantu...",
        searchNoResults: "Nta bisubizo byabonetse",
        searching: "Urashakisha...",

        // Map hints
        mapHint: "Kanda \"Shakisha Inzira\" kugira ngo ubone inzira, cyangwa \"Tanga Ikibazo cy'Umuhanda\" kugira ngo urebe inzira zifite ibibazo!",
        reportingHint: "Uburyo bwo Gutanga Raporo: Kanda ahantu habiri ku ikarita kugira ngo uhitemo igice cy'umuhanda gifite ikibazo. Kanda \"Hagarika Gutanga Raporo\" kugira ngo uhagarike.",

        // Favorites
        saveFavorite: "Bika inzira",
        favorite: "Iyakunzwe",
        deleteFavorite: "Siba",
        createRouteFirst: "Kora inzira mbere",
        savedFavorite: "Inzira yabitswe",

        // Issue types
        issueTypes: {
            pothole: "Umwobo mu muhanda",
            roadworks: "Imirimo y'umuhanda",
            accident: "Impanuka",
            closure: "Umuhanda ufunze",
            flooding: "Imyuzure",
            debris: "Imyanda ku muhanda",
            traffic: "Urujya n'uruza rukabije",
            other: "Ikindi"
        },

        // Sections
        latestAlerts: "Amakuru Agezweho Yemejwe",
        yourReports: "Raporo Wakoze",
        allIssues: "Ibibazo Byose Byatanzwe",
        updatesNear: "Amakuru hafi ya Kigali",
        legend: "Ubwoko bw'Ibibazo & Imiterere",
        navigationRoute: "Inzira yo Kugenda (Shakisha Inzira)",

        // Report modal
        reportTitle: "Tanga Ikibazo cy'Umuhanda",
        selectCategory: "Hitamo Icyiciro",
        issueDescription: "Ibisobanuro by'Ikibazo",
        descriptionPlaceholder: "Sobanura ikibazo (bitari ngombwa)",
        submitReport: "Ohereza Raporo",
        cancel: "Hagarika",
        reportSuccess: "✓ Murakoze! Raporo yanyu yoherejwe neza.",

        // Status
        pending: "Bitegereje",
        verified: "Byemejwe",
        resolved: "Byakemuwe",

        // Time
        minAgo: "iminota",
        hrAgo: "isaha",

        // Loading
        loading: "Birimo Gupakira..."
    },

    fr: { // French
        // Header
        appTitle: "Dryvupp",

        // Navigation
        navHome: "Accueil",
        navReport: "Signaler",
        navIssues: "Problèmes",
        navProfile: "Profil",

        // Actions
        showLegend: "Afficher la Légende",
        hideLegend: "Masquer la Légende",
        reportIssue: "Signaler un Problème",
        cancelReporting: "Annuler le Signalement",
        getDirections: "Obtenir l'Itinéraire",
        navigate: "Naviguer",

        // Search
        searchPlaceholder: "Rechercher un lieu...",
        searchNoResults: "Aucun résultat trouvé",
        searching: "Recherche en cours...",

        // Map hints
        mapHint: "Cliquez sur \"Obtenir l'Itinéraire\" pour trouver des routes, ou \"Signaler un Problème\" pour marquer des sections de route problématiques!",
        reportingHint: "Mode Signalement Actif : Cliquez sur deux points sur la carte pour sélectionner la section de route avec le problème. Cliquez sur \"Annuler le Signalement\" pour arrêter.",

        // Favorites
        saveFavorite: "Enregistrer l'itinéraire",
        favorite: "Favori",
        deleteFavorite: "Supprimer",
        createRouteFirst: "Créez d'abord un itinéraire",
        savedFavorite: "Favori enregistré",

        // Issue types
        issueTypes: {
            pothole: "Nid-de-poule",
            roadworks: "Travaux Routiers",
            accident: "Accident",
            closure: "Fermeture de Route",
            flooding: "Inondation",
            debris: "Débris sur la Route",
            traffic: "Trafic Dense / Embouteillage",
            other: "Autre"
        },

        // Sections
        latestAlerts: "Dernières Alertes Vérifiées",
        yourReports: "Vos Signalements",
        allIssues: "Tous les Problèmes Signalés",
        updatesNear: "Mises à jour près de Kigali",
        legend: "Types de Problèmes & Motifs de Lignes",
        navigationRoute: "Itinéraire de Navigation (Obtenir l'Itinéraire)",

        // Report modal
        reportTitle: "Signaler un Problème de Route",
        selectCategory: "Sélectionner la Catégorie",
        issueDescription: "Description du Problème",
        descriptionPlaceholder: "Décrivez le problème (facultatif)",
        submitReport: "Soumettre le Signalement",
        cancel: "Annuler",
        reportSuccess: "✓ Merci ! Votre signalement a été soumis avec succès.",

        // Status
        pending: "En Attente",
        verified: "Vérifié",
        resolved: "Résolu",

        // Time
        minAgo: "min",
        hrAgo: "h",

        // Loading
        loading: "Chargement..."
    }
}

// Get translation by key
export const t = (key, lang = 'en') => {
    const langCode = lang === 'English' ? 'en' : lang === 'Kinyarwanda' ? 'rw' : 'fr'
    const keys = key.split('.')
    let value = translations[langCode]

    for (const k of keys) {
        if (value && typeof value === 'object') {
            value = value[k]
        } else {
            break
        }
    }

    return value || key
}

// Get language code from language name
export const getLangCode = (lang) => {
    if (lang === 'English') return 'en'
    if (lang === 'Kinyarwanda') return 'rw'
    if (lang === 'French') return 'fr'
    return 'en'
}
