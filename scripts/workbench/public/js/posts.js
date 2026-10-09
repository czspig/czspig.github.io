// 文章页：导入飞书导出的 Markdown（.md / .zip / 图片），编辑、预览、保存
import { marked } from "/vendor/marked.js";

import { $, $$, api, busy, dropzone, esc, isActive, parseTags, pastedFiles, readFiles, todayDate, toast } from "./common.js";

let root;
let posts = [];
let ed = null; // 正在编辑的文章；null 表示在列表页
let previewTimer;

export const hasUnsaved = () => !!ed?.dirty;

export function init(panel) {
	root = panel;
	document.addEventListener("paste", onPaste);
	root.addEventListener("input", markDirty);
	showList();
}

// ======================= 列表 =======================

async function showList() {
	ed = null;
	root.innerHTML = `
	<section class="card">
		<div class="card-title">导入文章</div>
		<div class="drop big" id="p-import">
			<strong>📥 把飞书导出的文章拖到这里</strong>
			支持 .md 文件、含图片的 .zip 压缩包，也可以把 .md 和图片一起选中拖进来
		</div>
		<div class="row" style="margin-top:12px">
			<span class="muted small spacer">飞书里：文档右上角「···」→「下载为」→「Markdown」。文中图片会按文件名自动匹配，匹配不上的会列出来让你补。</span>
			<button class="btn" id="p-new">✏️ 新建空白文章</button>
		</div>
	</section>
	<div class="post-list" id="p-list"><div class="card empty">读取中…</div></div>`;

	dropzone($("#p-import", root), importFiles, ".md,.markdown,.txt,.zip,image/*");
	$("#p-new", root).addEventListener("click", newPost);
	$("#p-list", root).addEventListener("click", (e) => {
		const act = e.target.dataset.act;
		if (!act) return;
		const slug = e.target.closest("[data-slug]").dataset.slug;
		if (act === "edit") openPost(slug);
		if (act === "delete") removePost(slug);
	});

	try {
		posts = (await api("GET", "/api/posts")).posts;
		renderList();
	} catch (e) {
		toast(e.message, true);
	}
}

function renderList() {
	const el = $("#p-list", root);
	if (!el) return;
	if (!posts.length) {
		el.innerHTML = `<div class="card empty">还没有文章，把飞书导出的 Markdown 拖到上面试试</div>`;
		return;
	}
	el.innerHTML = posts.map((p) => `
		<article class="card post-item hover-card" data-slug="${esc(p.slug)}">
			${p.cover ? `<img class="cover" src="${esc(p.cover)}" alt="" loading="lazy">` : `<div class="cover"></div>`}
			<div class="info">
				<div class="title" title="${esc(p.title)}">${p.pinned ? "📌 " : ""}${esc(p.title)}</div>
				<div class="row small muted" style="gap:8px">
					<span>${esc(p.published)}</span>
					${p.category ? `<span class="badge primary">${esc(p.category)}</span>` : ""}
					${p.draft ? `<span class="badge warn">草稿</span>` : ""}
					<span>${p.words} 字</span>
				</div>
				<div class="desc">${esc(p.description)}</div>
				<div class="ops" style="margin-top:auto">
					<a class="btn small" href="https://czspig.github.io/posts/${encodeURIComponent(p.slug.toLowerCase())}/" target="_blank" rel="noopener">在网站看</a>
					<button class="btn small" data-act="edit" ${p.mdx ? 'title="MDX 文章可以改，但预览不一定准确"' : ""}>编辑</button>
					<button class="btn small danger" data-act="delete">删除</button>
				</div>
			</div>
		</article>`).join("");
}

function uniqueSlug(base) {
	const taken = new Set(posts.map((p) => p.slug.toLowerCase()));
	let slug = base;
	for (let i = 2; taken.has(slug.toLowerCase()); i++) slug = `${base}-${i}`;
	return slug;
}

