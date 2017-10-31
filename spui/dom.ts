import { isNode, isFunction, isString, isObject, expandValue, StringKeyMap, Functor0P, Functor1P} from './utils';
import * as s from './stream';
import {ArrayObserver} from './observable-array';

export type Attrs = StringKeyMap<any>;
export type ElementGenerator = () => HTMLElement;
export type StringGenerator = () => string;
export type Child = string | HTMLElement | ElementGenerator | StringGenerator;
export type Children = Array<Child> | Child;
export type ModelElementCreator = (listRootElement: HTMLElement, model: any, indeX: number) => HTMLElement;

export function h(tagName: string, attrs?: Attrs, children?: Children) {
    const element = document.createElement(tagName);
    if (attrs) {
        setAttrs(element, attrs);
    }

    if (children) {
        setChildren(element, children);
    }
    return element;
}

function setAttrs(element: HTMLElement, attr: Attrs) {
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
            const computation = s.compute(() => {
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

function setAttr(element: HTMLElement, attr: string, value: any) {
    value = expandValue(value);
    switch(attr) {
        case 'class':
        case 'className':
            setClass(element, value);
        break
        case 'style':
            setStyle(element, value);
        break;
        default: 
            if (attr in element) {
                element[attr] = value;
            } else if (value === false) {
                element.removeAttribute(attr);
            } else if (value === true) {
                // If value is a boolean, set it to "" to only enable it in DOM.
                element.setAttribute(attr, "");
            } else {
                element.setAttribute(attr, value);
            }
    }
}

function setClass(element: HTMLElement, className: string | Attrs) {
    if (isString(className)) {
        element.className = className;
    } else {
        let newClass = '';
        for (const key in className) {
            let value = className[key];
            value = expandValue(value);
            if (value) {
                newClass += (newClass == '' ? '' : ' ' ) + key;
            }
        }
        element.className = newClass;
    }
}

function setStyle(element: HTMLElement, style: Attrs | string, value?) {
    if (isString(style)) {
        element.setAttribute('style', style);
    } else {
        for (const key in style) {
            const styleValue = expandValue(style[key]);
            element.style[key] = styleValue;
        }
    }
}

function setChildren(element: HTMLElement, children: Children) {
    if (Array.isArray(children)) {
        for (let i = 0; i < children.length; ++i) {
            appendChild(element, children[i]);
        }
    } else {
        appendChild(element, children);
    }
}

function appendChild(element: HTMLElement, child: Child) {
    if (!child) return;
    if (isFunction(child)) {
        let resolvedChild: HTMLElement | string;
        const computation = s.compute(() => {
            resolvedChild = child();
        });

        let childNode = isNode(resolvedChild) ? resolvedChild : document.createTextNode(resolvedChild);
        element.appendChild(childNode);

        if (computation.dependencies.length) {
            // Auto update in case children is a stream
            s.addTransform(computation.computedStream, () => {
                const oldChildNode = childNode;
                childNode = isNode(resolvedChild) ? resolvedChild : document.createTextNode(resolvedChild);
                element.replaceChild(childNode, oldChildNode);
            });
        }
    } else if (isNode(child)) {
        element.appendChild(child);
    } else {
        element.appendChild(document.createTextNode(child));
    }
}

export class ElementListMapper {
    modelsObs: ArrayObserver<any>;
    listRootElement: HTMLElement;
    elementCreator: ModelElementCreator;
    key: string;
    modelToElement: Map<any, HTMLElement>;
    constructor(listRootElement: HTMLElement, modelsObs: ArrayObserver<any>, elementCreator: ModelElementCreator, key?: string) {
        this.listRootElement = listRootElement;
        this.modelsObs = modelsObs;
        this.elementCreator = elementCreator;
        // TODO: What to do with key?
        this.key = key;
        this.modelToElement = new Map<any, HTMLElement>();
        modelsObs.addListener(this.onModelChange.bind(this));

        if (this.modelsObs.length) {
            const nodes = this.createElements(this.modelsObs.array, 0);
            this.listRootElement.appendChild(nodes);
        }
    }

    onModelChange (op: string, args: any[]) {
        switch(op) {
            case 'pop':
                this.listRootElement.removeChild(this.listRootElement.lastChild);
                break;
            case 'push': {
                const nodes = this.createElements(args, this.modelsObs.length - args.length);
                this.listRootElement.appendChild(nodes);
                break;
            }
            case 'reverse': {
                const frag = new DocumentFragment();
                while (this.listRootElement.lastChild) {
                    frag.appendChild(this.listRootElement.removeChild(this.listRootElement.lastChild));
                }
                this.listRootElement.appendChild(frag);
                break;
            };
            case 'splice':
                const childNodes = this.listRootElement.childNodes;
                const spliceStart = args[0] < 0 ? childNodes.length + args[0] : args[0];
                const deleteCount = args.length > 1 ? args[1] : childNodes.length - spliceStart;
                const deleteStop = spliceStart + deleteCount;
                for (let i = spliceStart; i < deleteStop && childNodes[spliceStart]; i++) {
                    this.listRootElement.removeChild(childNodes[spliceStart]);
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
                console.time('apply dom changes');
                const changes = args;
                for (let i = 0; i < changes.length; ++i) {
                    this.onModelChange(changes[i][0], changes[i][1]);
                }
                console.timeEnd('apply dom changes');
                break;
            }
        }
    }

    createElements(models: Array<any>, startIndex: number) : DocumentFragment | HTMLElement {
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

    createElement(model, index: number) : HTMLElement {
        const childNode = this.elementCreator(this.listRootElement, model, index);
        this.modelToElement.set(model, childNode);
        return childNode;
    }
}

export function elementList(tagName: string, attrs: Attrs, models: ArrayObserver<any>, nodeCreator: ModelElementCreator, key?: string) {
    const listRootElement = h(tagName, attrs);
    (parent as any)._elementList = new ElementListMapper(listRootElement, models, nodeCreator, key);
    return  listRootElement;
}

export function isElementList(nodeListElement: HTMLElement) : boolean {
    return !!((parent as any)._elementList);
}

export function getElementList(nodeListElement: HTMLElement): ElementListMapper {
    return (parent as any)._elementList;
}

export function selectTargetAttr(eventAttrName: string, functor: s.Stream | Functor1P) {
    return function (event) {
        return functor(event.target[eventAttrName]);
    }
}

export function select(condition: any, ifTrue: Child, ifFalse?: Child) {
    return expandValue(condition) ? expandValue(ifTrue) : (ifFalse && expandValue(ifFalse));
}