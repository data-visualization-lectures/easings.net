// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"../node_modules/focus-visible/dist/focus-visible.js":[function(require,module,exports) {
var define;
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, (function () { 'use strict';

  /**
   * Applies the :focus-visible polyfill at the given scope.
   * A scope in this case is either the top-level Document or a Shadow Root.
   *
   * @param {(Document|ShadowRoot)} scope
   * @see https://github.com/WICG/focus-visible
   */
  function applyFocusVisiblePolyfill(scope) {
    var hadKeyboardEvent = true;
    var hadFocusVisibleRecently = false;
    var hadFocusVisibleRecentlyTimeout = null;

    var inputTypesWhitelist = {
      text: true,
      search: true,
      url: true,
      tel: true,
      email: true,
      password: true,
      number: true,
      date: true,
      month: true,
      week: true,
      time: true,
      datetime: true,
      'datetime-local': true
    };

    /**
     * Helper function for legacy browsers and iframes which sometimes focus
     * elements like document, body, and non-interactive SVG.
     * @param {Element} el
     */
    function isValidFocusTarget(el) {
      if (
        el &&
        el !== document &&
        el.nodeName !== 'HTML' &&
        el.nodeName !== 'BODY' &&
        'classList' in el &&
        'contains' in el.classList
      ) {
        return true;
      }
      return false;
    }

    /**
     * Computes whether the given element should automatically trigger the
     * `focus-visible` class being added, i.e. whether it should always match
     * `:focus-visible` when focused.
     * @param {Element} el
     * @return {boolean}
     */
    function focusTriggersKeyboardModality(el) {
      var type = el.type;
      var tagName = el.tagName;

      if (tagName === 'INPUT' && inputTypesWhitelist[type] && !el.readOnly) {
        return true;
      }

      if (tagName === 'TEXTAREA' && !el.readOnly) {
        return true;
      }

      if (el.isContentEditable) {
        return true;
      }

      return false;
    }

    /**
     * Add the `focus-visible` class to the given element if it was not added by
     * the author.
     * @param {Element} el
     */
    function addFocusVisibleClass(el) {
      if (el.classList.contains('focus-visible')) {
        return;
      }
      el.classList.add('focus-visible');
      el.setAttribute('data-focus-visible-added', '');
    }

    /**
     * Remove the `focus-visible` class from the given element if it was not
     * originally added by the author.
     * @param {Element} el
     */
    function removeFocusVisibleClass(el) {
      if (!el.hasAttribute('data-focus-visible-added')) {
        return;
      }
      el.classList.remove('focus-visible');
      el.removeAttribute('data-focus-visible-added');
    }

    /**
     * If the most recent user interaction was via the keyboard;
     * and the key press did not include a meta, alt/option, or control key;
     * then the modality is keyboard. Otherwise, the modality is not keyboard.
     * Apply `focus-visible` to any current active element and keep track
     * of our keyboard modality state with `hadKeyboardEvent`.
     * @param {KeyboardEvent} e
     */
    function onKeyDown(e) {
      if (e.metaKey || e.altKey || e.ctrlKey) {
        return;
      }

      if (isValidFocusTarget(scope.activeElement)) {
        addFocusVisibleClass(scope.activeElement);
      }

      hadKeyboardEvent = true;
    }

    /**
     * If at any point a user clicks with a pointing device, ensure that we change
     * the modality away from keyboard.
     * This avoids the situation where a user presses a key on an already focused
     * element, and then clicks on a different element, focusing it with a
     * pointing device, while we still think we're in keyboard modality.
     * @param {Event} e
     */
    function onPointerDown(e) {
      hadKeyboardEvent = false;
    }

    /**
     * On `focus`, add the `focus-visible` class to the target if:
     * - the target received focus as a result of keyboard navigation, or
     * - the event target is an element that will likely require interaction
     *   via the keyboard (e.g. a text box)
     * @param {Event} e
     */
    function onFocus(e) {
      // Prevent IE from focusing the document or HTML element.
      if (!isValidFocusTarget(e.target)) {
        return;
      }

      if (hadKeyboardEvent || focusTriggersKeyboardModality(e.target)) {
        addFocusVisibleClass(e.target);
      }
    }

    /**
     * On `blur`, remove the `focus-visible` class from the target.
     * @param {Event} e
     */
    function onBlur(e) {
      if (!isValidFocusTarget(e.target)) {
        return;
      }

      if (
        e.target.classList.contains('focus-visible') ||
        e.target.hasAttribute('data-focus-visible-added')
      ) {
        // To detect a tab/window switch, we look for a blur event followed
        // rapidly by a visibility change.
        // If we don't see a visibility change within 100ms, it's probably a
        // regular focus change.
        hadFocusVisibleRecently = true;
        window.clearTimeout(hadFocusVisibleRecentlyTimeout);
        hadFocusVisibleRecentlyTimeout = window.setTimeout(function() {
          hadFocusVisibleRecently = false;
        }, 100);
        removeFocusVisibleClass(e.target);
      }
    }

    /**
     * If the user changes tabs, keep track of whether or not the previously
     * focused element had .focus-visible.
     * @param {Event} e
     */
    function onVisibilityChange(e) {
      if (document.visibilityState === 'hidden') {
        // If the tab becomes active again, the browser will handle calling focus
        // on the element (Safari actually calls it twice).
        // If this tab change caused a blur on an element with focus-visible,
        // re-apply the class when the user switches back to the tab.
        if (hadFocusVisibleRecently) {
          hadKeyboardEvent = true;
        }
        addInitialPointerMoveListeners();
      }
    }

    /**
     * Add a group of listeners to detect usage of any pointing devices.
     * These listeners will be added when the polyfill first loads, and anytime
     * the window is blurred, so that they are active when the window regains
     * focus.
     */
    function addInitialPointerMoveListeners() {
      document.addEventListener('mousemove', onInitialPointerMove);
      document.addEventListener('mousedown', onInitialPointerMove);
      document.addEventListener('mouseup', onInitialPointerMove);
      document.addEventListener('pointermove', onInitialPointerMove);
      document.addEventListener('pointerdown', onInitialPointerMove);
      document.addEventListener('pointerup', onInitialPointerMove);
      document.addEventListener('touchmove', onInitialPointerMove);
      document.addEventListener('touchstart', onInitialPointerMove);
      document.addEventListener('touchend', onInitialPointerMove);
    }

    function removeInitialPointerMoveListeners() {
      document.removeEventListener('mousemove', onInitialPointerMove);
      document.removeEventListener('mousedown', onInitialPointerMove);
      document.removeEventListener('mouseup', onInitialPointerMove);
      document.removeEventListener('pointermove', onInitialPointerMove);
      document.removeEventListener('pointerdown', onInitialPointerMove);
      document.removeEventListener('pointerup', onInitialPointerMove);
      document.removeEventListener('touchmove', onInitialPointerMove);
      document.removeEventListener('touchstart', onInitialPointerMove);
      document.removeEventListener('touchend', onInitialPointerMove);
    }

    /**
     * When the polfyill first loads, assume the user is in keyboard modality.
     * If any event is received from a pointing device (e.g. mouse, pointer,
     * touch), turn off keyboard modality.
     * This accounts for situations where focus enters the page from the URL bar.
     * @param {Event} e
     */
    function onInitialPointerMove(e) {
      // Work around a Safari quirk that fires a mousemove on <html> whenever the
      // window blurs, even if you're tabbing out of the page. ¯\_(ツ)_/¯
      if (e.target.nodeName && e.target.nodeName.toLowerCase() === 'html') {
        return;
      }

      hadKeyboardEvent = false;
      removeInitialPointerMoveListeners();
    }

    // For some kinds of state, we are interested in changes at the global scope
    // only. For example, global pointer input, global key presses and global
    // visibility change should affect the state at every scope:
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('touchstart', onPointerDown, true);
    document.addEventListener('visibilitychange', onVisibilityChange, true);

    addInitialPointerMoveListeners();

    // For focus and blur, we specifically care about state changes in the local
    // scope. This is because focus / blur events that originate from within a
    // shadow root are not re-dispatched from the host element if it was already
    // the active element in its own scope:
    scope.addEventListener('focus', onFocus, true);
    scope.addEventListener('blur', onBlur, true);

    // We detect that a node is a ShadowRoot by ensuring that it is a
    // DocumentFragment and also has a host property. This check covers native
    // implementation and polyfill implementation transparently. If we only cared
    // about the native implementation, we could just check if the scope was
    // an instance of a ShadowRoot.
    if (scope.nodeType === Node.DOCUMENT_FRAGMENT_NODE && scope.host) {
      // Since a ShadowRoot is a special kind of DocumentFragment, it does not
      // have a root element to add a class to. So, we add this attribute to the
      // host element instead:
      scope.host.setAttribute('data-js-focus-visible', '');
    } else if (scope.nodeType === Node.DOCUMENT_NODE) {
      document.documentElement.classList.add('js-focus-visible');
      document.documentElement.setAttribute('data-js-focus-visible', '');
    }
  }

  // It is important to wrap all references to global window and document in
  // these checks to support server-side rendering use cases
  // @see https://github.com/WICG/focus-visible/issues/199
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Make the polyfill helper globally available. This can be used as a signal
    // to interested libraries that wish to coordinate with the polyfill for e.g.,
    // applying the polyfill to a shadow root:
    window.applyFocusVisiblePolyfill = applyFocusVisiblePolyfill;

    // Notify interested libraries of the polyfill's presence, in case the
    // polyfill was loaded lazily:
    var event;

    try {
      event = new CustomEvent('focus-visible-polyfill-ready');
    } catch (error) {
      // IE11 does not support using CustomEvent as a constructor directly:
      event = document.createEvent('CustomEvent');
      event.initCustomEvent('focus-visible-polyfill-ready', false, false, {});
    }

    window.dispatchEvent(event);
  }

  if (typeof document !== 'undefined') {
    // Apply the polyfill to the global document, so that no JavaScript
    // coordination is required to use the polyfill in the top-level document:
    applyFocusVisiblePolyfill(document);
  }

})));

},{}],"helpers/forNodeList.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.forNodeList = forNodeList;

