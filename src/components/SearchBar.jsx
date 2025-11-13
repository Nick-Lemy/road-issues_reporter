import { useEffect, useRef, useState } from 'react'
import { t } from '../utils/i18n'

// Nominatim search with debounce and keyboard navigation
export default function SearchBar({ onSelect, language = 'English' }) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const abortRef = useRef(null)

    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([])
            setLoading(false)
            return
        }

        const id = setTimeout(async () => {
            setLoading(true)
            try {
                if (abortRef.current) abortRef.current.abort()
                abortRef.current = new AbortController()
                // Restrict search to Kigali area: viewbox=left,top,right,bottom (lon,lat,lon,lat)
                // Kigali bounds: approximately 29.95,2.05,30.25,-1.85 (wider area around Kigali)
                const viewbox = '29.95,-1.85,30.25,-2.05'
                const bounded = 1 // Restrict results to viewbox
                const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=6&viewbox=${viewbox}&bounded=${bounded}`;
                const res = await fetch(url, { signal: abortRef.current.signal, headers: { 'Accept-Language': 'en' } })
                const data = await res.json()
                setResults(data)
                setActiveIndex(-1)
            } catch (e) {
                if (e.name !== 'AbortError') console.error('Search error', e)
            } finally {
                setLoading(false)
            }
        }, 250) // debounce 250ms

        return () => {
            clearTimeout(id)
            abortRef.current?.abort()
        }
    }, [query])

    const selectResult = (r) => {
        setResults([])
        setQuery(r.display_name)
        if (onSelect) onSelect({ name: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon), bbox: r.boundingbox })
    }

    const onKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            setActiveIndex(i => Math.min(i + 1, results.length - 1))
            e.preventDefault()
        } else if (e.key === 'ArrowUp') {
            setActiveIndex(i => Math.max(i - 1, 0))
            e.preventDefault()
        } else if (e.key === 'Enter') {
            if (activeIndex >= 0 && results[activeIndex]) {
                selectResult(results[activeIndex])
                e.preventDefault()
            }
        } else if (e.key === 'Escape') {
            setResults([])
        }
    }

    return (
        <div className="search-bar" style={{ zIndex: 20 }}>
            <div className="search-input-wrap">
                <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    type="search"
                    placeholder={t('searchPlaceholder', language)}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search places"
                    onKeyDown={onKeyDown}
                    autoComplete="off"
                />
                {query && <button onClick={() => setQuery('')}>✕</button>}
            </div>

            <div className="search-results">
                {loading && <div className="loading">{t('searching', language)}</div>}
                {!loading && results.length === 0 && query.length >= 2 && (
                    <div className="no-results">{t('searchNoResults', language)}</div>
                )}
                {results.map((r, idx) => (
                    <div
                        key={r.place_id}
                        className={`search-result ${idx === activeIndex ? 'active' : ''}`}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => selectResult(r)}
                    >
                        <svg className="result-pin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        <div className="result-content">
                            <div className="result-title">{r.display_name}</div>
                            <div className="result-sub">{r.type} • {r.class}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
