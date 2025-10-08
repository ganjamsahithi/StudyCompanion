// src/components/MyNotes/MyNotes.jsx
import React, { useState, useEffect } from 'react';
import './MyNotes.css';

// Base URL for the backend API
const API_BASE_URL = 'http://localhost:5000/documents';

// Markdown to HTML Conversion
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

// File Drop Zone Component
const FileDropZone = ({ onFileSelect }) => {
    const [dragging, setDragging] = useState(false);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.name.match(/\.(pdf|docx|txt|doc)$/i)
        );
        if (files.length > 0) {
            onFileSelect({ target: { files: files } });
        }
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
    const [summaryContent, setSummaryContent] = useState(null);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_BASE_URL + '/');
            if (!response.ok) {
                throw new Error('Failed to fetch documents.');
            }
            const data = await response.json();
            setUploadedFiles(data);
        } catch (error) {
            setMessage({ text: 'Error loading documents.', type: 'error' });
            console.error('Fetch Documents Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleFileUpload = async (event) => {
        const files = event.target.files;
        if (files.length === 0) return;
        
        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('document', file);
        });

        setMessage({ text: 'Uploading file(s)...', type: 'info' });

        try {
            const response = await fetch(API_BASE_URL + '/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'File upload failed.');
            }

            setMessage({ text: `${files.length} file(s) successfully uploaded!`, type: 'success' });
            fetchDocuments();

        } catch (error) {
            setMessage({ text: `Upload Error: ${error.message}`, type: 'error' });
            console.error('Upload Error:', error);
        }
    };

    const handleViewSummary = async (docId, fileName) => {
        setSummaryContent(null);
        setIsSummaryLoading(true);
        setMessage({ text: `Generating summary for ${fileName}...`, type: 'info' });

        try {
            let response = await fetch(API_BASE_URL + `/summary/${docId}`, { method: 'GET' });
            let data = await response.json();
            
            if (!data.summary) {
                response = await fetch(API_BASE_URL + `/summarize/${docId}`, { method: 'POST' });
                data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'AI summarization failed.');
                }
            }

            setSummaryContent({ fileName: fileName, text: data.summary });
            setMessage({ text: 'Summary generated successfully.', type: 'success' });
            fetchDocuments();

        } catch (error) {
            setMessage({ text: `Summary Error: ${error.message}`, type: 'error' });
            console.error('Summary Generation Error:', error);
        } finally {
            setIsSummaryLoading(false);
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
                {loading && <p className="loading-state">Loading documents...</p>}

                {!loading && uploadedFiles.length > 0 ? (
                    <ul>
                        {uploadedFiles.map(file => (
                            <li key={file._id}>
                                <span className="file-name">📄 {file.fileName}</span>
                                <span className="upload-date">
                                    Uploaded: {new Date(file.uploadedDate).toLocaleDateString()}
                                </span>
                                <button 
                                    className="view-summary-btn"
                                    onClick={() => handleViewSummary(file._id, file.fileName)}
                                    disabled={isSummaryLoading}
                                >
                                    {isSummaryLoading && summaryContent && summaryContent.fileName === file.fileName ? (
                                        'Generating...'
                                    ) : file.summary ? (
                                        'View Summary'
                                    ) : (
                                        'Generate Summary'
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    !loading && <p className="empty-state">You haven't uploaded any notes yet.</p>
                )}
            </div>

            {/* GUARANTEED FIX: Using inline styles */}
            {summaryContent && (
                <div className="summary-modal-overlay" onClick={() => setSummaryContent(null)}>
                    <div className="summary-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Summary for: {summaryContent.fileName}</h3>
                            <button className="close-btn" onClick={() => setSummaryContent(null)}>&times;</button>
                        </div>
                        <div className="modal-content">
                            {/* INLINE STYLE GUARANTEE - Forces full width */}
                            <div 
                                style={{
                                    width: '100%',
                                    padding: '40px',
                                    boxSizing: 'border-box'
                                }}
                                dangerouslySetInnerHTML={{ __html: markdownToHtml(summaryContent.text) }} 
                            />
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MyNotes;