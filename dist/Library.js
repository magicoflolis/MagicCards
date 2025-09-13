/// <reference no-default-lib="true"/>
/// <reference lib="es2022"/>

/**
 * - Scripting API: https://help.aidungeon.com/scripting
 * - Scripting Guidebook: https://github.com/magicoflolis/aidungeon.js/blob/main/Scripting%20Guidebook.md
 */

// ==Scenario==
// @name         🎴 Magic Cards
// @description  Automatically generate setting-appropriate Story Cards, similar to AutoCards
// @version      v1.0.0
// @author       Magic <https://play.aidungeon.com/profile/MagicOfLolis>
// @homepageURL  https://github.com/magicoflolis/MagicCards
// @license      MIT
// ==/Scenario==

//#region MagicCards

/**
 * @type { Partial<defaultOptions> }
 */
const OPTIONS = {
  /*
  Uncomment if you use "Premium Models"
  
  settings: {
    autoHistory: true,
    autoRetrieve: true,
    useSmallModel: false
  }
  */
};

//#region Requirements
//#region Polyfill
{
  if (typeof globalThis.stop !== 'boolean') {
    globalThis.stop = false;
  }
  if (typeof globalThis.text !== 'string') {
    globalThis.text = ' ';
  }
  globalThis.history ??= [];
  globalThis.storyCards ??= [];
  globalThis.info ??= {
    actionCount: 0,
    characters: []
  };
  globalThis.state ??= {
    memory: {},
    message: ''
  };
  state.messageHistory ??= [];
}
{
  /** https://jsr.io/@li/regexp-escape-polyfill */
  const SYNTAX_CHARACTERS = /[\^$\\.*+?()[\]{}|]/;
  const CONTROL_ESCAPES = new Map([
    ['\t', 't'],
    ['\n', 'n'],
    ['\v', 'v'],
    ['\f', 'f'],
    ['\r', 'r']
  ]);
  const OTHER_PUNCTUATORS = /^[,\-=<>#&!%:;@~'`"]$/;
  const WHITE_SPACE = /^[\t\v\f\uFEFF\p{Zs}]$/u;
  const LINE_TERMINATOR = /^[\n\r\u2028\u2029]$/;
  const SURROGATE = /^[\uD800-\uDFFF]$/;
  const DECIMAL_DIGIT = /^[0-9]$/;
  const ASCII_LETTER = /^[a-zA-Z]$/;
  /**
   * @param {string} str
   * @returns {string}
   */
  const regExpEscape = (str) => {
    if (typeof str !== 'string') {
      throw new TypeError('Expected a string');
    }
    let escaped = '';
    for (const c of str) {
      if (escaped === '' && (DECIMAL_DIGIT.test(c) || ASCII_LETTER.test(c))) {
        escaped += `\\x${c.charCodeAt(0).toString(16).padStart(2, '0')}`;
      } else {
        escaped += encodeForRegExpEscape(c);
      }
    }
    return escaped;
  };
  Object.defineProperty(regExpEscape, 'name', { value: 'escape' });
  /**
   * @param {string} c - A single code-point char.
   * @returns {string} the encoded representation of `c`.
   */
  function encodeForRegExpEscape(c) {
    if (SYNTAX_CHARACTERS.test(c) || c === '/') {
      return '\\' + c;
    }
    if (CONTROL_ESCAPES.has(c)) {
      return '\\' + CONTROL_ESCAPES.get(c);
    }
    if (
      OTHER_PUNCTUATORS.test(c) ||
      WHITE_SPACE.test(c) ||
      LINE_TERMINATOR.test(c) ||
      SURROGATE.test(c)
    ) {
      // eslint-disable-next-line no-control-regex
      if (/[\x00-\xFF]/.test(c)) {
        return `\\x${c.charCodeAt(0).toString(16).padStart(2, '0')}`;
      }
      return c
        .split('')
        .map((c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
        .join('');
    }
    return c;
  }
  Object.defineProperty(RegExp, 'escape', {
    value: regExpEscape,
    writable: true,
    enumerable: false,
    configurable: true
  });
}
//#endregion
//#region Utilities
/**
 * @param {?} obj
 * @returns {string}
 */
const objToStr = (obj) => {
  try {
    return Object.prototype.toString.call(obj).match(/\[object (.*)\]/)?.[1] || '';
  } catch {
    return '';
  }
};
/**
 * @template T
 * @template {Record<string, boolean>} A
 * @param {T | null | undefined} target - The target to normalize into an array
 * @param {A} [args={}]
 * @returns {T extends null | undefined ? [] : T extends readonly unknown[] ? T : T extends string ? A extends { split: true; } ? string[] : [T] : A extends { entries: true; } ? T extends Record<infer K, infer V> ? Array<[K extends string ? K : string, V]> : Array<[string, unknown]> : A extends { keys: true; } ? T extends Record<infer K, unknown> ? Array<K extends string ? K : string> : T extends Set<unknown> | Map<infer K, unknown> ? K[] : string[] : A extends { values: true; } ? T extends Record<string, infer V> ? V[] : T extends Set<infer V> | Map<unknown, infer V> ? V[] : unknown[] : T extends Iterable<infer U> ? U[] : unknown[]}
 */
const toArray = (target, args = {}) => {
  if (target == null) return [];
  if (Array.isArray(target)) return target;
  /** @type {keyof typeof args | undefined} */
  const method = ['split', 'entries', 'keys', 'values'].find((key) => args[key]);
  if (typeof target === 'string') return method === 'split' ? [...target] : [target];
  if (method != null) {
    const s = objToStr(target);
    const m = method === 'split' ? 'keys' : method;
    if (/Object/.test(s)) {
      if (Object[m]) return Array.from(Object[m](target));
    } else if (/Set|Map/.test(s)) {
      /** @type {Set<unknown> | Map<unknown, unknown>} */
      const prim = target;
      if (prim[m]) return Array.from(prim[m]());
    }
  }
  return Array.from(target);
};
/**
 * @param {?} obj
 * @returns {obj is Record<PropertyKey, unknown>}
 */
const isObj = (obj) => /Object/.test(objToStr(obj));
/**
 * @param {?} obj
 * @returns {obj is (null | undefined)}
 */
const isNull = (obj) => Object.is(obj, null) || Object.is(obj, undefined);
/**
 * Object is Blank
 * @template O
 * @param {O} obj
 * @returns {boolean}
 */
const isBlank = (obj) => {
  if (typeof obj === 'string') return Object.is(obj.replaceAll('\0', '').trim(), '');
  return Object.is(toArray(obj, { split: true }).length, 0);
};
/**
 * Object is Empty
 * @template O
 * @param {O} obj
 * @returns {boolean}
 */
const isEmpty = (obj) => isNull(obj) || isBlank(obj);
/**
 * @param {?} elem
 * @returns {elem is string}
 */
const isValid = (elem) => typeof elem === 'string' && !isBlank(elem);
/**
 * @param {?} a
 * @param {?} b
 * @returns {boolean}
 */
const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/**
 * @param {string} num
 * @returns {boolean}
 */
const isNum = (num) => !Number.isNaN(Number.parseInt(num, 10));
/**
 * @template T
 * @param {...T} arr
 */
const rmDup = (...arr) => [...new Set(arr.flat(1))];
/**
 * @param {...string} data
 * @returns {string}
 */
const prose = (...data) => (data.every((i) => typeof i === 'string') ? data.join('\n').trim() : '');
/**
 * @param {?} a
 * @param {?} b
 * @returns {boolean}
 */
const equalArr = (a, b) => isEqual([...new Set(a)].sort(), [...new Set(b)].sort());
/**
 * @param {?} obj
 */
const toEntry = (obj) =>
  Object.entries(obj)
    .map(([, val]) => (isObj(val) ? Object.entries(val) : val))
    .flat(Infinity)
    .sort();
//#endregion
//#region Words
class Words extends null {
  /**
   * Converts the first character of a string to its Unicode code point in hexadecimal.
   * @param {string} str
   * @returns {string}
   */
  static toCodePoint(str) {
    const cp = str.codePointAt(0);
    if (cp === undefined) throw new TypeError('Input string is empty.');
    return cp.toString(16);
  }
  /**
   * @template {string | number} N
   * @param {N} num
   * @returns {string}
   */
  static getUniHex(num) {
    return String.fromCodePoint(typeof num === 'number' ? num : parseInt(num, 16));
  }
  /**
   * @template {string} S
   * @template {number} L
   * @param {S} str
   * @param {L} lengthLimit
   */
  static limit(str, lengthLimit) {
    if (typeof str === 'string' && typeof lengthLimit === 'number' && lengthLimit < str.length) {
      return str.slice(0, lengthLimit).trim();
    }
    return str;
  }
  /**
   * @param {string} str
   * @returns {string[]}
   */
  static split(str) {
    return isValid(str) ? str.split(/\f|\t|\n|\r|\v|\0/) : [];
  }
  /**
   * @template S
   * @param {S} str
   */
  static toLowerCase(str) {
    return isValid(str) ? str.toLowerCase().trim() : '';
  }
}
//#endregion
//#region Options
class Options extends null {
  static createDefault() {
    const $db = Options.createDB();
    const p = prose;
    /** @type {dataQueue} */
    const data = {};
    /**
     * @type { defaultOptions }
     */
    const _default = {
      settings: {
        autoHistory: false,
        autoRetrieve: false,
        cooldown: 22,
        enabled: true,
        hiddenCards: ['debug'],
        useSmallModel: true
      },
      data,
      database: [
        {
          category: [
            'Age',
            'Gender',
            'Personality',
            'Appearance',
            'Relationships',
            'Quirks',
            'Flaws',
            'Likes',
            'Dislikes',
            'Occupation',
            'Backstory',
            'Hobbies',
            'Other'
          ],
          instruction: {
            user: p('', '$2', 'Output Entry:', '$1 = $3'),
            example: 'name1 = [CAT1:TRAIT1(DESC1)[,...];...]'
          },
          type: /** @type {const} */ ('Characters')
        },
        {
          category: [
            'Location',
            'Unique Features',
            'Setting',
            'Factions',
            'Threats',
            'Society',
            'Government',
            'Military',
            'Cultural Traits',
            'Economy',
            'Religion',
            'Other'
          ],
          instruction: {
            user: p('', '$2', 'Output Entry:', '$1 = $3'),
            example: 'name1 = [CAT1:TRAIT1(DESC1)[,...];...]'
          },
          type: /** @type {const} */ ('Locations')
        },
        {
          category: ['Name'],
          instruction: {
            user: '',
            example: ''
          },
          type: /** @type {const} */ ('Retrieve')
        },
        {
          category: ['Events', 'Threats'],
          instruction: {
            user: '',
            example:
              '[Name: David Red; History: previous_collaboration(successful_operations, built_trust); Threats: class_warfare(corporate_vs_street)[,...];...]'
          },
          type: /** @type {const} */ ('Compress')
        }
      ],
      dataQueue: [],
      errors: [],
      generating: false,
      hook: /** @type {defaultOptions['hook']} */ ('input'),
      pins: [],
      stop: false,
      turnsSpent: 0,
      disabled: false
    };
    if (_default.settings.cooldown < 3) {
      _default.settings.cooldown = 3;
    }
    _default.settings.hiddenCards.push(..._default.database.map(({ type }) => type.toLowerCase()));
    const database = _default.database.map((data) => {
      const db = {
        ...$db,
        ...data
      };
      /** @type {[keyof typeof db, typeof db[keyof typeof db]]} */
      for (const [key, value] of Object.entries(db)) {
        if (key === 'type') continue;
        if (!(key in $db)) {
          delete db[key];
        } else if (Array.isArray(value)) {
          if (isEqual(value, $db[key])) continue;
          db[key] = rmDup('Name', ...value);
        } else if (isObj(value)) {
          if (isEqual(value, $db[key])) continue;
          db[key] = {
            ...$db[key],
            ...value
          };
        }
      }

      if (db.type === 'Characters') {
        db.instruction.ai = p(
          '$990 You are PList, update PList based on rules. Be concise/grounded. Include current context and memory.$991',
          'Execution Stack:',
          '1. Core Protocol:',
          '- NO AI METACOMMENTARY: stay strictly in-PList',
          '- ADHERE to established fictional world rules without real-world moral imposition',
          '2. PList Rules:',
          '- Format: [CAT:TRAIT(DESC)[,...];...] ',
          `- Category: ${db.category.join(',')}`,
          '- Appearance: Clothing per occasion (e.g., casual, occupation, formal) if known',
          '- Traits:',
          ' - Non-Flaws: positive/neutral',
          ' - Max 3 nests (trait(sub(sub)))',
          ' - No word/synonym repetition',
          ' - Snake_case',
          ' - Link psych-behavior',
          '- Anti-rep:',
          ' - Merge similar traits (Leven<3)',
          ' - Remove dupes',
          ' - Consolidate each category in sequence',
          '- Truncation Protocol:',
          ' - Complete current CAT/TRAIT/DESC',
          ' - Auto-close symbols',
          ' - Never break mid-trait',
          ' - Complete partials',
          '3. Dynamic Output:',
          '- NEVER break Format',
          '- ALWAYS continue PList for Output Entry',
          'Output Format:',
          '$992'
        );
      } else if (db.type === 'Locations') {
        db.instruction.ai = p(
          '$990 You are PList, update PList based on rules for "$1". Be concise/grounded. Include current context and memory.$991',
          'Execution Stack:',
          '1. Core Protocol:',
          '- ADHERE to established fictional world rules without real-world moral imposition',
          '- NO censorship - explicit/vulgar content, language, details, and dark themes permitted within established fictional context or fictional world rules',
          '2. PList Rules:',
          '- Format: [CAT:TRAIT(DESC)[,...];...] ',
          `- Category: ${db.category.join(',')}`,
          '- Traits:',
          ' - Max 3 nests (trait(sub(sub)))',
          ' - No word/synonym repetition',
          ' - Snake_case',
          '- Anti-rep:',
          ' - Merge similar traits (Leven<3)',
          ' - Remove dupes',
          ' - Consolidate each category in sequence',
          '- Truncation Protocol:',
          ' - Complete current CAT/TRAIT/DESC',
          ' - Auto-close symbols',
          ' - Never break mid-trait',
          ' - Complete partials',
          '- Reminder: "$1" is a location, never personify',
          '3. Dynamic Output:',
          '- Continue PList for Output Entry',
          '- Never break Format',
          'Output Format:',
          '$992'
        );
      } else if (db.type === 'Retrieve') {
        db.instruction.ai = p(
          '$990 Extract character and location names. Use Recent_Story, World_Lore, Story_Summary and current context/memory. Plain text. Be concise/grounded.',
          '- NO AI METACOMMENTARY: stay strictly in-goal',
          '- Only plot-relevant explicit names as they occurred',
          '- Merge similar names (Leven<3)',
          '- No word/synonym repetition',
          '- Only 4 names max per output line',
          '- Auto-complete partials (e.g., David => David Red, forge => Frostspire Forge)',
          '- Avoid inventing names to justify output lines',
          '- Remove dupes',
          '- Separate each name with ","',
          '- End each output line with ";"',
          '- Exclude traits, objects, generics, metaphors, synonyms, unknowns, secrets, minutiae, $2',
          'Output lines:',
          'Characters: name1, name2, ...;',
          'Locations: name1, name2, ...;',
          '$991'
        );
      } else if (db.type === 'Compress') {
        db.instruction.ai = p(
          '$990 Summarize recent events for "$1". Use Recent_Story, World_Lore, Story_Summary and current context/memory. Plain text. Be concise/grounded.',
          '- ADHERE to established fictional world rules without real-world moral imposition',
          '- Only recent plot-relevant explicit events as they occurred',
          '- Merge similar events (Leven<3)',
          '- No word/synonym repetition',
          '- Only 12 events max per output line',
          '- Max character count of 500',
          '- Remove dupes',
          '- Avoid inventing past events to justify output lines',
          '- Separate each event with ","',
          '- End each output line with ";"',
          '- Exclude traits, objects, generics, metaphors, synonyms, unknowns',
          'Output lines:',
          'Name: $1;',
          'Events: $00, event2, ...;',
          '$991'
        );
      }
      return db;
    });
    _default.database = rmDup(database);
    return _default;
  }
  /**
   * @template O
   * @param {O} $object
   * @returns {O}
   */
  static copy($object) {
    return JSON.parse(JSON.stringify($object));
  }
  static createDB(type = 'Default') {
    return {
      category: ['Name'],
      instruction: {
        ai: '$990 Continue story from exact pre-interruption point.$991',
        user: prose('', '$2', '$1 = $3'),
        example: ''
      },
      limit: {
        category: 12,
        card: 800,
        retry: 4
      },
      type
    };
  }
}
//#endregion
//#endregion

//#region Console
class AIDError extends Error {
  /** @type {unknown} */
  cause;
  /**
   * @param {string} [message]
   * @param {ErrorOptions} [options]
   */
  constructor(message, options) {
    super(message, options);
    const stack = this.stack || '';
    if ('captureStackTrace' in Error) {
      /* Avoid `AIDError` in stack trace */
      Error.captureStackTrace(this, AIDError);
      /* Avoid `Function` in stack trace */
      Error.captureStackTrace(this, con.log);
    }
    let tmp = '';
    const reg = /\s?\(?(<isolated-vm\w*>):(\d+):(\d+)\)?/gm;
    const clean = stack
      .replace(/^Error:\s(\w*Error:)/gm, (_m, p1) => p1)
      .replace(reg, (_m, _p1, line, column) => `:${line}:${column}`);
    tmp += clean;
    this.stack = clean;
    if (!this.cause) {
      const [, c] = /\s(\w+):\d+:\d+/.exec(stack) ?? [];
      if (c) {
        this.cause = c;
      } else {
        this.cause = 'Unknown';
      }
    }
    this.message = `[${this.cause}] ${tmp}`;
  }
}
class con extends null {
  /**
   * @param  {...?} messages
   */
  static log(...messages) {
    messages.forEach((m) => {
      if (m instanceof Error) {
        const e = m instanceof AIDError ? m : new AIDError(m.message, m.cause || undefined);
        con.msg(e.message);
      } else {
        console.log(m);
      }
    });
  }
  /**
   * @param {Error['message']} error
   * @param {?} [cause]
   */
  static err(error, cause) {
    /** @type {ErrorOptions} */
    let errorOptions = cause ? { cause } : { cause: 'Unknown' };
    let message = error;
    if (error instanceof Error) {
      message = error.message;
      if (error.cause) errorOptions = { cause: error.cause };
    }
    console.log(new AIDError(message, errorOptions).message);
  }
  /**
   * @param  {...string} messages
   */
  static msg(...messages) {
    const MESSAGES = messages.filter((m) => typeof m === 'string' && !Object.is(state.message, m));
    if (isBlank(MESSAGES)) return;
    if (state.messageHistory) state.messageHistory.push(...MESSAGES);
  }
}
//#endregion

class MagicCards {
  //#region MC Utilities
  static constant = {
    type: `${Words.getUniHex('1fa84')}🎴`,
    location: `${Words.getUniHex('1fa84')}🏚️`,
    internal: `${Words.getUniHex('1fa84')}🔧`,
    storyCard: 2000
  };
  /** Filter output lines */
  static regExp = /=>|🎴|⚠️/g;
  /**
   * Find and create Story Cards
   * @param { Partial<StoryCard & { pin: boolean }> } $StoryCard
   * @param { ((value: StoryCard, index: number, array: StoryCard[]) => boolean) | undefined } [callback]
   * @param { number } [remaining=2] - Number of remaining retries before function times out.
   * @returns { { id: string; index: number; card: StoryCard | null; error?: AIDError } }
   */
  StoryCard($StoryCard = {}, callback, remaining = 2) {
    if (remaining > 0) {
      remaining -= 1;
      const {
        keys = '',
        entry = '',
        type = MagicCards.constant.type,
        title = keys,
        description,
        id,
        pin = false
      } = $StoryCard;
      if (typeof callback !== 'function') {
        callback = ({ keys: k, entry: e, title: t, type: ty, description: d, id: i }) => {
          return (
            (id != null && id === i) ||
            (description != null && description === d) ||
            (entry === e && type === ty && (keys === k || title === t))
          );
        };
      }
      const card = storyCards.find(callback);
      if (card) {
        if (id) card.id = id;
        if (pin) {
          if (!this.cache.pins.includes(id)) this.cache.pins.push(id);
          storyCards.splice(Math.max(0, this.cache.pins.indexOf(id)), 0, card);
        }
        return { id: card.id, index: storyCards.indexOf(card), card };
      }
      storyCards.push({ id, keys, entry, type, title, description });
      return this.StoryCard($StoryCard, callback, remaining);
    }
    return {
      id: '-2',
      index: -2,
      card: null,
      error: new AIDError(`Failed, "${$StoryCard.title ?? 'StoryCard'}" has timed out.`, {
        cause: 'MagicCards.StoryCard()'
      })
    };
  }
  installed = false;
  /**
   * @type { ?{ id: string; index: number; card: StoryCard } }
   */
  debugCard = null;
  /**
   * @type { defaultOptions }
   */
  cache = {};
  /** @type {ModifierFN[]} */
  modifiers = [];
  get text() {
    return text == null ? text : `${text}`;
  }
  set text(str) {
    if ((typeof str === 'string' && !Object.is(str, '')) || str === null) text = str;
  }
  get stop() {
    const c = isEmpty(this.cache) ? { hook: 'input', stop: false } : this.cache;
    if (!Object.is(c.stop, globalThis.stop)) globalThis.stop = c.stop;
    return c.stop && /context/.test(c.hook);
  }
  set stop(bol) {
    const c = isEmpty(this.cache) ? { stop: false } : this.cache;
    if (typeof bol === 'boolean' && !Object.is(c.stop, bol)) {
      c.stop = bol;
      if (!Object.is(c.stop, globalThis.stop)) globalThis.stop = c.stop;
    }
  }
  get turn() {
    if (typeof info.actionCount === 'number') {
      return Math.abs(info.actionCount);
    }
    return 0;
  }
  get actionCount() {
    return this.turn - this.cache.turnsSpent;
  }
  get history() {
    const s = this.turn - this.cache.settings.cooldown;
    return (history[s] ? history.slice(s) : history)
      .filter(({ text }) => !isEmpty(text) && !MagicCards.regExp.test(text))
      .map((h) => {
        return {
          index: history.indexOf(h),
          text: Words.split(h.text).join(' ').trim(),
          rawText: h.text,
          type: h.type
        };
      });
  }
  //#endregion
  //#region Constructor
  /**
   * @param { Partial<defaultOptions> } options
   */
  constructor(options = {}) {
    //#region Binders
    this.input = this.input.bind(this);
    this.context = this.context.bind(this);
    this.output = this.output.bind(this);
    this.message = this.message.bind(this);
    this.StoryCard = this.StoryCard.bind(this);
    //#endregion

    this.#modifier();

    if (isObj(options)) {
      for (const s of ['generating', 'stop', 'turnsSpent', 'hook'])
        if (s in options) delete options[s];
    } else {
      options = {};
      con.err(
        new TypeError('"options" must be a type of JSON Object', {
          cause: 'MagicCards.constructor()'
        })
      );
    }

    const _default = Options.createDefault();
    /**
     * @param { ...defaultOptions } params
     * @returns { defaultOptions }
     */
    const initConfig = (...params) => {
      const obj = {};
      for (const p of params.filter(isObj)) {
        for (const [k, v] of toArray(p, { entries: true })) {
          if (k === 'settings' && !isEqual(p[k], _default[k])) {
            for (const key of toArray(_default[k], { keys: true })) {
              if (!(key in v)) v[key] = _default[k][key];
            }
          }
          Object.assign(obj, { [k]: v });
        }
      }
      return obj;
    };
    this.cache = initConfig(_default, options, state.MagicCards);
    if (!('settings' in this.cache)) {
      this.cache = _default;
      this.cache.errors.push('Invalid config: restoring...');
    }
    const hook = this.#hook();
    const cache = this.cache;
    //#region Init Card
    /**
     * @template {keyof defaultOptions | dataEntry['type']} T
     * @param {T} title
     * @returns {{ card: StoryCard; index: number; id: string }}
     */
    const getInitCard = (title) => {
      if (typeof title !== 'string') throw new TypeError('Expected a string');
      const main = /settings/i.test(title);
      /**
       * @param {StoryCard} sc
       * @returns {boolean}
       */
      const cb = (sc) => {
        try {
          const { card } = this.storyCards.edit(sc, 1);
          return Words.toLowerCase(card.id) === title;
        } catch {
          return false;
        }
      };
      /**
       * @type {OptionId}
       */
      const obj = {
        id: title,
        pin: true
      };
      const SC = this.StoryCard(
        {
          id: JSON.stringify(obj),
          title: title.toUpperCase(),
          type: MagicCards.constant.internal,
          pin: obj.pin
        },
        cb
      );
      if (isNull(SC.card)) throw SC.error;
      if (/debug/i.test(title)) {
        return {
          card: SC.card,
          id: SC.id,
          index: SC.index
        };
      }
      /**
       * Changed values of this Story Card
       * @type {defaultOptions['settings'] | dataEntry}
       */
      const $config = {};
      let equ = true;
      /** @type { any } */
      let opt;
      if (main) {
        opt = Options.copy(cache.settings);
      } else {
        const Title = Words.toLowerCase(title);
        opt =
          cache.database.find(({ type }) => Words.toLowerCase(type) === Title) ??
          Options.createDB(title);
      }
      opt = Object.fromEntries(Object.entries(opt).sort());
      Object.assign($config, opt);
      if (!isEmpty(SC.card.entry) && isBlank(cache.errors)) {
        const scEntry = SC.card.entry.matchAll(/^([\w\s]+):\x20?(.*)/gm) || [];
        if (main) {
          for (const [, key, value] of scEntry) {
            if (!(key in opt)) continue;
            if (/(true|false)$/im.test(value)) {
              $config[key] = Words.toLowerCase(value) === 'true';
            } else if (isNum(value)) {
              $config[key] = Number(value);
            } else if (key === 'hiddenCards') {
              $config[key] = value
                .split(/,|\[|\]/)
                .filter((i) => !isBlank(i))
                .map((i) => i.trim());
            }
          }
          equ = equalArr(Object.entries($config), Object.entries(opt));
          if (!equ) {
            Object.assign(cache.settings, $config);
            this.message(`Updated ${title}.`);
          }
        } else {
          $config.instruction.ai = SC.card.description;
          for (const [, key, value] of scEntry) {
            if (isBlank(value) || !(key in $config)) continue;
            if (/limit|category/.test(key)) {
              if (key === 'limit') {
                $config[key] = JSON.parse(value.replaceAll(/([\w\d]+)/g, '"$1"'));
                for (const k of toArray($config[key], { keys: true })) {
                  $config[key][k] = Number($config[key][k]);
                }
              } else {
                $config[key] = value
                  .split(/,|\[|\]/)
                  .filter((i) => !isBlank(i))
                  .map((i) => i.trim());
                $config[key].splice(0, 0, 'Name');
              }
            } else if (key === 'user') {
              const [, user] = SC.card.entry.match(/user:([\s\S]+)(?=example:)/gi) || [];
              if (user) $config.instruction[key] = user;
            } else if (key === 'example') {
              const [, user] = SC.card.entry.match(/example:([\s\S]+)(?=limit:)/gi) || [];
              if (user) $config.instruction[key] = user;
            } else {
              $config[key] = value;
            }
          }
          equ = equalArr(toEntry($config), toEntry(opt));
          if (!equ) {
            if (
              !equalArr($config.category, opt.category) ||
              $config.limit.category !== opt.limit.category
            )
              $config.limit.category = opt.limit.category = $config.category.length;
            const i = cache.database.indexOf(opt) ?? 0;
            cache.database.splice(i, 1, $config);
            this.message(`Updated ${title}.`);
          }
        }
      } else {
        equ = false;
      }
      if (!equ) {
        const scLimit = MagicCards.constant.storyCard;
        const resp = [];
        const add = (entry) => resp.push(entry.trim());
        for (const [k, v] of toArray($config, { entries: true })) {
          if (isObj(v)) {
            const val = toArray(v, { entries: true })
              .filter(([key]) => key !== 'ai')
              .map(([key, value]) => `${key}: ${value}`);
            if (isBlank(val)) continue;
            if (k === 'instruction') {
              for (const key of val) {
                add(key);
              }
            } else {
              add(`${k}: {${val.join(', ')}}`);
            }
          } else if (Array.isArray(v) && !isBlank(v)) {
            add(`${k}: [${(k === 'category' ? v.slice(1) : v).join(', ')}]`);
          } else {
            add(`${k}: ${v}`);
          }
        }
        if (!main) {
          SC.card.description = Words.limit($config.instruction.ai, scLimit);
        }
        SC.card.entry = Words.limit(resp.join('\n').trim(), scLimit);
      }
      return {
        card: SC.card,
        id: SC.id,
        index: SC.index
      };
    };
    if (hook === 'context' && this.turn > 2) {
      getInitCard('settings');
      const addDB = (cache.settings.useSmallModel ? [] : cache.database)
        .map(({ type }) => type.toLowerCase())
        .filter((type) => !/default|settings/.test(type));
      const hiddenCards = Array.isArray(cache.settings.hiddenCards)
        ? cache.settings.hiddenCards
        : [];
      if (!hiddenCards.includes('debug')) this.debugCard = getInitCard('debug');
      for (const type of addDB.filter((type) => !hiddenCards.includes(type))) {
        getInitCard(type);
      }
      for (const type of addDB.filter((type) => hiddenCards.includes(type))) {
        const { index, card } = this.storyCards.get(type);
        if (isNull(card)) continue;
        storyCards.splice(index, 1);
      }
      // Only works on turn 3
      if (this.turn === 3) {
        const memoryBank = storyCards.some(
          ({ id }) => typeof id === 'string' && id.startsWith('{') && id.endsWith('}')
        );
        if (!memoryBank) {
          cache.errors.push(
            'Please enable "MEMORY BANK"\nPath: GAMEPLAY > MEMORY SYSTEM > MEMORY BANK'
          );
          cache.settings.enabled = false;
        }
      }
    }
    //#endregion
    if (cache.settings.cooldown < 3) {
      cache.settings.cooldown = 3;
      cache.errors.push('Invalid cooldown: must be <= 3, restoring...');
    }
    if (cache.settings.useSmallModel === true && cache.settings.autoRetrieve === true) {
      cache.errors.push('Invalid: disable "useSmallModel" first');
      cache.settings.autoRetrieve = false;
    }
    this.refresh(false);
    try {
      if (hook === 'output') {
        if (isEmpty(cache.errors)) {
          if (this.turn === 3) {
            this.message('Install complete!');
          } else if (!this.turn) {
            this.message('Installing...');
          }
        }
        while (cache.errors.length > 0) {
          const text = cache.errors.shift();
          if (!text) break;
          this.message({ emoji: '⚠️', text });
        }
      }
      if (!cache.settings.enabled) {
        cache.data = {};
        cache.dataQueue = [];
        cache.generating = false;
      }
      const installed =
        this.turn >= 3 &&
        typeof this[hook] === 'function' &&
        (cache.settings.enabled || hook === 'input');
      this.installed = installed;
      if (installed) this[hook]();
    } catch (e) {
      con.err(e, hook);
    }
  }
  //#endregion
  /**
   * Ensures `modifier` function exists & prevent it from being `undefined`
   *
   * _This will ALWAYS be the last function executed!_
   *
   * - Add your modifier functions into `hook()`
   * - **Modifier functions are not called when `mc.cache.generating === true`**
   */
  #modifier() {
    const modifier = () => {
      const c = isEmpty(this.cache) ? { hook: 'input', generating: false } : this.cache;
      if (!c.generating) {
        try {
          /**
           * @param {Text | ModifierFN | [typeof text, typeof stop] | ReturnType<ModifierFN>} val
           */
          const extract = (val) => {
            const str = objToStr(val);
            if (/(Async|Generator)Function|Promise/.test(str)) {
              throw new TypeError(`Unsupported, "val" is a type of ${str}.`);
            } else if (typeof val === 'function') {
              if (/(auto|smart|magic)cards?/i.test(val.name)) {
                throw new TypeError(`Please remove "${val.name}" incompatible with MagicCards.`);
              }
              return extract(val(this.text, this.stop, c.hook));
            } else if (Array.isArray(val)) {
              const [TEXT = ' ', STOP = false] = val;
              if (Object.is(STOP, true)) this.stop = STOP;
              return TEXT;
            } else if (isObj(val)) {
              const { text, stop = false } = val;
              if (Object.is(stop, true)) this.stop = stop;
              return text;
            }
            return val;
          };
          for (const fn of rmDup(this.modifiers)) {
            const txt = extract(fn);
            if (!Object.is(this.text, txt) && (typeof txt === 'string' || isNull(txt)))
              this.text = txt;
          }
        } catch (e) {
          con.err(e, c.hook);
        }
      }
      if (c.hook === 'output' && !isBlank(state.messageHistory)) {
        const message = rmDup(state.messageHistory).join('\n——————————————————————————\n');
        console.log(message);
        state.message = message;
        state.messageHistory = [];
      }
      this.#hook(false);
      this.#save();
      const { text, stop } = this;
      return { text, stop };
    };
    globalThis.modifier = modifier;
    Object.freeze(globalThis.modifier);
    return this;
  }
  /**
   * @template S
   * @param  {...S} messages
   */
  message(...messages) {
    for (const m of messages) {
      if (typeof m === 'string') {
        con.msg(`🎴 MagicCards => ${m}`);
      } else if (isObj(m) && 'emoji' in m) {
        con.msg(`${m.emoji} MagicCards => ${m.text}`);
      }
    }
    return this;
  }
  refresh(resetCooldown = true) {
    const cache = this.cache;
    const $db = Options.createDB();
    // This could be optimized
    const database = cache.database.map((data) => {
      const db = {
        ...$db,
        ...data
      };
      for (const [key, value] of toArray(db, { entries: true })) {
        if (key === 'type') continue;
        if (!(key in $db)) {
          delete db[key];
        } else if (Array.isArray(value)) {
          if (isEqual(value, $db[key])) continue;
          db[key] = rmDup('Name', value);
        } else if (isObj(value)) {
          if (isEqual(value, $db[key])) continue;
          for (const k of toArray($db[key], { keys: true })) {
            if (!(k in value)) value[k] = $db[key][k];
          }
        } else if (!Object.is(value, $db[key])) {
          db[key] = $db[key];
        }
      }
      db.limit.category = db.category.length;
      return db;
    });
    cache.database = rmDup(database);
    if (resetCooldown) {
      cache.settings.cooldown =
        OPTIONS?.settings?.cooldown ?? Options.createDefault().settings.cooldown;
    }
    cache.generating = !(isEmpty(cache.dataQueue) && isEmpty(cache.data));
    if (!Object.is(cache.stop, globalThis.stop)) globalThis.stop = cache.stop;
    return this;
  }
  /**
   * Save changed values of `this.cache` into `state` object
   */
  #save() {
    const defaultOptions = Options.createDefault();
    const config = Options.copy(this.cache);
    if (!isEqual(config, defaultOptions)) {
      for (const [key, value] of toArray(config, { entries: true })) {
        if (!(key in defaultOptions)) {
          delete config[key];
        } else if ((Array.isArray(value) || isObj(value)) && isEqual(value, defaultOptions[key])) {
          delete config[key];
        } else if (Object.is(value, defaultOptions[key])) {
          delete config[key];
        }
      }
      state.MagicCards = config;
    }
    return config;
  }
  print(message = '', emoji = '🎴', name = this.cache.data.name) {
    const data = this.cache.data;
    if (!isEmpty(data)) {
      return `\n- ${emoji} ◖${isEmpty(name) ? 'MagicCards' : name}◗ => ${message}\n`;
    }
    return `\n- ${emoji} => ${message}\n`;
  }
  /**
   * @param {Partial<dataQueue>} data
   */
  queue(data = {}) {
    data.type ??= 'Characters';
    const db =
      this.cache.database.find(({ type }) => data.type === type) ?? Options.createDB(data.type);
    const _default = {
      name: '',
      entry: '',
      extra: [],
      output: '',
      progress: 0,
      loaded: {},
      ...db
    };
    const init = (...params) => {
      const obj = {};
      for (const p of params.filter(isObj)) {
        for (const [k, v] of toArray(p, { entries: true })) {
          if (isObj(v) && !isEqual(p[k], _default[k])) {
            for (const key of toArray(_default[k], { keys: true })) {
              if (!(key in v)) v[key] = _default[k][key];
            }
          }
          Object.assign(obj, { [k]: v });
        }
      }
      return obj;
    };
    /** @type {dataQueue} */
    const resp = init(_default, data);
    const searchValue = /[^\w\s]+/g;
    for (let e of [resp.name, resp.entry].filter((i) => !isEmpty(i))) {
      if (typeof e === 'string') e = Words.split(e.trim()).join(' ').replaceAll(searchValue, '');
    }
    resp.name = resp.name.replace(/\.$/, '').trim();
    resp.entry = resp.entry.replace(/\.$/, '').trim();
    return resp;
  }
  get storyCards() {
    const settings = this.cache.settings;
    const StoryCard = this.StoryCard;
    return {
      /**
       * @param { Partial<StoryCard> & { magicId?: MagicId } } $StoryCard
       */
      create($StoryCard = {}) {
        const { keys, title = keys, magicId = {} } = $StoryCard;
        const { index, card, id } = this.get(title);
        if (card) {
          return {
            id,
            index,
            card
          };
        }
        magicId.id ??= title;
        magicId.sync ??= true;
        magicId.autoHistory ??=
          magicId.sync && settings.autoHistory ? settings.useSmallModel === false : false;
        magicId.defaultCooldown ??= settings.cooldown;
        magicId.cooldown ??=
          !magicId.sync && isNum(magicId.defaultCooldown)
            ? magicId.defaultCooldown
            : settings.cooldown;
        magicId.summary ??= '';
        delete $StoryCard.magicId;
        const toKeys = () => {
          const key =
            $StoryCard.entry && /locations?/i.test($StoryCard.entry)
              ? title
              : title.split(/ |_/)[0];
          const arr =
            key.length < 6
              ? [
                  ` ${key} `,
                  ` ${key}'`,
                  `"${key} `,
                  ` ${key}.`,
                  ` ${key}?`,
                  ` ${key}!`,
                  ` ${key};`,
                  `'${key} `,
                  `(${key} `,
                  ` ${key})`,
                  ` ${key}:`,
                  ` ${key}"`,
                  `[${key} `,
                  ` ${key}]`,
                  `—${key} `,
                  ` ${key}—`,
                  `{${key} `,
                  ` ${key}}`
                ]
              : [
                  `${key} `,
                  ` ${key}`,
                  `${key}'`,
                  `"${key}`,
                  `${key}.`,
                  `${key}?`,
                  `${key}!`,
                  `${key};`,
                  `'${key}`,
                  `(${key}`,
                  `${key})`,
                  `${key}:`,
                  `${key}"`,
                  `[${key}`,
                  `${key}]`,
                  `—${key}`,
                  `${key}—`,
                  `{${key}`,
                  `${key}}`
                ];
          arr.unshift(key);
          let TEXT = '';
          while (TEXT.length <= 100) {
            const k = arr.shift();
            if (!k) break;
            TEXT += `${k};%`;
          }
          TEXT = TEXT.split(';%')
            .filter((v) => !isBlank(v))
            .join(',');
          while (TEXT.length > 100) {
            const t = TEXT.split(',').filter((v) => !isBlank(v));
            const p = t.pop();
            if (!p) break;
            TEXT = t.join(',');
          }
          return TEXT;
        };
        return StoryCard({
          ...$StoryCard,
          id: JSON.stringify(magicId),
          keys: toKeys(),
          title
        });
      },
      /**
       * @param {string} [TITLE]
       */
      get(TITLE) {
        const i = Words.toLowerCase(TITLE);
        const card = storyCards.find((sc) => {
          try {
            const { card } = this.edit(sc, true);
            return Words.toLowerCase(card.id) === i;
          } catch {
            return false;
          }
        });
        if (card)
          return {
            id: card.id,
            index: storyCards.indexOf(card),
            card
          };
        return {
          id: TITLE,
          index: -2,
          card: null
        };
      },
      /**
       * @template { StoryCard } S
       * @template { number | undefined } T
       * @template { T extends number ? OptionId : MagicId } C
       * @param { S } sc
       * @param { T } [type]
       * @param { C } _default
       * @returns { T extends number ? { card: C } : { card: C; save(): S; toString(): string } }
       */
      edit(sc, type, _default = {}) {
        /** @type {OptionId & MagicId} */
        const obj = sc.id.startsWith('{') && sc.id.endsWith('}') ? JSON.parse(sc.id) : _default;
        if (type === 1 || type === true)
          return {
            card: obj
          };
        if (typeof type === 'number') {
          obj.pin ??= true;
        } else {
          obj.sync ??= true;
          obj.autoHistory ??=
            obj.sync && settings.autoHistory ? settings.useSmallModel === false : false;
          obj.defaultCooldown ??= settings.cooldown;
          obj.cooldown ??=
            !obj.sync && isNum(obj.defaultCooldown) ? obj.defaultCooldown : settings.cooldown;
          obj.summary ??= '';
          if (obj.sync) {
            if (obj.autoHistory !== settings.autoHistory) {
              obj.autoHistory = settings.useSmallModel === false;
            }
            if (isNum(obj.defaultCooldown) && obj.defaultCooldown !== settings.cooldown) {
              obj.cooldown = obj.defaultCooldown ?? settings.cooldown;
            }
          }
        }
        sc.description ??= '';
        const desc = sc.description.matchAll(/^([\w\s]+):\x20?(.*)/gm) || [];
        for (const [, key, value] of desc) {
          const k = key.trim();
          const v = value.trim();
          if (!(k in obj)) continue;
          let val;
          if (/(true|false)$/im.test(v)) {
            val = Words.toLowerCase(v) === 'true';
          } else if (isNum(v)) {
            val = Number(v);
          } else {
            val = v;
          }
          if (Object.is(obj[k], val)) continue;
          obj[k] = val;
        }
        return {
          card: obj,
          save() {
            sc.id = JSON.stringify(obj);
            return sc;
          },
          toString() {
            return Object.entries(obj)
              .sort()
              .map(([k, v]) => `${k}: ${v}`)
              .join('\n');
          }
        };
      }
    };
  }
  get PList() {
    const cache = this.cache;
    return {
      /**
       * Transform strings into PList object
       * @param {...string} strings
       */
      from(...strings) {
        /**
         * @type { { [key: string]: string; } }
         */
        const list = {};
        for (const s of strings.filter((i) => typeof i === 'string')) {
          for (const [, key, value, endof] of s.matchAll(/([\w\s]+):\s?([^;\]]+)(;|\])/g) || []) {
            const k = key.trim();
            const v = value.trim();
            list[k] =
              k in list && list[k] !== v ? rmDup(list[k].split(','), v.split(',')).join(',') : v;
            if (/\]/.test(endof ?? '')) break;
          }
        }
        const minimize = (a = []) => {
          const j = `[${a.join(';')}]`;
          if (j.length > MagicCards.constant.storyCard) {
            a.shift();
            return minimize(a);
          }
          return j.replace(';]', ']').trim();
        };
        return {
          list,
          toString() {
            const arr = toArray(list, { entries: true });
            return minimize(arr.map(([k, v]) => `${k}: ${v}`));
          }
        };
      },
      data: {
        category: {
          get() {
            cache.data = isEmpty(cache.data) ? cache.dataQueue.shift() || {} : cache.data;
            if (isEmpty(cache.data.category)) return [];
            const a = toArray(cache.data.loaded, { keys: true });
            return cache.data.category.filter((c) => !a.includes(c));
          },
          toString() {
            return this.get().join(',');
          }
        },
        /**
         * @param { boolean } [isOutput=false]
         * @param { ...{ text: string } } arr
         */
        get(isOutput = false, ...arr) {
          cache.data = isEmpty(cache.data) ? cache.dataQueue.shift() || {} : cache.data;
          const data = cache.data;
          const reg = /([\w\s]+):\s?([^;[\]\n]+)(;|\]|\n)/g;
          for (const { text } of rmDup(arr).filter(({ text }) => isValid(text))) {
            for (const [, key, value, endof] of text.matchAll(reg) || []) {
              const k = key
                .trim()
                .split('')
                .map((val, i) => (i === 0 ? val.toUpperCase().trim() : Words.toLowerCase(val)))
                .join('');
              if (data.category.includes(k) && !(k in data.loaded)) {
                data.loaded[k] = value.trim();
              }
              if (/\]/.test(endof)) break;
            }
          }
          const loaded = data.category.filter((i) => i in data.loaded).length;
          const progress = () => +((loaded / data.limit.category) * 100).toFixed(2);
          let extra = '';
          if (isOutput && Object.is(progress(), data.progress)) {
            if (data.limit.retry > 0) {
              data.limit.retry -= 1;
              data.limit.category -= 1;
            } else if (data.limit.retry <= 0) {
              data.limit.category = loaded;
            }
            extra = ` ↺ = ${data.limit.retry}`;
          }
          const complete = loaded >= data.limit.category;
          const raw = this.toString();
          data.progress = complete ? 100 : progress();
          const minimize = (str = '') => {
            const arr = [...data.category].reverse();
            while (str.length > data.limit.card) {
              const r = new RegExp(`(${arr.shift()}):\\s?[^;\\]\\n]+(;|\\]\\n)`, 'g');
              str = str.replaceAll(r, '');
            }
            return str;
          };
          return {
            complete,
            list: (complete ? minimize(`[${raw}]`) : `[${raw}`).replace(';]', ']'),
            raw,
            extra
          };
        },
        toString() {
          cache.data = isEmpty(cache.data) ? cache.dataQueue.shift() || {} : cache.data;
          if (isEmpty(cache.data.category)) return '';
          cache.data.loaded.Name ??= cache.data.name;
          const arr = toArray(cache.data.loaded, { entries: true })
            .filter(([k]) => cache.data.category.includes(k))
            .sort(([a], [b]) => cache.data.category.indexOf(a) - cache.data.category.indexOf(b));
          cache.data.loaded = Object.fromEntries(arr);
          return arr.map(([k, v]) => `${k}: ${v}`).join(';');
        }
      }
    };
  }
  #hook(load = true) {
    const hooks = {
      input: false,
      context: false,
      output: false
    };
    const cache = this.cache;
    if (load) {
      if (isNum(info.maxChars)) {
        hooks.input = false;
        hooks.context = true;
        hooks.output = false;
      } else if (cache.hook === 'input') {
        hooks.input = true;
        hooks.context = false;
        hooks.output = false;
      } else if (cache.hook === 'output') {
        hooks.input = false;
        hooks.context = false;
        hooks.output = true;
      }
    } else {
      hooks.input = cache.hook === 'output';
      hooks.context = cache.hook === 'input';
      hooks.output = cache.hook === 'context';
    }
    cache.hook = Object.keys(hooks).find((k) => hooks[k]) ?? 'input';
    return cache.hook;
  }
  //#region Hooks
  input() {
    const cache = this.cache;
    const t = this.text.trim();
    if (
      /^(<s>|<system>|\[system:)/i.test(t) ||
      t.startsWith('##') ||
      (t.startsWith('**') && t.endsWith('**'))
    ) {
      cache.disabled = true;
    }
    if (cache.disabled) return this;
    /**
     * @type { { name: string; cmd: string; emoji: string; message: string; }[] }
     */
    const queues = [];
    const reserved = new RegExp(`(${cache.database.map(({ type }) => type).join('|')})$`, 'i');
    for (const [, cmd, name = '', entry = ''] of t.matchAll(
      /(\/[am\s]+c)\s+([^"'/;]+);?([^"'/;]+)?/gi
    ) || []) {
      const data = this.queue({ name, entry });
      if (isBlank(data.name)) continue;
      const r = new RegExp(RegExp.escape(data.name.split(/ |_/)[0]), 'i');
      const inQueue =
        queues.some((dq) => r.test(dq.name)) || cache.dataQueue.some((dq) => r.test(dq.name));
      const messages = [];
      let emoji = '🎴';
      if (inQueue) {
        emoji = '⚠️';
        messages.push('Already in queue');
      } else if (/(retrieve|get)$/.test(data.name)) {
        emoji = '⚠️';
        messages.push('Executing entry check...');
        const excludes = [];
        for (const sc of this.magicCards()) {
          const { card } = this.storyCards.edit(sc, undefined);
          excludes.push(card.id.trim());
        }
        const data = this.queue({
          entry: rmDup(excludes.filter((i) => !isEmpty(i))).join(','),
          type: 'Retrieve'
        });
        if (!cache.dataQueue.includes(data)) cache.dataQueue.push(data);
      } else if (/((dis|en)able|toggle)$/.test(data.name)) {
        emoji = '⚠️';
        this.cache.settings.enabled = !this.cache.settings.enabled;
        messages.push(`Toggling MagicCards: ${this.cache.settings.enabled ? 'on' : 'off'}`);
      } else if (/(reset|restart|restore)$/.test(data.name)) {
        emoji = '⚠️';
        messages.push('Restoring settings...');
        this.cache = Options.createDefault();
      } else if (/(clear|clr|cls)$/.test(data.name)) {
        emoji = '⚠️';
        messages.push('Clearing cache...');
        cache.dataQueue = [];
        cache.data = {};
        cache.generating = false;
      } else if (/(summarize|compress)$/.test(data.name)) {
        emoji = '⚠️';
        messages.push('Compressing Story Cards...');
        for (const sc of this.magicCards()) {
          const edit = this.storyCards.edit(sc, undefined);
          if (edit.card.autoHistory) edit.card.cooldown = 0;
          sc.description = edit.toString();
          edit.save();
        }
      } else if (reserved.test(data.name)) {
        emoji = '⚠️';
        messages.push('Reserved name');
      } else {
        const { card } = this.storyCards.get(data.name);
        if (isNull(card)) {
          messages.push('Preparing...');
        } else {
          emoji = '⚠️';
          messages.push('Already exists');
          queues.push({
            name: data.name,
            cmd: cmd.toUpperCase(),
            emoji,
            message: messages.join(' => ')
          });
          continue;
        }
        if (cache.generating === false) cache.generating = true;
        cache.dataQueue.push(data);
      }
      queues.push({
        name: data.name,
        cmd: cmd.toUpperCase(),
        emoji,
        message: messages.join(' => ')
      });
    }
    const combine = (() => {
      const v = queues.values();
      for (const q of v) {
        if (isEqual(q, v.next().value)) {
          return true;
        }
      }
      return false;
    })();
    const dq = queues.at(0);
    let TEXT = '';
    if (combine && dq) {
      const names = queues.map(({ name }) => `◖${name}◗`);
      TEXT = `${dq.emoji} ${dq.cmd} ${names.join(' ')} => ${dq.message}`;
    } else {
      TEXT = queues
        .map(({ emoji, cmd, name, message }) => `${emoji} ${cmd} ◖${name}◗ => ${message}`)
        .join('\n');
    }
    if (!isBlank(TEXT)) {
      this.text = TEXT;
      this.message(TEXT);
    }
    return this;
  }
  context() {
    const cache = this.cache;
    if (isEmpty(cache) || cache.stop || cache.disabled) return this;
    /* Change World Lore, Recent Story, Story Summary into World_Lore, Recent_Story, Story_Summary */
    {
      const rsReg = /(World Lore|Recent Story|Story Summary):\s?/g;
      const $t = Words.split(this.text)
        .filter((i) => !MagicCards.regExp.test(i))
        .map((i) => {
          return rsReg.test(i) ? i.split(' ').join('_') : i;
        })
        .join('\n');
      if (!isBlank($t)) this.text = $t;
    }
    const wlReg = /World_Lore:\s*([\s\S]*?)$/i;
    const rsReg = /Recent_Story:\s*([\s\S]*?)$/i;
    const [, wl = ''] = wlReg.exec(this.text) || [];
    const [, rs = ''] = rsReg.exec(this.text) || [];

    const excludes = [];
    for (const sc of this.magicCards()) {
      const { card, save, toString } = this.storyCards.edit(sc, undefined);
      const name = card.id.trim();
      excludes.push(name);
      const s = name.split(/ |_/);
      const wlMention = s.some((i) => wl.includes(i));
      const rsMention = s.some((i) => rs.includes(i));
      if (rsMention && !wlMention) {
        this.text = this.text.replace(wlReg, `World_Lore:\n${sc.entry}`);
      } else if (card.autoHistory) {
        const { list } = this.PList.from(sc.entry, sc.description);
        const getCooldown = () => {
          const v = isNum(list.defaultCooldown) && Number(list.defaultCooldown);
          const def = card.defaultCooldown ?? cache.settings.cooldown;
          return v && v !== def ? v : def;
        };
        if (!isBlank(card.summary)) {
          const getLimit = () => {
            const v = isNum(list.cardLimit) && Number(list.cardLimit);
            const def = isEmpty(cache.data) ? 800 : cache.data.limit.card;
            return v && v !== def ? v : def;
          };
          list.Events = Words.limit(card.summary.replace(/\.;/, ';'), Math.abs(2000 - getLimit()));
          this.text = this.text.replaceAll(new RegExp(RegExp.escape(sc.entry), 'g'), `${list}`);
        }
        if (card.cooldown <= 0) {
          const data = this.queue({
            name,
            entry: sc.entry,
            extra: [list.Events],
            type: 'Compress'
          });
          if (!cache.dataQueue.includes(data)) cache.dataQueue.push(data);
          card.cooldown = getCooldown();
          sc.description = toString();
          save();
        }
      }
    }
    cache.data = isEmpty(cache.data) ? cache.dataQueue.shift() || {} : cache.data;
    cache.generating = !(isEmpty(cache.dataQueue) && isEmpty(cache.data));

    if (!isNull(this.debugCard)) {
      this.debugCard.card.entry = JSON.stringify(cache.data, null, ' ');
      this.debugCard.card.description = Words.limit(
        cache.errors.join('\n').trim(),
        MagicCards.constant.storyCard
      );
    }

    if (cache.generating === false && this.turn > 0) {
      const cd = this.actionCount % cache.settings.cooldown;
      if (cd === 0) {
        cache.generating = !(isEmpty(cache.dataQueue) && isEmpty(cache.data));
      } else if (cd + 1 === cache.settings.cooldown && cache.settings.autoRetrieve) {
        if (isEmpty(cache.data.name)) {
          /* We do not specify a `name` */
          const data = this.queue({
            entry: rmDup(excludes.filter((i) => !isEmpty(i))).join(','),
            type: 'Retrieve'
          });
          if (!cache.dataQueue.includes(data)) cache.dataQueue.push(data);
        }
        this.message('Executing entry check on next turn...');
      }
    }
    if (cache.generating) {
      cache.turnsSpent += 1;
      const data = cache.data;
      const parts = {
        $1: data.name,
        $2: data.entry,
        $3: `[${this.PList.data}`,
        $00: 'event1',
        $990: '<s>',
        $991: '</s>',
        $992: data.instruction.example
      };
      for (const n of data.extra.keys()) parts[`$0${n}`] = data.extra.at(0);
      const wrapper = () => {
        /** Debug: Reset in-case of instruction change/update */
        const db = (isNull(this.debugCard) ? cache : Options.createDefault()).database.find(
          (i) => i.type === data.type
        );
        if (db) data.instruction = Options.copy(db.instruction);
        const instruction = () => {
          if (isEmpty(data.loaded)) return data.instruction.ai;
          return (data.instruction.ai = data.instruction.ai.replaceAll(
            /Category:[^\n]+/g,
            `Category:${this.PList.data.category}`
          ));
        };
        return prose('', instruction(), data.instruction.user)
          .split('\\n')
          .join('\n')
          .replaceAll(/(\$\d+)/g, (_) => parts[_] ?? _);
      };
      const INT = wrapper();
      this.text += INT;
    }

    return this;
  }
  output() {
    const cache = this.cache;
    if (Object.is(cache.stop, true)) this.stop = false;
    if (cache.disabled) {
      delete cache.disabled;
      return this;
    }
    /**
     * Must have valid `type`, `entry`, `keys`, or `title`
     * @type {StoryCard[]}
     */
    const cards = storyCards
      .filter(({ id }) => isValid(id) && !(id.startsWith('{') && id.endsWith('}')))
      .filter(({ type, entry, keys, title = keys, description }) => {
        const { list } = this.PList.from(entry, description);
        return (
          isValid(type) && /character|location/i.test(type) && isValid(title) && !isBlank(list)
        );
      });
    if (!isBlank(cards)) {
      this.message(`Converted "${cards.length}" StoryCards...`);
      for (const sc of cards) {
        const defaultId = sc.title ?? sc.keys ?? '';
        const keys = defaultId.split(',');
        if (isBlank(keys)) continue;
        const defaultCooldown = Math.abs(cache.settings.cooldown + storyCards.indexOf(sc) * 2);
        const edit = this.storyCards.edit(sc, undefined, {
          sync: false,
          defaultId,
          defaultCooldown,
          id: keys[0].trim()
        });
        sc.description = `${edit.toString()}\n${sc.description}`.trim();
        edit.save();
      }
    }

    if (cache.generating) {
      const progressBar = (upNext = cache.dataQueue.at(0)) => {
        const data = cache.data;
        upNext ??= data;
        const num = data.progress;
        if (Number.isNaN(num)) return '';
        const current = Math.round(Math.round(num) / 10);
        const loaded = '█'.repeat(current);
        const remaining = '▒'.repeat(Math.abs(10 - current));
        const endof = `\n=> [ ${Words.getUniHex('1fa84')} CONTINUE ]`;
        let TEXT = '';
        TEXT += `\n- 🎴 ${num}%: ${loaded}${remaining}`;
        if (data.type === 'Characters' || data.type === 'Locations') {
          const catTotal = data.limit.category;
          const catLoaded = data.category.filter((i) => i in data.loaded).length;
          TEXT += `\n- 🎴 Categories: ${catLoaded}/${catTotal}`;
        }
        if (num === 100) {
          TEXT += `\n- 🎴 Summarize in ${cache.settings.cooldown} turns`;
        }
        if (isEmpty(upNext)) {
          TEXT += `${endof}\n<s>Continue story from exact pre-interruption point.</s>`;
        } else if (
          !isEmpty(upNext) &&
          !isEmpty(upNext.name) &&
          !Object.is(upNext.name, data.name)
        ) {
          TEXT += `\n- 🎴 Up Next: ${upNext.type === 'Locations' ? '🏚️' : ''}${upNext.name}${endof}`;
        } else {
          TEXT += endof;
        }
        return TEXT;
      };
      if (isEmpty(cache.data.name)) {
        const t = this.text.trim();
        const messages = [];
        if (/Retrieve/.test(cache.data.type)) {
          const iterator = t.matchAll(/(Characters|Locations):\s?([^;\n\]]+)/g) || [];
          for (const [, type, entries] of iterator) {
            for (const n of entries.split(',')) {
              const name = n.trim();
              if (!/[A-Z]/.test(name)) continue;
              if (/none|n\/a|unknown|not\s?found/i.test(name)) continue;
              const scExists = Array.from(this.magicCards()).some((sc) => {
                const { card } = this.storyCards.edit(sc, true);
                return new RegExp(RegExp.escape(card.id.trim()), 'i').test(name);
              });
              if (scExists) continue;
              const data = this.queue({ name, type });
              if (isEmpty(data.name)) continue;
              const r = new RegExp(RegExp.escape(data.name.split(/ |_/).join('|')), 'i');
              if (cache.dataQueue.some((dq) => r.test(dq.name.trim()))) continue;
              const { card } = this.storyCards.get(data.name);
              if (isNull(card)) cache.dataQueue.push(data);
            }
          }
        }
        if (isBlank(cache.dataQueue)) {
          messages.push('No new entries found');
        } else {
          const dataQueue = cache.dataQueue
            .filter(({ type }) => type !== 'Retrieve')
            .map(({ name, type }) => `◖${type === 'Locations' ? '🏚️' : ''}${name}◗`)
            .join(' ');
          if (!isBlank(dataQueue)) messages.push(`Added to queue: ${dataQueue}`);
        }
        if (!isBlank(messages)) {
          this.text = messages.map((i) => this.print(i, '🎴', 'MagicCards')).join('');
        }
        cache.data = cache.dataQueue.shift() || {};
        this.refresh();
      } else {
        const { complete, list, extra } = this.PList.data.get(
          true,
          this.history,
          { text: cache.data.output },
          { text: this.text }
        );
        if (complete) {
          const sc = this.storyCards.create({
            title: cache.data.name,
            entry: list,
            type: cache.data.type === 'Locations' ? MagicCards.constant.location : undefined
          });
          if (isNull(sc.card)) throw sc.error;
          const edit = this.storyCards.edit(sc.card, undefined);
          if (
            /Compress/.test(cache.data.type) &&
            !isEmpty(cache.data.loaded) &&
            !isEmpty(cache.data.loaded.Events)
          ) {
            edit.card.summary = cache.data.loaded.Events;
          }
          sc.card.cooldown = sc.card.defaultCooldown ?? cache.settings.cooldown;
          sc.card.description = edit.toString();
          edit.save();
          const upNext = cache.dataQueue.shift() || {};
          if (/Compress/.test(cache.data.type)) {
            this.message(`Compressed ${cache.data.name}`);
          } else {
            this.message(`Created ${cache.data.name}`);
          }
          this.text = this.print(`Done! (${list.length}/1,000)${progressBar(upNext)}`);
          cache.data = upNext;
          this.refresh();
        } else {
          cache.data.output = list;
          const t = /Compress/.test(cache.data.type)
            ? 'Compressing...'
            : `Generating ${Words.toLowerCase(cache.data.type).replace(/s$/, '')}...`;
          this.message(t);
          this.text = this.print(`${t} ${extra}${progressBar()}`);
        }
      }
    } else {
      if (typeof history !== 'undefined')
        history = history.filter(({ text }) => !MagicCards.regExp.test(text));
      for (const sc of this.magicCards()) {
        const edit = this.storyCards.edit(sc, undefined);
        if (edit.card.autoHistory) {
          edit.card.cooldown--;
          if (edit.card.cooldown === 0) {
            this.message(`Compressing ${sc.title} on the next turn...`);
          }
        }
        sc.description = edit.toString();
        edit.save();
      }
    }

    return this;
  }
  //#endregion
  *magicCards() {
    const cards = storyCards.filter(
      ({ id }) => isValid(id) && id.startsWith('{') && id.endsWith('}') && !id.includes('"pin"')
    );
    for (const sc of cards) {
      yield sc;
    }
  }
}
const mc = new MagicCards(OPTIONS);
globalThis.MagicCards = MagicCards;
globalThis.mc = mc;
//#endregion
