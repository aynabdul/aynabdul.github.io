import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getFirestore, doc, getDoc, query, where, collection, getDocs } from 'firebase/firestore';
import emailjs from 'emailjs-com';
import app from '../../firebaseConfig';
import styles from './PortfolioPage.module.css';

const db = getFirestore(app);

const PortfolioPage = () => {
  const { username } = useParams();
  const [userData, setUserData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [openCategory, setOpenCategory] = useState(null); 
  const [activeSection, setActiveSection] = useState('introduction'); 

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const q = query(collection(db, "usernames"), where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("User not found");
          return;
        }

        const usernameDoc = querySnapshot.docs[0];
        const uid = usernameDoc.id;

        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());

          const projectsQuery = query(collection(db, "projects"), where("uid", "==", uid));
          const projectsSnapshot = await getDocs(projectsQuery);
          const projectsData = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setProjects(projectsData);

          const categoriesQuery = query(collection(db, "categories"), where("uid", "==", uid));
          const categoriesSnapshot = await getDocs(categoriesQuery);
          const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setCategories(categoriesData);

          if (categoriesData.length > 0) {
            setOpenCategory(categoriesData[0].id);
          }
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

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['introduction', 'portfolio', 'contact'];
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      for (let section of sections) {
        const element = document.getElementById(section);
        if (element && element.offsetTop <= scrollPosition && element.offsetTop + element.offsetHeight > scrollPosition) {
          setActiveSection(section);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  const toggleCategory = (categoryId) => {
    setOpenCategory(openCategory === categoryId ? null : categoryId);
  };

  const sendEmail = (e) => {
    e.preventDefault();

    const { email } = userData; 
    emailjs.sendForm(
      'service_gik9lfk', 
      'template_4j86r8s', 
      e.target, 
      'fY_eEtQgGPkNbtm0d'
    ).then((result) => {
        console.log(result.text);
        alert('Email sent successfully!');
    }, (error) => {
        console.log(error.text);
        alert('Error sending email.');
    });

    e.target.to_email.value = email;
  };

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!userData) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.portfolioPage}>
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          {['introduction', 'portfolio', 'contact'].map((section) => (
            <button
              key={section}
              onClick={() => scrollToSection(section)}
              className={`${styles.navButton} ${activeSection === section ? styles.active : ''}`}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}
        </div>
      </nav>

      <section id="introduction" className={styles.introduction}>
        <div className={styles.introWrapper}>
          <div className={styles.profilePicture}>
            <div className={styles.pfpContainer}>
              {userData.pfpUrl && (
                <img
                  src={userData.pfpUrl}
                  alt="Profile"
                  style={{
                    transform: `scale(${userData.pfpScale}) translate(${userData.pfpOffsetX}px, ${userData.pfpOffsetY}px)`,
                  }}
                />
              )}
            </div>
          </div>
          <div className={styles.profileInfo}>
            <h1>{userData.username}</h1>
            <h2>{userData.title}</h2>
            <p>{userData.bio}</p>
          </div>
        </div>
      </section>

      <section id="portfolio" className={styles.portfolio}>
        <div className={styles.contentWrapper}>
          <h2>Portfolio</h2>
          {categories.map(category => (
            <div key={category.id} className={styles.category}>
              <h3 onClick={() => toggleCategory(category.id)}>
                {category.name}
                <span className={`${styles.arrow} ${openCategory === category.id ? styles.open : ''}`}>▼</span>
              </h3>
              {openCategory === category.id && (
                <div className={styles.projectGrid}>
                  {projects.filter(project => project.categoryId === category.id).map(project => (
                    <div key={project.id} className={styles.projectCard}>
                      <h4>{project.title}</h4>
                      <p className={styles.recruiter}>{project.recruiterName}</p>
                      <div className={styles.projectDetails}>
                        <div className={styles.projectInfo}>
                          <p>{project.description}</p>
                          <p><strong>Contribution:</strong> {project.contribution}</p>
                        </div>
                        <div className={styles.tools}>
                          <strong>Tools:</strong>
                          <ul>
                            {project.tools.map((tool, index) => (
                              <li key={index}>{tool}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {project.link && (
                        <a href={project.link} target="_blank" rel="noopener noreferrer" className={styles.viewProject}>
                          View Project
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className={styles.contact}>
        <div className={styles.contentWrapper}>
          <h2>Contact Me</h2>
          <form onSubmit={sendEmail}>
            <input type="hidden" name="to_email" value={userData.email} />
            <div className={styles.formGroup}>
              <input type="text" name="name" placeholder="Your Name" required />
              <input type="email" name="from_email" placeholder="Your Email" required />
            </div>
            <textarea name="message" placeholder="Your Message" required></textarea>
            <button type="submit">Send Message</button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default PortfolioPage;
