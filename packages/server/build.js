// This is not a ES Module, as we need access to `require.resolve` to fix a JSDom warning
const fs = require('fs-extra');
const esbuild = require('esbuild');

// Taken from a comment somewhere in this thread: https://github.com/evanw/esbuild/issues/1311
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
	outfile: 'dist/server.js',
	plugins: [jsdomPatch],
	external: ['canvas', 'pg-native']
})
.then(() => {
	const file = process.platform === 'darwin' 
		? 'darwin-x64+arm64'
		: `${process.platform}-${process.arch}`;

	try {
		fs.copySync(
			`../../node_modules/.pnpm/level@8.0.1/node_modules/classic-level/prebuilds/${file}/`,
			`dist/prebuilds/${file}/`
		);
	} catch (e) {
		console.error(e);
		console.error(); // Newline

		throw new Error('Ran into an error when trying to copy prebuilt native modules for the `classic-level` module.');
	}
});

