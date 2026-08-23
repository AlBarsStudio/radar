import { sliceRouteIntoSegments } from './geo';

export const START_COORDS = [54.167844, 37.574754];
export const TARGET_COORDS = [54.170268, 37.567547];

// Резервный прямой путь, если мобильный интернет пропадет в момент старта
const FALLBACK_POINTS = [
  START_COORDS,
  [54.168500, 37.572000],
  [54.169200, 37.569500],
  TARGET_COORDS,
];

export async function fetchWalkingRoute() {
  const url = `https://router.project-osrm.org/route/v1/foot/${START_COORDS[1]},${START_COORDS[0]};${TARGET_COORDS[1]},${TARGET_COORDS[0]}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes[0]) {
      // Преобразуем GeoJSON [lon, lat] в формат Leaflet [lat, lon]
      const fullCoords = data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
      return {
        fullPath: fullCoords,
        segments: sliceRouteIntoSegments(fullCoords, 100),
      };
    }
  } catch (err) {
    console.warn("OSRM offline, using fallback geometry", err);
  }

  return {
    fullPath: FALLBACK_POINTS,
    segments: sliceRouteIntoSegments(FALLBACK_POINTS, 100),
  };
}
