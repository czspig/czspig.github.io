// git 操作：查看改动、提交、推送（推送失败时绕过代理重试）

import { execFile } from "node:child_process";

import { ROOT } from "./util.mjs";

// 工作台管理的内容，以及在状态栏里显示的分类
export const AREAS = [
	{ key: "diary", label: "日记", paths: ["src/data/diary.json", "public/images/diary"] },
	{ key: "posts", label: "文章", paths: ["src/content/posts"] },
	{ key: "anime", label: "追番", paths: ["src/data/anime.json", "public/assets/anime"] },
	{ key: "albums", label: "相册", paths: ["public/images/albums"] },
];
const ALL_PATHS = AREAS.flatMap((a) => a.paths);

export function git(args, extraConfig = []) {
	return new Promise((resolve) => {
		execFile(
			"git",
			["-c", "core.quotepath=false", ...extraConfig, ...args],
			{ cwd: ROOT, windowsHide: true, maxBuffer: 20 * 1024 * 1024 },
			(err, stdout, stderr) => resolve({ ok: !err, out: `${stdout}${stderr}`.trim() }),
		);
	});
}

function areaOf(file) {
	return AREAS.find((a) => a.paths.some((p) => file === p || file.startsWith(`${p}/`)));
}

/** 每个分类各有几处未发布的改动，以及有几个已提交但没推送的提交 */
export async function gitStatus() {
	const st = await git(["status", "--porcelain", "-uall", "--", ...ALL_PATHS]);
	const changes = Object.fromEntries(AREAS.map((a) => [a.key, 0]));
	for (const line of st.out ? st.out.split("\n") : []) {
		let file = line.slice(3).trim();
		if (file.includes(" -> ")) file = file.split(" -> ").pop();
		file = file.replace(/^"|"$/g, "");
		const area = areaOf(file);
		if (area) changes[area.key]++;
	}
	const ahead = await git(["rev-list", "--count", "@{u}..HEAD"]);
	return { changes, unpushed: ahead.ok ? Number(ahead.out) || 0 : 0 };
}

export async function publish() {
	const log = [];
	const status = await gitStatus();
	const add = await git(["add", "-A", "--", ...ALL_PATHS]);
	if (!add.ok) throw new Error(add.out);

	const staged = await git(["diff", "--cached", "--quiet", "--", ...ALL_PATHS]);
	if (!staged.ok) {
		const summary = AREAS.filter((a) => status.changes[a.key] > 0)
			.map((a) => a.label)
			.join("、");
		const commit = await git(["commit", "-m", `工作台更新：${summary || "内容"}`, "--", ...ALL_PATHS]);
		log.push(commit.out);
		if (!commit.ok) throw new Error(commit.out);
	} else {
		log.push("没有新的改动，直接推送已有的提交。");
	}

	let push = await git(["push"]);
	if (!push.ok) {
		log.push(push.out, "直接推送失败，正在绕过代理重试……");
		push = await git(["push"], ["-c", "http.proxy=", "-c", "https.proxy="]);
	}
	log.push(push.out);
	if (!push.ok) {
		const hint = /rejected|fetch first|non-fast-forward/.test(push.out)
			? "\n\nGitHub 上有你本地没有的新提交（比如在网页上改过东西）。请告诉 Claude 帮你合并。"
			: "";
		throw new Error(log.join("\n") + hint);
	}
	return log.join("\n");
}
