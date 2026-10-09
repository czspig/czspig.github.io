// 文章：src/content/posts/<文件夹>/index.md + 同文件夹里的图片
// 导入流程：上传 .md / .zip / 图片 → 放进临时区（stage）→ 自动匹配文中图片 → 编辑 → 保存

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { parseFrontmatter, stringifyFrontmatter } from "../lib/frontmatter.mjs";
import { outputExt, processImage } from "../lib/images.mjs";
import { abs, httpError, isImageName, isValidSlug, safeName, todayShanghai, uniqueName } from "../lib/util.mjs";
import { readZip } from "../lib/zip.mjs";

const DIR = "src/content/posts";
const MD_EXTS = new Set([".md", ".markdown", ".mdx", ".txt"]);

// ---------- 读取已有文章 ----------

function locate(slug) {
	if (!isValidSlug(slug)) throw httpError(400, "文章地址只能用中英文、数字、短横线和下划线");
	const dir = path.join(abs(DIR), slug);
	for (const f of ["index.md", "index.mdx"]) {
		if (fs.existsSync(path.join(dir, f))) return { kind: "folder", dir, file: path.join(dir, f) };
	}
	for (const ext of [".md", ".mdx"]) {
		const file = path.join(abs(DIR), slug + ext);
		if (fs.existsSync(file)) return { kind: "file", dir: abs(DIR), file };
	}
	return null;
}

function listSlugs() {
	if (!fs.existsSync(abs(DIR))) return [];
	return fs.readdirSync(abs(DIR), { withFileTypes: true }).flatMap((d) => {
		if (d.isDirectory() && locate(d.name)) return [d.name];
		if (d.isFile() && /\.mdx?$/.test(d.name)) return [d.name.replace(/\.mdx?$/, "")];
		return [];
	}).filter(isValidSlug);
}

