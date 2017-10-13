import {isFunction} from '../spui/utils';
import {h} from '../spui/h';
import * as s from '../spui/stream';

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

describe('dom generation', function () {
    describe('create element with static attributes', function () {
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

        itt('empty', function (title) {
            const el = h('div');
            expect(el instanceof HTMLElement).toEqual(true);
            testDomRoot.appendChild(el);
            expect(testDomRoot.firstChild).toEqual(el);
        });

        itt('with text node', function (title) {
            const el = createElement('div', {}, title);
            expect(el.textContent).toEqual(title);
        });

        itt('with style', function (title) {
            const el = createElement('div', {style: 'color: red;'}, title);
            expect(el.style['color']).toEqual('red')
        });

        itt('with style object', function (title) {
            const el = createElement('div', { style: {color: 'red'} }, title);
            expect(el.style['color']).toEqual('red')
        });

        itt('with class', function (title) {
            const c = 'dummy';
            const el = createElement('div', { class: c }, title);
            expect(el.className).toEqual(c);
        });

        itt('class object', function (title) {
            const c = { 'red-text': true, ping: false };
            const el = createElement('div', { class: c }, title);
            expect(el.className).toEqual('red-text ');
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
        });
    });
});