async function importFiles(files) {
	const drop = $("#p-import", root);
	drop.innerHTML = `<span class="spinner"></span> 正在读取和匹配图片……`;
	try {
		const data = await api("POST", "/api/posts/import", { files: (await readFiles(files)).map(({ name, data }) => ({ name, data })) });
		if (data.ignored.length) toast(`压缩包里有多个 .md，已打开最长的那篇。\n其余：${data.ignored.join("、")}`);
		openEditor({
			originalSlug: null,
			slug: uniqueSlug(`post-${todayDate().replace(/-/g, "")}`),
			stageId: data.stageId,
			stageFiles: data.files,
			folderFiles: [],
			meta: data.meta,
			body: data.body,
			missing: data.missing,
			dirty: true,
		});
	} catch (e) {
		toast(e.message, true);
		showList();
	}
}

async function newPost() {
	try {
		const { stageId } = await api("POST", "/api/stage");
		openEditor({
			originalSlug: null,
			slug: uniqueSlug(`post-${todayDate().replace(/-/g, "")}`),
			stageId,
			stageFiles: [],
			folderFiles: [],
			meta: { title: "", published: todayDate(), description: "", tags: [], category: "", image: "", draft: false, pinned: false },
			body: "",
			missing: [],
			dirty: false,
		});
	} catch (e) {
		toast(e.message, true);
	}
}

async function openPost(slug) {
	try {
		const [post, { stageId }] = await Promise.all([api("GET", `/api/posts/${encodeURIComponent(slug)}`), api("POST", "/api/stage")]);
		openEditor({ originalSlug: slug, slug, stageId, stageFiles: [], folderFiles: post.files, meta: post.meta, body: post.body, missing: [], dirty: false });
	} catch (e) {
		toast(e.message, true);
	}
}

async function removePost(slug) {
	const p = posts.find((x) => x.slug === slug);
	if (!confirm(`确定删除文章「${p?.title || slug}」吗？\n\n文章和它的图片都会被删除，发布后网站上也会消失。`)) return;
	try {
		posts = (await api("DELETE", `/api/posts/${encodeURIComponent(slug)}`)).posts;
		renderList();
		toast("已删除");
	} catch (e) {
		toast(e.message, true);
	}
}

// ======================= 编辑器 =======================

