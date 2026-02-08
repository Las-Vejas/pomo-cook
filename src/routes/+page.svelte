<script lang="ts">
	import confetti from 'canvas-confetti';
	import { dev } from '$app/environment';

	let mode = $state<'pomodoro' | 'short' | 'long'>('pomodoro');
	let isRunning = $state(false);
	let seconds = $state(25 * 60); // Start with 25 minutes

	const durations = {
		pomodoro: 25 * 60,
		short: 5 * 60,
		long: 15 * 60
	};

	// Format time as MM:SS
	const formattedTime = $derived(() => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	});

	// Celebration confetti effect
	function celebrateWithConfetti() {
		const duration = 3000;
		const animationEnd = Date.now() + duration;
		const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

		function randomInRange(min: number, max: number) {
			return Math.random() * (max - min) + min;
		}

		const interval = setInterval(function () {
			const timeLeft = animationEnd - Date.now();

			if (timeLeft <= 0) {
				return clearInterval(interval);
			}

			const particleCount = 50 * (timeLeft / duration);
			confetti({
				...defaults,
				particleCount,
				origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
			});
			confetti({
				...defaults,
				particleCount,
				origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
			});
		}, 250);
	}

	// Timer logic
	$effect(() => {
		let interval: ReturnType<typeof setInterval> | undefined;

		if (isRunning && seconds > 0) {
			interval = setInterval(() => {
				seconds--;
			}, 1000);
		} else if (seconds === 0) {
			isRunning = false;
			// Trigger confetti when pomodoro completes (going into break)
			if (mode === 'pomodoro') {
				celebrateWithConfetti();
			}
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	});

	// Dev mode: keyboard shortcut to skip timer
	$effect(() => {
		if (!dev) return;

		function handleKeyPress(e: KeyboardEvent) {
			if (e.key === 's' || e.key === 'S') {
				seconds = 3; // Skip to 3 seconds remaining
			}
		}

		window.addEventListener('keydown', handleKeyPress);
		return () => window.removeEventListener('keydown', handleKeyPress);
	});

	function toggleTimer() {
		isRunning = !isRunning;
	}

	function resetTimer() {
		isRunning = false;
		seconds = durations[mode];
	}

	function changeMode(newMode: 'pomodoro' | 'short' | 'long') {
		mode = newMode;
		isRunning = false;
		seconds = durations[newMode];
	}

	// Dev mode: skip to end
	function skipTimer() {
		seconds = 3;
	}
</script>

<div class="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 relative">
	<div class="flex flex-col items-center gap-8 w-full max-w-md">
		<!-- Mode selector -->
		<div class="flex gap-2 text-sm">
			<button
				onclick={() => changeMode('pomodoro')}
				class="px-4 py-2 rounded transition-colors {mode === 'pomodoro'
					? 'bg-primary text-primary-foreground'
					: 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground'}"
				style="font-family: 'Geist Sans', sans-serif;"
			>
				Pomodoro
			</button>
			<button
				onclick={() => changeMode('short')}
				class="px-4 py-2 rounded transition-colors {mode === 'short'
					? 'bg-primary text-primary-foreground'
					: 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground'}"
				style="font-family: 'Geist Sans', sans-serif;"
			>
				Short Break
			</button>
			<button
				onclick={() => changeMode('long')}
				class="px-4 py-2 rounded transition-colors {mode === 'long'
					? 'bg-primary text-primary-foreground'
					: 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground'}"
				style="font-family: 'Geist Sans', sans-serif;"
			>
				Long Break
			</button>
		</div>

		<!-- Timer display -->
		<div
			class="text-9xl font-bold tracking-wider text-center tabular-nums"
			style="font-variant-numeric: tabular-nums;"
		>
			{formattedTime()}
		</div>

		<!-- Control buttons -->
		<div class="flex gap-4">
			<button
				onclick={toggleTimer}
				class="px-8 py-3 text-lg bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
				style="font-family: 'Geist Sans', sans-serif;"
			>
				{isRunning ? 'Pause' : 'Start'}
			</button>
			<button
				onclick={resetTimer}
				class="px-8 py-3 text-lg bg-secondary text-secondary-foreground rounded hover:bg-accent hover:text-accent-foreground transition-colors"
				style="font-family: 'Geist Sans', sans-serif;"
			>
				Reset
			</button>
		</div>

		{#if dev}
			<!-- Dev mode skip button -->
			<div class="text-xs text-muted-foreground text-center">
				<button
					onclick={skipTimer}
					class="px-3 py-1 text-xs bg-destructive/20 text-destructive rounded hover:bg-destructive/30 transition-colors"
					style="font-family: 'Geist Sans', sans-serif;"
				>
					Skip Timer (or press 'S')
				</button>
			</div>
		{/if}
	</div>

	<!-- Footer -->
	<footer class="fixed bottom-0 left-0 right-0 py-3 px-4 text-center text-xs text-muted-foreground border-t border-border bg-background/80 backdrop-blur-sm" style="font-family: 'Geist Sans', sans-serif;">
		<div class="flex items-center justify-center gap-4">
			<a href="{__GITHUB_URL__}/commit/{__GIT_HASH__}" target="_blank" rel="noopener noreferrer" class="opacity-60 hover:opacity-100 hover:text-foreground transition-all">
				git: {__GIT_HASH__}
			</a>
			<span class="opacity-30">•</span>
			<a href="https://vejas.zip" target="_blank" rel="noopener noreferrer" class="hover:text-foreground transition-colors">
				Made with ❤️ by Vejas
			</a>
		</div>
	</footer>
</div>
