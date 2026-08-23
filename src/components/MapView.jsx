import React from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';

// Иконка текущего положения
const userIcon = L.divIcon({
  className: 'relative',
  html: `<div class="w-4 h-4 bg-cyan-400 rounded-full border-2 border-white shadow-[0_0_15px_#22d3ee] animate-pulse"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function MapView({ userLocation, visibleSegments, currentSegmentTarget }) {
  const center = userLocation || [54.167844, 37.574754];

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative">
      <MapContainer
        center={center}
        zoom={17}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
      >
        {/* Темная тема карты (CartoDB Dark Matter) */}
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

        {/* Отрисовка только открытых 100м отрезков */}
        {visibleSegments.map((segment, idx) => {
          const isCurrent = idx === visibleSegments.length - 1;
          return (
            <Polyline
              key={idx}
              positions={segment.points}
              pathOptions={{
                color: isCurrent ? '#10b981' : '#059669',
                weight: isCurrent ? 6 : 4,
                dashArray: isCurrent ? '8, 8' : undefined,
                opacity: isCurrent ? 0.9 : 0.4,
              }}
            />
          );
        })}

        {/* Маркер пользователя */}
        {userLocation && <Marker position={userLocation} icon={userIcon} />}

        {/* Промежуточный чекпоинт (конец текущего 100м отрезка) */}
        {currentSegmentTarget && (
          <Circle
            center={currentSegmentTarget}
            radius={15}
            pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.2 }}
          />
        )}
      </MapContainer>
    </div>
  );
        }
