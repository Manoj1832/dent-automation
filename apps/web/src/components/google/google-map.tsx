'use client';

import { useEffect, useRef, useState } from 'react';

interface GoogleMapProps {
  latitude?: number;
  longitude?: number;
  height?: string;
  zoom?: number;
  markerTitle?: string;
  className?: string;
}

export function GoogleMap({
  latitude = 13.0827,
  longitude = 80.2707,
  height = '300px',
  zoom = 15,
  markerTitle = 'Location',
  className,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).google?.maps) {
      setIsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const handleLoad = () => setIsLoaded(true);
    script.addEventListener('load', handleLoad);

    return () => {
      script.removeEventListener('load', handleLoad);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || typeof window === 'undefined') return;

    const google = (window as any).google;
    if (!google?.maps) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: latitude, lng: longitude },
      zoom,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    new google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map: mapInstance,
      title: markerTitle,
      animation: google.maps.Animation.DROP,
    });
  }, [isLoaded, latitude, longitude, zoom, markerTitle]);

  if (!isLoaded) {
    return (
      <div
        className={`bg-slate-100 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <span className="text-muted-foreground">Loading map...</span>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    />
  );
}

export default GoogleMap;