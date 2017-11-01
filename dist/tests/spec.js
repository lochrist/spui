(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

function isFunction(obj) {
    return typeof obj === 'function';
}
function isNode(obj) {
    return obj.nodeType;
}
function isObject(obj) {
    return typeof obj === 'object';
}
function isString(obj) {
    return typeof obj === 'string';
}
function expandValue(value) {
    return isFunction(value) ? value() : value;
}
function remove(array, value) {
    const i = array.indexOf(value);
    if (i !== -1) {
        array.splice(i, 1);
    }
    return array;
}
//# sourceMappingURL=utils.js.map

let runningComputations = [];
function setValue(stream, value) {
    stream._backingValue = stream._transform ? stream._transform(value) : value;
    if (stream._listeners.length) {
        const dependencies = stream._listeners.slice();
        for (let i = 0; i < dependencies.length; ++i) {
            dependencies[i](stream._backingValue);
        }
    }
}
function valueStream(initialValue, transform) {
    let stream = function (value) {
        if (arguments.length) {
            setValue(stream, value);
        }
        else {
            // Check to create a new computation dependency:
            if (runningComputations.length) {
                const computation = runningComputations[runningComputations.length - 1];
                addListener(stream, computation.computedStream);
                computation.dependencies.push(stream);
            }
        }
        return stream._backingValue;
    };
    stream._listeners = [];
    if (transform) {
        stream._transform = transform;
    }
    if (initialValue !== undefined) {
        setValue(stream, initialValue);
    }
    return stream;
}
function addListener(stream, listener) {
    if (stream._listeners.indexOf(listener) === -1) {
        stream._listeners.push(listener);
    }
    return () => removeListener(stream, listener);
}
function removeListener(valueStream, listener) {
    remove(valueStream._listeners, listener);
}
function addTransform(valueStream, transform) {
    if (valueStream._transform) {
        const firstTransform = valueStream._transform;
        valueStream._transform = value => transform(firstTransform(value));
    }
    else {
        valueStream._transform = transform;
    }
}
function map(vs, transform) {
    const computedStream = valueStream(vs(), transform);
    addListener(vs, computedStream);
    return computedStream;
}
function createComputation() {
    return {
        computedStream: valueStream(),
        dependencies: []
    };
}
function compute(functor) {
    const computation = createComputation();
    computation.computedStream(_compute());
    addTransform(computation.computedStream, _compute);
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
        if (error)
            throw error;
        return result;
    }
}

