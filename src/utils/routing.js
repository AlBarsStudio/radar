import { sliceRouteIntoSegments } from './geo';

export const START_COORDS = [54.167844, 37.574754];
export const TARGET_COORDS = [54.170268, 37.567547];

// Запасной трек через контрольные точки на случай отсутствия связи
const FALLBACK_POINTS = [
  START_COORDS,
  [54.168350, 37.572800],
  [54.168950, 37.570900],
  [54.169600, 37.568900],
  TARGET_COORDS,
];

export async function fetchWalkingRoute() {
  const url = `https://router.project-osrm.org/route/v1/foot/${START_COORDS[1]},${START_COORDS[0]};${TARGET_COORDS[1]},${TARGET_COORDS[0]}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const data = await res.json();
    if (data.routes && data.routes[0]) {
      const fullPath = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
      return {
        fullPath,
        segments: sliceRouteIntoSegments(fullPath, 100),
      };
    }
  } catch (e) {
    console.warn('Пешеходный OSRM недоступен, применен резервный оффлайн-маршрут', e);
  }

  return {
    fullPath: FALLBACK_POINTS,
    segments: sliceRouteIntoSegments(FALLBACK_POINTS, 100),
  };
}
  
