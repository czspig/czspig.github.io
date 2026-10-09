// 日记数据配置
// 用于管理日记页面的数据

export interface DiaryItem {
	id: number;
	content: string;
	date: string;
	images?: string[];
	location?: string;
	mood?: string;
	tags?: string[];
}

// 示例日记数据
// 写新日记：复制下面这段模板，粘贴到数组最前面，id 不要重复
// {
// 	id: 2,
// 	content: "今天的日记内容……",
// 	date: "2026-10-10T20:00:00+08:00", // 日期时间，+08:00 表示北京时间
// 	images: ["/images/diary/2026-10-10.jpg"], // 可选，图片放在 public/images/diary/ 下
// 	location: "北京", // 可选
// 	mood: "开心", // 可选
// 	tags: ["生活"], // 可选
// },
const diaryData: DiaryItem[] = [
	{
		id: 1,
		content: "博客开张啦！换上了奇犽的主题，雷光已就位 ⚡",
		date: "2026-10-09T12:00:00+08:00",
		images: ["/images/albums/killua/1.webp"],
		mood: "开心",
		tags: ["博客"],
	},
];

// 获取日记列表（按时间倒序）
export const getDiaryList = (limit?: number) => {
	const sortedData = [...diaryData].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);

	if (limit && limit > 0) {
		return sortedData.slice(0, limit);
	}

	return sortedData;
};

// 获取所有标签
export const getAllTags = () => {
	const tags = new Set<string>();
	for (const item of diaryData) {
		if (item.tags) {
			for (const tag of item.tags) {
				tags.add(tag);
			}
		}
	}
	return Array.from(tags).sort();
};
