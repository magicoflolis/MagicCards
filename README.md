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

`Input`:

- Copy and paste into your `Input` section
- Reference: [MagicCards/dist/Input.js](https://raw.githubusercontent.com/magicoflolis/MagicCards/refs/heads/main/dist/Input.js)

```js
/// <reference no-default-lib="true"/>
/// <reference lib="es2022"/>

input((text) => {
  // Your Script's code goes here
  // if (typeof text === "string") { }
  return { text };
});

void 0;
```

`Context`:

- Copy and paste into your `Context` section
- Reference: [MagicCards/dist/Context.js](https://raw.githubusercontent.com/magicoflolis/MagicCards/refs/heads/main/dist/Context.js)

```js
/// <reference no-default-lib="true"/>
/// <reference lib="es2022"/>

context((text) => {
  // Your Script's code goes here
  // if (typeof text === "string") { }
  return { text };
});

void 0;
```

`Output`:

- Copy and paste into your `Output` section
- Reference: [MagicCards/dist/Output.js](https://raw.githubusercontent.com/magicoflolis/MagicCards/refs/heads/main/dist/Output.js)

```js
/// <reference no-default-lib="true"/>
/// <reference lib="es2022"/>

output((text) => {
  // Your Script's code goes here
  // if (typeof text === "string") { }
  return { text };
});

void 0;
```

## Features

- General:
  - Slash commands: `/MC`, `/AC`, `/mc`, `/ac`
  - Works for all characters and ~~locations~~
  - Compatible with _most_ AI models
- Automation:
  - Create story card after `x` amount of turns (default is 22)
  - Summarize created story cards after `x` amount of turns (default is 22)
- Settings:
  - `enabled`: toggle on/off MagicCards (default: true)
  - `minTurns`: minimum number of turns/actions (default: 10); _only used for slash commands for the beginning of your adventure_

## Slash Commands

> [!IMPORTANT]
> Does not follow original AutoCards syntax

- `/MC Name; [Details]`
- `/AC Name; [Details]`

Examples:

```txt
/MC Aaron; creator of MagicCards
/AC Leah; creator of AutoCards

"Details" is optional
/MC Veyne
```

## API / Scripting

> [!IMPORTANT]
> During card generation **all modifier functions are not called**
>
> _This should not cause any issues as long as you don't rely on scripts which need to be called every turn_

All functions are exposed and can be easily used.

```js
// Constant should already exist once installed
const mc = new MagicCards();

// Array of created StoryCards
for (const card of Array.from(mc)) {
  console.log(card);
}
```

Temporarily disable:

- Disable MagicCards for the **entire turn**
- You can set this value anytime to halt MagicCards

```js
// Constant should already exist once installed
const mc = new MagicCards();

// Stored settings and `state.MagicCards`
const cache = mc.cache;
cache.disabled = true;
```

Get "calculated" actionCount:

```js
// Constant should already exist once installed
const mc = new MagicCards();

const actionCount = mc.turn - mc.cache.turnsSpent;
console.log(actionCount); // number
```
