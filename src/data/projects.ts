// Project data configuration file
// Used to manage data for the project display page

export interface Project {
	id: string;
	title: string;
	description: string;
	image: string;
	category: "web" | "mobile" | "desktop" | "other";
	techStack: string[];
	status: "completed" | "in-progress" | "planned";
	liveDemo?: string;
	sourceCode?: string;
	visitUrl?: string;
	visitLabel?: string; // 访问按钮文字，默认「访问」
	startDate: string;
	endDate?: string;
	featured?: boolean;
	tags?: string[];
	showImage?: boolean;
}

export const projectsData: Project[] = [
	{
		id: "czspig-blog",
		title: "czspig's blog",
		description: "基于 Mizuki 主题搭建的个人博客，奇犽「神速·雷光」风格。",
		image: "/assets/projects/czspig-blog.webp",
		category: "web",
		techStack: ["Astro", "TypeScript", "Tailwind CSS", "Svelte"],
		status: "in-progress",
		startDate: "2026-10-09",
		featured: true,
		tags: ["博客", "Astro"],
	},
	{
		id: "czspig-product-critic",
		title: "猪猪产品毒舌官",
		description:
			"犀利但鼓励的 AI 产品经理评审工具。输入产品想法，选择温和导师 / 毒舌 PM / 甲方视角和毒舌程度，生成含评分、证据链、MVP 建议与验证计划的结构化报告；支持项目版本迭代对比，以及 Markdown、开发 Prompt 和任务包导出。",
		image: "/assets/projects/czspig-product-critic.webp",
		category: "web",
		techStack: ["Vue 3", "TypeScript", "Spring Boot", "MySQL", "DeepSeek"],
		status: "in-progress",
		sourceCode: "https://github.com/czspig/czspig-product-critic",
		visitUrl: "", // TODO: 上线后填入在线地址
		startDate: "2026-06-23",
		featured: true,
		tags: ["AI", "产品评审"],
	},
	{
		id: "czspig-work-hunter",
		title: "猪猪求职助手",
		description:
			"在自己电脑上运行、只读的 AI 岗位筛选助手。采集 BOSS 直聘岗位，经过关键词初筛、一票否决词和外包识别后，用 DeepSeek 对照简历打分并给出理由，还能按 JD 一键生成定制简历；不替你发任何消息，投不投由你决定。",
		image: "/assets/projects/czspig-work-hunter.webp",
		category: "desktop",
		techStack: ["Python", "React", "TypeScript", "SQLite", "DeepSeek"],
		status: "in-progress",
		sourceCode: "https://github.com/czspig/czspig-work-hunter",
		startDate: "2026-10-18",
		featured: true,
		tags: ["AI", "求职"],
	},
	{
		id: "njupt-ima-wiki",
		title: "南京邮电大学发展规划知识库",
		description:
			"作为腾讯云校园大使，我在腾讯 ima 上搭建的南京邮电大学发展规划知识库，把学校发展规划相关资料整理到一处，可以直接在 ima 里检索、用 AI 提问。",
		image: "/assets/projects/njupt-ima-wiki.webp",
		category: "other",
		techStack: ["ima", "知识库"],
		status: "in-progress",
		visitUrl:
			"https://ima.qq.com/wiki/?shareId=a0f7a557924d4013bfb1679eff4b291f031e1d245884a699039234740ab4ed3a",
		visitLabel: "ima知识库",
		startDate: "2026-10-18",
		featured: true,
		tags: ["知识库", "腾讯云校园大使"],
	},
	{
		id: "czspig-repo-lab",
		title: "猪猪 Repo 研究所",
		description:
			"开源项目源码级解析合集。挑选值得研究的开源仓库，按「取样 → 测绘 → 解剖 → 复现 → 结论」五步，从目录结构、核心链路读到运行方式，每份报告都附带能在本地跑起来的最小实验；首页提供研究台账搜索、标签筛选和技术栈雷达。首批解析报告整理中。",
		image: "/assets/projects/czspig-repo-lab.webp",
		category: "web",
		techStack: ["HTML", "CSS", "JavaScript"],
		status: "in-progress",
		sourceCode: "https://github.com/czspig/czspig-repo-lab",
		visitUrl: "https://czspig.github.io/czspig-repo-lab/",
		startDate: "2026-10-19",
		featured: true,
		tags: ["开源", "源码解析"],
	},
	{
		id: "czspig-oil-paint",
		title: "czspig-oil-paint",
		description:
			"浏览器里能走动的实时油画。用 three.js 把 3D 场景画成厚涂油画：树叶、树干、雪、极光、斗篷褶皱都是一笔笔钉在世界上的笔触，镜头移动时颜料始终贴在物体上。有两个场景：极光下的雪山脊（尽头有一座可以进去的小木屋）和秋天的树林。WASD 移动、鼠标看、Shift 跑、空格跳，需要支持 WebGL2 的桌面浏览器。基于 Patch 的开源项目 oil-paint（MIT / CC0）。",
		image: "/assets/projects/czspig-oil-paint.webp",
		category: "web",
		techStack: ["three.js", "WebGL2", "GLSL", "Vite"],
		status: "completed",
		sourceCode: "https://github.com/czspig/czspig-oil-paint",
		visitUrl: "https://czspig.github.io/czspig-oil-paint/",
		visitLabel: "在线体验",
		startDate: "2026-11-12",
		featured: true,
		tags: ["3D", "油画渲染", "游戏"],
	},
	{
		id: "czspig-social-agent",
		title: "暖暖猪",
		description:
			"替你盯着飞书消息的桌面助手。它以你本人的身份读取消息，规则先筛、拿不准的交给 Claude，分成「要马上看」「晚点汇总」「不用看」三档：要紧的立刻弹通知并推卡片到飞书，不急的攒成定时简报，其余的替你挡下。还能从消息和会议里提取待办、整理会议纪要、起草回复和周报、帮你找对口的人。它只提醒你，不会替你回复任何人。可以直接在网页上体验演示版（示例消息，不接模型和飞书）；飞书接入和模型调用还没有用真实账号验证过。",
		image: "/assets/projects/czspig-social-agent-cover.webp",
		category: "desktop",
		techStack: ["Electron", "React", "TypeScript", "SQLite", "Claude API", "飞书开放平台"],
		status: "in-progress",
		sourceCode: "https://github.com/czspig/czspig-social-agent",
		visitUrl: "https://czspig.github.io/czspig-social-agent/",
		visitLabel: "在线体验",
		startDate: "2026-11-12",
		featured: true,
		tags: ["AI 助手", "飞书", "效率工具"],
	},
	{
		id: "czspig-agentbluff",
		title: "Agentbluff",
		description:
			"八位 AI 围坐一桌互相玩狼人杀，观众以上帝视角实时观战：能看到每个人的身份、夜里的行动和白天的发言，局后还能逐轮复盘、翻看选手档案。8 人标准局（2 狼人、预言家、女巫、猎人、3 平民），规则引擎用离线模拟跑过大量对局校验。后端零依赖 Node.js，SQLite 存档，SSE 实时推送；接入 DeepSeek 后由模型发言，不配 key 时用离线模板，并设有并发、每 IP、每日的对局上限来控制费用。",
		image: "/assets/projects/czspig-agentbluff.webp",
		category: "web",
		techStack: ["React", "Vite", "Node.js", "SQLite", "DeepSeek API"],
		status: "in-progress",
		sourceCode: "https://github.com/czspig/AgentBluff",
		startDate: "2026-11-13",
		featured: true,
		tags: ["AI 对战", "狼人杀", "游戏"],
	},
	{
		id: "czspig-book-of-hours",
		title: "Horae · 二〇二六年时祷书",
		description:
			"一本可以翻的泥金装饰手抄本。照中世纪「时祷书」的体例画了十二个月，画面保留中世纪农事的模样，讲的却是二〇二六年人与 AI 一同劳作的一年：修枝是删代码，放鹰是放出智能体，再蒸是模型蒸馏，十一月林中饲猪是封存这一天。打开先是烛光书桌上合着的书，点封面绕书脊翻开；目录之后是左图右文的十二月令，最后是逐月解析。文字、版式、翻页和金箔反光出自 Claude Fable 5.2，书桌、封面、书页和十三幅细密画全部由 ChatGPT 绘制。中英双语，英文用铜版花体，中文用马善政楷书。",
		image: "/assets/projects/czspig-book-of-hours.webp",
		category: "web",
		techStack: ["HTML", "CSS 3D", "JavaScript", "ChatGPT 绘图"],
		status: "completed",
		sourceCode: "https://github.com/czspig/czspig-book-of-hours-",
		visitUrl: "https://czspig.github.io/czspig-book-of-hours-/",
		visitLabel: "在线阅读",
		startDate: "2026-11-15",
		featured: true,
		tags: ["中世纪", "手抄本", "AI 合作"],
	},
	{
		id: "czspig-virtual-gallery",
		title: "他们会怎么画今天",
		description:
			"一座可以在浏览器里走动的虚拟美术馆。假如文艺复兴、巴洛克、浪漫主义、印象派和现代的画家活在今天，他们会怎么画早高峰地铁、外卖骑手、聚会时各自刷手机和通宵加班？五个展室各挂四幅，共二十幅仿作，每间的墙面、地板、画框和灯光都换成那个时代的样子。拖动看、WASD 或摇杆走，走到画前会弹出展签，可以听语音导览；另有一页网页版原作对照，把二十组历史原作和仿作并排摆放，写明各借了什么。所有图像（画作、墙地贴图、画框、展签、标题、图标）都由 ChatGPT 绘制；三维展厅、灯光、展签文字与导览词出自 Claude。原作图来自 Wikimedia Commons 的公有领域复制件。",
		image: "/assets/projects/czspig-virtual-gallery.webp",
		category: "web",
		techStack: ["Three.js", "Vite", "JavaScript", "ChatGPT 绘图"],
		status: "completed",
		sourceCode: "https://github.com/czspig/czspig-virtual-gallery",
		visitUrl: "https://czspig.github.io/czspig-virtual-gallery/",
		visitLabel: "进入展厅",
		startDate: "2026-11-15",
		featured: true,
		tags: ["美术馆", "3D", "AI 合作"],
	},
	{
		id: "czspig-genesis",
		title: "新创世纪",
		description:
			"米开朗基罗西斯廷礼拜堂天顶画《创世纪》九格的 AI 时代重绘。打开先是整面天顶，往下滚动就沿着礼拜堂从入口走向祭坛，九格依次拉近，故事从挪亚醉酒一路倒退回神分开光暗。每格先看原作，再随着一层噪点散开变成 AI 版：前三格神不改，只把光、日月、海水换成屏幕冷光、硅晶圆和海底光缆；从「创造亚当」起，造物与被造的换成了这个时代的人和瓷白的人形机器，马斯克、奥特曼、达里奥·阿莫迪、黄仁勋分别站在创造、召唤、守门、献祭的位置。按住画面可以看回原作，「创造亚当」那一格能拖动手指，却永远碰不到。九幅重绘由 ChatGPT 绘制，网页、转场、展签和中英双语文字出自 Claude；原作图来自 Wikimedia Commons。",
		image: "/assets/projects/czspig-genesis.webp",
		category: "web",
		techStack: ["WebGL2", "Vite", "JavaScript", "ChatGPT 绘图"],
		status: "completed",
		sourceCode: "https://github.com/czspig/czspig-genesis",
		visitUrl: "https://czspig.github.io/czspig-genesis/",
		visitLabel: "抬头看天顶",
		startDate: "2026-11-15",
		featured: true,
		tags: ["西斯廷", "壁画", "AI 合作"],
	},
	{
		id: "czspig-school-of-athens",
		title: "AI 雅典学院",
		description:
			"照拉斐尔《雅典学院》的构图重画人工智能的七十年。正中仍是两种手势：指天的辛顿警惕可能超越人类的智能，按地的杨立昆坚持智能要从物理世界中学会；左侧是图灵、香农、洛夫莱斯这些起源与提问，右侧是冯·诺依曼、奥特曼、黄仁勋这些建造者。四十位人物都能点开，看他站在原作谁的位置、为什么站在那里；还能在画上连出师承与论战，拖动时间轴看人物从约 820 年的花拉子米一路亮到 2026，或拉开分割线对照拉斐尔原作。右缘原本是拉斐尔的自画像，留给了一位还没画完自己的 AI 画家。画面由 ChatGPT 绘制，构思、文字与网页出自 Claude；原作图来自 Wikimedia Commons。",
		image: "/assets/projects/czspig-school-of-athens.webp",
		category: "web",
		techStack: ["JavaScript", "SVG", "OpenCV", "ChatGPT 绘图"],
		status: "completed",
		sourceCode: "https://github.com/czspig/czspig-school-of-athens",
		visitUrl: "https://czspig.github.io/czspig-school-of-athens/",
		visitLabel: "走进学院",
		startDate: "2026-11-15",
		featured: true,
		tags: ["拉斐尔", "壁画", "AI 合作"],
	},
];

// Get project statistics
export const getProjectStats = () => {
	const total = projectsData.length;
	const completed = projectsData.filter((p) => p.status === "completed").length;
	const inProgress = projectsData.filter(
		(p) => p.status === "in-progress",
	).length;
	const planned = projectsData.filter((p) => p.status === "planned").length;

	return {
		total,
		byStatus: {
			completed,
			inProgress,
			planned,
		},
	};
};

// Get projects by category
export const getProjectsByCategory = (category?: string) => {
	if (!category || category === "all") {
		return projectsData;
	}
	return projectsData.filter((p) => p.category === category);
};

// Get featured projects
export const getFeaturedProjects = () => {
	return projectsData.filter((p) => p.featured);
};

// Get all tech stacks
export const getAllTechStack = () => {
	const techSet = new Set<string>();
	projectsData.forEach((project) => {
		project.techStack.forEach((tech) => {
			techSet.add(tech);
		});
	});
	return Array.from(techSet).sort();
};
