export type LabArtifact = {
	id: number;
	title: string;
	status: string;
	description: string;
	link: string;
	image: string;
	screenshots: string[];
	tags: string[];
};

export const labArtifacts: LabArtifact[] = [
	{
		id: 1,
		title: 'MyDanceDNA',
		status: 'Directory platform',
		description: 'A search surface for dancers to find schools, instructors, and courses by style, location, or price.',
		link: 'https://www.mydancedna.com',
		image: '/projects/mydancedna/hero.png',
		screenshots: [
			'/projects/mydancedna/hero.png',
			'/projects/mydancedna/Xnapper-2025-12-28-16.45.33.png',
			'/projects/mydancedna/Xnapper-2025-12-28-16.45.53.png',
		],
		tags: ['PYTHON', 'FASTAPI', 'REACT', 'POSTGRESQL'],
	},
	{
		id: 2,
		title: 'No Noise Letter',
		status: 'Signal extraction experiment',
		description: 'Source-aware private briefings: set the topics once, then get a calm newsletter with the useful signal cut out of the feed noise.',
		link: 'https://nonoiseletter.com',
		image: '/projects/nonoiseletter/hero.png',
		screenshots: [
			'/projects/nonoiseletter/hero.png',
			'/projects/nonoiseletter/how-it-works.png',
			'/projects/nonoiseletter/pricing.png',
		],
		tags: ['TYPESCRIPT', 'REACT', 'FASTIFY', 'AI'],
	},
];
