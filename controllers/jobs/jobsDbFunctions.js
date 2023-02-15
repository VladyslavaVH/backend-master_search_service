import pool from "../../config/dbConfig.js";

export async function constructorQuery(startIndex, LIMIT, categories, title, bounds, payment) {
    const dependencies = [];
    const SELECT = `SELECT jobs.id, users.firstName AS 'clientName', users.isPhoneVerified AS 'isVerified', categories.name AS 'category', lat, lng, minPayment, maxPayment, currencies.name as 'currency', jobDateTime, jobs.createTime, jobs.description, isDone, status, qrCode`;
    const TOTAL_SELECT = `SELECT COUNT(*) as 'total'`;
    let query = `
    FROM jobs
    JOIN users ON jobs.clientFK = users.id
    JOIN categories ON jobs.categoryFK = categories.id
    JOIN currencies ON jobs.currencyFK = currencies.id`;

    let isWhere = false;

    if (categories && categories.length > 0) {
        for (const cFK of categories) {
            isWhere = query.includes('WHERE');
            query = query + `\n${isWhere ? 'OR' : 'WHERE'} categoryFK = ?`;
            dependencies.push(cFK);
        }
    }

    //category title
    if (title) {
        isWhere = query.includes('WHERE');
        query = query + `\n${isWhere ? 'AND' : 'WHERE'} categories.name regexp ?`;
        dependencies.push(title);
    }

    if (bounds) {
        isWhere = query.includes('WHERE');

        query = query + `\n${isWhere ? 'AND' : 'WHERE'} (lat <= ? AND lat >= ?) AND (lng <= ? AND lng >= ?)`;
        
        dependencies.push(bounds.lats.endLat);
        dependencies.push(bounds.lats.startLat);
        dependencies.push(bounds.lngs.endLng);
        dependencies.push(bounds.lngs.startLng);
    }

    if (payment) {
        isWhere = query.includes('WHERE');
        query = query + `\n${isWhere ? 'AND' : 'WHERE'} minPayment >= ? and maxPayment <= ?`;
        dependencies.push(payment.min);
        dependencies.push(payment.max);
    }

    const [[{total}]] = await pool.query(TOTAL_SELECT + query, dependencies);

    const FINAL_QUERY = SELECT + query + `\nLIMIT ${startIndex},${LIMIT};`;
    console.log(`FINAL_QUERY: ${FINAL_QUERY}`);

    const [jobs] = await pool.query(FINAL_QUERY, dependencies);

    return {
        jobs,
        total,
        lastPage: Math.ceil(total / LIMIT)
    };
}

export async function getAllJobs(startIndex, LIMIT) {
    const [result] = await pool.query(`
    SELECT jobs.id, title, users.firstName AS 'clientName', users.isPhoneVerified AS 'isVerified', categories.name AS 'category', lat, lng, minPayment, maxPayment, jobDateTime, jobs.createTime, jobs.description, isDone, status, qrCode
    FROM jobs
    JOIN users ON jobs.clientFK = users.id
    JOIN categories ON jobs.categoryFK = categories.id
    LIMIT ${startIndex},${LIMIT}`, []);//AND jobs.isDone = false AND jobs.status = 'Pending Approval'

    return result || [];
}

export async function getCountJobs() {
    const [[result]] = await pool.query(`
    SELECT COUNT(*) as countAllJobs
    FROM jobs
    JOIN users ON jobs.clientFK = users.id
    JOIN categories ON jobs.categoryFK = categories.id
    `, []);//AND jobs.isDone = false AND jobs.status = 'Pending Approval'

    return result.countAllJobs || 0;
}
