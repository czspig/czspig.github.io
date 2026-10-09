// 日记页
import { $, api, busy, dropzone, esc, fmtDateTime, fromInputDateTime, isActive, parseTags, pastedFiles, readFiles, toInputDateTime, toast } from "./common.js";

const MOODS = ["开心", "平静", "兴奋", "感动", "累了", "emo", "摸鱼", "充实"];
const DRAFT_KEY = "workbench-diary-draft";

let root;
const state = { entries: [], editingId: null, kept: [], added: [] };

export const hasUnsaved = () => state.added.length > 0;

export function init(panel) {
	root = panel;
	root.innerHTML = `
	<div class="two-col">
		<section class="card sticky" id="d-compose">
			<div class="card-title" id="d-title">写日记</div>
			<div class="editing-banner">正在修改一条旧日记 <button class="btn small" id="d-cancel">取消修改</button></div>
			<textarea id="d-content" rows="7" placeholder="今天发生了什么？（Ctrl + Enter 保存）"></textarea>
			<div class="right muted small"><span id="d-count">0</span> 字</div>
			<div class="drop" id="d-drop" style="margin-top:10px">📷 点击选择图片，或拖到这里 / 直接 Ctrl + V 粘贴</div>
			<div class="thumbs" id="d-thumbs" style="margin-top:10px"></div>
			<div class="fields" style="margin-top:14px">
				<div class="full">
					<label>心情</label>
					<div class="chips" id="d-moods" style="margin-bottom:8px"></div>
					<input type="text" id="d-mood" placeholder="也可以自己写">
				</div>
				<div><label>地点</label><input type="text" id="d-location" placeholder="可选"></div>
				<div><label>时间（北京时间）</label><input type="datetime-local" id="d-date"></div>
				<div class="full">
					<label>标签（用逗号或空格分隔）</label>
					<input type="text" id="d-tags" placeholder="例如：生活 番剧">
					<div class="chips" id="d-tag-suggest" style="margin-top:8px"></div>
				</div>
			</div>
			<div class="row" style="margin-top:16px">
				<span class="muted small spacer">保存后点右上角「发布到网站」才会公开</span>
				<button class="btn" id="d-clear">清空</button>
				<button class="btn primary" id="d-save">保存</button>
			</div>
		</section>
		<section class="stack" id="d-list"></section>
	</div>`;

	const content = $("#d-content", root);
	content.addEventListener("input", () => { updateCount(); saveDraft(); });
	for (const id of ["#d-mood", "#d-location"]) $(id, root).addEventListener("input", () => { saveDraft(); renderMoods(); });
	$("#d-tags", root).addEventListener("input", () => { saveDraft(); renderTagSuggest(); });
	$("#d-save", root).addEventListener("click", save);
	$("#d-clear", root).addEventListener("click", () => {
		if ((content.value || state.added.length) && !confirm("清空正在写的内容吗？")) return;
		clearDraft();
		resetForm();
	});
	$("#d-cancel", root).addEventListener("click", resetForm);
	root.addEventListener("keydown", (e) => {
		if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); save(); }
	});
	$("#d-moods", root).addEventListener("click", (e) => {
		const m = e.target.dataset.mood;
		if (!m) return;
		$("#d-mood", root).value = $("#d-mood", root).value === m ? "" : m;
		renderMoods();
		saveDraft();
	});
	$("#d-tag-suggest", root).addEventListener("click", (e) => {
		const t = e.target.dataset.tag;
		if (!t) return;
		const tags = parseTags($("#d-tags", root).value);
		$("#d-tags", root).value = (tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t]).join(" ");
		renderTagSuggest();
	});
	$("#d-list", root).addEventListener("click", (e) => {
		const act = e.target.dataset.act;
		if (!act) return;
		const id = Number(e.target.closest("[data-id]").dataset.id);
		if (act === "edit") startEdit(id);
		if (act === "delete") remove(id);
	});
	$("#d-thumbs", root).addEventListener("click", (e) => {
		const { kept, added } = e.target.dataset;
		if (kept !== undefined) state.kept.splice(Number(kept), 1);
		else if (added !== undefined) state.added.splice(Number(added), 1);
		else return;
		renderThumbs();
	});
	dropzone($("#d-drop", root), addFiles, "image/*");
	document.addEventListener("paste", (e) => {
		if (!isActive(root)) return;
		const files = pastedFiles(e).filter((f) => f.type.startsWith("image/"));
		if (files.length) { e.preventDefault(); addFiles(files); }
	});

	resetForm();
	loadDraft();
	load();
}

async function load() {
	try {
		state.entries = (await api("GET", "/api/diary")).entries;
		renderList();
	} catch (e) {
		toast(e.message, true);
	}
}

async function addFiles(files) {
	const images = [...files].filter((f) => f.type.startsWith("image/"));
	if (!images.length) return toast("只能添加图片", true);
	state.added.push(...(await readFiles(images)));
	renderThumbs();
}

function renderThumbs() {
	const kept = state.kept.map((p, i) => `<div class="thumb"><img src="/media${esc(p)}" alt=""><button class="x" data-kept="${i}" title="移除">×</button></div>`);
	const added = state.added.map((f, i) => `<div class="thumb"><img src="${f.url}" alt=""><button class="x" data-added="${i}" title="移除">×</button></div>`);
	$("#d-thumbs", root).innerHTML = kept.concat(added).join("");
}