function h$1(tagName, attrs, children) {
    const element = document.createElement(tagName);
    if (attrs) {
        setAttrs(element, attrs);
    }
    if (children) {
        setChildren(element, children);
    }
    return element;
}
function setAttrs(element, attr) {
    // For each attr, setup a computation. When that computation is triggered, we patch this argument:
    for (const attrName in attr) {
        const attrValue = attr[attrName];
        // Event registration handling.
        if (attrName.startsWith('on')) {
            const eventName = attrName.slice(2);
            element.addEventListener(eventName, attrValue);
            continue;
        }
        // If attrValue is an object (for classes and styles)
        // or if attrValue is a function: setup a computation
        if (isFunction(attrValue) || isObject(attrValue)) {
            // For all attributes resulting from a computation setup auto update:
            const computation = compute(() => {
                setAttr(element, attrName, attrValue);
            });
            // Check if the attrValue function has actually registered a dependency:
            if (computation.dependencies.length) {
                addTransform(computation.computedStream, () => {
                    setAttr(element, attrName, attrValue);
                });
            }
            continue;
        }
        // Handle static attributes:
        setAttr(element, attrName, attrValue);
    }
}
function setAttr(element, attr, value) {
    value = expandValue(value);
    switch (attr) {
        case 'class':
        case 'className':
            setClass(element, value);
            break;
        case 'style':
            setStyle(element, value);
            break;
        default:
            if (attr in element) {
                element[attr] = value;
            }
            else if (value === false) {
                element.removeAttribute(attr);
            }
            else if (value === true) {
                // If value is a boolean, set it to "" to only enable it in DOM.
                element.setAttribute(attr, "");
            }
            else {
                element.setAttribute(attr, value);
            }
    }
}
function setClass(element, className) {
    if (isString(className)) {
        element.className = className;
    }
    else {
        let newClass = '';
        for (const key in className) {
            let value = className[key];
            value = expandValue(value);
            if (value) {
                newClass += (newClass == '' ? '' : ' ') + key;
            }
        }
        element.className = newClass;
    }
}
function setStyle(element, style, value) {
    if (isString(style)) {
        element.setAttribute('style', style);
    }
    else {
        for (const key in style) {
            const styleValue = expandValue(style[key]);
            element.style[key] = styleValue;
        }
    }
}
function setChildren(element, children) {
    if (Array.isArray(children)) {
        for (let i = 0; i < children.length; ++i) {
            appendChild(element, children[i]);
        }
    }
    else {
        appendChild(element, children);
    }
}
function appendChild(element, child) {
    if (!child)
        return;
    if (isFunction(child)) {
        let resolvedChild;
        const computation = compute(() => {
            resolvedChild = child();
        });
        let childNode = isNode(resolvedChild) ? resolvedChild : document.createTextNode(resolvedChild);
        element.appendChild(childNode);
        if (computation.dependencies.length) {
            // Auto update in case children is a stream
            addTransform(computation.computedStream, () => {
                const oldChildNode = childNode;
                childNode = isNode(resolvedChild) ? resolvedChild : document.createTextNode(resolvedChild);
                element.replaceChild(childNode, oldChildNode);
            });
        }
    }
    else if (isNode(child)) {
        element.appendChild(child);
    }
    else {
        element.appendChild(document.createTextNode(child));
    }
}
class ElementListMapper {
    constructor(listRootElement, modelsObs, elementCreator, key) {
        this.listRootElement = listRootElement;
        this.modelsObs = modelsObs;
        this.elementCreator = elementCreator;
        // TODO: What to do with key?
        this.key = key;
        this.modelToElement = new Map();
        modelsObs.addListener(this.onModelChange.bind(this));
        if (this.modelsObs.length) {
            const nodes = this.createElements(this.modelsObs.array, 0);
            this.listRootElement.appendChild(nodes);
        }
    }
    onModelChange(op, args) {
        switch (op) {
            case 'pop':
                this.listRootElement.removeChild(this.listRootElement.lastChild);
                break;
            case 'push': {
                const nodes = this.createElements(args, this.modelsObs.length - args.length);
                this.listRootElement.appendChild(nodes);
                break;
            }
            case 'reverse':
                {
                    const frag = new DocumentFragment();
                    while (this.listRootElement.lastChild) {
                        frag.appendChild(this.listRootElement.removeChild(this.listRootElement.lastChild));
                    }
                    this.listRootElement.appendChild(frag);
                    break;
                }
                ;
            case 'splice':
                const childNodes = this.listRootElement.childNodes;
                const spliceStart = args[0] < 0 ? childNodes.length + args[0] : args[0];
                const deleteCount = args.length > 1 ? args[1] : childNodes.length - spliceStart;
                const deleteStop = spliceStart + deleteCount;
                // TODO: have a more flexible splice that doesn't ALWAYS create a toRemove array
                // or keep the list of ordered nodes on the side?
                const toRemove = [];
                for (let i = spliceStart; i < deleteStop; i++) {
                    toRemove.push(childNodes[i]);
                }
                for (let i = 0; i < toRemove.length; ++i) {
                    this.listRootElement.removeChild(toRemove[i]);
                }
                if (args.length > 2) {
                    const nodes = this.createElements(args.slice(2), spliceStart);
                    this.listRootElement.insertBefore(nodes, childNodes[spliceStart]);
                }
                break;
            case 'shift':
                this.listRootElement.removeChild(this.listRootElement.firstChild);
                break;
            case 'sort': {
                const frag = new DocumentFragment();
                for (let i = 0; i < this.modelsObs.length; ++i) {
                    const node = this.modelToElement.get(this.modelsObs.array[i]);
                    this.listRootElement.removeChild(node);
                    frag.appendChild(node);
                }
                this.listRootElement.appendChild(frag);
                break;
            }
            case 'unshift': {
                const nodes = this.createElements(args, 0);
                this.listRootElement.insertBefore(nodes, this.listRootElement.firstChild);
                break;
            }
            case 'changes': {
                const changes = args;
                for (let i = 0; i < changes.length; ++i) {
                    this.onModelChange(changes[i][0], changes[i][1]);
                }
                break;
            }
        }
    }
    createElements(models, startIndex) {
        if (models.length > 1) {
            const frag = new DocumentFragment();
            for (let i = 0; i < models.length; ++i) {
                const childNode = this.createElement(models[i], startIndex++);
                frag.appendChild(childNode);
            }
            return frag;
        }
        return this.createElement(models[0], startIndex);
    }
    createElement(model, index) {
        const childNode = this.elementCreator(this.listRootElement, model, index);
        this.modelToElement.set(model, childNode);
        return childNode;
    }
}
function elementList(tagName, attrs, models, nodeCreator, key) {
    const listRootElement = h$1(tagName, attrs);
    parent._elementList = new ElementListMapper(listRootElement, models, nodeCreator, key);
    return listRootElement;
}



//# sourceMappingURL=dom.js.map

