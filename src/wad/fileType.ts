// WAD file type. Either an IWAD ("Internal WAD") or a PWAD ("Patch WAD").
// Every WADFile must have a type. The type is represented in the first four
// bytes of any WAD file as an ASCII string. (Either "IWAD" or "PWAD".)
export enum WADFileType {
    IWAD = 0,
    PWAD = 1,
    Invalid = 2,
}

// Implements functions for getting a WADFileType enum member from an
// ASCII string found in a WAD file header, and vice-versa.
export namespace WADFileType {
    export function getName(type: WADFileType): string {
        if(type === WADFileType.IWAD){
            return "IWAD";
        }else if(type === WADFileType.PWAD){
            return "PWAD";
        }else{
            return "????";
        }
    }
    export function fromName(name: string): WADFileType {
        if(name === "IWAD"){
            return WADFileType.IWAD;
        }else if(name === "PWAD"){
            return WADFileType.PWAD;
        }else{
            return WADFileType.Invalid;
        }
    }
}
