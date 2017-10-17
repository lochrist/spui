import {Store} from './store';
import {h, nodeList, getNodeList} from '../../spui/dom';
import * as s from '../../spui/stream';

const performance = window.performance;
const setTimeout = window.setTimeout;

let startTime;
let lastMeasure;

const startMeasure = (name) => {
    startTime = performance.now();
    lastMeasure = name;
};

const stopMeasure = () => {
    const last = lastMeasure;

    if (lastMeasure) {
        setTimeout(() => {
            lastMeasure = null;
            const stop = performance.now();
            console.log(last + ' took ' + (stop - startTime));
        }, 0);
    }
};

export class App {
    store: Store;
    tableEl: HTMLElement;
    rootViewEl: HTMLElement;
    selectedElement: HTMLElement;
    constructor({ store }) {
        this.store = store;
        this.buildView();
        this.selectedElement = null;
    }

    buildView () {
        this.rootViewEl = h('div', {class: 'container'}, [
            h('div', {class: 'jumbotron'},
                h('div', {class: 'row'}, [
                    h('div', {class: 'col-md-6'},
                        h('h1', {}, 'SPUI')
                    ),
                    h('div', {class: 'col-md-6'},
                        h('div', {class: 'row'}, [
                            h('div', {class: 'col-sm-6 smallpad'},
                                h('button', { id: 'run', class: 'btn btn-primary btn-block', type: 'button', onclick: e => this.run()},
                                    'Create 1,000 rows'
                                )
                            ),
                            h('div', {class: 'col-sm-6 smallpad'},
                                h('button', {id: 'runlots', class: 'btn btn-primary btn-block', type: 'button', onclick: e => this.runLots() },
                                    'Create 10,000 rows'
                                )
                            ),
                            h('div', { class: 'col-sm-6 smallpad' },
                                h('button', { id: 'add', class: 'btn btn-primary btn-block', type: 'button', onclick: e => this.add() },
                                    'Append 1,000 rows'
                                )
                            ),
                            h('div', { class: 'col-sm-6 smallpad' },
                                h('button', { id: 'update', class: 'btn btn-primary btn-block', type: 'button', onclick: e => this.update() },
                                    'Update every 10th row'
                                )
                            ),
                            h('div', { class: 'col-sm-6 smallpad' },
                                h('button', { id: 'clear', class: 'btn btn-primary btn-block', type: 'button', onclick: e => this.clear() },
                                    'Clear'
                                )
                            ),
                            h('div', { class: 'col-sm-6 smallpad' },
                                h('button', { id: 'swaprows', class: 'btn btn-primary btn-block', type: 'button', onclick: e => this.swapRows() },
                                    'Swap'
                                )
                            )
                        ])
                    )
                ])
            ),

            // TODO handle selected
            h('table', {class: 'table table-hover table-striped test-data'},
                this.tableEl = nodeList('tbody', {}, this.store.data, (tableElement, data) => {
                    return h('tr', {}, [
                        h('td', {class: 'col-md-1'}, data.id),
                        h('td', {class: 'col-md-4'},
                            h('a', { onclick: e => this.select(data.id) }, () => data.label())
                        ),
                        h('td', {class: 'col-md-1'},
                            h('a', { onclick: e => this.remove(data.id) },
                                h('span', {class: 'glyphicon glyphicon-remove', 'aria-hidden': true })
                            )
                        ),
                        h('td', {class: 'col-md-6'})
                    ]);
                })
            ),
            h('span', {class: 'preloadicon glyphicon glyphicon-remove', 'aria-hidden': true })
        ]);

        s.map(this.store.selected, selectedId => {
            if (this.selectedElement) {
                this.selectedElement.className = '';
            }

            if (selectedId !== undefined) {
                const nodeList = getNodeList(this.tableEl);
                const selectedModel = this.store.data.find(model => model.id === selectedId);
                this.selectedElement = nodeList.modelToNode.get(selectedModel);
                this.selectedElement.className = 'danger';
            }
        });
    }

    add() {
        startMeasure('add');
        this.store.add();
        stopMeasure();
    }
    remove(id) {
        startMeasure('remove');
        this.store.delete(id);
        stopMeasure();
    }
    select(id) {
        startMeasure('select');
        this.store.select(id);
        stopMeasure();
    }
    run() {
        startMeasure('run');
        this.store.run();
        stopMeasure();
    }
    update() {
        startMeasure('update');
        this.store.update();
        stopMeasure();
    }
    runLots() {
        startMeasure('runLots');
        this.store.runLots();
        stopMeasure();
    }
    clear() {
        startMeasure('clear');
        this.store.clear();
        stopMeasure();
    }
    swapRows() {
        startMeasure('swapRows');
        this.store.swapRows();
        stopMeasure();
    }
}