function openEditor(state) {
	ed = state;
	const m = ed.meta;
	const categories = [...new Set(posts.map((p) => p.category).filter(Boolean))];
	root.innerHTML = `
	<div class="row" style="margin-bottom:14px">
		<button class="btn" id="e-back">← 返回文章列表</button>
		<span class="muted small spacer">${ed.originalSlug ? "修改文章" : "新文章"} · 保存后点右上角「发布到网站」才会公开</span>
		<button class="btn primary" id="e-save">保存文章</button>
	</div>
	<div class="editor">
		<aside>
			<section class="card">
				<div class="card-title">文章信息</div>
				<div class="stack" style="gap:12px">
					<div><label>标题</label><input type="text" id="e-title" value="${esc(m.title)}"></div>
					<div>
						<label>文章地址（建议用英文、数字和短横线）</label>
						<input type="text" id="e-slug" value="${esc(ed.slug)}">
						<div class="muted small" style="margin-top:4px;word-break:break-all">网址：czspig.github.io/posts/<span id="e-slug-preview">${esc(ed.slug.toLowerCase())}</span>/</div>
					</div>
					<div class="fields">
						<div><label>发布日期</label><input type="date" id="e-date" value="${esc(m.published)}"></div>
						<div>
							<label>分类</label>
							<input type="text" id="e-category" list="e-cats" value="${esc(m.category)}" placeholder="例如：随笔">
							<datalist id="e-cats">${categories.map((c) => `<option value="${esc(c)}">`).join("")}</datalist>
						</div>
					</div>
					<div><label>标签（用逗号或空格分隔）</label><input type="text" id="e-tags" value="${esc(m.tags.join(" "))}"></div>
					<div><label>简介（显示在首页卡片上）</label><textarea id="e-desc" rows="3">${esc(m.description)}</textarea></div>
					<div class="row">
						<label class="check"><input type="checkbox" id="e-draft" ${m.draft ? "checked" : ""}> 草稿（先不公开）</label>
						<label class="check"><input type="checkbox" id="e-pinned" ${m.pinned ? "checked" : ""}> 置顶</label>
					</div>
				</div>
			</section>
			<section class="card">
				<div class="card-title">封面</div>
				<div class="thumbs" id="e-covers"></div>
				<div class="muted small" id="e-cover-empty" style="margin-top:6px"></div>
			</section>
			<section class="missing" id="e-missing" hidden></section>
		</aside>
		<section class="card" style="padding:16px">
			<div class="row" style="margin-bottom:10px">
				<div class="seg" id="e-mode">
					<button data-mode="only-edit">编辑</button><button data-mode="" class="on">编辑 + 预览</button><button data-mode="only-preview">预览</button>
				</div>
				<button class="btn small" id="e-insert">🖼️ 插入图片</button>
				<span class="muted small spacer">图片可以直接拖进正文或 Ctrl + V 粘贴</span>
				<span class="muted small" id="e-words"></span>
			</div>
			<div class="split" id="e-split">
				<textarea class="body-area" id="e-body" spellcheck="false" placeholder="在这里写正文（Markdown 格式）"></textarea>
				<iframe class="preview" id="e-preview" sandbox="allow-same-origin" title="预览"></iframe>
			</div>
		</section>
	</div>`;

	const body = $("#e-body", root);
	body.value = ed.body;
	window.scrollTo({ top: 0 });

	$("#e-slug", root).addEventListener("input", (e) => ($("#e-slug-preview", root).textContent = e.target.value.trim().toLowerCase()));
	body.addEventListener("input", () => { ed.body = body.value; schedulePreview(); });
	$("#e-back", root).addEventListener("click", () => {
		if (ed.dirty && !confirm("有没保存的修改，确定返回吗？")) return;
		showList();
	});
	$("#e-save", root).addEventListener("click", (e) => save(e.currentTarget));
	$("#e-mode", root).addEventListener("click", (e) => {
		if (!e.target.matches("button")) return;
		for (const b of $$("button", e.currentTarget)) b.classList.toggle("on", b === e.target);
		$("#e-split", root).className = `split ${e.target.dataset.mode}`;
	});
	$("#e-covers", root).addEventListener("click", (e) => {
		const t = e.target.closest("[data-cover]");
		if (!t) return;
		ed.meta.image = t.dataset.cover;
		markDirty();
		renderCovers();
	});
	const picker = Object.assign(document.createElement("input"), { type: "file", accept: "image/*", multiple: true, hidden: true });
	root.append(picker);
	$("#e-insert", root).addEventListener("click", () => picker.click());
	picker.addEventListener("change", () => { insertImages(picker.files); picker.value = ""; });
	body.addEventListener("dragover", (e) => e.preventDefault());
	body.addEventListener("drop", (e) => {
		if (!e.dataTransfer.files.length) return;
		e.preventDefault();
		insertImages(e.dataTransfer.files);
	});

	renderCovers();
	renderMissing();
	renderPreview();
}

function markDirty() {
	if (ed) ed.dirty = true;
}

function onPaste(e) {
	if (!ed || !isActive(root) || document.activeElement !== $("#e-body", root)) return;
	const files = pastedFiles(e).filter((f) => f.type.startsWith("image/"));
	if (files.length) {
		e.preventDefault();
		insertImages(files);
	}
}

