export declare function model(nameSpace: any, modelObj: any, initState: any): {};
export declare function combineModels(models: any, rootSelector?: (s: any) => any): {
    reducer: (state: {}, action: any) => {};
    saga: () => Generator<import("redux-saga/effects").AllEffect<unknown>, void, unknown>;
};
