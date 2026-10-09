// 工作台通用工具：路径、JSON 读写、北京时间、文件名处理

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = process.env.BLOG_ROOT || path.resolve(here, "../../..");
export const abs = (p) => path.join(ROOT, p);

export function readJson(rel) {
	return JSON.parse(fs.readFileSync(abs(rel), "utf8"));
}

export function writeJson(rel, data) {
	fs.writeFileSync(abs(rel), `${JSON.stringify(data, null, "\t")}\n`);
}

// 站点按北京时间写日期，和电脑本身的时区设置无关
const TZ = "Asia/Shanghai";

function shanghaiParts(date = new Date()) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: TZ,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
	}).formatToParts(date);
	return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

/** 2026-10-09 */
export function todayShanghai() {
	const p = shanghaiParts();
	return `${p.year}-${p.month}-${p.day}`;
}

/** 20261009-213005，用于生成不重复的文件名 */
export function stampShanghai() {
	const p = shanghaiParts();
	return `${p.year}${p.month}${p.day}-${p.hour}${p.minute}${p.second}`;
}

/** 把文件名清理成适合放进网址的样子，保留中文 */
export function safeName(name) {
	const cleaned = String(name)
		.normalize("NFC")
		.replace(/[\\/:*?"<>|#%&{}$!'@+`=\s]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^[-.]+|[-.]+$/g, "");
	return cleaned.slice(0, 60) || "file";
}

/** 文章、相册的文件夹名：只允许字母、数字、中文、短横线、下划线 */
export function isValidSlug(slug) {
	return /^[\p{L}\p{N}][\p{L}\p{N}_-]{0,79}$/u.test(String(slug));
}

/** 在已有名字里找一个不重复的名字：a.webp → a-2.webp */
export function uniqueName(name, taken) {
	if (!taken.has(name)) return name;
	const ext = path.extname(name);
	const base = name.slice(0, name.length - ext.length);
	for (let i = 2; ; i++) {
		const candidate = `${base}-${i}${ext}`;
		if (!taken.has(candidate)) return candidate;
	}
}

export const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".bmp", ".tif", ".tiff", ".svg", ".heic"]);
export const isImageName = (name) => IMAGE_EXTS.has(path.extname(name).toLowerCase());

export function httpError(status, message) {
	return Object.assign(new Error(message), { status });
}
