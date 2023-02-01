import { Router } from 'express';
import publicController from '../controllers/public/publicController.js';

const router = Router();

router.route('/jobs/masters/count').get(publicController.getJobsMastersCount);
router.route('/popular/categories').get(publicController.getPopularCategories);
router.route('/option/categories').get(publicController.getOptionCategories);
router.route('/recent/jobs').get(publicController.getRecentJobs);
router.route('/jobs/masters/highestRated').get(publicController.getJobsMastersHighestRated);
router.route('/all/masters').get(publicController.getAllMasters);
router.route('/faqs').get(publicController.getFaqs);

export default router;
