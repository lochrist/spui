import {isFunction} from '../spui/utils';
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
            expect(stream._derive).toBeUndefined();
        });

        it('create with derive', function () {
            const value = 12;
            const stream = s.createValueStream(value, double);
            expect(stream()).toEqual(value * 2);
            expect(stream._derive).toEqual(double);
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
            expect(computed._derive).toEqual(double);
        });

        it ('computation', function () {
            const value1 = 12;
            const value2 = 99;
            const vs1 = s.createValueStream(value1);
            const vs2 = s.createValueStream(value2);

            const computed = s.computeStream(() => {
                return vs1() + vs2();
            });

            expect(vs1._listeners).toContain(computed);
            expect(vs2._listeners).toContain(computed);
            expect(computed()).toEqual(value1 + value2);

            vs1(0);
            expect(computed()).toEqual(value2);

            vs2(7);
            expect(computed()).toEqual(7);

            // Computed is effectively a read only computed value
            computed(12);
            expect(computed()).toEqual(7);
        });
    });
    
    
});

describe('dom generation', function () {
    it('test1', function () {
        expect(true).toBeTruthy();
    });
});
