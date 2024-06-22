// This is not a ES Module, as we need access to `require.resolve` to fix a JSDom warning
const fs = require('node:fs');
const esbuild = require('esbuild');

const jsdomPatch = {
	name: 'jsdom-patch',
	setup(build) {
		build.onLoad({ filter: /jsdom\/living\/xhr\/XMLHttpRequest-impl\.js$/ }, async (args) => {
			let contents = await fs.promises.readFile(args.path, 'utf8');

			contents = contents.replace(
				'const syncWorkerFile = require.resolve ? require.resolve("./xhr-sync-worker.js") : null;',
				`const syncWorkerFile = "${require.resolve(
					'jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js', { paths: [process.cwd()] }
				)}";`,
			);

			return { contents, loader: 'js' };
		});
	},
};

esbuild.build({
	entryPoints: ['src/init.ts'],
	bundle: true,
	minify: true,
	platform: 'node',
	outfile: 'server.js',
	plugins: [jsdomPatch],
	// Note: We only have to provide `level` as a dependency, as we don't use Postgres
	external: ['canvas', 'pg-native', 'level'],
});
