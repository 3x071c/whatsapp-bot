/* eslint-disable @typescript-eslint/no-redeclare -- Make Zod typings usable */
import { z } from "zod";

export const UUID = z
	.string({
		description: "128-bit unique identifier",
		invalid_type_error: "UUID must be a string",
		required_error: "UUID is required",
	})
	.uuid({ message: "must be a valid UUID" });
export type UUID = z.infer<typeof UUID>;

export const DateType = z.date({
	description: "Date",
	invalid_type_error: "Date must be valid",
	required_error: "Date is required",
});
export type DateType = z.infer<typeof DateType>;