/**
 * Call function for each NodeList
 */
function forNodeList(elements, callback) {
  Array.prototype.slice.call(elements).forEach(callback);
}
},{}],"helpers/getTransitionTime.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTransitionTime = getTransitionTime;

/**
 * Computing transition time for the element
 * @param element {Element}
 * @return {number}
 */
function getTransitionTime(element) {
  var style = window.getComputedStyle(element);
  var transitionDurationString = /([\d.]+m*s)/i.exec(style.transitionDuration);
  var transitionDuration = parseFloat(transitionDurationString[1]);
  var ratioTime = transitionDurationString[1].indexOf("ms") > -1 ? 1 : 1000;
  return transitionDuration * ratioTime;
}
},{}],"helpers/getElement.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getElement = getElement;
exports.getElementsList = getElementsList;

/**
 * Get DOM Element
 * @param selector {string}
 * @param context {Document|HTMLElement}
 * @return {HTMLElement}
 */
function getElement(selector, context) {
  if (context === void 0) {
    context = document;
  }

  return context.querySelector(selector);
}
/**
 * Get DOM Elements
 * @param selector {string}
 * @param context {Document|HTMLElement}
 * @return {NodeList}
 */


function getElementsList(selector, context) {
  if (context === void 0) {
    context = document;
  }

  return context.querySelectorAll(selector);
}
},{}],"card/card.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setFuncForCard = setFuncForCard;
exports.clearTransition = clearTransition;

var _forNodeList = require("../helpers/forNodeList");

var _getTransitionTime = require("../helpers/getTransitionTime");

var _getElement = require("../helpers/getElement");

var cardTarget = (0, _getElement.getElement)(".card__wrap[data-target=false]");
var cardTargetWithFunc = (0, _getElement.getElement)(".card__wrap[data-target=true]");
var casesButtonsList = (0, _getElement.getElementsList)(".cases__action");
var cardTargetClassList = {
  opacity: "card__wrap--opacity",
  scale: "card__wrap--scale",
  translate: "card__wrap--translate"
};
var cardClassWithoutTransition = "card__wrap--no-transition";
var isReverse = false;
var currentName;
var currentFunc;
var currentType;
(0, _forNodeList.forNodeList)(casesButtonsList, function (button) {
  button.addEventListener("click", function () {
    var newType = button.getAttribute("data-type");
    setTransition(cardTarget, newType);

    if (currentName) {
      setAnimation(newType);
    } else {
      cardTargetWithFunc.style.transitionTimingFunction = currentFunc;
      setTransition(cardTargetWithFunc, newType);
    }

    currentType = newType;
  });
});

