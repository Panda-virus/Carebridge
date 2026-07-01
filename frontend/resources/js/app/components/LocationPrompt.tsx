import { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { LocationData } from '../types';

interface LocationPromptProps {
  onLocationShared: (location: LocationData) => void;
  onSkip: () => void;
}

export function LocationPrompt({ onLocationShared, onSkip }: LocationPromptProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
        };
        onLocationShared(location);
        setLoading(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out.';
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border-2 border-destructive max-w-md w-full p-4 sm:p-6 animate-in fade-in zoom-in duration-300 max-h-[95dvh] overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <div>
            <h2 className="text-foreground font-bold">Emergency Detected</h2>
            <p className="text-sm text-muted-foreground">Immediate help may be needed</p>
          </div>
        </div>

        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-6">
          <p className="text-foreground text-sm leading-relaxed">
            Your report indicates you may be in immediate danger. Sharing your location will help us send help to you faster.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-3 mb-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={requestLocation}
            disabled={loading}
            className="w-full bg-destructive text-destructive-foreground py-4 rounded-lg hover:bg-destructive/90 transition-all flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Getting location...
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5" />
                Share My Location
              </>
            )}
          </button>

          <button
            onClick={onSkip}
            disabled={loading}
            className="w-full bg-muted text-foreground py-3 rounded-lg hover:bg-muted/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue Without Location
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Your location will only be shared with authorized university staff
        </p>
      </div>
    </div>
  );
}
