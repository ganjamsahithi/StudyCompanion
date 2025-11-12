// backend/routes/documents.js
const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

let Document = require('../models/document.model');
const aiService = require('../services/ai.service');

// --- File Upload Setup (Multer) ---
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage with sanitized filename (preserve extension)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Keep original extension, replace spaces in name
        const safeName = file.originalname.replace(/\s+/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
    }
});

// Accept all file types: permissive fileFilter
const fileFilter = (req, file, cb) => {
    // Always accept — caller wanted all file formats allowed.
    // If you later want restrictions, add logic here.
    cb(null, true);
};

// Increase file size limit if needed (50 MB here)
const upload = multer({
    storage,
    fileFilter,
    // limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// GET /documents/ - List all uploaded documents
router.route('/').get((req, res) => {
    Document.find()
        .sort({ uploadedDate: -1 })
        .then(documents => res.json(documents))
        .catch(err => res.status(400).json({ message: 'Error fetching documents', error: err.message }));
});

// POST /documents/upload - Upload a new document and save metadata
router.route('/upload').post(upload.single('document'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file selected or file type is invalid.' });
    }

    // Accept both 'course' and 'courseName' from frontend
    const course = req.body.course || req.body.courseName;

    const newDocument = new Document({
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileMimeType: req.file.mimetype || 'application/octet-stream',
        courseName: course || 'General',
        userId: req.body.userId || 'default_user',
        summary: null,
    });

    newDocument.save()
        .then(doc => res.json({ message: 'Document uploaded successfully, awaiting summary.', document: doc }))
        .catch(err => res.status(400).json({ message: 'Error saving document metadata', error: err.message }));
});

// POST /documents/summarize/:id - Trigger AI summarization and update document
router.route('/summarize/:id').post(async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ message: 'Document not found.' });
        }
        
        if (doc.summary) {
            return res.json({ message: 'Summary already generated.', summary: doc.summary });
        }

        // Diagnostic log (minimal): which file path is being summarized
        console.log(`📄 Summarize requested for doc id ${req.params.id}, filePath: ${doc.filePath}, fileName: ${doc.fileName}`);

        // Check if file exists
        if (!fs.existsSync(doc.filePath)) {
            console.error(`❌ File not found at path: ${doc.filePath}`);
            return res.status(404).json({ 
                message: 'File not found on server. The file may have been deleted.', 
                error: `File path: ${doc.filePath}` 
            });
        }

        const summaryText = await aiService.generateSummaryFromDocument(doc.filePath, doc.fileName);

        if (!summaryText || summaryText.trim().length === 0) {
            throw new Error('AI returned an empty summary. Please try again.');
        }

        doc.summary = summaryText;
        await doc.save();

        console.log(`✅ Summary generated successfully for ${doc.fileName}`);
        res.json({ message: 'Summary generated successfully.', summary: summaryText });
    } catch (error) {
        console.error('❌ AI Summarization Error:', error);
        // Return detailed error message for debugging
        const errorMessage = error.message || 'Unknown error occurred during summarization';
        res.status(500).json({ 
            message: 'Failed to generate summary.', 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// DELETE /documents/:id - Delete document metadata and physical file
router.route('/:id').delete(async (req, res) => {
    const docId = req.params.id;

    try {
        // 1. Find document metadata (to get the physical file path)
        const docToDelete = await Document.findById(docId);
        if (!docToDelete) {
            return res.status(404).json({ message: 'Document metadata not found in database.' });
        }

        // 2. Delete the physical file from the 'uploads' directory (await so we know result)
        try {
            await fs.promises.unlink(docToDelete.filePath);
        } catch (fileErr) {
            // Don't fail the whole operation if the file wasn't found or couldn't be deleted,
            // but log the problem for debugging.
            console.warn(`[WARNING] Failed to delete physical file at ${docToDelete.filePath}:`, fileErr.message);
        }

        // 3. Delete the document metadata from MongoDB
        await Document.findByIdAndDelete(docId);
        
        // 4. Send successful JSON response
        res.json({ message: 'Document and file deleted successfully.' });

    } catch (error) {
        console.error('Document Deletion Error:', error);
        res.status(500).json({ message: 'Failed to delete document.', error: error.message });
    }
});

module.exports = router;
