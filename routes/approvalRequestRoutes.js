// routes/approvalRequestRoutes.js
const express = require('express');
const router = express.Router();
const ApprovalRequest = require('../models/ApprovalRequest'); // Import ApprovalRequest model
const { protect, authorize } = require('../middleware/auth'); // Import authentication middleware
const mongoose = require('mongoose');

// Precompute commonly used schema path references to avoid ReferenceError
const approvalCommentsPath = ApprovalRequest.schema.path('approvalComments');

/**
 * @route POST /api/approval-requests
 * @description Create a new approval request
 * @access Private/Member (or specific roles that can create requests)
 */
// Original: router.post('/', protect, async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.post('/', async (req, res) => {
  try {
    let { requester, requestorId, requestorName, title, status, ...rest } = req.body;

    // normalize requester id
    let requesterId = requester || requestorId || req.body.requesterId || req.body.requestorId;
    if (requesterId && typeof requesterId === 'object') {
      requesterId = requesterId.id || requesterId._id || requesterId.requesterId || requesterId.requestorId;
    }

    if (!title) return res.status(400).json({ message: 'title is required' });
    if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
      return res.status(400).json({ message: 'requester/requestorId is required and must be a valid ObjectId' });
    }

    // Validate / normalize status against schema enum
    const statusEnum = ApprovalRequest.schema.path('status')?.enumValues || [];
    if (status) {
      if (!statusEnum.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value', allowed: statusEnum });
      }
    } else {
      // if client didn't provide status, use schema enum first value (or let mongoose default)
      status = statusEnum.length ? statusEnum[0] : undefined;
    }

    const payload = {
      requester: new mongoose.Types.ObjectId(requesterId),
      requesterName: requestorName || req.body.requesterName || (typeof requester === 'object' && (requester.name || requester.requestorName)) || undefined,
      title,
      status,
      ...rest
    };

    const newApprovalRequest = new ApprovalRequest(payload);
    const savedApprovalRequest = await newApprovalRequest.save();
    res.status(201).json(savedApprovalRequest);
  } catch (error) {
    console.error('Error creating approval request:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/approval-requests
 * @description Get all approval requests
 * @access Private
 */
// Original: router.get('/', protect, async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.get('/', async (req, res) => {
    // Note: Role-based filtering is disabled for testing
    // if (req.user.role === 'Member') {
  try {
    // For testing - fetch all approval requests without role-based filtering
    let query = {};
    /*
    if (req.user.role === 'Member') {
      query = {
        $or: [
          { requestorId: req.user._id },
          { approverId: req.user._id }
        ]
      };
    }
    */

    // safe conditional populate for list endpoint
    let queryBuilder = ApprovalRequest.find(query);

    if (ApprovalRequest.schema.path('requester')) {
      queryBuilder = queryBuilder.populate('requester', 'name email');
    }
    if (ApprovalRequest.schema.path('approverId')) {
      queryBuilder = queryBuilder.populate('approverId', 'name email');
    } else if (ApprovalRequest.schema.path('approver')) {
      queryBuilder = queryBuilder.populate('approver', 'name email');
    }
    if (ApprovalRequest.schema.path('projectId')) {
      queryBuilder = queryBuilder.populate('projectId', 'name location');
    }
    // populate nested comment authorId if present in schema
    if (approvalCommentsPath && approvalCommentsPath.schema && approvalCommentsPath.schema.path('authorId')) {
      queryBuilder = queryBuilder.populate('approvalComments.authorId', 'name email');
    }

    const approvalRequests = await queryBuilder.exec();
    res.status(200).json(approvalRequests);
  } catch (error) {
    console.error('Error fetching approval requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/approval-requests/mine
 * @description Get approval requests submitted by the authenticated user
 * @access Private
 */
router.get('/mine',  async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { status, page = 1, limit = 25, sortBy = 'createdAt', sortDir = 'desc' } = req.query;
    const filter = { requester: userId };
    if (status) filter.status = status;

    let queryBuilder = ApprovalRequest.find(filter)
      .sort({ [sortBy]: sortDir === 'asc' ? 1 : -1 })
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .limit(parseInt(limit, 10));

    if (ApprovalRequest.schema.path('requester')) {
      queryBuilder = queryBuilder.populate('requester', 'name email');
    }
    if (ApprovalRequest.schema.path('approverId')) {
      queryBuilder = queryBuilder.populate('approverId', 'name email');
    } else if (ApprovalRequest.schema.path('approver')) {
      queryBuilder = queryBuilder.populate('approver', 'name email');
    }
    if (ApprovalRequest.schema.path('projectId')) {
      queryBuilder = queryBuilder.populate('projectId', 'name location');
    }
    const approvalCommentsPath = ApprovalRequest.schema.path('approvalComments');
    if (approvalCommentsPath && approvalCommentsPath.schema && approvalCommentsPath.schema.path('authorId')) {
      queryBuilder = queryBuilder.populate('approvalComments.authorId', 'name email');
    }

    const requests = await queryBuilder.exec();
    const total = await ApprovalRequest.countDocuments(filter);
    res.status(200).json({
      meta: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) },
      data: requests
    });
  } catch (error) {
    console.error('Error fetching user submitted approval requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/approval-requests/:id
 * @description Get a single approval request by ID
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    // safe conditional populate for single endpoint
    let singleQuery = ApprovalRequest.findById(req.params.id);

    if (ApprovalRequest.schema.path('requester')) {
      singleQuery = singleQuery.populate('requester', 'name email');
    }
    if (ApprovalRequest.schema.path('approverId')) {
      singleQuery = singleQuery.populate('approverId', 'name email');
    } else if (ApprovalRequest.schema.path('approver')) {
      singleQuery = singleQuery.populate('approver', 'name email');
    }
    if (ApprovalRequest.schema.path('projectId')) {
      singleQuery = singleQuery.populate('projectId', 'name location');
    }
    const approvalCommentsPath = ApprovalRequest.schema.path('approvalComments');
    if (approvalCommentsPath && approvalCommentsPath.schema && approvalCommentsPath.schema.path('authorId')) {
      singleQuery = singleQuery.populate('approvalComments.authorId', 'name email');
    }

    const approvalRequest = await singleQuery.exec();
    if (!approvalRequest) return res.status(404).json({ message: 'Approval request not found' });

    res.status(200).json(approvalRequest);
  } catch (error) {
    console.error('Error fetching approval request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route PUT /api/approval-requests/:id
 * @description Update an approval request by ID
 * @access Private/Approver or Admin
 */
// Original: router.put('/:id', protect, async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.put('/:id', async (req, res) => {
  try {
    let approvalRequest = await ApprovalRequest.findById(req.params.id);

    if (!approvalRequest) {
      return res.status(404).json({ message: 'Approval request not found' });
    }

    // For testing - authorization check disabled
    /*
    const isAuthorizedToUpdate = req.user.role === 'Admin' ||
                                 req.user.role === 'SuperAdmin' ||
                                 req.user._id.equals(approvalRequest.approverId);

    if (!isAuthorizedToUpdate) {
      return res.status(403).json({ message: 'Not authorized to update this approval request' });
    }
    */

    // Only allow specific fields to be updated by approvers/admins (e.g., status, comments)
    // Requestors might be able to withdraw
    const allowedUpdates = ['status', 'approvalComments', 'title', 'details', 'projectId', 'projectName', 'requestingDepartment'];
    const updates = {};
    for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
            updates[key] = req.body[key];
        }
    }

    // Handle nested updates for comments (e.g., adding a new top-level comment)
    // For simplicity, this example assumes whole 'approvalComments' array replacement or specific update.
    // For adding a new comment or reply, you would need dedicated sub-routes.
    // For testing - user context disabled for new comments
    /*
    if (req.body.newCommentText) {
        const newComment = {
            authorId: req.user._id,
            authorName: req.user.name,
            text: req.body.newCommentText,
            timestamp: new Date()
        };
        // Mongoose will automatically generate _id for embedded documents if not provided
        approvalRequest.approvalComments.push(newComment);
        await approvalRequest.save(); // Save to apply the push
        // Then proceed with other updates if any
    }
    */

    // Update the request with the allowed fields
    const updatedApprovalRequest = await ApprovalRequest.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true } // Return the updated document and run Mongoose validators
    );

    res.status(200).json(updatedApprovalRequest);
  } catch (error) {
    console.error('Error updating approval request:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route DELETE /api/approval-requests/:id
 * @description Delete an approval request by ID
 * @access Private/Admin
 */
// Original: router.delete('/:id', protect, authorize('Admin', 'SuperAdmin'), async (req, res) => {
// For testing - comment above and use below (remove protect middleware)
router.delete('/:id', async (req, res) => {
  try {
    const deletedApprovalRequest = await ApprovalRequest.findByIdAndDelete(req.params.id);

    if (!deletedApprovalRequest) {
      return res.status(404).json({ message: 'Approval request not found' });
    }
    res.status(200).json({ message: 'Approval request removed' });
  } catch (error) {
    console.error('Error deleting approval request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
