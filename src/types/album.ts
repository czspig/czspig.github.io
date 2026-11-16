export interface Photo {
	id?: string;
	src: string;
	alt?: string;
	title?: string;
	thumbnail?: string;
	tags?: string[];
	description?: string;
	date?: string;
	location?: string;
	width?: number;
	height?: number;
}

export interface AlbumGroup {
	id: string;
	title: string;
	description?: string;
	cover: string;
	date: string;
	location?: string;
	tags?: string[];
	photos: Photo[];
	password?: string;
	passwordHint?: string;
	/** 大相册：info.json 的 children 里列出的小相册 id */
	childIds?: string[];
	children?: AlbumGroup[];
	parentId?: string;
}
