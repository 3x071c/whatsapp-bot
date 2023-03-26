declare type Environment = {
	[K: string]: unknown;
	POSTHOG_TOKEN?: string;
	MAYTAPI_PRODUCT?: string;
	MAYTAPI_PHONE?: string;
	MAYTAPI_TOKEN?: string;
	dev: boolean;
	MESSAGES?: KVNamespace;
};
