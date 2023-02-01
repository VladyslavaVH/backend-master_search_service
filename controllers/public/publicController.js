import fs from 'fs';
import { 
    getJobsMastersCountDB,
    getPopularCategoriesDB,
    getOptionCategoriesDB,
    getRecentJobsDB,
    getHighestRatedMastersDB,
    getAllMastersDB,
} from './publicDbFunctions.js';

const getJobsMastersCount = async (req, res) => {
    res.status(200).send(await getJobsMastersCountDB() || { jobsCount: 0, mastersCount: 0 });
};

const getPopularCategories = async (req, res) => {
    res.status(200).send(await getPopularCategoriesDB() || []);
};

const getOptionCategories = async (req, res) => {
    res.status(200).send(await getOptionCategoriesDB() || []);
};

const getRecentJobs = async (req, res) => {
    res.status(200).send(await getRecentJobsDB() || []);
};

const getJobsMastersHighestRated = async (req, res) => {
    res.status(200).send(await getHighestRatedMastersDB() || []);
};

const getAllMasters = async (req, res) => {
    res.status(200).send(await getAllMastersDB() || []);
};

const getFaqs = async (req, res) => {
    res.status(200).send(JSON.parse(fs.readFileSync('faqs.json')) || []);
};

export default {
    getJobsMastersCount,
    getPopularCategories,
    getOptionCategories,
    getRecentJobs,
    getJobsMastersHighestRated,
    getAllMasters,
    getFaqs
};