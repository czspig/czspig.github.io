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
