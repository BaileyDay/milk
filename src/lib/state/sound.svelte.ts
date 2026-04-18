let audioUnlocked = $state(false);
let muted = $state(false);

const audioCache: Map<string, HTMLAudioElement> = new Map();

function getAudio(src: string): HTMLAudioElement {
	let audio = audioCache.get(src);
	if (!audio) {
		audio = new Audio(src);
		audio.preload = 'auto';
		audioCache.set(src, audio);
	}
	return audio;
}

export function unlockAudio() {
	if (audioUnlocked) return;
	// Play a silent buffer to unlock audio context on mobile
	const audio = new Audio();
	audio.play().catch(() => {});
	audioUnlocked = true;
	// Preload sounds
	getAudio('/sounds/correct.mp3');
	getAudio('/sounds/wrong.mp3');
}

export function playSound(name: 'correct' | 'wrong') {
	if (muted) return;
	const audio = getAudio(`/sounds/${name}.mp3`);
	audio.currentTime = 0;
	audio.play().catch(() => {});
}

export function toggleMute() {
	muted = !muted;
}

export function getSoundState() {
	return {
		get muted() {
			return muted;
		}
	};
}
