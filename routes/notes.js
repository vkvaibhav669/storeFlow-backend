const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const auth = require('../middleware/auth');

// All endpoints require authentication (adjust if you allow public listing unauthenticated)
router.post('/', auth, notesController.createNote);
router.get('/', auth, notesController.listNotes);
router.get('/:id', auth, notesController.getNote);
router.put('/:id', auth, notesController.updateNote);
router.delete('/:id', auth, notesController.deleteNote);
router.post('/:id/share', auth, notesController.shareNote);

module.exports = router;
