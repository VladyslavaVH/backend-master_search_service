import { Router } from 'express';
import publicController from '../controllers/public/publicController.js';

const router = Router();

router.route('/home/statistics').get(publicController.getHomePageStatistics);
router.route('/popular/categories').get(publicController.getPopularCategories);
router.route('/option/categories').get(publicController.getOptionCategories);
router.route('/option/currencies').get(publicController.getOptionCurrencies);
router.route('/check/phone').post(publicController.checkPhone);
router.route('/recent/jobs').get(publicController.getRecentJobs);
router.route('/jobs/masters/highestRated').get(publicController.getJobsMastersHighestRated);
router.route('/all/masters').get(publicController.getAllMasters);
router.route('/faqs').get(publicController.getFaqs);

export default router;
