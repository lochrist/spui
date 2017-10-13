import {isFunction, remove} from './utils';

type Functor = () => any;
type Transform = (value) => any;
export interface GetterSetter {
    (value?): any;
}
export interface Stream extends GetterSetter {
    _backingValue: any;
    _listeners?: Array<Transform>;
    _transform?: Transform;
}
export interface Computation {
    computedStream: Stream;
    dependencies: Stream[];
}

let runningComputations: Array<Computation> = [];

function setValue(stream, value) {
    stream._backingValue = stream._transform ? stream._transform(value) : value;
    if (stream._listeners && stream._listeners.length) {
        const dependencies = stream._listeners.slice();
        for (const dep of dependencies) {
            dep(stream._backingValue);
        }
    }
}

export function createValueStream(initialValue?, transform?: Transform) : Stream {
    let stream = function (value?) {
        if (arguments.length) {
            setValue(stream, value);
        } else {
            // Check to create a new computation dependency:
            if (runningComputations.length) {
                const computation = runningComputations[runningComputations.length - 1];
                addListener(stream, computation.computedStream);
                computation.dependencies.push(stream);
            }
        }
        
        return stream._backingValue;
    } as Stream;

    if (transform) {
        stream._transform = transform;
    }
    if (initialValue !== undefined) {
        setValue(stream, initialValue);
    }
    return stream;
}

export function addListener(stream: Stream, listener: Transform) : Functor {
    if (!stream._listeners) {
        stream._listeners = [];
    }
    if (stream._listeners.indexOf(listener) === -1) {
        stream._listeners.push(listener);
    }
    return () => removeListener(stream, listener);
}

export function removeListener(valueStream: Stream, listener: Transform) : Stream {
    if (valueStream._listeners && valueStream._listeners.length) {
        remove(valueStream._listeners, listener);
    }
    return valueStream;
}

export function addTransform(valueStream: Stream, transform: Transform) {
    if (valueStream._transform) {
        const firstTransform = valueStream._transform;
        valueStream._transform = value => transform(firstTransform(value));
    } else {
        valueStream._transform = transform;
    }
}

export function map(valueStream: Stream, transform: Transform) : Stream {
    const computedStream = createValueStream(valueStream(), transform);
    addListener(valueStream, computedStream);
    return computedStream;
}

function createComputation() : Computation {
    return {
        computedStream: createValueStream(),
        dependencies: []
    };
}

export function computeStream(functor: Functor, transform?: Transform) : Computation {
    const computation = createComputation();
    computation.computedStream(compute());
    addTransform(computation.computedStream, compute);
    if (transform) {
        addTransform(computation.computedStream, transform);
    }    
    return computation;

    function compute() {
        runningComputations.push(computation);
        let result, error;
        try {
            result = functor();
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