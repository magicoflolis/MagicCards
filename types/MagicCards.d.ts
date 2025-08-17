import './ScriptingTypes.d.ts';

/**
 * Scripting API: https://help.aidungeon.com/scripting
 * Scripting Guidebook: https://github.com/magicoflolis/aidungeon.js/blob/main/Scripting%20Guidebook.md
 */
export type MagicAPI = unknown;

declare function regExpEscape(str: string): string;

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
  class MagicCards {
    configCard: {
      id: string;
      index: number;
      card: StoryCard;
    };
    [Symbol.iterator](): Generator<StoryCard, void, undefined>;
  }
  /**
   * Similar to {@link Modifier} type and {@link modifier} function.
   */
  type ModifierFN = <T extends typeof text, S extends typeof stop>(
    this: typeof MagicCards,
    text: T,
    stop: S,
    type: 'library'
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
    output: string;
    progress: number;
  }
  interface MagicId {
    id: string;
    // data: {
    //   name: string;
    //   entry: string;
    // };
    cooldown: number;
    summary: {
      History: string;
      // entry: {
      //   [key: string]: string;
      // };
      // turn: Info['actionCount'];
    }[];
  }
  type defaultOptions = {
    settings: {
      enabled: boolean;
      minTurns: number;
    };
    pins: string[];
    cooldown: number;
    data: dataQueue;
    database: dataEntry[];
    dataQueue: dataQueue[];
    disabled?: boolean;
    errors: string[];
    generating: boolean;
    turnsSpent: number;
    // [key: string]: unknown;
  };
  interface State {
    messageHistory?: string[];
    MagicCards?: defaultOptions;
  }
}
