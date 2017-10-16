'use strict';

import { App } from './app';
import { Store } from './store';

const store = new Store();
const app = new App({ store });

document.body.appendChild(app.el);
