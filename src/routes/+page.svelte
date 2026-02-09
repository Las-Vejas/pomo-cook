<script lang="ts">
	import confetti from 'canvas-confetti';
	import { dev } from '$app/environment';
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';

	let mode = $state<'pomodoro' | 'short' | 'long'>('pomodoro');
	let isRunning = $state(false);
	let seconds = $state(25 * 60); // Start with 25 minutes

	// Session tracking
	let sessionCount = $state(0);
	let consecutivePomodoros = $state(0);

	// Settings
	let autoStartBreaks = $state(false);
	let autoStartPomodoro = $state(false);
	let customDurations = $state({
		pomodoro: 25,
		short: 5,
		long: 15
	});

	// UI state
	let showSettings = $state(false);

	// Computed durations in seconds
	const durations = $derived({
		pomodoro: customDurations.pomodoro * 60,
		short: customDurations.short * 60,
		long: customDurations.long * 60
	});

	// Format time as MM:SS
	const formattedTime = $derived(() => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	});

	// Calculate progress for countdown ring
	const progress = $derived(() => {
		const total = durations[mode];
		const remaining = seconds;
		return (remaining / total) * 100;
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

	// localStorage helpers
	function loadSessionCount() {
		if (!browser) return;
		try {
			const stored = localStorage.getItem('pomo-session');
			if (stored) {
				const data = JSON.parse(stored);
				const today = new Date().toDateString();
				if (data.date === today) {
					sessionCount = data.count;
				} else {
					sessionCount = 0;
					saveSessionCount();
				}
			}
		} catch (e) {
			console.error('Failed to load session count:', e);
		}
	}

	function saveSessionCount() {
		if (!browser) return;
		try {
			localStorage.setItem(
				'pomo-session',
				JSON.stringify({
					count: sessionCount,
					date: new Date().toDateString()
				})
			);
		} catch (e) {
			console.error('Failed to save session count:', e);
		}
	}

	function loadSettings() {
		if (!browser) return;
		try {
			const stored = localStorage.getItem('pomo-settings');
			if (stored) {
				const data = JSON.parse(stored);
				if (data.autoStartBreaks !== undefined) autoStartBreaks = data.autoStartBreaks;
				if (data.autoStartPomodoro !== undefined) autoStartPomodoro = data.autoStartPomodoro;
				if (data.customDurations) {
					customDurations = { ...customDurations, ...data.customDurations };
				}
			}
		} catch (e) {
			console.error('Failed to load settings:', e);
		}
	}

	function saveSettings() {
		if (!browser) return;
		try {
			localStorage.setItem(
				'pomo-settings',
				JSON.stringify({
					autoStartBreaks,
					autoStartPomodoro,
					customDurations
				})
			);
		} catch (e) {
			console.error('Failed to save settings:', e);
		}
	}

	let initialized = false;
	let hasCompleted = false; // Prevent multiple completion triggers

	// Load data on mount
	$effect(() => {
		if (!browser || initialized) return;
		loadSessionCount();
		loadSettings();
		// Set initial seconds based on loaded custom durations
		seconds = durations[mode];
		initialized = true;
	});

	// Save settings whenever they change (but only after initialization)
	$effect(() => {
		if (!initialized) return;
		// Track dependencies
		autoStartBreaks;
		autoStartPomodoro;
		customDurations;
		saveSettings();
	});

	// Timer logic
	$effect(() => {
		let interval: ReturnType<typeof setInterval> | undefined;

		if (isRunning && seconds > 0) {
			// Reset completion flag when timer is running
			hasCompleted = false;
			interval = setInterval(() => {
				seconds--;
			}, 1000);
		} else if (seconds === 0 && !hasCompleted) {
			// Only run completion logic once
			hasCompleted = true;
			isRunning = false;

			if (mode === 'pomodoro') {
				// Increment session counter
				sessionCount++;
				consecutivePomodoros++;
				saveSessionCount();
				celebrateWithConfetti();

				// Auto-start break if enabled
				if (autoStartBreaks) {
					// Use long break every 4 pomodoros
					const breakMode = consecutivePomodoros % 4 === 0 ? 'long' : 'short';
					mode = breakMode;
					seconds = durations[breakMode];
					isRunning = true;
				}
			} else if (mode === 'short' || mode === 'long') {
				// Auto-start pomodoro if enabled
				if (autoStartPomodoro) {
					mode = 'pomodoro';
					seconds = durations.pomodoro;
					isRunning = true;
				}
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
		hasCompleted = false;
	}

	function changeMode(newMode: 'pomodoro' | 'short' | 'long') {
		mode = newMode;
		isRunning = false;
		seconds = durations[newMode];
		hasCompleted = false;
		// Reset consecutive pomodoros when manually switching
		if (newMode !== 'pomodoro') {
			consecutivePomodoros = 0;
		}
	}

	// Dev mode: skip to end
	function skipTimer() {
		seconds = 3;
	}
</script>

<!-- Navbar -->
<nav class="fixed top-0 left-0 right-0 py-4 px-6 border-b border-border bg-background/80 backdrop-blur-sm z-40" style="font-family: 'Geist Sans', sans-serif;">
	<div class="flex items-center justify-between max-w-6xl mx-auto">
		<h1 class="text-lg font-semibold text-foreground">🍅 Pomo Cook</h1>
		<div class="flex items-center gap-4">
			<div class="text-sm text-muted-foreground">
				🍅 {sessionCount} today
			</div>
			<Button
				onclick={() => (showSettings = !showSettings)}
				variant="ghost"
				size="default"
				class="text-muted-foreground hover:text-foreground"
				aria-label="Settings"
			>
				Settings ⚙️
			</Button>
		</div>
	</div>
</nav>

<div class="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 relative pt-20">
	<div class="flex flex-col items-center gap-8 w-full max-w-md">
		<!-- Mode selector -->
		<div class="flex gap-2 text-sm">
			<Button
				onclick={() => changeMode('pomodoro')}
				variant={mode === 'pomodoro' ? 'default' : 'secondary'}
				style="font-family: 'Geist Sans', sans-serif;"
			>
				Pomodoro
			</Button>
			<Button
				onclick={() => changeMode('short')}
				variant={mode === 'short' ? 'default' : 'secondary'}
				style="font-family: 'Geist Sans', sans-serif;"
			>
				Short Break
			</Button>
			<Button
				onclick={() => changeMode('long')}
				variant={mode === 'long' ? 'default' : 'secondary'}
				style="font-family: 'Geist Sans', sans-serif;"
			>
				Long Break
			</Button>
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
			<Button
				onclick={toggleTimer}
				size="lg"
				class="px-8 text-lg"
				style="font-family: 'Geist Sans', sans-serif;"
			>
				{isRunning ? 'Pause' : 'Start'}
			</Button>
			<Button
				onclick={resetTimer}
				variant="secondary"
				size="lg"
				class="px-8 text-lg"
				style="font-family: 'Geist Sans', sans-serif;"
			>
				Reset
			</Button>
		</div>

		{#if dev}
			<!-- Dev mode skip button -->
			<div class="text-xs text-muted-foreground text-center">
				<Button
					onclick={skipTimer}
					variant="destructive"
					size="sm"
					class="text-xs bg-destructive/20 hover:bg-destructive/30"
					style="font-family: 'Geist Sans', sans-serif;"
				>
					Skip Timer (or press 'S')
				</Button>
			</div>
		{/if}
	</div>

	<!-- Settings Modal -->
	<Dialog.Root bind:open={showSettings}>
		<Dialog.Content class="sm:max-w-md" style="font-family: 'Geist Sans', sans-serif;">
			<Dialog.Header>
				<Dialog.Title>Settings</Dialog.Title>
			</Dialog.Header>

			<!-- Auto-start options -->
			<div class="space-y-4 mb-6">
				<div class="flex items-center gap-3">
					<Checkbox
						id="auto-breaks"
						bind:checked={autoStartBreaks}
					/>
					<Label for="auto-breaks" class="text-sm cursor-pointer">Auto-start breaks</Label>
				</div>
				<div class="flex items-center gap-3">
					<Checkbox
						id="auto-pomodoro"
						bind:checked={autoStartPomodoro}
					/>
					<Label for="auto-pomodoro" class="text-sm cursor-pointer">Auto-start next pomodoro</Label>
				</div>
			</div>

			<!-- Custom durations -->
			<div class="space-y-4 mb-6">
				<h3 class="text-sm font-medium">Custom Durations (minutes)</h3>
				<div class="flex items-center gap-3">
					<Label for="work-duration" class="text-xs text-muted-foreground w-24">Work:</Label>
					<Input
						id="work-duration"
						type="number"
						bind:value={customDurations.pomodoro}
						min={1}
						max={60}
						class="flex-1"
					/>
				</div>
				<div class="flex items-center gap-3">
					<Label for="short-duration" class="text-xs text-muted-foreground w-24">Short Break:</Label>
					<Input
						id="short-duration"
						type="number"
						bind:value={customDurations.short}
						min={1}
						max={60}
						class="flex-1"
					/>
				</div>
				<div class="flex items-center gap-3">
					<Label for="long-duration" class="text-xs text-muted-foreground w-24">Long Break:</Label>
					<Input
						id="long-duration"
						type="number"
						bind:value={customDurations.long}
						min={1}
						max={60}
						class="flex-1"
					/>
				</div>
			</div>

			<!-- Close button -->
			<Button
				onclick={() => (showSettings = false)}
				class="w-full"
			>
				Close
			</Button>
		</Dialog.Content>
	</Dialog.Root>

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
