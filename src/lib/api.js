// Small wrapper around Open-Meteo geocoding + current weather
export async function searchCity(name) {
	const q = encodeURIComponent(name);
	const url = `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=1&language=en&format=json`;
	const res = await fetch(url);
	if (!res.ok) return null;
	const data = await res.json();
	if (!data || !data.results || data.results.length === 0) return null;
	const r = data.results[0];
	return { name: r.name + (r.country ? `, ${r.country}` : ""), latitude: r.latitude, longitude: r.longitude };
}

export async function getCurrentWeather(lat, lon) {
	const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
	const res = await fetch(url);
	if (!res.ok) return null;
	const data = await res.json();
	if (!data || !data.current_weather) return null;
	return {
		temperature: data.current_weather.temperature,
		windspeed: data.current_weather.windspeed,
		weathercode: data.current_weather.weathercode,
		time: data.current_weather.time,
	};
}

// Fetch nearby air quality measurements from OpenAQ (no API key)
export async function fetchAQNearby(lat, lon, radiusMeters = 20000, limit = 50) {
	// Use a dev proxy path when running on localhost to avoid CORS issues.
	const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
	const base = isLocal ? '/openaq' : 'https://api.openaq.org';
	const url = `${base}/v3/measurements?coordinates=${lat},${lon}&radius=${radiusMeters}&limit=${limit}&order_by=distance&sort=asc`;
	let res;
	try {
		// include API key header when provided via Vite env `VITE_OPENAQ_KEY`
		const headers = {};
		try {
			// Access Vite environment variable if available (works during Vite build/runtime).
			const envKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_OPENAQ_KEY : undefined;
			if (envKey) headers['X-API-Key'] = envKey;
		} catch (e) {
			// import.meta may not be present in some runtimes; ignore and continue without API key
		}
		res = await fetch(url, { headers });
	} catch (err) {
		console.warn('fetchAQNearby network error', err, url);
		return null;
	}
	if (!res.ok) return null;
	const data = await res.json();
	if (!data || !data.results) return null;
	// Aggregate by location: take latest PM2.5 if available, otherwise other params
	const byLocation = new Map();
	for (const m of data.results) {
		const key = `${m.location}-${m.coordinates?.latitude}-${m.coordinates?.longitude}`;
		if (!byLocation.has(key)) byLocation.set(key, { location: m.location, coords: m.coordinates, measurements: {} });
		const entry = byLocation.get(key);
		entry.measurements[m.parameter] = { value: m.value, unit: m.unit, measuredAt: m.date?.utc };
	}
	return Array.from(byLocation.values()).map((l) => ({
		location: l.location,
		latitude: l.coords?.latitude,
		longitude: l.coords?.longitude,
		measurements: l.measurements,
	}));
}

