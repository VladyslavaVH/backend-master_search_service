import { Router } from 'express';
import { verifyRole } from '../middleware/verify.js';
import masterController from '../controllers/master/masterController.js';
import ROLE from './../config/roles.js';

const router = Router();

router.route('/statistics', verifyRole(ROLE.MASTER))
.get(masterController.getMasterStatistics);

router.route('/permission/check', verifyRole(ROLE.MASTER))
.get(masterController.getPermissionCheck);

router.route('/apply', verifyRole(ROLE.MASTER))
.put(masterController.applyJob);

router.route('/change/profile/settings', verifyRole(ROLE.MASTER))
.post(masterController.changeProfileSettings);

router.route('/upload/documents', verifyRole(ROLE.MASTER))
.post(masterController.uploadDocuments);

router.route('/check/job/apply', verifyRole(ROLE.MASTER))
.get(masterController.checkJob);

router.route('/conversations', verifyRole(ROLE.MASTER))
.get(masterController.getAllMasterConversations);

export default router;
