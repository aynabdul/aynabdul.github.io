import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '../../firebaseConfig';

const db = getFirestore(app);

const PortfolioPage = () => {
  const { username } = useParams();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const usernameDoc = await getDoc(doc(db, "usernames", username));
        if (!usernameDoc.exists()) {
          setError("User not found");
          return;
        }
        const uid = usernameDoc.data().uid;
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          setError("User data not found");
        }
      } catch (error) {
        setError("Error fetching user data");
        console.error(error);
      }
    };

    fetchUserData();
  }, [username]);

  if (error) {
    return <h1>{error}</h1>;
  }

  if (!userData) {
    return <h1>Loading...</h1>;
  }

  return (
    <div>
      <h1>{userData.username}'s Portfolio</h1>
      <p>Email: {userData.email}</p>
      {/* Add more portfolio content here */}
      {/* For example: */}
      {userData.bio && <p>About me: {userData.bio}</p>}
      {userData.skills && (
        <div>
          <h2>Skills</h2>
          <ul>
            {userData.skills.map((skill, index) => (
              <li key={index}>{skill}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;