function setFuncForCard(cssFunc, name) {
  if (cssFunc === "no") {
    currentName = name;
  } else {
    currentName = null;
    currentFunc = cssFunc;
  }
}

function clearTransition() {
  cardTarget.classList.add(cardClassWithoutTransition);
  cardTargetWithFunc.classList.add(cardClassWithoutTransition);
  cardTargetWithFunc.removeAttribute("style");
  cardTarget.classList.remove(cardTargetClassList.opacity, cardTargetClassList.scale, cardTargetClassList.translate);
  cardTargetWithFunc.classList.remove(cardTargetClassList.opacity, cardTargetClassList.scale, cardTargetClassList.translate);
  requestAnimationFrame(function () {
    cardTarget.classList.remove(cardClassWithoutTransition);
    cardTargetWithFunc.classList.remove(cardClassWithoutTransition);
  });
}

function setTransition(target, newType) {
  target.classList.add(cardClassWithoutTransition);

  if (newType !== currentType) {
    target.classList.remove(cardTargetClassList[currentType]);
    void target.offsetWidth;
    target.classList.remove(cardClassWithoutTransition);
    target.classList.add(cardTargetClassList[newType]);
  } else {
    void target.offsetWidth;
    target.classList.remove(cardClassWithoutTransition);
    target.classList.toggle(cardTargetClassList[newType]);
  }
}

function setAnimation(animationType) {
  var time = (0, _getTransitionTime.getTransitionTime)(cardTargetWithFunc);
  var animationName = animationType + "-" + currentName;
  var styles = window.getComputedStyle(cardTargetWithFunc);

  if (styles.animationName === animationName) {
    isReverse = !isReverse;
  } else {
    isReverse = false;
  }

  cardTargetWithFunc.style.animation = "none";
  void cardTargetWithFunc.offsetWidth;
  cardTargetWithFunc.style.animation = "\n\t\t" + animationName + " " + time + "ms both " + (isReverse ? "reverse" : "") + " linear\n\t";
}
},{"../helpers/forNodeList":"helpers/forNodeList.ts","../helpers/getTransitionTime":"helpers/getTransitionTime.ts","../helpers/getElement":"helpers/getElement.ts"}],"helpers/getElementPosition.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getElementPosition = getElementPosition;

/**
 * Get element position
 * @param element {HTMLElement}
 * @return {{x: number, width: number, y: number, height: number}}
 */
function getElementPosition(element) {
  var position = element.getBoundingClientRect();
  return {
    height: position.height,
    width: position.width,
    x: position.left + window.pageXOffset,
    y: position.top + window.pageYOffset
  };
}
},{}],"helpers/parseStringOfFourNumbers.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseStringOfFourNumbers = parseStringOfFourNumbers;

/**
 * Parse string of four numbers (example: viewBox)
 * @param stringOfFourNumbers {string}
 * @return {number[]}
 */
function parseStringOfFourNumbers(stringOfFourNumbers) {
  var points = stringOfFourNumbers.match(/(-*[.\d]+)/g);

  if (!points || points.length !== 4) {
    return [];
  }

  return [parseFloat(points[0]), parseFloat(points[1]), parseFloat(points[2]), parseFloat(points[3])];
}
},{}],"helpers/constants.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.color2 = exports.color1 = exports.infoChartOffsetTopClassName = exports.selectorCopyCode = exports.selectorCopyButton = exports.selectorGradient = exports.selectorComplexKeyframeTranslate = exports.selectorComplexKeyframeOpacity = exports.selectorComplexKeyframeScale = exports.selectorCode = exports.selectorDetails = exports.selectorComplexInfo = exports.selectorSimpleInfo = exports.selectorInfoChart = exports.selectorInfo = exports.noTimingFunction = void 0;
var noTimingFunction = "no";
exports.noTimingFunction = noTimingFunction;
var selectorInfo = ".info";
exports.selectorInfo = selectorInfo;
var selectorInfoChart = ".info-chart";
exports.selectorInfoChart = selectorInfoChart;
var selectorSimpleInfo = ".js-info-simple";
exports.selectorSimpleInfo = selectorSimpleInfo;
var selectorComplexInfo = ".js-info-complex";
exports.selectorComplexInfo = selectorComplexInfo;
var selectorDetails = ".details";
exports.selectorDetails = selectorDetails;
var selectorCode = ".details__code";
exports.selectorCode = selectorCode;
var selectorComplexKeyframeScale = selectorCode + "[data-type=scale]";
exports.selectorComplexKeyframeScale = selectorComplexKeyframeScale;
var selectorComplexKeyframeOpacity = selectorCode + "[data-type=opacity]";
exports.selectorComplexKeyframeOpacity = selectorComplexKeyframeOpacity;
var selectorComplexKeyframeTranslate = selectorCode + "[data-type=translate]";
exports.selectorComplexKeyframeTranslate = selectorComplexKeyframeTranslate;
var selectorGradient = ".example__gradient";
exports.selectorGradient = selectorGradient;
var selectorCopyButton = ".example-copy__button";
exports.selectorCopyButton = selectorCopyButton;
var selectorCopyCode = ".example-copy__code";
exports.selectorCopyCode = selectorCopyCode;
var infoChartOffsetTopClassName = "info-chart--offset_top";
exports.infoChartOffsetTopClassName = infoChartOffsetTopClassName;
var color1 = "#1473e6";
exports.color1 = color1;
var color2 = "#247b5e";
exports.color2 = color2;
},{}],"easings/keyframes.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/* eslint-disable prettier/prettier */
var keyframes = {
  easeInElastic: [0, 4, 8, 14, 18, 26, 28, 40, 42, 56, 58, 72, 86, 100],
  easeOutElastic: [0, 16, 28, 44, 59, 73, 88, 100],
  easeInOutElastic: [0, 4, 8, 18, 20, 28, 30, 38, 40, 60, 62, 70, 72, 80, 82, 90, 92, 100],
  easeInBounce: [0, 4, 8, 18, 26, 46, 64, 76, 88, 100],
  easeOutBounce: [0, 12, 24, 36, 54, 74, 82, 92, 96, 100],
  easeInOutBounce: [0, 2, 4, 10, 14, 22, 32, 42, 50, 58, 68, 78, 86, 90, 96, 98, 100]
};
var _default = keyframes;
exports.default = _default;
},{}],"easings/easingsFunctions.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var pow = Math.pow;
var sqrt = Math.sqrt;
var sin = Math.sin;
var cos = Math.cos;
var PI = Math.PI;
var c1 = 1.70158;
var c2 = c1 * 1.525;
var c3 = c1 + 1;
var c4 = 2 * PI / 3;
var c5 = 2 * PI / 4.5;

