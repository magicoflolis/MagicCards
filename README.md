<h1 align="center">
<sub>
<img src="https://raw.githubusercontent.com/magicoflolis/MagicCards/refs/heads/main/assets/logo.png" height="38" width="38">
</sub>
MagicCards
</h1>

Automatically generate setting-appropriate Story Cards for [AI Dungeon](https://play.aidungeon.com), similar to [AutoCards](https://github.com/LewdLeah/Auto-Cards).

## **Install**

> [!IMPORTANT]
> If you don't know how to install scenario scripts => [Scenario Script Installation Guide](https://help.aidungeon.com/what-are-scripts-and-how-do-you-install-them#block-215105b8a632801882a1ea599052b0ac)
>
> **Not compatible with AutoCards/SmartCards/etc. or any other automatic Story Card scripts!**

`Library`:

- Copy and paste into your `Library` section => [MagicCards/dist/Library.js](https://raw.githubusercontent.com/magicoflolis/MagicCards/refs/heads/main/dist/Library.js)

Example:

```js
//#region Magic Cards

// ...

//#endregion
```

**BEFORE YOU CONTINUE:**

> Ensure each hook script does not contain `modifier = (text) => {...}` function!
>
> Read [FAQ](#faq) section for additional help!

Before:

```js

// Checkout the Guidebook examples to get an idea of other ways you can use scripting
// https://help.aidungeon.com/scripting

// Every script needs a modifier function
const modifier = (text) => {
  return { text }
}

// Don't modify this part
modifier(text)
```

After:

```js

// Checkout the Guidebook examples to get an idea of other ways you can use scripting
// https://help.aidungeon.com/scripting


// Don't modify this part
```

---

`Input`:

- Copy and paste into your `Input` section
- Reference: [MagicCards/dist/Input.js](https://raw.githubusercontent.com/magicoflolis/MagicCards/refs/heads/main/dist/Input.js)

```js
/// <reference no-default-lib="true"/>
/// <reference lib="es2022"/>

/**
 * - Scripting API: https://help.aidungeon.com/scripting
 * - Scripting Guidebook: https://github.com/magicoflolis/aidungeon.js/blob/main/Scripting%20Guidebook.md
 * @template {<T extends string | null, S extends boolean>(text: T, stop: S, hookType: "input") => { text: T; stop?: S; }} ModifierFN
 */
const hook = ((currentHook = 'input') => {
  if (mc.cache.hook !== currentHook) mc.cache.hook = currentHook;
  /**
   * ---
   *
   * - Add your modifier functions into this function
   * - **Modifier functions are not called when `mc.cache.generating === true`**
   *
   * ---
   *
   * _Examples:_
   *
   * ```js
   * hook((text, stop, hookType) => {
   *   // For 'Story Arc Engine' by Yi1i1i
   *   text = onInput_SAE(text);
   *
   *   return { text }
   * })
   * ```
   * @param {...ModifierFN} modifiers
   */
  const fn = (...modifiers) => {
    mc.modifiers.push(...modifiers);
    return mc;
  };
  return fn;
})();

/* This is your modifier function */
hook((text) => {
  if (typeof text === 'string') {
    /* Your Script's code goes here */
  }
  return { text };
});

/* Don't modify this part */
void 0;
```

`Context`:

- Copy and paste into your `Context` section
- Reference: [MagicCards/dist/Context.js](https://raw.githubusercontent.com/magicoflolis/MagicCards/refs/heads/main/dist/Context.js)

```js
/// <reference no-default-lib="true"/>
/// <reference lib="es2022"/>

/**
 * - Scripting API: https://help.aidungeon.com/scripting
 * - Scripting Guidebook: https://github.com/magicoflolis/aidungeon.js/blob/main/Scripting%20Guidebook.md
 * @template {<T extends string | null, S extends boolean>(text: T, stop: S, hookType: "context") => { text: T; stop?: S; }} ModifierFN
 */
const hook = ((currentHook = 'context') => {
  if (mc.cache.hook !== currentHook) mc.cache.hook = currentHook;
  /**
   * ---
   *
   * - Add your modifier functions into this function
   * - **Modifier functions are not called when `mc.cache.generating === true`**
   *
   * ---
   *
   * _Examples:_
   *
   * ```js
   * hook((text, stop, hookType) => {
   *   // For 'Story Arc Engine' by Yi1i1i
   *   text = onContext_SAE(text);
   *
   *   return { text }
   *   // Or return { text, stop }
   * })
   * ```
   * @param {...ModifierFN} modifiers
   */
  const fn = (...modifiers) => {
    mc.modifiers.push(...modifiers);
    return mc;
  };
  return fn;
})();

/* This is your modifier function */
hook((text) => {
  if (typeof text === 'string') {
    /* Your Script's code goes here */
  }
  return { text };
});

/* Don't modify this part */
void 0;
```

`Output`:

- Copy and paste into your `Output` section
- Reference: [MagicCards/dist/Output.js](https://raw.githubusercontent.com/magicoflolis/MagicCards/refs/heads/main/dist/Output.js)

```js
/// <reference no-default-lib="true"/>
/// <reference lib="es2022"/>

/**
 * - Scripting API: https://help.aidungeon.com/scripting
 * - Scripting Guidebook: https://github.com/magicoflolis/aidungeon.js/blob/main/Scripting%20Guidebook.md
 * @template {<T extends string | null, S extends boolean>(text: T, stop: S, hookType: "output") => { text: T; stop?: S; }} ModifierFN
 */
const hook = ((currentHook = 'output') => {
  if (mc.cache.hook !== currentHook) mc.cache.hook = currentHook;
  /**
   * ---
   *
   * - Add your modifier functions into this function
   * - **Modifier functions are not called when `mc.cache.generating === true`**
   *
   * ---
   *
   * _Examples:_
   *
   * ```js
   * hook((text, stop, hookType) => {
   *   // For 'Story Arc Engine' by Yi1i1i
   *   text = onOutput_SAE(text);
   *
   *   return { text }
   * })
   * ```
   * @param {...ModifierFN} modifiers
   */
  const fn = (...modifiers) => {
    mc.modifiers.push(...modifiers);
    return mc;
  };
  return fn;
})();

/* This is your modifier function */
hook((text) => {
  if (typeof text === 'string') {
    /* Your Script's code goes here */
  }
  return { text };
});

/* Don't modify this part */
void 0;
```

## Features

- General:
  - Slash commands: `/MC`, `/AC`, `/mc`, `/ac`
  - Works for any character or location
  - Compatible with _most_ AI models
- Automation:
  - Create story card after `x` amount of turns (default: 22)
  - Summarize created story cards after `x` amount of turns (default: 22)
- Settings:
  - `autoHistory`: summarize prior events of Story Cards (default: false)
  - `autoRetrieve`: retrieve Character and Location names from context + memory (default: false)
  - `cooldown`: number of turns until `autoRetrieve` or `autoHistory` are triggered (default: 22)
  - `enabled`: toggle on/off MagicCards (default: true)
  - `hiddenCards`: toggle additional cards
    - `characters`: AI instructions
    - `compress`: AI instructions
    - `debug`: debug card (readonly)
    - `locations`: AI instructions
    - `retrieve`: AI instructions
    - `*`: Your custom AI instructions (not implemented)
  - `useSmallModel`: toggle on/off use of large AI models (default: true)

## Slash Commands

> [!IMPORTANT]
> Does not follow original AutoCards syntax

- `/MC Name; [Details]`
- `/AC Name; [Details]`

**Example:**

```txt
/MC Aaron; creator of MagicCards
/AC Leah; creator of AutoCards

"Details" is optional
/MC Veyne
```

**Input Commands:**

```txt
/MC [Input Command]
/AC [Input Command]

Example
/MC retrieve
```

- `retrieve` / `get` => force entry check (`retrieve`)
- `toggle` / `enable` / `disable` => toggle MagicCards
- `reset` / `restart` / `restore` => restore to default settings
- `clear` / `clr` / `cls` => clear the current entry being generated (debug command), _use if you encounter any errors during generation_
- `summarize` / `compress` => force summarize all created story cards (`compress`)

## API / Scripting

> [!IMPORTANT]
> During card generation **all modifier functions are not called**
>
> _This should not cause any issues as long as you don't rely on scripts which need to be called every turn_

All functions are exposed and can be easily used.

```js
// Constant should already exist once installed
const mc = new MagicCards(); // or globalThis.mc

// Array of created StoryCards
for (const card of mc.magicCards()) {
  console.log( card ); // StoryCard
}

// Create a new story card
const sc = mc.StoryCard({keys: 'foo', entry: 'bar'});
// { card: StoryCard }
console.log( sc.card );
```

---

Check if "MagicCards" is installed:

> [!IMPORTANT]
> This value is not cached:
>
> 1. `info.actionCount` is 3 => `mc.installed` is **true**
> 2. User rewinds action below 3 => `mc.installed` is **false**

```js
// Constant should already exist once installed
const mc = new MagicCards(); // or globalThis.mc

console.log( mc.installed ); // boolean
```

---

Temporarily disable:

- This disables MagicCards for the **entire turn**
- You can set this value anytime to halt MagicCards

```js
// Constant should already exist once installed
const mc = new MagicCards(); // or globalThis.mc

// Not required but recommended
if ( mc.installed ) {
  // Stored settings and `state.MagicCards`
  const cache = mc.cache;
  cache.disabled = true;
}

// or

// Stored settings and `state.MagicCards`
const cache = mc.cache;
cache.disabled = true;
```

---

Get "calculated" actionCount:

```js
// Constant should already exist once installed
const mc = new MagicCards(); // or globalThis.mc

console.log( mc.actionCount );
```

---

Check if "MagicCards" exists:

```js
if ( typeof globalThis.MagicCards !== 'undefined' || typeof globalThis.mc !== 'undefined' ) {
  // Your code goes here
}

// or

if ( globalThis.MagicCards || globalThis.mc ) {
  // Your code goes here
}
```

## FAQ

**Do I have to remove the `modifier` functions?**

As strongly I recommend you do, _technically_ you do not if you are willing to edit MagicCards code base.

**IMPORTANT:** Doing this removes MagicCards control on each hooks modifier function

- Find (Ctrl + F) the `#modifier()` function in your `Library`
- Make the following changes

```js
#modifier() {
  const modifier = () => { /* ... */ };
  //#region Edit this region

  // BEFORE
  globalThis.modifier = modifier;
  Object.freeze(globalThis.modifier);

  // AFTER
  globalThis.mcModifier = modifier;
  Object.freeze(globalThis.mcModifier);

  //#endregion

  return this;
}
```

- In your `modifier()` functions, make the following changes:

```js
const modifier = (text) => {
  globalThis.mcModifier(); // or whatever name you gave it
  // self-repair
  const currentHook = 'input'; // edit to correspond with the current hook
  if (mc.cache.hook !== currentHook) mc.cache.hook = currentHook;

  /* Your Script's code goes here */

  return { text, stop }
}
```

---

**Can I remove the modifier functions in general?**

> [!IMPORTANT]
> This removes MagicCards "self-repair" feature

Yes! Simply copy + paste this code into each hook:

```js
/* Yup, it's just one line */
void 0;
```

---

**How do I enable autoRetrieve + autoHistory globally?**

Make the following changes in the "SETTINGS" Story Card:

```txt
autoHistory: true
autoRetrieve: true
useSmallModel: false
```

---

**How do I change "X" setting for "Y" Story Card?**

In the "Notes" section of the created Story Card.

Available options:

```txt
sync: boolean
autoHistory: boolean
defaultCooldown: number
```

All options:

```txt
sync: boolean
autoHistory: boolean
defaultCooldown: number
cooldown: number
summary: string
```

- `sync`: automatically sync `autoHistory` / `defaultCooldown` with `autoHistory` / `cooldown` found in the SETTINGS card
- `autoHistory`: toggle `compress` for this card, must have `useSmallModel` set to false
- `defaultCooldown`: default number of turns until `compress` is triggered
- `cooldown`: number of turns until `compress` is triggered
- `summary`: prior events, automatically added at the end of triggered Story Cards as `Events: ...`

---

**When is MagicCards disabled?**

- If `info.actionCount` is below 3
- If `mc.cache.disabled` is true, _can be programmatically changed / set_
- If user inputs an AI instruction (not case sensitive): `[system: ...]`, `<s> ... </s>`, `<system> ... </system>`, `## ...`, `**...**`

---

**Which modifier functions are UNSUPPORTED by hook function?**

- Functions named `AutoCards`, `SmartCards`, or `MagicCards`
- `Async`, `Generator`, or `Promise` type functions

```js
// All will throw an error

hook(async () => { /* ... */ });

hook(() => {
  return Promise.resolve().then(() => text)
});

hook(AutoCards);

hook(MagicCards);

hook(SmartCards);
```

---

**What return values are SUPPORTED by hook function?**

- `Objects`, `Arrays`, or `Functions` which return either or

```js
hook((text, stop) => {
  return { text, stop }
});

hook((text, stop) => {
  return [ text, stop ]
});

hook((text, stop) => {
  return () => {
    // or [ text, stop ]
    return { text, stop }
  }
});

// Not recommended
hook('Hello World!'); // will change text to this value
```

---
