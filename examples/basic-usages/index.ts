import * as sp from '../../spui/index';
import * as utils from '../../spui/utils';
const h = sp.h;

interface Example {
    title: string;
    exampleGenerator: Function;
}
const examples : Example[] = [];

function marked(mdText) {
    return (window as any).marked(mdText);
}

function randomNumber(maxValue: number) {
    return Math.floor(Math.random() * maxValue);
}

function randomIndex(elements: any[]) {
    return randomNumber(elements.length);
}

function randomElement(elements: any[]) {
    return elements[randomIndex(elements)];
}

function cleanCodeSnippet(snippet: string) {
    let lines = snippet.split('\n');
    // Remove function line:
    lines.splice(0, 1);
    // Remove bracket on last lines:
    lines.splice(lines.length - 1, 1);

    // Trim first indent:
    lines = lines.map(l => {
        l = l.slice(4)
        if (l.startsWith('return ')) {
            l = l.replace('return ', '');
        }
        return l;
    });

    return lines.join('\n');
}

function createCodeSnippet(f: Function) {
    return marked('```javascript\n' + cleanCodeSnippet(f.toString()) + '\n```');
}

function createExample(title: string, exampleGenerator: Function): Example {
    return {
        title,
        exampleGenerator
    };
}

function addExample(title: string, exampleGenerator: Function) {
    const ex = createExample(title, exampleGenerator);
    examples.push(ex);
    return ex;
}

function logView(commands) {
    for (let i = 0; i < commands.length; i += 2) {
        const command = commands[i];
        const result = commands[i + 1];
    }

    return h('pre', {class: 'log-view'}, commands.map((c, index) => {
        if ((index % 2) === 0) {
            // Command:
            return h('div', { class: 'command' }, '> ' + c);
        }

        // Result:
        return h('div', { class: 'result' }, c);
    }));
}

function createExamplesView(examples: Example[]) {
    return h('div', { class: 'container' }, examples.map(example => {
        let snippetEl;
        const exampleView = example.exampleGenerator();
        const el = h('div', { class: 'row' }, [
            h('h3', { class: 'col-md-12' }, example.title),
            snippetEl = h('div', { class: 'col-md-8'}),
            h('div', { class: 'col-md-4' }, example.exampleGenerator())
        ]);
        snippetEl.innerHTML = createCodeSnippet(example.exampleGenerator);
        return el;
    }));
}

/////////////////////////////////////////////////////////
// Stream

function valueStreamEx() {
    const model = sp.valueStream(42);

    // stream called with no param: getter
    console.log(model());

    // stream called with a param: setter
    model(71);

     // Prints 71
    console.log(model());
}

function valueStreamExView() {
    return logView([
        'console.log(model())', '42',
        'console.log(model())', '71',
    ]);
}
addExample('value stream', valueStreamEx);

function streamTransformEx() {
    const model = sp.valueStream(42);
    // Prints 42
    console.log(model());

    // Modify the stream itself by adding a transform:
    sp.addTransform(model, value => value * 2);

    // Prints 84
    console.log(model()); 
}
addExample('value transform', streamTransformEx);


function streamListenerEx() {
    const model = sp.valueStream(42);
    
    sp.addListener(model, value => {
        console.log('Model has changed: ', value);
    });

    // prints: Model has changed: 11
    model(11);
}
addExample('stream listener', streamListenerEx);

function streamMapEx () {
    const model = sp.valueStream(42);

    // Create a new stream that maps the original model value:
    const mappedModel = sp.map(model, value => value * 2);

    // Prints 42
    console.log(model());

    // Prints 84
    console.log(mappedModel());

    model(11);

    // Prints 22
    console.log(mappedModel());
}
addExample('stream map', streamMapEx);

function computeStreamEx() {
    const firstName = sp.valueStream('Donald');
    const lastName = sp.valueStream('Knuth');
    const fullName = sp.computeStream(() => {
        return firstName() + ' ' + lastName();
    });

    // Prints: Donald Knight
    console.log(fullName());

    lastName('Duck');

    // Prints Donal Duck. And loses all respect.
    console.log(fullName());
}
addExample('compute stream', computeStreamEx);

/////////////////////////////////////////////////////////
// hyperscript examples:

