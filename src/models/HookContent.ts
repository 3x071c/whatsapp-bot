/* eslint-disable @typescript-eslint/no-redeclare */
import { z } from "zod";

export const HookContent = z.object({
	conversation: z.string().endsWith("@g.us"),
	message: z.object({
		id: z.string(),
		text: z.string(),
		type: z.string(),
	}),
	productId: z.string(),
	reply: z.string(),
	type: z.string(),
	user: z.object({ id: z.string() }),
});
export type HookContent = z.infer<typeof HookContent>;
