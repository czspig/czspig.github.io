// 追番页
import { $, $$, api, busy, esc, parseTags, readFiles, toast } from "./common.js";

const STATUS = { watching: "在看", completed: "看完了", planned: "想看" };
const BADGE = { watching: "primary", completed: "ok", planned: "" };

let root;
let items = [];
let filter = "all";
let editing = null; // { index, originalTitle, newCover }

export const hasUnsaved = () => !!editing?.newCover;

export function init(panel) {
	root = panel;
	root.innerHTML = `
	<div class="row">
		<div class="seg" id="a-filter">
			<button data-f="all" class="on">全部</button><button data-f="watching">在看</button><button data-f="completed">看完了</button><button data-f="planned">想看</button>
		</div>
		<span class="spacer"></span>
		<button class="btn primary" id="a-add">＋ 添加番剧</button>
	</div>
	<div class="anime-grid" id="a-grid"><div class="card empty">读取中…</div></div>

	<dialog class="dialog" id="a-dialog">
		<h3 id="a-dialog-title">添加番剧</h3>
		<div class="row" style="align-items:flex-start;gap:16px">
			<div style="width:150px">
				<label>封面（竖图）</label>
				<div class="thumb" id="a-cover" style="aspect-ratio:3/4;cursor:pointer;display:grid;place-items:center" title="点击上传封面">
					<span class="muted small">点击上传</span>
				</div>
			</div>
			<div class="fields" style="flex:1;min-width:260px">
				<div class="full"><label>番剧名</label><input type="text" id="a-title"></div>
				<div><label>状态</label><select id="a-status"><option value="watching">在看</option><option value="completed">看完了</option><option value="planned">想看</option></select></div>
				<div><label>评分（0–10）</label><input type="number" id="a-rating" min="0" max="10" step="0.1"></div>
				<div><label>看到第几集</label><input type="number" id="a-progress" min="0"></div>
				<div><label>总集数</label><input type="number" id="a-total" min="0"></div>
				<div><label>年份</label><input type="text" id="a-year" placeholder="2011"></div>
				<div><label>制作公司</label><input type="text" id="a-studio" placeholder="MADHOUSE"></div>
				<div><label>开始看</label><input type="month" id="a-start"></div>
				<div><label>看完</label><input type="month" id="a-end"></div>
				<div class="full"><label>类型（用逗号或空格分隔）</label><input type="text" id="a-genre" placeholder="冒险 热血"></div>
				<div class="full"><label>链接（可选，比如 B站番剧页）</label><input type="url" id="a-link"></div>
				<div class="full"><label>一句话介绍 / 感想</label><textarea id="a-desc" rows="2"></textarea></div>
			</div>
		</div>
		<div class="row" style="margin-top:16px">
			<span class="spacer"></span>
			<button class="btn" id="a-cancel">取消</button>
			<button class="btn primary" id="a-save">保存</button>
		</div>
	</dialog>`;

	$("#a-filter", root).addEventListener("click", (e) => {
		if (!e.target.dataset.f) return;
		filter = e.target.dataset.f;
		for (const b of $$("button", e.currentTarget)) b.classList.toggle("on", b === e.target);
		render();
	});
	$("#a-add", root).addEventListener("click", () => openDialog(-1));
	$("#a-cancel", root).addEventListener("click", () => { editing = null; $("#a-dialog", root).close(); });
	$("#a-save", root).addEventListener("click", (e) => save(e.currentTarget));
	$("#a-status", root).addEventListener("change", (e) => {
		if (e.target.value === "completed" && $("#a-total", root).value) $("#a-progress", root).value = $("#a-total", root).value;
	});

	const picker = Object.assign(document.createElement("input"), { type: "file", accept: "image/*", hidden: true });
	root.append(picker);
	$("#a-cover", root).addEventListener("click", () => picker.click());
	picker.addEventListener("change", async () => {
		const [file] = await readFiles(picker.files);
		picker.value = "";
		if (!file || !editing) return;
		editing.newCover = file;
		showCover(file.url);
	});

	$("#a-grid", root).addEventListener("click", (e) => {
		const act = e.target.dataset.act;
		if (!act) return;
		const index = Number(e.target.closest("[data-index]").dataset.index);
		if (act === "edit") openDialog(index);
		if (act === "delete") remove(index);
		if (act === "plus" || act === "minus") step(index, act === "plus" ? 1 : -1, e.target);
	});

	load();
}

async function load() {
	try {
		items = (await api("GET", "/api/anime")).items;
		render();
	} catch (e) {
		toast(e.message, true);
	}
}

