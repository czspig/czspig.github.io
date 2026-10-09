// 文章头部信息（frontmatter）的读写
// 只处理博客文章里会出现的简单写法：字符串、日期、布尔、数字、[数组]、「- 列表」
// 不认识的字段原样保留，避免改坏

const DATE_KEYS = new Set(["published", "updated"]);
const ORDER = ["title", "published", "updated", "description", "image", "tags", "category", "draft", "pinned"];

function parseScalar(raw) {
	const v = raw.trim();
	if (v === "") return "";
	if (v === "true" || v === "false") return v === "true";
	if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
	if (v.startsWith('"') && v.endsWith('"')) {
		try {
			return JSON.parse(v);
		} catch {
			return v.slice(1, -1);
		}
	}
	if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
	return v;
}

function parseInlineArray(v) {
	const inner = v.trim().slice(1, -1);
	const items = [];
	let cur = "";
	let quote = null;
	for (const ch of inner) {
		if (quote) {
			cur += ch;
			if (ch === quote) quote = null;
		} else if (ch === '"' || ch === "'") {
			quote = ch;
			cur += ch;
		} else if (ch === ",") {
			items.push(cur);
			cur = "";
		} else cur += ch;
	}
	if (cur.trim()) items.push(cur);
	return items.map((s) => String(parseScalar(s))).filter((s) => s !== "");
}

/** @returns {{ data: Record<string, any>, raw: Record<string, string>, body: string }} */
export function parseFrontmatter(text) {
	const src = text.replace(/^﻿/, "");
	const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
	if (!m) return { data: {}, raw: {}, body: src };
	const data = {};
	const raw = {};
	const lines = m[1].split(/\r?\n/);
	for (let i = 0; i < lines.length; i++) {
		const kv = /^([A-Za-z_][\w-]*):(.*)$/.exec(lines[i]);
		if (!kv) continue;
		const [, key, rest] = kv;
		let block = lines[i];
		const value = rest.replace(/\s+#.*$/, "").trim();
		if (value === "" && i + 1 < lines.length && /^\s*-\s/.test(lines[i + 1])) {
			const list = [];
			while (i + 1 < lines.length && /^\s*-\s/.test(lines[i + 1])) {
				i++;
				block += `\n${lines[i]}`;
				list.push(String(parseScalar(lines[i].replace(/^\s*-\s/, ""))));
			}
			data[key] = list;
		} else if (value.startsWith("[") && value.endsWith("]")) {
			data[key] = parseInlineArray(value);
		} else {
			data[key] = parseScalar(value);
		}
		raw[key] = block;
	}
	return { data, raw, body: src.slice(m[0].length) };
}

function formatValue(key, v) {
	if (Array.isArray(v)) return `[${v.map((s) => JSON.stringify(String(s))).join(", ")}]`;
	if (typeof v === "boolean" || typeof v === "number") return String(v);
	// 日期不能加引号，否则会被当成字符串，网站构建会报错
	if (DATE_KEYS.has(key) && /^\d{4}-\d{2}-\d{2}([ T][\d:.+\-Z]*)?$/.test(String(v))) return String(v);
	return JSON.stringify(String(v ?? ""));
}

/**
 * @param {Record<string, any>} data 要写入的字段（值为 undefined/空字符串/空数组的可选字段会省略）
 * @param {Record<string, string>} raw 原文件里其他字段的原始写法
 */
export function stringifyFrontmatter(data, raw, body) {
	const lines = [];
	const keys = [...ORDER.filter((k) => k in data), ...Object.keys(data).filter((k) => !ORDER.includes(k))];
	for (const key of keys) {
		const v = data[key];
		const required = key === "title" || key === "published";
		if (!required && (v === undefined || v === "" || (Array.isArray(v) && v.length === 0))) continue;
		lines.push(`${key}: ${formatValue(key, v)}`);
	}
	for (const [key, block] of Object.entries(raw || {})) {
		if (!(key in data)) lines.push(block);
	}
	return `---\n${lines.join("\n")}\n---\n\n${body.replace(/^\s+/, "")}`;
}
