export interface StringKeyMap<T> {
    [key: string]: T;
}
export declare type Functor0P = () => any;
export declare type Functor1P = (value: any) => any;
export declare function isFunction(obj: any): obj is Function;
export declare function isNode(obj: any): obj is Node;
export declare function isObject(obj: any): obj is Object;
export declare function isString(obj: any): obj is string;
export declare function expandValue(value: any): any;
export declare function remove(array: Array<any>, value: any): any[];