var bounceOut = function bounceOut(x) {
  var n1 = 7.5625;
  var d1 = 2.75;

  if (x < 1 / d1) {
    return n1 * x * x;
  } else if (x < 2 / d1) {
    return n1 * (x -= 1.5 / d1) * x + 0.75;
  } else if (x < 2.5 / d1) {
    return n1 * (x -= 2.25 / d1) * x + 0.9375;
  } else {
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }
};

var easingsFunctions = {
  linear: function linear(x) {
    return x;
  },
  easeInQuad: function easeInQuad(x) {
    return x * x;
  },
  easeOutQuad: function easeOutQuad(x) {
    return 1 - (1 - x) * (1 - x);
  },
  easeInOutQuad: function easeInOutQuad(x) {
    return x < 0.5 ? 2 * x * x : 1 - pow(-2 * x + 2, 2) / 2;
  },
  easeInCubic: function easeInCubic(x) {
    return x * x * x;
  },
  easeOutCubic: function easeOutCubic(x) {
    return 1 - pow(1 - x, 3);
  },
  easeInOutCubic: function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
  },
  easeInQuart: function easeInQuart(x) {
    return x * x * x * x;
  },
  easeOutQuart: function easeOutQuart(x) {
    return 1 - pow(1 - x, 4);
  },
  easeInOutQuart: function easeInOutQuart(x) {
    return x < 0.5 ? 8 * x * x * x * x : 1 - pow(-2 * x + 2, 4) / 2;
  },
  easeInQuint: function easeInQuint(x) {
    return x * x * x * x * x;
  },
  easeOutQuint: function easeOutQuint(x) {
    return 1 - pow(1 - x, 5);
  },
  easeInOutQuint: function easeInOutQuint(x) {
    return x < 0.5 ? 16 * x * x * x * x * x : 1 - pow(-2 * x + 2, 5) / 2;
  },
  easeInSine: function easeInSine(x) {
    return 1 - cos(x * PI / 2);
  },
  easeOutSine: function easeOutSine(x) {
    return sin(x * PI / 2);
  },
  easeInOutSine: function easeInOutSine(x) {
    return -(cos(PI * x) - 1) / 2;
  },
  easeInExpo: function easeInExpo(x) {
    return x === 0 ? 0 : pow(2, 10 * x - 10);
  },
  easeOutExpo: function easeOutExpo(x) {
    return x === 1 ? 1 : 1 - pow(2, -10 * x);
  },
  easeInOutExpo: function easeInOutExpo(x) {
    return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? pow(2, 20 * x - 10) / 2 : (2 - pow(2, -20 * x + 10)) / 2;
  },
  easeInCirc: function easeInCirc(x) {
    return 1 - sqrt(1 - pow(x, 2));
  },
  easeOutCirc: function easeOutCirc(x) {
    return sqrt(1 - pow(x - 1, 2));
  },
  easeInOutCirc: function easeInOutCirc(x) {
    return x < 0.5 ? (1 - sqrt(1 - pow(2 * x, 2))) / 2 : (sqrt(1 - pow(-2 * x + 2, 2)) + 1) / 2;
  },
  easeInBack: function easeInBack(x) {
    return c3 * x * x * x - c1 * x * x;
  },
  easeOutBack: function easeOutBack(x) {
    return 1 + c3 * pow(x - 1, 3) + c1 * pow(x - 1, 2);
  },
  easeInOutBack: function easeInOutBack(x) {
    return x < 0.5 ? pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2) / 2 : (pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
  },
  easeInElastic: function easeInElastic(x) {
    return x === 0 ? 0 : x === 1 ? 1 : -pow(2, 10 * x - 10) * sin((x * 10 - 10.75) * c4);
  },
  easeOutElastic: function easeOutElastic(x) {
    return x === 0 ? 0 : x === 1 ? 1 : pow(2, -10 * x) * sin((x * 10 - 0.75) * c4) + 1;
  },
  easeInOutElastic: function easeInOutElastic(x) {
    return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? -(pow(2, 20 * x - 10) * sin((20 * x - 11.125) * c5)) / 2 : pow(2, -20 * x + 10) * sin((20 * x - 11.125) * c5) / 2 + 1;
  },
  easeInBounce: function easeInBounce(x) {
    return 1 - bounceOut(1 - x);
  },
  easeOutBounce: bounceOut,
  easeInOutBounce: function easeInOutBounce(x) {
    return x < 0.5 ? (1 - bounceOut(1 - 2 * x)) / 2 : (1 + bounceOut(2 * x - 1)) / 2;
  }
};
var _default = easingsFunctions;
exports.default = _default;
},{}],"helpers/roundTo2DecimalPlaces.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * Round to 2 decimal places
 * @param decimal {number}
 * @return {number}
 */
function roundTo2DecimalPlaces(decimal) {
  return Math.round(decimal * 100) / 100;
}

var _default = roundTo2DecimalPlaces;
exports.default = _default;
},{}],"easings/easings.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateComplexEasings = generateComplexEasings;
exports.keyframeTypes = void 0;

var _keyframes = _interopRequireDefault(require("./keyframes"));

var _easingsFunctions = _interopRequireDefault(require("./easingsFunctions"));

