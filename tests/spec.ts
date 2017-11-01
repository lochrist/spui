import * as sp from '../spui/index';
import * as utils from '../spui/utils';

const h = sp.h;

function double(value) { 
    return value * 2;
}

describe('stream', function () {
    describe('value stream', function () {
        it('create no param', function () {
            let stream = sp.valueStream();
            expect(stream()).toBeUndefined();
        });

        it('create with value', function () {
            const value = 99;
            const stream = sp.valueStream(value);
            expect(stream()).toEqual(value);

            expect(stream._backingValue).toEqual(value);
            expect(stream._transform).toBeUndefined();
        });

        it('create with transform', function () {
            const value = 12;
            const stream = sp.valueStream(value, double);
            expect(stream()).toEqual(value * 2);
            expect(stream._transform).toEqual(double);
        });

        it('setter', function () {
            const stream = sp.valueStream(12);

            const value = 99;
            stream(value);
            expect(stream()).toEqual(value);
        });

        it ('add/remove listener', function () {
            const v = sp.valueStream(12);

            let result;
            function assignResult(value) { result = value; }

            const off = sp.addListener(v, assignResult);
            expect(utils.isFunction(off)).toEqual(true);

            const value = 99;
            v(99);
            expect(v()).toEqual(result);
            expect(v._listeners).toBeDefined();
            expect(v._listeners.length).toEqual(1);
            expect(v._listeners.indexOf(assignResult)).toEqual(0);

            off();
            expect(v._listeners.length).toEqual(0);

            sp.addListener(v, assignResult);
            expect(v._listeners.length).toEqual(1);
            sp.removeListener(v, assignResult);
            expect(v._listeners.length).toEqual(0);
        });

        it('map', function () {
            const value = 12;
            const v = sp.valueStream(value);
            const computed = sp.map(v, double);
            expect(computed !== v).toEqual(true);
            expect(v._listeners).toContain(computed);
            expect(computed()).toEqual(value * 2);
            expect(computed._transform).toEqual(double);
        });

        it ('computation', function () {
            const value1 = 12;
            const value2 = 99;
            const vs1 = sp.valueStream(value1);
            const vs2 = sp.valueStream(value2);

            const computation = sp.compute(() => {
                return vs1() + vs2();
            });

            const computedStream = computation.computedStream;
            expect(computation.computedStream).toBeDefined();
            expect(computation.dependencies.length).toEqual(2);

            expect(vs1._listeners).toContain(computedStream);
            expect(vs2._listeners).toContain(computedStream);
            expect(computedStream()).toEqual(value1 + value2);

            vs1(0);
            expect(computedStream()).toEqual(value2);

            vs2(7);
            expect(computedStream()).toEqual(7);

            // Computed is effectively a read only computed value
            computedStream(12);
            expect(computedStream()).toEqual(7);
        });
    });
});

