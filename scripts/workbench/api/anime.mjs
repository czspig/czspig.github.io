// 追番：src/data/anime.json + public/assets/anime/

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { coverImage } from "../lib/images.mjs";
import { abs, httpError, readJson, stampShanghai, writeJson } from "../lib/util.mjs";

const JSON_PATH = "src/data/anime.json";
const COVER_DIR = "public/assets/anime";
const COVER_URL = "/assets/anime/";
const STATUSES = new Set(["watching", "completed", "planned"]);

const read = () => readJson(JSON_PATH);

function clean(input, cover) {
	const num = (v, d = 0) => (Number.isFinite(Number(v)) && v !== "" ? Number(v) : d);
	const str = (v) => String(v ?? "").trim();
	const title = str(input.title);
	if (!title) throw httpError(400, "番剧名不能为空");
	const total = Math.max(0, Math.round(num(input.totalEpisodes)));
	const status = STATUSES.has(input.status) ? input.status : "planned";
	let progress = Math.max(0, Math.round(num(input.progress)));
	if (total) progress = Math.min(progress, total);
	if (status === "completed" && total) progress = total;
	return {
		title,
		status,
		rating: Math.min(10, Math.max(0, num(input.rating))),
		cover,
		description: str(input.description),
		episodes: total ? `${total} 集` : str(input.episodes),
		year: str(input.year),
		genre: [...new Set((input.genre || []).map(str).filter(Boolean))],
		studio: str(input.studio),
		link: str(input.link),
		progress,
		totalEpisodes: total,
		startDate: str(input.startDate),
		endDate: str(input.endDate),
	};
}

function removeCoverIfUnused(url, list) {
	if (!url?.startsWith(COVER_URL) || list.some((a) => a.cover === url)) return;
	const file = path.join(abs(COVER_DIR), path.basename(url));
	if (fs.existsSync(file)) fs.rmSync(file);
}

export const routes = {
	"GET /api/anime": () => ({ items: read() }),

	"POST /api/anime": async ({ body }) => {
		const list = read();
		const index = Number.isInteger(body.index) ? body.index : -1;
		if (index >= 0 && list[index]?.title !== body.originalTitle) {
			throw httpError(409, "列表已经变了，请刷新页面后再改");
		}
		const old = index >= 0 ? list[index] : null;
		let cover = old?.cover || "";
		if (body.newCover) {
			fs.mkdirSync(abs(COVER_DIR), { recursive: true });
			const name = `${stampShanghai()}-${crypto.randomBytes(3).toString("hex")}.webp`;
			fs.writeFileSync(path.join(abs(COVER_DIR), name), await coverImage(Buffer.from(body.newCover.data, "base64"), 600, 800));
			cover = COVER_URL + name;
		}
		const item = clean(body.item || {}, cover);
		if (index >= 0) list[index] = item;
		else list.unshift(item);
		writeJson(JSON_PATH, list);
		if (old && old.cover !== cover) removeCoverIfUnused(old.cover, list);
		return { items: read() };
	},

	"DELETE /api/anime/:index": ({ params, query }) => {
		const list = read();
		const i = Number(params.index);
		if (list[i]?.title !== query.get("title")) throw httpError(409, "列表已经变了，请刷新页面后再删");
		const [removed] = list.splice(i, 1);
		writeJson(JSON_PATH, list);
		removeCoverIfUnused(removed.cover, list);
		return { items: read() };
	},
};
