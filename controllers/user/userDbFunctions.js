import pool from "../../config/dbConfig.js";

// export async function updateEmailConfirmStatusDB(token, email) {
//     await pool.query(`
//     UPDATE users 
//     SET isEmailVerified = 1, email = ?
//     WHERE refreshToken = ?;
//     `, [token, email]);
// }

export async function getInfoDB(id) {
    const userInfo = await pool.query(`
    select users.*, masters.* 
    from users
    left join masters on masters.user_id = users.id
    left join categories_masters on categories_masters.masterFK = masters.user_id
    where id = ?;`, [id])
    .then(async ([[user]]) => {
        const [categories] = await pool.query(`
        select categories.id, categories.name as 'category', categories.description 
        from users
        left join masters on masters.user_id = users.id
        left join categories_masters on categories_masters.masterFK = masters.user_id
        join categories on categories.id = categories_masters.categoryFK
        where masters.user_id = ?;`, [user.id]);

        let info = { ...user, masterInfo: { categories, description: user.description, tagLine: user.tagLine } };
        delete info.password;
        delete info.refreshToken;
        delete info.user_id;
        delete info.tagLine;
        delete info.description;

        return info;
    });

    return userInfo || {};
}

export async function getNotificationsDB(id) {
    const [notifications] = await pool.query(`
    select *
    from notifications
    where isUnread = true and userFK = ?;`, [id]);

    return notifications || [];
}

export async function getMessagesDB(id) {
    const [messages] = await pool.query(`
    select messages.*
    from user_messages
    join users on user_messages.senderFK = users.id
    left join users u2 on user_messages.receiverFK = u2.id
    join messages on user_messages.messageFK = messages.id
    where messages.isUnread = true 
    and user_messages.receiverFK = ?;`, [id]);

    return messages || [];
}

export async function updateAvatar(id, newAvatar) {
    const [result] = await pool.query(`
    UPDATE users SET avatar = ? WHERE id = ?;
    `, [newAvatar, id]);

    return result || {};
}

export async function getAvatar(id) {
    const [[result]] = await pool.query(`
    select avatar 
    from users
    where id = ?;`, [id]);

    return result.avatar;
}