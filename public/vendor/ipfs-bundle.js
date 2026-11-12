var LocalIPFS = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name3 in all)
      __defProp(target, name3, { get: all[name3], enumerable: true });
  };
  var __copyProps = (to, from7, except, desc) => {
    if (from7 && typeof from7 === "object" || typeof from7 === "function") {
      for (let key of __getOwnPropNames(from7))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from7[key], enumerable: !(desc = __getOwnPropDesc(from7, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/varint/encode.js
  var require_encode = __commonJS({
    "node_modules/varint/encode.js"(exports, module) {
      module.exports = encode17;
      var MSB6 = 128;
      var REST6 = 127;
      var MSBALL5 = ~REST6;
      var INT5 = Math.pow(2, 31);
      function encode17(num, out, offset) {
        if (Number.MAX_SAFE_INTEGER && num > Number.MAX_SAFE_INTEGER) {
          encode17.bytes = 0;
          throw new RangeError("Could not encode varint");
        }
        out = out || [];
        offset = offset || 0;
        var oldOffset = offset;
        while (num >= INT5) {
          out[offset++] = num & 255 | MSB6;
          num /= 128;
        }
        while (num & MSBALL5) {
          out[offset++] = num & 255 | MSB6;
          num >>>= 7;
        }
        out[offset] = num | 0;
        encode17.bytes = offset - oldOffset + 1;
        return out;
      }
    }
  });

  // node_modules/varint/decode.js
  var require_decode = __commonJS({
    "node_modules/varint/decode.js"(exports, module) {
      module.exports = read6;
      var MSB6 = 128;
      var REST6 = 127;
      function read6(buf, offset) {
        var res = 0, offset = offset || 0, shift = 0, counter = offset, b, l = buf.length;
        do {
          if (counter >= l || shift > 49) {
            read6.bytes = 0;
            throw new RangeError("Could not decode varint");
          }
          b = buf[counter++];
          res += shift < 28 ? (b & REST6) << shift : (b & REST6) * Math.pow(2, shift);
          shift += 7;
        } while (b >= MSB6);
        read6.bytes = counter - offset;
        return res;
      }
    }
  });

  // node_modules/varint/length.js
  var require_length = __commonJS({
    "node_modules/varint/length.js"(exports, module) {
      var N16 = Math.pow(2, 7);
      var N26 = Math.pow(2, 14);
      var N36 = Math.pow(2, 21);
      var N46 = Math.pow(2, 28);
      var N56 = Math.pow(2, 35);
      var N66 = Math.pow(2, 42);
      var N76 = Math.pow(2, 49);
      var N85 = Math.pow(2, 56);
      var N95 = Math.pow(2, 63);
      module.exports = function(value) {
        return value < N16 ? 1 : value < N26 ? 2 : value < N36 ? 3 : value < N46 ? 4 : value < N56 ? 5 : value < N66 ? 6 : value < N76 ? 7 : value < N85 ? 8 : value < N95 ? 9 : 10;
      };
    }
  });

  // node_modules/varint/index.js
  var require_varint = __commonJS({
    "node_modules/varint/index.js"(exports, module) {
      module.exports = {
        encode: require_encode(),
        decode: require_decode(),
        encodingLength: require_length()
      };
    }
  });

  // node_modules/sparse-array/index.js
  var require_sparse_array = __commonJS({
    "node_modules/sparse-array/index.js"(exports, module) {
      "use strict";
      var BITS_PER_BYTE = 7;
      module.exports = class SparseArray {
        constructor() {
          this._bitArrays = [];
          this._data = [];
          this._length = 0;
          this._changedLength = false;
          this._changedData = false;
        }
        set(index, value) {
          let pos = this._internalPositionFor(index, false);
          if (value === void 0) {
            if (pos !== -1) {
              this._unsetInternalPos(pos);
              this._unsetBit(index);
              this._changedLength = true;
              this._changedData = true;
            }
          } else {
            let needsSort = false;
            if (pos === -1) {
              pos = this._data.length;
              this._setBit(index);
              this._changedData = true;
            } else {
              needsSort = true;
            }
            this._setInternalPos(pos, index, value, needsSort);
            this._changedLength = true;
          }
        }
        unset(index) {
          this.set(index, void 0);
        }
        get(index) {
          this._sortData();
          const pos = this._internalPositionFor(index, true);
          if (pos === -1) {
            return void 0;
          }
          return this._data[pos][1];
        }
        push(value) {
          this.set(this.length, value);
          return this.length;
        }
        get length() {
          this._sortData();
          if (this._changedLength) {
            const last2 = this._data[this._data.length - 1];
            this._length = last2 ? last2[0] + 1 : 0;
            this._changedLength = false;
          }
          return this._length;
        }
        forEach(iterator) {
          let i = 0;
          while (i < this.length) {
            iterator(this.get(i), i, this);
            i++;
          }
        }
        map(iterator) {
          let i = 0;
          let mapped = new Array(this.length);
          while (i < this.length) {
            mapped[i] = iterator(this.get(i), i, this);
            i++;
          }
          return mapped;
        }
        reduce(reducer, initialValue) {
          let i = 0;
          let acc = initialValue;
          while (i < this.length) {
            const value = this.get(i);
            acc = reducer(acc, value, i);
            i++;
          }
          return acc;
        }
        find(finder) {
          let i = 0, found, last2;
          while (i < this.length && !found) {
            last2 = this.get(i);
            found = finder(last2);
            i++;
          }
          return found ? last2 : void 0;
        }
        _internalPositionFor(index, noCreate) {
          const bytePos = this._bytePosFor(index, noCreate);
          if (bytePos >= this._bitArrays.length) {
            return -1;
          }
          const byte = this._bitArrays[bytePos];
          const bitPos = index - bytePos * BITS_PER_BYTE;
          const exists2 = (byte & 1 << bitPos) > 0;
          if (!exists2) {
            return -1;
          }
          const previousPopCount = this._bitArrays.slice(0, bytePos).reduce(popCountReduce, 0);
          const mask = ~(4294967295 << bitPos + 1);
          const bytePopCount = popCount(byte & mask);
          const arrayPos = previousPopCount + bytePopCount - 1;
          return arrayPos;
        }
        _bytePosFor(index, noCreate) {
          const bytePos = Math.floor(index / BITS_PER_BYTE);
          const targetLength = bytePos + 1;
          while (!noCreate && this._bitArrays.length < targetLength) {
            this._bitArrays.push(0);
          }
          return bytePos;
        }
        _setBit(index) {
          const bytePos = this._bytePosFor(index, false);
          this._bitArrays[bytePos] |= 1 << index - bytePos * BITS_PER_BYTE;
        }
        _unsetBit(index) {
          const bytePos = this._bytePosFor(index, false);
          this._bitArrays[bytePos] &= ~(1 << index - bytePos * BITS_PER_BYTE);
        }
        _setInternalPos(pos, index, value, needsSort) {
          const data = this._data;
          const elem = [index, value];
          if (needsSort) {
            this._sortData();
            data[pos] = elem;
          } else {
            if (data.length) {
              if (data[data.length - 1][0] >= index) {
                data.push(elem);
              } else if (data[0][0] <= index) {
                data.unshift(elem);
              } else {
                const randomIndex = Math.round(data.length / 2);
                this._data = data.slice(0, randomIndex).concat(elem).concat(data.slice(randomIndex));
              }
            } else {
              this._data.push(elem);
            }
            this._changedData = true;
            this._changedLength = true;
          }
        }
        _unsetInternalPos(pos) {
          this._data.splice(pos, 1);
        }
        _sortData() {
          if (this._changedData) {
            this._data.sort(sortInternal);
          }
          this._changedData = false;
        }
        bitField() {
          const bytes = [];
          let pendingBitsForResultingByte = 8;
          let pendingBitsForNewByte = 0;
          let resultingByte = 0;
          let newByte;
          const pending = this._bitArrays.slice();
          while (pending.length || pendingBitsForNewByte) {
            if (pendingBitsForNewByte === 0) {
              newByte = pending.shift();
              pendingBitsForNewByte = 7;
            }
            const usingBits = Math.min(pendingBitsForNewByte, pendingBitsForResultingByte);
            const mask = ~(255 << usingBits);
            const masked = newByte & mask;
            resultingByte |= masked << 8 - pendingBitsForResultingByte;
            newByte = newByte >>> usingBits;
            pendingBitsForNewByte -= usingBits;
            pendingBitsForResultingByte -= usingBits;
            if (!pendingBitsForResultingByte || !pendingBitsForNewByte && !pending.length) {
              bytes.push(resultingByte);
              resultingByte = 0;
              pendingBitsForResultingByte = 8;
            }
          }
          for (var i = bytes.length - 1; i > 0; i--) {
            const value = bytes[i];
            if (value === 0) {
              bytes.pop();
            } else {
              break;
            }
          }
          return bytes;
        }
        compactArray() {
          this._sortData();
          return this._data.map(valueOnly);
        }
      };
      function popCountReduce(count, byte) {
        return count + popCount(byte);
      }
      function popCount(_v) {
        let v = _v;
        v = v - (v >> 1 & 1431655765);
        v = (v & 858993459) + (v >> 2 & 858993459);
        return (v + (v >> 4) & 252645135) * 16843009 >> 24;
      }
      function sortInternal(a, b) {
        return a[0] - b[0];
      }
      function valueOnly(elem) {
        return elem[1];
      }
    }
  });

  // node_modules/eventemitter3/index.js
  var require_eventemitter3 = __commonJS({
    "node_modules/eventemitter3/index.js"(exports, module) {
      "use strict";
      var has = Object.prototype.hasOwnProperty;
      var prefix = "~";
      function Events() {
      }
      if (Object.create) {
        Events.prototype = /* @__PURE__ */ Object.create(null);
        if (!new Events().__proto__) prefix = false;
      }
      function EE(fn, context, once) {
        this.fn = fn;
        this.context = context;
        this.once = once || false;
      }
      function addListener(emitter, event, fn, context, once) {
        if (typeof fn !== "function") {
          throw new TypeError("The listener must be a function");
        }
        var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
        if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
        else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
        else emitter._events[evt] = [emitter._events[evt], listener];
        return emitter;
      }
      function clearEvent(emitter, evt) {
        if (--emitter._eventsCount === 0) emitter._events = new Events();
        else delete emitter._events[evt];
      }
      function EventEmitter2() {
        this._events = new Events();
        this._eventsCount = 0;
      }
      EventEmitter2.prototype.eventNames = function eventNames() {
        var names = [], events, name3;
        if (this._eventsCount === 0) return names;
        for (name3 in events = this._events) {
          if (has.call(events, name3)) names.push(prefix ? name3.slice(1) : name3);
        }
        if (Object.getOwnPropertySymbols) {
          return names.concat(Object.getOwnPropertySymbols(events));
        }
        return names;
      };
      EventEmitter2.prototype.listeners = function listeners(event) {
        var evt = prefix ? prefix + event : event, handlers = this._events[evt];
        if (!handlers) return [];
        if (handlers.fn) return [handlers.fn];
        for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
          ee[i] = handlers[i].fn;
        }
        return ee;
      };
      EventEmitter2.prototype.listenerCount = function listenerCount(event) {
        var evt = prefix ? prefix + event : event, listeners = this._events[evt];
        if (!listeners) return 0;
        if (listeners.fn) return 1;
        return listeners.length;
      };
      EventEmitter2.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
        var evt = prefix ? prefix + event : event;
        if (!this._events[evt]) return false;
        var listeners = this._events[evt], len = arguments.length, args, i;
        if (listeners.fn) {
          if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
          switch (len) {
            case 1:
              return listeners.fn.call(listeners.context), true;
            case 2:
              return listeners.fn.call(listeners.context, a1), true;
            case 3:
              return listeners.fn.call(listeners.context, a1, a2), true;
            case 4:
              return listeners.fn.call(listeners.context, a1, a2, a3), true;
            case 5:
              return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
            case 6:
              return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
          }
          for (i = 1, args = new Array(len - 1); i < len; i++) {
            args[i - 1] = arguments[i];
          }
          listeners.fn.apply(listeners.context, args);
        } else {
          var length6 = listeners.length, j;
          for (i = 0; i < length6; i++) {
            if (listeners[i].once) this.removeListener(event, listeners[i].fn, void 0, true);
            switch (len) {
              case 1:
                listeners[i].fn.call(listeners[i].context);
                break;
              case 2:
                listeners[i].fn.call(listeners[i].context, a1);
                break;
              case 3:
                listeners[i].fn.call(listeners[i].context, a1, a2);
                break;
              case 4:
                listeners[i].fn.call(listeners[i].context, a1, a2, a3);
                break;
              default:
                if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
                  args[j - 1] = arguments[j];
                }
                listeners[i].fn.apply(listeners[i].context, args);
            }
          }
        }
        return true;
      };
      EventEmitter2.prototype.on = function on(event, fn, context) {
        return addListener(this, event, fn, context, false);
      };
      EventEmitter2.prototype.once = function once(event, fn, context) {
        return addListener(this, event, fn, context, true);
      };
      EventEmitter2.prototype.removeListener = function removeListener(event, fn, context, once) {
        var evt = prefix ? prefix + event : event;
        if (!this._events[evt]) return this;
        if (!fn) {
          clearEvent(this, evt);
          return this;
        }
        var listeners = this._events[evt];
        if (listeners.fn) {
          if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
            clearEvent(this, evt);
          }
        } else {
          for (var i = 0, events = [], length6 = listeners.length; i < length6; i++) {
            if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
              events.push(listeners[i]);
            }
          }
          if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
          else clearEvent(this, evt);
        }
        return this;
      };
      EventEmitter2.prototype.removeAllListeners = function removeAllListeners(event) {
        var evt;
        if (event) {
          evt = prefix ? prefix + event : event;
          if (this._events[evt]) clearEvent(this, evt);
        } else {
          this._events = new Events();
          this._eventsCount = 0;
        }
        return this;
      };
      EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
      EventEmitter2.prototype.addListener = EventEmitter2.prototype.on;
      EventEmitter2.prefixed = prefix;
      EventEmitter2.EventEmitter = EventEmitter2;
      if ("undefined" !== typeof module) {
        module.exports = EventEmitter2;
      }
    }
  });

  // <stdin>
  var stdin_exports = {};
  __export(stdin_exports, {
    CID: () => CID,
    CarReader: () => CarReader,
    exporter: () => exporter,
    sha256: () => sha256
  });

  // node_modules/@ipld/dag-cbor/node_modules/cborg/lib/is.js
  var objectTypeNames = [
    "Object",
    // for Object.create(null) and other non-plain objects
    "RegExp",
    "Date",
    "Error",
    "Map",
    "Set",
    "WeakMap",
    "WeakSet",
    "ArrayBuffer",
    "SharedArrayBuffer",
    "DataView",
    "Promise",
    "URL",
    "HTMLElement",
    "Int8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Uint16Array",
    "Int32Array",
    "Uint32Array",
    "Float32Array",
    "Float64Array",
    "BigInt64Array",
    "BigUint64Array",
    "Tagged"
  ];
  function is(value) {
    if (value === null) {
      return "null";
    }
    if (value === void 0) {
      return "undefined";
    }
    if (value === true || value === false) {
      return "boolean";
    }
    const typeOf = typeof value;
    if (typeOf === "string" || typeOf === "number" || typeOf === "bigint" || typeOf === "symbol") {
      return typeOf;
    }
    if (typeOf === "function") {
      return "Function";
    }
    if (Array.isArray(value)) {
      return "Array";
    }
    if (value instanceof Uint8Array) {
      return "Uint8Array";
    }
    if (value.constructor === Object) {
      return "Object";
    }
    const objectType = getObjectType(value);
    if (objectType) {
      return objectType;
    }
    return "Object";
  }
  function getObjectType(value) {
    const objectTypeName = Object.prototype.toString.call(value).slice(8, -1);
    if (objectTypeNames.includes(objectTypeName)) {
      return objectTypeName;
    }
    return void 0;
  }

  // node_modules/@ipld/dag-cbor/node_modules/cborg/lib/token.js
  var Type = class {
    /**
     * @param {number} major
     * @param {string} name
     * @param {boolean} terminal
     */
    constructor(major, name3, terminal) {
      this.major = major;
      this.majorEncoded = major << 5;
      this.name = name3;
      this.terminal = terminal;
    }
    toString() {
      return `Type[${this.major}].${this.name}`;
    }
    /**
     * @param {Type} typ
     * @returns {number}
     */
    compare(typ) {
      return this.major < typ.major ? -1 : this.major > typ.major ? 1 : 0;
    }
    /**
     * Check equality between two Type instances. Safe to use across different
     * copies of the Type class (e.g., when bundlers duplicate the module).
     * (major, name) uniquely identifies a Type; terminal is implied by these.
     * @param {Type} a
     * @param {Type} b
     * @returns {boolean}
     */
    static equals(a, b) {
      return a === b || a.major === b.major && a.name === b.name;
    }
  };
  Type.uint = new Type(0, "uint", true);
  Type.negint = new Type(1, "negint", true);
  Type.bytes = new Type(2, "bytes", true);
  Type.string = new Type(3, "string", true);
  Type.array = new Type(4, "array", false);
  Type.map = new Type(5, "map", false);
  Type.tag = new Type(6, "tag", false);
  Type.float = new Type(7, "float", true);
  Type.false = new Type(7, "false", true);
  Type.true = new Type(7, "true", true);
  Type.null = new Type(7, "null", true);
  Type.undefined = new Type(7, "undefined", true);
  Type.break = new Type(7, "break", true);
  var Token = class {
    /**
     * @param {Type} type
     * @param {any} [value]
     * @param {number} [encodedLength]
     */
    constructor(type, value, encodedLength) {
      this.type = type;
      this.value = value;
      this.encodedLength = encodedLength;
      this.encodedBytes = void 0;
      this.byteValue = void 0;
    }
    toString() {
      return `Token[${this.type}].${this.value}`;
    }
  };

  // node_modules/@ipld/dag-cbor/node_modules/cborg/lib/byte-utils.js
  var useBuffer = globalThis.process && // @ts-ignore
  !globalThis.process.browser && // @ts-ignore
  globalThis.Buffer && // @ts-ignore
  typeof globalThis.Buffer.isBuffer === "function";
  var textEncoder = new TextEncoder();
  function isBuffer(buf) {
    return useBuffer && globalThis.Buffer.isBuffer(buf);
  }
  function asU8A(buf) {
    if (!(buf instanceof Uint8Array)) {
      return Uint8Array.from(buf);
    }
    return isBuffer(buf) ? new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength) : buf;
  }
  var FROM_STRING_THRESHOLD_BUFFER = 24;
  var FROM_STRING_THRESHOLD_TEXTENCODER = 200;
  var fromString = useBuffer ? (
    // eslint-disable-line operator-linebreak
    /**
     * @param {string} string
     */
    (string3) => {
      return string3.length >= FROM_STRING_THRESHOLD_BUFFER ? (
        // eslint-disable-line operator-linebreak
        // @ts-ignore
        globalThis.Buffer.from(string3)
      ) : utf8ToBytes(string3);
    }
  ) : (
    // eslint-disable-line operator-linebreak
    /**
     * @param {string} string
     */
    (string3) => {
      return string3.length >= FROM_STRING_THRESHOLD_TEXTENCODER ? textEncoder.encode(string3) : utf8ToBytes(string3);
    }
  );
  var fromArray = (arr) => {
    return Uint8Array.from(arr);
  };
  var slice = useBuffer ? (
    // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array} bytes
     * @param {number} start
     * @param {number} end
     */
    // Buffer.slice() returns a view, not a copy, so we need special handling
    (bytes, start, end) => {
      if (isBuffer(bytes)) {
        return new Uint8Array(bytes.subarray(start, end));
      }
      return bytes.slice(start, end);
    }
  ) : (
    // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array} bytes
     * @param {number} start
     * @param {number} end
     */
    (bytes, start, end) => {
      return bytes.slice(start, end);
    }
  );
  var concat = useBuffer ? (
    // eslint-disable-line operator-linebreak
    /**
     * @param {ByteView[]} chunks
     * @param {number} length
     * @returns {AllocatedByteView}
     */
    (chunks, length6) => {
      chunks = chunks.map((c) => c instanceof Uint8Array ? c : (
        // eslint-disable-line operator-linebreak
        // @ts-ignore
        globalThis.Buffer.from(c)
      ));
      return (
        /** @type {AllocatedByteView} */
        asU8A(globalThis.Buffer.concat(chunks, length6))
      );
    }
  ) : (
    // eslint-disable-line operator-linebreak
    /**
     * @param {ByteView[]} chunks
     * @param {number} length
     * @returns {AllocatedByteView}
     */
    (chunks, length6) => {
      const out = new Uint8Array(length6);
      let off = 0;
      for (let b of chunks) {
        if (off + b.length > out.length) {
          b = b.subarray(0, out.length - off);
        }
        out.set(b, off);
        off += b.length;
      }
      return out;
    }
  );
  var alloc = useBuffer ? (
    // eslint-disable-line operator-linebreak
    /**
     * @param {number} size
     * @returns {AllocatedByteView}
     */
    (size) => {
      return globalThis.Buffer.allocUnsafe(size);
    }
  ) : (
    // eslint-disable-line operator-linebreak
    /**
     * @param {number} size
     * @returns {AllocatedByteView}
     */
    (size) => {
      return new Uint8Array(size);
    }
  );
  function compare(b1, b2) {
    if (isBuffer(b1) && isBuffer(b2)) {
      return b1.compare(b2);
    }
    for (let i = 0; i < b1.length; i++) {
      if (b1[i] === b2[i]) {
        continue;
      }
      return b1[i] < b2[i] ? -1 : 1;
    }
    return 0;
  }
  function utf8ToBytes(str) {
    const out = [];
    let p = 0;
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 128) {
        out[p++] = c;
      } else if (c < 2048) {
        out[p++] = c >> 6 | 192;
        out[p++] = c & 63 | 128;
      } else if ((c & 64512) === 55296 && i + 1 < str.length && (str.charCodeAt(i + 1) & 64512) === 56320) {
        c = 65536 + ((c & 1023) << 10) + (str.charCodeAt(++i) & 1023);
        out[p++] = c >> 18 | 240;
        out[p++] = c >> 12 & 63 | 128;
        out[p++] = c >> 6 & 63 | 128;
        out[p++] = c & 63 | 128;
      } else {
        if (c >= 55296 && c <= 57343) {
          c = 65533;
        }
        out[p++] = c >> 12 | 224;
        out[p++] = c >> 6 & 63 | 128;
        out[p++] = c & 63 | 128;
      }
    }
    return out;
  }

  // node_modules/@ipld/dag-cbor/node_modules/cborg/lib/bl.js
  var defaultChunkSize = 256;
  var Bl = class {
    /**
     * @param {number} [chunkSize]
     */
    constructor(chunkSize = defaultChunkSize) {
      this.chunkSize = chunkSize;
      this.cursor = 0;
      this.maxCursor = -1;
      this.chunks = [];
      this._initReuseChunk = null;
    }
    reset() {
      this.cursor = 0;
      this.maxCursor = -1;
      if (this.chunks.length) {
        this.chunks = [];
      }
      if (this._initReuseChunk !== null) {
        this.chunks.push(this._initReuseChunk);
        this.maxCursor = this._initReuseChunk.length - 1;
      }
    }
    /**
     * @param {ByteView|number[]} bytes
     */
    push(bytes) {
      let topChunk = this.chunks[this.chunks.length - 1];
      const newMax = this.cursor + bytes.length;
      if (newMax <= this.maxCursor + 1) {
        const chunkPos = topChunk.length - (this.maxCursor - this.cursor) - 1;
        topChunk.set(bytes, chunkPos);
      } else {
        if (topChunk) {
          const chunkPos = topChunk.length - (this.maxCursor - this.cursor) - 1;
          if (chunkPos < topChunk.length) {
            this.chunks[this.chunks.length - 1] = topChunk.subarray(0, chunkPos);
            this.maxCursor = this.cursor - 1;
          }
        }
        if (bytes.length < 64 && bytes.length < this.chunkSize) {
          topChunk = alloc(this.chunkSize);
          this.chunks.push(topChunk);
          this.maxCursor += topChunk.length;
          if (this._initReuseChunk === null) {
            this._initReuseChunk = topChunk;
          }
          topChunk.set(bytes, 0);
        } else {
          this.chunks.push(bytes);
          this.maxCursor += bytes.length;
        }
      }
      this.cursor += bytes.length;
    }
    /**
     * @param {boolean} [reset]
     * @returns {AllocatedByteView}
     */
    toBytes(reset = false) {
      let byts;
      if (this.chunks.length === 1) {
        const chunk = this.chunks[0];
        if (reset && this.cursor > chunk.length / 2) {
          byts = this.cursor === chunk.length ? chunk : chunk.subarray(0, this.cursor);
          this._initReuseChunk = null;
          this.chunks = [];
        } else {
          byts = slice(chunk, 0, this.cursor);
        }
      } else {
        byts = concat(this.chunks, this.cursor);
      }
      if (reset) {
        this.reset();
      }
      return byts;
    }
  };
  var U8Bl = class {
    /**
     * @param {Uint8Array<T>} dest
     */
    constructor(dest) {
      this.dest = dest;
      this.cursor = 0;
      this.chunks = [dest];
    }
    reset() {
      this.cursor = 0;
    }
    /**
     * @param {ByteView|number[]} bytes
     */
    push(bytes) {
      if (this.cursor + bytes.length > this.dest.length) {
        throw new Error("write out of bounds, destination buffer is too small");
      }
      this.dest.set(bytes, this.cursor);
      this.cursor += bytes.length;
    }
    /**
     * @param {boolean} [reset]
     * @returns {Uint8Array<T>}
     */
    toBytes(reset = false) {
      const byts = this.dest.subarray(0, this.cursor);
      if (reset) {
        this.reset();
      }
      return byts;
    }
  };

  // node_modules/@ipld/dag-cbor/node_modules/cborg/lib/common.js
  var decodeErrPrefix = "CBOR decode error:";
  var encodeErrPrefix = "CBOR encode error:";
  var uintMinorPrefixBytes = [];
  uintMinorPrefixBytes[23] = 1;
  uintMinorPrefixBytes[24] = 2;
  uintMinorPrefixBytes[25] = 3;
  uintMinorPrefixBytes[26] = 5;
  uintMinorPrefixBytes[27] = 9;
  function assertEnoughData(data, pos, need) {
    if (data.length - pos < need) {
      throw new Error(`${decodeErrPrefix} not enough data for type`);
    }
  }

  // node_modules/@ipld/dag-cbor/node_modules/cborg/lib/0uint.js
  var uintBoundaries = [24, 256, 65536, 4294967296, BigInt("18446744073709551616")];
  function readUint8(data, offset, options) {
    assertEnoughData(data, offset, 1);
    const value = data[offset];
    if (options.strict === true && value < uintBoundaries[0]) {
      throw new Error(`${decodeErrPrefix} integer encoded in more bytes than necessary (strict decode)`);
    }
    return value;
  }
  function readUint16(data, offset, options) {
    assertEnoughData(data, offset, 2);
    const value = data[offset] << 8 | data[offset + 1];
    if (options.strict === true && value < uintBoundaries[1]) {
      throw new Error(`${decodeErrPrefix} integer encoded in more bytes than necessary (strict decode)`);
    }
    return value;
  }
  function readUint32(data, offset, options) {
    assertEnoughData(data, offset, 4);
    const value = data[offset] * 16777216 + (data[offset + 1] << 16) + (data[offset + 2] << 8) + data[offset + 3];
    if (options.strict === true && value < uintBoundaries[2]) {
      throw new Error(`${decodeErrPrefix} integer encoded in more bytes than necessary (strict decode)`);
    }
    return value;
  }
  function readUint64(data, offset, options) {
    assertEnoughData(data, offset, 8);
    const hi = data[offset] * 16777216 + (data[offset + 1] << 16) + (data[offset + 2] << 8) + data[offset + 3];
    const lo = data[offset + 4] * 16777216 + (data[offset + 5] << 16) + (data[offset + 6] << 8) + data[offset + 7];
    const value = (BigInt(hi) << BigInt(32)) + BigInt(lo);
    if (options.strict === true && value < uintBoundaries[3]) {
      throw new Error(`${decodeErrPrefix} integer encoded in more bytes than necessary (strict decode)`);
    }
    if (value <= Number.MAX_SAFE_INTEGER) {
      return Number(value);
    }
    if (options.allowBigInt === true) {
      return value;
    }
    throw new Error(`${decodeErrPrefix} integers outside of the safe integer range are not supported`);
  }
  function decodeUint8(data, pos, _minor, options) {
    return new Token(Type.uint, readUint8(data, pos + 1, options), 2);
  }
  function decodeUint16(data, pos, _minor, options) {
    return new Token(Type.uint, readUint16(data, pos + 1, options), 3);
  }
  function decodeUint32(data, pos, _minor, options) {
    return new Token(Type.uint, readUint32(data, pos + 1, options), 5);
  }
  function decodeUint64(data, pos, _minor, options) {
    return new Token(Type.uint, readUint64(data, pos + 1, options), 9);
  }
  function encodeUint(writer, token) {
    return encodeUintValue(writer, 0, token.value);
  }
  function encodeUintValue(writer, major, uint) {
    if (uint < uintBoundaries[0]) {
      const nuint = Number(uint);
      writer.push([major | nuint]);
    } else if (uint < uintBoundaries[1]) {
      const nuint = Number(uint);
      writer.push([major | 24, nuint]);
    } else if (uint < uintBoundaries[2]) {
      const nuint = Number(uint);
      writer.push([major | 25, nuint >>> 8, nuint & 255]);
    } else if (uint < uintBoundaries[3]) {
      const nuint = Number(uint);
      writer.push([major | 26, nuint >>> 24 & 255, nuint >>> 16 & 255, nuint >>> 8 & 255, nuint & 255]);
    } else {
      const buint = BigInt(uint);
      if (buint < uintBoundaries[4]) {
        const set = [major | 27, 0, 0, 0, 0, 0, 0, 0];
        let lo = Number(buint & BigInt(4294967295));
        let hi = Number(buint >> BigInt(32) & BigInt(4294967295));
        set[8] = lo & 255;
        lo = lo >> 8;
        set[7] = lo & 255;
        lo = lo >> 8;
        set[6] = lo & 255;
        lo = lo >> 8;
        set[5] = lo & 255;
        set[4] = hi & 255;
        hi = hi >> 8;
        set[3] = hi & 255;
        hi = hi >> 8;
        set[2] = hi & 255;
        hi = hi >> 8;
        set[1] = hi & 255;
        writer.push(set);
      } else {
        throw new Error(`${decodeErrPrefix} encountered BigInt larger than allowable range`);
      }
    }
  }
  encodeUint.encodedSize = function encodedSize(token) {
    return encodeUintValue.encodedSize(token.value);
  };
  encodeUintValue.encodedSize = function encodedSize2(uint) {
    if (uint < uintBoundaries[0]) {
      return 1;
    }
    if (uint < uintBoundaries[1]) {
      return 2;
    }
    if (uint < uintBoundaries[2]) {
      return 3;
    }
    if (uint < uintBoundaries[3]) {
      return 5;
    }
    return 9;
  };
  encodeUint.compareTokens = function compareTokens(tok1, tok2) {
    return tok1.value < tok2.value ? -1 : tok1.value > tok2.value ? 1 : 0;
  };

  // node_modules/@ipld/dag-cbor/node_modules/cborg/lib/1negint.js
  function decodeNegint8(data, pos, _minor, options) {
    return new Token(Type.negint, -1 - readUint8(data, pos + 1, options), 2);
  }
  function decodeNegint16(data, pos, _minor, options) {
    return new Token(Type.negint, -1 - readUint16(data, pos + 1, options), 3);
  }
  function decodeNegint32(data, pos, _minor, options) {
    return new Token(Type.negint, -1 - readUint32(data, pos + 1, options), 5);
  }
  var neg1b = BigInt(-1);
  var pos1b = BigInt(1);
  function decodeNegint64(data, pos, _minor, options) {
    const int = readUint64(data, pos + 1, options);
    if (typeof int !== "bigint") {
      const value = -1 - int;
      if (value >= Number.MIN_SAFE_INTEGER) {
        return new Token(Type.negint, value, 9);
      }
    }
    if (options.allowBigInt !== true) {
      throw new Error(`${decodeErrPrefix} integers outside of the safe integer range are not supported`);
    }
    return new Token(Type.negint, neg1b - BigInt(int), 9);
  }
  function encodeNegint(writer, token) {
    const negint = token.value;
    const unsigned = typeof negint === "bigint" ? negint * neg1b - pos1b : negint * -1 - 1;
    encodeUintValue(writer, token.type.majorEncoded, unsigned);
  }
  encodeNegint.encodedSize = function encodedSize3(token) {
    const negint = token.value;
    const unsigned = typeof negint === "bigint" ? negint * neg1b - pos1b : negint * -1 - 1;
    if (unsigned < uintBoundaries[0]) {
      return 1;
    }
    if (unsigned < uintBoundaries[1]) {
      return 2;
    }
    if (unsigned < uintBoundaries[2]) {
      return 3;
    }
    if (unsigned < uintBoundaries[3]) {
      return 5;
    }
    return 9;
  };
  encodeNegint.compareTokens = function compareTokens2(tok1, tok2) {
    return tok1.value < tok2.value ? 1 : tok1.value > tok2.value ? -1 : 0;
  };

  // node_modules/@ipld/dag-cbor/node_modules/cborg/lib/2bytes.js
  function toToken(data, pos, prefix, length6) {
    assertEnoughData(data, pos, prefix + length6);
    const buf = data.slice(pos + prefix, pos + prefix + length6);
    return new Token(Type.bytes, buf, prefix + length6);
  }
  function decodeBytesCompact(data, pos, minor, _options) {
    return toToken(data, pos, 1, minor);
  }
  function decodeBytes8(data, pos, _minor, options) {
    return toToken(data, pos, 2, readUint8(data, pos + 1, options));
  }
  function decodeBytes16(data, pos, _minor, options) {
    return toToken(data, pos, 3, readUint16(data, pos + 1, options));
  }
  function decodeBytes32(data, pos, _minor, options) {
    return toToken(data, pos, 5, readUint32(data, pos + 1, options));
  }
  function decodeBytes64(data, pos, _minor, options) {
    const l = readUint64(data, pos + 1, options);
    if (typeof l === "bigint") {
      throw new Error(`${decodeErrPrefix} 64-bit integer bytes lengths not supported`);
    }
    return toToken(data, pos, 9, l);
  }
  function tokenBytes(token) {
    if (token.encodedBytes === void 0) {
      token.encodedBytes = Type.equals(token.type, Type.string) ? fromString(token.value) : token.value;
    }
    return token.encodedBytes;
  }
  function encodeBytes(writer, token) {
    const bytes = tokenBytes(token);
    encodeUintValue(writer, token.type.majorEncoded, bytes.length);
    writer.push(bytes);
  }
  encodeBytes.encodedSize = function encodedSize4(token) {
    const bytes = tokenBytes(token);
    return encodeUintValue.encodedSize(bytes.length) + bytes.length;
  };
  encodeBytes.compareTokens = function compareTokens3(tok1, tok2) {
    return compareBytes(tokenBytes(tok1), tokenBytes(tok2));
  };
  function compareBytes(b1, b2) {
    return b1.length < b2.length ? -1 : b1.length > b2.length ? 1 : compare(b1, b2);
  }

  // node_modules/@ipld/dag-cbor/node_modules/cborg/lib/3string.js
  var textDecoder = new TextDecoder();
  var ASCII_THRESHOLD = 32;
  function toStr(bytes, start, end) {
    const len = end - start;
    if (len < ASCII_THRESHOLD) {
      let str = "";
      for (let i = start; i < end; i++) {
        const c = bytes[i];
        if (c & 128) {
          return textDecoder.decode(bytes.subarray(start, end));
        }
        str += String.fromCharCode(c);
      }
      return str;
    }
    return textDecoder.decode(bytes.subarray(start, end));
  }
  function toToken2(data, pos, prefix, length6, options) {
    const totLength = prefix + length6;
    assertEnoughData(data, pos, totLength);
    const tok = new Token(Type.string, toStr(data, pos + prefix, pos + totLength), totLength);
    if (options.retainStringBytes === true) {
      tok.byteValue = data.slice(pos + prefix, pos + totLength);
    }
    return tok;
  }
  function decodeStringCompact(data, pos, minor, options) {
    return toToken2(data, pos, 1, minor, options);
  }
  function decodeString8(data, pos, _minor, options) {
    return toToken2(data, pos, 2, readUint8(data, pos + 1, options), options);
  }
  function decodeString16(data, pos, _minor, options) {
    return toToken2(data, pos, 3, readUint16(data, pos + 1, options), options);
  }
  function decodeString32(data, pos, _minor, options) {
    return toToken2(data, pos, 5, readUint32(data, pos + 1, options), options);
  }
  function decodeString64(data, pos, _minor, options) {
    const l = readUint64(data, pos + 1, options);
    if (typeof l === "bigint") {
      throw new Error(`${decodeErrPrefix} 64-bit integer string lengths not supported`);
    }
    return toToken2(data, pos, 9, l, options);
  }
  var encodeString = encodeBytes;

  // node_modules/@ipld/dag-cbor/node_modules/cborg/lib/4array.js
  function toToken3(_data, _pos, prefix, length6) {
    return new Token(Type.array, length6, prefix);
  }
  function decodeArrayCompact(data, pos, minor, _options) {
    return toToken3(data, pos, 1, minor);
  }
  function decodeArray8(data, pos, _minor, options) {
    return toToken3(data, pos, 2, readUint8(data, pos + 1, options));
  }
  function decodeArray16(data, pos, _minor, options) {
    return toToken3(data, pos, 3, readUint16(data, pos + 1, options));
  }
  function decodeArray32(data, pos, _minor, options) {
    return toToken3(data, pos, 5, readUint32(data, pos + 1, options));
  }
  function decodeArray64(data, pos, _minor, options) {
    const l = readUint64(data, pos + 1, options);
    if (typeof l === "bigint") {
      throw new Error(`${decodeErrPrefix} 64-bit integer array lengths not supported`);
    }
    return toToken3(data, pos, 9, l);
  }
  function decodeArrayIndefinite(data, pos, _minor, options) {
    if (options.allowIndefinite === false) {
      throw new Error(`${decodeErrPrefix} indefinite length items not allowed`);
    }
    return toToken3(data, pos, 1, Infinity);
  }
  function encodeArray(writer, token) {
    encodeUintValue(writer, Type.array.majorEncoded, token.value);
  }
  encodeArray.compareTokens = encodeUint.compareTokens;
  encodeArray.encodedSize = function encodedSize5(token) {
    return encodeUintValue.encodedSize(token.value);
  };

  // node_modules/@ipld/dag-cbor/node_modules/cborg/lib/5map.js
  function toToken4(_data, _pos, prefix, length6) {
    return new Token(Type.map, length6, prefix);
  }
  function decodeMapCompact(data, pos, minor, _options) {
    return toToken4(data, pos, 1, minor);
  }
  function decodeMap8(data, pos, _minor, options) {
    return toToken4(data, pos, 2, readUint8(data, pos + 1, options));
  }
  function decodeMap16(data, pos, _minor, options) {
    return toToken4(data, pos, 3, readUint16(data, pos + 1, options));
  }
  function decodeMap32(data, pos, _minor, options) {
    return toToken4(data, pos, 5, readUint32(data, pos + 1, options));
  }
  function decodeMap64(data, pos, _minor, options) {
    const l = readUint64(data, pos + 1, options);
    if (typeof l === "bigint") {
      throw new Error(`${decodeErrPrefix} 64-bit integer map lengths not supported`);
    }
    return toToken4(data, pos, 9, l);
  }
  function decodeMapIndefinite(data, pos, _minor, options) {
    if (options.allowIndefinite === false) {
      throw new Error(`${decodeErrPrefix} indefinite length items not allowed`);
    }
    return toToken4(data, pos, 1, Infinity);
  }
  function encodeMap(writer, token) {
    encodeUintValue(writer, Type.map.majorEncoded, token.value);
  }
  encodeMap.compareTokens = encodeUint.compareTokens;
  encodeMap.encodedSize = function encodedSize6(token) {
    return encodeUintValue.encodedSize(token.value);
  };

  // node_modules/@ipld/dag-cbor/node_modules/cborg/lib/6tag.js
  function decodeTagCompact(_data, _pos, minor, _options) {
    return new Token(Type.tag, minor, 1);
  }
  function decodeTag8(data, pos, _minor, options) {
    return new Token(Type.tag, readUint8(data, pos + 1, options), 2);
  }
  function decodeTag16(data, pos, _minor, options) {
    return new Token(Type.tag, readUint16(data, pos + 1, options), 3);
  }
  function decodeTag32(data, pos, _minor, options) {
    return new Token(Type.tag, readUint32(data, pos + 1, options), 5);
  }
  function decodeTag64(data, pos, _minor, options) {
    return new Token(Type.tag, readUint64(data, pos + 1, options), 9);
  }
  function encodeTag(writer, token) {
    encodeUintValue(writer, Type.tag.majorEncoded, token.value);
  }
  encodeTag.compareTokens = encodeUint.compareTokens;
  encodeTag.encodedSize = function encodedSize7(token) {
    return encodeUintValue.encodedSize(token.value);
  };

  // node_modules/@ipld/dag-cbor/node_modules/cborg/lib/7float.js
  var MINOR_FALSE = 20;
  var MINOR_TRUE = 21;
  var MINOR_NULL = 22;
  var MINOR_UNDEFINED = 23;
  function decodeUndefined(_data, _pos, _minor, options) {
    if (options.allowUndefined === false) {
      throw new Error(`${decodeErrPrefix} undefined values are not supported`);
    } else if (options.coerceUndefinedToNull === true) {
      return new Token(Type.null, null, 1);
    }
    return new Token(Type.undefined, void 0, 1);
  }
  function decodeBreak(_data, _pos, _minor, options) {
    if (options.allowIndefinite === false) {
      throw new Error(`${decodeErrPrefix} indefinite length items not allowed`);
    }
    return new Token(Type.break, void 0, 1);
  }
  function createToken(value, bytes, options) {
    if (options) {
      if (options.allowNaN === false && Number.isNaN(value)) {
        throw new Error(`${decodeErrPrefix} NaN values are not supported`);
      }
      if (options.allowInfinity === false && (value === Infinity || value === -Infinity)) {
        throw new Error(`${decodeErrPrefix} Infinity values are not supported`);
      }
    }
    return new Token(Type.float, value, bytes);
  }
  function decodeFloat16(data, pos, _minor, options) {
    return createToken(readFloat16(data, pos + 1), 3, options);
  }
  function decodeFloat32(data, pos, _minor, options) {
    return createToken(readFloat32(data, pos + 1), 5, options);
  }
  function decodeFloat64(data, pos, _minor, options) {
    return createToken(readFloat64(data, pos + 1), 9, options);
  }
  function encodeFloat(writer, token, options) {
    const float = token.value;
    if (float === false) {
      writer.push([Type.float.majorEncoded | MINOR_FALSE]);
    } else if (float === true) {
      writer.push([Type.float.majorEncoded | MINOR_TRUE]);
    } else if (float === null) {
      writer.push([Type.float.majorEncoded | MINOR_NULL]);
    } else if (float === void 0) {
      writer.push([Type.float.majorEncoded | MINOR_UNDEFINED]);
    } else {
      let decoded;
      let success = false;
      if (!options || options.float64 !== true) {
        encodeFloat16(float);
        decoded = readFloat16(ui8a, 1);
        if (float === decoded || Number.isNaN(float)) {
          ui8a[0] = 249;
          writer.push(ui8a.slice(0, 3));
          success = true;
        } else {
          encodeFloat32(float);
          decoded = readFloat32(ui8a, 1);
          if (float === decoded) {
            ui8a[0] = 250;
            writer.push(ui8a.slice(0, 5));
            success = true;
          }
        }
      }
      if (!success) {
        encodeFloat64(float);
        decoded = readFloat64(ui8a, 1);
        ui8a[0] = 251;
        writer.push(ui8a.slice(0, 9));
      }
    }
  }
  encodeFloat.encodedSize = function encodedSize8(token, options) {
    const float = token.value;
    if (float === false || float === true || float === null || float === void 0) {
      return 1;
    }
    if (!options || options.float64 !== true) {
      encodeFloat16(float);
      let decoded = readFloat16(ui8a, 1);
      if (float === decoded || Number.isNaN(float)) {
        return 3;
      }
      encodeFloat32(float);
      decoded = readFloat32(ui8a, 1);
      if (float === decoded) {
        return 5;
      }
    }
    return 9;
  };
  var buffer = new ArrayBuffer(9);
  var dataView = new DataView(buffer, 1);
  var ui8a = new Uint8Array(buffer, 0);
  function encodeFloat16(inp) {
    if (inp === Infinity) {
      dataView.setUint16(0, 31744, false);
    } else if (inp === -Infinity) {
      dataView.setUint16(0, 64512, false);
    } else if (Number.isNaN(inp)) {
      dataView.setUint16(0, 32256, false);
    } else {
      dataView.setFloat32(0, inp);
      const valu32 = dataView.getUint32(0);
      const exponent = (valu32 & 2139095040) >> 23;
      const mantissa = valu32 & 8388607;
      if (exponent === 255) {
        dataView.setUint16(0, 31744, false);
      } else if (exponent === 0) {
        dataView.setUint16(0, (valu32 & 2147483648) >> 16 | mantissa >> 13, false);
      } else {
        const logicalExponent = exponent - 127;
        if (logicalExponent < -24) {
          dataView.setUint16(0, 0);
        } else if (logicalExponent < -14) {
          dataView.setUint16(0, (valu32 & 2147483648) >> 16 | /* sign bit */
          1 << 24 + logicalExponent, false);
        } else {
          dataView.setUint16(0, (valu32 & 2147483648) >> 16 | logicalExponent + 15 << 10 | mantissa >> 13, false);
        }
      }
    }
  }
  function readFloat16(ui8a4, pos) {
    if (ui8a4.length - pos < 2) {
      throw new Error(`${decodeErrPrefix} not enough data for float16`);
    }
    const half = (ui8a4[pos] << 8) + ui8a4[pos + 1];
    if (half === 31744) {
      return Infinity;
    }
    if (half === 64512) {
      return -Infinity;
    }
    if (half === 32256) {
      return NaN;
    }
    const exp = half >> 10 & 31;
    const mant = half & 1023;
    let val;
    if (exp === 0) {
      val = mant * 2 ** -24;
    } else if (exp !== 31) {
      val = (mant + 1024) * 2 ** (exp - 25);
    } else {
      val = mant === 0 ? Infinity : NaN;
    }
    return half & 32768 ? -val : val;
  }
  function encodeFloat32(inp) {
    dataView.setFloat32(0, inp, false);
  }
  function readFloat32(ui8a4, pos) {
    if (ui8a4.length - pos < 4) {
      throw new Error(`${decodeErrPrefix} not enough data for float32`);
    }
    const offset = (ui8a4.byteOffset || 0) + pos;
    return new DataView(ui8a4.buffer, offset, 4).getFloat32(0, false);
  }
  function encodeFloat64(inp) {
    dataView.setFloat64(0, inp, false);
  }
  function readFloat64(ui8a4, pos) {
    if (ui8a4.length - pos < 8) {
      throw new Error(`${decodeErrPrefix} not enough data for float64`);
    }
    const offset = (ui8a4.byteOffset || 0) + pos;
    return new DataView(ui8a4.buffer, offset, 8).getFloat64(0, false);
  }
  encodeFloat.compareTokens = encodeUint.compareTokens;

  // node_modules/@ipld/dag-cbor/node_modules/cborg/lib/jump.js
  function invalidMinor(data, pos, minor) {
    throw new Error(`${decodeErrPrefix} encountered invalid minor (${minor}) for major ${data[pos] >>> 5}`);
  }
  function errorer(msg) {
    return () => {
      throw new Error(`${decodeErrPrefix} ${msg}`);
    };
  }
  var jump = [];
  for (let i = 0; i <= 23; i++) {
    jump[i] = invalidMinor;
  }
  jump[24] = decodeUint8;
  jump[25] = decodeUint16;
  jump[26] = decodeUint32;
  jump[27] = decodeUint64;
  jump[28] = invalidMinor;
  jump[29] = invalidMinor;
  jump[30] = invalidMinor;
  jump[31] = invalidMinor;
  for (let i = 32; i <= 55; i++) {
    jump[i] = invalidMinor;
  }
  jump[56] = decodeNegint8;
  jump[57] = decodeNegint16;
  jump[58] = decodeNegint32;
  jump[59] = decodeNegint64;
  jump[60] = invalidMinor;
  jump[61] = invalidMinor;
  jump[62] = invalidMinor;
  jump[63] = invalidMinor;
  for (let i = 64; i <= 87; i++) {
    jump[i] = decodeBytesCompact;
  }
  jump[88] = decodeBytes8;
  jump[89] = decodeBytes16;
  jump[90] = decodeBytes32;
  jump[91] = decodeBytes64;
  jump[92] = invalidMinor;
  jump[93] = invalidMinor;
  jump[94] = invalidMinor;
  jump[95] = errorer("indefinite length bytes/strings are not supported");
  for (let i = 96; i <= 119; i++) {
    jump[i] = decodeStringCompact;
  }
  jump[120] = decodeString8;
  jump[121] = decodeString16;
  jump[122] = decodeString32;
  jump[123] = decodeString64;
  jump[124] = invalidMinor;
  jump[125] = invalidMinor;
  jump[126] = invalidMinor;
  jump[127] = errorer("indefinite length bytes/strings are not supported");
  for (let i = 128; i <= 151; i++) {
    jump[i] = decodeArrayCompact;
  }
  jump[152] = decodeArray8;
  jump[153] = decodeArray16;
  jump[154] = decodeArray32;
  jump[155] = decodeArray64;
  jump[156] = invalidMinor;
  jump[157] = invalidMinor;
  jump[158] = invalidMinor;
  jump[159] = decodeArrayIndefinite;
  for (let i = 160; i <= 183; i++) {
    jump[i] = decodeMapCompact;
  }
  jump[184] = decodeMap8;
  jump[185] = decodeMap16;
  jump[186] = decodeMap32;
  jump[187] = decodeMap64;
  jump[188] = invalidMinor;
  jump[189] = invalidMinor;
  jump[190] = invalidMinor;
  jump[191] = decodeMapIndefinite;
  for (let i = 192; i <= 215; i++) {
    jump[i] = decodeTagCompact;
  }
  jump[216] = decodeTag8;
  jump[217] = decodeTag16;
  jump[218] = decodeTag32;
  jump[219] = decodeTag64;
  jump[220] = invalidMinor;
  jump[221] = invalidMinor;
  jump[222] = invalidMinor;
  jump[223] = invalidMinor;
  for (let i = 224; i <= 243; i++) {
    jump[i] = errorer("simple values are not supported");
  }
  jump[244] = invalidMinor;
  jump[245] = invalidMinor;
  jump[246] = invalidMinor;
  jump[247] = decodeUndefined;
  jump[248] = errorer("simple values are not supported");
  jump[249] = decodeFloat16;
  jump[250] = decodeFloat32;
  jump[251] = decodeFloat64;
  jump[252] = invalidMinor;
  jump[253] = invalidMinor;
  jump[254] = invalidMinor;
  jump[255] = decodeBreak;
  var quick = [];
  for (let i = 0; i < 24; i++) {
    quick[i] = new Token(Type.uint, i, 1);
  }
  for (let i = -1; i >= -24; i--) {
    quick[31 - i] = new Token(Type.negint, i, 1);
  }
  quick[64] = new Token(Type.bytes, new Uint8Array(0), 1);
  quick[96] = new Token(Type.string, "", 1);
  quick[128] = new Token(Type.array, 0, 1);
  quick[160] = new Token(Type.map, 0, 1);
  quick[244] = new Token(Type.false, false, 1);
  quick[245] = new Token(Type.true, true, 1);
  quick[246] = new Token(Type.null, null, 1);
  function quickEncodeToken(token) {
    switch (token.type) {
      case Type.false:
        return fromArray([244]);
      case Type.true:
        return fromArray([245]);
      case Type.null:
        return fromArray([246]);
      case Type.bytes:
        if (!token.value.length) {
          return fromArray([64]);
        }
        return;
      case Type.string:
        if (token.value === "") {
          return fromArray([96]);
        }
        return;
      case Type.array:
        if (token.value === 0) {
          return fromArray([128]);
        }
        return;
      case Type.map:
        if (token.value === 0) {
          return fromArray([160]);
        }
        return;
      case Type.uint:
        if (token.value < 24) {
          return fromArray([Number(token.value)]);
        }
        return;
      case Type.negint:
        if (token.value >= -24) {
          return fromArray([31 - Number(token.value)]);
        }
    }
  }

  // node_modules/@ipld/dag-cbor/node_modules/cborg/lib/encode.js
  var rfc8949EncodeOptions = Object.freeze({
    mapSorter: rfc8949MapSorter,
    quickEncodeToken
  });
  function makeCborEncoders() {
    const encoders = [];
    encoders[Type.uint.major] = encodeUint;
    encoders[Type.negint.major] = encodeNegint;
    encoders[Type.bytes.major] = encodeBytes;
    encoders[Type.string.major] = encodeString;
    encoders[Type.array.major] = encodeArray;
    encoders[Type.map.major] = encodeMap;
    encoders[Type.tag.major] = encodeTag;
    encoders[Type.float.major] = encodeFloat;
    return encoders;
  }
  var cborEncoders = makeCborEncoders();
  var defaultWriter = new Bl();
  var Ref = class _Ref {
    /**
     * @param {object|any[]} obj
     * @param {Reference|undefined} parent
     */
    constructor(obj, parent) {
      this.obj = obj;
      this.parent = parent;
    }
    /**
     * @param {object|any[]} obj
     * @returns {boolean}
     */
    includes(obj) {
      let p = this;
      do {
        if (p.obj === obj) {
          return true;
        }
      } while (p = p.parent);
      return false;
    }
    /**
     * @param {Reference|undefined} stack
     * @param {object|any[]} obj
     * @returns {Reference}
     */
    static createCheck(stack, obj) {
      if (stack && stack.includes(obj)) {
        throw new Error(`${encodeErrPrefix} object contains circular references`);
      }
      return new _Ref(obj, stack);
    }
  };
  var simpleTokens = {
    null: new Token(Type.null, null),
    undefined: new Token(Type.undefined, void 0),
    true: new Token(Type.true, true),
    false: new Token(Type.false, false),
    emptyArray: new Token(Type.array, 0),
    emptyMap: new Token(Type.map, 0)
  };
  var typeEncoders = {
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    number(obj, _typ, _options, _refStack) {
      if (!Number.isInteger(obj) || !Number.isSafeInteger(obj)) {
        return new Token(Type.float, obj);
      } else if (obj >= 0) {
        return new Token(Type.uint, obj);
      } else {
        return new Token(Type.negint, obj);
      }
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    bigint(obj, _typ, _options, _refStack) {
      if (obj >= BigInt(0)) {
        return new Token(Type.uint, obj);
      } else {
        return new Token(Type.negint, obj);
      }
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    Uint8Array(obj, _typ, _options, _refStack) {
      return new Token(Type.bytes, obj);
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    string(obj, _typ, _options, _refStack) {
      return new Token(Type.string, obj);
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    boolean(obj, _typ, _options, _refStack) {
      return obj ? simpleTokens.true : simpleTokens.false;
    },
    /**
     * @param {any} _obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    null(_obj, _typ, _options, _refStack) {
      return simpleTokens.null;
    },
    /**
     * @param {any} _obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    undefined(_obj, _typ, _options, _refStack) {
      return simpleTokens.undefined;
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    ArrayBuffer(obj, _typ, _options, _refStack) {
      return new Token(Type.bytes, new Uint8Array(obj));
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    DataView(obj, _typ, _options, _refStack) {
      return new Token(Type.bytes, new Uint8Array(obj.buffer, obj.byteOffset, obj.byteLength));
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} options
     * @param {Reference} [refStack]
     * @returns {TokenOrNestedTokens}
     */
    Array(obj, _typ, options, refStack) {
      if (!obj.length) {
        if (options.addBreakTokens === true) {
          return [simpleTokens.emptyArray, new Token(Type.break)];
        }
        return simpleTokens.emptyArray;
      }
      refStack = Ref.createCheck(refStack, obj);
      const entries = [];
      let i = 0;
      for (const e of obj) {
        entries[i++] = objectToTokens(e, options, refStack);
      }
      if (options.addBreakTokens) {
        return [new Token(Type.array, obj.length), entries, new Token(Type.break)];
      }
      return [new Token(Type.array, obj.length), entries];
    },
    /**
     * @param {any} obj
     * @param {string} typ
     * @param {EncodeOptions} options
     * @param {Reference} [refStack]
     * @returns {TokenOrNestedTokens}
     */
    Object(obj, typ, options, refStack) {
      const isMap = typ !== "Object";
      const keys = isMap ? obj.keys() : Object.keys(obj);
      const maxLength = isMap ? obj.size : keys.length;
      let entries;
      if (maxLength) {
        entries = new Array(maxLength);
        refStack = Ref.createCheck(refStack, obj);
        const skipUndefined = !isMap && options.ignoreUndefinedProperties;
        let i = 0;
        for (const key of keys) {
          const value = isMap ? obj.get(key) : obj[key];
          if (skipUndefined && value === void 0) {
            continue;
          }
          entries[i++] = [
            objectToTokens(key, options, refStack),
            objectToTokens(value, options, refStack)
          ];
        }
        if (i < maxLength) {
          entries.length = i;
        }
      }
      if (!entries?.length) {
        if (options.addBreakTokens === true) {
          return [simpleTokens.emptyMap, new Token(Type.break)];
        }
        return simpleTokens.emptyMap;
      }
      sortMapEntries(entries, options);
      if (options.addBreakTokens) {
        return [new Token(Type.map, entries.length), entries, new Token(Type.break)];
      }
      return [new Token(Type.map, entries.length), entries];
    },
    /**
     * Encode a `Tagged` wrapper as a CBOR tag header followed by the encoded
     * form of the wrapped value. The value is recursively tokenised through
     * `objectToTokens()` so any registered `typeEncoders` apply to it.
     *
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} options
     * @param {Reference} [refStack]
     * @returns {TokenOrNestedTokens}
     */
    Tagged(obj, _typ, options, refStack) {
      return [
        new Token(Type.tag, obj.tag),
        objectToTokens(obj.value, options, refStack)
      ];
    }
  };
  typeEncoders.Map = typeEncoders.Object;
  typeEncoders.Buffer = typeEncoders.Uint8Array;
  for (const typ of "Uint8Clamped Uint16 Uint32 Int8 Int16 Int32 BigUint64 BigInt64 Float32 Float64".split(" ")) {
    typeEncoders[`${typ}Array`] = typeEncoders.DataView;
  }
  function objectToTokens(obj, options = {}, refStack) {
    const typ = is(obj);
    const customTypeEncoder = options && options.typeEncoders && /** @type {OptionalTypeEncoder} */
    options.typeEncoders[typ] || typeEncoders[typ];
    if (typeof customTypeEncoder === "function") {
      const tokens = customTypeEncoder(obj, typ, options, refStack);
      if (tokens != null) {
        return tokens;
      }
    }
    const typeEncoder = typeEncoders[typ];
    if (!typeEncoder) {
      throw new Error(`${encodeErrPrefix} unsupported type: ${typ}`);
    }
    return typeEncoder(obj, typ, options, refStack);
  }
  function sortMapEntries(entries, options) {
    if (options.mapSorter) {
      entries.sort(options.mapSorter);
    }
  }
  function rfc8949MapSorter(e1, e2) {
    if (e1[0] instanceof Token && e2[0] instanceof Token) {
      const t1 = (
        /** @type {TokenEx} */
        e1[0]
      );
      const t2 = (
        /** @type {TokenEx} */
        e2[0]
      );
      if (!t1._keyBytes) {
        t1._keyBytes = encodeRfc8949(t1.value);
      }
      if (!t2._keyBytes) {
        t2._keyBytes = encodeRfc8949(t2.value);
      }
      return compare(t1._keyBytes, t2._keyBytes);
    }
    throw new Error("rfc8949MapSorter: complex key types are not supported yet");
  }
  function encodeRfc8949(data) {
    return encodeCustom(data, cborEncoders, rfc8949EncodeOptions);
  }
  function tokensToEncoded(writer, tokens, encoders, options) {
    if (Array.isArray(tokens)) {
      for (const token of tokens) {
        tokensToEncoded(writer, token, encoders, options);
      }
    } else {
      encoders[tokens.type.major](writer, tokens, options);
    }
  }
  var MAJOR_UINT = Type.uint.majorEncoded;
  var MAJOR_NEGINT = Type.negint.majorEncoded;
  var MAJOR_BYTES = Type.bytes.majorEncoded;
  var MAJOR_STRING = Type.string.majorEncoded;
  var MAJOR_ARRAY = Type.array.majorEncoded;
  var SIMPLE_FALSE = Type.float.majorEncoded | MINOR_FALSE;
  var SIMPLE_TRUE = Type.float.majorEncoded | MINOR_TRUE;
  var SIMPLE_NULL = Type.float.majorEncoded | MINOR_NULL;
  var SIMPLE_UNDEFINED = Type.float.majorEncoded | MINOR_UNDEFINED;
  var neg1b2 = BigInt(-1);
  var pos1b2 = BigInt(1);
  function encodeCustom(data, encoders, options, destination) {
    const hasDest = destination instanceof Uint8Array;
    let writeTo = hasDest ? new U8Bl(destination) : defaultWriter;
    const tokens = objectToTokens(data, options);
    if (!Array.isArray(tokens) && options.quickEncodeToken) {
      const quickBytes = options.quickEncodeToken(tokens);
      if (quickBytes) {
        if (hasDest) {
          writeTo.push(quickBytes);
          return writeTo.toBytes();
        }
        return quickBytes;
      }
      const encoder = encoders[tokens.type.major];
      if (encoder.encodedSize) {
        const size = encoder.encodedSize(tokens, options);
        if (!hasDest) {
          writeTo = new Bl(size);
        }
        encoder(writeTo, tokens, options);
        if (writeTo.chunks.length !== 1) {
          throw new Error(`Unexpected error: pre-calculated length for ${tokens} was wrong`);
        }
        return hasDest ? writeTo.toBytes() : asU8A(writeTo.chunks[0]);
      }
    }
    writeTo.reset();
    tokensToEncoded(writeTo, tokens, encoders, options);
    return writeTo.toBytes(true);
  }

  // node_modules/@ipld/dag-cbor/node_modules/cborg/lib/decode.js
  var defaultDecodeOptions = {
    strict: false,
    allowIndefinite: true,
    allowUndefined: true,
    allowBigInt: true
  };
  var Tokeniser = class {
    /**
     * @param {Uint8Array} data
     * @param {DecodeOptions} options
     */
    constructor(data, options = {}) {
      this._pos = 0;
      this.data = data;
      this.options = options;
    }
    pos() {
      return this._pos;
    }
    done() {
      return this._pos >= this.data.length;
    }
    next() {
      const byt = this.data[this._pos];
      let token = quick[byt];
      if (token === void 0) {
        const decoder = jump[byt];
        if (!decoder) {
          throw new Error(`${decodeErrPrefix} no decoder for major type ${byt >>> 5} (byte 0x${byt.toString(16).padStart(2, "0")})`);
        }
        const minor = byt & 31;
        token = decoder(this.data, this._pos, minor, this.options);
      }
      this._pos += token.encodedLength;
      return token;
    }
  };
  var DONE = /* @__PURE__ */ Symbol.for("DONE");
  var BREAK = /* @__PURE__ */ Symbol.for("BREAK");
  function tokenToArray(token, tokeniser, options) {
    const arr = [];
    for (let i = 0; i < token.value; i++) {
      const value = tokensToObject(tokeniser, options);
      if (value === BREAK) {
        if (token.value === Infinity) {
          break;
        }
        throw new Error(`${decodeErrPrefix} got unexpected break to lengthed array`);
      }
      if (value === DONE) {
        throw new Error(`${decodeErrPrefix} found array but not enough entries (got ${i}, expected ${token.value})`);
      }
      arr[i] = value;
    }
    return arr;
  }
  function tokenToMap(token, tokeniser, options) {
    const useMaps = options.useMaps === true;
    const rejectDuplicateMapKeys = options.rejectDuplicateMapKeys === true;
    const obj = useMaps ? void 0 : {};
    const m = useMaps ? /* @__PURE__ */ new Map() : void 0;
    for (let i = 0; i < token.value; i++) {
      const key = tokensToObject(tokeniser, options);
      if (key === BREAK) {
        if (token.value === Infinity) {
          break;
        }
        throw new Error(`${decodeErrPrefix} got unexpected break to lengthed map`);
      }
      if (key === DONE) {
        throw new Error(`${decodeErrPrefix} found map but not enough entries (got ${i} [no key], expected ${token.value})`);
      }
      if (!useMaps && typeof key !== "string") {
        throw new Error(`${decodeErrPrefix} non-string keys not supported (got ${typeof key})`);
      }
      if (rejectDuplicateMapKeys) {
        if (useMaps && m.has(key) || !useMaps && Object.hasOwn(obj, key)) {
          throw new Error(`${decodeErrPrefix} found repeat map key "${key}"`);
        }
      }
      const value = tokensToObject(tokeniser, options);
      if (value === DONE) {
        throw new Error(`${decodeErrPrefix} found map but not enough entries (got ${i} [no value], expected ${token.value})`);
      }
      if (useMaps) {
        m.set(key, value);
      } else {
        obj[key] = value;
      }
    }
    return useMaps ? m : obj;
  }
  function* tokenToMapEntries(token, tokeniser, options) {
    for (let i = 0; i < token.value; i++) {
      const key = tokensToObject(tokeniser, options);
      if (key === BREAK) {
        if (token.value === Infinity) {
          break;
        }
        throw new Error(`${decodeErrPrefix} got unexpected break to lengthed map`);
      }
      if (key === DONE) {
        throw new Error(`${decodeErrPrefix} found map but not enough entries (got ${i} [no key], expected ${token.value})`);
      }
      const value = tokensToObject(tokeniser, options);
      if (value === DONE) {
        throw new Error(`${decodeErrPrefix} found map but not enough entries (got ${i} [no value], expected ${token.value})`);
      }
      yield [key, value];
    }
  }
  function createTagDecodeControl(tokeniser, options) {
    let called = false;
    const decode25 = function() {
      if (called) {
        throw new Error(`${decodeErrPrefix} tag decode() may only be called once`);
      }
      called = true;
      const value = tokensToObject(tokeniser, options);
      if (value === DONE) {
        throw new Error(`${decodeErrPrefix} tag content missing`);
      }
      if (value === BREAK) {
        throw new Error(`${decodeErrPrefix} got unexpected break in tag content`);
      }
      return value;
    };
    decode25.entries = function() {
      if (called) {
        throw new Error(`${decodeErrPrefix} tag decode() may only be called once`);
      }
      called = true;
      const token = tokeniser.next();
      if (!Type.equals(token.type, Type.map)) {
        throw new Error(`${decodeErrPrefix} entries() requires map content, got ${token.type.name}`);
      }
      const entries = [];
      for (const entry of tokenToMapEntries(token, tokeniser, options)) {
        entries.push(entry);
      }
      return entries;
    };
    Object.defineProperty(decode25, "_called", {
      get() {
        return called;
      },
      enumerable: false
    });
    return decode25;
  }
  function tokensToObject(tokeniser, options) {
    if (tokeniser.done()) {
      return DONE;
    }
    const token = tokeniser.next();
    if (Type.equals(token.type, Type.break)) {
      return BREAK;
    }
    if (token.type.terminal) {
      return token.value;
    }
    if (Type.equals(token.type, Type.array)) {
      return tokenToArray(token, tokeniser, options);
    }
    if (Type.equals(token.type, Type.map)) {
      return tokenToMap(token, tokeniser, options);
    }
    if (Type.equals(token.type, Type.tag)) {
      if (options.tags && typeof options.tags[token.value] === "function") {
        const decodeControl = createTagDecodeControl(tokeniser, options);
        const result = options.tags[token.value](decodeControl);
        if (!decodeControl._called) {
          throw new Error(`${decodeErrPrefix} tag decoder must call decode() or entries()`);
        }
        return result;
      }
      throw new Error(`${decodeErrPrefix} tag not supported (${token.value})`);
    }
    throw new Error("unsupported");
  }
  function decodeFirst(data, options) {
    if (!(data instanceof Uint8Array)) {
      throw new Error(`${decodeErrPrefix} data to decode must be a Uint8Array`);
    }
    options = Object.assign({}, defaultDecodeOptions, options);
    const u8aData = asU8A(data);
    const tokeniser = options.tokenizer || new Tokeniser(u8aData, options);
    const decoded = tokensToObject(tokeniser, options);
    if (decoded === DONE) {
      throw new Error(`${decodeErrPrefix} did not find any content to decode`);
    }
    if (decoded === BREAK) {
      throw new Error(`${decodeErrPrefix} got unexpected break`);
    }
    return [decoded, data.subarray(tokeniser.pos())];
  }
  function decode(data, options) {
    const [decoded, remainder] = decodeFirst(data, options);
    if (remainder.length > 0) {
      throw new Error(`${decodeErrPrefix} too many terminals, data makes no sense`);
    }
    return decoded;
  }

  // node_modules/@ipld/dag-cbor/node_modules/cborg/lib/tagged.js
  var Tagged = class _Tagged {
    /**
     * @param {number} tag - CBOR tag number, a non-negative integer
     * @param {any} value - The value to be tagged; encoded recursively
     */
    constructor(tag, value) {
      if (typeof tag !== "number" || !Number.isInteger(tag) || tag < 0) {
        throw new TypeError("Tagged: tag must be a non-negative integer");
      }
      this.tag = tag;
      this.value = value;
    }
    /**
     * Build a tag decoder for use in `decode()`'s `tags` option that returns the
     * decoded content wrapped in a `Tagged` instance, preserving the tag number
     * for the caller to inspect.
     *
     * @param {number} tag - The CBOR tag number this decoder will be registered for
     * @returns {TaggedTagDecoder}
     *
     * @example
     * import { decode, Tagged } from 'cborg'
     * const value = decode(bytes, { tags: { 16: Tagged.decoder(16) } })
     * // value instanceof Tagged; value.tag === 16
     */
    static decoder(tag) {
      return (decode25) => new _Tagged(tag, decode25());
    }
    /**
     * Build a `tags` option for `decode()` that wraps each listed tag number in
     * a `Tagged` instance, preserving those tags through decode without
     * registering a dedicated decoder per tag.
     *
     * @param {...number} tagNumbers - One or more CBOR tag numbers to preserve
     * @returns {{[tagNumber: number]: TaggedTagDecoder}}
     *
     * @example
     * import { decode, Tagged } from 'cborg'
     * const value = decode(bytes, { tags: Tagged.preserve(16, 96) })
     */
    static preserve(...tagNumbers) {
      const tags = {};
      for (const tag of tagNumbers) {
        tags[tag] = _Tagged.decoder(tag);
      }
      return tags;
    }
  };
  Object.defineProperty(Tagged.prototype, Symbol.toStringTag, {
    value: "Tagged"
  });

  // node_modules/multiformats/dist/src/bases/base32.js
  var base32_exports = {};
  __export(base32_exports, {
    base32: () => base32,
    base32hex: () => base32hex,
    base32hexpad: () => base32hexpad,
    base32hexpadupper: () => base32hexpadupper,
    base32hexupper: () => base32hexupper,
    base32pad: () => base32pad,
    base32padupper: () => base32padupper,
    base32upper: () => base32upper,
    base32z: () => base32z
  });

  // node_modules/multiformats/dist/src/bytes.js
  var empty = new Uint8Array(0);
  function equals(aa, bb) {
    if (aa === bb) {
      return true;
    }
    if (aa.byteLength !== bb.byteLength) {
      return false;
    }
    for (let ii = 0; ii < aa.byteLength; ii++) {
      if (aa[ii] !== bb[ii]) {
        return false;
      }
    }
    return true;
  }
  function coerce(o) {
    if (o instanceof Uint8Array && o.constructor.name === "Uint8Array") {
      return o;
    }
    if (o instanceof ArrayBuffer) {
      return new Uint8Array(o);
    }
    if (ArrayBuffer.isView(o)) {
      return new Uint8Array(o.buffer, o.byteOffset, o.byteLength);
    }
    throw new Error("Unknown type, must be binary type");
  }
  function fromString2(str) {
    return new TextEncoder().encode(str);
  }
  function toString(b) {
    return new TextDecoder().decode(b);
  }

  // node_modules/multiformats/dist/src/vendor/base-x.js
  function base(ALPHABET, name3) {
    if (ALPHABET.length >= 255) {
      throw new TypeError("Alphabet too long");
    }
    var BASE_MAP = new Uint8Array(256);
    for (var j = 0; j < BASE_MAP.length; j++) {
      BASE_MAP[j] = 255;
    }
    for (var i = 0; i < ALPHABET.length; i++) {
      var x = ALPHABET.charAt(i);
      var xc = x.charCodeAt(0);
      if (BASE_MAP[xc] !== 255) {
        throw new TypeError(x + " is ambiguous");
      }
      BASE_MAP[xc] = i;
    }
    var BASE = ALPHABET.length;
    var LEADER = ALPHABET.charAt(0);
    var FACTOR = Math.log(BASE) / Math.log(256);
    var iFACTOR = Math.log(256) / Math.log(BASE);
    function encode17(source) {
      if (source instanceof Uint8Array)
        ;
      else if (ArrayBuffer.isView(source)) {
        source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
      } else if (Array.isArray(source)) {
        source = Uint8Array.from(source);
      }
      if (!(source instanceof Uint8Array)) {
        throw new TypeError("Expected Uint8Array");
      }
      if (source.length === 0) {
        return "";
      }
      var zeroes = 0;
      var length6 = 0;
      var pbegin = 0;
      var pend = source.length;
      while (pbegin !== pend && source[pbegin] === 0) {
        pbegin++;
        zeroes++;
      }
      var size = (pend - pbegin) * iFACTOR + 1 >>> 0;
      var b58 = new Uint8Array(size);
      while (pbegin !== pend) {
        var carry = source[pbegin];
        var i2 = 0;
        for (var it1 = size - 1; (carry !== 0 || i2 < length6) && it1 !== -1; it1--, i2++) {
          carry += 256 * b58[it1] >>> 0;
          b58[it1] = carry % BASE >>> 0;
          carry = carry / BASE >>> 0;
        }
        if (carry !== 0) {
          throw new Error("Non-zero carry");
        }
        length6 = i2;
        pbegin++;
      }
      var it2 = size - length6;
      while (it2 !== size && b58[it2] === 0) {
        it2++;
      }
      var str = LEADER.repeat(zeroes);
      for (; it2 < size; ++it2) {
        str += ALPHABET.charAt(b58[it2]);
      }
      return str;
    }
    function decodeUnsafe(source) {
      if (typeof source !== "string") {
        throw new TypeError("Expected String");
      }
      if (source.length === 0) {
        return new Uint8Array();
      }
      var psz = 0;
      if (source[psz] === " ") {
        return;
      }
      var zeroes = 0;
      var length6 = 0;
      while (source[psz] === LEADER) {
        zeroes++;
        psz++;
      }
      var size = (source.length - psz) * FACTOR + 1 >>> 0;
      var b256 = new Uint8Array(size);
      while (source[psz]) {
        var carry = BASE_MAP[source.charCodeAt(psz)];
        if (carry === 255) {
          return;
        }
        var i2 = 0;
        for (var it3 = size - 1; (carry !== 0 || i2 < length6) && it3 !== -1; it3--, i2++) {
          carry += BASE * b256[it3] >>> 0;
          b256[it3] = carry % 256 >>> 0;
          carry = carry / 256 >>> 0;
        }
        if (carry !== 0) {
          throw new Error("Non-zero carry");
        }
        length6 = i2;
        psz++;
      }
      if (source[psz] === " ") {
        return;
      }
      var it4 = size - length6;
      while (it4 !== size && b256[it4] === 0) {
        it4++;
      }
      var vch = new Uint8Array(zeroes + (size - it4));
      var j2 = zeroes;
      while (it4 !== size) {
        vch[j2++] = b256[it4++];
      }
      return vch;
    }
    function decode25(string3) {
      var buffer4 = decodeUnsafe(string3);
      if (buffer4) {
        return buffer4;
      }
      throw new Error(`Non-${name3} character`);
    }
    return {
      encode: encode17,
      decodeUnsafe,
      decode: decode25
    };
  }
  var src = base;
  var _brrp__multiformats_scope_baseX = src;
  var base_x_default = _brrp__multiformats_scope_baseX;

  // node_modules/multiformats/dist/src/bases/base.js
  var Encoder = class {
    name;
    prefix;
    baseEncode;
    constructor(name3, prefix, baseEncode) {
      this.name = name3;
      this.prefix = prefix;
      this.baseEncode = baseEncode;
    }
    encode(bytes) {
      if (bytes instanceof Uint8Array) {
        return `${this.prefix}${this.baseEncode(bytes)}`;
      } else {
        throw Error("Unknown type, must be binary type");
      }
    }
  };
  var Decoder = class {
    name;
    prefix;
    baseDecode;
    prefixCodePoint;
    constructor(name3, prefix, baseDecode) {
      this.name = name3;
      this.prefix = prefix;
      const prefixCodePoint = prefix.codePointAt(0);
      if (prefixCodePoint === void 0) {
        throw new Error("Invalid prefix character");
      }
      this.prefixCodePoint = prefixCodePoint;
      this.baseDecode = baseDecode;
    }
    decode(text) {
      if (typeof text === "string") {
        if (text.codePointAt(0) !== this.prefixCodePoint) {
          throw Error(`Unable to decode multibase string ${JSON.stringify(text)}, ${this.name} decoder only supports inputs prefixed with ${this.prefix}`);
        }
        return this.baseDecode(text.slice(this.prefix.length));
      } else {
        throw Error("Can only multibase decode strings");
      }
    }
    or(decoder) {
      return or(this, decoder);
    }
  };
  var ComposedDecoder = class {
    decoders;
    constructor(decoders) {
      this.decoders = decoders;
    }
    or(decoder) {
      return or(this, decoder);
    }
    decode(input) {
      const prefix = input[0];
      const decoder = this.decoders[prefix];
      if (decoder != null) {
        return decoder.decode(input);
      } else {
        throw RangeError(`Unable to decode multibase string ${JSON.stringify(input)}, only inputs prefixed with ${Object.keys(this.decoders)} are supported`);
      }
    }
  };
  function or(left, right) {
    return new ComposedDecoder({
      ...left.decoders ?? { [left.prefix]: left },
      ...right.decoders ?? { [right.prefix]: right }
    });
  }
  var Codec = class {
    name;
    prefix;
    baseEncode;
    baseDecode;
    encoder;
    decoder;
    constructor(name3, prefix, baseEncode, baseDecode) {
      this.name = name3;
      this.prefix = prefix;
      this.baseEncode = baseEncode;
      this.baseDecode = baseDecode;
      this.encoder = new Encoder(name3, prefix, baseEncode);
      this.decoder = new Decoder(name3, prefix, baseDecode);
    }
    encode(input) {
      return this.encoder.encode(input);
    }
    decode(input) {
      return this.decoder.decode(input);
    }
  };
  function from({ name: name3, prefix, encode: encode17, decode: decode25 }) {
    return new Codec(name3, prefix, encode17, decode25);
  }
  function baseX({ name: name3, prefix, alphabet: alphabet3 }) {
    const { encode: encode17, decode: decode25 } = base_x_default(alphabet3, name3);
    return from({
      prefix,
      name: name3,
      encode: encode17,
      decode: (text) => coerce(decode25(text))
    });
  }
  function decode2(string3, alphabetIdx, bitsPerChar, name3) {
    let end = string3.length;
    while (string3[end - 1] === "=") {
      --end;
    }
    const out = new Uint8Array(end * bitsPerChar / 8 | 0);
    let bits = 0;
    let buffer4 = 0;
    let written = 0;
    for (let i = 0; i < end; ++i) {
      const value = alphabetIdx[string3[i]];
      if (value === void 0) {
        throw new SyntaxError(`Non-${name3} character`);
      }
      buffer4 = buffer4 << bitsPerChar | value;
      bits += bitsPerChar;
      if (bits >= 8) {
        bits -= 8;
        out[written++] = 255 & buffer4 >> bits;
      }
    }
    if (bits >= bitsPerChar || (255 & buffer4 << 8 - bits) !== 0) {
      throw new SyntaxError("Unexpected end of data");
    }
    return out;
  }
  function encode2(data, alphabet3, bitsPerChar) {
    const pad = alphabet3[alphabet3.length - 1] === "=";
    const mask = (1 << bitsPerChar) - 1;
    let out = "";
    let bits = 0;
    let buffer4 = 0;
    for (let i = 0; i < data.length; ++i) {
      buffer4 = buffer4 << 8 | data[i];
      bits += 8;
      while (bits > bitsPerChar) {
        bits -= bitsPerChar;
        out += alphabet3[mask & buffer4 >> bits];
      }
    }
    if (bits !== 0) {
      out += alphabet3[mask & buffer4 << bitsPerChar - bits];
    }
    if (pad) {
      while ((out.length * bitsPerChar & 7) !== 0) {
        out += "=";
      }
    }
    return out;
  }
  function createAlphabetIdx(alphabet3) {
    const alphabetIdx = {};
    for (let i = 0; i < alphabet3.length; ++i) {
      alphabetIdx[alphabet3[i]] = i;
    }
    return alphabetIdx;
  }
  function rfc4648({ name: name3, prefix, bitsPerChar, alphabet: alphabet3 }) {
    const alphabetIdx = createAlphabetIdx(alphabet3);
    return from({
      prefix,
      name: name3,
      encode(input) {
        return encode2(input, alphabet3, bitsPerChar);
      },
      decode(input) {
        return decode2(input, alphabetIdx, bitsPerChar, name3);
      }
    });
  }

  // node_modules/multiformats/dist/src/bases/base32.js
  var base32 = rfc4648({
    prefix: "b",
    name: "base32",
    alphabet: "abcdefghijklmnopqrstuvwxyz234567",
    bitsPerChar: 5
  });
  var base32upper = rfc4648({
    prefix: "B",
    name: "base32upper",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
    bitsPerChar: 5
  });
  var base32pad = rfc4648({
    prefix: "c",
    name: "base32pad",
    alphabet: "abcdefghijklmnopqrstuvwxyz234567=",
    bitsPerChar: 5
  });
  var base32padupper = rfc4648({
    prefix: "C",
    name: "base32padupper",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567=",
    bitsPerChar: 5
  });
  var base32hex = rfc4648({
    prefix: "v",
    name: "base32hex",
    alphabet: "0123456789abcdefghijklmnopqrstuv",
    bitsPerChar: 5
  });
  var base32hexupper = rfc4648({
    prefix: "V",
    name: "base32hexupper",
    alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
    bitsPerChar: 5
  });
  var base32hexpad = rfc4648({
    prefix: "t",
    name: "base32hexpad",
    alphabet: "0123456789abcdefghijklmnopqrstuv=",
    bitsPerChar: 5
  });
  var base32hexpadupper = rfc4648({
    prefix: "T",
    name: "base32hexpadupper",
    alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUV=",
    bitsPerChar: 5
  });
  var base32z = rfc4648({
    prefix: "h",
    name: "base32z",
    alphabet: "ybndrfg8ejkmcpqxot1uwisza345h769",
    bitsPerChar: 5
  });

  // node_modules/multiformats/dist/src/bases/base36.js
  var base36_exports = {};
  __export(base36_exports, {
    base36: () => base36,
    base36upper: () => base36upper
  });
  var base36 = baseX({
    prefix: "k",
    name: "base36",
    alphabet: "0123456789abcdefghijklmnopqrstuvwxyz"
  });
  var base36upper = baseX({
    prefix: "K",
    name: "base36upper",
    alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  });

  // node_modules/multiformats/dist/src/bases/base58.js
  var base58_exports = {};
  __export(base58_exports, {
    base58btc: () => base58btc,
    base58flickr: () => base58flickr
  });
  var base58btc = baseX({
    name: "base58btc",
    prefix: "z",
    alphabet: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
  });
  var base58flickr = baseX({
    name: "base58flickr",
    prefix: "Z",
    alphabet: "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"
  });

  // node_modules/multiformats/dist/src/vendor/varint.js
  var encode_1 = encode3;
  var MSB = 128;
  var REST = 127;
  var MSBALL = ~REST;
  var INT = Math.pow(2, 31);
  function encode3(num, out, offset) {
    out = out || [];
    offset = offset || 0;
    var oldOffset = offset;
    while (num >= INT) {
      out[offset++] = num & 255 | MSB;
      num /= 128;
    }
    while (num & MSBALL) {
      out[offset++] = num & 255 | MSB;
      num >>>= 7;
    }
    out[offset] = num | 0;
    encode3.bytes = offset - oldOffset + 1;
    return out;
  }
  var decode3 = read;
  var MSB$1 = 128;
  var REST$1 = 127;
  function read(buf, offset) {
    var res = 0, offset = offset || 0, shift = 0, counter = offset, b, l = buf.length;
    do {
      if (counter >= l) {
        read.bytes = 0;
        throw new RangeError("Could not decode varint");
      }
      b = buf[counter++];
      res += shift < 28 ? (b & REST$1) << shift : (b & REST$1) * Math.pow(2, shift);
      shift += 7;
    } while (b >= MSB$1);
    read.bytes = counter - offset;
    return res;
  }
  var N1 = Math.pow(2, 7);
  var N2 = Math.pow(2, 14);
  var N3 = Math.pow(2, 21);
  var N4 = Math.pow(2, 28);
  var N5 = Math.pow(2, 35);
  var N6 = Math.pow(2, 42);
  var N7 = Math.pow(2, 49);
  var N8 = Math.pow(2, 56);
  var N9 = Math.pow(2, 63);
  var length = function(value) {
    return value < N1 ? 1 : value < N2 ? 2 : value < N3 ? 3 : value < N4 ? 4 : value < N5 ? 5 : value < N6 ? 6 : value < N7 ? 7 : value < N8 ? 8 : value < N9 ? 9 : 10;
  };
  var varint = {
    encode: encode_1,
    decode: decode3,
    encodingLength: length
  };
  var _brrp_varint = varint;
  var varint_default = _brrp_varint;

  // node_modules/multiformats/dist/src/varint.js
  function decode4(data, offset = 0) {
    const code8 = varint_default.decode(data, offset);
    return [code8, varint_default.decode.bytes];
  }
  function encodeTo(int, target, offset = 0) {
    varint_default.encode(int, target, offset);
    return target;
  }
  function encodingLength(int) {
    return varint_default.encodingLength(int);
  }

  // node_modules/multiformats/dist/src/hashes/digest.js
  function create(code8, digest3) {
    const size = digest3.byteLength;
    const sizeOffset = encodingLength(code8);
    const digestOffset = sizeOffset + encodingLength(size);
    const bytes = new Uint8Array(digestOffset + size);
    encodeTo(code8, bytes, 0);
    encodeTo(size, bytes, sizeOffset);
    bytes.set(digest3, digestOffset);
    return new Digest(code8, size, digest3, bytes);
  }
  function decode5(multihash) {
    const bytes = coerce(multihash);
    const [code8, sizeOffset] = decode4(bytes);
    const [size, digestOffset] = decode4(bytes.subarray(sizeOffset));
    const digest3 = bytes.subarray(sizeOffset + digestOffset);
    if (digest3.byteLength !== size) {
      throw new Error("Incorrect length");
    }
    return new Digest(code8, size, digest3, bytes);
  }
  function equals2(a, b) {
    if (a === b) {
      return true;
    } else {
      const data = b;
      return a.code === data.code && a.size === data.size && data.bytes instanceof Uint8Array && equals(a.bytes, data.bytes);
    }
  }
  var Digest = class {
    code;
    size;
    digest;
    bytes;
    /**
     * Creates a multihash digest.
     */
    constructor(code8, size, digest3, bytes) {
      this.code = code8;
      this.size = size;
      this.digest = digest3;
      this.bytes = bytes;
    }
  };

  // node_modules/multiformats/dist/src/cid.js
  function format(link, base4) {
    const { bytes, version } = link;
    switch (version) {
      case 0:
        return toStringV0(bytes, baseCache(link), base4 ?? base58btc.encoder);
      default:
        return toStringV1(bytes, baseCache(link), base4 ?? base32.encoder);
    }
  }
  var cache = /* @__PURE__ */ new WeakMap();
  function baseCache(cid) {
    const baseCache4 = cache.get(cid);
    if (baseCache4 == null) {
      const baseCache5 = /* @__PURE__ */ new Map();
      cache.set(cid, baseCache5);
      return baseCache5;
    }
    return baseCache4;
  }
  var CID = class _CID {
    code;
    version;
    multihash;
    bytes;
    "/";
    /**
     * @param version - Version of the CID
     * @param code - Code of the codec content is encoded in, see https://github.com/multiformats/multicodec/blob/master/table.csv
     * @param multihash - (Multi)hash of the of the content.
     */
    constructor(version, code8, multihash, bytes) {
      this.code = code8;
      this.version = version;
      this.multihash = multihash;
      this.bytes = bytes;
      this["/"] = bytes;
    }
    /**
     * Signalling `cid.asCID === cid` has been replaced with `cid['/'] === cid.bytes`
     * please either use `CID.asCID(cid)` or switch to new signalling mechanism
     *
     * @deprecated
     */
    get asCID() {
      return this;
    }
    // ArrayBufferView
    get byteOffset() {
      return this.bytes.byteOffset;
    }
    // ArrayBufferView
    get byteLength() {
      return this.bytes.byteLength;
    }
    toV0() {
      switch (this.version) {
        case 0: {
          return this;
        }
        case 1: {
          const { code: code8, multihash } = this;
          if (code8 !== DAG_PB_CODE) {
            throw new Error("Cannot convert a non dag-pb CID to CIDv0");
          }
          if (multihash.code !== SHA_256_CODE) {
            throw new Error("Cannot convert non sha2-256 multihash CID to CIDv0");
          }
          return _CID.createV0(multihash);
        }
        default: {
          throw Error(`Can not convert CID version ${this.version} to version 0. This is a bug please report`);
        }
      }
    }
    toV1() {
      switch (this.version) {
        case 0: {
          const { code: code8, digest: digest3 } = this.multihash;
          const multihash = create(code8, digest3);
          return _CID.createV1(this.code, multihash);
        }
        case 1: {
          return this;
        }
        default: {
          throw Error(`Can not convert CID version ${this.version} to version 1. This is a bug please report`);
        }
      }
    }
    equals(other) {
      return _CID.equals(this, other);
    }
    static equals(self, other) {
      const unknown = other;
      return unknown != null && self.code === unknown.code && self.version === unknown.version && equals2(self.multihash, unknown.multihash);
    }
    toString(base4) {
      return format(this, base4);
    }
    toJSON() {
      return { "/": format(this) };
    }
    link() {
      return this;
    }
    [Symbol.toStringTag] = "CID";
    // Legacy
    [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
      return `CID(${this.toString()})`;
    }
    /**
     * Takes any input `value` and returns a `CID` instance if it was
     * a `CID` otherwise returns `null`. If `value` is instanceof `CID`
     * it will return value back. If `value` is not instance of this CID
     * class, but is compatible CID it will return new instance of this
     * `CID` class. Otherwise returns null.
     *
     * This allows two different incompatible versions of CID library to
     * co-exist and interop as long as binary interface is compatible.
     */
    static asCID(input) {
      if (input == null) {
        return null;
      }
      const value = input;
      if (value instanceof _CID) {
        return value;
      } else if (value["/"] != null && value["/"] === value.bytes || value.asCID === value) {
        const { version, code: code8, multihash, bytes } = value;
        return new _CID(version, code8, multihash, bytes ?? encodeCID(version, code8, multihash.bytes));
      } else if (value[cidSymbol] === true) {
        const { version, multihash, code: code8 } = value;
        const digest3 = decode5(multihash);
        return _CID.create(version, code8, digest3);
      } else {
        return null;
      }
    }
    /**
     * @param version - Version of the CID
     * @param code - Code of the codec content is encoded in, see https://github.com/multiformats/multicodec/blob/master/table.csv
     * @param digest - (Multi)hash of the of the content.
     */
    static create(version, code8, digest3) {
      if (typeof code8 !== "number") {
        throw new Error("String codecs are no longer supported");
      }
      if (!(digest3.bytes instanceof Uint8Array)) {
        throw new Error("Invalid digest");
      }
      switch (version) {
        case 0: {
          if (code8 !== DAG_PB_CODE) {
            throw new Error(`Version 0 CID must use dag-pb (code: ${DAG_PB_CODE}) block encoding`);
          } else {
            return new _CID(version, code8, digest3, digest3.bytes);
          }
        }
        case 1: {
          const bytes = encodeCID(version, code8, digest3.bytes);
          return new _CID(version, code8, digest3, bytes);
        }
        default: {
          throw new Error("Invalid version");
        }
      }
    }
    /**
     * Simplified version of `create` for CIDv0.
     */
    static createV0(digest3) {
      return _CID.create(0, DAG_PB_CODE, digest3);
    }
    /**
     * Simplified version of `create` for CIDv1.
     *
     * @param code - Content encoding format code.
     * @param digest - Multihash of the content.
     */
    static createV1(code8, digest3) {
      return _CID.create(1, code8, digest3);
    }
    /**
     * Decoded a CID from its binary representation. The byte array must contain
     * only the CID with no additional bytes.
     *
     * An error will be thrown if the bytes provided do not contain a valid
     * binary representation of a CID.
     */
    static decode(bytes) {
      const [cid, remainder] = _CID.decodeFirst(bytes);
      if (remainder.length !== 0) {
        throw new Error("Incorrect length");
      }
      return cid;
    }
    /**
     * Decoded a CID from its binary representation at the beginning of a byte
     * array.
     *
     * Returns an array with the first element containing the CID and the second
     * element containing the remainder of the original byte array. The remainder
     * will be a zero-length byte array if the provided bytes only contained a
     * binary CID representation.
     */
    static decodeFirst(bytes) {
      const specs = _CID.inspectBytes(bytes);
      const prefixSize = specs.size - specs.multihashSize;
      const multihashBytes = coerce(bytes.subarray(prefixSize, prefixSize + specs.multihashSize));
      if (multihashBytes.byteLength !== specs.multihashSize) {
        throw new Error("Incorrect length");
      }
      const digestBytes = multihashBytes.subarray(specs.multihashSize - specs.digestSize);
      const digest3 = new Digest(specs.multihashCode, specs.digestSize, digestBytes, multihashBytes);
      const cid = specs.version === 0 ? _CID.createV0(digest3) : _CID.createV1(specs.codec, digest3);
      return [cid, bytes.subarray(specs.size)];
    }
    /**
     * Inspect the initial bytes of a CID to determine its properties.
     *
     * Involves decoding up to 4 varints. Typically this will require only 4 to 6
     * bytes but for larger multicodec code values and larger multihash digest
     * lengths these varints can be quite large. It is recommended that at least
     * 10 bytes be made available in the `initialBytes` argument for a complete
     * inspection.
     */
    static inspectBytes(initialBytes) {
      let offset = 0;
      const next = () => {
        const [i, length6] = decode4(initialBytes.subarray(offset));
        offset += length6;
        return i;
      };
      let version = next();
      let codec = DAG_PB_CODE;
      if (version === 18) {
        version = 0;
        offset = 0;
      } else {
        codec = next();
      }
      if (version !== 0 && version !== 1) {
        throw new RangeError(`Invalid CID version ${version}`);
      }
      const prefixSize = offset;
      const multihashCode = next();
      const digestSize = next();
      const size = offset + digestSize;
      const multihashSize = size - prefixSize;
      return { version, codec, multihashCode, digestSize, multihashSize, size };
    }
    /**
     * Takes cid in a string representation and creates an instance. If `base`
     * decoder is not provided will use a default from the configuration. It will
     * throw an error if encoding of the CID is not compatible with supplied (or
     * a default decoder).
     */
    static parse(source, base4) {
      const [prefix, bytes] = parseCIDtoBytes(source, base4);
      const cid = _CID.decode(bytes);
      if (cid.version === 0 && source[0] !== "Q") {
        throw Error("Version 0 CID string must not include multibase prefix");
      }
      baseCache(cid).set(prefix, source);
      return cid;
    }
  };
  function parseCIDtoBytes(source, base4) {
    switch (source[0]) {
      // CIDv0 is parsed differently
      case "Q": {
        const decoder = base4 ?? base58btc;
        return [
          base58btc.prefix,
          decoder.decode(`${base58btc.prefix}${source}`)
        ];
      }
      case base58btc.prefix: {
        const decoder = base4 ?? base58btc;
        return [base58btc.prefix, decoder.decode(source)];
      }
      case base32.prefix: {
        const decoder = base4 ?? base32;
        return [base32.prefix, decoder.decode(source)];
      }
      case base36.prefix: {
        const decoder = base4 ?? base36;
        return [base36.prefix, decoder.decode(source)];
      }
      default: {
        if (base4 == null) {
          throw Error("To parse non base32, base36 or base58btc encoded CID multibase decoder must be provided");
        }
        return [source[0], base4.decode(source)];
      }
    }
  }
  function toStringV0(bytes, cache4, base4) {
    const { prefix } = base4;
    if (prefix !== base58btc.prefix) {
      throw Error(`Cannot string encode V0 in ${base4.name} encoding`);
    }
    const cid = cache4.get(prefix);
    if (cid == null) {
      const cid2 = base4.encode(bytes).slice(1);
      cache4.set(prefix, cid2);
      return cid2;
    } else {
      return cid;
    }
  }
  function toStringV1(bytes, cache4, base4) {
    const { prefix } = base4;
    const cid = cache4.get(prefix);
    if (cid == null) {
      const cid2 = base4.encode(bytes);
      cache4.set(prefix, cid2);
      return cid2;
    } else {
      return cid;
    }
  }
  var DAG_PB_CODE = 112;
  var SHA_256_CODE = 18;
  function encodeCID(version, code8, multihash) {
    const codeOffset = encodingLength(version);
    const hashOffset = codeOffset + encodingLength(code8);
    const bytes = new Uint8Array(hashOffset + multihash.byteLength);
    encodeTo(version, bytes, 0);
    encodeTo(code8, bytes, codeOffset);
    bytes.set(multihash, hashOffset);
    return bytes;
  }
  var cidSymbol = /* @__PURE__ */ Symbol.for("@ipld/js-cid/CID");

  // node_modules/@ipld/dag-cbor/src/index.js
  var CID_CBOR_TAG = 42;
  function toByteView(buf) {
    if (buf instanceof ArrayBuffer) {
      return new Uint8Array(buf, 0, buf.byteLength);
    }
    return buf;
  }
  function cidEncoder(obj) {
    if (obj.asCID !== obj && obj["/"] !== obj.bytes) {
      return null;
    }
    const cid = CID.asCID(obj);
    if (!cid) {
      return null;
    }
    const bytes = new Uint8Array(cid.bytes.byteLength + 1);
    bytes.set(cid.bytes, 1);
    return [
      new Token(Type.tag, CID_CBOR_TAG),
      new Token(Type.bytes, bytes)
    ];
  }
  function undefinedEncoder() {
    throw new Error("`undefined` is not supported by the IPLD Data Model and cannot be encoded");
  }
  function numberEncoder(num) {
    if (Number.isNaN(num)) {
      throw new Error("`NaN` is not supported by the IPLD Data Model and cannot be encoded");
    }
    if (num === Infinity || num === -Infinity) {
      throw new Error("`Infinity` and `-Infinity` is not supported by the IPLD Data Model and cannot be encoded");
    }
    return null;
  }
  function mapEncoder(map2) {
    for (const key of map2.keys()) {
      if (typeof key !== "string" || key.length === 0) {
        throw new Error("Non-string Map keys are not supported by the IPLD Data Model and cannot be encoded");
      }
    }
    return null;
  }
  var _encodeOptions = {
    float64: true,
    typeEncoders: {
      Map: mapEncoder,
      Object: cidEncoder,
      undefined: undefinedEncoder,
      number: numberEncoder
    }
  };
  var encodeOptions = {
    ..._encodeOptions,
    typeEncoders: {
      ..._encodeOptions.typeEncoders
    }
  };
  function cidDecoder(decode25) {
    const bytes = (
      /** @type {Uint8Array} */
      decode25()
    );
    if (bytes[0] !== 0) {
      throw new Error("Invalid CID for CBOR tag 42; expected leading 0x00");
    }
    return CID.decode(bytes.subarray(1));
  }
  var _decodeOptions = {
    allowIndefinite: false,
    coerceUndefinedToNull: true,
    allowNaN: false,
    allowInfinity: false,
    allowBigInt: true,
    // this will lead to BigInt for ints outside of
    // safe-integer range, which may surprise users
    strict: true,
    useMaps: false,
    rejectDuplicateMapKeys: true,
    /** @type {{ [tagNumber: number]: import('cborg').TagDecoder }} */
    tags: { [CID_CBOR_TAG]: cidDecoder }
  };
  var decodeOptions = {
    ..._decodeOptions,
    tags: { ..._decodeOptions.tags }
  };
  var code = 113;
  var decode6 = (data) => decode(toByteView(data), _decodeOptions);

  // node_modules/@ipld/car/src/decoder-common.js
  var import_varint2 = __toESM(require_varint(), 1);
  var CIDV0_BYTES = {
    SHA2_256: 18,
    LENGTH: 32,
    DAG_PB: 112
  };
  var V2_HEADER_LENGTH = (
    /* characteristics */
    16 + 8 + 8 + 8
  );
  function decodeVarint(bytes, seeker) {
    if (!bytes.length) {
      throw new Error("Unexpected end of data");
    }
    const i = import_varint2.default.decode(bytes);
    seeker.seek(
      /** @type {number} */
      import_varint2.default.decode.bytes
    );
    return i;
  }
  function decodeV2Header(bytes) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 0;
    const header = {
      version: 2,
      /** @type {[bigint, bigint]} */
      characteristics: [
        dv.getBigUint64(offset, true),
        dv.getBigUint64(offset += 8, true)
      ],
      dataOffset: Number(dv.getBigUint64(offset += 8, true)),
      dataSize: Number(dv.getBigUint64(offset += 8, true)),
      indexOffset: Number(dv.getBigUint64(offset += 8, true))
    };
    return header;
  }
  function getMultihashLength(bytes) {
    import_varint2.default.decode(bytes);
    const codeLength = (
      /** @type {number} */
      import_varint2.default.decode.bytes
    );
    const length6 = import_varint2.default.decode(bytes.subarray(import_varint2.default.decode.bytes));
    const lengthLength = (
      /** @type {number} */
      import_varint2.default.decode.bytes
    );
    const mhLength = codeLength + lengthLength + length6;
    return mhLength;
  }

  // node_modules/@ipld/car/src/header-validator.js
  var Kinds = {
    Null: (
      /**
       * @param obj
       * @returns {undefined|null}
       */
      (obj) => obj === null ? obj : void 0
    ),
    Int: (
      /**
       * @param obj
       * @returns {undefined|number}
       */
      (obj) => Number.isInteger(obj) ? obj : void 0
    ),
    Float: (
      /**
       * @param obj
       * @returns {undefined|number}
       */
      (obj) => typeof obj === "number" && Number.isFinite(obj) ? obj : void 0
    ),
    String: (
      /**
       * @param obj
       * @returns {undefined|string}
       */
      (obj) => typeof obj === "string" ? obj : void 0
    ),
    Bool: (
      /**
       * @param obj
       * @returns {undefined|boolean}
       */
      (obj) => typeof obj === "boolean" ? obj : void 0
    ),
    Bytes: (
      /**
       * @param obj
       * @returns {undefined|Uint8Array}
       */
      (obj) => obj instanceof Uint8Array ? obj : void 0
    ),
    Link: (
      /**
       * @param obj
       * @returns {undefined|object}
       */
      (obj) => obj !== null && typeof obj === "object" && obj.asCID === obj ? obj : void 0
    ),
    List: (
      /**
       * @param obj
       * @returns {undefined|Array<any>}
       */
      (obj) => Array.isArray(obj) ? obj : void 0
    ),
    Map: (
      /**
       * @param obj
       * @returns {undefined|object}
       */
      (obj) => obj !== null && typeof obj === "object" && obj.asCID !== obj && !Array.isArray(obj) && !(obj instanceof Uint8Array) ? obj : void 0
    )
  };
  var Types = {
    "CarV1HeaderOrV2Pragma > roots (anon) > valueType (anon)": Kinds.Link,
    "CarV1HeaderOrV2Pragma > roots (anon)": (
      /**
       * @param obj
       * @returns {undefined|any}
       */
      (obj) => {
        if (Kinds.List(obj) === void 0) {
          return void 0;
        }
        for (let i = 0; i < obj.length; i++) {
          let v = obj[i];
          v = Types["CarV1HeaderOrV2Pragma > roots (anon) > valueType (anon)"](v);
          if (v === void 0) {
            return void 0;
          }
          if (v !== obj[i]) {
            const ret = obj.slice(0, i);
            for (let j = i; j < obj.length; j++) {
              let v2 = obj[j];
              v2 = Types["CarV1HeaderOrV2Pragma > roots (anon) > valueType (anon)"](v2);
              if (v2 === void 0) {
                return void 0;
              }
              ret.push(v2);
            }
            return ret;
          }
        }
        return obj;
      }
    ),
    Int: Kinds.Int,
    CarV1HeaderOrV2Pragma: (
      /**
       * @param obj
       * @returns {undefined|any}
       */
      (obj) => {
        if (Kinds.Map(obj) === void 0) {
          return void 0;
        }
        const entries = Object.entries(obj);
        let ret = obj;
        let requiredCount = 1;
        for (let i = 0; i < entries.length; i++) {
          const [key, value] = entries[i];
          switch (key) {
            case "roots":
              {
                const v = Types["CarV1HeaderOrV2Pragma > roots (anon)"](obj[key]);
                if (v === void 0) {
                  return void 0;
                }
                if (v !== value || ret !== obj) {
                  if (ret === obj) {
                    ret = {};
                    for (let j = 0; j < i; j++) {
                      ret[entries[j][0]] = entries[j][1];
                    }
                  }
                  ret.roots = v;
                }
              }
              break;
            case "version":
              {
                requiredCount--;
                const v = Types.Int(obj[key]);
                if (v === void 0) {
                  return void 0;
                }
                if (v !== value || ret !== obj) {
                  if (ret === obj) {
                    ret = {};
                    for (let j = 0; j < i; j++) {
                      ret[entries[j][0]] = entries[j][1];
                    }
                  }
                  ret.version = v;
                }
              }
              break;
            default:
              return void 0;
          }
        }
        if (requiredCount > 0) {
          return void 0;
        }
        return ret;
      }
    )
  };
  var Reprs = {
    "CarV1HeaderOrV2Pragma > roots (anon) > valueType (anon)": Kinds.Link,
    "CarV1HeaderOrV2Pragma > roots (anon)": (
      /**
       * @param obj
       * @returns {undefined|any}
       */
      (obj) => {
        if (Kinds.List(obj) === void 0) {
          return void 0;
        }
        for (let i = 0; i < obj.length; i++) {
          let v = obj[i];
          v = Reprs["CarV1HeaderOrV2Pragma > roots (anon) > valueType (anon)"](v);
          if (v === void 0) {
            return void 0;
          }
          if (v !== obj[i]) {
            const ret = obj.slice(0, i);
            for (let j = i; j < obj.length; j++) {
              let v2 = obj[j];
              v2 = Reprs["CarV1HeaderOrV2Pragma > roots (anon) > valueType (anon)"](v2);
              if (v2 === void 0) {
                return void 0;
              }
              ret.push(v2);
            }
            return ret;
          }
        }
        return obj;
      }
    ),
    Int: Kinds.Int,
    CarV1HeaderOrV2Pragma: (
      /**
       * @param obj
       * @returns {undefined|any}
       */
      (obj) => {
        if (Kinds.Map(obj) === void 0) {
          return void 0;
        }
        const entries = Object.entries(obj);
        let ret = obj;
        let requiredCount = 1;
        for (let i = 0; i < entries.length; i++) {
          const [key, value] = entries[i];
          switch (key) {
            case "roots":
              {
                const v = Reprs["CarV1HeaderOrV2Pragma > roots (anon)"](value);
                if (v === void 0) {
                  return void 0;
                }
                if (v !== value || ret !== obj) {
                  if (ret === obj) {
                    ret = {};
                    for (let j = 0; j < i; j++) {
                      ret[entries[j][0]] = entries[j][1];
                    }
                  }
                  ret.roots = v;
                }
              }
              break;
            case "version":
              {
                requiredCount--;
                const v = Reprs.Int(value);
                if (v === void 0) {
                  return void 0;
                }
                if (v !== value || ret !== obj) {
                  if (ret === obj) {
                    ret = {};
                    for (let j = 0; j < i; j++) {
                      ret[entries[j][0]] = entries[j][1];
                    }
                  }
                  ret.version = v;
                }
              }
              break;
            default:
              return void 0;
          }
        }
        if (requiredCount > 0) {
          return void 0;
        }
        return ret;
      }
    )
  };
  var CarV1HeaderOrV2Pragma = {
    toTyped: Types.CarV1HeaderOrV2Pragma,
    toRepresentation: Reprs.CarV1HeaderOrV2Pragma
  };

  // node_modules/cborg/lib/is.js
  var objectTypeNames2 = [
    "Object",
    // for Object.create(null) and other non-plain objects
    "RegExp",
    "Date",
    "Error",
    "Map",
    "Set",
    "WeakMap",
    "WeakSet",
    "ArrayBuffer",
    "SharedArrayBuffer",
    "DataView",
    "Promise",
    "URL",
    "HTMLElement",
    "Int8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Uint16Array",
    "Int32Array",
    "Uint32Array",
    "Float32Array",
    "Float64Array",
    "BigInt64Array",
    "BigUint64Array"
  ];
  function is2(value) {
    if (value === null) {
      return "null";
    }
    if (value === void 0) {
      return "undefined";
    }
    if (value === true || value === false) {
      return "boolean";
    }
    const typeOf = typeof value;
    if (typeOf === "string" || typeOf === "number" || typeOf === "bigint" || typeOf === "symbol") {
      return typeOf;
    }
    if (typeOf === "function") {
      return "Function";
    }
    if (Array.isArray(value)) {
      return "Array";
    }
    if (value instanceof Uint8Array) {
      return "Uint8Array";
    }
    if (value.constructor === Object) {
      return "Object";
    }
    const objectType = getObjectType2(value);
    if (objectType) {
      return objectType;
    }
    return "Object";
  }
  function getObjectType2(value) {
    const objectTypeName = Object.prototype.toString.call(value).slice(8, -1);
    if (objectTypeNames2.includes(objectTypeName)) {
      return objectTypeName;
    }
    return void 0;
  }

  // node_modules/cborg/lib/token.js
  var Type2 = class {
    /**
     * @param {number} major
     * @param {string} name
     * @param {boolean} terminal
     */
    constructor(major, name3, terminal) {
      this.major = major;
      this.majorEncoded = major << 5;
      this.name = name3;
      this.terminal = terminal;
    }
    /* c8 ignore next 3 */
    toString() {
      return `Type[${this.major}].${this.name}`;
    }
    /**
     * @param {Type} typ
     * @returns {number}
     */
    compare(typ) {
      return this.major < typ.major ? -1 : this.major > typ.major ? 1 : 0;
    }
    /**
     * Check equality between two Type instances. Safe to use across different
     * copies of the Type class (e.g., when bundlers duplicate the module).
     * (major, name) uniquely identifies a Type; terminal is implied by these.
     * @param {Type} a
     * @param {Type} b
     * @returns {boolean}
     */
    static equals(a, b) {
      return a === b || a.major === b.major && a.name === b.name;
    }
  };
  Type2.uint = new Type2(0, "uint", true);
  Type2.negint = new Type2(1, "negint", true);
  Type2.bytes = new Type2(2, "bytes", true);
  Type2.string = new Type2(3, "string", true);
  Type2.array = new Type2(4, "array", false);
  Type2.map = new Type2(5, "map", false);
  Type2.tag = new Type2(6, "tag", false);
  Type2.float = new Type2(7, "float", true);
  Type2.false = new Type2(7, "false", true);
  Type2.true = new Type2(7, "true", true);
  Type2.null = new Type2(7, "null", true);
  Type2.undefined = new Type2(7, "undefined", true);
  Type2.break = new Type2(7, "break", true);
  var Token2 = class {
    /**
     * @param {Type} type
     * @param {any} [value]
     * @param {number} [encodedLength]
     */
    constructor(type, value, encodedLength) {
      this.type = type;
      this.value = value;
      this.encodedLength = encodedLength;
      this.encodedBytes = void 0;
      this.byteValue = void 0;
    }
    /* c8 ignore next 3 */
    toString() {
      return `Token[${this.type}].${this.value}`;
    }
  };

  // node_modules/cborg/lib/byte-utils.js
  var useBuffer2 = globalThis.process && // @ts-ignore
  !globalThis.process.browser && // @ts-ignore
  globalThis.Buffer && // @ts-ignore
  typeof globalThis.Buffer.isBuffer === "function";
  var textEncoder2 = new TextEncoder();
  function isBuffer2(buf) {
    return useBuffer2 && globalThis.Buffer.isBuffer(buf);
  }
  function asU8A2(buf) {
    if (!(buf instanceof Uint8Array)) {
      return Uint8Array.from(buf);
    }
    return isBuffer2(buf) ? new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength) : buf;
  }
  var FROM_STRING_THRESHOLD_BUFFER2 = 24;
  var FROM_STRING_THRESHOLD_TEXTENCODER2 = 200;
  var fromString3 = useBuffer2 ? (
    // eslint-disable-line operator-linebreak
    /**
     * @param {string} string
     */
    (string3) => {
      return string3.length >= FROM_STRING_THRESHOLD_BUFFER2 ? (
        // eslint-disable-line operator-linebreak
        // @ts-ignore
        globalThis.Buffer.from(string3)
      ) : utf8ToBytes2(string3);
    }
  ) : (
    // eslint-disable-line operator-linebreak
    /**
     * @param {string} string
     */
    (string3) => {
      return string3.length >= FROM_STRING_THRESHOLD_TEXTENCODER2 ? textEncoder2.encode(string3) : utf8ToBytes2(string3);
    }
  );
  var fromArray2 = (arr) => {
    return Uint8Array.from(arr);
  };
  var slice2 = useBuffer2 ? (
    // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array} bytes
     * @param {number} start
     * @param {number} end
     */
    // Buffer.slice() returns a view, not a copy, so we need special handling
    (bytes, start, end) => {
      if (isBuffer2(bytes)) {
        return new Uint8Array(bytes.subarray(start, end));
      }
      return bytes.slice(start, end);
    }
  ) : (
    // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array} bytes
     * @param {number} start
     * @param {number} end
     */
    (bytes, start, end) => {
      return bytes.slice(start, end);
    }
  );
  var concat2 = useBuffer2 ? (
    // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array[]} chunks
     * @param {number} length
     * @returns {Uint8Array}
     */
    (chunks, length6) => {
      chunks = chunks.map((c) => c instanceof Uint8Array ? c : (
        // eslint-disable-line operator-linebreak
        // @ts-ignore
        globalThis.Buffer.from(c)
      ));
      return asU8A2(globalThis.Buffer.concat(chunks, length6));
    }
  ) : (
    // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array[]} chunks
     * @param {number} length
     * @returns {Uint8Array}
     */
    (chunks, length6) => {
      const out = new Uint8Array(length6);
      let off = 0;
      for (let b of chunks) {
        if (off + b.length > out.length) {
          b = b.subarray(0, out.length - off);
        }
        out.set(b, off);
        off += b.length;
      }
      return out;
    }
  );
  var alloc2 = useBuffer2 ? (
    // eslint-disable-line operator-linebreak
    /**
     * @param {number} size
     * @returns {Uint8Array}
     */
    (size) => {
      return globalThis.Buffer.allocUnsafe(size);
    }
  ) : (
    // eslint-disable-line operator-linebreak
    /**
     * @param {number} size
     * @returns {Uint8Array}
     */
    (size) => {
      return new Uint8Array(size);
    }
  );
  function compare2(b1, b2) {
    if (isBuffer2(b1) && isBuffer2(b2)) {
      return b1.compare(b2);
    }
    for (let i = 0; i < b1.length; i++) {
      if (b1[i] === b2[i]) {
        continue;
      }
      return b1[i] < b2[i] ? -1 : 1;
    }
    return 0;
  }
  function utf8ToBytes2(str) {
    const out = [];
    let p = 0;
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 128) {
        out[p++] = c;
      } else if (c < 2048) {
        out[p++] = c >> 6 | 192;
        out[p++] = c & 63 | 128;
      } else if ((c & 64512) === 55296 && i + 1 < str.length && (str.charCodeAt(i + 1) & 64512) === 56320) {
        c = 65536 + ((c & 1023) << 10) + (str.charCodeAt(++i) & 1023);
        out[p++] = c >> 18 | 240;
        out[p++] = c >> 12 & 63 | 128;
        out[p++] = c >> 6 & 63 | 128;
        out[p++] = c & 63 | 128;
      } else {
        if (c >= 55296 && c <= 57343) {
          c = 65533;
        }
        out[p++] = c >> 12 | 224;
        out[p++] = c >> 6 & 63 | 128;
        out[p++] = c & 63 | 128;
      }
    }
    return out;
  }

  // node_modules/cborg/lib/bl.js
  var defaultChunkSize2 = 256;
  var Bl2 = class {
    /**
     * @param {number} [chunkSize]
     */
    constructor(chunkSize = defaultChunkSize2) {
      this.chunkSize = chunkSize;
      this.cursor = 0;
      this.maxCursor = -1;
      this.chunks = [];
      this._initReuseChunk = null;
    }
    reset() {
      this.cursor = 0;
      this.maxCursor = -1;
      if (this.chunks.length) {
        this.chunks = [];
      }
      if (this._initReuseChunk !== null) {
        this.chunks.push(this._initReuseChunk);
        this.maxCursor = this._initReuseChunk.length - 1;
      }
    }
    /**
     * @param {Uint8Array|number[]} bytes
     */
    push(bytes) {
      let topChunk = this.chunks[this.chunks.length - 1];
      const newMax = this.cursor + bytes.length;
      if (newMax <= this.maxCursor + 1) {
        const chunkPos = topChunk.length - (this.maxCursor - this.cursor) - 1;
        topChunk.set(bytes, chunkPos);
      } else {
        if (topChunk) {
          const chunkPos = topChunk.length - (this.maxCursor - this.cursor) - 1;
          if (chunkPos < topChunk.length) {
            this.chunks[this.chunks.length - 1] = topChunk.subarray(0, chunkPos);
            this.maxCursor = this.cursor - 1;
          }
        }
        if (bytes.length < 64 && bytes.length < this.chunkSize) {
          topChunk = alloc2(this.chunkSize);
          this.chunks.push(topChunk);
          this.maxCursor += topChunk.length;
          if (this._initReuseChunk === null) {
            this._initReuseChunk = topChunk;
          }
          topChunk.set(bytes, 0);
        } else {
          this.chunks.push(bytes);
          this.maxCursor += bytes.length;
        }
      }
      this.cursor += bytes.length;
    }
    /**
     * @param {boolean} [reset]
     * @returns {Uint8Array}
     */
    toBytes(reset = false) {
      let byts;
      if (this.chunks.length === 1) {
        const chunk = this.chunks[0];
        if (reset && this.cursor > chunk.length / 2) {
          byts = this.cursor === chunk.length ? chunk : chunk.subarray(0, this.cursor);
          this._initReuseChunk = null;
          this.chunks = [];
        } else {
          byts = slice2(chunk, 0, this.cursor);
        }
      } else {
        byts = concat2(this.chunks, this.cursor);
      }
      if (reset) {
        this.reset();
      }
      return byts;
    }
  };
  var U8Bl2 = class {
    /**
     * @param {Uint8Array} dest
     */
    constructor(dest) {
      this.dest = dest;
      this.cursor = 0;
      this.chunks = [dest];
    }
    reset() {
      this.cursor = 0;
    }
    /**
     * @param {Uint8Array|number[]} bytes
     */
    push(bytes) {
      if (this.cursor + bytes.length > this.dest.length) {
        throw new Error("write out of bounds, destination buffer is too small");
      }
      this.dest.set(bytes, this.cursor);
      this.cursor += bytes.length;
    }
    /**
     * @param {boolean} [reset]
     * @returns {Uint8Array}
     */
    toBytes(reset = false) {
      const byts = this.dest.subarray(0, this.cursor);
      if (reset) {
        this.reset();
      }
      return byts;
    }
  };

  // node_modules/cborg/lib/common.js
  var decodeErrPrefix2 = "CBOR decode error:";
  var encodeErrPrefix2 = "CBOR encode error:";
  var uintMinorPrefixBytes2 = [];
  uintMinorPrefixBytes2[23] = 1;
  uintMinorPrefixBytes2[24] = 2;
  uintMinorPrefixBytes2[25] = 3;
  uintMinorPrefixBytes2[26] = 5;
  uintMinorPrefixBytes2[27] = 9;
  function assertEnoughData2(data, pos, need) {
    if (data.length - pos < need) {
      throw new Error(`${decodeErrPrefix2} not enough data for type`);
    }
  }

  // node_modules/cborg/lib/0uint.js
  var uintBoundaries2 = [24, 256, 65536, 4294967296, BigInt("18446744073709551616")];
  function readUint82(data, offset, options) {
    assertEnoughData2(data, offset, 1);
    const value = data[offset];
    if (options.strict === true && value < uintBoundaries2[0]) {
      throw new Error(`${decodeErrPrefix2} integer encoded in more bytes than necessary (strict decode)`);
    }
    return value;
  }
  function readUint162(data, offset, options) {
    assertEnoughData2(data, offset, 2);
    const value = data[offset] << 8 | data[offset + 1];
    if (options.strict === true && value < uintBoundaries2[1]) {
      throw new Error(`${decodeErrPrefix2} integer encoded in more bytes than necessary (strict decode)`);
    }
    return value;
  }
  function readUint322(data, offset, options) {
    assertEnoughData2(data, offset, 4);
    const value = data[offset] * 16777216 + (data[offset + 1] << 16) + (data[offset + 2] << 8) + data[offset + 3];
    if (options.strict === true && value < uintBoundaries2[2]) {
      throw new Error(`${decodeErrPrefix2} integer encoded in more bytes than necessary (strict decode)`);
    }
    return value;
  }
  function readUint642(data, offset, options) {
    assertEnoughData2(data, offset, 8);
    const hi = data[offset] * 16777216 + (data[offset + 1] << 16) + (data[offset + 2] << 8) + data[offset + 3];
    const lo = data[offset + 4] * 16777216 + (data[offset + 5] << 16) + (data[offset + 6] << 8) + data[offset + 7];
    const value = (BigInt(hi) << BigInt(32)) + BigInt(lo);
    if (options.strict === true && value < uintBoundaries2[3]) {
      throw new Error(`${decodeErrPrefix2} integer encoded in more bytes than necessary (strict decode)`);
    }
    if (value <= Number.MAX_SAFE_INTEGER) {
      return Number(value);
    }
    if (options.allowBigInt === true) {
      return value;
    }
    throw new Error(`${decodeErrPrefix2} integers outside of the safe integer range are not supported`);
  }
  function decodeUint82(data, pos, _minor, options) {
    return new Token2(Type2.uint, readUint82(data, pos + 1, options), 2);
  }
  function decodeUint162(data, pos, _minor, options) {
    return new Token2(Type2.uint, readUint162(data, pos + 1, options), 3);
  }
  function decodeUint322(data, pos, _minor, options) {
    return new Token2(Type2.uint, readUint322(data, pos + 1, options), 5);
  }
  function decodeUint642(data, pos, _minor, options) {
    return new Token2(Type2.uint, readUint642(data, pos + 1, options), 9);
  }
  function encodeUint2(writer, token) {
    return encodeUintValue2(writer, 0, token.value);
  }
  function encodeUintValue2(writer, major, uint) {
    if (uint < uintBoundaries2[0]) {
      const nuint = Number(uint);
      writer.push([major | nuint]);
    } else if (uint < uintBoundaries2[1]) {
      const nuint = Number(uint);
      writer.push([major | 24, nuint]);
    } else if (uint < uintBoundaries2[2]) {
      const nuint = Number(uint);
      writer.push([major | 25, nuint >>> 8, nuint & 255]);
    } else if (uint < uintBoundaries2[3]) {
      const nuint = Number(uint);
      writer.push([major | 26, nuint >>> 24 & 255, nuint >>> 16 & 255, nuint >>> 8 & 255, nuint & 255]);
    } else {
      const buint = BigInt(uint);
      if (buint < uintBoundaries2[4]) {
        const set = [major | 27, 0, 0, 0, 0, 0, 0, 0];
        let lo = Number(buint & BigInt(4294967295));
        let hi = Number(buint >> BigInt(32) & BigInt(4294967295));
        set[8] = lo & 255;
        lo = lo >> 8;
        set[7] = lo & 255;
        lo = lo >> 8;
        set[6] = lo & 255;
        lo = lo >> 8;
        set[5] = lo & 255;
        set[4] = hi & 255;
        hi = hi >> 8;
        set[3] = hi & 255;
        hi = hi >> 8;
        set[2] = hi & 255;
        hi = hi >> 8;
        set[1] = hi & 255;
        writer.push(set);
      } else {
        throw new Error(`${decodeErrPrefix2} encountered BigInt larger than allowable range`);
      }
    }
  }
  encodeUint2.encodedSize = function encodedSize9(token) {
    return encodeUintValue2.encodedSize(token.value);
  };
  encodeUintValue2.encodedSize = function encodedSize10(uint) {
    if (uint < uintBoundaries2[0]) {
      return 1;
    }
    if (uint < uintBoundaries2[1]) {
      return 2;
    }
    if (uint < uintBoundaries2[2]) {
      return 3;
    }
    if (uint < uintBoundaries2[3]) {
      return 5;
    }
    return 9;
  };
  encodeUint2.compareTokens = function compareTokens4(tok1, tok2) {
    return tok1.value < tok2.value ? -1 : tok1.value > tok2.value ? 1 : (
      /* c8 ignore next */
      0
    );
  };

  // node_modules/cborg/lib/1negint.js
  function decodeNegint82(data, pos, _minor, options) {
    return new Token2(Type2.negint, -1 - readUint82(data, pos + 1, options), 2);
  }
  function decodeNegint162(data, pos, _minor, options) {
    return new Token2(Type2.negint, -1 - readUint162(data, pos + 1, options), 3);
  }
  function decodeNegint322(data, pos, _minor, options) {
    return new Token2(Type2.negint, -1 - readUint322(data, pos + 1, options), 5);
  }
  var neg1b3 = BigInt(-1);
  var pos1b3 = BigInt(1);
  function decodeNegint642(data, pos, _minor, options) {
    const int = readUint642(data, pos + 1, options);
    if (typeof int !== "bigint") {
      const value = -1 - int;
      if (value >= Number.MIN_SAFE_INTEGER) {
        return new Token2(Type2.negint, value, 9);
      }
    }
    if (options.allowBigInt !== true) {
      throw new Error(`${decodeErrPrefix2} integers outside of the safe integer range are not supported`);
    }
    return new Token2(Type2.negint, neg1b3 - BigInt(int), 9);
  }
  function encodeNegint2(writer, token) {
    const negint = token.value;
    const unsigned = typeof negint === "bigint" ? negint * neg1b3 - pos1b3 : negint * -1 - 1;
    encodeUintValue2(writer, token.type.majorEncoded, unsigned);
  }
  encodeNegint2.encodedSize = function encodedSize11(token) {
    const negint = token.value;
    const unsigned = typeof negint === "bigint" ? negint * neg1b3 - pos1b3 : negint * -1 - 1;
    if (unsigned < uintBoundaries2[0]) {
      return 1;
    }
    if (unsigned < uintBoundaries2[1]) {
      return 2;
    }
    if (unsigned < uintBoundaries2[2]) {
      return 3;
    }
    if (unsigned < uintBoundaries2[3]) {
      return 5;
    }
    return 9;
  };
  encodeNegint2.compareTokens = function compareTokens5(tok1, tok2) {
    return tok1.value < tok2.value ? 1 : tok1.value > tok2.value ? -1 : (
      /* c8 ignore next */
      0
    );
  };

  // node_modules/cborg/lib/2bytes.js
  function toToken5(data, pos, prefix, length6) {
    assertEnoughData2(data, pos, prefix + length6);
    const buf = data.slice(pos + prefix, pos + prefix + length6);
    return new Token2(Type2.bytes, buf, prefix + length6);
  }
  function decodeBytesCompact2(data, pos, minor, _options) {
    return toToken5(data, pos, 1, minor);
  }
  function decodeBytes82(data, pos, _minor, options) {
    return toToken5(data, pos, 2, readUint82(data, pos + 1, options));
  }
  function decodeBytes162(data, pos, _minor, options) {
    return toToken5(data, pos, 3, readUint162(data, pos + 1, options));
  }
  function decodeBytes322(data, pos, _minor, options) {
    return toToken5(data, pos, 5, readUint322(data, pos + 1, options));
  }
  function decodeBytes642(data, pos, _minor, options) {
    const l = readUint642(data, pos + 1, options);
    if (typeof l === "bigint") {
      throw new Error(`${decodeErrPrefix2} 64-bit integer bytes lengths not supported`);
    }
    return toToken5(data, pos, 9, l);
  }
  function tokenBytes2(token) {
    if (token.encodedBytes === void 0) {
      token.encodedBytes = Type2.equals(token.type, Type2.string) ? fromString3(token.value) : token.value;
    }
    return token.encodedBytes;
  }
  function encodeBytes2(writer, token) {
    const bytes = tokenBytes2(token);
    encodeUintValue2(writer, token.type.majorEncoded, bytes.length);
    writer.push(bytes);
  }
  encodeBytes2.encodedSize = function encodedSize12(token) {
    const bytes = tokenBytes2(token);
    return encodeUintValue2.encodedSize(bytes.length) + bytes.length;
  };
  encodeBytes2.compareTokens = function compareTokens6(tok1, tok2) {
    return compareBytes2(tokenBytes2(tok1), tokenBytes2(tok2));
  };
  function compareBytes2(b1, b2) {
    return b1.length < b2.length ? -1 : b1.length > b2.length ? 1 : compare2(b1, b2);
  }

  // node_modules/cborg/lib/3string.js
  var textDecoder2 = new TextDecoder();
  var ASCII_THRESHOLD2 = 32;
  function toStr2(bytes, start, end) {
    const len = end - start;
    if (len < ASCII_THRESHOLD2) {
      let str = "";
      for (let i = start; i < end; i++) {
        const c = bytes[i];
        if (c & 128) {
          return textDecoder2.decode(bytes.subarray(start, end));
        }
        str += String.fromCharCode(c);
      }
      return str;
    }
    return textDecoder2.decode(bytes.subarray(start, end));
  }
  function toToken6(data, pos, prefix, length6, options) {
    const totLength = prefix + length6;
    assertEnoughData2(data, pos, totLength);
    const tok = new Token2(Type2.string, toStr2(data, pos + prefix, pos + totLength), totLength);
    if (options.retainStringBytes === true) {
      tok.byteValue = data.slice(pos + prefix, pos + totLength);
    }
    return tok;
  }
  function decodeStringCompact2(data, pos, minor, options) {
    return toToken6(data, pos, 1, minor, options);
  }
  function decodeString82(data, pos, _minor, options) {
    return toToken6(data, pos, 2, readUint82(data, pos + 1, options), options);
  }
  function decodeString162(data, pos, _minor, options) {
    return toToken6(data, pos, 3, readUint162(data, pos + 1, options), options);
  }
  function decodeString322(data, pos, _minor, options) {
    return toToken6(data, pos, 5, readUint322(data, pos + 1, options), options);
  }
  function decodeString642(data, pos, _minor, options) {
    const l = readUint642(data, pos + 1, options);
    if (typeof l === "bigint") {
      throw new Error(`${decodeErrPrefix2} 64-bit integer string lengths not supported`);
    }
    return toToken6(data, pos, 9, l, options);
  }
  var encodeString2 = encodeBytes2;

  // node_modules/cborg/lib/4array.js
  function toToken7(_data, _pos, prefix, length6) {
    return new Token2(Type2.array, length6, prefix);
  }
  function decodeArrayCompact2(data, pos, minor, _options) {
    return toToken7(data, pos, 1, minor);
  }
  function decodeArray82(data, pos, _minor, options) {
    return toToken7(data, pos, 2, readUint82(data, pos + 1, options));
  }
  function decodeArray162(data, pos, _minor, options) {
    return toToken7(data, pos, 3, readUint162(data, pos + 1, options));
  }
  function decodeArray322(data, pos, _minor, options) {
    return toToken7(data, pos, 5, readUint322(data, pos + 1, options));
  }
  function decodeArray642(data, pos, _minor, options) {
    const l = readUint642(data, pos + 1, options);
    if (typeof l === "bigint") {
      throw new Error(`${decodeErrPrefix2} 64-bit integer array lengths not supported`);
    }
    return toToken7(data, pos, 9, l);
  }
  function decodeArrayIndefinite2(data, pos, _minor, options) {
    if (options.allowIndefinite === false) {
      throw new Error(`${decodeErrPrefix2} indefinite length items not allowed`);
    }
    return toToken7(data, pos, 1, Infinity);
  }
  function encodeArray2(writer, token) {
    encodeUintValue2(writer, Type2.array.majorEncoded, token.value);
  }
  encodeArray2.compareTokens = encodeUint2.compareTokens;
  encodeArray2.encodedSize = function encodedSize13(token) {
    return encodeUintValue2.encodedSize(token.value);
  };

  // node_modules/cborg/lib/5map.js
  function toToken8(_data, _pos, prefix, length6) {
    return new Token2(Type2.map, length6, prefix);
  }
  function decodeMapCompact2(data, pos, minor, _options) {
    return toToken8(data, pos, 1, minor);
  }
  function decodeMap82(data, pos, _minor, options) {
    return toToken8(data, pos, 2, readUint82(data, pos + 1, options));
  }
  function decodeMap162(data, pos, _minor, options) {
    return toToken8(data, pos, 3, readUint162(data, pos + 1, options));
  }
  function decodeMap322(data, pos, _minor, options) {
    return toToken8(data, pos, 5, readUint322(data, pos + 1, options));
  }
  function decodeMap642(data, pos, _minor, options) {
    const l = readUint642(data, pos + 1, options);
    if (typeof l === "bigint") {
      throw new Error(`${decodeErrPrefix2} 64-bit integer map lengths not supported`);
    }
    return toToken8(data, pos, 9, l);
  }
  function decodeMapIndefinite2(data, pos, _minor, options) {
    if (options.allowIndefinite === false) {
      throw new Error(`${decodeErrPrefix2} indefinite length items not allowed`);
    }
    return toToken8(data, pos, 1, Infinity);
  }
  function encodeMap2(writer, token) {
    encodeUintValue2(writer, Type2.map.majorEncoded, token.value);
  }
  encodeMap2.compareTokens = encodeUint2.compareTokens;
  encodeMap2.encodedSize = function encodedSize14(token) {
    return encodeUintValue2.encodedSize(token.value);
  };

  // node_modules/cborg/lib/6tag.js
  function decodeTagCompact2(_data, _pos, minor, _options) {
    return new Token2(Type2.tag, minor, 1);
  }
  function decodeTag82(data, pos, _minor, options) {
    return new Token2(Type2.tag, readUint82(data, pos + 1, options), 2);
  }
  function decodeTag162(data, pos, _minor, options) {
    return new Token2(Type2.tag, readUint162(data, pos + 1, options), 3);
  }
  function decodeTag322(data, pos, _minor, options) {
    return new Token2(Type2.tag, readUint322(data, pos + 1, options), 5);
  }
  function decodeTag642(data, pos, _minor, options) {
    return new Token2(Type2.tag, readUint642(data, pos + 1, options), 9);
  }
  function encodeTag2(writer, token) {
    encodeUintValue2(writer, Type2.tag.majorEncoded, token.value);
  }
  encodeTag2.compareTokens = encodeUint2.compareTokens;
  encodeTag2.encodedSize = function encodedSize15(token) {
    return encodeUintValue2.encodedSize(token.value);
  };

  // node_modules/cborg/lib/7float.js
  var MINOR_FALSE2 = 20;
  var MINOR_TRUE2 = 21;
  var MINOR_NULL2 = 22;
  var MINOR_UNDEFINED2 = 23;
  function decodeUndefined2(_data, _pos, _minor, options) {
    if (options.allowUndefined === false) {
      throw new Error(`${decodeErrPrefix2} undefined values are not supported`);
    } else if (options.coerceUndefinedToNull === true) {
      return new Token2(Type2.null, null, 1);
    }
    return new Token2(Type2.undefined, void 0, 1);
  }
  function decodeBreak2(_data, _pos, _minor, options) {
    if (options.allowIndefinite === false) {
      throw new Error(`${decodeErrPrefix2} indefinite length items not allowed`);
    }
    return new Token2(Type2.break, void 0, 1);
  }
  function createToken2(value, bytes, options) {
    if (options) {
      if (options.allowNaN === false && Number.isNaN(value)) {
        throw new Error(`${decodeErrPrefix2} NaN values are not supported`);
      }
      if (options.allowInfinity === false && (value === Infinity || value === -Infinity)) {
        throw new Error(`${decodeErrPrefix2} Infinity values are not supported`);
      }
    }
    return new Token2(Type2.float, value, bytes);
  }
  function decodeFloat162(data, pos, _minor, options) {
    return createToken2(readFloat162(data, pos + 1), 3, options);
  }
  function decodeFloat322(data, pos, _minor, options) {
    return createToken2(readFloat322(data, pos + 1), 5, options);
  }
  function decodeFloat642(data, pos, _minor, options) {
    return createToken2(readFloat642(data, pos + 1), 9, options);
  }
  function encodeFloat2(writer, token, options) {
    const float = token.value;
    if (float === false) {
      writer.push([Type2.float.majorEncoded | MINOR_FALSE2]);
    } else if (float === true) {
      writer.push([Type2.float.majorEncoded | MINOR_TRUE2]);
    } else if (float === null) {
      writer.push([Type2.float.majorEncoded | MINOR_NULL2]);
    } else if (float === void 0) {
      writer.push([Type2.float.majorEncoded | MINOR_UNDEFINED2]);
    } else {
      let decoded;
      let success = false;
      if (!options || options.float64 !== true) {
        encodeFloat162(float);
        decoded = readFloat162(ui8a2, 1);
        if (float === decoded || Number.isNaN(float)) {
          ui8a2[0] = 249;
          writer.push(ui8a2.slice(0, 3));
          success = true;
        } else {
          encodeFloat322(float);
          decoded = readFloat322(ui8a2, 1);
          if (float === decoded) {
            ui8a2[0] = 250;
            writer.push(ui8a2.slice(0, 5));
            success = true;
          }
        }
      }
      if (!success) {
        encodeFloat642(float);
        decoded = readFloat642(ui8a2, 1);
        ui8a2[0] = 251;
        writer.push(ui8a2.slice(0, 9));
      }
    }
  }
  encodeFloat2.encodedSize = function encodedSize16(token, options) {
    const float = token.value;
    if (float === false || float === true || float === null || float === void 0) {
      return 1;
    }
    if (!options || options.float64 !== true) {
      encodeFloat162(float);
      let decoded = readFloat162(ui8a2, 1);
      if (float === decoded || Number.isNaN(float)) {
        return 3;
      }
      encodeFloat322(float);
      decoded = readFloat322(ui8a2, 1);
      if (float === decoded) {
        return 5;
      }
    }
    return 9;
  };
  var buffer2 = new ArrayBuffer(9);
  var dataView2 = new DataView(buffer2, 1);
  var ui8a2 = new Uint8Array(buffer2, 0);
  function encodeFloat162(inp) {
    if (inp === Infinity) {
      dataView2.setUint16(0, 31744, false);
    } else if (inp === -Infinity) {
      dataView2.setUint16(0, 64512, false);
    } else if (Number.isNaN(inp)) {
      dataView2.setUint16(0, 32256, false);
    } else {
      dataView2.setFloat32(0, inp);
      const valu32 = dataView2.getUint32(0);
      const exponent = (valu32 & 2139095040) >> 23;
      const mantissa = valu32 & 8388607;
      if (exponent === 255) {
        dataView2.setUint16(0, 31744, false);
      } else if (exponent === 0) {
        dataView2.setUint16(0, (inp & 2147483648) >> 16 | mantissa >> 13, false);
      } else {
        const logicalExponent = exponent - 127;
        if (logicalExponent < -24) {
          dataView2.setUint16(0, 0);
        } else if (logicalExponent < -14) {
          dataView2.setUint16(0, (valu32 & 2147483648) >> 16 | /* sign bit */
          1 << 24 + logicalExponent, false);
        } else {
          dataView2.setUint16(0, (valu32 & 2147483648) >> 16 | logicalExponent + 15 << 10 | mantissa >> 13, false);
        }
      }
    }
  }
  function readFloat162(ui8a4, pos) {
    if (ui8a4.length - pos < 2) {
      throw new Error(`${decodeErrPrefix2} not enough data for float16`);
    }
    const half = (ui8a4[pos] << 8) + ui8a4[pos + 1];
    if (half === 31744) {
      return Infinity;
    }
    if (half === 64512) {
      return -Infinity;
    }
    if (half === 32256) {
      return NaN;
    }
    const exp = half >> 10 & 31;
    const mant = half & 1023;
    let val;
    if (exp === 0) {
      val = mant * 2 ** -24;
    } else if (exp !== 31) {
      val = (mant + 1024) * 2 ** (exp - 25);
    } else {
      val = mant === 0 ? Infinity : NaN;
    }
    return half & 32768 ? -val : val;
  }
  function encodeFloat322(inp) {
    dataView2.setFloat32(0, inp, false);
  }
  function readFloat322(ui8a4, pos) {
    if (ui8a4.length - pos < 4) {
      throw new Error(`${decodeErrPrefix2} not enough data for float32`);
    }
    const offset = (ui8a4.byteOffset || 0) + pos;
    return new DataView(ui8a4.buffer, offset, 4).getFloat32(0, false);
  }
  function encodeFloat642(inp) {
    dataView2.setFloat64(0, inp, false);
  }
  function readFloat642(ui8a4, pos) {
    if (ui8a4.length - pos < 8) {
      throw new Error(`${decodeErrPrefix2} not enough data for float64`);
    }
    const offset = (ui8a4.byteOffset || 0) + pos;
    return new DataView(ui8a4.buffer, offset, 8).getFloat64(0, false);
  }
  encodeFloat2.compareTokens = encodeUint2.compareTokens;

  // node_modules/cborg/lib/jump.js
  function invalidMinor2(data, pos, minor) {
    throw new Error(`${decodeErrPrefix2} encountered invalid minor (${minor}) for major ${data[pos] >>> 5}`);
  }
  function errorer2(msg) {
    return () => {
      throw new Error(`${decodeErrPrefix2} ${msg}`);
    };
  }
  var jump2 = [];
  for (let i = 0; i <= 23; i++) {
    jump2[i] = invalidMinor2;
  }
  jump2[24] = decodeUint82;
  jump2[25] = decodeUint162;
  jump2[26] = decodeUint322;
  jump2[27] = decodeUint642;
  jump2[28] = invalidMinor2;
  jump2[29] = invalidMinor2;
  jump2[30] = invalidMinor2;
  jump2[31] = invalidMinor2;
  for (let i = 32; i <= 55; i++) {
    jump2[i] = invalidMinor2;
  }
  jump2[56] = decodeNegint82;
  jump2[57] = decodeNegint162;
  jump2[58] = decodeNegint322;
  jump2[59] = decodeNegint642;
  jump2[60] = invalidMinor2;
  jump2[61] = invalidMinor2;
  jump2[62] = invalidMinor2;
  jump2[63] = invalidMinor2;
  for (let i = 64; i <= 87; i++) {
    jump2[i] = decodeBytesCompact2;
  }
  jump2[88] = decodeBytes82;
  jump2[89] = decodeBytes162;
  jump2[90] = decodeBytes322;
  jump2[91] = decodeBytes642;
  jump2[92] = invalidMinor2;
  jump2[93] = invalidMinor2;
  jump2[94] = invalidMinor2;
  jump2[95] = errorer2("indefinite length bytes/strings are not supported");
  for (let i = 96; i <= 119; i++) {
    jump2[i] = decodeStringCompact2;
  }
  jump2[120] = decodeString82;
  jump2[121] = decodeString162;
  jump2[122] = decodeString322;
  jump2[123] = decodeString642;
  jump2[124] = invalidMinor2;
  jump2[125] = invalidMinor2;
  jump2[126] = invalidMinor2;
  jump2[127] = errorer2("indefinite length bytes/strings are not supported");
  for (let i = 128; i <= 151; i++) {
    jump2[i] = decodeArrayCompact2;
  }
  jump2[152] = decodeArray82;
  jump2[153] = decodeArray162;
  jump2[154] = decodeArray322;
  jump2[155] = decodeArray642;
  jump2[156] = invalidMinor2;
  jump2[157] = invalidMinor2;
  jump2[158] = invalidMinor2;
  jump2[159] = decodeArrayIndefinite2;
  for (let i = 160; i <= 183; i++) {
    jump2[i] = decodeMapCompact2;
  }
  jump2[184] = decodeMap82;
  jump2[185] = decodeMap162;
  jump2[186] = decodeMap322;
  jump2[187] = decodeMap642;
  jump2[188] = invalidMinor2;
  jump2[189] = invalidMinor2;
  jump2[190] = invalidMinor2;
  jump2[191] = decodeMapIndefinite2;
  for (let i = 192; i <= 215; i++) {
    jump2[i] = decodeTagCompact2;
  }
  jump2[216] = decodeTag82;
  jump2[217] = decodeTag162;
  jump2[218] = decodeTag322;
  jump2[219] = decodeTag642;
  jump2[220] = invalidMinor2;
  jump2[221] = invalidMinor2;
  jump2[222] = invalidMinor2;
  jump2[223] = invalidMinor2;
  for (let i = 224; i <= 243; i++) {
    jump2[i] = errorer2("simple values are not supported");
  }
  jump2[244] = invalidMinor2;
  jump2[245] = invalidMinor2;
  jump2[246] = invalidMinor2;
  jump2[247] = decodeUndefined2;
  jump2[248] = errorer2("simple values are not supported");
  jump2[249] = decodeFloat162;
  jump2[250] = decodeFloat322;
  jump2[251] = decodeFloat642;
  jump2[252] = invalidMinor2;
  jump2[253] = invalidMinor2;
  jump2[254] = invalidMinor2;
  jump2[255] = decodeBreak2;
  var quick2 = [];
  for (let i = 0; i < 24; i++) {
    quick2[i] = new Token2(Type2.uint, i, 1);
  }
  for (let i = -1; i >= -24; i--) {
    quick2[31 - i] = new Token2(Type2.negint, i, 1);
  }
  quick2[64] = new Token2(Type2.bytes, new Uint8Array(0), 1);
  quick2[96] = new Token2(Type2.string, "", 1);
  quick2[128] = new Token2(Type2.array, 0, 1);
  quick2[160] = new Token2(Type2.map, 0, 1);
  quick2[244] = new Token2(Type2.false, false, 1);
  quick2[245] = new Token2(Type2.true, true, 1);
  quick2[246] = new Token2(Type2.null, null, 1);
  function quickEncodeToken2(token) {
    switch (token.type) {
      case Type2.false:
        return fromArray2([244]);
      case Type2.true:
        return fromArray2([245]);
      case Type2.null:
        return fromArray2([246]);
      case Type2.bytes:
        if (!token.value.length) {
          return fromArray2([64]);
        }
        return;
      case Type2.string:
        if (token.value === "") {
          return fromArray2([96]);
        }
        return;
      case Type2.array:
        if (token.value === 0) {
          return fromArray2([128]);
        }
        return;
      case Type2.map:
        if (token.value === 0) {
          return fromArray2([160]);
        }
        return;
      case Type2.uint:
        if (token.value < 24) {
          return fromArray2([Number(token.value)]);
        }
        return;
      case Type2.negint:
        if (token.value >= -24) {
          return fromArray2([31 - Number(token.value)]);
        }
    }
  }

  // node_modules/cborg/lib/encode.js
  var rfc8949EncodeOptions2 = Object.freeze({
    float64: true,
    mapSorter: rfc8949MapSorter2,
    quickEncodeToken: quickEncodeToken2
  });
  function makeCborEncoders2() {
    const encoders = [];
    encoders[Type2.uint.major] = encodeUint2;
    encoders[Type2.negint.major] = encodeNegint2;
    encoders[Type2.bytes.major] = encodeBytes2;
    encoders[Type2.string.major] = encodeString2;
    encoders[Type2.array.major] = encodeArray2;
    encoders[Type2.map.major] = encodeMap2;
    encoders[Type2.tag.major] = encodeTag2;
    encoders[Type2.float.major] = encodeFloat2;
    return encoders;
  }
  var cborEncoders2 = makeCborEncoders2();
  var defaultWriter2 = new Bl2();
  var Ref2 = class _Ref {
    /**
     * @param {object|any[]} obj
     * @param {Reference|undefined} parent
     */
    constructor(obj, parent) {
      this.obj = obj;
      this.parent = parent;
    }
    /**
     * @param {object|any[]} obj
     * @returns {boolean}
     */
    includes(obj) {
      let p = this;
      do {
        if (p.obj === obj) {
          return true;
        }
      } while (p = p.parent);
      return false;
    }
    /**
     * @param {Reference|undefined} stack
     * @param {object|any[]} obj
     * @returns {Reference}
     */
    static createCheck(stack, obj) {
      if (stack && stack.includes(obj)) {
        throw new Error(`${encodeErrPrefix2} object contains circular references`);
      }
      return new _Ref(obj, stack);
    }
  };
  var simpleTokens2 = {
    null: new Token2(Type2.null, null),
    undefined: new Token2(Type2.undefined, void 0),
    true: new Token2(Type2.true, true),
    false: new Token2(Type2.false, false),
    emptyArray: new Token2(Type2.array, 0),
    emptyMap: new Token2(Type2.map, 0)
  };
  var typeEncoders2 = {
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    number(obj, _typ, _options, _refStack) {
      if (!Number.isInteger(obj) || !Number.isSafeInteger(obj)) {
        return new Token2(Type2.float, obj);
      } else if (obj >= 0) {
        return new Token2(Type2.uint, obj);
      } else {
        return new Token2(Type2.negint, obj);
      }
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    bigint(obj, _typ, _options, _refStack) {
      if (obj >= BigInt(0)) {
        return new Token2(Type2.uint, obj);
      } else {
        return new Token2(Type2.negint, obj);
      }
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    Uint8Array(obj, _typ, _options, _refStack) {
      return new Token2(Type2.bytes, obj);
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    string(obj, _typ, _options, _refStack) {
      return new Token2(Type2.string, obj);
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    boolean(obj, _typ, _options, _refStack) {
      return obj ? simpleTokens2.true : simpleTokens2.false;
    },
    /**
     * @param {any} _obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    null(_obj, _typ, _options, _refStack) {
      return simpleTokens2.null;
    },
    /**
     * @param {any} _obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    undefined(_obj, _typ, _options, _refStack) {
      return simpleTokens2.undefined;
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    ArrayBuffer(obj, _typ, _options, _refStack) {
      return new Token2(Type2.bytes, new Uint8Array(obj));
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    DataView(obj, _typ, _options, _refStack) {
      return new Token2(Type2.bytes, new Uint8Array(obj.buffer, obj.byteOffset, obj.byteLength));
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} options
     * @param {Reference} [refStack]
     * @returns {TokenOrNestedTokens}
     */
    Array(obj, _typ, options, refStack) {
      if (!obj.length) {
        if (options.addBreakTokens === true) {
          return [simpleTokens2.emptyArray, new Token2(Type2.break)];
        }
        return simpleTokens2.emptyArray;
      }
      refStack = Ref2.createCheck(refStack, obj);
      const entries = [];
      let i = 0;
      for (const e of obj) {
        entries[i++] = objectToTokens2(e, options, refStack);
      }
      if (options.addBreakTokens) {
        return [new Token2(Type2.array, obj.length), entries, new Token2(Type2.break)];
      }
      return [new Token2(Type2.array, obj.length), entries];
    },
    /**
     * @param {any} obj
     * @param {string} typ
     * @param {EncodeOptions} options
     * @param {Reference} [refStack]
     * @returns {TokenOrNestedTokens}
     */
    Object(obj, typ, options, refStack) {
      const isMap = typ !== "Object";
      const keys = isMap ? obj.keys() : Object.keys(obj);
      const maxLength = isMap ? obj.size : keys.length;
      let entries;
      if (maxLength) {
        entries = new Array(maxLength);
        refStack = Ref2.createCheck(refStack, obj);
        const skipUndefined = !isMap && options.ignoreUndefinedProperties;
        let i = 0;
        for (const key of keys) {
          const value = isMap ? obj.get(key) : obj[key];
          if (skipUndefined && value === void 0) {
            continue;
          }
          entries[i++] = [
            objectToTokens2(key, options, refStack),
            objectToTokens2(value, options, refStack)
          ];
        }
        if (i < maxLength) {
          entries.length = i;
        }
      }
      if (!entries?.length) {
        if (options.addBreakTokens === true) {
          return [simpleTokens2.emptyMap, new Token2(Type2.break)];
        }
        return simpleTokens2.emptyMap;
      }
      sortMapEntries2(entries, options);
      if (options.addBreakTokens) {
        return [new Token2(Type2.map, entries.length), entries, new Token2(Type2.break)];
      }
      return [new Token2(Type2.map, entries.length), entries];
    }
  };
  typeEncoders2.Map = typeEncoders2.Object;
  typeEncoders2.Buffer = typeEncoders2.Uint8Array;
  for (const typ of "Uint8Clamped Uint16 Uint32 Int8 Int16 Int32 BigUint64 BigInt64 Float32 Float64".split(" ")) {
    typeEncoders2[`${typ}Array`] = typeEncoders2.DataView;
  }
  function objectToTokens2(obj, options = {}, refStack) {
    const typ = is2(obj);
    const customTypeEncoder = options && options.typeEncoders && /** @type {OptionalTypeEncoder} */
    options.typeEncoders[typ] || typeEncoders2[typ];
    if (typeof customTypeEncoder === "function") {
      const tokens = customTypeEncoder(obj, typ, options, refStack);
      if (tokens != null) {
        return tokens;
      }
    }
    const typeEncoder = typeEncoders2[typ];
    if (!typeEncoder) {
      throw new Error(`${encodeErrPrefix2} unsupported type: ${typ}`);
    }
    return typeEncoder(obj, typ, options, refStack);
  }
  function sortMapEntries2(entries, options) {
    if (options.mapSorter) {
      entries.sort(options.mapSorter);
    }
  }
  function rfc8949MapSorter2(e1, e2) {
    if (e1[0] instanceof Token2 && e2[0] instanceof Token2) {
      const t1 = (
        /** @type {TokenEx} */
        e1[0]
      );
      const t2 = (
        /** @type {TokenEx} */
        e2[0]
      );
      if (!t1._keyBytes) {
        t1._keyBytes = encodeRfc89492(t1.value);
      }
      if (!t2._keyBytes) {
        t2._keyBytes = encodeRfc89492(t2.value);
      }
      return compare2(t1._keyBytes, t2._keyBytes);
    }
    throw new Error("rfc8949MapSorter: complex key types are not supported yet");
  }
  function encodeRfc89492(data) {
    return encodeCustom2(data, cborEncoders2, rfc8949EncodeOptions2);
  }
  function tokensToEncoded2(writer, tokens, encoders, options) {
    if (Array.isArray(tokens)) {
      for (const token of tokens) {
        tokensToEncoded2(writer, token, encoders, options);
      }
    } else {
      encoders[tokens.type.major](writer, tokens, options);
    }
  }
  var MAJOR_UINT2 = Type2.uint.majorEncoded;
  var MAJOR_NEGINT2 = Type2.negint.majorEncoded;
  var MAJOR_BYTES2 = Type2.bytes.majorEncoded;
  var MAJOR_STRING2 = Type2.string.majorEncoded;
  var MAJOR_ARRAY2 = Type2.array.majorEncoded;
  var SIMPLE_FALSE2 = Type2.float.majorEncoded | MINOR_FALSE2;
  var SIMPLE_TRUE2 = Type2.float.majorEncoded | MINOR_TRUE2;
  var SIMPLE_NULL2 = Type2.float.majorEncoded | MINOR_NULL2;
  var SIMPLE_UNDEFINED2 = Type2.float.majorEncoded | MINOR_UNDEFINED2;
  var neg1b4 = BigInt(-1);
  var pos1b4 = BigInt(1);
  function encodeCustom2(data, encoders, options, destination) {
    const hasDest = destination instanceof Uint8Array;
    let writeTo = hasDest ? new U8Bl2(destination) : defaultWriter2;
    const tokens = objectToTokens2(data, options);
    if (!Array.isArray(tokens) && options.quickEncodeToken) {
      const quickBytes = options.quickEncodeToken(tokens);
      if (quickBytes) {
        if (hasDest) {
          writeTo.push(quickBytes);
          return writeTo.toBytes();
        }
        return quickBytes;
      }
      const encoder = encoders[tokens.type.major];
      if (encoder.encodedSize) {
        const size = encoder.encodedSize(tokens, options);
        if (!hasDest) {
          writeTo = new Bl2(size);
        }
        encoder(writeTo, tokens, options);
        if (writeTo.chunks.length !== 1) {
          throw new Error(`Unexpected error: pre-calculated length for ${tokens} was wrong`);
        }
        return hasDest ? writeTo.toBytes() : asU8A2(writeTo.chunks[0]);
      }
    }
    writeTo.reset();
    tokensToEncoded2(writeTo, tokens, encoders, options);
    return writeTo.toBytes(true);
  }

  // node_modules/cborg/lib/length.js
  var cborEncoders3 = makeCborEncoders2();

  // node_modules/@ipld/car/src/buffer-writer.js
  var import_varint3 = __toESM(require_varint(), 1);
  var headerPreludeTokens = [
    new Token2(Type2.map, 2),
    new Token2(Type2.string, "version"),
    new Token2(Type2.uint, 1),
    new Token2(Type2.string, "roots")
  ];
  var CID_TAG = new Token2(Type2.tag, 42);

  // node_modules/@ipld/car/src/decoder.js
  async function readHeader(reader, strictVersion) {
    const length6 = decodeVarint(await reader.upTo(8), reader);
    if (length6 === 0) {
      throw new Error("Invalid CAR header (zero length)");
    }
    const header = await reader.exactly(length6, true);
    const block = decode6(header);
    if (CarV1HeaderOrV2Pragma.toTyped(block) === void 0) {
      throw new Error("Invalid CAR header format");
    }
    if (block.version !== 1 && block.version !== 2 || strictVersion !== void 0 && block.version !== strictVersion) {
      throw new Error(`Invalid CAR version: ${block.version}${strictVersion !== void 0 ? ` (expected ${strictVersion})` : ""}`);
    }
    if (block.version === 1) {
      if (!Array.isArray(block.roots)) {
        throw new Error("Invalid CAR header format");
      }
      return block;
    }
    if (block.roots !== void 0) {
      throw new Error("Invalid CAR header format");
    }
    const v2Header = decodeV2Header(await reader.exactly(V2_HEADER_LENGTH, true));
    reader.seek(v2Header.dataOffset - reader.pos);
    const v1Header = await readHeader(reader, 1);
    return Object.assign(v1Header, v2Header);
  }
  async function readCid(reader) {
    const first = await reader.exactly(2, false);
    if (first[0] === CIDV0_BYTES.SHA2_256 && first[1] === CIDV0_BYTES.LENGTH) {
      const bytes2 = await reader.exactly(34, true);
      const multihash2 = decode5(bytes2);
      return CID.create(0, CIDV0_BYTES.DAG_PB, multihash2);
    }
    const version = decodeVarint(await reader.upTo(8), reader);
    if (version !== 1) {
      throw new Error(`Unexpected CID version (${version})`);
    }
    const codec = decodeVarint(await reader.upTo(8), reader);
    const bytes = await reader.exactly(getMultihashLength(await reader.upTo(8)), true);
    const multihash = decode5(bytes);
    return CID.create(version, codec, multihash);
  }
  async function readBlockHead(reader) {
    const start = reader.pos;
    let length6 = decodeVarint(await reader.upTo(8), reader);
    if (length6 === 0) {
      throw new Error("Invalid CAR section (zero length)");
    }
    length6 += reader.pos - start;
    const cid = await readCid(reader);
    const blockLength = length6 - Number(reader.pos - start);
    return { cid, length: length6, blockLength };
  }
  async function readBlock(reader) {
    const { cid, blockLength } = await readBlockHead(reader);
    const bytes = await reader.exactly(blockLength, true);
    return { bytes, cid };
  }
  async function readBlockIndex(reader) {
    const offset = reader.pos;
    const { cid, length: length6, blockLength } = await readBlockHead(reader);
    const index = { cid, length: length6, blockLength, offset, blockOffset: reader.pos };
    reader.seek(index.blockLength);
    return index;
  }
  function createDecoder(reader) {
    const headerPromise = (async () => {
      const header = await readHeader(reader);
      if (header.version === 2) {
        const v1length = reader.pos - header.dataOffset;
        reader = limitReader(reader, header.dataSize - v1length);
      }
      return header;
    })();
    return {
      header: () => headerPromise,
      async *blocks() {
        await headerPromise;
        while ((await reader.upTo(8)).length > 0) {
          yield await readBlock(reader);
        }
      },
      async *blocksIndex() {
        await headerPromise;
        while ((await reader.upTo(8)).length > 0) {
          yield await readBlockIndex(reader);
        }
      }
    };
  }
  function bytesReader(bytes) {
    let pos = 0;
    return {
      async upTo(length6) {
        const out = bytes.subarray(pos, pos + Math.min(length6, bytes.length - pos));
        return out;
      },
      async exactly(length6, seek = false) {
        if (length6 > bytes.length - pos) {
          throw new Error("Unexpected end of data");
        }
        const out = bytes.subarray(pos, pos + length6);
        if (seek) {
          pos += length6;
        }
        return out;
      },
      seek(length6) {
        pos += length6;
      },
      get pos() {
        return pos;
      }
    };
  }
  function chunkReader(readChunk) {
    let pos = 0;
    let have = 0;
    let offset = 0;
    let currentChunk = new Uint8Array(0);
    const read6 = async (length6) => {
      have = currentChunk.length - offset;
      const bufa = (
        /** @type {Uint8Array<ArrayBufferLike>[]} */
        [currentChunk.subarray(offset)]
      );
      while (have < length6) {
        const chunk = await readChunk();
        if (chunk == null) {
          break;
        }
        if (have < 0) {
          if (chunk.length > have) {
            bufa.push(chunk.subarray(-have));
          }
        } else {
          bufa.push(chunk);
        }
        have += chunk.length;
      }
      currentChunk = new Uint8Array(bufa.reduce((p, c) => p + c.length, 0));
      let off = 0;
      for (const b of bufa) {
        currentChunk.set(b, off);
        off += b.length;
      }
      offset = 0;
    };
    return {
      async upTo(length6) {
        if (currentChunk.length - offset < length6) {
          await read6(length6);
        }
        return currentChunk.subarray(offset, offset + Math.min(currentChunk.length - offset, length6));
      },
      async exactly(length6, seek = false) {
        if (currentChunk.length - offset < length6) {
          await read6(length6);
        }
        if (currentChunk.length - offset < length6) {
          throw new Error("Unexpected end of data");
        }
        const out = currentChunk.subarray(offset, offset + length6);
        if (seek) {
          pos += length6;
          offset += length6;
        }
        return out;
      },
      seek(length6) {
        pos += length6;
        offset += length6;
      },
      get pos() {
        return pos;
      }
    };
  }
  function asyncIterableReader(asyncIterable) {
    const iterator = asyncIterable[Symbol.asyncIterator]();
    async function readChunk() {
      const next = await iterator.next();
      if (next.done) {
        return null;
      }
      return next.value;
    }
    return chunkReader(readChunk);
  }
  function limitReader(reader, byteLimit) {
    let bytesRead = 0;
    return {
      async upTo(length6) {
        let bytes = await reader.upTo(length6);
        if (bytes.length + bytesRead > byteLimit) {
          bytes = bytes.subarray(0, byteLimit - bytesRead);
        }
        return bytes;
      },
      async exactly(length6, seek = false) {
        const bytes = await reader.exactly(length6, seek);
        if (bytes.length + bytesRead > byteLimit) {
          throw new Error("Unexpected end of data");
        }
        if (seek) {
          bytesRead += length6;
        }
        return bytes;
      },
      seek(length6) {
        bytesRead += length6;
        reader.seek(length6);
      },
      get pos() {
        return reader.pos;
      }
    };
  }

  // node_modules/@ipld/car/src/reader-browser.js
  var CarReader = class {
    /**
     * @constructs CarReader
     * @param {CarHeader|CarV2Header} header
     * @param {Block[]} blocks
     */
    constructor(header, blocks) {
      this._header = header;
      this._blocks = blocks;
      this._keys = blocks.map((b) => b.cid.toString());
    }
    /**
     * @property
     * @memberof CarReader
     * @instance
     */
    get version() {
      return this._header.version;
    }
    /**
     * Get the list of roots defined by the CAR referenced by this reader. May be
     * zero or more `CID`s.
     *
     * @function
     * @memberof CarReader
     * @instance
     * @async
     * @returns {Promise<CID[]>}
     */
    async getRoots() {
      return this._header.roots;
    }
    /**
     * Check whether a given `CID` exists within the CAR referenced by this
     * reader.
     *
     * @function
     * @memberof CarReader
     * @instance
     * @async
     * @param {CID} key
     * @returns {Promise<boolean>}
     */
    async has(key) {
      return this._keys.indexOf(key.toString()) > -1;
    }
    /**
     * Fetch a `Block` (a `{ cid:CID, bytes:Uint8Array }` pair) from the CAR
     * referenced by this reader matching the provided `CID`. In the case where
     * the provided `CID` doesn't exist within the CAR, `undefined` will be
     * returned.
     *
     * @function
     * @memberof CarReader
     * @instance
     * @async
     * @param {CID} key
     * @returns {Promise<Block | undefined>}
     */
    async get(key) {
      const index = this._keys.indexOf(key.toString());
      return index > -1 ? this._blocks[index] : void 0;
    }
    /**
     * Returns a `BlockIterator` (`AsyncIterable<Block>`) that iterates over all
     * of the `Block`s (`{ cid:CID, bytes:Uint8Array }` pairs) contained within
     * the CAR referenced by this reader.
     *
     * @function
     * @memberof CarReader
     * @instance
     * @async
     * @generator
     * @returns {AsyncGenerator<Block>}
     */
    async *blocks() {
      for (const block of this._blocks) {
        yield block;
      }
    }
    /**
     * Returns a `CIDIterator` (`AsyncIterable<CID>`) that iterates over all of
     * the `CID`s contained within the CAR referenced by this reader.
     *
     * @function
     * @memberof CarReader
     * @instance
     * @async
     * @generator
     * @returns {AsyncGenerator<CID>}
     */
    async *cids() {
      for (const block of this._blocks) {
        yield block.cid;
      }
    }
    /**
     * Instantiate a {@link CarReader} from a `Uint8Array` blob. This performs a
     * decode fully in memory and maintains the decoded state in memory for full
     * access to the data via the `CarReader` API.
     *
     * @async
     * @static
     * @memberof CarReader
     * @param {Uint8Array} bytes
     * @returns {Promise<CarReader>}
     */
    static async fromBytes(bytes) {
      if (!(bytes instanceof Uint8Array)) {
        throw new TypeError("fromBytes() requires a Uint8Array");
      }
      return decodeReaderComplete(bytesReader(bytes));
    }
    /**
     * Instantiate a {@link CarReader} from a `AsyncIterable<Uint8Array>`, such as
     * a [modern Node.js stream](https://nodejs.org/api/stream.html#stream_streams_compatibility_with_async_generators_and_async_iterators).
     * This performs a decode fully in memory and maintains the decoded state in
     * memory for full access to the data via the `CarReader` API.
     *
     * Care should be taken for large archives; this API may not be appropriate
     * where memory is a concern or the archive is potentially larger than the
     * amount of memory that the runtime can handle.
     *
     * @async
     * @static
     * @memberof CarReader
     * @param {AsyncIterable<Uint8Array>} asyncIterable
     * @returns {Promise<CarReader>}
     */
    static async fromIterable(asyncIterable) {
      if (!asyncIterable || !(typeof asyncIterable[Symbol.asyncIterator] === "function")) {
        throw new TypeError("fromIterable() requires an async iterable");
      }
      return decodeReaderComplete(asyncIterableReader(asyncIterable));
    }
  };
  async function decodeReaderComplete(reader) {
    const decoder = createDecoder(reader);
    const header = await decoder.header();
    const blocks = [];
    for await (const block of decoder.blocks()) {
      blocks.push(block);
    }
    return new CarReader(header, blocks);
  }

  // node_modules/@ipld/car/src/encoder.js
  var import_varint4 = __toESM(require_varint(), 1);

  // node_modules/it-last/dist/src/index.js
  function isAsyncIterable(thing) {
    return thing[Symbol.asyncIterator] != null;
  }
  function last(source) {
    if (isAsyncIterable(source)) {
      return (async () => {
        let res2;
        for await (const entry of source) {
          res2 = entry;
        }
        return res2;
      })();
    }
    let res;
    for (const entry of source) {
      res = entry;
    }
    return res;
  }
  var src_default = last;

  // node_modules/ipfs-unixfs-exporter/dist/src/errors.js
  var BadPathError = class _BadPathError extends Error {
    static name = "BadPathError";
    static code = "ERR_BAD_PATH";
    name = _BadPathError.name;
    code = _BadPathError.code;
    constructor(message2 = "Bad path") {
      super(message2);
    }
  };
  var NotFoundError = class _NotFoundError extends Error {
    static name = "NotFoundError";
    static code = "ERR_NOT_FOUND";
    name = _NotFoundError.name;
    code = _NotFoundError.code;
    constructor(message2 = "Not found") {
      super(message2);
    }
  };
  var NoResolverError = class _NoResolverError extends Error {
    static name = "NoResolverError";
    static code = "ERR_NO_RESOLVER";
    name = _NoResolverError.name;
    code = _NoResolverError.code;
    constructor(message2 = "No resolver") {
      super(message2);
    }
  };
  var NotUnixFSError = class _NotUnixFSError extends Error {
    static name = "NotUnixFSError";
    static code = "ERR_NOT_UNIXFS";
    name = _NotUnixFSError.name;
    code = _NotUnixFSError.code;
    constructor(message2 = "Not UnixFS") {
      super(message2);
    }
  };
  var OverReadError = class _OverReadError extends Error {
    static name = "OverReadError";
    static code = "ERR_OVER_READ";
    name = _OverReadError.name;
    code = _OverReadError.code;
    constructor(message2 = "Over read") {
      super(message2);
    }
  };
  var UnderReadError = class _UnderReadError extends Error {
    static name = "UnderReadError";
    static code = "ERR_UNDER_READ";
    name = _UnderReadError.name;
    code = _UnderReadError.code;
    constructor(message2 = "Under read") {
      super(message2);
    }
  };
  var NoPropError = class _NoPropError extends Error {
    static name = "NoPropError";
    static code = "ERR_NO_PROP";
    name = _NoPropError.name;
    code = _NoPropError.code;
    constructor(message2 = "No Property found") {
      super(message2);
    }
  };
  var InvalidParametersError = class _InvalidParametersError extends Error {
    static name = "InvalidParametersError";
    static code = "ERR_INVALID_PARAMS";
    name = _InvalidParametersError.name;
    code = _InvalidParametersError.code;
    constructor(message2 = "Invalid parameters") {
      super(message2);
    }
  };

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/is.js
  var objectTypeNames3 = [
    "Object",
    // for Object.create(null) and other non-plain objects
    "RegExp",
    "Date",
    "Error",
    "Map",
    "Set",
    "WeakMap",
    "WeakSet",
    "ArrayBuffer",
    "SharedArrayBuffer",
    "DataView",
    "Promise",
    "URL",
    "HTMLElement",
    "Int8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Uint16Array",
    "Int32Array",
    "Uint32Array",
    "Float32Array",
    "Float64Array",
    "BigInt64Array",
    "BigUint64Array",
    "Tagged"
  ];
  function is3(value) {
    if (value === null) {
      return "null";
    }
    if (value === void 0) {
      return "undefined";
    }
    if (value === true || value === false) {
      return "boolean";
    }
    const typeOf = typeof value;
    if (typeOf === "string" || typeOf === "number" || typeOf === "bigint" || typeOf === "symbol") {
      return typeOf;
    }
    if (typeOf === "function") {
      return "Function";
    }
    if (Array.isArray(value)) {
      return "Array";
    }
    if (value instanceof Uint8Array) {
      return "Uint8Array";
    }
    if (value.constructor === Object) {
      return "Object";
    }
    const objectType = getObjectType3(value);
    if (objectType) {
      return objectType;
    }
    return "Object";
  }
  function getObjectType3(value) {
    const objectTypeName = Object.prototype.toString.call(value).slice(8, -1);
    if (objectTypeNames3.includes(objectTypeName)) {
      return objectTypeName;
    }
    return void 0;
  }

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/token.js
  var Type3 = class {
    /**
     * @param {number} major
     * @param {string} name
     * @param {boolean} terminal
     */
    constructor(major, name3, terminal) {
      this.major = major;
      this.majorEncoded = major << 5;
      this.name = name3;
      this.terminal = terminal;
    }
    toString() {
      return `Type[${this.major}].${this.name}`;
    }
    /**
     * @param {Type} typ
     * @returns {number}
     */
    compare(typ) {
      return this.major < typ.major ? -1 : this.major > typ.major ? 1 : 0;
    }
    /**
     * Check equality between two Type instances. Safe to use across different
     * copies of the Type class (e.g., when bundlers duplicate the module).
     * (major, name) uniquely identifies a Type; terminal is implied by these.
     * @param {Type} a
     * @param {Type} b
     * @returns {boolean}
     */
    static equals(a, b) {
      return a === b || a.major === b.major && a.name === b.name;
    }
  };
  Type3.uint = new Type3(0, "uint", true);
  Type3.negint = new Type3(1, "negint", true);
  Type3.bytes = new Type3(2, "bytes", true);
  Type3.string = new Type3(3, "string", true);
  Type3.array = new Type3(4, "array", false);
  Type3.map = new Type3(5, "map", false);
  Type3.tag = new Type3(6, "tag", false);
  Type3.float = new Type3(7, "float", true);
  Type3.false = new Type3(7, "false", true);
  Type3.true = new Type3(7, "true", true);
  Type3.null = new Type3(7, "null", true);
  Type3.undefined = new Type3(7, "undefined", true);
  Type3.break = new Type3(7, "break", true);
  var Token3 = class {
    /**
     * @param {Type} type
     * @param {any} [value]
     * @param {number} [encodedLength]
     */
    constructor(type, value, encodedLength) {
      this.type = type;
      this.value = value;
      this.encodedLength = encodedLength;
      this.encodedBytes = void 0;
      this.byteValue = void 0;
    }
    toString() {
      return `Token[${this.type}].${this.value}`;
    }
  };

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/byte-utils.js
  var useBuffer3 = globalThis.process && // @ts-ignore
  !globalThis.process.browser && // @ts-ignore
  globalThis.Buffer && // @ts-ignore
  typeof globalThis.Buffer.isBuffer === "function";
  var textEncoder3 = new TextEncoder();
  function isBuffer3(buf) {
    return useBuffer3 && globalThis.Buffer.isBuffer(buf);
  }
  function asU8A3(buf) {
    if (!(buf instanceof Uint8Array)) {
      return Uint8Array.from(buf);
    }
    return isBuffer3(buf) ? new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength) : buf;
  }
  var FROM_STRING_THRESHOLD_BUFFER3 = 24;
  var FROM_STRING_THRESHOLD_TEXTENCODER3 = 200;
  var fromString4 = useBuffer3 ? (
    // eslint-disable-line operator-linebreak
    /**
     * @param {string} string
     */
    (string3) => {
      return string3.length >= FROM_STRING_THRESHOLD_BUFFER3 ? (
        // eslint-disable-line operator-linebreak
        // @ts-ignore
        globalThis.Buffer.from(string3)
      ) : utf8ToBytes3(string3);
    }
  ) : (
    // eslint-disable-line operator-linebreak
    /**
     * @param {string} string
     */
    (string3) => {
      return string3.length >= FROM_STRING_THRESHOLD_TEXTENCODER3 ? textEncoder3.encode(string3) : utf8ToBytes3(string3);
    }
  );
  var fromArray3 = (arr) => {
    return Uint8Array.from(arr);
  };
  var slice3 = useBuffer3 ? (
    // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array} bytes
     * @param {number} start
     * @param {number} end
     */
    // Buffer.slice() returns a view, not a copy, so we need special handling
    (bytes, start, end) => {
      if (isBuffer3(bytes)) {
        return new Uint8Array(bytes.subarray(start, end));
      }
      return bytes.slice(start, end);
    }
  ) : (
    // eslint-disable-line operator-linebreak
    /**
     * @param {Uint8Array} bytes
     * @param {number} start
     * @param {number} end
     */
    (bytes, start, end) => {
      return bytes.slice(start, end);
    }
  );
  var concat3 = useBuffer3 ? (
    // eslint-disable-line operator-linebreak
    /**
     * @param {ByteView[]} chunks
     * @param {number} length
     * @returns {AllocatedByteView}
     */
    (chunks, length6) => {
      chunks = chunks.map((c) => c instanceof Uint8Array ? c : (
        // eslint-disable-line operator-linebreak
        // @ts-ignore
        globalThis.Buffer.from(c)
      ));
      return (
        /** @type {AllocatedByteView} */
        asU8A3(globalThis.Buffer.concat(chunks, length6))
      );
    }
  ) : (
    // eslint-disable-line operator-linebreak
    /**
     * @param {ByteView[]} chunks
     * @param {number} length
     * @returns {AllocatedByteView}
     */
    (chunks, length6) => {
      const out = new Uint8Array(length6);
      let off = 0;
      for (let b of chunks) {
        if (off + b.length > out.length) {
          b = b.subarray(0, out.length - off);
        }
        out.set(b, off);
        off += b.length;
      }
      return out;
    }
  );
  var alloc3 = useBuffer3 ? (
    // eslint-disable-line operator-linebreak
    /**
     * @param {number} size
     * @returns {AllocatedByteView}
     */
    (size) => {
      return globalThis.Buffer.allocUnsafe(size);
    }
  ) : (
    // eslint-disable-line operator-linebreak
    /**
     * @param {number} size
     * @returns {AllocatedByteView}
     */
    (size) => {
      return new Uint8Array(size);
    }
  );
  function compare3(b1, b2) {
    if (isBuffer3(b1) && isBuffer3(b2)) {
      return b1.compare(b2);
    }
    for (let i = 0; i < b1.length; i++) {
      if (b1[i] === b2[i]) {
        continue;
      }
      return b1[i] < b2[i] ? -1 : 1;
    }
    return 0;
  }
  function utf8ToBytes3(str) {
    const out = [];
    let p = 0;
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 128) {
        out[p++] = c;
      } else if (c < 2048) {
        out[p++] = c >> 6 | 192;
        out[p++] = c & 63 | 128;
      } else if ((c & 64512) === 55296 && i + 1 < str.length && (str.charCodeAt(i + 1) & 64512) === 56320) {
        c = 65536 + ((c & 1023) << 10) + (str.charCodeAt(++i) & 1023);
        out[p++] = c >> 18 | 240;
        out[p++] = c >> 12 & 63 | 128;
        out[p++] = c >> 6 & 63 | 128;
        out[p++] = c & 63 | 128;
      } else {
        if (c >= 55296 && c <= 57343) {
          c = 65533;
        }
        out[p++] = c >> 12 | 224;
        out[p++] = c >> 6 & 63 | 128;
        out[p++] = c & 63 | 128;
      }
    }
    return out;
  }
  var MAX_ARGUMENTS_LENGTH = 4096;
  function decodeCodePointsArray(codePoints) {
    const len = codePoints.length;
    if (len <= MAX_ARGUMENTS_LENGTH) {
      return String.fromCharCode.apply(String, codePoints);
    }
    let res = "";
    let i = 0;
    while (i < len) {
      res += String.fromCharCode.apply(
        String,
        codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
      );
    }
    return res;
  }

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/bl.js
  var defaultChunkSize3 = 256;
  var Bl3 = class {
    /**
     * @param {number} [chunkSize]
     */
    constructor(chunkSize = defaultChunkSize3) {
      this.chunkSize = chunkSize;
      this.cursor = 0;
      this.maxCursor = -1;
      this.chunks = [];
      this._initReuseChunk = null;
    }
    reset() {
      this.cursor = 0;
      this.maxCursor = -1;
      if (this.chunks.length) {
        this.chunks = [];
      }
      if (this._initReuseChunk !== null) {
        this.chunks.push(this._initReuseChunk);
        this.maxCursor = this._initReuseChunk.length - 1;
      }
    }
    /**
     * @param {ByteView|number[]} bytes
     */
    push(bytes) {
      let topChunk = this.chunks[this.chunks.length - 1];
      const newMax = this.cursor + bytes.length;
      if (newMax <= this.maxCursor + 1) {
        const chunkPos = topChunk.length - (this.maxCursor - this.cursor) - 1;
        topChunk.set(bytes, chunkPos);
      } else {
        if (topChunk) {
          const chunkPos = topChunk.length - (this.maxCursor - this.cursor) - 1;
          if (chunkPos < topChunk.length) {
            this.chunks[this.chunks.length - 1] = topChunk.subarray(0, chunkPos);
            this.maxCursor = this.cursor - 1;
          }
        }
        if (bytes.length < 64 && bytes.length < this.chunkSize) {
          topChunk = alloc3(this.chunkSize);
          this.chunks.push(topChunk);
          this.maxCursor += topChunk.length;
          if (this._initReuseChunk === null) {
            this._initReuseChunk = topChunk;
          }
          topChunk.set(bytes, 0);
        } else {
          this.chunks.push(bytes);
          this.maxCursor += bytes.length;
        }
      }
      this.cursor += bytes.length;
    }
    /**
     * @param {boolean} [reset]
     * @returns {AllocatedByteView}
     */
    toBytes(reset = false) {
      let byts;
      if (this.chunks.length === 1) {
        const chunk = this.chunks[0];
        if (reset && this.cursor > chunk.length / 2) {
          byts = this.cursor === chunk.length ? chunk : chunk.subarray(0, this.cursor);
          this._initReuseChunk = null;
          this.chunks = [];
        } else {
          byts = slice3(chunk, 0, this.cursor);
        }
      } else {
        byts = concat3(this.chunks, this.cursor);
      }
      if (reset) {
        this.reset();
      }
      return byts;
    }
  };
  var U8Bl3 = class {
    /**
     * @param {Uint8Array<T>} dest
     */
    constructor(dest) {
      this.dest = dest;
      this.cursor = 0;
      this.chunks = [dest];
    }
    reset() {
      this.cursor = 0;
    }
    /**
     * @param {ByteView|number[]} bytes
     */
    push(bytes) {
      if (this.cursor + bytes.length > this.dest.length) {
        throw new Error("write out of bounds, destination buffer is too small");
      }
      this.dest.set(bytes, this.cursor);
      this.cursor += bytes.length;
    }
    /**
     * @param {boolean} [reset]
     * @returns {Uint8Array<T>}
     */
    toBytes(reset = false) {
      const byts = this.dest.subarray(0, this.cursor);
      if (reset) {
        this.reset();
      }
      return byts;
    }
  };

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/common.js
  var decodeErrPrefix3 = "CBOR decode error:";
  var encodeErrPrefix3 = "CBOR encode error:";
  var uintMinorPrefixBytes3 = [];
  uintMinorPrefixBytes3[23] = 1;
  uintMinorPrefixBytes3[24] = 2;
  uintMinorPrefixBytes3[25] = 3;
  uintMinorPrefixBytes3[26] = 5;
  uintMinorPrefixBytes3[27] = 9;
  function assertEnoughData3(data, pos, need) {
    if (data.length - pos < need) {
      throw new Error(`${decodeErrPrefix3} not enough data for type`);
    }
  }

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/0uint.js
  var uintBoundaries3 = [24, 256, 65536, 4294967296, BigInt("18446744073709551616")];
  function readUint83(data, offset, options) {
    assertEnoughData3(data, offset, 1);
    const value = data[offset];
    if (options.strict === true && value < uintBoundaries3[0]) {
      throw new Error(`${decodeErrPrefix3} integer encoded in more bytes than necessary (strict decode)`);
    }
    return value;
  }
  function readUint163(data, offset, options) {
    assertEnoughData3(data, offset, 2);
    const value = data[offset] << 8 | data[offset + 1];
    if (options.strict === true && value < uintBoundaries3[1]) {
      throw new Error(`${decodeErrPrefix3} integer encoded in more bytes than necessary (strict decode)`);
    }
    return value;
  }
  function readUint323(data, offset, options) {
    assertEnoughData3(data, offset, 4);
    const value = data[offset] * 16777216 + (data[offset + 1] << 16) + (data[offset + 2] << 8) + data[offset + 3];
    if (options.strict === true && value < uintBoundaries3[2]) {
      throw new Error(`${decodeErrPrefix3} integer encoded in more bytes than necessary (strict decode)`);
    }
    return value;
  }
  function readUint643(data, offset, options) {
    assertEnoughData3(data, offset, 8);
    const hi = data[offset] * 16777216 + (data[offset + 1] << 16) + (data[offset + 2] << 8) + data[offset + 3];
    const lo = data[offset + 4] * 16777216 + (data[offset + 5] << 16) + (data[offset + 6] << 8) + data[offset + 7];
    const value = (BigInt(hi) << BigInt(32)) + BigInt(lo);
    if (options.strict === true && value < uintBoundaries3[3]) {
      throw new Error(`${decodeErrPrefix3} integer encoded in more bytes than necessary (strict decode)`);
    }
    if (value <= Number.MAX_SAFE_INTEGER) {
      return Number(value);
    }
    if (options.allowBigInt === true) {
      return value;
    }
    throw new Error(`${decodeErrPrefix3} integers outside of the safe integer range are not supported`);
  }
  function decodeUint83(data, pos, _minor, options) {
    return new Token3(Type3.uint, readUint83(data, pos + 1, options), 2);
  }
  function decodeUint163(data, pos, _minor, options) {
    return new Token3(Type3.uint, readUint163(data, pos + 1, options), 3);
  }
  function decodeUint323(data, pos, _minor, options) {
    return new Token3(Type3.uint, readUint323(data, pos + 1, options), 5);
  }
  function decodeUint643(data, pos, _minor, options) {
    return new Token3(Type3.uint, readUint643(data, pos + 1, options), 9);
  }
  function encodeUint3(writer, token) {
    return encodeUintValue3(writer, 0, token.value);
  }
  function encodeUintValue3(writer, major, uint) {
    if (uint < uintBoundaries3[0]) {
      const nuint = Number(uint);
      writer.push([major | nuint]);
    } else if (uint < uintBoundaries3[1]) {
      const nuint = Number(uint);
      writer.push([major | 24, nuint]);
    } else if (uint < uintBoundaries3[2]) {
      const nuint = Number(uint);
      writer.push([major | 25, nuint >>> 8, nuint & 255]);
    } else if (uint < uintBoundaries3[3]) {
      const nuint = Number(uint);
      writer.push([major | 26, nuint >>> 24 & 255, nuint >>> 16 & 255, nuint >>> 8 & 255, nuint & 255]);
    } else {
      const buint = BigInt(uint);
      if (buint < uintBoundaries3[4]) {
        const set = [major | 27, 0, 0, 0, 0, 0, 0, 0];
        let lo = Number(buint & BigInt(4294967295));
        let hi = Number(buint >> BigInt(32) & BigInt(4294967295));
        set[8] = lo & 255;
        lo = lo >> 8;
        set[7] = lo & 255;
        lo = lo >> 8;
        set[6] = lo & 255;
        lo = lo >> 8;
        set[5] = lo & 255;
        set[4] = hi & 255;
        hi = hi >> 8;
        set[3] = hi & 255;
        hi = hi >> 8;
        set[2] = hi & 255;
        hi = hi >> 8;
        set[1] = hi & 255;
        writer.push(set);
      } else {
        throw new Error(`${decodeErrPrefix3} encountered BigInt larger than allowable range`);
      }
    }
  }
  encodeUint3.encodedSize = function encodedSize17(token) {
    return encodeUintValue3.encodedSize(token.value);
  };
  encodeUintValue3.encodedSize = function encodedSize18(uint) {
    if (uint < uintBoundaries3[0]) {
      return 1;
    }
    if (uint < uintBoundaries3[1]) {
      return 2;
    }
    if (uint < uintBoundaries3[2]) {
      return 3;
    }
    if (uint < uintBoundaries3[3]) {
      return 5;
    }
    return 9;
  };
  encodeUint3.compareTokens = function compareTokens7(tok1, tok2) {
    return tok1.value < tok2.value ? -1 : tok1.value > tok2.value ? 1 : 0;
  };

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/1negint.js
  function decodeNegint83(data, pos, _minor, options) {
    return new Token3(Type3.negint, -1 - readUint83(data, pos + 1, options), 2);
  }
  function decodeNegint163(data, pos, _minor, options) {
    return new Token3(Type3.negint, -1 - readUint163(data, pos + 1, options), 3);
  }
  function decodeNegint323(data, pos, _minor, options) {
    return new Token3(Type3.negint, -1 - readUint323(data, pos + 1, options), 5);
  }
  var neg1b5 = BigInt(-1);
  var pos1b5 = BigInt(1);
  function decodeNegint643(data, pos, _minor, options) {
    const int = readUint643(data, pos + 1, options);
    if (typeof int !== "bigint") {
      const value = -1 - int;
      if (value >= Number.MIN_SAFE_INTEGER) {
        return new Token3(Type3.negint, value, 9);
      }
    }
    if (options.allowBigInt !== true) {
      throw new Error(`${decodeErrPrefix3} integers outside of the safe integer range are not supported`);
    }
    return new Token3(Type3.negint, neg1b5 - BigInt(int), 9);
  }
  function encodeNegint3(writer, token) {
    const negint = token.value;
    const unsigned = typeof negint === "bigint" ? negint * neg1b5 - pos1b5 : negint * -1 - 1;
    encodeUintValue3(writer, token.type.majorEncoded, unsigned);
  }
  encodeNegint3.encodedSize = function encodedSize19(token) {
    const negint = token.value;
    const unsigned = typeof negint === "bigint" ? negint * neg1b5 - pos1b5 : negint * -1 - 1;
    if (unsigned < uintBoundaries3[0]) {
      return 1;
    }
    if (unsigned < uintBoundaries3[1]) {
      return 2;
    }
    if (unsigned < uintBoundaries3[2]) {
      return 3;
    }
    if (unsigned < uintBoundaries3[3]) {
      return 5;
    }
    return 9;
  };
  encodeNegint3.compareTokens = function compareTokens8(tok1, tok2) {
    return tok1.value < tok2.value ? 1 : tok1.value > tok2.value ? -1 : 0;
  };

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/2bytes.js
  function toToken9(data, pos, prefix, length6) {
    assertEnoughData3(data, pos, prefix + length6);
    const buf = data.slice(pos + prefix, pos + prefix + length6);
    return new Token3(Type3.bytes, buf, prefix + length6);
  }
  function decodeBytesCompact3(data, pos, minor, _options) {
    return toToken9(data, pos, 1, minor);
  }
  function decodeBytes83(data, pos, _minor, options) {
    return toToken9(data, pos, 2, readUint83(data, pos + 1, options));
  }
  function decodeBytes163(data, pos, _minor, options) {
    return toToken9(data, pos, 3, readUint163(data, pos + 1, options));
  }
  function decodeBytes323(data, pos, _minor, options) {
    return toToken9(data, pos, 5, readUint323(data, pos + 1, options));
  }
  function decodeBytes643(data, pos, _minor, options) {
    const l = readUint643(data, pos + 1, options);
    if (typeof l === "bigint") {
      throw new Error(`${decodeErrPrefix3} 64-bit integer bytes lengths not supported`);
    }
    return toToken9(data, pos, 9, l);
  }
  function tokenBytes3(token) {
    if (token.encodedBytes === void 0) {
      token.encodedBytes = Type3.equals(token.type, Type3.string) ? fromString4(token.value) : token.value;
    }
    return token.encodedBytes;
  }
  function encodeBytes3(writer, token) {
    const bytes = tokenBytes3(token);
    encodeUintValue3(writer, token.type.majorEncoded, bytes.length);
    writer.push(bytes);
  }
  encodeBytes3.encodedSize = function encodedSize20(token) {
    const bytes = tokenBytes3(token);
    return encodeUintValue3.encodedSize(bytes.length) + bytes.length;
  };
  encodeBytes3.compareTokens = function compareTokens9(tok1, tok2) {
    return compareBytes3(tokenBytes3(tok1), tokenBytes3(tok2));
  };
  function compareBytes3(b1, b2) {
    return b1.length < b2.length ? -1 : b1.length > b2.length ? 1 : compare3(b1, b2);
  }

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/3string.js
  var textDecoder3 = new TextDecoder();
  var ASCII_THRESHOLD3 = 32;
  function toStr3(bytes, start, end) {
    const len = end - start;
    if (len < ASCII_THRESHOLD3) {
      let str = "";
      for (let i = start; i < end; i++) {
        const c = bytes[i];
        if (c & 128) {
          return textDecoder3.decode(bytes.subarray(start, end));
        }
        str += String.fromCharCode(c);
      }
      return str;
    }
    return textDecoder3.decode(bytes.subarray(start, end));
  }
  function toToken10(data, pos, prefix, length6, options) {
    const totLength = prefix + length6;
    assertEnoughData3(data, pos, totLength);
    const tok = new Token3(Type3.string, toStr3(data, pos + prefix, pos + totLength), totLength);
    if (options.retainStringBytes === true) {
      tok.byteValue = data.slice(pos + prefix, pos + totLength);
    }
    return tok;
  }
  function decodeStringCompact3(data, pos, minor, options) {
    return toToken10(data, pos, 1, minor, options);
  }
  function decodeString83(data, pos, _minor, options) {
    return toToken10(data, pos, 2, readUint83(data, pos + 1, options), options);
  }
  function decodeString163(data, pos, _minor, options) {
    return toToken10(data, pos, 3, readUint163(data, pos + 1, options), options);
  }
  function decodeString323(data, pos, _minor, options) {
    return toToken10(data, pos, 5, readUint323(data, pos + 1, options), options);
  }
  function decodeString643(data, pos, _minor, options) {
    const l = readUint643(data, pos + 1, options);
    if (typeof l === "bigint") {
      throw new Error(`${decodeErrPrefix3} 64-bit integer string lengths not supported`);
    }
    return toToken10(data, pos, 9, l, options);
  }
  var encodeString3 = encodeBytes3;

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/4array.js
  function toToken11(_data, _pos, prefix, length6) {
    return new Token3(Type3.array, length6, prefix);
  }
  function decodeArrayCompact3(data, pos, minor, _options) {
    return toToken11(data, pos, 1, minor);
  }
  function decodeArray83(data, pos, _minor, options) {
    return toToken11(data, pos, 2, readUint83(data, pos + 1, options));
  }
  function decodeArray163(data, pos, _minor, options) {
    return toToken11(data, pos, 3, readUint163(data, pos + 1, options));
  }
  function decodeArray323(data, pos, _minor, options) {
    return toToken11(data, pos, 5, readUint323(data, pos + 1, options));
  }
  function decodeArray643(data, pos, _minor, options) {
    const l = readUint643(data, pos + 1, options);
    if (typeof l === "bigint") {
      throw new Error(`${decodeErrPrefix3} 64-bit integer array lengths not supported`);
    }
    return toToken11(data, pos, 9, l);
  }
  function decodeArrayIndefinite3(data, pos, _minor, options) {
    if (options.allowIndefinite === false) {
      throw new Error(`${decodeErrPrefix3} indefinite length items not allowed`);
    }
    return toToken11(data, pos, 1, Infinity);
  }
  function encodeArray3(writer, token) {
    encodeUintValue3(writer, Type3.array.majorEncoded, token.value);
  }
  encodeArray3.compareTokens = encodeUint3.compareTokens;
  encodeArray3.encodedSize = function encodedSize21(token) {
    return encodeUintValue3.encodedSize(token.value);
  };

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/5map.js
  function toToken12(_data, _pos, prefix, length6) {
    return new Token3(Type3.map, length6, prefix);
  }
  function decodeMapCompact3(data, pos, minor, _options) {
    return toToken12(data, pos, 1, minor);
  }
  function decodeMap83(data, pos, _minor, options) {
    return toToken12(data, pos, 2, readUint83(data, pos + 1, options));
  }
  function decodeMap163(data, pos, _minor, options) {
    return toToken12(data, pos, 3, readUint163(data, pos + 1, options));
  }
  function decodeMap323(data, pos, _minor, options) {
    return toToken12(data, pos, 5, readUint323(data, pos + 1, options));
  }
  function decodeMap643(data, pos, _minor, options) {
    const l = readUint643(data, pos + 1, options);
    if (typeof l === "bigint") {
      throw new Error(`${decodeErrPrefix3} 64-bit integer map lengths not supported`);
    }
    return toToken12(data, pos, 9, l);
  }
  function decodeMapIndefinite3(data, pos, _minor, options) {
    if (options.allowIndefinite === false) {
      throw new Error(`${decodeErrPrefix3} indefinite length items not allowed`);
    }
    return toToken12(data, pos, 1, Infinity);
  }
  function encodeMap3(writer, token) {
    encodeUintValue3(writer, Type3.map.majorEncoded, token.value);
  }
  encodeMap3.compareTokens = encodeUint3.compareTokens;
  encodeMap3.encodedSize = function encodedSize22(token) {
    return encodeUintValue3.encodedSize(token.value);
  };

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/6tag.js
  function decodeTagCompact3(_data, _pos, minor, _options) {
    return new Token3(Type3.tag, minor, 1);
  }
  function decodeTag83(data, pos, _minor, options) {
    return new Token3(Type3.tag, readUint83(data, pos + 1, options), 2);
  }
  function decodeTag163(data, pos, _minor, options) {
    return new Token3(Type3.tag, readUint163(data, pos + 1, options), 3);
  }
  function decodeTag323(data, pos, _minor, options) {
    return new Token3(Type3.tag, readUint323(data, pos + 1, options), 5);
  }
  function decodeTag643(data, pos, _minor, options) {
    return new Token3(Type3.tag, readUint643(data, pos + 1, options), 9);
  }
  function encodeTag3(writer, token) {
    encodeUintValue3(writer, Type3.tag.majorEncoded, token.value);
  }
  encodeTag3.compareTokens = encodeUint3.compareTokens;
  encodeTag3.encodedSize = function encodedSize23(token) {
    return encodeUintValue3.encodedSize(token.value);
  };

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/7float.js
  var MINOR_FALSE3 = 20;
  var MINOR_TRUE3 = 21;
  var MINOR_NULL3 = 22;
  var MINOR_UNDEFINED3 = 23;
  function decodeUndefined3(_data, _pos, _minor, options) {
    if (options.allowUndefined === false) {
      throw new Error(`${decodeErrPrefix3} undefined values are not supported`);
    } else if (options.coerceUndefinedToNull === true) {
      return new Token3(Type3.null, null, 1);
    }
    return new Token3(Type3.undefined, void 0, 1);
  }
  function decodeBreak3(_data, _pos, _minor, options) {
    if (options.allowIndefinite === false) {
      throw new Error(`${decodeErrPrefix3} indefinite length items not allowed`);
    }
    return new Token3(Type3.break, void 0, 1);
  }
  function createToken3(value, bytes, options) {
    if (options) {
      if (options.allowNaN === false && Number.isNaN(value)) {
        throw new Error(`${decodeErrPrefix3} NaN values are not supported`);
      }
      if (options.allowInfinity === false && (value === Infinity || value === -Infinity)) {
        throw new Error(`${decodeErrPrefix3} Infinity values are not supported`);
      }
    }
    return new Token3(Type3.float, value, bytes);
  }
  function decodeFloat163(data, pos, _minor, options) {
    return createToken3(readFloat163(data, pos + 1), 3, options);
  }
  function decodeFloat323(data, pos, _minor, options) {
    return createToken3(readFloat323(data, pos + 1), 5, options);
  }
  function decodeFloat643(data, pos, _minor, options) {
    return createToken3(readFloat643(data, pos + 1), 9, options);
  }
  function encodeFloat3(writer, token, options) {
    const float = token.value;
    if (float === false) {
      writer.push([Type3.float.majorEncoded | MINOR_FALSE3]);
    } else if (float === true) {
      writer.push([Type3.float.majorEncoded | MINOR_TRUE3]);
    } else if (float === null) {
      writer.push([Type3.float.majorEncoded | MINOR_NULL3]);
    } else if (float === void 0) {
      writer.push([Type3.float.majorEncoded | MINOR_UNDEFINED3]);
    } else {
      let decoded;
      let success = false;
      if (!options || options.float64 !== true) {
        encodeFloat163(float);
        decoded = readFloat163(ui8a3, 1);
        if (float === decoded || Number.isNaN(float)) {
          ui8a3[0] = 249;
          writer.push(ui8a3.slice(0, 3));
          success = true;
        } else {
          encodeFloat323(float);
          decoded = readFloat323(ui8a3, 1);
          if (float === decoded) {
            ui8a3[0] = 250;
            writer.push(ui8a3.slice(0, 5));
            success = true;
          }
        }
      }
      if (!success) {
        encodeFloat643(float);
        decoded = readFloat643(ui8a3, 1);
        ui8a3[0] = 251;
        writer.push(ui8a3.slice(0, 9));
      }
    }
  }
  encodeFloat3.encodedSize = function encodedSize24(token, options) {
    const float = token.value;
    if (float === false || float === true || float === null || float === void 0) {
      return 1;
    }
    if (!options || options.float64 !== true) {
      encodeFloat163(float);
      let decoded = readFloat163(ui8a3, 1);
      if (float === decoded || Number.isNaN(float)) {
        return 3;
      }
      encodeFloat323(float);
      decoded = readFloat323(ui8a3, 1);
      if (float === decoded) {
        return 5;
      }
    }
    return 9;
  };
  var buffer3 = new ArrayBuffer(9);
  var dataView3 = new DataView(buffer3, 1);
  var ui8a3 = new Uint8Array(buffer3, 0);
  function encodeFloat163(inp) {
    if (inp === Infinity) {
      dataView3.setUint16(0, 31744, false);
    } else if (inp === -Infinity) {
      dataView3.setUint16(0, 64512, false);
    } else if (Number.isNaN(inp)) {
      dataView3.setUint16(0, 32256, false);
    } else {
      dataView3.setFloat32(0, inp);
      const valu32 = dataView3.getUint32(0);
      const exponent = (valu32 & 2139095040) >> 23;
      const mantissa = valu32 & 8388607;
      if (exponent === 255) {
        dataView3.setUint16(0, 31744, false);
      } else if (exponent === 0) {
        dataView3.setUint16(0, (valu32 & 2147483648) >> 16 | mantissa >> 13, false);
      } else {
        const logicalExponent = exponent - 127;
        if (logicalExponent < -24) {
          dataView3.setUint16(0, 0);
        } else if (logicalExponent < -14) {
          dataView3.setUint16(0, (valu32 & 2147483648) >> 16 | /* sign bit */
          1 << 24 + logicalExponent, false);
        } else {
          dataView3.setUint16(0, (valu32 & 2147483648) >> 16 | logicalExponent + 15 << 10 | mantissa >> 13, false);
        }
      }
    }
  }
  function readFloat163(ui8a4, pos) {
    if (ui8a4.length - pos < 2) {
      throw new Error(`${decodeErrPrefix3} not enough data for float16`);
    }
    const half = (ui8a4[pos] << 8) + ui8a4[pos + 1];
    if (half === 31744) {
      return Infinity;
    }
    if (half === 64512) {
      return -Infinity;
    }
    if (half === 32256) {
      return NaN;
    }
    const exp = half >> 10 & 31;
    const mant = half & 1023;
    let val;
    if (exp === 0) {
      val = mant * 2 ** -24;
    } else if (exp !== 31) {
      val = (mant + 1024) * 2 ** (exp - 25);
    } else {
      val = mant === 0 ? Infinity : NaN;
    }
    return half & 32768 ? -val : val;
  }
  function encodeFloat323(inp) {
    dataView3.setFloat32(0, inp, false);
  }
  function readFloat323(ui8a4, pos) {
    if (ui8a4.length - pos < 4) {
      throw new Error(`${decodeErrPrefix3} not enough data for float32`);
    }
    const offset = (ui8a4.byteOffset || 0) + pos;
    return new DataView(ui8a4.buffer, offset, 4).getFloat32(0, false);
  }
  function encodeFloat643(inp) {
    dataView3.setFloat64(0, inp, false);
  }
  function readFloat643(ui8a4, pos) {
    if (ui8a4.length - pos < 8) {
      throw new Error(`${decodeErrPrefix3} not enough data for float64`);
    }
    const offset = (ui8a4.byteOffset || 0) + pos;
    return new DataView(ui8a4.buffer, offset, 8).getFloat64(0, false);
  }
  encodeFloat3.compareTokens = encodeUint3.compareTokens;

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/jump.js
  function invalidMinor3(data, pos, minor) {
    throw new Error(`${decodeErrPrefix3} encountered invalid minor (${minor}) for major ${data[pos] >>> 5}`);
  }
  function errorer3(msg) {
    return () => {
      throw new Error(`${decodeErrPrefix3} ${msg}`);
    };
  }
  var jump3 = [];
  for (let i = 0; i <= 23; i++) {
    jump3[i] = invalidMinor3;
  }
  jump3[24] = decodeUint83;
  jump3[25] = decodeUint163;
  jump3[26] = decodeUint323;
  jump3[27] = decodeUint643;
  jump3[28] = invalidMinor3;
  jump3[29] = invalidMinor3;
  jump3[30] = invalidMinor3;
  jump3[31] = invalidMinor3;
  for (let i = 32; i <= 55; i++) {
    jump3[i] = invalidMinor3;
  }
  jump3[56] = decodeNegint83;
  jump3[57] = decodeNegint163;
  jump3[58] = decodeNegint323;
  jump3[59] = decodeNegint643;
  jump3[60] = invalidMinor3;
  jump3[61] = invalidMinor3;
  jump3[62] = invalidMinor3;
  jump3[63] = invalidMinor3;
  for (let i = 64; i <= 87; i++) {
    jump3[i] = decodeBytesCompact3;
  }
  jump3[88] = decodeBytes83;
  jump3[89] = decodeBytes163;
  jump3[90] = decodeBytes323;
  jump3[91] = decodeBytes643;
  jump3[92] = invalidMinor3;
  jump3[93] = invalidMinor3;
  jump3[94] = invalidMinor3;
  jump3[95] = errorer3("indefinite length bytes/strings are not supported");
  for (let i = 96; i <= 119; i++) {
    jump3[i] = decodeStringCompact3;
  }
  jump3[120] = decodeString83;
  jump3[121] = decodeString163;
  jump3[122] = decodeString323;
  jump3[123] = decodeString643;
  jump3[124] = invalidMinor3;
  jump3[125] = invalidMinor3;
  jump3[126] = invalidMinor3;
  jump3[127] = errorer3("indefinite length bytes/strings are not supported");
  for (let i = 128; i <= 151; i++) {
    jump3[i] = decodeArrayCompact3;
  }
  jump3[152] = decodeArray83;
  jump3[153] = decodeArray163;
  jump3[154] = decodeArray323;
  jump3[155] = decodeArray643;
  jump3[156] = invalidMinor3;
  jump3[157] = invalidMinor3;
  jump3[158] = invalidMinor3;
  jump3[159] = decodeArrayIndefinite3;
  for (let i = 160; i <= 183; i++) {
    jump3[i] = decodeMapCompact3;
  }
  jump3[184] = decodeMap83;
  jump3[185] = decodeMap163;
  jump3[186] = decodeMap323;
  jump3[187] = decodeMap643;
  jump3[188] = invalidMinor3;
  jump3[189] = invalidMinor3;
  jump3[190] = invalidMinor3;
  jump3[191] = decodeMapIndefinite3;
  for (let i = 192; i <= 215; i++) {
    jump3[i] = decodeTagCompact3;
  }
  jump3[216] = decodeTag83;
  jump3[217] = decodeTag163;
  jump3[218] = decodeTag323;
  jump3[219] = decodeTag643;
  jump3[220] = invalidMinor3;
  jump3[221] = invalidMinor3;
  jump3[222] = invalidMinor3;
  jump3[223] = invalidMinor3;
  for (let i = 224; i <= 243; i++) {
    jump3[i] = errorer3("simple values are not supported");
  }
  jump3[244] = invalidMinor3;
  jump3[245] = invalidMinor3;
  jump3[246] = invalidMinor3;
  jump3[247] = decodeUndefined3;
  jump3[248] = errorer3("simple values are not supported");
  jump3[249] = decodeFloat163;
  jump3[250] = decodeFloat323;
  jump3[251] = decodeFloat643;
  jump3[252] = invalidMinor3;
  jump3[253] = invalidMinor3;
  jump3[254] = invalidMinor3;
  jump3[255] = decodeBreak3;
  var quick3 = [];
  for (let i = 0; i < 24; i++) {
    quick3[i] = new Token3(Type3.uint, i, 1);
  }
  for (let i = -1; i >= -24; i--) {
    quick3[31 - i] = new Token3(Type3.negint, i, 1);
  }
  quick3[64] = new Token3(Type3.bytes, new Uint8Array(0), 1);
  quick3[96] = new Token3(Type3.string, "", 1);
  quick3[128] = new Token3(Type3.array, 0, 1);
  quick3[160] = new Token3(Type3.map, 0, 1);
  quick3[244] = new Token3(Type3.false, false, 1);
  quick3[245] = new Token3(Type3.true, true, 1);
  quick3[246] = new Token3(Type3.null, null, 1);
  function quickEncodeToken3(token) {
    switch (token.type) {
      case Type3.false:
        return fromArray3([244]);
      case Type3.true:
        return fromArray3([245]);
      case Type3.null:
        return fromArray3([246]);
      case Type3.bytes:
        if (!token.value.length) {
          return fromArray3([64]);
        }
        return;
      case Type3.string:
        if (token.value === "") {
          return fromArray3([96]);
        }
        return;
      case Type3.array:
        if (token.value === 0) {
          return fromArray3([128]);
        }
        return;
      case Type3.map:
        if (token.value === 0) {
          return fromArray3([160]);
        }
        return;
      case Type3.uint:
        if (token.value < 24) {
          return fromArray3([Number(token.value)]);
        }
        return;
      case Type3.negint:
        if (token.value >= -24) {
          return fromArray3([31 - Number(token.value)]);
        }
    }
  }

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/encode.js
  var rfc8949EncodeOptions3 = Object.freeze({
    mapSorter: rfc8949MapSorter3,
    quickEncodeToken: quickEncodeToken3
  });
  function makeCborEncoders3() {
    const encoders = [];
    encoders[Type3.uint.major] = encodeUint3;
    encoders[Type3.negint.major] = encodeNegint3;
    encoders[Type3.bytes.major] = encodeBytes3;
    encoders[Type3.string.major] = encodeString3;
    encoders[Type3.array.major] = encodeArray3;
    encoders[Type3.map.major] = encodeMap3;
    encoders[Type3.tag.major] = encodeTag3;
    encoders[Type3.float.major] = encodeFloat3;
    return encoders;
  }
  var cborEncoders4 = makeCborEncoders3();
  var defaultWriter3 = new Bl3();
  var Ref3 = class _Ref {
    /**
     * @param {object|any[]} obj
     * @param {Reference|undefined} parent
     */
    constructor(obj, parent) {
      this.obj = obj;
      this.parent = parent;
    }
    /**
     * @param {object|any[]} obj
     * @returns {boolean}
     */
    includes(obj) {
      let p = this;
      do {
        if (p.obj === obj) {
          return true;
        }
      } while (p = p.parent);
      return false;
    }
    /**
     * @param {Reference|undefined} stack
     * @param {object|any[]} obj
     * @returns {Reference}
     */
    static createCheck(stack, obj) {
      if (stack && stack.includes(obj)) {
        throw new Error(`${encodeErrPrefix3} object contains circular references`);
      }
      return new _Ref(obj, stack);
    }
  };
  var simpleTokens3 = {
    null: new Token3(Type3.null, null),
    undefined: new Token3(Type3.undefined, void 0),
    true: new Token3(Type3.true, true),
    false: new Token3(Type3.false, false),
    emptyArray: new Token3(Type3.array, 0),
    emptyMap: new Token3(Type3.map, 0)
  };
  var typeEncoders3 = {
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    number(obj, _typ, _options, _refStack) {
      if (!Number.isInteger(obj) || !Number.isSafeInteger(obj)) {
        return new Token3(Type3.float, obj);
      } else if (obj >= 0) {
        return new Token3(Type3.uint, obj);
      } else {
        return new Token3(Type3.negint, obj);
      }
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    bigint(obj, _typ, _options, _refStack) {
      if (obj >= BigInt(0)) {
        return new Token3(Type3.uint, obj);
      } else {
        return new Token3(Type3.negint, obj);
      }
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    Uint8Array(obj, _typ, _options, _refStack) {
      return new Token3(Type3.bytes, obj);
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    string(obj, _typ, _options, _refStack) {
      return new Token3(Type3.string, obj);
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    boolean(obj, _typ, _options, _refStack) {
      return obj ? simpleTokens3.true : simpleTokens3.false;
    },
    /**
     * @param {any} _obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    null(_obj, _typ, _options, _refStack) {
      return simpleTokens3.null;
    },
    /**
     * @param {any} _obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    undefined(_obj, _typ, _options, _refStack) {
      return simpleTokens3.undefined;
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    ArrayBuffer(obj, _typ, _options, _refStack) {
      return new Token3(Type3.bytes, new Uint8Array(obj));
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} _options
     * @param {Reference} [_refStack]
     * @returns {TokenOrNestedTokens}
     */
    DataView(obj, _typ, _options, _refStack) {
      return new Token3(Type3.bytes, new Uint8Array(obj.buffer, obj.byteOffset, obj.byteLength));
    },
    /**
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} options
     * @param {Reference} [refStack]
     * @returns {TokenOrNestedTokens}
     */
    Array(obj, _typ, options, refStack) {
      if (!obj.length) {
        if (options.addBreakTokens === true) {
          return [simpleTokens3.emptyArray, new Token3(Type3.break)];
        }
        return simpleTokens3.emptyArray;
      }
      refStack = Ref3.createCheck(refStack, obj);
      const entries = [];
      let i = 0;
      for (const e of obj) {
        entries[i++] = objectToTokens3(e, options, refStack);
      }
      if (options.addBreakTokens) {
        return [new Token3(Type3.array, obj.length), entries, new Token3(Type3.break)];
      }
      return [new Token3(Type3.array, obj.length), entries];
    },
    /**
     * @param {any} obj
     * @param {string} typ
     * @param {EncodeOptions} options
     * @param {Reference} [refStack]
     * @returns {TokenOrNestedTokens}
     */
    Object(obj, typ, options, refStack) {
      const isMap = typ !== "Object";
      const keys = isMap ? obj.keys() : Object.keys(obj);
      const maxLength = isMap ? obj.size : keys.length;
      let entries;
      if (maxLength) {
        entries = new Array(maxLength);
        refStack = Ref3.createCheck(refStack, obj);
        const skipUndefined = !isMap && options.ignoreUndefinedProperties;
        let i = 0;
        for (const key of keys) {
          const value = isMap ? obj.get(key) : obj[key];
          if (skipUndefined && value === void 0) {
            continue;
          }
          entries[i++] = [
            objectToTokens3(key, options, refStack),
            objectToTokens3(value, options, refStack)
          ];
        }
        if (i < maxLength) {
          entries.length = i;
        }
      }
      if (!entries?.length) {
        if (options.addBreakTokens === true) {
          return [simpleTokens3.emptyMap, new Token3(Type3.break)];
        }
        return simpleTokens3.emptyMap;
      }
      sortMapEntries3(entries, options);
      if (options.addBreakTokens) {
        return [new Token3(Type3.map, entries.length), entries, new Token3(Type3.break)];
      }
      return [new Token3(Type3.map, entries.length), entries];
    },
    /**
     * Encode a `Tagged` wrapper as a CBOR tag header followed by the encoded
     * form of the wrapped value. The value is recursively tokenised through
     * `objectToTokens()` so any registered `typeEncoders` apply to it.
     *
     * @param {any} obj
     * @param {string} _typ
     * @param {EncodeOptions} options
     * @param {Reference} [refStack]
     * @returns {TokenOrNestedTokens}
     */
    Tagged(obj, _typ, options, refStack) {
      return [
        new Token3(Type3.tag, obj.tag),
        objectToTokens3(obj.value, options, refStack)
      ];
    }
  };
  typeEncoders3.Map = typeEncoders3.Object;
  typeEncoders3.Buffer = typeEncoders3.Uint8Array;
  for (const typ of "Uint8Clamped Uint16 Uint32 Int8 Int16 Int32 BigUint64 BigInt64 Float32 Float64".split(" ")) {
    typeEncoders3[`${typ}Array`] = typeEncoders3.DataView;
  }
  function objectToTokens3(obj, options = {}, refStack) {
    const typ = is3(obj);
    const customTypeEncoder = options && options.typeEncoders && /** @type {OptionalTypeEncoder} */
    options.typeEncoders[typ] || typeEncoders3[typ];
    if (typeof customTypeEncoder === "function") {
      const tokens = customTypeEncoder(obj, typ, options, refStack);
      if (tokens != null) {
        return tokens;
      }
    }
    const typeEncoder = typeEncoders3[typ];
    if (!typeEncoder) {
      throw new Error(`${encodeErrPrefix3} unsupported type: ${typ}`);
    }
    return typeEncoder(obj, typ, options, refStack);
  }
  function sortMapEntries3(entries, options) {
    if (options.mapSorter) {
      entries.sort(options.mapSorter);
    }
  }
  function rfc8949MapSorter3(e1, e2) {
    if (e1[0] instanceof Token3 && e2[0] instanceof Token3) {
      const t1 = (
        /** @type {TokenEx} */
        e1[0]
      );
      const t2 = (
        /** @type {TokenEx} */
        e2[0]
      );
      if (!t1._keyBytes) {
        t1._keyBytes = encodeRfc89493(t1.value);
      }
      if (!t2._keyBytes) {
        t2._keyBytes = encodeRfc89493(t2.value);
      }
      return compare3(t1._keyBytes, t2._keyBytes);
    }
    throw new Error("rfc8949MapSorter: complex key types are not supported yet");
  }
  function encodeRfc89493(data) {
    return encodeCustom3(data, cborEncoders4, rfc8949EncodeOptions3);
  }
  function tokensToEncoded3(writer, tokens, encoders, options) {
    if (Array.isArray(tokens)) {
      for (const token of tokens) {
        tokensToEncoded3(writer, token, encoders, options);
      }
    } else {
      encoders[tokens.type.major](writer, tokens, options);
    }
  }
  var MAJOR_UINT3 = Type3.uint.majorEncoded;
  var MAJOR_NEGINT3 = Type3.negint.majorEncoded;
  var MAJOR_BYTES3 = Type3.bytes.majorEncoded;
  var MAJOR_STRING3 = Type3.string.majorEncoded;
  var MAJOR_ARRAY3 = Type3.array.majorEncoded;
  var SIMPLE_FALSE3 = Type3.float.majorEncoded | MINOR_FALSE3;
  var SIMPLE_TRUE3 = Type3.float.majorEncoded | MINOR_TRUE3;
  var SIMPLE_NULL3 = Type3.float.majorEncoded | MINOR_NULL3;
  var SIMPLE_UNDEFINED3 = Type3.float.majorEncoded | MINOR_UNDEFINED3;
  var neg1b6 = BigInt(-1);
  var pos1b6 = BigInt(1);
  function encodeCustom3(data, encoders, options, destination) {
    const hasDest = destination instanceof Uint8Array;
    let writeTo = hasDest ? new U8Bl3(destination) : defaultWriter3;
    const tokens = objectToTokens3(data, options);
    if (!Array.isArray(tokens) && options.quickEncodeToken) {
      const quickBytes = options.quickEncodeToken(tokens);
      if (quickBytes) {
        if (hasDest) {
          writeTo.push(quickBytes);
          return writeTo.toBytes();
        }
        return quickBytes;
      }
      const encoder = encoders[tokens.type.major];
      if (encoder.encodedSize) {
        const size = encoder.encodedSize(tokens, options);
        if (!hasDest) {
          writeTo = new Bl3(size);
        }
        encoder(writeTo, tokens, options);
        if (writeTo.chunks.length !== 1) {
          throw new Error(`Unexpected error: pre-calculated length for ${tokens} was wrong`);
        }
        return hasDest ? writeTo.toBytes() : asU8A3(writeTo.chunks[0]);
      }
    }
    writeTo.reset();
    tokensToEncoded3(writeTo, tokens, encoders, options);
    return writeTo.toBytes(true);
  }

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/decode.js
  var defaultDecodeOptions2 = {
    strict: false,
    allowIndefinite: true,
    allowUndefined: true,
    allowBigInt: true
  };
  var Tokeniser3 = class {
    /**
     * @param {Uint8Array} data
     * @param {DecodeOptions} options
     */
    constructor(data, options = {}) {
      this._pos = 0;
      this.data = data;
      this.options = options;
    }
    pos() {
      return this._pos;
    }
    done() {
      return this._pos >= this.data.length;
    }
    next() {
      const byt = this.data[this._pos];
      let token = quick3[byt];
      if (token === void 0) {
        const decoder = jump3[byt];
        if (!decoder) {
          throw new Error(`${decodeErrPrefix3} no decoder for major type ${byt >>> 5} (byte 0x${byt.toString(16).padStart(2, "0")})`);
        }
        const minor = byt & 31;
        token = decoder(this.data, this._pos, minor, this.options);
      }
      this._pos += token.encodedLength;
      return token;
    }
  };
  var DONE2 = /* @__PURE__ */ Symbol.for("DONE");
  var BREAK2 = /* @__PURE__ */ Symbol.for("BREAK");
  function tokenToArray2(token, tokeniser, options) {
    const arr = [];
    for (let i = 0; i < token.value; i++) {
      const value = tokensToObject3(tokeniser, options);
      if (value === BREAK2) {
        if (token.value === Infinity) {
          break;
        }
        throw new Error(`${decodeErrPrefix3} got unexpected break to lengthed array`);
      }
      if (value === DONE2) {
        throw new Error(`${decodeErrPrefix3} found array but not enough entries (got ${i}, expected ${token.value})`);
      }
      arr[i] = value;
    }
    return arr;
  }
  function tokenToMap2(token, tokeniser, options) {
    const useMaps = options.useMaps === true;
    const rejectDuplicateMapKeys = options.rejectDuplicateMapKeys === true;
    const obj = useMaps ? void 0 : {};
    const m = useMaps ? /* @__PURE__ */ new Map() : void 0;
    for (let i = 0; i < token.value; i++) {
      const key = tokensToObject3(tokeniser, options);
      if (key === BREAK2) {
        if (token.value === Infinity) {
          break;
        }
        throw new Error(`${decodeErrPrefix3} got unexpected break to lengthed map`);
      }
      if (key === DONE2) {
        throw new Error(`${decodeErrPrefix3} found map but not enough entries (got ${i} [no key], expected ${token.value})`);
      }
      if (!useMaps && typeof key !== "string") {
        throw new Error(`${decodeErrPrefix3} non-string keys not supported (got ${typeof key})`);
      }
      if (rejectDuplicateMapKeys) {
        if (useMaps && m.has(key) || !useMaps && Object.hasOwn(obj, key)) {
          throw new Error(`${decodeErrPrefix3} found repeat map key "${key}"`);
        }
      }
      const value = tokensToObject3(tokeniser, options);
      if (value === DONE2) {
        throw new Error(`${decodeErrPrefix3} found map but not enough entries (got ${i} [no value], expected ${token.value})`);
      }
      if (useMaps) {
        m.set(key, value);
      } else {
        obj[key] = value;
      }
    }
    return useMaps ? m : obj;
  }
  function* tokenToMapEntries2(token, tokeniser, options) {
    for (let i = 0; i < token.value; i++) {
      const key = tokensToObject3(tokeniser, options);
      if (key === BREAK2) {
        if (token.value === Infinity) {
          break;
        }
        throw new Error(`${decodeErrPrefix3} got unexpected break to lengthed map`);
      }
      if (key === DONE2) {
        throw new Error(`${decodeErrPrefix3} found map but not enough entries (got ${i} [no key], expected ${token.value})`);
      }
      const value = tokensToObject3(tokeniser, options);
      if (value === DONE2) {
        throw new Error(`${decodeErrPrefix3} found map but not enough entries (got ${i} [no value], expected ${token.value})`);
      }
      yield [key, value];
    }
  }
  function createTagDecodeControl2(tokeniser, options) {
    let called = false;
    const decode25 = function() {
      if (called) {
        throw new Error(`${decodeErrPrefix3} tag decode() may only be called once`);
      }
      called = true;
      const value = tokensToObject3(tokeniser, options);
      if (value === DONE2) {
        throw new Error(`${decodeErrPrefix3} tag content missing`);
      }
      if (value === BREAK2) {
        throw new Error(`${decodeErrPrefix3} got unexpected break in tag content`);
      }
      return value;
    };
    decode25.entries = function() {
      if (called) {
        throw new Error(`${decodeErrPrefix3} tag decode() may only be called once`);
      }
      called = true;
      const token = tokeniser.next();
      if (!Type3.equals(token.type, Type3.map)) {
        throw new Error(`${decodeErrPrefix3} entries() requires map content, got ${token.type.name}`);
      }
      const entries = [];
      for (const entry of tokenToMapEntries2(token, tokeniser, options)) {
        entries.push(entry);
      }
      return entries;
    };
    Object.defineProperty(decode25, "_called", {
      get() {
        return called;
      },
      enumerable: false
    });
    return decode25;
  }
  function tokensToObject3(tokeniser, options) {
    if (tokeniser.done()) {
      return DONE2;
    }
    const token = tokeniser.next();
    if (Type3.equals(token.type, Type3.break)) {
      return BREAK2;
    }
    if (token.type.terminal) {
      return token.value;
    }
    if (Type3.equals(token.type, Type3.array)) {
      return tokenToArray2(token, tokeniser, options);
    }
    if (Type3.equals(token.type, Type3.map)) {
      return tokenToMap2(token, tokeniser, options);
    }
    if (Type3.equals(token.type, Type3.tag)) {
      if (options.tags && typeof options.tags[token.value] === "function") {
        const decodeControl = createTagDecodeControl2(tokeniser, options);
        const result = options.tags[token.value](decodeControl);
        if (!decodeControl._called) {
          throw new Error(`${decodeErrPrefix3} tag decoder must call decode() or entries()`);
        }
        return result;
      }
      throw new Error(`${decodeErrPrefix3} tag not supported (${token.value})`);
    }
    throw new Error("unsupported");
  }
  function decodeFirst3(data, options) {
    if (!(data instanceof Uint8Array)) {
      throw new Error(`${decodeErrPrefix3} data to decode must be a Uint8Array`);
    }
    options = Object.assign({}, defaultDecodeOptions2, options);
    const u8aData = asU8A3(data);
    const tokeniser = options.tokenizer || new Tokeniser3(u8aData, options);
    const decoded = tokensToObject3(tokeniser, options);
    if (decoded === DONE2) {
      throw new Error(`${decodeErrPrefix3} did not find any content to decode`);
    }
    if (decoded === BREAK2) {
      throw new Error(`${decodeErrPrefix3} got unexpected break`);
    }
    return [decoded, data.subarray(tokeniser.pos())];
  }
  function decode8(data, options) {
    const [decoded, remainder] = decodeFirst3(data, options);
    if (remainder.length > 0) {
      throw new Error(`${decodeErrPrefix3} too many terminals, data makes no sense`);
    }
    return decoded;
  }

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/tagged.js
  var Tagged2 = class _Tagged {
    /**
     * @param {number} tag - CBOR tag number, a non-negative integer
     * @param {any} value - The value to be tagged; encoded recursively
     */
    constructor(tag, value) {
      if (typeof tag !== "number" || !Number.isInteger(tag) || tag < 0) {
        throw new TypeError("Tagged: tag must be a non-negative integer");
      }
      this.tag = tag;
      this.value = value;
    }
    /**
     * Build a tag decoder for use in `decode()`'s `tags` option that returns the
     * decoded content wrapped in a `Tagged` instance, preserving the tag number
     * for the caller to inspect.
     *
     * @param {number} tag - The CBOR tag number this decoder will be registered for
     * @returns {TaggedTagDecoder}
     *
     * @example
     * import { decode, Tagged } from 'cborg'
     * const value = decode(bytes, { tags: { 16: Tagged.decoder(16) } })
     * // value instanceof Tagged; value.tag === 16
     */
    static decoder(tag) {
      return (decode25) => new _Tagged(tag, decode25());
    }
    /**
     * Build a `tags` option for `decode()` that wraps each listed tag number in
     * a `Tagged` instance, preserving those tags through decode without
     * registering a dedicated decoder per tag.
     *
     * @param {...number} tagNumbers - One or more CBOR tag numbers to preserve
     * @returns {{[tagNumber: number]: TaggedTagDecoder}}
     *
     * @example
     * import { decode, Tagged } from 'cborg'
     * const value = decode(bytes, { tags: Tagged.preserve(16, 96) })
     */
    static preserve(...tagNumbers) {
      const tags = {};
      for (const tag of tagNumbers) {
        tags[tag] = _Tagged.decoder(tag);
      }
      return tags;
    }
  };
  Object.defineProperty(Tagged2.prototype, Symbol.toStringTag, {
    value: "Tagged"
  });

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/json/encode.js
  var JSONEncoder = class extends Array {
    constructor() {
      super();
      this.inRecursive = [];
    }
    /**
     * @param {ByteWriter} buf
     */
    prefix(buf) {
      const recurs = this.inRecursive[this.inRecursive.length - 1];
      if (recurs) {
        if (Type3.equals(recurs.type, Type3.array)) {
          recurs.elements++;
          if (recurs.elements !== 1) {
            buf.push([44]);
          }
        }
        if (Type3.equals(recurs.type, Type3.map)) {
          recurs.elements++;
          if (recurs.elements !== 1) {
            if (recurs.elements % 2 === 1) {
              buf.push([44]);
            } else {
              buf.push([58]);
            }
          }
        }
      }
    }
    /**
     * @param {ByteWriter} buf
     * @param {Token} token
     */
    [Type3.uint.major](buf, token) {
      this.prefix(buf);
      const is4 = String(token.value);
      const isa = [];
      for (let i = 0; i < is4.length; i++) {
        isa[i] = is4.charCodeAt(i);
      }
      buf.push(isa);
    }
    /**
     * @param {ByteWriter} buf
     * @param {Token} token
     */
    [Type3.negint.major](buf, token) {
      this[Type3.uint.major](buf, token);
    }
    /**
     * @param {ByteWriter} _buf
     * @param {Token} _token
     */
    [Type3.bytes.major](_buf, _token) {
      throw new Error(`${encodeErrPrefix3} unsupported type: Uint8Array`);
    }
    /**
     * @param {ByteWriter} buf
     * @param {Token} token
     */
    [Type3.string.major](buf, token) {
      this.prefix(buf);
      const byts = fromString4(JSON.stringify(token.value));
      buf.push(byts.length > 32 ? asU8A3(byts) : byts);
    }
    /**
     * @param {ByteWriter} buf
     * @param {Token} _token
     */
    [Type3.array.major](buf, _token) {
      this.prefix(buf);
      this.inRecursive.push({ type: Type3.array, elements: 0 });
      buf.push([91]);
    }
    /**
     * @param {ByteWriter} buf
     * @param {Token} _token
     */
    [Type3.map.major](buf, _token) {
      this.prefix(buf);
      this.inRecursive.push({ type: Type3.map, elements: 0 });
      buf.push([123]);
    }
    /**
     * @param {ByteWriter} _buf
     * @param {Token} _token
     */
    [Type3.tag.major](_buf, _token) {
    }
    /**
     * @param {ByteWriter} buf
     * @param {Token} token
     */
    [Type3.float.major](buf, token) {
      if (token.type.name === "break") {
        const recurs = this.inRecursive.pop();
        if (recurs) {
          if (Type3.equals(recurs.type, Type3.array)) {
            buf.push([93]);
          } else if (Type3.equals(recurs.type, Type3.map)) {
            buf.push([125]);
          } else {
            throw new Error("Unexpected recursive type; this should not happen!");
          }
          return;
        }
        throw new Error("Unexpected break; this should not happen!");
      }
      if (token.value === void 0) {
        throw new Error(`${encodeErrPrefix3} unsupported type: undefined`);
      }
      this.prefix(buf);
      if (token.type.name === "true") {
        buf.push([116, 114, 117, 101]);
        return;
      } else if (token.type.name === "false") {
        buf.push([102, 97, 108, 115, 101]);
        return;
      } else if (token.type.name === "null") {
        buf.push([110, 117, 108, 108]);
        return;
      }
      const is4 = String(token.value);
      const isa = [];
      let dp = false;
      for (let i = 0; i < is4.length; i++) {
        isa[i] = is4.charCodeAt(i);
        if (!dp && (isa[i] === 46 || isa[i] === 101 || isa[i] === 69)) {
          dp = true;
        }
      }
      if (!dp) {
        isa.push(46);
        isa.push(48);
      }
      buf.push(isa);
    }
  };

  // node_modules/@ipld/dag-json/node_modules/cborg/lib/json/decode.js
  var Tokenizer = class {
    /**
     * @param {Uint8Array} data
     * @param {DecodeOptions} options
     */
    constructor(data, options = {}) {
      this._pos = 0;
      this.data = data;
      this.options = options;
      this.modeStack = ["value"];
      this.lastToken = "";
    }
    pos() {
      return this._pos;
    }
    /**
     * @returns {boolean}
     */
    done() {
      return this._pos >= this.data.length;
    }
    /**
     * @returns {number}
     */
    ch() {
      return this.data[this._pos];
    }
    /**
     * @returns {string}
     */
    currentMode() {
      return this.modeStack[this.modeStack.length - 1];
    }
    skipWhitespace() {
      let c = this.ch();
      while (c === 32 || c === 9 || c === 13 || c === 10) {
        c = this.data[++this._pos];
      }
    }
    /**
     * @param {number[]} str
     */
    expect(str) {
      if (this.data.length - this._pos < str.length) {
        throw new Error(`${decodeErrPrefix3} unexpected end of input at position ${this._pos}`);
      }
      for (let i = 0; i < str.length; i++) {
        if (this.data[this._pos++] !== str[i]) {
          throw new Error(`${decodeErrPrefix3} unexpected token at position ${this._pos}, expected to find '${String.fromCharCode(...str)}'`);
        }
      }
    }
    parseNumber() {
      const startPos = this._pos;
      let negative = false;
      let float = false;
      const swallow = (chars) => {
        while (!this.done()) {
          const ch = this.ch();
          if (chars.includes(ch)) {
            this._pos++;
          } else {
            break;
          }
        }
      };
      if (this.ch() === 45) {
        negative = true;
        this._pos++;
      }
      if (this.ch() === 48) {
        this._pos++;
        if (this.ch() === 46) {
          this._pos++;
          float = true;
        } else {
          return new Token3(Type3.uint, 0, this._pos - startPos);
        }
      }
      swallow([48, 49, 50, 51, 52, 53, 54, 55, 56, 57]);
      if (negative && this._pos === startPos + 1) {
        throw new Error(`${decodeErrPrefix3} unexpected token at position ${this._pos}`);
      }
      if (!this.done() && this.ch() === 46) {
        if (float) {
          throw new Error(`${decodeErrPrefix3} unexpected token at position ${this._pos}`);
        }
        float = true;
        this._pos++;
        swallow([48, 49, 50, 51, 52, 53, 54, 55, 56, 57]);
      }
      if (!this.done() && (this.ch() === 101 || this.ch() === 69)) {
        float = true;
        this._pos++;
        if (!this.done() && (this.ch() === 43 || this.ch() === 45)) {
          this._pos++;
        }
        swallow([48, 49, 50, 51, 52, 53, 54, 55, 56, 57]);
      }
      const numStr = String.fromCharCode.apply(null, this.data.subarray(startPos, this._pos));
      const num = parseFloat(numStr);
      if (float) {
        return new Token3(Type3.float, num, this._pos - startPos);
      }
      if (this.options.allowBigInt !== true || Number.isSafeInteger(num)) {
        return new Token3(num >= 0 ? Type3.uint : Type3.negint, num, this._pos - startPos);
      }
      return new Token3(num >= 0 ? Type3.uint : Type3.negint, BigInt(numStr), this._pos - startPos);
    }
    /**
     * @returns {Token}
     */
    parseString() {
      if (this.ch() !== 34) {
        throw new Error(`${decodeErrPrefix3} unexpected character at position ${this._pos}; this shouldn't happen`);
      }
      this._pos++;
      for (let i = this._pos, l = 0; i < this.data.length && l < 65536; i++, l++) {
        const ch = this.data[i];
        if (ch === 92 || ch < 32 || ch >= 128) {
          break;
        }
        if (ch === 34) {
          const str = String.fromCharCode.apply(null, this.data.subarray(this._pos, i));
          this._pos = i + 1;
          return new Token3(Type3.string, str, l);
        }
      }
      const startPos = this._pos;
      const chars = [];
      const readu4 = () => {
        if (this._pos + 4 >= this.data.length) {
          throw new Error(`${decodeErrPrefix3} unexpected end of unicode escape sequence at position ${this._pos}`);
        }
        let u4 = 0;
        for (let i = 0; i < 4; i++) {
          let ch = this.ch();
          if (ch >= 48 && ch <= 57) {
            ch -= 48;
          } else if (ch >= 97 && ch <= 102) {
            ch = ch - 97 + 10;
          } else if (ch >= 65 && ch <= 70) {
            ch = ch - 65 + 10;
          } else {
            throw new Error(`${decodeErrPrefix3} unexpected unicode escape character at position ${this._pos}`);
          }
          u4 = u4 * 16 + ch;
          this._pos++;
        }
        return u4;
      };
      const readUtf8Char = () => {
        const firstByte = this.ch();
        let codePoint = null;
        let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
        if (this._pos + bytesPerSequence > this.data.length) {
          throw new Error(`${decodeErrPrefix3} unexpected unicode sequence at position ${this._pos}`);
        }
        let secondByte, thirdByte, fourthByte, tempCodePoint;
        switch (bytesPerSequence) {
          // this case is dealt with by the caller function
          case 1:
            if (firstByte < 128) {
              codePoint = firstByte;
            }
            break;
          case 2:
            secondByte = this.data[this._pos + 1];
            if ((secondByte & 192) === 128) {
              tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
              if (tempCodePoint > 127) {
                codePoint = tempCodePoint;
              }
            }
            break;
          case 3:
            secondByte = this.data[this._pos + 1];
            thirdByte = this.data[this._pos + 2];
            if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
              tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
              if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                codePoint = tempCodePoint;
              }
            }
            break;
          case 4:
            secondByte = this.data[this._pos + 1];
            thirdByte = this.data[this._pos + 2];
            fourthByte = this.data[this._pos + 3];
            if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
              tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
              if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                codePoint = tempCodePoint;
              }
            }
        }
        if (codePoint === null) {
          codePoint = 65533;
          bytesPerSequence = 1;
        } else if (codePoint > 65535) {
          codePoint -= 65536;
          chars.push(codePoint >>> 10 & 1023 | 55296);
          codePoint = 56320 | codePoint & 1023;
        }
        chars.push(codePoint);
        this._pos += bytesPerSequence;
      };
      while (!this.done()) {
        const ch = this.ch();
        let ch1;
        switch (ch) {
          case 92:
            this._pos++;
            if (this.done()) {
              throw new Error(`${decodeErrPrefix3} unexpected string termination at position ${this._pos}`);
            }
            ch1 = this.ch();
            this._pos++;
            switch (ch1) {
              case 34:
              // '"'
              case 39:
              // '\''
              case 92:
              // '\'
              case 47:
                chars.push(ch1);
                break;
              case 98:
                chars.push(8);
                break;
              case 116:
                chars.push(9);
                break;
              case 110:
                chars.push(10);
                break;
              case 102:
                chars.push(12);
                break;
              case 114:
                chars.push(13);
                break;
              case 117:
                chars.push(readu4());
                break;
              default:
                throw new Error(`${decodeErrPrefix3} unexpected string escape character at position ${this._pos}`);
            }
            break;
          case 34:
            this._pos++;
            return new Token3(Type3.string, decodeCodePointsArray(chars), this._pos - startPos);
          default:
            if (ch < 32) {
              throw new Error(`${decodeErrPrefix3} invalid control character at position ${this._pos}`);
            } else if (ch < 128) {
              chars.push(ch);
              this._pos++;
            } else {
              readUtf8Char();
            }
        }
      }
      throw new Error(`${decodeErrPrefix3} unexpected end of string at position ${this._pos}`);
    }
    /**
     * @returns {Token}
     */
    parseValue() {
      switch (this.ch()) {
        case 123:
          this.modeStack.push("obj-start");
          this._pos++;
          return new Token3(Type3.map, Infinity, 1);
        case 91:
          this.modeStack.push("array-start");
          this._pos++;
          return new Token3(Type3.array, Infinity, 1);
        case 34: {
          return this.parseString();
        }
        case 110:
          this.expect([110, 117, 108, 108]);
          return new Token3(Type3.null, null, 4);
        case 102:
          this.expect([102, 97, 108, 115, 101]);
          return new Token3(Type3.false, false, 5);
        case 116:
          this.expect([116, 114, 117, 101]);
          return new Token3(Type3.true, true, 4);
        case 45:
        // '-'
        case 48:
        // '0'
        case 49:
        // '1'
        case 50:
        // '2'
        case 51:
        // '3'
        case 52:
        // '4'
        case 53:
        // '5'
        case 54:
        // '6'
        case 55:
        // '7'
        case 56:
        // '8'
        case 57:
          return this.parseNumber();
        default:
          throw new Error(`${decodeErrPrefix3} unexpected character at position ${this._pos}`);
      }
    }
    /**
     * @returns {Token}
     */
    next() {
      this.skipWhitespace();
      switch (this.currentMode()) {
        case "value":
          this.modeStack.pop();
          return this.parseValue();
        case "array-value": {
          this.modeStack.pop();
          if (this.ch() === 93) {
            this._pos++;
            this.skipWhitespace();
            return new Token3(Type3.break, void 0, 1);
          }
          if (this.ch() !== 44) {
            throw new Error(`${decodeErrPrefix3} unexpected character at position ${this._pos}, was expecting array delimiter but found '${String.fromCharCode(this.ch())}'`);
          }
          this._pos++;
          this.modeStack.push("array-value");
          this.skipWhitespace();
          return this.parseValue();
        }
        case "array-start": {
          this.modeStack.pop();
          if (this.ch() === 93) {
            this._pos++;
            this.skipWhitespace();
            return new Token3(Type3.break, void 0, 1);
          }
          this.modeStack.push("array-value");
          this.skipWhitespace();
          return this.parseValue();
        }
        // @ts-ignore
        case "obj-key":
          if (this.ch() === 125) {
            this.modeStack.pop();
            this._pos++;
            this.skipWhitespace();
            return new Token3(Type3.break, void 0, 1);
          }
          if (this.ch() !== 44) {
            throw new Error(`${decodeErrPrefix3} unexpected character at position ${this._pos}, was expecting object delimiter but found '${String.fromCharCode(this.ch())}'`);
          }
          this._pos++;
          this.skipWhitespace();
        case "obj-start": {
          this.modeStack.pop();
          if (this.ch() === 125) {
            this._pos++;
            this.skipWhitespace();
            return new Token3(Type3.break, void 0, 1);
          }
          const token = this.parseString();
          this.skipWhitespace();
          if (this.ch() !== 58) {
            throw new Error(`${decodeErrPrefix3} unexpected character at position ${this._pos}, was expecting key/value delimiter ':' but found '${String.fromCharCode(this.ch())}'`);
          }
          this._pos++;
          this.modeStack.push("obj-value");
          return token;
        }
        case "obj-value": {
          this.modeStack.pop();
          this.modeStack.push("obj-key");
          this.skipWhitespace();
          return this.parseValue();
        }
        default:
          throw new Error(`${decodeErrPrefix3} unexpected parse state at position ${this._pos}; this shouldn't happen`);
      }
    }
  };
  function decode9(data, options) {
    options = Object.assign({ tokenizer: new Tokenizer(data, options) }, options);
    return decode8(data, options);
  }

  // node_modules/multiformats/dist/src/hashes/hasher.js
  var DEFAULT_MIN_DIGEST_LENGTH = 20;
  function from2({ name: name3, code: code8, encode: encode17, minDigestLength, maxDigestLength }) {
    return new Hasher(name3, code8, encode17, minDigestLength, maxDigestLength);
  }
  var Hasher = class {
    name;
    code;
    encode;
    minDigestLength;
    maxDigestLength;
    constructor(name3, code8, encode17, minDigestLength, maxDigestLength) {
      this.name = name3;
      this.code = code8;
      this.encode = encode17;
      this.minDigestLength = minDigestLength ?? DEFAULT_MIN_DIGEST_LENGTH;
      this.maxDigestLength = maxDigestLength;
    }
    digest(input, options) {
      if (options?.truncate != null) {
        if (options.truncate < this.minDigestLength) {
          throw new Error(`Invalid truncate option, must be greater than or equal to ${this.minDigestLength}`);
        }
        if (this.maxDigestLength != null && options.truncate > this.maxDigestLength) {
          throw new Error(`Invalid truncate option, must be less than or equal to ${this.maxDigestLength}`);
        }
      }
      if (input instanceof Uint8Array) {
        const result = this.encode(input);
        if (result instanceof Uint8Array) {
          return createDigest(result, this.code, options?.truncate);
        }
        return result.then((digest3) => createDigest(digest3, this.code, options?.truncate));
      } else {
        throw Error("Unknown type, must be binary type");
      }
    }
  };
  function createDigest(digest3, code8, truncate) {
    if (truncate != null && truncate !== digest3.byteLength) {
      if (truncate > digest3.byteLength) {
        throw new Error(`Invalid truncate option, must be less than or equal to ${digest3.byteLength}`);
      }
      digest3 = digest3.subarray(0, truncate);
    }
    return create(code8, digest3);
  }

  // node_modules/multiformats/dist/src/bases/base64.js
  var base64_exports = {};
  __export(base64_exports, {
    base64: () => base64,
    base64pad: () => base64pad,
    base64url: () => base64url,
    base64urlpad: () => base64urlpad
  });
  var base64 = rfc4648({
    prefix: "m",
    name: "base64",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    bitsPerChar: 6
  });
  var base64pad = rfc4648({
    prefix: "M",
    name: "base64pad",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    bitsPerChar: 6
  });
  var base64url = rfc4648({
    prefix: "u",
    name: "base64url",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
    bitsPerChar: 6
  });
  var base64urlpad = rfc4648({
    prefix: "U",
    name: "base64urlpad",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=",
    bitsPerChar: 6
  });

  // node_modules/@ipld/dag-json/src/index.js
  function toByteView2(buf) {
    if (buf instanceof ArrayBuffer) {
      return new Uint8Array(buf, 0, buf.byteLength);
    }
    return buf;
  }
  var DagJsonTokenizer = class extends Tokenizer {
    /**
     * @param {Uint8Array} data
     * @param {object} [options]
     */
    constructor(data, options) {
      super(data, options);
      this.tokenBuffer = [];
    }
    /**
     * @returns {boolean}
     */
    done() {
      return this.tokenBuffer.length === 0 && super.done();
    }
    /**
     * @returns {Token}
     */
    _next() {
      if (this.tokenBuffer.length > 0) {
        return this.tokenBuffer.pop();
      }
      return super.next();
    }
    /**
     * Implements rules outlined in https://github.com/ipld/specs/pull/356
     *
     * @returns {Token}
     */
    next() {
      const token = this._next();
      if (Type3.equals(token.type, Type3.map)) {
        const keyToken = this._next();
        if (Type3.equals(keyToken.type, Type3.string) && keyToken.value === "/") {
          const valueToken = this._next();
          if (Type3.equals(valueToken.type, Type3.string)) {
            const breakToken = this._next();
            if (!Type3.equals(breakToken.type, Type3.break)) {
              throw new Error("Invalid encoded CID form");
            }
            this.tokenBuffer.push(valueToken);
            return new Token3(Type3.tag, 42, 0);
          }
          if (Type3.equals(valueToken.type, Type3.map)) {
            const innerKeyToken = this._next();
            if (Type3.equals(innerKeyToken.type, Type3.string) && innerKeyToken.value === "bytes") {
              const innerValueToken = this._next();
              if (Type3.equals(innerValueToken.type, Type3.string)) {
                for (let i = 0; i < 2; i++) {
                  const breakToken = this._next();
                  if (!Type3.equals(breakToken.type, Type3.break)) {
                    throw new Error("Invalid encoded Bytes form");
                  }
                }
                const bytes = base64.decode(`m${innerValueToken.value}`);
                return new Token3(Type3.bytes, bytes, innerValueToken.value.length);
              }
              this.tokenBuffer.push(innerValueToken);
            }
            this.tokenBuffer.push(innerKeyToken);
          }
          this.tokenBuffer.push(valueToken);
        }
        this.tokenBuffer.push(keyToken);
      }
      return token;
    }
  };
  var decodeOptions2 = {
    allowIndefinite: false,
    allowUndefined: false,
    allowNaN: false,
    allowInfinity: false,
    allowBigInt: true,
    // this will lead to BigInt for ints outside of
    // safe-integer range, which may surprise users
    strict: true,
    useMaps: false,
    rejectDuplicateMapKeys: true,
    /** @type {{ [tagNumber: number]: import('cborg').TagDecoder }} */
    tags: {
      // TAG(42)STRING("bafy...") from the tokenizer, decode to get the string
      42: (decode25) => CID.parse(
        /** @type {string} */
        decode25()
      )
    }
  };
  var code2 = 297;
  var decode10 = (data) => {
    const buf = toByteView2(data);
    const options = Object.assign(decodeOptions2, { tokenizer: new DagJsonTokenizer(buf, decodeOptions2) });
    return decode9(buf, options);
  };
  var utf8Decoder = new TextDecoder();
  var utf8Encoder = new TextEncoder();

  // node_modules/@ipld/dag-pb/node_modules/multiformats/dist/src/bytes.js
  var empty2 = new Uint8Array(0);
  function equals3(aa, bb) {
    if (aa === bb) {
      return true;
    }
    if (aa.byteLength !== bb.byteLength) {
      return false;
    }
    for (let ii = 0; ii < aa.byteLength; ii++) {
      if (aa[ii] !== bb[ii]) {
        return false;
      }
    }
    return true;
  }
  function coerce2(o) {
    if (o instanceof Uint8Array && o.constructor.name === "Uint8Array") {
      return toArrayBufferBackedArray(o);
    }
    if (o instanceof ArrayBuffer) {
      return new Uint8Array(o);
    }
    if (ArrayBuffer.isView(o)) {
      return toArrayBufferBackedArray(new Uint8Array(o.buffer, o.byteOffset, o.byteLength));
    }
    throw new Error("Unknown type, must be binary type");
  }
  function isByteArrayWithArrayBuffer(b) {
    return b?.buffer instanceof ArrayBuffer;
  }
  function toArrayBufferBackedArray(b) {
    if (isByteArrayWithArrayBuffer(b)) {
      return b;
    }
    return b.slice();
  }

  // node_modules/@ipld/dag-pb/node_modules/multiformats/dist/src/vendor/base-x.js
  function base2(ALPHABET, name3, caseInsensitive) {
    if (ALPHABET.length >= 255) {
      throw new TypeError("Alphabet too long");
    }
    var BASE_MAP = new Uint8Array(256);
    for (var j = 0; j < BASE_MAP.length; j++) {
      BASE_MAP[j] = 255;
    }
    for (var i = 0; i < ALPHABET.length; i++) {
      var x = ALPHABET.charAt(i);
      var xc = x.charCodeAt(0);
      if (BASE_MAP[xc] !== 255) {
        throw new TypeError(x + " is ambiguous");
      }
      BASE_MAP[xc] = i;
      if (caseInsensitive) {
        var xl = x.toLowerCase().charCodeAt(0);
        var xu = x.toUpperCase().charCodeAt(0);
        if (xl !== xc) {
          BASE_MAP[xl] = i;
        }
        if (xu !== xc) {
          BASE_MAP[xu] = i;
        }
      }
    }
    var BASE = ALPHABET.length;
    var LEADER = ALPHABET.charAt(0);
    var FACTOR = Math.log(BASE) / Math.log(256);
    var iFACTOR = Math.log(256) / Math.log(BASE);
    function encode17(source) {
      if (source instanceof Uint8Array)
        ;
      else if (ArrayBuffer.isView(source)) {
        source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
      } else if (Array.isArray(source)) {
        source = Uint8Array.from(source);
      }
      if (!(source instanceof Uint8Array)) {
        throw new TypeError("Expected Uint8Array");
      }
      if (source.length === 0) {
        return "";
      }
      var zeroes = 0;
      var length6 = 0;
      var pbegin = 0;
      var pend = source.length;
      while (pbegin !== pend && source[pbegin] === 0) {
        pbegin++;
        zeroes++;
      }
      var size = (pend - pbegin) * iFACTOR + 1 >>> 0;
      var b58 = new Uint8Array(size);
      while (pbegin !== pend) {
        var carry = source[pbegin];
        var i2 = 0;
        for (var it1 = size - 1; (carry !== 0 || i2 < length6) && it1 !== -1; it1--, i2++) {
          carry += 256 * b58[it1] >>> 0;
          b58[it1] = carry % BASE >>> 0;
          carry = carry / BASE >>> 0;
        }
        if (carry !== 0) {
          throw new Error("Non-zero carry");
        }
        length6 = i2;
        pbegin++;
      }
      var it2 = size - length6;
      while (it2 !== size && b58[it2] === 0) {
        it2++;
      }
      var str = LEADER.repeat(zeroes);
      for (; it2 < size; ++it2) {
        str += ALPHABET.charAt(b58[it2]);
      }
      return str;
    }
    function decodeUnsafe(source) {
      if (typeof source !== "string") {
        throw new TypeError("Expected String");
      }
      if (source.length === 0) {
        return new Uint8Array();
      }
      var psz = 0;
      if (source[psz] === " ") {
        return;
      }
      var zeroes = 0;
      var length6 = 0;
      while (source[psz] === LEADER) {
        zeroes++;
        psz++;
      }
      var size = (source.length - psz) * FACTOR + 1 >>> 0;
      var b256 = new Uint8Array(size);
      while (source[psz]) {
        var carry = BASE_MAP[source.charCodeAt(psz)];
        if (carry === 255) {
          return;
        }
        var i2 = 0;
        for (var it3 = size - 1; (carry !== 0 || i2 < length6) && it3 !== -1; it3--, i2++) {
          carry += BASE * b256[it3] >>> 0;
          b256[it3] = carry % 256 >>> 0;
          carry = carry / 256 >>> 0;
        }
        if (carry !== 0) {
          throw new Error("Non-zero carry");
        }
        length6 = i2;
        psz++;
      }
      if (source[psz] === " ") {
        return;
      }
      var it4 = size - length6;
      while (it4 !== size && b256[it4] === 0) {
        it4++;
      }
      var vch = new Uint8Array(zeroes + (size - it4));
      var j2 = zeroes;
      while (it4 !== size) {
        vch[j2++] = b256[it4++];
      }
      return vch;
    }
    function decode25(string3) {
      var buffer4 = decodeUnsafe(string3);
      if (buffer4) {
        return buffer4;
      }
      throw new Error(`Non-${name3} character`);
    }
    return {
      encode: encode17,
      decodeUnsafe,
      decode: decode25
    };
  }
  var src2 = base2;
  var _brrp__multiformats_scope_baseX2 = src2;
  var base_x_default2 = _brrp__multiformats_scope_baseX2;

  // node_modules/@ipld/dag-pb/node_modules/multiformats/dist/src/bases/base.js
  var Encoder2 = class {
    name;
    prefix;
    baseEncode;
    constructor(name3, prefix, baseEncode) {
      this.name = name3;
      this.prefix = prefix;
      this.baseEncode = baseEncode;
    }
    encode(bytes) {
      if (bytes instanceof Uint8Array) {
        return `${this.prefix}${this.baseEncode(bytes)}`;
      } else {
        throw Error("Unknown type, must be binary type");
      }
    }
  };
  var Decoder2 = class {
    name;
    prefix;
    baseDecode;
    prefixCodePoint;
    constructor(name3, prefix, baseDecode) {
      this.name = name3;
      this.prefix = prefix;
      const prefixCodePoint = prefix.codePointAt(0);
      if (prefixCodePoint === void 0) {
        throw new Error("Invalid prefix character");
      }
      this.prefixCodePoint = prefixCodePoint;
      this.baseDecode = baseDecode;
    }
    decode(text) {
      if (typeof text === "string") {
        if (text.codePointAt(0) !== this.prefixCodePoint) {
          throw Error(`Unable to decode multibase string ${JSON.stringify(text)}, ${this.name} decoder only supports inputs prefixed with ${this.prefix}`);
        }
        return this.baseDecode(text.slice(this.prefix.length));
      } else {
        throw Error("Can only multibase decode strings");
      }
    }
    or(decoder) {
      return or2(this, decoder);
    }
  };
  var ComposedDecoder2 = class {
    decoders;
    constructor(decoders) {
      this.decoders = decoders;
    }
    or(decoder) {
      return or2(this, decoder);
    }
    decode(input) {
      const prefix = input[0];
      const decoder = this.decoders[prefix];
      if (decoder != null) {
        return decoder.decode(input);
      } else {
        throw RangeError(`Unable to decode multibase string ${JSON.stringify(input)}, only inputs prefixed with ${Object.keys(this.decoders)} are supported`);
      }
    }
  };
  function or2(left, right) {
    return new ComposedDecoder2({
      ...left.decoders ?? { [left.prefix]: left },
      ...right.decoders ?? { [right.prefix]: right }
    });
  }
  var Codec2 = class {
    name;
    prefix;
    baseEncode;
    baseDecode;
    encoder;
    decoder;
    constructor(name3, prefix, baseEncode, baseDecode) {
      this.name = name3;
      this.prefix = prefix;
      this.baseEncode = baseEncode;
      this.baseDecode = baseDecode;
      this.encoder = new Encoder2(name3, prefix, baseEncode);
      this.decoder = new Decoder2(name3, prefix, baseDecode);
    }
    encode(input) {
      return this.encoder.encode(input);
    }
    decode(input) {
      return this.decoder.decode(input);
    }
  };
  function from3({ name: name3, prefix, encode: encode17, decode: decode25 }) {
    return new Codec2(name3, prefix, encode17, decode25);
  }
  function baseX2({ name: name3, prefix, alphabet: alphabet3, caseInsensitive = false }) {
    const { encode: encode17, decode: decode25 } = base_x_default2(alphabet3, name3, caseInsensitive);
    return from3({
      prefix,
      name: name3,
      encode: encode17,
      decode: (text) => coerce2(decode25(text))
    });
  }
  function decode11(string3, alphabetIdx, bitsPerChar, name3) {
    let end = string3.length;
    while (string3[end - 1] === "=") {
      --end;
    }
    const out = new Uint8Array(end * bitsPerChar / 8 | 0);
    let bits = 0;
    let buffer4 = 0;
    let written = 0;
    for (let i = 0; i < end; ++i) {
      const value = alphabetIdx[string3[i]];
      if (value === void 0) {
        throw new SyntaxError(`Non-${name3} character`);
      }
      buffer4 = buffer4 << bitsPerChar | value;
      bits += bitsPerChar;
      if (bits >= 8) {
        bits -= 8;
        out[written++] = 255 & buffer4 >> bits;
      }
    }
    if (bits >= bitsPerChar || (255 & buffer4 << 8 - bits) !== 0) {
      throw new SyntaxError("Unexpected end of data");
    }
    return out;
  }
  function encode8(data, alphabet3, bitsPerChar) {
    const pad = alphabet3[alphabet3.length - 1] === "=";
    const mask = (1 << bitsPerChar) - 1;
    let out = "";
    let bits = 0;
    let buffer4 = 0;
    for (let i = 0; i < data.length; ++i) {
      buffer4 = buffer4 << 8 | data[i];
      bits += 8;
      while (bits > bitsPerChar) {
        bits -= bitsPerChar;
        out += alphabet3[mask & buffer4 >> bits];
      }
    }
    if (bits !== 0) {
      out += alphabet3[mask & buffer4 << bitsPerChar - bits];
    }
    if (pad) {
      while ((out.length * bitsPerChar & 7) !== 0) {
        out += "=";
      }
    }
    return out;
  }
  function createAlphabetIdx2(alphabet3, caseInsensitive) {
    const alphabetIdx = {};
    for (let i = 0; i < alphabet3.length; ++i) {
      alphabetIdx[alphabet3[i]] = i;
      if (caseInsensitive) {
        const lower = alphabet3[i].toLowerCase();
        const upper = alphabet3[i].toUpperCase();
        if (lower !== alphabet3[i]) {
          alphabetIdx[lower] = i;
        }
        if (upper !== alphabet3[i]) {
          alphabetIdx[upper] = i;
        }
      }
    }
    return alphabetIdx;
  }
  function rfc46482({ name: name3, prefix, bitsPerChar, alphabet: alphabet3, caseInsensitive = false }) {
    const alphabetIdx = createAlphabetIdx2(alphabet3, caseInsensitive);
    return from3({
      prefix,
      name: name3,
      encode(input) {
        return encode8(input, alphabet3, bitsPerChar);
      },
      decode(input) {
        return decode11(input, alphabetIdx, bitsPerChar, name3);
      }
    });
  }

  // node_modules/@ipld/dag-pb/node_modules/multiformats/dist/src/bases/base32.js
  var base322 = rfc46482({
    prefix: "b",
    name: "base32",
    alphabet: "abcdefghijklmnopqrstuvwxyz234567",
    bitsPerChar: 5,
    caseInsensitive: true
  });
  var base32upper2 = rfc46482({
    prefix: "B",
    name: "base32upper",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
    bitsPerChar: 5,
    caseInsensitive: true
  });
  var base32pad2 = rfc46482({
    prefix: "c",
    name: "base32pad",
    alphabet: "abcdefghijklmnopqrstuvwxyz234567=",
    bitsPerChar: 5,
    caseInsensitive: true
  });
  var base32padupper2 = rfc46482({
    prefix: "C",
    name: "base32padupper",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567=",
    bitsPerChar: 5,
    caseInsensitive: true
  });
  var base32hex2 = rfc46482({
    prefix: "v",
    name: "base32hex",
    alphabet: "0123456789abcdefghijklmnopqrstuv",
    bitsPerChar: 5,
    caseInsensitive: true
  });
  var base32hexupper2 = rfc46482({
    prefix: "V",
    name: "base32hexupper",
    alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
    bitsPerChar: 5,
    caseInsensitive: true
  });
  var base32hexpad2 = rfc46482({
    prefix: "t",
    name: "base32hexpad",
    alphabet: "0123456789abcdefghijklmnopqrstuv=",
    bitsPerChar: 5,
    caseInsensitive: true
  });
  var base32hexpadupper2 = rfc46482({
    prefix: "T",
    name: "base32hexpadupper",
    alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUV=",
    bitsPerChar: 5,
    caseInsensitive: true
  });
  var base32z2 = rfc46482({
    prefix: "h",
    name: "base32z",
    alphabet: "ybndrfg8ejkmcpqxot1uwisza345h769",
    bitsPerChar: 5
  });

  // node_modules/@ipld/dag-pb/node_modules/multiformats/dist/src/bases/base36.js
  var base362 = baseX2({
    prefix: "k",
    name: "base36",
    alphabet: "0123456789abcdefghijklmnopqrstuvwxyz",
    caseInsensitive: true
  });
  var base36upper2 = baseX2({
    prefix: "K",
    name: "base36upper",
    alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    caseInsensitive: true
  });

  // node_modules/@ipld/dag-pb/node_modules/multiformats/dist/src/bases/base58.js
  var base58btc2 = baseX2({
    name: "base58btc",
    prefix: "z",
    alphabet: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
  });
  var base58flickr2 = baseX2({
    name: "base58flickr",
    prefix: "Z",
    alphabet: "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"
  });

  // node_modules/@ipld/dag-pb/node_modules/multiformats/dist/src/vendor/varint.js
  var encode_12 = encode9;
  var MSB2 = 128;
  var REST2 = 127;
  var MSBALL2 = ~REST2;
  var INT2 = Math.pow(2, 31);
  function encode9(num, out, offset) {
    out = out || [];
    offset = offset || 0;
    var oldOffset = offset;
    while (num >= INT2) {
      out[offset++] = num & 255 | MSB2;
      num /= 128;
    }
    while (num & MSBALL2) {
      out[offset++] = num & 255 | MSB2;
      num >>>= 7;
    }
    out[offset] = num | 0;
    encode9.bytes = offset - oldOffset + 1;
    return out;
  }
  var decode12 = read2;
  var MSB$12 = 128;
  var REST$12 = 127;
  function read2(buf, offset) {
    var res = 0, offset = offset || 0, shift = 0, counter = offset, b, l = buf.length;
    do {
      if (counter >= l) {
        read2.bytes = 0;
        throw new RangeError("Could not decode varint");
      }
      b = buf[counter++];
      res += shift < 28 ? (b & REST$12) << shift : (b & REST$12) * Math.pow(2, shift);
      shift += 7;
    } while (b >= MSB$12);
    read2.bytes = counter - offset;
    return res;
  }
  var N12 = Math.pow(2, 7);
  var N22 = Math.pow(2, 14);
  var N32 = Math.pow(2, 21);
  var N42 = Math.pow(2, 28);
  var N52 = Math.pow(2, 35);
  var N62 = Math.pow(2, 42);
  var N72 = Math.pow(2, 49);
  var N82 = Math.pow(2, 56);
  var N92 = Math.pow(2, 63);
  var length2 = function(value) {
    return value < N12 ? 1 : value < N22 ? 2 : value < N32 ? 3 : value < N42 ? 4 : value < N52 ? 5 : value < N62 ? 6 : value < N72 ? 7 : value < N82 ? 8 : value < N92 ? 9 : 10;
  };
  var varint5 = {
    encode: encode_12,
    decode: decode12,
    encodingLength: length2
  };
  var _brrp_varint2 = varint5;
  var varint_default2 = _brrp_varint2;

  // node_modules/@ipld/dag-pb/node_modules/multiformats/dist/src/varint.js
  function decode13(data, offset = 0) {
    const code8 = varint_default2.decode(data, offset);
    const length6 = varint_default2.decode.bytes;
    if (length6 > 9) {
      throw new RangeError("Invalid varint: too long");
    }
    if (length6 > 1 && data[offset + length6 - 1] === 0) {
      throw new RangeError("Invalid varint: not minimally encoded");
    }
    return [code8, length6];
  }
  function encodeTo2(int, target, offset = 0) {
    varint_default2.encode(int, target, offset);
    return target;
  }
  function encodingLength2(int) {
    return varint_default2.encodingLength(int);
  }

  // node_modules/@ipld/dag-pb/node_modules/multiformats/dist/src/hashes/digest.js
  function create3(code8, digest3) {
    const size = digest3.byteLength;
    const sizeOffset = encodingLength2(code8);
    const digestOffset = sizeOffset + encodingLength2(size);
    const bytes = new Uint8Array(digestOffset + size);
    encodeTo2(code8, bytes, 0);
    encodeTo2(size, bytes, sizeOffset);
    bytes.set(digest3, digestOffset);
    return new Digest2(code8, size, digest3, bytes);
  }
  function decode14(multihash) {
    const bytes = coerce2(multihash);
    const [code8, sizeOffset] = decode13(bytes);
    const [size, digestOffset] = decode13(bytes.subarray(sizeOffset));
    const digest3 = bytes.subarray(sizeOffset + digestOffset);
    if (digest3.byteLength !== size) {
      throw new Error("Incorrect length");
    }
    return new Digest2(code8, size, digest3, bytes);
  }
  function equals4(a, b) {
    if (a === b) {
      return true;
    } else {
      const data = b;
      return a.code === data.code && a.size === data.size && data.bytes instanceof Uint8Array && equals3(a.bytes, data.bytes);
    }
  }
  var Digest2 = class {
    code;
    size;
    digest;
    bytes;
    /**
     * Creates a multihash digest.
     */
    constructor(code8, size, digest3, bytes) {
      this.code = code8;
      this.size = size;
      this.digest = toArrayBufferBackedArray(digest3);
      this.bytes = toArrayBufferBackedArray(bytes);
    }
  };

  // node_modules/@ipld/dag-pb/node_modules/multiformats/dist/src/cid.js
  function format2(link, base4) {
    const { bytes, version } = link;
    switch (version) {
      case 0:
        return toStringV02(bytes, baseCache2(link), base4 ?? base58btc2.encoder);
      default:
        return toStringV12(bytes, baseCache2(link), base4 ?? base322.encoder);
    }
  }
  var cache2 = /* @__PURE__ */ new WeakMap();
  function baseCache2(cid) {
    const baseCache4 = cache2.get(cid);
    if (baseCache4 == null) {
      const baseCache5 = /* @__PURE__ */ new Map();
      cache2.set(cid, baseCache5);
      return baseCache5;
    }
    return baseCache4;
  }
  var CID2 = class _CID {
    code;
    version;
    multihash;
    bytes;
    "/";
    /**
     * @param version - Version of the CID
     * @param code - Code of the codec content is encoded in, see https://github.com/multiformats/multicodec/blob/master/table.csv
     * @param multihash - (Multi)hash of the of the content.
     */
    constructor(version, code8, multihash, bytes) {
      this.code = code8;
      this.version = version;
      this.multihash = multihash;
      this.bytes = toArrayBufferBackedArray(bytes);
      this["/"] = this.bytes;
    }
    /**
     * Signalling `cid.asCID === cid` has been replaced with `cid['/'] === cid.bytes`
     * please either use `CID.asCID(cid)` or switch to new signalling mechanism
     *
     * @deprecated
     */
    get asCID() {
      return this;
    }
    // ArrayBufferView
    get byteOffset() {
      return this.bytes.byteOffset;
    }
    // ArrayBufferView
    get byteLength() {
      return this.bytes.byteLength;
    }
    toV0() {
      switch (this.version) {
        case 0: {
          return this;
        }
        case 1: {
          const { code: code8, multihash } = this;
          if (code8 !== DAG_PB_CODE2) {
            throw new Error("Cannot convert a non dag-pb CID to CIDv0");
          }
          if (multihash.code !== SHA_256_CODE2) {
            throw new Error("Cannot convert non sha2-256 multihash CID to CIDv0");
          }
          return _CID.createV0(multihash);
        }
        default: {
          throw Error(`Can not convert CID version ${this.version} to version 0. This is a bug please report`);
        }
      }
    }
    toV1() {
      switch (this.version) {
        case 0: {
          const { code: code8, digest: digest3 } = this.multihash;
          const multihash = create3(code8, digest3);
          return _CID.createV1(this.code, multihash);
        }
        case 1: {
          return this;
        }
        default: {
          throw Error(`Can not convert CID version ${this.version} to version 1. This is a bug please report`);
        }
      }
    }
    equals(other) {
      return _CID.equals(this, other);
    }
    static equals(self, other) {
      const unknown = other;
      return unknown != null && self.code === unknown.code && self.version === unknown.version && equals4(self.multihash, unknown.multihash);
    }
    toString(base4) {
      return format2(this, base4);
    }
    toJSON() {
      return { "/": format2(this) };
    }
    link() {
      return this;
    }
    [Symbol.toStringTag] = "CID";
    // Legacy
    [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
      return `CID(${this.toString()})`;
    }
    /**
     * Takes any input `value` and returns a `CID` instance if it was
     * a `CID` otherwise returns `null`. If `value` is instanceof `CID`
     * it will return value back. If `value` is not instance of this CID
     * class, but is compatible CID it will return new instance of this
     * `CID` class. Otherwise returns null.
     *
     * This allows two different incompatible versions of CID library to
     * co-exist and interop as long as binary interface is compatible.
     */
    static asCID(input) {
      if (input == null) {
        return null;
      }
      const value = input;
      if (value instanceof _CID) {
        return value;
      } else if (value["/"] != null && value["/"] === value.bytes || value.asCID === value) {
        const { version, code: code8, multihash, bytes } = value;
        return new _CID(version, code8, multihash, bytes ?? encodeCID2(version, code8, multihash.bytes));
      } else if (value[cidSymbol2] === true) {
        const { version, multihash, code: code8 } = value;
        const digest3 = decode14(multihash);
        return _CID.create(version, code8, digest3);
      } else {
        return null;
      }
    }
    /**
     * @param version - Version of the CID
     * @param code - Code of the codec content is encoded in, see https://github.com/multiformats/multicodec/blob/master/table.csv
     * @param digest - (Multi)hash of the of the content.
     */
    static create(version, code8, digest3) {
      if (typeof code8 !== "number") {
        throw new Error("String codecs are no longer supported");
      }
      if (!(digest3.bytes instanceof Uint8Array)) {
        throw new Error("Invalid digest");
      }
      switch (version) {
        case 0: {
          if (code8 !== DAG_PB_CODE2) {
            throw new Error(`Version 0 CID must use dag-pb (code: ${DAG_PB_CODE2}) block encoding`);
          } else {
            return new _CID(version, code8, digest3, digest3.bytes);
          }
        }
        case 1: {
          const bytes = encodeCID2(version, code8, digest3.bytes);
          return new _CID(version, code8, digest3, bytes);
        }
        default: {
          throw new Error("Invalid version");
        }
      }
    }
    /**
     * Simplified version of `create` for CIDv0.
     */
    static createV0(digest3) {
      return _CID.create(0, DAG_PB_CODE2, digest3);
    }
    /**
     * Simplified version of `create` for CIDv1.
     *
     * @param code - Content encoding format code.
     * @param digest - Multihash of the content.
     */
    static createV1(code8, digest3) {
      return _CID.create(1, code8, digest3);
    }
    /**
     * Decoded a CID from its binary representation. The byte array must contain
     * only the CID with no additional bytes.
     *
     * An error will be thrown if the bytes provided do not contain a valid
     * binary representation of a CID.
     */
    static decode(bytes) {
      const [cid, remainder] = _CID.decodeFirst(bytes);
      if (remainder.length !== 0) {
        throw new Error("Incorrect length");
      }
      return cid;
    }
    /**
     * Decoded a CID from its binary representation at the beginning of a byte
     * array.
     *
     * Returns an array with the first element containing the CID and the second
     * element containing the remainder of the original byte array. The remainder
     * will be a zero-length byte array if the provided bytes only contained a
     * binary CID representation.
     */
    static decodeFirst(bytes) {
      const specs = _CID.inspectBytes(bytes);
      const prefixSize = specs.size - specs.multihashSize;
      const multihashBytes = coerce2(bytes.subarray(prefixSize, prefixSize + specs.multihashSize));
      if (multihashBytes.byteLength !== specs.multihashSize) {
        throw new Error("Incorrect length");
      }
      const digestBytes = multihashBytes.subarray(specs.multihashSize - specs.digestSize);
      const digest3 = new Digest2(specs.multihashCode, specs.digestSize, digestBytes, multihashBytes);
      const cid = specs.version === 0 ? _CID.createV0(digest3) : _CID.createV1(specs.codec, digest3);
      return [cid, bytes.subarray(specs.size)];
    }
    /**
     * Inspect the initial bytes of a CID to determine its properties.
     *
     * Involves decoding up to 4 varints. Typically this will require only 4 to 6
     * bytes but for larger multicodec code values and larger multihash digest
     * lengths these varints can be quite large. It is recommended that at least
     * 10 bytes be made available in the `initialBytes` argument for a complete
     * inspection.
     */
    static inspectBytes(initialBytes) {
      let offset = 0;
      const next = () => {
        const [i, length6] = decode13(initialBytes.subarray(offset));
        offset += length6;
        return i;
      };
      let version = next();
      let codec = DAG_PB_CODE2;
      if (version === 18) {
        version = 0;
        offset = 0;
      } else {
        codec = next();
      }
      if (version !== 0 && version !== 1) {
        throw new RangeError(`Invalid CID version ${version}`);
      }
      const prefixSize = offset;
      const multihashCode = next();
      const digestSize = next();
      const size = offset + digestSize;
      const multihashSize = size - prefixSize;
      return { version, codec, multihashCode, digestSize, multihashSize, size };
    }
    /**
     * Takes cid in a string representation and creates an instance. If `base`
     * decoder is not provided will use a default from the configuration. It will
     * throw an error if encoding of the CID is not compatible with supplied (or
     * a default decoder).
     */
    static parse(source, base4) {
      const [prefix, bytes] = parseCIDtoBytes2(source, base4);
      const cid = _CID.decode(bytes);
      if (cid.version === 0 && source[0] !== "Q") {
        throw Error("Version 0 CID string must not include multibase prefix");
      }
      baseCache2(cid).set(prefix, source);
      return cid;
    }
  };
  function parseCIDtoBytes2(source, base4) {
    switch (source[0]) {
      // CIDv0 is parsed differently
      case "Q": {
        const decoder = base4 ?? base58btc2;
        return [
          base58btc2.prefix,
          decoder.decode(`${base58btc2.prefix}${source}`)
        ];
      }
      case base58btc2.prefix: {
        const decoder = base4 ?? base58btc2;
        return [base58btc2.prefix, decoder.decode(source)];
      }
      case base322.prefix: {
        const decoder = base4 ?? base322;
        return [base322.prefix, decoder.decode(source)];
      }
      case base362.prefix: {
        const decoder = base4 ?? base362;
        return [base362.prefix, decoder.decode(source)];
      }
      default: {
        if (base4 == null) {
          throw Error("To parse non base32, base36 or base58btc encoded CID multibase decoder must be provided");
        }
        return [source[0], base4.decode(source)];
      }
    }
  }
  function toStringV02(bytes, cache4, base4) {
    const { prefix } = base4;
    if (prefix !== base58btc2.prefix) {
      throw Error(`Cannot string encode V0 in ${base4.name} encoding`);
    }
    const cid = cache4.get(prefix);
    if (cid == null) {
      const cid2 = base4.encode(bytes).slice(1);
      cache4.set(prefix, cid2);
      return cid2;
    } else {
      return cid;
    }
  }
  function toStringV12(bytes, cache4, base4) {
    const { prefix } = base4;
    const cid = cache4.get(prefix);
    if (cid == null) {
      const cid2 = base4.encode(bytes);
      cache4.set(prefix, cid2);
      return cid2;
    } else {
      return cid;
    }
  }
  var DAG_PB_CODE2 = 112;
  var SHA_256_CODE2 = 18;
  function encodeCID2(version, code8, multihash) {
    const codeOffset = encodingLength2(version);
    const hashOffset = codeOffset + encodingLength2(code8);
    const bytes = new Uint8Array(hashOffset + multihash.byteLength);
    encodeTo2(version, bytes, 0);
    encodeTo2(code8, bytes, codeOffset);
    bytes.set(multihash, hashOffset);
    return bytes;
  }
  var cidSymbol2 = /* @__PURE__ */ Symbol.for("@ipld/js-cid/CID");

  // node_modules/@ipld/dag-pb/src/pb-decode.js
  var textDecoder4 = new TextDecoder();
  function decodeVarint2(bytes, offset) {
    let v = 0;
    for (let shift = 0; ; shift += 7) {
      if (shift >= 64) {
        throw new Error("protobuf: varint overflow");
      }
      if (offset >= bytes.length) {
        throw new Error("protobuf: unexpected end of data");
      }
      const b = bytes[offset++];
      v += shift < 28 ? (b & 127) << shift : (b & 127) * 2 ** shift;
      if (b < 128) {
        break;
      }
    }
    return [v, offset];
  }
  function decodeBytes(bytes, offset) {
    let byteLen;
    [byteLen, offset] = decodeVarint2(bytes, offset);
    const postOffset = offset + byteLen;
    if (byteLen < 0 || postOffset < 0) {
      throw new Error("protobuf: invalid length");
    }
    if (postOffset > bytes.length) {
      throw new Error("protobuf: unexpected end of data");
    }
    return [bytes.subarray(offset, postOffset), postOffset];
  }
  function decodeKey(bytes, index) {
    let wire;
    [wire, index] = decodeVarint2(bytes, index);
    return [wire & 7, wire >> 3, index];
  }
  function decodeLink(bytes) {
    const link = {};
    const l = bytes.length;
    let index = 0;
    while (index < l) {
      let wireType, fieldNum;
      [wireType, fieldNum, index] = decodeKey(bytes, index);
      if (fieldNum === 1) {
        if (link.Hash) {
          throw new Error("protobuf: (PBLink) duplicate Hash section");
        }
        if (wireType !== 2) {
          throw new Error(`protobuf: (PBLink) wrong wireType (${wireType}) for Hash`);
        }
        if (link.Name !== void 0) {
          throw new Error("protobuf: (PBLink) invalid order, found Name before Hash");
        }
        if (link.Tsize !== void 0) {
          throw new Error("protobuf: (PBLink) invalid order, found Tsize before Hash");
        }
        [link.Hash, index] = decodeBytes(bytes, index);
      } else if (fieldNum === 2) {
        if (link.Name !== void 0) {
          throw new Error("protobuf: (PBLink) duplicate Name section");
        }
        if (wireType !== 2) {
          throw new Error(`protobuf: (PBLink) wrong wireType (${wireType}) for Name`);
        }
        if (link.Tsize !== void 0) {
          throw new Error("protobuf: (PBLink) invalid order, found Tsize before Name");
        }
        let byts;
        [byts, index] = decodeBytes(bytes, index);
        link.Name = textDecoder4.decode(byts);
      } else if (fieldNum === 3) {
        if (link.Tsize !== void 0) {
          throw new Error("protobuf: (PBLink) duplicate Tsize section");
        }
        if (wireType !== 0) {
          throw new Error(`protobuf: (PBLink) wrong wireType (${wireType}) for Tsize`);
        }
        [link.Tsize, index] = decodeVarint2(bytes, index);
      } else {
        throw new Error(`protobuf: (PBLink) invalid fieldNumber, expected 1, 2 or 3, got ${fieldNum}`);
      }
    }
    if (index > l) {
      throw new Error("protobuf: (PBLink) unexpected end of data");
    }
    return link;
  }
  function decodeNode(bytes) {
    const l = bytes.length;
    let index = 0;
    let links = void 0;
    let linksBeforeData = false;
    let data = void 0;
    while (index < l) {
      let wireType, fieldNum;
      [wireType, fieldNum, index] = decodeKey(bytes, index);
      if (wireType !== 2) {
        throw new Error(`protobuf: (PBNode) invalid wireType, expected 2, got ${wireType}`);
      }
      if (fieldNum === 1) {
        if (data) {
          throw new Error("protobuf: (PBNode) duplicate Data section");
        }
        [data, index] = decodeBytes(bytes, index);
        if (links) {
          linksBeforeData = true;
        }
      } else if (fieldNum === 2) {
        if (linksBeforeData) {
          throw new Error("protobuf: (PBNode) duplicate Links section");
        } else if (!links) {
          links = [];
        }
        let byts;
        [byts, index] = decodeBytes(bytes, index);
        links.push(decodeLink(byts));
      } else {
        throw new Error(`protobuf: (PBNode) invalid fieldNumber, expected 1 or 2, got ${fieldNum}`);
      }
    }
    if (index > l) {
      throw new Error("protobuf: (PBNode) unexpected end of data");
    }
    const node = {};
    if (data) {
      node.Data = data;
    }
    node.Links = links || [];
    return node;
  }

  // node_modules/@ipld/dag-pb/src/pb-encode.js
  var textEncoder4 = new TextEncoder();
  var maxInt32 = 2 ** 32;
  var maxUInt32 = 2 ** 31;

  // node_modules/@ipld/dag-pb/src/util.js
  var textEncoder5 = new TextEncoder();
  function toByteView3(buf) {
    if (buf instanceof ArrayBuffer) {
      return new Uint8Array(buf, 0, buf.byteLength);
    }
    return buf;
  }

  // node_modules/@ipld/dag-pb/src/index.js
  var code3 = 112;
  function decode15(bytes) {
    const buf = toByteView3(bytes);
    const pbn = decodeNode(buf);
    const node = {};
    if (pbn.Data) {
      node.Data = pbn.Data;
    }
    if (pbn.Links) {
      node.Links = pbn.Links.map((l) => {
        const link = {};
        try {
          link.Hash = CID2.decode(l.Hash);
        } catch {
        }
        if (!link.Hash) {
          throw new Error("Invalid Hash field found in link, expected CID");
        }
        if (l.Name !== void 0) {
          link.Name = l.Name;
        }
        if (l.Tsize !== void 0) {
          link.Tsize = l.Tsize;
        }
        return link;
      });
    }
    return node;
  }

  // node_modules/multiformats/dist/src/codecs/json.js
  var textEncoder6 = new TextEncoder();
  var textDecoder5 = new TextDecoder();
  var code4 = 512;
  function decode16(data) {
    return JSON.parse(textDecoder5.decode(data));
  }

  // node_modules/multiformats/dist/src/codecs/raw.js
  var code5 = 85;

  // node_modules/multiformats/dist/src/hashes/identity.js
  var identity_exports = {};
  __export(identity_exports, {
    identity: () => identity
  });
  var code6 = 0;
  var name = "identity";
  var encode10 = coerce;
  function digest(input, options) {
    if (options?.truncate != null && options.truncate !== input.byteLength) {
      if (options.truncate < 0 || options.truncate > input.byteLength) {
        throw new Error(`Invalid truncate option, must be less than or equal to ${input.byteLength}`);
      }
      input = input.subarray(0, options.truncate);
    }
    return create(code6, encode10(input));
  }
  var identity = { code: code6, name, encode: encode10, digest };

  // node_modules/ipfs-unixfs-exporter/dist/src/utils/resolve-object-path.js
  function resolveObjectPath(object, block, cid, name3, path, toResolve, depth) {
    let subObject = object;
    let subPath = path;
    while (toResolve.length > 0) {
      const prop = toResolve[0];
      if (prop in subObject) {
        toResolve.shift();
        subPath = `${subPath}/${prop}`;
        const subObjectCid = CID.asCID(subObject[prop]);
        if (subObjectCid != null) {
          return {
            entry: {
              type: "object",
              name: name3,
              path,
              cid,
              node: block,
              depth,
              size: BigInt(block.length),
              content: async function* () {
                yield object;
              }
            },
            next: {
              cid: subObjectCid,
              name: prop,
              path: subPath,
              toResolve
            }
          };
        }
        subObject = subObject[prop];
      } else {
        throw new NoPropError(`No property named ${prop} found in node ${cid}`);
      }
    }
    return {
      entry: {
        type: "object",
        name: name3,
        path,
        cid,
        node: block,
        depth,
        size: BigInt(block.length),
        content: async function* () {
          yield object;
        }
      }
    };
  }

  // node_modules/ipfs-unixfs-exporter/dist/src/resolvers/dag-cbor.js
  var resolve = async (cid, name3, path, toResolve, resolve7, depth, blockstore, options) => {
    const block = await blockstore.get(cid, options);
    const object = decode6(block);
    return resolveObjectPath(object, block, cid, name3, path, toResolve, depth);
  };
  var dag_cbor_default = resolve;

  // node_modules/ipfs-unixfs-exporter/dist/src/resolvers/dag-json.js
  var resolve2 = async (cid, name3, path, toResolve, resolve7, depth, blockstore, options) => {
    const block = await blockstore.get(cid, options);
    const object = decode10(block);
    return resolveObjectPath(object, block, cid, name3, path, toResolve, depth);
  };
  var dag_json_default = resolve2;

  // node_modules/progress-events/dist/src/index.js
  var CustomProgressEvent = class extends Event {
    type;
    detail;
    constructor(type, detail) {
      super(type);
      this.type = type;
      this.detail = detail;
    }
  };

  // node_modules/ipfs-unixfs-exporter/dist/src/utils/extract-data-from-block.js
  function extractDataFromBlock(block, blockStart, requestedStart, requestedEnd) {
    const blockLength = BigInt(block.length);
    const blockEnd = BigInt(blockStart + blockLength);
    if (requestedStart >= blockEnd || requestedEnd < blockStart) {
      return new Uint8Array(0);
    }
    if (requestedEnd >= blockStart && requestedEnd < blockEnd) {
      block = block.subarray(0, Number(requestedEnd - blockStart));
    }
    if (requestedStart >= blockStart && requestedStart < blockEnd) {
      block = block.subarray(Number(requestedStart - blockStart));
    }
    return block;
  }
  var extract_data_from_block_default = extractDataFromBlock;

  // node_modules/ipfs-unixfs-exporter/dist/src/utils/validate-offset-and-length.js
  var validateOffsetAndLength = (size, offset = 0, length6 = size) => {
    const fileSize = BigInt(size);
    const start = BigInt(offset ?? 0);
    let end = BigInt(length6);
    if (end !== fileSize) {
      end = start + end;
    }
    if (end > fileSize) {
      end = fileSize;
    }
    if (start < 0n) {
      throw new InvalidParametersError("Offset must be greater than or equal to 0");
    }
    if (start > fileSize) {
      throw new InvalidParametersError("Offset must be less than the file size");
    }
    if (end < 0n) {
      throw new InvalidParametersError("Length must be greater than or equal to 0");
    }
    if (end > fileSize) {
      throw new InvalidParametersError("Length must be less than the file size");
    }
    return {
      start,
      end
    };
  };
  var validate_offset_and_length_default = validateOffsetAndLength;

  // node_modules/ipfs-unixfs-exporter/dist/src/resolvers/identity.js
  var rawContent = (node) => {
    async function* contentGenerator(options = {}) {
      const { start, end } = validate_offset_and_length_default(node.length, options.offset, options.length);
      const buf = extract_data_from_block_default(node, 0n, start, end);
      options.onProgress?.(new CustomProgressEvent("unixfs:exporter:progress:identity", {
        bytesRead: BigInt(buf.byteLength),
        totalBytes: end - start,
        fileSize: BigInt(node.byteLength)
      }));
      yield buf;
    }
    return contentGenerator;
  };
  var resolve3 = async (cid, name3, path, toResolve, resolve7, depth, blockstore, options) => {
    if (toResolve.length > 0) {
      throw new NotFoundError(`No link named ${path} found in raw node ${cid}`);
    }
    const buf = decode5(cid.multihash.bytes);
    return {
      entry: {
        type: "identity",
        name: name3,
        path,
        cid,
        content: rawContent(buf.digest),
        depth,
        size: BigInt(buf.digest.length),
        node: buf.digest
      }
    };
  };
  var identity_default = resolve3;

  // node_modules/ipfs-unixfs-exporter/dist/src/resolvers/json.js
  var resolve4 = async (cid, name3, path, toResolve, resolve7, depth, blockstore, options) => {
    const block = await blockstore.get(cid, options);
    const object = decode16(block);
    return resolveObjectPath(object, block, cid, name3, path, toResolve, depth);
  };
  var json_default = resolve4;

  // node_modules/ipfs-unixfs-exporter/dist/src/resolvers/raw.js
  var rawContent2 = (node) => {
    async function* contentGenerator(options = {}) {
      const { start, end } = validate_offset_and_length_default(node.length, options.offset, options.length);
      const buf = extract_data_from_block_default(node, 0n, start, end);
      options.onProgress?.(new CustomProgressEvent("unixfs:exporter:progress:raw", {
        bytesRead: BigInt(buf.byteLength),
        totalBytes: end - start,
        fileSize: BigInt(node.byteLength)
      }));
      yield buf;
    }
    return contentGenerator;
  };
  var resolve5 = async (cid, name3, path, toResolve, resolve7, depth, blockstore, options) => {
    if (toResolve.length > 0) {
      throw new NotFoundError(`No link named ${path} found in raw node ${cid}`);
    }
    const block = await blockstore.get(cid, options);
    return {
      entry: {
        type: "raw",
        name: name3,
        path,
        cid,
        content: rawContent2(block),
        depth,
        size: BigInt(block.length),
        node: block
      }
    };
  };
  var raw_default = resolve5;

  // node_modules/ipfs-unixfs/dist/src/errors.js
  var InvalidTypeError = class _InvalidTypeError extends Error {
    static name = "InvalidTypeError";
    static code = "ERR_INVALID_TYPE";
    name = _InvalidTypeError.name;
    code = _InvalidTypeError.code;
    constructor(message2 = "Invalid type") {
      super(message2);
    }
  };
  var InvalidUnixFSMessageError = class _InvalidUnixFSMessageError extends Error {
    static name = "InvalidUnixFSMessageError";
    static code = "ERR_INVALID_MESSAGE";
    name = _InvalidUnixFSMessageError.name;
    code = _InvalidUnixFSMessageError.code;
    constructor(message2 = "Invalid message") {
      super(message2);
    }
  };

  // node_modules/uint8-varint/dist/src/index.js
  var N13 = Math.pow(2, 7);
  var N23 = Math.pow(2, 14);
  var N33 = Math.pow(2, 21);
  var N43 = Math.pow(2, 28);
  var N53 = Math.pow(2, 35);
  var N63 = Math.pow(2, 42);
  var N73 = Math.pow(2, 49);
  var MSB3 = 128;
  var REST3 = 127;
  function encodingLength3(value) {
    if (value < N13) {
      return 1;
    }
    if (value < N23) {
      return 2;
    }
    if (value < N33) {
      return 3;
    }
    if (value < N43) {
      return 4;
    }
    if (value < N53) {
      return 5;
    }
    if (value < N63) {
      return 6;
    }
    if (value < N73) {
      return 7;
    }
    if (Number.MAX_SAFE_INTEGER != null && value > Number.MAX_SAFE_INTEGER) {
      throw new RangeError("Could not encode varint");
    }
    return 8;
  }
  function encodeUint8Array(value, buf, offset = 0) {
    switch (encodingLength3(value)) {
      case 8: {
        buf[offset++] = value & 255 | MSB3;
        value /= 128;
      }
      case 7: {
        buf[offset++] = value & 255 | MSB3;
        value /= 128;
      }
      case 6: {
        buf[offset++] = value & 255 | MSB3;
        value /= 128;
      }
      case 5: {
        buf[offset++] = value & 255 | MSB3;
        value /= 128;
      }
      case 4: {
        buf[offset++] = value & 255 | MSB3;
        value >>>= 7;
      }
      case 3: {
        buf[offset++] = value & 255 | MSB3;
        value >>>= 7;
      }
      case 2: {
        buf[offset++] = value & 255 | MSB3;
        value >>>= 7;
      }
      case 1: {
        buf[offset++] = value & 255;
        value >>>= 7;
        break;
      }
      default:
        throw new Error("unreachable");
    }
    return buf;
  }
  function decodeUint8Array(buf, offset) {
    let b = buf[offset];
    let res = 0;
    res += b & REST3;
    if (b < MSB3) {
      return res;
    }
    b = buf[offset + 1];
    res += (b & REST3) << 7;
    if (b < MSB3) {
      return res;
    }
    b = buf[offset + 2];
    res += (b & REST3) << 14;
    if (b < MSB3) {
      return res;
    }
    b = buf[offset + 3];
    res += (b & REST3) << 21;
    if (b < MSB3) {
      return res;
    }
    b = buf[offset + 4];
    res += (b & REST3) * N43;
    if (b < MSB3) {
      return res;
    }
    b = buf[offset + 5];
    res += (b & REST3) * N53;
    if (b < MSB3) {
      return res;
    }
    b = buf[offset + 6];
    res += (b & REST3) * N63;
    if (b < MSB3) {
      return res;
    }
    b = buf[offset + 7];
    res += (b & REST3) * N73;
    if (b < MSB3) {
      return res;
    }
    throw new RangeError("Could not decode varint");
  }

  // node_modules/protons-runtime/dist/src/utils/float.js
  var f32 = new Float32Array([-0]);
  var f8b = new Uint8Array(f32.buffer);
  function writeFloatLE(val, buf, pos) {
    f32[0] = val;
    buf[pos] = f8b[0];
    buf[pos + 1] = f8b[1];
    buf[pos + 2] = f8b[2];
    buf[pos + 3] = f8b[3];
  }
  function readFloatLE(buf, pos) {
    f8b[0] = buf[pos];
    f8b[1] = buf[pos + 1];
    f8b[2] = buf[pos + 2];
    f8b[3] = buf[pos + 3];
    return f32[0];
  }
  var f64 = new Float64Array([-0]);
  var d8b = new Uint8Array(f64.buffer);
  function writeDoubleLE(val, buf, pos) {
    f64[0] = val;
    buf[pos] = d8b[0];
    buf[pos + 1] = d8b[1];
    buf[pos + 2] = d8b[2];
    buf[pos + 3] = d8b[3];
    buf[pos + 4] = d8b[4];
    buf[pos + 5] = d8b[5];
    buf[pos + 6] = d8b[6];
    buf[pos + 7] = d8b[7];
  }
  function readDoubleLE(buf, pos) {
    d8b[0] = buf[pos];
    d8b[1] = buf[pos + 1];
    d8b[2] = buf[pos + 2];
    d8b[3] = buf[pos + 3];
    d8b[4] = buf[pos + 4];
    d8b[5] = buf[pos + 5];
    d8b[6] = buf[pos + 6];
    d8b[7] = buf[pos + 7];
    return f64[0];
  }

  // node_modules/protons-runtime/dist/src/utils/longbits.js
  var MAX_SAFE_NUMBER_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);
  var MIN_SAFE_NUMBER_INTEGER = BigInt(Number.MIN_SAFE_INTEGER);
  var LongBits = class _LongBits {
    lo;
    hi;
    constructor(lo, hi) {
      this.lo = lo | 0;
      this.hi = hi | 0;
    }
    /**
     * Converts this long bits to a possibly unsafe JavaScript number
     */
    toNumber(unsigned = false) {
      if (!unsigned && this.hi >>> 31 > 0) {
        const lo = ~this.lo + 1 >>> 0;
        let hi = ~this.hi >>> 0;
        if (lo === 0) {
          hi = hi + 1 >>> 0;
        }
        return -(lo + hi * 4294967296);
      }
      return this.lo + this.hi * 4294967296;
    }
    /**
     * Converts this long bits to a bigint
     */
    toBigInt(unsigned = false) {
      if (unsigned) {
        return BigInt(this.lo >>> 0) + (BigInt(this.hi >>> 0) << 32n);
      }
      if (this.hi >>> 31 !== 0) {
        const lo = ~this.lo + 1 >>> 0;
        let hi = ~this.hi >>> 0;
        if (lo === 0) {
          hi = hi + 1 >>> 0;
        }
        return -(BigInt(lo) + (BigInt(hi) << 32n));
      }
      return BigInt(this.lo >>> 0) + (BigInt(this.hi >>> 0) << 32n);
    }
    /**
     * Converts this long bits to a string
     */
    toString(unsigned = false) {
      return this.toBigInt(unsigned).toString();
    }
    /**
     * Zig-zag encodes this long bits
     */
    zzEncode() {
      const mask = this.hi >> 31;
      this.hi = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
      this.lo = (this.lo << 1 ^ mask) >>> 0;
      return this;
    }
    /**
     * Zig-zag decodes this long bits
     */
    zzDecode() {
      const mask = -(this.lo & 1);
      this.lo = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
      this.hi = (this.hi >>> 1 ^ mask) >>> 0;
      return this;
    }
    /**
     * Calculates the length of this longbits when encoded as a varint.
     */
    length() {
      const part0 = this.lo;
      const part1 = (this.lo >>> 28 | this.hi << 4) >>> 0;
      const part2 = this.hi >>> 24;
      return part2 === 0 ? part1 === 0 ? part0 < 16384 ? part0 < 128 ? 1 : 2 : part0 < 2097152 ? 3 : 4 : part1 < 16384 ? part1 < 128 ? 5 : 6 : part1 < 2097152 ? 7 : 8 : part2 < 128 ? 9 : 10;
    }
    /**
     * Constructs new long bits from the specified number
     */
    static fromBigInt(value) {
      if (value === 0n) {
        return zero;
      }
      if (value < MAX_SAFE_NUMBER_INTEGER && value > MIN_SAFE_NUMBER_INTEGER) {
        return this.fromNumber(Number(value));
      }
      const negative = value < 0n;
      if (negative) {
        value = -value;
      }
      let hi = value >> 32n;
      let lo = value - (hi << 32n);
      if (negative) {
        hi = ~hi | 0n;
        lo = ~lo | 0n;
        if (++lo > TWO_32) {
          lo = 0n;
          if (++hi > TWO_32) {
            hi = 0n;
          }
        }
      }
      return new _LongBits(Number(lo), Number(hi));
    }
    /**
     * Constructs new long bits from the specified number
     */
    static fromNumber(value) {
      if (value === 0) {
        return zero;
      }
      const sign = value < 0;
      if (sign) {
        value = -value;
      }
      let lo = value >>> 0;
      let hi = (value - lo) / 4294967296 >>> 0;
      if (sign) {
        hi = ~hi >>> 0;
        lo = ~lo >>> 0;
        if (++lo > 4294967295) {
          lo = 0;
          if (++hi > 4294967295) {
            hi = 0;
          }
        }
      }
      return new _LongBits(lo, hi);
    }
    /**
     * Constructs new long bits from a number, long or string
     */
    static from(value) {
      if (typeof value === "number") {
        return _LongBits.fromNumber(value);
      }
      if (typeof value === "bigint") {
        return _LongBits.fromBigInt(value);
      }
      if (typeof value === "string") {
        return _LongBits.fromBigInt(BigInt(value));
      }
      return value.low != null || value.high != null ? new _LongBits(value.low >>> 0, value.high >>> 0) : zero;
    }
  };
  var zero = new LongBits(0, 0);
  zero.toBigInt = function() {
    return 0n;
  };
  zero.zzEncode = zero.zzDecode = function() {
    return this;
  };
  zero.length = function() {
    return 1;
  };
  var TWO_32 = 4294967296n;

  // node_modules/protons-runtime/dist/src/utils/utf8.js
  function length3(string3) {
    let len = 0;
    let c = 0;
    for (let i = 0; i < string3.length; ++i) {
      c = string3.charCodeAt(i);
      if (c < 128) {
        len += 1;
      } else if (c < 2048) {
        len += 2;
      } else if ((c & 64512) === 55296 && (string3.charCodeAt(i + 1) & 64512) === 56320) {
        ++i;
        len += 4;
      } else {
        len += 3;
      }
    }
    return len;
  }
  function read3(buffer4, start, end) {
    const len = end - start;
    if (len < 1) {
      return "";
    }
    let parts;
    const chunk = [];
    let i = 0;
    let t;
    while (start < end) {
      t = buffer4[start++];
      if (t < 128) {
        chunk[i++] = t;
      } else if (t > 191 && t < 224) {
        chunk[i++] = (t & 31) << 6 | buffer4[start++] & 63;
      } else if (t > 239 && t < 365) {
        t = ((t & 7) << 18 | (buffer4[start++] & 63) << 12 | (buffer4[start++] & 63) << 6 | buffer4[start++] & 63) - 65536;
        chunk[i++] = 55296 + (t >> 10);
        chunk[i++] = 56320 + (t & 1023);
      } else {
        chunk[i++] = (t & 15) << 12 | (buffer4[start++] & 63) << 6 | buffer4[start++] & 63;
      }
      if (i > 8191) {
        (parts ?? (parts = [])).push(String.fromCharCode.apply(String, chunk));
        i = 0;
      }
    }
    if (parts != null) {
      if (i > 0) {
        parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
      }
      return parts.join("");
    }
    return String.fromCharCode.apply(String, chunk.slice(0, i));
  }
  function write(string3, buffer4, offset) {
    const start = offset;
    let c1;
    let c2;
    for (let i = 0; i < string3.length; ++i) {
      c1 = string3.charCodeAt(i);
      if (c1 < 128) {
        buffer4[offset++] = c1;
      } else if (c1 < 2048) {
        buffer4[offset++] = c1 >> 6 | 192;
        buffer4[offset++] = c1 & 63 | 128;
      } else if ((c1 & 64512) === 55296 && ((c2 = string3.charCodeAt(i + 1)) & 64512) === 56320) {
        c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
        ++i;
        buffer4[offset++] = c1 >> 18 | 240;
        buffer4[offset++] = c1 >> 12 & 63 | 128;
        buffer4[offset++] = c1 >> 6 & 63 | 128;
        buffer4[offset++] = c1 & 63 | 128;
      } else {
        buffer4[offset++] = c1 >> 12 | 224;
        buffer4[offset++] = c1 >> 6 & 63 | 128;
        buffer4[offset++] = c1 & 63 | 128;
      }
    }
    return offset - start;
  }

  // node_modules/protons-runtime/dist/src/utils/reader.js
  function indexOutOfRange(reader, writeLength) {
    return RangeError(`index out of range: ${reader.pos} + ${writeLength ?? 1} > ${reader.len}`);
  }
  function readFixed32End(buf, end) {
    return (buf[end - 4] | buf[end - 3] << 8 | buf[end - 2] << 16 | buf[end - 1] << 24) >>> 0;
  }
  var Uint8ArrayReader = class {
    buf;
    pos;
    len;
    _slice = Uint8Array.prototype.subarray;
    constructor(buffer4) {
      this.buf = buffer4;
      this.pos = 0;
      this.len = buffer4.length;
    }
    /**
     * Reads a varint as an unsigned 32 bit value
     */
    uint32() {
      let value = 4294967295;
      value = (this.buf[this.pos] & 127) >>> 0;
      if (this.buf[this.pos++] < 128) {
        return value;
      }
      value = (value | (this.buf[this.pos] & 127) << 7) >>> 0;
      if (this.buf[this.pos++] < 128) {
        return value;
      }
      value = (value | (this.buf[this.pos] & 127) << 14) >>> 0;
      if (this.buf[this.pos++] < 128) {
        return value;
      }
      value = (value | (this.buf[this.pos] & 127) << 21) >>> 0;
      if (this.buf[this.pos++] < 128) {
        return value;
      }
      value = (value | (this.buf[this.pos] & 15) << 28) >>> 0;
      if (this.buf[this.pos++] < 128) {
        return value;
      }
      if ((this.pos += 5) > this.len) {
        this.pos = this.len;
        throw indexOutOfRange(this, 10);
      }
      return value;
    }
    /**
     * Reads a varint as a signed 32 bit value
     */
    int32() {
      return this.uint32() | 0;
    }
    /**
     * Reads a zig-zag encoded varint as a signed 32 bit value
     */
    sint32() {
      const value = this.uint32();
      return value >>> 1 ^ -(value & 1) | 0;
    }
    /**
     * Reads a varint as a boolean
     */
    bool() {
      return this.uint32() !== 0;
    }
    /**
     * Reads fixed 32 bits as an unsigned 32 bit integer
     */
    fixed32() {
      if (this.pos + 4 > this.len) {
        throw indexOutOfRange(this, 4);
      }
      const res = readFixed32End(this.buf, this.pos += 4);
      return res;
    }
    /**
     * Reads fixed 32 bits as a signed 32 bit integer
     */
    sfixed32() {
      if (this.pos + 4 > this.len) {
        throw indexOutOfRange(this, 4);
      }
      const res = readFixed32End(this.buf, this.pos += 4) | 0;
      return res;
    }
    /**
     * Reads a float (32 bit) as a number
     */
    float() {
      if (this.pos + 4 > this.len) {
        throw indexOutOfRange(this, 4);
      }
      const value = readFloatLE(this.buf, this.pos);
      this.pos += 4;
      return value;
    }
    /**
     * Reads a double (64 bit float) as a number
     */
    double() {
      if (this.pos + 8 > this.len) {
        throw indexOutOfRange(this, 4);
      }
      const value = readDoubleLE(this.buf, this.pos);
      this.pos += 8;
      return value;
    }
    /**
     * Reads a sequence of bytes preceded by its length as a varint
     */
    bytes() {
      const length6 = this.uint32();
      const start = this.pos;
      const end = this.pos + length6;
      if (end > this.len) {
        throw indexOutOfRange(this, length6);
      }
      this.pos += length6;
      return start === end ? new Uint8Array(0) : this.buf.subarray(start, end);
    }
    /**
     * Reads a string preceded by its byte length as a varint
     */
    string() {
      const bytes = this.bytes();
      return read3(bytes, 0, bytes.length);
    }
    /**
     * Skips the specified number of bytes if specified, otherwise skips a varint
     */
    skip(length6) {
      if (typeof length6 === "number") {
        if (this.pos + length6 > this.len) {
          throw indexOutOfRange(this, length6);
        }
        this.pos += length6;
      } else {
        do {
          if (this.pos >= this.len) {
            throw indexOutOfRange(this);
          }
        } while ((this.buf[this.pos++] & 128) !== 0);
      }
      return this;
    }
    /**
     * Skips the next element of the specified wire type
     */
    skipType(wireType) {
      switch (wireType) {
        case 0:
          this.skip();
          break;
        case 1:
          this.skip(8);
          break;
        case 2:
          this.skip(this.uint32());
          break;
        case 3:
          while ((wireType = this.uint32() & 7) !== 4) {
            this.skipType(wireType);
          }
          break;
        case 5:
          this.skip(4);
          break;
        /* istanbul ignore next */
        default:
          throw Error(`invalid wire type ${wireType} at offset ${this.pos}`);
      }
      return this;
    }
    readLongVarint() {
      const bits = new LongBits(0, 0);
      let i = 0;
      if (this.len - this.pos > 4) {
        for (; i < 4; ++i) {
          bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
          if (this.buf[this.pos++] < 128) {
            return bits;
          }
        }
        bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
        bits.hi = (bits.hi | (this.buf[this.pos] & 127) >> 4) >>> 0;
        if (this.buf[this.pos++] < 128) {
          return bits;
        }
        i = 0;
      } else {
        for (; i < 3; ++i) {
          if (this.pos >= this.len) {
            throw indexOutOfRange(this);
          }
          bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
          if (this.buf[this.pos++] < 128) {
            return bits;
          }
        }
        bits.lo = (bits.lo | (this.buf[this.pos++] & 127) << i * 7) >>> 0;
        return bits;
      }
      if (this.len - this.pos > 4) {
        for (; i < 5; ++i) {
          bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
          if (this.buf[this.pos++] < 128) {
            return bits;
          }
        }
      } else {
        for (; i < 5; ++i) {
          if (this.pos >= this.len) {
            throw indexOutOfRange(this);
          }
          bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
          if (this.buf[this.pos++] < 128) {
            return bits;
          }
        }
      }
      throw Error("invalid varint encoding");
    }
    readFixed64() {
      if (this.pos + 8 > this.len) {
        throw indexOutOfRange(this, 8);
      }
      const lo = readFixed32End(this.buf, this.pos += 4);
      const hi = readFixed32End(this.buf, this.pos += 4);
      return new LongBits(lo, hi);
    }
    /**
     * Reads a varint as a signed 64 bit value
     */
    int64() {
      return this.readLongVarint().toBigInt();
    }
    /**
     * Reads a varint as a signed 64 bit value returned as a possibly unsafe
     * JavaScript number
     */
    int64Number() {
      return this.readLongVarint().toNumber();
    }
    /**
     * Reads a varint as a signed 64 bit value returned as a string
     */
    int64String() {
      return this.readLongVarint().toString();
    }
    /**
     * Reads a varint as an unsigned 64 bit value
     */
    uint64() {
      return this.readLongVarint().toBigInt(true);
    }
    /**
     * Reads a varint as an unsigned 64 bit value returned as a possibly unsafe
     * JavaScript number
     */
    uint64Number() {
      const value = decodeUint8Array(this.buf, this.pos);
      this.pos += encodingLength3(value);
      return value;
    }
    /**
     * Reads a varint as an unsigned 64 bit value returned as a string
     */
    uint64String() {
      return this.readLongVarint().toString(true);
    }
    /**
     * Reads a zig-zag encoded varint as a signed 64 bit value
     */
    sint64() {
      return this.readLongVarint().zzDecode().toBigInt();
    }
    /**
     * Reads a zig-zag encoded varint as a signed 64 bit value returned as a
     * possibly unsafe JavaScript number
     */
    sint64Number() {
      return this.readLongVarint().zzDecode().toNumber();
    }
    /**
     * Reads a zig-zag encoded varint as a signed 64 bit value returned as a
     * string
     */
    sint64String() {
      return this.readLongVarint().zzDecode().toString();
    }
    /**
     * Reads fixed 64 bits
     */
    fixed64() {
      return this.readFixed64().toBigInt();
    }
    /**
     * Reads fixed 64 bits returned as a possibly unsafe JavaScript number
     */
    fixed64Number() {
      return this.readFixed64().toNumber();
    }
    /**
     * Reads fixed 64 bits returned as a string
     */
    fixed64String() {
      return this.readFixed64().toString();
    }
    /**
     * Reads zig-zag encoded fixed 64 bits
     */
    sfixed64() {
      return this.readFixed64().toBigInt();
    }
    /**
     * Reads zig-zag encoded fixed 64 bits returned as a possibly unsafe
     * JavaScript number
     */
    sfixed64Number() {
      return this.readFixed64().toNumber();
    }
    /**
     * Reads zig-zag encoded fixed 64 bits returned as a string
     */
    sfixed64String() {
      return this.readFixed64().toString();
    }
  };
  function createReader(buf) {
    return new Uint8ArrayReader(buf instanceof Uint8Array ? buf : buf.subarray());
  }

  // node_modules/protons-runtime/dist/src/decode.js
  function decodeMessage(buf, codec, opts) {
    const reader = createReader(buf);
    return codec.decode(reader, void 0, opts);
  }

  // node_modules/protons-runtime/node_modules/uint8arrays/dist/src/alloc.js
  function allocUnsafe2(size = 0) {
    return new Uint8Array(size);
  }

  // node_modules/multiformats/dist/src/bases/base10.js
  var base10_exports = {};
  __export(base10_exports, {
    base10: () => base10
  });
  var base10 = baseX({
    prefix: "9",
    name: "base10",
    alphabet: "0123456789"
  });

  // node_modules/multiformats/dist/src/bases/base16.js
  var base16_exports = {};
  __export(base16_exports, {
    base16: () => base16,
    base16upper: () => base16upper
  });
  var base16 = rfc4648({
    prefix: "f",
    name: "base16",
    alphabet: "0123456789abcdef",
    bitsPerChar: 4
  });
  var base16upper = rfc4648({
    prefix: "F",
    name: "base16upper",
    alphabet: "0123456789ABCDEF",
    bitsPerChar: 4
  });

  // node_modules/multiformats/dist/src/bases/base2.js
  var base2_exports = {};
  __export(base2_exports, {
    base2: () => base22
  });
  var base22 = rfc4648({
    prefix: "0",
    name: "base2",
    alphabet: "01",
    bitsPerChar: 1
  });

  // node_modules/multiformats/dist/src/bases/base256emoji.js
  var base256emoji_exports = {};
  __export(base256emoji_exports, {
    base256emoji: () => base256emoji
  });
  var alphabet = Array.from("\u{1F680}\u{1FA90}\u2604\u{1F6F0}\u{1F30C}\u{1F311}\u{1F312}\u{1F313}\u{1F314}\u{1F315}\u{1F316}\u{1F317}\u{1F318}\u{1F30D}\u{1F30F}\u{1F30E}\u{1F409}\u2600\u{1F4BB}\u{1F5A5}\u{1F4BE}\u{1F4BF}\u{1F602}\u2764\u{1F60D}\u{1F923}\u{1F60A}\u{1F64F}\u{1F495}\u{1F62D}\u{1F618}\u{1F44D}\u{1F605}\u{1F44F}\u{1F601}\u{1F525}\u{1F970}\u{1F494}\u{1F496}\u{1F499}\u{1F622}\u{1F914}\u{1F606}\u{1F644}\u{1F4AA}\u{1F609}\u263A\u{1F44C}\u{1F917}\u{1F49C}\u{1F614}\u{1F60E}\u{1F607}\u{1F339}\u{1F926}\u{1F389}\u{1F49E}\u270C\u2728\u{1F937}\u{1F631}\u{1F60C}\u{1F338}\u{1F64C}\u{1F60B}\u{1F497}\u{1F49A}\u{1F60F}\u{1F49B}\u{1F642}\u{1F493}\u{1F929}\u{1F604}\u{1F600}\u{1F5A4}\u{1F603}\u{1F4AF}\u{1F648}\u{1F447}\u{1F3B6}\u{1F612}\u{1F92D}\u2763\u{1F61C}\u{1F48B}\u{1F440}\u{1F62A}\u{1F611}\u{1F4A5}\u{1F64B}\u{1F61E}\u{1F629}\u{1F621}\u{1F92A}\u{1F44A}\u{1F973}\u{1F625}\u{1F924}\u{1F449}\u{1F483}\u{1F633}\u270B\u{1F61A}\u{1F61D}\u{1F634}\u{1F31F}\u{1F62C}\u{1F643}\u{1F340}\u{1F337}\u{1F63B}\u{1F613}\u2B50\u2705\u{1F97A}\u{1F308}\u{1F608}\u{1F918}\u{1F4A6}\u2714\u{1F623}\u{1F3C3}\u{1F490}\u2639\u{1F38A}\u{1F498}\u{1F620}\u261D\u{1F615}\u{1F33A}\u{1F382}\u{1F33B}\u{1F610}\u{1F595}\u{1F49D}\u{1F64A}\u{1F639}\u{1F5E3}\u{1F4AB}\u{1F480}\u{1F451}\u{1F3B5}\u{1F91E}\u{1F61B}\u{1F534}\u{1F624}\u{1F33C}\u{1F62B}\u26BD\u{1F919}\u2615\u{1F3C6}\u{1F92B}\u{1F448}\u{1F62E}\u{1F646}\u{1F37B}\u{1F343}\u{1F436}\u{1F481}\u{1F632}\u{1F33F}\u{1F9E1}\u{1F381}\u26A1\u{1F31E}\u{1F388}\u274C\u270A\u{1F44B}\u{1F630}\u{1F928}\u{1F636}\u{1F91D}\u{1F6B6}\u{1F4B0}\u{1F353}\u{1F4A2}\u{1F91F}\u{1F641}\u{1F6A8}\u{1F4A8}\u{1F92C}\u2708\u{1F380}\u{1F37A}\u{1F913}\u{1F619}\u{1F49F}\u{1F331}\u{1F616}\u{1F476}\u{1F974}\u25B6\u27A1\u2753\u{1F48E}\u{1F4B8}\u2B07\u{1F628}\u{1F31A}\u{1F98B}\u{1F637}\u{1F57A}\u26A0\u{1F645}\u{1F61F}\u{1F635}\u{1F44E}\u{1F932}\u{1F920}\u{1F927}\u{1F4CC}\u{1F535}\u{1F485}\u{1F9D0}\u{1F43E}\u{1F352}\u{1F617}\u{1F911}\u{1F30A}\u{1F92F}\u{1F437}\u260E\u{1F4A7}\u{1F62F}\u{1F486}\u{1F446}\u{1F3A4}\u{1F647}\u{1F351}\u2744\u{1F334}\u{1F4A3}\u{1F438}\u{1F48C}\u{1F4CD}\u{1F940}\u{1F922}\u{1F445}\u{1F4A1}\u{1F4A9}\u{1F450}\u{1F4F8}\u{1F47B}\u{1F910}\u{1F92E}\u{1F3BC}\u{1F975}\u{1F6A9}\u{1F34E}\u{1F34A}\u{1F47C}\u{1F48D}\u{1F4E3}\u{1F942}");
  var alphabetBytesToChars = alphabet.reduce((p, c, i) => {
    p[i] = c;
    return p;
  }, []);
  var alphabetCharsToBytes = alphabet.reduce((p, c, i) => {
    const codePoint = c.codePointAt(0);
    if (codePoint == null) {
      throw new Error(`Invalid character: ${c}`);
    }
    p[codePoint] = i;
    return p;
  }, []);
  function encode11(data) {
    return data.reduce((p, c) => {
      p += alphabetBytesToChars[c];
      return p;
    }, "");
  }
  function decode17(str) {
    const byts = [];
    for (const char of str) {
      const codePoint = char.codePointAt(0);
      if (codePoint == null) {
        throw new Error(`Invalid character: ${char}`);
      }
      const byt = alphabetCharsToBytes[codePoint];
      if (byt == null) {
        throw new Error(`Non-base256emoji character: ${char}`);
      }
      byts.push(byt);
    }
    return new Uint8Array(byts);
  }
  var base256emoji = from({
    prefix: "\u{1F680}",
    name: "base256emoji",
    encode: encode11,
    decode: decode17
  });

  // node_modules/multiformats/dist/src/bases/base8.js
  var base8_exports = {};
  __export(base8_exports, {
    base8: () => base8
  });
  var base8 = rfc4648({
    prefix: "7",
    name: "base8",
    alphabet: "01234567",
    bitsPerChar: 3
  });

  // node_modules/multiformats/dist/src/bases/identity.js
  var identity_exports2 = {};
  __export(identity_exports2, {
    identity: () => identity2
  });
  var identity2 = from({
    prefix: "\0",
    name: "identity",
    encode: (buf) => toString(buf),
    decode: (str) => fromString2(str)
  });

  // node_modules/multiformats/dist/src/hashes/sha2-browser.js
  var sha2_browser_exports = {};
  __export(sha2_browser_exports, {
    sha256: () => sha256,
    sha512: () => sha512
  });
  function sha(name3) {
    return async (data) => new Uint8Array(await crypto.subtle.digest(name3, data));
  }
  var sha256 = from2({
    name: "sha2-256",
    code: 18,
    encode: sha("SHA-256")
  });
  var sha512 = from2({
    name: "sha2-512",
    code: 19,
    encode: sha("SHA-512")
  });

  // node_modules/multiformats/dist/src/basics.js
  var bases = { ...identity_exports2, ...base2_exports, ...base8_exports, ...base10_exports, ...base16_exports, ...base32_exports, ...base36_exports, ...base58_exports, ...base64_exports, ...base256emoji_exports };
  var hashes = { ...sha2_browser_exports, ...identity_exports };

  // node_modules/protons-runtime/node_modules/uint8arrays/dist/src/util/bases.js
  function createCodec(name3, prefix, encode17, decode25) {
    return {
      name: name3,
      prefix,
      encoder: {
        name: name3,
        prefix,
        encode: encode17
      },
      decoder: {
        decode: decode25
      }
    };
  }
  var string = createCodec("utf8", "u", (buf) => {
    const decoder = new TextDecoder("utf8");
    return "u" + decoder.decode(buf);
  }, (str) => {
    const encoder = new TextEncoder();
    return encoder.encode(str.substring(1));
  });
  var ascii = createCodec("ascii", "a", (buf) => {
    let string3 = "a";
    for (let i = 0; i < buf.length; i++) {
      string3 += String.fromCharCode(buf[i]);
    }
    return string3;
  }, (str) => {
    str = str.substring(1);
    const buf = allocUnsafe2(str.length);
    for (let i = 0; i < str.length; i++) {
      buf[i] = str.charCodeAt(i);
    }
    return buf;
  });
  var BASES = {
    utf8: string,
    "utf-8": string,
    hex: bases.base16,
    latin1: ascii,
    ascii,
    binary: ascii,
    ...bases
  };
  var bases_default = BASES;

  // node_modules/protons-runtime/node_modules/uint8arrays/dist/src/from-string.js
  function fromString5(string3, encoding = "utf8") {
    const base4 = bases_default[encoding];
    if (base4 == null) {
      throw new Error(`Unsupported encoding "${encoding}"`);
    }
    return base4.decoder.decode(`${base4.prefix}${string3}`);
  }

  // node_modules/protons-runtime/dist/src/utils/pool.js
  function pool(size) {
    const SIZE = size ?? 8192;
    const MAX = SIZE >>> 1;
    let slab;
    let offset = SIZE;
    return function poolAlloc(size2) {
      if (size2 < 1 || size2 > MAX) {
        return allocUnsafe2(size2);
      }
      if (offset + size2 > SIZE) {
        slab = allocUnsafe2(SIZE);
        offset = 0;
      }
      const buf = slab.subarray(offset, offset += size2);
      if ((offset & 7) !== 0) {
        offset = (offset | 7) + 1;
      }
      return buf;
    };
  }

  // node_modules/protons-runtime/dist/src/utils/writer.js
  var Op = class {
    /**
     * Function to call
     */
    fn;
    /**
     * Value byte length
     */
    len;
    /**
     * Next operation
     */
    next;
    /**
     * Value to write
     */
    val;
    constructor(fn, len, val) {
      this.fn = fn;
      this.len = len;
      this.next = void 0;
      this.val = val;
    }
  };
  function noop() {
  }
  var State = class {
    /**
     * Current head
     */
    head;
    /**
     * Current tail
     */
    tail;
    /**
     * Current buffer length
     */
    len;
    /**
     * Next state
     */
    next;
    constructor(writer) {
      this.head = writer.head;
      this.tail = writer.tail;
      this.len = writer.len;
      this.next = writer.states;
    }
  };
  var bufferPool = pool();
  function alloc4(size) {
    if (globalThis.Buffer != null) {
      return allocUnsafe2(size);
    }
    return bufferPool(size);
  }
  var Uint8ArrayWriter = class {
    /**
     * Current length
     */
    len;
    /**
     * Operations head
     */
    head;
    /**
     * Operations tail
     */
    tail;
    /**
     * Linked forked states
     */
    states;
    constructor() {
      this.len = 0;
      this.head = new Op(noop, 0, 0);
      this.tail = this.head;
      this.states = null;
    }
    /**
     * Pushes a new operation to the queue
     */
    _push(fn, len, val) {
      this.tail = this.tail.next = new Op(fn, len, val);
      this.len += len;
      return this;
    }
    /**
     * Writes an unsigned 32 bit value as a varint
     */
    uint32(value) {
      this.len += (this.tail = this.tail.next = new VarintOp((value = value >>> 0) < 128 ? 1 : value < 16384 ? 2 : value < 2097152 ? 3 : value < 268435456 ? 4 : 5, value)).len;
      return this;
    }
    /**
     * Writes a signed 32 bit value as a varint`
     */
    int32(value) {
      return value < 0 ? this._push(writeVarint64, 10, LongBits.fromNumber(value)) : this.uint32(value);
    }
    /**
     * Writes a 32 bit value as a varint, zig-zag encoded
     */
    sint32(value) {
      return this.uint32((value << 1 ^ value >> 31) >>> 0);
    }
    /**
     * Writes an unsigned 64 bit value as a varint
     */
    uint64(value) {
      const bits = LongBits.fromBigInt(value);
      return this._push(writeVarint64, bits.length(), bits);
    }
    /**
     * Writes an unsigned 64 bit value as a varint
     */
    uint64Number(value) {
      return this._push(encodeUint8Array, encodingLength3(value), value);
    }
    /**
     * Writes an unsigned 64 bit value as a varint
     */
    uint64String(value) {
      return this.uint64(BigInt(value));
    }
    /**
     * Writes a signed 64 bit value as a varint
     */
    int64(value) {
      return this.uint64(value);
    }
    /**
     * Writes a signed 64 bit value as a varint
     */
    int64Number(value) {
      return this.uint64Number(value);
    }
    /**
     * Writes a signed 64 bit value as a varint
     */
    int64String(value) {
      return this.uint64String(value);
    }
    /**
     * Writes a signed 64 bit value as a varint, zig-zag encoded
     */
    sint64(value) {
      const bits = LongBits.fromBigInt(value).zzEncode();
      return this._push(writeVarint64, bits.length(), bits);
    }
    /**
     * Writes a signed 64 bit value as a varint, zig-zag encoded
     */
    sint64Number(value) {
      const bits = LongBits.fromNumber(value).zzEncode();
      return this._push(writeVarint64, bits.length(), bits);
    }
    /**
     * Writes a signed 64 bit value as a varint, zig-zag encoded
     */
    sint64String(value) {
      return this.sint64(BigInt(value));
    }
    /**
     * Writes a boolish value as a varint
     */
    bool(value) {
      return this._push(writeByte, 1, value ? 1 : 0);
    }
    /**
     * Writes an unsigned 32 bit value as fixed 32 bits
     */
    fixed32(value) {
      return this._push(writeFixed32, 4, value >>> 0);
    }
    /**
     * Writes a signed 32 bit value as fixed 32 bits
     */
    sfixed32(value) {
      return this.fixed32(value);
    }
    /**
     * Writes an unsigned 64 bit value as fixed 64 bits
     */
    fixed64(value) {
      const bits = LongBits.fromBigInt(value);
      return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi);
    }
    /**
     * Writes an unsigned 64 bit value as fixed 64 bits
     */
    fixed64Number(value) {
      const bits = LongBits.fromNumber(value);
      return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi);
    }
    /**
     * Writes an unsigned 64 bit value as fixed 64 bits
     */
    fixed64String(value) {
      return this.fixed64(BigInt(value));
    }
    /**
     * Writes a signed 64 bit value as fixed 64 bits
     */
    sfixed64(value) {
      return this.fixed64(value);
    }
    /**
     * Writes a signed 64 bit value as fixed 64 bits
     */
    sfixed64Number(value) {
      return this.fixed64Number(value);
    }
    /**
     * Writes a signed 64 bit value as fixed 64 bits
     */
    sfixed64String(value) {
      return this.fixed64String(value);
    }
    /**
     * Writes a float (32 bit)
     */
    float(value) {
      return this._push(writeFloatLE, 4, value);
    }
    /**
     * Writes a double (64 bit float).
     *
     * @function
     * @param {number} value - Value to write
     * @returns {Writer} `this`
     */
    double(value) {
      return this._push(writeDoubleLE, 8, value);
    }
    /**
     * Writes a sequence of bytes
     */
    bytes(value) {
      const len = value.length >>> 0;
      if (len === 0) {
        return this._push(writeByte, 1, 0);
      }
      return this.uint32(len)._push(writeBytes, len, value);
    }
    /**
     * Writes a string
     */
    string(value) {
      const len = length3(value);
      return len !== 0 ? this.uint32(len)._push(write, len, value) : this._push(writeByte, 1, 0);
    }
    /**
     * Forks this writer's state by pushing it to a stack.
     * Calling {@link Writer#reset|reset} or {@link Writer#ldelim|ldelim} resets the writer to the previous state.
     */
    fork() {
      this.states = new State(this);
      this.head = this.tail = new Op(noop, 0, 0);
      this.len = 0;
      return this;
    }
    /**
     * Resets this instance to the last state
     */
    reset() {
      if (this.states != null) {
        this.head = this.states.head;
        this.tail = this.states.tail;
        this.len = this.states.len;
        this.states = this.states.next;
      } else {
        this.head = this.tail = new Op(noop, 0, 0);
        this.len = 0;
      }
      return this;
    }
    /**
     * Resets to the last state and appends the fork state's current write length as a varint followed by its operations.
     */
    ldelim() {
      const head = this.head;
      const tail = this.tail;
      const len = this.len;
      this.reset().uint32(len);
      if (len !== 0) {
        this.tail.next = head.next;
        this.tail = tail;
        this.len += len;
      }
      return this;
    }
    /**
     * Finishes the write operation
     */
    finish() {
      let head = this.head.next;
      const buf = alloc4(this.len);
      let pos = 0;
      while (head != null) {
        head.fn(head.val, buf, pos);
        pos += head.len;
        head = head.next;
      }
      return buf;
    }
  };
  function writeByte(val, buf, pos) {
    buf[pos] = val & 255;
  }
  function writeVarint32(val, buf, pos) {
    while (val > 127) {
      buf[pos++] = val & 127 | 128;
      val >>>= 7;
    }
    buf[pos] = val;
  }
  var VarintOp = class extends Op {
    next;
    constructor(len, val) {
      super(writeVarint32, len, val);
      this.next = void 0;
    }
  };
  function writeVarint64(val, buf, pos) {
    while (val.hi !== 0) {
      buf[pos++] = val.lo & 127 | 128;
      val.lo = (val.lo >>> 7 | val.hi << 25) >>> 0;
      val.hi >>>= 7;
    }
    while (val.lo > 127) {
      buf[pos++] = val.lo & 127 | 128;
      val.lo = val.lo >>> 7;
    }
    buf[pos++] = val.lo;
  }
  function writeFixed32(val, buf, pos) {
    buf[pos] = val & 255;
    buf[pos + 1] = val >>> 8 & 255;
    buf[pos + 2] = val >>> 16 & 255;
    buf[pos + 3] = val >>> 24;
  }
  function writeBytes(val, buf, pos) {
    buf.set(val, pos);
  }
  if (globalThis.Buffer != null) {
    Uint8ArrayWriter.prototype.bytes = function(value) {
      const len = value.length >>> 0;
      this.uint32(len);
      if (len > 0) {
        this._push(writeBytesBuffer, len, value);
      }
      return this;
    };
    Uint8ArrayWriter.prototype.string = function(value) {
      const len = globalThis.Buffer.byteLength(value);
      this.uint32(len);
      if (len > 0) {
        this._push(writeStringBuffer, len, value);
      }
      return this;
    };
  }
  function writeBytesBuffer(val, buf, pos) {
    buf.set(val, pos);
  }
  function writeStringBuffer(val, buf, pos) {
    if (val.length < 40) {
      write(val, buf, pos);
    } else if (buf.utf8Write != null) {
      buf.utf8Write(val, pos);
    } else {
      buf.set(fromString5(val), pos);
    }
  }
  function createWriter() {
    return new Uint8ArrayWriter();
  }

  // node_modules/protons-runtime/dist/src/encode.js
  function encodeMessage(message2, codec) {
    const w = createWriter();
    codec.encode(message2, w, {
      lengthDelimited: false
    });
    return w.finish();
  }

  // node_modules/protons-runtime/dist/src/codec.js
  var CODEC_TYPES;
  (function(CODEC_TYPES2) {
    CODEC_TYPES2[CODEC_TYPES2["VARINT"] = 0] = "VARINT";
    CODEC_TYPES2[CODEC_TYPES2["BIT64"] = 1] = "BIT64";
    CODEC_TYPES2[CODEC_TYPES2["LENGTH_DELIMITED"] = 2] = "LENGTH_DELIMITED";
    CODEC_TYPES2[CODEC_TYPES2["START_GROUP"] = 3] = "START_GROUP";
    CODEC_TYPES2[CODEC_TYPES2["END_GROUP"] = 4] = "END_GROUP";
    CODEC_TYPES2[CODEC_TYPES2["BIT32"] = 5] = "BIT32";
  })(CODEC_TYPES || (CODEC_TYPES = {}));
  function createCodec2(name3, type, encode17, decode25) {
    return {
      name: name3,
      type,
      encode: encode17,
      decode: decode25
    };
  }

  // node_modules/protons-runtime/dist/src/codecs/enum.js
  function enumeration(v) {
    function findValue(val) {
      if (v[val.toString()] == null) {
        throw new Error("Invalid enum value");
      }
      return v[val];
    }
    const encode17 = function enumEncode(val, writer) {
      const enumValue = findValue(val);
      writer.int32(enumValue);
    };
    const decode25 = function enumDecode(reader) {
      const val = reader.int32();
      return findValue(val);
    };
    return createCodec2("enum", CODEC_TYPES.VARINT, encode17, decode25);
  }

  // node_modules/protons-runtime/dist/src/codecs/message.js
  function message(encode17, decode25) {
    return createCodec2("message", CODEC_TYPES.LENGTH_DELIMITED, encode17, decode25);
  }

  // node_modules/ipfs-unixfs/dist/src/unixfs.js
  var Data;
  (function(Data2) {
    let DataType;
    (function(DataType2) {
      DataType2["Raw"] = "Raw";
      DataType2["Directory"] = "Directory";
      DataType2["File"] = "File";
      DataType2["Metadata"] = "Metadata";
      DataType2["Symlink"] = "Symlink";
      DataType2["HAMTShard"] = "HAMTShard";
    })(DataType = Data2.DataType || (Data2.DataType = {}));
    let __DataTypeValues;
    (function(__DataTypeValues2) {
      __DataTypeValues2[__DataTypeValues2["Raw"] = 0] = "Raw";
      __DataTypeValues2[__DataTypeValues2["Directory"] = 1] = "Directory";
      __DataTypeValues2[__DataTypeValues2["File"] = 2] = "File";
      __DataTypeValues2[__DataTypeValues2["Metadata"] = 3] = "Metadata";
      __DataTypeValues2[__DataTypeValues2["Symlink"] = 4] = "Symlink";
      __DataTypeValues2[__DataTypeValues2["HAMTShard"] = 5] = "HAMTShard";
    })(__DataTypeValues || (__DataTypeValues = {}));
    (function(DataType2) {
      DataType2.codec = () => {
        return enumeration(__DataTypeValues);
      };
    })(DataType = Data2.DataType || (Data2.DataType = {}));
    let _codec;
    Data2.codec = () => {
      if (_codec == null) {
        _codec = message((obj, w, opts = {}) => {
          if (opts.lengthDelimited !== false) {
            w.fork();
          }
          if (obj.Type != null) {
            w.uint32(8);
            Data2.DataType.codec().encode(obj.Type, w);
          }
          if (obj.Data != null) {
            w.uint32(18);
            w.bytes(obj.Data);
          }
          if (obj.filesize != null) {
            w.uint32(24);
            w.uint64(obj.filesize);
          }
          if (obj.blocksizes != null) {
            for (const value of obj.blocksizes) {
              w.uint32(32);
              w.uint64(value);
            }
          }
          if (obj.hashType != null) {
            w.uint32(40);
            w.uint64(obj.hashType);
          }
          if (obj.fanout != null) {
            w.uint32(48);
            w.uint64(obj.fanout);
          }
          if (obj.mode != null) {
            w.uint32(56);
            w.uint32(obj.mode);
          }
          if (obj.mtime != null) {
            w.uint32(66);
            UnixTime.codec().encode(obj.mtime, w);
          }
          if (opts.lengthDelimited !== false) {
            w.ldelim();
          }
        }, (reader, length6) => {
          const obj = {
            blocksizes: []
          };
          const end = length6 == null ? reader.len : reader.pos + length6;
          while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                obj.Type = Data2.DataType.codec().decode(reader);
                break;
              case 2:
                obj.Data = reader.bytes();
                break;
              case 3:
                obj.filesize = reader.uint64();
                break;
              case 4:
                obj.blocksizes.push(reader.uint64());
                break;
              case 5:
                obj.hashType = reader.uint64();
                break;
              case 6:
                obj.fanout = reader.uint64();
                break;
              case 7:
                obj.mode = reader.uint32();
                break;
              case 8:
                obj.mtime = UnixTime.codec().decode(reader, reader.uint32());
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return obj;
        });
      }
      return _codec;
    };
    Data2.encode = (obj) => {
      return encodeMessage(obj, Data2.codec());
    };
    Data2.decode = (buf) => {
      return decodeMessage(buf, Data2.codec());
    };
  })(Data || (Data = {}));
  var UnixTime;
  (function(UnixTime2) {
    let _codec;
    UnixTime2.codec = () => {
      if (_codec == null) {
        _codec = message((obj, w, opts = {}) => {
          if (opts.lengthDelimited !== false) {
            w.fork();
          }
          if (obj.Seconds != null) {
            w.uint32(8);
            w.int64(obj.Seconds);
          }
          if (obj.FractionalNanoseconds != null) {
            w.uint32(21);
            w.fixed32(obj.FractionalNanoseconds);
          }
          if (opts.lengthDelimited !== false) {
            w.ldelim();
          }
        }, (reader, length6) => {
          const obj = {};
          const end = length6 == null ? reader.len : reader.pos + length6;
          while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                obj.Seconds = reader.int64();
                break;
              case 2:
                obj.FractionalNanoseconds = reader.fixed32();
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return obj;
        });
      }
      return _codec;
    };
    UnixTime2.encode = (obj) => {
      return encodeMessage(obj, UnixTime2.codec());
    };
    UnixTime2.decode = (buf) => {
      return decodeMessage(buf, UnixTime2.codec());
    };
  })(UnixTime || (UnixTime = {}));
  var Metadata;
  (function(Metadata2) {
    let _codec;
    Metadata2.codec = () => {
      if (_codec == null) {
        _codec = message((obj, w, opts = {}) => {
          if (opts.lengthDelimited !== false) {
            w.fork();
          }
          if (obj.MimeType != null) {
            w.uint32(10);
            w.string(obj.MimeType);
          }
          if (opts.lengthDelimited !== false) {
            w.ldelim();
          }
        }, (reader, length6) => {
          const obj = {};
          const end = length6 == null ? reader.len : reader.pos + length6;
          while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
              case 1:
                obj.MimeType = reader.string();
                break;
              default:
                reader.skipType(tag & 7);
                break;
            }
          }
          return obj;
        });
      }
      return _codec;
    };
    Metadata2.encode = (obj) => {
      return encodeMessage(obj, Metadata2.codec());
    };
    Metadata2.decode = (buf) => {
      return decodeMessage(buf, Metadata2.codec());
    };
  })(Metadata || (Metadata = {}));

  // node_modules/ipfs-unixfs/dist/src/index.js
  var types = {
    Raw: "raw",
    Directory: "directory",
    File: "file",
    Metadata: "metadata",
    Symlink: "symlink",
    HAMTShard: "hamt-sharded-directory"
  };
  var dirTypes = [
    "directory",
    "hamt-sharded-directory"
  ];
  var DEFAULT_FILE_MODE = parseInt("0644", 8);
  var DEFAULT_DIRECTORY_MODE = parseInt("0755", 8);
  var MAX_FANOUT = BigInt(1 << 10);
  var UnixFS = class _UnixFS {
    /**
     * Decode from protobuf https://github.com/ipfs/specs/blob/master/UNIXFS.md
     */
    static unmarshal(marshaled) {
      const message2 = Data.decode(marshaled);
      if (message2.fanout != null && message2.fanout > MAX_FANOUT) {
        throw new InvalidUnixFSMessageError(`Fanout size was too large - ${message2.fanout} > ${MAX_FANOUT}`);
      }
      const data = new _UnixFS({
        type: types[message2.Type != null ? message2.Type.toString() : "File"],
        data: message2.Data,
        blockSizes: message2.blocksizes,
        mode: message2.mode,
        mtime: message2.mtime != null ? {
          secs: message2.mtime.Seconds ?? 0n,
          nsecs: message2.mtime.FractionalNanoseconds
        } : void 0,
        fanout: message2.fanout
      });
      data._originalMode = message2.mode ?? 0;
      return data;
    }
    type;
    data;
    blockSizes;
    hashType;
    fanout;
    mtime;
    _mode;
    _originalMode;
    constructor(options = {
      type: "file"
    }) {
      const { type, data, blockSizes, hashType, fanout, mtime, mode } = options;
      if (type != null && !Object.values(types).includes(type)) {
        throw new InvalidTypeError("Type: " + type + " is not valid");
      }
      this.type = type ?? "file";
      this.data = data;
      this.hashType = hashType;
      this.fanout = fanout;
      this.blockSizes = blockSizes ?? [];
      this._originalMode = 0;
      this.mode = mode;
      this.mtime = mtime;
    }
    set mode(mode) {
      if (mode == null) {
        this._mode = this.isDirectory() ? DEFAULT_DIRECTORY_MODE : DEFAULT_FILE_MODE;
      } else {
        this._mode = mode & 4095;
      }
    }
    get mode() {
      return this._mode;
    }
    isDirectory() {
      return dirTypes.includes(this.type);
    }
    addBlockSize(size) {
      this.blockSizes.push(size);
    }
    removeBlockSize(index) {
      this.blockSizes.splice(index, 1);
    }
    /**
     * Returns `0n` for directories or `data.length + sum(blockSizes)` for everything else
     */
    fileSize() {
      if (this.isDirectory()) {
        return 0n;
      }
      let sum = 0n;
      this.blockSizes.forEach((size) => {
        sum += size;
      });
      if (this.data != null) {
        sum += BigInt(this.data.length);
      }
      return sum;
    }
    /**
     * encode to protobuf Uint8Array
     */
    marshal() {
      let type;
      switch (this.type) {
        case "raw":
          type = Data.DataType.Raw;
          break;
        case "directory":
          type = Data.DataType.Directory;
          break;
        case "file":
          type = Data.DataType.File;
          break;
        case "metadata":
          type = Data.DataType.Metadata;
          break;
        case "symlink":
          type = Data.DataType.Symlink;
          break;
        case "hamt-sharded-directory":
          type = Data.DataType.HAMTShard;
          break;
        default:
          throw new InvalidTypeError(`Type: ${type} is not valid`);
      }
      let data = this.data;
      if (this.data == null || this.data.length === 0) {
        data = void 0;
      }
      let mode;
      if (this.mode != null) {
        mode = this._originalMode & 4294963200 | (this.mode ?? 0);
        if (mode === DEFAULT_FILE_MODE && !this.isDirectory()) {
          mode = void 0;
        }
        if (mode === DEFAULT_DIRECTORY_MODE && this.isDirectory()) {
          mode = void 0;
        }
      }
      let mtime;
      if (this.mtime != null) {
        mtime = {
          Seconds: this.mtime.secs,
          FractionalNanoseconds: this.mtime.nsecs
        };
      }
      return Data.encode({
        Type: type,
        Data: data,
        filesize: this.isDirectory() ? void 0 : this.fileSize(),
        blocksizes: this.blockSizes,
        hashType: this.hashType,
        fanout: this.fanout,
        mode,
        mtime
      });
    }
  };

  // node_modules/@multiformats/murmur3/node_modules/multiformats/dist/src/bytes.js
  var empty3 = new Uint8Array(0);
  function isByteArrayWithArrayBuffer2(b) {
    return b?.buffer instanceof ArrayBuffer;
  }
  function toArrayBufferBackedArray2(b) {
    if (isByteArrayWithArrayBuffer2(b)) {
      return b;
    }
    return b.slice();
  }

  // node_modules/@multiformats/murmur3/node_modules/multiformats/dist/src/vendor/varint.js
  var encode_13 = encode12;
  var MSB4 = 128;
  var REST4 = 127;
  var MSBALL3 = ~REST4;
  var INT3 = Math.pow(2, 31);
  function encode12(num, out, offset) {
    out = out || [];
    offset = offset || 0;
    var oldOffset = offset;
    while (num >= INT3) {
      out[offset++] = num & 255 | MSB4;
      num /= 128;
    }
    while (num & MSBALL3) {
      out[offset++] = num & 255 | MSB4;
      num >>>= 7;
    }
    out[offset] = num | 0;
    encode12.bytes = offset - oldOffset + 1;
    return out;
  }
  var decode18 = read4;
  var MSB$13 = 128;
  var REST$13 = 127;
  function read4(buf, offset) {
    var res = 0, offset = offset || 0, shift = 0, counter = offset, b, l = buf.length;
    do {
      if (counter >= l) {
        read4.bytes = 0;
        throw new RangeError("Could not decode varint");
      }
      b = buf[counter++];
      res += shift < 28 ? (b & REST$13) << shift : (b & REST$13) * Math.pow(2, shift);
      shift += 7;
    } while (b >= MSB$13);
    read4.bytes = counter - offset;
    return res;
  }
  var N14 = Math.pow(2, 7);
  var N24 = Math.pow(2, 14);
  var N34 = Math.pow(2, 21);
  var N44 = Math.pow(2, 28);
  var N54 = Math.pow(2, 35);
  var N64 = Math.pow(2, 42);
  var N74 = Math.pow(2, 49);
  var N83 = Math.pow(2, 56);
  var N93 = Math.pow(2, 63);
  var length4 = function(value) {
    return value < N14 ? 1 : value < N24 ? 2 : value < N34 ? 3 : value < N44 ? 4 : value < N54 ? 5 : value < N64 ? 6 : value < N74 ? 7 : value < N83 ? 8 : value < N93 ? 9 : 10;
  };
  var varint6 = {
    encode: encode_13,
    decode: decode18,
    encodingLength: length4
  };
  var _brrp_varint3 = varint6;
  var varint_default3 = _brrp_varint3;

  // node_modules/@multiformats/murmur3/node_modules/multiformats/dist/src/varint.js
  function encodeTo3(int, target, offset = 0) {
    varint_default3.encode(int, target, offset);
    return target;
  }
  function encodingLength4(int) {
    return varint_default3.encodingLength(int);
  }

  // node_modules/@multiformats/murmur3/node_modules/multiformats/dist/src/hashes/digest.js
  function create4(code8, digest3) {
    const size = digest3.byteLength;
    const sizeOffset = encodingLength4(code8);
    const digestOffset = sizeOffset + encodingLength4(size);
    const bytes = new Uint8Array(digestOffset + size);
    encodeTo3(code8, bytes, 0);
    encodeTo3(size, bytes, sizeOffset);
    bytes.set(digest3, digestOffset);
    return new Digest3(code8, size, digest3, bytes);
  }
  var Digest3 = class {
    code;
    size;
    digest;
    bytes;
    /**
     * Creates a multihash digest.
     */
    constructor(code8, size, digest3, bytes) {
      this.code = code8;
      this.size = size;
      this.digest = toArrayBufferBackedArray2(digest3);
      this.bytes = toArrayBufferBackedArray2(bytes);
    }
  };

  // node_modules/@multiformats/murmur3/node_modules/multiformats/dist/src/hashes/hasher.js
  var DEFAULT_MIN_DIGEST_LENGTH2 = 20;
  function from4({ name: name3, code: code8, encode: encode17, minDigestLength, maxDigestLength }) {
    return new Hasher2(name3, code8, encode17, minDigestLength, maxDigestLength);
  }
  var Hasher2 = class {
    name;
    code;
    encode;
    minDigestLength;
    maxDigestLength;
    constructor(name3, code8, encode17, minDigestLength, maxDigestLength) {
      this.name = name3;
      this.code = code8;
      this.encode = encode17;
      this.minDigestLength = minDigestLength ?? DEFAULT_MIN_DIGEST_LENGTH2;
      this.maxDigestLength = maxDigestLength;
    }
    digest(input, options) {
      if (options?.truncate != null) {
        if (options.truncate < this.minDigestLength) {
          throw new Error(`Invalid truncate option, must be greater than or equal to ${this.minDigestLength}`);
        }
        if (this.maxDigestLength != null && options.truncate > this.maxDigestLength) {
          throw new Error(`Invalid truncate option, must be less than or equal to ${this.maxDigestLength}`);
        }
      }
      if (input instanceof Uint8Array) {
        const result = this.encode(input);
        if (result instanceof Uint8Array) {
          return createDigest2(result, this.code, options?.truncate);
        }
        return result.then((digest3) => createDigest2(digest3, this.code, options?.truncate));
      } else {
        throw Error("Unknown type, must be binary type");
      }
    }
  };
  function createDigest2(digest3, code8, truncate) {
    if (truncate != null && truncate !== digest3.byteLength) {
      if (truncate > digest3.byteLength) {
        throw new Error(`Invalid truncate option, must be less than or equal to ${digest3.byteLength}`);
      }
      digest3 = digest3.subarray(0, truncate);
    }
    return create4(code8, digest3);
  }

  // node_modules/@multiformats/murmur3/src/vendor/murmur.js
  function add64(a, b) {
    const lo = a.lo + b.lo >>> 0;
    const hi = a.hi + b.hi + (lo < a.lo ? 1 : 0) >>> 0;
    return { lo, hi };
  }
  function add32(a, b) {
    return a + b >>> 0;
  }
  function mul64(a, b) {
    const al = a.lo & 65535;
    const ah = a.lo >>> 16;
    const bl = b.lo & 65535;
    const bh = b.lo >>> 16;
    const p0 = al * bl;
    const p1 = al * bh;
    const p2 = ah * bl;
    const p3 = ah * bh;
    const lo1 = (p0 >>> 16) + (p1 & 65535) + (p2 & 65535) >>> 0;
    const lo = (lo1 << 16 | p0 & 65535) >>> 0;
    const hi0 = p3 + (p1 >>> 16) + (p2 >>> 16) + (lo1 >>> 16);
    const hi1 = Math.imul(a.lo, b.hi);
    const hi2 = Math.imul(a.hi, b.lo);
    const hi = hi0 + hi1 + hi2 >>> 0;
    return { lo, hi };
  }
  function mul32(a, b) {
    return Math.imul(a, b) >>> 0;
  }
  function rotl64(x, n) {
    if (n === 0) {
      return x;
    }
    if (n === 32) {
      return { lo: x.hi, hi: x.lo };
    }
    if (n < 32) {
      const lo2 = (x.lo << n | x.hi >>> 32 - n) >>> 0;
      const hi2 = (x.hi << n | x.lo >>> 32 - n) >>> 0;
      return { lo: lo2, hi: hi2 };
    }
    n -= 32;
    const lo = (x.hi << n | x.lo >>> 32 - n) >>> 0;
    const hi = (x.lo << n | x.hi >>> 32 - n) >>> 0;
    return { lo, hi };
  }
  function xor64(a, b) {
    return { lo: (a.lo ^ b.lo) >>> 0, hi: (a.hi ^ b.hi) >>> 0 };
  }
  function shr64(x, n) {
    if (n === 0) {
      return x;
    }
    if (n < 32) {
      const lo = (x.lo >>> n | x.hi << 32 - n) >>> 0;
      const hi = x.hi >>> n;
      return { lo, hi };
    }
    return { lo: x.hi >>> n - 32, hi: 0 };
  }
  function u64(lo, hi) {
    return { lo: lo >>> 0, hi: hi >>> 0 };
  }
  function rotl32(x, r) {
    return (x << r | x >>> 32 - r) >>> 0;
  }
  function getBlock64(key, i) {
    const offset = i * 8;
    const lo = key[offset] | key[offset + 1] << 8 | key[offset + 2] << 16 | key[offset + 3] << 24;
    const hi = key[offset + 4] | key[offset + 5] << 8 | key[offset + 6] << 16 | key[offset + 7] << 24;
    return { lo: lo >>> 0, hi: hi >>> 0 };
  }
  function getBlock32(key, i) {
    const offset = i * 4;
    return (key[offset] | key[offset + 1] << 8 | key[offset + 2] << 16 | key[offset + 3] << 24) >>> 0;
  }
  function fmix64(k) {
    k = xor64(k, shr64(k, 33));
    k = mul64(k, u64(3981806797, 4283543511));
    k = xor64(k, shr64(k, 33));
    k = mul64(k, u64(444984403, 3301882366));
    k = xor64(k, shr64(k, 33));
    return k;
  }
  function fmix32(k) {
    k ^= k >>> 16;
    k = mul32(k, 2246822507);
    k ^= k >>> 13;
    k = mul32(k, 3266489909);
    k ^= k >>> 16;
    return k;
  }
  function murmurHash3_x64_128(key, seed = 0) {
    let h1 = u64(seed, 0);
    let h2 = u64(seed, 0);
    const length6 = key.length;
    const blocks = Math.floor(length6 / 16);
    const c1 = u64(289559509, 2277735313);
    const c2 = u64(658871167, 1291169091);
    for (let i = 0; i < blocks; i++) {
      let k12 = getBlock64(key, i * 2);
      let k22 = getBlock64(key, i * 2 + 1);
      k12 = mul64(k12, c1);
      k12 = rotl64(k12, 31);
      k12 = mul64(k12, c2);
      h1 = xor64(h1, k12);
      h1 = rotl64(h1, 27);
      h1 = add64(h1, h2);
      h1 = add64(mul64(h1, u64(5, 0)), u64(1390208809, 0));
      k22 = mul64(k22, c2);
      k22 = rotl64(k22, 33);
      k22 = mul64(k22, c1);
      h2 = xor64(h2, k22);
      h2 = rotl64(h2, 31);
      h2 = add64(h2, h1);
      h2 = add64(mul64(h2, u64(5, 0)), u64(944331445, 0));
    }
    let k1 = u64(0, 0);
    let k2 = u64(0, 0);
    const tail = key.slice(blocks * 16);
    switch (tail.length) {
      case 15:
        k2 = xor64(k2, u64(0, tail[14] << 16));
      // fallthrough
      case 14:
        k2 = xor64(k2, u64(0, tail[13] << 8));
      // fallthrough
      case 13:
        k2 = xor64(k2, u64(0, tail[12]));
      // fallthrough
      case 12:
        k2 = xor64(k2, u64(tail[11] << 24, 0));
      // fallthrough
      case 11:
        k2 = xor64(k2, u64(tail[10] << 16, 0));
      // fallthrough
      case 10:
        k2 = xor64(k2, u64(tail[9] << 8, 0));
      // fallthrough
      case 9:
        k2 = xor64(k2, u64(tail[8], 0));
        k2 = mul64(k2, c2);
        k2 = rotl64(k2, 33);
        k2 = mul64(k2, c1);
        h2 = xor64(h2, k2);
      // fallthrough
      case 8:
        k1 = xor64(k1, u64(0, tail[7] << 24));
      // fallthrough
      case 7:
        k1 = xor64(k1, u64(0, tail[6] << 16));
      // fallthrough
      case 6:
        k1 = xor64(k1, u64(0, tail[5] << 8));
      // fallthrough
      case 5:
        k1 = xor64(k1, u64(0, tail[4]));
      // fallthrough
      case 4:
        k1 = xor64(k1, u64(tail[3] << 24, 0));
      // fallthrough
      case 3:
        k1 = xor64(k1, u64(tail[2] << 16, 0));
      // fallthrough
      case 2:
        k1 = xor64(k1, u64(tail[1] << 8, 0));
      // fallthrough
      case 1:
        k1 = xor64(k1, u64(tail[0], 0));
        k1 = mul64(k1, c1);
        k1 = rotl64(k1, 31);
        k1 = mul64(k1, c2);
        h1 = xor64(h1, k1);
    }
    const len64 = u64(length6, 0);
    h1 = xor64(h1, len64);
    h2 = xor64(h2, len64);
    h1 = add64(h1, h2);
    h2 = add64(h2, h1);
    h1 = fmix64(h1);
    h2 = fmix64(h2);
    h1 = add64(h1, h2);
    h2 = add64(h2, h1);
    return new Uint8Array([
      h1.hi >>> 24 & 255,
      h1.hi >>> 16 & 255,
      h1.hi >>> 8 & 255,
      h1.hi & 255,
      h1.lo >>> 24 & 255,
      h1.lo >>> 16 & 255,
      h1.lo >>> 8 & 255,
      h1.lo & 255,
      h2.hi >>> 24 & 255,
      h2.hi >>> 16 & 255,
      h2.hi >>> 8 & 255,
      h2.hi & 255,
      h2.lo >>> 24 & 255,
      h2.lo >>> 16 & 255,
      h2.lo >>> 8 & 255,
      h2.lo & 255
    ]);
  }
  function murmurHash3_x86_32(key, seed = 0) {
    let h1 = seed >>> 0;
    const length6 = key.length;
    const blocks = Math.floor(length6 / 4);
    const c1 = 3432918353;
    const c2 = 461845907;
    for (let i = 0; i < blocks; i++) {
      let k12 = getBlock32(key, i);
      k12 = mul32(k12, c1);
      k12 = rotl32(k12, 15);
      k12 = mul32(k12, c2);
      h1 ^= k12;
      h1 = rotl32(h1, 13);
      h1 = add32(mul32(h1, 5), 3864292196);
    }
    const tail = key.slice(blocks * 4);
    let k1 = 0;
    switch (tail.length) {
      case 3:
        k1 ^= tail[2] << 16;
      // fallthrough
      case 2:
        k1 ^= tail[1] << 8;
      // fallthrough
      case 1:
        k1 ^= tail[0];
        k1 = mul32(k1, c1);
        k1 = rotl32(k1, 15);
        k1 = mul32(k1, c2);
        h1 ^= k1;
    }
    h1 ^= length6;
    h1 = fmix32(h1);
    return h1;
  }

  // node_modules/@multiformats/murmur3/src/index.js
  function fromNumberTo32BitBuf(number) {
    const bytes = new Array(4);
    for (let i = 0; i < 4; i++) {
      bytes[i] = number & 255;
      number = number >> 8;
    }
    return new Uint8Array(bytes);
  }
  var murmur332 = from4({
    name: "murmur3-32",
    code: 35,
    encode: (input) => fromNumberTo32BitBuf(murmurHash3_x86_32(input))
  });
  var murmur3128 = from4({
    name: "murmur3-128",
    code: 34,
    encode: (input) => murmurHash3_x64_128(input)
  });
  var murmur364 = from4({
    name: "murmur3-x64-64",
    code: 34,
    encode: (input) => murmurHash3_x64_128(input).subarray(0, 8)
  });

  // node_modules/hamt-sharding/dist/src/bucket.js
  var import_sparse_array = __toESM(require_sparse_array(), 1);

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/bases/base10.js
  var base10_exports2 = {};
  __export(base10_exports2, {
    base10: () => base102
  });

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/bytes.js
  var empty4 = new Uint8Array(0);
  function equals6(aa, bb) {
    if (aa === bb) {
      return true;
    }
    if (aa.byteLength !== bb.byteLength) {
      return false;
    }
    for (let ii = 0; ii < aa.byteLength; ii++) {
      if (aa[ii] !== bb[ii]) {
        return false;
      }
    }
    return true;
  }
  function coerce4(o) {
    if (o instanceof Uint8Array && o.constructor.name === "Uint8Array") {
      return toArrayBufferBackedArray3(o);
    }
    if (o instanceof ArrayBuffer) {
      return new Uint8Array(o);
    }
    if (ArrayBuffer.isView(o)) {
      return toArrayBufferBackedArray3(new Uint8Array(o.buffer, o.byteOffset, o.byteLength));
    }
    throw new Error("Unknown type, must be binary type");
  }
  function fromString6(str) {
    const output = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      output[i] = str.charCodeAt(i);
    }
    return output;
  }
  var MAX_ARGUMENTS_LENGTH2 = 4096;
  function toString2(b) {
    const len = b.length;
    if (len <= MAX_ARGUMENTS_LENGTH2) {
      return String.fromCharCode.apply(String, b);
    }
    let res = "";
    let i = 0;
    while (i < len) {
      res += String.fromCharCode.apply(
        String,
        // @ts-expect-error cannot ordinarily apply a Uint8Array
        b.subarray(i, i += MAX_ARGUMENTS_LENGTH2)
      );
    }
    return res;
  }
  function isByteArrayWithArrayBuffer3(b) {
    return b?.buffer instanceof ArrayBuffer;
  }
  function toArrayBufferBackedArray3(b) {
    if (isByteArrayWithArrayBuffer3(b)) {
      return b;
    }
    return b.slice();
  }

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/vendor/base-x.js
  function base3(ALPHABET, name3, caseInsensitive) {
    if (ALPHABET.length >= 255) {
      throw new TypeError("Alphabet too long");
    }
    var BASE_MAP = new Uint8Array(256);
    for (var j = 0; j < BASE_MAP.length; j++) {
      BASE_MAP[j] = 255;
    }
    for (var i = 0; i < ALPHABET.length; i++) {
      var x = ALPHABET.charAt(i);
      var xc = x.charCodeAt(0);
      if (BASE_MAP[xc] !== 255) {
        throw new TypeError(x + " is ambiguous");
      }
      BASE_MAP[xc] = i;
      if (caseInsensitive) {
        var xl = x.toLowerCase().charCodeAt(0);
        var xu = x.toUpperCase().charCodeAt(0);
        if (xl !== xc) {
          BASE_MAP[xl] = i;
        }
        if (xu !== xc) {
          BASE_MAP[xu] = i;
        }
      }
    }
    var BASE = ALPHABET.length;
    var LEADER = ALPHABET.charAt(0);
    var FACTOR = Math.log(BASE) / Math.log(256);
    var iFACTOR = Math.log(256) / Math.log(BASE);
    function encode17(source) {
      if (source instanceof Uint8Array)
        ;
      else if (ArrayBuffer.isView(source)) {
        source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
      } else if (Array.isArray(source)) {
        source = Uint8Array.from(source);
      }
      if (!(source instanceof Uint8Array)) {
        throw new TypeError("Expected Uint8Array");
      }
      if (source.length === 0) {
        return "";
      }
      var zeroes = 0;
      var length6 = 0;
      var pbegin = 0;
      var pend = source.length;
      while (pbegin !== pend && source[pbegin] === 0) {
        pbegin++;
        zeroes++;
      }
      var size = (pend - pbegin) * iFACTOR + 1 >>> 0;
      var b58 = new Uint8Array(size);
      while (pbegin !== pend) {
        var carry = source[pbegin];
        var i2 = 0;
        for (var it1 = size - 1; (carry !== 0 || i2 < length6) && it1 !== -1; it1--, i2++) {
          carry += 256 * b58[it1] >>> 0;
          b58[it1] = carry % BASE >>> 0;
          carry = carry / BASE >>> 0;
        }
        if (carry !== 0) {
          throw new Error("Non-zero carry");
        }
        length6 = i2;
        pbegin++;
      }
      var it2 = size - length6;
      while (it2 !== size && b58[it2] === 0) {
        it2++;
      }
      var str = LEADER.repeat(zeroes);
      for (; it2 < size; ++it2) {
        str += ALPHABET.charAt(b58[it2]);
      }
      return str;
    }
    function decodeUnsafe(source) {
      if (typeof source !== "string") {
        throw new TypeError("Expected String");
      }
      if (source.length === 0) {
        return new Uint8Array();
      }
      var psz = 0;
      if (source[psz] === " ") {
        return;
      }
      var zeroes = 0;
      var length6 = 0;
      while (source[psz] === LEADER) {
        zeroes++;
        psz++;
      }
      var size = (source.length - psz) * FACTOR + 1 >>> 0;
      var b256 = new Uint8Array(size);
      while (source[psz]) {
        var carry = BASE_MAP[source.charCodeAt(psz)];
        if (carry === 255) {
          return;
        }
        var i2 = 0;
        for (var it3 = size - 1; (carry !== 0 || i2 < length6) && it3 !== -1; it3--, i2++) {
          carry += BASE * b256[it3] >>> 0;
          b256[it3] = carry % 256 >>> 0;
          carry = carry / 256 >>> 0;
        }
        if (carry !== 0) {
          throw new Error("Non-zero carry");
        }
        length6 = i2;
        psz++;
      }
      if (source[psz] === " ") {
        return;
      }
      var it4 = size - length6;
      while (it4 !== size && b256[it4] === 0) {
        it4++;
      }
      var vch = new Uint8Array(zeroes + (size - it4));
      var j2 = zeroes;
      while (it4 !== size) {
        vch[j2++] = b256[it4++];
      }
      return vch;
    }
    function decode25(string3) {
      var buffer4 = decodeUnsafe(string3);
      if (buffer4) {
        return buffer4;
      }
      throw new Error(`Non-${name3} character`);
    }
    return {
      encode: encode17,
      decodeUnsafe,
      decode: decode25
    };
  }
  var src3 = base3;
  var _brrp__multiformats_scope_baseX3 = src3;
  var base_x_default3 = _brrp__multiformats_scope_baseX3;

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/bases/base.js
  var Encoder3 = class {
    name;
    prefix;
    baseEncode;
    constructor(name3, prefix, baseEncode) {
      this.name = name3;
      this.prefix = prefix;
      this.baseEncode = baseEncode;
    }
    encode(bytes) {
      if (bytes instanceof Uint8Array) {
        return `${this.prefix}${this.baseEncode(bytes)}`;
      } else {
        throw Error("Unknown type, must be binary type");
      }
    }
  };
  var Decoder3 = class {
    name;
    prefix;
    baseDecode;
    prefixCodePoint;
    constructor(name3, prefix, baseDecode) {
      this.name = name3;
      this.prefix = prefix;
      const prefixCodePoint = prefix.codePointAt(0);
      if (prefixCodePoint === void 0) {
        throw new Error("Invalid prefix character");
      }
      this.prefixCodePoint = prefixCodePoint;
      this.baseDecode = baseDecode;
    }
    decode(text) {
      if (typeof text === "string") {
        if (text.codePointAt(0) !== this.prefixCodePoint) {
          throw Error(`Unable to decode multibase string ${JSON.stringify(text)}, ${this.name} decoder only supports inputs prefixed with ${this.prefix}`);
        }
        return this.baseDecode(text.slice(this.prefix.length));
      } else {
        throw Error("Can only multibase decode strings");
      }
    }
    or(decoder) {
      return or3(this, decoder);
    }
  };
  var ComposedDecoder3 = class {
    decoders;
    constructor(decoders) {
      this.decoders = decoders;
    }
    or(decoder) {
      return or3(this, decoder);
    }
    decode(input) {
      const prefix = input[0];
      const decoder = this.decoders[prefix];
      if (decoder != null) {
        return decoder.decode(input);
      } else {
        throw RangeError(`Unable to decode multibase string ${JSON.stringify(input)}, only inputs prefixed with ${Object.keys(this.decoders)} are supported`);
      }
    }
  };
  function or3(left, right) {
    return new ComposedDecoder3({
      ...left.decoders ?? { [left.prefix]: left },
      ...right.decoders ?? { [right.prefix]: right }
    });
  }
  var Codec3 = class {
    name;
    prefix;
    baseEncode;
    baseDecode;
    encoder;
    decoder;
    constructor(name3, prefix, baseEncode, baseDecode) {
      this.name = name3;
      this.prefix = prefix;
      this.baseEncode = baseEncode;
      this.baseDecode = baseDecode;
      this.encoder = new Encoder3(name3, prefix, baseEncode);
      this.decoder = new Decoder3(name3, prefix, baseDecode);
    }
    encode(input) {
      return this.encoder.encode(input);
    }
    decode(input) {
      return this.decoder.decode(input);
    }
  };
  function from5({ name: name3, prefix, encode: encode17, decode: decode25 }) {
    return new Codec3(name3, prefix, encode17, decode25);
  }
  function baseX3({ name: name3, prefix, alphabet: alphabet3, caseInsensitive = false }) {
    const { encode: encode17, decode: decode25 } = base_x_default3(alphabet3, name3, caseInsensitive);
    return from5({
      prefix,
      name: name3,
      encode: encode17,
      decode: (text) => coerce4(decode25(text))
    });
  }
  function decode20(string3, alphabetIdx, bitsPerChar, name3) {
    let end = string3.length;
    while (string3[end - 1] === "=") {
      --end;
    }
    const out = new Uint8Array(end * bitsPerChar / 8 | 0);
    let bits = 0;
    let buffer4 = 0;
    let written = 0;
    for (let i = 0; i < end; ++i) {
      const value = alphabetIdx[string3[i]];
      if (value === void 0) {
        throw new SyntaxError(`Non-${name3} character`);
      }
      buffer4 = buffer4 << bitsPerChar | value;
      bits += bitsPerChar;
      if (bits >= 8) {
        bits -= 8;
        out[written++] = 255 & buffer4 >> bits;
      }
    }
    if (bits >= bitsPerChar || (255 & buffer4 << 8 - bits) !== 0) {
      throw new SyntaxError("Unexpected end of data");
    }
    return out;
  }
  function encode13(data, alphabet3, bitsPerChar) {
    const pad = alphabet3[alphabet3.length - 1] === "=";
    const mask = (1 << bitsPerChar) - 1;
    let out = "";
    let bits = 0;
    let buffer4 = 0;
    for (let i = 0; i < data.length; ++i) {
      buffer4 = buffer4 << 8 | data[i];
      bits += 8;
      while (bits > bitsPerChar) {
        bits -= bitsPerChar;
        out += alphabet3[mask & buffer4 >> bits];
      }
    }
    if (bits !== 0) {
      out += alphabet3[mask & buffer4 << bitsPerChar - bits];
    }
    if (pad) {
      while ((out.length * bitsPerChar & 7) !== 0) {
        out += "=";
      }
    }
    return out;
  }
  function createAlphabetIdx3(alphabet3, caseInsensitive) {
    const alphabetIdx = {};
    for (let i = 0; i < alphabet3.length; ++i) {
      alphabetIdx[alphabet3[i]] = i;
      if (caseInsensitive) {
        const lower = alphabet3[i].toLowerCase();
        const upper = alphabet3[i].toUpperCase();
        if (lower !== alphabet3[i]) {
          alphabetIdx[lower] = i;
        }
        if (upper !== alphabet3[i]) {
          alphabetIdx[upper] = i;
        }
      }
    }
    return alphabetIdx;
  }
  function rfc46483({ name: name3, prefix, bitsPerChar, alphabet: alphabet3, caseInsensitive = false }) {
    const alphabetIdx = createAlphabetIdx3(alphabet3, caseInsensitive);
    return from5({
      prefix,
      name: name3,
      encode(input) {
        return encode13(input, alphabet3, bitsPerChar);
      },
      decode(input) {
        return decode20(input, alphabetIdx, bitsPerChar, name3);
      }
    });
  }

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/bases/base10.js
  var base102 = baseX3({
    prefix: "9",
    name: "base10",
    alphabet: "0123456789"
  });

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/bases/base16.js
  var base16_exports2 = {};
  __export(base16_exports2, {
    base16: () => base162,
    base16upper: () => base16upper2
  });
  var base162 = rfc46483({
    prefix: "f",
    name: "base16",
    alphabet: "0123456789abcdef",
    bitsPerChar: 4,
    caseInsensitive: true
  });
  var base16upper2 = rfc46483({
    prefix: "F",
    name: "base16upper",
    alphabet: "0123456789ABCDEF",
    bitsPerChar: 4,
    caseInsensitive: true
  });

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/bases/base2.js
  var base2_exports2 = {};
  __export(base2_exports2, {
    base2: () => base23
  });
  var base23 = rfc46483({
    prefix: "0",
    name: "base2",
    alphabet: "01",
    bitsPerChar: 1
  });

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/bases/base256emoji.js
  var base256emoji_exports2 = {};
  __export(base256emoji_exports2, {
    base256emoji: () => base256emoji2
  });
  var alphabet2 = Array.from("\u{1F680}\u{1FA90}\u2604\u{1F6F0}\u{1F30C}\u{1F311}\u{1F312}\u{1F313}\u{1F314}\u{1F315}\u{1F316}\u{1F317}\u{1F318}\u{1F30D}\u{1F30F}\u{1F30E}\u{1F409}\u2600\u{1F4BB}\u{1F5A5}\u{1F4BE}\u{1F4BF}\u{1F602}\u2764\u{1F60D}\u{1F923}\u{1F60A}\u{1F64F}\u{1F495}\u{1F62D}\u{1F618}\u{1F44D}\u{1F605}\u{1F44F}\u{1F601}\u{1F525}\u{1F970}\u{1F494}\u{1F496}\u{1F499}\u{1F622}\u{1F914}\u{1F606}\u{1F644}\u{1F4AA}\u{1F609}\u263A\u{1F44C}\u{1F917}\u{1F49C}\u{1F614}\u{1F60E}\u{1F607}\u{1F339}\u{1F926}\u{1F389}\u{1F49E}\u270C\u2728\u{1F937}\u{1F631}\u{1F60C}\u{1F338}\u{1F64C}\u{1F60B}\u{1F497}\u{1F49A}\u{1F60F}\u{1F49B}\u{1F642}\u{1F493}\u{1F929}\u{1F604}\u{1F600}\u{1F5A4}\u{1F603}\u{1F4AF}\u{1F648}\u{1F447}\u{1F3B6}\u{1F612}\u{1F92D}\u2763\u{1F61C}\u{1F48B}\u{1F440}\u{1F62A}\u{1F611}\u{1F4A5}\u{1F64B}\u{1F61E}\u{1F629}\u{1F621}\u{1F92A}\u{1F44A}\u{1F973}\u{1F625}\u{1F924}\u{1F449}\u{1F483}\u{1F633}\u270B\u{1F61A}\u{1F61D}\u{1F634}\u{1F31F}\u{1F62C}\u{1F643}\u{1F340}\u{1F337}\u{1F63B}\u{1F613}\u2B50\u2705\u{1F97A}\u{1F308}\u{1F608}\u{1F918}\u{1F4A6}\u2714\u{1F623}\u{1F3C3}\u{1F490}\u2639\u{1F38A}\u{1F498}\u{1F620}\u261D\u{1F615}\u{1F33A}\u{1F382}\u{1F33B}\u{1F610}\u{1F595}\u{1F49D}\u{1F64A}\u{1F639}\u{1F5E3}\u{1F4AB}\u{1F480}\u{1F451}\u{1F3B5}\u{1F91E}\u{1F61B}\u{1F534}\u{1F624}\u{1F33C}\u{1F62B}\u26BD\u{1F919}\u2615\u{1F3C6}\u{1F92B}\u{1F448}\u{1F62E}\u{1F646}\u{1F37B}\u{1F343}\u{1F436}\u{1F481}\u{1F632}\u{1F33F}\u{1F9E1}\u{1F381}\u26A1\u{1F31E}\u{1F388}\u274C\u270A\u{1F44B}\u{1F630}\u{1F928}\u{1F636}\u{1F91D}\u{1F6B6}\u{1F4B0}\u{1F353}\u{1F4A2}\u{1F91F}\u{1F641}\u{1F6A8}\u{1F4A8}\u{1F92C}\u2708\u{1F380}\u{1F37A}\u{1F913}\u{1F619}\u{1F49F}\u{1F331}\u{1F616}\u{1F476}\u{1F974}\u25B6\u27A1\u2753\u{1F48E}\u{1F4B8}\u2B07\u{1F628}\u{1F31A}\u{1F98B}\u{1F637}\u{1F57A}\u26A0\u{1F645}\u{1F61F}\u{1F635}\u{1F44E}\u{1F932}\u{1F920}\u{1F927}\u{1F4CC}\u{1F535}\u{1F485}\u{1F9D0}\u{1F43E}\u{1F352}\u{1F617}\u{1F911}\u{1F30A}\u{1F92F}\u{1F437}\u260E\u{1F4A7}\u{1F62F}\u{1F486}\u{1F446}\u{1F3A4}\u{1F647}\u{1F351}\u2744\u{1F334}\u{1F4A3}\u{1F438}\u{1F48C}\u{1F4CD}\u{1F940}\u{1F922}\u{1F445}\u{1F4A1}\u{1F4A9}\u{1F450}\u{1F4F8}\u{1F47B}\u{1F910}\u{1F92E}\u{1F3BC}\u{1F975}\u{1F6A9}\u{1F34E}\u{1F34A}\u{1F47C}\u{1F48D}\u{1F4E3}\u{1F942}");
  var alphabetBytesToChars2 = alphabet2.reduce((p, c, i) => {
    p[i] = c;
    return p;
  }, []);
  var alphabetCharsToBytes2 = alphabet2.reduce((p, c, i) => {
    const codePoint = c.codePointAt(0);
    if (codePoint == null) {
      throw new Error(`Invalid character: ${c}`);
    }
    p[codePoint] = i;
    return p;
  }, []);
  function encode14(data) {
    return data.reduce((p, c) => {
      p += alphabetBytesToChars2[c];
      return p;
    }, "");
  }
  function decode21(str) {
    const byts = [];
    for (const char of str) {
      const codePoint = char.codePointAt(0);
      if (codePoint == null) {
        throw new Error(`Invalid character: ${char}`);
      }
      const byt = alphabetCharsToBytes2[codePoint];
      if (byt == null) {
        throw new Error(`Non-base256emoji character: ${char}`);
      }
      byts.push(byt);
    }
    return new Uint8Array(byts);
  }
  var base256emoji2 = from5({
    prefix: "\u{1F680}",
    name: "base256emoji",
    encode: encode14,
    decode: decode21
  });

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/bases/base32.js
  var base32_exports2 = {};
  __export(base32_exports2, {
    base32: () => base323,
    base32hex: () => base32hex3,
    base32hexpad: () => base32hexpad3,
    base32hexpadupper: () => base32hexpadupper3,
    base32hexupper: () => base32hexupper3,
    base32pad: () => base32pad3,
    base32padupper: () => base32padupper3,
    base32upper: () => base32upper3,
    base32z: () => base32z3
  });
  var base323 = rfc46483({
    prefix: "b",
    name: "base32",
    alphabet: "abcdefghijklmnopqrstuvwxyz234567",
    bitsPerChar: 5,
    caseInsensitive: true
  });
  var base32upper3 = rfc46483({
    prefix: "B",
    name: "base32upper",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
    bitsPerChar: 5,
    caseInsensitive: true
  });
  var base32pad3 = rfc46483({
    prefix: "c",
    name: "base32pad",
    alphabet: "abcdefghijklmnopqrstuvwxyz234567=",
    bitsPerChar: 5,
    caseInsensitive: true
  });
  var base32padupper3 = rfc46483({
    prefix: "C",
    name: "base32padupper",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567=",
    bitsPerChar: 5,
    caseInsensitive: true
  });
  var base32hex3 = rfc46483({
    prefix: "v",
    name: "base32hex",
    alphabet: "0123456789abcdefghijklmnopqrstuv",
    bitsPerChar: 5,
    caseInsensitive: true
  });
  var base32hexupper3 = rfc46483({
    prefix: "V",
    name: "base32hexupper",
    alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
    bitsPerChar: 5,
    caseInsensitive: true
  });
  var base32hexpad3 = rfc46483({
    prefix: "t",
    name: "base32hexpad",
    alphabet: "0123456789abcdefghijklmnopqrstuv=",
    bitsPerChar: 5,
    caseInsensitive: true
  });
  var base32hexpadupper3 = rfc46483({
    prefix: "T",
    name: "base32hexpadupper",
    alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUV=",
    bitsPerChar: 5,
    caseInsensitive: true
  });
  var base32z3 = rfc46483({
    prefix: "h",
    name: "base32z",
    alphabet: "ybndrfg8ejkmcpqxot1uwisza345h769",
    bitsPerChar: 5
  });

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/bases/base36.js
  var base36_exports2 = {};
  __export(base36_exports2, {
    base36: () => base363,
    base36upper: () => base36upper3
  });
  var base363 = baseX3({
    prefix: "k",
    name: "base36",
    alphabet: "0123456789abcdefghijklmnopqrstuvwxyz",
    caseInsensitive: true
  });
  var base36upper3 = baseX3({
    prefix: "K",
    name: "base36upper",
    alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    caseInsensitive: true
  });

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/bases/base58.js
  var base58_exports2 = {};
  __export(base58_exports2, {
    base58btc: () => base58btc3,
    base58flickr: () => base58flickr3
  });
  var base58btc3 = baseX3({
    name: "base58btc",
    prefix: "z",
    alphabet: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
  });
  var base58flickr3 = baseX3({
    name: "base58flickr",
    prefix: "Z",
    alphabet: "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"
  });

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/bases/base64.js
  var base64_exports2 = {};
  __export(base64_exports2, {
    base64: () => base642,
    base64pad: () => base64pad2,
    base64url: () => base64url2,
    base64urlpad: () => base64urlpad2
  });
  var base642 = rfc46483({
    prefix: "m",
    name: "base64",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    bitsPerChar: 6
  });
  var base64pad2 = rfc46483({
    prefix: "M",
    name: "base64pad",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    bitsPerChar: 6
  });
  var base64url2 = rfc46483({
    prefix: "u",
    name: "base64url",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
    bitsPerChar: 6
  });
  var base64urlpad2 = rfc46483({
    prefix: "U",
    name: "base64urlpad",
    alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=",
    bitsPerChar: 6
  });

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/bases/base8.js
  var base8_exports2 = {};
  __export(base8_exports2, {
    base8: () => base82
  });
  var base82 = rfc46483({
    prefix: "7",
    name: "base8",
    alphabet: "01234567",
    bitsPerChar: 3
  });

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/bases/identity.js
  var identity_exports3 = {};
  __export(identity_exports3, {
    identity: () => identity3
  });
  var identity3 = from5({
    prefix: "\0",
    name: "identity",
    encode: (buf) => toString2(coerce4(buf)),
    decode: (str) => coerce4(fromString6(str))
  });

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/codecs/json.js
  var textEncoder7 = new TextEncoder();
  var textDecoder6 = new TextDecoder();

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/hashes/identity.js
  var identity_exports4 = {};
  __export(identity_exports4, {
    identity: () => identity4
  });

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/vendor/varint.js
  var encode_14 = encode15;
  var MSB5 = 128;
  var REST5 = 127;
  var MSBALL4 = ~REST5;
  var INT4 = Math.pow(2, 31);
  function encode15(num, out, offset) {
    out = out || [];
    offset = offset || 0;
    var oldOffset = offset;
    while (num >= INT4) {
      out[offset++] = num & 255 | MSB5;
      num /= 128;
    }
    while (num & MSBALL4) {
      out[offset++] = num & 255 | MSB5;
      num >>>= 7;
    }
    out[offset] = num | 0;
    encode15.bytes = offset - oldOffset + 1;
    return out;
  }
  var decode22 = read5;
  var MSB$14 = 128;
  var REST$14 = 127;
  function read5(buf, offset) {
    var res = 0, offset = offset || 0, shift = 0, counter = offset, b, l = buf.length;
    do {
      if (counter >= l) {
        read5.bytes = 0;
        throw new RangeError("Could not decode varint");
      }
      b = buf[counter++];
      res += shift < 28 ? (b & REST$14) << shift : (b & REST$14) * Math.pow(2, shift);
      shift += 7;
    } while (b >= MSB$14);
    read5.bytes = counter - offset;
    return res;
  }
  var N15 = Math.pow(2, 7);
  var N25 = Math.pow(2, 14);
  var N35 = Math.pow(2, 21);
  var N45 = Math.pow(2, 28);
  var N55 = Math.pow(2, 35);
  var N65 = Math.pow(2, 42);
  var N75 = Math.pow(2, 49);
  var N84 = Math.pow(2, 56);
  var N94 = Math.pow(2, 63);
  var length5 = function(value) {
    return value < N15 ? 1 : value < N25 ? 2 : value < N35 ? 3 : value < N45 ? 4 : value < N55 ? 5 : value < N65 ? 6 : value < N75 ? 7 : value < N84 ? 8 : value < N94 ? 9 : 10;
  };
  var varint7 = {
    encode: encode_14,
    decode: decode22,
    encodingLength: length5
  };
  var _brrp_varint4 = varint7;
  var varint_default4 = _brrp_varint4;

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/varint.js
  function decode23(data, offset = 0) {
    const code8 = varint_default4.decode(data, offset);
    const length6 = varint_default4.decode.bytes;
    if (length6 > 9) {
      throw new RangeError("Invalid varint: too long");
    }
    if (length6 > 1 && data[offset + length6 - 1] === 0) {
      throw new RangeError("Invalid varint: not minimally encoded");
    }
    return [code8, length6];
  }
  function encodeTo4(int, target, offset = 0) {
    varint_default4.encode(int, target, offset);
    return target;
  }
  function encodingLength5(int) {
    return varint_default4.encodingLength(int);
  }

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/hashes/digest.js
  function create5(code8, digest3) {
    const size = digest3.byteLength;
    const sizeOffset = encodingLength5(code8);
    const digestOffset = sizeOffset + encodingLength5(size);
    const bytes = new Uint8Array(digestOffset + size);
    encodeTo4(code8, bytes, 0);
    encodeTo4(size, bytes, sizeOffset);
    bytes.set(digest3, digestOffset);
    return new Digest4(code8, size, digest3, bytes);
  }
  function decode24(multihash) {
    const bytes = coerce4(multihash);
    const [code8, sizeOffset] = decode23(bytes);
    const [size, digestOffset] = decode23(bytes.subarray(sizeOffset));
    const digest3 = bytes.subarray(sizeOffset + digestOffset);
    if (digest3.byteLength !== size) {
      throw new Error("Incorrect length");
    }
    return new Digest4(code8, size, digest3, bytes);
  }
  function equals7(a, b) {
    if (a === b) {
      return true;
    } else {
      const data = b;
      return a.code === data.code && a.size === data.size && data.bytes instanceof Uint8Array && equals6(a.bytes, data.bytes);
    }
  }
  var Digest4 = class {
    code;
    size;
    digest;
    bytes;
    /**
     * Creates a multihash digest.
     */
    constructor(code8, size, digest3, bytes) {
      this.code = code8;
      this.size = size;
      this.digest = toArrayBufferBackedArray3(digest3);
      this.bytes = toArrayBufferBackedArray3(bytes);
    }
  };

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/hashes/identity.js
  var code7 = 0;
  var name2 = "identity";
  var encode16 = coerce4;
  function digest2(input, options) {
    if (options?.truncate != null && options.truncate !== input.byteLength) {
      if (options.truncate < 0 || options.truncate > input.byteLength) {
        throw new Error(`Invalid truncate option, must be less than or equal to ${input.byteLength}`);
      }
      input = input.subarray(0, options.truncate);
    }
    return create5(code7, encode16(input));
  }
  var identity4 = { code: code7, name: name2, encode: encode16, digest: digest2 };

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/hashes/sha2-browser.js
  var sha2_browser_exports2 = {};
  __export(sha2_browser_exports2, {
    sha256: () => sha2562,
    sha512: () => sha5122
  });

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/hashes/hasher.js
  var DEFAULT_MIN_DIGEST_LENGTH3 = 20;
  function from6({ name: name3, code: code8, encode: encode17, minDigestLength, maxDigestLength }) {
    return new Hasher3(name3, code8, encode17, minDigestLength, maxDigestLength);
  }
  var Hasher3 = class {
    name;
    code;
    encode;
    minDigestLength;
    maxDigestLength;
    constructor(name3, code8, encode17, minDigestLength, maxDigestLength) {
      this.name = name3;
      this.code = code8;
      this.encode = encode17;
      this.minDigestLength = minDigestLength ?? DEFAULT_MIN_DIGEST_LENGTH3;
      this.maxDigestLength = maxDigestLength;
    }
    digest(input, options) {
      if (options?.truncate != null) {
        if (options.truncate < this.minDigestLength) {
          throw new Error(`Invalid truncate option, must be greater than or equal to ${this.minDigestLength}`);
        }
        if (this.maxDigestLength != null && options.truncate > this.maxDigestLength) {
          throw new Error(`Invalid truncate option, must be less than or equal to ${this.maxDigestLength}`);
        }
      }
      if (input instanceof Uint8Array) {
        const result = this.encode(input);
        if (result instanceof Uint8Array) {
          return createDigest3(result, this.code, options?.truncate);
        }
        return result.then((digest3) => createDigest3(digest3, this.code, options?.truncate));
      } else {
        throw Error("Unknown type, must be binary type");
      }
    }
  };
  function createDigest3(digest3, code8, truncate) {
    if (truncate != null && truncate !== digest3.byteLength) {
      if (truncate > digest3.byteLength) {
        throw new Error(`Invalid truncate option, must be less than or equal to ${digest3.byteLength}`);
      }
      digest3 = digest3.subarray(0, truncate);
    }
    return create5(code8, digest3);
  }

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/hashes/sha2-browser.js
  function sha2(name3) {
    return async (data) => new Uint8Array(await crypto.subtle.digest(name3, data));
  }
  var sha2562 = from6({
    name: "sha2-256",
    code: 18,
    encode: sha2("SHA-256")
  });
  var sha5122 = from6({
    name: "sha2-512",
    code: 19,
    encode: sha2("SHA-512")
  });

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/cid.js
  function format3(link, base4) {
    const { bytes, version } = link;
    switch (version) {
      case 0:
        return toStringV03(bytes, baseCache3(link), base4 ?? base58btc3.encoder);
      default:
        return toStringV13(bytes, baseCache3(link), base4 ?? base323.encoder);
    }
  }
  var cache3 = /* @__PURE__ */ new WeakMap();
  function baseCache3(cid) {
    const baseCache4 = cache3.get(cid);
    if (baseCache4 == null) {
      const baseCache5 = /* @__PURE__ */ new Map();
      cache3.set(cid, baseCache5);
      return baseCache5;
    }
    return baseCache4;
  }
  var CID3 = class _CID {
    code;
    version;
    multihash;
    bytes;
    "/";
    /**
     * @param version - Version of the CID
     * @param code - Code of the codec content is encoded in, see https://github.com/multiformats/multicodec/blob/master/table.csv
     * @param multihash - (Multi)hash of the of the content.
     */
    constructor(version, code8, multihash, bytes) {
      this.code = code8;
      this.version = version;
      this.multihash = multihash;
      this.bytes = toArrayBufferBackedArray3(bytes);
      this["/"] = this.bytes;
    }
    /**
     * Signalling `cid.asCID === cid` has been replaced with `cid['/'] === cid.bytes`
     * please either use `CID.asCID(cid)` or switch to new signalling mechanism
     *
     * @deprecated
     */
    get asCID() {
      return this;
    }
    // ArrayBufferView
    get byteOffset() {
      return this.bytes.byteOffset;
    }
    // ArrayBufferView
    get byteLength() {
      return this.bytes.byteLength;
    }
    toV0() {
      switch (this.version) {
        case 0: {
          return this;
        }
        case 1: {
          const { code: code8, multihash } = this;
          if (code8 !== DAG_PB_CODE3) {
            throw new Error("Cannot convert a non dag-pb CID to CIDv0");
          }
          if (multihash.code !== SHA_256_CODE3) {
            throw new Error("Cannot convert non sha2-256 multihash CID to CIDv0");
          }
          return _CID.createV0(multihash);
        }
        default: {
          throw Error(`Can not convert CID version ${this.version} to version 0. This is a bug please report`);
        }
      }
    }
    toV1() {
      switch (this.version) {
        case 0: {
          const { code: code8, digest: digest3 } = this.multihash;
          const multihash = create5(code8, digest3);
          return _CID.createV1(this.code, multihash);
        }
        case 1: {
          return this;
        }
        default: {
          throw Error(`Can not convert CID version ${this.version} to version 1. This is a bug please report`);
        }
      }
    }
    equals(other) {
      return _CID.equals(this, other);
    }
    static equals(self, other) {
      const unknown = other;
      return unknown != null && self.code === unknown.code && self.version === unknown.version && equals7(self.multihash, unknown.multihash);
    }
    toString(base4) {
      return format3(this, base4);
    }
    toJSON() {
      return { "/": format3(this) };
    }
    link() {
      return this;
    }
    [Symbol.toStringTag] = "CID";
    // Legacy
    [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
      return `CID(${this.toString()})`;
    }
    /**
     * Takes any input `value` and returns a `CID` instance if it was
     * a `CID` otherwise returns `null`. If `value` is instanceof `CID`
     * it will return value back. If `value` is not instance of this CID
     * class, but is compatible CID it will return new instance of this
     * `CID` class. Otherwise returns null.
     *
     * This allows two different incompatible versions of CID library to
     * co-exist and interop as long as binary interface is compatible.
     */
    static asCID(input) {
      if (input == null) {
        return null;
      }
      const value = input;
      if (value instanceof _CID) {
        return value;
      } else if (value["/"] != null && value["/"] === value.bytes || value.asCID === value) {
        const { version, code: code8, multihash, bytes } = value;
        return new _CID(version, code8, multihash, bytes ?? encodeCID3(version, code8, multihash.bytes));
      } else if (value[cidSymbol3] === true) {
        const { version, multihash, code: code8 } = value;
        const digest3 = decode24(multihash);
        return _CID.create(version, code8, digest3);
      } else {
        return null;
      }
    }
    /**
     * @param version - Version of the CID
     * @param code - Code of the codec content is encoded in, see https://github.com/multiformats/multicodec/blob/master/table.csv
     * @param digest - (Multi)hash of the of the content.
     */
    static create(version, code8, digest3) {
      if (typeof code8 !== "number") {
        throw new Error("String codecs are no longer supported");
      }
      if (!(digest3.bytes instanceof Uint8Array)) {
        throw new Error("Invalid digest");
      }
      switch (version) {
        case 0: {
          if (code8 !== DAG_PB_CODE3) {
            throw new Error(`Version 0 CID must use dag-pb (code: ${DAG_PB_CODE3}) block encoding`);
          } else {
            return new _CID(version, code8, digest3, digest3.bytes);
          }
        }
        case 1: {
          const bytes = encodeCID3(version, code8, digest3.bytes);
          return new _CID(version, code8, digest3, bytes);
        }
        default: {
          throw new Error("Invalid version");
        }
      }
    }
    /**
     * Simplified version of `create` for CIDv0.
     */
    static createV0(digest3) {
      return _CID.create(0, DAG_PB_CODE3, digest3);
    }
    /**
     * Simplified version of `create` for CIDv1.
     *
     * @param code - Content encoding format code.
     * @param digest - Multihash of the content.
     */
    static createV1(code8, digest3) {
      return _CID.create(1, code8, digest3);
    }
    /**
     * Decoded a CID from its binary representation. The byte array must contain
     * only the CID with no additional bytes.
     *
     * An error will be thrown if the bytes provided do not contain a valid
     * binary representation of a CID.
     */
    static decode(bytes) {
      const [cid, remainder] = _CID.decodeFirst(bytes);
      if (remainder.length !== 0) {
        throw new Error("Incorrect length");
      }
      return cid;
    }
    /**
     * Decoded a CID from its binary representation at the beginning of a byte
     * array.
     *
     * Returns an array with the first element containing the CID and the second
     * element containing the remainder of the original byte array. The remainder
     * will be a zero-length byte array if the provided bytes only contained a
     * binary CID representation.
     */
    static decodeFirst(bytes) {
      const specs = _CID.inspectBytes(bytes);
      const prefixSize = specs.size - specs.multihashSize;
      const multihashBytes = coerce4(bytes.subarray(prefixSize, prefixSize + specs.multihashSize));
      if (multihashBytes.byteLength !== specs.multihashSize) {
        throw new Error("Incorrect length");
      }
      const digestBytes = multihashBytes.subarray(specs.multihashSize - specs.digestSize);
      const digest3 = new Digest4(specs.multihashCode, specs.digestSize, digestBytes, multihashBytes);
      const cid = specs.version === 0 ? _CID.createV0(digest3) : _CID.createV1(specs.codec, digest3);
      return [cid, bytes.subarray(specs.size)];
    }
    /**
     * Inspect the initial bytes of a CID to determine its properties.
     *
     * Involves decoding up to 4 varints. Typically this will require only 4 to 6
     * bytes but for larger multicodec code values and larger multihash digest
     * lengths these varints can be quite large. It is recommended that at least
     * 10 bytes be made available in the `initialBytes` argument for a complete
     * inspection.
     */
    static inspectBytes(initialBytes) {
      let offset = 0;
      const next = () => {
        const [i, length6] = decode23(initialBytes.subarray(offset));
        offset += length6;
        return i;
      };
      let version = next();
      let codec = DAG_PB_CODE3;
      if (version === 18) {
        version = 0;
        offset = 0;
      } else {
        codec = next();
      }
      if (version !== 0 && version !== 1) {
        throw new RangeError(`Invalid CID version ${version}`);
      }
      const prefixSize = offset;
      const multihashCode = next();
      const digestSize = next();
      const size = offset + digestSize;
      const multihashSize = size - prefixSize;
      return { version, codec, multihashCode, digestSize, multihashSize, size };
    }
    /**
     * Takes cid in a string representation and creates an instance. If `base`
     * decoder is not provided will use a default from the configuration. It will
     * throw an error if encoding of the CID is not compatible with supplied (or
     * a default decoder).
     */
    static parse(source, base4) {
      const [prefix, bytes] = parseCIDtoBytes3(source, base4);
      const cid = _CID.decode(bytes);
      if (cid.version === 0 && source[0] !== "Q") {
        throw Error("Version 0 CID string must not include multibase prefix");
      }
      baseCache3(cid).set(prefix, source);
      return cid;
    }
  };
  function parseCIDtoBytes3(source, base4) {
    switch (source[0]) {
      // CIDv0 is parsed differently
      case "Q": {
        const decoder = base4 ?? base58btc3;
        return [
          base58btc3.prefix,
          decoder.decode(`${base58btc3.prefix}${source}`)
        ];
      }
      case base58btc3.prefix: {
        const decoder = base4 ?? base58btc3;
        return [base58btc3.prefix, decoder.decode(source)];
      }
      case base323.prefix: {
        const decoder = base4 ?? base323;
        return [base323.prefix, decoder.decode(source)];
      }
      case base363.prefix: {
        const decoder = base4 ?? base363;
        return [base363.prefix, decoder.decode(source)];
      }
      default: {
        if (base4 == null) {
          throw Error("To parse non base32, base36 or base58btc encoded CID multibase decoder must be provided");
        }
        return [source[0], base4.decode(source)];
      }
    }
  }
  function toStringV03(bytes, cache4, base4) {
    const { prefix } = base4;
    if (prefix !== base58btc3.prefix) {
      throw Error(`Cannot string encode V0 in ${base4.name} encoding`);
    }
    const cid = cache4.get(prefix);
    if (cid == null) {
      const cid2 = base4.encode(bytes).slice(1);
      cache4.set(prefix, cid2);
      return cid2;
    } else {
      return cid;
    }
  }
  function toStringV13(bytes, cache4, base4) {
    const { prefix } = base4;
    const cid = cache4.get(prefix);
    if (cid == null) {
      const cid2 = base4.encode(bytes);
      cache4.set(prefix, cid2);
      return cid2;
    } else {
      return cid;
    }
  }
  var DAG_PB_CODE3 = 112;
  var SHA_256_CODE3 = 18;
  function encodeCID3(version, code8, multihash) {
    const codeOffset = encodingLength5(version);
    const hashOffset = codeOffset + encodingLength5(code8);
    const bytes = new Uint8Array(hashOffset + multihash.byteLength);
    encodeTo4(version, bytes, 0);
    encodeTo4(code8, bytes, codeOffset);
    bytes.set(multihash, hashOffset);
    return bytes;
  }
  var cidSymbol3 = /* @__PURE__ */ Symbol.for("@ipld/js-cid/CID");

  // node_modules/uint8arrays/node_modules/multiformats/dist/src/basics.js
  var bases2 = { ...identity_exports3, ...base2_exports2, ...base8_exports2, ...base10_exports2, ...base16_exports2, ...base32_exports2, ...base36_exports2, ...base58_exports2, ...base64_exports2, ...base256emoji_exports2 };
  var hashes2 = { ...sha2_browser_exports2, ...identity_exports4 };

  // node_modules/uint8arrays/dist/src/alloc.js
  function allocUnsafe3(size = 0) {
    return new Uint8Array(size);
  }

  // node_modules/uint8arrays/dist/src/util/bases.js
  function createCodec3(name3, prefix, encode17, decode25) {
    return {
      name: name3,
      prefix,
      encoder: {
        name: name3,
        prefix,
        encode: encode17
      },
      decoder: {
        decode: decode25
      }
    };
  }
  var string2 = createCodec3("utf8", "u", (buf) => {
    const decoder = new TextDecoder("utf8");
    return "u" + decoder.decode(buf);
  }, (str) => {
    const encoder = new TextEncoder();
    return encoder.encode(str.substring(1));
  });
  var ascii2 = createCodec3("ascii", "a", (buf) => {
    let string3 = "a";
    for (let i = 0; i < buf.length; i++) {
      string3 += String.fromCharCode(buf[i]);
    }
    return string3;
  }, (str) => {
    str = str.substring(1);
    const buf = allocUnsafe3(str.length);
    for (let i = 0; i < str.length; i++) {
      buf[i] = str.charCodeAt(i);
    }
    return buf;
  });
  var BASES2 = {
    utf8: string2,
    "utf-8": string2,
    hex: bases2.base16,
    latin1: ascii2,
    ascii: ascii2,
    binary: ascii2,
    ...bases2
  };
  var bases_default2 = BASES2;

  // node_modules/uint8arrays/dist/src/from-string.js
  function fromString7(string3, encoding = "utf8") {
    const base4 = bases_default2[encoding];
    if (base4 == null) {
      throw new Error(`Unsupported encoding "${encoding}"`);
    }
    return base4.decoder.decode(`${base4.prefix}${string3}`);
  }

  // node_modules/hamt-sharding/dist/src/bucket.js
  var Bucket = class _Bucket {
    _options;
    _popCount;
    _parent;
    _posAtParent;
    _children;
    key;
    constructor(options, parent, posAtParent = 0) {
      this._options = options;
      this._popCount = 0;
      this._parent = parent;
      this._posAtParent = posAtParent;
      this._children = new import_sparse_array.default();
      this.key = null;
    }
    async put(key, value) {
      const place = await this._findNewBucketAndPos(key);
      place.bucket._putAt(place, key, value);
    }
    async get(key) {
      const child = await this._findChild(key);
      if (child != null) {
        return child.value;
      }
    }
    async del(key) {
      const place = await this._findPlace(key);
      const child = place.bucket._at(place.pos);
      if (child != null && child.key === key) {
        place.bucket._delAt(place.pos);
      }
    }
    leafCount() {
      const children = this._children.compactArray();
      return children.reduce((acc, child) => {
        if (child instanceof _Bucket) {
          return acc + child.leafCount();
        }
        return acc + 1;
      }, 0);
    }
    childrenCount() {
      return this._children.length;
    }
    onlyChild() {
      return this._children.get(0);
    }
    *eachLeafSeries() {
      const children = this._children.compactArray();
      for (const child of children) {
        if (child instanceof _Bucket) {
          yield* child.eachLeafSeries();
        } else {
          yield child;
        }
      }
    }
    serialize(map2, reduce) {
      const acc = [];
      return reduce(this._children.reduce((acc2, child, index) => {
        if (child != null) {
          if (child instanceof _Bucket) {
            acc2.push(child.serialize(map2, reduce));
          } else {
            acc2.push(map2(child, index));
          }
        }
        return acc2;
      }, acc));
    }
    async asyncTransform(asyncMap, asyncReduce) {
      return asyncTransformBucket(this, asyncMap, asyncReduce);
    }
    toJSON() {
      return this.serialize(mapNode, reduceNodes);
    }
    prettyPrint() {
      return JSON.stringify(this.toJSON(), null, "  ");
    }
    tableSize() {
      return Math.pow(2, this._options.bits);
    }
    async _findChild(key) {
      const result = await this._findPlace(key);
      const child = result.bucket._at(result.pos);
      if (child instanceof _Bucket) {
        return void 0;
      }
      if (child != null && child.key === key) {
        return child;
      }
    }
    async _findPlace(key) {
      const hashValue = this._options.hash(typeof key === "string" ? fromString7(key) : key);
      const index = await hashValue.take(this._options.bits);
      const child = this._children.get(index);
      if (child instanceof _Bucket) {
        return child._findPlace(hashValue);
      }
      return {
        bucket: this,
        pos: index,
        hash: hashValue,
        existingChild: child
      };
    }
    async _findNewBucketAndPos(key) {
      const place = await this._findPlace(key);
      if (place.existingChild != null && place.existingChild.key !== key) {
        const bucket = new _Bucket(this._options, place.bucket, place.pos);
        place.bucket._putObjectAt(place.pos, bucket);
        const newPlace = await bucket._findPlace(place.existingChild.hash);
        newPlace.bucket._putAt(newPlace, place.existingChild.key, place.existingChild.value);
        return bucket._findNewBucketAndPos(place.hash);
      }
      return place;
    }
    _putAt(place, key, value) {
      this._putObjectAt(place.pos, {
        key,
        value,
        hash: place.hash
      });
    }
    _putObjectAt(pos, object) {
      if (this._children.get(pos) == null) {
        this._popCount++;
      }
      this._children.set(pos, object);
    }
    _delAt(pos) {
      if (pos === -1) {
        throw new Error("Invalid position");
      }
      if (this._children.get(pos) != null) {
        this._popCount--;
      }
      this._children.unset(pos);
      this._level();
    }
    _level() {
      if (this._parent != null && this._popCount <= 1) {
        if (this._popCount === 1) {
          const onlyChild = this._children.find(exists);
          if (onlyChild != null && !(onlyChild instanceof _Bucket)) {
            const hash = onlyChild.hash;
            hash.untake(this._options.bits);
            const place = {
              pos: this._posAtParent,
              hash,
              bucket: this._parent
            };
            this._parent._putAt(place, onlyChild.key, onlyChild.value);
          }
        } else {
          this._parent._delAt(this._posAtParent);
        }
      }
    }
    _at(index) {
      return this._children.get(index);
    }
  };
  function exists(o) {
    return Boolean(o);
  }
  function mapNode(node, _) {
    return node.key;
  }
  function reduceNodes(nodes) {
    return nodes;
  }
  async function asyncTransformBucket(bucket, asyncMap, asyncReduce) {
    const output = [];
    for (const child of bucket._children.compactArray()) {
      if (child instanceof Bucket) {
        await asyncTransformBucket(child, asyncMap, asyncReduce);
      } else {
        const mappedChildren = await asyncMap(child);
        output.push({
          bitField: bucket._children.bitField(),
          children: mappedChildren
        });
      }
    }
    return asyncReduce(output);
  }

  // node_modules/uint8arrays/dist/src/util/as-uint8array.js
  function isByteArrayWithArrayBuffer4(b) {
    return b?.buffer instanceof ArrayBuffer;
  }
  function asUint8Array(buf) {
    if (isByteArrayWithArrayBuffer4(buf)) {
      return buf;
    }
    const b = buf.slice();
    return new Uint8Array(b.buffer, 0, b.byteLength);
  }

  // node_modules/uint8arrays/dist/src/concat.js
  function concat4(arrays, length6) {
    if (length6 == null) {
      length6 = arrays.reduce((acc, curr) => acc + curr.length, 0);
    }
    const output = allocUnsafe3(length6);
    let offset = 0;
    for (const arr of arrays) {
      output.set(arr, offset);
      offset += arr.length;
    }
    return asUint8Array(output);
  }

  // node_modules/hamt-sharding/dist/src/consumable-buffer.js
  var START_MASKS = [
    255,
    254,
    252,
    248,
    240,
    224,
    192,
    128
  ];
  var STOP_MASKS = [
    1,
    3,
    7,
    15,
    31,
    63,
    127,
    255
  ];
  var ConsumableBuffer = class {
    _value;
    _currentBytePos;
    _currentBitPos;
    constructor(value) {
      this._value = value;
      this._currentBytePos = value.length - 1;
      this._currentBitPos = 7;
    }
    availableBits() {
      return this._currentBitPos + 1 + this._currentBytePos * 8;
    }
    totalBits() {
      return this._value.length * 8;
    }
    take(bits) {
      let pendingBits = bits;
      let result = 0;
      while (pendingBits > 0 && this._haveBits()) {
        const byte = this._value[this._currentBytePos];
        const availableBits = this._currentBitPos + 1;
        const taking = Math.min(availableBits, pendingBits);
        const value = byteBitsToInt(byte, availableBits - taking, taking);
        result = (result << taking) + value;
        pendingBits -= taking;
        this._currentBitPos -= taking;
        if (this._currentBitPos < 0) {
          this._currentBitPos = 7;
          this._currentBytePos--;
        }
      }
      return result;
    }
    untake(bits) {
      this._currentBitPos += bits;
      while (this._currentBitPos > 7) {
        this._currentBitPos -= 8;
        this._currentBytePos += 1;
      }
    }
    _haveBits() {
      return this._currentBytePos >= 0;
    }
  };
  function byteBitsToInt(byte, start, length6) {
    const mask = maskFor(start, length6);
    return (byte & mask) >>> start;
  }
  function maskFor(start, length6) {
    return START_MASKS[start] & STOP_MASKS[Math.min(length6 + start - 1, 7)];
  }

  // node_modules/hamt-sharding/dist/src/consumable-hash.js
  function wrapHash(hashFn2) {
    function hashing(value) {
      if (value instanceof InfiniteHash) {
        return value;
      } else {
        return new InfiniteHash(value, hashFn2);
      }
    }
    return hashing;
  }
  var InfiniteHash = class {
    _value;
    _hashFn;
    _depth;
    _availableBits;
    _currentBufferIndex;
    _buffers;
    constructor(value, hashFn2) {
      if (!(value instanceof Uint8Array)) {
        throw new Error("can only hash Uint8Arrays");
      }
      this._value = value;
      this._hashFn = hashFn2;
      this._depth = -1;
      this._availableBits = 0;
      this._currentBufferIndex = 0;
      this._buffers = [];
    }
    async take(bits) {
      let pendingBits = bits;
      while (this._availableBits < pendingBits) {
        await this._produceMoreBits();
      }
      let result = 0;
      while (pendingBits > 0) {
        const hash = this._buffers[this._currentBufferIndex];
        const available = Math.min(hash.availableBits(), pendingBits);
        const took = hash.take(available);
        result = (result << available) + took;
        pendingBits -= available;
        this._availableBits -= available;
        if (hash.availableBits() === 0) {
          this._currentBufferIndex++;
        }
      }
      return result;
    }
    untake(bits) {
      let pendingBits = bits;
      while (pendingBits > 0) {
        const hash = this._buffers[this._currentBufferIndex];
        const availableForUntake = Math.min(hash.totalBits() - hash.availableBits(), pendingBits);
        hash.untake(availableForUntake);
        pendingBits -= availableForUntake;
        this._availableBits += availableForUntake;
        if (this._currentBufferIndex > 0 && hash.totalBits() === hash.availableBits()) {
          this._depth--;
          this._currentBufferIndex--;
        }
      }
    }
    async _produceMoreBits() {
      this._depth++;
      const value = this._depth > 0 ? concat4([this._value, Uint8Array.from([this._depth])]) : this._value;
      const hashValue = await this._hashFn(value);
      const buffer4 = new ConsumableBuffer(hashValue);
      this._buffers.push(buffer4);
      this._availableBits += buffer4.availableBits();
    }
  };

  // node_modules/hamt-sharding/dist/src/index.js
  function createHAMT(options) {
    if (options == null || options.hashFn == null) {
      throw new Error("please define an options.hashFn");
    }
    const bucketOptions = {
      bits: options.bits ?? 8,
      hash: wrapHash(options.hashFn)
    };
    return new Bucket(bucketOptions);
  }

  // node_modules/ipfs-unixfs-exporter/dist/src/utils/find-cid-in-shard.js
  var hashFn = async function(buf) {
    return (await murmur3128.encode(buf)).slice(0, 8).reverse();
  };
  var addLinksToHamtBucket = async (links, bucket, rootBucket) => {
    const padLength = (bucket.tableSize() - 1).toString(16).length;
    await Promise.all(links.map(async (link) => {
      if (link.Name == null) {
        throw new Error("Unexpected Link without a Name");
      }
      if (link.Name.length === padLength) {
        const pos = parseInt(link.Name, 16);
        bucket._putObjectAt(pos, new Bucket({
          hash: rootBucket._options.hash,
          bits: rootBucket._options.bits
        }, bucket, pos));
        return;
      }
      await rootBucket.put(link.Name.substring(2), true);
    }));
  };
  var toPrefix = (position, padLength) => {
    return position.toString(16).toUpperCase().padStart(padLength, "0").substring(0, padLength);
  };
  var toBucketPath = (position) => {
    let bucket = position.bucket;
    const path = [];
    while (bucket._parent != null) {
      path.push(bucket);
      bucket = bucket._parent;
    }
    path.push(bucket);
    return path.reverse();
  };
  var findShardCid = async (node, name3, blockstore, context, options) => {
    if (context == null) {
      if (node.Data == null) {
        throw new NotUnixFSError("no data in PBNode");
      }
      let dir;
      try {
        dir = UnixFS.unmarshal(node.Data);
      } catch (err) {
        throw new NotUnixFSError(err.message);
      }
      if (dir.type !== "hamt-sharded-directory") {
        throw new NotUnixFSError("not a HAMT");
      }
      if (dir.fanout == null) {
        throw new NotUnixFSError("missing fanout");
      }
      const rootBucket = createHAMT({
        hashFn,
        bits: Math.log2(Number(dir.fanout))
      });
      context = {
        rootBucket,
        hamtDepth: 1,
        lastBucket: rootBucket
      };
    }
    const padLength = (context.lastBucket.tableSize() - 1).toString(16).length;
    await addLinksToHamtBucket(node.Links, context.lastBucket, context.rootBucket);
    const position = await context.rootBucket._findNewBucketAndPos(name3);
    let prefix = toPrefix(position.pos, padLength);
    const bucketPath = toBucketPath(position);
    if (bucketPath.length > context.hamtDepth) {
      context.lastBucket = bucketPath[context.hamtDepth];
      prefix = toPrefix(context.lastBucket._posAtParent, padLength);
    }
    const link = node.Links.find((link2) => {
      if (link2.Name == null) {
        return false;
      }
      const entryPrefix = link2.Name.substring(0, padLength);
      const entryName = link2.Name.substring(padLength);
      if (entryPrefix !== prefix) {
        return false;
      }
      if (entryName !== "" && entryName !== name3) {
        return false;
      }
      return true;
    });
    if (link == null) {
      return;
    }
    if (link.Name != null && link.Name.substring(padLength) === name3) {
      return link.Hash;
    }
    context.hamtDepth++;
    const block = await blockstore.get(link.Hash, options);
    node = decode15(block);
    return findShardCid(node, name3, blockstore, context, options);
  };
  var find_cid_in_shard_default = findShardCid;

  // node_modules/it-peekable/dist/src/index.js
  function peekable(iterable) {
    const [iterator, symbol] = iterable[Symbol.asyncIterator] != null ? [iterable[Symbol.asyncIterator](), Symbol.asyncIterator] : [iterable[Symbol.iterator](), Symbol.iterator];
    const queue = [];
    return {
      peek: () => {
        return iterator.next();
      },
      push: (value) => {
        queue.push(value);
      },
      next: () => {
        if (queue.length > 0) {
          return {
            done: false,
            value: queue.shift()
          };
        }
        return iterator.next();
      },
      [symbol]() {
        return this;
      }
    };
  }
  var src_default2 = peekable;

  // node_modules/it-filter/dist/src/index.js
  function isAsyncIterable2(thing) {
    return thing[Symbol.asyncIterator] != null;
  }
  function filter(source, fn) {
    let index = 0;
    if (isAsyncIterable2(source)) {
      return (async function* () {
        for await (const entry of source) {
          if (await fn(entry, index++)) {
            yield entry;
          }
        }
      })();
    }
    const peekable2 = src_default2(source);
    const { value, done } = peekable2.next();
    if (done === true) {
      return (function* () {
      })();
    }
    const res = fn(value, index++);
    if (typeof res.then === "function") {
      return (async function* () {
        if (await res) {
          yield value;
        }
        for (const entry of peekable2) {
          if (await fn(entry, index++)) {
            yield entry;
          }
        }
      })();
    }
    const func = fn;
    return (function* () {
      if (res === true) {
        yield value;
      }
      for (const entry of peekable2) {
        if (func(entry, index++)) {
          yield entry;
        }
      }
    })();
  }
  var src_default3 = filter;

  // node_modules/it-map/dist/src/index.js
  function isAsyncIterable3(thing) {
    return thing[Symbol.asyncIterator] != null;
  }
  function map(source, func) {
    let index = 0;
    if (isAsyncIterable3(source)) {
      return (async function* () {
        for await (const val of source) {
          yield func(val, index++);
        }
      })();
    }
    const peekable2 = src_default2(source);
    const { value, done } = peekable2.next();
    if (done === true) {
      return (function* () {
      })();
    }
    const res = func(value, index++);
    if (typeof res.then === "function") {
      return (async function* () {
        yield await res;
        for (const val of peekable2) {
          yield func(val, index++);
        }
      })();
    }
    const fn = func;
    return (function* () {
      yield res;
      for (const val of peekable2) {
        yield fn(val, index++);
      }
    })();
  }
  var src_default4 = map;

  // node_modules/p-defer/index.js
  function pDefer() {
    const deferred = {};
    deferred.promise = new Promise((resolve7, reject) => {
      deferred.resolve = resolve7;
      deferred.reject = reject;
    });
    return deferred;
  }

  // node_modules/it-parallel/dist/src/index.js
  var CustomEvent = globalThis.CustomEvent ?? Event;
  async function* parallel(source, options = {}) {
    let concurrency = options.concurrency ?? Infinity;
    if (concurrency < 1) {
      concurrency = Infinity;
    }
    const ordered = options.ordered ?? false;
    const emitter = new EventTarget();
    const ops = [];
    let slotAvailable = pDefer();
    let resultAvailable = pDefer();
    let sourceFinished = false;
    let sourceErr;
    let opErred = false;
    let returned = false;
    emitter.addEventListener("task-complete", () => {
      resultAvailable.resolve();
    });
    void Promise.resolve().then(async () => {
      try {
        for await (const task of source) {
          if (ops.length === concurrency) {
            slotAvailable = pDefer();
            await slotAvailable.promise;
          }
          if (opErred || returned) {
            break;
          }
          const op = {
            done: false
          };
          ops.push(op);
          task().then((result) => {
            op.done = true;
            op.ok = true;
            op.value = result;
            emitter.dispatchEvent(new CustomEvent("task-complete"));
          }, (err) => {
            op.done = true;
            op.err = err;
            emitter.dispatchEvent(new CustomEvent("task-complete"));
          });
        }
        sourceFinished = true;
        emitter.dispatchEvent(new CustomEvent("task-complete"));
      } catch (err) {
        sourceErr = err;
        emitter.dispatchEvent(new CustomEvent("task-complete"));
      }
    });
    function valuesAvailable() {
      if (ordered) {
        return ops[0]?.done;
      }
      return Boolean(ops.find((op) => op.done));
    }
    function* yieldOrderedValues() {
      while (ops.length > 0 && ops[0].done) {
        const op = ops[0];
        ops.shift();
        if (op.ok) {
          yield op.value;
        } else {
          opErred = true;
          slotAvailable.resolve();
          throw op.err;
        }
        slotAvailable.resolve();
      }
    }
    function* yieldUnOrderedValues() {
      while (valuesAvailable()) {
        for (let i = 0; i < ops.length; i++) {
          if (ops[i].done) {
            const op = ops[i];
            ops.splice(i, 1);
            i--;
            if (op.ok) {
              yield op.value;
            } else {
              opErred = true;
              slotAvailable.resolve();
              throw op.err;
            }
            slotAvailable.resolve();
          }
        }
      }
    }
    try {
      while (true) {
        if (!valuesAvailable()) {
          resultAvailable = pDefer();
          await resultAvailable.promise;
        }
        if (sourceErr != null) {
          throw sourceErr;
        }
        if (ordered) {
          yield* yieldOrderedValues();
        } else {
          yield* yieldUnOrderedValues();
        }
        if (sourceErr != null) {
          throw sourceErr;
        }
        if (sourceFinished && ops.length === 0) {
          break;
        }
      }
    } finally {
      returned = true;
      slotAvailable.resolve();
    }
  }

  // node_modules/it-pushable/dist/src/fifo.js
  var FixedFIFO = class {
    buffer;
    mask;
    top;
    btm;
    next;
    constructor(hwm) {
      if (!(hwm > 0) || (hwm - 1 & hwm) !== 0) {
        throw new Error("Max size for a FixedFIFO should be a power of two");
      }
      this.buffer = new Array(hwm);
      this.mask = hwm - 1;
      this.top = 0;
      this.btm = 0;
      this.next = null;
    }
    push(data) {
      if (this.buffer[this.top] !== void 0) {
        return false;
      }
      this.buffer[this.top] = data;
      this.top = this.top + 1 & this.mask;
      return true;
    }
    shift() {
      const last2 = this.buffer[this.btm];
      if (last2 === void 0) {
        return void 0;
      }
      this.buffer[this.btm] = void 0;
      this.btm = this.btm + 1 & this.mask;
      return last2;
    }
    isEmpty() {
      return this.buffer[this.btm] === void 0;
    }
  };
  var FIFO = class {
    size;
    hwm;
    head;
    tail;
    constructor(options = {}) {
      this.hwm = options.splitLimit ?? 16;
      this.head = new FixedFIFO(this.hwm);
      this.tail = this.head;
      this.size = 0;
    }
    calculateSize(obj) {
      if (obj?.byteLength != null) {
        return obj.byteLength;
      }
      return 1;
    }
    push(val) {
      if (val?.value != null) {
        this.size += this.calculateSize(val.value);
      }
      if (!this.head.push(val)) {
        const prev = this.head;
        this.head = prev.next = new FixedFIFO(2 * this.head.buffer.length);
        this.head.push(val);
      }
    }
    shift() {
      let val = this.tail.shift();
      if (val === void 0 && this.tail.next != null) {
        const next = this.tail.next;
        this.tail.next = null;
        this.tail = next;
        val = this.tail.shift();
      }
      if (val?.value != null) {
        this.size -= this.calculateSize(val.value);
      }
      return val;
    }
    isEmpty() {
      return this.head.isEmpty();
    }
  };

  // node_modules/it-pushable/dist/src/index.js
  var AbortError = class extends Error {
    type;
    code;
    constructor(message2, code8) {
      super(message2 ?? "The operation was aborted");
      this.type = "aborted";
      this.code = code8 ?? "ABORT_ERR";
    }
  };
  function pushable(options = {}) {
    const getNext = (buffer4) => {
      const next = buffer4.shift();
      if (next == null) {
        return { done: true };
      }
      if (next.error != null) {
        throw next.error;
      }
      return {
        done: next.done === true,
        // @ts-expect-error if done is false, value will be present
        value: next.value
      };
    };
    return _pushable(getNext, options);
  }
  function _pushable(getNext, options) {
    options = options ?? {};
    let onEnd = options.onEnd;
    let buffer4 = new FIFO();
    let pushable2;
    let onNext;
    let ended;
    let drain = pDefer();
    const waitNext = async () => {
      try {
        if (!buffer4.isEmpty()) {
          return getNext(buffer4);
        }
        if (ended) {
          return { done: true };
        }
        return await new Promise((resolve7, reject) => {
          onNext = (next) => {
            onNext = null;
            buffer4.push(next);
            try {
              resolve7(getNext(buffer4));
            } catch (err) {
              reject(err);
            }
            return pushable2;
          };
        });
      } finally {
        if (buffer4.isEmpty()) {
          queueMicrotask(() => {
            drain.resolve();
            drain = pDefer();
          });
        }
      }
    };
    const bufferNext = (next) => {
      if (onNext != null) {
        return onNext(next);
      }
      buffer4.push(next);
      return pushable2;
    };
    const bufferError = (err) => {
      buffer4 = new FIFO();
      if (onNext != null) {
        return onNext({ error: err });
      }
      buffer4.push({ error: err });
      return pushable2;
    };
    const push = (value) => {
      if (ended) {
        return pushable2;
      }
      if (options?.objectMode !== true && value?.byteLength == null) {
        throw new Error("objectMode was not true but tried to push non-Uint8Array value");
      }
      return bufferNext({ done: false, value });
    };
    const end = (err) => {
      if (ended) {
        return pushable2;
      }
      ended = true;
      return err != null ? bufferError(err) : bufferNext({ done: true });
    };
    const _return = () => {
      buffer4 = new FIFO();
      end();
      return { done: true };
    };
    const _throw = (err) => {
      end(err);
      return { done: true };
    };
    pushable2 = {
      [Symbol.asyncIterator]() {
        return this;
      },
      next: waitNext,
      return: _return,
      throw: _throw,
      push,
      end,
      get readableLength() {
        return buffer4.size;
      },
      onEmpty: async (options2) => {
        const signal = options2?.signal;
        signal?.throwIfAborted();
        if (buffer4.isEmpty()) {
          return;
        }
        let cancel;
        let listener;
        if (signal != null) {
          cancel = new Promise((resolve7, reject) => {
            listener = () => {
              reject(new AbortError());
            };
            signal.addEventListener("abort", listener);
          });
        }
        try {
          await Promise.race([
            drain.promise,
            cancel
          ]);
        } finally {
          if (listener != null && signal != null) {
            signal?.removeEventListener("abort", listener);
          }
        }
      }
    };
    if (onEnd == null) {
      return pushable2;
    }
    const _pushable2 = pushable2;
    pushable2 = {
      [Symbol.asyncIterator]() {
        return this;
      },
      next() {
        return _pushable2.next();
      },
      throw(err) {
        _pushable2.throw(err);
        if (onEnd != null) {
          onEnd(err);
          onEnd = void 0;
        }
        return { done: true };
      },
      return() {
        _pushable2.return();
        if (onEnd != null) {
          onEnd();
          onEnd = void 0;
        }
        return { done: true };
      },
      push,
      end(err) {
        _pushable2.end(err);
        if (onEnd != null) {
          onEnd(err);
          onEnd = void 0;
        }
        return pushable2;
      },
      get readableLength() {
        return _pushable2.readableLength;
      },
      onEmpty: (opts) => {
        return _pushable2.onEmpty(opts);
      }
    };
    return pushable2;
  }

  // node_modules/race-signal/dist/src/index.js
  function defaultTranslate(signal) {
    return signal.reason;
  }
  function raceSignal(promise, signal, opts) {
    if (signal == null || promise == null) {
      return promise;
    }
    const translateError = opts?.translateError ?? defaultTranslate;
    if (signal.aborted) {
      promise.catch(() => {
      });
      return Promise.reject(translateError(signal));
    }
    let listener;
    return Promise.race([
      promise,
      new Promise((resolve7, reject) => {
        listener = () => {
          reject(translateError(signal));
        };
        signal.addEventListener("abort", listener);
      })
    ]).finally(() => {
      if (listener != null) {
        signal.removeEventListener("abort", listener);
      }
    });
  }

  // node_modules/it-queueless-pushable/dist/src/index.js
  var QueuelessPushable = class {
    readNext;
    haveNext;
    ended;
    nextResult;
    error;
    constructor() {
      this.ended = false;
      this.readNext = pDefer();
      this.haveNext = pDefer();
    }
    [Symbol.asyncIterator]() {
      return this;
    }
    async next() {
      if (this.nextResult == null) {
        await this.haveNext.promise;
      }
      if (this.nextResult == null) {
        throw new Error("HaveNext promise resolved but nextResult was undefined");
      }
      const nextResult = this.nextResult;
      this.nextResult = void 0;
      this.readNext.resolve();
      this.readNext = pDefer();
      return nextResult;
    }
    async throw(err) {
      this.ended = true;
      this.error = err;
      if (err != null) {
        this.haveNext.promise.catch(() => {
        });
        this.haveNext.reject(err);
      }
      const result = {
        done: true,
        value: void 0
      };
      return result;
    }
    async return() {
      const result = {
        done: true,
        value: void 0
      };
      this.ended = true;
      this.nextResult = result;
      this.haveNext.resolve();
      return result;
    }
    async push(value, options) {
      await this._push(value, options);
    }
    async end(err, options) {
      if (err != null) {
        await this.throw(err);
      } else {
        await this._push(void 0, options);
      }
    }
    async _push(value, options) {
      if (value != null && this.ended) {
        throw this.error ?? new Error("Cannot push value onto an ended pushable");
      }
      while (this.nextResult != null) {
        await this.readNext.promise;
      }
      if (value != null) {
        this.nextResult = { done: false, value };
      } else {
        this.ended = true;
        this.nextResult = { done: true, value: void 0 };
      }
      this.haveNext.resolve();
      this.haveNext = pDefer();
      await raceSignal(this.readNext.promise, options?.signal, options);
    }
  };
  function queuelessPushable() {
    return new QueuelessPushable();
  }

  // node_modules/it-merge/dist/src/index.js
  function isAsyncIterable4(thing) {
    return thing[Symbol.asyncIterator] != null;
  }
  async function addAllToPushable(iterators, output, signal) {
    try {
      await Promise.all(iterators.map(async (iterator) => {
        while (true) {
          const { value, done } = await iterator.next();
          if (done === true) {
            break;
          }
          await output.push(value, {
            signal
          });
          signal.throwIfAborted();
        }
      }));
      await output.end(void 0, {
        signal
      });
    } catch (err) {
      await output.end(err, {
        signal
      }).catch(() => {
      });
    }
  }
  async function* mergeSources(sources) {
    const controller = new AbortController();
    const output = queuelessPushable();
    const iterators = sources.map((source) => isAsyncIterable4(source) ? source[Symbol.asyncIterator]() : source[Symbol.iterator]());
    addAllToPushable(iterators, output, controller.signal).catch(() => {
    });
    try {
      yield* output;
    } finally {
      controller.abort();
      for (const iterator of iterators) {
        try {
          Promise.resolve(iterator.return?.()).catch(() => {
          });
        } catch {
        }
      }
    }
  }
  function* mergeSyncSources(syncSources) {
    for (const source of syncSources) {
      yield* source;
    }
  }
  function merge(...sources) {
    const syncSources = [];
    for (const source of sources) {
      if (!isAsyncIterable4(source)) {
        syncSources.push(source);
      }
    }
    if (syncSources.length === sources.length) {
      return mergeSyncSources(syncSources);
    }
    return mergeSources(sources);
  }
  var src_default5 = merge;

  // node_modules/it-pipe/dist/src/index.js
  function pipe(first, ...rest) {
    if (first == null) {
      throw new Error("Empty pipeline");
    }
    if (isDuplex(first)) {
      const duplex = first;
      first = () => duplex.source;
    } else if (isIterable(first) || isAsyncIterable5(first)) {
      const source = first;
      first = () => source;
    }
    const fns = [first, ...rest];
    if (fns.length > 1) {
      if (isDuplex(fns[fns.length - 1])) {
        fns[fns.length - 1] = fns[fns.length - 1].sink;
      }
    }
    if (fns.length > 2) {
      for (let i = 1; i < fns.length - 1; i++) {
        if (isDuplex(fns[i])) {
          fns[i] = duplexPipelineFn(fns[i]);
        }
      }
    }
    return rawPipe(...fns);
  }
  var rawPipe = (...fns) => {
    let res;
    while (fns.length > 0) {
      res = fns.shift()(res);
    }
    return res;
  };
  var isAsyncIterable5 = (obj) => {
    return obj?.[Symbol.asyncIterator] != null;
  };
  var isIterable = (obj) => {
    return obj?.[Symbol.iterator] != null;
  };
  var isDuplex = (obj) => {
    if (obj == null) {
      return false;
    }
    return obj.sink != null && obj.source != null;
  };
  var duplexPipelineFn = (duplex) => {
    return (source) => {
      const p = duplex.sink(source);
      if (p?.then != null) {
        const stream = pushable({
          objectMode: true
        });
        p.then(() => {
          stream.end();
        }, (err) => {
          stream.end(err);
        });
        let sourceWrap;
        const source2 = duplex.source;
        if (isAsyncIterable5(source2)) {
          sourceWrap = async function* () {
            yield* source2;
            stream.end();
          };
        } else if (isIterable(source2)) {
          sourceWrap = function* () {
            yield* source2;
            stream.end();
          };
        } else {
          throw new Error("Unknown duplex source type - must be Iterable or AsyncIterable");
        }
        return src_default5(stream, sourceWrap());
      }
      return duplex.source;
    };
  };

  // node_modules/ipfs-unixfs-exporter/dist/src/resolvers/unixfs-v1/content/directory.js
  var directoryContent = (cid, node, unixfs, path, resolve7, depth, blockstore) => {
    async function* yieldDirectoryContent(options = {}) {
      const offset = options.offset ?? 0;
      const length6 = options.length ?? node.Links.length;
      const links = node.Links.slice(offset, length6);
      options.onProgress?.(new CustomProgressEvent("unixfs:exporter:walk:directory", {
        cid
      }));
      yield* pipe(links, (source) => src_default4(source, (link) => {
        return async () => {
          const linkName = link.Name ?? "";
          const linkPath = `${path}/${linkName}`;
          const result = await resolve7(link.Hash, linkName, linkPath, [], depth + 1, blockstore, options);
          return result.entry;
        };
      }), (source) => parallel(source, {
        ordered: true,
        concurrency: options.blockReadConcurrency
      }), (source) => src_default3(source, (entry) => entry != null));
    }
    return yieldDirectoryContent;
  };
  var directory_default = directoryContent;

  // node_modules/eventemitter3/index.mjs
  var import_index3 = __toESM(require_eventemitter3(), 1);

  // node_modules/ipfs-unixfs-exporter/node_modules/p-timeout/index.js
  var TimeoutError = class extends Error {
    constructor(message2) {
      super(message2);
      this.name = "TimeoutError";
    }
  };
  var AbortError2 = class extends Error {
    constructor(message2) {
      super();
      this.name = "AbortError";
      this.message = message2;
    }
  };
  var getDOMException = (errorMessage) => globalThis.DOMException === void 0 ? new AbortError2(errorMessage) : new DOMException(errorMessage);
  var getAbortedReason = (signal) => {
    const reason = signal.reason === void 0 ? getDOMException("This operation was aborted.") : signal.reason;
    return reason instanceof Error ? reason : getDOMException(reason);
  };
  function pTimeout(promise, options) {
    const {
      milliseconds,
      fallback,
      message: message2,
      customTimers = { setTimeout, clearTimeout }
    } = options;
    let timer;
    let abortHandler;
    const wrappedPromise = new Promise((resolve7, reject) => {
      if (typeof milliseconds !== "number" || Math.sign(milliseconds) !== 1) {
        throw new TypeError(`Expected \`milliseconds\` to be a positive number, got \`${milliseconds}\``);
      }
      if (options.signal) {
        const { signal } = options;
        if (signal.aborted) {
          reject(getAbortedReason(signal));
        }
        abortHandler = () => {
          reject(getAbortedReason(signal));
        };
        signal.addEventListener("abort", abortHandler, { once: true });
      }
      if (milliseconds === Number.POSITIVE_INFINITY) {
        promise.then(resolve7, reject);
        return;
      }
      const timeoutError = new TimeoutError();
      timer = customTimers.setTimeout.call(void 0, () => {
        if (fallback) {
          try {
            resolve7(fallback());
          } catch (error) {
            reject(error);
          }
          return;
        }
        if (typeof promise.cancel === "function") {
          promise.cancel();
        }
        if (message2 === false) {
          resolve7();
        } else if (message2 instanceof Error) {
          reject(message2);
        } else {
          timeoutError.message = message2 ?? `Promise timed out after ${milliseconds} milliseconds`;
          reject(timeoutError);
        }
      }, milliseconds);
      (async () => {
        try {
          resolve7(await promise);
        } catch (error) {
          reject(error);
        }
      })();
    });
    const cancelablePromise = wrappedPromise.finally(() => {
      cancelablePromise.clear();
      if (abortHandler && options.signal) {
        options.signal.removeEventListener("abort", abortHandler);
      }
    });
    cancelablePromise.clear = () => {
      customTimers.clearTimeout.call(void 0, timer);
      timer = void 0;
    };
    return cancelablePromise;
  }

  // node_modules/ipfs-unixfs-exporter/node_modules/p-queue/dist/lower-bound.js
  function lowerBound(array, value, comparator) {
    let first = 0;
    let count = array.length;
    while (count > 0) {
      const step = Math.trunc(count / 2);
      let it = first + step;
      if (comparator(array[it], value) <= 0) {
        first = ++it;
        count -= step + 1;
      } else {
        count = step;
      }
    }
    return first;
  }

  // node_modules/ipfs-unixfs-exporter/node_modules/p-queue/dist/priority-queue.js
  var PriorityQueue = class {
    #queue = [];
    enqueue(run, options) {
      options = {
        priority: 0,
        ...options
      };
      const element = {
        priority: options.priority,
        id: options.id,
        run
      };
      if (this.size === 0 || this.#queue[this.size - 1].priority >= options.priority) {
        this.#queue.push(element);
        return;
      }
      const index = lowerBound(this.#queue, element, (a, b) => b.priority - a.priority);
      this.#queue.splice(index, 0, element);
    }
    setPriority(id, priority) {
      const index = this.#queue.findIndex((element) => element.id === id);
      if (index === -1) {
        throw new ReferenceError(`No promise function with the id "${id}" exists in the queue.`);
      }
      const [item] = this.#queue.splice(index, 1);
      this.enqueue(item.run, { priority, id });
    }
    dequeue() {
      const item = this.#queue.shift();
      return item?.run;
    }
    filter(options) {
      return this.#queue.filter((element) => element.priority === options.priority).map((element) => element.run);
    }
    get size() {
      return this.#queue.length;
    }
  };

  // node_modules/ipfs-unixfs-exporter/node_modules/p-queue/dist/index.js
  var PQueue = class extends import_index3.default {
    #carryoverConcurrencyCount;
    #isIntervalIgnored;
    #intervalCount = 0;
    #intervalCap;
    #interval;
    #intervalEnd = 0;
    #intervalId;
    #timeoutId;
    #queue;
    #queueClass;
    #pending = 0;
    // The `!` is needed because of https://github.com/microsoft/TypeScript/issues/32194
    #concurrency;
    #isPaused;
    #throwOnTimeout;
    // Use to assign a unique identifier to a promise function, if not explicitly specified
    #idAssigner = 1n;
    /**
        Per-operation timeout in milliseconds. Operations fulfill once `timeout` elapses if they haven't already.
    
        Applies to each future operation.
        */
    timeout;
    // TODO: The `throwOnTimeout` option should affect the return types of `add()` and `addAll()`
    constructor(options) {
      super();
      options = {
        carryoverConcurrencyCount: false,
        intervalCap: Number.POSITIVE_INFINITY,
        interval: 0,
        concurrency: Number.POSITIVE_INFINITY,
        autoStart: true,
        queueClass: PriorityQueue,
        ...options
      };
      if (!(typeof options.intervalCap === "number" && options.intervalCap >= 1)) {
        throw new TypeError(`Expected \`intervalCap\` to be a number from 1 and up, got \`${options.intervalCap?.toString() ?? ""}\` (${typeof options.intervalCap})`);
      }
      if (options.interval === void 0 || !(Number.isFinite(options.interval) && options.interval >= 0)) {
        throw new TypeError(`Expected \`interval\` to be a finite number >= 0, got \`${options.interval?.toString() ?? ""}\` (${typeof options.interval})`);
      }
      this.#carryoverConcurrencyCount = options.carryoverConcurrencyCount;
      this.#isIntervalIgnored = options.intervalCap === Number.POSITIVE_INFINITY || options.interval === 0;
      this.#intervalCap = options.intervalCap;
      this.#interval = options.interval;
      this.#queue = new options.queueClass();
      this.#queueClass = options.queueClass;
      this.concurrency = options.concurrency;
      this.timeout = options.timeout;
      this.#throwOnTimeout = options.throwOnTimeout === true;
      this.#isPaused = options.autoStart === false;
    }
    get #doesIntervalAllowAnother() {
      return this.#isIntervalIgnored || this.#intervalCount < this.#intervalCap;
    }
    get #doesConcurrentAllowAnother() {
      return this.#pending < this.#concurrency;
    }
    #next() {
      this.#pending--;
      this.#tryToStartAnother();
      this.emit("next");
    }
    #onResumeInterval() {
      this.#onInterval();
      this.#initializeIntervalIfNeeded();
      this.#timeoutId = void 0;
    }
    get #isIntervalPaused() {
      const now = Date.now();
      if (this.#intervalId === void 0) {
        const delay = this.#intervalEnd - now;
        if (delay < 0) {
          this.#intervalCount = this.#carryoverConcurrencyCount ? this.#pending : 0;
        } else {
          if (this.#timeoutId === void 0) {
            this.#timeoutId = setTimeout(() => {
              this.#onResumeInterval();
            }, delay);
          }
          return true;
        }
      }
      return false;
    }
    #tryToStartAnother() {
      if (this.#queue.size === 0) {
        if (this.#intervalId) {
          clearInterval(this.#intervalId);
        }
        this.#intervalId = void 0;
        this.emit("empty");
        if (this.#pending === 0) {
          this.emit("idle");
        }
        return false;
      }
      if (!this.#isPaused) {
        const canInitializeInterval = !this.#isIntervalPaused;
        if (this.#doesIntervalAllowAnother && this.#doesConcurrentAllowAnother) {
          const job = this.#queue.dequeue();
          if (!job) {
            return false;
          }
          this.emit("active");
          job();
          if (canInitializeInterval) {
            this.#initializeIntervalIfNeeded();
          }
          return true;
        }
      }
      return false;
    }
    #initializeIntervalIfNeeded() {
      if (this.#isIntervalIgnored || this.#intervalId !== void 0) {
        return;
      }
      this.#intervalId = setInterval(() => {
        this.#onInterval();
      }, this.#interval);
      this.#intervalEnd = Date.now() + this.#interval;
    }
    #onInterval() {
      if (this.#intervalCount === 0 && this.#pending === 0 && this.#intervalId) {
        clearInterval(this.#intervalId);
        this.#intervalId = void 0;
      }
      this.#intervalCount = this.#carryoverConcurrencyCount ? this.#pending : 0;
      this.#processQueue();
    }
    /**
    Executes all queued functions until it reaches the limit.
    */
    #processQueue() {
      while (this.#tryToStartAnother()) {
      }
    }
    get concurrency() {
      return this.#concurrency;
    }
    set concurrency(newConcurrency) {
      if (!(typeof newConcurrency === "number" && newConcurrency >= 1)) {
        throw new TypeError(`Expected \`concurrency\` to be a number from 1 and up, got \`${newConcurrency}\` (${typeof newConcurrency})`);
      }
      this.#concurrency = newConcurrency;
      this.#processQueue();
    }
    async #throwOnAbort(signal) {
      return new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => {
          reject(signal.reason);
        }, { once: true });
      });
    }
    /**
        Updates the priority of a promise function by its id, affecting its execution order. Requires a defined concurrency limit to take effect.
    
        For example, this can be used to prioritize a promise function to run earlier.
    
        ```js
        import PQueue from 'p-queue';
    
        const queue = new PQueue({concurrency: 1});
    
        queue.add(async () => '🦄', {priority: 1});
        queue.add(async () => '🦀', {priority: 0, id: '🦀'});
        queue.add(async () => '🦄', {priority: 1});
        queue.add(async () => '🦄', {priority: 1});
    
        queue.setPriority('🦀', 2);
        ```
    
        In this case, the promise function with `id: '🦀'` runs second.
    
        You can also deprioritize a promise function to delay its execution:
    
        ```js
        import PQueue from 'p-queue';
    
        const queue = new PQueue({concurrency: 1});
    
        queue.add(async () => '🦄', {priority: 1});
        queue.add(async () => '🦀', {priority: 1, id: '🦀'});
        queue.add(async () => '🦄');
        queue.add(async () => '🦄', {priority: 0});
    
        queue.setPriority('🦀', -1);
        ```
        Here, the promise function with `id: '🦀'` executes last.
        */
    setPriority(id, priority) {
      this.#queue.setPriority(id, priority);
    }
    async add(function_, options = {}) {
      options.id ??= (this.#idAssigner++).toString();
      options = {
        timeout: this.timeout,
        throwOnTimeout: this.#throwOnTimeout,
        ...options
      };
      return new Promise((resolve7, reject) => {
        this.#queue.enqueue(async () => {
          this.#pending++;
          try {
            options.signal?.throwIfAborted();
            this.#intervalCount++;
            let operation = function_({ signal: options.signal });
            if (options.timeout) {
              operation = pTimeout(Promise.resolve(operation), { milliseconds: options.timeout });
            }
            if (options.signal) {
              operation = Promise.race([operation, this.#throwOnAbort(options.signal)]);
            }
            const result = await operation;
            resolve7(result);
            this.emit("completed", result);
          } catch (error) {
            if (error instanceof TimeoutError && !options.throwOnTimeout) {
              resolve7();
              return;
            }
            reject(error);
            this.emit("error", error);
          } finally {
            this.#next();
          }
        }, options);
        this.emit("add");
        this.#tryToStartAnother();
      });
    }
    async addAll(functions, options) {
      return Promise.all(functions.map(async (function_) => this.add(function_, options)));
    }
    /**
    Start (or resume) executing enqueued tasks within concurrency limit. No need to call this if queue is not paused (via `options.autoStart = false` or by `.pause()` method.)
    */
    start() {
      if (!this.#isPaused) {
        return this;
      }
      this.#isPaused = false;
      this.#processQueue();
      return this;
    }
    /**
    Put queue execution on hold.
    */
    pause() {
      this.#isPaused = true;
    }
    /**
    Clear the queue.
    */
    clear() {
      this.#queue = new this.#queueClass();
    }
    /**
        Can be called multiple times. Useful if you for example add additional items at a later time.
    
        @returns A promise that settles when the queue becomes empty.
        */
    async onEmpty() {
      if (this.#queue.size === 0) {
        return;
      }
      await this.#onEvent("empty");
    }
    /**
        @returns A promise that settles when the queue size is less than the given limit: `queue.size < limit`.
    
        If you want to avoid having the queue grow beyond a certain size you can `await queue.onSizeLessThan()` before adding a new item.
    
        Note that this only limits the number of items waiting to start. There could still be up to `concurrency` jobs already running that this call does not include in its calculation.
        */
    async onSizeLessThan(limit) {
      if (this.#queue.size < limit) {
        return;
      }
      await this.#onEvent("next", () => this.#queue.size < limit);
    }
    /**
        The difference with `.onEmpty` is that `.onIdle` guarantees that all work from the queue has finished. `.onEmpty` merely signals that the queue is empty, but it could mean that some promises haven't completed yet.
    
        @returns A promise that settles when the queue becomes empty, and all promises have completed; `queue.size === 0 && queue.pending === 0`.
        */
    async onIdle() {
      if (this.#pending === 0 && this.#queue.size === 0) {
        return;
      }
      await this.#onEvent("idle");
    }
    async #onEvent(event, filter2) {
      return new Promise((resolve7) => {
        const listener = () => {
          if (filter2 && !filter2()) {
            return;
          }
          this.off(event, listener);
          resolve7();
        };
        this.on(event, listener);
      });
    }
    /**
    Size of the queue, the number of queued items waiting to run.
    */
    get size() {
      return this.#queue.size;
    }
    /**
        Size of the queue, filtered by the given options.
    
        For example, this can be used to find the number of items remaining in the queue with a specific priority level.
        */
    sizeBy(options) {
      return this.#queue.filter(options).length;
    }
    /**
    Number of running items (no longer in the queue).
    */
    get pending() {
      return this.#pending;
    }
    /**
    Whether the queue is currently paused.
    */
    get isPaused() {
      return this.#isPaused;
    }
  };

  // node_modules/ipfs-unixfs-exporter/dist/src/resolvers/unixfs-v1/content/file.js
  async function walkDAG(blockstore, node, queue, streamPosition, start, end, options) {
    if (node instanceof Uint8Array) {
      const buf = extract_data_from_block_default(node, streamPosition, start, end);
      queue.push(buf);
      return;
    }
    if (node.Data == null) {
      throw new NotUnixFSError("no data in PBNode");
    }
    let file;
    try {
      file = UnixFS.unmarshal(node.Data);
    } catch (err) {
      throw new NotUnixFSError(err.message);
    }
    if (file.data != null) {
      const data = file.data;
      const buf = extract_data_from_block_default(data, streamPosition, start, end);
      queue.push(buf);
      streamPosition += BigInt(buf.byteLength);
    }
    const childOps = [];
    if (node.Links.length !== file.blockSizes.length) {
      throw new NotUnixFSError("Inconsistent block sizes and dag links");
    }
    for (let i = 0; i < node.Links.length; i++) {
      const childLink = node.Links[i];
      const childStart = streamPosition;
      const childEnd = childStart + file.blockSizes[i];
      if (start >= childStart && start < childEnd || // child has offset byte
      end >= childStart && end <= childEnd || // child has end byte
      start < childStart && end > childEnd) {
        childOps.push({
          link: childLink,
          blockStart: streamPosition
        });
      }
      streamPosition = childEnd;
      if (streamPosition > end) {
        break;
      }
    }
    await pipe(childOps, (source) => src_default4(source, (op) => {
      return async () => {
        const block = await blockstore.get(op.link.Hash, options);
        return {
          ...op,
          block
        };
      };
    }), (source) => parallel(source, {
      ordered: true,
      concurrency: options.blockReadConcurrency
    }), async (source) => {
      for await (const { link, block, blockStart } of source) {
        let child;
        switch (link.Hash.code) {
          case code3:
            child = decode15(block);
            break;
          case code5:
            child = block;
            break;
          default:
            queue.end(new NotUnixFSError(`Unsupported codec: ${link.Hash.code}`));
            return;
        }
        const childQueue = new PQueue({
          concurrency: 1
        });
        childQueue.on("error", (error) => {
          queue.end(error);
        });
        void childQueue.add(async () => {
          options.onProgress?.(new CustomProgressEvent("unixfs:exporter:walk:file", {
            cid: link.Hash
          }));
          await walkDAG(blockstore, child, queue, blockStart, start, end, options);
        });
        await childQueue.onIdle();
      }
    });
    if (streamPosition >= end) {
      queue.end();
    }
  }
  var fileContent = (cid, node, unixfs, path, resolve7, depth, blockstore) => {
    async function* yieldFileContent(options = {}) {
      const fileSize = unixfs.fileSize();
      if (fileSize === void 0) {
        throw new Error("File was a directory");
      }
      const { start, end } = validate_offset_and_length_default(fileSize, options.offset, options.length);
      if (end === 0n) {
        return;
      }
      let read6 = 0n;
      const wanted = end - start;
      const queue = pushable();
      options.onProgress?.(new CustomProgressEvent("unixfs:exporter:walk:file", {
        cid
      }));
      void walkDAG(blockstore, node, queue, 0n, start, end, options).catch((err) => {
        queue.end(err);
      });
      for await (const buf of queue) {
        if (buf == null) {
          continue;
        }
        read6 += BigInt(buf.byteLength);
        if (read6 > wanted) {
          queue.end();
          throw new OverReadError("Read too many bytes - the file size reported by the UnixFS data in the root node may be incorrect");
        }
        if (read6 === wanted) {
          queue.end();
        }
        options.onProgress?.(new CustomProgressEvent("unixfs:exporter:progress:unixfs:file", {
          bytesRead: read6,
          totalBytes: wanted,
          fileSize
        }));
        yield buf;
      }
      if (read6 < wanted) {
        throw new UnderReadError("Traversed entire DAG but did not read enough bytes");
      }
    }
    return yieldFileContent;
  };
  var file_default = fileContent;

  // node_modules/ipfs-unixfs-exporter/dist/src/resolvers/unixfs-v1/content/hamt-sharded-directory.js
  var hamtShardedDirectoryContent = (cid, node, unixfs, path, resolve7, depth, blockstore) => {
    function yieldHamtDirectoryContent(options = {}) {
      options.onProgress?.(new CustomProgressEvent("unixfs:exporter:walk:hamt-sharded-directory", {
        cid
      }));
      return listDirectory(node, path, resolve7, depth, blockstore, options);
    }
    return yieldHamtDirectoryContent;
  };
  async function* listDirectory(node, path, resolve7, depth, blockstore, options) {
    const links = node.Links;
    if (node.Data == null) {
      throw new NotUnixFSError("no data in PBNode");
    }
    let dir;
    try {
      dir = UnixFS.unmarshal(node.Data);
    } catch (err) {
      throw new NotUnixFSError(err.message);
    }
    if (dir.fanout == null) {
      throw new NotUnixFSError("missing fanout");
    }
    const padLength = (dir.fanout - 1n).toString(16).length;
    const results = pipe(links, (source) => src_default4(source, (link) => {
      return async () => {
        const name3 = link.Name != null ? link.Name.substring(padLength) : null;
        if (name3 != null && name3 !== "") {
          const result = await resolve7(link.Hash, name3, `${path}/${name3}`, [], depth + 1, blockstore, options);
          return { entries: result.entry == null ? [] : [result.entry] };
        } else {
          const block = await blockstore.get(link.Hash, options);
          node = decode15(block);
          options.onProgress?.(new CustomProgressEvent("unixfs:exporter:walk:hamt-sharded-directory", {
            cid: link.Hash
          }));
          return { entries: listDirectory(node, path, resolve7, depth, blockstore, options) };
        }
      };
    }), (source) => parallel(source, {
      ordered: true,
      concurrency: options.blockReadConcurrency
    }));
    for await (const { entries } of results) {
      yield* entries;
    }
  }
  var hamt_sharded_directory_default = hamtShardedDirectoryContent;

  // node_modules/ipfs-unixfs-exporter/dist/src/resolvers/unixfs-v1/index.js
  var findLinkCid = (node, name3) => {
    const link = node.Links.find((link2) => link2.Name === name3);
    return link?.Hash;
  };
  var contentExporters = {
    raw: file_default,
    file: file_default,
    directory: directory_default,
    "hamt-sharded-directory": hamt_sharded_directory_default,
    metadata: (cid, node, unixfs, path, resolve7, depth, blockstore) => {
      return () => [];
    },
    symlink: (cid, node, unixfs, path, resolve7, depth, blockstore) => {
      return () => [];
    }
  };
  var unixFsResolver = async (cid, name3, path, toResolve, resolve7, depth, blockstore, options) => {
    const block = await blockstore.get(cid, options);
    const node = decode15(block);
    let unixfs;
    let next;
    if (name3 == null) {
      name3 = cid.toString();
    }
    if (node.Data == null) {
      throw new NotUnixFSError("no data in PBNode");
    }
    try {
      unixfs = UnixFS.unmarshal(node.Data);
    } catch (err) {
      throw new NotUnixFSError(err.message);
    }
    if (path == null) {
      path = name3;
    }
    if (toResolve.length > 0) {
      let linkCid;
      if (unixfs?.type === "hamt-sharded-directory") {
        linkCid = await find_cid_in_shard_default(node, toResolve[0], blockstore);
      } else {
        linkCid = findLinkCid(node, toResolve[0]);
      }
      if (linkCid == null) {
        throw new NotFoundError("file does not exist");
      }
      const nextName = toResolve.shift();
      const nextPath = `${path}/${nextName}`;
      next = {
        cid: linkCid,
        toResolve,
        name: nextName ?? "",
        path: nextPath
      };
    }
    const content = contentExporters[unixfs.type](cid, node, unixfs, path, resolve7, depth, blockstore);
    if (content == null) {
      throw new NotFoundError("could not find content exporter");
    }
    if (unixfs.isDirectory()) {
      return {
        entry: {
          type: "directory",
          name: name3,
          path,
          cid,
          content,
          unixfs,
          depth,
          node,
          size: unixfs.fileSize()
        },
        next
      };
    }
    return {
      entry: {
        type: "file",
        name: name3,
        path,
        cid,
        content,
        unixfs,
        depth,
        node,
        size: unixfs.fileSize()
      },
      next
    };
  };
  var unixfs_v1_default = unixFsResolver;

  // node_modules/ipfs-unixfs-exporter/dist/src/resolvers/index.js
  var resolvers = {
    [code3]: unixfs_v1_default,
    [code5]: raw_default,
    [code]: dag_cbor_default,
    [code2]: dag_json_default,
    [identity.code]: identity_default,
    [code4]: json_default
  };
  var resolve6 = async (cid, name3, path, toResolve, depth, blockstore, options) => {
    const resolver = resolvers[cid.code];
    if (resolver == null) {
      throw new NoResolverError(`No resolver for code ${cid.code}`);
    }
    return resolver(cid, name3, path, toResolve, resolve6, depth, blockstore, options);
  };
  var resolvers_default = resolve6;

  // node_modules/ipfs-unixfs-exporter/dist/src/index.js
  var toPathComponents = (path = "") => {
    return (path.trim().match(/([^\\^/]|\\\/)+/g) ?? []).filter(Boolean);
  };
  var cidAndRest = (path) => {
    if (path instanceof Uint8Array) {
      return {
        cid: CID.decode(path),
        toResolve: []
      };
    }
    const cid = CID.asCID(path);
    if (cid != null) {
      return {
        cid,
        toResolve: []
      };
    }
    if (typeof path === "string") {
      if (path.indexOf("/ipfs/") === 0) {
        path = path.substring(6);
      }
      const output = toPathComponents(path);
      return {
        cid: CID.parse(output[0]),
        toResolve: output.slice(1)
      };
    }
    throw new BadPathError(`Unknown path type ${path}`);
  };
  async function* walkPath(path, blockstore, options = {}) {
    let { cid, toResolve } = cidAndRest(path);
    let name3 = cid.toString();
    let entryPath = name3;
    const startingDepth = toResolve.length;
    while (true) {
      const result = await resolvers_default(cid, name3, entryPath, toResolve, startingDepth, blockstore, options);
      if (result.entry == null && result.next == null) {
        throw new NotFoundError(`Could not resolve ${path}`);
      }
      if (result.entry != null) {
        yield result.entry;
      }
      if (result.next == null) {
        return;
      }
      toResolve = result.next.toResolve;
      cid = result.next.cid;
      name3 = result.next.name;
      entryPath = result.next.path;
    }
  }
  async function exporter(path, blockstore, options = {}) {
    const result = await src_default(walkPath(path, blockstore, options));
    if (result == null) {
      throw new NotFoundError(`Could not resolve ${path}`);
    }
    return result;
  }
  return __toCommonJS(stdin_exports);
})();
