import '../types/MagicCards.d.ts';

/**
 * Scripting API: https://help.aidungeon.com/scripting
 * Scripting Guidebook: https://github.com/magicoflolis/aidungeon.js/blob/main/Scripting%20Guidebook.md
 */

//#region Magic Cards

/**
 * @type { Partial<defaultOptions> }
 */
const OPTIONS = {};

//#region Utilities
globalThis.history ??= [];
globalThis.storyCards ??= [];
globalThis.info ??= {};
/** For Console */
globalThis.state ??= {};
state.messageHistory ??= [];
/**
 * For MagicCards, cache "large" temporary objects to improve performance
 * @type { { wordData?: { type: string[]; points: string[]; switch(): { type: string[]; points: string[] } }; constant?: { type: string; internal: 5000; card: 1000; }; [key: PropertyKey]: unknown} }
 */
const _ = {};

//#region Polyfill
{
  /**
   * Source: https://jsr.io/@li/regexp-escape-polyfill
   */
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
        .map((c) => unicodeEscape(c))
        .join('');
    }
    return c;
  }
  /**
   * @param {string} c
   * @returns {string} the unicode escape of `c`.
   */
  function unicodeEscape(c) {
    return `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`;
  }

  Object.defineProperty(RegExp, 'escape', {
    value: regExpEscape,
    writable: true,
    enumerable: false,
    configurable: true
  });
}
//#endregion

/**
 * @param {?} obj
 * @returns {string}
 */
const objToStr = (obj) => Object.prototype.toString.call(obj).match(/\[object (.*)\]/)[1];
/**
 * @param {?} obj
 * @returns {obj is { [key: PropertyKey]: unknown }}
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
 * @param { O } obj
 */
const isBlank = (obj) =>
  (typeof obj === 'string' && (Object.is(obj.trim(), '') || Object.is(obj.trim(), '\0'))) ||
  ((obj instanceof Set || obj instanceof Map) && Object.is(obj.size, 0)) ||
  (Array.isArray(obj) && Object.is(obj.length, 0)) ||
  (isObj(obj) && Object.is(Object.keys(obj).length, 0));
/**
 * Object is Empty
 * @template O
 * @param {O} obj
 */
const isEmpty = (obj) => isNull(obj) || isBlank(obj);
/**
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/**
 * @param {unknown} num
 */
const isNum = (num) => !Number.isNaN(Number.parseInt(num, 10));
/**
 * @template T
 * @param {...T} arr
 */
const rmDup = (...arr) => [...new Set(arr.flat(1))];
/**
 * @template T
 * @param {...T} data
 */
