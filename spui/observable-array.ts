import {remove} from './utils';
export type Changes = Array<Array<any>>;
export type ArrayListener = (op: string, args: any[], opReturnValue: any) => void;

const mutables = 'pop push reverse splice shift sort unshift'.split(' ');
export class ArrayObserver<T> {
    array: T[];
    listeners: ArrayListener[];
    changes: Changes;
    constructor(array?: T[]) {
        this.array = array || [];
        this.listeners = [];
        this.changes = null;
    }

    get length () {
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

    remove(value: T) {
        const index = this.array.indexOf(value);
        this.splice(index, 1);
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
            console.log('emit changes: ', this.changes.length);
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

    logChange(method, returnValue, args) {
        if (this.changes === null) {
            this.emit(method, args, returnValue);
        } else {
            this.changes.push([method, args, returnValue]);
        }
    }

    emit(op: string, args: any[], opReturnValue?: any) {
        for (let i = 0; i < this.listeners.length; ++i) {
            this.listeners[i](op, args, opReturnValue);
        }
    }
}

export type FilterPredicate<T> = (value: T) => any;
export class Filter<T> {
    src: ArrayObserver<T>;
    filtered: ArrayObserver<T>;
    predicate: FilterPredicate<T>;
    constructor(src: ArrayObserver<T>, predicate: FilterPredicate<T>) {
        this.src = src;
        this.filtered = new ArrayObserver();
        this.predicate = predicate;

        const srcFiltered = this.src.array.filter(this.predicate);
        this.filtered.push(...srcFiltered);

        this.src.addListener(this.srcChanged.bind(this));
    }

    applyFilter(predicate: FilterPredicate<T> = null, reset: boolean = false): Changes {
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
                    } else {
                        this.filtered.splice(filterIndex, 0, srcValue);
                    }
                    ++filterIndex;
                } else {
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

            return this.filtered.changes;
        });
        return changes;
    }


    private srcChanged(op: string, args: any[], opReturnValue?: any) {
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
            case 'reverse': {
                if (this.filtered.length) {
                    this.filtered.reverse();
                }
                break;
            };
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
                    } else {
                        this.filtered.splice(filteredSpliceStart, filteredElementsToRemove.length);
                    }
                } else if (filteredElementsAdded && filteredElementsAdded.length) {
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
                    this.srcChanged(changes[i][0], changes[i][1]);
                }
                break;
            }
        }
    }
}