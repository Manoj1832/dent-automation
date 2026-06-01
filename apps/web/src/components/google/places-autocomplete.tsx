'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (address: string, placeDetails?: any) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function GooglePlacesAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a location...',
  className,
  disabled,
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ((window as any).google?.maps?.places) {
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

    // NEVER remove the script from the DOM, as it breaks the Google Maps API internally.
    return () => {
      script.removeEventListener('load', handleLoad);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || typeof window === 'undefined') return;

    const google = (window as any).google;
    if (!google?.maps?.places) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      fields: ['address_components', 'geometry', 'formatted_address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place) {
        const address = place.formatted_address || '';
        
        let city: string | undefined;
        let state: string | undefined;
        let country: string | undefined;
        let zipCode: string | undefined;

        place.address_components?.forEach((component: any) => {
          const types = component.types;
          if (types.includes('locality')) city = component.long_name;
          else if (types.includes('administrative_area_level_1')) state = component.long_name;
          else if (types.includes('country')) country = component.long_name;
          else if (types.includes('postal_code')) zipCode = component.long_name;
        });

        const placeDetails = {
          address,
          city,
          state,
          country,
          zipCode,
          latitude: place.geometry?.location?.lat(),
          longitude: place.geometry?.location?.lng(),
        };

        onChange(address, placeDetails);
      }
    });
  }, [isLoaded, onChange]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isLoaded ? placeholder : 'Loading...'}
        className={className}
        disabled={disabled || !isLoaded}
      />
    </div>
  );
}

export default GooglePlacesAutocomplete;