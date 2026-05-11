export type LabArtifact = {
	id: number;
	title: string;
	status: string;
	description: string;
	link: string;
	tags: string[];
};

export const labArtifacts: LabArtifact[] = [
	{
		id: 1,
		title: 'No Noise Letter',
		status: 'Signal extraction experiment',
		description: 'Source-aware private briefings: set the topics once, then get a calm newsletter with the useful signal cut out of the feed noise.',
		link: 'https://nonoiseletter.com',
		tags: ['TYPESCRIPT', 'REACT', 'FASTIFY', 'AI'],
	},
	{
		id: 2,
		title: 'MyDanceDNA',
		status: 'Directory platform',
		description: 'A search surface for dancers to find schools, instructors, and courses by style, location, or price.',
		link: 'https://www.mydancedna.com',
		tags: ['PYTHON', 'FASTAPI', 'REACT', 'POSTGRESQL'],
	},
	{
		id: 3,
		title: 'Szewc Online',
		status: 'Service site',
		description: 'Online shoe repair presence for a local cobbler: explain the repair, arrange contact, and support shipping from across Poland.',
		link: 'https://szewconline.pl/',
		tags: ['REACT', 'TAILWIND', 'VITE'],
	},
];
