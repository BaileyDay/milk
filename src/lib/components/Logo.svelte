<script lang="ts">
	let { size = 'md' }: { size?: 'sm' | 'md' | 'lg' } = $props();

	const sizes = { sm: 80, md: 160, lg: 280 };
	const px = $derived(sizes[size]);
</script>

<svg
	width={px}
	height={px}
	viewBox="0 0 200 200"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	role="img"
	aria-label="Milk Bureau Logo"
>
	<!-- Badge background -->
	<polygon
		points="100,8 120,35 155,20 150,55 188,58 168,88 200,110 170,130 185,162 150,155 140,190 108,170 100,200 92,170 60,190 50,155 15,162 30,130 0,110 32,88 12,58 50,55 45,20 80,35"
		fill="oklch(85% 0.17 85)"
		stroke="oklch(25% 0.02 250)"
		stroke-width="3"
	/>

	<!-- Inner circle -->
	<circle
		cx="100"
		cy="105"
		r="65"
		fill="oklch(96% 0.01 90)"
		stroke="oklch(25% 0.02 250)"
		stroke-width="2.5"
	/>

	<!-- Glass body -->
	<path
		d="M70 70 L65 150 Q65 160 75 160 L125 160 Q135 160 135 150 L130 70 Z"
		fill="white"
		stroke="oklch(25% 0.02 250)"
		stroke-width="2.5"
		stroke-linejoin="round"
	/>

	<!-- Milk level -->
	<path
		d="M67 90 Q85 82 100 90 Q115 98 133 90 L130 70 L70 70 Z"
		fill="oklch(90% 0.02 220 / 0.3)"
		stroke="none"
	/>
	<path
		d="M67 90 Q85 82 100 90 Q115 98 133 90 L129 150 Q129 157 122 157 L78 157 Q71 157 71 150 Z"
		fill="white"
		stroke="none"
	/>

	<!-- Glass highlight -->
	<path
		d="M75 75 L74 145"
		stroke="oklch(90% 0.02 220 / 0.4)"
		stroke-width="3"
		stroke-linecap="round"
	/>

	<!-- Detective hat -->
	<ellipse
		cx="100"
		cy="58"
		rx="38"
		ry="8"
		fill="oklch(35% 0.03 250)"
		stroke="oklch(25% 0.02 250)"
		stroke-width="2"
	/>
	<path
		d="M72 58 Q75 28 100 25 Q125 28 128 58"
		fill="oklch(40% 0.03 250)"
		stroke="oklch(25% 0.02 250)"
		stroke-width="2"
	/>
	<rect
		x="88"
		y="43"
		width="24"
		height="10"
		rx="2"
		fill="oklch(85% 0.17 85)"
		stroke="oklch(25% 0.02 250)"
		stroke-width="1.5"
	/>
</svg>
