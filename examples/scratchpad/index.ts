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





let a = new sp.ObservableArray<any>();
a.push(createTodo('t1'));
a.push(createTodo('t2'));
a.push(createTodo('t3', true));
a.push(createTodo('t4'));

const isDone = t => t.done;

const f = new sp.Filter(a, isDone);
console.log(f);
