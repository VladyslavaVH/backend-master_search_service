import pool from "../../config/dbConfig.js";

export async function getJobListingByClient(id) {
    const [jobs] = await pool.query(`
    SELECT *
    FROM jobs
    WHERE jobs.clientFK = ? 
    AND jobs.isDone = false
    ORDER BY (jobDateTime) desc;`, [id]);

    const [candidates] = await pool.query(`
    select masters.user_id as 'id', jobFK, jobs_candidates.status as 'isConfirmed', firstName, lastName, phone, email, avatar, isAdminChecked as 'isVerified'
    from jobs_candidates
    join masters on jobs_candidates.masterFK = masters.user_id
    join users on masters.user_id = users.id
    join masters_documents on masters_documents.user_id = masters.user_id
    join jobs on jobs_candidates.jobFK = jobs.id
    where clientFK = ?
    and jobs.isDone = false;`, [id]);

    return { jobs, candidates } || { jobs: [], candidates: [] };
}

export async function getAllCandidatesByClient(id) {
    const [candidates] = await pool.query(`
    select masters.user_id as 'id', jobFK, jobs_candidates.status as 'isConfirmed', firstName, lastName, phone, email, avatar, isAdminChecked as 'isVerified'
    from jobs_candidates
    join masters on jobs_candidates.masterFK = masters.user_id
    join users on masters.user_id = users.id
    join masters_documents on masters_documents.user_id = masters.user_id
    join jobs on jobs_candidates.jobFK = jobs.id
    where clientFK = ?
    and jobs.isDone = false;`, [id]);

    const [allMastersRating] = await pool.query(`
    select masterFK, avg(rating) as 'rating'
    from jobs_candidates
    join jobs on jobs_candidates.jobFK = jobs.id
    join job_comments on job_comments.job_id = jobs.id
    where jobs.isDone = true and jobs_candidates.status = true
    group by masterFK;`, []);

    return { candidates, allMastersRating } || {};
}

export async function getAllClientConversationsDB(id) {
    const [conversations] = await pool.query(`
    select distinct masters.user_id as 'id', users.firstName, users.lastName, users.avatar
    from jobs_candidates
    join jobs on jobs_candidates.jobFK = jobs.id
    join masters on jobs_candidates.masterFK = masters.user_id
    join users on masters.user_id = users.id
    where jobs_candidates.status = true
    and jobs.clientFK = ?;
    `, [id]);

    return conversations || [];
}

export async function deleteJobCandidate(jobId, masterId) {
    await pool.query(`
    DELETE 
    FROM jobs_candidates 
    WHERE jobFK = ? 
    AND masterFK = ?;`, [jobId, masterId])
    .then(() => console.log('candidate deleted successfully'));
};

export async function confirmCandidate(jobId, masterId) {
    //update
    await pool.query(`
    UPDATE jobs_candidates 
    SET status = true 
    WHERE jobFK = ? and masterFK = ?;`, [jobId, masterId])
    .then(() => console.log('candidate confirmed successfully'));
}