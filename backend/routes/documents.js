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
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
    }
});

const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// GET /documents/ - List all uploaded documents
router.route('/').get((req, res) => {
    Document.find()
        .sort({ uploadedDate: -1 })
        .then(documents => res.json(documents))
        .catch(err => res.status(400).json('Error fetching documents: ' + err));
});

// POST /documents/upload - Upload a new document and save metadata
router.route('/upload').post(upload.single('document'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file selected or file type is invalid.' });
    }

    // NOTE: Frontend sends 'course' but backend receives 'courseName'. I've defaulted to 'General' to match model.
    const { course } = req.body;
    
    const newDocument = new Document({
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileMimeType: req.file.mimetype,
        courseName: course || 'General', // Use 'course' from req.body
        userId: 'default_user', // Keep consistent, or remove if not used
        summary: null,
    });

    newDocument.save()
        .then(doc => res.json({ message: 'Document uploaded successfully, awaiting summary.', document: doc }))
        .catch(err => res.status(400).json('Error saving document metadata: ' + err));
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

        const summaryText = await aiService.generateSummaryFromDocument(doc.filePath, doc.fileName);

        doc.summary = summaryText;
        await doc.save();

        res.json({ message: 'Summary generated successfully.', summary: summaryText });
    } catch (error) {
        console.error('AI Summarization Error:', error);
        res.status(500).json({ message: 'Failed to generate summary.', error: error.message });
    }
});

// <<< FIX: NEW DELETE ROUTE FOR /documents/:id >>>
router.route('/:id').delete(async (req, res) => {
    const docId = req.params.id;

    try {
        // 1. Find document metadata (to get the physical file path)
        const docToDelete = await Document.findById(docId);
        if (!docToDelete) {
            return res.status(404).json({ message: 'Document metadata not found in database.' });
        }

        // 2. Delete the physical file from the 'uploads' directory
        fs.unlink(docToDelete.filePath, (err) => {
            if (err) {
                // IMPORTANT: Log the file deletion error but don't stop the DB deletion.
                // It's better to have a leftover file than a broken database entry.
                console.warn(`[WARNING] Failed to delete physical file at ${docToDelete.filePath}:`, err);
            }
        });

        // 3. Delete the document metadata from MongoDB
        await Document.findByIdAndDelete(docId);
        
        // 4. Send successful JSON response (required by frontend)
        res.json({ message: 'Document and file deleted successfully.' });

    } catch (error) {
        console.error('Document Deletion Error:', error);
        // Send a proper 500 JSON response so the frontend doesn't throw the JSON parsing error
        res.status(500).json({ message: 'Failed to delete document.', error: error.message });
    }
});
// <<< END FIX >>>

module.exports = router;