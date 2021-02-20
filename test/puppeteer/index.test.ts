import { HTTPResponse } from 'puppeteer';

// Helper functions used in multiple tests
const waitForResponse = async () =>
	await page.waitForResponse((response: HTTPResponse) =>
		/^https:\/\/jigsaw\.w3\.org\/css-validator\/validator\?.+output=application\/json$/.test(response.url())
	);

// Setup work before each test
beforeEach(async () => {
	await jestPuppeteer.resetPage();

	await page.goto(`http://localhost:8080/`, {
		waitUntil: 'load',
	});
});

// Wait after each test
afterEach(
	() => new Promise<void>((resolve) => setTimeout(resolve, 1000))
);

// Tests
it('Loads', async () => {
	await expect(page.title()).resolves.toMatch('Hello world!');
});

it('Returns the validity', async () => {
	await page.type('#custom-css', '.foo { text-align: center; }');
	await page.click('#make-call');

	await waitForResponse();
	expect(await page.evaluate(() => document.querySelector<HTMLHeadingElement>('#is-valid').innerText)).toBe('true');
});

it('Includes errors present in the response on the result', async () => {
	await page.type('#custom-css', '.foo { text-align: center; ');
	await page.click('#make-call');

	await waitForResponse();
	expect(await page.evaluate(() => document.querySelector<HTMLHeadingElement>('#is-valid').innerText)).toBe('false');
	expect(
		await page.evaluate(() => document.querySelector<HTMLUListElement>('#errors').childElementCount)
	).toBeGreaterThan(0);
});

it('Includes warnings present in the response on the result when options specify a warning level', async () => {
	await page.type('#custom-css', '.foo { font-family: Georgia; }');
	await page.select('#warning-level', '3');
	await page.click('#make-call');

	await waitForResponse();
	expect(await page.evaluate(() => document.querySelector<HTMLHeadingElement>('#is-valid').innerText)).toBe('true');
	expect(
		await page.evaluate(() => document.querySelector<HTMLUListElement>('#warnings').childElementCount)
	).toBeGreaterThan(0);
});
