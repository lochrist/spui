import {remove} from './utils';
export type ArrayListener = (op: string, args: any[]) => void;
export class ObservableArray<T> extends Array<T> {
    listeners: ArrayListener[];
    changes: any[];
    constructor() {
        super();
        this.listeners = [];
        this.changes = null;
    }

    beginChanges() {
        this.changes = [];
    }

    endChanges() {
        if (this.changes) {
            this.emit('changes', this.changes);
        }
        this.changes = null;
    }

    addListener(callback: ArrayListener) {
        return this.listeners.push(callback);
    }

    removeListener(callback: ArrayListener) {
        return remove(this.listeners, callback);
    }

    emit (op: string, args: any[]) {
        for (const l of this.listeners) {
            l(op, args);
        }
    }
}

export function observableArray(): ObservableArray<any> {
    return new ObservableArray();
}

const mutables = 'pop push reverse splice shift sort unshift'.split(' ');
for (const method of mutables) {
    const originalMethod = Array.prototype[method];
    ObservableArray.prototype[method] = function (...args) {
        const returnValue = originalMethod.apply(this, args);
        if (this.changes === null) {
            this.emit(method, args);
        } else {
            this.changes.push([method, args]);
        }
        return returnValue;
    };
}