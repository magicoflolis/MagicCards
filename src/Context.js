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