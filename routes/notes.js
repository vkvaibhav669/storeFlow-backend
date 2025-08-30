const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const auth = require('../middleware/auth');

// All endpoints require authentication (adjust if you allow public listing unauthenticated)

// Create a new note
router.post('/create', auth, notesController.createNote);

// List all notes
router.get('/list', auth, notesController.listNotes);

// Get a single note by ID
router.get('/view/:id', auth, notesController.getNote);

// Update a note by ID
router.put('/update/:id', auth, notesController.updateNote);

// Delete a note by ID
router.delete('/delete/:id', auth, notesController.deleteNote);

// Share a note by ID
router.post('/share/:id', auth, notesController.shareNote);

module.exports = router;
