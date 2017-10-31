import * as sp from '../../spui/index';
import * as utils from '../../spui/utils';
const h = sp.h;

function todoExpress() {
    const newTitle = sp.valueStream('');
    const todos = new sp.ArrayObserver();

    function addTodo() {
        if (newTitle()) {
            todos.push(createTodo(newTitle()));
            newTitle('');
        }
    };

    function createTodo (title: string, done = false) {
        return {
            title: sp.valueStream(title),
            done: sp.valueStream(done)
        };
    }

    todos.push(createTodo('hit the gym'));
    todos.push(createTodo('procrastinate', true));
    todos.push(createTodo('write unit tests'));

    const view = h('div', { id: 'todoapp'}, [
        h('div', {class: 'header'}, [
            h('h3', {}, 'todo express'),
            h('input', { type: 'text', value: newTitle, placeholder: 'what is up?', oninput: sp.selectTargetAttr('value', newTitle) }),
            h('span', { class: 'addBtn', onclick: addTodo }, 'Add'),
        ]),
        sp.elementList('ul', {}, todos, (listNode: HTMLElement, todo: any, index: number) => {
            return h('li', { class: { checked: todo.done }, onclick: () => todo.done(!todo.done()) }, [
                todo.title,
                h('span', {class: 'close', onclick: () => todos.remove(todo)}, 'x')
            ]);
        })
    ]);

    document.body.appendChild(view);
}

console.log(todoExpress.toString());

todoExpress();