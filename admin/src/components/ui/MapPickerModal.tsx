'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Navigation } from 'lucide-react';

interface MapPickerModalProps {
  isOpen: boolean;
  initialLat?: number;
  initialLng?: number;
  onConfirm: (lat: number, lng: number, address: string) => void;
  onClose: () => void;
}

const DEFAULT_LAT = 26.2235;
const DEFAULT_LNG = 50.586;
const DEFAULT_ZOOM = 12;

export default function MapPickerModal(props: MapPickerModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted || !props.isOpen) return null;
  return createPortal(<MapPickerInner {...props} />, document.body);
}

function MapPickerInner({
  initialLat,
  initialLng,
  onConfirm,
  onClose,
}: MapPickerModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  const startLat = initialLat && initialLat !== 0 ? initialLat : DEFAULT_LAT;
  const startLng = initialLng && initialLng !== 0 ? initialLng : DEFAULT_LNG;

  const [pin, setPin] = useState({ lat: startLat, lng: startLng });
  const [address, setAddress] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  const reverseGeocode = async (lat: number, lng: number) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const parts = [
        data.address?.road,
        data.address?.suburb,
        data.address?.city || data.address?.town || data.address?.village,
        data.address?.country,
      ].filter(Boolean);
      setAddress(parts.join(', '));
    } catch {
      setAddress('');
    } finally {
      setGeocoding(false);
    }
  };

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || leafletMapRef.current) return;

      const L = (await import('leaflet')).default;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, { zoomControl: true }).setView([startLat, startLng], DEFAULT_ZOOM);
      leafletMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([startLat, startLng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      // Force Leaflet to recalculate container size after DOM is stable
      setTimeout(() => map.invalidateSize(), 100);

      const onMove = (lat: number, lng: number) => {
        setPin({ lat, lng });
        reverseGeocode(lat, lng);
      };

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onMove(pos.lat, pos.lng);
      });

      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng([e.latlng.lat, e.latlng.lng]);
        onMove(e.latlng.lat, e.latlng.lng);
      });

      if (initialLat && initialLat !== 0) {
        reverseGeocode(startLat, startLng);
      }
    };

    // Wait for the portal to be painted before initialising Leaflet
    const timer = setTimeout(initMap, 150);

    return () => {
      clearTimeout(timer);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ zIndex: 1 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-primary" />
            <h2 className="text-white font-semibold text-base">Pin Venue Location</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-surface2 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-text-muted text-xs px-5 pt-3 pb-1">
          Click anywhere on the map or drag the pin to set the venue location.
        </p>

        {/* Map container — overflow:hidden clips tile bleed */}
        <div
          ref={mapRef}
          style={{ height: 400, minHeight: 400, overflow: 'hidden', position: 'relative' }}
        />

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border space-y-3">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Navigation size={12} className="text-primary flex-shrink-0" />
            <span>{pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}</span>
            {geocoding && (
              <span className="text-primary animate-pulse ml-1">Resolving address…</span>
            )}
            {!geocoding && address && (
              <span className="text-text-secondary truncate ml-1">— {address}</span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-surface2 hover:text-white transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(pin.lat, pin.lng, address)}
              className="flex-1 py-2.5 rounded-xl bg-primary text-bg font-semibold text-sm hover:bg-primary/90 transition-all"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
