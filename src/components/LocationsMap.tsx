import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMapsLibrary, useMap } from '@vis.gl/react-google-maps';

export function LocationMarkers({ locations }: { locations: any[] }) {
  const geocodingLib = useMapsLibrary('geocoding');
  const [markers, setMarkers] = useState<{ id: string, name: string, position: google.maps.LatLngLiteral }[]>([]);

  useEffect(() => {
    if (!geocodingLib || !locations || locations.length === 0) return;
    const geocoder = new geocodingLib.Geocoder();
    
    // Minimal cache to avoid re-geocoding same addresses within the session
    const cache: Record<string, google.maps.LatLngLiteral> = {};

    const fetchCoords = async () => {
      const results = await Promise.all(
        locations.map(async (loc) => {
          if (!loc.address) return null;
          if (cache[loc.address]) {
            return { id: loc.id, name: loc.name, position: cache[loc.address] };
          }
          try {
            const response = await geocoder.geocode({ address: loc.address });
            if (response.results[0]) {
              const pos = {
                lat: response.results[0].geometry.location.lat(),
                lng: response.results[0].geometry.location.lng()
              };
              cache[loc.address] = pos;
              return {
                id: loc.id,
                name: loc.name,
                position: pos
              };
            }
          } catch (e) {
            console.error("Geocoding failed for", loc.address, e);
          }
           return null;
        })
      );
      setMarkers(results.filter(Boolean) as any);
    };
    fetchCoords();
  }, [geocodingLib, locations]);

  const map = useMap();
  useEffect(() => {
    if (map && markers.length > 0) {
      if (markers.length === 1) {
        map.setCenter(markers[0].position);
        map.setZoom(15);
      } else {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(m => bounds.extend(m.position));
        map.fitBounds(bounds);
      }
    }
  }, [map, markers]);

  return (
    <>
      {markers.map(m => (
        <AdvancedMarker key={m.id} position={m.position} title={m.name}>
          <Pin background="#6366f1" glyphColor="#fff" borderColor="#4f46e5" />
        </AdvancedMarker>
      ))}
    </>
  );
}

export function LocationsMapView({ locations }: { locations: any[] }) {
  const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
  const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

  if (!hasValidKey) {
    return (
      <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-8 text-center border border-slate-200 dark:border-white/10 flex flex-col justify-center items-center min-h-[300px]">
         <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
         </div>
         <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Clé API Google Maps Requise</h3>
         <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 max-w-sm">Pour afficher la carte des établissements, vous devez configurer la clé API Google Maps Platform.</p>
         <div className="text-xs text-left max-w-sm mx-auto text-slate-400 space-y-2">
           <p>1. <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">Obtenir une clé API</a></p>
           <p>2. Ajouter le secret <code>GOOGLE_MAPS_PLATFORM_KEY</code> dans les <strong className="text-slate-300">Settings</strong> (⚙️ en haut à droite) → <strong className="text-slate-300">Secrets</strong></p>
         </div>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 relative z-0">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={{lat: 48.8566, lng: 2.3522}}
          defaultZoom={11}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{width: '100%', height: '100%'}}
          gestureHandling="greedy"
        >
          <LocationMarkers locations={locations} />
        </Map>
      </APIProvider>
    </div>
  );
}
