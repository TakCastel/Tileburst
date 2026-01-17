import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyA8xcmjk0A_4Qm3rTvl53PQbioOu1q3KYA',
  authDomain: 'pavat-game.firebaseapp.com',
  projectId: 'pavat-game',
  storageBucket: 'pavat-game.firebasestorage.app',
  messagingSenderId: '693567626509',
  appId: '1:693567626509:web:14ebcbd1914a26eac3e444',
  measurementId: 'G-G2206TMK5J'
};

export const firebaseApp = initializeApp(firebaseConfig);

export const initFirebaseAnalytics = async (): Promise<void> => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (await isSupported()) {
      getAnalytics(firebaseApp);
    }
  } catch (error) {
    console.warn('Firebase Analytics non initialisé:', error);
  }
};
