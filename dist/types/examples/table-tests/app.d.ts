import { Store } from './store';
export declare class App {
    store: Store;
    tableEl: HTMLElement;
    rootViewEl: HTMLElement;
    selectedElement: HTMLElement;
    constructor({store}: {
        store: any;
    });
    buildView(): void;
    add(): void;
    remove(id: any): void;
    select(id: any): void;
    run(): void;
    update(): void;
    runLots(): void;
    clear(): void;
    swapRows(): void;
}
