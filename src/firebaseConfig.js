import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBXP6-8RNb0MalPS8gGRQx-3B12Sin4PIM",
  authDomain: "devfolio-36915.firebaseapp.com",
  projectId: "devfolio-36915",
  storageBucket: "devfolio-36915.appspot.com",
  messagingSenderId: "652006790837",
  appId: "1:652006790837:web:e00b98f289f857b917d0fc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export default app;
export {db, auth};
