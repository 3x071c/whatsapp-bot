import { Router, error, json, type RequestLike, withContent, status } from "itty-router";
import { getPosthog } from "./utils";

type Environment = {
	dev: boolean;
};
type Context = ExecutionContext & { posthog: ReturnType<typeof getPosthog> };

const router = Router<[Environment, Context]>();

router
	/* Index route (currently health test) */
	.get("/", (_req, _env, { posthog }) => {
		posthog.capture({
			distinctId: "handler",
			event: "index route requested",
		});
		return {
			ping: "pong",
		};
	})
	/* Webhook subscription for new events */
	.post("/hook", withContent, () => {
		return status(200);
	})
	/* 404 the rest */
	.all("*", () => error(404));

export const handler: ExportedHandler<Record<string, string>> = {
	fetch: (req, env, ctx) => {
		const dev = env["ENVIRONMENT"] === "development";
		const posthog = getPosthog();
		const environment: Environment = { ...env, dev };
		const context: Context = { ...ctx, posthog };

		return router
			.handle(req as RequestLike, environment, context)
			.then(json)
			.catch(error);
	},
};
