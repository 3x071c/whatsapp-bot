import { Router, error, json, RequestLike } from "itty-router";

const router = Router();

router
	/* Index route (currently health test) */
	.get("/", () => ({
		ping: "pong",
	}))
	/* Webhook subscription for new events */
	.get("/hook", (req) => {
		console.log(JSON.stringify(req));
	})
	/* 404 the rest */
	.all("*", () => error(404));

const handler: ExportedHandler = {
	fetch: (req, env, ctx) =>
		router
			.handle(req as RequestLike, env, ctx)
			.then(json)
			.catch(error),
};
export default handler;
