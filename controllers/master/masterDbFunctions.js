import pool from "../../config/dbConfig.js";

export async function getAllMasterConversationsDB(id) {
    const [conversations] = await pool.query(`
    select distinct users.id, users.firstName, users.lastName, users.avatar
	from jobs_candidates
	join jobs on jobs_candidates.jobFK = jobs.id
	join users on jobs.clientFK = users.id
	where jobs_candidates.status = true
	and jobs_candidates.masterFK = ?;`, [id]);

	const [allSortedClientConv] = await pool.query(`
    select senderFK, receiverFK, message, create_time
    from user_messages
    join messages on messageFK = messages.id
    where senderFK = ? or receiverFK = ?
    order by messages.create_time desc;
    `, [id, id]);

    let sortedMasterConv = [];

    for (const all of allSortedClientConv) {
        for (const c of conversations) {
            if ((all.senderFK == c.id) || (all.receiverFK == c.id)) {
                let isDublicate = false;

                for (const s of sortedMasterConv) {
                    if ((all.senderFK == s.id) || (all.receiverFK == s.id)) {
                        isDublicate = true;
                        break;
                    }
                }

                if (!isDublicate) {
                    sortedMasterConv.push(c);                    
                }
            }
        }

        if (sortedMasterConv.length === conversations.length) {
            break;
        }
    }
    
    let endArray = [];

    let isDublicate = false;
    for (const other of conversations) {
        isDublicate = false;
        for (const sorted of sortedMasterConv) {
            if (other.id === sorted.id ) {
                isDublicate = true;
            }
        }

        if (!isDublicate) {
            endArray.push(other);
        }
    }

    sortedMasterConv = [ ...sortedMasterConv, ...endArray ];

    return sortedMasterConv || [];
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

export async function getPermissionCheckDB(id) {
    const [[permission]] = await pool.query(`
    select isAdminChecked
    from masters
    join masters_documents on masters_documents.user_id = masters.user_id
    where masters.user_id = ?;`, [id]);

    return permission ? !!+permission.isAdminChecked : false;
}

export async function getAdditionalMasterInfoDB(jobId, masterId) {
    const [[additionalInfo]] = await pool.query(`
    select proposedPayment, name as 'currency', currencyFK, executionTime, status
    from jobs_candidates
    join currencies on currencies.id = jobs_candidates.currencyFK
    where jobFK = ? and masterFK = ?;`, [jobId, masterId]);

    return additionalInfo;
}

export async function applyJobDB(jobId, masterId, proposedPayment, currencyFK, suggestedLeadTime) {
	await pool.query(`
	INSERT INTO jobs_candidates (jobFK, masterFK, proposedPayment, currencyFK, executionTime) 
	VALUES (?, ?, ?, ?, ?);
	`, [jobId, masterId, proposedPayment, currencyFK, suggestedLeadTime])
	.then(() => console.log('successfully applied job'));	
}

export async function changeProfileSettingsDB(userId, masterCategories, newTagLine, newDescription) {
	const newMasterCategories = (masterCategories.length > 0) ? masterCategories.filter(c => c.desc && c.desc === 'new') : [];
	const deleteMasterCategories = (masterCategories.length > 0) ? masterCategories.filter(c => c.desc && c.desc === 'delete') : [];

    let queryCategoriesValues = 'INSERT INTO categories_masters (categoryFK, masterFK) VALUES ';

    if (newMasterCategories.length > 0) {
        for (const i in newMasterCategories) {
            queryCategoriesValues += `(${newMasterCategories[i].id}, ${userId})`;

            if (i == newMasterCategories.length - 1) {
                queryCategoriesValues += ';';
            } else {
                queryCategoriesValues += ',';
            }
        }
    }

    let deleteQuery = `DELETE FROM categories_masters WHERE `

    if (deleteMasterCategories.length > 0) {
        for (const i in deleteMasterCategories) {
            deleteQuery += `(categoryFK = ${deleteMasterCategories[i].id} and masterFK = ${userId})`;
            if (i == deleteMasterCategories.length - 1) {
                deleteQuery += ';';
            } else {
                deleteQuery += ` OR `;
            }
        }
    }

    pool.query(`UPDATE masters 
    SET tagLine = ?, 
    description = ?
    WHERE user_id = ?`, 
    [newTagLine, newDescription, userId])
    .then(() => {
        if (masterCategories.length > 0) {
            if (newMasterCategories.length > 0) {
                pool.query(queryCategoriesValues);
            }

            if (deleteMasterCategories.length > 0) {
                pool.query(deleteQuery);
            }
            
        }
    });
}

export async function uploadDocumentsDB(id, passport1, passport2, itn) {
    await pool.query(`
    UPDATE masters_documents 
    SET passportFirstSide = ?, passportSecondSide = ?, individual_tax_number = ? 
    WHERE user_id = ?;`, [passport1, passport2, itn, id]);

    return { success: true, documents: [passport1, passport2, itn] };
};

export async function updateCurrentLocationDB(lat, lng, userId) {
    await pool.query(`
    UPDATE masters 
    SET lat = ?, lng = ? 
    WHERE user_id = ?;`, [lat, lng, userId]);

    return { success: true };
};

export async function checkJobDB(jobId, masterId) {
    const [[status]] = await pool.query(`
	select jobs_candidates.status
	from jobs_candidates
	where jobFK = ? and masterFK = ?;
	`, [jobId, masterId]);
	
	return status || null;
}