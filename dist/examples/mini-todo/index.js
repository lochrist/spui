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

//# sourceMappingURL=index.js.map

const h = h$1;
function todoExpress() {
    const newTitle = valueStream('');
    const todos = new ObservableArray();
    function addTodo() {
        if (newTitle()) {
            todos.push(createTodo(newTitle()));
            newTitle('');
        }
    }
    
    function createTodo(title, done = false) {
        return {
            title: valueStream(title),
            done: valueStream(done)
        };
    }
    todos.push(createTodo('hit the gym'));
    todos.push(createTodo('procrastinate', true));
    todos.push(createTodo('write unit tests'));
    const view = h('div', { id: 'todoapp' }, [
        h('div', { class: 'header' }, [
            h('h3', {}, 'todo express'),
            h('input', { type: 'text', value: newTitle, placeholder: 'what is up?', oninput: targetAttr('value', newTitle) }),
            h('span', { class: 'addBtn', onclick: addTodo }, 'Add'),
        ]),
        elementList('ul', {}, todos, (listNode, todo, index) => {
            return h('li', { class: { checked: todo.done }, onclick: () => todo.done(!todo.done()) }, [
                todo.title,
                h('span', { class: 'close', onclick: () => todos.remove(todo) }, 'x')
            ]);
        })
    ]);
    document.body.appendChild(view);
}
todoExpress();
//# sourceMappingURL=index.js.map

})));
//# sourceMappingURL=index.js.map
