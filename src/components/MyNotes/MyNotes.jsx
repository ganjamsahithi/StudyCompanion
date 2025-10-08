import React, { useState, useEffect } from 'react';
import './MyNotes.css';

// Base URL for the backend API (Must match your Express/Node.js setup on port 8000)
const API_BASE_URL = 'http://localhost:8000/documents'; 

// --- Helper Function: Markdown to HTML Conversion (Crucial for rendering summaries) ---
const markdownToHtml = (markdown) => {
    if (!markdown) return '';
    let html = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/###\s*(.*)/g, '<h3>$1</h3>');
    html = html.replace(/##\s*(.*)/g, '<h2>$1</h2>');
    html = html.replace(/#\s*(.*)/g, '<h1>$1</h1>');

    const lines = html.split('\n');
    let inList = false;
    let processedLines = [];
    
    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('*') || trimmedLine.startsWith('-')) {
            if (!inList) {
                processedLines.push('<ul>');
                inList = true;
            }
            const content = trimmedLine.substring(1).trim();
            processedLines.push(`<li>${content}</li>`);
        } else {
            if (inList) {
                processedLines.push('</ul>');
                inList = false;
            }
            if (trimmedLine) {
                processedLines.push(trimmedLine);
            }
        }
    });
    
    if (inList) {
        processedLines.push('</ul>');
    }
    
    html = processedLines.join('\n');

    const paragraphs = html.split(/\n{2,}/);
    html = paragraphs.map(para => {
        para = para.trim();
        if (para && !para.startsWith('<h') && !para.startsWith('<ul') && !para.startsWith('</ul>')) {
            return `<p>${para}</p>`;
        }
        return para;
    }).join('\n');
    
    return html;
};

