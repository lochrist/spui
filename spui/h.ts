import {isFunction, isString, isObject, expandValue} from './utils';
import * as s from './stream';

type AttrGenerator = (HTMLElement) => Object;
type ChildrenType = HTMLElement | Array<any> | string;
type ChildrenGenerator = (HTMLElement) => ChildrenType;
type Children = ChildrenType | ChildrenGenerator;
interface ElementAttrs {
    [key: string]: any;
}

export function h(tagName: string, attrs: AttrGenerator | Object = null, children: Children = undefined) {
    const element = document.createElement(tagName);
    if (attrs) {
        setAttrs(element, attrs);
    }

    if (children) {
        setChildren(element, children);
    }
    return element;
}

export function setAttrs(element: HTMLElement, attr: ElementAttrs) {
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
            const computation = s.computeStream(() => {
                setAttr(element, attrName, attrValue);
            });

            // Check if the attrValue function has actually registered a dependency:
            if (computation.dependencies.length) {
                s.addTransform(computation.computedStream, () => {
                    setAttr(element, attrName, attrValue);
                });
            }

            continue;
        }
        
        // Handle static attributes:
        setAttr(element, attrName, attrValue);
    }
}

export function setAttr(element: HTMLElement, attr: string, value: any) {
    value = expandValue(value);
    if (attr === 'style') {
        setStyle(element, value);
    } else if (attr === 'class' || attr === 'className') {
        setClass(element, value);
    } else if (attr) {
        if (value === false) {
            // This disables an attribute:
            element.removeAttribute(attr);
        } else {
            // If value is a boolean, set it to "" to only enable it in DOM.
            element.setAttribute(attr, value === true ? "" : value);
        }
    }
}

export function setClass(element: HTMLElement, className: string | Object) {
    if (isString(className)) {
        element.setAttribute('class', className);
    } else {
        let newClass = '';
        for (const key in className) {
            let value = className[key];
            value = expandValue(value);
            if (value) {
                newClass += (newClass !== '' ? ' ' : '' ) + key;
            }
        }
        element.setAttribute('class', newClass);
    }
}

export function setStyle(element: HTMLElement, style: Object | string, value?) {
    if (isString(style)) {
        element.setAttribute('style', style);
    } else {
        for (const key in style) {
            const styleValue = expandValue(style[key]);
            element.style[key] = styleValue;
        }
    }
}

export function setChildren(element: HTMLElement, children: Children) {
    if (isFunction(children)) {
        children = children(element);
    }
    if (Array.isArray(children)) {
        for (const child of children) {
            appendChild(element, child);
        }
    } else {
        appendChild(element, children);
    }
}

function appendChild(element: HTMLElement, child: string | HTMLElement) {
    // TODO: use documentFragment!
    if (isString(child)) {
        element.appendChild(document.createTextNode(child));
    } else {
        element.appendChild(child);
    }
}