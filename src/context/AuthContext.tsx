import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  college_id: string;
  stream: string;
  year: string;
  points: number;
  wallet_balance: number;
  holding_balance?: number;
  is_premium: boolean;
  subscription_expiry_date?: string;
  subscription_plan?: string;
  session_id?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  fetchUser: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = async () => {
    if (auth.currentUser) {
      localStorage.removeItem(`session_${auth.currentUser.uid}`);
    }
    await firebaseSignOut(auth);
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userRef);
          
          let currentSessionId = localStorage.getItem(`session_${firebaseUser.uid}`);
          
          // Check URL for session_id (used when opening new tabs from iframe to bypass storage partitioning)
          const urlParams = new URLSearchParams(window.location.search);
          const urlSessionId = urlParams.get('session_id');
          
          if (urlSessionId) {
            currentSessionId = urlSessionId;
            localStorage.setItem(`session_${firebaseUser.uid}`, currentSessionId);
            
            // Clean up URL
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('session_id');
            window.history.replaceState({}, document.title, newUrl.toString());
          }
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            
            // Elevate role to 'admin' if email is the hardcoded admin email
            if (firebaseUser.email === 'jaiswalrajib98192@gmail.com' && userData.role !== 'admin') {
              userData.role = 'admin';
              await setDoc(userRef, { role: 'admin' }, { merge: true });
            }
            
            // If no session ID in local storage, this is a new login on this device
            if (!currentSessionId) {
              currentSessionId = Date.now().toString() + Math.random().toString(36).substring(2);
              localStorage.setItem(`session_${firebaseUser.uid}`, currentSessionId);
              await setDoc(userRef, { ...userData, session_id: currentSessionId }, { merge: true });
            }
            
            setUser({ id: firebaseUser.uid, ...userData, session_id: userData.session_id } as User);
          } else {
            // Create default user doc if it doesn't exist
            currentSessionId = Date.now().toString() + Math.random().toString(36).substring(2);
            localStorage.setItem(`session_${firebaseUser.uid}`, currentSessionId);
            
            const newUser = {
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              role: firebaseUser.email === 'jaiswalrajib98192@gmail.com' ? 'admin' : 'student',
              college_id: '',
              stream: '',
              year: '',
              points: 0,
              wallet_balance: 0,
              is_premium: false,
              session_id: currentSessionId,
              created_at: serverTimestamp()
            };
            await setDoc(userRef, newUser);
            setUser({ id: firebaseUser.uid, ...newUser, created_at: new Date() } as any);
          }

          // Listen for session changes (Single Device Login)
          if (unsubscribeSnapshot) unsubscribeSnapshot();
          
          unsubscribeSnapshot = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              const latestSessionId = data.session_id;
              const mySessionId = localStorage.getItem(`session_${firebaseUser.uid}`);
              
              if (latestSessionId && mySessionId && latestSessionId !== mySessionId) {
                console.log('Logged out: Another device signed in.');
                logout();
              }
            }
          }, (err) => {
            console.warn('Snapshot listener error:', err);
          });

        } else {
          setUser(null);
          setToken(null);
          if (unsubscribeSnapshot) {
            unsubscribeSnapshot();
            unsubscribeSnapshot = null;
          }
        }
      } catch (err) {
        console.error('Error fetching user profile in AuthContext:', err);
        if (firebaseUser) {
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            role: firebaseUser.email === 'jaiswalrajib98192@gmail.com' ? 'admin' : 'student',
            college_id: '',
            stream: '',
            year: '',
            points: 0,
            wallet_balance: 0,
            is_premium: false
          });
        }
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const fetchUser = async () => {
    if (auth.currentUser) {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUser({ id: auth.currentUser.uid, ...userDoc.data() } as User);
      }
    }
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, fetchUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
