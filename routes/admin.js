import { Router } from 'express';
import { verifyRole } from '../middleware/verify.js';
import ROLE from '../config/roles.js';
import adminController from '../controllers/admin/adminController.js';

const router = Router();

router.route('/panel', verifyRole(ROLE.ADMIN))
.get(adminController.getAdminPanel);

router.route('/unverified/masters', verifyRole(ROLE.ADMIN))
.get(adminController.getUnverifiedMasters);

router.route('/full/master/info', verifyRole(ROLE.ADMIN))
.get(adminController.getFullMasterInfo);

router.route('/verify/master', verifyRole(ROLE.ADMIN))
.put(adminController.verifyMaster);

router.route('/change/faqs', verifyRole(ROLE.ADMIN))
.post(adminController.changeFaqs);

router.route('/create/new/category', verifyRole(ROLE.ADMIN))
.post(adminController.createNewCategory);

export default router;
