import pool from "../../config/dbConfig.js";

export async function getHomePageStatisticsDB() {
    const [[[result]]] = await pool.query(`call getHomePageStatistics()`, []);

    return result || { jobsCount: 0, mastersCount: 0, usersCount: 0 };
};

export async function getPopularCategoriesDB() {
    const [[result]] = await pool.query(`call getPopularCategories()`, []);

    return result || [];
};

export async function getOptionCategoriesDB() {
    const [categories] = await pool.query(`
    select id, name as 'category'
    from categories;`, []);

    return categories || [];
};

export async function getOptionCurrenciesDB() {
    const [categories] = await pool.query(`
    select id, name as 'currency'
    from currencies;`, []);

    return categories || [];
};

export async function getRecentJobsDB() {
    const [[result]] = await pool.query(`call getRecentJobs()`, []);

    return result || [];
};

export async function getHighestRatedMastersDB() {
    const [[result]] = await pool.query(`call getHighestRatedMasters()`, []);

    return result || [];
};

export async function getAllMastersDB() {
    const [result] = await pool.query(`
    select masters.user_id as 'id', users.avatar, users.firstName, users.lastName, 
    masters.tagLine, 
    avg(rating) as 'rating',
    masters.lat, masters.lng
    from jobs_candidates
    join jobs on jobs_candidates.jobFK = jobs.id
    join job_comments on job_comments.job_id = jobs.id
    join masters on jobs_candidates.masterFK = masters.user_id
    join users on masters.user_id = users.id
    where jobs.isDone = true and jobs_candidates.status = true
    group by jobs_candidates.masterFK;`, []);

    return result || [];
};