describe('filter', function () {
    function isEven(value) {
        return value % 2 === 0;
    }

    function all(value) { 
        return true;
    }

    function none(value) {
        return false;
    }

    function isOdd(value) {
        return value % 2 === 1;
    }

    function divisibleBy3(value) {
        return value % 3 === 0;
    }

    function createThresholdPredicate(minValue, maxValue?) {
        return function (value) {
            return value >= minValue && (maxValue === undefined || value <= maxValue);
        };
    }

    function createSrc(srcValues: any[]) : sp.ObservableArray<any> {
        const src = new sp.ObservableArray<any>();
        src.push(...srcValues);
        return src;
    }

    function arrayEqual(a1, a2) {
        if (a1.length !== a2.length) {
            return false;
        }
        for (let i = 0; i < a1.length; ++i) {
            if (a1[i] !== a2[i])  {
                return false;
            }
        }
        return true;
    }

    function expectArrayObserverEqual(a1: sp.ObservableArray<any>, a2) {
        expect(arrayEqual(a1.array, a2)).toEqual(true);
    }

    it('create filter', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new sp.Filter(src, isEven);
        expect(filter.src).toEqual(src);
        expect(filter.predicate).toEqual(isEven);
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);
    });

    it('pop', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new sp.Filter(src, isEven);
        src.pop();
        expectArrayObserverEqual(filter.filtered, [2, 4]);
        src.pop();
        expectArrayObserverEqual(filter.filtered, [2, 4]);
    });

    it('push', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new sp.Filter(src, isEven);
        src.push(7, 8, 9, 10);
        expectArrayObserverEqual(filter.filtered, [2, 4, 6, 8, 10]);
    });

    it('reverse', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new sp.Filter(src, isEven);
        src.reverse();
        expectArrayObserverEqual(filter.filtered, [6, 4, 2]);
    });

    it('shift', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new sp.Filter(src, isEven);
        src.shift();
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);
        src.shift();
        expectArrayObserverEqual(filter.filtered, [4, 6]);
    });

    it('sort', function () {
        const src = createSrc([3, 2, 1, 6, 5, 4]);
        const filter = new sp.Filter(src, isEven);
        expectArrayObserverEqual(filter.filtered, [2, 6, 4]);
        src.sort();
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);
    });

    it('splice 1', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new sp.Filter(src, isEven);
        src.splice(3);
        expectArrayObserverEqual(filter.filtered, [2]);
    });

    it('splice 2', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new sp.Filter(src, isEven);
        src.splice(3, 2);
        expectArrayObserverEqual(filter.filtered, [2, 6]);
    });

    it('splice 3', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new sp.Filter(src, isEven);
        src.splice(-3, 2);
        expectArrayObserverEqual(filter.filtered, [2, 6]);
    });

    it('splice 4', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new sp.Filter(src, isEven);
        src.splice(3, 0, 11, 22, 33, 44);
        expectArrayObserverEqual(filter.filtered, [2, 22, 44, 4, 6]);
    });

    it('splice 5', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new sp.Filter(src, isEven);
        src.splice(-3, 1, 11, 22, 33, 44);
        expectArrayObserverEqual(filter.filtered, [2, 22, 44, 6]);
    });

    it('unshift', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new sp.Filter(src, isEven);
        src.unshift();
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);
        src.unshift(11, 22, 33, 44);
        expectArrayObserverEqual(filter.filtered, [22, 44, 2, 4, 6]);
    });

    it('changes', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new sp.Filter(src, isEven);
        
        src.applyChanges(() => {
            src.push(-1, -2, -3, -4);
            src.sort();
            src.reverse();
        });

        expectArrayObserverEqual(filter.filtered, [6, 4, 2, -4, -2]);
    });

    it('apply filter with predicate at construction', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new sp.Filter(src, isEven);
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);

        let changes = filter.applyFilter();
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);
        expect(changes.length).toEqual(0);
    });

    it('apply filter 1', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new sp.Filter(src, all);
        expectArrayObserverEqual(filter.filtered, [1, 2, 3, 4, 5, 6]);

        let changes = filter.applyFilter(isEven);
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);
        // Need to remove 1, 3, 5
        expect(changes.length).toEqual(3);

        changes = filter.applyFilter(isOdd);
        expectArrayObserverEqual(filter.filtered, [1, 3, 5]);
        // Add 1, remove 2, add 3, remove 4, add 5, remove 6
        expect(changes.length).toEqual(6);
    });

    it('apply filter 2', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new sp.Filter(src, none);
        expectArrayObserverEqual(filter.filtered, []);

        let changes = filter.applyFilter(isEven);
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);
        // add 2, add, 4, add 6
        expect(changes.length).toEqual(3);
    });

    it('apply filter 3', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new sp.Filter(src, all);

        let changes = filter.applyFilter(createThresholdPredicate(2));
        expectArrayObserverEqual(filter.filtered, [2, 3, 4, 5, 6]);
        // Remove 1
        expect(changes.length).toEqual(1);

        changes = filter.applyFilter(createThresholdPredicate(3));
        expectArrayObserverEqual(filter.filtered, [3, 4, 5, 6]);
        // Remove 2
        expect(changes.length).toEqual(1);

        changes = filter.applyFilter(createThresholdPredicate(1, 4));
        expectArrayObserverEqual(filter.filtered, [1, 2, 3, 4]);
        // Add 1, add 2, remove 5, remove 6
        expect(changes.length).toEqual(4);
    });

    it('apply filter 4', function () {
        // TODO: implement more flexible filter that bunches multi splice
	
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new sp.Filter(src, all);

        let changes = filter.applyFilter(createThresholdPredicate(4));
        expectArrayObserverEqual(filter.filtered, [4, 5, 6]);
        // Remove 1, 2, 3
        expect(changes.length).toEqual(3);

        changes = filter.applyFilter(createThresholdPredicate(1, 3));
        expectArrayObserverEqual(filter.filtered, [1, 2, 3]);
        // add 1, 2, 3, remove 4, 5, 6
        expect(changes.length).toEqual(6);
    });

    it('apply filter reset', function () {
        const src = createSrc([1, 2, 3, 4, 5, 6]);
        const filter = new sp.Filter(src, isEven);
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);

        let changes = filter.applyFilter(null, true);
        expect(changes.length).toEqual(2);
        expectArrayObserverEqual(filter.filtered, [2, 4, 6]);

        changes = filter.applyFilter(divisibleBy3, true);
        expect(changes.length).toEqual(2);
        expectArrayObserverEqual(filter.filtered, [3, 6]);

        changes = filter.applyFilter(isOdd, true);
        expect(changes.length).toEqual(2);
        expectArrayObserverEqual(filter.filtered, [1, 3, 5]);
    });
});

