const ApprovalRequest = require('../models/ApprovalRequest');

const createApproval = async (req, res) => {
  try {
    const { title, description, resourceType, resourceId, approvers } = req.body;
    if (!approvers || !Array.isArray(approvers) || approvers.length === 0) {
      return res.status(400).json({ message: 'At least one approver is required' });
    }
    const requester = req.user._id;
    const decisions = approvers.map(a => ({ approver: a, decision: 'pending' }));
    const reqDoc = new ApprovalRequest({ title, description, resourceType, resourceId, requester, approvers, decisions });
    await reqDoc.save();
    res.status(201).json(reqDoc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const listApprovals = async (req, res) => {
  try {
    const userId = req.user._id;
    const { role, status } = req.query;
    const filters = {};
    if (status) filters.status = status;

    let docs;
    if (role === 'approver') {
      docs = await ApprovalRequest.find({ approvers: userId, ...filters }).sort('-createdAt');
    } else if (role === 'requester') {
      docs = await ApprovalRequest.find({ requester: userId, ...filters }).sort('-createdAt');
    } else {
      docs = await ApprovalRequest.find({
        $or: [{ requester: userId }, { approvers: userId }],
        ...filters
      }).sort('-createdAt');
    }
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getApproval = async (req, res) => {
  try {
    const doc = await ApprovalRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const uid = req.user._id.toString();
    if (doc.requester.toString() !== uid && !doc.approvers.map(a => a.toString()).includes(uid)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateApproval = async (req, res) => {
  try {
    const doc = await ApprovalRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    if (doc.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only requester can update' });
    }
    if (doc.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot update a finalized request' });
    }
    const { title, description, approvers } = req.body;
    if (title !== undefined) doc.title = title;
    if (description !== undefined) doc.description = description;
    if (approvers !== undefined) {
      doc.approvers = approvers;
      doc.decisions = approvers.map(a => ({ approver: a, decision: 'pending' }));
    }
    doc.recomputeStatus();
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const decideApproval = async (req, res) => {
  try {
    const { decision, comment } = req.body; // decision = 'accepted'|'rejected'
    if (!['accepted', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Invalid decision' });
    }
    const doc = await ApprovalRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    const uid = req.user._id.toString();
    const isApprover = doc.approvers.map(a => a.toString()).includes(uid);
    if (!isApprover) return res.status(403).json({ message: 'Only assigned approvers can decide' });

    const d = doc.decisions.find(x => x.approver.toString() === uid);
    if (d) {
      d.decision = decision;
      d.comment = comment || '';
      d.decidedAt = new Date();
    } else {
      doc.decisions.push({ approver: uid, decision, comment, decidedAt: new Date() });
    }

    doc.recomputeStatus();
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteApproval = async (req, res) => {
  try {
    const doc = await ApprovalRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });
    if (doc.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only requester can delete' });
    }
    if (doc.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot delete a finalized request' });
    }
    await doc.remove();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createApproval,
  listApprovals,
  getApproval,
  updateApproval,
  decideApproval,
  deleteApproval
};
