<script lang="ts">
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

	// Timer logic
	$effect(() => {
		let interval: ReturnType<typeof setInterval> | undefined;

		if (isRunning && seconds > 0) {
			interval = setInterval(() => {
				seconds--;
			}, 1000);
		} else if (seconds === 0) {
			isRunning = false;
			// Optional: Play a sound or notification when timer completes
		}

		return () => {
			if (interval) clearInterval(interval);
		};
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
</script>

<div class="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
	<div class="flex flex-col items-center gap-8 w-full max-w-md">
		<!-- Mode selector -->
		<div class="flex gap-2 text-sm">
			<button
				onclick={() => changeMode('pomodoro')}
				class="px-4 py-2 rounded transition-colors {mode === 'pomodoro'
					? 'bg-primary text-primary-foreground'
					: 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground'}"
			>
				Pomodoro
			</button>
			<button
				onclick={() => changeMode('short')}
				class="px-4 py-2 rounded transition-colors {mode === 'short'
					? 'bg-primary text-primary-foreground'
					: 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground'}"
			>
				Short Break
			</button>
			<button
				onclick={() => changeMode('long')}
				class="px-4 py-2 rounded transition-colors {mode === 'long'
					? 'bg-primary text-primary-foreground'
					: 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground'}"
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
			>
				{isRunning ? 'Pause' : 'Start'}
			</button>
			<button
				onclick={resetTimer}
				class="px-8 py-3 text-lg bg-secondary text-secondary-foreground rounded hover:bg-accent hover:text-accent-foreground transition-colors"
			>
				Reset
			</button>
		</div>
	</div>
</div>
