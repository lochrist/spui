import * as sp from '../../spui/index';
import * as utils from '../../spui/utils';
const h = sp.h;

function randomNumber(maxValue: number) {
    return Math.floor(Math.random() * maxValue);
}

function randomIndex(elements: any[]) {
    return randomNumber(elements.length);
}

function randomElement(elements: any[]) {
    return elements[randomIndex(elements)];
}

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
    const models = new sp.ArrayObserver<string>();
    
    
    for (let i = 0; i < 10000; ++i) {
        models.push(generateName());
    }

    let count = 0;
    for (let i = 0; i < models.length; ++i) {
        if (generateName()) {
            count++;
        }
    }

    const match = sp.valueStream('');
    const filter = new sp.Filter(models, (model: string) => {
        return match() ? model.indexOf(match()) > -1 : true;
    });
    const triggerFilter = sp.map(match, () => filter.applyFilter());

    return h('div', {}, [
        h('input', { oninput: sp.selectTargetAttr('value', match) }),
        // elementList will update the <ul> element when new elements are added or removed.
        sp.elementList('ul', { style: 'height: 300px;width: 300px;overflow: auto' }, filter.filtered, (listNode: HTMLElement, model: any, index: number) => {
            return h('li', {}, model)
        })
    ]);
}

function perfArrayObserver() {
    const models = new sp.ArrayObserver<string>();

    console.time('push - arrayObs');
    for (let i = 0; i < 100000; ++i) {
        models.push(generateName());
    }
    console.timeEnd('push - arrayObs');

    console.time('access - arrayObs');
    let count = 0;
    for (let j = 0; j < 100; ++j)
        for (let i = 0; i < models.length; ++i) {
            if (models.array[i]) {
                count++;
            }
        }
    
    console.timeEnd('access - arrayObs');
    return count;
}


// perfArrayObserver(); // 40, 40

function arrayWrapper(a?) {
    // This is slow!
    a = a || [];
    let listeners = [];
    let changes = null;
    function push(...args) {
        const retValue = a.push.apply(a, args);
        if (changes === null) {
            for (let i = 0; i < listeners.length; ++i) {
                listeners[i]('push', args, retValue);
            }
        } else {
            changes.push(['push', args, retValue]);
        }

    }
    return new Proxy(a, {
        get: function (oTarget, sKey) {
            switch (sKey) {
                case 'push':
                    return push;
                default:
                    return oTarget[sKey];
            }
        }
    })
}

function perfWrapper() {
    const models = arrayWrapper();

    console.time('push - wrapper');
    for (let i = 0; i < 100000; ++i) {
        models.push(generateName());
    }
    console.timeEnd('push - wrapper');

    console.time('access - wrapper');
    let count = 0;
    for (let j = 0; j < 100; ++j)
        for (let i = 0; i < models.length; ++i) {
            if (models[i]) {
                count++;
            }
        }
    console.timeEnd('access - wrapper');
    return count;
}

// perfWrapper();

document.body.appendChild(filterEx());