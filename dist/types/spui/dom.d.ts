import { StringKeyMap, Functor1P } from './utils';
import * as s from './stream';
import { ObservableArray } from './observable-array';
export declare type Attrs = StringKeyMap<any>;
export declare type ElementGenerator = () => HTMLElement;
export declare type StringGenerator = () => string;
export declare type Child = string | HTMLElement | ElementGenerator | StringGenerator;
export declare type Children = Array<Child> | Child;
export declare type ModelElementCreator = (listRootElement: HTMLElement, model: any, indeX: number) => HTMLElement;
export declare function h(tagName: string, attrs?: Attrs, children?: Children): HTMLElement;
export declare class ElementListMapper {
    modelsObs: ObservableArray<any>;
    listRootElement: HTMLElement;
    elementCreator: ModelElementCreator;
    key: string;
    modelToElement: Map<any, HTMLElement>;
    constructor(listRootElement: HTMLElement, modelsObs: ObservableArray<any>, elementCreator: ModelElementCreator, key?: string);
    onModelChange(op: string, args: any[]): void;
    createElements(models: Array<any>, startIndex: number): DocumentFragment | HTMLElement;
    createElement(model: any, index: number): HTMLElement;
}
export declare function elementList(tagName: string, attrs: Attrs, models: ObservableArray<any>, nodeCreator: ModelElementCreator, key?: string): HTMLElement;
export declare function isElementList(nodeListElement: HTMLElement): boolean;
export declare function getElementList(nodeListElement: HTMLElement): ElementListMapper;
export declare function targetAttr(eventAttrName: string, functor: s.Stream | Functor1P): (event: any) => any;
