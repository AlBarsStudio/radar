// src/utils/tileCache.js
const CACHE_NAME = 'quest-map-cache-v1';

function lon2tile(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat, zoom) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom)
  );
}

let isDownloading = false;

export async function prefetchAreaTiles(centerLat, centerLon, onProgress) {
  if (isDownloading) return;
  isDownloading = true;

  try {
    if (!('caches' in window)) {
      if (onProgress) onProgress({ percent: 100, isDone: true, speedText: '' });
      return;
    }

    const cache = await caches.open(CACHE_NAME);
    const zoomLevels = [15, 16, 17];
    const deltaLat = 0.027; // ~3 км по широте
    const deltaLon = 0.045; // ~3 км по долготе для Тулы

    const uniqueUrls = new Set();
    const subdomains = ['a', 'b', 'c', 'd'];

    zoomLevels.forEach((z) => {
      const minX = lon2tile(centerLon - deltaLon, z);
      const maxX = lon2tile(centerLon + deltaLon, z);
      const minY = lat2tile(centerLat + deltaLat, z);
      const maxY = lat2tile(centerLat - deltaLat, z);

      const startX = Math.min(minX, maxX);
      const endX = Math.max(minX, maxX);
      const startY = Math.min(minY, maxY);
      const endY = Math.max(minY, maxY);

      for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
          const s = subdomains[Math.abs(x + y) % subdomains.length];
          uniqueUrls.add(`https://${s}.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png`);
        }
      }
    });

    const allUrls = Array.from(uniqueUrls);
    const total = allUrls.length;
    let loaded = 0;
    let downloadedBytes = 0;
    const startTime = performance.now();

    // Проверяем, сколько уже сохранено в кэше
    const urlsToFetch = [];
    for (const url of allUrls) {
      const match = await cache.match(url);
      if (match) {
        loaded++;
      } else {
        urlsToFetch.push(url);
      }
    }

    if (urlsToFetch.length === 0) {
      if (onProgress) onProgress({ percent: 100, isDone: true, speedText: 'Оффлайн' });
      isDownloading = false;
      return;
    }

    // Загрузка пачками по 6 параллельных запросов
    const batchSize = 6;
    for (let i = 0; i < urlsToFetch.length; i += batchSize) {
      const batch = urlsToFetch.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (url) => {
          try {
            const resp = await fetch(url, { mode: 'cors' });
            if (resp && resp.ok) {
              const clone = resp.clone();
              const blob = await resp.blob();
              downloadedBytes += blob.size;
              await cache.put(url, clone);
            }
          } catch (e) {
            // Игнорируем единичные сбои сети
          } finally {
            loaded++;
            const elapsedSec = (performance.now() - startTime) / 1000;
            let speedText = 'Загрузка...';

            if (elapsedSec > 0.3) {
              const kbps = (downloadedBytes / 1024) / elapsedSec;
              speedText = kbps >= 1024
                ? `${(kbps / 1024).toFixed(1)} МБ/с`
                : `${Math.round(kbps)} КБ/с`;
            }

            const percent = Math.min(100, Math.round((loaded / total) * 100));
            if (onProgress) {
              onProgress({
                percent,
                loaded,
                total,
                speedText,
                isDone: percent >= 100,
              });
            }
          }
        })
      );
    }
  } catch (err) {
    console.warn('Ошибка при сохранении кэша карты:', err);
  } finally {
    isDownloading = false;
  }
}
