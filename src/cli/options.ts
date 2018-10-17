// Represents a single option accepted on the command line.
export interface Option {
    // The name of the option. i.e. the "iwad" in "-iwad".
    // The argument will be identified with this name as an attribute
    // of the output object when parsing.
    name: string;
    // Help text associated with this option, explaining its purpose.
    help: string;
    // A function which accepts the raw string input from argv and
    // outputs a value of the desired type.
    type: Function;
    // When true, this option is treated as a list of values instead of
    // as a single value.
    list?: boolean;
    // When true, this option is treated as a flag. If the option is
    // present at all, even without a value, then the argument is set to true.
    flag?: boolean;
    // The default value for this option, if any.
    default?: any;
}

// Items in argv that do not appear to belong to any recognized option
// are added to the default "_" option.
export const DefaultOption: Option = {
    name: "_",
    help: "Capture options not matching any listed.",
    type: (i: any) => {return i;},
    list: true,
};

// Type representing a list of Option objects.
export type Options = Option[];

// Type representing the return value of a call to the argv parse function.
export interface Arguments {
    [name: string]: any;
}

// Get a string including help text for each accepted option.
export function getHelp(options: Options): string {
    const lines: string[] = [];
    for(const option of options){
        if(option.help){
            lines.push(`-${option.name} : ${option.help}`);
        }else{
            lines.push(`-${option.name}`);
        }
    }
    return lines.join("\n");
}

// Parse the strings in argv (or in another array passed in as an argument)
// and output an object mapping option names to the values found for each.
export function parse(
    options: Options, argv?: string[]
): Arguments {
    const list: string[] = argv || process.argv.slice(2);
    const args: Arguments = {};
    let currentOption: Option = DefaultOption;
    // Populate default values
    for(const option of options){
        if(option.default !== undefined){
            args[option.name] = option.type(option.default);
        }else if(option.list){
            args[option.name] = [];
        }else if(option.flag){
            args[option.name] = false;
        }
    }
    // Parse the arguments
    for(const item of list){
        let isOption: boolean = false;
        for(const option of options){
            if(item === "-" + option.name || item === "--" + option.name){
                isOption = true;
                if(option.flag){
                    args[option.name] = option.type(true);
                }else{
                    currentOption = option;
                }
            }
        }
        if(!isOption){
            const value: any = currentOption.type(item);
            if(currentOption.list){
                if(args[currentOption.name]){
                    args[currentOption.name].push(value);
                }else{
                    args[currentOption.name] = [value];
                }
            }else{
                args[currentOption.name] = value;
                currentOption = DefaultOption;
            }
        }
    }
    // All done
    return args;
}

// Convenience class for clean handling of CLI option parsing.
export class Parser {
    options: Options;
    
    constructor(options: Options) {
        this.options = options;
    }
    
    getHelp(): string {
        return getHelp(this.options);
    }
    
    showHelp(header: string): void {
        console.log(`\n${header}\n\n${this.getHelp()}\n`);
    }
    
    parse(argv?: string[]): Arguments {
        return parse(this.options, argv);
    }
}

export default Parser;
