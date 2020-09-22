# Coding Standards



#### Variables

- We use **pascalCase** for variables. 
- Global non-constant variables are **not** allowed.

#### Indentation

- We use a tab size of **4 spaces**. We use spaces and not tabs.

#### Functions and control statements

We format functions and control statements like this:
```js
function helloWorld() {
    // empty line
    var helloworld = "hi";
    // empty line
    if(something === 2) {
        // code here
    }else {
        // code here
    }
    // empty line
}
```
*exception* - when returning on invalid states
```js
function exception(){
    // no empty line
    if(theFunctionCanReturnInstantly) return;
    // code here
}
```

#### function length

Functions should be **40 lines or less**, (unless justifiable).

#### comments

###### formatting
- We format clarifying or declaring comments like `// comment here`
- For comments that show the scope we use `//scope`, for example `//if`.

###### when to comment
- We *only* use scope comments when the scope is hard to read for any programmer. Scope comments are for example `//if`.
- For nontrivial calculations a comment is expected that specifies the result of the calculation. For example:
    ```js
    //calculate length of vector
    var length = Math.sqrt(Math.pow(vec.x,2), Math.pow(vec.y,2));
    ```
- The comments for functions are with specified parameters. 
For example:
    ```js
        /**
         * Moves the caret to the desired place. This could be a selection.
         *
         * @param {EditorState} explenation
         * @param {CarotState} explenation
         * @return {number} explenation
         */
    ```

#### Commits

###### When to commit

- You have to commit when you change any functionality, documentation, or fix a bug.
- A good indicator of a good commit is when you can describe what you did very well in one simple sentence. For example: "set the appearance of the login button to fit blue color theme".

###### Commit messages
- For bugfixes we use the `[BUGFIX]` prefix in commits. The message will specify what bug was fixed.
- Any other commits need to briefly describe the change made. If the changes can't be briefly described, multiple commits are probably needed to clarify the changes.
