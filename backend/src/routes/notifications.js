const express = require('express');
const prisma = require('../utils/prisma');
const { success, error } = require('../utils/response');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/v1/notifications
 * @desc Get notifications for current user
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    });
    return success(res, { notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

/**
 * @route PATCH /api/v1/notifications/:id/read
 * @desc Mark notification as read
 */
router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!notification) return error(res, 'Notification not found', 404);
    
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    return success(res, { message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
});

/**
 * @route PATCH /api/v1/notifications/read-all
 * @desc Mark all notifications as read
 */
router.patch('/read-all', requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    return success(res, { message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
