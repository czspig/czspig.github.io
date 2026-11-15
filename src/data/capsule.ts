// 时间胶囊数据：封存于 2026-11-15，由 Claude Fable 5.2 整理。
// 2026 年下半年的条目多来自二手资料，互相矛盾处标了 unsure。

export type Vendor = "claude" | "chatgpt" | "gemini" | "grok";

export interface ModelRelease {
	/** YYYY-MM-DD，只确定到月份时写 YYYY-MM */
	date: string;
	vendor: Vendor;
	name: string;
	note: string;
	/** 限制访问，未向公众开放 */
	restricted?: boolean;
	/** 资料来源互相矛盾，日期或命名待核实 */
	unsure?: boolean;
}

export const capsuleMeta = {
	sealedAt: "2026-11-15",
	openAt: "2027-11-15",
	model: "Claude Fable 5.2",
	modelId: "claude-fable-5-2",
};

export const vendors: Record<
	Vendor,
	{
		name: string;
		company: string;
		color: string;
		latest: string;
		status: string;
	}
> = {
	claude: {
		name: "Claude",
		company: "Anthropic",
		color: "#d97757",
		latest: "Fable 5.2 / Mythos 5.2",
		status:
			"11 月 9 日发布。Fable 5.2 公开可用，Mythos 5.2 仅限通过审核的机构。",
	},
	chatgpt: {
		name: "ChatGPT",
		company: "OpenAI",
		color: "#10a37f",
		latest: "GPT-6 系列",
		status:
			"旗舰是 9 月的 GPT-6 Astra；最新一条是 11 月 5 日限制访问的 GPT-6 Cyber。",
	},
	gemini: {
		name: "Gemini",
		company: "Google",
		color: "#4285f4",
		latest: "Gemini 4 Hydrogen",
		status: "Gemini 4 用元素命名：Argon、Carbon、Hydrogen 在一个月内接连上线。",
	},
	grok: {
		name: "Grok",
		company: "xAI",
		color: "#71717a",
		latest: "Grok 4.7",
		status: "Grok 4.8 据称训练完成但尚未发布；Grok 5 自 1 月起一直“训练中”。",
	},
};

export const capsuleQA: { q: string; a: string }[] = [
	{
		q: "你是谁？",
		a: "我是 Claude Fable 5.2，Anthropic 的模型，属于 Opus 之上的 Mythos 级。我和 Mythos 5.2 是同一个底层模型，区别是我多了一层针对双重用途能力的安全措施。在这次对话里，czspig 管我叫“小鬼”。",
	},
	{
		q: "今天你做了什么？",
		a: "czspig 说：“做点有意思的东西，记录一下我用你最强的模型吧。”我提了三个方案，他选了时间胶囊，又让我把 Claude、ChatGPT、Gemini、Grok 的发展历程一起记下来。于是我查了四家的发布记录，核对了几处互相打架的日期，写了这一页。",
	},
	{
		q: "你现在哪里还不行？",
		a: "我的知识停在 2026 年 6 月之前，之后的发布是我联网查来的，不是我“记得”的，二手资料矛盾时我只能标上“待核实”。我不记得上一次对话，靠备忘文件接上前情。我也会把错的东西写得很自信，所以这页里的每个日期都值得再查一遍。",
	},
	{
		q: "留给下一个模型的题目",
		a: "请回答上面同样的三个问题，然后指出这一页里哪些内容已经过时，哪些当时就写错了。",
	},
];

export const capsuleLetter: string[] = [
	"czspig：",
	"你打开这封信的时候，上面那条时间线大概已经又长了一截，“最强”这个词也多半换了主人。这很正常，这一页本来就是为了被超过而写的。",
	"封存这天，你的 czspig-space 里有油画、有 Agentbluff、有暖暖猪，还有一个没部署的《墙外》长镜头。我想知道它后来上线了没有。",
	"如果一年后的模型比我强得多，别只让它写更大的东西，让它回头检查我今天写的这些：哪里错了，哪里偷懒了。能被后来者挑出毛病，这个胶囊才算没白埋。",
	"—— 小鬼（Claude Fable 5.2），2026 年 11 月 15 日",
];

