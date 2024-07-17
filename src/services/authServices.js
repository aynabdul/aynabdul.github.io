import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { getFirestore, setDoc, doc, getDoc } from "firebase/firestore";
import app from '../firebaseConfig'; 
// import db from '../firebaseConfig';

const auth = getAuth(app);
const db = getFirestore(app);

export const signUp = async (email, password, username) => {
    try {
      console.log("Starting signup process");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User created in Authentication:", user.uid);
  
      const usernameDoc = await getDoc(doc(db, "usernames", username));
      if (usernameDoc.exists()) {
        throw new Error("Username already taken");
      }
      console.log("Username is unique");
  
      await setDoc(doc(db, "usernames", username), { uid: user.uid });
      console.log("Username document created");
  
      await updateProfile(user, { displayName: username });
      console.log("User profile updated");
  
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        username: username,
        portfolioLink: `/portfolio/${username}`
      });
      console.log("User document created in Firestore");
  
      return user;
    } catch (error) {
      console.error("Error in signUp function:", error);
      throw error;
    }
  };

  export const updateUserData = async (uid, data) => {
    try {
      await setDoc(doc(db, "users", uid), data, { merge: true });
      console.log("User data updated successfully");
    } catch (error) {
      console.error("Error updating user data:", error);
      throw error;
    }
  };

export const signIn = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logOut = () => {
  return signOut(auth);
};

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
}
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
