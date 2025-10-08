const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// IMPORTANT: Assume these helper libraries are installed and functional
const Document = require('../models/document.model');
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
    Document.find()
        .sort({ uploadedDate: -1 })
        .then(documents => res.json(documents))
        .catch(err => res.status(400).json('Error fetching documents: ' + err));
});

// POST /documents/upload - Upload a new document and save metadata
router.route('/upload').post(upload.single('document'), (req, res) => {
    if (!req.file) {
        const fileError = req.fileValidationError || 'No file selected.';
        return res.status(400).json({ message: `Error: ${fileError}` });
    }

    const fileName = req.file.originalname;
    const filePath = req.file.path;
    const fileMimeType = req.file.mimetype;
    const userId = req.body.userId || 'default_user'; 
    const course = req.body.course || 'General Study'; 

    const newDocument = new Document({
        fileName,
        filePath,
        fileMimeType,
        userId,
        course,
        summary: null,
    });

    newDocument.save()
        .then(doc => res.json({ message: 'Document uploaded successfully, awaiting summary.', document: doc }))
        .catch(err => {
            fs.unlink(filePath, (err) => { if (err) console.error("Error cleaning up file:", err); });
            res.status(400).json('Error saving document metadata: ' + err);
        });
});

// backend/routes/documents.js (Focusing on the POST /summarize/:id route)

// ... (Other routes and setup remain the same) ...

// POST /documents/summarize/:id - Trigger AI summarization and update document
router.route('/summarize/:id').post(async (req, res) => {
    try {
        const docId = req.params.id;
        const doc = await Document.findById(docId);

        if (!doc) {
            return res.status(404).json({ message: 'Document not found.' });
        }
        
        // If summary already exists, return it immediately
        if (doc.summary) {
            return res.json({ message: 'Summary already generated.', summary: doc.summary });
        }

        // 1. Generate Summary Text (Assuming aiService handles file reading and returns clean text)
        const { summaryText, error } = await aiService.generateSummaryFromDocument(doc.filePath, doc.fileName);

        if (error) {
            return res.status(400).json({ message: error, error: error });
        }
        
        // 2. CRITICAL FIX: Use findByIdAndUpdate to perform a single, atomic update
        // This is often more reliable than doc.summary = X; doc.save()
        const updatedDoc = await Document.findByIdAndUpdate(
            docId, 
            { summary: summaryText },
            { new: true, runValidators: true } // Return the new doc and enforce schema
        );

        if (!updatedDoc) {
             // This indicates a race condition or failed update
             throw new Error("Database update failed after AI process.");
        }

        // 3. Return the generated summary
        res.status(200).json({ message: 'Summary generated successfully.', summary: updatedDoc.summary });

    } catch (error) {
        // CATCH BLOCK: Guarantees a JSON response, preventing the <!DOCTYPE> error
        console.error('AI Summarization/Route Crash Error:', error);
        
        // If the error is from Mongoose (e.g., CastError, validation failure), 
        // we return a 400 or 500 status with a JSON body.
        res.status(500).json({ 
            message: 'Internal Server Error during summarization. Check backend console.', 
            error: error.message || String(error) 
        });
    }
});

// GET /documents/summary/:id - Get a specific document's summary
router.route('/summary/:id').get((req, res) => {
    Document.findById(req.params.id)
        .then(doc => {
            if (!doc) {
                return res.status(404).json('Document not found.');
            }
            res.json({ fileName: doc.fileName, summary: doc.summary });
        })
        .catch(err => res.status(400).json('Error fetching summary: ' + err));
});


// --- NEW ROUTE: DELETE /documents/:id (RESTful Path) ---
router.route('/:id').delete(async (req, res) => {
    try {
        const docId = req.params.id;

        // 1. Find the document to get the file path before deletion
        const doc = await Document.findById(docId);
        
        if (!doc) {
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
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid document ID format.', error: error.message });
        }
        res.status(500).json({ message: 'Deletion failed on the server.', error: error.message });
    }
});


module.exports = router;