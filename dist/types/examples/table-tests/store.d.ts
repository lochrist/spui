import * as sp from '../../spui/index';
export declare class Store {
    backup: any[];
    data: sp.ObservableArray<any>;
    selected: sp.Stream;
    id: number;
    constructor();
    buildData(count?: number): any[];
    updateData(mod?: number): void;
    delete(id: any): this;
    run(): void;
    add(): void;
    update(): void;
    select(id: any): void;
    runLots(): void;
    clear(): void;
    swapRows(): void;
}
