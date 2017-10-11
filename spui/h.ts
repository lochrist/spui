import {isFunction, isArray, isString, expandValue} from './utils';

interface AttrGenerator {
    (HTMLElement): Object;
}

type ChildrenType = HTMLElement | Array<HTMLElement> | string | Array < string >;

interface ChildrenGenerator {
    (HTMLElement): ChildrenType;
}

type Children = ChildrenType | ChildrenGenerator;

export function h(tagName: string, attrs: AttrGenerator | Object = null, children: Children = undefined) {
    const element = document.createElement(tagName);
    if (attrs) {
        setAttr(element, attrs);
    }

    if (children) {
        setChildren(element, children);
    }
    return element;
}

export function setAttr(element: HTMLElement, attr: AttrGenerator | Object | string, value: any = undefined) {
    if (isFunction(attr)) {
        attr = attr(element);
    }

    if (isString(attr)) {
        if (value !== undefined) {
            if (attr.startsWith('on')) {
                // TODO: on update we should not update 
                const eventName = attr.slice(2);
                element.addEventListener(eventName, value);
            } else {
                value = expandValue(value);
                if (attr === 'style') {
                    setStyle(element, value);
                } else if (attr === 'class' || attr === 'className') {
                    setClass(element, value);
                } else if (attr) {
                    element.setAttribute(attr, value);
                }
            }
        }
    } else {
        for (const key in attr) {
            setAttr(element, key, attr[key]);
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
                newClass += key + ' ';
            }
        }
        element.setAttribute('class', newClass);
    }
}

export function setStyle(element: HTMLElement, style: Object | string, value: any = undefined) {
    if (value !== undefined) {
        value = expandValue(value);
        element.style[style as string] = value;
    } else if (isString(style)) {
        element.setAttribute('style', style);
    } else {
        for (const key in style) {
            setStyle(element, key, style[key]);
        }
    }
}

export function setChildren(element: HTMLElement, children: Children) {
    if (isFunction(children)) {
        children = children(element);
    }
    if (isArray(children)) {
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