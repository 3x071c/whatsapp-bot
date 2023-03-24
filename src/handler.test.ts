import type { UnstableDevWorker } from "wrangler";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { unstable_dev } from "wrangler";
import { main as source } from "package.json";

describe("Worker", () => {
	let worker: UnstableDevWorker;

	beforeAll(async () => {
		worker = await unstable_dev(source, { experimental: { disableExperimentalWarning: true } });
	});

	afterAll(async () => {
		await worker.stop();
	});

	it("has a working index route", async () => {
		const resp = await worker.fetch("/");
		expect(resp.status).toBe(200);

		const json = await resp.json();
		expect(json).toEqual({ ping: "pong" });
	});

	it("should return 404 for undefined routes", async () => {
		const resp = await worker.fetch("/foobar");
		expect(resp.status).toBe(404);
	});
});
