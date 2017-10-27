import * as sp from '../../spui/index';
import * as utils from '../../spui/utils';
const h = sp.h;

function createTodo(title: string) {
    return {
        title: sp.valueStream(title),
        done: sp.valueStream(false)
    };
}

function spuiTodo () {
    const newTitle = sp.valueStream('');
    const todos = new sp.ObservableArray();
    
    const addTodo = () => {
        todos.push(createTodo(newTitle()));
        newTitle('');
    };

    todos.push(createTodo('something'));
    todos.push(createTodo('something else'));

    const view = h('div', {}, [
        h('input', { type: 'text', value: newTitle, oninput: sp.selectTargetAttr('value', newTitle) }),
        h('button', { onclick: addTodo }, '+'),
        sp.elementList('ul', {}, todos, (listNode: HTMLElement, todo: any, index: number) => {
            return h('div', {}, [
                h('input', { type: 'checkbox', value: todo.done, onclick: sp.selectTargetAttr('checked', todo.done) }),
                h('input', { type: 'text', value: todo.title, onchange: sp.selectTargetAttr('value', todo.title) }),
                h('a', { onclick: () => utils.remove(todos, todo) }, 'X'),
                // Create bindings on usage of title and done.
                h('span', {}, () => 'title: ' + todo.title() + ' done: ' + todo.done())
            ]);
        })
    ]);

    document.body.appendChild(view);
}

spuiTodo();