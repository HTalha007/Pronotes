/**
 * Nominal ("branded") typing helper so that e.g. a `NoteId` can never be
 * passed where a `UserId` is expected, even though both are strings.
 */
export type Brand<T, B extends string> = T & { readonly __brand: B };
