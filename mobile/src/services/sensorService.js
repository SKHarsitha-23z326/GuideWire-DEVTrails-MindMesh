import { Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';

export const getVerificationData = async () => {
  // 1. Get Location and check for Mocking (Anti-Fraud)
  let location = await Location.getCurrentPositionAsync({});
  if (location.mocked) throw new Error("GPS Spoofing Detected");

  // 2. Capture Accelerometer for 3 seconds to ensure physical movement (Anti-Bot)
  return new Promise((resolve) => {
    let readings = [];
    const sub = Accelerometer.addListener(data => readings.push(data));
    setTimeout(() => {
      sub.remove();
      const avgVibration = readings.reduce((acc, val) => acc + Math.abs(val.x), 0) / readings.length;
      resolve({
        coords: { lat: location.coords.latitude, lng: location.coords.longitude },
        vibration: avgVibration > 0.1 ? 'High' : 'Low' // Real bikes vibrate; static phones don't
      });
    }, 3000);
  });
};