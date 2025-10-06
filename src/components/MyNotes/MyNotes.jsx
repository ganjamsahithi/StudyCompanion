import React, { useState } from 'react';
import './MyNotes.css';

const MyNotes = () => {
  const [uploadedFiles, setUploadedFiles] = useState([
    { name: 'Quantum Mechanics Lecture 1.pdf', date: 'Oct 26, 2025' },
    { name: 'The Industrial Revolution.pdf', date: 'Oct 25, 2025' },
  ]);

  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      const newFiles = Array.from(files).map(file => ({
        name: file.name,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      }));
      setUploadedFiles(prevFiles => [...newFiles, ...prevFiles]);
      alert(`${files.length} files successfully uploaded (to the frontend list).`);
    }
  };

  return (
    <div className="my-notes-container">
      <h2>My Notes & Summaries</h2>
      <div className="upload-box">
        <label htmlFor="file-upload" className="upload-btn">
          Upload New Document (PDF, DOCX, TXT)
        </label>
        <input
          id="file-upload"
          type="file"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <p className="drag-and-drop-text">or drag & drop files here</p>
      </div>
      <div className="notes-list card">
        <h4>Uploaded Documents</h4>
        {uploadedFiles.length > 0 ? (
          <ul>
            {uploadedFiles.map((file, index) => (
              <li key={index}>
                <span className="file-name">📄 {file.name}</span>
                <span className="upload-date">Uploaded: {file.date}</span>
                <button className="view-summary-btn">View Summary</button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">You haven't uploaded any notes yet.</p>
        )}
      </div>
    </div>
  );
};

export default MyNotes;