const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');
const {
  cancel,
  getPlans,
  getSubscription,
  updateSubscription,
} = require('../controllers/subscriptionController');

const router = Router();
const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.get('/planes', asyncHandler(getPlans));
router.use(authMiddleware);
router.get('/suscripcion', asyncHandler(getSubscription));
router.put('/suscripcion', requireRole('ADMIN'), asyncHandler(updateSubscription));
router.post('/suscripcion/cancelar', requireRole('ADMIN'), asyncHandler(cancel));

module.exports = router;