class ObservableArray {
    constructor(array) {
        this.array = array || [];
        this.listeners = [];
        this.changes = null;
    }
    get length() {
        return this.array.length;
    }
    push(...args) {
        const retValue = this.array.push.apply(this.array, args);
        this.logChange('push', retValue, args);
        return retValue;
    }
    pop(...args) {
        const retValue = this.array.pop.apply(this.array, args);
        this.logChange('pop', retValue, args);
        return retValue;
    }
    reverse(...args) {
        const retValue = this.array.reverse.apply(this.array, args);
        this.logChange('reverse', retValue, args);
        return retValue;
    }
    shift(...args) {
        const retValue = this.array.shift.apply(this.array, args);
        this.logChange('shift', retValue, args);
        return retValue;
    }
    splice(...args) {
        const retValue = this.array.splice.apply(this.array, args);
        this.logChange('splice', retValue, args);
        return retValue;
    }
    sort(...args) {
        const retValue = this.array.sort.apply(this.array, args);
        this.logChange('sort', retValue, args);
        return retValue;
    }
    unshift(...args) {
        const retValue = this.array.unshift.apply(this.array, args);
        this.logChange('unshift', retValue, args);
        return retValue;
    }
    remove(value) {
        const index = this.array.indexOf(value);
        this.splice(index, 1);
    }
    applyChanges(changeFunctor) {
        this.changes = [];
        let result;
        try {
            result = changeFunctor();
        }
        catch (e) {
            this.changes = null;
            throw e;
        }
        if (this.changes) {
            console.log('emit changes: ', this.changes.length);
            this.emit('changes', this.changes);
        }
        this.changes = null;
        return result;
    }
    addListener(callback) {
        this.listeners.push(callback);
        return () => this.removeListener(callback);
    }
    removeListener(callback) {
        return remove(this.listeners, callback);
    }
    logChange(method, returnValue, args) {
        if (this.changes === null) {
            this.emit(method, args, returnValue);
        }
        else {
            this.changes.push([method, args, returnValue]);
        }
    }
    emit(op, args, opReturnValue) {
        for (let i = 0; i < this.listeners.length; ++i) {
            this.listeners[i](op, args, opReturnValue);
        }
    }
}
class Filter {
    constructor(src, predicate) {
        this.src = src;
        this.filtered = new ObservableArray();
        this.predicate = predicate;
        const srcFiltered = this.src.array.filter(this.predicate);
        this.filtered.push(...srcFiltered);
        this.src.addListener(this.srcChanged.bind(this));
    }
    applyFilter(predicate = null, reset = false) {
        if (predicate) {
            this.predicate = predicate;
        }
        const changes = this.filtered.applyChanges(() => {
            if (reset) {
                // Reset filter completely:
                this.filtered.splice(0);
                const filteredValues = this.src.array.filter(this.predicate);
                if (filteredValues.length) {
                    this.filtered.push(...filteredValues);
                }
                return this.filtered.changes;
            }
            console.time('applyFilter');
            // Apply only differences between 2 filter run:
            let filterIndex = 0;
            for (let srcIndex = 0; srcIndex < this.src.length; ++srcIndex) {
                const srcValue = this.src.array[srcIndex];
                if (this.predicate(srcValue)) {
                    if (filterIndex < this.filtered.length) {
                        if (this.filtered.array[filterIndex] !== srcValue) {
                            this.filtered.splice(filterIndex, 0, srcValue);
                        }
                    }
                    else {
                        this.filtered.splice(filterIndex, 0, srcValue);
                    }
                    ++filterIndex;
                }
                else {
                    if (filterIndex < this.filtered.length) {
                        if (this.filtered.array[filterIndex] === srcValue) {
                            this.filtered.splice(filterIndex, 1);
                        }
                    }
                }
            }
            // All the others elements are not needed anymore.
            if (filterIndex < this.filtered.length) {
                this.filtered.splice(filterIndex);
            }
            console.timeEnd('applyFilter');
            console.log('remaing: ', this.filtered.length);
            console.time('apply - dom changes');
            return this.filtered.changes;
        });
        console.timeEnd('apply - dom changes');
        return changes;
    }
    srcChanged(op, args, opReturnValue) {
        switch (op) {
            case 'pop':
                if (this.filtered.length && this.filtered.array[this.filtered.length - 1] === opReturnValue) {
                    this.filtered.pop();
                }
                break;
            case 'push': {
                const filterPushedData = args.filter(this.predicate);
                if (filterPushedData.length) {
                    this.filtered.push(...filterPushedData);
                }
                break;
            }
            case 'reverse':
                {
                    if (this.filtered.length) {
                        this.filtered.reverse();
                    }
                    break;
                }
                ;
            case 'splice':
                const elementsToRemove = opReturnValue;
                const filteredElementsToRemove = elementsToRemove.filter(this.predicate);
                let filteredElementsAdded;
                if (args.length > 2) {
                    const elementsAdded = args.slice(2);
                    filteredElementsAdded = elementsAdded.filter(this.predicate);
                }
                const srcSpliceStart = args[0] < 0 ?
                    args[0] + this.src.length + elementsToRemove.length - (args.length > 2 ? args.length - 2 : 0) :
                    args[0];
                // Find the insertion point from the start in case not all elements are unique.
                let filteredSpliceStart = 0;
                for (let i = 0; i < srcSpliceStart; ++i) {
                    if (this.predicate(this.src.array[i])) {
                        ++filteredSpliceStart;
                    }
                }
                if (filteredElementsToRemove && filteredElementsToRemove.length) {
                    if (filteredElementsAdded && filteredElementsAdded.length) {
                        this.filtered.splice(filteredSpliceStart, filteredElementsToRemove.length, ...filteredElementsAdded);
                    }
                    else {
                        this.filtered.splice(filteredSpliceStart, filteredElementsToRemove.length);
                    }
                }
                else if (filteredElementsAdded && filteredElementsAdded.length) {
                    this.filtered.splice(filteredSpliceStart, 0, ...filteredElementsAdded);
                }
                break;
            case 'shift':
                if (this.filtered.length && this.filtered.array[0] === opReturnValue) {
                    this.filtered.shift();
                }
                break;
            case 'sort': {
                if (this.filtered.length) {
                    this.filtered.sort();
                }
                break;
            }
            case 'unshift': {
                const filterUnshiftedData = args.filter(this.predicate);
                if (filterUnshiftedData.length) {
                    this.filtered.unshift(...filterUnshiftedData);
                }
                break;
            }
            case 'changes': {
                const changes = args;
                for (let i = 0; i < changes.length; ++i) {
                    this.srcChanged.apply(this, changes[i]);
                }
                break;
            }
        }
    }
}
//# sourceMappingURL=observable-array.js.map