let _id = 0;
function getId() {
    return 'i' + (_id++);
}

function itt (title, itExecutor) {
    it(title, () => {
        itExecutor(title);
    })
}

function xitt(title, itExecutor) {
    xit(title, () => {
        itExecutor(title);
    })
}

describe('dom generation', function () {
    let testDomRoot: HTMLElement;
    beforeAll(function () {
        testDomRoot = document.createElement('div');
        testDomRoot.setAttribute('style', 'padding-top: 10px;');
        document.body.appendChild(testDomRoot);
    });

    function createElement(tagName, attrs, children?) {
        const id = getId();
        attrs.id = id;
        if (tagName !== 'div') {
            attrs.style = attrs.style || 'display: block;';
        }
        const el = h(tagName, attrs, children);
        expect(el instanceof HTMLElement).toEqual(true);
        testDomRoot.appendChild(el);
        expect(el as Element).toEqual(document.querySelector('#' + id));

        return el;
    }

    describe('create elements (static attributes)', function () {
        itt('empty', function (title) {
            const el = h('div');
            expect(el instanceof HTMLElement).toEqual(true);
            testDomRoot.appendChild(el);
            expect(testDomRoot.firstChild).toEqual(el);
        });

        itt('with single children text node', function (title) {
            const el = createElement('div', {}, title);
            expect(el.textContent).toEqual(title);
        });

        itt('with style', function (title) {
            const el = createElement('div', {style: 'color: blue;'}, title);
            expect(el.style['color']).toEqual('blue');
        });

        itt('with style object', function (title) {
            const el = createElement('div', { style: {color: 'blue'} }, title);
            expect(el.style['color']).toEqual('blue');
        });

        itt('with class', function (title) {
            const c = 'dummy';
            const el = createElement('div', { class: c }, title);
            expect(el.className).toEqual(c);
        });

        itt('with class object', function (title) {
            const c = { 'blue-text': true, ping: false };
            const el = createElement('div', { class: c }, title);
            expect(el.className).toEqual('blue-text');
        });

        itt('with class object2', function (title) {
            const c = { 'blue-text': true, pong: true, ping: false };
            const el = createElement('div', { class: c }, title);
            expect(el.className).toEqual('blue-text pong');
        });

        itt('with event', function (title) {
            let wasClicked = false;
            const onclick = () => {
                wasClicked = true;
                console.log('clicked!')
            };
            const el = createElement('button', { onclick }, title);
            el.click();
            expect(wasClicked).toEqual(true);
        });

        itt('with boolean attributes', function (title) {
            const el = createElement('input', { disabled: true, readonly: false }, title);
            expect(el.attributes['disabled']).toBeDefined();
            expect(el.attributes['readonly']).toBeUndefined();
        });
    });

    describe('create elements (attributes auto-binding)', function () {
        itt('with style', function (title) {
            const style = sp.valueStream('color: blue;');
            const el = createElement('div', { style: style }, title);
            expect(el.style['color']).toEqual('blue');

            style('color: green');
            expect(el.style['color']).toEqual('green');
        });

        itt('with style object', function (title) {
            const color = sp.valueStream('blue');
            const fontStyle = sp.valueStream('italic');
            const el = createElement('div', { style: { color, 'font-style': fontStyle } }, title);
            expect(el.style['color']).toEqual('blue');
            expect(el.style['font-style']).toEqual('italic');

            color('green');
            expect(el.style['color']).toEqual('green');

            fontStyle('oblique');
            expect(el.style['font-style']).toEqual('oblique');
        });

        itt('with class', function (title) {
            const c = sp.valueStream('blue-text');
            const el = createElement('div', { class: () => 'pow ' + c() }, title);
            expect(el.className).toEqual('pow blue-text');

            c('green-text');
            expect(el.className).toEqual('pow green-text');
        });

        itt('with class object', function (title) {
            const blueTextEnabled = sp.valueStream(true);
            const pingEnabled = sp.valueStream(false);
            const c = { 'blue-text': blueTextEnabled, ping: pingEnabled };
            const el = createElement('div', { class: c }, title);
            expect(el.className).toEqual('blue-text');

            blueTextEnabled(false);
            expect(el.className).toEqual('');

            pingEnabled(true);
            expect(el.className).toEqual('ping');
        });

        itt('with boolean attributes', function (title) {
            const isDisabled = sp.valueStream(true);
            const isReadonly = sp.valueStream(false);

            const el = createElement('input', { disabled: isDisabled, readonly: isReadonly }, title);
            expect(el.attributes['disabled']).toBeDefined();
            expect(el.attributes['readonly']).toBeUndefined();

            isDisabled(false);
            expect(el.attributes['disabled']).toBeUndefined();

            isReadonly(true);
            expect(el.attributes['readonly']).toBeDefined();
        });

        itt('with value', function (title) {
            const value = sp.valueStream('this is my value');
            const el = createElement('input', { value }, title) as HTMLInputElement;
            expect(el.value).toEqual('this is my value');
            el.value = 'dummy-value';

            value('new value');
            expect(el.value).toEqual('new value');
        });
    });

    describe('create elements with children (static)', function () {
        itt('with multiple text node', function (title) {
            const childrenText = ['this', ' is', ' something!'];
            const el = createElement('div', {}, childrenText);
            expect(el.children.length).toEqual(0);
            expect(el.childNodes.length).toEqual(3);
            expect(el.textContent).toEqual(childrenText.join(''));
        });

        itt('with multiple number node', function (title) {
            const childrenText = [7, 69, 666];
            const el = createElement('div', {}, childrenText);
            expect(el.children.length).toEqual(0);
            expect(el.childNodes.length).toEqual(3);
            expect(el.textContent).toEqual(childrenText.join(''));
        });

        itt('with multiple children', function (title) {
            const childrenText = ['this is', ' something'];
            const el = createElement('div', {}, [
                childrenText[0],
                h('button', {}, 'this is a button'),
                childrenText[1]
            ]);
            expect(el.children.length).toEqual(1);
            expect(el.childNodes.length).toEqual(3);
            expect(el.childNodes[0].nodeValue).toEqual(childrenText[0]);
            expect(el.childNodes[1].nodeName).toEqual('BUTTON');
            expect(el.childNodes[1].textContent).toEqual('this is a button');
            expect(el.childNodes[2].nodeValue).toEqual(childrenText[1]);
        });
    });

    describe('create elements with children (auto-binding)', function () {
        itt('single child', function (title) {
            const values = ['value1', 'value2', 'value3']
            const singleChildValue = sp.valueStream(values[0]);
            const el = createElement('div', {}, parentElement => singleChildValue());
            expect(el.textContent).toEqual(values[0]);

            singleChildValue(values[1]);
            expect(el.textContent).toEqual(values[1]);

            singleChildValue(title);
            expect(el.textContent).toEqual(title);
        });

        itt('3 text children', function (title) {
            const values = ['value1', 'value2', 'value3']
            const values2 = ['value11', 'value22', 'value32']
            const nodeData1 = sp.valueStream(values[0]);
            const nodeData2 = sp.valueStream(values[1]);
            const nodeData3 = sp.valueStream(values[2]);
            const el = createElement('div', {}, [
                parentElement => nodeData1(),
                parentElement => nodeData2(),
                parentElement => nodeData3(),
            ]);
            expect(el.childNodes.length).toEqual(3);
            expect(el.childNodes[0].nodeValue).toEqual(values[0]);

            nodeData1(values2[0]);
            expect(el.childNodes[0].nodeValue).toEqual(values2[0]);

            nodeData3(values2[2]);
            expect(el.childNodes[2].nodeValue).toEqual(values2[2]);
        });

        itt('children attr', function (title) {
            const isDisabled = sp.valueStream(true);
            const text = sp.valueStream('before');
            let el;
            const root = createElement('div', {}, 
                el = h('div', {disabled: isDisabled}, () => text())
            );

            expect(el.textContent).toEqual(text());
            expect(el.attributes['disabled']).toBeDefined();

            isDisabled(false);
            expect(el.attributes['disabled']).toBeUndefined();

            text(title);
            expect(el.textContent).toEqual(title);
        });

        itt('children stream attr', function (title) {
            const isDisabled = sp.valueStream(true);
            const text = sp.valueStream('before');
            let el;
            const root = createElement('div', {},
                el = h('div', { disabled: isDisabled }, text)
            );

            expect(el.textContent).toEqual(text());
            expect(el.attributes['disabled']).toBeDefined();

            isDisabled(false);
            expect(el.attributes['disabled']).toBeUndefined();

            text(title);
            expect(el.textContent).toEqual(title);
        });
    });

    interface NodeListData {
        nodeList: HTMLElement,
        models: sp.ObservableArray<any>
    }
    function validateDomList(nld: NodeListData) {
        expect(nld.models.length).toEqual(nld.nodeList.childNodes.length);
        for (let i = 0; i < nld.models.length; ++i) {
            const model = nld.models.array[i];
            const node = nld.nodeList.childNodes[i];
            expect(model.domId).toEqual(node.attributes['id'].value);
        }
    }

    function setupNodeList(title: string, noIndexCheck = false): NodeListData {
        const models = new sp.ObservableArray<any>();
        const id = getId();
        const attrs = {
            id: id
        };
        let domList;
        const el = h('div', attrs, [
            title + ' : ' + id,
            domList = sp.elementList('ul', attrs, models, (listNode, model, index) => {
                if (!noIndexCheck) {
                    const actualModelIndex = models.array.indexOf(model);
                    expect(actualModelIndex).toEqual(index);
                }
                return h('div', { id: model.domId, class: model.class }, model.text);
            })
        ])
        expect(el instanceof HTMLElement).toEqual(true);
        testDomRoot.appendChild(el);
        expect(el as Element).toEqual(document.querySelector('#' + id));
        const d = {
            nodeList: domList,
            models,
        };
        validateDomList(d);
        return d
    }

    describe('node-list', function () {
        function createModel() {
            const domId = getId();
            const model = {id: _id, domId, text: 'item: ' + domId};
            return model;
        }

        itt('push single element', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel());
            validateDomList(d);
        });

        itt('push multiple element', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel());
            d.models.push(createModel());
            d.models.push(createModel());
            validateDomList(d);
        });

        itt('push multi', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel(), createModel());
            validateDomList(d);
        });

        itt('pop', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel());
            validateDomList(d);
            d.models.pop();
            validateDomList(d);
        });

        itt('reverse', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel(), createModel());
            validateDomList(d);
            d.models.reverse();
            validateDomList(d);
        });

        itt('splice delete til end', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel(), createModel());
            d.models.splice(1);
            validateDomList(d);
        });

        itt('splice delete 2', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel(), createModel(), createModel());
            d.models.splice(1, 2);
            validateDomList(d);
        });

        itt('splice delete and add', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel(), createModel(), createModel());
            d.models.splice(1, 2, createModel(), createModel());
            validateDomList(d);
        });

        itt('splice add', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel(), createModel(), createModel());
            d.models.splice(1, 0, createModel(), createModel());
            validateDomList(d);
        });

        itt('shift', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel(), createModel());
            d.models.shift();
            validateDomList(d);
        });

        itt('sort', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel(), createModel(), createModel());
            d.models.array[0].order = 10;
            d.models.array[1].order = 5;
            d.models.array[2].order = 20;
            d.models.array[3].order = 15;

            d.models.sort((a, b) => a.order - b.order);
            validateDomList(d);
        });

        itt('unshift single', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel());
            d.models.unshift(createModel());
            validateDomList(d);
        });

        itt('unshift multiple', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel(), createModel());
            d.models.unshift(createModel(), createModel());
            validateDomList(d);
        });

        itt('changes: push + unshift ', function (title) {
            // No index check on batch operations
            const d = setupNodeList(title, true);
            d.models.applyChanges(() => {
                d.models.push(createModel(), createModel());
                d.models.unshift(createModel(), createModel());
            });
            
            validateDomList(d);
        });

        itt('changes: swap', function (title) {
            // No index check on batch operations
            const d = setupNodeList(title, true);
            d.models.applyChanges(() => {
                d.models.push(createModel(), createModel(), createModel(), createModel());
                const a = d.models.array[1];
                const b = d.models.array[2];
                d.models.splice(1, 1, b);
                d.models.splice(2, 1, a);
            });

            validateDomList(d);
        });
    });

    describe('node-list (auto-binding)', function () {
        function createModel() {
            const domId = getId();
            const textData = sp.valueStream('item: ' + domId);
            const model = { id: _id, domId, text: () => textData(), class: sp.valueStream(domId), textData };
            return model;
        }

        itt('modify class', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel());
            validateDomList(d);

            d.models.array[0].class('new-class');
            expect(d.nodeList.children[0].className).toEqual('new-class');
        });

        itt('modify text', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel());
            validateDomList(d);

            d.models.array[0].textData('new-text');
            expect(d.nodeList.children[0].textContent).toEqual('new-text');
        });
    });

});
