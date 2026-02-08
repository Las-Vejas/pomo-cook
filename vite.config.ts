import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { execSync } from 'child_process';

const gitHash = execSync('git rev-parse --short HEAD').toString().trim();
const gitRemote = execSync('git remote get-url origin').toString().trim();
const githubUrl = gitRemote
	.replace(/\.git$/, '')
	.replace(/^git@github\.com:/, 'https://github.com/');

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	define: {
		__GIT_HASH__: JSON.stringify(gitHash),
		__GITHUB_URL__: JSON.stringify(githubUrl)
	}
});
