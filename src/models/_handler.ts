/* eslint-disable no-underscore-dangle -- Private APIs */
import type { DateType } from "./_shared";
import type { z } from "zod";
import { omit } from "lodash";
import { parse as jsonParse, serialize, stringify as jsonStringify } from "superjson";
import { entries, getByteLength, keys, truncateByteLength } from "$/lib";
import { UUID } from "./_shared";

type Reserved = {
	readonly uuid: UUID;
	readonly createdAt: DateType;
	readonly modifiedAt: DateType;
};

export const handler =
	<
		R extends Record<string, unknown> & Reserved,
		S extends { [K in keyof R]: z.ZodType<R[K]> },
		M extends z.ZodObject<S>,
	>(
		model: M,
		binding: string,
	) =>
	(env: Record<string, unknown>) => {
		const ctx = env[binding] as KVNamespace | string | undefined;
		if (!ctx || typeof ctx === "string") throw new Error(`[_handler] Couldn't find KV namespace ${binding}`);

		return {
			_constructKey(field: keyof R, value?: string, uuid?: R["uuid"]): string {
				const keyField = truncateByteLength(String(field), 474); // 512 max length - 2 colons - uuid length
				const keyValue = truncateByteLength(
					(serialize({ value }).json as { value: string | null }).value?.split(":")[0] ?? "",
					474 - getByteLength(keyField),
				);
				if (!uuid) return `${keyField}:${keyValue}`;
				return `${keyField}:${keyValue}:${uuid}`;
			},
			_validateField(_field: keyof R): string {
				const field = String(_field);
				if (!keys(model.shape).includes(field)) throw new Error(`[_handler] invalid field access (${field})`);
				return field;
			},
			_validateModel(_model: R): R {
				return model.parse(_model) as unknown as R; // ! todo: fix the weird generics situation
			},
			_validateValue<T extends keyof R>(field: T, value?: R[T]): R[T] {
				return model.shape[field].parse(value) as R[T]; // ! todo: fix the weird generics situation
			},
			async create(_data: Omit<R, keyof Reserved>, options?: KVNamespacePutOptions): Promise<R> {
				const uuid = this._validateValue("uuid", crypto.randomUUID());
				const data = this._validateModel({
					..._data,
					createdAt: new Date(),
					modifiedAt: new Date(),
					uuid,
				} as R); // ! todo: fix the weird generics situation

				await ctx.put(this._constructKey("uuid", uuid, uuid), jsonStringify(data), options);
				await Promise.all(
					entries(omit(data, "uuid")).map(([field, value]) => {
						const key = this._constructKey(
							this._validateField(field),
							this._validateValue(field, value) as string,
							uuid,
						);
						return ctx.put(key, uuid, options);
					}),
				);

				return data;
			},
			async delete(_uuid: R["uuid"]): Promise<void> {
				const uuid = this._validateValue("uuid", _uuid);
				return ctx.delete(this._constructKey("uuid", uuid, uuid));
			},
			async get(_uuid: R["uuid"], options?: KVNamespaceGetOptions<"text">): Promise<R | null> {
				const uuid = this._validateValue("uuid", _uuid);
				const query = await ctx.get(this._constructKey("uuid", uuid, uuid), options);
				if (!query) return null;
				return this._validateModel(jsonParse(query));
			},
			async update(
				{ uuid: _uuid, ..._data }: Partial<Omit<R, keyof Reserved>> & { uuid: R["uuid"] },
				options?: KVNamespacePutOptions,
			) {
				const uuid = this._validateValue("uuid", _uuid);
				const query = await this.get(uuid);
				if (!query) throw new Error(`[_handler] uuid likely doesn't exist (${uuid})`);

				const data = this._validateModel({
					...query,
					..._data,
					createdAt: query.createdAt,
					modifiedAt: new Date(),
					uuid,
				});

				await ctx.put(this._constructKey("uuid", uuid, uuid), jsonStringify(data), options);
				await Promise.all(
					entries(omit(data, "uuid")).map(
						([field, value]) =>
							ctx.put(
								this._constructKey(
									this._validateField(field),
									this._validateValue(field, value) as string,
									uuid,
								),
								uuid,
							),
						options,
					),
				);

				return data;
			},
			async uuids(field: keyof R, options?: KVNamespaceListOptions) {
				const prefix = this._constructKey(this._validateField(field), options?.prefix ?? undefined);

				return ctx.list({
					...options,
					prefix,
				});
			},
		};
	};

/*
 * KV schema:
 * `uuid:<uuid>:<uuid>` -> superjson-encoded data
 * `<field>:<value>:<uuid>` -> `<uuid>`
 */
