import {isFunction} from '../spui/utils';
import {h, nodeList} from '../spui/dom';
import * as s from '../spui/stream';
import { observableArray, ObservableArray} from '../spui/observable-array';

function double(value) { 
    return value * 2; 
}

describe('stream', function () {
    describe('value stream', function () {
        it('create no param', function () {
            let stream = s.createValueStream();
            expect(stream()).toBeUndefined();
        });

        it('create with value', function () {
            const value = 99;
            const stream = s.createValueStream(value);
            expect(stream()).toEqual(value);

            expect(stream._backingValue).toEqual(value);
            expect(stream._listeners).toBeUndefined();
            expect(stream._transform).toBeUndefined();
        });

        it('create with transform', function () {
            const value = 12;
            const stream = s.createValueStream(value, double);
            expect(stream()).toEqual(value * 2);
            expect(stream._transform).toEqual(double);
        });

        it('setter', function () {
            const stream = s.createValueStream(12);

            const value = 99;
            stream(value);
            expect(stream()).toEqual(value);
        });

        it ('add/remove listener', function () {
            const v = s.createValueStream(12);

            let result;
            function assignResult(value) { result = value; }

            const off = s.addListener(v, assignResult);
            expect(isFunction(off)).toEqual(true);

            const value = 99;
            v(99);
            expect(v()).toEqual(result);
            expect(v._listeners).toBeDefined();
            expect(v._listeners.length).toEqual(1);
            expect(v._listeners.indexOf(assignResult)).toEqual(0);

            off();
            expect(v._listeners.length).toEqual(0);
        });

        it('map', function () {
            const value = 12;
            const v = s.createValueStream(value);
            const computed = s.map(v, double);
            expect(computed !== v).toEqual(true);
            expect(v._listeners).toContain(computed);
            expect(computed()).toEqual(value * 2);
            expect(computed._transform).toEqual(double);
        });

        it ('computation', function () {
            const value1 = 12;
            const value2 = 99;
            const vs1 = s.createValueStream(value1);
            const vs2 = s.createValueStream(value2);

            const computation = s.computeStream(() => {
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
            const style = s.createValueStream('color: blue;');
            const el = createElement('div', { style: style }, title);
            expect(el.style['color']).toEqual('blue');

            style('color: green');
            expect(el.style['color']).toEqual('green');
        });

        itt('with style object', function (title) {
            const color = s.createValueStream('blue');
            const fontStyle = s.createValueStream('italic');
            const el = createElement('div', { style: { color, 'font-style': fontStyle } }, title);
            expect(el.style['color']).toEqual('blue');
            expect(el.style['font-style']).toEqual('italic');

            color('green');
            expect(el.style['color']).toEqual('green');

            fontStyle('oblique');
            expect(el.style['font-style']).toEqual('oblique');
        });

        itt('with class', function (title) {
            const c = s.createValueStream('blue-text');
            const el = createElement('div', { class: () => 'pow ' + c() }, title);
            expect(el.className).toEqual('pow blue-text');

            c('green-text');
            expect(el.className).toEqual('pow green-text');
        });

        itt('with class object', function (title) {
            const blueTextEnabled = s.createValueStream(true);
            const pingEnabled = s.createValueStream(false);
            const c = { 'blue-text': blueTextEnabled, ping: pingEnabled };
            const el = createElement('div', { class: c }, title);
            expect(el.className).toEqual('blue-text');

            blueTextEnabled(false);
            expect(el.className).toEqual('');

            pingEnabled(true);
            expect(el.className).toEqual('ping');
        });

        itt('with boolean attributes', function (title) {
            const isDisabled = s.createValueStream(true);
            const isReadonly = s.createValueStream(false);

            const el = createElement('input', { disabled: isDisabled, readonly: isReadonly }, title);
            expect(el.attributes['disabled']).toBeDefined();
            expect(el.attributes['readonly']).toBeUndefined();

            isDisabled(false);
            expect(el.attributes['disabled']).toBeUndefined();

            isReadonly(true);
            expect(el.attributes['readonly']).toBeDefined();
        });

        itt('with value', function (title) {
            const value = s.createValueStream('this is my value');
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
            const singleChildValue = s.createValueStream(values[0]);
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
            const nodeData1 = s.createValueStream(values[0]);
            const nodeData2 = s.createValueStream(values[1]);
            const nodeData3 = s.createValueStream(values[2]);
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
            const isDisabled = s.createValueStream(true);
            const text = s.createValueStream('before');
            let el;
            const root = createElement('div', {}, 
                el = h('div', {disabled: isDisabled}, parent => text())
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
        models: ObservableArray<any>
    }
    function validateDomList(nld: NodeListData) {
        expect(nld.models.length).toEqual(nld.nodeList.childNodes.length);
        for (let i = 0; i < nld.models.length; ++i) {
            const model = nld.models[i];
            const node = nld.nodeList.childNodes[i];
            expect(model.domId).toEqual(node.attributes['id'].value);
        }
    }

    function setupNodeList(title: string, noIndexCheck = false): NodeListData {
        const models = observableArray();
        const id = getId();
        const attrs = {
            id: id
        };
        let domList;
        const el = h('div', attrs, [
            title + ' : ' + id,
            domList = nodeList('ul', attrs, models, (listNode, model, index) => {
                if (!noIndexCheck) {
                    const actualModelIndex = models.indexOf(model);
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
            d.models[0].order = 10;
            d.models[1].order = 5;
            d.models[2].order = 20;
            d.models[3].order = 15;

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
                const a = d.models[1];
                const b = d.models[2];
                d.models.splice(1, 1, b);
                d.models.splice(2, 1, a);
            });

            validateDomList(d);
        });
    });

    describe('node-list (auto-binding)', function () {
        function createModel() {
            const domId = getId();
            const textData = s.createValueStream('item: ' + domId);
            const model = { id: _id, domId, text: () => textData(), class: s.createValueStream(domId), textData };
            return model;
        }

        itt('modify class', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel());
            validateDomList(d);

            d.models[0].class('new-class');
            expect(d.nodeList.children[0].className).toEqual('new-class');
        });

        itt('modify text', function (title) {
            const d = setupNodeList(title);
            d.models.push(createModel());
            validateDomList(d);

            d.models[0].textData('new-text');
            expect(d.nodeList.children[0].textContent).toEqual('new-text');
        });
    });

});
