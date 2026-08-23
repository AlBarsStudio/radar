const R = 6371000; // Радиус Земли в метрах

export const toRad = (deg) => (deg * Math.PI) / 180;
export const toDeg = (rad) => (rad * 180) / Math.PI;

export function getDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function getBearing(lat1, lon1, lat2, lon2) {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLambda = toRad(lon2 - lon1);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Нарезает массив точек маршрута на отрезки длиной stepMeters (по 100 метров)
export function sliceRouteIntoSegments(coordinates, stepMeters = 100) {
  if (!coordinates || coordinates.length < 2) return [];

  const segments = [];
  let currentSegment = [coordinates[0]];
  let accumulatedDist = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];
    const d = getDistance(p1[0], p1[1], p2[0], p2[1]);

    if (accumulatedDist + d >= stepMeters) {
      // Точка перехода рубежа 100м
      currentSegment.push(p2);
      segments.push({
        points: [...currentSegment],
        targetPoint: p2, // Целевая точка данного 100м участка
      });
      currentSegment = [p2];
      accumulatedDist = 0;
    } else {
      currentSegment.push(p2);
      accumulatedDist += d;
    }
  }

  if (currentSegment.length > 1) {
    segments.push({
      points: currentSegment,
      targetPoint: currentSegment[currentSegment.length - 1],
    });
  }

  return segments;
                          }
