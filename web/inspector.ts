import {WADFile} from "@src/wad/file";
import {WADFileList} from "@src/wad/fileList";
import {WADLump} from "@src/wad/lump";

import {WADFlat} from "@src/lumps/doom/flat";
import {WADPicture} from "@src/lumps/doom/picture";

import {LumpType, LumpTypeGeneric, getLumpType} from "@web/lumpType";
import {LumpTypeView, LumpTypeViewHex} from "@web/lumpTypeView";

import * as util from "@web/util";

const win: any = window as any;

const wadFiles: WADFileList = new WADFileList();

let fileInput: any;
let selectedListItem: any;
let selectedView: (LumpTypeView | null) = null;
let selectedDefaultView: boolean = true;

function getSizeText(bytes: number, fixed: boolean): string {
    if(bytes < 1000){
        return `${bytes}b`;
    }else if(fixed){
        if(bytes < 1000000){
            return `${(bytes / 1000).toFixed(1)}kb`;
        }else{
            return `${(bytes / 1000000).toFixed(1)}mb`;
        }
    }else{
        if(bytes < 1000000){
            return `${(bytes / 1000)}kb`;
        }else{
            return `${(bytes / 1000000)}mb`;
        }
    }
}

win.onInspectorLoad = function(): void {
    fileInput = document.getElementById("main-file-input");
    fileInput.addEventListener("change", function(event: any) {
        if(!event.target.files[0]){
            return;
        }
        const newFileName = event.target.files[0].name;
        onLoadNewFile(event.target.files[0]);
    });
};

win.onInspectorDrop = function(event: any): void {
    console.log("Files dropped", event);
    event.preventDefault();
    if(event.dataTransfer.items && event.dataTransfer.items.length){
        // TODO: Use a WADFileList
        const file = event.dataTransfer.items[0].getAsFile();
        if(file){
            onLoadNewFile(file);
        }
    }else if(event.dataTransfer.files && event.dataTransfer.files.length){
        const file = event.dataTransfer.files[0];
        if(file){
            onLoadNewFile(file);
        }
    }
};

win.onClickOpenWad = function(): void {
    fileInput.click();
};

win.loadFromServer = function(url: string): void {
    const messageContainer = document.getElementById("message-container");
    if(messageContainer && messageContainer.hasChildNodes()){
        for(const childNode of messageContainer.childNodes){
            messageContainer.removeChild(childNode);
        }
    }
    const wadName = url.substring(url.lastIndexOf("/") + 1);
    fetch(url).then((response) => {
        const fileSize: number = Number.parseInt(response.headers.get("Content-Length") || "0", 10);
        let fileBuffer = new Buffer(0);
        if(response.ok){
            const progressMessageElement = document.createElement("div");
            progressMessageElement.classList.add("lump-view-info-message");
            const progressMessage = document.createTextNode("%");
            progressMessageElement.appendChild(progressMessage);
            if(messageContainer){
                messageContainer.appendChild(progressMessageElement);
            }
            let progressBytes = 0;
            const stream = response.body;
            const reader = stream!.getReader();
            function readData(result: {done: boolean, value: Uint8Array}): Promise<Buffer> {
                if(result.done){
                    return Promise.resolve(fileBuffer);
                }
                progressBytes += result.value.length;
                fileBuffer = Buffer.concat([fileBuffer, Buffer.from(result.value)]);
                if(fileSize > 0){
                    const progress = Math.floor(progressBytes / fileSize * 100);
                    progressMessage.data = `${progress}%`;
                }else{
                    progressMessage.data = "Please wait...";
                }
                return reader.read().then(readData);
            }
            return reader.read().then(readData);
        }
        return Promise.reject(`Attempt to get ${url} failed: ${response.status} ${response.statusText}`);
    }).then((data) => {
        if(messageContainer && messageContainer.hasChildNodes()){
            for(const childNode of messageContainer.childNodes){
                messageContainer.removeChild(childNode);
            }
        }
        const buffer: ArrayBuffer = data.buffer;
        const file = new File([buffer], wadName);
        onLoadNewFile(file);
    }).catch((error) => {
        if(messageContainer){
            const errorMessageElement = document.createElement("div");
            errorMessageElement.classList.add("lump-view-error-message");
            errorMessageElement.appendChild(document.createTextNode(error));
            messageContainer.appendChild(errorMessageElement);
        }
    });
};

function onLoadNewFile(file: File): void {
    const wadFileNames = wadFiles.files.map((wadFile) => wadFile.path);
    if(wadFileNames.includes(file.name)){
        // WAD already loaded
        return;
    }
    const wad = new WADFile(file.name);
    const reader: FileReader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = function() {
        if(reader.result){
            wad.loadData(Buffer.from(reader.result as ArrayBuffer));
            const wadListIndex = addWadToList(wad);
            setCurrentWad(wad, wadListIndex);
        }
    };
}

win.onSearchInput = function(): void {
    const search = util.id("lump-list-search");
    const value: string = search ? search.value.trim().toUpperCase() : "";
    if(!search || !search.value){
        filterLumpList((item: any) => {
            return +item.itemIndex + 1;
        });
    }else{
        filterLumpList((item: any) => {
            const name: string = item.lump.name.toUpperCase();
            const index: number = name.indexOf(value);
            return index >= 0 ? index + 1 : 0;
        });
    }
};

