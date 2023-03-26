/**
 * Like Object.values, but with actually useful typings
 * UPDATE: Seems like Object.values typings were fixed, this just returns now
 * @param obj The object to get the values from
 * @returns The constructed values array from the given object
 */
export const values = <O extends Record<string, T>, T>(obj: O): T[] => {
	return Object.values(obj);
};
