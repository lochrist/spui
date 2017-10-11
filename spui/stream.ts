import {isFunction, remove} from './utils';

type Computation = () => any;
type ValueChangePropagation = (value) => any;

export interface Stream {
    (value?): any;
    _backingValue: any;
    _listeners?: Array<ValueChangePropagation>;
    _derive?: ValueChangePropagation;
}

export interface StreamOptions {
    transform?: ValueChangePropagation;
    derive?: ValueChangePropagation;
}

let runningComputations: Array<Stream> = [];

function setValueStream(stream, value) {
    stream._backingValue = stream._derive ? stream._derive(value) : value;
    if (stream._listeners && stream._listeners.length) {
        const dependencies = stream._listeners.slice();
        for (const dep of dependencies) {
            dep(stream._backingValue);
        }
    }
}

export function createValueStream(initialValue?, derive?: ValueChangePropagation) {
    let stream = function (value?) {
        if (arguments.length) {
            setValueStream(stream, value);
        } else {
            // Check to create a new computation dependency:
            if (runningComputations.length) {
                addListener(stream, runningComputations[runningComputations.length - 1]);
            }
        }
        
        return stream._backingValue;
    } as Stream;

    if (derive) {
        stream._derive = derive;
    }
    if (initialValue !== undefined) {
        setValueStream(stream, initialValue);
    }
    return stream;
}

export function addListener(stream: Stream, listener: ValueChangePropagation) {
    if (!stream._listeners) {
        stream._listeners = [];
    }
    if (stream._listeners.indexOf(listener) === -1) {
        stream._listeners.push(listener);
    }
    
    return () => removeListener(stream, listener);
}

export function removeListener(valueStream: Stream, listener: ValueChangePropagation) {
    remove(valueStream._listeners, listener);
    return valueStream;
}

export function map(valueStream: Stream, transform: ValueChangePropagation) {
    const computedStream = createValueStream(valueStream(), transform);
    addListener(valueStream, computedStream);
    return computedStream;
}

export function computeStream(computation: Computation) {
    const computedStream = createValueStream();
    computedStream(compute());
    computedStream._derive = compute;
    return computedStream;

    function compute() {
        runningComputations.push(computedStream);
        let result, error;
        try {
            result = computation();
        }
        catch (e) {
            error = e;
        }
        runningComputations.pop();

        if (error) throw error;
        return result;
    }
}

export function createEventStream(source: EventTarget | string, name: string, useCapture?) {
    const eventStream = createValueStream();
    const element = source instanceof EventTarget ? source : document.querySelector(source);
    element.addEventListener(name, eventStream, !!useCapture);
    return eventStream;
}