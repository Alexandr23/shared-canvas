export const throttle = (fn: Function, wait: number = 300) => {
  let inThrottle: boolean;
  let lastFn: number;
  let lastTime: number;

  return function (this: any, ...args: any) {
    const context = this;

    if (!inThrottle) {
      fn.apply(context, args);
      lastTime = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFn);

      lastFn = window.setTimeout(() => {
        if (Date.now() - lastTime >= wait) {
          fn.apply(context, args);
          lastTime = Date.now();
        }
      }, Math.max(wait - (Date.now() - lastTime), 0));
    }
  };
};
