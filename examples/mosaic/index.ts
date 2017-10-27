import * as sp from '../../spui/index';
import * as utils from '../../spui/utils';
const h = sp.h;

interface Model {
    pos: string,
    class: sp.Stream
}
const mosaicModels = new sp.ObservableArray<Model>();

function createMosaic() {
    return h('div', { id: 'root' }, sp.elementList('div', { class: 'container' }, mosaicModels, (element, model) => {
        return h('div', { class: model.class, style: { backgroundPosition: model.pos } })
    }));
}

function initModels() {
    for (let i = 0; i < 100; i++) {
        mosaicModels.push({
            pos: (i % 10 * 11) + '% ' + (Math.floor(i / 10) * 11) + '%',
            class: sp.valueStream('slice')
        });
    }
}

function fadeOut() {
    mosaicModels.forEach(model => model.class('slice exit'));
    setTimeout(fadeIn, 1000);
}

function fadeIn() {
    mosaicModels.splice(0);
    initModels();
    setTimeout(fadeOut, 2000);
}

const mosaic = createMosaic();
document.body.appendChild(mosaic);
fadeIn();

