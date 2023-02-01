import { Router } from 'express';
import masterInfoController from '../controllers/masterInfo/masterInfoController.js';

const router = Router();

router.route('/').get(masterInfoController.getMaster);
router.route('/comments').get(masterInfoController.getMasterComments);
router.route('/categories').get(masterInfoController.getMasterCategories);
router.route('/rehired/job/count').get(masterInfoController.getMasterRehiredJobCount);
router.route('/ratings').get(masterInfoController.getMastersRatings);

export default router;
