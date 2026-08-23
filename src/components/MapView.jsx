// src/components/MapView.jsx
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

const userIcon = L.divIcon({
  className: 'relative',
  html: `<div class="w-5 h-5 bg-cyan-400 rounded-full border-2 border-white shadow-[0_0_18px_#22d3ee] animate-pulse flex items-center justify-center"><div class="w-1.5 h-1.5 bg-white rounded-full"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapFollowUser({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.panTo(center, { animate: true, duration: 0.8 });
    }
  }, [center, map]);
  return null;
}

export default function MapView({ userLocation, visibleSegments, currentSegmentTarget }) {
  const center = userLocation || [54.167844, 37.574754];

  return (
    <div className="w-full h-full absolute inset-0 z-0">
      <MapContainer
        center={center}
        zoom={17}
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
      >
        <MapFollowUser center={center} />

        {/* Темная тема CartoDB */}
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" />

        {/* Пройденные и текущий 50м отрезок */}
        {visibleSegments.map((segment, idx) => {
          const isCurrent = idx === visibleSegments.length - 1;
          return (
            <Polyline
              key={idx}
              positions={segment.points}
              pathOptions={{
                color: isCurrent ? '#10b981' : '#047857',
                weight: isCurrent ? 7 : 4,
                dashArray: isCurrent ? '8, 8' : undefined,
                opacity: isCurrent ? 1 : 0.4,
              }}
            />
          );
        })}

        {/* Пользователь */}
        {userLocation && <Marker position={userLocation} icon={userIcon} />}

        {/* Чекпоинт текущего 50м рубежа */}
        {currentSegmentTarget && (
          <Circle
            center={currentSegmentTarget}
            radius={15}
            pathOptions={{
              color: '#10b981',
              fillColor: '#10b981',
              fillOpacity: 0.25,
              weight: 2,
              dashArray: '4, 4',
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
