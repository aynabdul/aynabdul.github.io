import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { logOut, getCurrentUser } from '../../../services/authServices';
import { db } from '../../../firebaseConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faSignOutAlt, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import styles from './AdminDashboardStyles.module.css'; // Updated import

const AdminDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());

            const usernameDoc = await getDoc(doc(db, "usernames", user.uid));
            if (usernameDoc.exists()) {
              setUsername(usernameDoc.data());
            }
          } else {
            setError("User data not found");
          }
        } else {
          setError("User not authenticated");
          navigate('/');
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

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const handleLogout = async () => {
    try {
      await logOut();
      showNotification('Logged out successfully', 'success');
      navigate('/');
    } catch (error) {
      console.error("Error logging out:", error);
      showNotification('An error occurred while logging out', 'error');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!userData) return <div>No user data available</div>;

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminDashboard}>
        <h1 className={styles.dashboardTitle}>DevFolio</h1>
        <p className={styles.dashboardDescription}>
          Manage and showcase your developer portfolio with ease.
        </p>

        {loading && <div className={styles.loading}>Loading...</div>}
        {error && <div className={styles.error}>Error: {error}</div>}

        {userData && (
          <div className={styles.dashboardContent}>
            <h2>Welcome, {userData.username}!</h2>
            <div className={styles.dashboardActions}>
              <Link to="/edit-portfolio" className={styles.dashboardButton}>
                <FontAwesomeIcon icon={faEdit} className={styles.icon} /> Edit Portfolio
              </Link>
              <Link to={`/portfolio/${username.username}`} className={styles.dashboardButton} target="_blank" rel="noopener noreferrer">
                <FontAwesomeIcon icon={faExternalLinkAlt} className={styles.icon} /> View Portfolio
              </Link>
              <button onClick={handleLogout} className={`${styles.dashboardButton} ${styles.logout}`}>
                <FontAwesomeIcon icon={faSignOutAlt} className={styles.icon} /> Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div> 
  );
};

export default AdminDashboard;
