'use strict';

// import { mount } from 'redom';
import { App } from './app';
import { Store } from './store';

const store = new Store();
const app = new App({ store });

// mount(document.body, app);
