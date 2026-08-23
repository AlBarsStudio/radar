// src/utils/tileCache.js
const CACHE_NAME = 'quest-map-cache-v1';

// Конвертация широты/долготы в координаты тайлов Slippy Map
function lon2tile(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat, zoom) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom)
  );
}

export async function prefetchAreaTiles(centerLat, centerLon, onProgress) {
  if (!('caches' in window)) return;

  const cache = await caches.open(CACHE_NAME);
  const zoomLevels = [15, 16, 17]; // Оптимальные уровни детализации улиц
  const deltaLat = 0.027; // ~3 км по широте
  const deltaLon = 0.045; // ~3 км по долготе для Тулы

  const tileUrls = [];

  zoomLevels.forEach((z) => {
    const minX = lon2tile(centerLon - deltaLon, z);
    const maxX = lon2tile(centerLon + deltaLon, z);
    const minY = lat2tile(centerLat + deltaLat, z);
    const maxY = lat2tile(centerLat - deltaLat, z);

    for (let x = Math.min(minX, maxX); x <= Math.max(minX, maxX); x++) {
      for (let y = Math.min(minY, maxY); y <= Math.max(minY, maxY); y++) {
        // Темная тема CartoDB
        const sub = ['a', 'b', 'c', 'd'][(x + y) % 4];
        tileUrls.push(`https://${sub}.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`);
      }
    }
  });

  let loaded = 0;
  const total = tileUrls.length;

  // Параллельная загрузка пачками по 8 запросов
  const batchSize = 8;
  for (let i = 0; i < tileUrls.length; i += batchSize) {
    const batch = tileUrls.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (url) => {
        try {
          const match = await cache.match(url);
          if (!match) {
            const resp = await fetch(url, { mode: 'cors' });
            if (resp.ok) await cache.put(url, resp);
          }
        } catch (e) {
          // Игнорируем сетевые ошибки отдельных тайлов
        } finally {
          loaded++;
          if (onProgress) onProgress(Math.round((loaded / total) * 100));
        }
      })
    );
  }
        }
