import React, { useState, useEffect, useCallback } from 'react';
import { fetchWalkingRoute, START_COORDS, TARGET_COORDS } from './utils/routing';
import { getDistance, getBearing } from './utils/geo';
import { sounds } from './utils/audio';
import RadarScreen from './components/RadarScreen';
import MapView from './components/MapView';
import SuccessModal from './components/SuccessModal';
import { Compass, Map, Volume2, Play, Navigation2, Footprints } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [routeSegments, setRouteSegments] = useState([]);
  const [currentSegmentIdx, setCurrentSegmentIdx] = useState(0);
  const [userLocation, setUserLocation] = useState(START_COORDS);
  const [heading, setHeading] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [distanceToNext, setDistanceToNext] = useState(100);
  const [totalDistance, setTotalDistance] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [viewMode, setViewMode] = useState('radar'); // 'radar' | 'map'
  const [debugMode, setDebugMode] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);

  // Загрузка трека маршрута
  useEffect(() => {
    fetchWalkingRoute().then(({ segments }) => {
      setRouteSegments(segments);
    });
  }, []);

  const enableSensors = useCallback(() => {
    sounds.init();
    setAudioStarted(true);

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then((state) => {
          if (state !== 'granted') console.warn('Compass permission rejected');
        })
        .catch(console.error);
    }
  }, []);

  // Отслеживание GPS
  useEffect(() => {
    if (debugMode || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
      },
      (err) => console.warn(err),
      { enableHighAccuracy: true, maximumAge: 1000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [debugMode]);

  // Компас смартфона
  useEffect(() => {
    const handleOrientation = (e) => {
      let compass = 0;
      if (e.webkitCompassHeading) {
        compass = e.webkitCompassHeading;
      } else if (e.alpha !== null) {
        compass = 360 - e.alpha;
      }
      setHeading(compass);
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  // Логика прохождения рубежей по 100 метров
  useEffect(() => {
    if (!routeSegments.length || isFinished) return;

    const currentTarget = routeSegments[currentSegmentIdx]?.targetPoint || TARGET_COORDS;
    const distToSegmentTarget = getDistance(userLocation[0], userLocation[1], currentTarget[0], currentTarget[1]);
    const distToFinal = getDistance(userLocation[0], userLocation[1], TARGET_COORDS[0], TARGET_COORDS[1]);

    setDistanceToNext(distToSegmentTarget);
    setTotalDistance(distToFinal);

    // Звуковой пинг при приближении
    sounds.playRadarPing(distToSegmentTarget);

    // Достижение финальной точки
    if (distToFinal <= 15) {
      setIsFinished(true);
      confetti({ particleCount: 180, spread: 80, origin: { y: 0.6 } });
      return;
    }

    // Достижение промежуточного 100м чекпоинта -> открытие следующего отрезка
    if (distToSegmentTarget <= 15 && currentSegmentIdx < routeSegments.length - 1) {
      setCurrentSegmentIdx((prev) => prev + 1);
      sounds.playSegmentUnlock();
    }
  }, [userLocation, routeSegments, currentSegmentIdx, isFinished]);

  const currentSegmentTarget = routeSegments[currentSegmentIdx]?.targetPoint || TARGET_COORDS;
  const bearingToNext = getBearing(userLocation[0], userLocation[1], currentSegmentTarget[0], currentSegmentTarget[1]);
  const arrowAngle = (bearingToNext - heading + 360) % 360;

  // Симулятор шага для проверки на компьютере
  const simulateStep = () => {
    if (!routeSegments[currentSegmentIdx]) return;
    const nextPt = routeSegments[currentSegmentIdx].targetPoint;
    setUserLocation(nextPt);
  };

  const totalSteps = routeSegments.length || 1;
  const progressPercent = Math.min(100, Math.round(((currentSegmentIdx + 1) / totalSteps) * 100));

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-zinc-950 text-zinc-100 p-4 justify-between font-mono select-none">
      {/* Шапка */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <h1 className="text-xs font-bold tracking-widest text-emerald-400">СЕКТОР: НАСТЯ_РАДАР</h1>
            <p className="text-[10px] text-zinc-500">
              GPS: {gpsAccuracy ? `±${gpsAccuracy}м` : 'Калибровка...'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!audioStarted && (
            <button
              onClick={enableSensors}
              className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl active:scale-95"
              title="Включить звук"
            >
              <Volume2 size={16} />
            </button>
          )}

          <button
            onClick={() => {
              if (!audioStarted) enableSensors();
              setViewMode(viewMode === 'radar' ? 'map' : 'radar');
            }}
            className="p-2 bg-zinc-900 border border-zinc-700 text-emerald-400 rounded-xl active:scale-95 flex items-center gap-1 text-xs"
          >
            {viewMode === 'radar' ? <Map size={16} /> : <Compass size={16} />}
          </button>
        </div>
      </div>

      {/* Экран (Радар или Карта) */}
      <div className="my-auto flex items-center justify-center relative w-full aspect-square max-h-[360px]">
        {viewMode === 'radar' ? (
          <RadarScreen
            arrowAngle={arrowAngle}
            distanceToNext={distanceToNext}
            totalDistance={totalDistance}
            accuracy={gpsAccuracy}
          />
        ) : (
          <MapView
            userLocation={userLocation}
            visibleSegments={routeSegments.slice(0, currentSegmentIdx + 1)}
            currentSegmentTarget={currentSegmentTarget}
          />
        )}
      </div>

      {/* Нижняя панель телеметрии */}
      <div className="space-y-3 bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl backdrop-blur-sm">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="text-[10px] text-zinc-500 block flex items-center gap-1">
              <Footprints size={12} className="text-emerald-400" /> ДО СЛЕДУЮЩЕГО РУБЕЖА
            </span>
            <span className="text-3xl font-black text-emerald-400">{distanceToNext} м</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-zinc-500 block">ДО ФИНИША</span>
            <span className="text-sm font-bold text-zinc-300">{totalDistance} м</span>
          </div>
        </div>

        {/* Индикатор прогресса открытия карты */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>Открыто секторов: {currentSegmentIdx + 1} / {totalSteps}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500 shadow-[0_0_10px_#10b981]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Панель симулятора для тестирования дома */}
        <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-500">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-0"
            />
            Отладка с ПК
          </label>

          {debugMode && (
            <button
              onClick={simulateStep}
              className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/40 flex items-center gap-1 active:scale-95 font-bold"
            >
              <Play size={10} /> +100м шаг
            </button>
          )}
        </div>
      </div>

      {/* Модалка завершения */}
      {isFinished && <SuccessModal onReset={() => setIsFinished(false)} />}
    </div>
  );
}
