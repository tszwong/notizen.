//
// -- Note to self -- 
//   
//   AuthProvider: 
// - stores current user in React state, listens for login/logout events
// - makes user available to any component via useAuth() hook, prevents
// - flicker between logout/login states


import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../../firebase';


// Define what AuthContext provides
interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => {}
});


// Allow us to signout from anywhere in app
export const useAuth = () => useContext(AuthContext);


// Allow us to access auth context anywhere in app
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);  // current signed-in user
    const [loading, setLoading] = useState(true);

    // Listen for sign-in/sign-out events and update accordingly
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);
    
    const signOut = async () => {
    await firebaseSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};