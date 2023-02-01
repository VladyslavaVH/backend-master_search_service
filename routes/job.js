import { Router } from 'express';
import { verifyRole } from '../middleware/verify.js';
import ROLE from '../config/roles.js';
import filesPayloadExists from '../middleware/filesPayloadExists.js';
import fileExtLimiter from '../middleware/fileExtLimiter.js';
import fileSizeLimiter from '../middleware/fileSizeLimiter.js';
import jobController from '../controllers/job/jobController.js';

const router = Router();

router.route('/',
filesPayloadExists,
fileExtLimiter(['.png', '.jpg', '.jpeg']),
fileSizeLimiter,
verifyRole(ROLE.CLIENT)
)
.post(jobController.createJob);

router.route('/', verifyRole(ROLE.CLIENT))
.delete(jobController.deleteJob);

export default router;