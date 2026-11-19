import { defineConfig } from 'vite';

// The reference photos in assets/references/ are private: they must never be served,
// bundled or deployed. Only the generated pixel sprites ship.
const REFERENCES = /assets[\/]references/i;

function excludeReferences() {
  return {
    name: 'exclude-references',
    resolveId(id) {
      if (REFERENCES.test(id)) throw new Error(`Refusing to bundle private reference file: ${id}`);
      return null;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (REFERENCES.test(decodeURIComponent(req.url || ''))) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [excludeReferences()],
  server: { fs: { deny: ['**/assets/references/**'] } },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
  },
});
