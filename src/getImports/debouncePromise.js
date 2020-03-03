const promises = {};

export const DebounceError = m => new Error('DebounceError: ' + m);

export function debouncePromise(key, fn, delay = 500) {
  const promise = new Promise((resolve, reject) => {
    setTimeout(
      () =>
        promises[key] === promise
          ? new Promise(fn).then(resolve).catch(reject)
          : reject(DebounceError(key)),
      delay
    );
  });
  return (promises[key] = promise);
}
