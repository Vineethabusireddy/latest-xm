import { useState, useEffect } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  city?: string | null;
  postcode?: string | null;
  error: string | null;
  permission: 'granted' | 'denied' | 'prompt' | null; // 'prompt' will indicate that we need to show our custom popup
}

const DEFAULT_MUMBAI_LOCATION = {
    latitude: 19.0760, // Mumbai Latitude
    longitude: 72.8777, // Mumbai Longitude
    locationName: "Mumbai, Maharashtra, India",
    city: "Mumbai",
    postcode: "400001", // Example Pincode for South Mumbai
    error: null,
    permission: 'denied' as const, // Reflect denied permission if used as fallback
};

export const useLocationPermission = () => {
  const [locationState, setLocationState] = useState<LocationState>(() => {
    const storedLocation = localStorage.getItem('userLocation');
    const storedPermission = localStorage.getItem('locationPermission') as LocationState['permission'];

    if (storedLocation && storedPermission === 'granted') {
      try {
        const parsedLocation = JSON.parse(storedLocation);
        if (parsedLocation && parsedLocation.latitude != null && parsedLocation.longitude != null) {
             return parsedLocation;
        }
      } catch (error) {
        console.error('Error parsing stored location, defaulting to Mumbai', error);
      }
    }

    const mumbaiLocation = {
        ...DEFAULT_MUMBAI_LOCATION,
        error: storedPermission === 'denied' ? 'Location permission denied, defaulted to Mumbai' : null,
        permission: storedPermission === 'denied' ? 'denied' as const : DEFAULT_MUMBAI_LOCATION.permission,
    };

    if (!storedLocation || storedPermission !== 'granted') {
       localStorage.setItem('userLocation', JSON.stringify(mumbaiLocation));
    }

    if (storedPermission === 'denied') {
        localStorage.setItem('locationPermission', 'denied');
    }

    return mumbaiLocation;
  });

  const getLocationName = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      const address = data.address;
      const city = address.city || address.town || address.village || null;
      const postcode = address.postcode || null;
      const nameParts = [
        city,
        address.state,
        address.country
      ].filter(Boolean);

      const locationName = nameParts.join(', ');

      return { locationName, city, postcode };
    } catch (error) {
      console.error('Error fetching location name:', error);
      return null;
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      const mumbaiLocation = {
           ...DEFAULT_MUMBAI_LOCATION,
           error: 'Geolocation not supported, defaulted to Mumbai',
           permission: 'denied' as const,
       };
       localStorage.setItem('userLocation', JSON.stringify(mumbaiLocation));
       setLocationState(mumbaiLocation);
      localStorage.setItem('locationPermission', 'denied');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationData = await getLocationName(latitude, longitude);
        
        const newLocationState: LocationState = {
          latitude,
          longitude,
          locationName: locationData?.locationName || null,
          city: locationData?.city || null,
          postcode: locationData?.postcode || null,
          error: null,
          permission: 'granted' as const,
        };

        localStorage.setItem('userLocation', JSON.stringify(newLocationState));
        localStorage.setItem('locationPermission', 'granted');

        setLocationState(newLocationState);
      },
      (error) => {
        console.error('Error getting location:', error);
        const mumbaiLocation = {
             ...DEFAULT_MUMBAI_LOCATION,
             error: 'Location permission denied, defaulted to Mumbai',
             permission: 'denied' as const,
         };
         localStorage.setItem('userLocation', JSON.stringify(mumbaiLocation));
         localStorage.setItem('locationPermission', 'denied');
         setLocationState(mumbaiLocation);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      const mumbaiLocation = {
           ...DEFAULT_MUMBAI_LOCATION,
           error: 'Geolocation not supported, defaulted to Mumbai',
           permission: 'denied' as const,
       };
       localStorage.setItem('userLocation', JSON.stringify(mumbaiLocation));
       setLocationState(mumbaiLocation);
      return;
    }

    const handlePermissionChange = (event: Event) => {
      const permissionStatus = event.target as PermissionStatus;
      if (permissionStatus.state === 'granted') {
        requestLocation();
      } else if (permissionStatus.state === 'denied') {
         const mumbaiLocation = {
             ...DEFAULT_MUMBAI_LOCATION,
             error: 'Location permission denied, defaulted to Mumbai',
             permission: 'denied' as const,
         };
         localStorage.setItem('userLocation', JSON.stringify(mumbaiLocation));
         setLocationState(mumbaiLocation);
      }
      setLocationState(prev => ({
        ...prev,
        permission: permissionStatus.state as LocationState['permission'],
      }));
    };

    navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
      setLocationState(prev => ({
        ...prev,
        permission: permissionStatus.state as LocationState['permission'],
      }));

      if (permissionStatus.state === 'granted') {
        if (locationState.latitude === null || locationState.longitude === null) {
            requestLocation();
        }
      } else if (permissionStatus.state === 'denied') {
         const mumbaiLocation = {
             ...DEFAULT_MUMBAI_LOCATION,
             error: 'Location permission denied, defaulted to Mumbai',
             permission: 'denied' as const,
         };
         localStorage.setItem('userLocation', JSON.stringify(mumbaiLocation));
         setLocationState(mumbaiLocation);
      } else if (permissionStatus.state === 'prompt') {
          requestLocation();
      }

      permissionStatus.addEventListener('change', handlePermissionChange);
    }).catch(error => {
      console.error('Error querying permission status:', error);
      const mumbaiLocation = {
           ...DEFAULT_MUMBAI_LOCATION,
           error: 'Error querying location permission, defaulted to Mumbai',
           permission: 'denied' as const,
       };
       localStorage.setItem('userLocation', JSON.stringify(mumbaiLocation));
       setLocationState(mumbaiLocation);
    });

    return () => {
      navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
        permissionStatus.removeEventListener('change', handlePermissionChange);
      }).catch(error => {
        console.error('Error accessing permission status for cleanup:', error);
      });
    };

  }, []);

  return {
    locationState,
    requestLocation,
  };
}; 