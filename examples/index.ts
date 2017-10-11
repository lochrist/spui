import * as sp from '../spui/spui';
import {h} from '../spui/spui';

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
    let copyValue = sp.createValueStream('copy!');
    let input, button;
    let root = h('div', {}, [
        input = h('input', { value: "powwww" }),
        button = h('button', { onclick: () => copyValue(value()) }, 'Clear'),
        h('span', {}, copyValue())
    ]);
    document.body.appendChild(root);

    
    /*
    clear$(text => {
        input.value = text;
    })
    */
}

streamTest2();

