import { Window } from 'happy-dom';

const window = new Window();

global.document = window.document;
global.window = window;
global.HTMLElement = window.HTMLElement;
global.customElements = window.customElements;

// Set navigator if it doesn't exist
if (!global.navigator) {
  global.navigator = window.navigator;
}
