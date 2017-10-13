export function isFunction(obj): obj is Function { 
    return typeof obj === 'function'; 
}

export function isObject(obj): obj is Object {
    return typeof obj === 'object';
}

export function isString(obj): obj is string { 
    return typeof obj === 'string'; 
}

export function expandValue(value): any { 
    return isFunction(value) ? value() : value; 
}

export function remove(array: Array<any>, value) {
    const i = array.indexOf(value);
    if (i !== -1) {
        array.splice(i, 1);
    }
    return array;
}

export const isArray = Array.isArray;
