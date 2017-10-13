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
    let spanType = sp.createValueStream('span-of-doom');

    let input, button;
    let root = h('div', {}, [
        input = h('input', { value: "powwww" }),
        button = h('button', { onclick: () => copyValue(value()) }, 'Clear'),
        h('span', {class: spanType}, () => copyValue())
    ]);
    document.body.appendChild(root);

    
    /*
    clear$(text => {
        input.value = text;
    })
    */
}

// streamTest2();

function list (models, nodeCreator, key?, updateFunc?) {
    return [];
}

function streamTest3() {
    let root = h('div', {}, 'Ping!');

    // Can we update per attribute?
    let c1 = sp.createValueStream('test-me');
    let ex1 = h('div', { class: c1 });
    let ex2 = h('div', { class: () => c1() });
    let ex3 = h('div', () => ({ class: c1() }) );

    // Multi dependencies: can we avoid double dispatch? need to 
    // update in a setTimeout?
    let s1 = sp.createValueStream('width: 200px;');
    let ex4 = h('div', { class: c1, style: s1 });
    let ex5 = h('div', { class: () => c1(), style: () => s1 });
    let ex6 = h('div', () => ({ class: c1(), style: s1() }));

    let isDisabled = sp.createValueStream(true);
    // In case of isDisabled === false => we need to remove the disabled attr!
    let ex7 = h('div', { disabled: isDisabled });

    let title = sp.createValueStream('this is my title')
    let ex8 = h('div', {}, title);
    let ex9 = h('div', {}, title()); // static, won't ever update?
    let ex10 = h('div', {}, () => title());
    let ex11 = h('div', {}, [title]);

    // Multi children update: Use Node.replaceChild?
    let ex12 = h('div', {}, [
        'ping',
        h('div'),
        title // Replace only this one?
    ]);
    let ex13 = h('div', {}, () => [ // Set all children and replace eveything? Diffing with the dom?
        'ping',
        h('div'),
        title()
    ]);

    let todos = [{ title: 'ping', done: false }, { title: 'pong', done: true }]
    let ex14 = h('ul', {}, list(todos, (todo, key) => {
        return h('li', {},[
            h('input', {type: 'text', value: todo.title, oninput: todo.title}),
            h('input', { type: 'checkbox', value: todo.done, onchanged: checked => todo.done })
        ])
    }));

    document.body.appendChild(root);
}
// streamTest3();

let c1 = sp.createValueStream('test-me');
let ex1 = h('div', { class: c1 }, 'test me!');
document.body.appendChild(ex1);