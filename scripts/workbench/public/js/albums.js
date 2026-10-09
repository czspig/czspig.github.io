// 相册页
import { $, api, busy, dropzone, esc, parseTags, readFiles, todayDate, toast } from "./common.js";

let root;
let albums = [];
let current = null; // 正在查看的相册 id；null 表示列表

export function init(panel) {
	root = panel;
	load();
}

async function load() {
	try {
		albums = (await api("GET", "/api/albums")).albums;
		current && albums.some((a) => a.id === current) ? renderAlbum() : renderList();
	} catch (e) {
		toast(e.message, true);
	}
}

const photoUrl = (id, name) => `/media/images/albums/${encodeURIComponent(id)}/${encodeURIComponent(name)}`;
const coverUrl = (a) => (a.cover.startsWith("/") ? `/media${a.cover}` : a.cover);

// ---------- 列表 ----------

function renderList() {
	current = null;
	root.innerHTML = `
	<div class="row">
		<span class="muted small spacer">点相册进去可以上传照片、设封面。照片会自动压缩，并去掉拍摄位置等信息。</span>
		<button class="btn primary" id="al-new">＋ 新建相册</button>
	</div>
	<div class="album-grid" id="al-grid">
		${albums.length ? "" : `<div class="card empty" style="grid-column:1/-1">还没有相册</div>`}
		${albums.map((a) => `
			<article class="card album-card hover-card" data-id="${esc(a.id)}">
				${a.cover ? `<img src="${esc(coverUrl(a))}" alt="" loading="lazy">` : `<img alt="">`}
				<div class="body">
					<div style="font-weight:700">${esc(a.info.title || a.id)} ${a.info.hidden ? `<span class="badge warn">隐藏</span>` : ""}</div>
					<div class="muted small">${esc(String(a.info.date || "").slice(0, 10))} · ${a.external ? "外链相册" : `${a.photos.length} 张`}</div>
				</div>
			</article>`).join("")}
	</div>`;
	$("#al-new", root).addEventListener("click", () => renderForm(null));
	$("#al-grid", root).addEventListener("click", (e) => {
		const card = e.target.closest("[data-id]");
		if (!card) return;
		current = card.dataset.id;
		renderAlbum();
	});
}

// ---------- 相册信息表单（新建 / 修改） ----------

function formHtml(a) {
	const info = a?.info || { title: "", description: "", date: todayDate(), location: "", tags: [], layout: "masonry", columns: 3, hidden: false };
	return `
	<div class="fields">
		<div><label>相册标题</label><input type="text" id="al-title" value="${esc(info.title)}"></div>
		<div>
			<label>相册文件夹名（建议英文，会出现在网址里）</label>
			<input type="text" id="al-id" value="${esc(a?.id || `album-${todayDate().replace(/-/g, "")}`)}">
		</div>
		<div class="full"><label>描述</label><input type="text" id="al-desc" value="${esc(info.description)}"></div>
		<div><label>日期</label><input type="date" id="al-date" value="${esc(String(info.date || "").slice(0, 10))}"></div>
		<div><label>地点</label><input type="text" id="al-location" value="${esc(info.location)}"></div>
		<div class="full"><label>标签（用逗号或空格分隔）</label><input type="text" id="al-tags" value="${esc((info.tags || []).join(" "))}"></div>
		<div><label>排列方式</label><select id="al-layout"><option value="masonry">瀑布流</option><option value="grid">整齐网格</option></select></div>
		<div><label>每行几张</label><select id="al-columns"><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
		<div class="full"><label class="check"><input type="checkbox" id="al-hidden" ${info.hidden ? "checked" : ""}> 隐藏这个相册（不在相册页显示）</label></div>
	</div>`;
}

function fillSelects(a) {
	$("#al-layout", root).value = a?.info.layout === "grid" ? "grid" : "masonry";
	$("#al-columns", root).value = String(a?.info.columns || 3);
}

function readForm() {
	return {
		id: $("#al-id", root).value.trim(),
		info: {
			title: $("#al-title", root).value.trim(),
			description: $("#al-desc", root).value,
			date: $("#al-date", root).value,
			location: $("#al-location", root).value,
			tags: parseTags($("#al-tags", root).value),
			layout: $("#al-layout", root).value,
			columns: Number($("#al-columns", root).value),
			hidden: $("#al-hidden", root).checked,
		},
	};
}

function renderForm(a) {
	root.innerHTML = `
	<div class="row" style="margin-bottom:14px"><button class="btn" id="al-back">← 返回相册列表</button></div>
	<section class="card" style="max-width:760px">
		<div class="card-title">新建相册</div>
		${formHtml(a)}
		<div class="row" style="margin-top:16px"><span class="spacer"></span><button class="btn primary" id="al-create">创建，然后上传照片</button></div>
	</section>`;
	fillSelects(a);
	$("#al-back", root).addEventListener("click", renderList);
	$("#al-create", root).addEventListener("click", (e) => {
		const f = readForm();
		if (!f.info.title) return toast("先写个相册标题吧", true);
		busy(e.currentTarget, async () => {
			const r = await api("POST", "/api/albums", f);
			albums = r.albums;
			current = r.id;
			renderAlbum();
			toast("相册已创建，现在可以上传照片了");
		}, "创建中");
	});
}