function hStaticEx() {
    return h('div', { class: 'alert alert-info'}, 'Hello!')
}
addExample('h with static values', hStaticEx);

function hChildrenEx() {
    return h('div', {class: 'child-container'}, [
        'this is a text children',
        h('input', {placeholder: 'what is up doc?'}),
        h('button', {}, 'Button child')
    ])
}
addExample('h with children', hChildrenEx);

function hClassEx1() {
    const labels = [
        {text: 'this is some info', info: true},
        { text: 'this is dangerous!', danger: true }
    ] as any[];

    // class attribute can be a string or an object where each key is used as a class
    // if the corresponding value is truthy.
    return h('div', { class: 'child-container'}, labels.map(label => {
        return h('div', { class: { 
                            alert: true,
                            'alert-info': label.info,
                            'alert-danger': label.danger 
                        } }, 
            label.text)
    }));
}
addExample('class as object', hClassEx1);

function hStyleEx() {
    // style attribute can be either a string or an object
    return h('div', {}, [
        h('div', {style: 'color: black; background-color: grey;padding: 10px;'}, 'dark label #1'),
        h('div', { style: { color: 'grey', backgroundColor: 'black', padding: '10px' } }, 'darker label #2')
    ]);
}
addExample('style as object', hStyleEx);

function hBooleanAttrs() {
    // Attributre with a boolean value, are setup specially in the DOM
    return h('div', {class: 'child-container'}, [
        // <input placeholder="this is writable">
        h('input', { placeholder: 'this is writable', readonly: false, disabled: false}),
        // <input placeholder="this is readonly" readonly>
        h('input', { placeholder: 'this is readonly', readonly: true}),
        // <input placeholder="this is disabled" disabled>
        h('input', { placeholder: 'this is disabled', disabled: true }),
    ]);
}
addExample('boolean attributes', hBooleanAttrs);

function eventsEx() {
    let input, button, buttonText = 'Roll D6';
    return h('div', { class: 'child-container' }, [
        input = h('input', { placeholder: 'this is readonly', readonly: true, value: 1 }),
        // Listener to an event is adding an attribute of name : on<eventName>
        button = h('button', {
            onclick: () => {
                // h() returns an HTMLElement. So it is really easy changing the value of input:
                input.value = randomNumber(6) + 1;
            },
            onmouseenter: () => {
                button.innerText = 'Click to roll';
            },
            onmouseleave: () => {
                button.innerText = buttonText;
            }
        },
        buttonText),
    ]);
}
addExample('events', eventsEx);

/////////////////////////////////////////////////////////
// Model changes auto updating

function hClassAutoUpdateEx() {
    // Attribute with a boolean value, are setup specially in the DOM
    const strikeIt = sp.valueStream(false);
    return h('div', { class: 'child-container' }, [
        h('button', { onclick: () => strikeIt(!strikeIt()) }, 'Toggle'),
        // Stream used directly for strike class
        h('div', { class: { strike: strikeIt } }, 'is this done?'),
        // Computation created for the whole class value
        h('div', { class: () => strikeIt() ? 'strike' : '' }, 'is this done?')
    ]);
}
addExample('class changes auto-update', hClassAutoUpdateEx);

// style changes
function hStyleAutoUpdateEx() {
    // Attribute with a boolean value, are setup specially in the DOM
    const colors = ['blue', 'green', 'red', 'black', 'pink'];
    const randomColor = () => randomElement(colors);
    const color1 = sp.valueStream(randomColor());
    const color2 = sp.valueStream(randomColor());
    return h('div', { class: 'child-container' }, [
        h('button', { onclick: () => {
            color1(randomColor());
            color2(randomColor());
        } }, 'random color'),
        h('div', { class: 'color-display', style: () => 'background-color: ' + color1() }),
        h('div', { class: 'color-display', style: { backgroundColor: color2 } })
    ]);
}
addExample('style changes auto-update', hStyleAutoUpdateEx);

function hBooleanAutoUpdateEx() {
    // Attribute with a boolean value, are setup specially in the DOM
    const toggle = sp.valueStream(false);
    const readonlyInput = sp.map(toggle, value => value ? 'this is readonly' : 'this is writable');
    const disabledInput = sp.map(toggle, value => value ? 'this is disabled' : 'this is enabled');
    return h('div', { class: 'child-container' }, [
        h('button', { onclick: () => toggle(!toggle()) }, 'Toggle'),
        h('input', { placeholder: readonlyInput, readonly: toggle }),
        h('input', { placeholder: disabledInput, disabled: toggle }),
    ]);
}
addExample('boolean changes auto-update', hBooleanAutoUpdateEx);

