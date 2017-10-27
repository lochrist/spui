import { isNode, isFunction, isString, isObject, expandValue, StringKeyMap} from './utils';
import * as s from './stream';
import {ObservableArray} from './observable-array';

export type AttrGenerator = (HTMLElement) => Object;
export type ElementGenerator = (HTMLElement) => HTMLElement;
export type StringGenerator = (HTMLElement) => string;
export type Child = string | HTMLElement | ElementGenerator | StringGenerator;
export type Children = Array<any> | Child;
export type NodeCreator = (listRootNode: HTMLElement, model: any, indeX: number) => HTMLElement;

export function h(tagName: string, attrs?: AttrGenerator | Object, children?: Children) {
    const element = document.createElement(tagName);
    if (attrs) {
        setAttrs(element, attrs);
    }

    if (children) {
        setChildren(element, children);
    }
    return element;
}

function setAttrs(element: HTMLElement, attr: StringKeyMap<any>) {
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
        case 'value':
            // value is handled differently than attributes. the value attributes only indicates the "initial" value. 
            // You need to use "value" property to actually modify the node.
            (element as any).value = value;
        break;
        default: 
            if (value === false) {
                element.removeAttribute(attr);
            } else {
                // If value is a boolean, set it to "" to only enable it in DOM.
                element.setAttribute(attr, value === true ? "" : value);
            }
    }
}

function setClass(element: HTMLElement, className: string | Object) {
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

function setStyle(element: HTMLElement, style: Object | string, value?) {
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
    if (isFunction(child)) {
        let resolvedChild: HTMLElement | string;
        const computation = s.computeStream(() => {
            resolvedChild = child(element);
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

export class SyncNodeList {
    models: ObservableArray<any>;
    listRootNode: HTMLElement;
    nodeCreator: NodeCreator;
    key: string;
    modelToNode: Map<any, HTMLElement>;
    updateFunc: (HTMLElement) => void;
    constructor(listRootNode: HTMLElement, models: ObservableArray<any>, nodeCreator: NodeCreator, key?: string) {
        this.listRootNode = listRootNode;
        this.models = models;
        this.nodeCreator = nodeCreator;
        // TODO: What to do with key?
        this.key = key;
        this.modelToNode = new Map<any, HTMLElement>();
        models.addListener(this.onModelChange.bind(this));

        if (this.models.length) {
            const nodes = this.createNodes(this.models, 0);
            this.listRootNode.appendChild(nodes);
        }
    }

    onModelChange (op: string, args: any[]) {
        switch(op) {
            case 'pop':
                this.listRootNode.removeChild(this.listRootNode.lastChild);
                break;
            case 'push': {
                const nodes = this.createNodes(args, this.models.length - args.length);
                this.listRootNode.appendChild(nodes);
                break;
            }
            case 'reverse': {
                const frag = new DocumentFragment();
                while (this.listRootNode.lastChild) {
                    frag.appendChild(this.listRootNode.removeChild(this.listRootNode.lastChild));
                }
                this.listRootNode.appendChild(frag);
                break;
            };
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

    createNodes(models: Array<any>, startIndex: number) : DocumentFragment | HTMLElement {
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

    createNode(model, index: number) : HTMLElement {
        const childNode = this.nodeCreator(this.listRootNode, model, index);
        this.modelToNode.set(model, childNode);
        return childNode;
    }
}

export function nodeList(tagName: string, attrs: AttrGenerator | Object = null, models: ObservableArray<any>, nodeCreator: NodeCreator, key?: string) {
    const listRootNode = h(tagName, attrs);
    (parent as any)._nodeList = new SyncNodeList(listRootNode, models, nodeCreator, key);
    return  listRootNode;
}

export function getNodeList(nodeListElement: HTMLElement) : SyncNodeList {
    return (parent as any)._nodeList;
}

export function eventTarget(eventAttrName: string, stream: s.Stream | s.Transform) {
    return function (event) {
        return stream(event.target[eventAttrName]);
    }
}