function render() {
	const grid = $("#a-grid", root);
	const shown = items.map((a, index) => ({ a, index })).filter(({ a }) => filter === "all" || a.status === filter);
	if (!shown.length) {
		grid.innerHTML = `<div class="card empty" style="grid-column:1/-1">${items.length ? "这个分类下还没有番剧" : "还没有番剧，点右上角添加吧"}</div>`;
		return;
	}
	grid.innerHTML = shown.map(({ a, index }) => {
		const pct = a.totalEpisodes ? Math.round((a.progress / a.totalEpisodes) * 100) : 0;
		return `
		<article class="card anime-card hover-card" data-index="${index}">
			${a.cover ? `<img class="poster" src="${esc(a.cover.startsWith("/") ? `/media${a.cover}` : a.cover)}" alt="" loading="lazy">` : `<div class="poster muted" style="display:grid;place-items:center">没有封面</div>`}
			<div class="body">
				<div class="title">${esc(a.title)}</div>
				<div class="row small" style="gap:6px">
					<span class="badge ${BADGE[a.status] || ""}">${STATUS[a.status] || a.status}</span>
					${a.rating ? `<span class="muted">★ ${a.rating}</span>` : ""}
					${a.year ? `<span class="muted">${esc(a.year)}</span>` : ""}
				</div>
				<div class="progress"><div style="width:${pct}%"></div></div>
				<div class="stepper">
					<button class="btn small" data-act="minus" title="少看一集">−</button>
					<span>第 ${a.progress}${a.totalEpisodes ? ` / ${a.totalEpisodes}` : ""} 集</span>
					<button class="btn small" data-act="plus" title="又看了一集">＋</button>
				</div>
				<div class="ops" style="margin-top:auto">
					<button class="btn small" data-act="edit">修改</button>
					<button class="btn small danger" data-act="delete">删除</button>
				</div>
			</div>
		</article>`;
	}).join("");
}

function showCover(url) {
	$("#a-cover", root).innerHTML = url ? `<img src="${esc(url)}" alt="">` : `<span class="muted small">点击上传</span>`;
}

function openDialog(index) {
	const a = index >= 0 ? items[index] : { status: "watching", rating: "", progress: 0, totalEpisodes: "", genre: [] };
	editing = { index, originalTitle: a.title, newCover: null };
	$("#a-dialog-title", root).textContent = index >= 0 ? "修改番剧" : "添加番剧";
	const set = (id, v) => ($(`#a-${id}`, root).value = v ?? "");
	set("title", a.title);
	set("status", a.status);
	set("rating", a.rating || "");
	set("progress", a.progress ?? 0);
	set("total", a.totalEpisodes || "");
	set("year", a.year);
	set("studio", a.studio);
	set("start", a.startDate);
	set("end", a.endDate);
	set("genre", (a.genre || []).join(" "));
	set("link", a.link);
	set("desc", a.description);
	showCover(a.cover ? (a.cover.startsWith("/") ? `/media${a.cover}` : a.cover) : "");
	$("#a-dialog", root).showModal();
	$("#a-title", root).focus();
}

function collect() {
	const v = (id) => $(`#a-${id}`, root).value;
	return {
		title: v("title"),
		status: v("status"),
		rating: v("rating"),
		progress: v("progress"),
		totalEpisodes: v("total"),
		year: v("year"),
		studio: v("studio"),
		startDate: v("start"),
		endDate: v("end"),
		genre: parseTags(v("genre")),
		link: v("link"),
		description: v("desc"),
	};
}

function save(btn) {
	const item = collect();
	if (!item.title.trim()) return toast("番剧名不能为空", true);
	return busy(btn, async () => {
		const r = await api("POST", "/api/anime", {
			index: editing.index >= 0 ? editing.index : undefined,
			originalTitle: editing.originalTitle,
			item,
			newCover: editing.newCover ? { name: editing.newCover.name, data: editing.newCover.data } : undefined,
		});
		items = r.items;
		editing = null;
		$("#a-dialog", root).close();
		render();
		toast("已保存 ✓");
	}, "保存中");
}

async function step(index, delta, btn) {
	const a = items[index];
	const next = Math.max(0, a.progress + delta);
	if (a.totalEpisodes && next > a.totalEpisodes) return toast("已经看到最后一集啦");
	const item = { ...a, progress: next };
	if (a.totalEpisodes && next === a.totalEpisodes && a.status !== "completed" && confirm(`看完《${a.title}》了！标记为「看完了」吗？`)) item.status = "completed";
	if (a.status === "planned" && next > 0) item.status = "watching";
	if (a.status === "completed" && delta < 0) item.status = "watching";
	btn.disabled = true;
	try {
		items = (await api("POST", "/api/anime", { index, originalTitle: a.title, item })).items;
		render();
	} catch (e) {
		toast(e.message, true);
		btn.disabled = false;
	}
}

async function remove(index) {
	const a = items[index];
	if (!confirm(`确定删除《${a.title}》吗？`)) return;
	try {
		items = (await api("DELETE", `/api/anime/${index}?title=${encodeURIComponent(a.title)}`)).items;
		render();
		toast("已删除");
	} catch (e) {
		toast(e.message, true);
	}
}
