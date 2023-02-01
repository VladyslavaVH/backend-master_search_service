import { Router } from 'express';
import jobInfoController from '../controllers/jobInfo/jobInfoController.js';

const router = Router();

router.route('/').get(jobInfoController.getJob);
router.route('/photos').get(jobInfoController.getJobPhotos);

export default router;
