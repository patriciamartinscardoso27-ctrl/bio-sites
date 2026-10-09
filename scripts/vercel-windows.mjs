// Keep Windows PATH casing unambiguous before Vercel clones the environment.
// Scope this workaround to the CLI process; never change the machine/user PATH.
import { spawnSync } from 'node:child_process';
const env = { ...process.env };
const pathKeys = Object.keys(env).filter(key => key.toLowerCase() === 'path');
const systemPath = process.env.Path || process.env.PATH;
for (const key of pathKeys) delete env[key];
env.PATH = systemPath;
const [cli, ...args] = process.argv.slice(2);
if (!cli) throw new Error('Informe o caminho do executável JavaScript da Vercel CLI.');
const result = spawnSync(process.execPath, [cli, ...args], { env, stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
