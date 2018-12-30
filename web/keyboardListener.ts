// Listen for keyboard events
export class KeyboardListener {
    // Listens for keyboard inputs on the document, and stores the up/down state of each key as a boolean value.
    keyState: {[key: string]: boolean};
    constructor(){
        this.keyState = {};
        document.addEventListener("keydown", (e) => this.keyState[e.key] = true);
        document.addEventListener("keyup", (e) => this.keyState[e.key] = false);
    }
}