const prose = (...data) => (data.every((i) => typeof i === 'string') ? data.join('\n').trim() : '');
//#region Options
class Options extends null {
  static createDefault() {
    const $db = Options.createDB();
    const p = prose;
    /**
     * @type { defaultOptions }
     */
    const _default = {
      settings: {
        enabled: true,
        minTurns: 3 // 10
      },
      cooldown: 10, // 22
      data: {},
      dataQueue: [],
      errors: [],
      generating: false,
      pins: [],
      turnsSpent: 0,
      database: [
        {
          category: [
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
            'Genitalia',
            'Kinks',
            'SexBehavior',
            'Other'
          ],
          instruction: {
            example:
              '[Name: David Red;Gender:male;Personality:confident(underestimates_threats);Quirks/Habits:scratches_neck(thinking),quick_to_smile(hides_emotions); ...]'
          },
          type: 'Characters'
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
            user: '',
            example:
              '[Name: Tokyo, Japan; Location: Japan(country); Setting: Urban_realism; Factions: Political_establishment(LDP_coalition); Threats: demographic_crisis; ...]'
          },
          type: 'Locations'
        },
        {
          instruction: {
            user: '',
            example: ''
          },
          type: 'Retrieve'
        },
        {
          // category: ['History', 'Threats', 'Other'],
          category: ['History'],
          instruction: {
            user: p('', '$2', '$1 = $3'),
            example:
              '[Name: David Red; History: previous_collaboration(successful_operations, built_trust); Threat: class_warfare(corporate_vs_street); ...]'
          },
          type: 'Compress'
        }
      ]
    };
    if (_default.settings.minTurns < 3) {
      _default.settings.minTurns = 3;
    }
    if (_default.cooldown < _default.settings.minTurns) {
      _default.cooldown = _default.settings.minTurns;
    }
    const database = _default.database.map((data) => {
      const db = {
        ...$db,
        ...data
      };
      for (const [key, value] of Object.entries(db)) {
        if (key === 'type') continue;
        if (!(key in $db)) {
          delete db[key];
        } else if (Array.isArray(value)) {
          if (isEqual(value, $db[key])) continue;
          db[key] = rmDup('Name', value);
        } else if (isObj(value)) {
          if (isEqual(value, $db[key])) continue;
          db[key] = {
            ...$db[key],
            ...value
          };
        }
      }
      db.limit.category = db.category.length;

      if (db.type === 'Characters') {
        db.instruction.ai = p(
          '[System: Update PList from "$1" without repetition. Complete partials. Be concise/grounded. Include current context and memory.',
          '',
          'PList Rules:',
          '1. Format: [CAT:TRAIT(DESC)[,...];...] ',
          `2. Priority: ${db.category.join('>')}`,
          '3. Traits:',
          '- Non-Flaws: pos/neutral',
          '- Max 3 nests (trait(sub(sub)))',
          '- No word/synonym repetition',
          '- Snake_case',
          '- Link psych-behavior',
          '4. Genitalia: Virgin per part; non-virgin: partner if known',
          '5. Appearance: Clothing per occasion (e.g., casual, occupation, formal) if known',
          '6. Anti-rep:',
          '- Merge similar traits (Leven<3)',
          '- Remove dupes',
          '- Consolidate each category',
          '- Ensure each category appears',
          '7. Truncation Protocol:',
          '- Complete current CAT/TRAIT/DESC',
          '- Auto-close symbols',
          '- Never break mid-trait',
          '8. Generate in sequence by Priority order',
          '9. Output: PList continuation from exact interruption point',
          'Output Format:',
          db.instruction.example
        );
      } else if (db.type === 'Locations') {
        db.instruction.ai = p(
          '[System: Output plain text. Update PList from "$1" without repetition. Complete partials. Be concise/grounded. Include current context and memory.',
          '',
          'PList Rules:',
          '1. Format: [CAT:TRAIT(DESC)[,...];...] ',
          `2. Priority: ${db.category.join('>')}`,
          '3. Traits:',
          '- Non-Flaws: pos/neutral',
          '- Max 3 nests (trait(sub(sub)))',
          '- No word/synonym repetition',
          '- Snake_case',
          '4. Anti-rep:',
          '- Merge similar traits (Leven<3)',
          '- Remove dupes',
          '- Consolidate each category',
          '- Ensure each category appears',
          // '- Ensure each context-appropriate category appears',
          '5. Truncation Protocol:',
          '- Complete current CAT/TRAIT/DESC',
          '- Auto-close symbols',
          '- Never break mid-trait',
          '6. Exclude all generics/metaphors/unknowns and each irrelevant category along with its traits',
          '7. Generate in sequence by Priority order',
          '8. Output: PList continuation from exact interruption point',
          'Output Format:',
          db.instruction.example
        );
      } else if (db.type === 'Retrieve') {
        db.instruction.ai = p(
          '[System: Extract names from current context and memory without repetition in sequence. Plain text. Be concise/grounded. Output lines:',
          'Characters: name1, name2, ...;',
          'Locations: name1, name2, ...;',
          '- Only plot-relevant explicit character and place names',
          '- 4 entries max per line',
          '- Auto-complete partials (e.g., David => David Red, forge => Frostspire Forge)',
          '- Consolidate each name',
          '- Remove dupes',
          '- Exclude traits, objects, generics, metaphors, synonyms, unknowns, secrets, minutiae, $2',
          ']'
        );
      } else if (db.type === 'Compress') {
        db.instruction.ai = p(
          '[System: Summarize from current context and memory without repetition. Plain text. Be concise/grounded. Output lines:',
          'Name: $1;',
          'History: history1, history2, ...;',
          'Threat: threat1, threat2, ...;',
          '- ADHERE to established fictional world rules without real-world moral imposition',
          '- Only plot-relevant explicit details',
          '- 12 entries max per line',
          '- Max character count of 500',
          '- Never personify',
          '- No word/synonym repetition',
          '- Remove dupes',
          '- Avoid inventing past events to justify lines',
          '- Exclude traits, objects, generics, metaphors, synonyms, unknowns, secrets, minutiae',
          ']'
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
  static createDB() {
    return {
      category: ['Name'],
      instruction: {
        ai: '[System: Resume from exact pre-interruption point.]',
        user: prose('', '$2', '$1 = $3'),
        example: ''
      },
      limit: {
        category: 12,
        card: 800,
        retry: 2
      },
      type: 'Default'
    };
  }
}
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
    if (typeof str === 'string' && isNum(lengthLimit) && lengthLimit < str.length) {
      return str.slice(0, lengthLimit).trim();
    }
    return str;
  }
  /**
   * @template S
   * @param {S} str
   */
  static split(str) {
    return typeof str === 'string' ? str.split(/\f|\t|\n|\r|\v|\0/) : [];
  }
  /**
   * @template S
   * @param {S} str
   */
  static toLowerCase(str) {
    return typeof str === 'string' ? str.toLowerCase().trim() : ' ';
  }
  /**
   * @template T
   * @param {...T} data
   */
  static toNumber(...data) {
    if (data.every((i) => typeof i === 'string')) {
      return data.map((s) => {
        const cp = Words.toCodePoint(Words.toLowerCase(s));
        return isNum(cp) ? cp : parseInt(cp, 16);
        // return Number.isNaN(Number(cp)) ? parseInt(cp, 16) : Number(cp);
      });
    }
    return [];
  }
  /**
   * @template S
   * @param {...S} str
   */
  static joinStrings(...str) {
    return str
      .map((s) => Words.toLowerCase(Words.toCodePoint(s)))
      .filter((s) => !/c|9|a|d|20|b|0/.test(s))
      .map(Words.getUniHex)
      .join('');
  }
  /**
   * @type { { type: string[]; points: string[]; switch(): { type: string[]; points: string[] } } }
   */
  static get data() {
    if (_.wordData) return _.wordData;
    const lb = ['\f', '\t', '\n', '\r', '\x20', '\v', '\0'];
    const cp = class {
      type = lb;
      points = lb.map(Words.toCodePoint);
      switch() {
        if (this.type === lb) {
          this.type = [
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
        } else {
          this.type = lb;
        }
        this.points = this.type.map(Words.toCodePoint);
        return this;
      }
    };
    return (_.wordData = new cp());
  }
}
//#endregion
//#endregion

//#region Console

Error.stackTraceLimit = 20; // 3

class AIDError extends Error {
  /**
   * @param { string } [message]
   * @param { ErrorOptions } [options]
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
   * @param  {...string} messages
   */
  static msg(...messages) {
    const MESSAGES = messages.filter((m) => typeof m === 'string' && !Object.is(state.message, m));
    if (isBlank(MESSAGES)) return;
    state.messageHistory.push(...MESSAGES);
  }
}
//#endregion

const MagicCards = class {
  //#region MC Utilities
  /** @type { { type: string; internal: 5000; card: 1000; } } */
  static get constant() {
    if (_.constant) return _.constant;
    return (_.constant = {
      type: `${Words.getUniHex('1fa84')}🎴`, // 'MC_CARD'
      internal: 5_000,
      card: 1_000
    });
  }
  /**
   * Find and create Story Cards
   * @template { StoryCard & Partial<{ pin: boolean }> } SC
   * @param { Partial<SC> } $StoryCard
   * @param { number } remaining - Number of remaining retries before function times out.
   * @returns { { id: SC["id"] | '-2'; index: number; card: SC | null; error?: AIDError } }
   */
  StoryCard($StoryCard = {}, remaining = 2) {
    if (remaining > 0) {
      remaining -= 1;
      const {
        // keys = '\0',
        keys = '',
        entry = '',
        type = MagicCards.constant.type,
        title = keys,
        description,
        id,
        pin = false
      } = $StoryCard;
      const card = storyCards.find(
        ({ keys: k, entry: e, title: t, type: ty, description: d, id: i }) => {
          return (
            (typeof id === 'string' && i === id) ||
            (typeof description === 'string' && d === description) ||
            (entry === e && type === ty && (keys === k || title === t))
          );
        }
      );
      if (card) {
        if (id) card.id = id;
        if (pin) {
          if (!this.cache.pins.includes(id)) this.cache.pins.push(id);
          storyCards.splice(Math.max(this.cache.pins.indexOf(id), 0), 0, card);
        }
        return { id: card.id, index: storyCards.indexOf(card), card };
      }
      storyCards.push({ id, keys, entry, type, title, description });
      return this.StoryCard($StoryCard, remaining);
    }
    return {
      id: '-2',
      index: -2,
      card: null,
      error: new AIDError(`Failed, "${$StoryCard.title ?? 'StoryCard'}" has timed out.`, {
        cause: 'MagicCards.StoryCard'
      })
    };
  }
  /**
   * @type { ?{ index: number; card: StoryCard | null; error?: AIDError } }
   */
  configCard = null;
  //#endregion
  //#region Constructor
  /**
   * @param { Partial<defaultOptions> } options
   */
  constructor(options = {}) {
    if (!isObj(options)) {
      throw new TypeError('"options" must be a type of JSON Object', {
        cause: 'MagicCards.constructor()'
      });
    }

    //#region Binders
    this.input = this.input.bind(this);
    this.context = this.context.bind(this);
    this.output = this.output.bind(this);
    this.cleanup = this.cleanup.bind(this);
    this.message = this.message.bind(this);
    this.StoryCard = this.StoryCard.bind(this);
    //#endregion

    /** @type {ModifierFN[]} */
    this.modifiers = [];

    const _default = Options.createDefault();
    Object.defineProperty(this, 'cache', { writable: true });
    if (!this.cache && 'MagicCards' in state) {
      /**
       * @type { defaultOptions }
       */
      this.cache = {
        ..._default,
        ...options,
        ...state.MagicCards
      };
    } else {
      this.cache = {
        ..._default,
        ...options
      };
    }
    //#region Init Card
    const getInitCard = (title = 'settings', type = `🔧${title}`) => {
      const TITLE = title;
      const TYPE = type;
      title = TITLE.toUpperCase();
      type = TYPE.toUpperCase();
      const SC = this.StoryCard({ id: title, title, type, pin: true });
      if (!isBlank(SC.card.keys)) SC.card.keys = '\0';
      if (SC.card.type !== type) SC.card.type = type;
      if (SC.card.title !== title) SC.card.title = title;
      /**
       * @type { defaultOptions | defaultOptions['settings'] | dataEntry }
       */
      let opt = Options.copy(this.cache);
      if (/settings/i.test(title)) {
        opt = Options.copy(this.cache.settings);
      } else if (/characters|locations|retrieve|compress/i.test(title)) {
        opt = this.cache.database.find(({ type: t }) => t === TITLE);
        if (!opt) {
          const db = Options.createDB();
          db.type = TITLE;
          opt = db;
        }
      }
      if (this.turn && !isBlank(SC.card.entry)) {
        const reg = /^([\w\s]+):\s?(.*)/gm;
        const $config = {};
        if ('enabled' in opt) {
          for (const [, key, value] of SC.card.entry.matchAll(reg) || []) {
            if (!(key in _default.settings)) continue;
            if (/(true|false)$/im.test(value)) {
              $config[key] = Words.toLowerCase(value) === 'true';
            } else if (isNum(value)) {
              $config[key] = Number(value);
            }
          }
          if (!isEqual($config, this.cache.settings)) {
            this.cache.settings = {
              ...this.cache.settings,
              ...$config
            };
            this.message('Your settings have been updated.');
          }
        } else if ('type' in opt) {
          $config.instruction ??= {};
          for (const [, key, value] of SC.card.entry.matchAll(reg) || []) {
            if (isBlank(value) || !(key in opt)) continue;
            if (key === 'limit' || key === 'category') {
              if (key === 'limit') {
                $config[key] = JSON.parse(value.replaceAll(/([\w\d]+)/g, '"$1"'));
              } else {
                $config[key] = value
                  .split(/,|\[|\]/)
                  .filter((i) => !isBlank(i))
                  .map((i) => i.trim());
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
          // $config.instruction.ai = SC.card.description
          //   .split(new RegExp(`\\[#${SC.card.id}:${title}\\]`))
          //   .join();
          // if (!isEqual($config, opt)) {
          //   this.cache.database = this.cache.database.splice(0, 1, { ...opt, ...$config });
          //   this.message('Your settings have been updated.');
          // }
        }
      }
      let e = '';
      if ('type' in opt) {
        SC.card.description = Words.limit(opt.instruction.ai, 2000);
        for (const [k, v] of Object.entries(opt)) {
          if (/index/.test(k)) continue;
          if (/instruction/.test(k)) {
            for (const [key, value] of Object.entries(v)) {
              if (key === 'ai') continue;
              e += `${key}: ${value};%`;
            }
          } else if (isObj(v)) {
            const val = [];
            for (const [key, value] of Object.entries(v)) {
              val.push(`${key}: ${value}`);
            }
            if (isBlank(val)) continue;
            e += `${k}: {${val.join(', ')}};%`;
          } else if (Array.isArray(v) && !isBlank(v)) {
            const s = v.slice(1).join(', ');
            if (isBlank(s)) continue;
            e += `${k}: [${s}];%`;
          } else {
            e += `${k}: ${v};%`;
          }
        }
      } else {
        for (const [k, v] of Object.entries(opt)) {
          if (isObj(v)) {
            const val = [];
            for (const [key, value] of Object.entries(v)) {
              val.push(`${key}: ${value}`);
            }
            if (isBlank(val)) continue;
            e += `${k}: {${val.join(', ')}};%`;
          } else if (Array.isArray(v) && !isBlank(v)) {
            e += `${k}: [${v.join(', ')}];%`;
          } else {
            e += `${k}: ${v};%`;
          }
        }
      }
      SC.card.entry = Words.limit(e.split(';%').join('\n').trim(), 2000);
      if ('enabled' in opt) {
        this.configCard = SC;
      } else if ('type' in opt) {
        SC.card.entry = Words.limit(prose('[READ-ONLY]', SC.card.entry), 2000);
        SC.card.description = Words.limit(prose('[READ-ONLY]', SC.card.description), 2000);
      }
      return SC;
    };
    getInitCard();

    // for (const db of this.cache.database) {
    //   if (/default/i.test(db.type)) continue;
    //   getInitCard(db.type);
    // }
    //#endregion
    this.cache ??= _default;
    if (!('settings' in this.cache)) {
      this.cache = _default;
      this.cache.errors.push('Invalid config: restoring...');
    }
    if (this.cache.settings.minTurns < 3) {
      this.cache.settings.minTurns = 3;
      this.cache.errors.push('Invalid minTurns: must be greater than 3, restoring...');
    }
    if (this.cache.cooldown < this.cache.settings.minTurns) {
      this.cache.cooldown = this.cache.settings.minTurns;
      this.cache.errors.push('Invalid cooldown: must be <= minTurns, restoring...');
    }
  }
  //#endregion
  //#region Modifiers
  /**
   * @template {ModifierFN} F
   * @param {F} [fn]
   */
  static isModifier(fn) {
    return typeof fn === 'function' && !Object.is(fn.toString(), globalThis.modifier.toString());
  }
  /**
   * @template { string | ModifierFN } Code
   * @param { Code } code
   * @param { boolean } [useEval]
   * @returns { ?ModifierFN }
   */
  static Func(code, useEval) {
    try {
      if (!(typeof code === 'string' || typeof code === 'function'))
        throw new TypeError('"code" must be a type of string or function', {
          cause: 'MagicCards.Func()'
        });
      if (typeof code === 'string') {
        const parse = code.startsWith('return ') ? code : `return ${code}`;
        if (useEval) return eval(`(() => { ${parse} })()`);
        // @ts-expect-error For AID
        return new Object.constructor(parse)();
      }
      return code;
    } catch (e) {
      con.log(e instanceof AIDError ? e : new AIDError(e, { cause: 'MagicCards.Func()' }));
      return null;
    }
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
        throw new TypeError('Unsupported, "val" is a type of Promise.', {
          cause: 'MagicCards.text'
        });
      } else if (typeof val === 'function') {
        if (/(auto|smart)cards?/i.test(val.name)) {
          throw new TypeError(`"${val.name}" is not supported`, {
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
      throw new TypeError(`"str" must be a type of string, got "${objToStr(TEXT)}"`, {
        cause: 'MagicCards.text'
      });
    }
    if (typeof text !== 'undefined') {
      if (!Object.is(text, TEXT) && (typeof TEXT === 'string' || isNull(TEXT))) text = TEXT;
    }

    return this;
  }

  get text() {
    return typeof globalThis.text !== 'undefined' ? text : ' ';
  }
  set text(str) {
    if (typeof globalThis.text !== 'undefined') text = str;
  }
  /** @type { typeof stop } */
  get stop() {
    return typeof globalThis.stop !== 'undefined' ? stop : typeof globalThis.text !== 'string';
  }
  set stop(bol) {
    if (typeof globalThis.stop !== 'undefined' && typeof bol === 'boolean') {
      if (!Object.is(stop, bol)) {
        stop = bol;
        if (Object.is(bol, true) && typeof this.text === 'string') this.text = null;
      }
    }
  }
  //#endregion
  get turn() {
    if (typeof globalThis.info !== 'undefined' && isNum(info.actionCount)) {
      return Math.abs(info.actionCount);
    }
    return 0;
  }
  get history() {
    const s = this.turn - this.cache.cooldown;
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
  get database() {
    const t = this.cache.data?.type || 'Default';
    const db = this.cache.database;
    return db.find(({ type }) => type === t) ?? Options.createDB();
  }
  /**
   * @template S
   * @param  {...S} messages
   */
  message(...messages) {
    for (const m of messages) {
      if (typeof m === 'string') {
        con.msg(`🎴 MagicCards 🢂 ${m}`);
      } else if (isObj(m) && 'emoji' in m) {
        con.msg(`${m.emoji} MagicCards 🢂 ${m.text}`);
      }
    }
    return this;
  }
  /**
   * @param {StoryCard} card
   */
  editor(card) {
    /** @type { MagicId } */
    const obj = card.id.startsWith('{') && card.id.endsWith('}') ? JSON.parse(card.id) : {};
    obj.data ??= this.cache.data;
    obj.cooldown ??= this.cache.cooldown;
    if (!obj.summary) obj.summary = [];
    // obj.summary ??= [];
    return {
      card: obj,
      save() {
        if (card.id.startsWith('{') && card.id.endsWith('}')) {
          card.id = JSON.stringify(obj);
        }
        return card;
      }
    };
  }
  refresh() {
    const cache = this.cache;
    const $db = Options.createDB();
    const database = cache.database.map((data) => {
      const db = {
        ...$db,
        ...data
      };
      for (const [key, value] of Object.entries(db)) {
        if (key === 'type') continue;
        if (!(key in $db)) {
          delete db[key];
        } else if (Array.isArray(value)) {
          if (isEqual(value, $db[key])) continue;
          db[key] = rmDup('Name', value);
        } else if (isObj(value)) {
          if (isEqual(value, $db[key])) continue;
          db[key] = {
            ...$db[key],
            ...value
          };
        } else if (!Object.is(value, $db[key])) {
          db[key] = $db[key];
        }
      }
      db.limit.category = db.category.length;
      return db;
    });
    cache.database = rmDup(database);
    cache.cooldown = OPTIONS.cooldown ?? Options.createDefault().cooldown;
    cache.generating = !(isEmpty(cache.dataQueue) && isEmpty(cache.data));
    return this;
  }
  save() {
    const defaultOptions = Options.createDefault();
    const config = Options.copy(this.cache);
    if (config !== defaultOptions) {
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
    if (this.cache && !this.cache.generating) {
      const { points } = Words.data.switch();
      rmDup(this.modifiers).forEach((modifier) => {
        const fn = MagicCards.Func(modifier);
        if (fn) {
          const $fn = [...fn.toString()]
            .map(Words.toCodePoint)
            .filter((f) => !points.includes(f))
            .map(Words.getUniHex)
            .join('')
            .trim();
          if (!/(function\s*)?text(\s*=>)?\s*return\s*text/.test($fn) && MagicCards.isModifier(fn))
            this.setText(fn);
        }
      });
    }
    this.save();
    if (!isBlank(state.messageHistory)) {
      const message = rmDup(state.messageHistory).join('\n——————————————————————————\n');
      console.log(message);
      state.message = message;
      state.messageHistory = [];
    }
    const { text, stop } = this;
    return { text, stop };
  }
  print(message = '', emoji = '🎴', name = this.cache.data.name) {
    const data = this.cache.data;
    if (!isEmpty(data)) {
      return `\n- ${emoji} ◖${isEmpty(name) ? 'MagicCards' : name}◗ 🢂 ${message}\n`;
    }
    return `\n- ${emoji} 🢂 ${message}\n`;
  }
  /**
   * @param {Partial<dataQueue>} data
   */
  queue(data = {}) {
    data.type ??= 'Characters';
    const db = this.cache.database.find(({ type }) => data.type === type) ?? Options.createDB();
    const resp = {
      name: '',
      entry: '',
      output: '',
      progress: 0,
      ...db,
      ...data
    };
    for (let e of [resp.name, resp.entry].filter((i) => !isEmpty(i))) {
      if (typeof e === 'string')
        e = Words.split(e.trim())
          .join(' ')
          .replaceAll(/[^\w\s]+/g, '');
    }
    resp.name = resp.name.trim();
    resp.entry = resp.entry.trim();
    return resp;
  }
  getCardId(TITLE) {
    // const i = Words.toLowerCase(TITLE).split(/\W/).join('').trim();
    const i = Words.toLowerCase(TITLE).trim();
    const r = new RegExp(RegExp.escape(i), 'i');
    const card = storyCards.find(({ id }) => {
      try {
        if (typeof id === 'string') {
          if (id.startsWith('{') && id.endsWith('}')) {
            const j = JSON.parse(id);
            return r.test(j.id);
          }
          return id === i;
        }
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
  }
  /**
   * @param { Partial<StoryCard & { magicId: MagicId }> } $StoryCard
   */
  createCard($StoryCard = {}) {
    const {
      keys = '\0',
      entry = '',
      type = MagicCards.constant.type,
      title = keys,
      description
    } = $StoryCard;
    const { index, card, id } = this.getCardId(title);
    if (card) {
      return {
        id,
        index,
        card
      };
    }
    const toKeys = () => {
      const key = title.split(/\x20|_/)[0];
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
    $StoryCard.magicId ??= { id };
    const SC = this.StoryCard({
      id: JSON.stringify($StoryCard.magicId),
      // id,
      keys: toKeys(),
      entry,
      type,
      title,
      description
    });
    if (!isNull(SC.error)) throw SC.error;
    return SC;
  }
  /**
   * @param { { text: string }[] } arr
   * @param { boolean } [isOutput=false]
   */
  getPList(arr = [], isOutput = false) {
    /**
     * @type { { [key: PropertyKey]: string; } }
     */
    const mapper = {};
    const cache = this.cache;
    const data = cache.data || {};
    const reg = /([\w\s]+):\s?([^;\]]+)(;|\])/g;
    // const reg = /([\w\s]+):\s?([\w\-_()\s,/]+)(;|\])/g;
    let extra = '';
    let list = '';
    let complete = false;
    let categoryLimit = data.limit.category;

    for (const { text } of [
      ...this.history.map(({ text }) => {
        return { text };
      }),
      ...arr
    ].filter(({ text }) => !isEmpty(text))) {
      for (const [, key, value, endof] of text.matchAll(reg) || []) {
        const k = key.trim();
        const v = value.trim();
        if (endof === ']') {
          complete = true;
          break;
        }
        if (data.category.includes(k) && !(k in mapper)) {
          mapper[k] = v;
          list += `${k}:${v};`;
        }
      }
    }
    if (typeof mapper.name === 'string' && typeof data.name === 'string') {
      const n = mapper.name.split('_').join(' ');
      const d = data.name.split('_').join(' ');
      if (Words.toLowerCase(n) !== Words.toLowerCase(d)) {
        data.name = n;
      }
    }
    const progress = () => +((Object.keys(mapper).length / categoryLimit) * 100).toFixed(2);
    if (!complete) {
      if (isOutput && Object.is(progress(), data.progress)) {
        if (data.limit.retry > 0) {
          data.limit.retry -= 1;
        } else {
          categoryLimit = Object.keys(mapper).length;
        }
        extra = ` ↺ = ${data.limit.retry}`;
      }
      complete = data.category.filter((cat) => mapper[cat]).length >= categoryLimit;
    }
    const raw = list;
    list = Words.split(list).join().trim();
    list = complete && !isBlank(list) ? `[${list}]` : `[${list}`;
    const minimize = (str = '') => {
      const arr = [...data.category].reverse();
      while (str.length > data.limit.card) {
        // /(([\w\s]+):\s?[\w\s\-_()'",/]+(;|\])\s?)$/g
        // new RegExp(`(${arr.shift()}):\\s?[\\w\\-_()\\s,/]+(;|\\])`, 'g')
        const r = new RegExp(`(${arr.shift()}):\\s?[^;\\]]+(;|\\])`, 'g');
        str = str.replaceAll(r, '');
      }
      return str;
    };
    list = (complete ? minimize(`${list}`) : list).replace(/;\]/, ']');
    data.progress = complete ? 100 : progress();
    return {
      complete,
      list,
      raw,
      extra,
      mapper
    };
  }
  /**
   * @param {string} str
   */
  plist(str = '') {
    /**
     * @type { { [key: string]: string; } }
     */
    const obj = {};
    for (const [, key, value, endof] of str.matchAll(/([\w\s]+):\s?([^;\]]+)(;|\])/g) || []) {
      const k = key.trim();
      const v = value.trim();
      if (!(k in obj)) {
        obj[k] = v;
      }
      if (/\]/.test(endof ?? '')) {
        break;
      }
    }
    const minimize = (a = []) => {
      const j = `[${a.join(';')}]`;
      if (j.length > 2_000) {
        a.shift();
        return minimize(a);
      }
      return j.replace(/;\]/, ']').trim();
    };
    return {
      list: obj,
      toString() {
        return minimize([...Object.entries(obj)].map(([k, v]) => `${k}: ${v}`));
      }
    };
  }
  //#region Hooks
  input() {
    const cache = this.cache;
    if (!this.turn || !cache.settings.enabled) return this;
    const t = this.text.trim();
    if (
      /^(<system>|\[system:)/i.test(t) ||
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
    for (const [, cmd, name = '', entry = ''] of t.matchAll(
      /(\/[am\s]+c)\s+([^"'/;]+);?([^;/]+)?/gi
    ) || []) {
      const data = this.queue({ name, entry });
      if (isBlank(data.name)) continue;
      data.name = data.name.trim();
      data.entry = data.entry.trim();
      const r = new RegExp(RegExp.escape(data.name.split(/\x20|_/)[0]), 'i');
      const messages = [];
      let emoji = '🎴';
      const inQueue =
        queues.some((dq) => r.test(dq.name)) || cache.dataQueue.some((dq) => r.test(dq.name));
      if (inQueue) {
        emoji = '⚠️';
        messages.push('Already in queue');
      } else {
        if (this.turn + 1 >= cache.settings.minTurns) {
          const { card } = this.getCardId(data.name);
          if (isNull(card)) {
            messages.push('Preparing...');
          } else {
            messages.push('Updating...');
            // data.entry = `Override and update plot-relevant CAT/TRAIT/DESC.\n${data.entry}`;
          }
          // cache.generating = !(isBlank(cache.dataQueue) && isBlank(cache.data));
          if (cache.generating === false) cache.generating = !cache.generating;
        } else {
          cache.cooldown = cache.settings.minTurns;
          emoji = '⚠️';
          messages.push(
            `(Not enough story) Generating in ${Math.abs(this.turn - cache.cooldown - 1)} turns`
          );
        }
        cache.dataQueue.push(data);
      }
      queues.push({
        name: data.name,
        cmd: cmd.toUpperCase(),
        emoji,
        message: messages.join(' 🢂 ')
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
      TEXT = `${dq.emoji} ${dq.cmd} ${names.join(' ')} 🢂 ${dq.message}`;
    } else {
      TEXT = queues
        .map(({ emoji, cmd, name, message }) => `${emoji} ${cmd} ◖${name}◗ 🢂 ${message}`)
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
    if (cache.disabled || !this.turn || !cache.settings.enabled) return this;
    /* Change World Lore, Recent Story, Story Summary into World_Lore, Recent_Story, Story_Summary */
    {
      const mcReg = /(\n-\s)?(🎴|⚠️)(\s\/)?/g;
      const rsReg = /(World Lore|Recent Story|Story Summary):\s?/g;
      const $t = Words.split(this.text)
        .filter((i) => !mcReg.test(i))
        .map((i) => {
          return rsReg.test(i) ? i.split(' ').join('_') : i;
        })
        .join('\n');
      if (!isBlank($t)) this.text = $t;
    }

    let entries = [];
    /** @type {StoryCard[]} */
    const cards = Array.from(this);
    for (const sc of cards) {
      const { card, save } = this.editor(sc);
      if (sc.entry && !isBlank(card.summary)) {
        const pl = this.plist(sc.entry);
        if ('Name' in pl.list) {
          const n = pl.list.Name.split(/ |_/).join('|');
          const reg = new RegExp(n, 'g');
          if (reg.test(this.text)) {
            pl.list.History ??= '';
            for (const s of card.summary) {
              if (isBlank(pl.list.History)) {
                pl.list.History = s.History;
              } else {
                pl.list.History += `,${s.History}`;
              }
            }
            pl.list.History = Words.limit(
              pl.list.History,
              Math.abs(1_000 - (cache.data?.limit?.card ?? 800))
            );
            const entryReg = new RegExp(RegExp.escape(sc.entry), 'g');
            this.text = this.text.replaceAll(entryReg, pl.toString());
          }
        }
      }
      if (card.cooldown === 0) {
        const data = this.queue({
          name: card.id.trim(),
          entry: sc.entry,
          type: 'Compress'
        });
        if (!cache.dataQueue.includes(data)) {
          cache.dataQueue.push(data);
          card.cooldown = cache.cooldown;
          save();
        }
      } else {
        entries.push(card.id.trim());
      }
    }
    entries = rmDup(entries.filter((i) => !isEmpty(i)));

    cache.generating = !(isEmpty(cache.dataQueue) && isEmpty(cache.data));

    if (cache.generating === false && this.turn > 0) {
      const cd = (this.turn % cache.cooldown) - cache.turnsSpent;
      if (cd === 0) {
        cache.generating = !(isEmpty(cache.dataQueue) && isEmpty(cache.data));
      } else if (cd + 1 === cache.cooldown) {
        if (isEmpty(cache.data.name)) {
          /* We do not specify a `name` */
          const data = this.queue({
            entry: entries.join(','),
            type: 'Retrieve'
          });
          if (!cache.dataQueue.includes(data)) cache.dataQueue.push(data);
        }

        this.message('Executing on the next turn...');
      }
    }
    if (cache.generating) {
      cache.turnsSpent += 1;
      if (!cache.data.name && !isBlank(cache.dataQueue)) cache.data = cache.dataQueue.shift() || {};
      const data = cache.data || {};
      const { complete, list } = this.getPList([{ text: data.output }]);
      const parts = {
        $1: data.name,
        $2: data.entry,
        $3: list
      };
      let INT = `${data.instruction.ai}\n${data.instruction.user}`;
      if (!('instruction' in data))
        INT = `${this.database.instruction.ai}\n${this.database.instruction.user}`;
      INT = INT.split('\\n')
        .join('\n')
        .replaceAll(/(\$\d+)/g, (_) => parts[_] ?? _);

      if (!complete) {
        let TEXT = '';
        const History = [...this.history].reverse();
        const num = (info.maxChars ?? 2_000) - INT.length;
        while (TEXT.length <= num) {
          const h = History.shift();
          if (!h) break;
          TEXT += h.text;
        }
        if (!isBlank(TEXT))
          this.text = this.text.replace(/Recent_Story:\s*([\s\S]*?)$/i, `Recent_Story:\n${TEXT}`);
      }

      this.text += INT;
      // con.log(INT);
    }

    return this;
  }
  output() {
    if (this.turn === 2) {
      this.message('Install complete!');
    } else if (!this.turn) {
      this.message('Installing...');
    }
    const cache = this.cache;
    while (cache.errors.length > 0) {
      const text = cache.errors.shift();
      if (!text) break;
      this.message({ emoji: '⚠️', text });
    }
    if (cache.disabled) {
      delete cache.disabled;
      return this;
    }
    if (!this.turn || !cache.settings.enabled) return this;

    // if (!isBlank(cache.data)) con.log(cache.data, cache.dataQueue, this.text);

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
        if (num === 100) {
          TEXT += `\n- Summarize in ${cache.cooldown} turns`;
        }
        if (isEmpty(upNext)) {
          TEXT += `${endof}\n[System: Resume from exact pre-interruption point.]`;
        } else if (
          !isEmpty(upNext) &&
          !isEmpty(upNext.name) &&
          !Object.is(upNext.name, cache.data.name)
        ) {
          TEXT += `\n- Up Next: 🎴${upNext.name}${endof}`;
        } else {
          TEXT += endof;
        }
        return TEXT;
      };
      // Characters|Locations
      if (isEmpty(cache.data.name) || /Retrieve/.test(cache.data.type)) {
        const t = this.text.trim();
        if (/Retrieve/.test(cache.data.type)) {
          this.text = this.print('Checking for new entries...', '🎴', 'MagicCards');
          // /(Characters|Locations):\s?(.*);/g
          for (const [, type, entries] of t.matchAll(/(Characters):\s?(.*);/g) || []) {
            for (const name of entries.split(',')) {
              if (/none|n\/a|unknown|not\s?found/i.test(name)) continue;
              if (!/[A-Z]/.test(name)) continue;
              const scExists = Array.from(this).some((sc) => {
                const { card } = this.editor(sc);
                return new RegExp(RegExp.escape(card.id.trim()), 'i').test(name.trim());
              });
              if (scExists) continue;
              const data = this.queue({ name, type });
              const r = new RegExp(RegExp.escape(data.name.split(/\x20|_/).join('|')), 'i');
              if (cache.dataQueue.some((dq) => r.test(dq.name.trim()))) continue;
              const { card } = this.getCardId(data.name);
              if (isNull(card)) cache.dataQueue.push(data);
            }
          }
        }
        if (!isBlank(cache.dataQueue)) {
          this.text = this.print(
            `Adding ${cache.dataQueue.map(({ name }) => `◖${name}◗`).join(' ')} to queue...`
          );
        }
        cache.data = cache.dataQueue.shift() || {};
        this.refresh();
      } else {
        const { complete, list, extra, mapper } = this.getPList(
          [{ text: cache.data.output }, { text: this.text }],
          true
        );
        con.log('list', list);

        if (complete) {
          if (/Compress/.test(cache.data.type)) {
            const { card } = this.getCardId(mapper.Name);
            if (!isNull(card) && !isEmpty(mapper)) {
              const c = this.editor(card);
              c.card.summary.push({ History: mapper.History });
              c.card.summary = rmDup(c.card.summary);
              c.save();
              card.description = Words.limit(
                `History: ${c.card.summary.map(({ History }) => History).join(',')}`,
                2_000
              );
            }
          } else {
            const obj = {
              id: cache.data.name,
              cooldown: cache.cooldown,
              summary: []
            };
            this.createCard({
              magicId: obj,
              title: cache.data.name,
              entry: list
            });
          }
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
          cache.data.output += list;
          const t = /Compress/.test(cache.data.type) ? 'Compressing...' : 'Generating...';
          this.message(t);
          this.text = this.print(`${t} ${extra}${progressBar()}`);
        }
      }
    } else {
      const reg = /(\n-\s)?(🎴|⚠️)(\s\/)?/g;
      history = history.filter(({ text }) => !reg.test(text));
      for (const sc of Array.from(this)) {
        const { card, save } = this.editor(sc);
        card.cooldown--;
        if (card.cooldown === 0) {
          this.message(`Compressing ${sc.title} on the next turn...`);
        }
        save();
      }
    }

    return this;
  }
  //#endregion
  *[Symbol.iterator]() {
    const t = MagicCards.constant.type;
    for (const sc of storyCards.filter(({ type }) => type === t)) {
      yield sc;
    }
  }
};
const mc = new MagicCards(OPTIONS);
/**
 * Ensures `modifier` function exists & prevent it from being `undefined`
 *
 * _This will ALWAYS be the last function executed!_
 */
const modifier = () => mc.cleanup();
// @ts-expect-error For AID
globalThis.modifier = modifier;
/**
 * @param  {...ModifierFN} modifiers
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const input = (...modifiers) => {
  mc.modifiers.push(...modifiers);
  return mc.input();
};
/**
 * @param  {...ModifierFN} modifiers
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const context = (...modifiers) => {
  mc.modifiers.push(...modifiers);
  return mc.context();
};
/**
 * @param  {...ModifierFN} modifiers
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const output = (...modifiers) => {
  mc.modifiers.push(...modifiers);
  return mc.output();
};
//#endregion
