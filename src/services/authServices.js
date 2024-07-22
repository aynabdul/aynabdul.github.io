import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,fetchSignInMethodsForEmail, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, setDoc, doc, getDoc } from "firebase/firestore";
import app from '../firebaseConfig'; 

const auth = getAuth(app);
const db = getFirestore(app);

export const signUp = async (email, password, username) => {
  try {
    console.log("Starting signup process");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User created in Authentication:", user.uid);

    try {
      const usernameDoc = await getDoc(doc(db, "usernames", username));
      if (usernameDoc.exists()) {
        throw new Error("Username already taken");
      }
      console.log("Username is unique");

      await setDoc(doc(db, "usernames", user.uid), { username: username });
      console.log("Username document created");

      await updateProfile(user, { displayName: username });
      console.log("User profile updated");

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        username: username,
        portfolioLink: `/portfolio/${username}`,
        bio: "",
        createdAt: new Date()
      });
      console.log("User document created in Firestore");

      return user;
    } catch (firestoreError) {
      console.error("Error in Firestore operations:", firestoreError);
      
      await user.delete();
      console.log("Authentication account deleted due to Firestore error");

      if (firestoreError.code === "permission-denied") {
        throw new Error("Unable to create user profile due to permission issues. Please contact support.");
      } else {
        throw firestoreError;
      }
    }
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
      const unsubscribe = getAuth().onAuthStateChanged(user => {
        unsubscribe();
        resolve(user);
      }, reject);
    });
  };
  export const onAuthStateChange = (callback) => {
    return onAuthStateChanged(auth, callback);
  };
  export const resetPassword = async (email) => {
    try {

      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      
      if (signInMethods.length === 0) {
        return "If an account exists with this email, a password reset link will be sent.";
      }
      await sendPasswordResetEmail(auth, email);
      return "Password reset email sent. Check your inbox.";
    } catch (error) {
      console.error("Error in resetPassword:", error);
      throw new Error("An error occurred. Please try again later.");
    }
  };
  