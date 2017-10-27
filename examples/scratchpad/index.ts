import * as sp from '../../spui/index';
import * as utils from '../../spui/utils';
const h = sp.h;


function createTodo(title, done = false) {
    return {
        title,
        done
    };
}

/**
    use case:

    models is modified (added, removed, sorted) => filter must update

    filter itself changes: need to recompute everything


    models is modified
    recompute filter on everything

    apply difference on new filterd data:


 */

function thisIsSomething(a) {
    // contains comment
    if (a) {
        console.log('ping');
    }

    return '';
}

function md(mdText) {
    return (window as any).marked(mdText);
}

function createSnippet(f) {
    return md('```lua\n' + f.toString() + '\n```');
}

let snippet;
const view = h('div', {class: 'container'}, [
    h('div', {class: 'row'}, [
        h('h3', {class: 'col-md-12'}, 'This is a big title!'),
        snippet = h('div', {class: 'col-md-7'}),
        h('div', { class: 'col-md-3' }, [
            h('input', {value: 'ping'})
        ])
    ])
]);

snippet.innerHTML = createSnippet(thisIsSomething);
document.body.appendChild(view);