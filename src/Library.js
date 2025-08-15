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

/** For MagicCards */
globalThis.mcState ??= {};
/** For Console */
globalThis.state ??= {};
state.messageHistory ??= [];

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
        minTurns: 1 // 10
      },
      cooldown: 10, // 22
      createdCards: [],
      data: {},
      dataQueue: [],
      generating: false,
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
              '[Name: Tokyo, Japan;Location:Japan(country);Setting:Urban_realism(techno-traditional);Factions:Political_establishment(LDP_coalition),youth_culture_innovators;Threats:demographic_crisis(29%_seniors_vs._low_birth_rate); ...]'
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
          category: ['History', 'Threats', 'Other'],
          instruction: {
            user: '',
            example:
              '[Name: David Red; History: previous collaboration(successful operations, built trust); Threats: class warfare(corporate vs street); ...]'
          },
          type: 'Compress'
        }
      ]
    };
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
          '[System: Update PList from "$1" without repetition. Complete partials. Be concise/grounded.',
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
          '- Ensure each context-appropriate category appears',
          '5. Truncation Protocol:',
          '- Complete current CAT/TRAIT/DESC',
          '- Auto-close symbols',
          '- Never break mid-trait',
          '6. Generate in sequence by Priority order',
          '7. Exclude all generics/metaphors/unknowns and each irrelevant category along with its traits',
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
          '- Auto-complete partials (e.g., David => David Red, forge => Frostspire Forge)',
          '- Consolidate each name',
          '- Remove dupes',
          '- Exclude objects, generics, metaphors, synonyms, unknowns, secrets, $2',
          '- 4 max per line',
          ']'
        );
      } else if (db.type === 'Compress') {
        // db.instruction.ai = p(
        //   '[System: Update PList from "$1" without repetition. Complete partials. Be concise/grounded. Include current context and memory.',
        //   '',
        //   'PList Rules:',
        //   '1. Format: [CAT:TRAIT(DESC)[,...];...] ',
        //   `2. Priority: ${db.category.join('>')}`,
        //   '3. Traits:',
        //   '- Max 3 nests (trait(sub(sub)))',
        //   '- No word/synonym repetition',
        //   '- Snake_case',
        //   '4. Anti-rep:',
        //   '- Merge similar traits (Leven<3)',
        //   '- Remove dupes',
        //   '- Consolidate each category',
        //   '- Ensure each context-appropriate category appears',
        //   '5. Truncation Protocol:',
        //   '- Complete current CAT/TRAIT/DESC',
        //   '- Auto-close symbols',
        //   '- Never break mid-trait',
        //   '6. Generate in sequence by Priority order',
        //   '7. Exclude all objects/generics/metaphors/synonyms/unknowns and each irrelevant category along with its traits',
        //   '8. Output: Entire PList',
        //   'Output Format:',
        //   db.instruction.example
        // );
        db.instruction.ai = p([
          '[System: Summarize events from current context and memory without repetition. Plain text. Be concise/grounded. Output name and lines:',
          'Name: $1;',
          'History: history1, history2, ...;',
          'Threat: threat1, threat2, ...;',
          'Other: other1, other2, ....;',
          '- ADHERE to established fictional world rules without real-world moral imposition',
          '- Only plot-relevant explicit details',
          '- Remove dupes',
          "- Include $1's name",
          "- Exclude $1's traits, objects, generics, metaphors, synonyms, unknowns, secrets",
          '- Never exceed character count of 500',
          '- 12 max per line',
          ']'
        ]);
      }
      return db;
    });
    _default.database = rmDup($db, database);
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
    if (globalThis.mcState.wordData) return globalThis.mcState.wordData;
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
    return (globalThis.mcState.wordData = new cp());
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
  /**
   * Find and create Story Cards
   * @template { StoryCard & Partial<{ pin: boolean }> } SC
   * @param { Partial<SC> } $StoryCard
   * @param { number } remaining - Number of remaining retries before function times out.
   * @returns { { id: SC["id"] | '-2'; index: number; card: SC | null; error?: AIDError } }
   */
  static StoryCard($StoryCard = {}, remaining = 2) {
    if (remaining > 0) {
      remaining -= 1;
      const {
        keys = '\0',
        entry = '',
        type = 'MC_CARD',
        title = keys,
        description,
        id,
        pin = false
      } = $StoryCard;
      /* Find Story Card based `keys`, `entry`, `type` */
      const card = storyCards.find(
        ({ keys: k, entry: e, title: t, type: ty, description: d, id: i }) => {
          if (
            (typeof id === 'string' && `${i}` === `${id}`) ||
            (typeof description === 'string' && d === description)
          )
            return true;
          return e === entry && ty === type && (k === keys || t === title);
        }
      );
      /* If `card` exists, return { id, index, card } */
      if (card) {
        if (id) {
          if (typeof id === 'object') {
            card.id = JSON.stringify(id);
          } else {
            card.id = `${id}`;
          }
        }
        if (pin) storyCards.splice(0, 0, card);
        return { id: card.id, index: storyCards.indexOf(card), card };
      }
      /* Otherwise, call `addStoryCard()` function and loop */
      addStoryCard(keys, entry, type, title, description);
      return MagicCards.StoryCard($StoryCard, remaining);
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
  static get cardId() {
    return {
      internal: 5_000,
      card: 1_000
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
    const getInitCard = (title = 'settings', type = 'mc_config') => {
      const TITLE = title;
      const TYPE = type;
      title = TITLE.toUpperCase();
      type = TYPE.toUpperCase();
      const SC = MagicCards.StoryCard({ id: title, title, type });
      if (!isBlank(SC.card.keys)) SC.card.keys = '\0';
      if (SC.card.type !== type) SC.card.type = type;
      if (SC.card.title !== `🔧 ${title}`) SC.card.title = `🔧 ${title}`;
      /**
       * @type { defaultOptions | defaultOptions['settings'] | dataEntry }
       */
      let opt = Options.copy(this.cache);
      let arrIndex = -2;
      if (/settings/i.test(title)) {
        opt = Options.copy(this.cache.settings);
      } else if (/characters|locations|retrieve|compress/i.test(title)) {
        opt = this.cache.database.find(({ type: t }) => t === TITLE);
        if (!opt) {
          const db = Options.createDB();
          db.type = TITLE;
          opt = db;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        arrIndex = this.cache.database.indexOf(opt);
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
            con.msg('Your settings have been updated.');
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
          $config.instruction.ai = SC.card.description
            .split(new RegExp(`\\[#${SC.card.id}:${title}\\]`))
            .join();
          // if (!isEqual($config, opt)) {
          //   this.cache.database = this.cache.database.splice(arrIndex, 1, { ...opt, ...$config });
          //   con.msg('Your settings have been updated.');
          // }
        }
      }
      let e = '';
      if ('type' in opt) {
        // SC.card.description = Words.limit(
        //   [`[#${SC.card.id}:${title}]`, opt.instruction.ai].join('\n'),
        //   2000
        // );
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
      }
      return SC;
    };
    getInitCard();

    for (const db of this.cache.database) {
      if (/default/i.test(db.type)) continue;
      getInitCard(db.type);
    }
    //#endregion
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
  //#endregion
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
   * @param {StoryCard} card
   */
  getEditor(card) {
    /** @type { { id: string; data: { name: string; entry: string; }; cooldown: number; summary: { entry: string; turn: number; }[] } } */
    const obj = card.id.startsWith('{') && card.id.endsWith('}') ? JSON.parse(card.id) : {};
    obj.data ??= this.cache.data;
    obj.cooldown ??= this.cache.cooldown;
    obj.summary ??= [];
    return {
      card: obj,
      save() {
        if (card.id.startsWith('{') && card.id.endsWith('}')) card.id = JSON.stringify(obj);
        return card;
      }
    };
  }
  refresh() {
    const cache = this.cache;
    const optDB =
      ('database' in OPTIONS && Array.isArray(OPTIONS.database) ? OPTIONS.database : []).find(
        ({ type }) => type === 'Default'
      ) || {};
    const $db = {
      ...Options.createDB(),
      ...optDB
    };
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
    cache.database = rmDup(database, $db);
    cache.cooldown = OPTIONS.cooldown ?? Options.createDefault().cooldown;
    cache.generating = !(isBlank(cache.dataQueue) && isBlank(cache.data));
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
      // this.cacheCard.id = JSON.stringify(config);
      state.MagicCards = config;
    }
    return config;
  }
  cleanup() {
    if (!this.cache.generating) {
      const { points } = Words.data.switch();
      this.modifiers = rmDup(this.modifiers);
      this.modifiers.forEach((modifier) => {
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
      retries: db.limit.retry,
      progress: 0,
      ...db,
      ...data
    };
    for (let e of [resp.name, resp.entry]) {
      if (typeof e === 'string') e = e.trim().replaceAll(/[^\w\s]+/g, '');
    }
    return resp;
  }
  getCardId(TITLE) {
    const i = Words.toLowerCase(TITLE).split(/\W/).join('').trim();
    const r = new RegExp(i, 'i');
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
    // const key = TITLE.split(/\x20|_/)[0] || TITLE;
    // /**
    //  * @type {number}
    //  */
    // let id = MagicCards.cardId[intId];
    // for (const n of Words.toNumber(...Words.toLowerCase(key))) {
    //   id += n;
    // }
    // if (id !== MagicCards.cardId[intId]) {
    //   const reg = new RegExp(`#${id}|${key}`, 'i');
    //   const card = storyCards.find(({ id: i, keys }) => {
    //     return Number(i) === id || (typeof keys === 'string' && !isBlank(keys) && reg.test(keys));
    //   });
    //   if (card)
    //     return {
    //       id,
    //       index: storyCards.indexOf(card),
    //       card
    //     };
    // }
    return {
      id: TITLE,
      index: -2,
      card: null
    };
  }
  /**
   * @param { Partial<StoryCard> } $StoryCard
   */
  createCard($StoryCard = {}, intId = 'card') {
    const { keys = '\0', entry = '', type = 'MC_CARD', title = keys, description } = $StoryCard;
    const { index, card, id } = this.getCardId(title);
    if (card) {
      return {
        id: `${id}`,
        index,
        card
      };
    }
    if (!this.cache.createdCards.includes(id)) {
      this.cache.createdCards.push(id);
      const toKeys = () => {
        if (intId !== 'card') return keys;
        const key = title.split(/\x20|_/)[0] || title;
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
      const SC = MagicCards.StoryCard({
        id: JSON.stringify({ id }),
        keys: toKeys(),
        entry,
        type,
        title: `🎴 ${title}`,
        description
      });
      if (!isNull(SC.error)) throw SC.error;
      // SC.card.description = Words.limit(`[#${id}:${title}]`, 2000);
      return SC;
    }
    return {
      id: `${id}`,
      index: -2,
      card: null
    };
  }
  /**
   * @param { { text: string }[] } arr
   * @param { boolean } [isOutput=false]
   */
  getPList(arr = [], isOutput = false) {
    /**
     * @type { { [key: string]: string; } }
     */
    const mapper = {};
    const reg = /([\w\s]+):\s?([\w\-_()\s,/]+)(;|\])/g;
    const cache = this.cache;
    let extra = '';
    let list = '';
    let complete = false;
    let categoryLimit = cache.data.limit.category;

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
          complete = !complete;
          break;
        }
        if (cache.data.category.includes(k) && !(k in mapper)) {
          mapper[k] = v;
          list += `${k}:${v};`;
        }
      }
    }
    if (typeof mapper.name === 'string' && typeof cache.data.name === 'string') {
      const n = mapper.name.split('_').join(' ');
      const d = cache.data.name.split('_').join(' ');
      if (Words.toLowerCase(n) !== Words.toLowerCase(d)) {
        cache.data.name = n;
      }
    }
    const progress = () => +((Object.keys(mapper).length / categoryLimit) * 100).toFixed(2);
    if (!complete) {
      if (isOutput && Object.is(progress(), cache.data.progress)) {
        if (cache.data.retries > 0) {
          cache.data.retries -= 1;
        } else {
          categoryLimit = Object.keys(mapper).length;
        }
        extra = ` ↺ = ${cache.data.retries}`;
      }
      complete = cache.data.category.filter((cat) => mapper[cat]).length >= categoryLimit;
    }
    const raw = list;
    list = Words.split(list).join().trim();
    list = complete ? `[${list}]` : `[${list}`;
    const minimize = (str = '', arr = [...cache.data.category].reverse()) => {
      while (str.length > cache.data.limit.card) {
        str = str.replaceAll(new RegExp(`(${arr.shift()}):\\s?[\\w\\-_()\\s,/]+(;|\\])`, 'g'), '');
      }
      return str;
    };
    list = (complete ? minimize(`${list}`) : list).replace(/;\]/, ']');
    cache.data.progress = complete ? 100 : progress();
    return {
      complete,
      list,
      raw,
      extra,
      mapper
    };
  }
  //#region Hooks
  input() {
    const cache = this.cache;
    if (!this.turn || !cache.settings.enabled) return this;
    /**
     * @type { { name: string; entry: string; output: string; retries: number; progress: number; cmd: string; emoji: string; message: string; }[] }
     */
    const queues = [];
    const reg = /(\/[am\s]+c)\s+([^"'/;]+);?([^;/]+)?/gi;
    for (const [, cmd, name = '', entry = ''] of this.text.matchAll(reg) || []) {
      const data = this.queue({ name, entry });
      if (isBlank(data.name)) continue;
      const messages = [];
      let emoji = '🎴';
      // queues.every(({ name }) => cache.dataQueue.find(({ name: n }) => name === n));
      // cache.dataQueue.find((q) => q.name === data.name)
      const inQueue = cache.dataQueue.some(
        ({ name }) =>
          queues.some(({ name: n }) => name === n || n === data.name) || name === data.name
      );
      if (inQueue) {
        emoji = '⚠️';
        messages.push('Already in queue.');
      } else {
        if (this.turn + 1 >= cache.settings.minTurns) {
          if (cache.generating === false) cache.generating = !cache.generating;
          const { card } = this.getCardId(data.name);
          if (isNull(card)) {
            messages.push('Preparing...');
          } else {
            messages.push('Updating...');
            data.entry = `Override and update plot-relevant CAT/TRAIT/DESC.\n${data.entry}`;
          }
        } else {
          cache.cooldown = cache.settings.minTurns;
          emoji = '⚠️';
          messages.push(
            `(Not enough story) Generating in ${Math.abs(this.turn - cache.cooldown - 1)} turns.`
          );
        }
        if (!cache.dataQueue.some(({ name }) => name === data.name)) cache.dataQueue.push(data);
      }
      queues.push({
        cmd: cmd.toUpperCase(),
        emoji,
        message: messages.join(' 🢂 '),
        ...data
      });
    }
    // queues.every(({ emoji, cmd, name, message }) => queues.filter(({ emoji: e, cmd: c, name: n, message: m }) => emoji === e && cmd === c && name === n && message === m));
    const combine = queues.every(({ emoji, cmd, message }) =>
      queues.filter(({ emoji: e, cmd: c, message: m }) => emoji === e && cmd === c && message === m)
    );
    const q = queues.at(0);
    let TEXT = queues
      .map(({ emoji, cmd, name, message }) => `${emoji} ${cmd} ◖${name}◗ 🢂 ${message}`)
      .join('\n');
    if (combine && q) {
      const names = queues.map(({ name }) => `◖${name}◗`);
      TEXT = `${q.emoji} ${q.cmd} ${names.join(' ')} 🢂 ${q.message}`;
    }
    if (!isBlank(TEXT)) {
      this.text = TEXT;
      con.msg(`🎴 MagicCards 🢂 ${TEXT}`);
    }

    return this;
  }
  context() {
    const cache = this.cache;
    if (!this.turn || !cache.settings.enabled) return this;
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
    /**
     * @type {StoryCard[]}
     */
    const arr = Array.from(this);
    let entries = [];
    for (const sc of arr) {
      const { card, save } = this.getEditor(sc);
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
      // const [, name1] = sc.entry.match(/Name:(.*);/) || [];
      // if (typeof name1 === 'string') {
      //   entries.push(name1.trim());
      // }
      // if (card.id) {
      //   entries.push(card.id.trim());
      // };

      // const [, name, num] = sc.description.match(/^\[#\d+:(.*):(\d+)\]/) || [];
      // const n = Number(num);
      // if (Number.isInteger(n)) {
      //   if (n > 0) continue;
      //   const data = this.queue({
      //     name: isEmpty(name) ? sc.title : name,
      //     entry: sc.entry,
      //     type: 'Compress'
      //   });
      //   if (!cache.dataQueue.includes(data)) {
      //     cache.dataQueue.push(data);
      //     sc.description = sc.description.replace(/(\d+)\]$/m, `${cache.cooldown}]`);
      //   }
      // } else if (typeof name === 'string') {
      //   entries.push(name.trim());
      // } else {
      //   const [, name1] = sc.entry.match(/Name:(.*);/) || [];
      //   if (typeof name1 === 'string') {
      //     entries.push(name1.trim());
      //   }
      // }
    }
    entries = rmDup(entries.filter((i) => !isEmpty(i)));
    cache.generating = !(isBlank(cache.dataQueue) && isBlank(cache.data));

    if (
      cache.generating === false &&
      this.turn > 0 &&
      (this.turn % cache.cooldown) - this.cache.turnsSpent === 0
    ) {
      if (isEmpty(cache.data.name)) {
        /* We do not specify a `name` */
        const data = this.queue({
          entry: entries.join(','),
          type: 'Retrieve'
        });
        if (!cache.dataQueue.includes(data)) cache.dataQueue.push(data);
      }
      cache.generating = !(isBlank(cache.dataQueue) && isBlank(cache.data));
    }
    if (cache.generating) {
      if (!cache.data.name && !isBlank(cache.dataQueue)) cache.data = cache.dataQueue.shift() || {};
      // if (isBlank(cache.dataQueue) && isBlank(cache.data)) {
      //   cache.generating = false;
      //   return this;
      // }
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
      const INT = `${this.database.instruction.ai}\n${this.database.instruction.user}`
        .split('\\n')
        .join('\n')
        .replaceAll(/(\$\d+)/g, (_) => parts[_] ?? _);
      this.text += INT;
      // con.log(INT);
      cache.turnsSpent += 1;
    }
    return this;
  }
  output() {
    if (this.turn === 2) {
      con.msg('🎴 MagicCards 🢂 Install complete!');
    } else if (!this.turn) {
      con.msg('🎴 MagicCards 🢂 Installing...');
    }

    const cache = this.cache;
    if (!this.turn || !cache.settings.enabled) return this;
    if (!isBlank(cache.data)) con.log(cache.data, cache.dataQueue, this.text);
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
      if (isEmpty(cache.data.name) || !/Characters|Locations/.test(cache.data.type)) {
        const t = this.text.trim();
        /**
         * @type {StoryCard[]}
         */
        const arr = Array.from(this);
        // for (const sc of arr) {
        //   const { card } = this.getEditor(sc);
        //   if (new RegExp(card.id.trim(), 'i').test(t)) continue;
        // }

        if (/Retrieve/.test(cache.data.type)) {
          this.text = this.print('Checking for new entries...', '🎴', 'MagicCards');
          for (const [, type, entries] of t.matchAll(/(Characters|Locations):\s?(.*);/g) || []) {
            for (const name of entries.split(',')) {
              if (/none|n\/a|unknown|not\s?found/i.test(name)) continue;
              if (!/[A-Z]/.test(name)) continue;
              const scExists = arr.some((sc) => {
                const { card } = this.getEditor(sc);
                return new RegExp(card.id.trim(), 'i').test(name);
              });
              if (scExists) continue;
              const data = this.queue({ name, type });
              const { card } = this.getCardId(data.name);
              const r = new RegExp(data.name, 'i');
              if (isNull(card) && !cache.dataQueue.some(({ name }) => r.test(name))) {
                cache.dataQueue.push(data);
              }
            }
          }
        } else if (/Compress/.test(cache.data.type)) {
          this.text = this.print(`Compressing ${cache.data.name}...`, '🎴', 'MagicCards');
          for (const [, name = '', entry = ''] of t.matchAll(/^([\w\s]+):\s?(.*)/gm) || []) {
            const { card } = this.getCardId(name.trim());
            if (!isNull(card)) {
              const c = this.getEditor(card);
              c.card.summary.push({ entry, turn: this.turn });
              c.save();
            }
          }
        }

        cache.data = cache.dataQueue.shift() || {};

        if (!isBlank(cache.dataQueue)) {
          this.text = this.print(
            `Adding ${cache.dataQueue.map(({ name }) => `◖${name}◗`).join(' ')} to queue...`
          );
        }
        this.refresh();
      } else {
        const { complete, list, extra } = this.getPList(
          [{ text: cache.data.output }, { text: this.text }],
          true
        );

        if (complete) {
          const obj = {
            id: cache.data.name,
            data: {
              name: cache.data.name,
              entry: cache.data.entry
            },
            cooldown: cache.cooldown,
            summary: []
          };
          this.createCard({
            id: JSON.stringify(obj),
            title: cache.data.name,
            entry: list
          });
          // SC.card.description = Words.limit(
          //   `[#${SC.id}:${cache.data.name}:${cache.cooldown}]`,
          //   2000
          // );
          const upNext = cache.dataQueue.shift() || {};
          con.msg(`🎴 MagicCards 🢂 Created ${cache.data.name}`);
          this.text = this.print(`Done! (${list.length}/1,000)${progressBar(upNext)}`);
          cache.data = upNext;
          this.refresh();
        } else {
          cache.data.output += list;
          con.msg('🎴 MagicCards 🢂 Generating...');
          this.text = this.print(`Generating... ${extra}${progressBar()}`);
        }
        con.log('list', list);
      }
    } else {
      const reg = /(\n-\s)?(🎴|⚠️)(\s\/)?/g;
      history = history.filter(({ text }) => !reg.test(text));

      /**
       * @type {StoryCard[]}
       */
      const arr = Array.from(this);
      for (const sc of arr) {
        const { card, save } = this.getEditor(sc);
        card.cooldown--;
        if (card.cooldown === 0) {
          con.msg(`Compressing ${sc.title} on the next turn...`);
        }
        save();

        // const j = sc.id.startsWith('{') && sc.id.endsWith('}') ? JSON.parse(sc.id) : {};
        // if (isBlank(j)) continue;
        // j.cooldown -= 1;
        // if (j.cooldown === 0) {
        //   con.msg(`Compressing ${sc.title} on the next turn...`);
        // }
        // sc.id = JSON.stringify(j);

        // const [, num] = sc.description.match(/^\[#\d+:.*:(\d+)\]/) || [];
        // let n = Number(num);
        // if (Number.isInteger(n)) {
        //   n -= 1;
        //   if (n === 0) {
        //     con.msg(`Compressing ${sc.title} on the next turn...`);
        //   }
        //   sc.description = sc.description.replace(/(\d+)\]$/m, `${n}]`);
        // }
      }
    }

    return this;
  }
  //#endregion
  *[Symbol.iterator]() {
    for (const sc of storyCards.filter(({ type }) => type === 'MC_CARD')) {
      yield sc;
    }
  }
};
const mc = new MagicCards(OPTIONS);
/**
 * Ensures `modifier` function exists & prevent it from being `undefined`
 *
 * _This is the last executed function in the chain._
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
