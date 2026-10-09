// 相册：public/images/albums/<相册名>/（info.json + 照片 + cover.webp）

import fs from "node:fs";
import path from "node:path";

import { coverImage, outputExt, processImage } from "../lib/images.mjs";
import { abs, httpError, isImageName, isValidSlug, safeName, todayShanghai, uniqueName } from "../lib/util.mjs";
import { readZip } from "../lib/zip.mjs";

const DIR = "public/images/albums";
const COVERS = new Set(["cover.webp", "cover.jpg"]);

const albumDir = (id) => {
	if (!isValidSlug(id)) throw httpError(400, "相册名只能用中英文、数字、短横线和下划线");
	return path.join(abs(DIR), id);
};

function readInfo(id) {
	const file = path.join(albumDir(id), "info.json");
	return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
}

function photosOf(id) {
	return fs
		.readdirSync(albumDir(id))
		.filter((f) => isImageName(f) && !COVERS.has(f))
		.sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }));
}

function summary(id) {
	const dir = albumDir(id);
	const info = readInfo(id);
	const cover = ["cover.webp", "cover.jpg"].find((f) => fs.existsSync(path.join(dir, f))) || "";
	return {
		id,
		info,
		external: info.mode === "external",
		cover: cover ? `/images/albums/${id}/${cover}?v=${fs.statSync(path.join(dir, cover)).mtimeMs}` : info.cover || "",
		photos: info.mode === "external" ? [] : photosOf(id),
	};
}

function list() {
	if (!fs.existsSync(abs(DIR))) return [];
	return fs
		.readdirSync(abs(DIR), { withFileTypes: true })
		.filter((d) => d.isDirectory() && isValidSlug(d.name))
		.map((d) => summary(d.name))
		.sort((a, b) => String(b.info.date || "").localeCompare(String(a.info.date || "")));
}

async function makeCover(id, photo) {
	const dir = albumDir(id);
	const buf = await coverImage(fs.readFileSync(path.join(dir, photo)), 800, 600);
	fs.writeFileSync(path.join(dir, "cover.webp"), buf);
	const jpg = path.join(dir, "cover.jpg");
	if (fs.existsSync(jpg)) fs.rmSync(jpg);
}

function cleanInfo(input, old) {
	const str = (v) => String(v ?? "").trim();
	const title = str(input.title);
	if (!title) throw httpError(400, "相册标题不能为空");
	const columns = Math.min(4, Math.max(1, Math.round(Number(input.columns) || 3)));
	return {
		...old,
		title,
		hidden: Boolean(input.hidden),
		description: str(input.description),
		date: str(input.date) || todayShanghai(),
		location: str(input.location),
		tags: [...new Set((input.tags || []).map(str).filter(Boolean))],
		layout: input.layout === "grid" ? "grid" : "masonry",
		columns,
	};
}

export const routes = {
	"GET /api/albums": () => ({ albums: list() }),

	"POST /api/albums": ({ body }) => {
		const id = String(body.id || "").trim();
		const dir = albumDir(id);
		const originalId = body.originalId;
		if (originalId && originalId !== id) {
			if (fs.existsSync(dir)) throw httpError(409, `已经有叫「${id}」的相册了`);
			fs.renameSync(albumDir(originalId), dir);
		} else if (!originalId) {
			if (fs.existsSync(dir)) throw httpError(409, `已经有叫「${id}」的相册了`);
			fs.mkdirSync(dir, { recursive: true });
		}
		const info = cleanInfo(body.info || {}, readInfo(id));
		fs.writeFileSync(path.join(dir, "info.json"), `${JSON.stringify(info, null, "\t")}\n`);
		return { albums: list(), id };
	},

	"POST /api/albums/:id/photos": async ({ params, body }) => {
		const dir = albumDir(params.id);
		if (!fs.existsSync(dir)) throw httpError(404, "相册不存在");
		const incoming = [];
		for (const f of body.files || []) {
			const buf = Buffer.from(f.data, "base64");
			if (f.name.toLowerCase().endsWith(".zip")) {
				for (const z of readZip(buf)) if (isImageName(z.name)) incoming.push({ name: path.basename(z.name), data: z.data });
			} else if (isImageName(f.name)) incoming.push({ name: f.name, data: buf });
		}
		if (!incoming.length) throw httpError(400, "没有找到图片");
		const taken = new Set(fs.readdirSync(dir));
		const added = [];
		for (const f of incoming) {
			const base = safeName(path.basename(f.name, path.extname(f.name)));
			const name = uniqueName(`${base}${outputExt(f.name)}`, taken);
			taken.add(name);
			fs.writeFileSync(path.join(dir, name), await processImage(f.data, f.name, { max: 2000, quality: 85 }));
			added.push(name);
		}
		const s = summary(params.id);
		if (!s.cover && added.length) await makeCover(params.id, added[0]);
		return { albums: list(), added: added.length };
	},

	"POST /api/albums/:id/cover": async ({ params, body }) => {
		const photo = path.basename(String(body.photo || ""));
		if (!photosOf(params.id).includes(photo)) throw httpError(404, "照片不存在");
		await makeCover(params.id, photo);
		return { albums: list() };
	},

	"DELETE /api/albums/:id/photos/:name": ({ params }) => {
		const name = path.basename(params.name);
		const file = path.join(albumDir(params.id), name);
		if (COVERS.has(name) || !fs.existsSync(file)) throw httpError(404, "照片不存在");
		fs.rmSync(file);
		return { albums: list() };
	},

	"DELETE /api/albums/:id": ({ params }) => {
		const dir = albumDir(params.id);
		if (!fs.existsSync(dir)) throw httpError(404, "相册不存在");
		fs.rmSync(dir, { recursive: true });
		return { albums: list() };
	},
};
