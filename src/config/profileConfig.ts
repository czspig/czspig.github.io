import type { ProfileConfig } from "../types/config";

// 个人资料配置
export const profileConfig: ProfileConfig = {
	avatar: "assets/images/avatar.webp", // 相对于 /src 目录。如果以 '/' 开头，则相对于 /public 目录
	name: "czspig",
	bio: "雷光一闪，神速前行 ⚡",
	typewriter: {
		enable: true, // 启用个人简介打字机效果
		speed: 80, // 打字速度（毫秒）
	},
	links: [
		// 在这里填写你自己的社交链接，例如：
		// {
		// 	name: "GitHub",
		// 	icon: "fa7-brands:github",
		// 	url: "https://github.com/your-name",
		// },
		// {
		// 	name: "Bilibili",
		// 	icon: "fa7-brands:bilibili",
		// 	url: "https://space.bilibili.com/your-uid",
		// },
	],
};
