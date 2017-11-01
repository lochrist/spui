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
function computeStream(functor) {
    return compute(functor).computedStream;
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
const examples = [];
function marked(mdText) {
    return window.marked(mdText);
}
function randomNumber(maxValue) {
    return Math.floor(Math.random() * maxValue);
}
function randomIndex(elements) {
    return randomNumber(elements.length);
}
function randomElement(elements) {
    return elements[randomIndex(elements)];
}
function cleanCodeSnippet(snippet) {
    let lines = snippet.split('\n');
    // Remove function line:
    lines.splice(0, 1);
    // Remove bracket on last lines:
    lines.splice(lines.length - 1, 1);
    // Trim first indent:
    lines = lines.map(l => {
        l = l.slice(4);
        if (l.startsWith('return ')) {
            l = l.replace('return ', '');
        }
        return l;
    });
    return lines.join('\n');
}
function createCodeSnippet(f) {
    return marked('```javascript\n' + cleanCodeSnippet(f.toString()) + '\n```');
}
function createExample(title, exampleGenerator) {
    return {
        title,
        exampleGenerator
    };
}
function addExample(title, exampleGenerator) {
    const ex = createExample(title, exampleGenerator);
    examples.push(ex);
    return ex;
}
function createExamplesView(examples) {
    return h('div', { class: 'container' }, examples.map(example => {
        let snippetEl;
        const el = h('div', { class: 'row' }, [
            h('h3', { class: 'col-md-12' }, example.title),
            snippetEl = h('div', { class: 'col-md-8' }),
            h('div', { class: 'col-md-4' }, example.exampleGenerator())
        ]);
        snippetEl.innerHTML = createCodeSnippet(example.exampleGenerator);
        return el;
    }));
}
/////////////////////////////////////////////////////////
// Stream
function valueStreamEx() {
    const model = valueStream(42);
    // stream called with no param: getter
    console.log(model());
    // stream called with a param: setter
    model(71);
    // Prints 71
    console.log(model());
    // Create a stream with a transformer function:
    const doublingModel = valueStream(42, value => value * 2);
    // Prints 84
    console.log(doublingModel());
    // Thuis will invoke the transformer before setting the stream value:
    doublingModel(21);
    // Prints 42
    console.log(doublingModel());
}
addExample('value stream', valueStreamEx);
function streamTransformEx() {
    const model = valueStream(42);
    // Prints 42
    console.log(model());
    // Modify the stream itself by adding a transform:
    addTransform(model, value => value * 2);
    // Prints 84
    console.log(model());
}
addExample('value transform', streamTransformEx);
function streamListenerEx() {
    const model = valueStream(42);
    const stopListening = addListener(model, value => {
        console.log('Model has changed: ', value);
    });
    // prints: Model has changed: 11
    model(11);
    stopListening();
    // This won't print anything.
    model(22);
}
addExample('stream listener', streamListenerEx);
function streamMapEx() {
    const model = valueStream(42);
    // Create a new stream that maps the original model value:
    const mappedModel = map(model, value => value * 2);
    // Prints 42
    console.log(model());
    // Prints 84
    console.log(mappedModel());
    model(11);
    // Prints 22
    console.log(mappedModel());
}
addExample('stream map', streamMapEx);
function computeStreamEx() {
    const firstName = valueStream('Donald');
    const lastName = valueStream('Knuth');
    const fullName = computeStream(() => {
        return firstName() + ' ' + lastName();
    });
    // Prints: Donald Knight
    console.log(fullName());
    lastName('Duck');
    // Prints Donal Duck. And loses all respect.
    console.log(fullName());
}
addExample('compute stream', computeStreamEx);
/////////////////////////////////////////////////////////
// hyperscript examples:
function hStaticEx() {
    return h('div', { class: 'alert alert-info' }, 'Hello!');
}
addExample('h with static values', hStaticEx);
function hChildrenEx() {
    return h('div', { class: 'child-container' }, [
        'this is a text children',
        h('input', { placeholder: 'what is up doc?' }),
        h('button', {}, 'Button child')
    ]);
}
addExample('h with children', hChildrenEx);
function hClassEx1() {
    const labels = [
        { text: 'this is some info', info: true },
        { text: 'this is dangerous!', danger: true }
    ];
    // class attribute can be a string or an object where each key is used as a class
    // if the corresponding value is truthy.
    return h('div', { class: 'child-container' }, labels.map(label => {
        return h('div', { class: {
                alert: true,
                'alert-info': label.info,
                'alert-danger': label.danger
            } }, label.text);
    }));
}
addExample('class as object', hClassEx1);
function hStyleEx() {
    // style attribute can be either a string or an object
    return h('div', {}, [
        h('div', { style: 'color: black; background-color: grey;padding: 10px;' }, 'dark label #1'),
        h('div', { style: { color: 'grey', backgroundColor: 'black', padding: '10px' } }, 'darker label #2')
    ]);
}
addExample('style as object', hStyleEx);
function hBooleanAttrs() {
    // Attributre with a boolean value, are setup specially in the DOM
    return h('div', { class: 'child-container' }, [
        // <input placeholder="this is writable">
        h('input', { placeholder: 'this is writable', readonly: false, disabled: false }),
        // <input placeholder="this is readonly" readonly>
        h('input', { placeholder: 'this is readonly', readonly: true }),
        // <input placeholder="this is disabled" disabled>
        h('input', { placeholder: 'this is disabled', disabled: true }),
    ]);
}
addExample('boolean attributes', hBooleanAttrs);
function eventsEx() {
    let input, button, buttonText = 'Roll D6';
    return h('div', { class: 'child-container' }, [
        input = h('input', { placeholder: 'this is readonly', readonly: true, value: 1 }),
        // Listener to an event is adding an attribute of name : on<eventName>
        button = h('button', {
            onclick: () => {
                // h() returns an HTMLElement. So it is really easy changing the value of input:
                input.value = randomNumber(6) + 1;
            },
            onmouseenter: () => {
                button.innerText = 'Click to roll';
            },
            onmouseleave: () => {
                button.innerText = buttonText;
            }
        }, buttonText),
    ]);
}
addExample('events', eventsEx);
/////////////////////////////////////////////////////////
// Model changes auto updating
function hClassAutoUpdateEx() {
    // Attribute with a boolean value, are setup specially in the DOM
    const strikeIt = valueStream(false);
    return h('div', { class: 'child-container' }, [
        h('button', { onclick: () => strikeIt(!strikeIt()) }, 'Toggle'),
        // Stream used directly for strike class
        h('div', { class: { strike: strikeIt } }, 'is this done?'),
        // Computation created for the whole class value
        h('div', { class: () => strikeIt() ? 'strike' : '' }, 'is this done?')
    ]);
}
addExample('class changes auto-update', hClassAutoUpdateEx);
// style changes
function hStyleAutoUpdateEx() {
    // Attribute with a boolean value, are setup specially in the DOM
    const colors = ['blue', 'green', 'red', 'black', 'pink'];
    const randomColor = () => randomElement(colors);
    const color1 = valueStream(randomColor());
    const color2 = valueStream(randomColor());
    return h('div', { class: 'child-container' }, [
        h('button', { onclick: () => {
                color1(randomColor());
                color2(randomColor());
            } }, 'random color'),
        h('div', { class: 'color-display', style: () => 'background-color: ' + color1() }),
        h('div', { class: 'color-display', style: { backgroundColor: color2 } })
    ]);
}
addExample('style changes auto-update', hStyleAutoUpdateEx);
function hBooleanAutoUpdateEx() {
    // Attribute with a boolean value, are setup specially in the DOM
    const toggle = valueStream(false);
    const readonlyInput = map(toggle, value => value ? 'this is readonly' : 'this is writable');
    const disabledInput = map(toggle, value => value ? 'this is disabled' : 'this is enabled');
    return h('div', { class: 'child-container' }, [
        h('button', { onclick: () => toggle(!toggle()) }, 'Toggle'),
        h('input', { placeholder: readonlyInput, readonly: toggle }),
        h('input', { placeholder: disabledInput, disabled: toggle }),
    ]);
}
addExample('boolean changes auto-update', hBooleanAutoUpdateEx);
function genericAttributesUpdate() {
    const isChecked = valueStream(true);
    // Attributre with a boolean value, are setup specially in the DOM
    return h('div', {}, [
        h('input', { type: 'checkbox', checked: isChecked, onclick: targetAttr('checked', isChecked) }),
        h('button', { title: () => isChecked() ? 'this is checked' : 'this is unchecked' }, 'Hover me!')
    ]);
}
addExample('generic attributes update', genericAttributesUpdate);
function inputValueChangeEx() {
    const model = valueStream('this is my initial value');
    return h('div', {}, [
        // when the user types into the <input> we update model...
        h('input', { value: model, oninput: targetAttr('value', model) }),
        // ...when model changes, label content updates automatically.
        h('label', {}, model)
    ]);
}
addExample('input value change', inputValueChangeEx);
function childrenValueChangeEx() {
    const counter = valueStream(0);
    return h('div', {}, [
        h('button', { onclick: () => counter(counter() + 1) }, 'Increment'),
        h('label', { style: 'padding: 5px;' }, counter)
    ]);
}
addExample('children value change', childrenValueChangeEx);
function elementListEx() {
    const models = new ObservableArray();
    let count = 0;
    models.push(valueStream(count++));
    models.push(valueStream(count++));
    models.push(valueStream(count++));
    models.push(valueStream(count++));
    return h('div', {}, [
        h('button', { onclick: () => models.push(valueStream(count++)) }, 'Add'),
        h('button', { onclick: () => models.splice(randomIndex(models.array), 1) }, 'Remove random'),
        // elementList will update the <ul> element when new elements are added or removed.
        elementList('ul', {}, models, (listNode, model, index) => {
            return h('li', {}, model);
        })
    ]);
}
addExample('elementList', elementListEx);
/////////////////////////////////////////////////////////
// Misc
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
function observableArrayEx() {
    const obsArray = new ObservableArray();
    const off = obsArray.addListener((op, args, returnValue) => {
        console.log(op, args, returnValue);
    });
    // prints: 'push' [1] 1
    obsArray.push(1);
    // prints: 'splice' [0, 1, 42] [1]
    obsArray.splice(0, 1, 42);
    // stop listening
    off();
    // Doesn't print anything.
    obsArray.push(2);
}
addExample('observable array', observableArrayEx);
function observableArrayApplyChangesEx() {
    const obsArray = new ObservableArray();
    obsArray.addListener((op, args, returnValue) => {
        console.log(op, args, returnValue);
    });
    const finalValue = obsArray.applyChanges(() => {
        obsArray.push(1);
        obsArray.splice(0, 1, 42);
        return obsArray.length;
    });
    // When this resolve the listener will print this:
    // changes [['push', [1], 1], ['splice' [0, 1, 42] [1] ]]
    // Notice that finalValue === obsArray.length
}
addExample('observable array apply changes', observableArrayApplyChangesEx);
function filterEx() {
    const models = new ObservableArray();
    for (let i = 0; i < 1000; ++i)
        models.push(generateName());
    const match = valueStream('');
    const filter = new Filter(models, (model) => {
        return match() ? model.indexOf(match()) > -1 : true;
    });
    const triggerFilter = map(match, () => filter.applyFilter());
    return h('div', {}, [
        h('input', { oninput: targetAttr('value', match) }),
        // elementList will update the <ul> element when new elements are added or removed.
        elementList('ul', { style: 'height: 300px;overflow: auto' }, filter.filtered, (listNode, model, index) => {
            return h('li', {}, model);
        })
    ]);
}
addExample('filter', filterEx);
/////////////////////////////////////////////////////////
// Complete examples
function todoExpressEx() {
    const newTitle = valueStream('');
    // This will store all our todos and ensure the DOM todo list is kept in sync
    const todos = new ObservableArray();
    function addTodo() {
        if (newTitle()) {
            // Create a new todo and add it to the model. This will update the DOM list automatically.
            todos.push(createTodo(newTitle()));
            newTitle('');
        }
    }
    
    function createTodo(title, done = false) {
        return {
            title,
            done: valueStream(done)
        };
    }
    // Create some initial datas:
    todos.push(createTodo('hit the gym'));
    todos.push(createTodo('procrastinate', true));
    todos.push(createTodo('write unit tests'));
    // Setup our todo view:
    return h('div', { class: 'todoapp' }, [
        h('div', { class: 'header' }, [
            h('h3', {}, 'todo express'),
            h('input', {
                type: 'text', value: newTitle, placeholder: 'what is up?',
                // Update the title value as the user types in the input.
                oninput: targetAttr('value', newTitle)
            }),
            h('span', { class: 'addBtn', onclick: addTodo }, 'Add'),
        ]),
        // elementList will ensure all the <ul> children are kept in sync with the todos model:
        elementList('ul', {}, todos, (listNode, todo, index) => {
            return h('li', {
                // checked is updated if todo.done changes.
                class: { checked: todo.done },
                onclick: () => todo.done(!todo.done())
            }, [
                todo.title,
                // Removoing the todo from the model will update the DOM List.
                h('span', { class: 'closeBtn', onclick: () => todos.remove(todo) }, 'x')
            ]);
        })
    ]);
}
addExample('todo express', todoExpressEx);
const view = createExamplesView(examples);
document.body.appendChild(view);

})));
//# sourceMappingURL=index.js.map
