import * as sp from '../../spui/index';
import * as utils from '../../spui/utils';
const h = sp.h;


function marked(mdText) {
    return (window as any).marked(mdText);
}

function thisIsSomething(a) {
    return h('input', { value: 'ping' })
}

function thisIsSomethingElse(a) {
    return h('button', { value: 'ping', onclick: () => alert('pow!') }, 'POWWW')
}


function todoExpress() {
    const newTitle = sp.valueStream('');
    const todos = new sp.ObservableArray();

    function addTodo() {
        if (newTitle()) {
            todos.push(createTodo(newTitle()));
            newTitle('');
        }
    };

    function createTodo(title: string, done = false) {
        return {
            title: sp.valueStream(title),
            done: sp.valueStream(done)
        };
    }

    todos.push(createTodo('hit the gym'));
    todos.push(createTodo('procrastinate', true));
    todos.push(createTodo('write unit tests'));

    // pow
    const view = h('div', { id: 'todoapp' }, [
            h('div', { class: 'header' }, [
                h('h3', {}, 'todo express'),
                h('input', {
                    type: 'text', value: newTitle, placeholder: 'what is up?',
                    oninput: sp.selectTargetAttr('value', newTitle)
                }),
                h('span', { class: 'addBtn', onclick: addTodo }, 'Add'),
            ]),
            sp.elementList('ul', {}, todos, (listNode: HTMLElement, todo: any, index: number) => {
                return h('li', {
                    class: { checked: todo.done },
                    onclick: () => todo.done(!todo.done())
                }, [
                        todo.title,
                        h('span', { class: 'closeBtn', onclick: () => utils.remove(todos, todo) }, 'x')
                    ]);
            })
        ]);
    
    return view;
}

function createCodeSnippet(f: Function) {
    return marked('```javascript\n' + f.toString() + '\n```');
}

function createExample(title: string, exampleGenerator: Function) {
    return {
        title,
        exampleGenerator
    };
}

const examples = [
    createExample('This is a big title', thisIsSomething),
    createExample('Yes!', thisIsSomethingElse),
    createExample('todo express', todoExpress)
];


const view = h('div', {class: 'container'}, examples.map(example => {
    let snippetEl;
    const el = h('div', { class: 'row' }, [
        h('h3', { class: 'col-md-12' }, example.title),
        snippetEl = h('div', { class: 'col-md-8' }),
        h('div', { class: 'col-md-4' }, 
            example.exampleGenerator()
        )
    ]);
    snippetEl.innerHTML = createCodeSnippet(example.exampleGenerator);
    return el;
}));

document.body.appendChild(view);