function filterLumpList(filter: (lump: any) => any): void {
    const listElement = util.id("lump-list-content");
    if(!listElement){
        return;
    }
    let shownItems: number = 0;
    for(const item of listElement.children){
        item.filterValue = filter(item);
        if(!item.filterValue){
            item.classList.add("filtered");
        }else{
            item.classList.remove("filtered");
            shownItems++;
        }
    }
    /*
     * Causes errors
    Array.prototype.sort.call(listElement.children, (a: any, b: any) => {
        return a.filterValue - b.filterValue;
    });
    */
    updateLumpListCount(shownItems, listElement.children.length);
}

function updateLumpListCount(shown: number, total: number): void {
    const count = util.id("lump-list-count");
    if(count){
        if(shown < total){
            count.innerText = `${shown}/${total}`;
        }else if(shown){
            count.innerText = `${shown} Lumps`;
        }else{
            count.innerText = "No Lumps";
        }
    }
}

function selectListItem(item: any): void {
    if(item === selectedListItem){
        return;
    }
    if(selectedListItem){
        selectedListItem.classList.remove("selected");
    }
    if(item){
        item.classList.add("selected");
    }
    util.id("lump-view-name")!.innerText = (
        item ? item.lump.name : "No Lump"
    );
    if(item.lumpType !== LumpTypeGeneric){
        util.id("lump-view-type")!.innerText = (
            `${item.lumpType.name} — ${getSizeText(item.lump.length, false)}`
        );
    }else{
        util.id("lump-view-type")!.innerText = (
            getSizeText(item.lump.length, false)
        );
    }
    updateLumpViewButtons(item);
    const contentRoot = util.id("lump-view-content");
    if(selectedView && !selectedDefaultView &&
        item.lumpType.getViews(item.lump).indexOf(selectedView) >= 0
    ){
        viewListItem(item, selectedView);
    }else if(!item.lumpType.views.length){
        const contentRoot = util.id("lump-view-content");
        util.removeChildren(contentRoot);
    }else{
        viewListItem(item, item.lumpType.views[0] || LumpTypeViewHex);
        selectedDefaultView = true;
    }
    selectedListItem = item;
}

function viewListItem(item: any, view: LumpTypeView): void {
    const contentRoot = util.id("lump-view-content");
    const buttons = util.id("lump-view-buttons");
    if(selectedView && selectedView.clear){
        selectedView.clear(item.lump, contentRoot as HTMLElement);
    }
    util.removeChildren(contentRoot);
    view.view(item.lump, contentRoot as HTMLElement);
    selectedView = view;
    for(const child of buttons.children){
        if(child.view === view){
            child.classList.add("selected");
        }else{
            child.classList.remove("selected");
        }
    }
}

function updateLumpViewButtons(item: any): void {
    const buttons = util.id("lump-view-buttons");
    util.removeChildren(buttons);
    const views = item.lumpType.getViews(item.lump);
    for(const view of views){
        const button = util.createElement({
            tag: "div",
            class: "view-button",
            view: view,
            appendTo: buttons,
            onleftclick: () => {
                viewListItem(item, view);
                selectedDefaultView = false;
            },
        });
        util.createElement({
            tag: "img",
            class: "icon",
            src: view.icon,
            appendTo: button,
        });
        util.createElement({
            tag: "div",
            class: "name",
            innerText: view.name,
            appendTo: button,
        });
    }
}

function addWadToList(wad: WADFile): number {
    const fileList = util.id("open-file-list");
    const wadFileIndex = wadFiles.files.length;
    const newWadListEntry = util.createElement({
        tag: "li",
        wadFileIndex,
        innerText: wad.path,
        onleftclick: () => {
            const wad = wadFiles.files[wadFileIndex];
            setCurrentWad(wad, wadFileIndex);
        },
        appendTo: fileList,
    });
    wadFiles.addFile(wad);
    return wadFileIndex;
}

function setCurrentWad(wad: WADFile, listIndex: number): void {
    const lumpList = util.id("lump-list-content");
    util.removeChildren(lumpList);
    util.id("current-filename")!.innerText = wad.path;
    let itemIndex: number = 0;
    for(const lump of wad.lumps){
        const lumpType: LumpType = getLumpType(lump);
        const item = util.createElement({
            tag: "div",
            class: "list-item",
            appendTo: lumpList,
            lump: lump,
            lumpType: lumpType,
            itemIndex: itemIndex++,
            onleftclick: () => {
                selectListItem(item);
            },
        });
        util.createElement({
            tag: "img",
            class: "icon",
            src: lumpType.icon,
            appendTo: item,
        });
        util.createElement({
            tag: "div",
            class: "name",
            innerText: lump.name,
            appendTo: item,
        });
        util.createElement({
            tag: "div",
            class: "type",
            innerText: lumpType.name,
            appendTo: item,
        });
        util.createElement({
            tag: "div",
            class: "size",
            innerText: getSizeText(lump.length, true),
            appendTo: item,
        });
    }
    const wadList = util.id("open-file-list");
    const wadListElements = wadList.querySelectorAll("li");
    for(const wadElement of wadListElements){
        wadElement.classList.remove("current-wad");
    }
    wadListElements[listIndex].classList.add("current-wad");
}

// Support for mobile devices and narrow screens
win.onClickDropdownButton = function(element: HTMLElement): void {
    element.classList.toggle("dropped");
    const dropdownTarget = element.dataset.dropdownTarget;
    if(dropdownTarget){
        util.id(dropdownTarget).classList.toggle("dropped");
    }
};
