import './ScriptingTypes.d.ts';

/**
 * Scripting API: https://help.aidungeon.com/scripting
 * Scripting Guidebook: https://github.com/magicoflolis/aidungeon.js/blob/main/Scripting%20Guidebook.md
 */
export type MagicAPI = unknown;

export declare function regExpEscape(str: string): string;

declare global {
  class AIDError extends Error {
    cause?: unknown;
  }
  /**
   * Groups members of an iterable according to the return value of the passed callback.
   * @param arr An iterable.
   * @param callback A callback which will be invoked for each item in items.
   */
  const groupBy: <K extends PropertyKey, T>(
    arr: Iterable<T>,
    callback: (item: T, index: number) => K
  ) => Partial<Record<K, T[]>>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Array<T> {
    group: typeof groupBy;
    groupToMap(callback: () => unknown, thisArg: unknown): Map<unknown, unknown>;
  }
  interface Object {
    groupBy: typeof groupBy;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Map<K, V> {
    groupBy: typeof groupBy;
  }
  interface RegExpConstructor {
    escape<S>(str: S): string;
  }
  /**
   * Similar to {@link Modifier} type and {@link modifier} function.
   */
  type ModifierFN = <T extends typeof text, S extends typeof stop>(
    text: T,
    stop: S,
    type: defaultOptions['hook']
  ) => { text: T; stop?: S };
  interface dataEntry {
    category: string[];
    instruction: {
      ai: string;
      user: string;
      example: string;
    };
    limit: {
      category: number;
      card: number;
      retry: number;
    };
    type: 'Characters' | 'Locations' | 'Default' | 'Retrieve' | 'Compress';
  }
  interface dataQueue extends dataEntry {
    name: string;
    entry: string;
    extra: string[];
    output: string;
    progress: number;
    loaded: {
      [key: string]: string;
    };
  }
  interface defaultOptions {
    settings: {
      autoHistory: boolean;
      autoRetrieve: boolean;
      enabled: boolean;
      cooldown: number;
      hiddenCards: string[];
      useSmallModel: boolean;
    };
    data: dataQueue;
    database: dataEntry[];
    dataQueue: dataQueue[];
    disabled: boolean;
    errors: string[];
    generating: boolean;
    pins: string[];
    stop: boolean;
    turnsSpent: number;
    hook: 'input' | 'context' | 'output';
    // [key: string]: unknown;
  }

  interface CardId {
    defaultId?: string;
    id: string;
  }
  interface OptionId extends CardId {
    pin: boolean;
  }
  interface MagicId extends CardId {
    autoHistory: boolean;
    defaultCooldown?: number;
    cooldown: number;
    summary: string;
    sync: boolean;
  }

  interface State {
    MagicCards?: defaultOptions;
    messageHistory?: string[];
  }
}
