import type { Tier } from '$lib/data/tiers';

interface CertificateData {
	username: string;
	score: number;
	tier: Tier;
}

export async function generateCertificate(data: CertificateData): Promise<string> {
	await document.fonts.ready;

	const canvas = document.createElement('canvas');
	const w = 800;
	const h = 560;
	canvas.width = w;
	canvas.height = h;

	const ctx = canvas.getContext('2d')!;

	// Background
	ctx.fillStyle = '#f5f0e8';
	ctx.fillRect(0, 0, w, h);

	// Subtle lined paper effect
	ctx.strokeStyle = 'rgba(180, 170, 150, 0.15)';
	ctx.lineWidth = 1;
	for (let y = 30; y < h; y += 24) {
		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(w, y);
		ctx.stroke();
	}

	// Border — double line
	ctx.strokeStyle = '#2a2a40';
	ctx.lineWidth = 4;
	ctx.strokeRect(16, 16, w - 32, h - 32);
	ctx.lineWidth = 1.5;
	ctx.strokeRect(24, 24, w - 48, h - 48);

	// Corner decorations
	const cornerSize = 20;
	const corners = [
		[28, 28],
		[w - 28, 28],
		[28, h - 28],
		[w - 28, h - 28]
	];
	ctx.lineWidth = 2;
	for (const [cx, cy] of corners) {
		ctx.beginPath();
		ctx.arc(cx, cy, cornerSize / 2, 0, Math.PI * 2);
		ctx.stroke();
	}

	// Header
	ctx.fillStyle = '#6a6a7a';
	ctx.font = '11px "Special Elite", "Courier New", monospace';
	ctx.textAlign = 'center';
	ctx.fillText('OFFICIAL DOCUMENT — DO NOT DUPLICATE', w / 2, 55);

	ctx.fillStyle = '#2a2a40';
	ctx.font = 'bold 28px "Special Elite", "Courier New", monospace';
	ctx.fillText('THE MILK BUREAU', w / 2, 95);

	ctx.fillStyle = '#6a6a7a';
	ctx.font = '13px "Special Elite", "Courier New", monospace';
	ctx.fillText('DEPARTMENT OF LACTOSE VERIFICATION — EST. 1952', w / 2, 118);

	// Divider
	ctx.strokeStyle = '#2a2a40';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(60, 135);
	ctx.lineTo(w - 60, 135);
	ctx.stroke();

	// Certificate title
	ctx.fillStyle = '#2a2a40';
	ctx.font = '18px "Special Elite", "Courier New", monospace';
	ctx.fillText('CERTIFICATE OF MILK IDENTIFICATION', w / 2, 170);

	// Body text
	ctx.font = '14px "Special Elite", "Courier New", monospace';
	ctx.fillStyle = '#3a3a4a';
	ctx.fillText('This document hereby certifies that', w / 2, 210);

	// Username
	ctx.fillStyle = '#2a2a40';
	ctx.font = 'bold 26px "Comic Neue", "Comic Sans MS", cursive';
	ctx.fillText(data.username.toUpperCase(), w / 2, 250);

	// Underline under name
	const nameWidth = ctx.measureText(data.username.toUpperCase()).width;
	ctx.strokeStyle = '#2a2a40';
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(w / 2 - nameWidth / 2 - 10, 258);
	ctx.lineTo(w / 2 + nameWidth / 2 + 10, 258);
	ctx.stroke();

	// Score and tier info
	ctx.fillStyle = '#3a3a4a';
	ctx.font = '14px "Special Elite", "Courier New", monospace';
	ctx.fillText(
		`has been evaluated at the ${data.tier.name} level of Milk Identification`,
		w / 2,
		295
	);
	ctx.fillText(`with a final score of ${data.score}`, w / 2, 318);

	// Tier title
	ctx.fillStyle = '#6a6a7a';
	ctx.font = '12px "Special Elite", "Courier New", monospace';
	ctx.fillText(`Official Title: ${data.tier.title}`, w / 2, 350);

	// Divider
	ctx.strokeStyle = '#2a2a40';
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(120, 375);
	ctx.lineTo(w - 120, 375);
	ctx.stroke();

	// Bureaucratic text
	ctx.fillStyle = '#8a8a9a';
	ctx.font = '10px "Special Elite", "Courier New", monospace';
	ctx.fillText('Lactose Authority Pending · Not Valid For International Travel', w / 2, 400);
	ctx.fillText(
		'The Milk Bureau assumes no liability for incorrect milk identification in the field',
		w / 2,
		418
	);

	// Stamp effect
	ctx.save();
	ctx.translate(w - 160, h - 130);
	ctx.rotate(-0.2);
	ctx.strokeStyle = data.score >= 10 ? '#3a8a3a' : '#8a3a3a';
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.arc(0, 0, 45, 0, Math.PI * 2);
	ctx.stroke();
	ctx.fillStyle = data.score >= 10 ? '#3a8a3a' : '#8a3a3a';
	ctx.font = 'bold 14px "Special Elite", "Courier New", monospace';
	ctx.textAlign = 'center';
	ctx.fillText(data.score >= 10 ? 'APPROVED' : 'REVOKED', 0, 5);
	ctx.restore();

	// Serial number
	ctx.fillStyle = '#aaaaaa';
	ctx.font = '9px "Courier New", monospace';
	ctx.textAlign = 'left';
	const serial = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(
		''
	);
	ctx.fillText(`Serial: MB-${serial.toUpperCase()}`, 40, h - 40);

	// Date
	ctx.textAlign = 'right';
	ctx.fillText(`Issued: ${new Date().toLocaleDateString('en-US')}`, w - 40, h - 40);

	return canvas.toDataURL('image/png');
}

export function downloadCertificate(dataUrl: string, username: string) {
	const link = document.createElement('a');
	link.download = `milk-bureau-certificate-${username.toLowerCase().replace(/\s+/g, '-')}.png`;
	link.href = dataUrl;
	link.click();
}
