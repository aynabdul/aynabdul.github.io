import React from 'react';

const adminCategoryCard = ({ category, onEdit, onDelete }) => {
  return (
    <div className="category-card">
      <h3>{category.name}</h3>
      <div className="card-actions">
        <button onClick={() => onEdit(category)}>Edit</button>
        <button onClick={() => onDelete(category.id)}>Delete</button>
      </div>
    </div>
  );
};

export default adminCategoryCard;