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




function targetAttr(eventAttrName, functor) {
    return function (event) {
        return functor(event.target[eventAttrName]);
    };
}
//# sourceMappingURL=dom.js.map

//# sourceMappingURL=observable-array.js.map

//# sourceMappingURL=index.js.map

const h = h$1;
const marked = window.marked;
let htmlTextElement = h('div');
const markdownText = valueStream(`# Markdown Editor\n\nType on the left panel and see the result on the right panel`);
const htmlText = map(markdownText, md => {
    htmlTextElement.innerHTML = marked(md);
});
const editor = h('div', { id: 'editor' }, [
    h('textarea', { class: 'input', value: markdownText, oninput: targetAttr('value', markdownText) }),
    h('div', { class: 'preview' }, htmlTextElement),
]);
document.body.appendChild(editor);
//# sourceMappingURL=index.js.map

})));
//# sourceMappingURL=index.js.map
