// 本地番剧数据配置
import animeJson from "./anime.json";
export interface AnimeItem {
	title: string;
	status: "watching" | "completed" | "planned";
	rating: number;
	cover: string;
	description: string;
	episodes: string;
	year: string;
	genre: string[];
	studio: string;
	link: string;
	progress: number;
	totalEpisodes: number;
	startDate: string;
	endDate: string;
}

// 番剧数据保存在 anime.json 中，推荐用工作台（双击根目录的「个人工作台.bat」）来管理
const localAnimeList = animeJson as AnimeItem[];

export default localAnimeList;
