import React, { useState } from "react";
import { searchCity, getCurrentWeather, fetchAQNearby } from "./lib/api";
import GlassCard from "./components/GlassCard";
import AQMap from "./components/AQMap";

export default function App() {
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [weather, setWeather] = useState(null);
	const [aqData, setAqData] = useState(null);

	async function handleSearch(e) {
		e?.preventDefault();
		if (!query) return;
		setLoading(true);
		setError(null);
		setWeather(null);
		try {
			const place = await searchCity(query);
			if (!place) throw new Error("Location not found");
			const w = await getCurrentWeather(place.latitude, place.longitude);
			if (!w) throw new Error("Weather not available");
			setWeather({ place: place.name, latitude: place.latitude, longitude: place.longitude, ...w });
		} catch (err) {
			setError(err.message || String(err));
		} finally {
			setLoading(false);
		}
	}

	// fetch AQ when weather/place is set
	React.useEffect(() => {
		if (!weather) return;
		let mounted = true;
		(async () => {
			const list = await fetchAQNearby(weather.latitude, weather.longitude, 20000, 60);
			console.debug("fetchAQNearby ->", list);
			if (!mounted) return;
			if (list && list.length > 0) {
				setAqData(list);
			} else {
				// fallback: generate mock nearby AQ points so the map shows data during development
				const mock = [];
				const N = 6;
				for (let i = 0; i < N; i++) {
					const angle = (i / N) * Math.PI * 2;
					const dist = 0.02 + Math.random() * 0.04;
					mock.push({
						location: `Mock Station ${i + 1}`,
						latitude: weather.latitude + Math.cos(angle) * dist,
						longitude: weather.longitude + Math.sin(angle) * dist,
						measurements: { pm25: { value: Math.round(5 + Math.random() * 90), unit: 'µg/m³' } },
					});
				}
				setAqData(mock);
			}
		})();
		return () => { mounted = false };
	}, [weather]);

	return (
		<div className="app-root">
			<header className="app-header">
					<h1>Check Weather</h1>
				<form onSubmit={handleSearch} className="search-form">
					<input
						aria-label="city"
						placeholder="Enter city (e.g. London)"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
					<button type="submit" disabled={loading}>
						{loading ? "Loading…" : "Search"}
					</button>
				</form>
			</header>

			<main className="app-main">
				{error && <div className="error">{error}</div>}
				{weather ? (
					<div style={{width: '100%'}}>
						<GlassCard weather={weather} />
						<div style={{height:16}} />
						<AQMap center={[weather.latitude, weather.longitude]} aqData={aqData} />
					</div>
				) : (
					<div className="placeholder">Search a city to see current weather.</div>
				)}
			</main>
		</div>
	);
}