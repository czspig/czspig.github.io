// 极简 zip 解压（不依赖第三方库）：支持「存储」和「deflate」两种压缩方式
// 用于导入飞书等工具导出的「Markdown + 图片」压缩包

import zlib from "node:zlib";

const gbk = new TextDecoder("gbk");
const utf8 = new TextDecoder("utf-8");

export function readZip(buf) {
	// 从末尾找「中央目录结束」记录
	let eocd = -1;
	for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
		if (buf.readUInt32LE(i) === 0x06054b50) {
			eocd = i;
			break;
		}
	}
	if (eocd < 0) throw new Error("不是有效的 zip 压缩包");

	const count = buf.readUInt16LE(eocd + 10);
	let p = buf.readUInt32LE(eocd + 16);
	const files = [];

	for (let n = 0; n < count; n++) {
		if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("zip 目录损坏");
		const flags = buf.readUInt16LE(p + 8);
		const method = buf.readUInt16LE(p + 10);
		const compSize = buf.readUInt32LE(p + 20);
		const nameLen = buf.readUInt16LE(p + 28);
		const extraLen = buf.readUInt16LE(p + 30);
		const commentLen = buf.readUInt16LE(p + 32);
		const localOffset = buf.readUInt32LE(p + 42);
		const rawName = buf.subarray(p + 46, p + 46 + nameLen);
		// 第 11 位表示文件名是 UTF-8；否则多半是 Windows 中文系统打的包（GBK）
		const name = (flags & 0x800 ? utf8 : gbk).decode(rawName).replace(/\\/g, "/");
		p += 46 + nameLen + extraLen + commentLen;

		if (name.endsWith("/") || name.startsWith("__MACOSX/") || name.split("/").pop().startsWith(".")) continue;
		if (flags & 0x1) throw new Error("暂不支持加密的 zip");

		const lNameLen = buf.readUInt16LE(localOffset + 26);
		const lExtraLen = buf.readUInt16LE(localOffset + 28);
		const start = localOffset + 30 + lNameLen + lExtraLen;
		const raw = buf.subarray(start, start + compSize);

		let data;
		if (method === 0) data = Buffer.from(raw);
		else if (method === 8) data = zlib.inflateRawSync(raw);
		else throw new Error(`zip 里的「${name}」用了不支持的压缩方式`);
		files.push({ name, data });
	}
	return files;
}
