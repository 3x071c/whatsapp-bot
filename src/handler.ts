import { Router, error, json, type RequestLike } from "itty-router";
import { log } from "./utils";

const router = Router();

router
	/* Index route (currently health test) */
	.get("/", () => ({
		ping: "pong",
	}))
	/* Webhook subscription for new events */
	.post("/hook", (req) => {
		log(JSON.stringify(req));
		return {};
	})
	/* 404 the rest */
	.all("*", () => error(404));

export const handler: ExportedHandler = {
	fetch: (req, env, ctx) =>
		router
			.handle(req as RequestLike, env, ctx)
			.then(json)
			.catch(error),
};
