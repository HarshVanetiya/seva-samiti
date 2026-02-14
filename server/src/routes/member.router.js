const express = require('express');
const router = express.Router();
const {
    createMember,
    getAllMembers,
    getMemberById,
    updateMember,
    deleteMember,
} = require('../controllers/member.controller');
const { authenticate } = require('../middleware/auth');

// All member routes require authentication
router.use(authenticate);

// Member CRUD routes
router.post('/', createMember);
router.get('/', getAllMembers);
router.get('/:id', getMemberById);
router.put('/:id', updateMember);
router.delete('/:id', deleteMember);

module.exports = router;
