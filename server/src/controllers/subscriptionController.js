const {
  cancelSubscription,
  changePlan,
  findSubscriptionByCompanyId,
  listPlans,
} = require('../services/subscriptionService');

async function getPlans(req, res) {
  return res.status(200).json({ success: true, data: await listPlans() });
}

async function getSubscription(req, res) {
  const subscription = await findSubscriptionByCompanyId(req.user.empresa.id);
  if (!subscription) {
    return res.status(404).json({ success: false, message: 'La empresa no tiene una suscripción.' });
  }
  return res.status(200).json({ success: true, data: subscription });
}

async function updateSubscription(req, res) {
  const planCodigo = typeof req.body?.planCodigo === 'string'
    ? req.body.planCodigo.trim().toUpperCase()
    : '';
  if (!planCodigo) {
    return res.status(400).json({ success: false, message: 'El código del plan es obligatorio.' });
  }

  try {
    const subscription = await changePlan(req.user.empresa.id, planCodigo);
    return res.status(200).json({
      success: true,
      message: 'Plan actualizado correctamente.',
      data: subscription,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    throw error;
  }
}

async function cancel(req, res) {
  const subscription = await cancelSubscription(req.user.empresa.id);
  if (!subscription) {
    return res.status(404).json({ success: false, message: 'No existe una suscripción activa.' });
  }
  return res.status(200).json({
    success: true,
    message: 'Suscripción cancelada correctamente.',
    data: subscription,
  });
}

module.exports = { cancel, getPlans, getSubscription, updateSubscription };