// --- File Drop Zone Component (Remains the same) ---
const FileDropZone = ({ onFileSelect }) => {
    const [dragging, setDragging] = useState(false);

    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); };
    const handleDrop = (e) => { 
        e.preventDefault(); e.stopPropagation(); setDragging(false); 
        const files = Array.from(e.dataTransfer.files).filter(file => file.name.match(/\.(pdf|docx|txt|doc)$/i));
        if (files.length > 0) { onFileSelect({ target: { files: files } }); }
    };

    return (
        <div 
            className={`upload-box ${dragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <label htmlFor="file-upload" className="upload-btn">
                Upload New Document (PDF, DOCX, TXT)
            </label>
            <input
                id="file-upload"
                type="file"
                multiple
                onChange={onFileSelect}
                style={{ display: 'none' }}
                accept=".pdf,.docx,.txt"
            />
            <p className="drag-and-drop-text">or drag & drop files here</p>
        </div>
    );
};


const MyNotes = () => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    
    const [expandedDocId, setExpandedDocId] = useState(null); 
    
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState(null); // {id, fileName}


    // --- API CALLS ---

    // 1. GET: Fetch all documents from the database
    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_BASE_URL + '/');
            if (!response.ok) {
                 throw new Error(`Failed to fetch documents. Status: ${response.status}`);
            }
            const data = await response.json();
            setUploadedFiles(data);
        } catch (error) {
            setMessage({ text: 'CONNECTION ERROR: Backend not running or check console.', type: 'error' });
            console.error('Fetch Documents Error:', error);
            // Fallback to mock data for layout testing if connection fails
            setUploadedFiles([
                 { _id: 'mock1', fileName: 'BATCH_6_PID_IEEE.pdf', uploadedDate: new Date(), summary: "## Privacy and Intrusion Detection\n\n* It detects brute-force SSH login attempts.\n* It proposes a **dynamic rule management system**.", course: 'Security' },
                 { _id: 'mock2', fileName: 'Graph_Algorithms_Lec1.pdf', uploadedDate: new Date(), summary: null, course: 'CS 301' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    // 2. POST: Handle file upload and start summary generation
    const handleFileUpload = async (event) => {
        const files = event.target.files;
        if (files.length === 0) return;
        
        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('document', file);
            formData.append('course', 'General'); 
        });

        setMessage({ text: 'Uploading file(s) and starting AI process...', type: 'info' });

        try {
            const response = await fetch(API_BASE_URL + '/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'File upload failed.');
            }

            setMessage({ text: `${files.length} file(s) uploaded! Summary generation processing...`, type: 'success' });
            fetchDocuments();

        } catch (error) {
            setMessage({ text: `Upload Error: ${error.message}`, type: 'error' });
            console.error('Upload Error:', error);
        }
    };

    // 3. GET/POST: Handle View/Generate Summary
    const handleViewSummary = async (docId, fileName) => {
        // 1. Toggle summary display if already selected
        if (expandedDocId === docId) {
            setExpandedDocId(null);
            return;
        }

        const file = uploadedFiles.find(f => f._id === docId);
        
        // 2. If summary exists, just expand the panel
        if (file && file.summary) {
            setExpandedDocId(docId);
            return;
        }

        // 3. Summary does not exist: trigger generation API call
        setIsSummaryLoading(true);
        setMessage({ text: `Generating summary for ${fileName}...`, type: 'info' });
        setExpandedDocId(docId); 

        try {
            // API call: POST /documents/summarize/{docId}
            const response = await fetch(API_BASE_URL + `/summarize/${docId}`, { method: 'POST' });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'AI summarization failed.');
            }
            
            // Assume backend updates DB; we refresh list to get the new summary
            setMessage({ text: 'Summary generated successfully.', type: 'success' });

        } catch (error) {
            setMessage({ text: `Summary Error: ${error.message}`, type: 'error' });
        } finally {
            setIsSummaryLoading(false);
            fetchDocuments(); // Refresh to display new summary
        }
    };

    // 4. DELETE: Handle document deletion
    const handleDeleteDocument = async () => {
        if (!deleteModal || !deleteModal.id) return;

        const docId = deleteModal.id;
        setMessage({ text: `Deleting ${deleteModal.fileName}...`, type: 'info' });
        setDeleteModal(null); // Close modal immediately

        try {
            // CRITICAL FIX: The request must match the RESTful path configured in the backend: /documents/ID
            const response = await fetch(`${API_BASE_URL}/${docId}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                 const errorData = await response.json(); // Read error message from server
                 throw new Error(errorData.message || 'Deletion failed on the server.');
            }

            setMessage({ text: `File ${deleteModal.fileName} deleted successfully.`, type: 'success' });
            fetchDocuments(); // Refresh the list
            setExpandedDocId(null); // Close any expanded summary

        } catch (error) {
            setMessage({ text: `Deletion Error: ${error.message}`, type: 'error' });
            console.error('Deletion Error:', error);
        }
    };


    const messageClass = message.type ? `message-box ${message.type}` : 'message-box hidden';

    return (
        <div className="my-notes-container">
            <h2>My Notes & Summaries</h2>
            
            <FileDropZone onFileSelect={handleFileUpload} />

            <div className={messageClass}>
                {message.text}
            </div>

            <div className="notes-list card">
                <h4>Uploaded Documents</h4>
                {/* ... (Rest of component rendering remains the same) ... */}
                
                {/* --- DOCUMENT LIST RENDERING --- */}
                {!loading && uploadedFiles.length > 0 ? (
                    <ul className="doc-list-details">
                        {uploadedFiles.map(file => (
                            <React.Fragment key={file._id}>
                                {/* 1. Document Row */}
                                <li className="document-row">
                                    <span className="file-name">📄 {file.fileName}</span>
                                    <span className="upload-date">
                                        Uploaded: {new Date(file.uploadedDate).toLocaleDateString()}
                                    </span>
                                    <div className="action-buttons">
                                        <button 
                                            className="delete-doc-btn"
                                            onClick={() => setDeleteModal({ id: file._id, fileName: file.fileName })}
                                        >
                                            🗑️ Delete
                                        </button>
                                        <button 
                                            className="view-summary-btn"
                                            onClick={() => handleViewSummary(file._id, file.fileName)}
                                            disabled={isSummaryLoading && expandedDocId === file._id}
                                        >
                                            {isSummaryLoading && expandedDocId === file._id ? 'Processing...' : 
                                             expandedDocId === file._id ? 'Hide Summary' : 
                                             file.summary ? 'View Summary' : 'Generate Summary'}
                                        </button>
                                    </div>
                                </li>

                                {/* 2. Summary Panel (Conditionally rendered detail row) */}
                                {expandedDocId === file._id && (
                                    <li className="summary-detail-row">
                                        <div className="summary-content-wrapper">
                                            {isSummaryLoading && file._id === expandedDocId ? (
                                                <p>Generating summary...</p>
                                            ) : file.summary ? (
                                                <div 
                                                    dangerouslySetInnerHTML={{ __html: markdownToHtml(file.summary) }} 
                                                />
                                            ) : (
                                                 <p>Summary is being generated. Please wait and refresh.</p>
                                            )}
                                        </div>
                                    </li>
                                )}
                            </React.Fragment>
                        ))}
                    </ul>
                ) : (
                    !loading && <p className="empty-state">You haven't uploaded any notes yet.</p>
                )}
            </div>

            {/* --- DELETE CONFIRMATION MODAL --- */}
            {deleteModal && (
                <div className="delete-modal-overlay" onClick={() => setDeleteModal(null)}>
                    <div className="delete-modal" onClick={e => e.stopPropagation()}>
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to permanently delete the document: <strong>{deleteModal.fileName}</strong>?</p>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setDeleteModal(null)}>Cancel</button>
                            <button className="confirm-delete-btn" onClick={handleDeleteDocument}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyNotes;