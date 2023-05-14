import { Router } from 'express';
import authController from '../controllers/auth/authController.js';

const router = Router();

router.route('/login').post(authController.login);
router.route('/register').post(authController.register);
router.route('/reset/password').post(authController.resetPassword);

router.route('/refresh').get(authController.refresh);
router.route('/logout').delete(authController.logout);

export default router;
