# Jsdoom Style Guide

The purpose of this style guide is to keep jsdoom's source code readable, approachable, consistent, and maintainable. When contributing to jsdoom, please follow these guidelines. Pull requests containing code that does not follow the guidelines may be rejected until the code has been made conformant.

These are not strict rules! Exceptions are allowed where it improves readability. However, exceptions should be just that: Exceptional. Exceptions should be made sparingly, if they are made at all.

Please [create a GitHub issue](https://github.com/pineapplemachine/jsdoom/issues/new) if you would like to request a change or an addition to this style guide.

Throughout this guide, specific examples of conforming code will be provided like so:

``` ts
// An example of conforming code
console.log("jsdoom is pretty neat");
```



# Formatting

## Indent using four spaces

Code in jsdoom is indented with four spaces. The line followed by an open brace `{` should be indented one level further than the line with the open brace. The line with the corresponding closing brace `}` should be indented one level less.

``` ts
// [Comment explaining the purpose of my function]
function myFunction(): void {
    doStuff();
    if(condition){
        doOtherStuff();
    }
}
```

## No double indents or partial indents

Code should be styled in such a way that each line is indented at either the same level as the last line, one more level, or one less. There should never be a jump of two or more indentation levels between lines. There should never be a partial change in indentation, e.g. one line should not be indented three spaces further than the next.

``` ts
myArray.map(value => {
    return transformMyValue(value);
}).filter(value => {
    return filterMyValue(value);
});
```

## Whitespace around braces

Open braces `{` should always be followed by a newline and close braces `}` should always be preceded by a newline. Open braces `{` generally should _not_ be preceded by a newline.

``` ts
const myObject: Object = {
    myAttribute: doStuff({
        myOption: 1,
    });
};
```

Open braces `{` should generally be on the same line as the statement they pertain to.

``` ts
while(myCondition){
    if(myOtherCondition){
        doStuff();
    }else{
        doOtherStuff();
    }
}
```

## Do not pad enclosed expressions with spaces

Except for where an expression is distributed across several lines due to its length, expressions or blocks inside paretheses `()`, square brackets `[]`, or angle brackets `<>` should not have spaces in between the opening bracket or parenthese and the first character of the enclosed expression, nor in between the closing bracket or parenthese and the final character of the enclosed expression.

``` ts
// No space in between `[` and `1`.
// No space in between `5` and `]`.
const myArray: number[] = [1, 2, 3, 4, 5];
```

``` ts
// Newlines are okay for spreading a long statement across multiple lines.
const myArrayTooLongToFitOnOneLine = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
];
```

## Put a newline at the end of files

In general, source files should terminate with a newline character `\n`.

## Keep lines at or under eighty characters

In general, no one line of code should exceed 80 characters. Where it is at all possible, lines should absolutely not exceed 100 characters in length.

``` ts
const myLongExpressionResult: string = (
    "This code statement is written in such a way that the line length " +
    "consistently stays under eighty characters long. " +
    "This line length limit particularly helps to accomodate those who " +
    "are limited to smaller screens, or who subscribe to the rather " +
    "common practice of displaying code from different source locations " +
    "in two or more columns across a larger screen."
);
```

## Always use semicolons

Always put a semicolon `;` at the end of each line. There should not be any whitespace in between the last character on the line and its terminating semicolon.

``` ts
doStuff();
```

## Commas belong immediately after the left-hand expression

Commas `,` belong on the same line as the left-hand expression, with no space in between the comma and the last character of the expression.
The first non-whitespace character of any line of code should never be a comma.
Commas belong at the end of a line, not at the beginning.

``` ts
const myArray: string[] = ["Hello", "World"];
```

## Use trailing commas in multi-line lists

Always put a trailing comma `,` at the end of multi-line lists, where they are syntactically valid.

``` ts
const myArray: number[] = [
    0x1000,
    0x2000,
    0x4000,
    0x8000,
];
```

## Always enclose block statements within braces

All block statements should be enclosed within braces `{}`, i.e. single-line conditionals or loops without braces around their bodies should not generally be used.

``` ts
if(myExitCondition){
    return;
}
```

``` ts
while(myLoopCondition){
    counter++;
}
```

## Function blocks should not contain blank lines

In general, the implementation of a function or method should not contain empty lines. If a function is made up of several different conceptual units, then they should be separated by explanatory comments instead of by empty lines. If a function is too long or complex to be readable without those empty lines, then parts of the implementation should be moved into other helper functions.

``` ts
// This is a helper function used by myVeryComplicatedProcedure.
// [Comment explaining the first task]
function doTheFirstTask(): void {
    // Imagine this function body is 100 lines long!
    doStuff();
}

// This is a helper function used by myVeryComplicatedProcedure.
// [Comment explaining the second task]
function doTheSecondTask(): void {
    // Imagine this function body is 100 lines long!
    doOtherStuff();
}

// This is a helper function used by myVeryComplicatedProcedure.
// [Comment explaining the third task]
function doTheThirdTask(): void {
    // Imagine this function body is 100 lines long!
    doYetMoreStuff();
}

// [Comment explaining the purpose of my very complicated function]
// Imagine that this function body would be a dense, unreadable 300 lines
// if it wasn't broken up into several helper function calls this way!
function myVeryComplicatedProcedure(): void {
    // [Comment briefly summarizing the first task]
    doTheFirstTask();
    // [Comment briefly summarizing the second task]
    doTheSecondTask();
    // [Comment briefly summarizing the third task]
    doTheThirdTask();
}
```

## Pad infix operators with spaces

An infix operator should have whitespace separating it from both operands.

``` ts
const mySum: number = 100 + 200;
```

``` ts
const myValue: number = myNumberArray[myIndex + 10];
```

## Use parentheses generously when mixing infix operators

When a single expression contains several different infix operators, each group of identical operators should generally be enclosed within parentheses `()`. This helps to avoid any confusion or ambiguity regarding the intended order of operations.

``` ts
const myValue: number = 10 * (20 + myOtherValue);
```

``` ts
const myBoolean: boolean = (
    (firstCondition || secondCondition) &&
    (thirdCondition || fourthCondition)
);
```

## Use space after colons but not before

In objects and in typed declarations, there should be a single space after each colon `:` and no space before it.

``` ts
const myObject: Object {
    myAttribute: "hello world",
};
```

## Prefer double-quoted strings

String literals should be double-quoted `""`. In general, they should not ever be single-quoted `''`.
Template strings (enclosed within backticks ``` `` ```) should generally not be used for string literals that do not actually contain any interpolation.

``` ts
const myString: string = "You say \"goodbye\" and I say \"hello\".";
```

## Use concatenation when writing long string literals

String literals that are too long to fit on a single line should be spread across multiple lines by concatenating many shorter string literals.

``` ts
const myLongStringLiteral = (
    "This is a long string literal. In fact, it is so long, that it could " +
    "not possibly fit on a single line and still be readable. " +
    `Remember that the recommended maximum line length is ${MaxLineLength} ` +
    "characters!"
);
```

## Prefer braces around arrow function bodies

In general, the bodies of arrow functions should always be enclosed within
braces `{}`.

``` ts
myArray.map(value => {
    return value + value;
});
```

## Use seperate declarations

Do not declare multiple variables together on the same line. Use separate declarations, with each declaration on its own line.

``` ts
const myFirstNumber: number = 0;
const mySecondNumber: number = 0;
```

## Start all comments with a space

In general, there should always be a single space character in between a comment's opening slashes `//` and the first character of the comment's text.

``` ts
// Note the space at the beginning of this comment!
```

## Prefer multiple single-line comments to multi-line block comments

In general, long comments should be spread across multiple single line comments (i.e. `// comment`) rather than given in a single multi-line block comment (i.e. `/* comment */`).

``` ts
// This is a longer comment providing a lot of information about a function.
// It describes in detail the function's purpose, its accepted input, and its
// expected output. It's far too much information to fit on just one line.
function myFunction(value: number): number {
    return doStuffWith(value);
}
```

## Prefer comments on their own line to trailing comments

In general, comments should be on their own line, preceding the code that they apply to, instead of on the same line, immediately after the code that they apply to.

``` ts
// [Comment explaining the purpose of my variable]
let myVariable: number = 0;
```

## Prefer "as" to type assertions

Prefer syntax such as `value as Type` over `<Type> value`.
([Why?](https://stackoverflow.com/a/33503842/4099022))

``` ts
const myValue: number = myOtherValue as number;
```

## Prefer Type[] to Array<Type>
    
Prefer type syntax such as `myArray: string[]` to `myArray: Array<string>`.
    
``` ts
const myStringArray: string[] = ["Hello", "World"];
```



# Naming

## Characters allowed in identifiers

In general, dentifiers should be made up only of the characters `A` through `Z`, `a` through `z`, and `0` through `9`. Identifiers generally should not have an underscore `_` in their name, even if they identify private members.

Do not use characters such as emoji or math symbols in variable names.

``` ts
const myAsciiVariableName: number = 0;
```

## Use descriptive names

Functions, classes, variables, and other named entities should have informative, descriptive names. Names should generally not contain abbreviations.

"HTML" abbreviating "HypertextMarkupLanguage" or "WAD" abbreviating "WheresAllTheData" is okay and encouraged, but "Idx" abbreviating "Index" or "Err" abbreviating "Error" is not okay. Please use common sense in judging whether an abbreviation is really necessary, and whether it might make the code more difficult to read.

Single-letter identifiers are strictly disallowed with the exception
of `x`, `y`, `z`, `w`, `i`, `j`, and `k` where they are specifically used to
describe position or vector components,
`t` where used to name the [interpolant parameter of an interpolation function](https://en.wikipedia.org/wiki/Linear_interpolation),
or `a`, `b`, `c, etc. where they are used to name the parameters of a function
with very clear inputs and purpose.

``` ts
// [Comment explaining the purpose of my vector class]
class MyVector {
    x: number;
    y: number;
    z: number;
}
```

``` ts
// Linearly interpolate between the numbers "a" and "b".
// The value "t" should normally be in the inclusive range [0.0, 1.0].
function lerp(a: number, b: number, t: number): Vector {
    return (a * (1 - t)) + (b * t);
}
```

``` ts
// Note that `a` and `b` are acceptable parameter names for
// comparator functions, though single-character variable names
// generally are not allowed.
myArray.sort((a: number, b: number) => {
    return a - b;
});
```

Except for describing the ordering of color channels, e.g. `RGBA` or `ARGB`, do not abbreviate `red` as `r`, `green` as `g`, `blue` as `b`, or `alpha` as `a`.
Instead, write out the full names of each color channel.

``` ts
// [Comment explaining the purpose of my interface]
// Note that each channel attribute is fully written out and not abbreviated.
interface MyColorInterface {
    red: number;
    green: number;
    blue: number;
    alpha: number;
}
```

Do not assign loop variables single-character names such as `x` or `i` if
the value does not literally correspond to a position or to a vector component.
Use descriptive names for loop variables instead, and prefer more descriptive
identifiers like `vectorIndex` over less descriptive identifiers like `index`.

``` ts
for(let vectorIndex: number = 0; vectorIndex < totalVectors; vectorIndex++){
    const myVector: Vector = vectors[vectorIndex];
    doStuffWithVector(myVector);
}
```

## Use PascalCase for classes and constants

Class names, constructors, and the names of constants should be written in PascalCase.
Note that constant in this case does not mean everything declared using `const`, but rather it refers to any variable that is initialized once and never changed during program execution. (Constants are not a matter of syntax in TypeScript, but a matter of intent.)

``` ts
// [Comment explaining the purpose of my constant]
const PlaypalLumpName = "PLAYPAL";
```

``` ts
// [Comment explaining the purpose of my class]
class MyClass {
    // [Comment explaining the purpose of my attribute]
    myAttribute: string;
}
```

## Use camelCase for functions and variables

Names of functions, methods, variables, attributes, and function parameters should be written in camelCase.

``` ts
// [Comment explaining the usage of this function]
function getPaletteCount(): number {
    return 100;
}
```

``` ts
// [Comment explaining the purpose of my class]
class MyClass {
    // [Comment explaining the purpose of my attribute]
    myAttribute: string;
    
    // [Comment explaining why this class has a number-squaring helper]
    mySquaringMethod(value: number): number {
        return value * value;
    }
}
```

## Use camelCase for TypeScript source file names

TypeScript source files should be assigned pascalCase names.

``` text
- file.ts
- fileList.ts
- fileType.ts
```


# Conventions

## Do not use "eval" or the function constructor

Do not ever use the `eval` built-in function. Do not ever use the `Function` constructor to create a new function. These are inefficient and would make jsdoom vulnerable to arbitrary code execution.

## Do not use "var"

Do not declare variables using `var`. Use `let` or `const` instead.

## Prefer "if" and "else if" over "switch" and "case"

In general, a series of `if` and `else if` statements should be used instead of a `switch` statement.

``` ts
if(myVariable === 0){
    doStuff();
}else if(myVariable === 1){
    doOtherStuff();
}else if(myVariable === 2){
    doYetMoreStuff();
}else{
    doDefaultStuff();
}
```

## Do not nest ternary expressions

In general, ternary expressions `a ? b : c` should not be nested.

## Prefer strict equality over regular equality

The equality operator `==` and inequality operator `!=` should not generally be used. Prefer the strict equality operator `===` and strict inequality operator `!==` instead.

``` ts
const myComparison: boolean = (myFirstValue === mySecondValue);
```

## Prefer local state over global state

Code which relies on local state is easier to understand and maintain than code which relies on global state.
It is not possible to completely avoid global state, particularly in code that deals with the DOM. However, global state should be avoided when possible. State should instead be stored locally in scoped variables or class instances.

``` ts
const myConstantVariable: number = 0;
let myMutableVariable: number = 0;
```

## Prefer immutable state over mutable state

Use `const` instead of `let` for references which are not changed.

Where it will not substantially impact performance in a negative way, treat variables and objects as immutable.

## Prefer pure functions over impure functions

Pure functions are those which accept inputs and return an output without making any changes to the inputs and without producing any side-effects. In essence, a pure function is one which can be called at any time, any number of times, and the same inputs will always produce the same output.

``` ts
// [Comment explaining the purpose of my pure function]
function myPureFunction(value: number): number {
    return value + value;
}
```

## Document the impure behavior of functions

In general, functions with side-effects should be avoided. However, this is often not possible, especially in code that is meant to manipulate DOM state.
Functions which do have side-effects should have those side-effects clearly documented in code comments.

``` ts
// [Comment explaining the purpose of my function]
// [Comment explaining the function's side-effects]
function myDomRelatedFunction(): void {
    doStuffWithSideEffects();
}
```

In general, functions should not modify their inputs. When they must, it is important that this behavior be documented.

``` ts
// This function will modify the input object.
// In particular, it assigns a new value to the object's
// "myAttribute" attribute.
function myFunction(myObject: Object): void {
    myObject.myAttribute = "hello world";
}
```

## Class getters should treat the instance as logically const

In general, getters (i.e. methods preceded by the `get` keyword) should treat the instance `this` as [logically const](http://wiki.c2.com/?LogicalConst). Logical const means that the object may technically be modified, but any modification should not affect or be visible to code which uses only the object's intended and documented API.

``` ts
class MyClass {
    // Used to cache the result of the myExpensiveProperty getter.
    private lazilyComputedValue: number = NaN;
    
    // No modification of the class instance whatsoever.
    // `this` is literally const.
    get myProperty(): number {
        return 0x0100;
    }
    
    // Modification is trivial to the outside observer.
    // `this` is logically const.
    get myExpensiveProperty(): number {
        if(Number.isNaN(this.lazilyComputedValue)){
            this.lazilyComputedValue = doExpensiveComputation();
        }
        return this.lazilyComputedValue;
    }
}
```

## Explicitly document types

Typing can be a pain when working with the DOM, but an effort should still be made to include correct types for variables, parameters, and retun types. In general, such types should always be included for internal code that does not deal with the DOM or other complex APIs not designed with static types in mind.

## Prefer selective imports over default imports

In general, selective imports should be used instead of default imports. (A default import is one without braces `{}`, e.g. `import DefaultSymbol from "location";`.)

``` ts
import {WADFile} from "@src/wad/file";
```

However, modules should still export a default symbol where there is an obvious default.

``` ts
// Actual export declared in "@src/wad/file"
export default WADFile;
```

## Prefer absolute over relative imports

In general, absolute import paths (those starting with an "at" sign `@`) should be preferred over relative paths (those starting with a dot `.`). Note that the meaning of these absolute paths are defined by macros in the TypeScript config file `tsconfig.json` and the webpack config file `webpack.config.js`.

``` ts
import {WADFile} from "@src/wad/file";
```

## Order imports logically, then alphabetically by filename

In general, imports should first be ordered by logical group, and then alphabetically by filename. Each group should be separated by a single empty line. Groups should generally be ordered from most general to most specialized. Here is a guideline for how to order these groups:

1. Native dependencies, such as Node.js imports.
2. External dependencies, i.e. those listed in `package.json`.
3. Jsdoom library dependencies, e.g. `@src/wad/` or `@src/lumps/`.
4. Jsdoom UI or engine dependencies, e.g. `@web/`.

``` ts
import * as fs from "fs";
import * as path from "path";

import * as UPNG from "upng-js";

import {WADFile} from "@src/wad/file";
import {WADFileList} from "@src/wad/fileList";

import {LumpTypeView} from "@web/lumpTypeView";
```

## Order of class member declarations

In classes or objects, attributes should generally be defined in the source in the following order. In general, a single empty line should separate each group of listed declarations from the next group, and single empty line should separate each function or method declaration.

1. Static class attributes.
2. Instance attributes.
3. Constructor(s)
4. Static class functions
5. Instance methods

``` ts
// [Comment explaining the purpose of my class]
class MyClass {
    // [Comment explaining the purpose of my constant]
    static readonly MyStaticConstant: number = 0x8000;
    
    // [Comment explaining the purpose of my attribute]
    myFirstAttribute: string;
    // [Comment explaining the purpose of my attribute]
    mySecondAttribute: string;
    
    constructor() {
        this.myFirstAttribute = "hello";
        this.mySecondAttribute = "world";
    }
    
    // [Comment explaining the purpose of my function]
    static myStaticFunction(): MyClass {
        return new MyClass();
    }
    
    // [Comment explaining the purpose of my method]
    getTotalLength(): number {
        return this.myFirstAttribute.length + this.mySecondAttribute.length;
    }
}
```

## Prefer rest arguments over referring to the arguments object

Functions which accept a variable number of arguments should do so using a rest parameter `...` and not by accessing the `arguments` object. In general, functions should never access or manipulate the `arguments` object.

``` ts
// [Comment explaining the purpose of my function]
function myVariadicFunction(...strings: string[]): void {
    doStuffWith(strings);
}
```

## Avoid the spread operator

The spread operator `...` should be avoided except for where it replaces an expression such as `myFunction.apply(null, myArgumentList)` with one such as `myFunction(...myArgumentList)`.

``` ts
// Use `Array.concat` instead of the spread operator
const myConcatenatedArray = (
    myFirstArray.concat(mySecondArray)
);
```

``` ts
// Assign each key individually or, if the keys are numerous or not
// necessarily known ahead of time, use `Object.assign` instead of
// using the spread operator.
const myComposedObject = {};
Object.assign(myComposedObject, myFirstObject, mySecondObject);
```

## Prefer template strings over concatenation

In general, template strings should be used instead of string concatenation or joining.

``` ts
const myString: string = `${helloString} ${worldString}!`;
```

## Prefer joining over repeated concatenation

Strings that are incrementally assembled, e.g. in a loop, should be pushed to an array and combined at the end of the loop with a single `join` statement. Generally, such strings should not be assembled via repeated concatenation.

``` ts
// Create a comma-separated list representing the vertexes in an array.
function vertexListToString(vertexes: Vertex[]): string {
    const parts: string[] = [];
    for(const vertex of vertexes){
        parts.push(`(${vertex.x}, ${vertex.y})`);
    }
    return parts.join(", ");
}
```
