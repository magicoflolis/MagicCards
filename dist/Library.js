/**
 * Scripting API: https://help.aidungeon.com/scripting
 * Scripting Guidebook: https://github.com/magicoflolis/aidungeon.js/blob/main/Scripting%20Guidebook.md
 */
/// <reference no-default-lib="true"/>
/// <reference lib="es2022"/>

//#region Magic Cards

/**
 * @type { Partial<DEFAULT_OPTIONS> }
 */
const OPTIONS = {};

class Options extends null {
  static createDefault() {
    /**
     * @type { DEFAULT_OPTIONS }
     */
    const _default = {
      settings: {
        enabled: true,
        cardLimit: 800,
        category: [
          'Name',
          'Age',
          'Gender',
          'Personality',
          'Appearance',
          'Quirks',
          'Mannerisms',
          'Flaws',
          'Likes',
          'Dislikes',
          'Occupation',
          'Backstory',
          'Hobbies',
          'Other'
        ],
        categoryLimit: 12,
        minTurns: 10
      },
      cardId: null,
      cooldown: 22,
      createdCards: [],
      data: {},
      dataQueue: [],
      generating: false,
      retries: 2
    };
    _default.settings.categoryLimit = _default.settings.category.length;
    _default.instructions = {
      base: [
        '[System: Update PList from "$1" without repetition. Complete partials. Be concise and grounded.',
        '',
        'PList Rules:',
        '1. Format: [CAT:TRAIT(DESC)[,...];...] ',
        `2. Priority: ${_default.settings.category.join('>')}`,
        '3. Traits:',
        '   - Non-Flaws: pos/neutral',
        '   - Max 3 nests (trait(sub(sub)))',
        '   - No word repetition',
        '   - Snake_case',
        '   - Link psych-behavior',
        '4. Appearance: Include clothing',
        '5. Anti-rep:',
        '   - Merge similar traits (Leven<3)',
        '   - Remove dupes',
        '   - Consolidate each category',
        '   - Ensure each category exists',
        '6. Truncation Protocol:',
        '   - Complete current CAT/TRAIT/DESC',
        '   - Auto-close symbols',
        '   - Never break mid-trait',
        '7. Generate in sequence by Priority order',
        '8. Output: PList continuation from exact interruption point',
        'Output Format:',
        '[Name: David Red; Gender: male; Personality: confident(underestimates_threats); Quirks/Habits: scratches_neck(thinking), quick_to_smile(hides_emotions); ...]'
      ].join('\n'),
      input: ['', '$2', '$1 = $3'].join('\n'),
      retrieve: [
        '[System: Extract plot-relevant names in sequence. Plain text. Output two lines:',
        'Characters: name1, name2, ...;',
        'Locations: name1, name2, ...;',
        '- Only explicit names in current context',
        '- Prefer entire name for each (e.g., David Red, Bluelock Forge)',
        '- Exclude generics/metaphors/unknowns/secrets, $2',
        '- 3 max per line',
        ']'
      ].join('\n')
    };
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
}

//#region Utilities
/**
 * @param {?} obj
 * @returns {string}
 */
function objToStr(obj) {
  return Object.prototype.toString.call(obj).match(/\[object (.*)\]/)[1];
}
/**
 * @param {?} obj
 * @returns {obj is { [key: string]: unknown }}
 */
function isObj(obj) {
  return /Object/.test(objToStr(obj));
}
/**
 * @param {?} obj
 * @returns {obj is (null | undefined)}
 */
function isNull(obj) {
  return Object.is(obj, null) || Object.is(obj, undefined);
}
/**
 * Object is Blank
 * @template O
 * @param { O } obj
 */
function isBlank(obj) {
  return (
    (typeof obj === 'string' && Object.is(obj.trim(), '')) ||
    ((obj instanceof Set || obj instanceof Map) && Object.is(obj.size, 0)) ||
    (Array.isArray(obj) && Object.is(obj.length, 0)) ||
    (isObj(obj) && Object.is(Object.keys(obj).length, 0))
  );
}
/**
 * Object is Empty
 * @template O
 * @param { O } obj
 */
function isEmpty(obj) {
  return isNull(obj) || isBlank(obj);
}
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
    if (lengthLimit < str.length) {
      return str.slice(0, lengthLimit).trim();
    }
    return str;
  }
  /**
   * @template {string} S
   * @param {S} str
   */
  static split(str = '') {
    return str.split(/\f|\t|\n|\r|\v|\0/);
  }
  /**
   * @template {string} S
   * @param {S} str
   */
  static toLowerCase(str) {
    return typeof str === 'string' ? str.toLowerCase().trim() : ' ';
  }
  /**
   * @template {string[]} S
   * @param {S} str
   */
  static toNumber(str) {
    return str
      .map((s) => {
        const cp = Words.toCodePoint(Words.toLowerCase(s));
        return Number.isNaN(Number(cp)) ? parseInt(cp, 16) : Number(cp);
      })
      .filter((s) => !Number.isNaN(s));
  }
  /**
   * @template {string} S
   * @param {S} str
   */
  static combine(str) {
    return [...str]
      .map((s) => Words.toLowerCase(Words.toCodePoint(s)))
      .filter((s) => !/c|9|a|d|20|b|0/.test(s))
      .map(Words.getUniHex)
      .join('');
  }
  static ignorePoints() {
    return [
      '!',
      '@',
      '#',
      '%',
      '&',
      ';',
      '+',
      '*',
      '?',
      '^',
      '$',
      '.',
      '[',
      ']',
      '{',
      '}',
      '(',
      ')',
      '|',
      '/',
      '\\',
      ',',
      '\f',
      '\t',
      '\n',
      '\r',
      '\v',
      '\0'
    ];
  }
  static lineBreaks() {
    return ['\f', '\t', '\n', '\r', '\x20', '\v', '\0'];
  }
  static cpIgnorePoints() {
    return Words.ignorePoints().map(Words.toCodePoint);
  }
}
//#endregion