const plainText = (md) =>
	md
		.replace(/```[\s\S]*?```/g, "")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, "")
		.replace(/<[^>]+>/g, "")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/^[ \t]*(?:[>#|]+|[-*+]|\d+\.)[ \t]*/gm, "")
		.replace(/[*_`~]/g, "");

function fileUrl(slug, loc, ref) {
	if (!ref) return "";
	if (/^https?:/.test(ref)) return ref;
	if (ref.startsWith("/")) return `/media${ref}`;
	return `/files/post/${encodeURIComponent(slug)}/${encodeURIComponent(path.basename(ref))}`;
}

function summary(slug) {
	const loc = locate(slug);
	const { data, body } = parseFrontmatter(fs.readFileSync(loc.file, "utf8"));
	return {
		slug,
		title: String(data.title || slug),
		published: String(data.published || ""),
		description: String(data.description || ""),
		category: String(data.category || ""),
		tags: Array.isArray(data.tags) ? data.tags : [],
		draft: data.draft === true,
		pinned: data.pinned === true,
		cover: fileUrl(slug, loc, data.image),
		words: plainText(body).replace(/\s/g, "").length,
		mdx: loc.file.endsWith(".mdx"),
	};
}

function list() {
	return listSlugs()
		.map(summary)
		.sort((a, b) => (b.pinned - a.pinned) || b.published.localeCompare(a.published));
}

// ---------- 临时区：还没保存的图片 ----------

const stages = new Map();

function newStage() {
	// 清理两小时前的临时区
	for (const [id, s] of stages) if (Date.now() - s.created > 2 * 3600e3) stages.delete(id);
	const id = crypto.randomBytes(8).toString("hex");
	stages.set(id, { created: Date.now(), files: new Map(), byOrig: new Map() });
	return id;
}

function getStage(id) {
	const s = stages.get(id);
	if (!s) throw httpError(410, "临时文件已过期，请重新上传");
	return s;
}

function addToStage(stage, origName, data, takenExtra = new Set()) {
	const base = safeName(path.basename(origName, path.extname(origName)));
	const name = uniqueName(`${base}${outputExt(origName)}`, new Set([...stage.files.keys(), ...takenExtra]));
	stage.files.set(name, { orig: origName, data });
	stage.byOrig.set(path.basename(origName).toLowerCase(), name);
	return name;
}

/** 拆开上传的文件：zip 解压，区分 Markdown 和图片 */
function unpack(files) {
	const out = { markdown: [], images: [] };
	const take = (name, data) => {
		const ext = path.extname(name).toLowerCase();
		if (MD_EXTS.has(ext)) out.markdown.push({ name, text: data.toString("utf8") });
		else if (isImageName(name)) out.images.push({ name, data });
	};
	for (const f of files || []) {
		const buf = Buffer.from(f.data, "base64");
		if (f.name.toLowerCase().endsWith(".zip")) for (const z of readZip(buf)) take(z.name, z.data);
		else take(f.name, buf);
	}
	return out;
}

// ---------- 文中图片的匹配 ----------

const MD_IMG = /!\[([^\]]*)\]\(\s*(<[^>]+>|[^)\s]+)((?:\s+(?:"[^"]*"|'[^']*'))?)\s*\)/g;
const HTML_IMG = /(<img\b[^>]*?\bsrc\s*=\s*)(["'])([^"']+)\2/gi;

async function download(url) {
	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), 15000);
	try {
		const res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
		const type = res.headers.get("content-type") || "";
		if (!res.ok || !type.startsWith("image/")) return null;
		const data = Buffer.from(await res.arrayBuffer());
		if (data.length > 30 * 1024 * 1024) return null;
		const ext = { "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp", "image/svg+xml": ".svg" }[type.split(";")[0]] || ".jpg";
		let base = "image";
		try {
			base = path.basename(new URL(url).pathname, path.extname(new URL(url).pathname)) || "image";
		} catch {}
		return { name: `${base.slice(0, 40)}${ext}`, data };
	} catch {
		return null;
	} finally {
		clearTimeout(timer);
	}
}

/** 把文中的图片地址改成 ./文件名，返回新正文和找不到的图片 */
async function resolveRefs(body, stage, slug) {
	const existing = new Set();
	const loc = slug ? locate(slug) : null;
	if (loc?.kind === "folder") for (const f of fs.readdirSync(loc.dir)) existing.add(f);

	const cache = new Map();
	const missing = [];

	async function resolve(rawUrl) {
		const url = rawUrl.replace(/^<|>$/g, "").trim();
		if (cache.has(url)) return cache.get(url);
		let result = null;
		if (url.startsWith("./") && (stage?.files.has(url.slice(2)) || existing.has(url.slice(2)))) {
			result = url;
		} else if (/^https?:\/\//i.test(url)) {
			const got = stage && (await download(url));
			if (got) result = `./${addToStage(stage, got.name, got.data, existing)}`;
		} else if (url.startsWith("data:image/")) {
			const m = /^data:image\/([\w.+-]+);base64,(.+)$/.exec(url);
			if (m && stage) result = `./${addToStage(stage, `image.${m[1].replace("jpeg", "jpg").replace("svg+xml", "svg")}`, Buffer.from(m[2], "base64"), existing)}`;
		} else if (!url.startsWith("/")) {
			let base = url.split(/[?#]/)[0];
			try {
				base = decodeURIComponent(base);
			} catch {}
			const key = path.basename(base).toLowerCase();
			if (stage?.byOrig.has(key)) result = `./${stage.byOrig.get(key)}`;
			else if (existing.has(path.basename(base))) result = `./${path.basename(base)}`;
		} else {
			result = url; // 以 / 开头的网站内图片，原样保留
		}
		if (!result) missing.push(url);
		cache.set(url, result);
		return result;
	}

	const replacements = [];
	for (const m of body.matchAll(MD_IMG)) replacements.push({ index: m.index, length: m[0].length, url: m[2], make: (u) => `![${m[1]}](${u}${m[3]})` });
	for (const m of body.matchAll(HTML_IMG)) replacements.push({ index: m.index, length: m[0].length, url: m[3], make: (u) => `${m[1]}${m[2]}${u}${m[2]}` });
	replacements.sort((a, b) => a.index - b.index);

	let out = "";
	let last = 0;
	for (const r of replacements) {
		if (r.index < last) continue;
		const resolved = await resolve(r.url);
		out += body.slice(last, r.index) + (resolved ? r.make(resolved) : body.slice(r.index, r.index + r.length));
		last = r.index + r.length;
	}
	out += body.slice(last);
	return { body: out, missing: [...new Set(missing)] };
}

// ---------- 导入 Markdown ----------

function suggestMeta(md, fileName) {
	const { data, body: afterFm } = parseFrontmatter(md);
	let body = afterFm.replace(/\r\n/g, "\n");
	let title = data.title ? String(data.title) : "";
	// 飞书导出的第一行通常是「# 标题」，网站会单独显示标题，所以从正文里拿掉
	const h1 = /^\s*#\s+(.+?)\s*#*\s*\n/.exec(body);
	if (h1) {
		if (!title) title = h1[1].trim();
		if (h1[1].trim() === title) body = body.slice(h1[0].length);
	}
	if (!title) title = path.basename(fileName, path.extname(fileName));
	const firstPara = plainText(body).split(/\n\s*\n/).map((s) => s.replace(/\s+/g, " ").trim()).find((s) => s.length > 10) || "";
	return {
		meta: {
			title,
			published: data.published ? String(data.published).slice(0, 10) : todayShanghai(),
			description: data.description ? String(data.description) : firstPara.slice(0, 120),
			tags: Array.isArray(data.tags) ? data.tags : [],
			category: data.category ? String(data.category) : "",
			image: "",
			draft: data.draft === true,
			pinned: data.pinned === true,
		},
		body,
	};
}

// ---------- 保存 ----------

const isoDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ""));

async function save({ originalSlug, slug, stageId, meta, body }) {
	slug = String(slug || "").trim();
	if (!isValidSlug(slug)) throw httpError(400, "文章地址只能用中英文、数字、短横线和下划线，且不能以符号开头");
	if (!String(meta?.title || "").trim()) throw httpError(400, "标题不能为空");
	if (!isoDate(meta.published)) throw httpError(400, "发布日期格式应为 2026-10-09");

	const stage = stageId ? getStage(stageId) : null;
	const old = originalSlug ? locate(originalSlug) : null;
	if (originalSlug && !old) throw httpError(404, "原文章不存在了");
	if ((!old || originalSlug !== slug) && locate(slug)) throw httpError(409, `已经有地址为「${slug}」的文章了`);

	// 目标文件夹：新文章、改了地址、或原来是单文件的文章，都整理成「文件夹/index.md」
	const dir = path.join(abs(DIR), slug);
	let raw = {};
	let fileName = "index.md";
	if (old) {
		raw = parseFrontmatter(fs.readFileSync(old.file, "utf8")).raw;
		if (old.file.endsWith(".mdx")) fileName = "index.mdx";
		if (old.kind === "folder" && originalSlug !== slug) fs.renameSync(old.dir, dir);
		if (old.kind === "file") {
			fs.mkdirSync(dir, { recursive: true });
			fs.rmSync(old.file);
		}
	} else {
		fs.mkdirSync(dir, { recursive: true });
	}

	// 只写入正文或封面实际用到的临时图片
	const used = new Set([...String(body).matchAll(/\(\.\/([^)\s]+)/g), ...String(body).matchAll(/src=["']\.\/([^"']+)/g)].map((m) => m[1]));
	if (String(meta.image || "").startsWith("./")) used.add(meta.image.slice(2));
	if (stage) {
		for (const [name, f] of stage.files) {
			if (used.has(name)) fs.writeFileSync(path.join(dir, name), await processImage(f.data, f.orig));
		}
	}

	const data = {
		title: String(meta.title).trim(),
		published: meta.published,
		description: String(meta.description || "").trim(),
		image: String(meta.image || "").trim(),
		tags: [...new Set((meta.tags || []).map((t) => String(t).trim()).filter(Boolean))],
		category: String(meta.category || "").trim(),
		// 只在打开时写入，关闭时整行省略
		draft: meta.draft ? true : undefined,
		pinned: meta.pinned ? true : undefined,
	};
	fs.writeFileSync(path.join(dir, fileName), stringifyFrontmatter(data, raw, String(body)));
	if (stage) stages.delete(stageId);
	return { posts: list(), slug };
}

// ---------- 路由 ----------

export const routes = {
	"GET /api/posts": () => ({ posts: list() }),

	"GET /api/posts/:slug": ({ params }) => {
		const loc = locate(params.slug);
		if (!loc) throw httpError(404, "文章不存在");
		const { data, body } = parseFrontmatter(fs.readFileSync(loc.file, "utf8"));
		const files = loc.kind === "folder" ? fs.readdirSync(loc.dir).filter(isImageName) : [];
		return {
			slug: params.slug,
			meta: {
				title: String(data.title || ""),
				published: String(data.published || "").slice(0, 10),
				description: String(data.description || ""),
				tags: Array.isArray(data.tags) ? data.tags : [],
				category: String(data.category || ""),
				image: String(data.image || ""),
				draft: data.draft === true,
				pinned: data.pinned === true,
			},
			body,
			files,
		};
	},

	"POST /api/posts/import": async ({ body }) => {
		const { markdown, images } = unpack(body.files);
		if (!markdown.length) throw httpError(400, "没有找到 .md 文件。请上传飞书导出的 Markdown，或者包含它的 zip 压缩包");
		markdown.sort((a, b) => b.text.length - a.text.length);
		const md = markdown[0];
		const stageId = newStage();
		const stage = getStage(stageId);
		for (const img of images) addToStage(stage, img.name, img.data);
		const { meta, body: rawBody } = suggestMeta(md.text, path.basename(md.name));
		const resolved = await resolveRefs(rawBody, stage, null);
		// 没有指定封面时，默认用第一张图
		const firstImg = /\(\.\/([^)\s]+)/.exec(resolved.body);
		if (firstImg) meta.image = `./${firstImg[1]}`;
		return { stageId, meta, body: resolved.body, missing: resolved.missing, files: [...stage.files.keys()], ignored: markdown.slice(1).map((m) => m.name) };
	},

	"POST /api/stage": () => ({ stageId: newStage() }),

	"POST /api/stage/:id/files": ({ params, body }) => {
		const stage = getStage(params.id);
		const { images } = unpack(body.files);
		if (!images.length) throw httpError(400, "没有找到图片");
		const existing = new Set();
		const loc = body.slug ? locate(body.slug) : null;
		if (loc?.kind === "folder") for (const f of fs.readdirSync(loc.dir)) existing.add(f);
		const added = images.map((img) => ({ orig: img.name, name: addToStage(stage, img.name, img.data, existing) }));
		return { added, files: [...stage.files.keys()] };
	},

	"POST /api/stage/:id/resolve": async ({ params, body }) => {
		const stage = getStage(params.id);
		return resolveRefs(String(body.body || ""), stage, body.slug || null);
	},

	"POST /api/posts/save": ({ body }) => save(body),

	"DELETE /api/posts/:slug": ({ params }) => {
		const loc = locate(params.slug);
		if (!loc) throw httpError(404, "文章不存在");
		if (loc.kind === "folder") fs.rmSync(loc.dir, { recursive: true });
		else fs.rmSync(loc.file);
		return { posts: list() };
	},
};

// 预览用：临时区和文章文件夹里的图片
export function serveFile(kind, a, name) {
	name = path.basename(name);
	if (kind === "stage") {
		const f = stages.get(a)?.files.get(name);
		return f ? { data: f.data, name: f.orig } : null;
	}
	const loc = isValidSlug(a) ? locate(a) : null;
	if (!loc || loc.kind !== "folder") return null;
	const file = path.join(loc.dir, name);
	return fs.existsSync(file) ? { data: fs.readFileSync(file), name } : null;
}
