# Jsdoom Style Guide

The purpose of this style guide is to keep jsdoom's source code readable,
approachable, consistent, and maintainable.
When contributing to jsdoom, please follow these guidelines.
Pull requests containing code that does not follow the guidelines may be
rejected until the code has been made conformant.

These are not strict rules! Exceptions are allowed where it improves
readability. However, exceptions should be just that: Exceptional.
Exceptions should be made sparingly, if they are made at all.

Please [create a GitHub issue](https://github.com/pineapplemachine/jsdoom/issues/new)
if you would like to request a change or an addition to this style guide.

You can link to a particular guideline in this style guide by using a url
such as the below example, where the numbers at the end are the same as those at
the beginning of the header where you wish to link.
You can also copy the target URL of items in the table of contents.

``` text
https://github.com/pineapplemachine/jsdoom/blob/master/style.md#user-content-1.4.1.
```

Throughout this guide, specific examples of conforming code will be provided
like so:

``` ts
// An example of conforming code
console.log("jsdoom is pretty neat");
```

# Table of Contents

* [**1.** Whitespace](#user-content-1.)
    * [**1.1.** Indent using four spaces](#user-content-1.1.)
    * [**1.2.** Do not use double indents](#user-content-1.2.)
    * [**1.3.** Do not use partial indents](#user-content-1.3.)
    * [**1.4.** Whitespace as it pertains to braces, brackets, and paretheses](#user-content-1.4.)
        * [**1.4.1.** No characters inside empty literals, blocks, or expressions](#user-content-1.4.1.)
        * [**1.4.2.** Nested code should be indented at one additional level](#user-content-1.4.2.)
        * [**1.4.3.** Code within braces should not be in-line](#user-content-1.4.3.)
        * [**1.4.4.** Do not put open braces on their own line](#user-content-1.4.4.)
        * [**1.4.5.** Do not pad code between paretheses or brackets](#user-content-1.4.5.)
    * [**1.5.** Use a single space after colons but no whitespace before](#user-content-1.5.)
    * [**1.5.** Use whitespace after commas but not before](#user-content-1.5.)
    * [**1.6.** Infix operators](#user-content-1.6.)
        * [**1.6.1.** Put a single space between an infix operator and its left operand](#user-content-1.6.1.)
        * [**1.6.2.** Put whitespace between an infix operator and its right operand](#user-content-1.6.2.)
* [**2.** Newlines](#user-content-2.)
    * [**2.1.** Lines should not exceed eighty characters](#user-content-2.1.)
    * [**2.4.** Line breaks](#user-content-2.4.)
        * [**2.4.1.** Line breaks should not occur anywhere not mentioned in **2.4.**](#user-content-2.4.1.)
        * [**2.4.2.** Line breaks should always occur after a semicolon](#user-content-2.4.2.)
        * [**2.4.3.** Line breaks may occur after a comma](#user-content-2.4.3.)
        * [**2.4.4.** Line breaks may occur after an open brace, bracket, or parethese](#user-content-2.4.4.)
        * [**2.4.5.** Line breaks may occur after an infix operator](#user-content-2.4.5.)
        * [**2.4.6.** Line breaks may occur after the last expression in a list](#user-content-2.4.6.)
        * [**2.4.7.** Line breaks may occur after either symbol of a ternary expression](#user-content-2.4.7.)
    * [**2.2.** Blank lines](#user-content-2.2.)
        * [**2.2.1.** Source files should not begin with a blank line](#user-content-2.2.1.)
        * [**2.2.2.** Functions and methods should be padded by blank lines](#user-content-2.2.2.)
        * [**2.2.3.** Function blocks should not contain blank lines](#user-content-2.2.3.)
        * [**2.2.4.** Logical groups of imports should be padded by blank lines](#user-content-2.2.4.)
        * [**2.2.5.** Logical groups of class members should be padded by blank lines](#user-content-2.2.5.)
    * [**2.5.** There should be a newline at the end of each source file](#user-content-2.5.)
* [**3.** Punctuation](#user-content-3.)
    * [**3.1.** Always use semicolons at the end of statements](#user-content-3.1.)
    * [**3.2.** Use trailing commas in multi-line lists](#user-content-3.2.)
    * [**3.3.** Always enclose block statements within braces](#user-content-3.3.)
    * [**3.4.** Use parentheses generously when mixing infix operators](#user-content-3.4.)
    * [**3.5.** Arrow functions](#user-content-3.5.)
        * [**3.5.1.** Prefer parentheses around arrow function parameters](#user-content-3.5.1.)
        * [**3.5.2.** Prefer braces around arrow function bodies](#user-content-3.5.2.)
    * [**3.6.** Strings](#user-content-3.6.)
        * [**3.6.1.** Prefer double-quoted strings](#user-content-3.6.1.)
        * [**3.6.2.** Use concatenation when writing long string literals](#user-content-3.6.2.)
* [**4.** Comments](#user-content-4.)
    * [**4.1.** Begin all comments with a single space](#user-content-4.1.)
    * [**4.2.** Prefer multiple single-line comments to multi-line block comments](#user-content-4.2.)
    * [**4.3.** Prefer comments on their own line to trailing comments](#user-content-4.3.)
    * [**4.4.** Trailing comments should have one space between "//" and the end of the line](#user-content-4.4.)
    * [**4.5.** Documenting comments](#user-content-4.5.)
        * [**4.5.1.** Document all classes and interfaces](#user-content-4.5.1.)
        * [**4.5.2.** Document all functions and methods](#user-content-4.5.2.)
        * [**4.5.3.** Document the impure behavior of functions](#user-content-4.5.3.)
        * [**4.5.4.** Document all constants and enumerations](#user-content-4.5.4.)
        * [**4.5.6.** Document variables or attributes that are not completely self-explanatory](#user-content-4.5.6.)
        * [**4.5.6.** Document statements or expressions that are not completely self-explanatory](#user-content-4.5.6.)
    * [**4.6.** Todos](#user-content-4.6.)
        * [**4.6.1.** Todo comments should begin with "// TODO:"](#user-content-4.6.1.)
        * [**4.6.2.** Todo comments should include an explanation of the unfinished task](#user-content-4.6.2.)
        * [**4.6.3.** Todo comments should include the URL for a relevant issue or PR](#user-content-4.6.3.)
* [**5.** Names](#user-content-5.)
    * [**5.1.** Use descriptive names](#user-content-5.1.)
    * [**5.2.** Do not use needless or unconventional abbreviations](#user-content-5.2.)
    * [**5.3.** Names should contain only "A"-"Z", "a"-"z", and "0"-"9"](#user-content-5.3.)
    * [**5.4.** Classes and constants should have PascalCase names](#user-content-5.4.)
    * [**5.5.** Functions and variables should have camelCase names](#user-content-5.5.)
    * [**5.6.** TypeScript source files should have camelCase names](#user-content-5.6.)
    * [**5.7.** Single-character names](#user-content-5.7.)
        * [**5.7.1.** Single-character names should not be used except as mentioned in **5.7.**](#user-content-5.7.1.)
        * [**5.7.2.** Parameters with very clear purpose may be named "a", "b", "c", and so on](#user-content-5.7.2.)
        * [**5.7.3.** The interpolant parameter should be named "t"](#user-content-5.7.3.)
        * [**5.7.4.** Extremely generic type parameters may be named "T"](#user-content-5.7.4.)
        * [**5.7.5.** Coordinates should be named "x", "y", "z", and "w"](#user-content-5.7.5.)
        * [**5.7.6.** Vector components should be named "ijk" or "xyzw"](#user-content-5.7.6.)
* [**6.** Syntax conventions](#user-content-6.)
    * [**6.1.** Do not use "eval" or the function constructor](#user-content-6.1.)
    * [**6.2.** Do not use "var"](#user-content-6.2.)
    * [**6.3.** Prefer "const" to "let" when declaring variables](#user-content-6.3.)
    * [**6.4.** Do not use undeclared variables](#user-content-6.4.)
    * [**6.5.** Use seperate declarations](#user-content-6.5.)
    * [**6.6.** Prefer "if" and "else if" over "switch" and "case"](#user-content-6.6.)
    * [**6.7.** Do not nest ternary expressions](#user-content-6.7.)
    * [**6.8.** Prefer strict equality over regular equality](#user-content-6.8.)
    * [**6.9.** Prefer "as" when writing type assertions](#user-content-6.9.)
    * [**6.10.** Prefer Type[] to Array](#user-content-6.10.)
    * [**6.11.** Do not refer to the "arguments" object](#user-content-6.11.)
    * [**6.12.** Prefer rest parameters over referring to the "arguments" object](#user-content-6.12.)
    * [**6.13.** Avoid the spread operator in array and object literals](#user-content-6.13.)
    * [**6.14.** Do not mix full object properties with shorthand properties](#user-content-6.14.)
    * [**6.15.** Imports](#user-content-6.15.)
        * [**6.15.1.** Imports belong at the beginning of a source file](#user-content-6.15.1.)
        * [**6.15.2.** Prefer selective imports over default imports](#user-content-6.15.2.)
        * [**6.15.3.** Prefer absolute over relative imports](#user-content-6.15.3.)
        * [**6.15.4.** Group and order imports logically, then alphabetically by filename](#user-content-6.15.4.)
        * [**6.15.5.** Do not include unused imports](#user-content-6.15.5.)
        * [**6.15.6.** Avoid importing modules for side-effects only](#user-content-6.15.6.)
    * [**6.16.** Ordering of class members](#user-content-6.16.)
        * [**6.16.1.** Declare static attributes first](#user-content-6.16.1.)
        * [**6.16.2.** Declare instance attributes second](#user-content-6.16.2.)
        * [**6.16.3.** Declare the constructor third](#user-content-6.16.3.)
        * [**6.16.4.** Declare static member functions fourth](#user-content-6.16.4.)
        * [**6.16.5.** Declare instance methods last](#user-content-6.16.5.)
* [**7.** Program logic conventions](#user-content-7.)
    * [**7.1.** Prefer local state over global state](#user-content-7.1.)
    * [**7.2.** Prefer immutable state over mutable state](#user-content-7.2.)
    * [**7.3.** Prefer pure functions over impure functions](#user-content-7.3.)
    * [**7.4.** Functions should not modify their inputs](#user-content-7.4.)
    * [**7.5.** Class getters should treat the instance as logically const](#user-content-7.5.)
    * [**7.6.** Prefer template strings over concatenation](#user-content-7.6.)
    * [**7.7.** Prefer joining over repeated concatenation](#user-content-7.7.)   



## <a id="1."></a> 1. Whitespace

The following guidelines mainly pertain to the use of whitespace in code.

### <a id="1.1."></a> 1.1. Indent using four spaces

Code is indented using four space characters.
Do not indent with tab characters.

``` ts
// [Comment explaining the purpose of my function]
function myFunction(): void {
    doStuff();
    if(condition){
        doOtherStuff();
    }
}
```

### <a id="1.2."></a> 1.2. Do not use double indents

Indentation must be in such a way that each line is indented at either the
same level as the last line, one more level, or one less.
There should never be a jump of two or more indentation levels between lines.

Longer expressions made up of chained function calls should be broken across
multiple lines by using several shorter statements with intermediate
assignments, or by putting the code inside a pair of paretheses `()` etc.
on a new, idented line.
They should _not_ be broken across lines by starting each line with the
right-hand part of a member access, e.g. having a line begin with `.map(...)`.

``` ts
myArray.map((value) => {
    return transformMyValue(value);
}).filter((value) => {
    return filterMyValue(value);
});
```

### <a id="1.3."></a> 1.3. Do not use partial indents

There should never be a partial change in indentation.
All changes in indentation from one line to the next should always be
in multiples of four space characters.

### <a id="1.4."></a> 1.4. Whitespace as it pertains to braces, brackets, and paretheses

The following guidelines mainly pertain to how whitespace should be
used around braces `{}`, square brackets `[]`, angle brackets `<>`, and
parentheses `()`.

#### <a id="1.4.1."></a> 1.4.1. No characters inside empty literals, blocks, or expressions

Where an open brace `{`, parenthese `(`, etc. is followed by a corresponding
closing brace `}`, parenthese `)`, etc. with no code in between, there should
not be any whitespace, comments, or other characters in between those open and
closing characters.

``` ts
const myEmptyObject: Object = {};
```

``` ts
const myEmptyArray: number[] = [];
```

``` ts
myFunctionInvokedWithNoArguments();
```

``` ts
// [Comment explaining the purpose of my unconventional loop with no body]
while(myIndex++ < myMaximumIndex){}
```

#### <a id="1.4.2."></a> 1.4.2. Nested code should be indented at one additional level

Where a statement is spread across multiple lines, the lines between a
corresponding pair of braces `{}`, paretheses `()`, square brackets `[]`,
or angle brackets `<>` should be indented at one additional level.

``` ts
const myMultiLineObjectLiteral: Object = {
    myFirstAttribute: 1,
    mySecondAttribute: 2,
};
```

``` ts
const myMultiLineExpression: boolean = (
    myFirstCondition &&
    mySecondCondition
);
```

``` ts
const myMultiLineArrayLiteral: string[] = [
    "Hello world",
    "How are you?",
];
```

#### <a id="1.4.3."></a> 1.4.3. Code within braces should not be in-line

Open braces `{` should always be followed by a newline and close braces `}`
should always be preceded by a newline.
The code in between corresponding braces should be indented at one level
further than the lines containing those braces.
Normally, an open brace `{` should not be immediately followed by any
character other than a corresponding closing brace `}` or a newline `\n`.

``` ts
const myObject: Object = {
    myAttribute: doStuff({
        myOption: 1,
    });
};
```

#### <a id="1.4.4."></a> 1.4.4. Do not put open braces on their own line

Open braces `{` should _not_ be preceded by a newline.
Open braces `{` should be on the same line as the statement or
expression that they are a part of.

#### <a id="1.4.5."></a> 1.4.5. Do not pad code between paretheses or brackets

Except for where an expression is distributed across several lines due to its
length, expressions or blocks inside paretheses `()`, square brackets `[]`,
or angle brackets `<>` should not have spaces in between the opening character
and the first character of the enclosed expression, nor in between the closing
character and the final character of the enclosed expression.

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

### <a id="1.5."></a> 1.5. Use a single space after colons but no whitespace before

In objects and in typed declarations, there should be a single space after each
colon `:` and no space before it.

``` ts
const myObject: Object {
    myAttribute: "hello world",
};
```

### <a id="1.5."></a> 1.5. Use whitespace after commas but not before

In comma-separated lists, there should be whitespace after each comma `,`
and no space before it.

If the next item in a list after a given comma appears on the same line,
then there should be a single space in beween the comma and the following
non-whitespace character.
If the next item in the list appears on the following line, then there should
be a newline immediately after the comma and the next list item should be
indented at the appropriate level.

``` ts
const myArray: number[] = [1, 2, 3, 4];
```

``` ts
const myMultiLineArray: string[] = [
    "Hello",
    "World",
];
```

### <a id="1.6."></a> 1.6. Infix operators

The following guidelines mainly pertain to the use of whitespace around
infix operators, e.g. `+` or `*`.

### <a id="1.6.1."></a> 1.6.1. Put a single space between an infix operator and its left operand

Infix operators should appear on the same line as the last character of their
left operand. They should be separated from the last non-whitespace character
of that left operand by a single space character.

### <a id="1.6.2."></a> 1.6.2. Put whitespace between an infix operator and its right operand

An infix operator should have either a single space separating it from the
first non-whitespace character of its right operand, or it should be
immediately followed by a newline with the right operand placed at the correct
indentation level on the next line.

``` ts
const mySum: number = 100 + 200;
```

``` ts
const myMultiLineExpression: boolean = (
    myFirstCondition ||
    mySecondCondition
);
```




## <a id="2."></a> 2. Newlines

The following guidelines mainly pertain to the placement of new lines and
blank lines in code.

### <a id="2.1."></a> 2.1. Lines should not exceed eighty characters

In general, no one line of code should exceed 80 characters.
Please consider eighty characters to be a soft limit and one hundred characters
to be a hard length limit.

### <a id="2.4."></a> 2.4. Line breaks

The following guidelines mainly pertain to where line breaks should appear
in code.

#### <a id="2.4.6."></a> 2.4.6. Line breaks should not occur anywhere not mentioned in 2.4.

Line breaks on lines containing code should not occur under circumstances
other than the ones explicitly mentioned below.

Comments may exceptionally appear in between a character that would normally
precede a line break and the terminating newline.
However, this style of comments is not encouraged.
In general, comments should appear on their own lines and not at the end
of a line of code. (See `4.3.`.)

#### <a id="2.4.2."></a> 2.4.2. Line breaks should always occur after a semicolon

Semicolons terminating a statement should be immediately followed by a
newline. Two statements should not appear on the same line.

``` ts
const myFirstDeclaration: number = 1;
const mySecondDeclaration: number = 2;
```

#### <a id="2.4.3."></a> 2.4.3. Line breaks may occur after a comma

Long lists of arguments, parameters, attributes, or other comma-separated
lists may be broken up by placing newlines after the commas.

``` ts
const myMultiLineArray: number[] = [
    0x0100,
    0x0200,
    0x0400,
];
```

#### <a id="2.4.4."></a> 2.4.4. Line breaks may occur after an open brace, bracket, or parethese

The code in between braces, brackets, etc. may appear on separate lines
and be indented at one additional level.

#### <a id="2.4.5."></a> 2.4.5. Line breaks may occur after an infix operator

It is appropriate for a line break to appear after an infix operator and
before its right operand.

``` ts
const myMultiLineExpression: boolean = (
    myFirstCondition ||
    mySecondCondition
);
```

#### <a id="2.4.6."></a> 2.4.6. Line breaks may occur after the last expression in a list

The last character of a multi-line list should normally be a trailing comma.
However, in the case that the list appears on one line yet not on the same
line as the closing bracket `]` or other character, it is appropriate for
a line break to appear after the last item in the list.

``` ts
const myValue: number = myMultiLineFunctionInvocation(
    100, 200, 300, 400, 500, 600
);
```

#### <a id="2.4.7."></a> 2.4.7. Line breaks may occur after either symbol of a ternary expression

A line break may immediately follow the first `?` or second `:` symbol of
a ternary expression, or both, when breaking the expression across several
lines will improve readability.

``` ts
const myTernaryExpressionResult: string = (myCondition ?
    "My first string literal" :
    "My second string literal"
);
```

### <a id="2.2."></a> 2.2. Blank lines

The following guidelines mainly specifically to the placement of blank lines.
A blank line is a line which contains no characters or which contains
only whitespace characters.

#### <a id="2.2.1."></a> 2.2.1. Source files should not begin with a blank line

The first line in a source file should not be a blank line.

#### <a id="2.2.2."></a> 2.2.2. Functions and methods should be padded by blank lines

Function or method declarations should be padded on each side by a single
blank line, except for where the immediately previous or following
line is the first line of the class declaration containing a method, or the
line containing a class declaration's closing brace `}`.

This does _not_ apply to helper functions that are declared inside another
function. In general, function blocks should not contain blank lines, not
even to pad helper function declarations. (See `2.2.3.`.)

``` ts
// [Comment explaining the purpose of my function]
function myFirstFunction(): void {
    doStuff();
}

// [Comment explaining the purpose of my function]
function mySecondFunction(): void {
    doStuff();
}

// [Comment explaining the purpose of my function]
function myThirdFunction(): void {
    doStuff();
}
```

``` ts
class MyClass {
    // [Comment explaining the purpose of my method]
    myFirstMethod(): void {
        doStuff();
    }

    // [Comment explaining the purpose of my method]
    mySecondMethod(): void {
        doStuff();
    }
    
    // [Comment explaining the purpose of my method]
    myThirdMethod(): void {
        doStuff();
    }
}
```

#### <a id="2.2.3."></a> 2.2.3. Function blocks should not contain blank lines

The implementation of a function or method should not contain blank lines.
If a function is made up of several different conceptual units,
then they should be separated by explanatory comments instead of separated
by blank lines.
If a function is too long or complex to be readable without those empty lines,
then parts of the implementation should be moved into other helper functions.

#### <a id="2.2.4."></a> 2.2.4. Logical groups of imports should be padded by blank lines

Logical groups of imports should be separated from each other by a single
blank line.
See `6.15.` for more information about how imports should be grouped.

#### <a id="2.2.5."></a> 2.2.5. Logical groups of class members should be padded by blank lines

Logical groups of class members should be separated from each other by a single
blank line.
See `6.16.` for more information about how class members should be grouped.

### <a id="2.5."></a> 2.5. There should be a newline at the end of each source file

TypeScript source files should terminate with a newline character `\n`.



## <a id="3."></a> 3. Punctuation

The following guidelines mainly pertain to the use of punctuation characters
in code.

### <a id="3.1."></a> 3.1. Always use semicolons at the end of statements

Statements should always be terminated by a semicolon `;`.
Do not trust JavaScript's automatic semicolon insertion to get it right.

### <a id="3.2."></a> 3.2. Use trailing commas in multi-line lists

Where it is syntactically valid, the last item in a comma-separated list that
spans more than one line should be followed by a comma `,`.

``` ts
const myMultiLineArray: number[] = [
    0x0100,
    0x0200,
    0x0400,
];
```

### <a id="3.3."></a> 3.3. Always enclose block statements within braces

Block statements such as the body of a loop or an `if` statement should
always be enclosed within braces, even if it is syntactically valid to
omit those braces.
Single-line conditionals or loops without braces around their bodies should
not be used.

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

### <a id="3.4."></a> 3.4. Use parentheses generously when mixing infix operators

When a single expression contains several different infix operators, each group
of identical operators should generally be enclosed within parentheses `()`.
This helps to avoid any confusion or ambiguity regarding the intended order of
operations.

``` ts
const myValue: number = 10 * (20 + myOtherValue);
```

``` ts
const myBoolean: boolean = (
    (firstCondition || secondCondition) &&
    (thirdCondition || fourthCondition)
);
```

### <a id="3.5."></a> 3.5. Arrow functions

The following guidelines mainly pertain to the use of punctuation characters
as they apply to arrow functions.

#### <a id="3.5.1."></a> 3.5.1. Prefer parentheses around arrow function parameters

The parameter list of an arrow function should always be enclosed
within paretheses `()`, even when there is only a single parameter.

``` ts
myArray.map((value) => {
    return value + value;
});
```

#### <a id="3.5.2."></a> 3.5.2. Prefer braces around arrow function bodies

The bodies of arrow functions should always be enclosed within braces `{}`,
even when the function body contains only a `return` statement.

``` ts
myArray.filter((value) => {
    return value > 0;
});
```

### <a id="3.6."></a> 3.6. Strings

The following guidelines mainly pertain to the use of punctuation characters
as they apply to string literals.

#### <a id="3.6.1."></a> 3.6.1. Prefer double-quoted strings

String literals should be double-quoted `""`.
String literals should not ever be single-quoted `''`, even when the literal
itself contains double quotes.

Template strings (enclosed within backticks) should not be used for
string literals that do not actually contain any interpolation.

``` ts
const myString: string = "You say \"goodbye\" and I say \"hello\".";
```

#### <a id="3.6.2."></a> 3.6.2. Use concatenation when writing long string literals

String literals that are too long to fit on a single line should be spread
across multiple lines by concatenating many shorter string literals.

``` ts
const myLongStringLiteral = (
    "This is a long string literal. In fact, it is so long, that it could " +
    "not possibly fit on a single line and still be readable. " +
    `Remember that the recommended maximum line length is ${MaxLineLength} ` +
    "characters!"
);
```



## <a id="4."></a> 4. Comments

The following guidelines mainly pertain to what is expected of code comments.

### <a id="4.1."></a> 4.1. Begin all comments with a single space

There should be a single space character in between a comment's opening
slashes `//` and the first character of the comment's text.

``` ts
// Note the space at the beginning of this comment!
```

### <a id="4.2."></a> 4.2. Prefer multiple single-line comments to multi-line block comments

Long comments should be spread across multiple single line comments
(i.e. `// comment`) rather than given in a single multi-line block comment
(i.e. `/* comment */`).

``` ts
// This is a longer comment providing a lot of information about a function.
// It describes in detail the function's purpose, its accepted input, and its
// expected output. It's far too much information to fit on just one line.
function myFunction(value: number): number {
    return doStuffWith(value);
}
```

### <a id="4.3."></a> 4.3. Prefer comments on their own line to trailing comments

Comments should usually not be on the same line as code.
Comments should be on their own line, preceding the code that they apply to.

``` ts
// [Comment explaining the purpose of my variable]
let myVariable: number = 0;
```

### <a id="4.4."></a> 4.4. Trailing comments should have one space between "//" and the end of the line

Note that `4.3.` discourages the use of trailing comments.
When trailing comments _are_ used, there should always be exactly one space
in between the last character of code and the first character `/` of the
trailing comment.

``` ts
doStuff(); // My trailing comment
```

### <a id="4.5."></a> 4.5. Documenting comments

The following guidelines mainly pertain to when documenting comments are
encouraged or required.

#### <a id="4.5.1."></a> 4.5.1. Document all classes and interfaces

Every class and interface should have a comment explaining its purpose, even
if it is only repeating information that should be self-evident.

``` ts
// This class stores the color channel information taken from a PLAYPAL
// lump. Note that the color data is 24-bit. Color channel values should
// always be in the range [0, 256] inclusive.
class MyColorClass {
    // The color's 8-bit red color channel.
    red: number;
    // The color's 8-bit green color channel.
    green: number;
    // The color's 8-bit blue color channel.
    blue: number;
}
```

#### <a id="4.5.2."></a> 4.5.2. Document all functions and methods

Every function or method should have a comment explaining its purpose, even
if it is only repeating information that should be self-evident.

``` ts
// Log a friendly greeting to the console.
function sayHello(): void {
    console.log("Hello, world!");
}
```

#### <a id="4.5.3."></a> 4.5.3. Document the impure behavior of functions

Functions and methods with impure behavior should have that impure behavior
documented in comments to the greatest extent that is practical.

Note that impure behavior includes modifying a function's inputs or
reading or writing global state.

``` ts
// [Comment explaining the purpose of my function]
// Calling this function will cause `myPreviouslyDeclaredGlobal`
// to be modified.
function myFunctionWithSideEffects(): void {
    myPreviouslyDeclaredGlobal = doStuff();
}
```

#### <a id="4.5.4."></a> 4.5.4. Document all constants and enumerations

Constants - defined as values set once and never reassigned, not necessarily
any variable declared using `const` - should always be accompanied by a comment
explaining their purpose and their value.

``` ts
// The Doom engine palette lump is always named "PLAYPAL".
const PlaypalLumpName: string = "PLAYPAL";
```

Enumerations should be preceded by a documenting comment, and every member
should have a comment explaining its purpose.

``` ts
// Enumeration of Doom linedef flags which pertain to texturing.
enum LinedefTextureFlags {
    // Unpegged upper texture
    UpperUnpegged = 0x0008,
    // Unpegged lower texture
    LowerUnpegged = 0x0010,
}
```

#### <a id="4.5.6."></a> 4.5.6. Document variables or attributes that are not completely self-explanatory

It is not necessary to write a comment explaining every variable or attribute,
but those whose function is not immediately obvious from looking at the
declaration should be accompanied by documentation comments.

#### <a id="4.5.6."></a> 4.5.6. Document statements or expressions that are not completely self-explanatory

It is not necessary, and in fact discouraged, to write a comment explaining
every statement and expression.
However, those statements and expressions which are more complicated or with
less obvious purpose should be accompanied by documentation comments.

``` ts
// Do stuff with the length of the vector described by (x, y).
doStuffWith(Math.sqrt((x * x) + (y * y)));
```

### <a id="4.6."></a> 4.6. Todos

The following guidelines mainly pertain to how "TODO" comments should be used.

#### <a id="4.6.1."></a> 4.6.1. Todo comments should begin with "// TODO:"

Comments recording future or unfinished tasks should consistently begin
with the characters `// TODO: `.

When a todo comment is too long to fit on a single line, only the first line
explaining the task should be preceded by `TODO`.

``` ts
function myScaffoldingFunction(): void {
    // TODO: Implement this function
}
```

#### <a id="4.6.2."></a> 4.6.2. Todo comments should include an explanation of the unfinished task

It is not acceptable to write a todo comment without including some written
explanation of the task that is not finished.
Do not write a comment that says `// TODO` without being followed by more
text explaining why the comment is present.

#### <a id="4.6.3."></a> 4.6.3. Todo comments should include the URL for a relevant issue or PR

Where practical, todo comments should refer to an issue in the issue tracker,
or to a relevant pull request.
In general, if such a relevant issue or other link does not exist, then it
should be created and referenced in the todo comment before the comment is
included in the master branch of the code repository

``` ts
// TODO: Create a help page and assign the URL.
// See https://github.com/pineapplemachine/jsdoom/issues/123456
const myHelpUrl: string = "";
```



## <a id="5."></a> 5. Names

The following guidelines mainly pertain to the naming of variables,
classes, etc. and source file names.

### <a id="5.1."></a> 5.1. Use descriptive names

All classes, functions, variables etc. should be assigned descriptive names
that make their purpose as clear as possible.
Avoid using vague or generic names that do not communicate purpose.

### <a id="5.2."></a> 5.2. Do not use needless or unconventional abbreviations

Identifiers should generally not contain abbreviations unless those
abbreviations are essentially universal and/or the text that they are
abbreviating is impractically long to actually include in code.

"HTML" abbreviating "HypertextMarkupLanguage" or "WAD" abbreviating
"WheresAllTheData" is good and encouraged.
However, "Idx" abbreviating "Index" or "Err" abbreviating "Error" is not
acceptable. Please use common sense in judging whether an abbreviation is
really necessary, and whether it might make the code more difficult to read.

### <a id="5.3."></a> 5.3. Names should contain only "A"-"Z", "a"-"z", and "0"-"9"

Identifiers should be made up only of the characters `A` through `Z`,
`a` through `z`, and `0` through `9`.
Identifiers should not have an underscore `_` in their name, even if they
identify private members.

Do not use characters such as emoji or math symbols in variable names.

``` ts
const myAsciiVariableName: number = 0;
```

### <a id="5.4."></a> 5.4. Classes and constants should have PascalCase names

Class and interface names names, constructors, enumerations, and the names of
constants should be written in PascalCase.

Note that constant in this case does not mean everything declared using `const`,
but rather it refers to any variable that is initialized once and never changed
during program execution.
Constants are not a matter of syntax in TypeScript, but a matter of intent.

### <a id="5.5."></a> 5.5. Functions and variables should have camelCase names

Names of functions, methods, variables, attributes, function parameters,
and anything else that is not mentioned by `5.4.` should be written
using camelCase.

### <a id="5.6."></a> 5.6. TypeScript source files should have camelCase names

TypeScript source files and directories containing TypeScript source files
should be assigned pascalCase names.

``` text
- file.ts
- fileList.ts
- fileType.ts
```

### <a id="5.7."></a> 5.7. Single-character names

The following guidelines mainly pertain to the use of single-character names.
Single-character names are mostly discouraged, but are still the most
appropriate naming choice for some cases.

#### <a id="5.7.1."></a> 5.7.1. Single-character names should not be used except as mentioned in 5.7.

Except as otherwise mentioned below in `5.7.`, single-character names should
not normally be used.

Here is a rule of thumb: Single-character identifiers should only be used when
it follows a long-standing mathematical or programming convention, such that
choosing any other name may make the purpose of the variable, etc. less clear.

#### <a id="5.7.2."></a> 5.7.2. Parameters with very clear purpose may be named "a", "b", "c", and so on

Sequential single-letter identifiers such as `a`, `b`, `c`, and so on are
acceptable where they are used to name the parameters of a function with very
clear inputs and purpose, where those inputs are mainly distinguished by
the order in which they appear.

``` ts
// `a` and `b` are the preferred parameter names for comparator functions.
myArray.sort((a: number, b: number) => {
    return a - b;
});
```

#### <a id="5.7.3."></a> 5.7.3. The interpolant parameter should be named "t"

Where a parameter or other named value is used as the
[interpolant parameter of an interpolation function](https://en.wikipedia.org/wiki/Linear_interpolation),
that value should be named `t`.

``` ts
// Linearly interpolate between the numbers `a` and `b`.
// The value `t` should normally be in the inclusive range [0.0, 1.0].
function lerp(a: number, b: number, t: number): Vector {
    return (a * (1 - t)) + (b * t);
}
```

#### <a id="5.7.4."></a> 5.7.4. Extremely generic type parameters may be named "T"

A generic function or class accepting a single type parameter may have
that parameter named `T` if the purpose of the parameter is generic enough
to not lend itself to a more descriptive name.

#### <a id="5.7.5."></a> 5.7.5. Coordinates should be named "x", "y", "z", and "w"

The single-character names `x`, `y`, `z`, and `w` are acceptable and encouraged
when they refer to spatial coordinates along the corresponding axes.

#### <a id="5.7.6."></a> 5.7.6. Vector components should be named "ijk" or "xyzw"

The components of vectors or quaternions should normally be named
either `i`, `j`, `k` or `x`, `y`, `z`, `w`.

``` ts
// [Comment explaining the purpose of my three-dimensional vector class]
class MyVector {
    x: number;
    y: number;
    z: number;
}
```



## <a id="6."></a> 6. Syntax conventions

The following guidelines mainly pertain to what TypeScript syntax options should
be favored or avoided.

### <a id="6.1."></a> 6.1. Do not use "eval" or the function constructor

Do not use the `eval` built-in function.
Do not use the `Function` constructor to create a new function.
This functionality is not efficient and it opens the door to security issues.

### <a id="6.2."></a> 6.2. Do not use "var"

Do not use `var` when declaring variables. Use `let` or `const` instead.

``` ts
const myVariable: number = 0;
```

### <a id="6.3."></a> 6.3. Prefer "const" to "let" when declaring variables

Use `const` instead of `let` whenever it is syntactically valid, i.e. when the
declared reference is never changed.

### <a id="6.4."></a> 6.4. Do not use undeclared variables

Do not use variables without declaring them.
Do not reference variables that have not yet been declared at the time
that the code will be executed.

### <a id="6.5."></a> 6.5. Use seperate declarations

Do not declare multiple variables together on the same line.
Use separate declarations, with each declaration on its own line.

``` ts
const myFirstNumber: number = 0;
const mySecondNumber: number = 0;
```

### <a id="6.6."></a> 6.6. Prefer "if" and "else if" over "switch" and "case"

Prefer using a series of `if` and `else if` statements instead of using a
`switch` statement.

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

### <a id="6.7."></a> 6.7. Do not nest ternary expressions

Ternary expressions `a ? b : c` should not be nested.

### <a id="6.8."></a> 6.8. Prefer strict equality over regular equality

The strict equality `===` and strict inequalty `!==` operators should be
used instead of the regular equality `==` and inequality `!=` operators.

``` ts
const myComparison: boolean = (myFirstValue === mySecondValue);
```

### <a id="6.9."></a> 6.9. Prefer "as" when writing type assertions

When writing a type assertion, prefer syntax like `value as Type` over
syntax like `<Type> value`. ([Why?](https://stackoverflow.com/a/33503842/4099022))

``` ts
const myValue: number = myOtherValue as number;
```

### <a id="6.10."></a> 6.10. Prefer Type[] to Array<Type>

When describing an array type, prefer syntax like `Type[]` to syntax like
`Array<Type>`.
    
``` ts
const myStringArray: string[] = ["Hello", "World"];
```

### <a id="6.11."></a> 6.11. Do not refer to the "arguments" object

Functions should not refer to the `arguments` object.

### <a id="6.12."></a> 6.12. Prefer rest parameters over referring to the "arguments" object

Functions which accept a variable number of arguments should do so using a
rest parameter `...` and not by accessing the `arguments` object.

``` ts
// [Comment explaining the purpose of my function]
function myVariadicFunction(...strings: string[]): void {
    doStuffWithList(strings);
}
```

### <a id="6.13."></a> 6.13. Avoid the spread operator in array and object literals

Prefer using functions like `Array.concat` or `Object.assign` over using
the spread operator to construct arrays or objects.

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

### <a id="6.14."></a> 6.14. Do not mix full object properties with shorthand properties

An object should either use only shorthand properties or only full properties.
A single object literal should not mix both types of properties.

``` ts
const myObjectWithFullProperties: Object = {
    firstValue: firstValue,
    secondValue: secondValue,
};
```

``` ts
const myObjectWithShortProperties: Object = {
    firstValue,
    secondValue,
};
```

### <a id="6.15."></a> 6.15. Imports

The following guidelines mainly pertain to how imports should be written.

#### <a id="6.15.1."></a> 6.15.1. Imports belong at the beginning of a source file

Import statements should be at the very top of a TypeScript source file.
They should not appear anywhere else.

#### <a id="6.15.2."></a> 6.15.2. Prefer selective imports over default imports

Prefer selective imports (imports with braces `{}`) over default imports
(imports without braces).

``` ts
import {WADFile} from "@src/wad/file";
```

However, modules should still have a default export where it makes
sense to choose a default.

``` ts
// Actual export from "@src/wad/file"
export default WADFile;
```

#### <a id="6.15.3."></a> 6.15.3. Prefer absolute over relative imports

Absolute import paths (those starting with an "at" sign `@`) should be
preferred over relative paths (those starting with a dot `.`).
Note that the meaning of these absolute paths are defined by macros in the
TypeScript config file `tsconfig.json` and the webpack config
file `webpack.config.js`.

``` ts
import {WADFile} from "@src/wad/file";
```

#### <a id="6.15.4."></a> 6.15.4. Group and order imports logically, then alphabetically by filename

Imports should first be ordered by logical group, and then alphabetically by
filename.
Groups of similar imports should be ordered from most general to most
specialized. Here is a guideline for how to separate and order these groups:

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

#### <a id="6.15.5."></a> 6.15.5. Do not include unused imports

Avoid importing unused symbols or modules.

#### <a id="6.15.6."></a> 6.15.6. Avoid importing modules for side-effects only

Avoid writing side-effect-only import statements, i.e. statements
such as `import "module";`.

### <a id="6.16."></a> 6.16. Ordering of class members

The following guidelines mainly pertain to how class member declarations
should be ordered.

#### <a id="6.16.1."></a> 6.16.1. Declare static attributes first

Static attributes and constants should come before all other declarations
in a class.

``` ts
class MyClass {
    // [Comment explaining the purpose of my constant]
    static readonly MyStaticConstant: number = 0x8000;
}
```

#### <a id="6.16.2."></a> 6.16.2. Declare instance attributes second

Instance attributes should be declared after static attributes but before the
constructor and any member functions or methods.

``` ts
class MyClass {
    // [Comment explaining the purpose of my attribute]
    myFirstAttribute: string;
    // [Comment explaining the purpose of my attribute]
    mySecondAttribute: string;
}
```

#### <a id="6.16.3."></a> 6.16.3. Declare the constructor third

The class constructor should come after all static and instance attribute
declarations but before all method and member function declarations.

``` ts
class MyClass {
    constructor() {
        this.myFirstAttribute = "hello";
        this.mySecondAttribute = "world";
    }
}
```

#### <a id="6.16.4."></a> 6.16.4. Declare static member functions fourth

Static member functions should appear after attribute declarations and
after the class constructor, but before instance method declarations.

``` ts
class MyClass {
    // [Comment explaining the purpose of my function]
    static myStaticFunction(): MyClass {
        return new MyClass();
    }
}
```

#### <a id="6.16.5."></a> 6.16.5. Declare instance methods last

Instance methods should appear after all other declarations in a class.

``` ts
class MyClass {
    // [Comment explaining the purpose of my method]
    getTotalLength(): number {
        return this.myFirstAttribute.length + this.mySecondAttribute.length;
    }
}
```



## <a id="7."></a> 7. Program logic conventions

The following guidelines mainly pertain to the use of consistent logic and design
conventions in order to keep code modular and maintainable.

### <a id="7.1."></a> 7.1. Prefer local state over global state

Code which relies on local state is normally easier to understand and maintain
than code which relies on global state.
It is not possible to completely avoid global state, particularly in code that
deals with the DOM. However, global state should be avoided when possible.
Whenever possible, state should be stored locally in scoped variables or
in class instances.

### <a id="7.2."></a> 7.2. Prefer immutable state over mutable state

Where it will not substantially impact performance in a negative way,
treat variables and objects as though they were immutable.

### <a id="7.3."></a> 7.3. Prefer pure functions over impure functions

[Pure functions](https://www.sitepoint.com/functional-programming-pure-functions/)
are those which accept inputs and produce their output without making any
changes to the inputs and without producing any side-effects.
In essence, a pure function is one which can be called at any time,
any number of times, and the same inputs will always produce the same output.

``` ts
// [Comment explaining the purpose of my pure function]
function myPureFunction(value: number): number {
    return value + value;
}
```

### <a id="7.4."></a> 7.4. Functions should not modify their inputs

Avoid writing functions that modify their inputs.
Ensure that where such functions do exist, their modification of the input
is clearly documented.

### <a id="7.5."></a> 7.5. Class getters should treat the instance as logically const

Getter methods (i.e. methods preceded by the `get` keyword) should treat
the instance `this` as [logically const](http://wiki.c2.com/?LogicalConst).
Logical const means that the object may technically be modified,
but any modification that does take place should not affect or be visible to
code which uses only the object's intended and documented API.

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

### <a id="7.6."></a> 7.6. Prefer template strings over concatenation

Prefer using template strings over string concatenation or joining.

``` ts
const myString: string = `${helloString} ${worldString}!`;
```

### <a id="7.7."></a> 7.7. Prefer joining over repeated concatenation

Strings that are incrementally assembled, e.g. in a loop, should have their
substrings pushed to an array and combined at the end of the loop with a
single `join` statement.
Avoid assembling strings via repeated concatenation.

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
