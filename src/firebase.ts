import { initializeApp, type FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyA8xcmjk0A_4Qm3rTvl53PQbioOu1q3KYA',
  authDomain: 'pavat-game.firebaseapp.com',
  projectId: 'pavat-game',
  storageBucket: 'pavat-game.firebasestorage.app',
  messagingSenderId: '693567626509',
  appId: '1:693567626509:web:14ebcbd1914a26eac3e444',
  measurementId: 'G-G2206TMK5J'
};

export const GA_MEASUREMENT_ID = firebaseConfig.measurementId;

// Durée max d'un cookie de mesure d'audience recommandée par la CNIL : 13 mois.
const COOKIE_MAX_AGE_SECONDS = 13 * 30 * 24 * 60 * 60;

let app: FirebaseApp | null = null;
let analyticsStarted = false;

/**
 * Démarre Firebase Analytics. Ne doit être appelé qu'après consentement
 * (voir ConsentService) : le module n'est chargé qu'à ce moment-là.
 */
export const initFirebaseAnalytics = async (): Promise<void> => {
  if (typeof window === 'undefined' || analyticsStarted) {
    return;
  }

  try {
    const { initializeAnalytics, isSupported } = await import('firebase/analytics');
    if (!(await isSupported())) {
      return;
    }
    app ??= initializeApp(firebaseConfig);
    initializeAnalytics(app, {
      config: { cookie_expires: COOKIE_MAX_AGE_SECONDS },
    });
    analyticsStarted = true;
  } catch (error) {
    console.warn('Firebase Analytics non initialisé:', error);
  }
};
