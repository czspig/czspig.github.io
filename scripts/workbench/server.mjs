// czspig 的日记工作台：本地网页，写日记、管理图片、一键提交并推送到 GitHub
// 启动：pnpm workbench，或双击根目录的「日记工作台.bat」
// 只监听 127.0.0.1，并用启动时随机生成的令牌校验每个请求

import { execFile, spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const sharp = require("sharp");

const ROOT = process.env.BLOG_ROOT || path.resolve(here, "../..");
const DIARY_JSON = "src/data/diary.json";
const DIARY_IMG_DIR = "public/images/diary";
const DIARY_IMG_URL = "/images/diary/";
const SITE_URL = "https://czspig.github.io/diary/";
const TOKEN = crypto.randomBytes(16).toString("hex");
const MAX_BODY = 60 * 1024 * 1024;

const abs = (p) => path.join(ROOT, p);

// ---------- 日记数据 ----------

function readDiary() {
	return JSON.parse(fs.readFileSync(abs(DIARY_JSON), "utf8"));
}

function writeDiary(list) {
	list.sort((a, b) => new Date(b.date) - new Date(a.date));
	fs.writeFileSync(abs(DIARY_JSON), `${JSON.stringify(list, null, "\t")}\n`);
}

function cleanEntry(input, id) {
	const entry = {
		id,
		content: String(input.content || "").trim(),
		date: String(input.date || new Date().toISOString()),
	};
	const images = (input.images || []).filter((s) => typeof s === "string");
	if (images.length) entry.images = images;
	const location = String(input.location || "").trim();
	if (location) entry.location = location;
	const mood = String(input.mood || "").trim();
	if (mood) entry.mood = mood;
	const tags = (input.tags || []).map((t) => String(t).trim()).filter(Boolean);
	if (tags.length) entry.tags = [...new Set(tags)];
	return entry;
}

async function saveImages(dataUrls) {
	fs.mkdirSync(abs(DIARY_IMG_DIR), { recursive: true });
	const d = new Date();
	const p2 = (n) => String(n).padStart(2, "0");
	const stamp = `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
	const saved = [];
	for (const dataUrl of dataUrls) {
		const m = /^data:image\/[\w.+-]+;base64,(.+)$/.exec(dataUrl);
		if (!m) throw new Error("图片格式无法识别");
		const name = `${stamp}-${crypto.randomBytes(3).toString("hex")}.webp`;
		// rotate() 按照片方向信息摆正；输出 webp 时会丢弃 EXIF（包括拍摄位置）
		await sharp(Buffer.from(m[1], "base64"))
			.rotate()
			.resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
			.webp({ quality: 82 })
			.toFile(path.join(abs(DIARY_IMG_DIR), name));
		saved.push(DIARY_IMG_URL + name);
	}
	return saved;
}

// 删除不再被任何日记引用的、工作台上传的图片
function removeOrphanImages(candidates, list) {
	const used = new Set(list.flatMap((e) => e.images || []));
	for (const url of candidates) {
		if (!url.startsWith(DIARY_IMG_URL) || used.has(url)) continue;
		const file = path.join(abs(DIARY_IMG_DIR), path.basename(url));
		if (fs.existsSync(file)) fs.rmSync(file);
	}
}

// ---------- git ----------

function git(args, extraConfig = []) {
	return new Promise((resolve) => {
		execFile(
			"git",
			[...extraConfig, ...args],
			{ cwd: ROOT, windowsHide: true, maxBuffer: 10 * 1024 * 1024 },
			(err, stdout, stderr) => {
				resolve({ ok: !err, out: `${stdout}${stderr}`.trim() });
			},
		);
	});
}

const DIARY_PATHS = [DIARY_JSON, DIARY_IMG_DIR];

async function gitStatus() {
	const st = await git(["status", "--porcelain", "--", ...DIARY_PATHS]);
	const changes = st.out ? st.out.split("\n").length : 0;
	const ahead = await git(["rev-list", "--count", "@{u}..HEAD"]);
	return { changes, unpushed: ahead.ok ? Number(ahead.out) || 0 : 0 };
}

async function publish() {
	const log = [];
	const add = await git(["add", "--", ...DIARY_PATHS]);
	if (!add.ok) throw new Error(add.out);
	const staged = await git(["diff", "--cached", "--quiet", "--", ...DIARY_PATHS]);
	if (!staged.ok) {
		const newest = readDiary()[0];
		const summary = newest
			? newest.content.replace(/\s+/g, " ").slice(0, 30)
			: "更新";
		const commit = await git([
			"commit",
			"-m",
			`日记：${summary}`,
			"--",
			...DIARY_PATHS,
		]);
		log.push(commit.out);
		if (!commit.ok) throw new Error(commit.out);
	} else {
		log.push("没有新的日记改动，直接推送已有提交。");
	}
	// 先按 git 自己的配置推送；失败时再绕过代理重试（适合代理软件没开的情况）
	let push = await git(["push"]);
	if (!push.ok) {
		log.push(push.out, "直接推送失败，正在绕过代理重试……");
		push = await git(["push"], ["-c", "http.proxy=", "-c", "https.proxy="]);
	}
	log.push(push.out);
	if (!push.ok) throw new Error(log.join("\n"));
	return log.join("\n");
}

// ---------- HTTP ----------

function send(res, status, body, type = "application/json; charset=utf-8") {
	res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
	res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req) {
	return new Promise((resolve, reject) => {
		let size = 0;
		const chunks = [];
		req.on("data", (c) => {
			size += c.length;
			if (size > MAX_BODY) {
				reject(new Error("内容太大（图片总共超过 60MB）"));
				req.destroy();
			} else chunks.push(c);
		});
		req.on("end", () => {
			try {
				resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
			} catch {
				reject(new Error("请求格式错误"));
			}
		});
		req.on("error", reject);
	});
}

const MIME = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml" };

async function handle(req, res, port) {
	const host = req.headers.host || "";
	if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) {
		return send(res, 403, { error: "forbidden" });
	}
	const url = new URL(req.url, `http://${host}`);

	if (req.method === "GET" && url.pathname === "/") {
		const html = fs
			.readFileSync(path.join(here, "index.html"), "utf8")
			.replace("__TOKEN__", TOKEN)
			.replace("__SITE_URL__", SITE_URL);
		return send(res, 200, html, "text/html; charset=utf-8");
	}

	// 预览 public/ 下的图片
	if (req.method === "GET" && url.pathname.startsWith("/media/")) {
		const rel = decodeURIComponent(url.pathname.slice("/media/".length));
		const file = path.resolve(abs("public"), rel);
		if (!file.startsWith(abs("public") + path.sep) || !fs.existsSync(file)) {
			return send(res, 404, { error: "not found" });
		}
		return send(res, 200, fs.readFileSync(file), MIME[path.extname(file).toLowerCase()] || "application/octet-stream");
	}

	if (!url.pathname.startsWith("/api/")) return send(res, 404, { error: "not found" });
	if (req.headers["x-token"] !== TOKEN) return send(res, 403, { error: "令牌无效，请重新打开工作台" });

	try {
		if (req.method === "GET" && url.pathname === "/api/diary") {
			return send(res, 200, { entries: readDiary(), status: await gitStatus() });
		}

		if (req.method === "POST" && url.pathname === "/api/diary") {
			const body = await readBody(req);
			if (!String(body.content || "").trim() && !(body.images || []).length && !(body.newImages || []).length) {
				return send(res, 400, { error: "写点什么或者加张图片吧" });
			}
			const list = readDiary();
			const added = await saveImages(body.newImages || []);
			const input = { ...body, images: [...(body.images || []), ...added] };
			let previousImages = [];
			if (body.id) {
				const i = list.findIndex((e) => e.id === body.id);
				if (i === -1) return send(res, 404, { error: "这条日记不存在了" });
				previousImages = list[i].images || [];
				list[i] = cleanEntry(input, body.id);
			} else {
				const id = list.reduce((m, e) => Math.max(m, e.id), 0) + 1;
				list.push(cleanEntry(input, id));
			}
			writeDiary(list);
			removeOrphanImages(previousImages, list);
			return send(res, 200, { entries: readDiary(), status: await gitStatus() });
		}

		const del = /^\/api\/diary\/(\d+)$/.exec(url.pathname);
		if (req.method === "DELETE" && del) {
			const id = Number(del[1]);
			const list = readDiary();
			const entry = list.find((e) => e.id === id);
			if (!entry) return send(res, 404, { error: "这条日记不存在了" });
			const rest = list.filter((e) => e.id !== id);
			writeDiary(rest);
			removeOrphanImages(entry.images || [], rest);
			return send(res, 200, { entries: readDiary(), status: await gitStatus() });
		}

		if (req.method === "POST" && url.pathname === "/api/publish") {
			const log = await publish();
			return send(res, 200, { log, status: await gitStatus() });
		}

		return send(res, 404, { error: "not found" });
	} catch (e) {
		return send(res, 500, { error: e.message || String(e) });
	}
}

function listen(port, attemptsLeft = 10) {
	const server = http.createServer((req, res) => handle(req, res, port));
	server.once("error", (e) => {
		if (e.code === "EADDRINUSE" && attemptsLeft > 0) listen(port + 1, attemptsLeft - 1);
		else throw e;
	});
	server.listen(port, "127.0.0.1", () => {
		const url = `http://127.0.0.1:${port}/`;
		console.log(`\n  ⚡ 日记工作台已启动：${url}\n  关闭这个窗口即可退出。\n`);
		if (!process.env.WORKBENCH_NO_OPEN) {
			const opener = process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
			spawn(opener[0], opener[1], { stdio: "ignore", detached: true }).unref();
		}
	});
}

listen(Number(process.env.WORKBENCH_PORT) || 4400);
