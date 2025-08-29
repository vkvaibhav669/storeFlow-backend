const Note = require('../models/Note');

const createNote = async (req, res) => {
  try {
    const { title, content, shareType, sharedWith } = req.body;
    const owner = req.user._id;
    const note = new Note({ title, content, owner, shareType, sharedWith });
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listNotes = async (req, res) => {
  try {
    const userId = req.user._id;
    const notes = await Note.find({
      $or: [
        { shareType: 'public' },
        { owner: userId },
        { $and: [ { shareType: 'shared' }, { sharedWith: userId } ] },
      ]
    }).sort('-updatedAt');
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Not found' });

    const userId = req.user._id.toString();
    const ownerId = note.owner.toString();
    const isSharedWith = note.sharedWith && note.sharedWith.map(id => id.toString()).includes(userId);

    if (note.shareType === 'private' && ownerId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (note.shareType === 'shared' && ownerId !== userId && !isSharedWith) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Not found' });
    if (note.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only owner can update' });
    }
    const { title, content, shareType, sharedWith } = req.body;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (shareType !== undefined) note.shareType = shareType;
    if (sharedWith !== undefined) note.sharedWith = sharedWith;
    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Not found' });
    if (note.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only owner can delete' });
    }
    await note.remove();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const shareNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Not found' });
    if (note.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only owner can change sharing' });
    }
    const { shareType, sharedWith } = req.body;
    if (shareType) note.shareType = shareType;
    if (sharedWith) note.sharedWith = sharedWith;
    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createNote,
  listNotes,
  getNote,
  updateNote,
  deleteNote,
  shareNote,
};
