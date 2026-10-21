const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { login, me, register } = require('../controllers/authController');

const router = Router();
const asyncHandler = handler => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', authMiddleware, asyncHandler(me));

module.exports = router;