var _roundTo2DecimalPlaces = _interopRequireDefault(require("../helpers/roundTo2DecimalPlaces"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var keyframeTypes;
exports.keyframeTypes = keyframeTypes;

(function (keyframeTypes) {
  keyframeTypes["opacity"] = "opacity";
  keyframeTypes["scale"] = "scale";
  keyframeTypes["translate"] = "translate";
})(keyframeTypes || (exports.keyframeTypes = keyframeTypes = {}));

function generateComplexEasings(name, property) {
  if (name in _keyframes.default) {
    var keyframeList = _keyframes.default[name].map(function (item) {
      var keyframeValue = _easingsFunctions.default[name](item / 100);

      return "\t<span class='u-color-brand'>" + item + "%</span> {\n" + ("\t\t" + getDeclaration(property, keyframeValue) + "\n") + "\t}\n\n";
    }).join("");

    return "" + ("<span class='u-color-brand'>@keyframes</span> <span class='u-color-second'>" + property + "-" + name + "</span> {\n") + keyframeList + "}";
  }

  return "";
}

function getDeclaration(property, value) {
  var roundValue = (0, _roundTo2DecimalPlaces.default)(1 - value);

  switch (property) {
    case keyframeTypes.opacity:
      return "opacity: " + roundValue + ";";

    case keyframeTypes.scale:
      return "transform: scale(" + roundValue + ");";

    case keyframeTypes.translate:
      return "transform: translateX(" + (0, _roundTo2DecimalPlaces.default)(-100 * value) + "%);";

    default:
      return "";
  }
}
},{"./keyframes":"easings/keyframes.ts","./easingsFunctions":"easings/easingsFunctions.ts","../helpers/roundTo2DecimalPlaces":"helpers/roundTo2DecimalPlaces.ts"}],"info/info.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setInfoName = setInfoName;
exports.setInfoFunc = setInfoFunc;
exports.setInfoMaths = setInfoMaths;
exports.showSimpleInfo = showSimpleInfo;
exports.showComplexInfo = showComplexInfo;

var _constants = require("../helpers/constants");

var _forNodeList = require("../helpers/forNodeList");

var _getElement = require("../helpers/getElement");

var _easings = require("../easings/easings");

var info = (0, _getElement.getElement)(_constants.selectorInfo);
var infoSimple = (0, _getElement.getElementsList)(_constants.selectorSimpleInfo);
var infoComplex = (0, _getElement.getElementsList)(_constants.selectorComplexInfo);
var infoName = (0, _getElement.getElementsList)(".js-info-name", info);
var infoFuncName = (0, _getElement.getElementsList)(".js-info-func", info);
var infoMaths = (0, _getElement.getElementsList)(".js-info-maths", info);
var infoKeyframes = {
  opacity: (0, _getElement.getElement)(_constants.selectorComplexKeyframeOpacity),
  scale: (0, _getElement.getElement)(_constants.selectorComplexKeyframeScale),
  translate: (0, _getElement.getElement)(_constants.selectorComplexKeyframeTranslate)
};

function setInfoName(name) {
  (0, _forNodeList.forNodeList)(infoName, function (e) {
    e.innerText = name;
  });
}

function setInfoFunc(func) {
  (0, _forNodeList.forNodeList)(infoFuncName, function (e) {
    e.innerText = func;
  });
}

function setInfoMaths(maths) {
  (0, _forNodeList.forNodeList)(infoMaths, function (e) {
    e.innerText = maths;
  });
}

function showSimpleInfo() {
  (0, _forNodeList.forNodeList)(infoSimple, function (item) {
    return item.hidden = false;
  });
  (0, _forNodeList.forNodeList)(infoComplex, function (item) {
    return item.hidden = true;
  });
}

function showComplexInfo(name) {
  (0, _forNodeList.forNodeList)(infoSimple, function (item) {
    return item.hidden = true;
  });
  (0, _forNodeList.forNodeList)(infoComplex, function (item) {
    return item.hidden = false;
  });
  infoKeyframes.opacity.innerHTML = (0, _easings.generateComplexEasings)(name, _easings.keyframeTypes.opacity);
  infoKeyframes.scale.innerHTML = (0, _easings.generateComplexEasings)(name, _easings.keyframeTypes.scale);
  infoKeyframes.translate.innerHTML = (0, _easings.generateComplexEasings)(name, _easings.keyframeTypes.translate);
}
},{"../helpers/constants":"helpers/constants.ts","../helpers/forNodeList":"helpers/forNodeList.ts","../helpers/getElement":"helpers/getElement.ts","../easings/easings":"easings/easings.ts"}],"overlay/overlay.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setTransitionDurationOverlay = setTransitionDurationOverlay;
exports.resetOverlay = resetOverlay;
exports.showOverlay = showOverlay;
exports.setSizeOverlay = setSizeOverlay;

var _getElement = require("../helpers/getElement");

var overlay = (0, _getElement.getElement)(".overlay");

function setTransitionDurationOverlay(timeAtMs) {
  overlay.style.transitionDuration = timeAtMs + "ms";
}

function resetOverlay() {
  overlay.removeAttribute("style");
  overlay.hidden = true;
}

function showOverlay() {
  overlay.hidden = false;
}

function setSizeOverlay(size) {
  overlay.style.height = size.height + "px";
  overlay.style.width = size.width + "px";
  overlay.style.top = size.top + "px";
  overlay.style.left = size.left + "px";
}
},{"../helpers/getElement":"helpers/getElement.ts"}],"helpers/linearInterpolation.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.linearInterpolation = linearInterpolation;

/**
 * Linear interpolation
 * @param y1 {number}
 * @param y2 {number}
 * @param x {number}
 * @return {number}
 */
function linearInterpolation(y1, y2, x) {
  return Math.round(x * (y2 - y1) + y1);
}
},{}],"helpers/mixColors.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mixColors = mixColors;

var _linearInterpolation = require("./linearInterpolation");

/**
 * Mix 2 colors
 * @param color1 {string} - hex color
 * @param color2 {string} - hex color
 * @param blend {number} - between 0 and 1
 * @return {string} - hex color
 */
function mixColors(color1, color2, blend) {
  if (color1.length !== 7 || color2.length !== 7) {
    return "";
  }

  var color1RGB = [];
  var color2RGB = [];
  var colorRGB = [];
  color1.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i).forEach(function (item) {
    if (item.length === 2) {
      var color = parseInt(item, 16);
      color1RGB.push(color);
    }
  });
  color2.match(/#*([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i).forEach(function (item) {
    if (item.length === 2) {
      var color = parseInt(item, 16);
      color2RGB.push(color);
    }
  });
  color1RGB.forEach(function (c1, index) {
    var mixedColor = (0, _linearInterpolation.linearInterpolation)(c1, color2RGB[index], blend);
    colorRGB.push(mixedColor);
  });
  var colorResult = colorRGB.map(function (item) {
    var hex = item.toString(16);

    if (hex.length === 0) {
      hex = "00";
    } else if (hex.length === 1) {
      hex = "0" + hex;
    }

    return hex;
  }).join("");
  return "#" + colorResult;
}
},{"./linearInterpolation":"helpers/linearInterpolation.ts"}],"gradient/gradient.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setGradient = setGradient;
exports.hideGradient = hideGradient;

