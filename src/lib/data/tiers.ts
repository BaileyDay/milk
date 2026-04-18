export interface Tier {
	level: 1 | 2 | 3 | 4 | 5;
	name: string;
	title: string;
	description: string;
	minScore: number;
	timeLimitMs: number;
}

export const tiers: Tier[] = [
	{
		level: 1,
		minScore: 0,
		name: 'Milk Cadet',
		title: 'Provisional Milk Identification Trainee',
		description: 'The Bureau has assigned you the simplest cases.',
		timeLimitMs: 8000
	},
	{
		level: 2,
		minScore: 5,
		name: 'Milk Inspector',
		title: 'Junior Milk Verification Officer',
		description: 'You have demonstrated baseline competence. Do not let it go to your head.',
		timeLimitMs: 6000
	},
	{
		level: 3,
		minScore: 12,
		name: 'Milk Detective',
		title: 'Senior Dairy Forensics Analyst',
		description: 'The Bureau acknowledges your growing aptitude. Suspiciously growing.',
		timeLimitMs: 5000
	},
	{
		level: 4,
		minScore: 22,
		name: 'Milk Commander',
		title: 'Deputy Director of Lactose Intelligence',
		description: 'Your skills are... concerning. The Bureau is watching.',
		timeLimitMs: 4000
	},
	{
		level: 5,
		minScore: 35,
		name: 'Milk Supreme',
		title: 'Supreme Chancellor of the Milk Bureau',
		description: 'The Bureau has never seen anything like this. We are alarmed.',
		timeLimitMs: 3000
	}
];

export function getTierForScore(score: number): Tier {
	for (let i = tiers.length - 1; i >= 0; i--) {
		if (score >= tiers[i].minScore) return tiers[i];
	}
	return tiers[0];
}

export function getMaxTierLevel(score: number): number {
	return getTierForScore(score).level;
}
