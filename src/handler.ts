import { Router, error, json, RequestLike, withContent, status, IRequest } from "itty-router";
import { isSpam } from "./detectors";
import { HookContent } from "./models";

type Context = ExecutionContext;

const router = Router<[Environment, Context]>();

const withLogger = (request: IRequest) => {
	console.log(JSON.stringify(request["content"]));
};

router
	.all("*", withContent, withLogger)
	/* Index route (currently health test) */
	.get("/", () => ({
		ping: "pong",
	}))
	/* Webhook subscription for new events */
	.post("/hook", async ({ content: _content }, env) => {
		const content = HookContent.safeParse(_content);
		if (!content.success) return error(400);
		const {
			data: {
				conversation: groupId,
				productId,
				reply,
				type,
				user: { id: userId },
				message: { id: messageId, type: messageType, text: messageText },
			},
		} = content;
		if (productId !== env.MAYTAPI_PRODUCT) return error(400);
		if (type !== "message" || messageType !== "text") return status(200);

		if (await isSpam(env, userId, messageText)) {
			console.log("[handler] isSpam / userId", userId, "messageText", messageText);
			const deletion = await fetch(reply, {
				body: JSON.stringify({
					message: messageId,
					to_number: groupId,
					type: "delete",
				}),
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					"x-maytapi-key": env.MAYTAPI_TOKEN ?? "",
				},
				method: "POST",
			});
			if (!deletion.ok) {
				console.log("[handler] ❌ fetch failed");
				return error(500);
			}
			const result = await deletion.json();
			console.log("[handler] deletion API result:", JSON.stringify(result));
		}
		return status(200);
	})
	/* 404 the rest */
	.all("*", () => error(404));

export const handler: ExportedHandler<Record<string, string>> = {
	fetch: (req, env, ctx) => {
		const dev = env["ENVIRONMENT"] === "development";
		const environment: Environment = { ...env, dev };
		const context: Context = { ...ctx };

		return router
			.handle(req as RequestLike, environment, context)
			.then(json)
			.catch(error);
	},
};
