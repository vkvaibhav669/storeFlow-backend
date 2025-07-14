// routes/approvalRequestRoutes.js
const express = require('express');
const router = express.Router();
const ApprovalRequest = require('../models/ApprovalRequest'); // Import ApprovalRequest model
const { protect, authorize } = require('../middleware/auth'); // Import authentication middleware

/**
 * @route POST /api/approval-requests
 * @description Create a new approval request
 * @access Private/Member (or specific roles that can create requests)
 */
//router.post('/', protect, async (req, res) => {
router.post('/',  async (req, res) => {
  // Automatically set requestorId and requestorName from authenticated user
  req.body.requestorId = req.user._id;
  req.body.requestorName = req.user.name;

  try {
    const newApprovalRequest = new ApprovalRequest(req.body);
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
//router.get('/', protect, async (req, res) => {
  router.get('/',  async (req, res) => {
  try {
    // Admins/SuperAdmins can see all, Members can only see their own requests or those they are approvers for
    let query = {};
    if (req.user.role === 'Member') {
      query = {
        $or: [
          { requestorId: req.user._id },
          { approverId: req.user._id }
        ]
      };
    }

    const approvalRequests = await ApprovalRequest.find(query)
      .populate('requestorId', 'name email') // Populate requestor details
      .populate('approverId', 'name email') // Populate approver details
      .populate('projectId', 'name location') // Populate project details
      .populate('approvalComments.authorId', 'name email'); // Populate comment authors

    res.status(200).json(approvalRequests);
  } catch (error) {
    console.error('Error fetching approval requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/approval-requests/:id
 * @description Get a single approval request by ID
 * @access Private
 */
//router.get('/:id', protect, async (req, res) => {
  router.get('/:id', async (req, res) => {
  try {
    const approvalRequest = await ApprovalRequest.findById(req.params.id)
      .populate('requestorId', 'name email')
      .populate('approverId', 'name email')
      .populate('projectId', 'name location')
      .populate('approvalComments.authorId', 'name email');

    if (!approvalRequest) {
      return res.status(404).json({ message: 'Approval request not found' });
    }

    // Authorization check: Admin/SuperAdmin can see any; Member can only see if they are requestor or approver
    if (req.user.role === 'Admin' || req.user.role === 'SuperAdmin' ||
        req.user._id.equals(approvalRequest.requestorId) ||
        req.user._id.equals(approvalRequest.approverId)) {
      res.status(200).json(approvalRequest);
    } else {
      res.status(403).json({ message: 'Not authorized to view this approval request' });
    }
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
//router.put('/:id', protect, async (req, res) => {
  router.put('/:id', async (req, res) => {
  try {
    let approvalRequest = await ApprovalRequest.findById(req.params.id);

    if (!approvalRequest) {
      return res.status(404).json({ message: 'Approval request not found' });
    }

    // Authorization check: Only the designated approver, Admin, or SuperAdmin can update status
    const isAuthorizedToUpdate = req.user.role === 'Admin' ||
                                 req.user.role === 'SuperAdmin' ||
                                 req.user._id.equals(approvalRequest.approverId);

    if (!isAuthorizedToUpdate) {
      return res.status(403).json({ message: 'Not authorized to update this approval request' });
    }

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
    // Example for adding a new top-level comment:
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
//router.delete('/:id', protect, authorize('Admin', 'SuperAdmin'), async (req, res) => {
  router.delete('/:id',  async (req, res) => {
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
