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

// Fetch forecast (hourly + daily) from Open-Meteo
export async function fetchForecast(lat, lon, days = 7) {
	const params = [
		'hourly=temperature_2m,relativehumidity_2m,precipitation',
		'daily=temperature_2m_max,temperature_2m_min,precipitation_sum',
		'current_weather=true',
		'timezone=auto'
	].join('&')
	const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&${params}`
	try{
		const res = await fetch(url)
		if(!res.ok) return null
		const data = await res.json()
		return data
	}catch(e){
		console.warn('fetchForecast error', e)
		return null
	}
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

	// If the dev-proxy responded with 404, sometimes the proxy rewrite isn't matching.
	// Retry directly against OpenAQ base URL and log diagnostics to help debug proxy issues.
	if (res && res.status === 404 && base === '/openaq') {
		try {
			const directUrl = `https://api.openaq.org/v3/measurements?coordinates=${lat},${lon}&radius=${radiusMeters}&limit=${limit}&order_by=distance&sort=asc`;
			console.warn('fetchAQNearby: proxy returned 404, retrying direct OpenAQ request:', directUrl);
			const directRes = await fetch(directUrl, { headers: { ...(typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_OPENAQ_KEY ? { 'X-API-Key': import.meta.env.VITE_OPENAQ_KEY } : {}) : {}) } });
			if (directRes && directRes.ok) res = directRes;
			else console.warn('fetchAQNearby: direct request failed', directRes && directRes.status);
		} catch (e) {
			console.warn('fetchAQNearby direct retry error', e);
		}
	}

	if (!res || !res.ok) {
		console.warn('fetchAQNearby: non-ok response', res && res.status, url);
		return null;
	}
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

// Fetch recent measurements (time-series) for a given station location or coordinates
export async function fetchAQHistory({ location, latitude, longitude }, limit = 48) {
	const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
	const base = isLocal ? '/openaq' : 'https://api.openaq.org';
	let url;
	if (location) {
		const q = encodeURIComponent(location);
		url = `${base}/v3/measurements?location=${q}&parameter=pm25&limit=${limit}&sort=desc`;
	} else if (latitude != null && longitude != null) {
		url = `${base}/v3/measurements?coordinates=${latitude},${longitude}&radius=5000&parameter=pm25&limit=${limit}&order_by=date&sort=desc`;
	} else {
		return null;
	}
	try {
		const headers = {};
		try {
			const envKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_OPENAQ_KEY : undefined;
			if (envKey) headers['X-API-Key'] = envKey;
		} catch (e) {}
		let res = await fetch(url, { headers });

		// Retry directly if proxy returns 404 when using local dev proxy
		if (res && res.status === 404 && base === '/openaq') {
			try {
				const directUrl = url.replace(/^\/openaq/, 'https://api.openaq.org');
				console.warn('fetchAQHistory: proxy returned 404, retrying direct OpenAQ request:', directUrl);
				const directRes = await fetch(directUrl, { headers });
				if (directRes && directRes.ok) res = directRes;
				else console.warn('fetchAQHistory: direct request failed', directRes && directRes.status);
			} catch (e) {
				console.warn('fetchAQHistory direct retry error', e);
			}
		}

		if (!res || !res.ok) {
			console.warn('fetchAQHistory: non-ok response', res && res.status, url);
			return null;
		}

		const data = await res.json();
		if (!data || !data.results) return null;
		// map to time/value pairs
		const out = data.results.map(r => ({ time: r.date?.utc || r.date?.local, value: r.value }));
		// ensure descending by time (most recent first)
		out.sort((a,b)=> new Date(b.time) - new Date(a.time));
		return out;
	} catch (err) {
		console.warn('fetchAQHistory error', err, url);
		return null;
	}
}

