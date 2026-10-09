// 日记：src/data/diary.json + public/images/diary/

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { processImage } from "../lib/images.mjs";
import { abs, httpError, readJson, stampShanghai, writeJson } from "../lib/util.mjs";

const JSON_PATH = "src/data/diary.json";
const IMG_DIR = "public/images/diary";
const IMG_URL = "/images/diary/";

function read() {
	return readJson(JSON_PATH);
}

function write(list) {
	list.sort((a, b) => new Date(b.date) - new Date(a.date));
	writeJson(JSON_PATH, list);
}

function clean(input, id) {
	const entry = { id, content: String(input.content || "").trim(), date: String(input.date) };
	const images = (input.images || []).filter((s) => typeof s === "string");
	if (images.length) entry.images = images;
	for (const key of ["location", "mood"]) {
		const v = String(input[key] || "").trim();
		if (v) entry[key] = v;
	}
	const tags = [...new Set((input.tags || []).map((t) => String(t).trim()).filter(Boolean))];
	if (tags.length) entry.tags = tags;
	return entry;
}

async function saveUploads(files) {
	fs.mkdirSync(abs(IMG_DIR), { recursive: true });
	const urls = [];
	for (const f of files) {
		const out = await processImage(Buffer.from(f.data, "base64"), f.name, { max: 1600 });
		const ext = path.extname(f.name).toLowerCase() === ".gif" ? ".gif" : ".webp";
		const name = `${stampShanghai()}-${crypto.randomBytes(3).toString("hex")}${ext}`;
		fs.writeFileSync(path.join(abs(IMG_DIR), name), out);
		urls.push(IMG_URL + name);
	}
	return urls;
}

function removeOrphans(candidates, list) {
	const used = new Set(list.flatMap((e) => e.images || []));
	for (const url of candidates) {
		if (!url.startsWith(IMG_URL) || used.has(url)) continue;
		const file = path.join(abs(IMG_DIR), path.basename(url));
		if (fs.existsSync(file)) fs.rmSync(file);
	}
}

export const routes = {
	"GET /api/diary": () => ({ entries: read() }),

	"POST /api/diary": async ({ body }) => {
		const uploads = body.newImages || [];
		if (!String(body.content || "").trim() && !(body.images || []).length && !uploads.length) {
			throw httpError(400, "写点什么或者加张图片吧");
		}
		const list = read();
		const added = await saveUploads(uploads);
		const input = { ...body, images: [...(body.images || []), ...added] };
		let previous = [];
		if (body.id) {
			const i = list.findIndex((e) => e.id === body.id);
			if (i === -1) throw httpError(404, "这条日记不存在了");
			previous = list[i].images || [];
			list[i] = clean(input, body.id);
		} else {
			list.push(clean(input, list.reduce((m, e) => Math.max(m, e.id), 0) + 1));
		}
		write(list);
		removeOrphans(previous, list);
		return { entries: read() };
	},

	"DELETE /api/diary/:id": ({ params }) => {
		const id = Number(params.id);
		const list = read();
		const entry = list.find((e) => e.id === id);
		if (!entry) throw httpError(404, "这条日记不存在了");
		const rest = list.filter((e) => e.id !== id);
		write(rest);
		removeOrphans(entry.images || [], rest);
		return { entries: read() };
	},
};
