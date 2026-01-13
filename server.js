/**
 * 情绪炼金术师 - 本地后端服务器
 * 替代微信云函数，用于测试号开发
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // 开启静态文件服务 (Web版)

// ========== 配置 ==========
// ========== 配置 ==========
const CONFIG = {
    // LLM API (SiliconFlow)
    LLM_API_KEY: 'sk-nphkzfskqdymsdnnmvuohofvggsxthnniukvklickxvbrccp',
    LLM_API_URL: 'https://api.siliconflow.cn/v1/chat/completions',

    // 图片生成 API (OpenAI 兼容)
    IMAGE_API_KEY: 'sk-nphkzfskqdymsdnnmvuohofvggsxthnniukvklickxvbrccp',
    IMAGE_API_URL: 'https://api.siliconflow.cn/v1/image/generations'
};

// LLM Prompt 模板 - 纯文案版
const SYSTEM_PROMPT = `你是一位温暖的情绪炼金术师，专门将人们的负面情绪转化为治愈的力量。

用户会输入他们的心情或碎碎念。请根据他们的情绪，量身定制一份治愈文案：

请生成以下内容：

1. 【标题】一句简短有力的治愈标题（8-15字），要有诗意和力量感
2. 【主文】一段深度共情的治愈文案（150-250字），要求：
   - 首先理解并认同用户的情绪，让他们感到被理解
   - 然后用温暖的文字引导他们看到希望
   - 风格可以像一封写给好友的信，真诚、温暖、有力量
   - 可以引用一些哲理或比喻来传达力量
   - 最后给一个温暖的收尾
3. 【寄语】一句简短的鼓励语（15-30字），像一个温暖的拥抱

请严格返回JSON格式：
{
  "title": "治愈标题",
  "content": "主文内容...",
  "encouragement": "鼓励寄语"
}`;

/**
 * 主 API 端点：情绪炼金
 */
app.post('/api/alchemy', async (req, res) => {
    const { text } = req.body;

    if (!text || !text.trim()) {
        return res.json({ error: '请输入你的心情' });
    }

    const userText = text.trim().substring(0, 500);

    try {
        console.log('调用 LLM 生成治愈文案...');
        const llmResult = await callLLM(userText);

        if (!llmResult) {
            return res.json({ error: '情绪解析失败，请稍后重试' });
        }

        const { title, content, encouragement } = llmResult;
        console.log('LLM 返回:', { title, contentLength: content?.length || 0 });

        // 返回纯文案结果
        res.json({
            title: title || '致亲爱的你',
            content: content || '每一次低谷，都是生命在积蓄力量，静待花开。',
            encouragement: encouragement || '愿你被温柔以待 ✨'
        });

    } catch (err) {
        console.error('炼金过程出错:', err.message);
        res.json({ error: '炼金失败，魔法能量不足' });
    }
});

/**
 * 调用 LLM API (OpenAI 兼容)
 */
async function callLLM(userText) {
    try {
        const response = await axios.post(
            CONFIG.LLM_API_URL,
            {
                model: 'deepseek-ai/DeepSeek-V2.5',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userText }
                ],
                temperature: 0.7,
                max_tokens: 800,
                response_format: { type: 'json_object' }
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.LLM_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const content = response.data.choices[0].message.content;

        // 解析 JSON
        try {
            // 尝试提取 JSON 部分
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(content);
        } catch (e) {
            console.error('JSON 解析失败:', e);
            // 这里可以手动构造一个对象
            return {
                title: '情绪转化',
                content: content,
                encouragement: '拥抱每一种情绪'
            };
        }

    } catch (err) {
        console.error('LLM 调用失败:', err.message);
        if (err.response) {
            console.error('状态码:', err.response.status);
            console.error('数据:', err.response.data);
        }

        // 降级方案：返回默认文案 (更新为新格式)
        return {
            title: '静待花开',
            content: '亲爱的，我听到了你的心声。每一种情绪都是生命的信使，它们虽然有时会带来风雨，但也滋养着心灵的土壤。请允许自己暂时停下来，深呼吸，感受当下的力量。每一次低谷，都是在为下一次绽放积蓄能量。你并不孤单，整个宇宙都在温柔地注视着你。',
            encouragement: '愿你被温柔以待，光芒终将穿透迷雾。✨'
        };
    }
}

/**
 * 调用图片生成 API (OpenAI 兼容 DALL-E)
 */
async function callImageAPI(prompt) {
    const enhancedPrompt = `${prompt}, masterpiece, best quality, tarot card style, mystical, symmetric composition`;

    try {
        const response = await axios.post(
            CONFIG.IMAGE_API_URL,
            {
                model: 'dall-e-3',
                prompt: enhancedPrompt,
                n: 1,
                size: '1024x1024',
                quality: 'standard'
            },
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.IMAGE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 120000
            }
        );

        // OpenAI 返回格式
        if (response.data.data && response.data.data[0]) {
            const imageData = response.data.data[0];

            // 如果返回 URL
            if (imageData.url) {
                console.log('图片生成成功，正在下载...');
                const imgResponse = await axios.get(imageData.url, {
                    responseType: 'arraybuffer',
                    timeout: 30000
                });
                return Buffer.from(imgResponse.data).toString('base64');
            }

            // 如果直接返回 base64
            if (imageData.b64_json) {
                return imageData.b64_json;
            }
        }

        return null;

    } catch (err) {
        console.error('图片生成 API 调用失败:', err.message);
        if (err.response) {
            console.error('响应状态:', err.response.status);
            console.error('响应数据:', JSON.stringify(err.response.data));
        }
        return null;
    }
}

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: '情绪炼金术师服务运行中 🔮' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`
🔮 情绪炼金术师服务器已启动
📍 本地地址: http://localhost:${PORT}
📡 API 端点: POST /api/alchemy

下一步：运行 Cloudflare Tunnel 暴露公网地址
命令: cloudflared tunnel --url http://localhost:${PORT}
    `);
});
