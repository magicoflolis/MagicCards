# Changelog

[GitHub FAQ](https://github.com/magicoflolis/MagicCards?tab=readme-ov-file#faq)

**Known Issues:**

- The small AI models (`free account`) have trouble understanding exact details of the current story context
  - If you use large AI models (`premium account`) set: `useSmallModel` => `false`

**TODO:**

- Figure out method to retrieve only when necessary
- Fix any bugs along the way

## v1.1.0

- New features:
  - Slash commands: `/ML`, `/AL`, `/ml`, `/al`
    - Generate **location** story cards
  - Live Scripting Interface (LSI), _no available slash command_
    - Story Card Setup:
      - `NAME`: the hook to run your code in: _`input`, `context`, `output`_
      - `ENTRY` + `NOTES`: your code, _combines sections_
- Automation changes:
  - Summarize (`Compress`) no longer triggers when a story card is "irrelevant", _must be loaded in World Lore or Recent Story_

---

## v1.0.0

It's done! _Recommend starting a new adventure if you have an older versions installed._

I've also rewrote the [README](https://github.com/magicoflolis/MagicCards?tab=readme-ov-file#magiccards) on this projects GitHub.

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
  - `useSmallModel`: toggle on/off use of small AI models (default: true)

---
