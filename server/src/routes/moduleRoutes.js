const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');
const controller = require('../controllers/moduleController');

const router = Router();
const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.use(authMiddleware);

router.get('/productos', asyncHandler(controller.listProducts));
router.post('/productos', requireRole('ADMIN'), asyncHandler(controller.createProduct));
router.put('/productos/:id', requireRole('ADMIN'), asyncHandler(controller.updateProduct));
router.delete('/productos/:id', requireRole('ADMIN'), asyncHandler(controller.deleteProduct));

router.get('/auditoria', asyncHandler(controller.listAudit));
router.get('/dashboard/resumen', asyncHandler(controller.getCompanySummary));

module.exports = router;
