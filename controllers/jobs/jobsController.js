import {
  constructorQuery,
  getAllJobs,
  getCountJobs
} from "./jobsDbFunctions.js";

const getPaginatedJobs = async (req, res) => {
  const { page = 1, LIMIT = 5, 
    categoryFK, title, startLat, endLat, startLng, endLng, minPayment, maxPayment } = req.query;

  let categories = [];
  
  for (let i = 0; true; i++) {
    if (req.query[`category${i}`]) {
      categories.push(parseInt(req.query[`category${i}`]));
    } else {
      break;
    }
  }

  const bounds = (startLat && endLat && startLng && endLng) 
  ? {
      lats: { startLat: parseFloat(startLat), endLat: parseFloat(endLat) },
      lngs: { startLng: parseFloat(startLng), endLng: parseFloat(endLng) }
    }
  : null;

  try {
    const startIndex = (Number(page) - 1) * LIMIT;

    if (categoryFK || title || (startLat && endLat && startLng && endLng) || (minPayment && maxPayment)) {
      const constructorResult = await constructorQuery(startIndex, LIMIT, categories, title, bounds, (parseInt(minPayment) && parseInt(maxPayment)) ? { min: parseInt(minPayment), max: parseInt(maxPayment) } : null);
      console.log('constructor result: ', { page: parseInt(page), ...constructorResult });
      
      res.status(200).json({ page: parseInt(page), ...constructorResult });
    } else {
      const total = await getCountJobs();
      const jobs = await getAllJobs(startIndex, LIMIT);
      
      res.status(200).json({
        jobs,
        total,
        page: parseInt(page),
        lastPage: Math.ceil(total / LIMIT)
      });
    }

  } catch (error) {
    console.log(error);
    res.status(401).json({ error: error ? error.message : error });
  }
};

export default {
  getPaginatedJobs,
};
