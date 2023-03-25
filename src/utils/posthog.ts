// import { PostHog } from "posthog-node";
import { log } from ".";

const mock = {
	capture: (...args: unknown[]) => {
		log("🦔 captured", ...args);
	},
};

// export const getPosthog = (dev: boolean, token?: string): Pick<PostHog, "capture"> => {
// if (token) {
// 	const posthog = new PostHog(token, { host: "https://eu.posthog.com" });
// 	if (dev) posthog.optOut();
// 	return posthog;
// }
export const getPosthog = () => {
	return mock;
};
