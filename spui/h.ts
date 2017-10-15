import {isFunction, isString, isObject, expandValue} from './utils';
import * as s from './stream';

type AttrGenerator = (HTMLElement) => Object;
type ChildGenerator = (HTMLElement) => HTMLElement | string;
type Child = string | HTMLElement | ChildGenerator;
type Children = Array<any> | Child;
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
                newClass += (newClass == '' ? '' : ' ' ) + key;
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
    if (Array.isArray(children)) {
        for (const child of children) {
            appendChild(element, child);
        }
    } else {
        appendChild(element, children);
    }
}

function appendChild(element: HTMLElement, child: Child) {
    // TODO: use documentFragment!
    
    if (isFunction(child)) {
        let resolvedChild: HTMLElement | string;
        const computation = s.computeStream(() => {
            resolvedChild = child(element);
        });

        let childNode = isString(resolvedChild) ? document.createTextNode(resolvedChild) : resolvedChild;
        element.appendChild(childNode);

        if (computation.dependencies.length) {
            s.addTransform(computation.computedStream, () => {
                const oldChildNode = childNode;
                childNode = isString(resolvedChild) ? document.createTextNode(resolvedChild) : resolvedChild;
                element.replaceChild(childNode, oldChildNode);
            });
        }
    } else if (isString(child)) {
        element.appendChild(document.createTextNode(child));
    } else {
        element.appendChild(child);
    }
}

class NodeList {
    models: any[];
    nodeCreator: ChildGenerator;
    key: string;
    updateFunc: (HTMLElement) => void;
    constructor(models: any[], nodeCreator: ChildGenerator, key?: string, updateFunc?: (HTMLElement) => void) {
        this.models = models;
        this.nodeCreator = nodeCreator;
        this.key = key;
        this.updateFunc = updateFunc;
    }

    update(models: any[]) {

    }

    updateModel(model: any) {
        
    }

    remove(key: number | string) {

    }

    add(model: any, key: number | string) {

    }
}

export function list(tagName, attrs, models, nodeCreator: ChildGenerator, key?, updateFunc?) {
    const parent = h(tagName, attrs);

}