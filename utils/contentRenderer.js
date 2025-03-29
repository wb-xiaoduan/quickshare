/**
 * u5185u5bb9u6e32u67d3u5de5u5177
 * u7528u4e8eu6e32u67d3u4e0du540cu7c7bu578bu7684u5185u5bb9uff08HTMLu3001Markdownu3001SVGu3001Mermaiduff09
 */

const { marked } = require("marked");
const { JSDOM } = require("jsdom");
const { CODE_TYPES } = require("./codeDetector");

// 使用 mermaid-render 包来渲染 Mermaid 图表
const { renderMermaid: mermaidRenderer } = require("mermaid-render");

/**
 * u6e32u67d3HTMLu5185u5bb9
 * @param {string} content - HTMLu5185u5bb9
 * @returns {string} - u5904u7406u540eu7684HTML
 */
function renderHtml(content) {
    // u5982u679cu662fu5b8cu6574u7684HTMLu6587u6863uff0cu76f4u63a5u8fd4u56de
    if (
        content.trim().startsWith("<!DOCTYPE html>") ||
        content.trim().startsWith("<html")
    ) {
        return content;
    }

    // u5982u679cu4e0du662fu5b8cu6574u7684HTMLu6587u6863uff0cu6dfbu52a0u57fau672cu7684HTMLu7ed3u6784
    return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HTML-GO 查看器</title>
      
      <!-- 网站图标 -->
      <link rel="icon" href="/icon/web/favicon.ico" sizes="any">
      <link rel="apple-touch-icon" href="/icon/web/apple-touch-icon.png">
      <link rel="icon" type="image/png" sizes="192x192" href="/icon/web/icon-192.png">
      <link rel="icon" type="image/png" sizes="512x512" href="/icon/web/icon-512.png">
      <meta name="theme-color" content="#6366f1">
      
      <!-- iOS 特殊设置 -->
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="HTML-GO">
      
      <link rel="stylesheet" href="/css/styles.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-dark.min.css">
      <style>
        body {
          font-family: 'Roboto', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          padding: 30px;
          margin-top: 20px;
        }
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #1a1a1a;
            color: #e6e6e6;
          }
          .container {
            background-color: #2a2a2a;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${content}
      </div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
          });
        });
      </script>
    </body>
    </html>
  `;
}

/**
 * u6e32u67d3Markdownu5185u5bb9
 * @param {string} content - Markdownu5185u5bb9
 * @returns {string} - u6e32u67d3u540eu7684HTML
 */
async function renderMarkdown(content) {
    // 预处理内容，处理独立的 Mermaid 代码
    const processedContent = await preprocessMarkdown(content);

    // 如果是独立的 Mermaid 代码，直接返回预处理结果
    if (processedContent.markdown.startsWith('<div class="mermaid">')) {
        return processedContent.markdown;
    }

    // 配置Marked选项
    marked.setOptions({
        gfm: true,
        breaks: true,
        smartLists: true,
        smartypants: true,
        highlight: function (code, lang) {
            // 特殊处理 Mermaid 代码块
            if (lang === "mermaid") {
                return `<div class="mermaid">${code}</div>`;
            }

            const hljs = require("highlight.js");
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(code, { language: lang }).value;
                } catch (err) {}
            }
            return hljs.highlightAuto(code).value;
        },
    });

    // 自定义 renderer 来处理代码块
    const renderer = new marked.Renderer();
    const originalCodeRenderer = renderer.code.bind(renderer);

    // 重写代码块渲染器
    renderer.code = function (code, language, isEscaped) {
        // 检查是否是 Mermaid 代码
        const isMermaidCode = (code) => {
            const mermaidPatterns = [
                /^(graph|flowchart)\s+(TB|TD|BT|RL|LR)\b/m,
                /^sequenceDiagram\b/m,
                /^classDiagram\b/m,
                /^stateDiagram(-v2)?\b/m,
                /^erDiagram\b/m,
                /^gantt\b/m,
                /^pie\b/m,
                /^journey\b/m,
                /^gitGraph\b/m,
                /^mindmap\b/m,
                /^timeline\b/m,
                /^C4Context\b/m,
            ];
            return mermaidPatterns.some((pattern) => pattern.test(code));
        };

        // 如果是 Mermaid 代码或语言标记为 mermaid
        if (language === "mermaid" || isMermaidCode(code)) {
            return `<div class="mermaid">${code}</div>`;
        }

        // 如果是 SVG 代码
        if (language === "svg") {
            return `<div class="embedded-svg-container">${code}</div>`;
        }

        // 否则使用原始渲染器
        return originalCodeRenderer(code, language, isEscaped);
    };

    // 使用自定义渲染器
    marked.setOptions({ renderer });

    // 将Markdown转换为HTML
    const htmlContent = marked.parse(content);

    // 使用最新版的 Mermaid 库，并增强其兼容性
    const mermaidScript = `
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>
    // 配置 Mermaid
    document.addEventListener('DOMContentLoaded', function() {
      // 检测暗色模式
      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      try {
        // 将 <pre><code class="language-mermaid"> 转换为 <div class="mermaid">
        const convertMermaidCodeBlocks = function() {
          const codeBlocks = document.querySelectorAll('pre code.language-mermaid');
          console.log('Found ' + codeBlocks.length + ' Mermaid code blocks to convert');
          
          codeBlocks.forEach(function(codeBlock, index) {
            // 获取 Mermaid 代码
            const code = codeBlock.textContent;
            const pre = codeBlock.parentNode;
            
            // 创建新的 div.mermaid 元素
            const mermaidDiv = document.createElement('div');
            mermaidDiv.className = 'mermaid';
            mermaidDiv.id = 'mermaid-converted-' + index;
            mermaidDiv.textContent = code;
            
            // 替换 pre 元素
            if (pre && pre.parentNode) {
              pre.parentNode.replaceChild(mermaidDiv, pre);
              console.log('Converted Mermaid code block #' + index);
            }
          });
          
          return codeBlocks.length > 0;
        };
        
        // 首先转换代码块
        convertMermaidCodeBlocks();
        
        // 配置 Mermaid
        mermaid.initialize({
          startOnLoad: true,  // 自动初始化
          securityLevel: 'loose',
          theme: isDarkMode ? 'dark' : 'default',
          flowchart: { useMaxWidth: true, htmlLabels: true },
          sequence: { useMaxWidth: true },
          gantt: { useMaxWidth: true },
          er: { useMaxWidth: true },
          pie: { useMaxWidth: true }
        });
        
        // 定时检查是否有未渲染的 Mermaid 元素
        setTimeout(function checkMermaidElements() {
          // 再次转换代码块，以防动态加载的内容
          const hasNewCodeBlocks = convertMermaidCodeBlocks();
          
          const mermaidElements = document.querySelectorAll('.mermaid');
          console.log('Found ' + mermaidElements.length + ' Mermaid elements in total');
          
          let hasUnrenderedElements = hasNewCodeBlocks; // 如果有新转换的代码块，就需要继续尝试渲染
          
          // 检查是否有未渲染的 Mermaid 元素
          mermaidElements.forEach(function(el) {
            if (el.querySelector('svg') === null && !el.classList.contains('mermaid-error')) {
              hasUnrenderedElements = true;
              console.log('Found unrendered Mermaid element, trying to render manually');
              try {
                // 尝试使用不同版本的 API
                if (typeof mermaid.init === 'function') {
                  mermaid.init(undefined, el);
                } else if (typeof mermaid.run === 'function') {
                  mermaid.run({ nodes: [el] });
                }
              } catch (err) {
                console.error('Failed to render Mermaid diagram:', err);
                // 显示原始代码
                el.innerHTML = '<pre>' + el.textContent + '</pre>';
                el.classList.add('mermaid-error');
              }
            }
          });
          
          // 如果还有未渲染的元素，继续尝试
          if (hasUnrenderedElements) {
            setTimeout(checkMermaidElements, 1000);
          }
        }, 500);
      } catch (e) {
        console.error('Error initializing Mermaid:', e);
      }
    });
  </script>
  `;

    // 添加 Mermaid 相关的 CSS 样式
    const mermaidStyles = `
  <style>
    .mermaid {
      margin: 20px 0;
      text-align: center;
      overflow: auto;
      background-color: white;
      padding: 10px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .mermaid-error {
      margin: 20px 0;
      padding: 10px;
      border-radius: 5px;
      background-color: #fff0f0;
      border: 1px solid #ffcccc;
      color: #cc0000;
    }
    
    @media (prefers-color-scheme: dark) {
      .mermaid {
        background-color: #2d2d2d;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      }
      
      .mermaid-error {
        background-color: #3a2222;
        border-color: #662222;
        color: #ff6666;
      }
    }
  </style>
  `;

    // 添加嵌入内容的样式
    const embeddedStyles = `
    .embedded-svg-container {
      margin: 20px 0;
      overflow: auto;
      max-width: 100%;
    }
    .embedded-mermaid-container {
      margin: 20px 0;
      text-align: center;
    }
    .mermaid {
      margin: 20px 0;
      text-align: center;
    }
  `;

    // 返回带有字节跳动风格的HTML
    return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HTML-GO Markdown查看器</title>
      
      <!-- 网站图标 -->
      <link rel="icon" href="/icon/web/favicon.ico" sizes="any">
      <link rel="apple-touch-icon" href="/icon/web/apple-touch-icon.png">
      <link rel="icon" type="image/png" sizes="192x192" href="/icon/web/icon-192.png">
      <link rel="icon" type="image/png" sizes="512x512" href="/icon/web/icon-512.png">
      <meta name="theme-color" content="#6366f1">
      
      <!-- iOS 特殊设置 -->
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="HTML-GO">
      
      <link rel="stylesheet" href="/css/markdown-bytedance.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-dark.min.css">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Noto+Serif+SC:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #f5f5f7;
        }
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #1a1a1a;
          }
        }
        ${embeddedStyles}
      </style>
      ${mermaidStyles}
      ${mermaidScript}
    </head>
    <body>
      <div class="markdown-body">
        ${htmlContent}
      </div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          // 代码高亮
          document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
          });
        });
      </script>
    </body>
    </html>
  `;
}

/**
 * u6e32u67d3SVGu5185u5bb9
 * @param {string} content - SVGu5185u5bb9
 * @returns {string} - u6dfbu52a0u4e86HTMLu7ed3u6784u7684SVG
 */
function renderSvg(content) {
    return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HTML-GO 查看器</title>
      
      <!-- 网站图标 -->
      <link rel="icon" href="/icon/web/favicon.ico" sizes="any">
      <link rel="apple-touch-icon" href="/icon/web/apple-touch-icon.png">
      <link rel="icon" type="image/png" sizes="192x192" href="/icon/web/icon-192.png">
      <link rel="icon" type="image/png" sizes="512x512" href="/icon/web/icon-512.png">
      <meta name="theme-color" content="#6366f1">
      
      <!-- iOS 特殊设置 -->
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="apple-mobile-web-app-title" content="HTML-GO">
      
      <style>
        body {
          margin: 0;
          padding: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f5f5f5;
        }
        
        #svg-container {
          position: relative;
          width: 100%;
          max-width: 100%;
          text-align: center;
        }
        
        svg {
          max-width: 100%;
          max-height: 90vh;
          height: auto;
          width: auto;
          margin: 0 auto;
          display: inline-block;
        }
        
        .context-menu {
          display: none;
          position: absolute;
          background-color: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          padding: 8px 0;
          z-index: 1000;
        }
        
        .context-menu-item {
          padding: 8px 16px;
          cursor: pointer;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          font-size: 14px;
          color: #333;
        }
        
        .context-menu-item:hover {
          background-color: #f2f2f2;
        }
        
        @media (prefers-color-scheme: dark) {
          body {
            background-color: #1a1a1a;
          }
          
          .context-menu {
            background-color: #2a2a2a;
            border-color: #444;
          }
          
          .context-menu-item {
            color: #e5e7eb;
          }
          
          .context-menu-item:hover {
            background-color: #3a3a3a;
          }
        }
      </style>
    </head>
    <body>
      <div id="svg-container">
        ${content}
      </div>
      
      <div id="context-menu" class="context-menu">
        <div class="context-menu-item" id="export-png">导出为PNG</div>
      </div>
      
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          const svgContainer = document.getElementById('svg-container');
          const svg = svgContainer.querySelector('svg');
          const contextMenu = document.getElementById('context-menu');
          const exportPng = document.getElementById('export-png');
          
          // 检查SVG是否存在
          if (svg) {
            console.log('SVG found in the container');
            
            // 确保SVG有viewBox属性，如果没有自动添加
            if (!svg.getAttribute('viewBox') && 
                svg.getAttribute('width') && svg.getAttribute('height')) {
              const width = svg.getAttribute('width');
              const height = svg.getAttribute('height');
              svg.setAttribute('viewBox', '0 0 ' + parseFloat(width) + ' ' + parseFloat(height));
              console.log('Added viewBox attribute: 0 0 ' + parseFloat(width) + ' ' + parseFloat(height));
            } else {
              console.log('SVG viewBox: ' + (svg.getAttribute('viewBox') || 'not set'));
              console.log('SVG width: ' + (svg.getAttribute('width') || 'not set'));
              console.log('SVG height: ' + (svg.getAttribute('height') || 'not set'));
            }
          } else {
            console.error('No SVG found in the container');
            svgContainer.innerHTML = '<p style="color: red;">SVG加载失败或内容不是有效的SVG格式</p>' + svgContainer.innerHTML;
          }
          
          // 阻止默认右键菜单
          svgContainer.addEventListener('contextmenu', function(e) {
            if (!svg) return; // 如果没有SVG，不显示自定义右键菜单
            
            e.preventDefault();
            
            // 显示自定义右键菜单
            contextMenu.style.display = 'block';
            contextMenu.style.left = e.pageX + 'px';
            contextMenu.style.top = e.pageY + 'px';
          });
          
          // 点击页面其他区域关闭菜单
          document.addEventListener('click', function() {
            contextMenu.style.display = 'none';
          });
          
          // 导出PNG功能
          exportPng.addEventListener('click', function() {
            if (!svg) return;
            
            try {
              // 获取SVG原始尺寸
              let svgWidth, svgHeight;
              
              // 优先使用SVG本身的width和height属性
              if (svg.getAttribute('width') && svg.getAttribute('height')) {
                svgWidth = parseFloat(svg.getAttribute('width'));
                svgHeight = parseFloat(svg.getAttribute('height'));
              } else if (svg.viewBox.baseVal && svg.viewBox.baseVal.width > 0) {
                // 其次使用viewBox
                svgWidth = svg.viewBox.baseVal.width;
                svgHeight = svg.viewBox.baseVal.height;
              } else {
                // 最后才使用getBoundingClientRect
                const rect = svg.getBoundingClientRect();
                svgWidth = rect.width;
                svgHeight = rect.height;
              }
              
              // 确保有最小尺寸
              svgWidth = Math.max(svgWidth, 100);
              svgHeight = Math.max(svgHeight, 100);
              
              // 创建Canvas，使用合适的尺寸
              const canvas = document.createElement('canvas');
              
              // 根据SVG原始比例设置Canvas尺寸，但确保不超过最大值
              const maxSize = 4000; // 最大尺寸限制
              let scale = 2; // 默认2倍缩放提高清晰度
              
              // 调整缩放比例，确保不超过最大限制
              if (svgWidth * scale > maxSize || svgHeight * scale > maxSize) {
                scale = Math.min(maxSize / svgWidth, maxSize / svgHeight);
              }
              
              canvas.width = svgWidth * scale;
              canvas.height = svgHeight * scale;
              const ctx = canvas.getContext('2d');
              
              // 设置透明背景
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              // 创建SVG数据URL
              const data = new XMLSerializer().serializeToString(svg);
              // 修复SVG的XLink命名空间问题
              const fixedSvgData = data.replace(/NS\d+:href/g, 'xlink:href');
              const DOMURL = window.URL || window.webkitURL || window;
              const svgBlob = new Blob([fixedSvgData], {type: 'image/svg+xml;charset=utf-8'});
              const url = DOMURL.createObjectURL(svgBlob);
              const img = new Image();
              
              // 图片加载完成后绘制到Canvas
              img.onload = function() {
                console.log('Image loaded: ' + img.width + 'x' + img.height + ', Canvas: ' + canvas.width + 'x' + canvas.height);
                // 重置上下文变换
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                // 清除画布
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // 重新缩放上下文
                ctx.scale(scale, scale);
                // 绘制图像
                ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
                DOMURL.revokeObjectURL(url);
                
                // 创建下载链接
                const imgURI = canvas.toDataURL('image/png');
                const fileName = 'svg-export-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.png';
                
                const downloadLink = document.createElement('a');
                downloadLink.download = fileName;
                downloadLink.href = imgURI;
                downloadLink.style.display = 'none';
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
              };
              
              // 错误处理
              img.onerror = function(e) {
                console.error('图片加载错误:', e);
                alert('SVG加载失败，可能是SVG格式有问题。尝试使用浏览器自带的"另存为"功能。');
              };
              
              img.src = url;
            } catch (error) {
              console.error('导出PNG失败:', error);
              alert('导出PNG失败: ' + error.message);
            }
          });
        });
      </script>
    </body>
    </html>
  `;
}

/**
 * u6e32u67d3Mermaidu56feu8868
 * @param {string} content - Mermaidu56feu8868u4ee3u7801
 * @returns {Promise<string>} - u6e32u67d3u540eu7684HTML
 */
async function renderMermaid(content) {
    // 首先尝试使用 mermaid-render 包来渲染
    try {
        // 生成唯一的图表ID
        const chartId = `mermaid-chart-${Date.now()}-${Math.floor(
            Math.random() * 1000
        )}`;

        // 准备 SVG 的配置
        const renderOptions = {
            // 图表的尺寸
            width: 800,
            height: 600,

            // Mermaid配置
            mermaidConfig: {
                theme: "default",
                startOnLoad: true,
                securityLevel: "loose",
                flowchart: {
                    useMaxWidth: true,
                    htmlLabels: true,
                },
                fontFamily: "Arial, sans-serif",
            },
        };

        // 使用mermaid-render渲染代码为SVG
        const svgOutput = await mermaidRenderer(content, renderOptions);

        // 构建具有SVG的HTML
        return `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HTML-GO 查看器</title>
        
        <!-- 网站图标 -->
        <link rel="icon" href="/icon/web/favicon.ico" sizes="any">
        <link rel="apple-touch-icon" href="/icon/web/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="192x192" href="/icon/web/icon-192.png">
        <link rel="icon" type="image/png" sizes="512x512" href="/icon/web/icon-512.png">
        <meta name="theme-color" content="#6366f1">
        
        <!-- iOS 特殊设置 -->
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="HTML-GO">
        
        <style>
          body {
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: calc(100vh - 40px);
            background-color: #f5f5f5;
            color: #333;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          
          .container {
            max-width: 100%;
            overflow: auto;
            text-align: center;
          }
          
          svg {
            max-width: 100%;
            height: auto;
          }
          
          .error-message {
            background-color: #fee2e2;
            border: 1px solid #f87171;
            color: #b91c1c;
            padding: 1rem;
            border-radius: 0.5rem;
            margin: 2rem auto;
            max-width: 600px;
          }
          
          .code-display {
            text-align: left;
            background-color: #1f2937;
            color: #e5e7eb;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1rem 0;
            font-family: monospace;
            white-space: pre;
          }
          
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #1a1a1a;
              color: #e5e7eb;
            }
            
            .error-message {
              background-color: #4b1113;
              border-color: #dc2626;
              color: #fca5a5;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${svgOutput}
        </div>
      </body>
      </html>
    `;
    } catch (error) {
        console.error("[DEBUG] Mermaid渲染错误:", error);

        // 如果渲染失败，使用浏览器端Mermaid渲染作为备选方案
        return `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HTML-GO 查看器</title>
        
        <!-- 网站图标 -->
        <link rel="icon" href="/icon/web/favicon.ico" sizes="any">
        <link rel="apple-touch-icon" href="/icon/web/apple-touch-icon.png">
        <link rel="icon" type="image/png" sizes="192x192" href="/icon/web/icon-192.png">
        <link rel="icon" type="image/png" sizes="512x512" href="/icon/web/icon-512.png">
        <meta name="theme-color" content="#6366f1">
        
        <!-- iOS 特殊设置 -->
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="HTML-GO">
        
        <!-- Mermaid JS -->
        <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
        
        <style>
          body {
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: calc(100vh - 40px);
            background-color: #f5f5f5;
            color: #333;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          
          .container {
            max-width: 100%;
            overflow: auto;
            text-align: center;
          }
          
          .mermaid {
            font-family: 'Courier New', monospace;
            font-size: 16px;
            padding: 20px;
            margin: auto;
            max-width: 800px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #1a1a1a;
              color: #e5e7eb;
            }
            
            .mermaid {
              background-color: #2a2a2a;
              box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="mermaid">
            ${escapeHtml(content)}
          </div>
        </div>
        
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            // 检测暗色模式
            const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            // 配置 Mermaid
            mermaid.initialize({
              startOnLoad: true,
              theme: isDarkMode ? 'dark' : 'default',
              securityLevel: 'loose',
              flowchart: {
                useMaxWidth: true,
                htmlLabels: true
              },
              fontFamily: 'Arial, sans-serif'
            });
            
            // 渲染图表
            try {
              mermaid.init(undefined, '.mermaid');
            } catch (error) {
              console.error('Mermaid 初始化错误:', error);
              document.querySelector('.mermaid').innerHTML = 
                '<div class="error-message">' +
                '  <h3>Mermaid 图表渲染失败</h3>' +
                '  <p>可能是图表语法有误。请检查以下代码：</p>' +
                '  <div class="code-display">' + escapeHtml(content) + '</div>' +
                '</div>';
            }
          });
        </script>
      </body>
      </html>
    `;
    }
}

/**
 * u8f6cu4e49HTMLu5b57u7b26
 * @param {string} unsafe - u9700u8981u8f6cu4e49u7684u5b57u7b26u4e32
 * @returns {string} - u8f6cu4e49u540eu7684u5b57u7b26u4e32
 */
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * u6839u636eu5185u5bb9u7c7bu578bu6e32u67d3u5185u5bb9
 * @param {string} content - u8981u6e32u67d3u7684u5185u5bb9
 * @param {string} contentType - u5185u5bb9u7c7bu578b
 * @returns {Promise<string>} - u6e32u67d3u540eu7684HTML
 */
async function renderContent(content, contentType) {
    console.log(`[DEBUG] renderContent 被调用，内容类型: ${contentType}`);
    console.log(`[DEBUG] 内容长度: ${content.length} 字符`);

    switch (contentType) {
        case CODE_TYPES.HTML:
            console.log("[DEBUG] 使用 HTML 渲染器");
            return renderHtml(content);
        case CODE_TYPES.MARKDOWN:
            console.log("[DEBUG] 使用 Markdown 渲染器");
            const markdownResult = await renderMarkdown(content);
            console.log(
                `[DEBUG] Markdown 渲染完成，结果长度: ${markdownResult.length} 字符`
            );
            return markdownResult;
        case CODE_TYPES.SVG:
            console.log("[DEBUG] 使用 SVG 渲染器");
            return renderSvg(content);
        case CODE_TYPES.MERMAID:
            console.log("[DEBUG] 使用 Mermaid 渲染器");
            return await renderMermaid(content);
        default:
            // 默认使用Markdown渲染器，与代码检测逻辑保持一致
            console.log(
                `[DEBUG] 使用默认渲染器 (Markdown)，因为内容类型 '${contentType}' 未知`
            );
            return await renderMarkdown(content);
    }
}

/**
 * 预处理Markdown内容
 * @param {string} content - Markdown内容
 * @returns {Object} - 处理后的内容
 */
async function preprocessMarkdown(content) {
    // 检查是否是独立的 Mermaid 代码
    const isMermaidContent = (code) => {
        // 检查是否包含 Mermaid 图表的常见语法元素
        const mermaidPatterns = [
            /^(graph|flowchart)\s+(TB|TD|BT|RL|LR)\b/m, // 流程图
            /^sequenceDiagram\b/m, // 序列图
            /^classDiagram\b/m, // 类图
            /^stateDiagram(-v2)?\b/m, // 状态图
            /^erDiagram\b/m, // ER图
            /^gantt\b/m, // 甘特图
            /^pie\b/m, // 饼图
            /^journey\b/m, // 用户旅程图
            /^gitGraph\b/m, // Git图
            /^mindmap\b/m, // 思维导图
            /^timeline\b/m, // 时间线
            /^C4Context\b/m, // C4图
        ];

        return mermaidPatterns.some((pattern) => pattern.test(code));
    };

    // 如果是独立的 Mermaid 代码，直接将其包裹在 mermaid 类中
    if (!content.includes("```") && isMermaidContent(content)) {
        console.log("[DEBUG] 检测到独立的 Mermaid 代码");
        return {
            markdown: `<div class="mermaid">
${content}
</div>`,
            mermaidCharts: [{ id: "mermaid-standalone", code: content }],
            svgBlocks: [],
        };
    }

    // 对于 Markdown 内容，我们不需要做特殊处理
    // 因为我们已经自定义了 marked 渲染器来处理 Mermaid 和 SVG 代码块
    return {
        markdown: content,
        mermaidCharts: [],
        svgBlocks: [],
    };
}

module.exports = {
    renderContent,
    renderHtml,
    renderMarkdown,
    renderSvg,
    renderMermaid,
    escapeHtml,
};
