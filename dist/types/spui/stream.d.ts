import { Functor0P, Functor1P } from './utils';
export interface GetterSetter {
    (value?: any): any;
}
export interface Stream extends GetterSetter {
    _backingValue: any;
    _listeners?: Array<Functor1P>;
    _transform?: Functor1P;
}
export interface Computation {
    computedStream: Stream;
    dependencies: Stream[];
}
export declare function valueStream(initialValue?: any, transform?: Functor1P): Stream;
export declare function addListener(stream: Stream, listener: Functor1P): Functor0P;
export declare function removeListener(valueStream: Stream, listener: Functor1P): void;
export declare function addTransform(valueStream: Stream, transform: Functor1P): void;
export declare function map(vs: Stream, transform: Functor1P): Stream;
export declare function compute(functor: Functor0P): Computation;
export declare function computeStream(functor: Functor0P): Stream;
export declare function eventStream(source: EventTarget | string, name: string, useCapture?: any): Stream;
