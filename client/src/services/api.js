// src/services/api.js
const BASE = process.env.REACT_APP_API_URL || "http://localhost:3456/api";

export async function fetchData(query) {
  const url = new URL(`${BASE}/data`);
  Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();  // { data: [...], stats: {...} }
}
