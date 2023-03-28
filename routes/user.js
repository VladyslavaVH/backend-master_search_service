import { Router } from 'express';
import filesPayloadExists from './../middleware/filesPayloadExists.js';
import fileExtLimiter from '../middleware/fileExtLimiter.js';
import fileSizeLimiter from '../middleware/fileSizeLimiter.js';
import userController from '../controllers/user/userController.js';

const router = Router();

router.route('/notifications')
.get(userController.getNotifications);

router.route('/messages')
.get(userController.getMessages);

router.route('/change/avatar',
filesPayloadExists,
fileExtLimiter(['.png', '.jpg', '.jpeg', '.jfif']),
fileSizeLimiter)
.post(userController.changeAvatar);

export default router;
