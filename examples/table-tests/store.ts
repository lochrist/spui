import * as sp from '../../spui/index';

function random(max) {
    return Math.round(Math.random() * 1000) % max;
}

const adjectives = ['pretty', 'large', 'big', 'small', 'tall', 'short', 'long', 'handsome', 'plain', 'quaint', 'clean', 'elegant', 'easy', 'angry', 'crazy', 'helpful', 'mushy', 'odd', 'unsightly', 'adorable', 'important', 'inexpensive', 'cheap', 'expensive', 'fancy'];
const colours = ['red', 'yellow', 'blue', 'green', 'pink', 'brown', 'purple', 'brown', 'white', 'black', 'orange'];
const nouns = ['table', 'chair', 'house', 'bbq', 'desk', 'car', 'pony', 'cookie', 'sandwich', 'burger', 'pizza', 'mouse', 'keyboard'];
export class Store {
    backup: any[];
    data: sp.ArrayObserver<any>;
    selected: sp.Stream;
    id: number;
    constructor() {
        this.data = new sp.ArrayObserver<any>();
        this.selected = sp.valueStream();
        this.id = 1;
    }
    buildData(count = 1000) {
        const data = [];
        for (let i = 0; i < count; i++) { 
            const label = adjectives[random(adjectives.length)] + ' ' + colours[random(colours.length)] + ' ' + nouns[random(nouns.length)];
            data.push({ 
                id: this.id++,
                label: sp.valueStream(label)
            }); 
        }
        return data;
    }
    updateData(mod = 10) {
        this.data.applyChanges(() => {
            for (let i = 0; i < this.data.length; i += 10) {
                // this.data[i] = Object.assign({}, this.data[i], { label: this.data[i].label + ' !!!' });
                this.data.array[i].label(this.data.array[i].label() + ' !!!');
            }
        });
    }
    delete(id) {
        const idx = this.data.array.findIndex(d => d.id == id);
        this.data.splice(idx, 1);
        return this;
    }
    run() {
        this.data.push.apply(this.data, this.buildData());
        this.selected(undefined);
    }
    add() {
        this.data.push.apply(this.data, this.buildData(1000));
    }
    update() {
        this.updateData();
    }
    select(id) {
        this.selected(id);
    }
    runLots() {
        this.data.push.apply(this.data, this.buildData(10000));
        this.selected(undefined);
    }
    clear() {
        this.data.splice(0);
        this.selected(undefined);
    }
    swapRows() {
        if (this.data.length > 10) {
            this.data.applyChanges(() => {
                const a = this.data[4];
                const b = this.data[9];
                this.data.splice(4, 1, b);
                this.data.splice(9, 1, a);
            });
        }
    }
}
