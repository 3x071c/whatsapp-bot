/* eslint-disable @typescript-eslint/no-redeclare -- Make Zod typings usable */

import { z } from "zod";
import { handler } from "./_handler";
import { UUID, DateType } from "./_shared";

export const Message = z.object({
	createdAt: DateType,
	modifiedAt: DateType,
	sender: z.string(),
	text: z.string(),
	uuid: UUID,
});
export type Message = z.infer<typeof Message>;
export const MessageData = Message.omit({
	createdAt: true,
	modifiedAt: true,
	uuid: true,
});
export type MessageData = z.infer<typeof MessageData>;

export const messages = handler<Message, (typeof Message)["shape"], typeof Message>(Message, "MESSAGES");
