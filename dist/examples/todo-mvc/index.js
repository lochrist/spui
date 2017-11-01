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
function createValueStream(initialValue, transform) {
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
    return valueStream;
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

function createComputation() {
    return {
        computedStream: createValueStream(),
        dependencies: []
    };
}
function computeStream(functor, transform) {
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
        // For event avoid listening for changes.
        if (attrName.startsWith('on')) {
            const eventName = attrName.slice(2);
            element.addEventListener(eventName, attrValue);
            continue;
        }
        // If attr value is an object (for classes and styles we might have to setup a computation)
        if (isFunction(attrValue) || isObject(attrValue)) {
            // For all attributes resulting from a computation setup auto update:
            const computation = computeStream(() => {
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
        case 'value':
            // value is handled differently than attributes. the value attributes only indicates the "initial" value. 
            // You need to use "value" property to actually modify the node.
            element.value = value;
            break;
        default:
            if (value === false) {
                element.removeAttribute(attr);
            }
            else {
                // If value is a boolean, set it to "" to only enable it in DOM.
                element.setAttribute(attr, value === true ? "" : value);
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
    if (isFunction(child)) {
        let resolvedChild;
        const computation = computeStream(() => {
            resolvedChild = child(element);
        });
        let childNode = isString(resolvedChild) ? document.createTextNode(resolvedChild) : resolvedChild;
        element.appendChild(childNode);
        if (computation.dependencies.length) {
            // Auto update in case children is a stream
            addTransform(computation.computedStream, () => {
                const oldChildNode = childNode;
                childNode = isString(resolvedChild) ? document.createTextNode(resolvedChild) : resolvedChild;
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
class SyncNodeList {
    constructor(listRootNode, models, nodeCreator, key) {
        this.listRootNode = listRootNode;
        this.models = models;
        this.nodeCreator = nodeCreator;
        this.key = key;
        this.modelToNode = new Map();
        models.addListener(this.onModelChange.bind(this));
        if (this.models.length) {
            const nodes = this.createNodes(this.models, 0);
            this.listRootNode.appendChild(nodes);
        }
    }
    onModelChange(op, args) {
        switch (op) {
            case 'pop':
                this.listRootNode.removeChild(this.listRootNode.lastChild);
                break;
            case 'push': {
                const nodes = this.createNodes(args, this.models.length - args.length);
                this.listRootNode.appendChild(nodes);
                break;
            }
            case 'reverse':
                {
                    const frag = new DocumentFragment();
                    while (this.listRootNode.lastChild) {
                        frag.appendChild(this.listRootNode.removeChild(this.listRootNode.lastChild));
                    }
                    this.listRootNode.appendChild(frag);
                    break;
                }
                ;
            case 'splice':
                const childNodes = this.listRootNode.childNodes;
                const spliceStart = args[0] < 0 ? childNodes.length + args[0] : args[0];
                const deleteCount = args.length > 1 ? args[1] : childNodes.length - spliceStart;
                const deleteStop = spliceStart + deleteCount;
                for (let i = spliceStart; i < deleteStop && childNodes[spliceStart]; i++) {
                    this.listRootNode.removeChild(childNodes[spliceStart]);
                }
                if (args.length > 2) {
                    const nodes = this.createNodes(args.slice(2), spliceStart);
                    this.listRootNode.insertBefore(nodes, childNodes[spliceStart]);
                }
                break;
            case 'shift':
                this.listRootNode.removeChild(this.listRootNode.firstChild);
                break;
            case 'sort': {
                const frag = new DocumentFragment();
                for (let i = 0; i < this.models.length; ++i) {
                    const node = this.modelToNode.get(this.models[i]);
                    this.listRootNode.removeChild(node);
                    frag.appendChild(node);
                }
                this.listRootNode.appendChild(frag);
                break;
            }
            case 'unshift': {
                const nodes = this.createNodes(args, 0);
                this.listRootNode.insertBefore(nodes, this.listRootNode.firstChild);
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
    createNodes(models, startIndex) {
        if (models.length > 1) {
            const frag = new DocumentFragment();
            for (let i = 0; i < models.length; ++i) {
                const childNode = this.createNode(models[i], startIndex++);
                frag.appendChild(childNode);
            }
            return frag;
        }
        return this.createNode(models[0], startIndex);
    }
    createNode(model, index) {
        const childNode = this.nodeCreator(this.listRootNode, model, index);
        this.modelToNode.set(model, childNode);
        return childNode;
    }
}
function nodeList(tagName, attrs = null, models, nodeCreator, key) {
    const listRootNode = h$1(tagName, attrs);
    parent._nodeList = new SyncNodeList(listRootNode, models, nodeCreator, key);
    return listRootNode;
}

function eventTarget(eventAttrName, stream) {
    return function (event) {
        return stream(event.target[eventAttrName]);
    };
}

class ObservableArray extends Array {
    constructor() {
        super();
        this.listeners = [];
        this.changes = null;
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
        return this.listeners.push(callback);
    }
    removeListener(callback) {
        return remove(this.listeners, callback);
    }
    emit(op, args) {
        for (let i = 0; i < this.listeners.length; ++i) {
            this.listeners[i](op, args);
        }
    }
}
const mutables = 'pop push reverse splice shift sort unshift'.split(' ');
for (const method of mutables) {
    const originalMethod = Array.prototype[method];
    ObservableArray.prototype[method] = function (...args) {
        const returnValue = originalMethod.apply(this, args);
        if (this.changes === null) {
            this.emit(method, args);
        }
        else {
            this.changes.push([method, args]);
        }
        return returnValue;
    };
}
//# sourceMappingURL=observable-array.js.map

//# sourceMappingURL=index.js.map

const h = h$1;
function createTodo(title) {
    return {
        title: createValueStream(title),
        done: createValueStream(false)
    };
}
function spuiTodo() {
    const newTitle = createValueStream('');
    const todos = new ObservableArray();
    const addTodo = () => {
        todos.push(createTodo(newTitle()));
        newTitle('');
    };
    todos.push(createTodo('something'));
    todos.push(createTodo('something else'));
    const view = h('div', {}, [
        h('input', { type: 'text', value: newTitle, oninput: eventTarget('value', newTitle) }),
        h('button', { onclick: addTodo }, '+'),
        nodeList('ul', {}, todos, (listNode, todo, index) => {
            return h('div', {}, [
                h('input', { type: 'checkbox', value: todo.done, onclick: eventTarget('checked', todo.done) }),
                h('input', { type: 'text', value: todo.title, oninput: eventTarget('value', todo.title) }),
                h('a', { onclick: () => remove(todos, todo) }, 'X'),
                // Create bindings on usage of title and done.
                h('span', {}, () => 'title: ' + todo.title() + ' done: ' + todo.done())
            ]);
        })
    ]);
    document.body.appendChild(view);
}
spuiTodo();
//# sourceMappingURL=index.js.map

})));
//# sourceMappingURL=index.js.map
