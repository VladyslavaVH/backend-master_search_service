import pool from "../../config/dbConfig.js";

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