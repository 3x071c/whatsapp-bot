/* eslint-disable no-await-in-loop */
import { last } from "lodash";
import { compareTwoStrings } from "string-similarity";
import { messages as _messages } from "$/models";

export const isSpam = async (env: Environment, sender: string, _text: string) => {
	const messages = _messages(env);
	const text = _text.replace(/[^a-z]/gi, "");
	await messages.create({ sender, text }, { expirationTtl: 600 });

	let query: KVNamespaceListResult<unknown>;
	const senderHistory: string[] = [];
	const textHistory: string[] = [];
	let violationCount = 0;
	do {
		query = await messages.uuids("sender", { prefix: sender });
		const newSenderHistory = query.keys.map(({ name }) => name.split(":")[1]).filter(Boolean) as string[];
		senderHistory.push(...newSenderHistory);
		const newTextHistory = (
			await Promise.all(
				query.keys.map(async ({ name }) => {
					const lastNameChunk = last(name.split(":"));
					if (!lastNameChunk) return false;
					return (await messages.get(lastNameChunk))?.text;
				}),
			)
		).filter(Boolean) as string[];
		textHistory.push(...newTextHistory);
		if (senderHistory.length > 60 || textHistory.length > 60) return true;
		violationCount += newTextHistory.filter((v) => compareTwoStrings(text, v) > 0.9).length;
		if (violationCount > 3) return true;
	} while (!query.list_complete);
	return false;
};
