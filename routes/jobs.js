import { Router } from 'express';
import { verifyRole } from '../middleware/verify.js';
import ROLE from '../config/roles.js';
import jobsController from '../controllers/jobs/jobsController.js';

const router = Router();

router.route('/', verifyRole(ROLE.MASTER))
.get(jobsController.getPaginatedJobs);

export default router;