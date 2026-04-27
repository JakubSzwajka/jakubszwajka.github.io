import { getCollection } from 'astro:content';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function getStaticPaths() {
	const posts = await getCollection('blog');

	return posts.map((post) => ({
		params: { slug: post.id },
		props: { id: post.id },
	}));
}

export async function GET({ props }: { props: { id: string } }) {
	const mdPath = join(process.cwd(), 'src/content/blog', `${props.id}.md`);
	const mdxPath = join(process.cwd(), 'src/content/blog', `${props.id}.mdx`);

	let source: string;
	try {
		source = await readFile(mdPath, 'utf-8');
	} catch {
		source = await readFile(mdxPath, 'utf-8');
	}

	return new Response(source, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
}
