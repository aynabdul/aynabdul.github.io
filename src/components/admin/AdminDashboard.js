import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { logOut, getCurrentUser } from '../../services/authServices';
import { db } from '../../firebaseConfig';

const AdminDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            setError("User data not found");
          }
        } else {
          setError("User not authenticated");
          navigate('/'); // Redirect to login page if user is not authenticated
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("An error occurred while fetching user data");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      console.error("Error logging out:", error);
      setError("An error occurred while logging out");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!userData) return <div>No user data available</div>;

  return (
    <div>
      <h2>Welcome, {userData.username}!</h2>
      <p>Your portfolio link: 
        <Link to={`/portfolio/${userData.username}`}>
          {`/portfolio/${userData.username}`}
        </Link>
      </p>
      <Link to="/edit-portfolio">Edit Portfolio</Link>
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
};

export default AdminDashboard;