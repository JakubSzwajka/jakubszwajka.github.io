import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';

const posts = await getCollection('blog');
const pages = Object.fromEntries(posts.map(({ id, data }) => [id, data]));

export const { getStaticPaths, GET } = await OGImageRoute({
	param: 'route',
	pages,
	getImageOptions: (_path, page) => ({
		title: page.title,
		description: page.description,
		bgGradient: [[13, 13, 13]],
		border: { color: [204, 255, 0], width: 20, side: 'inline-start' },
		font: {
			title: {
				size: 64,
				color: [224, 224, 224],
				weight: 'Bold',
			},
			description: {
				size: 32,
				color: [128, 128, 128],
			},
		},
		padding: 60,
	}),
});
