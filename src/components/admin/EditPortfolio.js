import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getCurrentUser } from '../../services/authServices';
import { db } from '../../firebaseConfig';

const EditPortfolio = () => {
  const [userData, setUserData] = useState(null);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = await getCurrentUser();
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setEditName(data.username);
          setEditBio(data.bio || '');
        }
      }
    };
    fetchUserData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await getCurrentUser();
      await updateDoc(doc(db, "users", user.uid), { 
        username: editName,
        bio: editBio
      });
      navigate('/admin');
    } catch (error) {
      console.error("Error updating portfolio:", error);
    }
  };

  if (!userData) return <div>Loading...</div>;

  return (
    <div>
      <h2>Edit Portfolio</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Username"
        />
        <textarea
          value={editBio}
          onChange={(e) => setEditBio(e.target.value)}
          placeholder="Bio"
        />
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};

export default EditPortfolio;