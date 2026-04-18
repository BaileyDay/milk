export const correctQuotes = [
	'The Bureau acknowledges your competence.',
	'Correct. The Bureau is mildly impressed.',
	'Your milk identification skills are adequate.',
	'The Bureau has recorded your success. Carry on.',
	'Satisfactory. Do not let this go to your head.',
	'The Bureau nods approvingly. Barely.',
	'Your training is paying off. The Bureau takes partial credit.',
	'Correct. The Bureau expected nothing less.',
	'Well identified. Your file has been updated accordingly.',
	'The Bureau confirms: you know your milk.'
];

export const wrongQuotes = [
	'The Bureau is disappointed.',
	'Incorrect. The Bureau has made a note of this.',
	'Your milk identification privileges are under review.',
	'The Bureau expected better. The Bureau always expects better.',
	'Failure logged. Your personnel file grows thicker.',
	'The Bureau is reconsidering your candidacy.',
	'Wrong. The Bureau wishes to remind you that milk is important.',
	'Incorrect. The Bureau sighs audibly.',
	'The Bureau has seen better. The Bureau has seen much better.',
	'A regrettable error. The Bureau will remember this.'
];

export const gameOverQuotes = [
	'Your examination has been terminated. The Bureau thanks you for your... effort.',
	'Three strikes. The Bureau has seen enough.',
	'Examination complete. The Bureau will be in touch. Or not.',
	'Your certification attempt has concluded. Results are being filed under "disappointing."',
	'The Bureau has ended your session. Please collect your belongings and exit to the left.'
];

export const timeoutQuotes = [
	'TIME EXPIRED. The Bureau does not wait.',
	'Indecision is its own answer. The Bureau has recorded it.',
	'The clock has rendered its verdict. It is not in your favor.',
	'Your hesitation has been filed. The Bureau is unimpressed.',
	'Time is a resource the Bureau does not grant twice.',
	'Tardiness is a form of incompetence. So noted.',
	'The Bureau counted. You did not answer. Draw your own conclusions.'
];

export function randomQuote(quotes: string[]): string {
	return quotes[Math.floor(Math.random() * quotes.length)];
}
