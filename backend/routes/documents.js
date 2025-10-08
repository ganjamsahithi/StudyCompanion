const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// IMPORTANT: Assume these helper libraries are installed (e.g., npm install @google/genai mongoose)
let Document = require('../models/document.model');
const aiService = require('../services/ai.service'); 

// --- File Upload Setup (Multer) ---

// Define the absolute path for file storage
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
    }
});

// Filter file types
const fileFilter = (req, file, cb) => {
    // Allows PDF, DOCX, TXT. This is a basic filter; MIME types are more reliable.
    const allowedExtensions = /\.(pdf|docx|txt|doc)$/i; 
    const isAllowed = allowedExtensions.test(file.originalname);
    
    if (isAllowed) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOCX, and TXT are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 10 }, // Limit to 10MB
    fileFilter: fileFilter
});


// ============================================
// --- API Endpoints ---
// ============================================

// GET /documents/ - List all uploaded documents
router.route('/').get((req, res) => {
    // Ensure the data being returned matches the frontend's expected schema (file.fileName, file.uploadedDate, file._id, file.summary)
    Document.find()
        .sort({ uploadedDate: -1 })
        .then(documents => res.json(documents))
        .catch(err => res.status(400).json('Error fetching documents: ' + err));
});

// POST /documents/upload - Upload a new document and save metadata
router.route('/upload').post(upload.single('document'), (req, res) => {
    if (!req.file) {
        // Multer error handling (e.g., file limit exceeded or type rejected)
        const fileError = req.fileValidationError || 'No file selected.';
        return res.status(400).json({ message: `Error: ${fileError}` });
    }

    const fileName = req.file.originalname;
    const filePath = req.file.path;
    const fileMimeType = req.file.mimetype;
    const userId = req.body.userId || 'default_user'; 
    // Assuming 'course' is sent via form data (req.body.course)
    const course = req.body.course || 'General Study'; 

    const newDocument = new Document({
        fileName,
        filePath,
        fileMimeType,
        userId,
        course,
        summary: null, // Summary is null initially
        // Note: Raw text extraction should happen in aiService later, not here.
    });

    newDocument.save()
        .then(doc => res.json({ message: 'Document uploaded successfully, awaiting summary.', document: doc }))
        .catch(err => {
            // Clean up file if database saving fails
            fs.unlink(filePath, (err) => { if (err) console.error("Error cleaning up file:", err); });
            res.status(400).json('Error saving document metadata: ' + err);
        });
});

// POST /documents/summarize/:id - Trigger AI summarization and update document
router.route('/summarize/:id').post(async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);

        if (!doc) {
            return res.status(404).json({ message: 'Document not found.' });
        }
        
        // If summary already exists, return it immediately to save AI cost
        if (doc.summary) {
            return res.json({ 
                message: 'Summary already generated.',
                summary: doc.summary 
            });
        }

        // 1. Trigger the AI Service to handle file type conversion, read, and summarize
        const { summaryText, error } = await aiService.generateSummaryFromDocument(doc.filePath, doc.fileName);

        if (error) {
            // This is the error seen on the frontend for corrupted/binary files
            return res.status(400).json({ 
                message: 'File processing failed.', 
                error: error 
            });
        }
        
        // 2. Save the generated summary back to the database
        doc.summary = summaryText;
        await doc.save();

        res.json({ message: 'Summary generated successfully.', summary: summaryText });

    } catch (error) {
        console.error('AI Summarization/File Error:', error);
        res.status(500).json({ message: 'Failed to generate summary due to server error.', error: error.message });
    }
});


// GET /documents/summary/:id - Get a specific document's summary
router.route('/summary/:id').get((req, res) => {
    // This route is called by the frontend to check if a summary exists before attempting generation
    Document.findById(req.params.id)
        .then(doc => {
            if (!doc) {
                return res.status(404).json('Document not found.');
            }
            res.json({ fileName: doc.fileName, summary: doc.summary });
        })
        .catch(err => res.status(400).json('Error fetching summary: ' + err));
});


/// --- NEW ROUTE: DELETE /documents/:id (FIXED RESTful Path) ---
// This handles the request: DELETE http://localhost:8000/documents/DOC_ID
router.route('/:id').delete(async (req, res) => {
    try {
        const docId = req.params.id;

        // 1. Find the document to get the file path before deletion
        const doc = await Document.findById(docId);
        
        if (!doc) {
            // Send success message even if not found, because the desired state (deleted) is achieved.
            return res.status(200).json({ message: 'Document not found, deletion status verified.' });
        }
        
        const filePath = doc.filePath;

        // 2. Delete the record from the database
        const result = await Document.findByIdAndDelete(docId);
        
        if (!result) {
            return res.status(500).json({ message: 'Database record deletion failed.' });
        }

        // 3. Delete the actual file from the local 'uploads' directory
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(`Warning: Failed to delete local file at ${filePath}. Database is OK.`, err);
            }
        });

        // 4. Success response
        res.status(200).json({ message: 'Document and file deleted successfully.' });

    } catch (error) {
        console.error('Document Deletion Error:', error);
        // Specifically check for Mongoose/MongoDB ID errors
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid document ID format.', error: error.message });
        }
        res.status(500).json({ message: 'Deletion failed on the server.', error: error.message });
    }
});


module.exports = router;