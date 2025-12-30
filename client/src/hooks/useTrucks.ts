/**
 * useTrucks Hook
 * Fetches real truck data from backend API
 */

import { useState, useEffect, useCallback } from 'react';
import { truckService, Truck } from '../services/truckService';
import { socketService } from '../services/socketService';

interface UseTrucksOptions {
  nearby?: boolean;
  latitude?: number;
  longitude?: number;
  radius?: number;
  onlineOnly?: boolean;
}

interface UseTrucksReturn {
  trucks: Truck[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useTrucks = (options: UseTrucksOptions = {}): UseTrucksReturn => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrucks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let result;

      if (options.nearby && options.latitude && options.longitude) {
        // Fetch nearby trucks
        result = await truckService.getNearby({
          latitude: options.latitude,
          longitude: options.longitude,
          radius: options.radius || 10,
        });
      } else {
        // Fetch all trucks
        result = await truckService.getAll();
      }

      if (result.error) {
        setError(result.error);
        setTrucks([]);
      } else {
        setTrucks(result.trucks || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trucks');
      setTrucks([]);
    } finally {
      setLoading(false);
    }
  }, [options.nearby, options.latitude, options.longitude, options.radius]);

  // Initial fetch
  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  // Subscribe to real-time updates
  useEffect(() => {
    socketService.connect();

    // Truck came online
    const unsubOnline = socketService.on('truckOnline', (data: any) => {
      setTrucks((prev) => {
        const exists = prev.find((t) => t.id === data.truckId);
        if (exists) {
          return prev.map((t) =>
            t.id === data.truckId
              ? { ...t, isOnline: true, location: { ...t.location!, latitude: data.latitude, longitude: data.longitude } }
              : t
          );
        }
        // Refresh to get new truck data
        fetchTrucks();
        return prev;
      });
    });

    // Truck moved
    const unsubMoved = socketService.on('truckMoved', (data: any) => {
      setTrucks((prev) =>
        prev.map((t) =>
          t.id === data.truckId
            ? { ...t, location: { ...t.location!, latitude: data.latitude, longitude: data.longitude } }
            : t
        )
      );
    });

    // Truck went offline
    const unsubOffline = socketService.on('truckOffline', (data: any) => {
      if (options.onlineOnly) {
        setTrucks((prev) => prev.filter((t) => t.id !== data.truckId));
      } else {
        setTrucks((prev) =>
          prev.map((t) => (t.id === data.truckId ? { ...t, isOnline: false } : t))
        );
      }
    });

    return () => {
      unsubOnline();
      unsubMoved();
      unsubOffline();
    };
  }, [fetchTrucks, options.onlineOnly]);

  return {
    trucks,
    loading,
    error,
    refresh: fetchTrucks,
  };
};

export default useTrucks;
