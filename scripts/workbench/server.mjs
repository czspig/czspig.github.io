// czspig 的个人工作台：本地网页后台，管理日记、文章、追番、相册，一键发布到网站
// 启动：双击根目录的「个人工作台.bat」，或运行 pnpm workbench
// 只监听 127.0.0.1，并用启动时随机生成的令牌校验每个接口请求

import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { routes as albums } from "./api/albums.mjs";
import { routes as anime } from "./api/anime.mjs";
import { routes as diary } from "./api/diary.mjs";
import { routes as posts, serveFile } from "./api/posts.mjs";
import { gitStatus, publish } from "./lib/git.mjs";
import { abs } from "./lib/util.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const TOKEN = crypto.randomBytes(16).toString("hex");
const MAX_BODY = 300 * 1024 * 1024;

const MIME = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".webp": "image/webp",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".svg": "image/svg+xml",
	".avif": "image/avif",
	".bmp": "image/bmp",
};
const mime = (name) => MIME[path.extname(name).toLowerCase()] || "application/octet-stream";

// 接口表：「方法 路径」→ 处理函数，路径里的 :xxx 是参数
const table = Object.entries({
	...diary,
	...posts,
	...anime,
	...albums,
	"GET /api/status": async () => ({ status: await gitStatus() }),
	"POST /api/publish": async () => ({ log: await publish() }),
}).map(([key, fn]) => {
	const [method, pattern] = key.split(" ");
	const names = [];
	const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, n) => (names.push(n), "([^/]+)"))}$`);
	return { method, re, names, fn };
});

function send(res, status, body, type = "application/json; charset=utf-8") {
	res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
	res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req) {
	return new Promise((resolve, reject) => {
		let size = 0;
		const chunks = [];
		req.on("data", (c) => {
			size += c.length;
			if (size > MAX_BODY) {
				reject(Object.assign(new Error("上传内容太大（超过 300MB）"), { status: 413 }));
				req.destroy();
			} else chunks.push(c);
		});
		req.on("end", () => {
			try {
				resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
			} catch {
				reject(Object.assign(new Error("请求格式错误"), { status: 400 }));
			}
		});
		req.on("error", reject);
	});
}

/** 在 base 目录下安全地取文件，防止 ../ 跳出目录 */
function safeFile(base, rel) {
	const file = path.resolve(base, rel);
	return file.startsWith(path.resolve(base) + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}

async function handle(req, res, port) {
	const host = req.headers.host || "";
	if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) return send(res, 403, { error: "forbidden" });
	const url = new URL(req.url, `http://${host}`);
	const p = decodeURIComponent(url.pathname);

	if (req.method === "GET" && !p.startsWith("/api/")) {
		if (p === "/") {
			const html = fs.readFileSync(path.join(here, "public/index.html"), "utf8").replace("{{TOKEN}}", TOKEN);
			return send(res, 200, html, MIME[".html"]);
		}
		if (p === "/vendor/marked.js") {
			return send(res, 200, fs.readFileSync(path.join(here, "../../node_modules/marked/lib/marked.esm.js")), MIME[".js"]);
		}
		let file = null;
		if (p.startsWith("/static/")) file = safeFile(path.join(here, "public"), p.slice(8));
		else if (p.startsWith("/media/")) file = safeFile(abs("public"), p.slice(7));
		if (file) return send(res, 200, fs.readFileSync(file), mime(file));
		const m = /^\/files\/(stage|post)\/([^/]+)\/([^/]+)$/.exec(p);
		if (m) {
			const f = serveFile(m[1], m[2], m[3]);
			if (f) return send(res, 200, f.data, mime(f.name));
		}
		return send(res, 404, { error: "not found" });
	}

	if (req.headers["x-token"] !== TOKEN) return send(res, 403, { error: "令牌无效，请关掉工作台窗口后重新打开" });

	for (const r of table) {
		const m = r.method === req.method && r.re.exec(p);
		if (!m) continue;
		try {
			const params = Object.fromEntries(r.names.map((n, i) => [n, m[i + 1]]));
			const body = req.method === "POST" ? await readBody(req) : {};
			const result = await r.fn({ params, body, query: url.searchParams });
			// 每次改动后顺便带上最新的 git 状态，方便界面刷新「未发布」提示
			return send(res, 200, { ...result, status: await gitStatus() });
		} catch (e) {
			if (!e.status) console.error(e);
			return send(res, e.status || 500, { error: e.message || String(e) });
		}
	}
	return send(res, 404, { error: "not found" });
}

function listen(port, attemptsLeft = 10) {
	const server = http.createServer((req, res) => handle(req, res, port));
	server.once("error", (e) => {
		if (e.code === "EADDRINUSE" && attemptsLeft > 0) listen(port + 1, attemptsLeft - 1);
		else throw e;
	});
	server.listen(port, "127.0.0.1", () => {
		const url = `http://127.0.0.1:${port}/`;
		console.log(`\n  ⚡ 个人工作台已启动：${url}\n  用的时候别关这个窗口，关掉就退出了。\n`);
		if (!process.env.WORKBENCH_NO_OPEN) {
			const [cmd, args] = process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
			spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
		}
	});
}

listen(Number(process.env.WORKBENCH_PORT) || 4400);
