export interface ImageEntry {
	id: string;
	src: string;
	isMilk: boolean;
	tier: 1 | 2 | 3 | 4 | 5;
	alt: string;
	explanation?: string;
}
