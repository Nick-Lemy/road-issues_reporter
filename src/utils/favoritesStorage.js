const FAVORITES_KEY = 'favorite_routes_v1';

export const getFavorites = () => {
    try {
        const raw = localStorage.getItem(FAVORITES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Failed to load favorites', e);
        return [];
    }
};

export const saveFavorite = (route) => {
    const favs = getFavorites();
    // limit to 2
    if (favs.length >= 2) {
        // replace the oldest
        favs.shift();
    }
    favs.push({ ...route, id: Date.now() });
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return favs;
};

export const deleteFavorite = (id) => {
    const favs = getFavorites().filter(f => f.id !== id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    return favs;
};
