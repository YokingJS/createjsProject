
if (!Object.keys) {
  Object.keys = (function() {
    const {hasOwnProperty} = Object.prototype;
    const hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString');// eslint-disable-line
    const dontEnums = [
      'toString',
      'toLocaleString',
      'valueOf',
      'hasOwnProperty',
      'isPrototypeOf',
      'propertyIsEnumerable',
      'constructor'
    ];
    const dontEnumsLength = dontEnums.length;

    return function(obj) {
      if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object');

      const result = [];

      for (const prop in obj) {
        if (hasOwnProperty.call(obj, prop)) result.push(prop);
      }

      if (hasDontEnumBug) {
        for (let i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
        }
      }
      return result;
    };
  }());
}


function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function getGDC(num1, num2) {
  if (num1 % num2 === 0) {
    return num2;
  }
  return getGDC(num2, num1 % num2);
}

function getLCM(num1, num2) {
  return num1 * num2 / getGDC(num1, num2);
}

function getMutiLCM(...nums) {
  return nums.reduce(getLCM);
}

function getProbabilityArr(probabilityObj) {
  const nums = Object.keys(probabilityObj);

  const probs = nums.map(key => probabilityObj[key]);

  const denominator = probs.map(p => parseInt(1 / p, 10));

  const LCM = getLCM(...denominator);

  const arr = [];
  for (let i = 0; i < probs.length; i += 1) {
    let count = LCM * probs[i];
    while (count > 0) {
      arr.push(nums[i]);
      count -= 1;
    }
  }
  return arr;
}

function getRandomNumBySpecial(probabilityObj) {
  const probArr = getProbabilityArr(probabilityObj);
  return +probArr[getRandom(0, probArr.length)];
}


function throttle(fn, threshold = 200, ctx) {
  // 记录上次执行的时间
  let last;
  // 定时器
  let timer;
  // 返回的函数，每过 threshold 毫秒就执行一次 fn 函数
  return function() {
    // 保存函数调用时的上下文和参数，传递给 fn
    const context = ctx || this;
    const args = arguments; // eslint-disable-line
    const now = +new Date();
    // 如果距离上次执行 fn 函数的时间小于 threshold，那么就放弃
    // 执行 fn，并重新计时
    if (last && now < last + threshold) {
      clearTimeout(timer);
      // 保证在当前时间区间结束后，再执行一次 fn
      timer = setTimeout(() => {
        last = now;
        fn.apply(context, args);
      }, threshold);
      // 在时间区间的最开始和到达指定间隔的时候执行一次 fn
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
}


export default {
  throttle,
  getRandom,
  getGDC,
  getLCM,
  getMutiLCM,
  getRandomNumBySpecial,
};

