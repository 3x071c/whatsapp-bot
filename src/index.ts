import { Router, error, json, RequestLike } from "itty-router";

const router = Router();

router
	/* Index route */
	.get("/", () => ({
		hello: "world",
	}))
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