//#region Console

Error.stackTraceLimit = 3;

class AIDError extends Error {
  /**
   * @param { string } [message]
   * @param { ErrorOptions } [options]
   */
  constructor(message, options) {
    super(message, options);
    const stack = this.stack || '';
    if ('captureStackTrace' in Error) {
      /** Avoid `AIDError` in stack trace */
      Error.captureStackTrace(this, AIDError);
      /** Avoid `*` in stack trace */
      Error.captureStackTrace(this, con.log);
    }
    let tmp = '';
    const reg = /\s?\(?(\<isolated-vm\w*\>):(\d+):(\d+)\)?/gm;
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
   * @param  {...string} messages
   */
  static msg(...messages) {
    state.messageHistory ??= [];

    const MESSAGES = messages.filter((m) => typeof m === 'string' && !Object.is(state.message, m));
    if (isBlank(MESSAGES)) return;

    let id = 0;
    for (const n of Words.toNumber(MESSAGES)) {
      id += n;
    }
    if (id === 0 && state.messageHistory.includes(id)) return;
    state.messageHistory.push(id);
    const message = MESSAGES.join('\n——————————————————————————\n');
    state.message = message;
    console.log(message);
  }
}
//#endregion

const MagicCards = class {
  //#region MC Utilities
  static util = {
    /**
     * @template {ModifierFN} F
     * @param {F} [fn]
     */
    modifier(fn) {
      return typeof fn === 'function' && !Object.is(fn.toString(), globalThis.modifier.toString());
    },
    /**
     * @template { string | ModifierFN } Code
     * @param { Code } code
     * @param { boolean } [useEval]
     * @returns { ?ModifierFN }
     */
    Func(code, useEval) {
      try {
        const s = objToStr(code);
        if (!/String|Function/.test(s))
          throw new AIDError(`"code" must be a type of string or function, got "${s}"`, {
            cause: 'MagicCards.util.Func()'
          });
        if (typeof code === 'string') {
          const parse = code.startsWith('return ') ? code : `return ${code}`;
          if (useEval) return eval(`(() => { ${parse} })()`);
          // @ts-expect-error For AID
          return new Object.constructor(parse)();
        }
        return code;
      } catch (e) {
        con.log(e instanceof AIDError ? e : new AIDError(e, { cause: 'MagicCards.util.Func()' }));
        return null;
      }
    }
  };
  /**
   * Find and create Story Cards
   * @template { StoryCard } SC
   * @param { Partial<SC> } $StoryCard
   * @param { number } retries - Number of retries before function times out.
   * @returns { { index: number; card: SC | null; error?: AIDError } }
   */
  static getStoryCard($StoryCard = {}, retries = 2) {
    if (retries > 0) {
      retries -= 1;
      const {
        keys = '\0',
        entry = '',
        type = 'MC_CARD',
        title = keys,
        description,
        id
      } = $StoryCard;
      /* Find Story Card based `keys`, `entry`, `type` */
      const card = storyCards.find(
        ({ keys: k, entry: e, title: t, type: ty, description: d, id: i }) => {
          if ((id && Number(i) === Number(id)) || (description && d === description)) return true;
          return e === entry && ty === type && (k === keys || t === title);
        }
      );
      /* If `card` exists, return { index, card } */
      if (card) {
        if (id) card.id = `${id}`;
        return { index: storyCards.indexOf(card), card };
      }
      /* Otherwise, call `addStoryCard()` function and loop */
      addStoryCard(keys, entry, type, title, description);
      return MagicCards.getStoryCard($StoryCard, retries);
    }
    return {
      index: -2,
      card: null,
      error: new AIDError('Failed, getStoryCard() has timed out.', { cause: 'getStoryCard' })
    };
  }
  static get turn() {
    return Number.isInteger(info.actionCount) ? Math.abs(info.actionCount) : 0;
  }
  static get cardId() {
    return {
      internal: 500_000,
      card: 100_000
    };
  }
  /**
   * @type { ?{ index: number; card: StoryCard | null; error?: AIDError } }
   */
  configCard = null;
  //#endregion
  //#region Constructor
  /**
   * @param { Partial<DEFAULT_OPTIONS> } options
   */
  constructor(options = {}) {
    //#region Binders
    this.input = this.input.bind(this);
    this.context = this.context.bind(this);
    this.output = this.output.bind(this);
    this.Modifier = this.Modifier.bind(this);
    this.cleanup = this.cleanup.bind(this);
    //#endregion

    /**
     * Ensures `modifier` function exists & prevent it from being `undefined`
     *
     * _This is the last executed function in the chain._
     */
    const modifier = () => this.cleanup();
    // @ts-expect-error For AID
    globalThis.modifier = modifier;

    if (!isObj(options))
      throw new TypeError('"options" must be a type of JSON Object', {
        cause: 'MagicCards.constructor()'
      });

    const defaultOptions = Options.createDefault();
    Object.defineProperty(this, 'cache', { writable: true });
    if (!this.cache && 'MagicCards' in state) {
      /**
       * @type { DEFAULT_OPTIONS }
       */
      this.cache = {
        ...defaultOptions,
        ...options,
        ...state.MagicCards
      };
    } else {
      this.cache = {
        ...defaultOptions,
        ...options
      };
    }
    const getInitCard = (type = 'MC_CONFIG', title = '🎴 SETTINGS') => {
      let id = MagicCards.cardId.internal;
      for (const n of Words.toNumber([...type])) {
        id += n;
      }
      const SC = MagicCards.getStoryCard({ id, type });
      if (SC.error || isNull(SC.card)) throw SC.error;
      if (SC.card.keys !== '\0') SC.card.keys = '\0';
      if (SC.card.type !== type) SC.card.type = type;
      if (SC.card.title !== title) SC.card.title = title;
      const reg = /^(\w+):\s?(.*)/gm;
      let opt = this.cache;
      if (type === 'MC_CONFIG') {
        opt = { ...this.cache.settings, ...this.cache.instructions };
        this.cache.cardId ??= id;
      } else {
        delete opt.instructions;
      }
      if (!isBlank(SC.card.entry)) {
        for (const [_, key, value] of SC.card.entry.matchAll(reg) || []) {
          try {
            if (key in opt) {
              if (key === 'category' && value.startsWith('[') && value.endsWith(']')) {
                opt[key] = value.replaceAll(/\[|\]/g, '').split(', ');
              } else if (value.startsWith('{') && value.endsWith('}')) {
                opt[key] = JSON.parse(value.replaceAll(/(\w+):/g, '"$1":'));
              } else if (/input|base|retrieve/g.test(key)) {
                opt[key] = Words.split(value).join('\\n');
              } else {
                opt[key] = value;
              }
            }
          } catch {
            opt[key] = value;
          }
        }
        const $config = opt;
        delete $config.base;
        delete $config.input;
        delete $config.retrieve;
        for (const key of Object.keys($config)) {
          if (Object.is($config[key], defaultOptions.settings[key])) {
            delete $config[key];
          } else if (/enabled/.test(key)) {
            $config[key] = $config[key] === 'true';
          } else if (/cardLimit|categoryLimit|minTurns/.test(key)) {
            $config[key] = Number($config[key]);
          }
        }
        this.cache.instructions.base = this.cache.instructions.base.replaceAll(
          /Priority: [\w>]+/g,
          `Priority: ${this.cache.settings.category.join('>')}`
        );
        this.cache.settings = {
          ...this.cache.settings,
          ...$config
        };
      }
      let e = '';
      for (const [k, v] of Object.entries(opt)) {
        if (/input|base|retrieve/g.test(k)) {
          e += `${k}: ${Words.split(v).join('\\n')};%`;
        } else if (isObj(v)) {
          const val = [];
          for (const [key, value] of Object.entries(v)) {
            val.push(`${key}: ${value}`);
          }
          e += `${k}: {${val.join(', ')}};%`;
        } else if (Array.isArray(v)) {
          e += `${k}: [${v.join(', ')}];%`;
        } else {
          e += `${k}: ${v};%`;
        }
      }
      SC.card.entry = Words.limit(e.split(';%').join('\n').trim(), 2000);
      SC.card.description = JSON.stringify(opt);
      return SC;
    };
    this.configCard = getInitCard();
  }
  //#endregion
  /**
   * @param {...(string | ModifierFN)} modifiers
   */
  Modifier(...modifiers) {
    if (!this.cache.generating) {
      const points = Words.cpIgnorePoints();
      modifiers.forEach((modifier) => {
        const fn = MagicCards.util.Func(modifier);
        if (fn) {
          const $fn = [...fn.toString()]
            .map(Words.toCodePoint)
            .filter((f) => !points.includes(f))
            .map(Words.getUniHex)
            .join('')
            .trim();
          if (
            !/(function\s*)?text(\s*=>)?\s*return\s*text/.test($fn) &&
            MagicCards.util.modifier(fn)
          )
            this.setText(fn);
        }
      });
    }
    return this;
  }
  /**
   * @template {Text | ModifierFN | [typeof text, typeof stop] | ReturnType<ModifierFN>} T
   * @param {T} TEXT
   */
  setText(TEXT) {
    /**
     * @param { T } val
     */
    const extract = (val) => {
      if (val instanceof Promise) {
        throw new AIDError('Unsupported, "val" is a type of Promise.', {
          cause: 'MagicCards.text'
        });
      } else if (typeof val === 'function') {
        if (/autocards?/i.test(val.name)) {
          throw new AIDError('AutoCards is not supported', {
            cause: val.name || 'MagicCards.setText():extract'
          });
        }
        const { text, stop } = this;
        /**
         * @type { any }
         */
        let r = text;
        try {
          r = val.call(this, text, stop);
        } catch (e) {
          con.log(
            e instanceof AIDError
              ? e
              : new AIDError(e, { cause: val.name || 'MagicCards.setText():extract' })
          );
          return text;
        }
        return extract(r);
      } else if (Array.isArray(val)) {
        const [TEXT, STOP = false] = val;
        if (Object.is(STOP, true)) this.stop = STOP;
        return TEXT;
      } else if (isObj(val)) {
        const { text, stop = false } = val;
        if (Object.is(stop, true)) this.stop = stop;
        return text;
      }
      return val;
    };
    TEXT = extract(TEXT);
    if (Object.is(this.stop, false) && typeof TEXT !== 'string') {
      throw new AIDError(`"str" must be a type of string, got "${objToStr(TEXT)}"`, {
        cause: 'MagicCards.text'
      });
    }
    if (typeof text !== 'undefined') {
      if (!Object.is(text, TEXT) && (typeof TEXT === 'string' || isNull(TEXT))) text = TEXT;
    }

    return this;
  }
  get text() {
    return typeof text !== 'undefined' ? text : ' ';
  }
  set text(str) {
    if (typeof text !== 'undefined') text = str;
  }
  get stop() {
    return typeof stop !== 'undefined' ? stop : false;
  }
  set stop(bol) {
    if (typeof stop !== 'undefined' && typeof bol === 'boolean') {
      if (!Object.is(stop, bol)) {
        stop = bol;
        if (Object.is(bol, true) && typeof this.text === 'string') this.text = null;
      }
    }
  }
  get history() {
    const s = MagicCards.turn - this.cache.cooldown;
    return (history[s] ? history.slice(s) : history)
      .filter(({ text }) => !isEmpty(text) && !/🎴|⚠️/g.test(text))
      .map((h) => {
        return {
          index: history.indexOf(h),
          text: Words.split(h.text).join(' ').trim(),
          rawText: h.text,
          type: h.type
        };
      });
  }
  save() {
    const defaultOptions = Options.createDefault();
    const config = Options.copy(this.cache);
    if (config !== defaultOptions) {
      const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      for (const [key, value] of Object.entries(config)) {
        if (!(key in defaultOptions)) {
          delete config[key];
        } else if (Array.isArray(value) && isEqual(value, defaultOptions[key])) {
          delete config[key];
        } else if (isObj(value) && isEqual(value, defaultOptions[key])) {
          delete config[key];
        } else if (Object.is(value, defaultOptions[key])) {
          delete config[key];
        }
      }
      state.MagicCards = config;
    }
    return config;
  }
  cleanup() {
    this.save();
    const { text, stop } = this;
    return { text, stop };
  }
  print(message = '', emoji = '🎴') {
    const data = this.cache.data;
    if (!isEmpty(data)) {
      return `\n- ${emoji} ◖${data.name}◗ 🢂 ${message}\n`;
    }
    return `\n- ${emoji} 🢂 ${message}\n`;
  }
  queue(data = {}) {
    return {
      name: '',
      entry: '',
      output: '',
      retries: 2,
      progress: 0,
      ...data
    };
  }
  /**
   * @param {string} key
   * @param {string} keys
   */
  buildKeys(key, keys) {
    const keyset = [];
    if (!isEmpty(keys)) {
      keyset.push(...keys.split(',').filter((preKey) => !isBlank(preKey)));
      // Iterate backwards so indices don't get screwed up
      for (const i of [...keyset].reverse()) {
        if (i.trim().replace(/\s+/g, ' ').toLowerCase().includes(key.toLowerCase())) {
          // Remove any initial keys which include titleKeyPair.newKey
          keyset.splice(keyset.indexOf(i), 1);
        }
      }
    }
    const keyArr =
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
    keyset.push(...keyArr);
    keys = '';
    let i = 0;
    while (i < keyset.length && keys.length + 1 + keyset[i].length < 101) {
      keys += `,${keyset[i]}`;
      i++;
    }
    if (keys.startsWith(',')) {
      keys = keys.slice(1);
    }
    return keys;
  }
  getCardId(TITLE = '') {
    let id = MagicCards.cardId.card;
    for (const n of Words.toNumber([...Words.toLowerCase(TITLE.split(' ')[0] || TITLE)])) {
      id += n;
    }
    if (id === MagicCards.cardId.card)
      throw new AIDError(`Invalid title: ${TITLE}`, { cause: 'MagicCards.getCardId()' });

    const card = storyCards.find(({ id: i }) => Number(i) === id);
    if (card)
      return {
        index: storyCards.indexOf(card),
        card,
        id
      };
    return {
      index: -2,
      card: null,
      id
    };
  }
  /**
   * @param { Partial<StoryCard> } $StoryCard
   */
  createCard($StoryCard = {}) {
    const { keys = '\0', entry = '', type = 'MC_CARD', title = keys, description } = $StoryCard;

    const { index, card, id } = this.getCardId(title);
    if (card)
      return {
        index,
        card,
        id
      };
    if (!this.cache.createdCards.includes(id)) {
      this.cache.createdCards.push(id);
      const SC = MagicCards.getStoryCard({
        id,
        keys: this.buildKeys(title.split(' ')[0] || title),
        entry,
        type,
        title: `🎴 ${title}`,
        description
      });
      if (SC.error || isNull(SC.card)) throw SC.error;
      return {
        id,
        ...SC
      };
    }
    return {
      index: -2,
      card: null,
      id
    };
  }
  /**
   * @param { { text: string }[] } arr
   * @param { boolean } [isOutput=false]
   */
  getPList(arr = [], isOutput = false) {
    const settings = this.cache.settings;
    /**
     * @type { { [key: string]: string; } }
     */
    const mapper = {};
    const reg = /([\w\s]+):\s?([\w\-_()\s,/]+)(;|\])/g;
    let extra = '';
    let list = '';
    let complete = false;
    let categoryLimit = settings.categoryLimit;

    for (const { text } of [
      ...this.history.map(({ text }) => {
        return { text };
      }),
      ...arr
    ]) {
      if (isEmpty(text)) continue;
      const m = text.matchAll(reg) || [];
      for (const [_, key, value, endof] of m) {
        const k = key.trim();
        const v = value.trim();
        if (endof === ']') {
          complete = !complete;
          break;
        }
        if (settings.category.includes(k) && !(k in mapper)) {
          mapper[k] = v;
          list += `${k}:${v};`;
        }
      }
    }
    const progress = () => +((Object.keys(mapper).length / categoryLimit) * 100).toFixed(2);
    if (!complete) {
      if (isOutput && Object.is(progress(), this.cache.data.progress)) {
        if (this.cache.data.retries > 0) {
          this.cache.data.retries -= 1;
        } else {
          categoryLimit = Object.keys(mapper).length;
        }
        extra = ` ↺ = ${this.cache.data.retries}`;
      }
      complete = settings.category.filter((cat) => mapper[cat]).length >= categoryLimit;
    }
    const raw = list;
    list = Words.split(list).join('').trim();
    list = complete ? `[${list}]` : `[${list}`;

    const minimize = (str = '', arr = [...settings.category].reverse()) => {
      while (str.length > settings.cardLimit) {
        str = str.replaceAll(new RegExp(`(${arr.shift()}):\\s?[\\w\\-_()\\s,/]+(;|\\])`, 'g'), '');
      }
      return str;
    };
    list = (complete ? minimize(`${list}`) : list).replace(/;\]/, ']');
    this.cache.data.progress = complete ? 100 : progress();
    return {
      complete,
      list,
      raw,
      extra,
      mapper
    };
  }
  //#region Hooks
  /**
   * @param {...ModifierFN} modifiers
   */
  input(...modifiers) {
    const cache = this.cache;
    if (!cache.settings.enabled) return this.Modifier(...modifiers);
    const queues = [];
    const reg = /(\/[am\s]+c)\s+([^"'/;]+);?([^;/]+)?/gi;
    for (const [_, cmd, name, entry] of this.text.matchAll(reg) || []) {
      const data = this.queue({
        name: name.trim().replaceAll(/[^\w\s]+/g, ''),
        entry: entry.trim().replaceAll(/[^\w\s]+/g, '')
      });
      const inQueue = cache.dataQueue.find((q) => q.name === data.name);
      const messages = [];
      let emoji = '🎴';
      if (inQueue) {
        emoji = '⚠️';
        messages.push('Already in queue.');
      } else {
        const prepare = () => {
          const { card } = this.getCardId(data.name);
          if (isNull(card)) {
            messages.push('Preparing...');
          } else {
            messages.push('Updating...');
            data.entry = `Override and update plot-relevant CAT/TRAIT/DESC.\n${data.entry}`;
          }
        };
        if (MagicCards.turn + 1 >= cache.settings.minTurns) {
          if (cache.generating === false) cache.generating = !cache.generating;
          prepare();
        } else {
          cache.cooldown = cache.settings.minTurns;
          emoji = '⚠️';
          messages.push(
            `(Not enough story) Generating in ${Math.abs(MagicCards.turn - cache.cooldown - 1)} turns.`
          );
        }
        if (!cache.dataQueue.includes(data)) cache.dataQueue.push(data);
      }
      queues.push({
        cmd: cmd.toUpperCase(),
        emoji,
        message: messages.join(' 🢂 '),
        ...data
      });
    }

    const TEXT = queues
      .map(({ emoji, cmd, name, message }) => `${emoji} ${cmd} ◖${name}◗ 🢂 ${message}`)
      .join('\n');
    if (!isBlank(TEXT)) this.text = TEXT;

    return this.Modifier(...modifiers);
  }
  /**
   * @param {...ModifierFN} modifiers
   */
  context(...modifiers) {
    const cache = this.cache;
    if (!cache.settings.enabled) return this.Modifier(...modifiers);
    {
      const mcReg = /(\n-\s)?(🎴|⚠️)(\s\/)?/g;
      const rsReg = /(World Lore|Recent Story|Story Summary):\s?/g;
      const TEXT = Words.split(this.text)
        .filter((t) => !mcReg.test(t))
        .map((t) => {
          return rsReg.test(t) ? t.split(' ').join('_') : t;
        })
        .join('\n');
      if (!isBlank(TEXT)) this.text = TEXT;
    }
    if (
      cache.generating === false &&
      MagicCards.turn > 0 &&
      MagicCards.turn % cache.cooldown === 0
    ) {
      if (isEmpty(cache.data.name)) {
        const data = this.queue({
          name: '',
          entry: ''
        });
        /**
         * @type {StoryCard[]}
         */
        const arr = Array.from(this);
        const entries = [];
        for (const sc of arr) {
          const [, name] = sc.entry.match(/Name:(.*);/) || [];
          if (!name) continue;
          if (!entries.includes(name)) entries.push(name);
        }
        data.entry = entries.join(', ');
        if (!cache.dataQueue.includes(data)) cache.dataQueue.push(data);
      }
      if (!Object.is(cache.data.name, cache.dataQueue.at(0)?.name)) {
        cache.data = cache.dataQueue.shift() || {};
      }
      cache.generating = !cache.generating;
    }
    if (cache.generating) {
      let base = `${cache.instructions.base}\n${cache.instructions.input}`;
      const { complete, list } = this.getPList([{ text: cache.data.output }]);
      if (!complete) {
        const History = [...this.history].reverse();
        let TEXT = '';
        while (TEXT.length <= 1000) {
          const h = History.shift();
          if (!h) break;
          TEXT += h.text;
        }
        if (!isBlank(TEXT))
          this.text = this.text.replace(/Recent_Story:\s*([\s\S]*?)$/i, `Recent_Story:\n${TEXT}`);
      }
      const parts = {
        $1: cache.data.name,
        $2: cache.data.entry,
        $3: list
      };
      if (isEmpty(cache.data.name)) {
        base = cache.instructions.retrieve;
      }
      this.text += base
        .split('\\n')
        .join('\n')
        .replaceAll(/(\$\d+)/g, (_) => parts[_] ?? _);
    }
    return this.Modifier(...modifiers);
  }
  /**
   * @param {...ModifierFN} modifiers
   */
  output(...modifiers) {
    const cache = this.cache;
    if (!cache.settings.enabled) return this.Modifier(...modifiers);
    if (cache.generating) {
      const progressBar = (upNext = cache.dataQueue.at(0)) => {
        upNext ??= cache.data;
        const num = cache.data.progress;
        if (Number.isNaN(num)) return '';
        const current = Math.round(Math.round(num) / 10);
        const loaded = '█'.repeat(current);
        const remaining = '▒'.repeat(Math.abs(10 - current));
        const endof = `\n🢂 [ ${Words.getUniHex('1fa84')} CONTINUE ]`;
        let TEXT = '';
        TEXT += `\n- ${num}%: ${loaded}${remaining}`;
        if (isEmpty(upNext)) {
          TEXT += `${endof}\n[System: Resume from exact pre-interruption point.]`;
        } else if (!isEmpty(upNext) && !Object.is(upNext?.name, cache.data.name)) {
          TEXT += `\n- Up Next: 🎴${upNext.name}${endof}`;
        } else {
          TEXT += endof;
        }
        return TEXT;
      };

      if (isEmpty(cache.data.name)) {
        cache.data.name = 'MagicCards';
        const t = this.text.matchAll(/(Characters|Locations):\s?(.*);/g) || [];
        this.text = this.print('Checking for new entries...');
        for (const [, type, entries] of t) {
          if (type === 'Characters') {
            for (const name of entries.split(',')) {
              const data = this.queue({
                name: name.trim()
              });
              const { card } = this.getCardId(data.name);
              if (isNull(card) && !cache.dataQueue.includes(data)) {
                con.log(data.name);
                cache.dataQueue.push(data);
              }
            }
          }
        }
        cache.generating = !isBlank(cache.dataQueue);
        cache.data = cache.dataQueue.shift() || {};
        return this.Modifier(...modifiers);
      }
      const { complete, list, raw, extra } = this.getPList(
        [{ text: cache.data.output }, { text: this.text }],
        true
      );

      if (complete) {
        cache.generating = !isBlank(cache.dataQueue);
        const createdCard = this.createCard({
          title: cache.data.name,
          entry: list,
          description: raw
        });
        if (createdCard.error || isNull(createdCard.card)) throw createdCard.error;
        const defaultOptions = Options.createDefault();
        const upNext = cache.dataQueue.shift() || {};
        this.text = this.print(`Done! (${list.length}/1,000)${progressBar(upNext)}`);
        cache.data = upNext;
        cache.retries = OPTIONS.retries ?? defaultOptions.retries;
        cache.cooldown = OPTIONS.cooldown ?? defaultOptions.cooldown;
      } else {
        cache.data.output += this.text;
        this.text = this.print(`Generating... ${extra}${progressBar()}`);
      }
    } else {
      const reg = /(\n-\s)?(🎴|⚠️)(\s\/)?/g;
      history = history.filter(({ text }) => !reg.test(text));
    }
    return this.Modifier(...modifiers);
  }
  *[Symbol.iterator]() {
    for (const sc of storyCards.filter(({ type }) => type === 'MC_CARD')) {
      yield sc;
    }
  }
  //#endregion
};
const mc = new MagicCards(OPTIONS);
const input = mc.input;
const context = mc.context;
const output = mc.output;
//#endregion
