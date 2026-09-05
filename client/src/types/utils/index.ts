export type Brand<T, B extends string> = T & { readonly __brand: B };

export type RequiredFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type NonNull<T> = T extends null | undefined ? never : T;

export type ValueOf<T> = T extends readonly (infer U)[] ? U : never;

export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

export type XOR<T, U> = T | U extends object
  ? (T & { [K in Exclude<keyof U, keyof T>]?: never }) | (U & { [K in Exclude<keyof T, keyof U>]?: never })
  : T | U;
