import React from 'react';
interface MyStore {
    user: {
        name: string;
    };
    cart: {
        quantity?: number;
        items?: string[];
    };
}
export declare const Context: React.Context<import(".").StoreMethods<MyStore>>, useGlobalState: <Prop extends "cart" | "user">(propToSelect: Prop) => MyStore[Prop], useStore: () => import(".").StoreMethods<MyStore>;
export {};
