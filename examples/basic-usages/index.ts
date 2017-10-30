import * as sp from '../../spui/index';
import * as utils from '../../spui/utils';
const h = sp.h;

function marked(mdText) {
    return (window as any).marked(mdText);
}

function cleanCodeSnippet(snippet: string) {
    let lines = snippet.split('\n');
    // Remove function line:
    lines.splice(0, 1);
    // Remove bracket on last lines:
    lines.splice(lines.length - 1, 1);

    // Trim first indent:
    lines = lines.map(l => l = l.slice(4));

    // If last line starts with return: remove it
    if (lines.length > 1 && lines[lines.length - 1].startsWith('return')) {
        lines.splice(lines.length - 1, 1);
    }

    return lines.join('\n');
}

function createCodeSnippet(f: Function) {
    return marked('```javascript\n' + cleanCodeSnippet(f.toString()) + '\n```');
}

function createExample(title: string, exampleGenerator: Function) {
    return {
        title,
        exampleGenerator
    };
}

/////////////////////////////////////////////////////////
// Stream

// valueStream
function valueStream() {
    return 12;
    /*
    const model = sp.valueStream(42);
    // Stream called with no param: getter
    console.log(model());

    // Stream called with a param: setter
    model(71);

    console.log(model());
    */
}

// Listening to changes

// addTransform on existng stream

// map

// computeStream

// eventStream

/////////////////////////////////////////////////////////
// hyperscript examples:

// hyperscript with al static values

// class: string vs objects
// style: string vs objects
// boolean values
// events

// static children 

// Model changes auto updating

// class changes

// style changes

// boolean changes

// attr changes

// value changes

// Children updating

// elementList auto update

function inputUpdate() {
    const model = sp.valueStream('this is my initial value');
    const view = h('div', {}, [
        // when the user types into the <input> we update model...
        h('input', { value: model, oninput: sp.selectTargetAttr('value', model) }),
        // ...when model changes, label content updates automatically.
        h('label', {}, model)
    ]);

    return view;
}

/////////////////////////////////////////////////////////
// Misc

// Filter

// ObservableArray


/////////////////////////////////////////////////////////
// Complete examples
function todoExpress() {
    const newTitle = sp.valueStream('');

    // This will store all our todos and ensure the DOM todo list is kept in sync
    const todos = new sp.ObservableArray();

    function addTodo() {
        if (newTitle()) {
            // Create a new todo and add it to the model. This will update the DOM list automatically.
            todos.push(createTodo(newTitle()));
            newTitle('');
        }
    };

    function createTodo(title: string, done = false) {
        return {
            title,
            done: sp.valueStream(done)
        };
    }

    // Create some initial datas:
    todos.push(createTodo('hit the gym'));
    todos.push(createTodo('procrastinate', true));
    todos.push(createTodo('write unit tests'));

    const view = h('div', { id: 'todoapp' }, [
        h('div', { class: 'header' }, [
            h('h3', {}, 'todo express'),
            h('input', {
                type: 'text', value: newTitle, placeholder: 'what is up?',
                // Update the title value as the user types in the input.
                oninput: sp.selectTargetAttr('value', newTitle)
            }),
            h('span', { class: 'addBtn', onclick: addTodo }, 'Add'),
        ]),
        // elementList will ensure all the <ul> children are kept in sync with the todos model:
        sp.elementList('ul', {}, todos, (listNode: HTMLElement, todo: any, index: number) => {
            return h('li', {
                // checked is updated if todo.done changes.
                class: { checked: todo.done },
                onclick: () => todo.done(!todo.done())
            }, [
                    todo.title,
                    // Removoing the todo from the model will update the DOM List.
                    h('span', { class: 'closeBtn', onclick: () => utils.remove(todos, todo) }, 'x')
                ]);
        })
    ]);
    
    return view;
}

const examples = [
    createExample('value stream', valueStream),
    createExample('input change', inputUpdate),
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