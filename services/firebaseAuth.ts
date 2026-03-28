import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  GoogleAuthProvider,
  User,
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBE0Qmqj9J9MFlSmJfdd4QkPccl4Hc7qlk',
  authDomain: 'projectpothole.firebaseapp.com',
  projectId: 'projectpothole',
  storageBucket: 'projectpothole.firebasestorage.app',
  messagingSenderId: '273988056659',
  appId: '1:273988056659:ios:9e112c5b7911286f9878a6',
};

const GOOGLE_WEB_CLIENT_ID = '273988056659-9ngd2dci0628im6580te195n3r1kr5q5.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '273988056659-9ngd2dci0628im6580te195n3r1kr5q5.apps.googleusercontent.com';

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let isGoogleConfigured = false;
let firebaseAuth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (firebaseAuth) {
    return firebaseAuth;
  }

  try {
    firebaseAuth = initializeAuth(app);
  } catch {
    firebaseAuth = getAuth(app);
  }

  return firebaseAuth;
}

export function getFirebaseApp(): FirebaseApp {
  return app;
}

export function configureGoogleSignIn(): void {
  if (isGoogleConfigured) {
    return;
  }

  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });

  isGoogleConfigured = true;
}

export async function signInWithGoogle(): Promise<void> {
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const result = await GoogleSignin.signIn();
  const idToken = result.data?.idToken;

  if (!idToken) {
    throw new Error('Google Sign-In did not return an id token.');
  }

  const googleCredential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(getFirebaseAuth(), googleCredential);
}

export async function signOutFromFirebase(): Promise<void> {
  await signOut(getFirebaseAuth());
  await GoogleSignin.signOut();
}

export function observeAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}
