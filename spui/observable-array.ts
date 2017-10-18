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

    applyChanges(changeFunctor: () => any) {
        this.changes = [];
        let result;
        try {
            result = changeFunctor();
        } catch (e) {
            this.changes = null;
            throw e;
        }
        if (this.changes) {
            this.emit('changes', this.changes);
        }
        this.changes = null;
        return result;
    }

    addListener(callback: ArrayListener) {
        return this.listeners.push(callback);
    }

    removeListener(callback: ArrayListener) {
        return remove(this.listeners, callback);
    }

    emit (op: string, args: any[]) {
        for (let i = 0; i < this.listeners.length; ++i) {
            this.listeners[i](op, args);
        }
    }
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