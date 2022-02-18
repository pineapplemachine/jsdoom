// Listen for keyboard events
type KeyEventListener = (e: KeyboardEvent) => void;
export class KeyboardListener {
    // Listens for keyboard inputs on the document, and stores the up/down
    // state of each key as a boolean value.
    private keyState: {[key: string]: boolean};
    private readonly keyPressed: KeyEventListener;
    private readonly keyReleased: KeyEventListener;
    constructor(){
        this.keyState = {};
        this.keyPressed = (e: KeyboardEvent) => this.keyState[e.key] = true;
        this.keyReleased = (e: KeyboardEvent) => this.keyState[e.key] = false;
        document.addEventListener("keydown", this.keyPressed);
        document.addEventListener("keyup", this.keyReleased);
    }
    get(key: string): boolean {
        if(this.keyState[key] === undefined){
            this.keyState[key] = false;
        }
        return this.keyState[key];
    }
    dispose(){
        document.removeEventListener("keydown", this.keyPressed);
        document.removeEventListener("keyup", this.keyReleased);
    }
}
