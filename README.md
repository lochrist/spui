# SPUI - SimPle UI

UI library using an hyperscript syntax that help creates HTML Elements and automatically update the DOM when a data model changes. SPUI is fully DOM based (NOT vdom). 

### Buzzwords and hype galore

SPUI is simple to use. It is small (about 500 LOC). It is blazing fast. And it is yet another UI framework. This is my rite of passage as a web developer.

## Introduction

The goal of SPUI is to make it easy to create web application without relying on an external templating library (mustache), nor compiler (jsx). All code is pure Javascript and rely directly on the Document Object Model (DOM). This is not a VirtualDom library. I found that working closely with the DOM without having an intermediary abstraction like a VDOM helps get things done more quickly. 

SPUI comes with a Stream module that makes it easy to define one/two way data bindings that will update the DOM automatically when model values are changed.

The SPUI streams enable that kind of workflow:

```javascript
// Label that updates automatically when a user types in an input field.
const model = valueStream('this is my initial value');
h('div', {}, [
    h('input', { value: model, oninput: selectTargetAttr('value', model) }),
    h('label', {}, model)
]);
```

## Features
- 

## Getting Started

mini todo mvc

## More Examples

## API


// DOM
// export declare function h(tagName: string, attrs?: Attrs, children?: Children): HTMLElement;
// export declare function selectTargetAttr(eventAttrName: string, functor: s.Stream | Functor1P): (event: any) => any;
// export declare function select(condition: any, ifTrue: Child, ifFalse?: Child): any;

// Stream
// GetterSetter
export declare function valueStream(initialValue?: any, transform?: Functor1P): Stream;
export declare function addListener(stream: Stream, listener: Functor1P): Functor0P;
export declare function removeListener(valueStream: Stream, listener: Functor1P): Stream;
export declare function addTransform(valueStream: Stream, transform: Functor1P): void;
export declare function map(vs: Stream, transform: Functor1P): Stream;
export declare function compute(functor: Functor0P, transform?: Functor1P): Computation;
export declare function computeStream(functor: Functor0P, transform?: Functor1P): Stream;
export declare function eventStream(source: EventTarget | string, name: string, useCapture?: any): Stream;


// ObservableArray
applyChanges
addListener
removeListener
export declare type ArrayListener = (op: string, args: any[], opReturnValue: any) => void;

Filter:
src: ObservableArray<T>;
filtered: ObservableArray<T>;
applyFilter

