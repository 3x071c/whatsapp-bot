export const getByteLength = (text: string) => new TextEncoder().encode(text).length;

export const truncateByteLength = (text: string, length: number) =>
	new TextDecoder().decode(new TextEncoder().encode(text).slice(0, length)).replace(/\uFFFD/g, "");
