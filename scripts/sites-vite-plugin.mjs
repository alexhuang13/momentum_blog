// Adapted from the Sites starter; packages logical hosting metadata.
import { access, cp, mkdir } from 'node:fs/promises';
export function sites() {
  return {
    name: 'sites', apply: 'build',
    async closeBundle() {
      try { await access('.openai/hosting.json'); }
      catch (error) { if (error.code === 'ENOENT') return; throw error; }
      await mkdir('dist/.openai', { recursive: true });
      await cp('.openai/hosting.json', 'dist/.openai/hosting.json');
    },
  };
}
