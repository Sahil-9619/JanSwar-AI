/**
 * Mobile configuration file.
 * Replace the local IP address with your computer's local IP address
 * when testing on a physical phone using Expo Go.
 */

// If you are using an emulator, localhost works. For physical devices, use your local IP (e.g., 192.168.X.X) or Ngrok tunnel.
export const BACKEND_IP = "192.168.1.10"; // CHANGE THIS to your machine's local IP
export const BACKEND_PORT = "5000";

export const API_URL = `http://${BACKEND_IP}:${BACKEND_PORT}/api`;