var _constants = require("../helpers/constants");

var _getElement = require("../helpers/getElement");

var _mixColors = require("../helpers/mixColors");

var _easingsFunctions = _interopRequireDefault(require("../easings/easingsFunctions"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var gradient = (0, _getElement.getElement)(_constants.selectorGradient);

function setGradient(funcName, points) {
  if (points.length !== 4 || !(funcName in _easingsFunctions.default)) {
    return;
  }

  var colors = [];

  for (var i = 0; i <= 25; i++) {
    var bland = _easingsFunctions.default[funcName](i / 25);

    var color = (0, _mixColors.mixColors)(_constants.color1, _constants.color2, bland);
    colors.push(color + " " + i * 4 + "%");
  }

  gradient.style.display = "block";
  gradient.style.backgroundImage = "linear-gradient(\n\t\tto bottom,\n\t\t" + colors.join(", ") + "\n\t)";
}

function hideGradient() {
  gradient.removeAttribute("style");
}
},{"../helpers/constants":"helpers/constants.ts","../helpers/getElement":"helpers/getElement.ts","../helpers/mixColors":"helpers/mixColors.ts","../easings/easingsFunctions":"easings/easingsFunctions.ts"}],"info-chart/info-chart.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setTransitionForInfoChartCursor = setTransitionForInfoChartCursor;

var _getElement = require("../helpers/getElement");

var infoChartTargetState = (0, _getElement.getElement)(".info-chart__target");
var infoChartCursor = (0, _getElement.getElement)(".info-chart__cursor");
var infoChartCursorVisibleSelector = "info-chart__cursor--visible";
var nameAnimation = null;
infoChartTargetState.addEventListener("pointerenter", showCursor);
infoChartTargetState.addEventListener("pointerleave", hideCursor);
infoChartTargetState.addEventListener("mouseenter", showCursor);
infoChartTargetState.addEventListener("mouseleave", hideCursor);
infoChartTargetState.addEventListener("focus", showCursor);
infoChartTargetState.addEventListener("blur", hideCursor);

function setTransitionForInfoChartCursor(cssFunc, name) {
  if (cssFunc === "no") {
    nameAnimation = name;
  } else {
    nameAnimation = null;
    infoChartCursor.style.transitionTimingFunction = cssFunc;
  }
}

function showCursor() {
  if (nameAnimation) {
    infoChartCursor.style.animation = "\n\t\t\t\t1s cursor-" + nameAnimation + " both 0.2s linear\n\t\t\t";
  }

  infoChartCursor.classList.add(infoChartCursorVisibleSelector);
}

