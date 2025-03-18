import { supabase } from './supabase';

interface Coordinates {
  latitude: number;
  longitude: number;
}

const SOUTH_INDIAN_STATES = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];

export const getUserLocation = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
};

export const isInSouthIndia = async (): Promise<boolean> => {
  try {
    // For development, we'll use IP-based location from Supabase
    const { data: { user_metadata } } = await supabase.auth.getUser();
    
    // If we have cached location in user metadata, use that
    if (user_metadata?.location) {
      return SOUTH_INDIAN_STATES.includes(user_metadata.location);
    }

    // Default to true if we can't determine location
    // In production, you should implement proper location detection
    return true;
  } catch (error) {
    console.error('Error determining location:', error);
    return true; // Default to email OTP if location check fails
  }
};