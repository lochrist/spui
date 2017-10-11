import * as sp from './spui/spui';
import {h} from './spui/spui';

function domTests () {
    let models = ['ping', 'pong', 'bing', 'bong'];

    let rootEl = h('div', { class: 'foin' }, [
        h('button', { onclick: (event) => console.log(event) }, 'Pow!'),
        h('div', {}, models.map(m => h('div', {}, m)))
    ]);
    document.body.appendChild(rootEl);
}

function modelTest () {
    /*
    let m1 = m.model(12);
    let m2 = m.model(23);
    let computation = m.compute(() => {
        return m1() + m2();
    });
    */
}

/*
function streamTest() {
    let input, button;
    let root = h('div', {}, [
        input = h('input', {value: "powwww"}),
        button = h('button', {}, 'Clear')
    ]);
    document.body.appendChild(root);

    console.log('before compose');

    // map(clickStream())

    const clear$ = sp.compose(
        sp.createDomEventStream(button, 'click'),
        sp.map(event => {
            console.log('MAP IN CLEAR#');
            return '';
        }),
    );

    console.log('before clear$');
    clear$(text => {
        console.log('clearing text!');
        input.value = text;
    })
}

streamTest();
*/

function streamTest2() {
    let value = sp.createValueStream('222');
    let input, button;
    let root = h('div', {}, [
        input = h('input', { value: "powwww" }),
        button = h('button', {onclick: () => value('ping') }, 'Clear')
    ]);
    document.body.appendChild(root);

    /*
    clear$(text => {
        input.value = text;
    })
    */
}

// streamTest2();

let s1 = sp.createValueStream(10);
let s2 = sp.createValueStream(20);
let s3 = sp.computeStream(() => {
    return s1() + s2();
});

let s4 = sp.map(s3, value => {
    return 'random! ' + value;
});

console.log('pow');