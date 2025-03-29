/**
 * 应用配置文件
 * 根据不同环境加载不同的配置
 */

// 加载 .env 文件中的环境变量（如果存在）
try {
    require("dotenv").config();
} catch (e) {
    console.log("未找到 dotenv 模块或 .env 文件，使用默认环境变量");
}

const env = process.env.NODE_ENV || "development";

const config = {
    // 开发环境配置
    development: {
        port: process.env.PORT || 5678,
        logLevel: "dev",
        db: {
            host: process.env.DB_HOST || "localhost",
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "html_go",
            connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
        },
    },

    // 生产环境配置
    production: {
        port: process.env.PORT || 8888,
        logLevel: "combined",
        db: {
            host: process.env.DB_HOST || "localhost",
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "html_go",
            connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
        },
    },

    // 测试环境配置
    test: {
        port: process.env.PORT || 3000,
        logLevel: "dev",
        db: {
            host: process.env.DB_HOST || "localhost",
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || "root",
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "html_go_test",
            connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
        },
    },
};

// 导出当前环境的配置
module.exports = config[env] || config.development;