function hideCursor() {
  infoChartCursor.style.transitionDuration = "0s";
  void infoChartCursor.offsetWidth;

  if (nameAnimation) {
    infoChartCursor.style.animation = null;
  }

  infoChartCursor.classList.remove(infoChartCursorVisibleSelector);
  infoChartCursor.style.transitionDuration = null;
}
},{"../helpers/getElement":"helpers/getElement.ts"}],"navigation/navigation.ts":[function(require,module,exports) {
"use strict";

var _card = require("../card/card");

var _getTransitionTime = require("../helpers/getTransitionTime");

var _getElementPosition = require("../helpers/getElementPosition");

var _parseStringOfFourNumbers = require("../helpers/parseStringOfFourNumbers");

var _constants = require("../helpers/constants");

var _forNodeList = require("../helpers/forNodeList");

var _getElement = require("../helpers/getElement");

var _info = require("../info/info");

var _overlay = require("../overlay/overlay");

var _gradient = require("../gradient/gradient");

var _infoChart = require("../info-chart/info-chart");

var selectorColumns = ".columns";
var timeTransitionForOverlay = 300;
var linkCubicBezierElement = (0, _getElement.getElement)(".js-cubic-bezier");
var linkCubicBezierHref = linkCubicBezierElement.href;
var header = (0, _getElement.getElement)(".header");
var info = (0, _getElement.getElement)(_constants.selectorInfo);
var infoChart = (0, _getElement.getElement)(_constants.selectorInfoChart);
var columns = (0, _getElement.getElement)(selectorColumns);
var overlayOffsetVertical = 30;
var overlayOffsetHorizontal = 30;
var openItemId;
window.addEventListener("resize", resizeInfo, false);
info.addEventListener("click", function () {
  requestAnimationFrame(resizeInfo);
});
var chartId = window.location.hash.slice(1);

if (chartId) {
  navigateChart(chartId);
}

window.addEventListener("hashchange", function () {
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  }

  (0, _forNodeList.forNodeList)((0, _getElement.getElementsList)(_constants.selectorDetails), function (item) {
    if (item.hasAttribute("open")) {
      item.removeAttribute("open");
    }
  });
  var id = window.location.hash.slice(1);

  if (id) {
    navigateChart(id);
  } else {
    navigateMain();
  }
}, false);
window.addEventListener("keydown", function (event) {
  var keyName = "escape";

  if (event.key.toLowerCase() === keyName || event.code.toLowerCase() === keyName) {
    window.location.hash = "";
  }
});

function navigateMain() {
  window.scrollTo({
    behavior: "smooth",
    top: 0
  });
  var item = document.getElementById("func-" + openItemId);
  var infoTransitionTime = (0, _getTransitionTime.getTransitionTime)(info);
  openItemId = null;
  columns.removeAttribute("style");
  columns.classList.remove("columns--hide");
  info.classList.remove("info--evident");
  info.style.position = "absolute";
  info.style.top = "0px";
  info.style.left = "0px";
  info.style.right = "0px";
  (0, _overlay.setTransitionDurationOverlay)(timeTransitionForOverlay);
  setTimeout(function () {
    info.removeAttribute("style");
    var itemPosition = (0, _getElementPosition.getElementPosition)(item);
    (0, _overlay.setSizeOverlay)({
      height: itemPosition.height,
      left: itemPosition.x,
      top: itemPosition.y,
      width: itemPosition.width
    });
  }, infoTransitionTime);
  setTimeout(_overlay.resetOverlay, timeTransitionForOverlay + infoTransitionTime);
}

function navigateChart(id) {
  var item = document.getElementById("func-" + id);

  if (!item || openItemId === id) {
    return;
  }

  (0, _card.clearTransition)();
  openItemId = id;
  var name = item.getAttribute("data-name");
  var func = item.getAttribute("data-func");
  var maths = item.getAttribute("data-maths");
  var itemOffset = item.getAttribute("data-offset");
  var transitionTimingFunction = func === _constants.noTimingFunction ? "ease" : func;

  if (name && func) {
    var infoCurve = (0, _getElement.getElement)(".info-chart__curve", info);
    var itemCurve = (0, _getElement.getElement)(".chart__curve", item);
    var infoCurvePath = infoCurve ? (0, _getElement.getElement)("path", infoCurve) : null;

    if (!infoCurve || !itemCurve || !infoCurvePath) {
      return;
    }

    var columnsTransitionTime = (0, _getTransitionTime.getTransitionTime)(columns);

    if (itemOffset === "top") {
      infoChart.classList.add(_constants.infoChartOffsetTopClassName);
    } else {
      infoChart.classList.remove(_constants.infoChartOffsetTopClassName);
    }

    (0, _info.setInfoName)(name);
    (0, _info.setInfoFunc)(func);
    (0, _info.setInfoMaths)(maths);
    (0, _card.setFuncForCard)(func, name);
    (0, _infoChart.setTransitionForInfoChartCursor)(func, name);

    if (func !== _constants.noTimingFunction) {
      var points = (0, _parseStringOfFourNumbers.parseStringOfFourNumbers)(func);
      linkCubicBezierElement.href = linkCubicBezierHref + "#" + points.join(",");
      (0, _info.showSimpleInfo)();
      (0, _gradient.setGradient)(name, points);
    } else {
      (0, _info.showComplexInfo)(name);
      (0, _gradient.hideGradient)();
    }

    infoCurvePath.setAttribute("d", itemCurve.getAttribute("d"));
    info.style.transitionTimingFunction = transitionTimingFunction;
    info.style.display = "block";
    requestAnimationFrame(function () {
      var itemPosition = (0, _getElementPosition.getElementPosition)(item);
      (0, _overlay.setTransitionDurationOverlay)(timeTransitionForOverlay);
      (0, _overlay.showOverlay)();
      (0, _overlay.setSizeOverlay)({
        height: itemPosition.height,
        left: itemPosition.x,
        top: itemPosition.y,
        width: itemPosition.width
      });
      columns.classList.add("columns--hide");
      requestAnimationFrame(function () {
        var infoPosition = (0, _getElementPosition.getElementPosition)(info);
        (0, _overlay.setSizeOverlay)({
          height: infoPosition.height + overlayOffsetVertical,
          left: infoPosition.x - overlayOffsetHorizontal / 2,
          top: infoPosition.y - overlayOffsetVertical / 2,
          width: infoPosition.width + overlayOffsetHorizontal
        });
        var headerPosition = (0, _getElementPosition.getElementPosition)(header);
        var topOffset = headerPosition.height + headerPosition.y - overlayOffsetVertical / 2;
        requestAnimationFrame(function () {
          window.scrollTo({
            behavior: "smooth",
            top: topOffset
          });
        });
      });
    });
    setTimeout(function () {
      info.classList.add("info--evident");
    }, timeTransitionForOverlay);
    setTimeout(function () {
      columns.style.display = "none";
    }, timeTransitionForOverlay + columnsTransitionTime);
  }
}

function resizeInfo() {
  if (!openItemId) {
    return;
  }

  var infoPosition = (0, _getElementPosition.getElementPosition)(info);
  (0, _overlay.setTransitionDurationOverlay)(0);
  (0, _overlay.setSizeOverlay)({
    height: infoPosition.height + overlayOffsetVertical,
    left: infoPosition.x - overlayOffsetHorizontal / 2,
    top: infoPosition.y - overlayOffsetVertical / 2,
    width: infoPosition.width + overlayOffsetHorizontal
  });
}
},{"../card/card":"card/card.ts","../helpers/getTransitionTime":"helpers/getTransitionTime.ts","../helpers/getElementPosition":"helpers/getElementPosition.ts","../helpers/parseStringOfFourNumbers":"helpers/parseStringOfFourNumbers.ts","../helpers/constants":"helpers/constants.ts","../helpers/forNodeList":"helpers/forNodeList.ts","../helpers/getElement":"helpers/getElement.ts","../info/info":"info/info.ts","../overlay/overlay":"overlay/overlay.ts","../gradient/gradient":"gradient/gradient.ts","../info-chart/info-chart":"info-chart/info-chart.ts"}],"function/function.ts":[function(require,module,exports) {
"use strict";

var _getElement = require("../helpers/getElement");

var _forNodeList = require("../helpers/forNodeList");

var listFunction = (0, _getElement.getElementsList)(".function");
var classFunctionActive = "function--active";
var classFunctionFocus = "function--focus";
var classChartActive = "chart--active";
var selectorChart = ".function__chart";
var selectorCursor = ".chart__cursor";
var cursorTransitionTime = 1500;

if (listFunction) {
  (0, _forNodeList.forNodeList)(listFunction, function (item, index) {
    var chart = (0, _getElement.getElement)(selectorChart, item);
    var cursor = (0, _getElement.getElement)(selectorCursor, item);
    var animationName = item.getAttribute("data-name");
    var cssFunc = item.getAttribute("data-func");
    item.addEventListener("mouseenter", function () {
      (0, _forNodeList.forNodeList)(listFunction, function (other, otherIndex) {
        if (otherIndex !== index) {
          other.classList.remove(classFunctionFocus);
          (0, _getElement.getElement)(selectorChart, other).classList.remove(classChartActive);
          (0, _getElement.getElement)(selectorCursor, other).style.animation = "";
        }
      });
      item.classList.add(classFunctionActive);
      chart.classList.add(classChartActive);

      if (cssFunc === "no") {
        cursor.style.animation = cursorTransitionTime + "ms cursor-" + animationName + " both 0.2s linear";
      }
    });
    item.addEventListener("mouseleave", function () {
      item.classList.remove(classFunctionActive);
      chart.classList.remove(classChartActive);
      cursor.style.animation = "";
    });
    chart.addEventListener("focus", function () {
      (0, _forNodeList.forNodeList)(listFunction, function (other, otherIndex) {
        if (otherIndex !== index) {
          other.classList.remove(classFunctionFocus);
          (0, _getElement.getElement)(selectorChart, other).classList.remove(classChartActive);
          (0, _getElement.getElement)(selectorCursor, other).style.animation = "";
        }
      });
      chart.classList.add(classChartActive);

      if (cssFunc === "no") {
        cursor.style.animation = cursorTransitionTime + "ms cursor-" + animationName + " both 0.2s linear";
      }
    });
    chart.addEventListener("blur", function () {
      item.classList.remove(classFunctionFocus, classFunctionActive);
      chart.classList.remove(classChartActive);
      cursor.style.animation = "";
    });
    item.addEventListener("keyup", function (event) {
      if (event.key.toLowerCase() === "tab" || event.code.toLowerCase() === "tab") {
        item.classList.add(classFunctionFocus);
      }
    });
    item.addEventListener("keydown", function (event) {
      if (event.key.toLowerCase() === "tab" || event.code.toLowerCase() === "tab") {
        item.classList.remove(classFunctionFocus);
      }
    });
  });
}
},{"../helpers/getElement":"helpers/getElement.ts","../helpers/forNodeList":"helpers/forNodeList.ts"}],"helpers/copyText.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.copyTextFromElement = copyTextFromElement;