function inputValueChangeEx() {
    const model = sp.valueStream('this is my initial value');
    return h('div', {}, [
        // when the user types into the <input> we update model...
        h('input', { value: model, oninput: sp.selectTargetAttr('value', model) }),
        // ...when model changes, label content updates automatically.
        h('label', {}, model)
    ]);
}
addExample('input value change', inputValueChangeEx);

function childrenValueChangeEx() {
    const counter = sp.valueStream(0);
    return h('div', {}, [
        h('button', { onclick: () => counter(counter() + 1) }, 'Increment'),
        h('label', {style: 'padding: 5px;'}, counter)
    ]);
}
addExample('children value change', childrenValueChangeEx);

function elementListEx () {
    const models = new sp.ObservableArray<any>();    
    let count = 0;
    models.push(sp.valueStream(count++));
    models.push(sp.valueStream(count++));
    models.push(sp.valueStream(count++));
    models.push(sp.valueStream(count++));
    return h('div', {}, [
        h('button', { onclick: () => models.push(sp.valueStream(count++)) }, 'Add'),
        h('button', { onclick: () => models.splice(randomIndex(models), 1) }, 'Remove random'),
        // elementList will update the <ul> element when new elements are added or removed.
        sp.elementList('ul', {}, models, (listNode: HTMLElement, model: any, index: number) => {
            return h('li', {}, model)
        })
    ]);
}
addExample('elementList', elementListEx);


/////////////////////////////////////////////////////////
// Misc
const names = ['Fenton Will', 'Zeph Arnie', 'Zeke Tod', , 'Chandler Jeb', 'Collin Ernie', 
    'Claude Toby', 'Channing Temple', 'Rickey Tracey',
    'Lewis Farley', 'Rolland Spencer', 'Joel Graeme', 'Eldred Benji', 'Eldred Benji', 
    'Erik Paxton', 'Brett Shanon', 'Astor Gladwyn', 'Milburn Gaz', 'Newton Huey', 'Nelson Marvyn',
     'Bram Branson', 'Josiah Kingston', 'Asher Hildred', 'Joe Kyler', 'Clay Durward', 
     'Biff Thane', 'Dax Walton', 'Fulk Burt', 'Willie Cosmo', 'Emmet Conner', 'Quinlan Cam', 
    'Wolf Vinny', 'Larrie Joseph', 'Lester Keir', 'Jerrard Louis',
    'Peter Laurie', 'Don Desmond', 'Sterling Rowland', 'Pearce Raphael', 'Wyatt Harding',
    'Matty Cree', 'Syd Tommie', 'Augustine Dylan', 'Boniface Lionel'
];
const firstNames = [];
const lastNames = [];
names.forEach(name => {
    let split = name.split(' ');
    firstNames.push(split[0]);
    lastNames.push(split[1]);
});

function generateName() {
    return randomElement(firstNames) + ' ' + randomElement(lastNames);
}

function filterEx() {
    const models = new sp.ObservableArray<string>();
    for (let i = 0; i < 10; ++i) models.push(generateName());
    const match = sp.valueStream('');
    const filter = new sp.Filter(models, (model: string) => {
        return match() ? model.indexOf(match()) > -1 : true;
    });
    const triggerFilter = sp.map(match, () => filter.applyFilter());

    return h('div', {}, [
        h('input', { oninput: sp.selectTargetAttr('value', match) }),
        // elementList will update the <ul> element when new elements are added or removed.
        sp.elementList('ul', {style: 'height: 300px;overflow: auto'}, filter.filtered, (listNode: HTMLElement, model: any, index: number) => {
            return h('li', {}, model)
        })
    ]);
}
addExample('filter', filterEx);


/////////////////////////////////////////////////////////
// Complete examples
function todoExpressEx() {
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

    // Setup our todo view:
    return h('div', { class: 'todoapp' }, [
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
}
addExample('todo express', todoExpressEx);

const view = createExamplesView(examples);
document.body.appendChild(view);