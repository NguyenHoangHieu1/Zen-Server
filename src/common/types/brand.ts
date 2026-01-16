declare const brand: unique symbol;

export type Brand<TType, TBrand> = TType & { [brand]: TBrand };