const imgSrc = (ref) => {
	if (/^https?:/.test(ref)) return ref;
	if (ref.startsWith("/")) return `/media${ref}`;
	const name = ref.replace(/^\.\//, "");
	if (ed.stageFiles.includes(name)) return `/files/stage/${ed.stageId}/${encodeURIComponent(name)}`;
	return `/files/post/${encodeURIComponent(ed.originalSlug || "")}/${encodeURIComponent(name)}`;
};

function renderCovers() {
	const images = [...new Set([...ed.folderFiles, ...ed.stageFiles])].map((n) => `./${n}`);
	const cur = ed.meta.image;
	if (cur && !images.includes(cur)) images.unshift(cur);
	const items = [`<div class="thumb selectable${!cur ? " selected" : ""}" data-cover=""><div style="display:grid;place-items:center;height:100%" class="muted small">不要封面</div></div>`]
		.concat(images.map((ref) => `<div class="thumb selectable${ref === cur ? " selected" : ""}" data-cover="${esc(ref)}"><img src="${esc(imgSrc(ref))}" alt=""><div class="label">${esc(ref.replace("./", ""))}</div></div>`));
	$("#e-covers", root).innerHTML = items.join("");
	$("#e-cover-empty", root).textContent = images.length ? "点一张图设为封面" : "文章里还没有图片。插入图片后就可以选封面了";
}

function renderMissing() {
	const box = $("#e-missing", root);
	if (!ed.missing.length) {
		box.hidden = true;
		return;
	}
	box.hidden = false;
	box.innerHTML = `
		<div class="card-title" style="color:var(--warn)">有 ${ed.missing.length} 张图片没找到</div>
		<div class="muted small">飞书导出的图片可能只是链接，下载不了。可以逐张上传替换，或把图片一起拖到下面（按文件名自动匹配）。</div>
		<ul>${ed.missing.map((u, i) => `<li><button class="btn small" data-fix="${i}">上传替换</button> <span class="muted">${esc(u.length > 80 ? `${u.slice(0, 80)}…` : u)}</span></li>`).join("")}</ul>
		<div class="drop" id="e-bulk">把图片或 zip 拖到这里，按文件名自动匹配</div>`;
	const picker = Object.assign(document.createElement("input"), { type: "file", accept: "image/*", hidden: true });
	box.append(picker);
	let fixing = -1;
	box.onclick = (e) => {
		if (e.target.dataset.fix === undefined) return;
		fixing = Number(e.target.dataset.fix);
		picker.click();
	};
	picker.addEventListener("change", async () => {
		const file = picker.files[0];
		picker.value = "";
		if (!file || fixing < 0) return;
		try {
			const [name] = await uploadToStage([file]);
			const url = ed.missing[fixing];
			ed.body = replaceRef(ed.body, url, `./${name}`);
			$("#e-body", root).value = ed.body;
			ed.missing.splice(fixing, 1);
			if (!ed.meta.image) ed.meta.image = `./${name}`;
			markDirty();
			renderMissing();
			renderCovers();
			renderPreview();
		} catch (e) {
			toast(e.message, true);
		}
	});
	dropzone($("#e-bulk", box), async (files) => {
		try {
			await uploadToStage(files);
			const r = await api("POST", `/api/stage/${ed.stageId}/resolve`, { body: ed.body, slug: ed.originalSlug });
			const fixed = ed.missing.length - r.missing.length;
			ed.body = r.body;
			ed.missing = r.missing;
			$("#e-body", root).value = ed.body;
			markDirty();
			renderMissing();
			renderCovers();
			renderPreview();
			toast(fixed > 0 ? `匹配上了 ${fixed} 张图片` : "没有按文件名匹配上的图片，可以用「上传替换」逐张处理", fixed <= 0);
		} catch (e) {
			toast(e.message, true);
		}
	});
}

function replaceRef(body, url, next) {
	return body.split(`(${url})`).join(`(${next})`).split(`(<${url}>)`).join(`(${next})`).split(`"${url}"`).join(`"${next}"`).split(`'${url}'`).join(`'${next}'`);
}

async function uploadToStage(files) {
	const payload = (await readFiles(files)).map(({ name, data }) => ({ name, data }));
	const r = await api("POST", `/api/stage/${ed.stageId}/files`, { files: payload, slug: ed.originalSlug });
	ed.stageFiles = r.files;
	return r.added.map((a) => a.name);
}

async function insertImages(files) {
	const images = [...files].filter((f) => f.type.startsWith("image/") || /\.zip$/i.test(f.name));
	if (!images.length) return toast("只能插入图片", true);
	try {
		const names = await uploadToStage(images);
		const body = $("#e-body", root);
		const text = names.map((n) => `![](./${n})`).join("\n\n");
		const pos = body.selectionStart ?? body.value.length;
		const before = body.value.slice(0, pos);
		const pad = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
		body.setRangeText(`${pad}${text}\n\n`, pos, body.selectionEnd ?? pos, "end");
		ed.body = body.value;
		if (!ed.meta.image) ed.meta.image = `./${names[0]}`;
		markDirty();
		renderCovers();
		renderPreview();
		toast(`已插入 ${names.length} 张图片`);
	} catch (e) {
		toast(e.message, true);
	}
}

function schedulePreview() {
	clearTimeout(previewTimer);
	previewTimer = setTimeout(renderPreview, 300);
}

const PREVIEW_CSS = `
body{font:16px/1.8 "PingFang SC","Microsoft YaHei",system-ui,sans-serif;color:#1f2330;max-width:760px;margin:0 auto;padding:20px 24px 60px}
h1,h2,h3,h4{line-height:1.35;margin:1.6em 0 .6em}h1{font-size:1.9em}h2{font-size:1.5em;border-bottom:1px solid #eee;padding-bottom:.3em}
img{max-width:100%;border-radius:10px}pre{background:#f5f6fa;padding:14px;border-radius:10px;overflow:auto}
code{background:#f1f2f6;padding:.15em .4em;border-radius:5px;font-size:.9em}pre code{background:none;padding:0}
blockquote{margin:1em 0;padding:.4em 1em;border-left:4px solid #8b7cff;background:#f6f5ff;color:#4a4f66;border-radius:0 8px 8px 0}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #e3e5ee;padding:6px 10px}a{color:#6a5cff}
.ph-title{font-size:2em;font-weight:800;margin:0 0 .2em}.ph-meta{color:#888;font-size:14px;margin-bottom:1.5em}
.ph-cover{width:100%;max-height:340px;object-fit:cover;margin-bottom:1em}.ph-missing{outline:3px dashed #f5a623;min-height:40px;min-width:120px}`;

function renderPreview() {
	if (!ed) return;
	const frame = $("#e-preview", root);
	const text = $("#e-body", root).value;
	const words = text.replace(/```[\s\S]*?```|!\[[^\]]*\]\([^)]*\)|[#>*_`\-\s]/g, "").length;
	$("#e-words", root).textContent = `${words} 字`;
	let html;
	try {
		html = marked.parse(text, { gfm: true, breaks: false });
	} catch {
		html = `<pre>${esc(text)}</pre>`;
	}
	const doc = new DOMParser().parseFromString(html, "text/html");
	const missing = new Set(ed.missing);
	for (const img of doc.querySelectorAll("img")) {
		const ref = img.getAttribute("src") || "";
		if (missing.has(ref)) img.className = "ph-missing";
		const src = imgSrc(ref);
		img.setAttribute("src", src.startsWith("http") ? src : location.origin + src);
	}
	const title = $("#e-title", root)?.value || "（还没写标题）";
	const coverSrc = ed.meta.image ? imgSrc(ed.meta.image) : "";
	const cover = coverSrc ? `<img class="ph-cover" src="${esc(coverSrc.startsWith("http") ? coverSrc : location.origin + coverSrc)}">` : "";
	frame.srcdoc = `<!doctype html><meta charset="utf-8"><style>${PREVIEW_CSS}</style>${cover}<div class="ph-title">${esc(title)}</div><div class="ph-meta">${esc($("#e-date", root)?.value || "")} · 预览只是大致效果，以网站为准</div>${doc.body.innerHTML}`;
}

function save(btn) {
	const meta = {
		title: $("#e-title", root).value.trim(),
		published: $("#e-date", root).value,
		category: $("#e-category", root).value.trim(),
		tags: parseTags($("#e-tags", root).value),
		description: $("#e-desc", root).value.trim(),
		image: ed.meta.image,
		draft: $("#e-draft", root).checked,
		pinned: $("#e-pinned", root).checked,
	};
	if (!meta.title) return toast("先写个标题吧", true);
	if (ed.missing.length && !confirm(`还有 ${ed.missing.length} 张图片没找到，网站上会显示不出来。\n仍然保存吗？`)) return;
	return busy(btn, async () => {
		const r = await api("POST", "/api/posts/save", {
			originalSlug: ed.originalSlug,
			slug: $("#e-slug", root).value.trim(),
			stageId: ed.stageId,
			meta,
			body: $("#e-body", root).value,
		});
		posts = r.posts;
		ed = null;
		toast(meta.draft ? "已保存为草稿 ✓（草稿不会出现在网站上）" : "已保存 ✓ 记得点「发布到网站」");
		showList();
	}, "保存中");
}
