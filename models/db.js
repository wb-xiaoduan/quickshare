const mysql = require("mysql2/promise");
const config = require("../config");

// 创建MySQL连接池
const pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    connectionLimit: config.db.connectionLimit,
    waitForConnections: true,
    queueLimit: 0,
});

/**
 * 初始化数据库，创建必要的表
 * @returns {Promise<void>}
 */
async function initDatabase() {
    const connection = await pool.getConnection();
    try {
        console.log("正在初始化数据库...");

        // 创建页面表
        await connection.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id VARCHAR(191) PRIMARY KEY,
        html_content LONGTEXT NOT NULL,
        created_at BIGINT NOT NULL,
        password VARCHAR(191),
        is_protected TINYINT DEFAULT 0,
        code_type VARCHAR(50) DEFAULT 'html'
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);

        console.log("数据库初始化成功");
    } catch (error) {
        console.error("数据库初始化失败:", error);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * 执行查询并返回所有结果
 * @param {string} sql SQL查询语句
 * @param {Array} params 查询参数
 * @returns {Promise<Array>} 查询结果数组
 */
async function query(sql, params = []) {
    try {
        const [rows] = await pool.query(sql, params);
        return rows;
    } catch (error) {
        console.error("数据库查询错误:", error);
        throw error;
    }
}

/**
 * 执行查询并返回单行结果
 * @param {string} sql SQL查询语句
 * @param {Array} params 查询参数
 * @returns {Promise<Object|null>} 查询结果对象或null
 */
async function get(sql, params = []) {
    try {
        const [rows] = await pool.query(sql, params);
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error("数据库单行查询错误:", error);
        throw error;
    }
}

/**
 * 执行插入、更新或删除操作
 * @param {string} sql SQL语句
 * @param {Array} params 查询参数
 * @returns {Promise<Object>} 包含affectedRows和insertId的结果对象
 */
async function run(sql, params = []) {
    try {
        const [result] = await pool.query(sql, params);
        return {
            id: result.insertId,
            changes: result.affectedRows,
        };
    } catch (error) {
        console.error("数据库执行错误:", error);
        throw error;
    }
}

module.exports = {
    pool,
    initDatabase,
    query,
    get,
    run,
};
