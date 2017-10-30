import { isFunction, remove, Functor0P, Functor1P} from './utils';
export interface GetterSetter {
    (value?): any;
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

let runningComputations: Array<Computation> = [];

function setValue(stream, value) {
    stream._backingValue = stream._transform ? stream._transform(value) : value;
    if (stream._listeners.length) {
        const dependencies = stream._listeners.slice();
        for (let i = 0; i < dependencies.length; ++i) {
            dependencies[i](stream._backingValue);
        }
    }
}

export function valueStream(initialValue?, transform?: Functor1P) : Stream {
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

    stream._listeners = [];
    if (transform) {
        stream._transform = transform;
    }
    if (initialValue !== undefined) {
        setValue(stream, initialValue);
    }

    return stream;
}

export function addListener(stream: Stream, listener: Functor1P) : Functor0P {
    if (stream._listeners.indexOf(listener) === -1) {
        stream._listeners.push(listener);
    }
    return () => removeListener(stream, listener);
}

export function removeListener(valueStream: Stream, listener: Functor1P) : Stream {
    remove(valueStream._listeners, listener);
    return valueStream;
}

export function addTransform(valueStream: Stream, transform: Functor1P) {
    if (valueStream._transform) {
        const firstTransform = valueStream._transform;
        valueStream._transform = value => transform(firstTransform(value));
    } else {
        valueStream._transform = transform;
    }
}

export function map(vs: Stream, transform: Functor1P) : Stream {
    const computedStream = valueStream(vs(), transform);
    addListener(vs, computedStream);
    return computedStream;
}

function createComputation() : Computation {
    return {
        computedStream: valueStream(),
        dependencies: []
    };
}

export function compute(functor: Functor0P, transform?: Functor1P) : Computation {
    const computation = createComputation();
    computation.computedStream(_compute());
    addTransform(computation.computedStream, _compute);
    if (transform) {
        addTransform(computation.computedStream, transform);
    }    
    return computation;

    function _compute() {
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

export function computeStream(functor: Functor0P, transform?: Functor1P): Stream {
    return compute(functor, transform).computedStream;
}

export function eventStream(source: EventTarget | string, name: string, useCapture?) {
    const eventStream = valueStream();
    const element = source instanceof EventTarget ? source : document.querySelector(source);
    element.addEventListener(name, eventStream, !!useCapture);
    return eventStream;
}