function copyTextFromElement(element) {
  var selection = document.createRange();
  selection.selectNode(element);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(selection);
  document.execCommand("copy");
  window.getSelection().removeAllRanges();
}
},{}],"example-copy/example-copy.ts":[function(require,module,exports) {
"use strict";

var _constants = require("../helpers/constants");

var _getElement = require("../helpers/getElement");

var _forNodeList = require("../helpers/forNodeList");

var _copyText = require("../helpers/copyText");

var selectorIconAction = ".example-copy__icon-action";
var selectorIconDone = ".example-copy__icon-done";
var classIconHidden = "example-copy__icon-hidden";
var list = (0, _getElement.getElementsList)(_constants.selectorCopyButton);
(0, _forNodeList.forNodeList)(list, function (item) {
  item.addEventListener("click", function () {
    var code = (0, _getElement.getElement)(_constants.selectorCopyCode, item.parentElement);
    (0, _copyText.copyTextFromElement)(code);
    var iconAction = (0, _getElement.getElement)(selectorIconAction, item);
    var iconDone = (0, _getElement.getElement)(selectorIconDone, item);
    iconAction.classList.add(classIconHidden);
    iconDone.classList.remove(classIconHidden);
    setTimeout(function () {
      iconAction.classList.remove(classIconHidden);
      iconDone.classList.add(classIconHidden);
    }, 1500);
  });
});
},{"../helpers/constants":"helpers/constants.ts","../helpers/getElement":"helpers/getElement.ts","../helpers/forNodeList":"helpers/forNodeList.ts","../helpers/copyText":"helpers/copyText.ts"}],"footer/footer.ts":[function(require,module,exports) {
"use strict";

var _getElement = require("../helpers/getElement");

var selectorFooterLang = ".footer__lang";
var selectorLangList = selectorFooterLang + " ul";
var selectorLangItem = selectorFooterLang + " li";
var footerLangList = (0, _getElement.getElement)(selectorLangList);
var footerLang = (0, _getElement.getElement)(selectorFooterLang);

if (footerLangList && footerLang) {
  var footerListItems = (0, _getElement.getElementsList)(selectorLangItem + " a, " + selectorLangItem + " span");
  var selectElement_1 = document.createElement("select");
  selectElement_1.onchange = changeLang;
  var label = footerLangList.getAttribute("aria-label") || "";
  selectElement_1.setAttribute("aria-label", label);
  footerListItems.forEach(function (langLink) {
    var option = document.createElement("option");
    var linkHref = langLink.getAttribute("href");
    option.value = linkHref || window.location.pathname;
    option.innerText = langLink.innerText;

    if (langLink.tagName === "SPAN") {
      option.setAttribute("selected", "selected");
    }

    selectElement_1.appendChild(option);
  });
  footerLang.appendChild(selectElement_1);
  footerLang.removeChild((0, _getElement.getElement)(selectorFooterLang + " ul"));
}

function changeLang(event) {
  if (/^\/easings.net/.test(window.location.pathname)) {
    window.location.pathname = "/easings.net" + event.target.value;
  } else {
    window.location.pathname = event.target.value;
  }
}
},{"../helpers/getElement":"helpers/getElement.ts"}],"theme/theme.ts":[function(require,module,exports) {
"use strict";

var _getElement = require("../helpers/getElement");

var selectorThemeSelect = ".footer__theme";
var themeSelect = (0, _getElement.getElement)(selectorThemeSelect);
var classLightTheme = "is-light";
var classDarkTheme = "is-dark";
var storageThemeKey = "theme";

if (typeof localStorage.getItem(storageThemeKey) === "string") {
  var theme = localStorage.getItem(storageThemeKey);
  themeSelect.value = theme;
  changeTheme(theme);
}

themeSelect.addEventListener("change", function () {
  localStorage.setItem(storageThemeKey, themeSelect.value);
  changeTheme(themeSelect.value);
});

function changeTheme(value) {
  switch (value) {
    case "light":
      document.documentElement.classList.remove(classDarkTheme);
      document.documentElement.classList.add(classLightTheme);
      break;

    case "dark":
      document.documentElement.classList.remove(classLightTheme);
      document.documentElement.classList.add(classDarkTheme);
      break;

    default:
      document.documentElement.classList.remove(classLightTheme, classDarkTheme);
  }
}
},{"../helpers/getElement":"helpers/getElement.ts"}],"index.ts":[function(require,module,exports) {
"use strict";

require("focus-visible");

require("./navigation/navigation");

require("./function/function");

require("./example-copy/example-copy");

require("./footer/footer");

require("./theme/theme");
},{"focus-visible":"../node_modules/focus-visible/dist/focus-visible.js","./navigation/navigation":"navigation/navigation.ts","./function/function":"function/function.ts","./example-copy/example-copy":"example-copy/example-copy.ts","./footer/footer":"footer/footer.ts","./theme/theme":"theme/theme.ts"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "53183" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","index.ts"], null)
//# sourceMappingURL=/src.77de5100.js.map