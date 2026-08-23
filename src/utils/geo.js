// src/utils/geo.js
const EARTH_RADIUS = 6371000;

export const toRad = (deg) => (deg * Math.PI) / 180;
export const toDeg = (rad) => (rad * 180) / Math.PI;

export function getDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(EARTH_RADIUS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function getBearing(lat1, lon1, lat2, lon2) {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLambda = toRad(lon2 - lon1);

  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Шаг по умолчанию изменен на 50 метров
export function sliceRouteIntoSegments(coords, stepMeters = 50) {
  if (!coords || coords.length < 2) return [];

  const segments = [];
  let currentSegment = [coords[0]];
  let accumulatedDist = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const segmentDist = getDistance(p1[0], p1[1], p2[0], p2[1]);

    if (accumulatedDist + segmentDist >= stepMeters) {
      currentSegment.push(p2);
      segments.push({
        points: [...currentSegment],
        targetPoint: p2,
      });
      currentSegment = [p2];
      accumulatedDist = 0;
    } else {
      currentSegment.push(p2);
      accumulatedDist += segmentDist;
    }
  }

  if (currentSegment.length > 1 || segments.length === 0) {
    segments.push({
      points: currentSegment,
      targetPoint: currentSegment[currentSegment.length - 1],
    });
  }

  return segments;
  }
