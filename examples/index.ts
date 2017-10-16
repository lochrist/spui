import * as sp from '../spui/spui';
import {h} from '../spui/spui';
import { remove } from '../spui/utils';

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

    // Attributes creation:

    let c1 = sp.createValueStream('test-me');
    let ex1 = h('div', { class: c1 });
    let ex2 = h('div', { class: () => c1() });

    // We ban this usage!
    // let ex3 = h('div', () => ({ class: c1() }) );

    // Multi dependencies: can we avoid double dispatch? need to 
    // update in a setTimeout?
    let s1 = sp.createValueStream('width: 200px;');
    let ex4 = h('div', { class: c1, style: s1 });
    let ex5 = h('div', { class: () => c1(), style: () => s1 });

    // We ban this usage!
    // let ex6 = h('div', () => ({ class: c1(), style: s1() }));

    let isDisabled = sp.createValueStream(true);
    // In case of isDisabled === false => we need to remove the disabled attr!
    let ex7 = h('div', { disabled: isDisabled });

    // Create children:

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

    // We ban this usage!
    /*
    let ex13 = h('div', {}, () => [ // Set all children and replace eveything? Diffing with the dom?
        'ping',
        h('div'),
        title()
    ]);
    */

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

function randomPercent() {
    return Math.ceil(Math.random() * 100);
}

function autoUpdateAttrTest () {
    let c1 = sp.createValueStream(randomPercent());
    let c2 = sp.createValueStream(randomPercent());

    let text;
    let root = h('div', {}, [
        h('button', { onclick: () => {
            c1(randomPercent());
            c2(randomPercent());
        } }, 'randomize'),
        h('input', { value: () => "Rando: " + c1() + " " + c2() })
    ]);

    document.body.appendChild(root);
}
// autoUpdateAttrTest();

function autoUpdateChildrenTest() {
    let c1 = sp.createValueStream(randomPercent());
    let c2 = sp.createValueStream(randomPercent());

    let text;
    let root = h('div', {}, [
        h('button', {
            onclick: () => {
                c1(randomPercent());
                c2(randomPercent());
            }
        }, 'randomize'),
        h('div', {}, () => "Rando: " + c1() + " " + c2())
    ]);

    document.body.appendChild(root);
}
// autoUpdateChildrenTest();

function observableArray() {
    let array = sp.observableArray();
    array.addListener((...args) => {
        console.log(args);
    });

    array.push('12', 33, 99, 'ping!');
    array.push(122);
    array.splice(1);
    array.splice(1, 1);
    array.splice(0, 0, 'www');
    array.push(12);
    array.sort();
    array.pop();
    array.reverse();
}

// observableArray();

function spuiTodo () {
    let newTitle = sp.createValueStream("");
    let todos = sp.observableArray();
    let addTodo = () => {
        todos.push({ title: sp.createValueStream(newTitle()), done: sp.createValueStream(false) });
        newTitle("");
    };
    let removeTodo = (todo) => {
        remove(todos, todo);
    };

    let app = {
        view: function () {
            return h('div', {}, [
                h('input', { type: 'text', value: newTitle, oninput: sp.eventTarget('value', newTitle) }),
                h('a', { onclick: addTodo }, '+'),
                sp.nodeList('ul', {}, todos, (listNode: HTMLElement, todo: any, index: number) => {
                    return h('div', {}, [
                        h('input', { type: 'checkbox', value: todo.done, onclick: sp.eventTarget('checked', todo.done) }),
                        h('input', { type: 'text', value: todo.title, oninput: sp.eventTarget('value', todo.title) }),
                        h('a', { onclick: () => removeTodo(todo) }, 'X'),

                        // Create bindings on className and Creates binding on usage of title and done.
                        h('span', {}, () => 'title: ' + todo.title() + ' done: ' + todo.done())
                    ]);
                })
            ]);
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        document.body.appendChild(app.view());
    });
}

spuiTodo();

/*

                // TODO: what to do with collection/map array? probably need to provide an array model that wraps a normal array. or provide a way to
                // kick in the update like redom does
                h('ul', todos.map((todo, index) => {
                    return h('div',
                        // todo.done is a function and is checked upon setting arguments.
                        h('input', { type: 'checkbox', value: todo.done, onclick: eventTarget('checked', todo.done) }),
                        h('input', { type: 'text', value: todo.title, oninput: eventTarget('value', todo.title) }),
                        h('a', { onclick: () => removeTodo(todo, index) }, 'X'),

                        // Create bindings on className and Creates binding on usage of title and done.
                        h('span', { className: () => style1() + " " + style2() }, () => 'title: ' + todo.title() + ' done: ' + todo.done())

                    );
                }))

*/