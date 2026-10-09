// 各页面共用的小工具

const TOKEN = window.__TOKEN__;
const statusListeners = [];

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const esc = (s) =>
	String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function onStatus(fn) {
	statusListeners.push(fn);
}

export async function api(method, url, body) {
	const res = await fetch(url, {
		method,
		headers: { "Content-Type": "application/json", "X-Token": TOKEN },
		body: body ? JSON.stringify(body) : undefined,
	});
	const data = await res.json().catch(() => ({}));
	if (data.status) for (const fn of statusListeners) fn(data.status);
	if (!res.ok) throw new Error(data.error || `请求失败（${res.status}）`);
	return data;
}

let toastTimer;
export function toast(msg, isErr = false) {
	const t = $("#toast");
	t.textContent = msg;
	t.className = `toast show${isErr ? " err" : ""}`;
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => (t.className = "toast"), isErr ? 6000 : 2500);
}

/** 按钮执行期间显示转圈并禁用，防止重复点击 */
export async function busy(btn, fn, label = "处理中") {
	if (btn.disabled) return;
	const html = btn.innerHTML;
	btn.disabled = true;
	btn.innerHTML = `<span class="spinner"></span>${label}`;
	try {
		return await fn();
	} catch (e) {
		toast(e.message, true);
	} finally {
		btn.disabled = false;
		btn.innerHTML = html;
	}
}

// ---------- 时间：一律按北京时间，不受电脑时区影响 ----------

const TZ = "Asia/Shanghai";
function parts(date) {
	const p = new Intl.DateTimeFormat("en-CA", {
		timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
	}).formatToParts(date);
	return Object.fromEntries(p.map((x) => [x.type, x.value]));
}
/** 给 <input type=datetime-local> 用：2026-10-09T21:30 */
export function toInputDateTime(date = new Date()) {
	const p = parts(new Date(date));
	return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
/** 输入框里的北京时间 → 带时区的完整时间 */
export const fromInputDateTime = (v) => `${v || toInputDateTime()}:00+08:00`;
export const todayDate = () => toInputDateTime().slice(0, 10);
export function fmtDateTime(iso) {
	const p = parts(new Date(iso));
	return `${p.year}年${Number(p.month)}月${Number(p.day)}日 ${p.hour}:${p.minute}`;
}

// ---------- 文件 ----------

/** 读成 { name, data: base64 }，用于上传 */
export function readFiles(fileList) {
	return Promise.all(
		[...fileList].map(
			(f) =>
				new Promise((resolve, reject) => {
					const r = new FileReader();
					r.onload = () => resolve({ name: f.name || "image.png", data: String(r.result).split(",")[1] || "", url: r.result });
					r.onerror = () => reject(new Error(`读取「${f.name}」失败`));
					r.readAsDataURL(f);
				}),
		),
	);
}

/** 拖放 / 点击选择文件的区域 */
export function dropzone(el, onFiles, accept = "") {
	const input = document.createElement("input");
	input.type = "file";
	input.multiple = true;
	if (accept) input.accept = accept;
	input.hidden = true;
	el.after(input);
	el.addEventListener("click", () => input.click());
	input.addEventListener("change", () => {
		if (input.files.length) onFiles(input.files);
		input.value = "";
	});
	el.addEventListener("dragover", (e) => {
		e.preventDefault();
		el.classList.add("over");
	});
	el.addEventListener("dragleave", () => el.classList.remove("over"));
	el.addEventListener("drop", (e) => {
		e.preventDefault();
		el.classList.remove("over");
		if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
	});
}

/** 从粘贴事件里取出文件 */
export const pastedFiles = (e) =>
	[...(e.clipboardData?.items || [])].filter((i) => i.kind === "file").map((i) => i.getAsFile()).filter(Boolean);

export const parseTags = (s) => String(s).split(/[,，、\s]+/).map((t) => t.trim()).filter(Boolean);

/** 当前显示的是不是这个面板（粘贴图片等全局事件只给当前面板用） */
export const isActive = (panel) => !panel.hidden;
