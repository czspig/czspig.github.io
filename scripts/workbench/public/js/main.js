import * as albums from "./albums.js";
import * as anime from "./anime.js";
import { $, $$, api, onStatus, toast } from "./common.js";
import * as diary from "./diary.js";
import * as posts from "./posts.js";

const pages = { diary, posts, anime, albums };
const LABELS = { diary: "日记", posts: "文章", anime: "追番", albums: "相册" };
const started = new Set();

// ---------- 状态栏 ----------
onStatus((st) => {
	const total = Object.values(st.changes).reduce((a, b) => a + b, 0);
	const pill = $("#status");
	if (total > 0) {
		const parts = Object.entries(st.changes).filter(([, n]) => n > 0).map(([k, n]) => `${LABELS[k]} ${n}`);
		pill.className = "pill dirty";
		pill.textContent = `未发布：${parts.join(" · ")}`;
	} else if (st.unpushed > 0) {
		pill.className = "pill dirty";
		pill.textContent = `${st.unpushed} 个提交还没推送`;
	} else {
		pill.className = "pill clean";
		pill.textContent = "✓ 已和网站同步";
	}
	for (const a of $$("#tabs a")) a.classList.toggle("dirty", st.changes[a.dataset.tab] > 0);
});

// ---------- 标签页 ----------
function show() {
	const tab = pages[location.hash.slice(1)] ? location.hash.slice(1) : "diary";
	for (const a of $$("#tabs a")) a.classList.toggle("on", a.dataset.tab === tab);
	for (const key of Object.keys(pages)) $(`#panel-${key}`).hidden = key !== tab;
	if (!started.has(tab)) {
		started.add(tab);
		pages[tab].init($(`#panel-${tab}`));
	}
}
window.addEventListener("hashchange", show);
show();
api("GET", "/api/status").catch((e) => toast(e.message, true));

// ---------- 发布 ----------
const dialog = $("#publish-dialog");
$("[data-close]", dialog).addEventListener("click", () => dialog.close());
$("#publish").addEventListener("click", async () => {
	const btn = $("#publish");
	if (btn.disabled) return;
	if (!confirm("把所有改动发布到网站上吗？\n\n会提交并推送到 GitHub，大约 1–3 分钟后网站自动更新。")) return;
	btn.disabled = true;
	btn.innerHTML = `<span class="spinner"></span>发布中`;
	$("#publish-title").textContent = "发布中…";
	$("#publish-log").textContent = "正在提交并推送到 GitHub……";
	$("#publish-tip").textContent = "";
	dialog.showModal();
	try {
		const data = await api("POST", "/api/publish");
		$("#publish-title").textContent = "✓ 发布成功";
		$("#publish-log").textContent = data.log;
		$("#publish-tip").innerHTML =
			'GitHub 正在重新构建网站，大约 1–3 分钟后生效。<a href="https://github.com/czspig/czspig.github.io/actions" target="_blank" rel="noopener">查看部署进度</a>';
	} catch (e) {
		$("#publish-title").textContent = "✗ 发布失败";
		$("#publish-log").textContent = e.message;
		$("#publish-tip").textContent = "改动都保存在本地，不会丢。如果是网络问题，打开代理软件后再点一次「发布到网站」。";
	} finally {
		btn.disabled = false;
		btn.textContent = "发布到网站";
	}
});

// 有还没上传的图片时，关页面前提醒一下
window.addEventListener("beforeunload", (e) => {
	if (Object.values(pages).some((p) => p.hasUnsaved?.())) {
		e.preventDefault();
		e.returnValue = "";
	}
});
