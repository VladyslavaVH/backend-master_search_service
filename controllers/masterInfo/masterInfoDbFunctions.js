import pool from "../../config/dbConfig.js";

export async function getMasterById(id) {
    const [[master]] = await pool.query(`
    select masters.user_id as 'id', users.avatar, users.firstName, users.lastName, 
    masters.tagLine, masters.description,
    avg(rating) as 'rating', count(jobs_candidates.jobFK) as 'jobsDoneCount',
    masters.lat, masters.lng
    from jobs_candidates
    join jobs on jobs_candidates.jobFK = jobs.id
    join job_comments on job_comments.job_id = jobs.id
    join masters on jobs_candidates.masterFK = masters.user_id
    join users on masters.user_id = users.id
    where jobs.isDone = true 
    and jobs_candidates.status = true
    and masters.user_id = ?;`, [id]);

    return master || {};
}

export async function getCommentsByMasterId(id) {
    const [comments] = await pool.query(`
    select job_id as 'id', jobs.title, job_comments.tagLine, rating, comment, job_comments.createTime
    from jobs_candidates
    join jobs on jobs_candidates.jobFK = jobs.id
    join job_comments on job_comments.job_id = jobs.id
    join masters on jobs_candidates.masterFK = masters.user_id
    where jobs.isDone = true
    and jobs_candidates.status = true
    and masters.user_id = ?;`, [id]);

    return comments || [];
}

export async function getCategoriesByMasterId(id) {
    const [categories] = await pool.query(`
    select categoryFK, categories.name as 'category'
    from categories_masters
    join categories on categories_masters.categoryFK = categories.id
    join masters on categories_masters.masterFK = masters.user_id
    where masters.user_id = ?;`, [id]);

    return categories || [];
}

export async function getRehiredJobCount(id) {
    const [rehiredJobCount] = await pool.query(`
    select count(jobs.clientFK) as 'rehiredCount'
    from jobs_candidates
    join jobs on jobs_candidates.jobFK = jobs.id
    join masters on jobs_candidates.masterFK = masters.user_id
    where jobs.isDone = true 
    and jobs_candidates.status = true
    and masters.user_id = ?
    group by jobs.clientFK;`, [id]);

    let rehired = 0;
    for (const c of rehiredJobCount) {
        rehired += c.rehiredCount;
    }

    return { rehired } || { rehired: 0 };
}

export async function getAllMastersRating() {
    const [result] = await pool.query(`
    select masterFK, avg(rating) as 'rating'
    from jobs_candidates
    join jobs on jobs_candidates.jobFK = jobs.id
    join job_comments on job_comments.job_id = jobs.id
    where jobs.isDone = true and jobs_candidates.status = true
    group by masterFK;`, []);

    return result || [];
}