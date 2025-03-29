const { run, get, query } = require("./db");
const CryptoJS = require("crypto-js");

/**
 * 生成随机密码（5位纯数字）
 * @returns {string} 返回5位纯数字密码
 */
function generateRandomPassword() {
    const chars = "0123456789";
    let password = "";
    for (let i = 0; i < 5; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        password += chars[randomIndex];
    }
    console.log("生成密码:", password); // 调试输出
    return password;
}

/**
 * 从HTML内容中提取标题
 * @param {string} htmlContent HTML内容
 * @param {string} codeType 代码类型
 * @returns {string} 提取的标题，如果没有找到则返回默认标题
 */
function extractTitleFromHtml(htmlContent, codeType) {
    // 默认标题
    let title = "未命名页面";

    // 只有当内容类型为HTML时，才尝试提取标题
    if (codeType === "html") {
        try {
            // 尝试通过正则表达式匹配title标签内容
            const titleMatch = htmlContent.match(
                /<title[^>]*>([^<]+)<\/title>/i
            );
            if (titleMatch && titleMatch[1]) {
                title = titleMatch[1].trim();
            } else {
                // 尝试匹配第一个h1标签作为标题
                const h1Match = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
                if (h1Match && h1Match[1]) {
                    title = h1Match[1].trim();
                }
            }
        } catch (error) {
            console.error("提取标题时出错:", error);
        }
    }

    // 标题长度限制
    if (title.length > 255) {
        title = title.substring(0, 252) + "...";
    }

    return title;
}

/**
 * 创建新页面
 * @param {string} htmlContent HTML内容
 * @param {boolean} isProtected 是否启用密码保护
 * @param {string} codeType 代码类型（html, markdown, svg, mermaid）
 * @returns {Promise<Object>} 返回生成的URL ID和密码
 */
async function createPage(htmlContent, isProtected = false, codeType = "html") {
    try {
        // 生成时间戳
        const timestamp = new Date().getTime().toString();

        // 生成短ID (7位)
        const hash = CryptoJS.MD5(htmlContent + timestamp).toString();
        const urlId = hash.substring(0, 7);

        // 无论是否启用保护，都生成密码
        const password = generateRandomPassword();
        console.log("生成密码:", password);

        // 提取标题（如果是HTML内容）
        const title = extractTitleFromHtml(htmlContent, codeType);

        // 保存到数据库
        // isProtected决定是否需要密码才能访问
        await run(
            "INSERT INTO pages (id, html_content, created_at, password, is_protected, code_type, title) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                urlId,
                htmlContent,
                Date.now(),
                password,
                isProtected ? 1 : 0,
                codeType,
                title,
            ]
        );

        return { urlId, password };
    } catch (error) {
        console.error("创建页面错误:", error);
        throw error;
    }
}

/**
 * 通过ID获取页面
 * @param {string} id 页面ID
 * @returns {Promise<Object|null>} 返回页面对象或null
 */
async function getPageById(id) {
    try {
        return await get("SELECT * FROM pages WHERE id = ?", [id]);
    } catch (error) {
        console.error("获取页面错误:", error);
        throw error;
    }
}

/**
 * 获取最近创建的页面列表
 * @param {number} limit 限制数量
 * @returns {Promise<Array>} 返回页面列表
 */
async function getRecentPages(limit = 10) {
    try {
        return await query(
            "SELECT id, created_at FROM pages ORDER BY created_at DESC LIMIT ?",
            [limit]
        );
    } catch (error) {
        console.error("获取最近页面错误:", error);
        throw error;
    }
}

module.exports = {
    createPage,
    getPageById,
    getRecentPages,
};
