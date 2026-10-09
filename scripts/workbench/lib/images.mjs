// 图片处理：压缩成 webp、按方向摆正、去掉 EXIF（包括拍摄位置）

import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

/** 处理后用的扩展名：动图和矢量图保持原样，其余转 webp */
export function outputExt(name) {
	const ext = path.extname(name).toLowerCase();
	return ext === ".gif" || ext === ".svg" ? ext : ".webp";
}

/**
 * @param {Buffer} buf
 * @param {string} name 原文件名，用来判断类型
 * @param {{ max?: number, quality?: number }} opts
 */
export async function processImage(buf, name, { max = 1800, quality = 82 } = {}) {
	if (outputExt(name) !== ".webp") return buf;
	try {
		return await sharp(buf)
			.rotate()
			.resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
			.webp({ quality })
			.toBuffer();
	} catch {
		throw new Error(`图片「${name}」无法识别（iPhone 的 HEIC 照片请先转成 JPG）`);
	}
}

/** 裁成固定尺寸的封面 */
export async function coverImage(buf, width, height) {
	return sharp(buf).rotate().resize(width, height, { fit: "cover" }).webp({ quality: 85 }).toBuffer();
}
