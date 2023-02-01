import pool from "../../config/dbConfig.js";

export async function getAllMasterConversationsDB(id) {
    const [conversations] = await pool.query(`
    select distinct users.id, users.firstName, users.lastName, users.avatar
	from jobs_candidates
	join jobs on jobs_candidates.jobFK = jobs.id
	join users on jobs.clientFK = users.id
	where jobs_candidates.status = true
	and jobs_candidates.masterFK = ?;`, [id]);

    return conversations || [];
}

export async function getMasterStatisticsDB(id) {
    const [[statistics]] = await pool.query(`
    select count(*) as 'completedJobs', sum(proposedPayment) as 'totalAmount'
	from jobs_candidates
	join jobs on jobs_candidates.jobFK = jobs.id
	join masters on jobs_candidates.masterFK = masters.user_id
	where jobs.isDone = true and jobs_candidates.status = true 
	and masters.user_id = ?;`, [id]);

    return statistics || {};
}

export async function applyJobDB(jobId, masterId, proposedPayment, suggestedLeadTime) {
	await pool.query(`
	INSERT INTO jobs_candidates (jobFK, masterFK, proposedPayment, executionTime) 
	VALUES (?, ?, ?, ?);
	`, [jobId, masterId, proposedPayment, suggestedLeadTime])
	.then(() => console.log('successfully applied job'));	
}

export async function checkJobDB(jobId, masterId) {
    const [[status]] = await pool.query(`
	select jobs_candidates.status
	from jobs_candidates
	where jobFK = ? and masterFK = ?;
	`, [jobId, masterId]);
	
	return status || null;
}