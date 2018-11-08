// Get an element by ID.
export function id(id: string): any {
    return document.getElementById(id);
}

// Get elements by class name.
export function cls(element: any, className: string): any {
    if(!element){
        return [];
    }else{
        return element.getElementsByClassName(className);
    }
}

// Get the first element with a class name.
export function fcls(element: any, className: string): (Element | null) {
    if(!element){
        return null;
    }
    const elements = element.getElementsByClassName(className);
    if(elements.length){
        return elements[0];
    }else{
        return null;
    }
}

// Remove all children from an element.
export function removeChildren(element: any): void {
    while(element && element.lastChild){
        element.removeChild(element.lastChild);
    }
}

export function styleElement(element: any, style: any): void {
    if(element && style){
        for(let key in style){
            element.style[key] = style[key];
        }
    }
}

export function createElement(options: any): any {
    const element: any = document.createElement(options.tag || "div");
    const indirectProperties: any = {
        tag: () => {},
        appendTo: (options: any) => {
            if(options.appendTo){
                options.appendTo.appendChild(element);
            }
        },
        class: (options: any) => {
            element.classList.add(options.class);
        },
        classList: (options: any) => {
            if(options.classList){
                for(let cls of options.classList){
                    element.classList.add(cls);
                }
            }
        },
        content: (options: any) => {
            if(options.content instanceof Element){
                element.appendChild(options.content);
            }else if(Array.isArray(options.content)){
                options.content.forEach((e: any) => element.appendChild(e));
            }else if(!("innerText" in options)){
                element.innerText = String(options.content);
            }
        },
        style: (options: any) => {
            styleElement(element, options.style);
        },
        children: (options: any) => {
            if(options.children){
                for(let child of options.children){
                    if(!child){
                        // pass
                    }else if(child instanceof Element){
                        element.appendChild(child);
                    }else{
                        element.appendChild(createElement(child));
                    }
                }
            }
        },
        onleftclick: (options: any) => {
            element.onclick = function(event: any){
                if(event.button === 0 && !event.ctrlKey){
                    options.onleftclick.call(this, event);
                }
            };
        },
        onleftmousedown: (options: any) => {
            element.onmousedown = function(event: any){
                if(event.button === 0 && !event.ctrlKey){
                    options.onleftmousedown.call(this, event);
                }
            };
        },
        listener: (options: any) => {
            if(typeof(options.listener) !== "object") return;
            for(let key in options.listener){
                element.addEventListener(key, options.listener[key]);
            }
        },
    };
    for(let key in options){
        if(options[key] !== undefined){
            if(indirectProperties[key]){
                indirectProperties[key](options);
            }else{
                element[key] = options[key];
            }
        }
    }
    return element;
}