function renderMoods() {
	const cur = $("#d-mood", root).value.trim();
	$("#d-moods", root).innerHTML = MOODS.map((m) => `<span class="chip${m === cur ? " on" : ""}" data-mood="${m}">${m}</span>`).join("");
}

function renderTagSuggest() {
	const all = [...new Set(state.entries.flatMap((e) => e.tags || []))].slice(0, 14);
	const cur = parseTags($("#d-tags", root).value);
	$("#d-tag-suggest", root).innerHTML = all.map((t) => `<span class="chip${cur.includes(t) ? " on" : ""}" data-tag="${esc(t)}">${esc(t)}</span>`).join("");
}

function renderList() {
	const list = $("#d-list", root);
	if (!state.entries.length) {
		list.innerHTML = `<div class="card empty">还没有日记，在左边写第一条吧 ⚡</div>`;
		return;
	}
	list.innerHTML = state.entries.map((e) => `
		<article class="card entry hover-card" data-id="${e.id}">
			<div class="meta">
				<span>🕒 ${fmtDateTime(e.date)}</span>
				${e.mood ? `<span>💭 ${esc(e.mood)}</span>` : ""}
				${e.location ? `<span>📍 ${esc(e.location)}</span>` : ""}
			</div>
			${e.content ? `<p class="content">${esc(e.content)}</p>` : ""}
			${e.images?.length ? `<div class="imgs">${e.images.map((p) => `<img src="/media${esc(p)}" loading="lazy" alt="">`).join("")}</div>` : ""}
			${e.tags?.length ? `<div class="row" style="gap:6px;margin-bottom:10px">${e.tags.map((t) => `<span class="tag"># ${esc(t)}</span>`).join("")}</div>` : ""}
			<div class="ops">
				<button class="btn small" data-act="edit">修改</button>
				<button class="btn small danger" data-act="delete">删除</button>
			</div>
		</article>`).join("");
	renderTagSuggest();
}

function updateCount() {
	$("#d-count", root).textContent = $("#d-content", root).value.trim().length;
}

function saveDraft() {
	if (state.editingId) return;
	try {
		localStorage.setItem(DRAFT_KEY, JSON.stringify({
			content: $("#d-content", root).value, mood: $("#d-mood", root).value, location: $("#d-location", root).value, tags: $("#d-tags", root).value,
		}));
	} catch {}
}
function loadDraft() {
	try {
		const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
		if (!d) return;
		for (const k of ["content", "mood", "location", "tags"]) $(`#d-${k}`, root).value = d[k] || "";
		updateCount();
		renderMoods();
	} catch {}
}
function clearDraft() {
	try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

function resetForm() {
	state.editingId = null;
	state.kept = [];
	state.added = [];
	for (const k of ["content", "mood", "location", "tags"]) $(`#d-${k}`, root).value = "";
	$("#d-date", root).value = toInputDateTime();
	$("#d-compose", root).classList.remove("editing");
	$("#d-title", root).textContent = "写日记";
	$("#d-save", root).textContent = "保存";
	updateCount();
	renderThumbs();
	renderMoods();
	renderTagSuggest();
}

function startEdit(id) {
	const e = state.entries.find((x) => x.id === id);
	if (!e) return;
	state.editingId = id;
	state.kept = [...(e.images || [])];
	state.added = [];
	$("#d-content", root).value = e.content || "";
	$("#d-mood", root).value = e.mood || "";
	$("#d-location", root).value = e.location || "";
	$("#d-tags", root).value = (e.tags || []).join(" ");
	$("#d-date", root).value = toInputDateTime(e.date);
	$("#d-compose", root).classList.add("editing");
	$("#d-title", root).textContent = "修改日记";
	$("#d-save", root).textContent = "保存修改";
	updateCount();
	renderThumbs();
	renderMoods();
	renderTagSuggest();
	window.scrollTo({ top: 0, behavior: "smooth" });
	$("#d-content", root).focus();
}

function save() {
	const content = $("#d-content", root).value.trim();
	if (!content && !state.kept.length && !state.added.length) return toast("写点什么或者加张图片吧", true);
	return busy($("#d-save", root), async () => {
		const wasEditing = !!state.editingId;
		const data = await api("POST", "/api/diary", {
			id: state.editingId || undefined,
			content,
			date: fromInputDateTime($("#d-date", root).value),
			mood: $("#d-mood", root).value,
			location: $("#d-location", root).value,
			tags: parseTags($("#d-tags", root).value),
			images: state.kept,
			newImages: state.added.map(({ name, data }) => ({ name, data })),
		});
		state.entries = data.entries;
		clearDraft();
		resetForm();
		renderList();
		toast(wasEditing ? "已保存修改 ✓" : "已保存 ✓ 记得点「发布到网站」");
	}, "保存中");
}

async function remove(id) {
	const e = state.entries.find((x) => x.id === id);
	const preview = (e?.content || "").slice(0, 20);
	if (!confirm(`确定删除这条日记吗？\n\n「${preview}」\n\n发布之后网站上也会删掉。`)) return;
	try {
		state.entries = (await api("DELETE", `/api/diary/${id}`)).entries;
		if (state.editingId === id) resetForm();
		renderList();
		toast("已删除");
	} catch (err) {
		toast(err.message, true);
	}
}
