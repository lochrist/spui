export declare type Changes = Array<Array<any>>;
export declare type ArrayListener = (op: string, args: any[], opReturnValue: any) => void;
export declare class ObservableArray<T> {
    array: T[];
    listeners: ArrayListener[];
    changes: Changes;
    constructor(array?: T[]);
    readonly length: number;
    push(...args: any[]): any;
    pop(...args: any[]): any;
    reverse(...args: any[]): any;
    shift(...args: any[]): any;
    splice(...args: any[]): any;
    sort(...args: any[]): any;
    unshift(...args: any[]): any;
    remove(value: T): void;
    applyChanges(changeFunctor: () => any): any;
    addListener(callback: ArrayListener): () => any[];
    removeListener(callback: ArrayListener): any[];
    logChange(method: any, returnValue: any, args: any): void;
    emit(op: string, args: any[], opReturnValue?: any): void;
}
export declare type FilterPredicate<T> = (value: T) => any;
export declare class Filter<T> {
    src: ObservableArray<T>;
    filtered: ObservableArray<T>;
    predicate: FilterPredicate<T>;
    constructor(src: ObservableArray<T>, predicate: FilterPredicate<T>);
    applyFilter(predicate?: FilterPredicate<T>, reset?: boolean): Changes;
    private srcChanged(op, args, opReturnValue?);
}
