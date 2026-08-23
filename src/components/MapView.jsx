import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

const userIcon = L.divIcon({
  className: 'relative',
  html: `<div class="w-4 h-4 bg-cyan-400 rounded-full border-2 border-white shadow-[0_0_16px_#22d3ee] animate-pulse"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

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
        <MapRecenter center={center} />

        {/* Тёмная тема карты CartoDB Dark */}
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

        {/* Отрисовка только открытых 100м участков */}
        {visibleSegments.map((segment, idx) => {
          const isCurrent = idx === visibleSegments.length - 1;
          return (
            <Polyline
              key={idx}
              positions={segment.points}
              pathOptions={{
                color: isCurrent ? '#10b981' : '#047857',
                weight: isCurrent ? 6 : 4,
                dashArray: isCurrent ? '6, 8' : undefined,
                opacity: isCurrent ? 1 : 0.45,
              }}
            />
          );
        })}

        {/* Текущее положение Насти */}
        {userLocation && <Marker position={userLocation} icon={userIcon} />}

        {/* Точка текущего рубежа (+100м) */}
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
