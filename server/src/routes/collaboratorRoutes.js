const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/roleMiddleware');
const controller = require('../controllers/collaboratorController');

const router = Router();
const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

router.post('/invitaciones/:token/aceptar', asyncHandler(controller.accept));
router.use(authMiddleware);
router.use(requireRole('ADMIN'));
router.get('/colaboradores', asyncHandler(controller.list));
router.post('/colaboradores/invitaciones', asyncHandler(controller.invite));
router.patch('/colaboradores/:id/rol', asyncHandler(controller.updateRole));
router.delete('/colaboradores/:id', asyncHandler(controller.remove));
router.delete('/colaboradores/invitaciones/:id', asyncHandler(controller.cancel));

module.exports = router;
