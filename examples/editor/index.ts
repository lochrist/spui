import * as sp from '../../spui/index';
import * as utils from '../../spui/utils';

const h = sp.h;
const marked = (window as any).marked;

let htmlTextElement = h('div');

const markdownText = sp.valueStream(`# Markdown Editor\n\nType on the left panel and see the result on the right panel`);
const htmlText = sp.map(markdownText, md => {
    htmlTextElement.innerHTML = marked(md);
});

const editor = h('div', {id: 'editor'}, [
    h('textarea', { class: 'input', value: markdownText, oninput: sp.selectTargetAttr('value', markdownText)}),
    h('div', { class: 'preview' }, htmlTextElement),
]);

document.body.appendChild(editor);