//# sourceMappingURL=index.js.map

const h = h$1;
function double(value) {
    return value * 2;
}
describe('stream', function () {
    describe('value stream', function () {
        it('create no param', function () {
            let stream = valueStream();
            expect(stream()).toBeUndefined();
        });
        it('create with value', function () {
            const value = 99;
            const stream = valueStream(value);
            expect(stream()).toEqual(value);
            expect(stream._backingValue).toEqual(value);
            expect(stream._transform).toBeUndefined();
        });
        it('create with transform', function () {
            const value = 12;
            const stream = valueStream(value, double);
            expect(stream()).toEqual(value * 2);
            expect(stream._transform).toEqual(double);
        });
        it('setter', function () {
            const stream = valueStream(12);
            const value = 99;
            stream(value);
            expect(stream()).toEqual(value);
        });
        it('add/remove listener', function () {
            const v = valueStream(12);
            let result;
            function assignResult(value) { result = value; }
            const off = addListener(v, assignResult);
            expect(isFunction(off)).toEqual(true);
            v(99);
            expect(v()).toEqual(result);
            expect(v._listeners).toBeDefined();
            expect(v._listeners.length).toEqual(1);
            expect(v._listeners.indexOf(assignResult)).toEqual(0);
            off();
            expect(v._listeners.length).toEqual(0);
            addListener(v, assignResult);
            expect(v._listeners.length).toEqual(1);
            removeListener(v, assignResult);
            expect(v._listeners.length).toEqual(0);
        });
        it('map', function () {
            const value = 12;
            const v = valueStream(value);
            const computed = map(v, double);
            expect(computed !== v).toEqual(true);
            expect(v._listeners).toContain(computed);
            expect(computed()).toEqual(value * 2);
            expect(computed._transform).toEqual(double);
        });
        it('computation', function () {
            const value1 = 12;
            const value2 = 99;
            const vs1 = valueStream(value1);
            const vs2 = valueStream(value2);
            const computation = compute(() => {
                return vs1() + vs2();
            });
            const computedStream = computation.computedStream;
            expect(computation.computedStream).toBeDefined();
            expect(computation.dependencies.length).toEqual(2);
            expect(vs1._listeners).toContain(computedStream);
            expect(vs2._listeners).toContain(computedStream);
            expect(computedStream()).toEqual(value1 + value2);
            vs1(0);
            expect(computedStream()).toEqual(value2);
            vs2(7);
            expect(computedStream()).toEqual(7);
            // Computed is effectively a read only computed value
            computedStream(12);
            expect(computedStream()).toEqual(7);
        });
    });
});
describe('filter', function () {
    function isEven(value) {
        return value % 2 === 0;
    }
    function all(value) {
        return true;
    }
    function none(value) {
        return false;
    }
    function isOdd(value) {
        return value % 2 === 1;
    }
    function divisibleBy3(value) {
        return value % 3 === 0;
    }
    function createThresholdPredicate(minValue, maxValue) {
        return function (value) {
            return value >= minValue && (maxValue === undefined || value <= maxValue);
        };
    }
    function createSrc(srcValues) {
        const src = new ObservableArray();
        src.push(...srcValues);
        return src;
    }
    function arrayEqual(a1, a2) {
        if (a1.length !== a2.length) {
            return false;
        }
        for (let i = 0; i < a1.length; ++i) {
            if (a1[i] !== a2[i]) {
                return false;
            }
        }
        return true;
    }
    function expectArrayObserverEqual(a1, a2) {
        expect(arrayEqual(a1.array, a2)).toEqual(true);
    }
    it('create filter', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new Filter(src, isEven);
        expect(filter.src).toEqual(src);
        expect(filter.predicate).toEqual(isEven);
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);
    });
    it('pop', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new Filter(src, isEven);
        src.pop();
        expectArrayObserverEqual(filter.filtered, [2, 4]);
        src.pop();
        expectArrayObserverEqual(filter.filtered, [2, 4]);
    });
    it('push', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new Filter(src, isEven);
        src.push(7, 8, 9, 10);
        expectArrayObserverEqual(filter.filtered, [2, 4, 6, 8, 10]);
    });
    it('reverse', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new Filter(src, isEven);
        src.reverse();
        expectArrayObserverEqual(filter.filtered, [6, 4, 2]);
    });
    it('shift', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new Filter(src, isEven);
        src.shift();
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);
        src.shift();
        expectArrayObserverEqual(filter.filtered, [4, 6]);
    });
    it('sort', function () {
        const src = createSrc([3, 2, 1, 6, 5, 4]);
        const filter = new Filter(src, isEven);
        expectArrayObserverEqual(filter.filtered, [2, 6, 4]);
        src.sort();
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);
    });
    it('splice 1', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new Filter(src, isEven);
        src.splice(3);
        expectArrayObserverEqual(filter.filtered, [2]);
    });
    it('splice 2', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new Filter(src, isEven);
        src.splice(3, 2);
        expectArrayObserverEqual(filter.filtered, [2, 6]);
    });
    it('splice 3', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new Filter(src, isEven);
        src.splice(-3, 2);
        expectArrayObserverEqual(filter.filtered, [2, 6]);
    });
    it('splice 4', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new Filter(src, isEven);
        src.splice(3, 0, 11, 22, 33, 44);
        expectArrayObserverEqual(filter.filtered, [2, 22, 44, 4, 6]);
    });
    it('splice 5', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new Filter(src, isEven);
        src.splice(-3, 1, 11, 22, 33, 44);
        expectArrayObserverEqual(filter.filtered, [2, 22, 44, 6]);
    });
    it('unshift', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new Filter(src, isEven);
        src.unshift();
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);
        src.unshift(11, 22, 33, 44);
        expectArrayObserverEqual(filter.filtered, [22, 44, 2, 4, 6]);
    });
    it('changes', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new Filter(src, isEven);
        src.applyChanges(() => {
            src.push(-1, -2, -3, -4);
            src.sort();
            src.reverse();
        });
        expectArrayObserverEqual(filter.filtered, [6, 4, 2, -4, -2]);
    });
    it('apply filter with predicate at construction', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new Filter(src, isEven);
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);
        let changes = filter.applyFilter();
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);
        expect(changes.length).toEqual(0);
    });
    it('apply filter 1', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new Filter(src, all);
        expectArrayObserverEqual(filter.filtered, [1, 2, 3, 4, 5, 6]);
        let changes = filter.applyFilter(isEven);
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);
        // Need to remove 1, 3, 5
        expect(changes.length).toEqual(3);
        changes = filter.applyFilter(isOdd);
        expectArrayObserverEqual(filter.filtered, [1, 3, 5]);
        // Add 1, remove 2, add 3, remove 4, add 5, remove 6
        expect(changes.length).toEqual(6);
    });
    it('apply filter 2', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new Filter(src, none);
        expectArrayObserverEqual(filter.filtered, []);
        let changes = filter.applyFilter(isEven);
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);
        // add 2, add, 4, add 6
        expect(changes.length).toEqual(3);
    });
    it('apply filter 3', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new Filter(src, all);
        let changes = filter.applyFilter(createThresholdPredicate(2));
        expectArrayObserverEqual(filter.filtered, [2, 3, 4, 5, 6]);
        // Remove 1
        expect(changes.length).toEqual(1);
        changes = filter.applyFilter(createThresholdPredicate(3));
        expectArrayObserverEqual(filter.filtered, [3, 4, 5, 6]);
        // Remove 2
        expect(changes.length).toEqual(1);
        changes = filter.applyFilter(createThresholdPredicate(1, 4));
        expectArrayObserverEqual(filter.filtered, [1, 2, 3, 4]);
        // Add 1, add 2, remove 5, remove 6
        expect(changes.length).toEqual(4);
    });
    it('apply filter 4', function () {
        // TODO: implement more flexible filter that bunches multi splice
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new Filter(src, all);
        let changes = filter.applyFilter(createThresholdPredicate(4));
        expectArrayObserverEqual(filter.filtered, [4, 5, 6]);
        // Remove 1, 2, 3
        expect(changes.length).toEqual(3);
        changes = filter.applyFilter(createThresholdPredicate(1, 3));
        expectArrayObserverEqual(filter.filtered, [1, 2, 3]);
        // add 1, 2, 3, remove 4, 5, 6
        expect(changes.length).toEqual(6);
    });
    it('apply filter reset', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new Filter(src, isEven);
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);
        let changes = filter.applyFilter(null, true);
        expect(changes.length).toEqual(2);
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);
        changes = filter.applyFilter(divisibleBy3, true);
        expect(changes.length).toEqual(2);
        expectArrayObserverEqual(filter.filtered, [3, 6]);
        changes = filter.applyFilter(isOdd, true);
        expect(changes.length).toEqual(2);
        expectArrayObserverEqual(filter.filtered, [1, 3, 5]);
    });
});
let _id = 0;
function getId() {
    return 'i' + (_id++);
}
function itt(title, itExecutor) {
    it(title, () => {
        itExecutor(title);
    });
}
describe('dom generation', function () {
    let testDomRoot;
    beforeAll(function () {
        testDomRoot = document.createElement('div');
        testDomRoot.setAttribute('style', 'padding-top: 10px;');
        document.body.appendChild(testDomRoot);
    });
    function createElement(tagName, attrs, children) {
        const id = getId();
        attrs.id = id;
        if (tagName !== 'div') {
            attrs.style = attrs.style || 'display: block;';
        }
        const el = h(tagName, attrs, children);
        expect(el instanceof HTMLElement).toEqual(true);
        testDomRoot.appendChild(el);
        expect(el).toEqual(document.querySelector('#' + id));
        return el;
    }
    describe('create elements (static attributes)', function () {
        itt('empty', function (title) {
            const el = h('div');
            expect(el instanceof HTMLElement).toEqual(true);
            testDomRoot.appendChild(el);
            expect(testDomRoot.firstChild).toEqual(el);
        });
        itt('with single children text node', function (title) {
            const el = createElement('div', {}, title);
            expect(el.textContent).toEqual(title);
        });
        itt('with style', function (title) {
            const el = createElement('div', { style: 'color: blue;' }, title);
            expect(el.style['color']).toEqual('blue');
        });
        itt('with style object', function (title) {
            const el = createElement('div', { style: { color: 'blue' } }, title);
            expect(el.style['color']).toEqual('blue');
        });
        itt('with class', function (title) {
            const c = 'dummy';
            const el = createElement('div', { class: c }, title);
            expect(el.className).toEqual(c);
        });
        itt('with class object', function (title) {
            const c = { 'blue-text': true, ping: false };
            const el = createElement('div', { class: c }, title);
            expect(el.className).toEqual('blue-text');
        });
        itt('with class object2', function (title) {
            const c = { 'blue-text': true, pong: true, ping: false };
            const el = createElement('div', { class: c }, title);
            expect(el.className).toEqual('blue-text pong');
        });
        itt('with event', function (title) {
            let wasClicked = false;
            const onclick = () => {
                wasClicked = true;
                console.log('clicked!');
            };
            const el = createElement('button', { onclick }, title);
            el.click();
            expect(wasClicked).toEqual(true);
        });
        itt('with boolean attributes', function (title) {
            const el = createElement('input', { disabled: true, readonly: false }, title);
            expect(el.attributes['disabled']).toBeDefined();
            expect(el.attributes['readonly']).toBeUndefined();
        });
    });
    describe('create elements (attributes auto-binding)', function () {
        itt('with style', function (title) {
            const style = valueStream('color: blue;');
            const el = createElement('div', { style: style }, title);
            expect(el.style['color']).toEqual('blue');
            style('color: green');
            expect(el.style['color']).toEqual('green');
        });
        itt('with style object', function (title) {
            const color = valueStream('blue');
            const fontStyle = valueStream('italic');
            const el = createElement('div', { style: { color, 'font-style': fontStyle } }, title);
            expect(el.style['color']).toEqual('blue');
            expect(el.style['font-style']).toEqual('italic');
            color('green');
            expect(el.style['color']).toEqual('green');
            fontStyle('oblique');
            expect(el.style['font-style']).toEqual('oblique');
        });
        itt('with class', function (title) {
            const c = valueStream('blue-text');
            const el = createElement('div', { class: () => 'pow ' + c() }, title);
            expect(el.className).toEqual('pow blue-text');
            c('green-text');
            expect(el.className).toEqual('pow green-text');
        });
        itt('with class object', function (title) {
            const blueTextEnabled = valueStream(true);
            const pingEnabled = valueStream(false);
            const c = { 'blue-text': blueTextEnabled, ping: pingEnabled };
            const el = createElement('div', { class: c }, title);
            expect(el.className).toEqual('blue-text');
            blueTextEnabled(false);
            expect(el.className).toEqual('');
            pingEnabled(true);
            expect(el.className).toEqual('ping');
        });
        itt('with boolean attributes', function (title) {
            const isDisabled = valueStream(true);
            const isReadonly = valueStream(false);
            const el = createElement('input', { disabled: isDisabled, readonly: isReadonly }, title);
            expect(el.attributes['disabled']).toBeDefined();
            expect(el.attributes['readonly']).toBeUndefined();
            isDisabled(false);
            expect(el.attributes['disabled']).toBeUndefined();
            isReadonly(true);
            expect(el.attributes['readonly']).toBeDefined();
        });
        itt('with value', function (title) {
            const value = valueStream('this is my value');
            const el = createElement('input', { value }, title);
            expect(el.value).toEqual('this is my value');
            el.value = 'dummy-value';
            value('new value');
            expect(el.value).toEqual('new value');
        });
    });
    describe('create elements with children (static)', function () {
        itt('with multiple text node', function (title) {
            const childrenText = ['this', ' is', ' something!'];
            const el = createElement('div', {}, childrenText);
            expect(el.children.length).toEqual(0);
            expect(el.childNodes.length).toEqual(3);
            expect(el.textContent).toEqual(childrenText.join(''));
        });
        itt('with multiple number node', function (title) {
            const childrenText = [7, 69, 666];
            const el = createElement('div', {}, childrenText);
            expect(el.children.length).toEqual(0);
            expect(el.childNodes.length).toEqual(3);
            expect(el.textContent).toEqual(childrenText.join(''));
        });
        itt('with multiple children', function (title) {
            const childrenText = ['this is', ' something'];
            const el = createElement('div', {}, [
                childrenText[0],
                h('button', {}, 'this is a button'),
                childrenText[1]
            ]);
            expect(el.children.length).toEqual(1);
            expect(el.childNodes.length).toEqual(3);
            expect(el.childNodes[0].nodeValue).toEqual(childrenText[0]);
            expect(el.childNodes[1].nodeName).toEqual('BUTTON');
            expect(el.childNodes[1].textContent).toEqual('this is a button');
            expect(el.childNodes[2].nodeValue).toEqual(childrenText[1]);
        });
    });
    describe('create elements with children (auto-binding)', function () {
        itt('single child', function (title) {
            const values = ['value1', 'value2', 'value3'];
            const singleChildValue = valueStream(values[0]);
            const el = createElement('div', {}, parentElement => singleChildValue());
            expect(el.textContent).toEqual(values[0]);
            singleChildValue(values[1]);
            expect(el.textContent).toEqual(values[1]);
            singleChildValue(title);
            expect(el.textContent).toEqual(title);
        });
        itt('3 text children', function (title) {
            const values = ['value1', 'value2', 'value3'];
            const values2 = ['value11', 'value22', 'value32'];
            const nodeData1 = valueStream(values[0]);
            const nodeData2 = valueStream(values[1]);
            const nodeData3 = valueStream(values[2]);
            const el = createElement('div', {}, [
                parentElement => nodeData1(),
                parentElement => nodeData2(),
                parentElement => nodeData3(),
            ]);
            expect(el.childNodes.length).toEqual(3);
            expect(el.childNodes[0].nodeValue).toEqual(values[0]);
            nodeData1(values2[0]);
            expect(el.childNodes[0].nodeValue).toEqual(values2[0]);
            nodeData3(values2[2]);
            expect(el.childNodes[2].nodeValue).toEqual(values2[2]);
        });
        itt('children attr', function (title) {
            const isDisabled = valueStream(true);
            const text = valueStream('before');
            let el;
            const root = createElement('div', {}, el = h('div', { disabled: isDisabled }, () => text()));
            expect(el.textContent).toEqual(text());
            expect(el.attributes['disabled']).toBeDefined();
            isDisabled(false);
            expect(el.attributes['disabled']).toBeUndefined();
            text(title);
            expect(el.textContent).toEqual(title);
        });
        itt('children stream attr', function (title) {
            const isDisabled = valueStream(true);
            const text = valueStream('before');
            let el;
            const root = createElement('div', {}, el = h('div', { disabled: isDisabled }, text));
            expect(el.textContent).toEqual(text());
            expect(el.attributes['disabled']).toBeDefined();
            isDisabled(false);
            expect(el.attributes['disabled']).toBeUndefined();
            text(title);
            expect(el.textContent).toEqual(title);
        });
    });
    function validateDomList(nld) {
        expect(nld.models.length).toEqual(nld.nodeList.childNodes.length);
        for (let i = 0; i < nld.models.length; ++i) {
            const model = nld.models.array[i];
            const node = nld.nodeList.childNodes[i];
            expect(model.domId).toEqual(node.attributes['id'].value);
        }
    }
    function setupNodeList(title, noIndexCheck = false) {
        const models = new ObservableArray();
        const id = getId();
        const attrs = {
            id: id
        };
        let domList;
        const el = h('div', attrs, [
            title + ' : ' + id,
            domList = elementList('ul', attrs, models, (listNode, model, index) => {
                if (!noIndexCheck) {
                    const actualModelIndex = models.array.indexOf(model);
                    expect(actualModelIndex).toEqual(index);
                }
                return h('div', { id: model.domId, class: model.class }, model.text);
            })
        ]);
        expect(el instanceof HTMLElement).toEqual(true);
        testDomRoot.appendChild(el);
        expect(el).toEqual(document.querySelector('#' + id));
        const d = {
            nodeList: domList,
            models,
        };
        validateDomList(d);
        return d;
    }
    describe('node-list', function () {
        function createModel() {
            const domId = getId();
            const model = { id: _id, domId, text: 'item: ' + domId };
            return model;
        }
        itt('push single element', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel());
            validateDomList(d);
        });
        itt('push multiple element', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel());
            d.models.push(createModel());
            d.models.push(createModel());
            validateDomList(d);
        });
        itt('push multi', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel(), createModel());
            validateDomList(d);
        });
        itt('pop', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel());
            validateDomList(d);
            d.models.pop();
            validateDomList(d);
        });
        itt('reverse', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel(), createModel());
            validateDomList(d);
            d.models.reverse();
            validateDomList(d);
        });
        itt('splice delete til end', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel(), createModel());
            d.models.splice(1);
            validateDomList(d);
        });
        itt('splice delete 2', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel(), createModel(), createModel());
            d.models.splice(1, 2);
            validateDomList(d);
        });
        itt('splice delete and add', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel(), createModel(), createModel());
            d.models.splice(1, 2, createModel(), createModel());
            validateDomList(d);
        });
        itt('splice add', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel(), createModel(), createModel());
            d.models.splice(1, 0, createModel(), createModel());
            validateDomList(d);
        });
        itt('shift', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel(), createModel());
            d.models.shift();
            validateDomList(d);
        });
        itt('sort', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel(), createModel(), createModel());
            d.models.array[0].order = 10;
            d.models.array[1].order = 5;
            d.models.array[2].order = 20;
            d.models.array[3].order = 15;
            d.models.sort((a, b) => a.order - b.order);
            validateDomList(d);
        });
        itt('unshift single', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel());
            d.models.unshift(createModel());
            validateDomList(d);
        });
        itt('unshift multiple', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel());
            d.models.unshift(createModel(), createModel());
            validateDomList(d);
        });
        itt('changes: push + unshift ', function (title) {
            // No index check on batch operations
            const d = setupNodeList(title, true);
            d.models.applyChanges(() => {
                d.models.push(createModel(), createModel());
                d.models.unshift(createModel(), createModel());
            });
            validateDomList(d);
        });
        itt('changes: swap', function (title) {
            // No index check on batch operations
            const d = setupNodeList(title, true);
            d.models.applyChanges(() => {
                d.models.push(createModel(), createModel(), createModel(), createModel());
                const a = d.models.array[1];
                const b = d.models.array[2];
                d.models.splice(1, 1, b);
                d.models.splice(2, 1, a);
            });
            validateDomList(d);
        });
    });
    describe('node-list (auto-binding)', function () {
        function createModel() {
            const domId = getId();
            const textData = valueStream('item: ' + domId);
            const model = { id: _id, domId, text: () => textData(), class: valueStream(domId), textData };
            return model;
        }
        itt('modify class', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel());
            validateDomList(d);
            d.models.array[0].class('new-class');
            expect(d.nodeList.children[0].className).toEqual('new-class');
        });
        itt('modify text', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel());
            validateDomList(d);
            d.models.array[0].textData('new-text');
            expect(d.nodeList.children[0].textContent).toEqual('new-text');
        });
    });
});
//# sourceMappingURL=spec.js.map

})));
//# sourceMappingURL=spec.js.map
