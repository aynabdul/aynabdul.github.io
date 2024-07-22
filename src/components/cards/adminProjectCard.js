import React from 'react';

const AdminProjectCard = ({ project, onEdit, onDelete }) => {
  return (
    <div className="project-card">
      <h4>{project.title}</h4>
      <p><strong>Recruiter:</strong> {project.recruiterName}</p>
      <p><strong>Description:</strong> {project.description}</p>
      <p><strong>Contribution:</strong> {project.contribution}</p>
      <div className="tools-list">
        <strong>Tools:</strong>
        <ul>
          {project.tools && project.tools.map((tool, index) => (
            <li key={index}>{tool}</li>
          ))}
        </ul>
      </div>
      <a href={project.link} target="_blank" rel="noopener noreferrer" className="project-link">View Project</a>
      <div className="card-actions">
        <button onClick={onEdit}>Edit</button>
        <button onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
};

export default AdminProjectCard;