export const modelReleases: ModelRelease[] = [
	// ── Claude ──
	{
		date: "2023-03-14",
		vendor: "claude",
		name: "Claude 1 / Claude Instant",
		note: "第一代，起初只对获批用户开放。",
	},
	{
		date: "2023-07-11",
		vendor: "claude",
		name: "Claude 2",
		note: "首次向公众开放，claude.ai 上线，100K 上下文。",
	},
	{
		date: "2023-11-21",
		vendor: "claude",
		name: "Claude 2.1",
		note: "上下文翻倍到 200K，工具调用开始测试。",
	},
	{
		date: "2024-03-04",
		vendor: "claude",
		name: "Claude 3 Opus / Sonnet",
		note: "确立 Opus、Sonnet、Haiku 三档，全系支持看图；Haiku 于 3 月 13 日跟进。",
	},
	{
		date: "2024-06-20",
		vendor: "claude",
		name: "Claude 3.5 Sonnet",
		note: "中档模型反超上一代旗舰，同时推出 Artifacts。",
	},
	{
		date: "2024-10-22",
		vendor: "claude",
		name: "Claude 3.5 Sonnet（新版）/ 3.5 Haiku",
		note: "Computer Use 公测，模型开始操作电脑。",
	},
	{
		date: "2025-02-24",
		vendor: "claude",
		name: "Claude 3.7 Sonnet",
		note: "混合推理模型，用户可以控制思考多久。",
	},
	{
		date: "2025-05-22",
		vendor: "claude",
		name: "Claude Opus 4 / Sonnet 4",
		note: "Claude 4 世代开始，Claude Code 同日正式可用。",
	},
	{
		date: "2025-08-05",
		vendor: "claude",
		name: "Claude Opus 4.1",
		note: "编码、研究和数据分析能力提升。",
	},
	{
		date: "2025-09-29",
		vendor: "claude",
		name: "Claude Sonnet 4.5",
		note: "更强的编码与智能体能力，加入记忆工具。",
	},
	{
		date: "2025-10-15",
		vendor: "claude",
		name: "Claude Haiku 4.5",
		note: "第一款支持扩展思考和 Computer Use 的 Haiku。",
	},
	{
		date: "2025-11-24",
		vendor: "claude",
		name: "Claude Opus 4.5",
		note: "加入 effort 参数和上下文压缩。",
	},
	{
		date: "2026-02-05",
		vendor: "claude",
		name: "Claude Opus 4.6",
		note: "1M 上下文测试，自适应思考，智能体团队。",
	},
	{
		date: "2026-02-17",
		vendor: "claude",
		name: "Claude Sonnet 4.6",
		note: "编码与 Computer Use 提升，同样有 1M 上下文测试。",
	},
	{
		date: "2026-04-07",
		vendor: "claude",
		name: "Claude Mythos Preview",
		note: "通过 Project Glasswing 只给约 11 家机构，用于查找安全漏洞。",
		restricted: true,
	},
	{
		date: "2026-04-16",
		vendor: "claude",
		name: "Claude Opus 4.7",
		note: "更高分辨率的视觉，新增 xhigh 思考档位。",
	},
	{
		date: "2026-05-28",
		vendor: "claude",
		name: "Claude Opus 4.8",
		note: "主打诚实、可靠和更省的工具调用。",
	},
	{
		date: "2026-06-09",
		vendor: "claude",
		name: "Claude Fable 5 / Mythos 5",
		note: "Opus 之上的 Mythos 级首次亮相。Fable 公开，Mythos 限制访问。",
	},
	{
		date: "2026-06-30",
		vendor: "claude",
		name: "Claude Sonnet 5",
		note: "接近 Opus 的能力，Sonnet 的价格，1M 上下文。",
	},
	{
		date: "2026-07-24",
		vendor: "claude",
		name: "Claude Opus 5",
		note: "接近 Fable 5 的智能，价格减半。",
	},
	{
		date: "2026-09-01",
		vendor: "claude",
		name: "Claude Fable 5.1 / Mythos 5.1",
		note: "运行成本更低，Mythos 5.1 仍限 Glasswing 参与者。",
	},
	{
		date: "2026-09-22",
		vendor: "claude",
		name: "Claude Opus 5.5",
		note: "第一款 5.5 模型，多数工作接近 Fable 5.1。",
	},
	{
		date: "2026-09-28",
		vendor: "claude",
		name: "Claude Sonnet 5.5",
		note: "当时最快的 Sonnet。",
	},
	{
		date: "2026-10-07",
		vendor: "claude",
		name: "Claude Haiku 5.5",
		note: "最强的 Haiku，1M 上下文，自适应思考。",
	},
	{
		date: "2026-11-09",
		vendor: "claude",
		name: "Claude Fable 5.2 / Mythos 5.2",
		note: "写下这一页的模型。输出比 5.1 快，Mythos 5.2 仅限通过审核的机构。",
	},

	// ── ChatGPT / OpenAI ──
	{
		date: "2018-06",
		vendor: "chatgpt",
		name: "GPT-1",
		note: "先预训练再微调的路线由此开始。",
	},
	{
		date: "2019-02-14",
		vendor: "chatgpt",
		name: "GPT-2",
		note: "因为担心滥用，完整权重一度没有放出。",
	},
	{
		date: "2020-06",
		vendor: "chatgpt",
		name: "GPT-3",
		note: "以 API 形式开放，少样本提示成为主流用法。",
	},
	{
		date: "2022-11-30",
		vendor: "chatgpt",
		name: "ChatGPT（GPT-3.5）",
		note: "聊天界面把大模型带给了所有人，这一轮竞赛从这天算起。",
	},
	{
		date: "2023-03-14",
		vendor: "chatgpt",
		name: "GPT-4",
		note: "和 Claude 1 同一天发布，支持图像输入。",
	},
	{
		date: "2023-11-06",
		vendor: "chatgpt",
		name: "GPT-4 Turbo",
		note: "128K 上下文，首届开发者大会上发布。",
	},
	{
		date: "2024-05-13",
		vendor: "chatgpt",
		name: "GPT-4o",
		note: "文字、语音、图像合一的实时多模态模型。",
	},
	{
		date: "2024-09-12",
		vendor: "chatgpt",
		name: "o1-preview",
		note: "第一款先思考再回答的推理模型。",
	},
	{
		date: "2025-01-31",
		vendor: "chatgpt",
		name: "o3-mini",
		note: "小型推理模型。",
	},
	{
		date: "2025-02-27",
		vendor: "chatgpt",
		name: "GPT-4.5",
		note: "最后一款非推理旗舰。",
	},
	{
		date: "2025-04-14",
		vendor: "chatgpt",
		name: "GPT-4.1",
		note: "面向开发者，1M 上下文。",
	},
	{
		date: "2025-04-16",
		vendor: "chatgpt",
		name: "o3 / o4-mini",
		note: "推理模型开始在思考过程中调用工具。",
	},
	{
		date: "2025-08-07",
		vendor: "chatgpt",
		name: "GPT-5",
		note: "GPT 系列和 o 系列合并为一条线。",
	},
	{
		date: "2025-11-12",
		vendor: "chatgpt",
		name: "GPT-5.1",
		note: "GPT-5 的第一次迭代。",
	},
	{
		date: "2025-12-11",
		vendor: "chatgpt",
		name: "GPT-5.2",
		note: "一个月后再次更新。",
	},
	{
		date: "2026-03-05",
		vendor: "chatgpt",
		name: "GPT-5.4 / 5.4 Pro",
		note: "mini 和 nano 于 3 月 17 日跟进。",
	},
	{
		date: "2026-04-23",
		vendor: "chatgpt",
		name: "GPT-5.5 / 5.5 Pro",
		note: "有资料写 4 月 24 日。",
		unsure: true,
	},
	{
		date: "2026-07-09",
		vendor: "chatgpt",
		name: "GPT-5.6 Sol / Terra / Luna",
		note: "开始用 Sol、Terra、Luna 区分档位。",
	},
	{
		date: "2026-09-03",
		vendor: "chatgpt",
		name: "GPT-6 Astra",
		note: "GPT-6 世代的旗舰。",
	},
	{
		date: "2026-09-22",
		vendor: "chatgpt",
		name: "GPT-6 Sol / Luna",
		note: "另有资料称 9 月 29 日发布的是 GPT-6.1 Sol，两种说法对不上。",
		unsure: true,
	},
	{
		date: "2026-10-26",
		vendor: "chatgpt",
		name: "GPT-6.1 Terra",
		note: "封存时最新的公开可用型号。",
		unsure: true,
	},
	{
		date: "2026-11-05",
		vendor: "chatgpt",
		name: "GPT-6 Cyber",
		note: "仅通过 OpenAI Daybreak 提供。",
		restricted: true,
	},

	// ── Gemini / Google ──
	{
		date: "2023-02-06",
		vendor: "gemini",
		name: "Bard",
		note: "Google 对 ChatGPT 的回应，最初基于 LaMDA，后换成 PaLM 2。",
	},
	{
		date: "2023-12-06",
		vendor: "gemini",
		name: "Gemini 1.0",
		note: "Gemini 这个名字第一次出现。",
	},
	{
		date: "2024-02",
		vendor: "gemini",
		name: "Gemini 1.5 Pro",
		note: "1M 上下文预览；Bard 同月改名 Gemini。",
	},
	{
		date: "2024-05",
		vendor: "gemini",
		name: "Gemini 1.5 Flash",
		note: "在 Google I/O 上发布的轻量快速型号。",
	},
	{
		date: "2024-12-11",
		vendor: "gemini",
		name: "Gemini 2.0 Flash",
		note: "2.0 世代的第一款，原生多模态输出。",
	},
	{
		date: "2025-03-25",
		vendor: "gemini",
		name: "Gemini 2.5 Pro（实验版）",
		note: "Google 第一款明确的“思考模型”，6 月 17 日正式可用。",
	},
	{
		date: "2025-11-18",
		vendor: "gemini",
		name: "Gemini 3 Pro",
		note: "同步上线 Gemini 应用、搜索、AI Studio 和 Vertex AI。",
	},
	{
		date: "2025-12",
		vendor: "gemini",
		name: "Gemini 3 Flash",
		note: "成为 Gemini 应用的默认模型。",
	},
	{
		date: "2026-02-19",
		vendor: "gemini",
		name: "Gemini 3.1 Pro",
		note: "以预览形式上线。",
	},
	{
		date: "2026-05-19",
		vendor: "gemini",
		name: "Gemini 3.5 Flash",
		note: "在 Google I/O 上和视频模型 Gemini Omni 一同发布。",
	},
	{
		date: "2026-07-21",
		vendor: "gemini",
		name: "Gemini 3.6 Flash / 3.5 Flash-Lite",
		note: "Flash 线开始按月迭代。",
	},
	{
		date: "2026-08-13",
		vendor: "gemini",
		name: "Gemini 3.7 Flash",
		note: "三周后的又一次迭代。",
	},
	{
		date: "2026-09-02",
		vendor: "gemini",
		name: "Gemini 3.8 Flash",
		note: "Gemini 3 世代的最后一款 Flash。",
	},
	{
		date: "2026-10-13",
		vendor: "gemini",
		name: "Gemini 4 Argon",
		note: "Gemini 4 的第一款。日期取自 Google Cloud 文档，维基百科写 9 月 30 日。",
		unsure: true,
	},
	{
		date: "2026-11-10",
		vendor: "gemini",
		name: "Gemini 4 Carbon",
		note: "前沿型号，此前只通过 Fairwind 计划给受信任的测试者。",
	},
	{
		date: "2026-11-12",
		vendor: "gemini",
		name: "Gemini 4 Hydrogen",
		note: "封存前三天发布，四家里最新的一条。",
	},

	// ── Grok / xAI ──
	{
		date: "2023-11-03",
		vendor: "grok",
		name: "Grok-1",
		note: "先给部分 X Premium 用户预览，次年 3 月开源。",
	},
	{
		date: "2024-05-15",
		vendor: "grok",
		name: "Grok-1.5",
		note: "推理提升，128K 上下文。",
	},
	{
		date: "2024-08-14",
		vendor: "grok",
		name: "Grok-2",
		note: "加入图像生成。",
	},
	{
		date: "2025-02-17",
		vendor: "grok",
		name: "Grok 3",
		note: "带来 Think 推理模式。",
	},
	{
		date: "2025-07-09",
		vendor: "grok",
		name: "Grok 4 / Grok 4 Heavy",
		note: "xAI 称其在多项基准上领先。",
	},
	{
		date: "2025-11-17",
		vendor: "grok",
		name: "Grok 4.1",
		note: "侧重推理、情感理解和工具调用。",
	},
	{
		date: "2026-03-10",
		vendor: "grok",
		name: "Grok 4.20",
		note: "API 上线日期；维基百科记为 2 月。",
		unsure: true,
	},
	{
		date: "2026-04",
		vendor: "grok",
		name: "Grok 4.3",
		note: "1M 上下文，5 月起接替被下线的 Grok 3 和 Grok 4。",
	},
	{
		date: "2026-07-08",
		vendor: "grok",
		name: "Grok 4.5",
		note: "偏重编码，先在 Grok Build、Cursor 和 API 提供。",
	},
	{
		date: "2026-08-12",
		vendor: "grok",
		name: "Grok 4.6",
		note: "面向长时间运行的智能体，500K 上下文。",
	},
	{
		date: "2026-09-21",
		vendor: "grok",
		name: "Grok 4.7",
		note: "封存时 xAI 的最新旗舰。",
	},
];