// ---------- 相册详情 ----------

function renderAlbum() {
	const a = albums.find((x) => x.id === current);
	if (!a) return renderList();
	const coverName = a.cover ? decodeURIComponent(a.cover.split("?")[0].split("/").pop()) : "";
	root.innerHTML = `
	<div class="row" style="margin-bottom:14px">
		<button class="btn" id="al-back">← 返回相册列表</button>
		<span class="spacer"></span>
		<button class="btn danger" id="al-delete">删除整个相册</button>
	</div>
	<div class="two-col" style="grid-template-columns:minmax(0,1fr) minmax(0,1.4fr)">
		<section class="card">
			<div class="card-title">相册信息</div>
			${formHtml(a)}
			<div class="row" style="margin-top:16px"><span class="spacer"></span><button class="btn primary" id="al-save">保存信息</button></div>
		</section>
		<section class="card">
			<div class="card-title">照片（${a.photos.length} 张）</div>
			${a.external
				? `<div class="muted">这是外链相册，照片地址写在 info.json 里，工作台暂不支持上传。</div>`
				: `<div class="drop" id="al-drop"><strong>📷 上传照片</strong>点击选择，或把照片 / zip 压缩包拖到这里，可以一次多张</div>
				   <div class="photo-grid" id="al-photos">
					${a.photos.map((p) => `
						<div class="photo" data-photo="${esc(p)}">
							<img src="${esc(photoUrl(a.id, p))}" alt="" loading="lazy">
							${coverName && a.cover && isSameAsCover(a, p) ? `<span class="badge ok is-cover">封面</span>` : ""}
							<div class="bar">
								<button class="btn small" data-act="cover">设为封面</button>
								<button class="btn small danger" data-act="delete">删除</button>
							</div>
						</div>`).join("")}
				   </div>`}
		</section>
	</div>`;
	fillSelects(a);

	$("#al-back", root).addEventListener("click", renderList);
	$("#al-save", root).addEventListener("click", (e) => {
		const f = readForm();
		if (!f.info.title) return toast("相册标题不能为空", true);
		busy(e.currentTarget, async () => {
			const r = await api("POST", "/api/albums", { ...f, originalId: a.id });
			albums = r.albums;
			current = r.id;
			renderAlbum();
			toast("已保存 ✓");
		}, "保存中");
	});
	$("#al-delete", root).addEventListener("click", async () => {
		if (!confirm(`确定删除相册「${a.info.title || a.id}」吗？\n\n里面的 ${a.photos.length} 张照片都会被删除，发布后网站上也会消失。`)) return;
		try {
			albums = (await api("DELETE", `/api/albums/${encodeURIComponent(a.id)}`)).albums;
			renderList();
			toast("已删除");
		} catch (e) {
			toast(e.message, true);
		}
	});
	if (a.external) return;

	dropzone($("#al-drop", root), (files) => upload(a.id, files), "image/*,.zip");
	$("#al-photos", root).addEventListener("click", async (e) => {
		const act = e.target.dataset.act;
		if (!act) return;
		const photo = e.target.closest("[data-photo]").dataset.photo;
		try {
			if (act === "cover") {
				albums = (await api("POST", `/api/albums/${encodeURIComponent(a.id)}/cover`, { photo })).albums;
				coverOf[a.id] = photo;
				toast("已设为封面 ✓");
			} else {
				if (!confirm("确定删除这张照片吗？")) return;
				albums = (await api("DELETE", `/api/albums/${encodeURIComponent(a.id)}/photos/${encodeURIComponent(photo)}`)).albums;
				toast("已删除");
			}
			renderAlbum();
		} catch (err) {
			toast(err.message, true);
		}
	});
}

// 封面是单独生成的 cover.webp，记住这次会话里选的是哪张，好在照片上标出来
const coverOf = {};
const isSameAsCover = (a, photo) => coverOf[a.id] === photo;

async function upload(id, files) {
	const drop = $("#al-drop", root);
	const list = [...files];
	drop.innerHTML = `<span class="spinner"></span> 正在上传和压缩 ${list.length} 个文件……`;
	try {
		const payload = (await readFiles(list)).map(({ name, data }) => ({ name, data }));
		const r = await api("POST", `/api/albums/${encodeURIComponent(id)}/photos`, { files: payload });
		albums = r.albums;
		toast(`已添加 ${r.added} 张照片 ✓`);
	} catch (e) {
		toast(e.message, true);
	}
	renderAlbum();
}
