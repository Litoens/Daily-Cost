# Vendored dependencies

## supabase-js-2.119.0.js

- Package: `@supabase/supabase-js@2.119.0` from the npm registry (exact version).
- Built with: `esbuild --bundle --format=esm --target=es2022 --platform=browser --minify --legal-comments=none`
  from an entry of `export { createClient } from '@supabase/supabase-js';`
- Self-contained: no remaining `import`/`from` of external modules.
- sha256 of the committed file (including its one-line header comment):
  `017bf787ab1c59dcb4bb6e7ea9a0b3521ca703f5cda034c77036ff3a2367b6f2` (224468 bytes)

To upgrade: reinstall the new version in a temp dir, rebuild with the command above, update the filename,
this file, the import in js/supabaseClient.js and the file list in sw.js (bump CACHE_VERSION).
