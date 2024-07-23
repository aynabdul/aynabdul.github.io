import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faSave,
  faTimes,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getCurrentUser } from "../../../services/authServices";
import Notification from "../Notification";
import { db } from "../../../firebaseConfig";
import styles from "./EditPortfolio.module.css";
import ReactMarkdown from 'react-markdown';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

function parseMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');
}

const EditPortfolio = ({ userId }) => {
  const [userData, setUserData] = useState(null);
  const [username, setUsername] = useState("");
  const [title, setTitle] = useState("");
  const [pfp, setPfp] = useState(null);
  const [pfpUrl, setPfpUrl] = useState("");
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [bio, setBio] = useState('');
  const [pfpScale, setPfpScale] = useState(1);
  const [pfpOffsetX, setPfpOffsetX] = useState(0);
  const [pfpOffsetY, setPfpOffsetY] = useState(0);
  const [notification, setNotification] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newProject, setNewProject] = useState({
    title: "",
    categoryId: "",
    recruiterName: "",
    description: "",
    contribution: "",
    tools: "",
    link: "",
  });
  const [editingProject, setEditingProject] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const user = await getCurrentUser();
      if (user) {
        await fetchUserData(user.uid);
        await fetchProjects(user.uid);
        await fetchCategories(user.uid);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, []);

  const fetchUserData = async (userId) => {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      setUserData(data);
      setUsername(data.username);
      setBio(data.bio || "");
      setTitle(data.title || "");
      setPfpUrl(data.pfpUrl || "");
      setPfpScale(data.pfpScale || 1);
      setPfpOffsetX(data.pfpOffsetX || 0);
      setPfpOffsetY(data.pfpOffsetY || 0);
    }
  };

  const fetchProjects = async (userId) => {
    if (!userId) {
      console.error("fetchProjects called with undefined userId");
      return;
    }
    const projectsQuery = query(
      collection(db, "projects"),
      where("uid", "==", userId)
    );
    const projectsSnapshot = await getDocs(projectsQuery);
    const projectsList = projectsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setProjects(projectsList);
  };

  const fetchCategories = async (userId) => {
    const categoriesQuery = query(
      collection(db, "categories"),
      where("uid", "==", userId)
    );
    const categoriesSnapshot = await getDocs(categoriesQuery);
    const categoriesList = categoriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setCategories(categoriesList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await getCurrentUser();
      const userRef = doc(db, "users", user.uid);

      const updateData = {
        username,
        bio,
        title,
      };

      if (pfp) {
        const storage = getStorage();
        const pfpRef = ref(storage, `pfp/${user.uid}`);
        await uploadBytes(pfpRef, pfp);
        const newPfpUrl = await getDownloadURL(pfpRef);
        updateData.pfpUrl = newPfpUrl;
        setPfpUrl(newPfpUrl);
      }

      await updateDoc(userRef, updateData);
      navigate("/admin");
    } catch (error) {
      console.error("Error updating portfolio:", error);
    }
  };

  const handleAddCategory = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.error("No user is currently signed in");
        return;
      }
      const categoryData = {
        name: newCategory,
        uid: user.uid,
      };
      const docRef = await addDoc(collection(db, "categories"), categoryData);
      console.log("Category added with ID: ", docRef.id);
      setNewCategory("");
      await fetchCategories(user.uid);
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleUpdateCategory = async () => {
    try {
      const user = await getCurrentUser();
      if (!user || !editingCategory) {
        console.error(
          "No user is currently signed in or no category is being edited"
        );
        return;
      }
      const categoryRef = doc(db, "categories", editingCategory.id);
      await updateDoc(categoryRef, { name: editingCategory.name });
      setEditingCategory(null);
      await fetchCategories(user.uid);
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (
      window.confirm(
        "Deleting this category will delete all projects in this category. Are you sure you want to proceed? Consider editing the category name or moving projects to a different category first."
      )
    ) {
      try {
        const user = await getCurrentUser();
        if (!user) {
          console.error("No user is currently signed in");
          return;
        }
        const batch = writeBatch(db);

        // Delete all projects in this category
        const projectsToDelete = projects.filter(
          (project) => project.categoryId === categoryId
        );
        projectsToDelete.forEach((project) => {
          batch.delete(doc(db, "projects", project.id));
        });

        // Delete the category
        batch.delete(doc(db, "categories", categoryId));

        await batch.commit();

        await fetchCategories(user.uid);
        await fetchProjects(user.uid);
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  const handleAddProject = async () => {
    try {
      const user = await getCurrentUser();
      const projectData = {
        ...newProject,
        uid: user.uid,
        tools: newProject.tools.split(",").map((tool) => tool.trim()),
      };
      await addDoc(collection(db, "projects"), projectData);
      setNewProject({
        title: "",
        categoryId: "",
        recruiterName: "",
        description: "",
        contribution: "",
        tools: "",
        link: "",
      });
      await fetchProjects(user.uid);
    } catch (error) {
      console.error("Error adding project:", error);
    }
  };

  const handleUpdateProject = async () => {
    const user = await getCurrentUser();
    try {
      const projectRef = doc(db, "projects", editingProject.id);

      const toolsArray = typeof editingProject.tools === "string"
        ? editingProject.tools.split(",").map((tool) => tool.trim())
        : editingProject.tools;

      await updateDoc(projectRef, {
        ...editingProject,
        tools: toolsArray,
      });

      setEditingProject(null);
      await fetchProjects(user.uid);
    } catch (error) {
      console.error("Error updating project:", error);
    }
  };
  

  const handleDeleteProject = async (projectId) => {
    const user = await getCurrentUser();
    try {
      await deleteDoc(doc(db, "projects", projectId));
      await fetchProjects(user.uid);
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };
  const handlePfpAdjust = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("No authenticated user");

      const userRef = doc(db, "users", user.uid);
      const updateData = {
        pfpScale,
        pfpOffsetX,
        pfpOffsetY,
      };

      if (pfp) {
        const storage = getStorage();
        const pfpRef = ref(storage, `pfp/${user.uid}`);
        await uploadBytes(pfpRef, pfp);
        const newPfpUrl = await getDownloadURL(pfpRef);
        updateData.pfpUrl = newPfpUrl;
        setPfpUrl(newPfpUrl);
      } else if (!pfpUrl) {
        throw new Error("No profile picture to adjust");
      }

      await updateDoc(userRef, updateData);
      setNotification({
        message: "Profile picture updated successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Error adjusting profile picture:", error);
      setNotification({ message: error.message, type: "error" });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setPfp(e.target.files[0]);
      setPfpUrl(URL.createObjectURL(e.target.files[0]));
    }
  };
  const handleBioChange = (e) => {
    setBio(e.target.value);
  };

  if (!userData) return <div className="loading">Loading...</div>;

  return (
    <div className={styles.editPortfolio}>
      <header className={styles.header}>
        <h1>Edit Portfolio</h1>
      </header>
      <section className={styles.profileSection}>
        <form onSubmit={handleSubmit}>
          <div className={styles.profilePicture}>
            <div className={styles.pfpContainer}>
              {pfpUrl && (
                <img
                  src={pfpUrl}
                  alt="Profile"
                  style={{
                    transform: `scale(${pfpScale}) translate(${pfpOffsetX}px, ${pfpOffsetY}px)`,
                  }}
                />
              )}
            </div>
            <div className={styles.pfpControls}>
              <label>
                Zoom:
                <input
                  type="range"
                  min="1"
                  max="2"
                  step="0.1"
                  value={pfpScale}
                  onChange={(e) => setPfpScale(parseFloat(e.target.value))}
                />
              </label>
              <label>
                Horizontal:
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={pfpOffsetX}
                  onChange={(e) => setPfpOffsetX(parseInt(e.target.value))}
                />
              </label>
              <label>
                Vertical:
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={pfpOffsetY}
                  onChange={(e) => setPfpOffsetY(parseInt(e.target.value))}
                />
              </label>
            </div>
            <div className={styles.pfpActions}>
              <input
                type="file"
                onChange={handleFileChange}
                id="pfp-upload"
                className={styles.hidden}
              />
              <label htmlFor="pfp-upload" className={`${styles.btn} ${styles.btnSecondary}`}>
                Upload New Picture
              </label>
              <button onClick={handlePfpAdjust} className={`${styles.btn} ${styles.btnPrimary}`}>
                Save Picture
              </button>
            </div>
          </div>
          <div className={styles.profileDetails}>
            <div className={styles.formGroup}>
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
              />
            </div>
            <div className={styles.formGroup}>
            <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={handleBioChange}
                placeholder="(for formatting: **Bold**, *Italic*, * Bullet points, Line break: two spaces,  Paragraph: blank line)"
                rows={10}
              />
              <div className={styles.preview}>
                <div dangerouslySetInnerHTML={{ __html: parseMarkdown(bio) }} />
              </div>
            </div>
          </div>
          <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
            Save Profile
          </button>
        </form>
      </section>
      <section className={styles.categoriesSection}>
        <h2>Categories</h2>
        <div className={styles.addCategory}>
          <input
            type="text"
            placeholder="New category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button onClick={handleAddCategory} className={`${styles.btn} ${styles.btnPrimary}`}>
            <FontAwesomeIcon icon={faPlus} /> Add Category
          </button>
        </div>
        <div className={styles.categoriesList}>
          {categories.map((category) => (
            <div key={category.id} className={styles.categoryContainer}>
              <div className={styles.categoryHeader}>
                <h3>{category.name}</h3>
                <div className={styles.categoryActions}>
                  <button
                    onClick={() => setEditingCategory(category)}
                    className={`${styles.btn} ${styles.btnSecondary}`}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className={`${styles.btn} ${styles.btnDanger}`}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
              <div className={styles.projectsList}>
                {projects
                  .filter((project) => project.categoryId === category.id)
                  .map((project) => (
                    <div key={project.id} className={styles.projectCard}>
                      <h4>{project.title}</h4>
                      <p className={styles.recruiter}>
                        <strong>Recruiter:</strong> {project.recruiterName}
                      </p>
                      <div className={styles.projectDetails}>
                        <div className={styles.projectDescription}>
                          <p>
                            <strong>Description:</strong> {project.description}
                          </p>
                          <p>
                            <strong>Contribution:</strong> {project.contribution}
                          </p>
                        </div>
                        <div className={styles.projectTools}>
                          <strong>Tools:</strong>
                          <ul>
                            {project.tools &&
                              project.tools.map((tool, index) => (
                                <li key={index}>{tool}</li>
                              ))}
                          </ul>
                        </div>
                      </div>
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.projectLink}
                      >
                        View Project
                      </a>
                      <div className={styles.projectActions}>
                        <button
                          onClick={() => setEditingProject(project)}
                          className={`${styles.btn} ${styles.btnSecondary}`}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className={`${styles.btn} ${styles.btnDanger}`}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        {editingCategory && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h3>Edit Category</h3>
              <input
                type="text"
                placeholder="Edit category name"
                value={editingCategory.name}
                onChange={(e) =>
                  setEditingCategory({
                    ...editingCategory,
                    name: e.target.value,
                  })
                }
              />
              <div className={styles.modalActions}>
                <button
                  onClick={handleUpdateCategory}
                  className={`${styles.btn} ${styles.btnPrimary}`}
                >
                  <FontAwesomeIcon icon={faSave} /> Save
                </button>
                <button
                  onClick={() => setEditingCategory(null)}
                  className={`${styles.btn} ${styles.btnSecondary}`}
                >
                  <FontAwesomeIcon icon={faTimes} /> Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {editingProject && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h3>Edit Project</h3>
              <input
                type="text"
                placeholder="Edit project title"
                value={editingProject.title}
                onChange={(e) =>
                  setEditingProject({
                    ...editingProject,
                    title: e.target.value,
                  })
                }
              />
              <input
                type="text"
                placeholder="Edit recruiter name"
                value={editingProject.recruiterName}
                onChange={(e) =>
                  setEditingProject({
                    ...editingProject,
                    recruiterName: e.target.value,
                  })
                }
              />
              <textarea
                placeholder="(for formatting: **Bold**, *Italic*, * Bullet points, Line break: two spaces,  Paragraph: blank line)"
                value={editingProject.description}
                onChange={(e) =>
                  setEditingProject({
                    ...editingProject,
                    description: e.target.value,
                  })
                }
                rows={5}
              />
              <textarea
                placeholder="(for formatting: **Bold**, *Italic*, * Bullet points, Line break: two spaces,  Paragraph: blank line)"
                value={editingProject.contribution}
                onChange={(e) =>
                  setEditingProject({
                    ...editingProject,
                    contribution: e.target.value,
                  })
                }
                rows={5}
              />
              <input
                type="text"
                placeholder="Edit tools (separated each tool with a comma)"
                value={editingProject.tools}
                onChange={(e) =>
                  setEditingProject({
                    ...editingProject,
                    tools: e.target.value,
                  })
                }
              />
              <input
                type="text"
                placeholder="Edit project link"
                value={editingProject.link}
                onChange={(e) =>
                  setEditingProject({ ...editingProject, link: e.target.value })
                }
              />
              <div className={styles.modalActions}>
                <button
                  onClick={handleUpdateProject}
                  className={`${styles.btn} ${styles.btnPrimary}`}
                >
                  <FontAwesomeIcon icon={faSave} /> Save Project
                </button>
                <button
                  onClick={() => setEditingProject(null)}
                  className={`${styles.btn} ${styles.btnSecondary}`}
                >
                  <FontAwesomeIcon icon={faTimes} /> Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
      <section className={styles.projectsSection}>
        <h2>Add New Project</h2>
        <div className={styles.addProjectForm}>
          <div className={styles.formGroup}>
            <label htmlFor="project-title">Title</label>
            <input
              type="text"
              id="projectTitle"
              placeholder="Title"
              value={newProject.title}
              onChange={(e) =>
                setNewProject({ ...newProject, title: e.target.value })
              }
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="project-category">Category</label>
            <select
              id="projectCategory"
              value={newProject.categoryId}
              onChange={(e) =>
                setNewProject({ ...newProject, categoryId: e.target.value })
              }
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="project-recruiter">Recruiter Name</label>
            <input
              type="text"
              id="projectRecruiter"
              placeholder="Recruiter Name"
              value={newProject.recruiterName}
              onChange={(e) =>
                setNewProject({ ...newProject, recruiterName: e.target.value })
              }
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="project-description">Description</label>
            <textarea
              id="project-description"
              placeholder="(for formatting: **Bold**, *Italic*, * Bullet points, Line break: two spaces,  Paragraph: blank line)"
              value={newProject.description}
              onChange={(e) =>
                setNewProject({ ...newProject, description: e.target.value })
              }
              rows={5}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="project-contribution">Contribution</label>
            <textarea
              id="project-contribution"
              placeholder="(for formatting: **Bold**, *Italic*, * Bullet points, Line break: two spaces,  Paragraph: blank line)"
              value={newProject.contribution}
              onChange={(e) =>
                setNewProject({ ...newProject, contribution: e.target.value })
              }
              rows={5}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="project-tools">Tools</label>
            <input
              type="text"
              id="projectTools"
              placeholder="Tools (comma separated)"
              value={newProject.tools}
              onChange={(e) =>
                setNewProject({ ...newProject, tools: e.target.value })
              }
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="project-link">Project Link</label>
            <input
              type="text"
              id="projectLink"
              placeholder="Project Link"
              value={newProject.link}
              onChange={(e) =>
                setNewProject({ ...newProject, link: e.target.value })
              }
            />
          </div>
          <button onClick={handleAddProject} className={`${styles.btn} ${styles.btnPrimary}`}>
            Add Project
          </button>
        </div>
      </section>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          duration={3000}
        />
      )}
    </div>
  );
  
};

export default EditPortfolio;
