import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { execSync } from 'child_process';

function getGitHash(): string {
	try {
		return execSync('git rev-parse --short HEAD').toString().trim();
	} catch {
		return 'unknown';
	}
}

function getGithubUrl(): string {
	try {
		const gitRemote = execSync('git remote get-url origin').toString().trim();
		return gitRemote
			.replace(/\.git$/, '')
			.replace(/^git@github\.com:/, 'https://github.com/');
	} catch {
		return 'https://github.com/Las-Vejas/pomo-cook';
	}
}

const gitHash = getGitHash();
const githubUrl = getGithubUrl();

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	define: {
		__GIT_HASH__: JSON.stringify(gitHash),
		__GITHUB_URL__: JSON.stringify(githubUrl)
	},
	ssr: {
		noExternal: ['bits-ui']
	}
});
