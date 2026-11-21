import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';

function lucideDirectPlugin() {
  const iconsDir = path.resolve('node_modules/lucide-react/dist/esm/icons');
  const toKebab = (s: string) =>
    s
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([a-zA-Z])([0-9])/g, '$1-$2')
      .toLowerCase();

  return {
    name: 'lucide-direct-imports',
    transform(code: string, id: string) {
      if (id.includes('node_modules') || !/\.(tsx|ts|jsx|js)$/.test(id)) return null;
      const re = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"];?/g;
      if (!re.test(code)) return null;
      return code.replace(re, (_full, specifiers: string) => {
        const lines: string[] = [];
        for (const raw of specifiers.split(',')) {
          const part = raw.trim();
          if (!part) continue;
          const [imported, alias] = part.split(/\s+as\s+/i).map((x) => x.trim());
          const file = `${toKebab(imported)}.js`;
          if (fs.existsSync(path.join(iconsDir, file))) {
            lines.push(`import ${alias || imported} from 'lucide-react/dist/esm/icons/${file}';`);
          } else {
            lines.push(`import { ${part} } from 'lucide-react';`);
          }
        }
        return lines.join('\n');
      });
    }
  };
}

export default defineConfig({
  plugins: [lucideDirectPlugin(), react()],
  base: './',
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:4747',
      '/mcp': 'http://127.0.0.1:4747',
      '/robots.txt': 'http://127.0.0.1:4747',
      '/sitemap.xml': 'http://127.0.0.1:4747'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
