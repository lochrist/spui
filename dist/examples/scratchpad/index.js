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


//# sourceMappingURL=stream.js.map

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


function targetAttr(eventAttrName, functor) {
    return function (event) {
        return functor(event.target[eventAttrName]);
    };
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
            return this.filtered.changes;
        });
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

//# sourceMappingURL=index.js.map

const h = h$1;
function randomNumber(maxValue) {
    return Math.floor(Math.random() * maxValue);
}
function randomIndex(elements) {
    return randomNumber(elements.length);
}
function randomElement(elements) {
    return elements[randomIndex(elements)];
}
const names = ['Fenton Will', 'Zeph Arnie', 'Zeke Tod', , 'Chandler Jeb', 'Collin Ernie',
    'Claude Toby', 'Channing Temple', 'Rickey Tracey',
    'Lewis Farley', 'Rolland Spencer', 'Joel Graeme', 'Eldred Benji', 'Eldred Benji',
    'Erik Paxton', 'Brett Shanon', 'Astor Gladwyn', 'Milburn Gaz', 'Newton Huey', 'Nelson Marvyn',
    'Bram Branson', 'Josiah Kingston', 'Asher Hildred', 'Joe Kyler', 'Clay Durward',
    'Biff Thane', 'Dax Walton', 'Fulk Burt', 'Willie Cosmo', 'Emmet Conner', 'Quinlan Cam',
    'Wolf Vinny', 'Larrie Joseph', 'Lester Keir', 'Jerrard Louis',
    'Peter Laurie', 'Don Desmond', 'Sterling Rowland', 'Pearce Raphael', 'Wyatt Harding',
    'Matty Cree', 'Syd Tommie', 'Augustine Dylan', 'Boniface Lionel'
];
const firstNames = [];
const lastNames = [];
names.forEach(name => {
    let split = name.split(' ');
    firstNames.push(split[0]);
    lastNames.push(split[1]);
});
function generateName() {
    return randomElement(firstNames) + ' ' + randomElement(lastNames);
}
function filterEx() {
    const models = new ObservableArray();
    for (let i = 0; i < 10000; ++i) {
        models.push(generateName());
    }
    let nodeList;
    function clear() {
        /*
        models.applyChanges(() => {
            console.time('clear - splice');
            models.splice(0);
            console.timeEnd('clear - splice');
            console.time('clear - dom change');
        });
        console.timeEnd('clear - dom change');
        */
        console.time('clear');
        /*
        let nodes = [];
        for (let i = 0; i < 10000; ++i) {
            nodes.push(nodeList.childNodes[i]);
        }

        let count = nodes.length;
        for (let i = 0; i < count; ++i) {
            nodeList.removeChild(nodes[i]);
        }
        */
        /*
        var i = nodeList.childNodes.length;
        while (i--) {
            nodeList.removeChild(nodeList.lastChild);
        }
        */
        models.splice(0);
        console.timeEnd('clear');
    }
    const match = valueStream('');
    const filter = new Filter(models, (model) => {
        return match() ? model.indexOf(match()) > -1 : true;
    });
    const triggerFilter = map(match, () => filter.applyFilter());
    return h('div', {}, [
        h('input', { oninput: targetAttr('value', match) }),
        h('button', { onclick: clear }, 'clear'),
        // elementList will update the <ul> element when new elements are added or removed.
        nodeList = elementList('ul', { style: 'height: 300px;width: 300px;overflow: auto' }, filter.filtered, (listNode, model, index) => {
            return h('li', {}, model);
        })
    ]);
}
document.body.appendChild(filterEx());
//# sourceMappingURL=index.js.map

})));
//# sourceMappingURL=index.js.map
