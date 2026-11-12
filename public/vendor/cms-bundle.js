var LocalCMS = (() => {
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
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
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

  // node_modules/pvtsutils/build/index.js
  var require_build = __commonJS({
    "node_modules/pvtsutils/build/index.js"(exports) {
      "use strict";
      var ARRAY_BUFFER_NAME = "[object ArrayBuffer]";
      var BufferSourceConverter4 = class _BufferSourceConverter {
        static isArrayBuffer(data) {
          return Object.prototype.toString.call(data) === ARRAY_BUFFER_NAME;
        }
        static toArrayBuffer(data) {
          if (this.isArrayBuffer(data)) {
            return data;
          }
          if (data.byteLength === data.buffer.byteLength) {
            return data.buffer;
          }
          if (data.byteOffset === 0 && data.byteLength === data.buffer.byteLength) {
            return data.buffer;
          }
          return this.toUint8Array(data.buffer).slice(data.byteOffset, data.byteOffset + data.byteLength).buffer;
        }
        static toUint8Array(data) {
          return this.toView(data, Uint8Array);
        }
        static toView(data, type) {
          if (data.constructor === type) {
            return data;
          }
          if (this.isArrayBuffer(data)) {
            return new type(data);
          }
          if (this.isArrayBufferView(data)) {
            return new type(data.buffer, data.byteOffset, data.byteLength);
          }
          throw new TypeError("The provided value is not of type '(ArrayBuffer or ArrayBufferView)'");
        }
        static isBufferSource(data) {
          return this.isArrayBufferView(data) || this.isArrayBuffer(data);
        }
        static isArrayBufferView(data) {
          return ArrayBuffer.isView(data) || data && this.isArrayBuffer(data.buffer);
        }
        static isEqual(a, b) {
          const aView = _BufferSourceConverter.toUint8Array(a);
          const bView = _BufferSourceConverter.toUint8Array(b);
          if (aView.length !== bView.byteLength) {
            return false;
          }
          for (let i = 0; i < aView.length; i++) {
            if (aView[i] !== bView[i]) {
              return false;
            }
          }
          return true;
        }
        static concat(...args) {
          let buffers;
          if (Array.isArray(args[0]) && !(args[1] instanceof Function)) {
            buffers = args[0];
          } else if (Array.isArray(args[0]) && args[1] instanceof Function) {
            buffers = args[0];
          } else {
            if (args[args.length - 1] instanceof Function) {
              buffers = args.slice(0, args.length - 1);
            } else {
              buffers = args;
            }
          }
          let size = 0;
          for (const buffer of buffers) {
            size += buffer.byteLength;
          }
          const res = new Uint8Array(size);
          let offset = 0;
          for (const buffer of buffers) {
            const view = this.toUint8Array(buffer);
            res.set(view, offset);
            offset += view.length;
          }
          if (args[args.length - 1] instanceof Function) {
            return this.toView(res, args[args.length - 1]);
          }
          return res.buffer;
        }
      };
      var STRING_TYPE = "string";
      var HEX_REGEX = /^[0-9a-f\s]+$/i;
      var BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
      var BASE64URL_REGEX = /^[a-zA-Z0-9-_]+$/;
      var Utf8Converter = class {
        static fromString(text) {
          const s = unescape(encodeURIComponent(text));
          const uintArray = new Uint8Array(s.length);
          for (let i = 0; i < s.length; i++) {
            uintArray[i] = s.charCodeAt(i);
          }
          return uintArray.buffer;
        }
        static toString(buffer) {
          const buf = BufferSourceConverter4.toUint8Array(buffer);
          let encodedString = "";
          for (let i = 0; i < buf.length; i++) {
            encodedString += String.fromCharCode(buf[i]);
          }
          const decodedString = decodeURIComponent(escape(encodedString));
          return decodedString;
        }
      };
      var Utf16Converter = class {
        static toString(buffer, littleEndian = false) {
          const arrayBuffer = BufferSourceConverter4.toArrayBuffer(buffer);
          const dataView = new DataView(arrayBuffer);
          let res = "";
          for (let i = 0; i < arrayBuffer.byteLength; i += 2) {
            const code = dataView.getUint16(i, littleEndian);
            res += String.fromCharCode(code);
          }
          return res;
        }
        static fromString(text, littleEndian = false) {
          const res = new ArrayBuffer(text.length * 2);
          const dataView = new DataView(res);
          for (let i = 0; i < text.length; i++) {
            dataView.setUint16(i * 2, text.charCodeAt(i), littleEndian);
          }
          return res;
        }
      };
      var Convert3 = class _Convert {
        static isHex(data) {
          return typeof data === STRING_TYPE && HEX_REGEX.test(data);
        }
        static isBase64(data) {
          return typeof data === STRING_TYPE && BASE64_REGEX.test(data);
        }
        static isBase64Url(data) {
          return typeof data === STRING_TYPE && BASE64URL_REGEX.test(data);
        }
        static ToString(buffer, enc = "utf8") {
          const buf = BufferSourceConverter4.toUint8Array(buffer);
          switch (enc.toLowerCase()) {
            case "utf8":
              return this.ToUtf8String(buf);
            case "binary":
              return this.ToBinary(buf);
            case "hex":
              return this.ToHex(buf);
            case "base64":
              return this.ToBase64(buf);
            case "base64url":
              return this.ToBase64Url(buf);
            case "utf16le":
              return Utf16Converter.toString(buf, true);
            case "utf16":
            case "utf16be":
              return Utf16Converter.toString(buf);
            default:
              throw new Error(`Unknown type of encoding '${enc}'`);
          }
        }
        static FromString(str, enc = "utf8") {
          if (!str) {
            return new ArrayBuffer(0);
          }
          switch (enc.toLowerCase()) {
            case "utf8":
              return this.FromUtf8String(str);
            case "binary":
              return this.FromBinary(str);
            case "hex":
              return this.FromHex(str);
            case "base64":
              return this.FromBase64(str);
            case "base64url":
              return this.FromBase64Url(str);
            case "utf16le":
              return Utf16Converter.fromString(str, true);
            case "utf16":
            case "utf16be":
              return Utf16Converter.fromString(str);
            default:
              throw new Error(`Unknown type of encoding '${enc}'`);
          }
        }
        static ToBase64(buffer) {
          const buf = BufferSourceConverter4.toUint8Array(buffer);
          if (typeof btoa !== "undefined") {
            const binary = this.ToString(buf, "binary");
            return btoa(binary);
          } else {
            return Buffer.from(buf).toString("base64");
          }
        }
        static FromBase64(base64) {
          const formatted = this.formatString(base64);
          if (!formatted) {
            return new ArrayBuffer(0);
          }
          if (!_Convert.isBase64(formatted)) {
            throw new TypeError("Argument 'base64Text' is not Base64 encoded");
          }
          if (typeof atob !== "undefined") {
            return this.FromBinary(atob(formatted));
          } else {
            return new Uint8Array(Buffer.from(formatted, "base64")).buffer;
          }
        }
        static FromBase64Url(base64url) {
          const formatted = this.formatString(base64url);
          if (!formatted) {
            return new ArrayBuffer(0);
          }
          if (!_Convert.isBase64Url(formatted)) {
            throw new TypeError("Argument 'base64url' is not Base64Url encoded");
          }
          return this.FromBase64(this.Base64Padding(formatted.replace(/\-/g, "+").replace(/\_/g, "/")));
        }
        static ToBase64Url(data) {
          return this.ToBase64(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/\=/g, "");
        }
        static FromUtf8String(text, encoding = _Convert.DEFAULT_UTF8_ENCODING) {
          switch (encoding) {
            case "ascii":
              return this.FromBinary(text);
            case "utf8":
              return Utf8Converter.fromString(text);
            case "utf16":
            case "utf16be":
              return Utf16Converter.fromString(text);
            case "utf16le":
            case "usc2":
              return Utf16Converter.fromString(text, true);
            default:
              throw new Error(`Unknown type of encoding '${encoding}'`);
          }
        }
        static ToUtf8String(buffer, encoding = _Convert.DEFAULT_UTF8_ENCODING) {
          switch (encoding) {
            case "ascii":
              return this.ToBinary(buffer);
            case "utf8":
              return Utf8Converter.toString(buffer);
            case "utf16":
            case "utf16be":
              return Utf16Converter.toString(buffer);
            case "utf16le":
            case "usc2":
              return Utf16Converter.toString(buffer, true);
            default:
              throw new Error(`Unknown type of encoding '${encoding}'`);
          }
        }
        static FromBinary(text) {
          const stringLength = text.length;
          const resultView = new Uint8Array(stringLength);
          for (let i = 0; i < stringLength; i++) {
            resultView[i] = text.charCodeAt(i);
          }
          return resultView.buffer;
        }
        static ToBinary(buffer) {
          const buf = BufferSourceConverter4.toUint8Array(buffer);
          let res = "";
          for (let i = 0; i < buf.length; i++) {
            res += String.fromCharCode(buf[i]);
          }
          return res;
        }
        static ToHex(buffer) {
          const buf = BufferSourceConverter4.toUint8Array(buffer);
          let result = "";
          const len = buf.length;
          for (let i = 0; i < len; i++) {
            const byte = buf[i];
            if (byte < 16) {
              result += "0";
            }
            result += byte.toString(16);
          }
          return result;
        }
        static FromHex(hexString) {
          let formatted = this.formatString(hexString);
          if (!formatted) {
            return new ArrayBuffer(0);
          }
          if (!_Convert.isHex(formatted)) {
            throw new TypeError("Argument 'hexString' is not HEX encoded");
          }
          if (formatted.length % 2) {
            formatted = `0${formatted}`;
          }
          const res = new Uint8Array(formatted.length / 2);
          for (let i = 0; i < formatted.length; i = i + 2) {
            const c = formatted.slice(i, i + 2);
            res[i / 2] = parseInt(c, 16);
          }
          return res.buffer;
        }
        static ToUtf16String(buffer, littleEndian = false) {
          return Utf16Converter.toString(buffer, littleEndian);
        }
        static FromUtf16String(text, littleEndian = false) {
          return Utf16Converter.fromString(text, littleEndian);
        }
        static Base64Padding(base64) {
          const padCount = 4 - base64.length % 4;
          if (padCount < 4) {
            for (let i = 0; i < padCount; i++) {
              base64 += "=";
            }
          }
          return base64;
        }
        static formatString(data) {
          return (data === null || data === void 0 ? void 0 : data.replace(/[\n\r\t ]/g, "")) || "";
        }
      };
      Convert3.DEFAULT_UTF8_ENCODING = "utf8";
      function assign(target, ...sources) {
        const res = arguments[0];
        for (let i = 1; i < arguments.length; i++) {
          const obj = arguments[i];
          for (const prop in obj) {
            res[prop] = obj[prop];
          }
        }
        return res;
      }
      function combine(...buf) {
        const totalByteLength = buf.map((item) => item.byteLength).reduce((prev, cur) => prev + cur);
        const res = new Uint8Array(totalByteLength);
        let currentPos = 0;
        buf.map((item) => new Uint8Array(item)).forEach((arr) => {
          for (const item2 of arr) {
            res[currentPos++] = item2;
          }
        });
        return res.buffer;
      }
      function isEqual(bytes1, bytes2) {
        if (!(bytes1 && bytes2)) {
          return false;
        }
        if (bytes1.byteLength !== bytes2.byteLength) {
          return false;
        }
        const b1 = new Uint8Array(bytes1);
        const b2 = new Uint8Array(bytes2);
        for (let i = 0; i < bytes1.byteLength; i++) {
          if (b1[i] !== b2[i]) {
            return false;
          }
        }
        return true;
      }
      exports.BufferSourceConverter = BufferSourceConverter4;
      exports.Convert = Convert3;
      exports.assign = assign;
      exports.combine = combine;
      exports.isEqual = isEqual;
    }
  });

  // <stdin>
  var stdin_exports = {};
  __export(stdin_exports, {
    ContentInfo: () => ContentInfo,
    CryptoEngine: () => CryptoEngine,
    SignedData: () => SignedData,
    asn1js: () => index_es_exports,
    setEngine: () => setEngine
  });

  // node_modules/asn1js/build/index.es.js
  var index_es_exports = {};
  __export(index_es_exports, {
    Any: () => Any,
    BaseBlock: () => BaseBlock,
    BaseStringBlock: () => BaseStringBlock,
    BitString: () => BitString,
    BmpString: () => BmpString,
    Boolean: () => Boolean,
    CharacterString: () => CharacterString,
    Choice: () => Choice,
    Constructed: () => Constructed,
    DATE: () => DATE,
    DateTime: () => DateTime,
    Duration: () => Duration,
    EndOfContent: () => EndOfContent,
    Enumerated: () => Enumerated,
    GeneralString: () => GeneralString,
    GeneralizedTime: () => GeneralizedTime,
    GraphicString: () => GraphicString,
    HexBlock: () => HexBlock,
    IA5String: () => IA5String,
    Integer: () => Integer,
    Null: () => Null,
    NumericString: () => NumericString,
    ObjectIdentifier: () => ObjectIdentifier,
    OctetString: () => OctetString,
    Primitive: () => Primitive,
    PrintableString: () => PrintableString,
    RawData: () => RawData,
    RelativeObjectIdentifier: () => RelativeObjectIdentifier,
    Repeated: () => Repeated,
    Sequence: () => Sequence,
    Set: () => Set,
    TIME: () => TIME,
    TeletexString: () => TeletexString,
    TimeOfDay: () => TimeOfDay,
    UTCTime: () => UTCTime,
    UniversalString: () => UniversalString,
    Utf8String: () => Utf8String,
    ValueBlock: () => ValueBlock,
    VideotexString: () => VideotexString,
    ViewWriter: () => ViewWriter,
    VisibleString: () => VisibleString,
    compareSchema: () => compareSchema,
    fromBER: () => fromBER,
    verifySchema: () => verifySchema
  });
  var pvtsutils = __toESM(require_build());

  // node_modules/pvutils/build/utils.es.js
  function getParametersValue(parameters, name, defaultValue) {
    var _a3;
    if (parameters instanceof Object === false) {
      return defaultValue;
    }
    return (_a3 = parameters[name]) !== null && _a3 !== void 0 ? _a3 : defaultValue;
  }
  function bufferToHexCodes(inputBuffer, inputOffset = 0, inputLength = inputBuffer.byteLength - inputOffset, insertSpace = false) {
    let result = "";
    for (const item of new Uint8Array(inputBuffer, inputOffset, inputLength)) {
      const str = item.toString(16).toUpperCase();
      if (str.length === 1) {
        result += "0";
      }
      result += str;
      if (insertSpace) {
        result += " ";
      }
    }
    return result.trim();
  }
  function utilFromBase(inputBuffer, inputBase) {
    let result = 0;
    if (inputBuffer.length === 1) {
      return inputBuffer[0];
    }
    for (let i = inputBuffer.length - 1; i >= 0; i--) {
      result += inputBuffer[inputBuffer.length - 1 - i] * Math.pow(2, inputBase * i);
    }
    return result;
  }
  function utilToBase(value, base, reserved = -1) {
    const internalReserved = reserved;
    let internalValue = value;
    let result = 0;
    let biggest = Math.pow(2, base);
    for (let i = 1; i < 8; i++) {
      if (value < biggest) {
        let retBuf;
        if (internalReserved < 0) {
          retBuf = new ArrayBuffer(i);
          result = i;
        } else {
          if (internalReserved < i) {
            return new ArrayBuffer(0);
          }
          retBuf = new ArrayBuffer(internalReserved);
          result = internalReserved;
        }
        const retView = new Uint8Array(retBuf);
        for (let j = i - 1; j >= 0; j--) {
          const basis = Math.pow(2, j * base);
          retView[result - j - 1] = Math.floor(internalValue / basis);
          internalValue -= retView[result - j - 1] * basis;
        }
        return retBuf;
      }
      biggest *= Math.pow(2, base);
    }
    return new ArrayBuffer(0);
  }
  function utilConcatBuf(...buffers) {
    let outputLength = 0;
    let prevLength = 0;
    for (const buffer of buffers) {
      outputLength += buffer.byteLength;
    }
    const retBuf = new ArrayBuffer(outputLength);
    const retView = new Uint8Array(retBuf);
    for (const buffer of buffers) {
      retView.set(new Uint8Array(buffer), prevLength);
      prevLength += buffer.byteLength;
    }
    return retBuf;
  }
  function utilConcatView(...views) {
    let outputLength = 0;
    let prevLength = 0;
    for (const view of views) {
      outputLength += view.length;
    }
    const retBuf = new ArrayBuffer(outputLength);
    const retView = new Uint8Array(retBuf);
    for (const view of views) {
      retView.set(view, prevLength);
      prevLength += view.length;
    }
    return retView;
  }
  function utilDecodeTC() {
    const buf = new Uint8Array(this.valueHex);
    if (this.valueHex.byteLength >= 2) {
      const condition1 = buf[0] === 255 && buf[1] & 128;
      const condition2 = buf[0] === 0 && (buf[1] & 128) === 0;
      if (condition1 || condition2) {
        this.warnings.push("Needlessly long format");
      }
    }
    const bigIntBuffer = new ArrayBuffer(this.valueHex.byteLength);
    const bigIntView = new Uint8Array(bigIntBuffer);
    for (let i = 0; i < this.valueHex.byteLength; i++) {
      bigIntView[i] = 0;
    }
    bigIntView[0] = buf[0] & 128;
    const bigInt = utilFromBase(bigIntView, 8);
    const smallIntBuffer = new ArrayBuffer(this.valueHex.byteLength);
    const smallIntView = new Uint8Array(smallIntBuffer);
    for (let j = 0; j < this.valueHex.byteLength; j++) {
      smallIntView[j] = buf[j];
    }
    smallIntView[0] &= 127;
    const smallInt = utilFromBase(smallIntView, 8);
    return smallInt - bigInt;
  }
  function utilEncodeTC(value) {
    const modValue = value < 0 ? value * -1 : value;
    let bigInt = 128;
    for (let i = 1; i < 8; i++) {
      if (modValue <= bigInt) {
        if (value < 0) {
          const smallInt = bigInt - modValue;
          const retBuf2 = utilToBase(smallInt, 8, i);
          const retView2 = new Uint8Array(retBuf2);
          retView2[0] |= 128;
          return retBuf2;
        }
        let retBuf = utilToBase(modValue, 8, i);
        let retView = new Uint8Array(retBuf);
        if (retView[0] & 128) {
          const tempBuf = retBuf.slice(0);
          const tempView = new Uint8Array(tempBuf);
          retBuf = new ArrayBuffer(retBuf.byteLength + 1);
          retView = new Uint8Array(retBuf);
          for (let k = 0; k < tempBuf.byteLength; k++) {
            retView[k + 1] = tempView[k];
          }
          retView[0] = 0;
        }
        return retBuf;
      }
      bigInt *= Math.pow(2, 8);
    }
    return new ArrayBuffer(0);
  }
  function isEqualBuffer(inputBuffer1, inputBuffer2) {
    if (inputBuffer1.byteLength !== inputBuffer2.byteLength) {
      return false;
    }
    const view1 = new Uint8Array(inputBuffer1);
    const view2 = new Uint8Array(inputBuffer2);
    for (let i = 0; i < view1.length; i++) {
      if (view1[i] !== view2[i]) {
        return false;
      }
    }
    return true;
  }
  function padNumber(inputNumber, fullLength) {
    const str = inputNumber.toString(10);
    if (fullLength < str.length) {
      return "";
    }
    const dif = fullLength - str.length;
    const padding = Array.from({ length: dif });
    for (let i = 0; i < dif; i++) {
      padding[i] = "0";
    }
    const paddingString = padding.join("");
    return paddingString.concat(str);
  }
  var base64Template = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  var base64UrlTemplate = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=";
  function toBase64(input, useUrlTemplate = false, skipPadding = false, skipLeadingZeros = false) {
    let i = 0;
    let flag1 = 0;
    let flag2 = 0;
    let output2 = "";
    const template = useUrlTemplate ? base64UrlTemplate : base64Template;
    if (skipLeadingZeros) {
      let nonZeroPosition = 0;
      for (let i2 = 0; i2 < input.length; i2++) {
        if (input.charCodeAt(i2) !== 0) {
          nonZeroPosition = i2;
          break;
        }
      }
      input = input.slice(nonZeroPosition);
    }
    while (i < input.length) {
      const chr1 = input.charCodeAt(i++);
      if (i >= input.length) {
        flag1 = 1;
      }
      const chr2 = input.charCodeAt(i++);
      if (i >= input.length) {
        flag2 = 1;
      }
      const chr3 = input.charCodeAt(i++);
      const enc1 = chr1 >> 2;
      const enc2 = (chr1 & 3) << 4 | chr2 >> 4;
      let enc3 = (chr2 & 15) << 2 | chr3 >> 6;
      let enc4 = chr3 & 63;
      if (flag1 === 1) {
        enc3 = enc4 = 64;
      } else {
        if (flag2 === 1) {
          enc4 = 64;
        }
      }
      if (skipPadding) {
        if (enc3 === 64) {
          output2 += `${template.charAt(enc1)}${template.charAt(enc2)}`;
        } else {
          if (enc4 === 64) {
            output2 += `${template.charAt(enc1)}${template.charAt(enc2)}${template.charAt(enc3)}`;
          } else {
            output2 += `${template.charAt(enc1)}${template.charAt(enc2)}${template.charAt(enc3)}${template.charAt(enc4)}`;
          }
        }
      } else {
        output2 += `${template.charAt(enc1)}${template.charAt(enc2)}${template.charAt(enc3)}${template.charAt(enc4)}`;
      }
    }
    return output2;
  }
  function fromBase64(input, useUrlTemplate = false, cutTailZeros = false) {
    const template = useUrlTemplate ? base64UrlTemplate : base64Template;
    function indexOf(toSearch) {
      for (let i2 = 0; i2 < 64; i2++) {
        if (template.charAt(i2) === toSearch)
          return i2;
      }
      return 64;
    }
    function test(incoming) {
      return incoming === 64 ? 0 : incoming;
    }
    let i = 0;
    let output2 = "";
    while (i < input.length) {
      const enc1 = indexOf(input.charAt(i++));
      const enc2 = i >= input.length ? 0 : indexOf(input.charAt(i++));
      const enc3 = i >= input.length ? 0 : indexOf(input.charAt(i++));
      const enc4 = i >= input.length ? 0 : indexOf(input.charAt(i++));
      const chr1 = test(enc1) << 2 | test(enc2) >> 4;
      const chr2 = (test(enc2) & 15) << 4 | test(enc3) >> 2;
      const chr3 = (test(enc3) & 3) << 6 | test(enc4);
      output2 += String.fromCharCode(chr1);
      if (enc3 !== 64) {
        output2 += String.fromCharCode(chr2);
      }
      if (enc4 !== 64) {
        output2 += String.fromCharCode(chr3);
      }
    }
    if (cutTailZeros) {
      const outputLength = output2.length;
      let nonZeroStart = -1;
      for (let i2 = outputLength - 1; i2 >= 0; i2--) {
        if (output2.charCodeAt(i2) !== 0) {
          nonZeroStart = i2;
          break;
        }
      }
      if (nonZeroStart !== -1) {
        output2 = output2.slice(0, nonZeroStart + 1);
      } else {
        output2 = "";
      }
    }
    return output2;
  }
  function arrayBufferToString(buffer) {
    let resultString = "";
    const view = new Uint8Array(buffer);
    for (const element of view) {
      resultString += String.fromCharCode(element);
    }
    return resultString;
  }
  function stringToArrayBuffer(str) {
    const stringLength = str.length;
    const resultBuffer = new ArrayBuffer(stringLength);
    const resultView = new Uint8Array(resultBuffer);
    for (let i = 0; i < stringLength; i++) {
      resultView[i] = str.charCodeAt(i);
    }
    return resultBuffer;
  }
  var log2 = Math.log(2);
  function nearestPowerOf2(length) {
    const base = Math.log(length) / log2;
    const floor = Math.floor(base);
    const round = Math.round(base);
    return floor === round ? floor : round;
  }
  function clearProps(object, propsArray) {
    for (const prop of propsArray) {
      delete object[prop];
    }
  }

  // node_modules/asn1js/build/index.es.js
  function assertBigInt() {
    if (typeof BigInt === "undefined") {
      throw new Error("BigInt is not defined. Your environment doesn't implement BigInt.");
    }
  }
  function concat(buffers) {
    let outputLength = 0;
    let prevLength = 0;
    for (let i = 0; i < buffers.length; i++) {
      const buffer = buffers[i];
      outputLength += buffer.byteLength;
    }
    const retView = new Uint8Array(outputLength);
    for (let i = 0; i < buffers.length; i++) {
      const buffer = buffers[i];
      retView.set(new Uint8Array(buffer), prevLength);
      prevLength += buffer.byteLength;
    }
    return retView.buffer;
  }
  function checkBufferParams(baseBlock, inputBuffer, inputOffset, inputLength) {
    if (!(inputBuffer instanceof Uint8Array)) {
      baseBlock.error = "Wrong parameter: inputBuffer must be 'Uint8Array'";
      return false;
    }
    if (!inputBuffer.byteLength) {
      baseBlock.error = "Wrong parameter: inputBuffer has zero length";
      return false;
    }
    if (inputOffset < 0) {
      baseBlock.error = "Wrong parameter: inputOffset less than zero";
      return false;
    }
    if (inputLength < 0) {
      baseBlock.error = "Wrong parameter: inputLength less than zero";
      return false;
    }
    if (inputBuffer.byteLength - inputOffset - inputLength < 0) {
      baseBlock.error = "End of input reached before message was fully decoded (inconsistent offset and length values)";
      return false;
    }
    return true;
  }
  var ViewWriter = class {
    constructor() {
      this.items = [];
    }
    write(buf) {
      this.items.push(buf);
    }
    final() {
      return concat(this.items);
    }
  };
  var powers2 = [new Uint8Array([1])];
  var digitsString = "0123456789";
  var NAME = "name";
  var VALUE_HEX_VIEW = "valueHexView";
  var IS_HEX_ONLY = "isHexOnly";
  var ID_BLOCK = "idBlock";
  var TAG_CLASS = "tagClass";
  var TAG_NUMBER = "tagNumber";
  var IS_CONSTRUCTED = "isConstructed";
  var FROM_BER = "fromBER";
  var TO_BER = "toBER";
  var LOCAL = "local";
  var EMPTY_STRING = "";
  var EMPTY_BUFFER = new ArrayBuffer(0);
  var EMPTY_VIEW = new Uint8Array(0);
  var END_OF_CONTENT_NAME = "EndOfContent";
  var OCTET_STRING_NAME = "OCTET STRING";
  var BIT_STRING_NAME = "BIT STRING";
  function HexBlock(BaseClass) {
    var _a3;
    return _a3 = class Some extends BaseClass {
      get valueHex() {
        return this.valueHexView.slice().buffer;
      }
      set valueHex(value) {
        this.valueHexView = new Uint8Array(value);
      }
      constructor(...args) {
        var _b;
        super(...args);
        const params = args[0] || {};
        this.isHexOnly = (_b = params.isHexOnly) !== null && _b !== void 0 ? _b : false;
        this.valueHexView = params.valueHex ? pvtsutils.BufferSourceConverter.toUint8Array(params.valueHex) : EMPTY_VIEW;
      }
      fromBER(inputBuffer, inputOffset, inputLength) {
        const view = inputBuffer instanceof ArrayBuffer ? new Uint8Array(inputBuffer) : inputBuffer;
        if (!checkBufferParams(this, view, inputOffset, inputLength)) {
          return -1;
        }
        const endLength = inputOffset + inputLength;
        this.valueHexView = view.subarray(inputOffset, endLength);
        if (!this.valueHexView.length) {
          this.warnings.push("Zero buffer length");
          return inputOffset;
        }
        this.blockLength = inputLength;
        return endLength;
      }
      toBER(sizeOnly = false) {
        if (!this.isHexOnly) {
          this.error = "Flag 'isHexOnly' is not set, abort";
          return EMPTY_BUFFER;
        }
        if (sizeOnly) {
          return new ArrayBuffer(this.valueHexView.byteLength);
        }
        return this.valueHexView.byteLength === this.valueHexView.buffer.byteLength ? this.valueHexView.buffer : this.valueHexView.slice().buffer;
      }
      toJSON() {
        return {
          ...super.toJSON(),
          isHexOnly: this.isHexOnly,
          valueHex: pvtsutils.Convert.ToHex(this.valueHexView)
        };
      }
    }, _a3.NAME = "hexBlock", _a3;
  }
  var LocalBaseBlock = class {
    static blockName() {
      return this.NAME;
    }
    get valueBeforeDecode() {
      return this.valueBeforeDecodeView.slice().buffer;
    }
    set valueBeforeDecode(value) {
      this.valueBeforeDecodeView = new Uint8Array(value);
    }
    constructor({ blockLength = 0, error = EMPTY_STRING, warnings = [], valueBeforeDecode = EMPTY_VIEW } = {}) {
      this.blockLength = blockLength;
      this.error = error;
      this.warnings = warnings;
      this.valueBeforeDecodeView = pvtsutils.BufferSourceConverter.toUint8Array(valueBeforeDecode);
    }
    toJSON() {
      return {
        blockName: this.constructor.NAME,
        blockLength: this.blockLength,
        error: this.error,
        warnings: this.warnings,
        valueBeforeDecode: pvtsutils.Convert.ToHex(this.valueBeforeDecodeView)
      };
    }
  };
  LocalBaseBlock.NAME = "baseBlock";
  var ValueBlock = class extends LocalBaseBlock {
    fromBER(_inputBuffer, _inputOffset, _inputLength) {
      throw TypeError("User need to make a specific function in a class which extends 'ValueBlock'");
    }
    toBER(_sizeOnly, _writer) {
      throw TypeError("User need to make a specific function in a class which extends 'ValueBlock'");
    }
  };
  ValueBlock.NAME = "valueBlock";
  var LocalIdentificationBlock = class extends HexBlock(LocalBaseBlock) {
    constructor({ idBlock = {} } = {}) {
      var _a3, _b, _c, _d;
      super();
      if (idBlock) {
        this.isHexOnly = (_a3 = idBlock.isHexOnly) !== null && _a3 !== void 0 ? _a3 : false;
        this.valueHexView = idBlock.valueHex ? pvtsutils.BufferSourceConverter.toUint8Array(idBlock.valueHex) : EMPTY_VIEW;
        this.tagClass = (_b = idBlock.tagClass) !== null && _b !== void 0 ? _b : -1;
        this.tagNumber = (_c = idBlock.tagNumber) !== null && _c !== void 0 ? _c : -1;
        this.isConstructed = (_d = idBlock.isConstructed) !== null && _d !== void 0 ? _d : false;
      } else {
        this.tagClass = -1;
        this.tagNumber = -1;
        this.isConstructed = false;
      }
    }
    toBER(sizeOnly = false) {
      let firstOctet = 0;
      switch (this.tagClass) {
        case 1:
          firstOctet |= 0;
          break;
        case 2:
          firstOctet |= 64;
          break;
        case 3:
          firstOctet |= 128;
          break;
        case 4:
          firstOctet |= 192;
          break;
        default:
          this.error = "Unknown tag class";
          return EMPTY_BUFFER;
      }
      if (this.isConstructed)
        firstOctet |= 32;
      if (this.tagNumber < 31 && !this.isHexOnly) {
        const retView2 = new Uint8Array(1);
        if (!sizeOnly) {
          let number = this.tagNumber;
          number &= 31;
          firstOctet |= number;
          retView2[0] = firstOctet;
        }
        return retView2.buffer;
      }
      if (!this.isHexOnly) {
        const encodedBuf = utilToBase(this.tagNumber, 7);
        const encodedView = new Uint8Array(encodedBuf);
        const size = encodedBuf.byteLength;
        const retView2 = new Uint8Array(size + 1);
        retView2[0] = firstOctet | 31;
        if (!sizeOnly) {
          for (let i = 0; i < size - 1; i++)
            retView2[i + 1] = encodedView[i] | 128;
          retView2[size] = encodedView[size - 1];
        }
        return retView2.buffer;
      }
      const retView = new Uint8Array(this.valueHexView.byteLength + 1);
      retView[0] = firstOctet | 31;
      if (!sizeOnly) {
        const curView = this.valueHexView;
        for (let i = 0; i < curView.length - 1; i++)
          retView[i + 1] = curView[i] | 128;
        retView[this.valueHexView.byteLength] = curView[curView.length - 1];
      }
      return retView.buffer;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const inputView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
      if (!checkBufferParams(this, inputView, inputOffset, inputLength)) {
        return -1;
      }
      const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);
      if (intBuffer.length === 0) {
        this.error = "Zero buffer length";
        return -1;
      }
      const tagClassMask = intBuffer[0] & 192;
      switch (tagClassMask) {
        case 0:
          this.tagClass = 1;
          break;
        case 64:
          this.tagClass = 2;
          break;
        case 128:
          this.tagClass = 3;
          break;
        case 192:
          this.tagClass = 4;
          break;
        default:
          this.error = "Unknown tag class";
          return -1;
      }
      this.isConstructed = (intBuffer[0] & 32) === 32;
      this.isHexOnly = false;
      const tagNumberMask = intBuffer[0] & 31;
      if (tagNumberMask !== 31) {
        this.tagNumber = tagNumberMask;
        this.blockLength = 1;
      } else {
        let count = 1;
        let intTagNumberBuffer = this.valueHexView = new Uint8Array(255);
        let tagNumberBufferMaxLength = 255;
        while (intBuffer[count] & 128) {
          intTagNumberBuffer[count - 1] = intBuffer[count] & 127;
          count++;
          if (count >= intBuffer.length) {
            this.error = "End of input reached before message was fully decoded";
            return -1;
          }
          if (count === tagNumberBufferMaxLength) {
            tagNumberBufferMaxLength += 255;
            const tempBufferView2 = new Uint8Array(tagNumberBufferMaxLength);
            for (let i = 0; i < intTagNumberBuffer.length; i++)
              tempBufferView2[i] = intTagNumberBuffer[i];
            intTagNumberBuffer = this.valueHexView = new Uint8Array(tagNumberBufferMaxLength);
          }
        }
        this.blockLength = count + 1;
        intTagNumberBuffer[count - 1] = intBuffer[count] & 127;
        const tempBufferView = new Uint8Array(count);
        for (let i = 0; i < count; i++)
          tempBufferView[i] = intTagNumberBuffer[i];
        intTagNumberBuffer = this.valueHexView = new Uint8Array(count);
        intTagNumberBuffer.set(tempBufferView);
        if (this.blockLength <= 9)
          this.tagNumber = utilFromBase(intTagNumberBuffer, 7);
        else {
          this.isHexOnly = true;
          this.warnings.push("Tag too long, represented as hex-coded");
        }
      }
      if (this.tagClass === 1 && this.isConstructed) {
        switch (this.tagNumber) {
          case 1:
          case 2:
          case 5:
          case 6:
          case 9:
          case 13:
          case 14:
          case 23:
          case 24:
          case 31:
          case 32:
          case 33:
          case 34:
            this.error = "Constructed encoding used for primitive type";
            return -1;
        }
      }
      return inputOffset + this.blockLength;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        tagClass: this.tagClass,
        tagNumber: this.tagNumber,
        isConstructed: this.isConstructed
      };
    }
  };
  LocalIdentificationBlock.NAME = "identificationBlock";
  var LocalLengthBlock = class extends LocalBaseBlock {
    constructor({ lenBlock = {} } = {}) {
      var _a3, _b, _c;
      super();
      this.isIndefiniteForm = (_a3 = lenBlock.isIndefiniteForm) !== null && _a3 !== void 0 ? _a3 : false;
      this.longFormUsed = (_b = lenBlock.longFormUsed) !== null && _b !== void 0 ? _b : false;
      this.length = (_c = lenBlock.length) !== null && _c !== void 0 ? _c : 0;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const view = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
      if (!checkBufferParams(this, view, inputOffset, inputLength)) {
        return -1;
      }
      const intBuffer = view.subarray(inputOffset, inputOffset + inputLength);
      if (intBuffer.length === 0) {
        this.error = "Zero buffer length";
        return -1;
      }
      if (intBuffer[0] === 255) {
        this.error = "Length block 0xFF is reserved by standard";
        return -1;
      }
      this.isIndefiniteForm = intBuffer[0] === 128;
      if (this.isIndefiniteForm) {
        this.blockLength = 1;
        return inputOffset + this.blockLength;
      }
      this.longFormUsed = !!(intBuffer[0] & 128);
      if (this.longFormUsed === false) {
        this.length = intBuffer[0];
        this.blockLength = 1;
        return inputOffset + this.blockLength;
      }
      const count = intBuffer[0] & 127;
      if (count > 8) {
        this.error = "Too big integer";
        return -1;
      }
      if (count + 1 > intBuffer.length) {
        this.error = "End of input reached before message was fully decoded";
        return -1;
      }
      const lenOffset = inputOffset + 1;
      const lengthBufferView = view.subarray(lenOffset, lenOffset + count);
      if (lengthBufferView[count - 1] === 0)
        this.warnings.push("Needlessly long encoded length");
      this.length = utilFromBase(lengthBufferView, 8);
      if (this.longFormUsed && this.length <= 127)
        this.warnings.push("Unnecessary usage of long length form");
      this.blockLength = count + 1;
      return inputOffset + this.blockLength;
    }
    toBER(sizeOnly = false) {
      let retBuf;
      let retView;
      if (this.length > 127)
        this.longFormUsed = true;
      if (this.isIndefiniteForm) {
        retBuf = new ArrayBuffer(1);
        if (sizeOnly === false) {
          retView = new Uint8Array(retBuf);
          retView[0] = 128;
        }
        return retBuf;
      }
      if (this.longFormUsed) {
        const encodedBuf = utilToBase(this.length, 8);
        if (encodedBuf.byteLength > 127) {
          this.error = "Too big length";
          return EMPTY_BUFFER;
        }
        retBuf = new ArrayBuffer(encodedBuf.byteLength + 1);
        if (sizeOnly)
          return retBuf;
        const encodedView = new Uint8Array(encodedBuf);
        retView = new Uint8Array(retBuf);
        retView[0] = encodedBuf.byteLength | 128;
        for (let i = 0; i < encodedBuf.byteLength; i++)
          retView[i + 1] = encodedView[i];
        return retBuf;
      }
      retBuf = new ArrayBuffer(1);
      if (sizeOnly === false) {
        retView = new Uint8Array(retBuf);
        retView[0] = this.length;
      }
      return retBuf;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        isIndefiniteForm: this.isIndefiniteForm,
        longFormUsed: this.longFormUsed,
        length: this.length
      };
    }
  };
  LocalLengthBlock.NAME = "lengthBlock";
  var typeStore = {};
  var BaseBlock = class extends LocalBaseBlock {
    constructor({ name = EMPTY_STRING, optional = false, primitiveSchema, ...parameters } = {}, valueBlockType) {
      super(parameters);
      this.name = name;
      this.optional = optional;
      if (primitiveSchema) {
        this.primitiveSchema = primitiveSchema;
      }
      this.idBlock = new LocalIdentificationBlock(parameters);
      this.lenBlock = new LocalLengthBlock(parameters);
      this.valueBlock = valueBlockType ? new valueBlockType(parameters) : new ValueBlock(parameters);
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const resultOffset = this.valueBlock.fromBER(inputBuffer, inputOffset, this.lenBlock.isIndefiniteForm ? inputLength : this.lenBlock.length);
      if (resultOffset === -1) {
        this.error = this.valueBlock.error;
        return resultOffset;
      }
      if (!this.idBlock.error.length)
        this.blockLength += this.idBlock.blockLength;
      if (!this.lenBlock.error.length)
        this.blockLength += this.lenBlock.blockLength;
      if (!this.valueBlock.error.length)
        this.blockLength += this.valueBlock.blockLength;
      return resultOffset;
    }
    toBER(sizeOnly, writer) {
      const _writer = writer || new ViewWriter();
      if (!writer) {
        prepareIndefiniteForm(this);
      }
      const idBlockBuf = this.idBlock.toBER(sizeOnly);
      _writer.write(idBlockBuf);
      if (this.lenBlock.isIndefiniteForm) {
        _writer.write(new Uint8Array([128]).buffer);
        this.valueBlock.toBER(sizeOnly, _writer);
        _writer.write(new ArrayBuffer(2));
      } else {
        const valueBlockBuf = this.valueBlock.toBER(sizeOnly);
        this.lenBlock.length = valueBlockBuf.byteLength;
        const lenBlockBuf = this.lenBlock.toBER(sizeOnly);
        _writer.write(lenBlockBuf);
        _writer.write(valueBlockBuf);
      }
      if (!writer) {
        return _writer.final();
      }
      return EMPTY_BUFFER;
    }
    toJSON() {
      const object = {
        ...super.toJSON(),
        idBlock: this.idBlock.toJSON(),
        lenBlock: this.lenBlock.toJSON(),
        valueBlock: this.valueBlock.toJSON(),
        name: this.name,
        optional: this.optional
      };
      if (this.primitiveSchema)
        object.primitiveSchema = this.primitiveSchema.toJSON();
      return object;
    }
    toString(encoding = "ascii") {
      if (encoding === "ascii") {
        return this.onAsciiEncoding();
      }
      return pvtsutils.Convert.ToHex(this.toBER());
    }
    onAsciiEncoding() {
      const name = this.constructor.NAME;
      const value = pvtsutils.Convert.ToHex(this.valueBlock.valueBeforeDecodeView);
      return `${name} : ${value}`;
    }
    isEqual(other) {
      if (this === other) {
        return true;
      }
      if (!(other instanceof this.constructor)) {
        return false;
      }
      const thisRaw = this.toBER();
      const otherRaw = other.toBER();
      return isEqualBuffer(thisRaw, otherRaw);
    }
  };
  BaseBlock.NAME = "BaseBlock";
  function prepareIndefiniteForm(baseBlock) {
    var _a3;
    if (baseBlock instanceof typeStore.Constructed) {
      for (const value of baseBlock.valueBlock.value) {
        if (prepareIndefiniteForm(value)) {
          baseBlock.lenBlock.isIndefiniteForm = true;
        }
      }
    }
    return !!((_a3 = baseBlock.lenBlock) === null || _a3 === void 0 ? void 0 : _a3.isIndefiniteForm);
  }
  var BaseStringBlock = class extends BaseBlock {
    getValue() {
      return this.valueBlock.value;
    }
    setValue(value) {
      this.valueBlock.value = value;
    }
    constructor({ value = EMPTY_STRING, ...parameters } = {}, stringValueBlockType) {
      super(parameters, stringValueBlockType);
      if (value) {
        this.fromString(value);
      }
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const resultOffset = this.valueBlock.fromBER(inputBuffer, inputOffset, this.lenBlock.isIndefiniteForm ? inputLength : this.lenBlock.length);
      if (resultOffset === -1) {
        this.error = this.valueBlock.error;
        return resultOffset;
      }
      this.fromBuffer(this.valueBlock.valueHexView);
      if (!this.idBlock.error.length)
        this.blockLength += this.idBlock.blockLength;
      if (!this.lenBlock.error.length)
        this.blockLength += this.lenBlock.blockLength;
      if (!this.valueBlock.error.length)
        this.blockLength += this.valueBlock.blockLength;
      return resultOffset;
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME} : '${this.valueBlock.value}'`;
    }
  };
  BaseStringBlock.NAME = "BaseStringBlock";
  var LocalPrimitiveValueBlock = class extends HexBlock(ValueBlock) {
    constructor({ isHexOnly = true, ...parameters } = {}) {
      super(parameters);
      this.isHexOnly = isHexOnly;
    }
  };
  LocalPrimitiveValueBlock.NAME = "PrimitiveValueBlock";
  var _a$w;
  var Primitive = class extends BaseBlock {
    constructor(parameters = {}) {
      super(parameters, LocalPrimitiveValueBlock);
      this.idBlock.isConstructed = false;
    }
  };
  _a$w = Primitive;
  (() => {
    typeStore.Primitive = _a$w;
  })();
  Primitive.NAME = "PRIMITIVE";
  function localChangeType(inputObject, newType) {
    if (inputObject instanceof newType) {
      return inputObject;
    }
    const newObject = new newType();
    newObject.idBlock = inputObject.idBlock;
    newObject.lenBlock = inputObject.lenBlock;
    newObject.warnings = inputObject.warnings;
    newObject.valueBeforeDecodeView = inputObject.valueBeforeDecodeView;
    return newObject;
  }
  function localFromBER(inputBuffer, inputOffset = 0, inputLength = inputBuffer.length) {
    const incomingOffset = inputOffset;
    let returnObject = new BaseBlock({}, ValueBlock);
    const baseBlock = new LocalBaseBlock();
    if (!checkBufferParams(baseBlock, inputBuffer, inputOffset, inputLength)) {
      returnObject.error = baseBlock.error;
      return {
        offset: -1,
        result: returnObject
      };
    }
    const intBuffer = inputBuffer.subarray(inputOffset, inputOffset + inputLength);
    if (!intBuffer.length) {
      returnObject.error = "Zero buffer length";
      return {
        offset: -1,
        result: returnObject
      };
    }
    let resultOffset = returnObject.idBlock.fromBER(inputBuffer, inputOffset, inputLength);
    if (returnObject.idBlock.warnings.length) {
      returnObject.warnings.concat(returnObject.idBlock.warnings);
    }
    if (resultOffset === -1) {
      returnObject.error = returnObject.idBlock.error;
      return {
        offset: -1,
        result: returnObject
      };
    }
    inputOffset = resultOffset;
    inputLength -= returnObject.idBlock.blockLength;
    resultOffset = returnObject.lenBlock.fromBER(inputBuffer, inputOffset, inputLength);
    if (returnObject.lenBlock.warnings.length) {
      returnObject.warnings.concat(returnObject.lenBlock.warnings);
    }
    if (resultOffset === -1) {
      returnObject.error = returnObject.lenBlock.error;
      return {
        offset: -1,
        result: returnObject
      };
    }
    inputOffset = resultOffset;
    inputLength -= returnObject.lenBlock.blockLength;
    if (!returnObject.idBlock.isConstructed && returnObject.lenBlock.isIndefiniteForm) {
      returnObject.error = "Indefinite length form used for primitive encoding form";
      return {
        offset: -1,
        result: returnObject
      };
    }
    let newASN1Type = BaseBlock;
    switch (returnObject.idBlock.tagClass) {
      case 1:
        if (returnObject.idBlock.tagNumber >= 37 && returnObject.idBlock.isHexOnly === false) {
          returnObject.error = "UNIVERSAL 37 and upper tags are reserved by ASN.1 standard";
          return {
            offset: -1,
            result: returnObject
          };
        }
        switch (returnObject.idBlock.tagNumber) {
          case 0:
            if (returnObject.idBlock.isConstructed && returnObject.lenBlock.length > 0) {
              returnObject.error = "Type [UNIVERSAL 0] is reserved";
              return {
                offset: -1,
                result: returnObject
              };
            }
            newASN1Type = typeStore.EndOfContent;
            break;
          case 1:
            newASN1Type = typeStore.Boolean;
            break;
          case 2:
            newASN1Type = typeStore.Integer;
            break;
          case 3:
            newASN1Type = typeStore.BitString;
            break;
          case 4:
            newASN1Type = typeStore.OctetString;
            break;
          case 5:
            newASN1Type = typeStore.Null;
            break;
          case 6:
            newASN1Type = typeStore.ObjectIdentifier;
            break;
          case 10:
            newASN1Type = typeStore.Enumerated;
            break;
          case 12:
            newASN1Type = typeStore.Utf8String;
            break;
          case 13:
            newASN1Type = typeStore.RelativeObjectIdentifier;
            break;
          case 14:
            newASN1Type = typeStore.TIME;
            break;
          case 15:
            returnObject.error = "[UNIVERSAL 15] is reserved by ASN.1 standard";
            return {
              offset: -1,
              result: returnObject
            };
          case 16:
            newASN1Type = typeStore.Sequence;
            break;
          case 17:
            newASN1Type = typeStore.Set;
            break;
          case 18:
            newASN1Type = typeStore.NumericString;
            break;
          case 19:
            newASN1Type = typeStore.PrintableString;
            break;
          case 20:
            newASN1Type = typeStore.TeletexString;
            break;
          case 21:
            newASN1Type = typeStore.VideotexString;
            break;
          case 22:
            newASN1Type = typeStore.IA5String;
            break;
          case 23:
            newASN1Type = typeStore.UTCTime;
            break;
          case 24:
            newASN1Type = typeStore.GeneralizedTime;
            break;
          case 25:
            newASN1Type = typeStore.GraphicString;
            break;
          case 26:
            newASN1Type = typeStore.VisibleString;
            break;
          case 27:
            newASN1Type = typeStore.GeneralString;
            break;
          case 28:
            newASN1Type = typeStore.UniversalString;
            break;
          case 29:
            newASN1Type = typeStore.CharacterString;
            break;
          case 30:
            newASN1Type = typeStore.BmpString;
            break;
          case 31:
            newASN1Type = typeStore.DATE;
            break;
          case 32:
            newASN1Type = typeStore.TimeOfDay;
            break;
          case 33:
            newASN1Type = typeStore.DateTime;
            break;
          case 34:
            newASN1Type = typeStore.Duration;
            break;
          default: {
            const newObject = returnObject.idBlock.isConstructed ? new typeStore.Constructed() : new typeStore.Primitive();
            newObject.idBlock = returnObject.idBlock;
            newObject.lenBlock = returnObject.lenBlock;
            newObject.warnings = returnObject.warnings;
            returnObject = newObject;
          }
        }
        break;
      case 2:
      case 3:
      case 4:
      default: {
        newASN1Type = returnObject.idBlock.isConstructed ? typeStore.Constructed : typeStore.Primitive;
      }
    }
    returnObject = localChangeType(returnObject, newASN1Type);
    resultOffset = returnObject.fromBER(inputBuffer, inputOffset, returnObject.lenBlock.isIndefiniteForm ? inputLength : returnObject.lenBlock.length);
    returnObject.valueBeforeDecodeView = inputBuffer.subarray(incomingOffset, incomingOffset + returnObject.blockLength);
    return {
      offset: resultOffset,
      result: returnObject
    };
  }
  function fromBER(inputBuffer) {
    if (!inputBuffer.byteLength) {
      const result = new BaseBlock({}, ValueBlock);
      result.error = "Input buffer has zero length";
      return {
        offset: -1,
        result
      };
    }
    return localFromBER(pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer).slice(), 0, inputBuffer.byteLength);
  }
  function checkLen(indefiniteLength, length) {
    if (indefiniteLength) {
      return 1;
    }
    return length;
  }
  var LocalConstructedValueBlock = class extends ValueBlock {
    constructor({ value = [], isIndefiniteForm = false, ...parameters } = {}) {
      super(parameters);
      this.value = value;
      this.isIndefiniteForm = isIndefiniteForm;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const view = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
      if (!checkBufferParams(this, view, inputOffset, inputLength)) {
        return -1;
      }
      this.valueBeforeDecodeView = view.subarray(inputOffset, inputOffset + inputLength);
      if (this.valueBeforeDecodeView.length === 0) {
        this.warnings.push("Zero buffer length");
        return inputOffset;
      }
      let currentOffset = inputOffset;
      while (checkLen(this.isIndefiniteForm, inputLength) > 0) {
        const returnObject = localFromBER(view, currentOffset, inputLength);
        if (returnObject.offset === -1) {
          this.error = returnObject.result.error;
          this.warnings.concat(returnObject.result.warnings);
          return -1;
        }
        currentOffset = returnObject.offset;
        this.blockLength += returnObject.result.blockLength;
        inputLength -= returnObject.result.blockLength;
        this.value.push(returnObject.result);
        if (this.isIndefiniteForm && returnObject.result.constructor.NAME === END_OF_CONTENT_NAME) {
          break;
        }
      }
      if (this.isIndefiniteForm) {
        if (this.value[this.value.length - 1].constructor.NAME === END_OF_CONTENT_NAME) {
          this.value.pop();
        } else {
          this.warnings.push("No EndOfContent block encoded");
        }
      }
      return currentOffset;
    }
    toBER(sizeOnly, writer) {
      const _writer = writer || new ViewWriter();
      for (let i = 0; i < this.value.length; i++) {
        this.value[i].toBER(sizeOnly, _writer);
      }
      if (!writer) {
        return _writer.final();
      }
      return EMPTY_BUFFER;
    }
    toJSON() {
      const object = {
        ...super.toJSON(),
        isIndefiniteForm: this.isIndefiniteForm,
        value: []
      };
      for (const value of this.value) {
        object.value.push(value.toJSON());
      }
      return object;
    }
  };
  LocalConstructedValueBlock.NAME = "ConstructedValueBlock";
  var _a$v;
  var Constructed = class extends BaseBlock {
    constructor(parameters = {}) {
      super(parameters, LocalConstructedValueBlock);
      this.idBlock.isConstructed = true;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      this.valueBlock.isIndefiniteForm = this.lenBlock.isIndefiniteForm;
      const resultOffset = this.valueBlock.fromBER(inputBuffer, inputOffset, this.lenBlock.isIndefiniteForm ? inputLength : this.lenBlock.length);
      if (resultOffset === -1) {
        this.error = this.valueBlock.error;
        return resultOffset;
      }
      if (!this.idBlock.error.length)
        this.blockLength += this.idBlock.blockLength;
      if (!this.lenBlock.error.length)
        this.blockLength += this.lenBlock.blockLength;
      if (!this.valueBlock.error.length)
        this.blockLength += this.valueBlock.blockLength;
      return resultOffset;
    }
    onAsciiEncoding() {
      const values = [];
      for (const value of this.valueBlock.value) {
        values.push(value.toString("ascii").split("\n").map((o) => `  ${o}`).join("\n"));
      }
      const blockName = this.idBlock.tagClass === 3 ? `[${this.idBlock.tagNumber}]` : this.constructor.NAME;
      return values.length ? `${blockName} :
${values.join("\n")}` : `${blockName} :`;
    }
  };
  _a$v = Constructed;
  (() => {
    typeStore.Constructed = _a$v;
  })();
  Constructed.NAME = "CONSTRUCTED";
  var LocalEndOfContentValueBlock = class extends ValueBlock {
    fromBER(inputBuffer, inputOffset, _inputLength) {
      return inputOffset;
    }
    toBER(_sizeOnly) {
      return EMPTY_BUFFER;
    }
  };
  LocalEndOfContentValueBlock.override = "EndOfContentValueBlock";
  var _a$u;
  var EndOfContent = class extends BaseBlock {
    constructor(parameters = {}) {
      super(parameters, LocalEndOfContentValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 0;
    }
  };
  _a$u = EndOfContent;
  (() => {
    typeStore.EndOfContent = _a$u;
  })();
  EndOfContent.NAME = END_OF_CONTENT_NAME;
  var _a$t;
  var Null = class extends BaseBlock {
    constructor(parameters = {}) {
      super(parameters, ValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 5;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      if (this.lenBlock.length > 0)
        this.warnings.push("Non-zero length of value block for Null type");
      if (!this.idBlock.error.length)
        this.blockLength += this.idBlock.blockLength;
      if (!this.lenBlock.error.length)
        this.blockLength += this.lenBlock.blockLength;
      this.blockLength += inputLength;
      if (inputOffset + inputLength > inputBuffer.byteLength) {
        this.error = "End of input reached before message was fully decoded (inconsistent offset and length values)";
        return -1;
      }
      return inputOffset + inputLength;
    }
    toBER(sizeOnly, writer) {
      const retBuf = new ArrayBuffer(2);
      if (!sizeOnly) {
        const retView = new Uint8Array(retBuf);
        retView[0] = 5;
        retView[1] = 0;
      }
      if (writer) {
        writer.write(retBuf);
      }
      return retBuf;
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME}`;
    }
  };
  _a$t = Null;
  (() => {
    typeStore.Null = _a$t;
  })();
  Null.NAME = "NULL";
  var LocalBooleanValueBlock = class extends HexBlock(ValueBlock) {
    get value() {
      for (const octet of this.valueHexView) {
        if (octet > 0) {
          return true;
        }
      }
      return false;
    }
    set value(value) {
      this.valueHexView[0] = value ? 255 : 0;
    }
    constructor({ value, ...parameters } = {}) {
      super(parameters);
      if (parameters.valueHex) {
        this.valueHexView = pvtsutils.BufferSourceConverter.toUint8Array(parameters.valueHex);
      } else {
        this.valueHexView = new Uint8Array(1);
      }
      if (value) {
        this.value = value;
      }
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const inputView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
      if (!checkBufferParams(this, inputView, inputOffset, inputLength)) {
        return -1;
      }
      this.valueHexView = inputView.subarray(inputOffset, inputOffset + inputLength);
      if (inputLength > 1)
        this.warnings.push("Boolean value encoded in more then 1 octet");
      this.isHexOnly = true;
      utilDecodeTC.call(this);
      this.blockLength = inputLength;
      return inputOffset + inputLength;
    }
    toBER() {
      return this.valueHexView.slice();
    }
    toJSON() {
      return {
        ...super.toJSON(),
        value: this.value
      };
    }
  };
  LocalBooleanValueBlock.NAME = "BooleanValueBlock";
  var _a$s;
  var Boolean = class extends BaseBlock {
    getValue() {
      return this.valueBlock.value;
    }
    setValue(value) {
      this.valueBlock.value = value;
    }
    constructor(parameters = {}) {
      super(parameters, LocalBooleanValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 1;
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME} : ${this.getValue}`;
    }
  };
  _a$s = Boolean;
  (() => {
    typeStore.Boolean = _a$s;
  })();
  Boolean.NAME = "BOOLEAN";
  var LocalOctetStringValueBlock = class extends HexBlock(LocalConstructedValueBlock) {
    constructor({ isConstructed = false, ...parameters } = {}) {
      super(parameters);
      this.isConstructed = isConstructed;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      let resultOffset = 0;
      if (this.isConstructed) {
        this.isHexOnly = false;
        resultOffset = LocalConstructedValueBlock.prototype.fromBER.call(this, inputBuffer, inputOffset, inputLength);
        if (resultOffset === -1)
          return resultOffset;
        for (let i = 0; i < this.value.length; i++) {
          const currentBlockName = this.value[i].constructor.NAME;
          if (currentBlockName === END_OF_CONTENT_NAME) {
            if (this.isIndefiniteForm)
              break;
            else {
              this.error = "EndOfContent is unexpected, OCTET STRING may consists of OCTET STRINGs only";
              return -1;
            }
          }
          if (currentBlockName !== OCTET_STRING_NAME) {
            this.error = "OCTET STRING may consists of OCTET STRINGs only";
            return -1;
          }
        }
      } else {
        this.isHexOnly = true;
        resultOffset = super.fromBER(inputBuffer, inputOffset, inputLength);
        this.blockLength = inputLength;
      }
      return resultOffset;
    }
    toBER(sizeOnly, writer) {
      if (this.isConstructed)
        return LocalConstructedValueBlock.prototype.toBER.call(this, sizeOnly, writer);
      return sizeOnly ? new ArrayBuffer(this.valueHexView.byteLength) : this.valueHexView.slice().buffer;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        isConstructed: this.isConstructed
      };
    }
  };
  LocalOctetStringValueBlock.NAME = "OctetStringValueBlock";
  var _a$r;
  var OctetString = class extends BaseBlock {
    constructor({ idBlock = {}, lenBlock = {}, ...parameters } = {}) {
      var _b, _c;
      (_b = parameters.isConstructed) !== null && _b !== void 0 ? _b : parameters.isConstructed = !!((_c = parameters.value) === null || _c === void 0 ? void 0 : _c.length);
      super({
        idBlock: {
          isConstructed: parameters.isConstructed,
          ...idBlock
        },
        lenBlock: {
          ...lenBlock,
          isIndefiniteForm: !!parameters.isIndefiniteForm
        },
        ...parameters
      }, LocalOctetStringValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 4;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      this.valueBlock.isConstructed = this.idBlock.isConstructed;
      this.valueBlock.isIndefiniteForm = this.lenBlock.isIndefiniteForm;
      if (inputLength === 0) {
        if (this.idBlock.error.length === 0)
          this.blockLength += this.idBlock.blockLength;
        if (this.lenBlock.error.length === 0)
          this.blockLength += this.lenBlock.blockLength;
        return inputOffset;
      }
      if (!this.valueBlock.isConstructed) {
        const view = inputBuffer instanceof ArrayBuffer ? new Uint8Array(inputBuffer) : inputBuffer;
        const buf = view.subarray(inputOffset, inputOffset + inputLength);
        try {
          if (buf.byteLength) {
            const asn = localFromBER(buf, 0, buf.byteLength);
            if (asn.offset !== -1 && asn.offset === inputLength) {
              this.valueBlock.value = [asn.result];
            }
          }
        } catch {
        }
      }
      return super.fromBER(inputBuffer, inputOffset, inputLength);
    }
    onAsciiEncoding() {
      if (this.valueBlock.isConstructed || this.valueBlock.value && this.valueBlock.value.length) {
        return Constructed.prototype.onAsciiEncoding.call(this);
      }
      const name = this.constructor.NAME;
      const value = pvtsutils.Convert.ToHex(this.valueBlock.valueHexView);
      return `${name} : ${value}`;
    }
    getValue() {
      if (!this.idBlock.isConstructed) {
        return this.valueBlock.valueHexView.slice().buffer;
      }
      const array = [];
      for (const content of this.valueBlock.value) {
        if (content instanceof _a$r) {
          array.push(content.valueBlock.valueHexView);
        }
      }
      return pvtsutils.BufferSourceConverter.concat(array);
    }
  };
  _a$r = OctetString;
  (() => {
    typeStore.OctetString = _a$r;
  })();
  OctetString.NAME = OCTET_STRING_NAME;
  var LocalBitStringValueBlock = class extends HexBlock(LocalConstructedValueBlock) {
    constructor({ unusedBits = 0, isConstructed = false, ...parameters } = {}) {
      super(parameters);
      this.unusedBits = unusedBits;
      this.isConstructed = isConstructed;
      this.blockLength = this.valueHexView.byteLength;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      if (!inputLength) {
        return inputOffset;
      }
      let resultOffset = -1;
      if (this.isConstructed) {
        resultOffset = LocalConstructedValueBlock.prototype.fromBER.call(this, inputBuffer, inputOffset, inputLength);
        if (resultOffset === -1)
          return resultOffset;
        for (const value of this.value) {
          const currentBlockName = value.constructor.NAME;
          if (currentBlockName === END_OF_CONTENT_NAME) {
            if (this.isIndefiniteForm)
              break;
            else {
              this.error = "EndOfContent is unexpected, BIT STRING may consists of BIT STRINGs only";
              return -1;
            }
          }
          if (currentBlockName !== BIT_STRING_NAME) {
            this.error = "BIT STRING may consists of BIT STRINGs only";
            return -1;
          }
          const valueBlock = value.valueBlock;
          if (this.unusedBits > 0 && valueBlock.unusedBits > 0) {
            this.error = 'Using of "unused bits" inside constructive BIT STRING allowed for least one only';
            return -1;
          }
          this.unusedBits = valueBlock.unusedBits;
        }
        return resultOffset;
      }
      const inputView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
      if (!checkBufferParams(this, inputView, inputOffset, inputLength)) {
        return -1;
      }
      const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);
      this.unusedBits = intBuffer[0];
      if (this.unusedBits > 7) {
        this.error = "Unused bits for BitString must be in range 0-7";
        return -1;
      }
      if (!this.unusedBits) {
        const buf = intBuffer.subarray(1);
        try {
          if (buf.byteLength) {
            const asn = localFromBER(buf, 0, buf.byteLength);
            if (asn.offset !== -1 && asn.offset === inputLength - 1) {
              this.value = [asn.result];
            }
          }
        } catch {
        }
      }
      this.valueHexView = intBuffer.subarray(1);
      this.blockLength = intBuffer.length;
      return inputOffset + inputLength;
    }
    toBER(sizeOnly, writer) {
      if (this.isConstructed) {
        return LocalConstructedValueBlock.prototype.toBER.call(this, sizeOnly, writer);
      }
      if (sizeOnly) {
        return new ArrayBuffer(this.valueHexView.byteLength + 1);
      }
      if (!this.valueHexView.byteLength) {
        return EMPTY_BUFFER;
      }
      const retView = new Uint8Array(this.valueHexView.length + 1);
      retView[0] = this.unusedBits;
      retView.set(this.valueHexView, 1);
      return retView.buffer;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        unusedBits: this.unusedBits,
        isConstructed: this.isConstructed
      };
    }
  };
  LocalBitStringValueBlock.NAME = "BitStringValueBlock";
  var _a$q;
  var BitString = class extends BaseBlock {
    constructor({ idBlock = {}, lenBlock = {}, ...parameters } = {}) {
      var _b, _c;
      (_b = parameters.isConstructed) !== null && _b !== void 0 ? _b : parameters.isConstructed = !!((_c = parameters.value) === null || _c === void 0 ? void 0 : _c.length);
      super({
        idBlock: {
          isConstructed: parameters.isConstructed,
          ...idBlock
        },
        lenBlock: {
          ...lenBlock,
          isIndefiniteForm: !!parameters.isIndefiniteForm
        },
        ...parameters
      }, LocalBitStringValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 3;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      this.valueBlock.isConstructed = this.idBlock.isConstructed;
      this.valueBlock.isIndefiniteForm = this.lenBlock.isIndefiniteForm;
      return super.fromBER(inputBuffer, inputOffset, inputLength);
    }
    onAsciiEncoding() {
      if (this.valueBlock.isConstructed || this.valueBlock.value && this.valueBlock.value.length) {
        return Constructed.prototype.onAsciiEncoding.call(this);
      } else {
        const bits = [];
        const valueHex = this.valueBlock.valueHexView;
        for (const byte of valueHex) {
          bits.push(byte.toString(2).padStart(8, "0"));
        }
        const bitsStr = bits.join("");
        const name = this.constructor.NAME;
        const value = bitsStr.substring(0, bitsStr.length - this.valueBlock.unusedBits);
        return `${name} : ${value}`;
      }
    }
  };
  _a$q = BitString;
  (() => {
    typeStore.BitString = _a$q;
  })();
  BitString.NAME = BIT_STRING_NAME;
  var _a$p;
  function viewAdd(first, second) {
    const c = new Uint8Array([0]);
    const firstView = new Uint8Array(first);
    const secondView = new Uint8Array(second);
    let firstViewCopy = firstView.slice(0);
    const firstViewCopyLength = firstViewCopy.length - 1;
    const secondViewCopy = secondView.slice(0);
    const secondViewCopyLength = secondViewCopy.length - 1;
    let value = 0;
    const max = secondViewCopyLength < firstViewCopyLength ? firstViewCopyLength : secondViewCopyLength;
    let counter = 0;
    for (let i = max; i >= 0; i--, counter++) {
      switch (true) {
        case counter < secondViewCopy.length:
          value = firstViewCopy[firstViewCopyLength - counter] + secondViewCopy[secondViewCopyLength - counter] + c[0];
          break;
        default:
          value = firstViewCopy[firstViewCopyLength - counter] + c[0];
      }
      c[0] = value / 10;
      switch (true) {
        case counter >= firstViewCopy.length:
          firstViewCopy = utilConcatView(new Uint8Array([value % 10]), firstViewCopy);
          break;
        default:
          firstViewCopy[firstViewCopyLength - counter] = value % 10;
      }
    }
    if (c[0] > 0)
      firstViewCopy = utilConcatView(c, firstViewCopy);
    return firstViewCopy;
  }
  function power2(n) {
    if (n >= powers2.length) {
      for (let p = powers2.length; p <= n; p++) {
        const c = new Uint8Array([0]);
        let digits = powers2[p - 1].slice(0);
        for (let i = digits.length - 1; i >= 0; i--) {
          const newValue = new Uint8Array([(digits[i] << 1) + c[0]]);
          c[0] = newValue[0] / 10;
          digits[i] = newValue[0] % 10;
        }
        if (c[0] > 0)
          digits = utilConcatView(c, digits);
        powers2.push(digits);
      }
    }
    return powers2[n];
  }
  function viewSub(first, second) {
    let b = 0;
    const firstView = new Uint8Array(first);
    const secondView = new Uint8Array(second);
    const firstViewCopy = firstView.slice(0);
    const firstViewCopyLength = firstViewCopy.length - 1;
    const secondViewCopy = secondView.slice(0);
    const secondViewCopyLength = secondViewCopy.length - 1;
    let value;
    let counter = 0;
    for (let i = secondViewCopyLength; i >= 0; i--, counter++) {
      value = firstViewCopy[firstViewCopyLength - counter] - secondViewCopy[secondViewCopyLength - counter] - b;
      switch (true) {
        case value < 0:
          b = 1;
          firstViewCopy[firstViewCopyLength - counter] = value + 10;
          break;
        default:
          b = 0;
          firstViewCopy[firstViewCopyLength - counter] = value;
      }
    }
    if (b > 0) {
      for (let i = firstViewCopyLength - secondViewCopyLength + 1; i >= 0; i--, counter++) {
        value = firstViewCopy[firstViewCopyLength - counter] - b;
        if (value < 0) {
          b = 1;
          firstViewCopy[firstViewCopyLength - counter] = value + 10;
        } else {
          b = 0;
          firstViewCopy[firstViewCopyLength - counter] = value;
          break;
        }
      }
    }
    return firstViewCopy.slice();
  }
  var LocalIntegerValueBlock = class extends HexBlock(ValueBlock) {
    setValueHex() {
      if (this.valueHexView.length >= 4) {
        this.warnings.push("Too big Integer for decoding, hex only");
        this.isHexOnly = true;
        this._valueDec = 0;
      } else {
        this.isHexOnly = false;
        if (this.valueHexView.length > 0) {
          this._valueDec = utilDecodeTC.call(this);
        }
      }
    }
    constructor({ value, ...parameters } = {}) {
      super(parameters);
      this._valueDec = 0;
      if (parameters.valueHex) {
        this.setValueHex();
      }
      if (value !== void 0) {
        this.valueDec = value;
      }
    }
    set valueDec(v) {
      this._valueDec = v;
      this.isHexOnly = false;
      this.valueHexView = new Uint8Array(utilEncodeTC(v));
    }
    get valueDec() {
      return this._valueDec;
    }
    fromDER(inputBuffer, inputOffset, inputLength, expectedLength = 0) {
      const offset = this.fromBER(inputBuffer, inputOffset, inputLength);
      if (offset === -1)
        return offset;
      const view = this.valueHexView;
      if (view[0] === 0 && (view[1] & 128) !== 0) {
        this.valueHexView = view.subarray(1);
      } else {
        if (expectedLength !== 0) {
          if (view.length < expectedLength) {
            if (expectedLength - view.length > 1)
              expectedLength = view.length + 1;
            this.valueHexView = view.subarray(expectedLength - view.length);
          }
        }
      }
      return offset;
    }
    toDER(sizeOnly = false) {
      const view = this.valueHexView;
      switch (true) {
        case (view[0] & 128) !== 0:
          {
            const updatedView = new Uint8Array(this.valueHexView.length + 1);
            updatedView[0] = 0;
            updatedView.set(view, 1);
            this.valueHexView = updatedView;
          }
          break;
        case (view[0] === 0 && (view[1] & 128) === 0):
          {
            this.valueHexView = this.valueHexView.subarray(1);
          }
          break;
      }
      return this.toBER(sizeOnly);
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const resultOffset = super.fromBER(inputBuffer, inputOffset, inputLength);
      if (resultOffset === -1) {
        return resultOffset;
      }
      this.setValueHex();
      return resultOffset;
    }
    toBER(sizeOnly) {
      return sizeOnly ? new ArrayBuffer(this.valueHexView.length) : this.valueHexView.slice().buffer;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        valueDec: this.valueDec
      };
    }
    toString() {
      const firstBit = this.valueHexView.length * 8 - 1;
      let digits = new Uint8Array(this.valueHexView.length * 8 / 3);
      let bitNumber = 0;
      let currentByte;
      const asn1View = this.valueHexView;
      let result = "";
      let flag = false;
      for (let byteNumber = asn1View.byteLength - 1; byteNumber >= 0; byteNumber--) {
        currentByte = asn1View[byteNumber];
        for (let i = 0; i < 8; i++) {
          if ((currentByte & 1) === 1) {
            switch (bitNumber) {
              case firstBit:
                digits = viewSub(power2(bitNumber), digits);
                result = "-";
                break;
              default:
                digits = viewAdd(digits, power2(bitNumber));
            }
          }
          bitNumber++;
          currentByte >>= 1;
        }
      }
      for (let i = 0; i < digits.length; i++) {
        if (digits[i])
          flag = true;
        if (flag)
          result += digitsString.charAt(digits[i]);
      }
      if (flag === false)
        result += digitsString.charAt(0);
      return result;
    }
  };
  _a$p = LocalIntegerValueBlock;
  LocalIntegerValueBlock.NAME = "IntegerValueBlock";
  (() => {
    Object.defineProperty(_a$p.prototype, "valueHex", {
      set: function(v) {
        this.valueHexView = new Uint8Array(v);
        this.setValueHex();
      },
      get: function() {
        return this.valueHexView.slice().buffer;
      }
    });
  })();
  var _a$o;
  var Integer = class extends BaseBlock {
    constructor(parameters = {}) {
      super(parameters, LocalIntegerValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 2;
    }
    toBigInt() {
      assertBigInt();
      return BigInt(this.valueBlock.toString());
    }
    static fromBigInt(value) {
      assertBigInt();
      const bigIntValue = BigInt(value);
      const writer = new ViewWriter();
      const hex = bigIntValue.toString(16).replace(/^-/, "");
      const view = new Uint8Array(pvtsutils.Convert.FromHex(hex));
      if (bigIntValue < 0) {
        const first = new Uint8Array(view.length + (view[0] & 128 ? 1 : 0));
        first[0] |= 128;
        const firstInt = BigInt(`0x${pvtsutils.Convert.ToHex(first)}`);
        const secondInt = firstInt + bigIntValue;
        const second = pvtsutils.BufferSourceConverter.toUint8Array(pvtsutils.Convert.FromHex(secondInt.toString(16)));
        second[0] |= 128;
        writer.write(second);
      } else {
        if (view[0] & 128) {
          writer.write(new Uint8Array([0]));
        }
        writer.write(view);
      }
      const res = new _a$o({ valueHex: writer.final() });
      return res;
    }
    convertToDER() {
      const integer = new _a$o({ valueHex: this.valueBlock.valueHexView });
      integer.valueBlock.toDER();
      return integer;
    }
    convertFromDER() {
      return new _a$o({
        valueHex: this.valueBlock.valueHexView[0] === 0 ? this.valueBlock.valueHexView.subarray(1) : this.valueBlock.valueHexView
      });
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME} : ${this.valueBlock.toString()}`;
    }
  };
  _a$o = Integer;
  (() => {
    typeStore.Integer = _a$o;
  })();
  Integer.NAME = "INTEGER";
  var _a$n;
  var Enumerated = class extends Integer {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 10;
    }
  };
  _a$n = Enumerated;
  (() => {
    typeStore.Enumerated = _a$n;
  })();
  Enumerated.NAME = "ENUMERATED";
  var LocalSidValueBlock = class extends HexBlock(ValueBlock) {
    constructor({ valueDec = -1, isFirstSid = false, ...parameters } = {}) {
      super(parameters);
      this.valueDec = valueDec;
      this.isFirstSid = isFirstSid;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      if (!inputLength) {
        return inputOffset;
      }
      const inputView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
      if (!checkBufferParams(this, inputView, inputOffset, inputLength)) {
        return -1;
      }
      const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);
      this.valueHexView = new Uint8Array(inputLength);
      for (let i = 0; i < inputLength; i++) {
        this.valueHexView[i] = intBuffer[i] & 127;
        this.blockLength++;
        if ((intBuffer[i] & 128) === 0)
          break;
      }
      const tempView = new Uint8Array(this.blockLength);
      for (let i = 0; i < this.blockLength; i++) {
        tempView[i] = this.valueHexView[i];
      }
      this.valueHexView = tempView;
      if ((intBuffer[this.blockLength - 1] & 128) !== 0) {
        this.error = "End of input reached before message was fully decoded";
        return -1;
      }
      if (this.valueHexView[0] === 0)
        this.warnings.push("Needlessly long format of SID encoding");
      if (this.blockLength <= 8)
        this.valueDec = utilFromBase(this.valueHexView, 7);
      else {
        this.isHexOnly = true;
        this.warnings.push("Too big SID for decoding, hex only");
      }
      return inputOffset + this.blockLength;
    }
    set valueBigInt(value) {
      assertBigInt();
      let bits = BigInt(value).toString(2);
      while (bits.length % 7) {
        bits = "0" + bits;
      }
      const bytes2 = new Uint8Array(bits.length / 7);
      for (let i = 0; i < bytes2.length; i++) {
        bytes2[i] = parseInt(bits.slice(i * 7, i * 7 + 7), 2) + (i + 1 < bytes2.length ? 128 : 0);
      }
      this.fromBER(bytes2.buffer, 0, bytes2.length);
    }
    toBER(sizeOnly) {
      if (this.isHexOnly) {
        if (sizeOnly)
          return new ArrayBuffer(this.valueHexView.byteLength);
        const curView = this.valueHexView;
        const retView2 = new Uint8Array(this.blockLength);
        for (let i = 0; i < this.blockLength - 1; i++)
          retView2[i] = curView[i] | 128;
        retView2[this.blockLength - 1] = curView[this.blockLength - 1];
        return retView2.buffer;
      }
      const encodedBuf = utilToBase(this.valueDec, 7);
      if (encodedBuf.byteLength === 0) {
        this.error = "Error during encoding SID value";
        return EMPTY_BUFFER;
      }
      const retView = new Uint8Array(encodedBuf.byteLength);
      if (!sizeOnly) {
        const encodedView = new Uint8Array(encodedBuf);
        const len = encodedBuf.byteLength - 1;
        for (let i = 0; i < len; i++)
          retView[i] = encodedView[i] | 128;
        retView[len] = encodedView[len];
      }
      return retView;
    }
    toString() {
      let result = "";
      if (this.isHexOnly)
        result = pvtsutils.Convert.ToHex(this.valueHexView);
      else {
        if (this.isFirstSid) {
          let sidValue = this.valueDec;
          if (this.valueDec <= 39)
            result = "0.";
          else {
            if (this.valueDec <= 79) {
              result = "1.";
              sidValue -= 40;
            } else {
              result = "2.";
              sidValue -= 80;
            }
          }
          result += sidValue.toString();
        } else
          result = this.valueDec.toString();
      }
      return result;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        valueDec: this.valueDec,
        isFirstSid: this.isFirstSid
      };
    }
  };
  LocalSidValueBlock.NAME = "sidBlock";
  var LocalObjectIdentifierValueBlock = class extends ValueBlock {
    constructor({ value = EMPTY_STRING, ...parameters } = {}) {
      super(parameters);
      this.value = [];
      if (value) {
        this.fromString(value);
      }
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      let resultOffset = inputOffset;
      while (inputLength > 0) {
        const sidBlock = new LocalSidValueBlock();
        resultOffset = sidBlock.fromBER(inputBuffer, resultOffset, inputLength);
        if (resultOffset === -1) {
          this.blockLength = 0;
          this.error = sidBlock.error;
          return resultOffset;
        }
        if (this.value.length === 0)
          sidBlock.isFirstSid = true;
        this.blockLength += sidBlock.blockLength;
        inputLength -= sidBlock.blockLength;
        this.value.push(sidBlock);
      }
      return resultOffset;
    }
    toBER(sizeOnly) {
      const retBuffers = [];
      for (let i = 0; i < this.value.length; i++) {
        const valueBuf = this.value[i].toBER(sizeOnly);
        if (valueBuf.byteLength === 0) {
          this.error = this.value[i].error;
          return EMPTY_BUFFER;
        }
        retBuffers.push(valueBuf);
      }
      return concat(retBuffers);
    }
    fromString(string) {
      this.value = [];
      let pos1 = 0;
      let pos2 = 0;
      let sid = "";
      let flag = false;
      do {
        pos2 = string.indexOf(".", pos1);
        if (pos2 === -1)
          sid = string.substring(pos1);
        else
          sid = string.substring(pos1, pos2);
        pos1 = pos2 + 1;
        if (flag) {
          const sidBlock = this.value[0];
          let plus = 0;
          switch (sidBlock.valueDec) {
            case 0:
              break;
            case 1:
              plus = 40;
              break;
            case 2:
              plus = 80;
              break;
            default:
              this.value = [];
              return;
          }
          const parsedSID = parseInt(sid, 10);
          if (isNaN(parsedSID))
            return;
          sidBlock.valueDec = parsedSID + plus;
          flag = false;
        } else {
          const sidBlock = new LocalSidValueBlock();
          if (sid > Number.MAX_SAFE_INTEGER) {
            assertBigInt();
            const sidValue = BigInt(sid);
            sidBlock.valueBigInt = sidValue;
          } else {
            sidBlock.valueDec = parseInt(sid, 10);
            if (isNaN(sidBlock.valueDec))
              return;
          }
          if (!this.value.length) {
            sidBlock.isFirstSid = true;
            flag = true;
          }
          this.value.push(sidBlock);
        }
      } while (pos2 !== -1);
    }
    toString() {
      let result = "";
      let isHexOnly = false;
      for (let i = 0; i < this.value.length; i++) {
        isHexOnly = this.value[i].isHexOnly;
        let sidStr = this.value[i].toString();
        if (i !== 0)
          result = `${result}.`;
        if (isHexOnly) {
          sidStr = `{${sidStr}}`;
          if (this.value[i].isFirstSid)
            result = `2.{${sidStr} - 80}`;
          else
            result += sidStr;
        } else
          result += sidStr;
      }
      return result;
    }
    toJSON() {
      const object = {
        ...super.toJSON(),
        value: this.toString(),
        sidArray: []
      };
      for (let i = 0; i < this.value.length; i++) {
        object.sidArray.push(this.value[i].toJSON());
      }
      return object;
    }
  };
  LocalObjectIdentifierValueBlock.NAME = "ObjectIdentifierValueBlock";
  var _a$m;
  var ObjectIdentifier = class extends BaseBlock {
    getValue() {
      return this.valueBlock.toString();
    }
    setValue(value) {
      this.valueBlock.fromString(value);
    }
    constructor(parameters = {}) {
      super(parameters, LocalObjectIdentifierValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 6;
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME} : ${this.valueBlock.toString() || "empty"}`;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        value: this.getValue()
      };
    }
  };
  _a$m = ObjectIdentifier;
  (() => {
    typeStore.ObjectIdentifier = _a$m;
  })();
  ObjectIdentifier.NAME = "OBJECT IDENTIFIER";
  var LocalRelativeSidValueBlock = class extends HexBlock(LocalBaseBlock) {
    constructor({ valueDec = 0, ...parameters } = {}) {
      super(parameters);
      this.valueDec = valueDec;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      if (inputLength === 0)
        return inputOffset;
      const inputView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
      if (!checkBufferParams(this, inputView, inputOffset, inputLength))
        return -1;
      const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);
      this.valueHexView = new Uint8Array(inputLength);
      for (let i = 0; i < inputLength; i++) {
        this.valueHexView[i] = intBuffer[i] & 127;
        this.blockLength++;
        if ((intBuffer[i] & 128) === 0)
          break;
      }
      const tempView = new Uint8Array(this.blockLength);
      for (let i = 0; i < this.blockLength; i++)
        tempView[i] = this.valueHexView[i];
      this.valueHexView = tempView;
      if ((intBuffer[this.blockLength - 1] & 128) !== 0) {
        this.error = "End of input reached before message was fully decoded";
        return -1;
      }
      if (this.valueHexView[0] === 0)
        this.warnings.push("Needlessly long format of SID encoding");
      if (this.blockLength <= 8)
        this.valueDec = utilFromBase(this.valueHexView, 7);
      else {
        this.isHexOnly = true;
        this.warnings.push("Too big SID for decoding, hex only");
      }
      return inputOffset + this.blockLength;
    }
    toBER(sizeOnly) {
      if (this.isHexOnly) {
        if (sizeOnly)
          return new ArrayBuffer(this.valueHexView.byteLength);
        const curView = this.valueHexView;
        const retView2 = new Uint8Array(this.blockLength);
        for (let i = 0; i < this.blockLength - 1; i++)
          retView2[i] = curView[i] | 128;
        retView2[this.blockLength - 1] = curView[this.blockLength - 1];
        return retView2.buffer;
      }
      const encodedBuf = utilToBase(this.valueDec, 7);
      if (encodedBuf.byteLength === 0) {
        this.error = "Error during encoding SID value";
        return EMPTY_BUFFER;
      }
      const retView = new Uint8Array(encodedBuf.byteLength);
      if (!sizeOnly) {
        const encodedView = new Uint8Array(encodedBuf);
        const len = encodedBuf.byteLength - 1;
        for (let i = 0; i < len; i++)
          retView[i] = encodedView[i] | 128;
        retView[len] = encodedView[len];
      }
      return retView.buffer;
    }
    toString() {
      let result = "";
      if (this.isHexOnly)
        result = pvtsutils.Convert.ToHex(this.valueHexView);
      else {
        result = this.valueDec.toString();
      }
      return result;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        valueDec: this.valueDec
      };
    }
  };
  LocalRelativeSidValueBlock.NAME = "relativeSidBlock";
  var LocalRelativeObjectIdentifierValueBlock = class extends ValueBlock {
    constructor({ value = EMPTY_STRING, ...parameters } = {}) {
      super(parameters);
      this.value = [];
      if (value) {
        this.fromString(value);
      }
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      let resultOffset = inputOffset;
      while (inputLength > 0) {
        const sidBlock = new LocalRelativeSidValueBlock();
        resultOffset = sidBlock.fromBER(inputBuffer, resultOffset, inputLength);
        if (resultOffset === -1) {
          this.blockLength = 0;
          this.error = sidBlock.error;
          return resultOffset;
        }
        this.blockLength += sidBlock.blockLength;
        inputLength -= sidBlock.blockLength;
        this.value.push(sidBlock);
      }
      return resultOffset;
    }
    toBER(sizeOnly, _writer) {
      const retBuffers = [];
      for (let i = 0; i < this.value.length; i++) {
        const valueBuf = this.value[i].toBER(sizeOnly);
        if (valueBuf.byteLength === 0) {
          this.error = this.value[i].error;
          return EMPTY_BUFFER;
        }
        retBuffers.push(valueBuf);
      }
      return concat(retBuffers);
    }
    fromString(string) {
      this.value = [];
      let pos1 = 0;
      let pos2 = 0;
      let sid = "";
      do {
        pos2 = string.indexOf(".", pos1);
        if (pos2 === -1)
          sid = string.substring(pos1);
        else
          sid = string.substring(pos1, pos2);
        pos1 = pos2 + 1;
        const sidBlock = new LocalRelativeSidValueBlock();
        sidBlock.valueDec = parseInt(sid, 10);
        if (isNaN(sidBlock.valueDec))
          return true;
        this.value.push(sidBlock);
      } while (pos2 !== -1);
      return true;
    }
    toString() {
      let result = "";
      let isHexOnly = false;
      for (let i = 0; i < this.value.length; i++) {
        isHexOnly = this.value[i].isHexOnly;
        let sidStr = this.value[i].toString();
        if (i !== 0)
          result = `${result}.`;
        if (isHexOnly) {
          sidStr = `{${sidStr}}`;
          result += sidStr;
        } else
          result += sidStr;
      }
      return result;
    }
    toJSON() {
      const object = {
        ...super.toJSON(),
        value: this.toString(),
        sidArray: []
      };
      for (let i = 0; i < this.value.length; i++)
        object.sidArray.push(this.value[i].toJSON());
      return object;
    }
  };
  LocalRelativeObjectIdentifierValueBlock.NAME = "RelativeObjectIdentifierValueBlock";
  var _a$l;
  var RelativeObjectIdentifier = class extends BaseBlock {
    getValue() {
      return this.valueBlock.toString();
    }
    setValue(value) {
      this.valueBlock.fromString(value);
    }
    constructor(parameters = {}) {
      super(parameters, LocalRelativeObjectIdentifierValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 13;
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME} : ${this.valueBlock.toString() || "empty"}`;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        value: this.getValue()
      };
    }
  };
  _a$l = RelativeObjectIdentifier;
  (() => {
    typeStore.RelativeObjectIdentifier = _a$l;
  })();
  RelativeObjectIdentifier.NAME = "RelativeObjectIdentifier";
  var _a$k;
  var Sequence = class extends Constructed {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 16;
    }
  };
  _a$k = Sequence;
  (() => {
    typeStore.Sequence = _a$k;
  })();
  Sequence.NAME = "SEQUENCE";
  var _a$j;
  var Set = class extends Constructed {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 17;
    }
  };
  _a$j = Set;
  (() => {
    typeStore.Set = _a$j;
  })();
  Set.NAME = "SET";
  var LocalStringValueBlock = class extends HexBlock(ValueBlock) {
    constructor({ ...parameters } = {}) {
      super(parameters);
      this.isHexOnly = true;
      this.value = EMPTY_STRING;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        value: this.value
      };
    }
  };
  LocalStringValueBlock.NAME = "StringValueBlock";
  var LocalSimpleStringValueBlock = class extends LocalStringValueBlock {
  };
  LocalSimpleStringValueBlock.NAME = "SimpleStringValueBlock";
  var LocalSimpleStringBlock = class extends BaseStringBlock {
    constructor({ ...parameters } = {}) {
      super(parameters, LocalSimpleStringValueBlock);
    }
    fromBuffer(inputBuffer) {
      this.valueBlock.value = String.fromCharCode.apply(null, pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer));
    }
    fromString(inputString) {
      const strLen = inputString.length;
      const view = this.valueBlock.valueHexView = new Uint8Array(strLen);
      for (let i = 0; i < strLen; i++)
        view[i] = inputString.charCodeAt(i);
      this.valueBlock.value = inputString;
    }
  };
  LocalSimpleStringBlock.NAME = "SIMPLE STRING";
  var LocalUtf8StringValueBlock = class extends LocalSimpleStringBlock {
    fromBuffer(inputBuffer) {
      this.valueBlock.valueHexView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
      try {
        this.valueBlock.value = pvtsutils.Convert.ToUtf8String(inputBuffer);
      } catch (ex) {
        this.warnings.push(`Error during "decodeURIComponent": ${ex}, using raw string`);
        this.valueBlock.value = pvtsutils.Convert.ToBinary(inputBuffer);
      }
    }
    fromString(inputString) {
      this.valueBlock.valueHexView = new Uint8Array(pvtsutils.Convert.FromUtf8String(inputString));
      this.valueBlock.value = inputString;
    }
  };
  LocalUtf8StringValueBlock.NAME = "Utf8StringValueBlock";
  var _a$i;
  var Utf8String = class extends LocalUtf8StringValueBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 12;
    }
  };
  _a$i = Utf8String;
  (() => {
    typeStore.Utf8String = _a$i;
  })();
  Utf8String.NAME = "UTF8String";
  var LocalBmpStringValueBlock = class extends LocalSimpleStringBlock {
    fromBuffer(inputBuffer) {
      this.valueBlock.value = pvtsutils.Convert.ToUtf16String(inputBuffer);
      this.valueBlock.valueHexView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
    }
    fromString(inputString) {
      this.valueBlock.value = inputString;
      this.valueBlock.valueHexView = new Uint8Array(pvtsutils.Convert.FromUtf16String(inputString));
    }
  };
  LocalBmpStringValueBlock.NAME = "BmpStringValueBlock";
  var _a$h;
  var BmpString = class extends LocalBmpStringValueBlock {
    constructor({ ...parameters } = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 30;
    }
  };
  _a$h = BmpString;
  (() => {
    typeStore.BmpString = _a$h;
  })();
  BmpString.NAME = "BMPString";
  var LocalUniversalStringValueBlock = class extends LocalSimpleStringBlock {
    fromBuffer(inputBuffer) {
      const copyBuffer = ArrayBuffer.isView(inputBuffer) ? inputBuffer.slice().buffer : inputBuffer.slice(0);
      const valueView = new Uint8Array(copyBuffer);
      for (let i = 0; i < valueView.length; i += 4) {
        valueView[i] = valueView[i + 3];
        valueView[i + 1] = valueView[i + 2];
        valueView[i + 2] = 0;
        valueView[i + 3] = 0;
      }
      this.valueBlock.value = String.fromCharCode.apply(null, new Uint32Array(copyBuffer));
    }
    fromString(inputString) {
      const strLength = inputString.length;
      const valueHexView = this.valueBlock.valueHexView = new Uint8Array(strLength * 4);
      for (let i = 0; i < strLength; i++) {
        const codeBuf = utilToBase(inputString.charCodeAt(i), 8);
        const codeView = new Uint8Array(codeBuf);
        if (codeView.length > 4)
          continue;
        const dif = 4 - codeView.length;
        for (let j = codeView.length - 1; j >= 0; j--)
          valueHexView[i * 4 + j + dif] = codeView[j];
      }
      this.valueBlock.value = inputString;
    }
  };
  LocalUniversalStringValueBlock.NAME = "UniversalStringValueBlock";
  var _a$g;
  var UniversalString = class extends LocalUniversalStringValueBlock {
    constructor({ ...parameters } = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 28;
    }
  };
  _a$g = UniversalString;
  (() => {
    typeStore.UniversalString = _a$g;
  })();
  UniversalString.NAME = "UniversalString";
  var _a$f;
  var NumericString = class extends LocalSimpleStringBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 18;
    }
  };
  _a$f = NumericString;
  (() => {
    typeStore.NumericString = _a$f;
  })();
  NumericString.NAME = "NumericString";
  var _a$e;
  var PrintableString = class extends LocalSimpleStringBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 19;
    }
  };
  _a$e = PrintableString;
  (() => {
    typeStore.PrintableString = _a$e;
  })();
  PrintableString.NAME = "PrintableString";
  var _a$d;
  var TeletexString = class extends LocalSimpleStringBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 20;
    }
  };
  _a$d = TeletexString;
  (() => {
    typeStore.TeletexString = _a$d;
  })();
  TeletexString.NAME = "TeletexString";
  var _a$c;
  var VideotexString = class extends LocalSimpleStringBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 21;
    }
  };
  _a$c = VideotexString;
  (() => {
    typeStore.VideotexString = _a$c;
  })();
  VideotexString.NAME = "VideotexString";
  var _a$b;
  var IA5String = class extends LocalSimpleStringBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 22;
    }
  };
  _a$b = IA5String;
  (() => {
    typeStore.IA5String = _a$b;
  })();
  IA5String.NAME = "IA5String";
  var _a$a;
  var GraphicString = class extends LocalSimpleStringBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 25;
    }
  };
  _a$a = GraphicString;
  (() => {
    typeStore.GraphicString = _a$a;
  })();
  GraphicString.NAME = "GraphicString";
  var _a$9;
  var VisibleString = class extends LocalSimpleStringBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 26;
    }
  };
  _a$9 = VisibleString;
  (() => {
    typeStore.VisibleString = _a$9;
  })();
  VisibleString.NAME = "VisibleString";
  var _a$8;
  var GeneralString = class extends LocalSimpleStringBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 27;
    }
  };
  _a$8 = GeneralString;
  (() => {
    typeStore.GeneralString = _a$8;
  })();
  GeneralString.NAME = "GeneralString";
  var _a$7;
  var CharacterString = class extends LocalSimpleStringBlock {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 29;
    }
  };
  _a$7 = CharacterString;
  (() => {
    typeStore.CharacterString = _a$7;
  })();
  CharacterString.NAME = "CharacterString";
  var _a$6;
  var UTCTime = class extends VisibleString {
    constructor({ value, valueDate, ...parameters } = {}) {
      super(parameters);
      this.year = 0;
      this.month = 0;
      this.day = 0;
      this.hour = 0;
      this.minute = 0;
      this.second = 0;
      if (value) {
        this.fromString(value);
        this.valueBlock.valueHexView = new Uint8Array(value.length);
        for (let i = 0; i < value.length; i++)
          this.valueBlock.valueHexView[i] = value.charCodeAt(i);
      }
      if (valueDate) {
        this.fromDate(valueDate);
        this.valueBlock.valueHexView = new Uint8Array(this.toBuffer());
      }
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 23;
    }
    fromBuffer(inputBuffer) {
      this.fromString(String.fromCharCode.apply(null, pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer)));
    }
    toBuffer() {
      const str = this.toString();
      const buffer = new ArrayBuffer(str.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < str.length; i++)
        view[i] = str.charCodeAt(i);
      return buffer;
    }
    fromDate(inputDate) {
      this.year = inputDate.getUTCFullYear();
      this.month = inputDate.getUTCMonth() + 1;
      this.day = inputDate.getUTCDate();
      this.hour = inputDate.getUTCHours();
      this.minute = inputDate.getUTCMinutes();
      this.second = inputDate.getUTCSeconds();
    }
    toDate() {
      return new Date(Date.UTC(this.year, this.month - 1, this.day, this.hour, this.minute, this.second));
    }
    fromString(inputString) {
      const parser = /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z/ig;
      const parserArray = parser.exec(inputString);
      if (parserArray === null) {
        this.error = "Wrong input string for conversion";
        return;
      }
      const year = parseInt(parserArray[1], 10);
      if (year >= 50)
        this.year = 1900 + year;
      else
        this.year = 2e3 + year;
      this.month = parseInt(parserArray[2], 10);
      this.day = parseInt(parserArray[3], 10);
      this.hour = parseInt(parserArray[4], 10);
      this.minute = parseInt(parserArray[5], 10);
      this.second = parseInt(parserArray[6], 10);
    }
    toString(encoding = "iso") {
      if (encoding === "iso") {
        const outputArray = new Array(7);
        outputArray[0] = padNumber(this.year < 2e3 ? this.year - 1900 : this.year - 2e3, 2);
        outputArray[1] = padNumber(this.month, 2);
        outputArray[2] = padNumber(this.day, 2);
        outputArray[3] = padNumber(this.hour, 2);
        outputArray[4] = padNumber(this.minute, 2);
        outputArray[5] = padNumber(this.second, 2);
        outputArray[6] = "Z";
        return outputArray.join("");
      }
      return super.toString(encoding);
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME} : ${this.toDate().toISOString()}`;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        year: this.year,
        month: this.month,
        day: this.day,
        hour: this.hour,
        minute: this.minute,
        second: this.second
      };
    }
  };
  _a$6 = UTCTime;
  (() => {
    typeStore.UTCTime = _a$6;
  })();
  UTCTime.NAME = "UTCTime";
  var _a$5;
  var GeneralizedTime = class extends UTCTime {
    constructor(parameters = {}) {
      var _b;
      super(parameters);
      (_b = this.millisecond) !== null && _b !== void 0 ? _b : this.millisecond = 0;
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 24;
    }
    fromDate(inputDate) {
      super.fromDate(inputDate);
      this.millisecond = inputDate.getUTCMilliseconds();
    }
    toDate() {
      const utcDate = Date.UTC(this.year, this.month - 1, this.day, this.hour, this.minute, this.second, this.millisecond);
      return new Date(utcDate);
    }
    fromString(inputString) {
      let isUTC = false;
      let timeString = "";
      let dateTimeString = "";
      let fractionPart = 0;
      let parser;
      let hourDifference = 0;
      let minuteDifference = 0;
      if (inputString[inputString.length - 1] === "Z") {
        timeString = inputString.substring(0, inputString.length - 1);
        isUTC = true;
      } else {
        const number = new Number(inputString[inputString.length - 1]);
        if (isNaN(number.valueOf()))
          throw new Error("Wrong input string for conversion");
        timeString = inputString;
      }
      if (isUTC) {
        if (timeString.indexOf("+") !== -1)
          throw new Error("Wrong input string for conversion");
        if (timeString.indexOf("-") !== -1)
          throw new Error("Wrong input string for conversion");
      } else {
        let multiplier = 1;
        let differencePosition = timeString.indexOf("+");
        let differenceString = "";
        if (differencePosition === -1) {
          differencePosition = timeString.indexOf("-");
          multiplier = -1;
        }
        if (differencePosition !== -1) {
          differenceString = timeString.substring(differencePosition + 1);
          timeString = timeString.substring(0, differencePosition);
          if (differenceString.length !== 2 && differenceString.length !== 4)
            throw new Error("Wrong input string for conversion");
          let number = parseInt(differenceString.substring(0, 2), 10);
          if (isNaN(number.valueOf()))
            throw new Error("Wrong input string for conversion");
          hourDifference = multiplier * number;
          if (differenceString.length === 4) {
            number = parseInt(differenceString.substring(2, 4), 10);
            if (isNaN(number.valueOf()))
              throw new Error("Wrong input string for conversion");
            minuteDifference = multiplier * number;
          }
        }
      }
      let fractionPointPosition = timeString.indexOf(".");
      if (fractionPointPosition === -1)
        fractionPointPosition = timeString.indexOf(",");
      if (fractionPointPosition !== -1) {
        const fractionPartCheck = new Number(`0${timeString.substring(fractionPointPosition)}`);
        if (isNaN(fractionPartCheck.valueOf()))
          throw new Error("Wrong input string for conversion");
        fractionPart = fractionPartCheck.valueOf();
        dateTimeString = timeString.substring(0, fractionPointPosition);
      } else
        dateTimeString = timeString;
      switch (true) {
        case dateTimeString.length === 8:
          parser = /(\d{4})(\d{2})(\d{2})/ig;
          if (fractionPointPosition !== -1)
            throw new Error("Wrong input string for conversion");
          break;
        case dateTimeString.length === 10:
          parser = /(\d{4})(\d{2})(\d{2})(\d{2})/ig;
          if (fractionPointPosition !== -1) {
            let fractionResult = 60 * fractionPart;
            this.minute = Math.floor(fractionResult);
            fractionResult = 60 * (fractionResult - this.minute);
            this.second = Math.floor(fractionResult);
            fractionResult = 1e3 * (fractionResult - this.second);
            this.millisecond = Math.floor(fractionResult);
          }
          break;
        case dateTimeString.length === 12:
          parser = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/ig;
          if (fractionPointPosition !== -1) {
            let fractionResult = 60 * fractionPart;
            this.second = Math.floor(fractionResult);
            fractionResult = 1e3 * (fractionResult - this.second);
            this.millisecond = Math.floor(fractionResult);
          }
          break;
        case dateTimeString.length === 14:
          parser = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/ig;
          if (fractionPointPosition !== -1) {
            const fractionResult = 1e3 * fractionPart;
            this.millisecond = Math.floor(fractionResult);
          }
          break;
        default:
          throw new Error("Wrong input string for conversion");
      }
      const parserArray = parser.exec(dateTimeString);
      if (parserArray === null)
        throw new Error("Wrong input string for conversion");
      for (let j = 1; j < parserArray.length; j++) {
        switch (j) {
          case 1:
            this.year = parseInt(parserArray[j], 10);
            break;
          case 2:
            this.month = parseInt(parserArray[j], 10);
            break;
          case 3:
            this.day = parseInt(parserArray[j], 10);
            break;
          case 4:
            this.hour = parseInt(parserArray[j], 10) + hourDifference;
            break;
          case 5:
            this.minute = parseInt(parserArray[j], 10) + minuteDifference;
            break;
          case 6:
            this.second = parseInt(parserArray[j], 10);
            break;
          default:
            throw new Error("Wrong input string for conversion");
        }
      }
      if (isUTC === false) {
        const tempDate = new Date(this.year, this.month, this.day, this.hour, this.minute, this.second, this.millisecond);
        this.year = tempDate.getUTCFullYear();
        this.month = tempDate.getUTCMonth();
        this.day = tempDate.getUTCDay();
        this.hour = tempDate.getUTCHours();
        this.minute = tempDate.getUTCMinutes();
        this.second = tempDate.getUTCSeconds();
        this.millisecond = tempDate.getUTCMilliseconds();
      }
    }
    toString(encoding = "iso") {
      if (encoding === "iso") {
        const outputArray = [];
        outputArray.push(padNumber(this.year, 4));
        outputArray.push(padNumber(this.month, 2));
        outputArray.push(padNumber(this.day, 2));
        outputArray.push(padNumber(this.hour, 2));
        outputArray.push(padNumber(this.minute, 2));
        outputArray.push(padNumber(this.second, 2));
        if (this.millisecond !== 0) {
          outputArray.push(".");
          outputArray.push(padNumber(this.millisecond, 3));
        }
        outputArray.push("Z");
        return outputArray.join("");
      }
      return super.toString(encoding);
    }
    toJSON() {
      return {
        ...super.toJSON(),
        millisecond: this.millisecond
      };
    }
  };
  _a$5 = GeneralizedTime;
  (() => {
    typeStore.GeneralizedTime = _a$5;
  })();
  GeneralizedTime.NAME = "GeneralizedTime";
  var _a$4;
  var DATE = class extends Utf8String {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 31;
    }
  };
  _a$4 = DATE;
  (() => {
    typeStore.DATE = _a$4;
  })();
  DATE.NAME = "DATE";
  var _a$3;
  var TimeOfDay = class extends Utf8String {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 32;
    }
  };
  _a$3 = TimeOfDay;
  (() => {
    typeStore.TimeOfDay = _a$3;
  })();
  TimeOfDay.NAME = "TimeOfDay";
  var _a$2;
  var DateTime = class extends Utf8String {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 33;
    }
  };
  _a$2 = DateTime;
  (() => {
    typeStore.DateTime = _a$2;
  })();
  DateTime.NAME = "DateTime";
  var _a$1;
  var Duration = class extends Utf8String {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 34;
    }
  };
  _a$1 = Duration;
  (() => {
    typeStore.Duration = _a$1;
  })();
  Duration.NAME = "Duration";
  var _a;
  var TIME = class extends Utf8String {
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 14;
    }
  };
  _a = TIME;
  (() => {
    typeStore.TIME = _a;
  })();
  TIME.NAME = "TIME";
  var Any = class {
    constructor({ name = EMPTY_STRING, optional = false } = {}) {
      this.name = name;
      this.optional = optional;
    }
  };
  var Choice = class extends Any {
    constructor({ value = [], ...parameters } = {}) {
      super(parameters);
      this.value = value;
    }
  };
  var Repeated = class extends Any {
    constructor({ value = new Any(), local = false, ...parameters } = {}) {
      super(parameters);
      this.value = value;
      this.local = local;
    }
  };
  var RawData = class {
    get data() {
      return this.dataView.slice().buffer;
    }
    set data(value) {
      this.dataView = pvtsutils.BufferSourceConverter.toUint8Array(value);
    }
    constructor({ data = EMPTY_VIEW } = {}) {
      this.dataView = pvtsutils.BufferSourceConverter.toUint8Array(data);
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const endLength = inputOffset + inputLength;
      this.dataView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer).subarray(inputOffset, endLength);
      return endLength;
    }
    toBER(_sizeOnly) {
      return this.dataView.slice().buffer;
    }
  };
  function compareSchema(root, inputData, inputSchema) {
    if (inputSchema instanceof Choice) {
      for (const element of inputSchema.value) {
        const result = compareSchema(root, inputData, element);
        if (result.verified) {
          return {
            verified: true,
            result: root
          };
        }
      }
      {
        const _result = {
          verified: false,
          result: { error: "Wrong values for Choice type" }
        };
        if (inputSchema.hasOwnProperty(NAME))
          _result.name = inputSchema.name;
        return _result;
      }
    }
    if (inputSchema instanceof Any) {
      if (inputSchema.hasOwnProperty(NAME))
        root[inputSchema.name] = inputData;
      return {
        verified: true,
        result: root
      };
    }
    if (root instanceof Object === false) {
      return {
        verified: false,
        result: { error: "Wrong root object" }
      };
    }
    if (inputData instanceof Object === false) {
      return {
        verified: false,
        result: { error: "Wrong ASN.1 data" }
      };
    }
    if (inputSchema instanceof Object === false) {
      return {
        verified: false,
        result: { error: "Wrong ASN.1 schema" }
      };
    }
    if (ID_BLOCK in inputSchema === false) {
      return {
        verified: false,
        result: { error: "Wrong ASN.1 schema" }
      };
    }
    if (FROM_BER in inputSchema.idBlock === false) {
      return {
        verified: false,
        result: { error: "Wrong ASN.1 schema" }
      };
    }
    if (TO_BER in inputSchema.idBlock === false) {
      return {
        verified: false,
        result: { error: "Wrong ASN.1 schema" }
      };
    }
    const encodedId = inputSchema.idBlock.toBER(false);
    if (encodedId.byteLength === 0) {
      return {
        verified: false,
        result: { error: "Error encoding idBlock for ASN.1 schema" }
      };
    }
    const decodedOffset = inputSchema.idBlock.fromBER(encodedId, 0, encodedId.byteLength);
    if (decodedOffset === -1) {
      return {
        verified: false,
        result: { error: "Error decoding idBlock for ASN.1 schema" }
      };
    }
    if (inputSchema.idBlock.hasOwnProperty(TAG_CLASS) === false) {
      return {
        verified: false,
        result: { error: "Wrong ASN.1 schema" }
      };
    }
    if (inputSchema.idBlock.tagClass !== inputData.idBlock.tagClass) {
      return {
        verified: false,
        result: root
      };
    }
    if (inputSchema.idBlock.hasOwnProperty(TAG_NUMBER) === false) {
      return {
        verified: false,
        result: { error: "Wrong ASN.1 schema" }
      };
    }
    if (inputSchema.idBlock.tagNumber !== inputData.idBlock.tagNumber) {
      return {
        verified: false,
        result: root
      };
    }
    if (inputSchema.idBlock.hasOwnProperty(IS_CONSTRUCTED) === false) {
      return {
        verified: false,
        result: { error: "Wrong ASN.1 schema" }
      };
    }
    if (inputSchema.idBlock.isConstructed !== inputData.idBlock.isConstructed) {
      return {
        verified: false,
        result: root
      };
    }
    if (!(IS_HEX_ONLY in inputSchema.idBlock)) {
      return {
        verified: false,
        result: { error: "Wrong ASN.1 schema" }
      };
    }
    if (inputSchema.idBlock.isHexOnly !== inputData.idBlock.isHexOnly) {
      return {
        verified: false,
        result: root
      };
    }
    if (inputSchema.idBlock.isHexOnly) {
      if (VALUE_HEX_VIEW in inputSchema.idBlock === false) {
        return {
          verified: false,
          result: { error: "Wrong ASN.1 schema" }
        };
      }
      const schemaView = inputSchema.idBlock.valueHexView;
      const asn1View = inputData.idBlock.valueHexView;
      if (schemaView.length !== asn1View.length) {
        return {
          verified: false,
          result: root
        };
      }
      for (let i = 0; i < schemaView.length; i++) {
        if (schemaView[i] !== asn1View[1]) {
          return {
            verified: false,
            result: root
          };
        }
      }
    }
    if (inputSchema.name) {
      inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
      if (inputSchema.name)
        root[inputSchema.name] = inputData;
    }
    if (inputSchema instanceof typeStore.Constructed) {
      let admission = 0;
      let result = {
        verified: false,
        result: { error: "Unknown error" }
      };
      let maxLength = inputSchema.valueBlock.value.length;
      if (maxLength > 0) {
        if (inputSchema.valueBlock.value[0] instanceof Repeated) {
          maxLength = inputData.valueBlock.value.length;
        }
      }
      if (maxLength === 0) {
        return {
          verified: true,
          result: root
        };
      }
      if (inputData.valueBlock.value.length === 0 && inputSchema.valueBlock.value.length !== 0) {
        let _optional = true;
        for (let i = 0; i < inputSchema.valueBlock.value.length; i++)
          _optional = _optional && (inputSchema.valueBlock.value[i].optional || false);
        if (_optional) {
          return {
            verified: true,
            result: root
          };
        }
        if (inputSchema.name) {
          inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
          if (inputSchema.name)
            delete root[inputSchema.name];
        }
        root.error = "Inconsistent object length";
        return {
          verified: false,
          result: root
        };
      }
      for (let i = 0; i < maxLength; i++) {
        if (i - admission >= inputData.valueBlock.value.length) {
          if (inputSchema.valueBlock.value[i].optional === false) {
            const _result = {
              verified: false,
              result: root
            };
            root.error = "Inconsistent length between ASN.1 data and schema";
            if (inputSchema.name) {
              inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
              if (inputSchema.name) {
                delete root[inputSchema.name];
                _result.name = inputSchema.name;
              }
            }
            return _result;
          }
        } else {
          if (inputSchema.valueBlock.value[0] instanceof Repeated) {
            result = compareSchema(root, inputData.valueBlock.value[i], inputSchema.valueBlock.value[0].value);
            if (result.verified === false) {
              if (inputSchema.valueBlock.value[0].optional)
                admission++;
              else {
                if (inputSchema.name) {
                  inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
                  if (inputSchema.name)
                    delete root[inputSchema.name];
                }
                return result;
              }
            }
            if (NAME in inputSchema.valueBlock.value[0] && inputSchema.valueBlock.value[0].name.length > 0) {
              let arrayRoot = {};
              if (LOCAL in inputSchema.valueBlock.value[0] && inputSchema.valueBlock.value[0].local)
                arrayRoot = inputData;
              else
                arrayRoot = root;
              if (typeof arrayRoot[inputSchema.valueBlock.value[0].name] === "undefined")
                arrayRoot[inputSchema.valueBlock.value[0].name] = [];
              arrayRoot[inputSchema.valueBlock.value[0].name].push(inputData.valueBlock.value[i]);
            }
          } else {
            result = compareSchema(root, inputData.valueBlock.value[i - admission], inputSchema.valueBlock.value[i]);
            if (result.verified === false) {
              if (inputSchema.valueBlock.value[i].optional)
                admission++;
              else {
                if (inputSchema.name) {
                  inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
                  if (inputSchema.name)
                    delete root[inputSchema.name];
                }
                return result;
              }
            }
          }
        }
      }
      if (result.verified === false) {
        const _result = {
          verified: false,
          result: root
        };
        if (inputSchema.name) {
          inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
          if (inputSchema.name) {
            delete root[inputSchema.name];
            _result.name = inputSchema.name;
          }
        }
        return _result;
      }
      return {
        verified: true,
        result: root
      };
    }
    if (inputSchema.primitiveSchema && VALUE_HEX_VIEW in inputData.valueBlock) {
      const asn1 = localFromBER(inputData.valueBlock.valueHexView);
      if (asn1.offset === -1) {
        const _result = {
          verified: false,
          result: asn1.result
        };
        if (inputSchema.name) {
          inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
          if (inputSchema.name) {
            delete root[inputSchema.name];
            _result.name = inputSchema.name;
          }
        }
        return _result;
      }
      return compareSchema(root, asn1.result, inputSchema.primitiveSchema);
    }
    return {
      verified: true,
      result: root
    };
  }
  function verifySchema(inputBuffer, inputSchema) {
    if (inputSchema instanceof Object === false) {
      return {
        verified: false,
        result: { error: "Wrong ASN.1 schema type" }
      };
    }
    const asn1 = localFromBER(pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer));
    if (asn1.offset === -1) {
      return {
        verified: false,
        result: asn1.result
      };
    }
    return compareSchema(asn1.result, asn1.result, inputSchema);
  }

  // node_modules/pkijs/build/index.es.js
  var pvtsutils2 = __toESM(require_build());
  var import_pvtsutils = __toESM(require_build());

  // node_modules/bytestreamjs/build/mjs/byte_stream.js
  var ByteStream = class _ByteStream {
    constructor(parameters = {}) {
      if ("view" in parameters) {
        this.fromUint8Array(parameters.view);
      } else if ("buffer" in parameters) {
        this.fromArrayBuffer(parameters.buffer);
      } else if ("string" in parameters) {
        this.fromString(parameters.string);
      } else if ("hexstring" in parameters) {
        this.fromHexString(parameters.hexstring);
      } else {
        if ("length" in parameters && parameters.length > 0) {
          this.length = parameters.length;
          if (parameters.stub) {
            for (let i = 0; i < this._view.length; i++) {
              this._view[i] = parameters.stub;
            }
          }
        } else {
          this.length = 0;
        }
      }
    }
    set buffer(value) {
      this._buffer = value;
      this._view = new Uint8Array(this._buffer);
    }
    get buffer() {
      return this._buffer;
    }
    set view(value) {
      this._buffer = new ArrayBuffer(value.length);
      this._view = new Uint8Array(this._buffer);
      this._view.set(value);
    }
    get view() {
      return this._view;
    }
    get length() {
      return this.view.byteLength;
    }
    set length(value) {
      this._buffer = new ArrayBuffer(value);
      this._view = new Uint8Array(this._buffer);
    }
    clear() {
      this._buffer = new ArrayBuffer(0);
      this._view = new Uint8Array(this._buffer);
    }
    fromArrayBuffer(array) {
      this._buffer = array;
      this._view = new Uint8Array(this._buffer);
    }
    fromUint8Array(array) {
      this.fromArrayBuffer(new Uint8Array(array).buffer);
    }
    fromString(string) {
      const stringLength = string.length;
      this.length = stringLength;
      for (let i = 0; i < stringLength; i++)
        this.view[i] = string.charCodeAt(i);
    }
    toString(start = 0, length = this.view.length - start) {
      let result = "";
      if (start >= this.view.length || start < 0) {
        start = 0;
      }
      if (length >= this.view.length || length < 0) {
        length = this.view.length - start;
      }
      for (let i = start; i < start + length; i++)
        result += String.fromCharCode(this.view[i]);
      return result;
    }
    fromHexString(hexString) {
      const stringLength = hexString.length;
      this.buffer = new ArrayBuffer(stringLength >> 1);
      this.view = new Uint8Array(this.buffer);
      const hexMap = /* @__PURE__ */ new Map();
      hexMap.set("0", 0);
      hexMap.set("1", 1);
      hexMap.set("2", 2);
      hexMap.set("3", 3);
      hexMap.set("4", 4);
      hexMap.set("5", 5);
      hexMap.set("6", 6);
      hexMap.set("7", 7);
      hexMap.set("8", 8);
      hexMap.set("9", 9);
      hexMap.set("A", 10);
      hexMap.set("a", 10);
      hexMap.set("B", 11);
      hexMap.set("b", 11);
      hexMap.set("C", 12);
      hexMap.set("c", 12);
      hexMap.set("D", 13);
      hexMap.set("d", 13);
      hexMap.set("E", 14);
      hexMap.set("e", 14);
      hexMap.set("F", 15);
      hexMap.set("f", 15);
      let j = 0;
      let temp = 0;
      for (let i = 0; i < stringLength; i++) {
        if (!(i % 2)) {
          temp = hexMap.get(hexString.charAt(i)) << 4;
        } else {
          temp |= hexMap.get(hexString.charAt(i));
          this.view[j] = temp;
          j++;
        }
      }
    }
    toHexString(start = 0, length = this.view.length - start) {
      let result = "";
      if (start >= this.view.length || start < 0) {
        start = 0;
      }
      if (length >= this.view.length || length < 0) {
        length = this.view.length - start;
      }
      for (let i = start; i < start + length; i++) {
        const str = this.view[i].toString(16).toUpperCase();
        result = result + (str.length == 1 ? "0" : "") + str;
      }
      return result;
    }
    copy(start = 0, length = this.length - start) {
      if (!start && !this.length) {
        return new _ByteStream();
      }
      if (start < 0 || start > this.length - 1) {
        throw new Error(`Wrong start position: ${start}`);
      }
      const stream = new _ByteStream({
        buffer: this._buffer.slice(start, start + length)
      });
      return stream;
    }
    slice(start = 0, end = this.length) {
      if (!start && !this.length) {
        return new _ByteStream();
      }
      if (start < 0 || start > this.length - 1) {
        throw new Error(`Wrong start position: ${start}`);
      }
      const stream = new _ByteStream({
        buffer: this._buffer.slice(start, end)
      });
      return stream;
    }
    realloc(size) {
      const buffer = new ArrayBuffer(size);
      const view = new Uint8Array(buffer);
      if (size > this._view.length)
        view.set(this._view);
      else {
        view.set(new Uint8Array(this._buffer, 0, size));
      }
      this._buffer = buffer;
      this._view = new Uint8Array(this._buffer);
    }
    append(stream) {
      const initialSize = this.length;
      const streamViewLength = stream.length;
      const subarrayView = stream._view.subarray();
      this.realloc(initialSize + streamViewLength);
      this._view.set(subarrayView, initialSize);
    }
    insert(stream, start = 0, length = this.length - start) {
      if (start > this.length - 1)
        return false;
      if (length > this.length - start) {
        length = this.length - start;
      }
      if (length > stream.length) {
        length = stream.length;
      }
      if (length == stream.length)
        this._view.set(stream._view, start);
      else {
        this._view.set(stream._view.subarray(0, length), start);
      }
      return true;
    }
    isEqual(stream) {
      if (this.length != stream.length)
        return false;
      for (let i = 0; i < stream.length; i++) {
        if (this.view[i] != stream.view[i])
          return false;
      }
      return true;
    }
    isEqualView(view) {
      if (view.length != this.view.length)
        return false;
      for (let i = 0; i < view.length; i++) {
        if (this.view[i] != view[i])
          return false;
      }
      return true;
    }
    findPattern(pattern, start_, length_, backward_) {
      const { start, length, backward } = this.prepareFindParameters(start_, length_, backward_);
      const patternLength = pattern.length;
      if (patternLength > length) {
        return -1;
      }
      const patternArray = [];
      for (let i = 0; i < patternLength; i++)
        patternArray.push(pattern.view[i]);
      for (let i = 0; i <= length - patternLength; i++) {
        let equal = true;
        const equalStart = backward ? start - patternLength - i : start + i;
        for (let j = 0; j < patternLength; j++) {
          if (this.view[j + equalStart] != patternArray[j]) {
            equal = false;
            break;
          }
        }
        if (equal) {
          return backward ? start - patternLength - i : start + patternLength + i;
        }
      }
      return -1;
    }
    findFirstIn(patterns, start_, length_, backward_) {
      const { start, length, backward } = this.prepareFindParameters(start_, length_, backward_);
      const result = {
        id: -1,
        position: backward ? 0 : start + length,
        length: 0
      };
      for (let i = 0; i < patterns.length; i++) {
        const position = this.findPattern(patterns[i], start, length, backward);
        if (position != -1) {
          let valid = false;
          const patternLength = patterns[i].length;
          if (backward) {
            if (position - patternLength >= result.position - result.length)
              valid = true;
          } else {
            if (position - patternLength <= result.position - result.length)
              valid = true;
          }
          if (valid) {
            result.position = position;
            result.id = i;
            result.length = patternLength;
          }
        }
      }
      return result;
    }
    findAllIn(patterns, start_, length_) {
      let { start, length } = this.prepareFindParameters(start_, length_);
      const result = [];
      let patternFound = {
        id: -1,
        position: start
      };
      do {
        const position = patternFound.position;
        patternFound = this.findFirstIn(patterns, patternFound.position, length);
        if (patternFound.id == -1) {
          break;
        }
        length -= patternFound.position - position;
        result.push({
          id: patternFound.id,
          position: patternFound.position
        });
      } while (true);
      return result;
    }
    findAllPatternIn(pattern, start_, length_) {
      const { start, length } = this.prepareFindParameters(start_, length_);
      const result = [];
      const patternLength = pattern.length;
      if (patternLength > length) {
        return -1;
      }
      const patternArray = Array.from(pattern.view);
      for (let i = 0; i <= length - patternLength; i++) {
        let equal = true;
        const equalStart = start + i;
        for (let j = 0; j < patternLength; j++) {
          if (this.view[j + equalStart] != patternArray[j]) {
            equal = false;
            break;
          }
        }
        if (equal) {
          result.push(start + patternLength + i);
          i += patternLength - 1;
        }
      }
      return result;
    }
    findFirstNotIn(patterns, start_, length_, backward_) {
      let { start, length, backward } = this.prepareFindParameters(start_, length_, backward_);
      const result = {
        left: {
          id: -1,
          position: start
        },
        right: {
          id: -1,
          position: 0
        },
        value: new _ByteStream()
      };
      let currentLength = length;
      while (currentLength > 0) {
        result.right = this.findFirstIn(patterns, backward ? start - length + currentLength : start + length - currentLength, currentLength, backward);
        if (result.right.id == -1) {
          length = currentLength;
          if (backward) {
            start -= length;
          } else {
            start = result.left.position;
          }
          result.value = new _ByteStream({
            buffer: this._buffer.slice(start, start + length)
          });
          break;
        }
        if (result.right.position != (backward ? result.left.position - patterns[result.right.id].length : result.left.position + patterns[result.right.id].length)) {
          if (backward) {
            start = result.right.position + patterns[result.right.id].length;
            length = result.left.position - result.right.position - patterns[result.right.id].length;
          } else {
            start = result.left.position;
            length = result.right.position - result.left.position - patterns[result.right.id].length;
          }
          result.value = new _ByteStream({
            buffer: this._buffer.slice(start, start + length)
          });
          break;
        }
        result.left = result.right;
        currentLength -= patterns[result.right.id].length;
      }
      if (backward) {
        const temp = result.right;
        result.right = result.left;
        result.left = temp;
      }
      return result;
    }
    findAllNotIn(patterns, start_, length_) {
      let { start, length } = this.prepareFindParameters(start_, length_);
      const result = [];
      let patternFound = {
        left: {
          id: -1,
          position: start
        },
        right: {
          id: -1,
          position: start
        },
        value: new _ByteStream()
      };
      do {
        const position = patternFound.right.position;
        patternFound = this.findFirstNotIn(patterns, patternFound.right.position, length);
        length -= patternFound.right.position - position;
        result.push({
          left: {
            id: patternFound.left.id,
            position: patternFound.left.position
          },
          right: {
            id: patternFound.right.id,
            position: patternFound.right.position
          },
          value: patternFound.value
        });
      } while (patternFound.right.id != -1);
      return result;
    }
    findFirstSequence(patterns, start_, length_, backward_) {
      let { start, length, backward } = this.prepareFindParameters(start_, length_, backward_);
      const firstIn = this.skipNotPatterns(patterns, start, length, backward);
      if (firstIn == -1) {
        return {
          position: -1,
          value: new _ByteStream()
        };
      }
      const firstNotIn = this.skipPatterns(patterns, firstIn, length - (backward ? start - firstIn : firstIn - start), backward);
      if (backward) {
        start = firstNotIn;
        length = firstIn - firstNotIn;
      } else {
        start = firstIn;
        length = firstNotIn - firstIn;
      }
      const value = new _ByteStream({
        buffer: this._buffer.slice(start, start + length)
      });
      return {
        position: firstNotIn,
        value
      };
    }
    findAllSequences(patterns, start_, length_) {
      let { start, length } = this.prepareFindParameters(start_, length_);
      const result = [];
      let patternFound = {
        position: start,
        value: new _ByteStream()
      };
      do {
        const position = patternFound.position;
        patternFound = this.findFirstSequence(patterns, patternFound.position, length);
        if (patternFound.position != -1) {
          length -= patternFound.position - position;
          result.push({
            position: patternFound.position,
            value: patternFound.value
          });
        }
      } while (patternFound.position != -1);
      return result;
    }
    findPairedPatterns(leftPattern, rightPattern, start_, length_) {
      const result = [];
      if (leftPattern.isEqual(rightPattern))
        return result;
      const { start, length } = this.prepareFindParameters(start_, length_);
      let currentPositionLeft = 0;
      const leftPatterns = this.findAllPatternIn(leftPattern, start, length);
      if (!Array.isArray(leftPatterns) || leftPatterns.length == 0) {
        return result;
      }
      const rightPatterns = this.findAllPatternIn(rightPattern, start, length);
      if (!Array.isArray(rightPatterns) || rightPatterns.length == 0) {
        return result;
      }
      while (currentPositionLeft < leftPatterns.length) {
        if (rightPatterns.length == 0) {
          break;
        }
        if (leftPatterns[0] == rightPatterns[0]) {
          result.push({
            left: leftPatterns[0],
            right: rightPatterns[0]
          });
          leftPatterns.splice(0, 1);
          rightPatterns.splice(0, 1);
          continue;
        }
        if (leftPatterns[currentPositionLeft] > rightPatterns[0]) {
          break;
        }
        while (leftPatterns[currentPositionLeft] < rightPatterns[0]) {
          currentPositionLeft++;
          if (currentPositionLeft >= leftPatterns.length) {
            break;
          }
        }
        result.push({
          left: leftPatterns[currentPositionLeft - 1],
          right: rightPatterns[0]
        });
        leftPatterns.splice(currentPositionLeft - 1, 1);
        rightPatterns.splice(0, 1);
        currentPositionLeft = 0;
      }
      result.sort((a, b) => a.left - b.left);
      return result;
    }
    findPairedArrays(inputLeftPatterns, inputRightPatterns, start_, length_) {
      const { start, length } = this.prepareFindParameters(start_, length_);
      const result = [];
      let currentPositionLeft = 0;
      const leftPatterns = this.findAllIn(inputLeftPatterns, start, length);
      if (leftPatterns.length == 0)
        return result;
      const rightPatterns = this.findAllIn(inputRightPatterns, start, length);
      if (rightPatterns.length == 0)
        return result;
      while (currentPositionLeft < leftPatterns.length) {
        if (rightPatterns.length == 0) {
          break;
        }
        if (leftPatterns[0].position == rightPatterns[0].position) {
          result.push({
            left: leftPatterns[0],
            right: rightPatterns[0]
          });
          leftPatterns.splice(0, 1);
          rightPatterns.splice(0, 1);
          continue;
        }
        if (leftPatterns[currentPositionLeft].position > rightPatterns[0].position) {
          break;
        }
        while (leftPatterns[currentPositionLeft].position < rightPatterns[0].position) {
          currentPositionLeft++;
          if (currentPositionLeft >= leftPatterns.length) {
            break;
          }
        }
        result.push({
          left: leftPatterns[currentPositionLeft - 1],
          right: rightPatterns[0]
        });
        leftPatterns.splice(currentPositionLeft - 1, 1);
        rightPatterns.splice(0, 1);
        currentPositionLeft = 0;
      }
      result.sort((a, b) => a.left.position - b.left.position);
      return result;
    }
    replacePattern(searchPattern, replacePattern, start_, length_, findAllResult = null) {
      let result = [];
      let i;
      const output2 = {
        status: -1,
        searchPatternPositions: [],
        replacePatternPositions: []
      };
      const { start, length } = this.prepareFindParameters(start_, length_);
      if (findAllResult == null) {
        result = this.findAllIn([searchPattern], start, length);
        if (result.length == 0) {
          return output2;
        }
      } else {
        result = findAllResult;
      }
      output2.searchPatternPositions.push(...Array.from(result, (element) => element.position));
      const patternDifference = searchPattern.length - replacePattern.length;
      const changedBuffer = new ArrayBuffer(this.view.length - result.length * patternDifference);
      const changedView = new Uint8Array(changedBuffer);
      changedView.set(new Uint8Array(this.buffer, 0, start));
      for (i = 0; i < result.length; i++) {
        const currentPosition = i == 0 ? start : result[i - 1].position;
        changedView.set(new Uint8Array(this.buffer, currentPosition, result[i].position - searchPattern.length - currentPosition), currentPosition - i * patternDifference);
        changedView.set(replacePattern.view, result[i].position - searchPattern.length - i * patternDifference);
        output2.replacePatternPositions.push(result[i].position - searchPattern.length - i * patternDifference);
      }
      i--;
      changedView.set(new Uint8Array(this.buffer, result[i].position, this.length - result[i].position), result[i].position - searchPattern.length + replacePattern.length - i * patternDifference);
      this.buffer = changedBuffer;
      this.view = new Uint8Array(this.buffer);
      output2.status = 1;
      return output2;
    }
    skipPatterns(patterns, start_, length_, backward_) {
      const { start, length, backward } = this.prepareFindParameters(start_, length_, backward_);
      let result = start;
      for (let k = 0; k < patterns.length; k++) {
        const patternLength = patterns[k].length;
        const equalStart = backward ? result - patternLength : result;
        let equal = true;
        for (let j = 0; j < patternLength; j++) {
          if (this.view[j + equalStart] != patterns[k].view[j]) {
            equal = false;
            break;
          }
        }
        if (equal) {
          k = -1;
          if (backward) {
            result -= patternLength;
            if (result <= 0)
              return result;
          } else {
            result += patternLength;
            if (result >= start + length)
              return result;
          }
        }
      }
      return result;
    }
    skipNotPatterns(patterns, start_, length_, backward_) {
      const { start, length, backward } = this.prepareFindParameters(start_, length_, backward_);
      let result = -1;
      for (let i = 0; i < length; i++) {
        for (let k = 0; k < patterns.length; k++) {
          const patternLength = patterns[k].length;
          const equalStart = backward ? start - i - patternLength : start + i;
          let equal = true;
          for (let j = 0; j < patternLength; j++) {
            if (this.view[j + equalStart] != patterns[k].view[j]) {
              equal = false;
              break;
            }
          }
          if (equal) {
            result = backward ? start - i : start + i;
            break;
          }
        }
        if (result != -1) {
          break;
        }
      }
      return result;
    }
    prepareFindParameters(start = null, length = null, backward = false) {
      if (start === null) {
        start = backward ? this.length : 0;
      }
      if (start > this.length) {
        start = this.length;
      }
      if (backward) {
        if (length === null) {
          length = start;
        }
        if (length > start) {
          length = start;
        }
      } else {
        if (length === null) {
          length = this.length - start;
        }
        if (length > this.length - start) {
          length = this.length - start;
        }
      }
      return { start, length, backward };
    }
  };

  // node_modules/bytestreamjs/build/mjs/seq_stream.js
  var pow2_24 = 16777216;
  var SeqStream = class _SeqStream {
    constructor(parameters = {}) {
      this._stream = new ByteStream();
      this._length = 0;
      this._start = 0;
      this.backward = false;
      this.appendBlock = 0;
      this.prevLength = 0;
      this.prevStart = 0;
      if ("view" in parameters) {
        this.stream = new ByteStream({ view: parameters.view });
      } else if ("buffer" in parameters) {
        this.stream = new ByteStream({ buffer: parameters.buffer });
      } else if ("string" in parameters) {
        this.stream = new ByteStream({ string: parameters.string });
      } else if ("hexstring" in parameters) {
        this.stream = new ByteStream({ hexstring: parameters.hexstring });
      } else if ("stream" in parameters) {
        this.stream = parameters.stream.slice();
      } else {
        this.stream = new ByteStream();
      }
      if ("backward" in parameters && parameters.backward) {
        this.backward = parameters.backward;
        this._start = this.stream.length;
      }
      if ("length" in parameters && parameters.length > 0) {
        this._length = parameters.length;
      }
      if ("start" in parameters && parameters.start && parameters.start > 0) {
        this._start = parameters.start;
      }
      if ("appendBlock" in parameters && parameters.appendBlock && parameters.appendBlock > 0) {
        this.appendBlock = parameters.appendBlock;
      }
    }
    set stream(value) {
      this._stream = value;
      this.prevLength = this._length;
      this._length = value.length;
      this.prevStart = this._start;
      this._start = 0;
    }
    get stream() {
      return this._stream;
    }
    set length(value) {
      this.prevLength = this._length;
      this._length = value;
    }
    get length() {
      if (this.appendBlock) {
        return this.start;
      }
      return this._length;
    }
    set start(value) {
      if (value > this.stream.length)
        return;
      this.prevStart = this._start;
      this.prevLength = this._length;
      this._length -= this.backward ? this._start - value : value - this._start;
      this._start = value;
    }
    get start() {
      return this._start;
    }
    get buffer() {
      return this._stream.buffer.slice(0, this._length);
    }
    resetPosition() {
      this._start = this.prevStart;
      this._length = this.prevLength;
    }
    findPattern(pattern, gap = null) {
      if (gap == null || gap > this.length) {
        gap = this.length;
      }
      const result = this.stream.findPattern(pattern, this.start, this.length, this.backward);
      if (result == -1)
        return result;
      if (this.backward) {
        if (result < this.start - pattern.length - gap) {
          return -1;
        }
      } else {
        if (result > this.start + pattern.length + gap) {
          return -1;
        }
      }
      this.start = result;
      return result;
    }
    findFirstIn(patterns, gap = null) {
      if (gap == null || gap > this.length) {
        gap = this.length;
      }
      const result = this.stream.findFirstIn(patterns, this.start, this.length, this.backward);
      if (result.id == -1)
        return result;
      if (this.backward) {
        if (result.position < this.start - patterns[result.id].length - gap) {
          return {
            id: -1,
            position: this.backward ? 0 : this.start + this.length
          };
        }
      } else {
        if (result.position > this.start + patterns[result.id].length + gap) {
          return {
            id: -1,
            position: this.backward ? 0 : this.start + this.length
          };
        }
      }
      this.start = result.position;
      return result;
    }
    findAllIn(patterns) {
      const start = this.backward ? this.start - this.length : this.start;
      return this.stream.findAllIn(patterns, start, this.length);
    }
    findFirstNotIn(patterns, gap = null) {
      if (gap == null || gap > this._length) {
        gap = this._length;
      }
      const result = this._stream.findFirstNotIn(patterns, this._start, this._length, this.backward);
      if (result.left.id == -1 && result.right.id == -1) {
        return result;
      }
      if (this.backward) {
        if (result.right.id != -1) {
          if (result.right.position < this._start - patterns[result.right.id].length - gap) {
            return {
              left: {
                id: -1,
                position: this._start
              },
              right: {
                id: -1,
                position: 0
              },
              value: new ByteStream()
            };
          }
        }
      } else {
        if (result.left.id != -1) {
          if (result.left.position > this._start + patterns[result.left.id].length + gap) {
            return {
              left: {
                id: -1,
                position: this._start
              },
              right: {
                id: -1,
                position: 0
              },
              value: new ByteStream()
            };
          }
        }
      }
      if (this.backward) {
        if (result.left.id == -1) {
          this.start = 0;
        } else {
          this.start = result.left.position;
        }
      } else {
        if (result.right.id == -1) {
          this.start = this._start + this._length;
        } else {
          this.start = result.right.position;
        }
      }
      return result;
    }
    findAllNotIn(patterns) {
      const start = this.backward ? this._start - this._length : this._start;
      return this._stream.findAllNotIn(patterns, start, this._length);
    }
    findFirstSequence(patterns, length = null, gap = null) {
      if (length == null || length > this._length) {
        length = this._length;
      }
      if (gap == null || gap > length) {
        gap = length;
      }
      const result = this._stream.findFirstSequence(patterns, this._start, length, this.backward);
      if (result.value.length == 0) {
        return result;
      }
      if (this.backward) {
        if (result.position < this._start - result.value.length - gap) {
          return {
            position: -1,
            value: new ByteStream()
          };
        }
      } else {
        if (result.position > this._start + result.value.length + gap) {
          return {
            position: -1,
            value: new ByteStream()
          };
        }
      }
      this.start = result.position;
      return result;
    }
    findAllSequences(patterns) {
      const start = this.backward ? this.start - this.length : this.start;
      return this.stream.findAllSequences(patterns, start, this.length);
    }
    findPairedPatterns(leftPattern, rightPattern, gap = null) {
      if (gap == null || gap > this.length) {
        gap = this.length;
      }
      const start = this.backward ? this.start - this.length : this.start;
      const result = this.stream.findPairedPatterns(leftPattern, rightPattern, start, this.length);
      if (result.length) {
        if (this.backward) {
          if (result[0].right < this.start - rightPattern.length - gap) {
            return [];
          }
        } else {
          if (result[0].left > this.start + leftPattern.length + gap) {
            return [];
          }
        }
      }
      return result;
    }
    findPairedArrays(leftPatterns, rightPatterns, gap = null) {
      if (gap == null || gap > this.length) {
        gap = this.length;
      }
      const start = this.backward ? this.start - this.length : this.start;
      const result = this.stream.findPairedArrays(leftPatterns, rightPatterns, start, this.length);
      if (result.length) {
        if (this.backward) {
          if (result[0].right.position < this.start - rightPatterns[result[0].right.id].length - gap) {
            return [];
          }
        } else {
          if (result[0].left.position > this.start + leftPatterns[result[0].left.id].length + gap) {
            return [];
          }
        }
      }
      return result;
    }
    replacePattern(searchPattern, replacePattern) {
      const start = this.backward ? this.start - this.length : this.start;
      return this.stream.replacePattern(searchPattern, replacePattern, start, this.length);
    }
    skipPatterns(patterns) {
      const result = this.stream.skipPatterns(patterns, this.start, this.length, this.backward);
      this.start = result;
      return result;
    }
    skipNotPatterns(patterns) {
      const result = this.stream.skipNotPatterns(patterns, this.start, this.length, this.backward);
      if (result == -1)
        return -1;
      this.start = result;
      return result;
    }
    append(stream) {
      this.beforeAppend(stream.length);
      this._stream.view.set(stream.view, this._start);
      this._length += stream.length * 2;
      this.start = this._start + stream.length;
      this.prevLength -= stream.length * 2;
    }
    appendView(view) {
      this.beforeAppend(view.length);
      this._stream.view.set(view, this._start);
      this._length += view.length * 2;
      this.start = this._start + view.length;
      this.prevLength -= view.length * 2;
    }
    appendChar(char) {
      this.beforeAppend(1);
      this._stream.view[this._start] = char;
      this._length += 2;
      this.start = this._start + 1;
      this.prevLength -= 2;
    }
    appendUint16(number) {
      this.beforeAppend(2);
      const value = new Uint16Array([number]);
      const view = new Uint8Array(value.buffer);
      this.stream.view[this._start] = view[1];
      this._stream.view[this._start + 1] = view[0];
      this._length += 4;
      this.start = this._start + 2;
      this.prevLength -= 4;
    }
    appendUint24(number) {
      this.beforeAppend(3);
      const value = new Uint32Array([number]);
      const view = new Uint8Array(value.buffer);
      this._stream.view[this._start] = view[2];
      this._stream.view[this._start + 1] = view[1];
      this._stream.view[this._start + 2] = view[0];
      this._length += 6;
      this.start = this._start + 3;
      this.prevLength -= 6;
    }
    appendUint32(number) {
      this.beforeAppend(4);
      const value = new Uint32Array([number]);
      const view = new Uint8Array(value.buffer);
      this._stream.view[this._start] = view[3];
      this._stream.view[this._start + 1] = view[2];
      this._stream.view[this._start + 2] = view[1];
      this._stream.view[this._start + 3] = view[0];
      this._length += 8;
      this.start = this._start + 4;
      this.prevLength -= 8;
    }
    appendInt16(number) {
      this.beforeAppend(2);
      const value = new Int16Array([number]);
      const view = new Uint8Array(value.buffer);
      this._stream.view[this._start] = view[1];
      this._stream.view[this._start + 1] = view[0];
      this._length += 4;
      this.start = this._start + 2;
      this.prevLength -= 4;
    }
    appendInt32(number) {
      this.beforeAppend(4);
      const value = new Int32Array([number]);
      const view = new Uint8Array(value.buffer);
      this._stream.view[this._start] = view[3];
      this._stream.view[this._start + 1] = view[2];
      this._stream.view[this._start + 2] = view[1];
      this._stream.view[this._start + 3] = view[0];
      this._length += 8;
      this.start = this._start + 4;
      this.prevLength -= 8;
    }
    getBlock(size, changeLength = true) {
      if (this._length <= 0) {
        return new Uint8Array(0);
      }
      if (this._length < size) {
        size = this._length;
      }
      let result;
      if (this.backward) {
        const view = this._stream.view.subarray(this._length - size, this._length);
        result = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
          result[size - 1 - i] = view[i];
        }
      } else {
        result = this._stream.view.subarray(this._start, this._start + size);
      }
      if (changeLength) {
        this.start += this.backward ? -1 * size : size;
      }
      return result;
    }
    getUint16(changeLength = true) {
      const block = this.getBlock(2, changeLength);
      if (block.length < 2)
        return 0;
      return block[0] << 8 | block[1];
    }
    getInt16(changeLength = true) {
      const num = this.getUint16(changeLength);
      const negative = 32768;
      if (num & negative) {
        return -(negative - (num ^ negative));
      }
      return num;
    }
    getUint24(changeLength = true) {
      const block = this.getBlock(4, changeLength);
      if (block.length < 3)
        return 0;
      return block[0] << 16 | block[1] << 8 | block[2];
    }
    getUint32(changeLength = true) {
      const block = this.getBlock(4, changeLength);
      if (block.length < 4)
        return 0;
      return block[0] * pow2_24 + (block[1] << 16) + (block[2] << 8) + block[3];
    }
    getInt32(changeLength = true) {
      const num = this.getUint32(changeLength);
      const negative = 2147483648;
      if (num & negative) {
        return -(negative - (num ^ negative));
      }
      return num;
    }
    beforeAppend(size) {
      if (this._start + size > this._stream.length) {
        if (size > this.appendBlock) {
          this.appendBlock = size + _SeqStream.APPEND_BLOCK;
        }
        this._stream.realloc(this._stream.length + this.appendBlock);
      }
    }
  };
  SeqStream.APPEND_BLOCK = 1e3;

  // node_modules/@noble/hashes/esm/_assert.js
  function isBytes(a) {
    return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
  }
  function bytes(b, ...lengths) {
    if (!isBytes(b))
      throw new Error("Uint8Array expected");
    if (lengths.length > 0 && !lengths.includes(b.length))
      throw new Error(`Uint8Array expected of length ${lengths}, not of length=${b.length}`);
  }
  function exists(instance, checkFinished = true) {
    if (instance.destroyed)
      throw new Error("Hash instance has been destroyed");
    if (checkFinished && instance.finished)
      throw new Error("Hash#digest() has already been called");
  }
  function output(out, instance) {
    bytes(out);
    const min = instance.outputLen;
    if (out.length < min) {
      throw new Error(`digestInto() expects output buffer of length at least ${min}`);
    }
  }

  // node_modules/@noble/hashes/esm/utils.js
  var createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
  var rotr = (word, shift) => word << 32 - shift | word >>> shift;
  var rotl = (word, shift) => word << shift | word >>> 32 - shift >>> 0;
  var isLE = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
  function utf8ToBytes(str) {
    if (typeof str !== "string")
      throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
    return new Uint8Array(new TextEncoder().encode(str));
  }
  function toBytes(data) {
    if (typeof data === "string")
      data = utf8ToBytes(data);
    bytes(data);
    return data;
  }
  var Hash = class {
    // Safe version that clones internal state
    clone() {
      return this._cloneInto();
    }
  };
  var toStr = {}.toString;
  function wrapConstructor(hashCons) {
    const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
    const tmp = hashCons();
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.create = () => hashCons();
    return hashC;
  }

  // node_modules/@noble/hashes/esm/_md.js
  function setBigUint64(view, byteOffset, value, isLE2) {
    if (typeof view.setBigUint64 === "function")
      return view.setBigUint64(byteOffset, value, isLE2);
    const _32n2 = BigInt(32);
    const _u32_max = BigInt(4294967295);
    const wh = Number(value >> _32n2 & _u32_max);
    const wl = Number(value & _u32_max);
    const h = isLE2 ? 4 : 0;
    const l = isLE2 ? 0 : 4;
    view.setUint32(byteOffset + h, wh, isLE2);
    view.setUint32(byteOffset + l, wl, isLE2);
  }
  var Chi = (a, b, c) => a & b ^ ~a & c;
  var Maj = (a, b, c) => a & b ^ a & c ^ b & c;
  var HashMD = class extends Hash {
    constructor(blockLen, outputLen, padOffset, isLE2) {
      super();
      this.blockLen = blockLen;
      this.outputLen = outputLen;
      this.padOffset = padOffset;
      this.isLE = isLE2;
      this.finished = false;
      this.length = 0;
      this.pos = 0;
      this.destroyed = false;
      this.buffer = new Uint8Array(blockLen);
      this.view = createView(this.buffer);
    }
    update(data) {
      exists(this);
      const { view, buffer, blockLen } = this;
      data = toBytes(data);
      const len = data.length;
      for (let pos = 0; pos < len; ) {
        const take = Math.min(blockLen - this.pos, len - pos);
        if (take === blockLen) {
          const dataView = createView(data);
          for (; blockLen <= len - pos; pos += blockLen)
            this.process(dataView, pos);
          continue;
        }
        buffer.set(data.subarray(pos, pos + take), this.pos);
        this.pos += take;
        pos += take;
        if (this.pos === blockLen) {
          this.process(view, 0);
          this.pos = 0;
        }
      }
      this.length += data.length;
      this.roundClean();
      return this;
    }
    digestInto(out) {
      exists(this);
      output(out, this);
      this.finished = true;
      const { buffer, view, blockLen, isLE: isLE2 } = this;
      let { pos } = this;
      buffer[pos++] = 128;
      this.buffer.subarray(pos).fill(0);
      if (this.padOffset > blockLen - pos) {
        this.process(view, 0);
        pos = 0;
      }
      for (let i = pos; i < blockLen; i++)
        buffer[i] = 0;
      setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE2);
      this.process(view, 0);
      const oview = createView(out);
      const len = this.outputLen;
      if (len % 4)
        throw new Error("_sha2: outputLen should be aligned to 32bit");
      const outLen = len / 4;
      const state = this.get();
      if (outLen > state.length)
        throw new Error("_sha2: outputLen bigger than state");
      for (let i = 0; i < outLen; i++)
        oview.setUint32(4 * i, state[i], isLE2);
    }
    digest() {
      const { buffer, outputLen } = this;
      this.digestInto(buffer);
      const res = buffer.slice(0, outputLen);
      this.destroy();
      return res;
    }
    _cloneInto(to) {
      to || (to = new this.constructor());
      to.set(...this.get());
      const { blockLen, buffer, length, finished, destroyed, pos } = this;
      to.length = length;
      to.pos = pos;
      to.finished = finished;
      to.destroyed = destroyed;
      if (length % blockLen)
        to.buffer.set(buffer);
      return to;
    }
  };

  // node_modules/@noble/hashes/esm/sha1.js
  var SHA1_IV = /* @__PURE__ */ new Uint32Array([
    1732584193,
    4023233417,
    2562383102,
    271733878,
    3285377520
  ]);
  var SHA1_W = /* @__PURE__ */ new Uint32Array(80);
  var SHA1 = class extends HashMD {
    constructor() {
      super(64, 20, 8, false);
      this.A = SHA1_IV[0] | 0;
      this.B = SHA1_IV[1] | 0;
      this.C = SHA1_IV[2] | 0;
      this.D = SHA1_IV[3] | 0;
      this.E = SHA1_IV[4] | 0;
    }
    get() {
      const { A, B, C, D, E } = this;
      return [A, B, C, D, E];
    }
    set(A, B, C, D, E) {
      this.A = A | 0;
      this.B = B | 0;
      this.C = C | 0;
      this.D = D | 0;
      this.E = E | 0;
    }
    process(view, offset) {
      for (let i = 0; i < 16; i++, offset += 4)
        SHA1_W[i] = view.getUint32(offset, false);
      for (let i = 16; i < 80; i++)
        SHA1_W[i] = rotl(SHA1_W[i - 3] ^ SHA1_W[i - 8] ^ SHA1_W[i - 14] ^ SHA1_W[i - 16], 1);
      let { A, B, C, D, E } = this;
      for (let i = 0; i < 80; i++) {
        let F, K;
        if (i < 20) {
          F = Chi(B, C, D);
          K = 1518500249;
        } else if (i < 40) {
          F = B ^ C ^ D;
          K = 1859775393;
        } else if (i < 60) {
          F = Maj(B, C, D);
          K = 2400959708;
        } else {
          F = B ^ C ^ D;
          K = 3395469782;
        }
        const T = rotl(A, 5) + F + E + K + SHA1_W[i] | 0;
        E = D;
        D = C;
        C = rotl(B, 30);
        B = A;
        A = T;
      }
      A = A + this.A | 0;
      B = B + this.B | 0;
      C = C + this.C | 0;
      D = D + this.D | 0;
      E = E + this.E | 0;
      this.set(A, B, C, D, E);
    }
    roundClean() {
      SHA1_W.fill(0);
    }
    destroy() {
      this.set(0, 0, 0, 0, 0);
      this.buffer.fill(0);
    }
  };
  var sha1 = /* @__PURE__ */ wrapConstructor(() => new SHA1());

  // node_modules/@noble/hashes/esm/sha256.js
  var SHA256_K = /* @__PURE__ */ new Uint32Array([
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ]);
  var SHA256_IV = /* @__PURE__ */ new Uint32Array([
    1779033703,
    3144134277,
    1013904242,
    2773480762,
    1359893119,
    2600822924,
    528734635,
    1541459225
  ]);
  var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
  var SHA256 = class extends HashMD {
    constructor() {
      super(64, 32, 8, false);
      this.A = SHA256_IV[0] | 0;
      this.B = SHA256_IV[1] | 0;
      this.C = SHA256_IV[2] | 0;
      this.D = SHA256_IV[3] | 0;
      this.E = SHA256_IV[4] | 0;
      this.F = SHA256_IV[5] | 0;
      this.G = SHA256_IV[6] | 0;
      this.H = SHA256_IV[7] | 0;
    }
    get() {
      const { A, B, C, D, E, F, G, H } = this;
      return [A, B, C, D, E, F, G, H];
    }
    // prettier-ignore
    set(A, B, C, D, E, F, G, H) {
      this.A = A | 0;
      this.B = B | 0;
      this.C = C | 0;
      this.D = D | 0;
      this.E = E | 0;
      this.F = F | 0;
      this.G = G | 0;
      this.H = H | 0;
    }
    process(view, offset) {
      for (let i = 0; i < 16; i++, offset += 4)
        SHA256_W[i] = view.getUint32(offset, false);
      for (let i = 16; i < 64; i++) {
        const W15 = SHA256_W[i - 15];
        const W2 = SHA256_W[i - 2];
        const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
        const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
        SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
      }
      let { A, B, C, D, E, F, G, H } = this;
      for (let i = 0; i < 64; i++) {
        const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
        const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
        const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
        const T2 = sigma0 + Maj(A, B, C) | 0;
        H = G;
        G = F;
        F = E;
        E = D + T1 | 0;
        D = C;
        C = B;
        B = A;
        A = T1 + T2 | 0;
      }
      A = A + this.A | 0;
      B = B + this.B | 0;
      C = C + this.C | 0;
      D = D + this.D | 0;
      E = E + this.E | 0;
      F = F + this.F | 0;
      G = G + this.G | 0;
      H = H + this.H | 0;
      this.set(A, B, C, D, E, F, G, H);
    }
    roundClean() {
      SHA256_W.fill(0);
    }
    destroy() {
      this.set(0, 0, 0, 0, 0, 0, 0, 0);
      this.buffer.fill(0);
    }
  };
  var sha256 = /* @__PURE__ */ wrapConstructor(() => new SHA256());

  // node_modules/@noble/hashes/esm/_u64.js
  var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
  var _32n = /* @__PURE__ */ BigInt(32);
  function fromBig(n, le = false) {
    if (le)
      return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
    return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
  }
  function split(lst, le = false) {
    let Ah = new Uint32Array(lst.length);
    let Al = new Uint32Array(lst.length);
    for (let i = 0; i < lst.length; i++) {
      const { h, l } = fromBig(lst[i], le);
      [Ah[i], Al[i]] = [h, l];
    }
    return [Ah, Al];
  }
  var toBig = (h, l) => BigInt(h >>> 0) << _32n | BigInt(l >>> 0);
  var shrSH = (h, _l, s) => h >>> s;
  var shrSL = (h, l, s) => h << 32 - s | l >>> s;
  var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
  var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
  var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
  var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
  var rotr32H = (_h, l) => l;
  var rotr32L = (h, _l) => h;
  var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
  var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
  var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
  var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
  function add(Ah, Al, Bh, Bl) {
    const l = (Al >>> 0) + (Bl >>> 0);
    return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
  }
  var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
  var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
  var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
  var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
  var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
  var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;
  var u64 = {
    fromBig,
    split,
    toBig,
    shrSH,
    shrSL,
    rotrSH,
    rotrSL,
    rotrBH,
    rotrBL,
    rotr32H,
    rotr32L,
    rotlSH,
    rotlSL,
    rotlBH,
    rotlBL,
    add,
    add3L,
    add3H,
    add4L,
    add4H,
    add5H,
    add5L
  };
  var u64_default = u64;

  // node_modules/@noble/hashes/esm/sha512.js
  var [SHA512_Kh, SHA512_Kl] = /* @__PURE__ */ (() => u64_default.split([
    "0x428a2f98d728ae22",
    "0x7137449123ef65cd",
    "0xb5c0fbcfec4d3b2f",
    "0xe9b5dba58189dbbc",
    "0x3956c25bf348b538",
    "0x59f111f1b605d019",
    "0x923f82a4af194f9b",
    "0xab1c5ed5da6d8118",
    "0xd807aa98a3030242",
    "0x12835b0145706fbe",
    "0x243185be4ee4b28c",
    "0x550c7dc3d5ffb4e2",
    "0x72be5d74f27b896f",
    "0x80deb1fe3b1696b1",
    "0x9bdc06a725c71235",
    "0xc19bf174cf692694",
    "0xe49b69c19ef14ad2",
    "0xefbe4786384f25e3",
    "0x0fc19dc68b8cd5b5",
    "0x240ca1cc77ac9c65",
    "0x2de92c6f592b0275",
    "0x4a7484aa6ea6e483",
    "0x5cb0a9dcbd41fbd4",
    "0x76f988da831153b5",
    "0x983e5152ee66dfab",
    "0xa831c66d2db43210",
    "0xb00327c898fb213f",
    "0xbf597fc7beef0ee4",
    "0xc6e00bf33da88fc2",
    "0xd5a79147930aa725",
    "0x06ca6351e003826f",
    "0x142929670a0e6e70",
    "0x27b70a8546d22ffc",
    "0x2e1b21385c26c926",
    "0x4d2c6dfc5ac42aed",
    "0x53380d139d95b3df",
    "0x650a73548baf63de",
    "0x766a0abb3c77b2a8",
    "0x81c2c92e47edaee6",
    "0x92722c851482353b",
    "0xa2bfe8a14cf10364",
    "0xa81a664bbc423001",
    "0xc24b8b70d0f89791",
    "0xc76c51a30654be30",
    "0xd192e819d6ef5218",
    "0xd69906245565a910",
    "0xf40e35855771202a",
    "0x106aa07032bbd1b8",
    "0x19a4c116b8d2d0c8",
    "0x1e376c085141ab53",
    "0x2748774cdf8eeb99",
    "0x34b0bcb5e19b48a8",
    "0x391c0cb3c5c95a63",
    "0x4ed8aa4ae3418acb",
    "0x5b9cca4f7763e373",
    "0x682e6ff3d6b2b8a3",
    "0x748f82ee5defb2fc",
    "0x78a5636f43172f60",
    "0x84c87814a1f0ab72",
    "0x8cc702081a6439ec",
    "0x90befffa23631e28",
    "0xa4506cebde82bde9",
    "0xbef9a3f7b2c67915",
    "0xc67178f2e372532b",
    "0xca273eceea26619c",
    "0xd186b8c721c0c207",
    "0xeada7dd6cde0eb1e",
    "0xf57d4f7fee6ed178",
    "0x06f067aa72176fba",
    "0x0a637dc5a2c898a6",
    "0x113f9804bef90dae",
    "0x1b710b35131c471b",
    "0x28db77f523047d84",
    "0x32caab7b40c72493",
    "0x3c9ebe0a15c9bebc",
    "0x431d67c49c100d4c",
    "0x4cc5d4becb3e42b6",
    "0x597f299cfc657e2a",
    "0x5fcb6fab3ad6faec",
    "0x6c44198c4a475817"
  ].map((n) => BigInt(n))))();
  var SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
  var SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
  var SHA512 = class extends HashMD {
    constructor() {
      super(128, 64, 16, false);
      this.Ah = 1779033703 | 0;
      this.Al = 4089235720 | 0;
      this.Bh = 3144134277 | 0;
      this.Bl = 2227873595 | 0;
      this.Ch = 1013904242 | 0;
      this.Cl = 4271175723 | 0;
      this.Dh = 2773480762 | 0;
      this.Dl = 1595750129 | 0;
      this.Eh = 1359893119 | 0;
      this.El = 2917565137 | 0;
      this.Fh = 2600822924 | 0;
      this.Fl = 725511199 | 0;
      this.Gh = 528734635 | 0;
      this.Gl = 4215389547 | 0;
      this.Hh = 1541459225 | 0;
      this.Hl = 327033209 | 0;
    }
    // prettier-ignore
    get() {
      const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
      return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
    }
    // prettier-ignore
    set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
      this.Ah = Ah | 0;
      this.Al = Al | 0;
      this.Bh = Bh | 0;
      this.Bl = Bl | 0;
      this.Ch = Ch | 0;
      this.Cl = Cl | 0;
      this.Dh = Dh | 0;
      this.Dl = Dl | 0;
      this.Eh = Eh | 0;
      this.El = El | 0;
      this.Fh = Fh | 0;
      this.Fl = Fl | 0;
      this.Gh = Gh | 0;
      this.Gl = Gl | 0;
      this.Hh = Hh | 0;
      this.Hl = Hl | 0;
    }
    process(view, offset) {
      for (let i = 0; i < 16; i++, offset += 4) {
        SHA512_W_H[i] = view.getUint32(offset);
        SHA512_W_L[i] = view.getUint32(offset += 4);
      }
      for (let i = 16; i < 80; i++) {
        const W15h = SHA512_W_H[i - 15] | 0;
        const W15l = SHA512_W_L[i - 15] | 0;
        const s0h = u64_default.rotrSH(W15h, W15l, 1) ^ u64_default.rotrSH(W15h, W15l, 8) ^ u64_default.shrSH(W15h, W15l, 7);
        const s0l = u64_default.rotrSL(W15h, W15l, 1) ^ u64_default.rotrSL(W15h, W15l, 8) ^ u64_default.shrSL(W15h, W15l, 7);
        const W2h = SHA512_W_H[i - 2] | 0;
        const W2l = SHA512_W_L[i - 2] | 0;
        const s1h = u64_default.rotrSH(W2h, W2l, 19) ^ u64_default.rotrBH(W2h, W2l, 61) ^ u64_default.shrSH(W2h, W2l, 6);
        const s1l = u64_default.rotrSL(W2h, W2l, 19) ^ u64_default.rotrBL(W2h, W2l, 61) ^ u64_default.shrSL(W2h, W2l, 6);
        const SUMl = u64_default.add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
        const SUMh = u64_default.add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
        SHA512_W_H[i] = SUMh | 0;
        SHA512_W_L[i] = SUMl | 0;
      }
      let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
      for (let i = 0; i < 80; i++) {
        const sigma1h = u64_default.rotrSH(Eh, El, 14) ^ u64_default.rotrSH(Eh, El, 18) ^ u64_default.rotrBH(Eh, El, 41);
        const sigma1l = u64_default.rotrSL(Eh, El, 14) ^ u64_default.rotrSL(Eh, El, 18) ^ u64_default.rotrBL(Eh, El, 41);
        const CHIh = Eh & Fh ^ ~Eh & Gh;
        const CHIl = El & Fl ^ ~El & Gl;
        const T1ll = u64_default.add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
        const T1h = u64_default.add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
        const T1l = T1ll | 0;
        const sigma0h = u64_default.rotrSH(Ah, Al, 28) ^ u64_default.rotrBH(Ah, Al, 34) ^ u64_default.rotrBH(Ah, Al, 39);
        const sigma0l = u64_default.rotrSL(Ah, Al, 28) ^ u64_default.rotrBL(Ah, Al, 34) ^ u64_default.rotrBL(Ah, Al, 39);
        const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
        const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
        Hh = Gh | 0;
        Hl = Gl | 0;
        Gh = Fh | 0;
        Gl = Fl | 0;
        Fh = Eh | 0;
        Fl = El | 0;
        ({ h: Eh, l: El } = u64_default.add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
        Dh = Ch | 0;
        Dl = Cl | 0;
        Ch = Bh | 0;
        Cl = Bl | 0;
        Bh = Ah | 0;
        Bl = Al | 0;
        const All = u64_default.add3L(T1l, sigma0l, MAJl);
        Ah = u64_default.add3H(All, T1h, sigma0h, MAJh);
        Al = All | 0;
      }
      ({ h: Ah, l: Al } = u64_default.add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
      ({ h: Bh, l: Bl } = u64_default.add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
      ({ h: Ch, l: Cl } = u64_default.add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
      ({ h: Dh, l: Dl } = u64_default.add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
      ({ h: Eh, l: El } = u64_default.add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
      ({ h: Fh, l: Fl } = u64_default.add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
      ({ h: Gh, l: Gl } = u64_default.add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
      ({ h: Hh, l: Hl } = u64_default.add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
      this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
    }
    roundClean() {
      SHA512_W_H.fill(0);
      SHA512_W_L.fill(0);
    }
    destroy() {
      this.buffer.fill(0);
      this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
  };
  var SHA384 = class extends SHA512 {
    constructor() {
      super();
      this.Ah = 3418070365 | 0;
      this.Al = 3238371032 | 0;
      this.Bh = 1654270250 | 0;
      this.Bl = 914150663 | 0;
      this.Ch = 2438529370 | 0;
      this.Cl = 812702999 | 0;
      this.Dh = 355462360 | 0;
      this.Dl = 4144912697 | 0;
      this.Eh = 1731405415 | 0;
      this.El = 4290775857 | 0;
      this.Fh = 2394180231 | 0;
      this.Fl = 1750603025 | 0;
      this.Gh = 3675008525 | 0;
      this.Gl = 1694076839 | 0;
      this.Hh = 1203062813 | 0;
      this.Hl = 3204075428 | 0;
      this.outputLen = 48;
    }
  };
  var sha512 = /* @__PURE__ */ wrapConstructor(() => new SHA512());
  var sha384 = /* @__PURE__ */ wrapConstructor(() => new SHA384());

  // node_modules/pkijs/build/index.es.js
  var EMPTY_BUFFER2 = new ArrayBuffer(0);
  var EMPTY_STRING2 = "";
  var ArgumentError = class _ArgumentError extends TypeError {
    constructor() {
      super(...arguments);
      this.name = _ArgumentError.NAME;
    }
    static isType(value, type) {
      if (typeof type === "string") {
        if (type === "Array" && Array.isArray(value)) {
          return true;
        } else if (type === "ArrayBuffer" && value instanceof ArrayBuffer) {
          return true;
        } else if (type === "ArrayBufferView" && ArrayBuffer.isView(value)) {
          return true;
        } else if (typeof value === type) {
          return true;
        }
      } else if (value instanceof type) {
        return true;
      }
      return false;
    }
    static assert(value, name, ...types) {
      for (const type of types) {
        if (this.isType(value, type)) {
          return;
        }
      }
      const typeNames = types.map((o) => o instanceof Function && "name" in o ? o.name : `${o}`);
      throw new _ArgumentError(`Parameter '${name}' is not of type ${typeNames.length > 1 ? `(${typeNames.join(" or ")})` : typeNames[0]}`);
    }
  };
  ArgumentError.NAME = "ArgumentError";
  var ParameterError = class _ParameterError extends TypeError {
    static assert(...args) {
      let target = null;
      let params;
      let fields;
      if (typeof args[0] === "string") {
        target = args[0];
        params = args[1];
        fields = args.slice(2);
      } else {
        params = args[0];
        fields = args.slice(1);
      }
      ArgumentError.assert(params, "parameters", "object");
      for (const field of fields) {
        const value = params[field];
        if (value === void 0 || value === null) {
          throw new _ParameterError(field, target);
        }
      }
    }
    static assertEmpty(value, name, target) {
      if (value === void 0 || value === null) {
        throw new _ParameterError(name, target);
      }
    }
    constructor(field, target = null, message) {
      super();
      this.name = _ParameterError.NAME;
      this.field = field;
      if (target) {
        this.target = target;
      }
      if (message) {
        this.message = message;
      } else {
        this.message = `Absent mandatory parameter '${field}' ${target ? ` in '${target}'` : EMPTY_STRING2}`;
      }
    }
  };
  ParameterError.NAME = "ParameterError";
  var AsnError = class _AsnError extends Error {
    static assertSchema(asn1, target) {
      if (!asn1.verified) {
        throw new Error(`Object's schema was not verified against input data for ${target}`);
      }
    }
    static assert(asn, target) {
      if (asn.offset === -1) {
        throw new _AsnError(`Error during parsing of ASN.1 data. Data is not correct for '${target}'.`);
      }
    }
    constructor(message) {
      super(message);
      this.name = "AsnError";
    }
  };
  var PkiObject = class {
    static blockName() {
      return this.CLASS_NAME;
    }
    static fromBER(raw) {
      const asn1 = fromBER(raw);
      AsnError.assert(asn1, this.name);
      try {
        return new this({ schema: asn1.result });
      } catch (e) {
        throw new AsnError(`Cannot create '${this.CLASS_NAME}' from ASN.1 object`);
      }
    }
    static defaultValues(memberName) {
      throw new Error(`Invalid member name for ${this.CLASS_NAME} class: ${memberName}`);
    }
    static schema(parameters = {}) {
      throw new Error(`Method '${this.CLASS_NAME}.schema' should be overridden`);
    }
    get className() {
      return this.constructor.CLASS_NAME;
    }
    toString(encoding = "hex") {
      let schema;
      try {
        schema = this.toSchema();
      } catch {
        schema = this.toSchema(true);
      }
      return pvtsutils2.Convert.ToString(schema.toBER(), encoding);
    }
  };
  PkiObject.CLASS_NAME = "PkiObject";
  function stringPrep(inputString) {
    let isSpace = false;
    let cutResult = EMPTY_STRING2;
    const result = inputString.trim();
    for (let i = 0; i < result.length; i++) {
      if (result.charCodeAt(i) === 32) {
        if (isSpace === false)
          isSpace = true;
      } else {
        if (isSpace) {
          cutResult += " ";
          isSpace = false;
        }
        cutResult += result[i];
      }
    }
    return cutResult.toLowerCase();
  }
  var TYPE$5 = "type";
  var VALUE$6 = "value";
  var AttributeTypeAndValue = class _AttributeTypeAndValue extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.type = getParametersValue(parameters, TYPE$5, _AttributeTypeAndValue.defaultValues(TYPE$5));
      this.value = getParametersValue(parameters, VALUE$6, _AttributeTypeAndValue.defaultValues(VALUE$6));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case TYPE$5:
          return EMPTY_STRING2;
        case VALUE$6:
          return {};
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.type || EMPTY_STRING2 }),
          new Any({ name: names.value || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, [
        TYPE$5,
        "typeValue"
      ]);
      const asn1 = compareSchema(schema, schema, _AttributeTypeAndValue.schema({
        names: {
          type: TYPE$5,
          value: "typeValue"
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.type = asn1.result.type.valueBlock.toString();
      this.value = asn1.result.typeValue;
    }
    toSchema() {
      return new Sequence({
        value: [
          new ObjectIdentifier({ value: this.type }),
          this.value
        ]
      });
    }
    toJSON() {
      const _object = {
        type: this.type
      };
      if (Object.keys(this.value).length !== 0) {
        _object.value = this.value.toJSON();
      } else {
        _object.value = this.value;
      }
      return _object;
    }
    isEqual(compareTo) {
      const stringBlockNames = [
        Utf8String.blockName(),
        BmpString.blockName(),
        UniversalString.blockName(),
        NumericString.blockName(),
        PrintableString.blockName(),
        TeletexString.blockName(),
        VideotexString.blockName(),
        IA5String.blockName(),
        GraphicString.blockName(),
        VisibleString.blockName(),
        GeneralString.blockName(),
        CharacterString.blockName()
      ];
      if (compareTo instanceof ArrayBuffer) {
        return pvtsutils2.BufferSourceConverter.isEqual(this.value.valueBeforeDecodeView, compareTo);
      }
      if (compareTo.constructor.blockName() === _AttributeTypeAndValue.blockName()) {
        if (this.type !== compareTo.type)
          return false;
        const isStringPair = [false, false];
        const thisName = this.value.constructor.blockName();
        for (const name of stringBlockNames) {
          if (thisName === name) {
            isStringPair[0] = true;
          }
          if (compareTo.value.constructor.blockName() === name) {
            isStringPair[1] = true;
          }
        }
        if (isStringPair[0] !== isStringPair[1]) {
          return false;
        }
        const isString = isStringPair[0] && isStringPair[1];
        if (isString) {
          const value1 = stringPrep(this.value.valueBlock.value);
          const value2 = stringPrep(compareTo.value.valueBlock.value);
          if (value1.localeCompare(value2) !== 0)
            return false;
        } else {
          if (!pvtsutils2.BufferSourceConverter.isEqual(this.value.valueBeforeDecodeView, compareTo.value.valueBeforeDecodeView))
            return false;
        }
        return true;
      }
      return false;
    }
  };
  AttributeTypeAndValue.CLASS_NAME = "AttributeTypeAndValue";
  var TYPE_AND_VALUES = "typesAndValues";
  var VALUE_BEFORE_DECODE = "valueBeforeDecode";
  var RDN = "RDN";
  var RelativeDistinguishedNames = class _RelativeDistinguishedNames extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.typesAndValues = getParametersValue(parameters, TYPE_AND_VALUES, _RelativeDistinguishedNames.defaultValues(TYPE_AND_VALUES));
      this.valueBeforeDecode = getParametersValue(parameters, VALUE_BEFORE_DECODE, _RelativeDistinguishedNames.defaultValues(VALUE_BEFORE_DECODE));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case TYPE_AND_VALUES:
          return [];
        case VALUE_BEFORE_DECODE:
          return EMPTY_BUFFER2;
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case TYPE_AND_VALUES:
          return memberValue.length === 0;
        case VALUE_BEFORE_DECODE:
          return memberValue.byteLength === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Repeated({
            name: names.repeatedSequence || EMPTY_STRING2,
            value: new Set({
              value: [
                new Repeated({
                  name: names.repeatedSet || EMPTY_STRING2,
                  value: AttributeTypeAndValue.schema(names.typeAndValue || {})
                })
              ]
            })
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, [
        RDN,
        TYPE_AND_VALUES
      ]);
      const asn1 = compareSchema(schema, schema, _RelativeDistinguishedNames.schema({
        names: {
          blockName: RDN,
          repeatedSet: TYPE_AND_VALUES
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (TYPE_AND_VALUES in asn1.result) {
        this.typesAndValues = Array.from(asn1.result.typesAndValues, (element) => new AttributeTypeAndValue({ schema: element }));
      }
      this.valueBeforeDecode = asn1.result.RDN.valueBeforeDecodeView.slice().buffer;
    }
    toSchema() {
      if (this.valueBeforeDecode.byteLength === 0) {
        return new Sequence({
          value: [new Set({
            value: Array.from(this.typesAndValues, (o) => o.toSchema())
          })]
        });
      }
      const asn1 = fromBER(this.valueBeforeDecode);
      AsnError.assert(asn1, "RelativeDistinguishedNames");
      if (!(asn1.result instanceof Sequence)) {
        throw new Error("ASN.1 result should be SEQUENCE");
      }
      return asn1.result;
    }
    toJSON() {
      return {
        typesAndValues: Array.from(this.typesAndValues, (o) => o.toJSON())
      };
    }
    isEqual(compareTo) {
      if (compareTo instanceof _RelativeDistinguishedNames) {
        if (this.typesAndValues.length !== compareTo.typesAndValues.length)
          return false;
        for (const [index, typeAndValue] of this.typesAndValues.entries()) {
          if (typeAndValue.isEqual(compareTo.typesAndValues[index]) === false)
            return false;
        }
        return true;
      }
      if (compareTo instanceof ArrayBuffer) {
        return isEqualBuffer(this.valueBeforeDecode, compareTo);
      }
      return false;
    }
  };
  RelativeDistinguishedNames.CLASS_NAME = "RelativeDistinguishedNames";
  var TYPE$4 = "type";
  var VALUE$5 = "value";
  function builtInStandardAttributes(parameters = {}, optional = false) {
    const names = getParametersValue(parameters, "names", {});
    return new Sequence({
      optional,
      value: [
        new Constructed({
          optional: true,
          idBlock: {
            tagClass: 2,
            tagNumber: 1
          },
          name: names.country_name || EMPTY_STRING2,
          value: [
            new Choice({
              value: [
                new NumericString(),
                new PrintableString()
              ]
            })
          ]
        }),
        new Constructed({
          optional: true,
          idBlock: {
            tagClass: 2,
            tagNumber: 2
          },
          name: names.administration_domain_name || EMPTY_STRING2,
          value: [
            new Choice({
              value: [
                new NumericString(),
                new PrintableString()
              ]
            })
          ]
        }),
        new Primitive({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          name: names.network_address || EMPTY_STRING2,
          isHexOnly: true
        }),
        new Primitive({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          name: names.terminal_identifier || EMPTY_STRING2,
          isHexOnly: true
        }),
        new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 2
          },
          name: names.private_domain_name || EMPTY_STRING2,
          value: [
            new Choice({
              value: [
                new NumericString(),
                new PrintableString()
              ]
            })
          ]
        }),
        new Primitive({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 3
          },
          name: names.organization_name || EMPTY_STRING2,
          isHexOnly: true
        }),
        new Primitive({
          optional: true,
          name: names.numeric_user_identifier || EMPTY_STRING2,
          idBlock: {
            tagClass: 3,
            tagNumber: 4
          },
          isHexOnly: true
        }),
        new Constructed({
          optional: true,
          name: names.personal_name || EMPTY_STRING2,
          idBlock: {
            tagClass: 3,
            tagNumber: 5
          },
          value: [
            new Primitive({
              idBlock: {
                tagClass: 3,
                tagNumber: 0
              },
              isHexOnly: true
            }),
            new Primitive({
              optional: true,
              idBlock: {
                tagClass: 3,
                tagNumber: 1
              },
              isHexOnly: true
            }),
            new Primitive({
              optional: true,
              idBlock: {
                tagClass: 3,
                tagNumber: 2
              },
              isHexOnly: true
            }),
            new Primitive({
              optional: true,
              idBlock: {
                tagClass: 3,
                tagNumber: 3
              },
              isHexOnly: true
            })
          ]
        }),
        new Constructed({
          optional: true,
          name: names.organizational_unit_names || EMPTY_STRING2,
          idBlock: {
            tagClass: 3,
            tagNumber: 6
          },
          value: [
            new Repeated({
              value: new PrintableString()
            })
          ]
        })
      ]
    });
  }
  function builtInDomainDefinedAttributes(optional = false) {
    return new Sequence({
      optional,
      value: [
        new PrintableString(),
        new PrintableString()
      ]
    });
  }
  function extensionAttributes(optional = false) {
    return new Set({
      optional,
      value: [
        new Primitive({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          isHexOnly: true
        }),
        new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          value: [new Any()]
        })
      ]
    });
  }
  var GeneralName = class _GeneralName extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.type = getParametersValue(parameters, TYPE$4, _GeneralName.defaultValues(TYPE$4));
      this.value = getParametersValue(parameters, VALUE$5, _GeneralName.defaultValues(VALUE$5));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case TYPE$4:
          return 9;
        case VALUE$5:
          return {};
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case TYPE$4:
          return memberValue === _GeneralName.defaultValues(memberName);
        case VALUE$5:
          return Object.keys(memberValue).length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Choice({
        value: [
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            name: names.blockName || EMPTY_STRING2,
            value: [
              new ObjectIdentifier(),
              new Constructed({
                idBlock: {
                  tagClass: 3,
                  tagNumber: 0
                },
                value: [new Any()]
              })
            ]
          }),
          new Primitive({
            name: names.blockName || EMPTY_STRING2,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            }
          }),
          new Primitive({
            name: names.blockName || EMPTY_STRING2,
            idBlock: {
              tagClass: 3,
              tagNumber: 2
            }
          }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 3
            },
            name: names.blockName || EMPTY_STRING2,
            value: [
              builtInStandardAttributes(names.builtInStandardAttributes || {}, false),
              builtInDomainDefinedAttributes(true),
              extensionAttributes(true)
            ]
          }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 4
            },
            name: names.blockName || EMPTY_STRING2,
            value: [RelativeDistinguishedNames.schema(names.directoryName || {})]
          }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 5
            },
            name: names.blockName || EMPTY_STRING2,
            value: [
              new Constructed({
                optional: true,
                idBlock: {
                  tagClass: 3,
                  tagNumber: 0
                },
                value: [
                  new Choice({
                    value: [
                      new TeletexString(),
                      new PrintableString(),
                      new UniversalString(),
                      new Utf8String(),
                      new BmpString()
                    ]
                  })
                ]
              }),
              new Constructed({
                idBlock: {
                  tagClass: 3,
                  tagNumber: 1
                },
                value: [
                  new Choice({
                    value: [
                      new TeletexString(),
                      new PrintableString(),
                      new UniversalString(),
                      new Utf8String(),
                      new BmpString()
                    ]
                  })
                ]
              })
            ]
          }),
          new Primitive({
            name: names.blockName || EMPTY_STRING2,
            idBlock: {
              tagClass: 3,
              tagNumber: 6
            }
          }),
          new Primitive({
            name: names.blockName || EMPTY_STRING2,
            idBlock: {
              tagClass: 3,
              tagNumber: 7
            }
          }),
          new Primitive({
            name: names.blockName || EMPTY_STRING2,
            idBlock: {
              tagClass: 3,
              tagNumber: 8
            }
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, [
        "blockName",
        "otherName",
        "rfc822Name",
        "dNSName",
        "x400Address",
        "directoryName",
        "ediPartyName",
        "uniformResourceIdentifier",
        "iPAddress",
        "registeredID"
      ]);
      const asn1 = compareSchema(schema, schema, _GeneralName.schema({
        names: {
          blockName: "blockName",
          otherName: "otherName",
          rfc822Name: "rfc822Name",
          dNSName: "dNSName",
          x400Address: "x400Address",
          directoryName: {
            names: {
              blockName: "directoryName"
            }
          },
          ediPartyName: "ediPartyName",
          uniformResourceIdentifier: "uniformResourceIdentifier",
          iPAddress: "iPAddress",
          registeredID: "registeredID"
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.type = asn1.result.blockName.idBlock.tagNumber;
      switch (this.type) {
        case 0:
          this.value = asn1.result.blockName;
          break;
        case 1:
        case 2:
        case 6:
          {
            const value = asn1.result.blockName;
            value.idBlock.tagClass = 1;
            value.idBlock.tagNumber = 22;
            const valueBER = value.toBER(false);
            const asnValue = fromBER(valueBER);
            AsnError.assert(asnValue, "GeneralName value");
            this.value = asnValue.result.valueBlock.value;
          }
          break;
        case 3:
          this.value = asn1.result.blockName;
          break;
        case 4:
          this.value = new RelativeDistinguishedNames({ schema: asn1.result.directoryName });
          break;
        case 5:
          this.value = asn1.result.ediPartyName;
          break;
        case 7:
          this.value = new OctetString({ valueHex: asn1.result.blockName.valueBlock.valueHex });
          break;
        case 8:
          {
            const value = asn1.result.blockName;
            value.idBlock.tagClass = 1;
            value.idBlock.tagNumber = 6;
            const valueBER = value.toBER(false);
            const asnValue = fromBER(valueBER);
            AsnError.assert(asnValue, "GeneralName registeredID");
            this.value = asnValue.result.valueBlock.toString();
          }
          break;
      }
    }
    toSchema() {
      switch (this.type) {
        case 0:
        case 3:
        case 5:
          return new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: this.type
            },
            value: [
              this.value
            ]
          });
        case 1:
        case 2:
        case 6: {
          const value = new IA5String({ value: this.value });
          value.idBlock.tagClass = 3;
          value.idBlock.tagNumber = this.type;
          return value;
        }
        case 4:
          return new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 4
            },
            value: [this.value.toSchema()]
          });
        case 7: {
          const value = this.value;
          value.idBlock.tagClass = 3;
          value.idBlock.tagNumber = this.type;
          return value;
        }
        case 8: {
          const value = new ObjectIdentifier({ value: this.value });
          value.idBlock.tagClass = 3;
          value.idBlock.tagNumber = this.type;
          return value;
        }
        default:
          return _GeneralName.schema();
      }
    }
    toJSON() {
      const _object = {
        type: this.type,
        value: EMPTY_STRING2
      };
      if (typeof this.value === "string")
        _object.value = this.value;
      else {
        try {
          _object.value = this.value.toJSON();
        } catch {
        }
      }
      return _object;
    }
  };
  GeneralName.CLASS_NAME = "GeneralName";
  var ACCESS_METHOD = "accessMethod";
  var ACCESS_LOCATION = "accessLocation";
  var CLEAR_PROPS$1v = [
    ACCESS_METHOD,
    ACCESS_LOCATION
  ];
  var AccessDescription = class _AccessDescription extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.accessMethod = getParametersValue(parameters, ACCESS_METHOD, _AccessDescription.defaultValues(ACCESS_METHOD));
      this.accessLocation = getParametersValue(parameters, ACCESS_LOCATION, _AccessDescription.defaultValues(ACCESS_LOCATION));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case ACCESS_METHOD:
          return EMPTY_STRING2;
        case ACCESS_LOCATION:
          return new GeneralName();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.accessMethod || EMPTY_STRING2 }),
          GeneralName.schema(names.accessLocation || {})
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1v);
      const asn1 = compareSchema(schema, schema, _AccessDescription.schema({
        names: {
          accessMethod: ACCESS_METHOD,
          accessLocation: {
            names: {
              blockName: ACCESS_LOCATION
            }
          }
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.accessMethod = asn1.result.accessMethod.valueBlock.toString();
      this.accessLocation = new GeneralName({ schema: asn1.result.accessLocation });
    }
    toSchema() {
      return new Sequence({
        value: [
          new ObjectIdentifier({ value: this.accessMethod }),
          this.accessLocation.toSchema()
        ]
      });
    }
    toJSON() {
      return {
        accessMethod: this.accessMethod,
        accessLocation: this.accessLocation.toJSON()
      };
    }
  };
  AccessDescription.CLASS_NAME = "AccessDescription";
  var SECONDS = "seconds";
  var MILLIS = "millis";
  var MICROS = "micros";
  var Accuracy = class _Accuracy extends PkiObject {
    constructor(parameters = {}) {
      super();
      if (SECONDS in parameters) {
        this.seconds = getParametersValue(parameters, SECONDS, _Accuracy.defaultValues(SECONDS));
      }
      if (MILLIS in parameters) {
        this.millis = getParametersValue(parameters, MILLIS, _Accuracy.defaultValues(MILLIS));
      }
      if (MICROS in parameters) {
        this.micros = getParametersValue(parameters, MICROS, _Accuracy.defaultValues(MICROS));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case SECONDS:
        case MILLIS:
        case MICROS:
          return 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case SECONDS:
        case MILLIS:
        case MICROS:
          return memberValue === _Accuracy.defaultValues(memberName);
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        optional: true,
        value: [
          new Integer({
            optional: true,
            name: names.seconds || EMPTY_STRING2
          }),
          new Primitive({
            name: names.millis || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            }
          }),
          new Primitive({
            name: names.micros || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            }
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, [
        SECONDS,
        MILLIS,
        MICROS
      ]);
      const asn1 = compareSchema(schema, schema, _Accuracy.schema({
        names: {
          seconds: SECONDS,
          millis: MILLIS,
          micros: MICROS
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if ("seconds" in asn1.result) {
        this.seconds = asn1.result.seconds.valueBlock.valueDec;
      }
      if ("millis" in asn1.result) {
        const intMillis = new Integer({ valueHex: asn1.result.millis.valueBlock.valueHex });
        this.millis = intMillis.valueBlock.valueDec;
      }
      if ("micros" in asn1.result) {
        const intMicros = new Integer({ valueHex: asn1.result.micros.valueBlock.valueHex });
        this.micros = intMicros.valueBlock.valueDec;
      }
    }
    toSchema() {
      const outputArray = [];
      if (this.seconds !== void 0)
        outputArray.push(new Integer({ value: this.seconds }));
      if (this.millis !== void 0) {
        const intMillis = new Integer({ value: this.millis });
        outputArray.push(new Primitive({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          valueHex: intMillis.valueBlock.valueHexView
        }));
      }
      if (this.micros !== void 0) {
        const intMicros = new Integer({ value: this.micros });
        outputArray.push(new Primitive({
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          valueHex: intMicros.valueBlock.valueHexView
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const _object = {};
      if (this.seconds !== void 0)
        _object.seconds = this.seconds;
      if (this.millis !== void 0)
        _object.millis = this.millis;
      if (this.micros !== void 0)
        _object.micros = this.micros;
      return _object;
    }
  };
  Accuracy.CLASS_NAME = "Accuracy";
  var ALGORITHM_ID = "algorithmId";
  var ALGORITHM_PARAMS = "algorithmParams";
  var ALGORITHM$2 = "algorithm";
  var PARAMS = "params";
  var CLEAR_PROPS$1u = [
    ALGORITHM$2,
    PARAMS
  ];
  var AlgorithmIdentifier = class _AlgorithmIdentifier extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.algorithmId = getParametersValue(parameters, ALGORITHM_ID, _AlgorithmIdentifier.defaultValues(ALGORITHM_ID));
      if (ALGORITHM_PARAMS in parameters) {
        this.algorithmParams = getParametersValue(parameters, ALGORITHM_PARAMS, _AlgorithmIdentifier.defaultValues(ALGORITHM_PARAMS));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case ALGORITHM_ID:
          return EMPTY_STRING2;
        case ALGORITHM_PARAMS:
          return new Any();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case ALGORITHM_ID:
          return memberValue === EMPTY_STRING2;
        case ALGORITHM_PARAMS:
          return memberValue instanceof Any;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        optional: names.optional || false,
        value: [
          new ObjectIdentifier({ name: names.algorithmIdentifier || EMPTY_STRING2 }),
          new Any({ name: names.algorithmParams || EMPTY_STRING2, optional: true })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1u);
      const asn1 = compareSchema(schema, schema, _AlgorithmIdentifier.schema({
        names: {
          algorithmIdentifier: ALGORITHM$2,
          algorithmParams: PARAMS
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.algorithmId = asn1.result.algorithm.valueBlock.toString();
      if (PARAMS in asn1.result) {
        this.algorithmParams = asn1.result.params;
      }
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(new ObjectIdentifier({ value: this.algorithmId }));
      if (this.algorithmParams && !(this.algorithmParams instanceof Any)) {
        outputArray.push(this.algorithmParams);
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const object = {
        algorithmId: this.algorithmId
      };
      if (this.algorithmParams && !(this.algorithmParams instanceof Any)) {
        object.algorithmParams = this.algorithmParams.toJSON();
      }
      return object;
    }
    isEqual(algorithmIdentifier) {
      if (!(algorithmIdentifier instanceof _AlgorithmIdentifier)) {
        return false;
      }
      if (this.algorithmId !== algorithmIdentifier.algorithmId) {
        return false;
      }
      if (this.algorithmParams) {
        if (algorithmIdentifier.algorithmParams) {
          return JSON.stringify(this.algorithmParams) === JSON.stringify(algorithmIdentifier.algorithmParams);
        }
        return false;
      }
      if (algorithmIdentifier.algorithmParams) {
        return false;
      }
      return true;
    }
  };
  AlgorithmIdentifier.CLASS_NAME = "AlgorithmIdentifier";
  var ALT_NAMES = "altNames";
  var CLEAR_PROPS$1t = [
    ALT_NAMES
  ];
  var AltName = class _AltName extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.altNames = getParametersValue(parameters, ALT_NAMES, _AltName.defaultValues(ALT_NAMES));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case ALT_NAMES:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Repeated({
            name: names.altNames || EMPTY_STRING2,
            value: GeneralName.schema()
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1t);
      const asn1 = compareSchema(schema, schema, _AltName.schema({
        names: {
          altNames: ALT_NAMES
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (ALT_NAMES in asn1.result) {
        this.altNames = Array.from(asn1.result.altNames, (element) => new GeneralName({ schema: element }));
      }
    }
    toSchema() {
      return new Sequence({
        value: Array.from(this.altNames, (o) => o.toSchema())
      });
    }
    toJSON() {
      return {
        altNames: Array.from(this.altNames, (o) => o.toJSON())
      };
    }
  };
  AltName.CLASS_NAME = "AltName";
  var TYPE$3 = "type";
  var VALUES$1 = "values";
  var CLEAR_PROPS$1s = [
    TYPE$3,
    VALUES$1
  ];
  var Attribute = class _Attribute extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.type = getParametersValue(parameters, TYPE$3, _Attribute.defaultValues(TYPE$3));
      this.values = getParametersValue(parameters, VALUES$1, _Attribute.defaultValues(VALUES$1));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case TYPE$3:
          return EMPTY_STRING2;
        case VALUES$1:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case TYPE$3:
          return memberValue === EMPTY_STRING2;
        case VALUES$1:
          return memberValue.length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.type || EMPTY_STRING2 }),
          new Set({
            name: names.setName || EMPTY_STRING2,
            value: [
              new Repeated({
                name: names.values || EMPTY_STRING2,
                value: new Any()
              })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1s);
      const asn1 = compareSchema(schema, schema, _Attribute.schema({
        names: {
          type: TYPE$3,
          values: VALUES$1
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.type = asn1.result.type.valueBlock.toString();
      this.values = asn1.result.values;
    }
    toSchema() {
      return new Sequence({
        value: [
          new ObjectIdentifier({ value: this.type }),
          new Set({
            value: this.values
          })
        ]
      });
    }
    toJSON() {
      return {
        type: this.type,
        values: Array.from(this.values, (o) => o.toJSON())
      };
    }
  };
  Attribute.CLASS_NAME = "Attribute";
  var NOT_BEFORE_TIME = "notBeforeTime";
  var NOT_AFTER_TIME = "notAfterTime";
  var CLEAR_PROPS$1r = [
    NOT_BEFORE_TIME,
    NOT_AFTER_TIME
  ];
  var AttCertValidityPeriod = class _AttCertValidityPeriod extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.notBeforeTime = getParametersValue(parameters, NOT_BEFORE_TIME, _AttCertValidityPeriod.defaultValues(NOT_BEFORE_TIME));
      this.notAfterTime = getParametersValue(parameters, NOT_AFTER_TIME, _AttCertValidityPeriod.defaultValues(NOT_AFTER_TIME));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case NOT_BEFORE_TIME:
        case NOT_AFTER_TIME:
          return new Date(0, 0, 0);
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new GeneralizedTime({ name: names.notBeforeTime || EMPTY_STRING2 }),
          new GeneralizedTime({ name: names.notAfterTime || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1r);
      const asn1 = compareSchema(schema, schema, _AttCertValidityPeriod.schema({
        names: {
          notBeforeTime: NOT_BEFORE_TIME,
          notAfterTime: NOT_AFTER_TIME
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.notBeforeTime = asn1.result.notBeforeTime.toDate();
      this.notAfterTime = asn1.result.notAfterTime.toDate();
    }
    toSchema() {
      return new Sequence({
        value: [
          new GeneralizedTime({ valueDate: this.notBeforeTime }),
          new GeneralizedTime({ valueDate: this.notAfterTime })
        ]
      });
    }
    toJSON() {
      return {
        notBeforeTime: this.notBeforeTime,
        notAfterTime: this.notAfterTime
      };
    }
  };
  AttCertValidityPeriod.CLASS_NAME = "AttCertValidityPeriod";
  var NAMES = "names";
  var GENERAL_NAMES = "generalNames";
  var GeneralNames = class _GeneralNames extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.names = getParametersValue(parameters, NAMES, _GeneralNames.defaultValues(NAMES));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case "names":
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}, optional = false) {
      const names = getParametersValue(parameters, NAMES, {});
      return new Sequence({
        optional,
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Repeated({
            name: names.generalNames || EMPTY_STRING2,
            value: GeneralName.schema()
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, [
        NAMES,
        GENERAL_NAMES
      ]);
      const asn1 = compareSchema(schema, schema, _GeneralNames.schema({
        names: {
          blockName: NAMES,
          generalNames: GENERAL_NAMES
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.names = Array.from(asn1.result.generalNames, (element) => new GeneralName({ schema: element }));
    }
    toSchema() {
      return new Sequence({
        value: Array.from(this.names, (o) => o.toSchema())
      });
    }
    toJSON() {
      return {
        names: Array.from(this.names, (o) => o.toJSON())
      };
    }
  };
  GeneralNames.CLASS_NAME = "GeneralNames";
  var id_SubjectDirectoryAttributes = "2.5.29.9";
  var id_SubjectKeyIdentifier = "2.5.29.14";
  var id_KeyUsage = "2.5.29.15";
  var id_PrivateKeyUsagePeriod = "2.5.29.16";
  var id_SubjectAltName = "2.5.29.17";
  var id_IssuerAltName = "2.5.29.18";
  var id_BasicConstraints = "2.5.29.19";
  var id_CRLNumber = "2.5.29.20";
  var id_BaseCRLNumber = "2.5.29.27";
  var id_CRLReason = "2.5.29.21";
  var id_InvalidityDate = "2.5.29.24";
  var id_IssuingDistributionPoint = "2.5.29.28";
  var id_CertificateIssuer = "2.5.29.29";
  var id_NameConstraints = "2.5.29.30";
  var id_CRLDistributionPoints = "2.5.29.31";
  var id_FreshestCRL = "2.5.29.46";
  var id_CertificatePolicies = "2.5.29.32";
  var id_AnyPolicy = "2.5.29.32.0";
  var id_MicrosoftAppPolicies = "1.3.6.1.4.1.311.21.10";
  var id_PolicyMappings = "2.5.29.33";
  var id_AuthorityKeyIdentifier = "2.5.29.35";
  var id_PolicyConstraints = "2.5.29.36";
  var id_ExtKeyUsage = "2.5.29.37";
  var id_InhibitAnyPolicy = "2.5.29.54";
  var id_AuthorityInfoAccess = "1.3.6.1.5.5.7.1.1";
  var id_SubjectInfoAccess = "1.3.6.1.5.5.7.1.11";
  var id_SignedCertificateTimestampList = "1.3.6.1.4.1.11129.2.4.2";
  var id_MicrosoftCertTemplateV2 = "1.3.6.1.4.1.311.21.7";
  var id_MicrosoftCaVersion = "1.3.6.1.4.1.311.21.1";
  var id_QCStatements = "1.3.6.1.5.5.7.1.3";
  var id_ContentType_Data = "1.2.840.113549.1.7.1";
  var id_ContentType_SignedData = "1.2.840.113549.1.7.2";
  var id_ContentType_EnvelopedData = "1.2.840.113549.1.7.3";
  var id_ContentType_EncryptedData = "1.2.840.113549.1.7.6";
  var id_eContentType_TSTInfo = "1.2.840.113549.1.9.16.1.4";
  var id_CertBag_X509Certificate = "1.2.840.113549.1.9.22.1";
  var id_CertBag_SDSICertificate = "1.2.840.113549.1.9.22.2";
  var id_CertBag_AttributeCertificate = "1.2.840.113549.1.9.22.3";
  var id_CRLBag_X509CRL = "1.2.840.113549.1.9.23.1";
  var id_pkix = "1.3.6.1.5.5.7";
  var id_ad = `${id_pkix}.48`;
  var id_PKIX_OCSP_Basic = `${id_ad}.1.1`;
  var id_ad_caIssuers = `${id_ad}.2`;
  var id_ad_ocsp = `${id_ad}.1`;
  var KEY_IDENTIFIER$1 = "keyIdentifier";
  var AUTHORITY_CERT_ISSUER = "authorityCertIssuer";
  var AUTHORITY_CERT_SERIAL_NUMBER = "authorityCertSerialNumber";
  var CLEAR_PROPS$1q = [
    KEY_IDENTIFIER$1,
    AUTHORITY_CERT_ISSUER,
    AUTHORITY_CERT_SERIAL_NUMBER
  ];
  var AuthorityKeyIdentifier = class _AuthorityKeyIdentifier extends PkiObject {
    constructor(parameters = {}) {
      super();
      if (KEY_IDENTIFIER$1 in parameters) {
        this.keyIdentifier = getParametersValue(parameters, KEY_IDENTIFIER$1, _AuthorityKeyIdentifier.defaultValues(KEY_IDENTIFIER$1));
      }
      if (AUTHORITY_CERT_ISSUER in parameters) {
        this.authorityCertIssuer = getParametersValue(parameters, AUTHORITY_CERT_ISSUER, _AuthorityKeyIdentifier.defaultValues(AUTHORITY_CERT_ISSUER));
      }
      if (AUTHORITY_CERT_SERIAL_NUMBER in parameters) {
        this.authorityCertSerialNumber = getParametersValue(parameters, AUTHORITY_CERT_SERIAL_NUMBER, _AuthorityKeyIdentifier.defaultValues(AUTHORITY_CERT_SERIAL_NUMBER));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case KEY_IDENTIFIER$1:
          return new OctetString();
        case AUTHORITY_CERT_ISSUER:
          return [];
        case AUTHORITY_CERT_SERIAL_NUMBER:
          return new Integer();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Primitive({
            name: names.keyIdentifier || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            }
          }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: [
              new Repeated({
                name: names.authorityCertIssuer || EMPTY_STRING2,
                value: GeneralName.schema()
              })
            ]
          }),
          new Primitive({
            name: names.authorityCertSerialNumber || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 2
            }
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1q);
      const asn1 = compareSchema(schema, schema, _AuthorityKeyIdentifier.schema({
        names: {
          keyIdentifier: KEY_IDENTIFIER$1,
          authorityCertIssuer: AUTHORITY_CERT_ISSUER,
          authorityCertSerialNumber: AUTHORITY_CERT_SERIAL_NUMBER
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (KEY_IDENTIFIER$1 in asn1.result)
        this.keyIdentifier = new OctetString({ valueHex: asn1.result.keyIdentifier.valueBlock.valueHex });
      if (AUTHORITY_CERT_ISSUER in asn1.result)
        this.authorityCertIssuer = Array.from(asn1.result.authorityCertIssuer, (o) => new GeneralName({ schema: o }));
      if (AUTHORITY_CERT_SERIAL_NUMBER in asn1.result)
        this.authorityCertSerialNumber = new Integer({ valueHex: asn1.result.authorityCertSerialNumber.valueBlock.valueHex });
    }
    toSchema() {
      const outputArray = [];
      if (this.keyIdentifier) {
        outputArray.push(new Primitive({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          valueHex: this.keyIdentifier.valueBlock.valueHexView
        }));
      }
      if (this.authorityCertIssuer) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          value: Array.from(this.authorityCertIssuer, (o) => o.toSchema())
        }));
      }
      if (this.authorityCertSerialNumber) {
        outputArray.push(new Primitive({
          idBlock: {
            tagClass: 3,
            tagNumber: 2
          },
          valueHex: this.authorityCertSerialNumber.valueBlock.valueHexView
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const object = {};
      if (this.keyIdentifier) {
        object.keyIdentifier = this.keyIdentifier.toJSON();
      }
      if (this.authorityCertIssuer) {
        object.authorityCertIssuer = Array.from(this.authorityCertIssuer, (o) => o.toJSON());
      }
      if (this.authorityCertSerialNumber) {
        object.authorityCertSerialNumber = this.authorityCertSerialNumber.toJSON();
      }
      return object;
    }
  };
  AuthorityKeyIdentifier.CLASS_NAME = "AuthorityKeyIdentifier";
  var PATH_LENGTH_CONSTRAINT = "pathLenConstraint";
  var CA = "cA";
  var BasicConstraints = class _BasicConstraints extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.cA = getParametersValue(parameters, CA, false);
      if (PATH_LENGTH_CONSTRAINT in parameters) {
        this.pathLenConstraint = getParametersValue(parameters, PATH_LENGTH_CONSTRAINT, 0);
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case CA:
          return false;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Boolean({
            optional: true,
            name: names.cA || EMPTY_STRING2
          }),
          new Integer({
            optional: true,
            name: names.pathLenConstraint || EMPTY_STRING2
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, [
        CA,
        PATH_LENGTH_CONSTRAINT
      ]);
      const asn1 = compareSchema(schema, schema, _BasicConstraints.schema({
        names: {
          cA: CA,
          pathLenConstraint: PATH_LENGTH_CONSTRAINT
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (CA in asn1.result) {
        this.cA = asn1.result.cA.valueBlock.value;
      }
      if (PATH_LENGTH_CONSTRAINT in asn1.result) {
        if (asn1.result.pathLenConstraint.valueBlock.isHexOnly) {
          this.pathLenConstraint = asn1.result.pathLenConstraint;
        } else {
          this.pathLenConstraint = asn1.result.pathLenConstraint.valueBlock.valueDec;
        }
      }
    }
    toSchema() {
      const outputArray = [];
      if (this.cA !== _BasicConstraints.defaultValues(CA))
        outputArray.push(new Boolean({ value: this.cA }));
      if (PATH_LENGTH_CONSTRAINT in this) {
        if (this.pathLenConstraint instanceof Integer) {
          outputArray.push(this.pathLenConstraint);
        } else {
          outputArray.push(new Integer({ value: this.pathLenConstraint }));
        }
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const object = {};
      if (this.cA !== _BasicConstraints.defaultValues(CA)) {
        object.cA = this.cA;
      }
      if (PATH_LENGTH_CONSTRAINT in this) {
        if (this.pathLenConstraint instanceof Integer) {
          object.pathLenConstraint = this.pathLenConstraint.toJSON();
        } else {
          object.pathLenConstraint = this.pathLenConstraint;
        }
      }
      return object;
    }
  };
  BasicConstraints.CLASS_NAME = "BasicConstraints";
  var CERTIFICATE_INDEX = "certificateIndex";
  var KEY_INDEX = "keyIndex";
  var CAVersion = class _CAVersion extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.certificateIndex = getParametersValue(parameters, CERTIFICATE_INDEX, _CAVersion.defaultValues(CERTIFICATE_INDEX));
      this.keyIndex = getParametersValue(parameters, KEY_INDEX, _CAVersion.defaultValues(KEY_INDEX));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case CERTIFICATE_INDEX:
        case KEY_INDEX:
          return 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema() {
      return new Integer();
    }
    fromSchema(schema) {
      if (schema.constructor.blockName() !== Integer.blockName()) {
        throw new Error("Object's schema was not verified against input data for CAVersion");
      }
      let value = schema.valueBlock.valueHex.slice(0);
      const valueView = new Uint8Array(value);
      switch (true) {
        case value.byteLength < 4:
          {
            const tempValue = new ArrayBuffer(4);
            const tempValueView = new Uint8Array(tempValue);
            tempValueView.set(valueView, 4 - value.byteLength);
            value = tempValue.slice(0);
          }
          break;
        case value.byteLength > 4:
          {
            const tempValue = new ArrayBuffer(4);
            const tempValueView = new Uint8Array(tempValue);
            tempValueView.set(valueView.slice(0, 4));
            value = tempValue.slice(0);
          }
          break;
      }
      const keyIndexBuffer = value.slice(0, 2);
      const keyIndexView8 = new Uint8Array(keyIndexBuffer);
      let temp = keyIndexView8[0];
      keyIndexView8[0] = keyIndexView8[1];
      keyIndexView8[1] = temp;
      const keyIndexView16 = new Uint16Array(keyIndexBuffer);
      this.keyIndex = keyIndexView16[0];
      const certificateIndexBuffer = value.slice(2);
      const certificateIndexView8 = new Uint8Array(certificateIndexBuffer);
      temp = certificateIndexView8[0];
      certificateIndexView8[0] = certificateIndexView8[1];
      certificateIndexView8[1] = temp;
      const certificateIndexView16 = new Uint16Array(certificateIndexBuffer);
      this.certificateIndex = certificateIndexView16[0];
    }
    toSchema() {
      const certificateIndexBuffer = new ArrayBuffer(2);
      const certificateIndexView = new Uint16Array(certificateIndexBuffer);
      certificateIndexView[0] = this.certificateIndex;
      const certificateIndexView8 = new Uint8Array(certificateIndexBuffer);
      let temp = certificateIndexView8[0];
      certificateIndexView8[0] = certificateIndexView8[1];
      certificateIndexView8[1] = temp;
      const keyIndexBuffer = new ArrayBuffer(2);
      const keyIndexView = new Uint16Array(keyIndexBuffer);
      keyIndexView[0] = this.keyIndex;
      const keyIndexView8 = new Uint8Array(keyIndexBuffer);
      temp = keyIndexView8[0];
      keyIndexView8[0] = keyIndexView8[1];
      keyIndexView8[1] = temp;
      return new Integer({
        valueHex: utilConcatBuf(keyIndexBuffer, certificateIndexBuffer)
      });
    }
    toJSON() {
      return {
        certificateIndex: this.certificateIndex,
        keyIndex: this.keyIndex
      };
    }
  };
  CAVersion.CLASS_NAME = "CAVersion";
  var POLICY_QUALIFIER_ID = "policyQualifierId";
  var QUALIFIER = "qualifier";
  var CLEAR_PROPS$1p = [
    POLICY_QUALIFIER_ID,
    QUALIFIER
  ];
  var PolicyQualifierInfo = class _PolicyQualifierInfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.policyQualifierId = getParametersValue(parameters, POLICY_QUALIFIER_ID, _PolicyQualifierInfo.defaultValues(POLICY_QUALIFIER_ID));
      this.qualifier = getParametersValue(parameters, QUALIFIER, _PolicyQualifierInfo.defaultValues(QUALIFIER));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case POLICY_QUALIFIER_ID:
          return EMPTY_STRING2;
        case QUALIFIER:
          return new Any();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.policyQualifierId || EMPTY_STRING2 }),
          new Any({ name: names.qualifier || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1p);
      const asn1 = compareSchema(schema, schema, _PolicyQualifierInfo.schema({
        names: {
          policyQualifierId: POLICY_QUALIFIER_ID,
          qualifier: QUALIFIER
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.policyQualifierId = asn1.result.policyQualifierId.valueBlock.toString();
      this.qualifier = asn1.result.qualifier;
    }
    toSchema() {
      return new Sequence({
        value: [
          new ObjectIdentifier({ value: this.policyQualifierId }),
          this.qualifier
        ]
      });
    }
    toJSON() {
      return {
        policyQualifierId: this.policyQualifierId,
        qualifier: this.qualifier.toJSON()
      };
    }
  };
  PolicyQualifierInfo.CLASS_NAME = "PolicyQualifierInfo";
  var POLICY_IDENTIFIER = "policyIdentifier";
  var POLICY_QUALIFIERS = "policyQualifiers";
  var CLEAR_PROPS$1o = [
    POLICY_IDENTIFIER,
    POLICY_QUALIFIERS
  ];
  var PolicyInformation = class _PolicyInformation extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.policyIdentifier = getParametersValue(parameters, POLICY_IDENTIFIER, _PolicyInformation.defaultValues(POLICY_IDENTIFIER));
      if (POLICY_QUALIFIERS in parameters) {
        this.policyQualifiers = getParametersValue(parameters, POLICY_QUALIFIERS, _PolicyInformation.defaultValues(POLICY_QUALIFIERS));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case POLICY_IDENTIFIER:
          return EMPTY_STRING2;
        case POLICY_QUALIFIERS:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.policyIdentifier || EMPTY_STRING2 }),
          new Sequence({
            optional: true,
            value: [
              new Repeated({
                name: names.policyQualifiers || EMPTY_STRING2,
                value: PolicyQualifierInfo.schema()
              })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1o);
      const asn1 = compareSchema(schema, schema, _PolicyInformation.schema({
        names: {
          policyIdentifier: POLICY_IDENTIFIER,
          policyQualifiers: POLICY_QUALIFIERS
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.policyIdentifier = asn1.result.policyIdentifier.valueBlock.toString();
      if (POLICY_QUALIFIERS in asn1.result) {
        this.policyQualifiers = Array.from(asn1.result.policyQualifiers, (element) => new PolicyQualifierInfo({ schema: element }));
      }
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(new ObjectIdentifier({ value: this.policyIdentifier }));
      if (this.policyQualifiers) {
        outputArray.push(new Sequence({
          value: Array.from(this.policyQualifiers, (o) => o.toSchema())
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        policyIdentifier: this.policyIdentifier
      };
      if (this.policyQualifiers)
        res.policyQualifiers = Array.from(this.policyQualifiers, (o) => o.toJSON());
      return res;
    }
  };
  PolicyInformation.CLASS_NAME = "PolicyInformation";
  var CERTIFICATE_POLICIES = "certificatePolicies";
  var CLEAR_PROPS$1n = [
    CERTIFICATE_POLICIES
  ];
  var CertificatePolicies = class _CertificatePolicies extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.certificatePolicies = getParametersValue(parameters, CERTIFICATE_POLICIES, _CertificatePolicies.defaultValues(CERTIFICATE_POLICIES));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case CERTIFICATE_POLICIES:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Repeated({
            name: names.certificatePolicies || EMPTY_STRING2,
            value: PolicyInformation.schema()
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1n);
      const asn1 = compareSchema(schema, schema, _CertificatePolicies.schema({
        names: {
          certificatePolicies: CERTIFICATE_POLICIES
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.certificatePolicies = Array.from(asn1.result.certificatePolicies, (element) => new PolicyInformation({ schema: element }));
    }
    toSchema() {
      return new Sequence({
        value: Array.from(this.certificatePolicies, (o) => o.toSchema())
      });
    }
    toJSON() {
      return {
        certificatePolicies: Array.from(this.certificatePolicies, (o) => o.toJSON())
      };
    }
  };
  CertificatePolicies.CLASS_NAME = "CertificatePolicies";
  var TEMPLATE_ID = "templateID";
  var TEMPLATE_MAJOR_VERSION = "templateMajorVersion";
  var TEMPLATE_MINOR_VERSION = "templateMinorVersion";
  var CLEAR_PROPS$1m = [
    TEMPLATE_ID,
    TEMPLATE_MAJOR_VERSION,
    TEMPLATE_MINOR_VERSION
  ];
  var CertificateTemplate = class _CertificateTemplate extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.templateID = getParametersValue(parameters, TEMPLATE_ID, _CertificateTemplate.defaultValues(TEMPLATE_ID));
      if (TEMPLATE_MAJOR_VERSION in parameters) {
        this.templateMajorVersion = getParametersValue(parameters, TEMPLATE_MAJOR_VERSION, _CertificateTemplate.defaultValues(TEMPLATE_MAJOR_VERSION));
      }
      if (TEMPLATE_MINOR_VERSION in parameters) {
        this.templateMinorVersion = getParametersValue(parameters, TEMPLATE_MINOR_VERSION, _CertificateTemplate.defaultValues(TEMPLATE_MINOR_VERSION));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case TEMPLATE_ID:
          return EMPTY_STRING2;
        case TEMPLATE_MAJOR_VERSION:
        case TEMPLATE_MINOR_VERSION:
          return 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.templateID || EMPTY_STRING2 }),
          new Integer({
            name: names.templateMajorVersion || EMPTY_STRING2,
            optional: true
          }),
          new Integer({
            name: names.templateMinorVersion || EMPTY_STRING2,
            optional: true
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1m);
      const asn1 = compareSchema(schema, schema, _CertificateTemplate.schema({
        names: {
          templateID: TEMPLATE_ID,
          templateMajorVersion: TEMPLATE_MAJOR_VERSION,
          templateMinorVersion: TEMPLATE_MINOR_VERSION
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.templateID = asn1.result.templateID.valueBlock.toString();
      if (TEMPLATE_MAJOR_VERSION in asn1.result) {
        this.templateMajorVersion = asn1.result.templateMajorVersion.valueBlock.valueDec;
      }
      if (TEMPLATE_MINOR_VERSION in asn1.result) {
        this.templateMinorVersion = asn1.result.templateMinorVersion.valueBlock.valueDec;
      }
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(new ObjectIdentifier({ value: this.templateID }));
      if (TEMPLATE_MAJOR_VERSION in this) {
        outputArray.push(new Integer({ value: this.templateMajorVersion }));
      }
      if (TEMPLATE_MINOR_VERSION in this) {
        outputArray.push(new Integer({ value: this.templateMinorVersion }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        templateID: this.templateID
      };
      if (TEMPLATE_MAJOR_VERSION in this)
        res.templateMajorVersion = this.templateMajorVersion;
      if (TEMPLATE_MINOR_VERSION in this)
        res.templateMinorVersion = this.templateMinorVersion;
      return res;
    }
  };
  var DISTRIBUTION_POINT$1 = "distributionPoint";
  var DISTRIBUTION_POINT_NAMES$1 = "distributionPointNames";
  var REASONS = "reasons";
  var CRL_ISSUER = "cRLIssuer";
  var CRL_ISSUER_NAMES = "cRLIssuerNames";
  var CLEAR_PROPS$1l = [
    DISTRIBUTION_POINT$1,
    DISTRIBUTION_POINT_NAMES$1,
    REASONS,
    CRL_ISSUER,
    CRL_ISSUER_NAMES
  ];
  var DistributionPoint = class _DistributionPoint extends PkiObject {
    constructor(parameters = {}) {
      super();
      if (DISTRIBUTION_POINT$1 in parameters) {
        this.distributionPoint = getParametersValue(parameters, DISTRIBUTION_POINT$1, _DistributionPoint.defaultValues(DISTRIBUTION_POINT$1));
      }
      if (REASONS in parameters) {
        this.reasons = getParametersValue(parameters, REASONS, _DistributionPoint.defaultValues(REASONS));
      }
      if (CRL_ISSUER in parameters) {
        this.cRLIssuer = getParametersValue(parameters, CRL_ISSUER, _DistributionPoint.defaultValues(CRL_ISSUER));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case DISTRIBUTION_POINT$1:
          return [];
        case REASONS:
          return new BitString();
        case CRL_ISSUER:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [
              new Choice({
                value: [
                  new Constructed({
                    name: names.distributionPoint || EMPTY_STRING2,
                    optional: true,
                    idBlock: {
                      tagClass: 3,
                      tagNumber: 0
                    },
                    value: [
                      new Repeated({
                        name: names.distributionPointNames || EMPTY_STRING2,
                        value: GeneralName.schema()
                      })
                    ]
                  }),
                  new Constructed({
                    name: names.distributionPoint || EMPTY_STRING2,
                    optional: true,
                    idBlock: {
                      tagClass: 3,
                      tagNumber: 1
                    },
                    value: RelativeDistinguishedNames.schema().valueBlock.value
                  })
                ]
              })
            ]
          }),
          new Primitive({
            name: names.reasons || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            }
          }),
          new Constructed({
            name: names.cRLIssuer || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 2
            },
            value: [
              new Repeated({
                name: names.cRLIssuerNames || EMPTY_STRING2,
                value: GeneralName.schema()
              })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1l);
      const asn1 = compareSchema(schema, schema, _DistributionPoint.schema({
        names: {
          distributionPoint: DISTRIBUTION_POINT$1,
          distributionPointNames: DISTRIBUTION_POINT_NAMES$1,
          reasons: REASONS,
          cRLIssuer: CRL_ISSUER,
          cRLIssuerNames: CRL_ISSUER_NAMES
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (DISTRIBUTION_POINT$1 in asn1.result) {
        if (asn1.result.distributionPoint.idBlock.tagNumber === 0) {
          this.distributionPoint = Array.from(asn1.result.distributionPointNames, (element) => new GeneralName({ schema: element }));
        }
        if (asn1.result.distributionPoint.idBlock.tagNumber === 1) {
          this.distributionPoint = new RelativeDistinguishedNames({
            schema: new Sequence({
              value: asn1.result.distributionPoint.valueBlock.value
            })
          });
        }
      }
      if (REASONS in asn1.result) {
        this.reasons = new BitString({ valueHex: asn1.result.reasons.valueBlock.valueHex });
      }
      if (CRL_ISSUER in asn1.result) {
        this.cRLIssuer = Array.from(asn1.result.cRLIssuerNames, (element) => new GeneralName({ schema: element }));
      }
    }
    toSchema() {
      const outputArray = [];
      if (this.distributionPoint) {
        let internalValue;
        if (this.distributionPoint instanceof Array) {
          internalValue = new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: Array.from(this.distributionPoint, (o) => o.toSchema())
          });
        } else {
          internalValue = new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: [this.distributionPoint.toSchema()]
          });
        }
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [internalValue]
        }));
      }
      if (this.reasons) {
        outputArray.push(new Primitive({
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          valueHex: this.reasons.valueBlock.valueHexView
        }));
      }
      if (this.cRLIssuer) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 2
          },
          value: Array.from(this.cRLIssuer, (o) => o.toSchema())
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const object = {};
      if (this.distributionPoint) {
        if (this.distributionPoint instanceof Array) {
          object.distributionPoint = Array.from(this.distributionPoint, (o) => o.toJSON());
        } else {
          object.distributionPoint = this.distributionPoint.toJSON();
        }
      }
      if (this.reasons) {
        object.reasons = this.reasons.toJSON();
      }
      if (this.cRLIssuer) {
        object.cRLIssuer = Array.from(this.cRLIssuer, (o) => o.toJSON());
      }
      return object;
    }
  };
  DistributionPoint.CLASS_NAME = "DistributionPoint";
  var DISTRIBUTION_POINTS = "distributionPoints";
  var CLEAR_PROPS$1k = [
    DISTRIBUTION_POINTS
  ];
  var CRLDistributionPoints = class _CRLDistributionPoints extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.distributionPoints = getParametersValue(parameters, DISTRIBUTION_POINTS, _CRLDistributionPoints.defaultValues(DISTRIBUTION_POINTS));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case DISTRIBUTION_POINTS:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Repeated({
            name: names.distributionPoints || EMPTY_STRING2,
            value: DistributionPoint.schema()
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1k);
      const asn1 = compareSchema(schema, schema, _CRLDistributionPoints.schema({
        names: {
          distributionPoints: DISTRIBUTION_POINTS
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.distributionPoints = Array.from(asn1.result.distributionPoints, (element) => new DistributionPoint({ schema: element }));
    }
    toSchema() {
      return new Sequence({
        value: Array.from(this.distributionPoints, (o) => o.toSchema())
      });
    }
    toJSON() {
      return {
        distributionPoints: Array.from(this.distributionPoints, (o) => o.toJSON())
      };
    }
  };
  CRLDistributionPoints.CLASS_NAME = "CRLDistributionPoints";
  var KEY_PURPOSES = "keyPurposes";
  var CLEAR_PROPS$1j = [
    KEY_PURPOSES
  ];
  var ExtKeyUsage = class _ExtKeyUsage extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.keyPurposes = getParametersValue(parameters, KEY_PURPOSES, _ExtKeyUsage.defaultValues(KEY_PURPOSES));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case KEY_PURPOSES:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Repeated({
            name: names.keyPurposes || EMPTY_STRING2,
            value: new ObjectIdentifier()
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1j);
      const asn1 = compareSchema(schema, schema, _ExtKeyUsage.schema({
        names: {
          keyPurposes: KEY_PURPOSES
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.keyPurposes = Array.from(asn1.result.keyPurposes, (element) => element.valueBlock.toString());
    }
    toSchema() {
      return new Sequence({
        value: Array.from(this.keyPurposes, (element) => new ObjectIdentifier({ value: element }))
      });
    }
    toJSON() {
      return {
        keyPurposes: Array.from(this.keyPurposes)
      };
    }
  };
  ExtKeyUsage.CLASS_NAME = "ExtKeyUsage";
  var ACCESS_DESCRIPTIONS = "accessDescriptions";
  var InfoAccess = class _InfoAccess extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.accessDescriptions = getParametersValue(parameters, ACCESS_DESCRIPTIONS, _InfoAccess.defaultValues(ACCESS_DESCRIPTIONS));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case ACCESS_DESCRIPTIONS:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Repeated({
            name: names.accessDescriptions || EMPTY_STRING2,
            value: AccessDescription.schema()
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, [
        ACCESS_DESCRIPTIONS
      ]);
      const asn1 = compareSchema(schema, schema, _InfoAccess.schema({
        names: {
          accessDescriptions: ACCESS_DESCRIPTIONS
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.accessDescriptions = Array.from(asn1.result.accessDescriptions, (element) => new AccessDescription({ schema: element }));
    }
    toSchema() {
      return new Sequence({
        value: Array.from(this.accessDescriptions, (o) => o.toSchema())
      });
    }
    toJSON() {
      return {
        accessDescriptions: Array.from(this.accessDescriptions, (o) => o.toJSON())
      };
    }
  };
  InfoAccess.CLASS_NAME = "InfoAccess";
  var DISTRIBUTION_POINT = "distributionPoint";
  var DISTRIBUTION_POINT_NAMES = "distributionPointNames";
  var ONLY_CONTAINS_USER_CERTS = "onlyContainsUserCerts";
  var ONLY_CONTAINS_CA_CERTS = "onlyContainsCACerts";
  var ONLY_SOME_REASON = "onlySomeReasons";
  var INDIRECT_CRL = "indirectCRL";
  var ONLY_CONTAINS_ATTRIBUTE_CERTS = "onlyContainsAttributeCerts";
  var CLEAR_PROPS$1i = [
    DISTRIBUTION_POINT,
    DISTRIBUTION_POINT_NAMES,
    ONLY_CONTAINS_USER_CERTS,
    ONLY_CONTAINS_CA_CERTS,
    ONLY_SOME_REASON,
    INDIRECT_CRL,
    ONLY_CONTAINS_ATTRIBUTE_CERTS
  ];
  var IssuingDistributionPoint = class _IssuingDistributionPoint extends PkiObject {
    constructor(parameters = {}) {
      super();
      if (DISTRIBUTION_POINT in parameters) {
        this.distributionPoint = getParametersValue(parameters, DISTRIBUTION_POINT, _IssuingDistributionPoint.defaultValues(DISTRIBUTION_POINT));
      }
      this.onlyContainsUserCerts = getParametersValue(parameters, ONLY_CONTAINS_USER_CERTS, _IssuingDistributionPoint.defaultValues(ONLY_CONTAINS_USER_CERTS));
      this.onlyContainsCACerts = getParametersValue(parameters, ONLY_CONTAINS_CA_CERTS, _IssuingDistributionPoint.defaultValues(ONLY_CONTAINS_CA_CERTS));
      if (ONLY_SOME_REASON in parameters) {
        this.onlySomeReasons = getParametersValue(parameters, ONLY_SOME_REASON, _IssuingDistributionPoint.defaultValues(ONLY_SOME_REASON));
      }
      this.indirectCRL = getParametersValue(parameters, INDIRECT_CRL, _IssuingDistributionPoint.defaultValues(INDIRECT_CRL));
      this.onlyContainsAttributeCerts = getParametersValue(parameters, ONLY_CONTAINS_ATTRIBUTE_CERTS, _IssuingDistributionPoint.defaultValues(ONLY_CONTAINS_ATTRIBUTE_CERTS));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case DISTRIBUTION_POINT:
          return [];
        case ONLY_CONTAINS_USER_CERTS:
          return false;
        case ONLY_CONTAINS_CA_CERTS:
          return false;
        case ONLY_SOME_REASON:
          return 0;
        case INDIRECT_CRL:
          return false;
        case ONLY_CONTAINS_ATTRIBUTE_CERTS:
          return false;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [
              new Choice({
                value: [
                  new Constructed({
                    name: names.distributionPoint || EMPTY_STRING2,
                    idBlock: {
                      tagClass: 3,
                      tagNumber: 0
                    },
                    value: [
                      new Repeated({
                        name: names.distributionPointNames || EMPTY_STRING2,
                        value: GeneralName.schema()
                      })
                    ]
                  }),
                  new Constructed({
                    name: names.distributionPoint || EMPTY_STRING2,
                    idBlock: {
                      tagClass: 3,
                      tagNumber: 1
                    },
                    value: RelativeDistinguishedNames.schema().valueBlock.value
                  })
                ]
              })
            ]
          }),
          new Primitive({
            name: names.onlyContainsUserCerts || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            }
          }),
          new Primitive({
            name: names.onlyContainsCACerts || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 2
            }
          }),
          new Primitive({
            name: names.onlySomeReasons || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 3
            }
          }),
          new Primitive({
            name: names.indirectCRL || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 4
            }
          }),
          new Primitive({
            name: names.onlyContainsAttributeCerts || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 5
            }
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1i);
      const asn1 = compareSchema(schema, schema, _IssuingDistributionPoint.schema({
        names: {
          distributionPoint: DISTRIBUTION_POINT,
          distributionPointNames: DISTRIBUTION_POINT_NAMES,
          onlyContainsUserCerts: ONLY_CONTAINS_USER_CERTS,
          onlyContainsCACerts: ONLY_CONTAINS_CA_CERTS,
          onlySomeReasons: ONLY_SOME_REASON,
          indirectCRL: INDIRECT_CRL,
          onlyContainsAttributeCerts: ONLY_CONTAINS_ATTRIBUTE_CERTS
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (DISTRIBUTION_POINT in asn1.result) {
        switch (true) {
          case asn1.result.distributionPoint.idBlock.tagNumber === 0:
            this.distributionPoint = Array.from(asn1.result.distributionPointNames, (element) => new GeneralName({ schema: element }));
            break;
          case asn1.result.distributionPoint.idBlock.tagNumber === 1:
            {
              this.distributionPoint = new RelativeDistinguishedNames({
                schema: new Sequence({
                  value: asn1.result.distributionPoint.valueBlock.value
                })
              });
            }
            break;
          default:
            throw new Error("Unknown tagNumber for distributionPoint: {$asn1.result.distributionPoint.idBlock.tagNumber}");
        }
      }
      if (ONLY_CONTAINS_USER_CERTS in asn1.result) {
        const view = new Uint8Array(asn1.result.onlyContainsUserCerts.valueBlock.valueHex);
        this.onlyContainsUserCerts = view[0] !== 0;
      }
      if (ONLY_CONTAINS_CA_CERTS in asn1.result) {
        const view = new Uint8Array(asn1.result.onlyContainsCACerts.valueBlock.valueHex);
        this.onlyContainsCACerts = view[0] !== 0;
      }
      if (ONLY_SOME_REASON in asn1.result) {
        const view = new Uint8Array(asn1.result.onlySomeReasons.valueBlock.valueHex);
        this.onlySomeReasons = view[0];
      }
      if (INDIRECT_CRL in asn1.result) {
        const view = new Uint8Array(asn1.result.indirectCRL.valueBlock.valueHex);
        this.indirectCRL = view[0] !== 0;
      }
      if (ONLY_CONTAINS_ATTRIBUTE_CERTS in asn1.result) {
        const view = new Uint8Array(asn1.result.onlyContainsAttributeCerts.valueBlock.valueHex);
        this.onlyContainsAttributeCerts = view[0] !== 0;
      }
    }
    toSchema() {
      const outputArray = [];
      if (this.distributionPoint) {
        let value;
        if (this.distributionPoint instanceof Array) {
          value = new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: Array.from(this.distributionPoint, (o) => o.toSchema())
          });
        } else {
          value = this.distributionPoint.toSchema();
          value.idBlock.tagClass = 3;
          value.idBlock.tagNumber = 1;
        }
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [value]
        }));
      }
      if (this.onlyContainsUserCerts !== _IssuingDistributionPoint.defaultValues(ONLY_CONTAINS_USER_CERTS)) {
        outputArray.push(new Primitive({
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          valueHex: new Uint8Array([255]).buffer
        }));
      }
      if (this.onlyContainsCACerts !== _IssuingDistributionPoint.defaultValues(ONLY_CONTAINS_CA_CERTS)) {
        outputArray.push(new Primitive({
          idBlock: {
            tagClass: 3,
            tagNumber: 2
          },
          valueHex: new Uint8Array([255]).buffer
        }));
      }
      if (this.onlySomeReasons !== void 0) {
        const buffer = new ArrayBuffer(1);
        const view = new Uint8Array(buffer);
        view[0] = this.onlySomeReasons;
        outputArray.push(new Primitive({
          idBlock: {
            tagClass: 3,
            tagNumber: 3
          },
          valueHex: buffer
        }));
      }
      if (this.indirectCRL !== _IssuingDistributionPoint.defaultValues(INDIRECT_CRL)) {
        outputArray.push(new Primitive({
          idBlock: {
            tagClass: 3,
            tagNumber: 4
          },
          valueHex: new Uint8Array([255]).buffer
        }));
      }
      if (this.onlyContainsAttributeCerts !== _IssuingDistributionPoint.defaultValues(ONLY_CONTAINS_ATTRIBUTE_CERTS)) {
        outputArray.push(new Primitive({
          idBlock: {
            tagClass: 3,
            tagNumber: 5
          },
          valueHex: new Uint8Array([255]).buffer
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const obj = {};
      if (this.distributionPoint) {
        if (this.distributionPoint instanceof Array) {
          obj.distributionPoint = Array.from(this.distributionPoint, (o) => o.toJSON());
        } else {
          obj.distributionPoint = this.distributionPoint.toJSON();
        }
      }
      if (this.onlyContainsUserCerts !== _IssuingDistributionPoint.defaultValues(ONLY_CONTAINS_USER_CERTS)) {
        obj.onlyContainsUserCerts = this.onlyContainsUserCerts;
      }
      if (this.onlyContainsCACerts !== _IssuingDistributionPoint.defaultValues(ONLY_CONTAINS_CA_CERTS)) {
        obj.onlyContainsCACerts = this.onlyContainsCACerts;
      }
      if (ONLY_SOME_REASON in this) {
        obj.onlySomeReasons = this.onlySomeReasons;
      }
      if (this.indirectCRL !== _IssuingDistributionPoint.defaultValues(INDIRECT_CRL)) {
        obj.indirectCRL = this.indirectCRL;
      }
      if (this.onlyContainsAttributeCerts !== _IssuingDistributionPoint.defaultValues(ONLY_CONTAINS_ATTRIBUTE_CERTS)) {
        obj.onlyContainsAttributeCerts = this.onlyContainsAttributeCerts;
      }
      return obj;
    }
  };
  IssuingDistributionPoint.CLASS_NAME = "IssuingDistributionPoint";
  var BASE = "base";
  var MINIMUM = "minimum";
  var MAXIMUM = "maximum";
  var CLEAR_PROPS$1h = [
    BASE,
    MINIMUM,
    MAXIMUM
  ];
  var GeneralSubtree = class _GeneralSubtree extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.base = getParametersValue(parameters, BASE, _GeneralSubtree.defaultValues(BASE));
      this.minimum = getParametersValue(parameters, MINIMUM, _GeneralSubtree.defaultValues(MINIMUM));
      if (MAXIMUM in parameters) {
        this.maximum = getParametersValue(parameters, MAXIMUM, _GeneralSubtree.defaultValues(MAXIMUM));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case BASE:
          return new GeneralName();
        case MINIMUM:
          return 0;
        case MAXIMUM:
          return 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          GeneralName.schema(names.base || {}),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [new Integer({ name: names.minimum || EMPTY_STRING2 })]
          }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: [new Integer({ name: names.maximum || EMPTY_STRING2 })]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1h);
      const asn1 = compareSchema(schema, schema, _GeneralSubtree.schema({
        names: {
          base: {
            names: {
              blockName: BASE
            }
          },
          minimum: MINIMUM,
          maximum: MAXIMUM
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.base = new GeneralName({ schema: asn1.result.base });
      if (MINIMUM in asn1.result) {
        if (asn1.result.minimum.valueBlock.isHexOnly)
          this.minimum = asn1.result.minimum;
        else
          this.minimum = asn1.result.minimum.valueBlock.valueDec;
      }
      if (MAXIMUM in asn1.result) {
        if (asn1.result.maximum.valueBlock.isHexOnly)
          this.maximum = asn1.result.maximum;
        else
          this.maximum = asn1.result.maximum.valueBlock.valueDec;
      }
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(this.base.toSchema());
      if (this.minimum !== 0) {
        let valueMinimum = 0;
        if (this.minimum instanceof Integer) {
          valueMinimum = this.minimum;
        } else {
          valueMinimum = new Integer({ value: this.minimum });
        }
        outputArray.push(new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [valueMinimum]
        }));
      }
      if (MAXIMUM in this) {
        let valueMaximum = 0;
        if (this.maximum instanceof Integer) {
          valueMaximum = this.maximum;
        } else {
          valueMaximum = new Integer({ value: this.maximum });
        }
        outputArray.push(new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          value: [valueMaximum]
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        base: this.base.toJSON()
      };
      if (this.minimum !== 0) {
        if (typeof this.minimum === "number") {
          res.minimum = this.minimum;
        } else {
          res.minimum = this.minimum.toJSON();
        }
      }
      if (this.maximum !== void 0) {
        if (typeof this.maximum === "number") {
          res.maximum = this.maximum;
        } else {
          res.maximum = this.maximum.toJSON();
        }
      }
      return res;
    }
  };
  GeneralSubtree.CLASS_NAME = "GeneralSubtree";
  var PERMITTED_SUBTREES = "permittedSubtrees";
  var EXCLUDED_SUBTREES = "excludedSubtrees";
  var CLEAR_PROPS$1g = [
    PERMITTED_SUBTREES,
    EXCLUDED_SUBTREES
  ];
  var NameConstraints = class _NameConstraints extends PkiObject {
    constructor(parameters = {}) {
      super();
      if (PERMITTED_SUBTREES in parameters) {
        this.permittedSubtrees = getParametersValue(parameters, PERMITTED_SUBTREES, _NameConstraints.defaultValues(PERMITTED_SUBTREES));
      }
      if (EXCLUDED_SUBTREES in parameters) {
        this.excludedSubtrees = getParametersValue(parameters, EXCLUDED_SUBTREES, _NameConstraints.defaultValues(EXCLUDED_SUBTREES));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case PERMITTED_SUBTREES:
        case EXCLUDED_SUBTREES:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [
              new Repeated({
                name: names.permittedSubtrees || EMPTY_STRING2,
                value: GeneralSubtree.schema()
              })
            ]
          }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: [
              new Repeated({
                name: names.excludedSubtrees || EMPTY_STRING2,
                value: GeneralSubtree.schema()
              })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1g);
      const asn1 = compareSchema(schema, schema, _NameConstraints.schema({
        names: {
          permittedSubtrees: PERMITTED_SUBTREES,
          excludedSubtrees: EXCLUDED_SUBTREES
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (PERMITTED_SUBTREES in asn1.result)
        this.permittedSubtrees = Array.from(asn1.result.permittedSubtrees, (element) => new GeneralSubtree({ schema: element }));
      if (EXCLUDED_SUBTREES in asn1.result)
        this.excludedSubtrees = Array.from(asn1.result.excludedSubtrees, (element) => new GeneralSubtree({ schema: element }));
    }
    toSchema() {
      const outputArray = [];
      if (this.permittedSubtrees) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: Array.from(this.permittedSubtrees, (o) => o.toSchema())
        }));
      }
      if (this.excludedSubtrees) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          value: Array.from(this.excludedSubtrees, (o) => o.toSchema())
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const object = {};
      if (this.permittedSubtrees) {
        object.permittedSubtrees = Array.from(this.permittedSubtrees, (o) => o.toJSON());
      }
      if (this.excludedSubtrees) {
        object.excludedSubtrees = Array.from(this.excludedSubtrees, (o) => o.toJSON());
      }
      return object;
    }
  };
  NameConstraints.CLASS_NAME = "NameConstraints";
  var REQUIRE_EXPLICIT_POLICY = "requireExplicitPolicy";
  var INHIBIT_POLICY_MAPPING = "inhibitPolicyMapping";
  var CLEAR_PROPS$1f = [
    REQUIRE_EXPLICIT_POLICY,
    INHIBIT_POLICY_MAPPING
  ];
  var PolicyConstraints = class _PolicyConstraints extends PkiObject {
    constructor(parameters = {}) {
      super();
      if (REQUIRE_EXPLICIT_POLICY in parameters) {
        this.requireExplicitPolicy = getParametersValue(parameters, REQUIRE_EXPLICIT_POLICY, _PolicyConstraints.defaultValues(REQUIRE_EXPLICIT_POLICY));
      }
      if (INHIBIT_POLICY_MAPPING in parameters) {
        this.inhibitPolicyMapping = getParametersValue(parameters, INHIBIT_POLICY_MAPPING, _PolicyConstraints.defaultValues(INHIBIT_POLICY_MAPPING));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case REQUIRE_EXPLICIT_POLICY:
          return 0;
        case INHIBIT_POLICY_MAPPING:
          return 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Primitive({
            name: names.requireExplicitPolicy || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            }
          }),
          new Primitive({
            name: names.inhibitPolicyMapping || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            }
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1f);
      const asn1 = compareSchema(schema, schema, _PolicyConstraints.schema({
        names: {
          requireExplicitPolicy: REQUIRE_EXPLICIT_POLICY,
          inhibitPolicyMapping: INHIBIT_POLICY_MAPPING
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (REQUIRE_EXPLICIT_POLICY in asn1.result) {
        const field1 = asn1.result.requireExplicitPolicy;
        field1.idBlock.tagClass = 1;
        field1.idBlock.tagNumber = 2;
        const ber1 = field1.toBER(false);
        const int1 = fromBER(ber1);
        AsnError.assert(int1, "Integer");
        this.requireExplicitPolicy = int1.result.valueBlock.valueDec;
      }
      if (INHIBIT_POLICY_MAPPING in asn1.result) {
        const field2 = asn1.result.inhibitPolicyMapping;
        field2.idBlock.tagClass = 1;
        field2.idBlock.tagNumber = 2;
        const ber2 = field2.toBER(false);
        const int2 = fromBER(ber2);
        AsnError.assert(int2, "Integer");
        this.inhibitPolicyMapping = int2.result.valueBlock.valueDec;
      }
    }
    toSchema() {
      const outputArray = [];
      if (REQUIRE_EXPLICIT_POLICY in this) {
        const int1 = new Integer({ value: this.requireExplicitPolicy });
        int1.idBlock.tagClass = 3;
        int1.idBlock.tagNumber = 0;
        outputArray.push(int1);
      }
      if (INHIBIT_POLICY_MAPPING in this) {
        const int2 = new Integer({ value: this.inhibitPolicyMapping });
        int2.idBlock.tagClass = 3;
        int2.idBlock.tagNumber = 1;
        outputArray.push(int2);
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {};
      if (REQUIRE_EXPLICIT_POLICY in this) {
        res.requireExplicitPolicy = this.requireExplicitPolicy;
      }
      if (INHIBIT_POLICY_MAPPING in this) {
        res.inhibitPolicyMapping = this.inhibitPolicyMapping;
      }
      return res;
    }
  };
  PolicyConstraints.CLASS_NAME = "PolicyConstraints";
  var ISSUER_DOMAIN_POLICY = "issuerDomainPolicy";
  var SUBJECT_DOMAIN_POLICY = "subjectDomainPolicy";
  var CLEAR_PROPS$1e = [
    ISSUER_DOMAIN_POLICY,
    SUBJECT_DOMAIN_POLICY
  ];
  var PolicyMapping = class _PolicyMapping extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.issuerDomainPolicy = getParametersValue(parameters, ISSUER_DOMAIN_POLICY, _PolicyMapping.defaultValues(ISSUER_DOMAIN_POLICY));
      this.subjectDomainPolicy = getParametersValue(parameters, SUBJECT_DOMAIN_POLICY, _PolicyMapping.defaultValues(SUBJECT_DOMAIN_POLICY));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case ISSUER_DOMAIN_POLICY:
          return EMPTY_STRING2;
        case SUBJECT_DOMAIN_POLICY:
          return EMPTY_STRING2;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.issuerDomainPolicy || EMPTY_STRING2 }),
          new ObjectIdentifier({ name: names.subjectDomainPolicy || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1e);
      const asn1 = compareSchema(schema, schema, _PolicyMapping.schema({
        names: {
          issuerDomainPolicy: ISSUER_DOMAIN_POLICY,
          subjectDomainPolicy: SUBJECT_DOMAIN_POLICY
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.issuerDomainPolicy = asn1.result.issuerDomainPolicy.valueBlock.toString();
      this.subjectDomainPolicy = asn1.result.subjectDomainPolicy.valueBlock.toString();
    }
    toSchema() {
      return new Sequence({
        value: [
          new ObjectIdentifier({ value: this.issuerDomainPolicy }),
          new ObjectIdentifier({ value: this.subjectDomainPolicy })
        ]
      });
    }
    toJSON() {
      return {
        issuerDomainPolicy: this.issuerDomainPolicy,
        subjectDomainPolicy: this.subjectDomainPolicy
      };
    }
  };
  PolicyMapping.CLASS_NAME = "PolicyMapping";
  var MAPPINGS = "mappings";
  var CLEAR_PROPS$1d = [
    MAPPINGS
  ];
  var PolicyMappings = class _PolicyMappings extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.mappings = getParametersValue(parameters, MAPPINGS, _PolicyMappings.defaultValues(MAPPINGS));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case MAPPINGS:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Repeated({
            name: names.mappings || EMPTY_STRING2,
            value: PolicyMapping.schema()
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1d);
      const asn1 = compareSchema(schema, schema, _PolicyMappings.schema({
        names: {
          mappings: MAPPINGS
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.mappings = Array.from(asn1.result.mappings, (element) => new PolicyMapping({ schema: element }));
    }
    toSchema() {
      return new Sequence({
        value: Array.from(this.mappings, (o) => o.toSchema())
      });
    }
    toJSON() {
      return {
        mappings: Array.from(this.mappings, (o) => o.toJSON())
      };
    }
  };
  PolicyMappings.CLASS_NAME = "PolicyMappings";
  var NOT_BEFORE$1 = "notBefore";
  var NOT_AFTER$1 = "notAfter";
  var CLEAR_PROPS$1c = [
    NOT_BEFORE$1,
    NOT_AFTER$1
  ];
  var PrivateKeyUsagePeriod = class _PrivateKeyUsagePeriod extends PkiObject {
    constructor(parameters = {}) {
      super();
      if (NOT_BEFORE$1 in parameters) {
        this.notBefore = getParametersValue(parameters, NOT_BEFORE$1, _PrivateKeyUsagePeriod.defaultValues(NOT_BEFORE$1));
      }
      if (NOT_AFTER$1 in parameters) {
        this.notAfter = getParametersValue(parameters, NOT_AFTER$1, _PrivateKeyUsagePeriod.defaultValues(NOT_AFTER$1));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case NOT_BEFORE$1:
          return /* @__PURE__ */ new Date();
        case NOT_AFTER$1:
          return /* @__PURE__ */ new Date();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Primitive({
            name: names.notBefore || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            }
          }),
          new Primitive({
            name: names.notAfter || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            }
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1c);
      const asn1 = compareSchema(schema, schema, _PrivateKeyUsagePeriod.schema({
        names: {
          notBefore: NOT_BEFORE$1,
          notAfter: NOT_AFTER$1
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (NOT_BEFORE$1 in asn1.result) {
        const localNotBefore = new GeneralizedTime();
        localNotBefore.fromBuffer(asn1.result.notBefore.valueBlock.valueHex);
        this.notBefore = localNotBefore.toDate();
      }
      if (NOT_AFTER$1 in asn1.result) {
        const localNotAfter = new GeneralizedTime({ valueHex: asn1.result.notAfter.valueBlock.valueHex });
        localNotAfter.fromBuffer(asn1.result.notAfter.valueBlock.valueHex);
        this.notAfter = localNotAfter.toDate();
      }
    }
    toSchema() {
      const outputArray = [];
      if (NOT_BEFORE$1 in this) {
        outputArray.push(new Primitive({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          valueHex: new GeneralizedTime({ valueDate: this.notBefore }).valueBlock.valueHexView
        }));
      }
      if (NOT_AFTER$1 in this) {
        outputArray.push(new Primitive({
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          valueHex: new GeneralizedTime({ valueDate: this.notAfter }).valueBlock.valueHexView
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {};
      if (this.notBefore) {
        res.notBefore = this.notBefore;
      }
      if (this.notAfter) {
        res.notAfter = this.notAfter;
      }
      return res;
    }
  };
  PrivateKeyUsagePeriod.CLASS_NAME = "PrivateKeyUsagePeriod";
  var ID = "id";
  var TYPE$2 = "type";
  var VALUES = "values";
  var QC_STATEMENT_CLEAR_PROPS = [
    ID,
    TYPE$2
  ];
  var QC_STATEMENTS_CLEAR_PROPS = [
    VALUES
  ];
  var QCStatement = class _QCStatement extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.id = getParametersValue(parameters, ID, _QCStatement.defaultValues(ID));
      if (TYPE$2 in parameters) {
        this.type = getParametersValue(parameters, TYPE$2, _QCStatement.defaultValues(TYPE$2));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case ID:
          return EMPTY_STRING2;
        case TYPE$2:
          return new Null();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case ID:
          return memberValue === EMPTY_STRING2;
        case TYPE$2:
          return memberValue instanceof Null;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.id || EMPTY_STRING2 }),
          new Any({
            name: names.type || EMPTY_STRING2,
            optional: true
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, QC_STATEMENT_CLEAR_PROPS);
      const asn1 = compareSchema(schema, schema, _QCStatement.schema({
        names: {
          id: ID,
          type: TYPE$2
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.id = asn1.result.id.valueBlock.toString();
      if (TYPE$2 in asn1.result)
        this.type = asn1.result.type;
    }
    toSchema() {
      const value = [
        new ObjectIdentifier({ value: this.id })
      ];
      if (TYPE$2 in this)
        value.push(this.type);
      return new Sequence({
        value
      });
    }
    toJSON() {
      const object = {
        id: this.id
      };
      if (this.type) {
        object.type = this.type.toJSON();
      }
      return object;
    }
  };
  QCStatement.CLASS_NAME = "QCStatement";
  var QCStatements = class _QCStatements extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.values = getParametersValue(parameters, VALUES, _QCStatements.defaultValues(VALUES));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VALUES:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case VALUES:
          return memberValue.length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Repeated({
            name: names.values || EMPTY_STRING2,
            value: QCStatement.schema(names.value || {})
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, QC_STATEMENTS_CLEAR_PROPS);
      const asn1 = compareSchema(schema, schema, _QCStatements.schema({
        names: {
          values: VALUES
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.values = Array.from(asn1.result.values, (element) => new QCStatement({ schema: element }));
    }
    toSchema() {
      return new Sequence({
        value: Array.from(this.values, (o) => o.toSchema())
      });
    }
    toJSON() {
      return {
        values: Array.from(this.values, (o) => o.toJSON())
      };
    }
  };
  QCStatements.CLASS_NAME = "QCStatements";
  var _a2;
  var ECNamedCurves = class {
    static register(name, id, size) {
      this.namedCurves[name.toLowerCase()] = this.namedCurves[id] = { name, id, size };
    }
    static find(nameOrId) {
      return this.namedCurves[nameOrId.toLowerCase()] || null;
    }
  };
  _a2 = ECNamedCurves;
  ECNamedCurves.namedCurves = {};
  (() => {
    _a2.register("P-256", "1.2.840.10045.3.1.7", 32);
    _a2.register("P-384", "1.3.132.0.34", 48);
    _a2.register("P-521", "1.3.132.0.35", 66);
    _a2.register("brainpoolP256r1", "1.3.36.3.3.2.8.1.1.7", 32);
    _a2.register("brainpoolP384r1", "1.3.36.3.3.2.8.1.1.11", 48);
    _a2.register("brainpoolP512r1", "1.3.36.3.3.2.8.1.1.13", 64);
  })();
  var X = "x";
  var Y = "y";
  var NAMED_CURVE$1 = "namedCurve";
  var ECPublicKey = class _ECPublicKey extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.x = getParametersValue(parameters, X, _ECPublicKey.defaultValues(X));
      this.y = getParametersValue(parameters, Y, _ECPublicKey.defaultValues(Y));
      this.namedCurve = getParametersValue(parameters, NAMED_CURVE$1, _ECPublicKey.defaultValues(NAMED_CURVE$1));
      if (parameters.json) {
        this.fromJSON(parameters.json);
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case X:
        case Y:
          return EMPTY_BUFFER2;
        case NAMED_CURVE$1:
          return EMPTY_STRING2;
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case X:
        case Y:
          return memberValue instanceof ArrayBuffer && isEqualBuffer(memberValue, _ECPublicKey.defaultValues(memberName));
        case NAMED_CURVE$1:
          return typeof memberValue === "string" && memberValue === _ECPublicKey.defaultValues(memberName);
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema() {
      return new RawData();
    }
    fromSchema(schema1) {
      const view = import_pvtsutils.BufferSourceConverter.toUint8Array(schema1);
      if (view[0] !== 4) {
        throw new Error("Object's schema was not verified against input data for ECPublicKey");
      }
      const namedCurve = ECNamedCurves.find(this.namedCurve);
      if (!namedCurve) {
        throw new Error(`Incorrect curve OID: ${this.namedCurve}`);
      }
      const coordinateLength = namedCurve.size;
      if (view.byteLength !== coordinateLength * 2 + 1) {
        throw new Error("Object's schema was not verified against input data for ECPublicKey");
      }
      this.namedCurve = namedCurve.name;
      this.x = view.slice(1, coordinateLength + 1).buffer;
      this.y = view.slice(1 + coordinateLength, coordinateLength * 2 + 1).buffer;
    }
    toSchema() {
      return new RawData({
        data: utilConcatBuf(new Uint8Array([4]).buffer, this.x, this.y)
      });
    }
    toJSON() {
      const namedCurve = ECNamedCurves.find(this.namedCurve);
      return {
        crv: namedCurve ? namedCurve.name : this.namedCurve,
        x: toBase64(arrayBufferToString(this.x), true, true, false),
        y: toBase64(arrayBufferToString(this.y), true, true, false)
      };
    }
    fromJSON(json) {
      ParameterError.assert("json", json, "crv", "x", "y");
      let coordinateLength = 0;
      const namedCurve = ECNamedCurves.find(json.crv);
      if (namedCurve) {
        this.namedCurve = namedCurve.id;
        coordinateLength = namedCurve.size;
      }
      const xConvertBuffer = stringToArrayBuffer(fromBase64(json.x, true));
      if (xConvertBuffer.byteLength < coordinateLength) {
        this.x = new ArrayBuffer(coordinateLength);
        const view = new Uint8Array(this.x);
        const convertBufferView = new Uint8Array(xConvertBuffer);
        view.set(convertBufferView, 1);
      } else {
        this.x = xConvertBuffer.slice(0, coordinateLength);
      }
      const yConvertBuffer = stringToArrayBuffer(fromBase64(json.y, true));
      if (yConvertBuffer.byteLength < coordinateLength) {
        this.y = new ArrayBuffer(coordinateLength);
        const view = new Uint8Array(this.y);
        const convertBufferView = new Uint8Array(yConvertBuffer);
        view.set(convertBufferView, 1);
      } else {
        this.y = yConvertBuffer.slice(0, coordinateLength);
      }
    }
  };
  ECPublicKey.CLASS_NAME = "ECPublicKey";
  var MODULUS$1 = "modulus";
  var PUBLIC_EXPONENT$1 = "publicExponent";
  var CLEAR_PROPS$1b = [MODULUS$1, PUBLIC_EXPONENT$1];
  var RSAPublicKey = class _RSAPublicKey extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.modulus = getParametersValue(parameters, MODULUS$1, _RSAPublicKey.defaultValues(MODULUS$1));
      this.publicExponent = getParametersValue(parameters, PUBLIC_EXPONENT$1, _RSAPublicKey.defaultValues(PUBLIC_EXPONENT$1));
      if (parameters.json) {
        this.fromJSON(parameters.json);
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case MODULUS$1:
          return new Integer();
        case PUBLIC_EXPONENT$1:
          return new Integer();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Integer({ name: names.modulus || EMPTY_STRING2 }),
          new Integer({ name: names.publicExponent || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1b);
      const asn1 = compareSchema(schema, schema, _RSAPublicKey.schema({
        names: {
          modulus: MODULUS$1,
          publicExponent: PUBLIC_EXPONENT$1
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.modulus = asn1.result.modulus.convertFromDER(256);
      this.publicExponent = asn1.result.publicExponent;
    }
    toSchema() {
      return new Sequence({
        value: [
          this.modulus.convertToDER(),
          this.publicExponent
        ]
      });
    }
    toJSON() {
      return {
        n: pvtsutils2.Convert.ToBase64Url(this.modulus.valueBlock.valueHexView),
        e: pvtsutils2.Convert.ToBase64Url(this.publicExponent.valueBlock.valueHexView)
      };
    }
    fromJSON(json) {
      ParameterError.assert("json", json, "n", "e");
      const array = stringToArrayBuffer(fromBase64(json.n, true));
      this.modulus = new Integer({ valueHex: array.slice(0, Math.pow(2, nearestPowerOf2(array.byteLength))) });
      this.publicExponent = new Integer({ valueHex: stringToArrayBuffer(fromBase64(json.e, true)).slice(0, 3) });
    }
  };
  RSAPublicKey.CLASS_NAME = "RSAPublicKey";
  var ALGORITHM$1 = "algorithm";
  var SUBJECT_PUBLIC_KEY = "subjectPublicKey";
  var CLEAR_PROPS$1a = [ALGORITHM$1, SUBJECT_PUBLIC_KEY];
  var PublicKeyInfo = class _PublicKeyInfo extends PkiObject {
    get parsedKey() {
      if (this._parsedKey === void 0) {
        switch (this.algorithm.algorithmId) {
          case "1.2.840.10045.2.1":
            if ("algorithmParams" in this.algorithm) {
              if (this.algorithm.algorithmParams.constructor.blockName() === ObjectIdentifier.blockName()) {
                try {
                  this._parsedKey = new ECPublicKey({
                    namedCurve: this.algorithm.algorithmParams.valueBlock.toString(),
                    schema: this.subjectPublicKey.valueBlock.valueHexView
                  });
                } catch {
                }
              }
            }
            break;
          case "1.2.840.113549.1.1.1":
            {
              const publicKeyASN1 = fromBER(this.subjectPublicKey.valueBlock.valueHexView);
              if (publicKeyASN1.offset !== -1) {
                try {
                  this._parsedKey = new RSAPublicKey({ schema: publicKeyASN1.result });
                } catch {
                }
              }
            }
            break;
        }
        this._parsedKey || (this._parsedKey = null);
      }
      return this._parsedKey || void 0;
    }
    set parsedKey(value) {
      this._parsedKey = value;
    }
    constructor(parameters = {}) {
      super();
      this.algorithm = getParametersValue(parameters, ALGORITHM$1, _PublicKeyInfo.defaultValues(ALGORITHM$1));
      this.subjectPublicKey = getParametersValue(parameters, SUBJECT_PUBLIC_KEY, _PublicKeyInfo.defaultValues(SUBJECT_PUBLIC_KEY));
      const parsedKey = getParametersValue(parameters, "parsedKey", null);
      if (parsedKey) {
        this.parsedKey = parsedKey;
      }
      if (parameters.json) {
        this.fromJSON(parameters.json);
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case ALGORITHM$1:
          return new AlgorithmIdentifier();
        case SUBJECT_PUBLIC_KEY:
          return new BitString();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          AlgorithmIdentifier.schema(names.algorithm || {}),
          new BitString({ name: names.subjectPublicKey || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1a);
      const asn1 = compareSchema(schema, schema, _PublicKeyInfo.schema({
        names: {
          algorithm: {
            names: {
              blockName: ALGORITHM$1
            }
          },
          subjectPublicKey: SUBJECT_PUBLIC_KEY
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.algorithm = new AlgorithmIdentifier({ schema: asn1.result.algorithm });
      this.subjectPublicKey = asn1.result.subjectPublicKey;
    }
    toSchema() {
      return new Sequence({
        value: [
          this.algorithm.toSchema(),
          this.subjectPublicKey
        ]
      });
    }
    toJSON() {
      if (!this.parsedKey) {
        return {
          algorithm: this.algorithm.toJSON(),
          subjectPublicKey: this.subjectPublicKey.toJSON()
        };
      }
      const jwk = {};
      switch (this.algorithm.algorithmId) {
        case "1.2.840.10045.2.1":
          jwk.kty = "EC";
          break;
        case "1.2.840.113549.1.1.1":
          jwk.kty = "RSA";
          break;
      }
      const publicKeyJWK = this.parsedKey.toJSON();
      Object.assign(jwk, publicKeyJWK);
      return jwk;
    }
    fromJSON(json) {
      if ("kty" in json) {
        switch (json.kty.toUpperCase()) {
          case "EC":
            this.parsedKey = new ECPublicKey({ json });
            this.algorithm = new AlgorithmIdentifier({
              algorithmId: "1.2.840.10045.2.1",
              algorithmParams: new ObjectIdentifier({ value: this.parsedKey.namedCurve })
            });
            break;
          case "RSA":
            this.parsedKey = new RSAPublicKey({ json });
            this.algorithm = new AlgorithmIdentifier({
              algorithmId: "1.2.840.113549.1.1.1",
              algorithmParams: new Null()
            });
            break;
          default:
            throw new Error(`Invalid value for "kty" parameter: ${json.kty}`);
        }
        this.subjectPublicKey = new BitString({ valueHex: this.parsedKey.toSchema().toBER(false) });
      }
    }
    async importKey(publicKey, crypto2 = getCrypto(true)) {
      try {
        if (!publicKey) {
          throw new Error("Need to provide publicKey input parameter");
        }
        const exportedKey = await crypto2.exportKey("spki", publicKey);
        const asn1 = fromBER(exportedKey);
        try {
          this.fromSchema(asn1.result);
        } catch {
          throw new Error("Error during initializing object from schema");
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : `${e}`;
        throw new Error(`Error during exporting public key: ${message}`);
      }
    }
  };
  PublicKeyInfo.CLASS_NAME = "PublicKeyInfo";
  var VERSION$l = "version";
  var PRIVATE_KEY$1 = "privateKey";
  var NAMED_CURVE = "namedCurve";
  var PUBLIC_KEY$1 = "publicKey";
  var CLEAR_PROPS$19 = [
    VERSION$l,
    PRIVATE_KEY$1,
    NAMED_CURVE,
    PUBLIC_KEY$1
  ];
  var ECPrivateKey = class _ECPrivateKey extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.version = getParametersValue(parameters, VERSION$l, _ECPrivateKey.defaultValues(VERSION$l));
      this.privateKey = getParametersValue(parameters, PRIVATE_KEY$1, _ECPrivateKey.defaultValues(PRIVATE_KEY$1));
      if (NAMED_CURVE in parameters) {
        this.namedCurve = getParametersValue(parameters, NAMED_CURVE, _ECPrivateKey.defaultValues(NAMED_CURVE));
      }
      if (PUBLIC_KEY$1 in parameters) {
        this.publicKey = getParametersValue(parameters, PUBLIC_KEY$1, _ECPrivateKey.defaultValues(PUBLIC_KEY$1));
      }
      if (parameters.json) {
        this.fromJSON(parameters.json);
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VERSION$l:
          return 1;
        case PRIVATE_KEY$1:
          return new OctetString();
        case NAMED_CURVE:
          return EMPTY_STRING2;
        case PUBLIC_KEY$1:
          return new ECPublicKey();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case VERSION$l:
          return memberValue === _ECPrivateKey.defaultValues(memberName);
        case PRIVATE_KEY$1:
          return memberValue.isEqual(_ECPrivateKey.defaultValues(memberName));
        case NAMED_CURVE:
          return memberValue === EMPTY_STRING2;
        case PUBLIC_KEY$1:
          return ECPublicKey.compareWithDefault(NAMED_CURVE, memberValue.namedCurve) && ECPublicKey.compareWithDefault("x", memberValue.x) && ECPublicKey.compareWithDefault("y", memberValue.y);
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Integer({ name: names.version || EMPTY_STRING2 }),
          new OctetString({ name: names.privateKey || EMPTY_STRING2 }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [
              new ObjectIdentifier({ name: names.namedCurve || EMPTY_STRING2 })
            ]
          }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: [
              new BitString({ name: names.publicKey || EMPTY_STRING2 })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$19);
      const asn1 = compareSchema(schema, schema, _ECPrivateKey.schema({
        names: {
          version: VERSION$l,
          privateKey: PRIVATE_KEY$1,
          namedCurve: NAMED_CURVE,
          publicKey: PUBLIC_KEY$1
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.version = asn1.result.version.valueBlock.valueDec;
      this.privateKey = asn1.result.privateKey;
      if (NAMED_CURVE in asn1.result) {
        this.namedCurve = asn1.result.namedCurve.valueBlock.toString();
      }
      if (PUBLIC_KEY$1 in asn1.result) {
        const publicKeyData = { schema: asn1.result.publicKey.valueBlock.valueHex };
        if (NAMED_CURVE in this) {
          publicKeyData.namedCurve = this.namedCurve;
        }
        this.publicKey = new ECPublicKey(publicKeyData);
      }
    }
    toSchema() {
      const outputArray = [
        new Integer({ value: this.version }),
        this.privateKey
      ];
      if (this.namedCurve) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [
            new ObjectIdentifier({ value: this.namedCurve })
          ]
        }));
      }
      if (this.publicKey) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          value: [
            new BitString({ valueHex: this.publicKey.toSchema().toBER(false) })
          ]
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      if (!this.namedCurve || _ECPrivateKey.compareWithDefault(NAMED_CURVE, this.namedCurve)) {
        throw new Error('Not enough information for making JSON: absent "namedCurve" value');
      }
      const curve = ECNamedCurves.find(this.namedCurve);
      const privateKeyJSON = {
        crv: curve ? curve.name : this.namedCurve,
        d: pvtsutils2.Convert.ToBase64Url(this.privateKey.valueBlock.valueHexView)
      };
      if (this.publicKey) {
        const publicKeyJSON = this.publicKey.toJSON();
        privateKeyJSON.x = publicKeyJSON.x;
        privateKeyJSON.y = publicKeyJSON.y;
      }
      return privateKeyJSON;
    }
    fromJSON(json) {
      ParameterError.assert("json", json, "crv", "d");
      let coordinateLength = 0;
      const curve = ECNamedCurves.find(json.crv);
      if (curve) {
        this.namedCurve = curve.id;
        coordinateLength = curve.size;
      }
      const convertBuffer = pvtsutils2.Convert.FromBase64Url(json.d);
      if (convertBuffer.byteLength < coordinateLength) {
        const buffer = new ArrayBuffer(coordinateLength);
        const view = new Uint8Array(buffer);
        const convertBufferView = new Uint8Array(convertBuffer);
        view.set(convertBufferView, 1);
        this.privateKey = new OctetString({ valueHex: buffer });
      } else {
        this.privateKey = new OctetString({ valueHex: convertBuffer.slice(0, coordinateLength) });
      }
      if (json.x && json.y) {
        this.publicKey = new ECPublicKey({ json });
      }
    }
  };
  ECPrivateKey.CLASS_NAME = "ECPrivateKey";
  var PRIME = "prime";
  var EXPONENT = "exponent";
  var COEFFICIENT$1 = "coefficient";
  var CLEAR_PROPS$18 = [
    PRIME,
    EXPONENT,
    COEFFICIENT$1
  ];
  var OtherPrimeInfo = class _OtherPrimeInfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.prime = getParametersValue(parameters, PRIME, _OtherPrimeInfo.defaultValues(PRIME));
      this.exponent = getParametersValue(parameters, EXPONENT, _OtherPrimeInfo.defaultValues(EXPONENT));
      this.coefficient = getParametersValue(parameters, COEFFICIENT$1, _OtherPrimeInfo.defaultValues(COEFFICIENT$1));
      if (parameters.json) {
        this.fromJSON(parameters.json);
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case PRIME:
          return new Integer();
        case EXPONENT:
          return new Integer();
        case COEFFICIENT$1:
          return new Integer();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Integer({ name: names.prime || EMPTY_STRING2 }),
          new Integer({ name: names.exponent || EMPTY_STRING2 }),
          new Integer({ name: names.coefficient || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$18);
      const asn1 = compareSchema(schema, schema, _OtherPrimeInfo.schema({
        names: {
          prime: PRIME,
          exponent: EXPONENT,
          coefficient: COEFFICIENT$1
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.prime = asn1.result.prime.convertFromDER();
      this.exponent = asn1.result.exponent.convertFromDER();
      this.coefficient = asn1.result.coefficient.convertFromDER();
    }
    toSchema() {
      return new Sequence({
        value: [
          this.prime.convertToDER(),
          this.exponent.convertToDER(),
          this.coefficient.convertToDER()
        ]
      });
    }
    toJSON() {
      return {
        r: pvtsutils2.Convert.ToBase64Url(this.prime.valueBlock.valueHexView),
        d: pvtsutils2.Convert.ToBase64Url(this.exponent.valueBlock.valueHexView),
        t: pvtsutils2.Convert.ToBase64Url(this.coefficient.valueBlock.valueHexView)
      };
    }
    fromJSON(json) {
      ParameterError.assert("json", json, "r", "d", "r");
      this.prime = new Integer({ valueHex: pvtsutils2.Convert.FromBase64Url(json.r) });
      this.exponent = new Integer({ valueHex: pvtsutils2.Convert.FromBase64Url(json.d) });
      this.coefficient = new Integer({ valueHex: pvtsutils2.Convert.FromBase64Url(json.t) });
    }
  };
  OtherPrimeInfo.CLASS_NAME = "OtherPrimeInfo";
  var VERSION$k = "version";
  var MODULUS = "modulus";
  var PUBLIC_EXPONENT = "publicExponent";
  var PRIVATE_EXPONENT = "privateExponent";
  var PRIME1 = "prime1";
  var PRIME2 = "prime2";
  var EXPONENT1 = "exponent1";
  var EXPONENT2 = "exponent2";
  var COEFFICIENT = "coefficient";
  var OTHER_PRIME_INFOS = "otherPrimeInfos";
  var CLEAR_PROPS$17 = [
    VERSION$k,
    MODULUS,
    PUBLIC_EXPONENT,
    PRIVATE_EXPONENT,
    PRIME1,
    PRIME2,
    EXPONENT1,
    EXPONENT2,
    COEFFICIENT,
    OTHER_PRIME_INFOS
  ];
  var RSAPrivateKey = class _RSAPrivateKey extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.version = getParametersValue(parameters, VERSION$k, _RSAPrivateKey.defaultValues(VERSION$k));
      this.modulus = getParametersValue(parameters, MODULUS, _RSAPrivateKey.defaultValues(MODULUS));
      this.publicExponent = getParametersValue(parameters, PUBLIC_EXPONENT, _RSAPrivateKey.defaultValues(PUBLIC_EXPONENT));
      this.privateExponent = getParametersValue(parameters, PRIVATE_EXPONENT, _RSAPrivateKey.defaultValues(PRIVATE_EXPONENT));
      this.prime1 = getParametersValue(parameters, PRIME1, _RSAPrivateKey.defaultValues(PRIME1));
      this.prime2 = getParametersValue(parameters, PRIME2, _RSAPrivateKey.defaultValues(PRIME2));
      this.exponent1 = getParametersValue(parameters, EXPONENT1, _RSAPrivateKey.defaultValues(EXPONENT1));
      this.exponent2 = getParametersValue(parameters, EXPONENT2, _RSAPrivateKey.defaultValues(EXPONENT2));
      this.coefficient = getParametersValue(parameters, COEFFICIENT, _RSAPrivateKey.defaultValues(COEFFICIENT));
      if (OTHER_PRIME_INFOS in parameters) {
        this.otherPrimeInfos = getParametersValue(parameters, OTHER_PRIME_INFOS, _RSAPrivateKey.defaultValues(OTHER_PRIME_INFOS));
      }
      if (parameters.json) {
        this.fromJSON(parameters.json);
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VERSION$k:
          return 0;
        case MODULUS:
          return new Integer();
        case PUBLIC_EXPONENT:
          return new Integer();
        case PRIVATE_EXPONENT:
          return new Integer();
        case PRIME1:
          return new Integer();
        case PRIME2:
          return new Integer();
        case EXPONENT1:
          return new Integer();
        case EXPONENT2:
          return new Integer();
        case COEFFICIENT:
          return new Integer();
        case OTHER_PRIME_INFOS:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Integer({ name: names.version || EMPTY_STRING2 }),
          new Integer({ name: names.modulus || EMPTY_STRING2 }),
          new Integer({ name: names.publicExponent || EMPTY_STRING2 }),
          new Integer({ name: names.privateExponent || EMPTY_STRING2 }),
          new Integer({ name: names.prime1 || EMPTY_STRING2 }),
          new Integer({ name: names.prime2 || EMPTY_STRING2 }),
          new Integer({ name: names.exponent1 || EMPTY_STRING2 }),
          new Integer({ name: names.exponent2 || EMPTY_STRING2 }),
          new Integer({ name: names.coefficient || EMPTY_STRING2 }),
          new Sequence({
            optional: true,
            value: [
              new Repeated({
                name: names.otherPrimeInfosName || EMPTY_STRING2,
                value: OtherPrimeInfo.schema(names.otherPrimeInfo || {})
              })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$17);
      const asn1 = compareSchema(schema, schema, _RSAPrivateKey.schema({
        names: {
          version: VERSION$k,
          modulus: MODULUS,
          publicExponent: PUBLIC_EXPONENT,
          privateExponent: PRIVATE_EXPONENT,
          prime1: PRIME1,
          prime2: PRIME2,
          exponent1: EXPONENT1,
          exponent2: EXPONENT2,
          coefficient: COEFFICIENT,
          otherPrimeInfo: {
            names: {
              blockName: OTHER_PRIME_INFOS
            }
          }
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.version = asn1.result.version.valueBlock.valueDec;
      this.modulus = asn1.result.modulus.convertFromDER(256);
      this.publicExponent = asn1.result.publicExponent;
      this.privateExponent = asn1.result.privateExponent.convertFromDER(256);
      this.prime1 = asn1.result.prime1.convertFromDER(128);
      this.prime2 = asn1.result.prime2.convertFromDER(128);
      this.exponent1 = asn1.result.exponent1.convertFromDER(128);
      this.exponent2 = asn1.result.exponent2.convertFromDER(128);
      this.coefficient = asn1.result.coefficient.convertFromDER(128);
      if (OTHER_PRIME_INFOS in asn1.result)
        this.otherPrimeInfos = Array.from(asn1.result.otherPrimeInfos, (element) => new OtherPrimeInfo({ schema: element }));
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(new Integer({ value: this.version }));
      outputArray.push(this.modulus.convertToDER());
      outputArray.push(this.publicExponent);
      outputArray.push(this.privateExponent.convertToDER());
      outputArray.push(this.prime1.convertToDER());
      outputArray.push(this.prime2.convertToDER());
      outputArray.push(this.exponent1.convertToDER());
      outputArray.push(this.exponent2.convertToDER());
      outputArray.push(this.coefficient.convertToDER());
      if (this.otherPrimeInfos) {
        outputArray.push(new Sequence({
          value: Array.from(this.otherPrimeInfos, (o) => o.toSchema())
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const jwk = {
        n: pvtsutils2.Convert.ToBase64Url(this.modulus.valueBlock.valueHexView),
        e: pvtsutils2.Convert.ToBase64Url(this.publicExponent.valueBlock.valueHexView),
        d: pvtsutils2.Convert.ToBase64Url(this.privateExponent.valueBlock.valueHexView),
        p: pvtsutils2.Convert.ToBase64Url(this.prime1.valueBlock.valueHexView),
        q: pvtsutils2.Convert.ToBase64Url(this.prime2.valueBlock.valueHexView),
        dp: pvtsutils2.Convert.ToBase64Url(this.exponent1.valueBlock.valueHexView),
        dq: pvtsutils2.Convert.ToBase64Url(this.exponent2.valueBlock.valueHexView),
        qi: pvtsutils2.Convert.ToBase64Url(this.coefficient.valueBlock.valueHexView)
      };
      if (this.otherPrimeInfos) {
        jwk.oth = Array.from(this.otherPrimeInfos, (o) => o.toJSON());
      }
      return jwk;
    }
    fromJSON(json) {
      ParameterError.assert("json", json, "n", "e", "d", "p", "q", "dp", "dq", "qi");
      this.modulus = new Integer({ valueHex: pvtsutils2.Convert.FromBase64Url(json.n) });
      this.publicExponent = new Integer({ valueHex: pvtsutils2.Convert.FromBase64Url(json.e) });
      this.privateExponent = new Integer({ valueHex: pvtsutils2.Convert.FromBase64Url(json.d) });
      this.prime1 = new Integer({ valueHex: pvtsutils2.Convert.FromBase64Url(json.p) });
      this.prime2 = new Integer({ valueHex: pvtsutils2.Convert.FromBase64Url(json.q) });
      this.exponent1 = new Integer({ valueHex: pvtsutils2.Convert.FromBase64Url(json.dp) });
      this.exponent2 = new Integer({ valueHex: pvtsutils2.Convert.FromBase64Url(json.dq) });
      this.coefficient = new Integer({ valueHex: pvtsutils2.Convert.FromBase64Url(json.qi) });
      if (json.oth) {
        this.otherPrimeInfos = Array.from(json.oth, (element) => new OtherPrimeInfo({ json: element }));
      }
    }
  };
  RSAPrivateKey.CLASS_NAME = "RSAPrivateKey";
  var VERSION$j = "version";
  var PRIVATE_KEY_ALGORITHM = "privateKeyAlgorithm";
  var PRIVATE_KEY = "privateKey";
  var ATTRIBUTES$5 = "attributes";
  var PARSED_KEY = "parsedKey";
  var CLEAR_PROPS$16 = [
    VERSION$j,
    PRIVATE_KEY_ALGORITHM,
    PRIVATE_KEY,
    ATTRIBUTES$5
  ];
  var PrivateKeyInfo = class _PrivateKeyInfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.version = getParametersValue(parameters, VERSION$j, _PrivateKeyInfo.defaultValues(VERSION$j));
      this.privateKeyAlgorithm = getParametersValue(parameters, PRIVATE_KEY_ALGORITHM, _PrivateKeyInfo.defaultValues(PRIVATE_KEY_ALGORITHM));
      this.privateKey = getParametersValue(parameters, PRIVATE_KEY, _PrivateKeyInfo.defaultValues(PRIVATE_KEY));
      if (ATTRIBUTES$5 in parameters) {
        this.attributes = getParametersValue(parameters, ATTRIBUTES$5, _PrivateKeyInfo.defaultValues(ATTRIBUTES$5));
      }
      if (PARSED_KEY in parameters) {
        this.parsedKey = getParametersValue(parameters, PARSED_KEY, _PrivateKeyInfo.defaultValues(PARSED_KEY));
      }
      if (parameters.json) {
        this.fromJSON(parameters.json);
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VERSION$j:
          return 0;
        case PRIVATE_KEY_ALGORITHM:
          return new AlgorithmIdentifier();
        case PRIVATE_KEY:
          return new OctetString();
        case ATTRIBUTES$5:
          return [];
        case PARSED_KEY:
          return {};
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Integer({ name: names.version || EMPTY_STRING2 }),
          AlgorithmIdentifier.schema(names.privateKeyAlgorithm || {}),
          new OctetString({ name: names.privateKey || EMPTY_STRING2 }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [
              new Repeated({
                name: names.attributes || EMPTY_STRING2,
                value: Attribute.schema()
              })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$16);
      const asn1 = compareSchema(schema, schema, _PrivateKeyInfo.schema({
        names: {
          version: VERSION$j,
          privateKeyAlgorithm: {
            names: {
              blockName: PRIVATE_KEY_ALGORITHM
            }
          },
          privateKey: PRIVATE_KEY,
          attributes: ATTRIBUTES$5
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.version = asn1.result.version.valueBlock.valueDec;
      this.privateKeyAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.privateKeyAlgorithm });
      this.privateKey = asn1.result.privateKey;
      if (ATTRIBUTES$5 in asn1.result)
        this.attributes = Array.from(asn1.result.attributes, (element) => new Attribute({ schema: element }));
      switch (this.privateKeyAlgorithm.algorithmId) {
        case "1.2.840.113549.1.1.1":
          {
            const privateKeyASN1 = fromBER(this.privateKey.valueBlock.valueHexView);
            if (privateKeyASN1.offset !== -1)
              this.parsedKey = new RSAPrivateKey({ schema: privateKeyASN1.result });
          }
          break;
        case "1.2.840.10045.2.1":
          if ("algorithmParams" in this.privateKeyAlgorithm) {
            if (this.privateKeyAlgorithm.algorithmParams instanceof ObjectIdentifier) {
              const privateKeyASN1 = fromBER(this.privateKey.valueBlock.valueHexView);
              if (privateKeyASN1.offset !== -1) {
                this.parsedKey = new ECPrivateKey({
                  namedCurve: this.privateKeyAlgorithm.algorithmParams.valueBlock.toString(),
                  schema: privateKeyASN1.result
                });
              }
            }
          }
          break;
      }
    }
    toSchema() {
      const outputArray = [
        new Integer({ value: this.version }),
        this.privateKeyAlgorithm.toSchema(),
        this.privateKey
      ];
      if (this.attributes) {
        outputArray.push(new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: Array.from(this.attributes, (o) => o.toSchema())
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      if (!this.parsedKey) {
        const object = {
          version: this.version,
          privateKeyAlgorithm: this.privateKeyAlgorithm.toJSON(),
          privateKey: this.privateKey.toJSON()
        };
        if (this.attributes) {
          object.attributes = Array.from(this.attributes, (o) => o.toJSON());
        }
        return object;
      }
      const jwk = {};
      switch (this.privateKeyAlgorithm.algorithmId) {
        case "1.2.840.10045.2.1":
          jwk.kty = "EC";
          break;
        case "1.2.840.113549.1.1.1":
          jwk.kty = "RSA";
          break;
      }
      const publicKeyJWK = this.parsedKey.toJSON();
      Object.assign(jwk, publicKeyJWK);
      return jwk;
    }
    fromJSON(json) {
      if ("kty" in json) {
        switch (json.kty.toUpperCase()) {
          case "EC":
            this.parsedKey = new ECPrivateKey({ json });
            this.privateKeyAlgorithm = new AlgorithmIdentifier({
              algorithmId: "1.2.840.10045.2.1",
              algorithmParams: new ObjectIdentifier({ value: this.parsedKey.namedCurve })
            });
            break;
          case "RSA":
            this.parsedKey = new RSAPrivateKey({ json });
            this.privateKeyAlgorithm = new AlgorithmIdentifier({
              algorithmId: "1.2.840.113549.1.1.1",
              algorithmParams: new Null()
            });
            break;
          default:
            throw new Error(`Invalid value for "kty" parameter: ${json.kty}`);
        }
        this.privateKey = new OctetString({ valueHex: this.parsedKey.toSchema().toBER(false) });
      }
    }
  };
  PrivateKeyInfo.CLASS_NAME = "PrivateKeyInfo";
  var CONTENT_TYPE$1 = "contentType";
  var CONTENT_ENCRYPTION_ALGORITHM = "contentEncryptionAlgorithm";
  var ENCRYPTED_CONTENT = "encryptedContent";
  var CLEAR_PROPS$15 = [
    CONTENT_TYPE$1,
    CONTENT_ENCRYPTION_ALGORITHM,
    ENCRYPTED_CONTENT
  ];
  var PIECE_SIZE = 1024;
  var EncryptedContentInfo = class _EncryptedContentInfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.contentType = getParametersValue(parameters, CONTENT_TYPE$1, _EncryptedContentInfo.defaultValues(CONTENT_TYPE$1));
      this.contentEncryptionAlgorithm = getParametersValue(parameters, CONTENT_ENCRYPTION_ALGORITHM, _EncryptedContentInfo.defaultValues(CONTENT_ENCRYPTION_ALGORITHM));
      if (ENCRYPTED_CONTENT in parameters && parameters.encryptedContent) {
        this.encryptedContent = parameters.encryptedContent;
        if (this.encryptedContent.idBlock.tagClass === 1 && this.encryptedContent.idBlock.tagNumber === 4) {
          if (this.encryptedContent.idBlock.isConstructed === false && !parameters.disableSplit) {
            const constrString = new OctetString({
              idBlock: { isConstructed: true },
              isConstructed: true
            });
            let offset = 0;
            const valueHex = this.encryptedContent.valueBlock.valueHexView.slice().buffer;
            let length = valueHex.byteLength;
            while (length > 0) {
              const pieceView = new Uint8Array(valueHex, offset, offset + PIECE_SIZE > valueHex.byteLength ? valueHex.byteLength - offset : PIECE_SIZE);
              const _array = new ArrayBuffer(pieceView.length);
              const _view = new Uint8Array(_array);
              for (let i = 0; i < _view.length; i++)
                _view[i] = pieceView[i];
              constrString.valueBlock.value.push(new OctetString({ valueHex: _array }));
              length -= pieceView.length;
              offset += pieceView.length;
            }
            this.encryptedContent = constrString;
          }
        }
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case CONTENT_TYPE$1:
          return EMPTY_STRING2;
        case CONTENT_ENCRYPTION_ALGORITHM:
          return new AlgorithmIdentifier();
        case ENCRYPTED_CONTENT:
          return new OctetString();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case CONTENT_TYPE$1:
          return memberValue === EMPTY_STRING2;
        case CONTENT_ENCRYPTION_ALGORITHM:
          return memberValue.algorithmId === EMPTY_STRING2 && "algorithmParams" in memberValue === false;
        case ENCRYPTED_CONTENT:
          return memberValue.isEqual(_EncryptedContentInfo.defaultValues(ENCRYPTED_CONTENT));
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.contentType || EMPTY_STRING2 }),
          AlgorithmIdentifier.schema(names.contentEncryptionAlgorithm || {}),
          new Choice({
            value: [
              new Constructed({
                name: names.encryptedContent || EMPTY_STRING2,
                idBlock: {
                  tagClass: 3,
                  tagNumber: 0
                },
                value: [
                  new Repeated({
                    value: new OctetString()
                  })
                ]
              }),
              new Primitive({
                name: names.encryptedContent || EMPTY_STRING2,
                idBlock: {
                  tagClass: 3,
                  tagNumber: 0
                }
              })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$15);
      const asn1 = compareSchema(schema, schema, _EncryptedContentInfo.schema({
        names: {
          contentType: CONTENT_TYPE$1,
          contentEncryptionAlgorithm: {
            names: {
              blockName: CONTENT_ENCRYPTION_ALGORITHM
            }
          },
          encryptedContent: ENCRYPTED_CONTENT
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.contentType = asn1.result.contentType.valueBlock.toString();
      this.contentEncryptionAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.contentEncryptionAlgorithm });
      if (ENCRYPTED_CONTENT in asn1.result) {
        this.encryptedContent = asn1.result.encryptedContent;
        this.encryptedContent.idBlock.tagClass = 1;
        this.encryptedContent.idBlock.tagNumber = 4;
      }
    }
    toSchema() {
      const sequenceLengthBlock = {
        isIndefiniteForm: false
      };
      const outputArray = [];
      outputArray.push(new ObjectIdentifier({ value: this.contentType }));
      outputArray.push(this.contentEncryptionAlgorithm.toSchema());
      if (this.encryptedContent) {
        sequenceLengthBlock.isIndefiniteForm = this.encryptedContent.idBlock.isConstructed;
        const encryptedValue = this.encryptedContent;
        encryptedValue.idBlock.tagClass = 3;
        encryptedValue.idBlock.tagNumber = 0;
        encryptedValue.lenBlock.isIndefiniteForm = this.encryptedContent.idBlock.isConstructed;
        outputArray.push(encryptedValue);
      }
      return new Sequence({
        lenBlock: sequenceLengthBlock,
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        contentType: this.contentType,
        contentEncryptionAlgorithm: this.contentEncryptionAlgorithm.toJSON()
      };
      if (this.encryptedContent) {
        res.encryptedContent = this.encryptedContent.toJSON();
      }
      return res;
    }
    getEncryptedContent() {
      if (!this.encryptedContent) {
        throw new Error("Parameter 'encryptedContent' is undefined");
      }
      return OctetString.prototype.getValue.call(this.encryptedContent);
    }
  };
  EncryptedContentInfo.CLASS_NAME = "EncryptedContentInfo";
  var HASH_ALGORITHM$4 = "hashAlgorithm";
  var MASK_GEN_ALGORITHM$1 = "maskGenAlgorithm";
  var SALT_LENGTH = "saltLength";
  var TRAILER_FIELD = "trailerField";
  var CLEAR_PROPS$14 = [
    HASH_ALGORITHM$4,
    MASK_GEN_ALGORITHM$1,
    SALT_LENGTH,
    TRAILER_FIELD
  ];
  var RSASSAPSSParams = class _RSASSAPSSParams extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.hashAlgorithm = getParametersValue(parameters, HASH_ALGORITHM$4, _RSASSAPSSParams.defaultValues(HASH_ALGORITHM$4));
      this.maskGenAlgorithm = getParametersValue(parameters, MASK_GEN_ALGORITHM$1, _RSASSAPSSParams.defaultValues(MASK_GEN_ALGORITHM$1));
      this.saltLength = getParametersValue(parameters, SALT_LENGTH, _RSASSAPSSParams.defaultValues(SALT_LENGTH));
      this.trailerField = getParametersValue(parameters, TRAILER_FIELD, _RSASSAPSSParams.defaultValues(TRAILER_FIELD));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case HASH_ALGORITHM$4:
          return new AlgorithmIdentifier({
            algorithmId: "1.3.14.3.2.26",
            algorithmParams: new Null()
          });
        case MASK_GEN_ALGORITHM$1:
          return new AlgorithmIdentifier({
            algorithmId: "1.2.840.113549.1.1.8",
            algorithmParams: new AlgorithmIdentifier({
              algorithmId: "1.3.14.3.2.26",
              algorithmParams: new Null()
            }).toSchema()
          });
        case SALT_LENGTH:
          return 20;
        case TRAILER_FIELD:
          return 1;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            optional: true,
            value: [AlgorithmIdentifier.schema(names.hashAlgorithm || {})]
          }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            optional: true,
            value: [AlgorithmIdentifier.schema(names.maskGenAlgorithm || {})]
          }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 2
            },
            optional: true,
            value: [new Integer({ name: names.saltLength || EMPTY_STRING2 })]
          }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 3
            },
            optional: true,
            value: [new Integer({ name: names.trailerField || EMPTY_STRING2 })]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$14);
      const asn1 = compareSchema(schema, schema, _RSASSAPSSParams.schema({
        names: {
          hashAlgorithm: {
            names: {
              blockName: HASH_ALGORITHM$4
            }
          },
          maskGenAlgorithm: {
            names: {
              blockName: MASK_GEN_ALGORITHM$1
            }
          },
          saltLength: SALT_LENGTH,
          trailerField: TRAILER_FIELD
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (HASH_ALGORITHM$4 in asn1.result)
        this.hashAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.hashAlgorithm });
      if (MASK_GEN_ALGORITHM$1 in asn1.result)
        this.maskGenAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.maskGenAlgorithm });
      if (SALT_LENGTH in asn1.result)
        this.saltLength = asn1.result.saltLength.valueBlock.valueDec;
      if (TRAILER_FIELD in asn1.result)
        this.trailerField = asn1.result.trailerField.valueBlock.valueDec;
    }
    toSchema() {
      const outputArray = [];
      if (!this.hashAlgorithm.isEqual(_RSASSAPSSParams.defaultValues(HASH_ALGORITHM$4))) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [this.hashAlgorithm.toSchema()]
        }));
      }
      if (!this.maskGenAlgorithm.isEqual(_RSASSAPSSParams.defaultValues(MASK_GEN_ALGORITHM$1))) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          value: [this.maskGenAlgorithm.toSchema()]
        }));
      }
      if (this.saltLength !== _RSASSAPSSParams.defaultValues(SALT_LENGTH)) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 2
          },
          value: [new Integer({ value: this.saltLength })]
        }));
      }
      if (this.trailerField !== _RSASSAPSSParams.defaultValues(TRAILER_FIELD)) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 3
          },
          value: [new Integer({ value: this.trailerField })]
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {};
      if (!this.hashAlgorithm.isEqual(_RSASSAPSSParams.defaultValues(HASH_ALGORITHM$4))) {
        res.hashAlgorithm = this.hashAlgorithm.toJSON();
      }
      if (!this.maskGenAlgorithm.isEqual(_RSASSAPSSParams.defaultValues(MASK_GEN_ALGORITHM$1))) {
        res.maskGenAlgorithm = this.maskGenAlgorithm.toJSON();
      }
      if (this.saltLength !== _RSASSAPSSParams.defaultValues(SALT_LENGTH)) {
        res.saltLength = this.saltLength;
      }
      if (this.trailerField !== _RSASSAPSSParams.defaultValues(TRAILER_FIELD)) {
        res.trailerField = this.trailerField;
      }
      return res;
    }
  };
  RSASSAPSSParams.CLASS_NAME = "RSASSAPSSParams";
  var SALT = "salt";
  var ITERATION_COUNT = "iterationCount";
  var KEY_LENGTH = "keyLength";
  var PRF = "prf";
  var CLEAR_PROPS$13 = [
    SALT,
    ITERATION_COUNT,
    KEY_LENGTH,
    PRF
  ];
  var PBKDF2Params = class _PBKDF2Params extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.salt = getParametersValue(parameters, SALT, _PBKDF2Params.defaultValues(SALT));
      this.iterationCount = getParametersValue(parameters, ITERATION_COUNT, _PBKDF2Params.defaultValues(ITERATION_COUNT));
      if (KEY_LENGTH in parameters) {
        this.keyLength = getParametersValue(parameters, KEY_LENGTH, _PBKDF2Params.defaultValues(KEY_LENGTH));
      }
      if (PRF in parameters) {
        this.prf = getParametersValue(parameters, PRF, _PBKDF2Params.defaultValues(PRF));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case SALT:
          return {};
        case ITERATION_COUNT:
          return -1;
        case KEY_LENGTH:
          return 0;
        case PRF:
          return new AlgorithmIdentifier({
            algorithmId: "1.3.14.3.2.26",
            algorithmParams: new Null()
          });
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Choice({
            value: [
              new OctetString({ name: names.saltPrimitive || EMPTY_STRING2 }),
              AlgorithmIdentifier.schema(names.saltConstructed || {})
            ]
          }),
          new Integer({ name: names.iterationCount || EMPTY_STRING2 }),
          new Integer({
            name: names.keyLength || EMPTY_STRING2,
            optional: true
          }),
          AlgorithmIdentifier.schema(names.prf || {
            names: {
              optional: true
            }
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$13);
      const asn1 = compareSchema(schema, schema, _PBKDF2Params.schema({
        names: {
          saltPrimitive: SALT,
          saltConstructed: {
            names: {
              blockName: SALT
            }
          },
          iterationCount: ITERATION_COUNT,
          keyLength: KEY_LENGTH,
          prf: {
            names: {
              blockName: PRF,
              optional: true
            }
          }
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.salt = asn1.result.salt;
      this.iterationCount = asn1.result.iterationCount.valueBlock.valueDec;
      if (KEY_LENGTH in asn1.result)
        this.keyLength = asn1.result.keyLength.valueBlock.valueDec;
      if (PRF in asn1.result)
        this.prf = new AlgorithmIdentifier({ schema: asn1.result.prf });
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(this.salt);
      outputArray.push(new Integer({ value: this.iterationCount }));
      if (KEY_LENGTH in this) {
        if (_PBKDF2Params.defaultValues(KEY_LENGTH) !== this.keyLength)
          outputArray.push(new Integer({ value: this.keyLength }));
      }
      if (this.prf) {
        if (_PBKDF2Params.defaultValues(PRF).isEqual(this.prf) === false)
          outputArray.push(this.prf.toSchema());
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        salt: this.salt.toJSON(),
        iterationCount: this.iterationCount
      };
      if (KEY_LENGTH in this) {
        if (_PBKDF2Params.defaultValues(KEY_LENGTH) !== this.keyLength)
          res.keyLength = this.keyLength;
      }
      if (this.prf) {
        if (_PBKDF2Params.defaultValues(PRF).isEqual(this.prf) === false)
          res.prf = this.prf.toJSON();
      }
      return res;
    }
  };
  PBKDF2Params.CLASS_NAME = "PBKDF2Params";
  var KEY_DERIVATION_FUNC = "keyDerivationFunc";
  var ENCRYPTION_SCHEME = "encryptionScheme";
  var CLEAR_PROPS$12 = [
    KEY_DERIVATION_FUNC,
    ENCRYPTION_SCHEME
  ];
  var PBES2Params = class _PBES2Params extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.keyDerivationFunc = getParametersValue(parameters, KEY_DERIVATION_FUNC, _PBES2Params.defaultValues(KEY_DERIVATION_FUNC));
      this.encryptionScheme = getParametersValue(parameters, ENCRYPTION_SCHEME, _PBES2Params.defaultValues(ENCRYPTION_SCHEME));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case KEY_DERIVATION_FUNC:
          return new AlgorithmIdentifier();
        case ENCRYPTION_SCHEME:
          return new AlgorithmIdentifier();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          AlgorithmIdentifier.schema(names.keyDerivationFunc || {}),
          AlgorithmIdentifier.schema(names.encryptionScheme || {})
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$12);
      const asn1 = compareSchema(schema, schema, _PBES2Params.schema({
        names: {
          keyDerivationFunc: {
            names: {
              blockName: KEY_DERIVATION_FUNC
            }
          },
          encryptionScheme: {
            names: {
              blockName: ENCRYPTION_SCHEME
            }
          }
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.keyDerivationFunc = new AlgorithmIdentifier({ schema: asn1.result.keyDerivationFunc });
      this.encryptionScheme = new AlgorithmIdentifier({ schema: asn1.result.encryptionScheme });
    }
    toSchema() {
      return new Sequence({
        value: [
          this.keyDerivationFunc.toSchema(),
          this.encryptionScheme.toSchema()
        ]
      });
    }
    toJSON() {
      return {
        keyDerivationFunc: this.keyDerivationFunc.toJSON(),
        encryptionScheme: this.encryptionScheme.toJSON()
      };
    }
  };
  PBES2Params.CLASS_NAME = "PBES2Params";
  var AbstractCryptoEngine = class {
    constructor(parameters) {
      this.crypto = parameters.crypto;
      this.subtle = "webkitSubtle" in parameters.crypto ? parameters.crypto.webkitSubtle : parameters.crypto.subtle;
      this.name = getParametersValue(parameters, "name", EMPTY_STRING2);
    }
    async encrypt(...args) {
      return this.subtle.encrypt(...args);
    }
    async decrypt(...args) {
      return this.subtle.decrypt(...args);
    }
    sign(...args) {
      return this.subtle.sign(...args);
    }
    async verify(...args) {
      return this.subtle.verify(...args);
    }
    async digest(...args) {
      return this.subtle.digest(...args);
    }
    async generateKey(...args) {
      return this.subtle.generateKey(...args);
    }
    async deriveKey(...args) {
      return this.subtle.deriveKey(...args);
    }
    async deriveBits(...args) {
      return this.subtle.deriveBits(...args);
    }
    async wrapKey(...args) {
      return this.subtle.wrapKey(...args);
    }
    async unwrapKey(...args) {
      return this.subtle.unwrapKey(...args);
    }
    exportKey(...args) {
      return this.subtle.exportKey(...args);
    }
    importKey(...args) {
      return this.subtle.importKey(...args);
    }
    getRandomValues(array) {
      if (array === null) {
        throw new Error('Argument "array" must not be null');
      }
      return this.crypto.getRandomValues(array);
    }
  };
  async function makePKCS12B2Key(hashAlgorithm, keyLength, password, salt, iterationCount) {
    let u;
    let v;
    let md;
    switch (hashAlgorithm.toUpperCase()) {
      case "SHA-1":
        u = 20;
        v = 64;
        md = sha1;
        break;
      case "SHA-256":
        u = 32;
        v = 64;
        md = sha256;
        break;
      case "SHA-384":
        u = 48;
        v = 128;
        md = sha384;
        break;
      case "SHA-512":
        u = 64;
        v = 128;
        md = sha512;
        break;
      default:
        throw new Error("Unsupported hashing algorithm");
    }
    const originalPassword = new Uint8Array(password);
    let decodedPassword = new TextDecoder().decode(password);
    const encodedPassword = new TextEncoder().encode(decodedPassword);
    if (encodedPassword.some((byte, i) => byte !== originalPassword[i])) {
      decodedPassword = String.fromCharCode(...originalPassword);
    }
    const passwordTransformed = new Uint8Array(decodedPassword.length * 2 + 2);
    const passwordView = new DataView(passwordTransformed.buffer);
    for (let i = 0; i < decodedPassword.length; i++) {
      passwordView.setUint16(i * 2, decodedPassword.charCodeAt(i), false);
    }
    passwordView.setUint16(decodedPassword.length * 2, 0, false);
    const D = new Uint8Array(v).fill(3);
    const saltView = new Uint8Array(salt);
    const S = new Uint8Array(v * Math.ceil(saltView.length / v)).map((_, i) => saltView[i % saltView.length]);
    const P = new Uint8Array(v * Math.ceil(passwordTransformed.length / v)).map((_, i) => passwordTransformed[i % passwordTransformed.length]);
    let I = new Uint8Array(S.length + P.length);
    I.set(S);
    I.set(P, S.length);
    const c = Math.ceil((keyLength >> 3) / u);
    const result = [];
    for (let i = 0; i < c; i++) {
      let A = new Uint8Array(D.length + I.length);
      A.set(D);
      A.set(I, D.length);
      for (let j = 0; j < iterationCount; j++) {
        A = md(A);
      }
      const B = new Uint8Array(v).map((_, i2) => A[i2 % A.length]);
      const k = Math.ceil(saltView.length / v) + Math.ceil(passwordTransformed.length / v);
      const iRound = [];
      for (let j = 0; j < k; j++) {
        const chunk = Array.from(I.slice(j * v, (j + 1) * v));
        let x = 511;
        for (let l = B.length - 1; l >= 0; l--) {
          x >>= 8;
          x += B[l] + (chunk[l] || 0);
          chunk[l] = x & 255;
        }
        iRound.push(...chunk);
      }
      I = new Uint8Array(iRound);
      result.push(...A);
    }
    return new Uint8Array(result.slice(0, keyLength >> 3)).buffer;
  }
  function prepareAlgorithm(data) {
    const res = typeof data === "string" ? { name: data } : data;
    if ("hash" in res) {
      return {
        ...res,
        hash: prepareAlgorithm(res.hash)
      };
    }
    return res;
  }
  var CryptoEngine = class extends AbstractCryptoEngine {
    async importKey(format, keyData, algorithm, extractable, keyUsages) {
      var _a3, _b, _c, _d, _e, _f;
      let jwk = {};
      const alg = prepareAlgorithm(algorithm);
      switch (format.toLowerCase()) {
        case "raw":
          return this.subtle.importKey("raw", keyData, algorithm, extractable, keyUsages);
        case "spki":
          {
            const asn1 = fromBER(pvtsutils2.BufferSourceConverter.toArrayBuffer(keyData));
            AsnError.assert(asn1, "keyData");
            const publicKeyInfo = new PublicKeyInfo();
            try {
              publicKeyInfo.fromSchema(asn1.result);
            } catch {
              throw new ArgumentError("Incorrect keyData");
            }
            switch (alg.name.toUpperCase()) {
              case "RSA-PSS": {
                if (!alg.hash) {
                  throw new ParameterError("hash", "algorithm.hash", "Incorrect hash algorithm: Hash algorithm is missed");
                }
                switch (alg.hash.name.toUpperCase()) {
                  case "SHA-1":
                    jwk.alg = "PS1";
                    break;
                  case "SHA-256":
                    jwk.alg = "PS256";
                    break;
                  case "SHA-384":
                    jwk.alg = "PS384";
                    break;
                  case "SHA-512":
                    jwk.alg = "PS512";
                    break;
                  default:
                    throw new Error(`Incorrect hash algorithm: ${alg.hash.name.toUpperCase()}`);
                }
              }
              case "RSASSA-PKCS1-V1_5":
                {
                  keyUsages = ["verify"];
                  jwk.kty = "RSA";
                  jwk.ext = extractable;
                  jwk.key_ops = keyUsages;
                  if (publicKeyInfo.algorithm.algorithmId !== "1.2.840.113549.1.1.1")
                    throw new Error(`Incorrect public key algorithm: ${publicKeyInfo.algorithm.algorithmId}`);
                  if (!jwk.alg) {
                    if (!alg.hash) {
                      throw new ParameterError("hash", "algorithm.hash", "Incorrect hash algorithm: Hash algorithm is missed");
                    }
                    switch (alg.hash.name.toUpperCase()) {
                      case "SHA-1":
                        jwk.alg = "RS1";
                        break;
                      case "SHA-256":
                        jwk.alg = "RS256";
                        break;
                      case "SHA-384":
                        jwk.alg = "RS384";
                        break;
                      case "SHA-512":
                        jwk.alg = "RS512";
                        break;
                      default:
                        throw new Error(`Incorrect hash algorithm: ${alg.hash.name.toUpperCase()}`);
                    }
                  }
                  const publicKeyJSON = publicKeyInfo.toJSON();
                  Object.assign(jwk, publicKeyJSON);
                }
                break;
              case "ECDSA":
                keyUsages = ["verify"];
              case "ECDH":
                {
                  jwk = {
                    kty: "EC",
                    ext: extractable,
                    key_ops: keyUsages
                  };
                  if (publicKeyInfo.algorithm.algorithmId !== "1.2.840.10045.2.1") {
                    throw new Error(`Incorrect public key algorithm: ${publicKeyInfo.algorithm.algorithmId}`);
                  }
                  const publicKeyJSON = publicKeyInfo.toJSON();
                  Object.assign(jwk, publicKeyJSON);
                }
                break;
              case "RSA-OAEP":
                {
                  jwk.kty = "RSA";
                  jwk.ext = extractable;
                  jwk.key_ops = keyUsages;
                  if (this.name.toLowerCase() === "safari")
                    jwk.alg = "RSA-OAEP";
                  else {
                    if (!alg.hash) {
                      throw new ParameterError("hash", "algorithm.hash", "Incorrect hash algorithm: Hash algorithm is missed");
                    }
                    switch (alg.hash.name.toUpperCase()) {
                      case "SHA-1":
                        jwk.alg = "RSA-OAEP";
                        break;
                      case "SHA-256":
                        jwk.alg = "RSA-OAEP-256";
                        break;
                      case "SHA-384":
                        jwk.alg = "RSA-OAEP-384";
                        break;
                      case "SHA-512":
                        jwk.alg = "RSA-OAEP-512";
                        break;
                      default:
                        throw new Error(`Incorrect hash algorithm: ${alg.hash.name.toUpperCase()}`);
                    }
                  }
                  const publicKeyJSON = publicKeyInfo.toJSON();
                  Object.assign(jwk, publicKeyJSON);
                }
                break;
              case "RSAES-PKCS1-V1_5":
                {
                  jwk.kty = "RSA";
                  jwk.ext = extractable;
                  jwk.key_ops = keyUsages;
                  jwk.alg = "PS1";
                  const publicKeyJSON = publicKeyInfo.toJSON();
                  Object.assign(jwk, publicKeyJSON);
                }
                break;
              default:
                throw new Error(`Incorrect algorithm name: ${alg.name.toUpperCase()}`);
            }
          }
          break;
        case "pkcs8":
          {
            const privateKeyInfo = new PrivateKeyInfo();
            const asn1 = fromBER(pvtsutils2.BufferSourceConverter.toArrayBuffer(keyData));
            AsnError.assert(asn1, "keyData");
            try {
              privateKeyInfo.fromSchema(asn1.result);
            } catch {
              throw new Error("Incorrect keyData");
            }
            if (!privateKeyInfo.parsedKey)
              throw new Error("Incorrect keyData");
            switch (alg.name.toUpperCase()) {
              case "RSA-PSS": {
                switch ((_a3 = alg.hash) === null || _a3 === void 0 ? void 0 : _a3.name.toUpperCase()) {
                  case "SHA-1":
                    jwk.alg = "PS1";
                    break;
                  case "SHA-256":
                    jwk.alg = "PS256";
                    break;
                  case "SHA-384":
                    jwk.alg = "PS384";
                    break;
                  case "SHA-512":
                    jwk.alg = "PS512";
                    break;
                  default:
                    throw new Error(`Incorrect hash algorithm: ${(_b = alg.hash) === null || _b === void 0 ? void 0 : _b.name.toUpperCase()}`);
                }
              }
              case "RSASSA-PKCS1-V1_5":
                {
                  keyUsages = ["sign"];
                  jwk.kty = "RSA";
                  jwk.ext = extractable;
                  jwk.key_ops = keyUsages;
                  if (privateKeyInfo.privateKeyAlgorithm.algorithmId !== "1.2.840.113549.1.1.1")
                    throw new Error(`Incorrect private key algorithm: ${privateKeyInfo.privateKeyAlgorithm.algorithmId}`);
                  if ("alg" in jwk === false) {
                    switch ((_c = alg.hash) === null || _c === void 0 ? void 0 : _c.name.toUpperCase()) {
                      case "SHA-1":
                        jwk.alg = "RS1";
                        break;
                      case "SHA-256":
                        jwk.alg = "RS256";
                        break;
                      case "SHA-384":
                        jwk.alg = "RS384";
                        break;
                      case "SHA-512":
                        jwk.alg = "RS512";
                        break;
                      default:
                        throw new Error(`Incorrect hash algorithm: ${(_d = alg.hash) === null || _d === void 0 ? void 0 : _d.name.toUpperCase()}`);
                    }
                  }
                  const privateKeyJSON = privateKeyInfo.toJSON();
                  Object.assign(jwk, privateKeyJSON);
                }
                break;
              case "ECDSA":
                keyUsages = ["sign"];
              case "ECDH":
                {
                  jwk = {
                    kty: "EC",
                    ext: extractable,
                    key_ops: keyUsages
                  };
                  if (privateKeyInfo.privateKeyAlgorithm.algorithmId !== "1.2.840.10045.2.1")
                    throw new Error(`Incorrect algorithm: ${privateKeyInfo.privateKeyAlgorithm.algorithmId}`);
                  const privateKeyJSON = privateKeyInfo.toJSON();
                  Object.assign(jwk, privateKeyJSON);
                }
                break;
              case "RSA-OAEP":
                {
                  jwk.kty = "RSA";
                  jwk.ext = extractable;
                  jwk.key_ops = keyUsages;
                  if (this.name.toLowerCase() === "safari")
                    jwk.alg = "RSA-OAEP";
                  else {
                    switch ((_e = alg.hash) === null || _e === void 0 ? void 0 : _e.name.toUpperCase()) {
                      case "SHA-1":
                        jwk.alg = "RSA-OAEP";
                        break;
                      case "SHA-256":
                        jwk.alg = "RSA-OAEP-256";
                        break;
                      case "SHA-384":
                        jwk.alg = "RSA-OAEP-384";
                        break;
                      case "SHA-512":
                        jwk.alg = "RSA-OAEP-512";
                        break;
                      default:
                        throw new Error(`Incorrect hash algorithm: ${(_f = alg.hash) === null || _f === void 0 ? void 0 : _f.name.toUpperCase()}`);
                    }
                  }
                  const privateKeyJSON = privateKeyInfo.toJSON();
                  Object.assign(jwk, privateKeyJSON);
                }
                break;
              case "RSAES-PKCS1-V1_5":
                {
                  keyUsages = ["decrypt"];
                  jwk.kty = "RSA";
                  jwk.ext = extractable;
                  jwk.key_ops = keyUsages;
                  jwk.alg = "PS1";
                  const privateKeyJSON = privateKeyInfo.toJSON();
                  Object.assign(jwk, privateKeyJSON);
                }
                break;
              default:
                throw new Error(`Incorrect algorithm name: ${alg.name.toUpperCase()}`);
            }
          }
          break;
        case "jwk":
          jwk = keyData;
          break;
        default:
          throw new Error(`Incorrect format: ${format}`);
      }
      if (this.name.toLowerCase() === "safari") {
        try {
          return this.subtle.importKey("jwk", stringToArrayBuffer(JSON.stringify(jwk)), algorithm, extractable, keyUsages);
        } catch {
          return this.subtle.importKey("jwk", jwk, algorithm, extractable, keyUsages);
        }
      }
      return this.subtle.importKey("jwk", jwk, algorithm, extractable, keyUsages);
    }
    async exportKey(format, key) {
      let jwk = await this.subtle.exportKey("jwk", key);
      if (this.name.toLowerCase() === "safari") {
        if (jwk instanceof ArrayBuffer) {
          jwk = JSON.parse(arrayBufferToString(jwk));
        }
      }
      switch (format.toLowerCase()) {
        case "raw":
          return this.subtle.exportKey("raw", key);
        case "spki": {
          const publicKeyInfo = new PublicKeyInfo();
          try {
            publicKeyInfo.fromJSON(jwk);
          } catch {
            throw new Error("Incorrect key data");
          }
          return publicKeyInfo.toSchema().toBER(false);
        }
        case "pkcs8": {
          const privateKeyInfo = new PrivateKeyInfo();
          try {
            privateKeyInfo.fromJSON(jwk);
          } catch {
            throw new Error("Incorrect key data");
          }
          return privateKeyInfo.toSchema().toBER(false);
        }
        case "jwk":
          return jwk;
        default:
          throw new Error(`Incorrect format: ${format}`);
      }
    }
    async convert(inputFormat, outputFormat, keyData, algorithm, extractable, keyUsages) {
      if (inputFormat.toLowerCase() === outputFormat.toLowerCase()) {
        return keyData;
      }
      const key = await this.importKey(inputFormat, keyData, algorithm, extractable, keyUsages);
      return this.exportKey(outputFormat, key);
    }
    getAlgorithmByOID(oid, safety = false, target) {
      switch (oid) {
        case "1.2.840.113549.1.1.1":
          return {
            name: "RSAES-PKCS1-v1_5"
          };
        case "1.2.840.113549.1.1.5":
          return {
            name: "RSASSA-PKCS1-v1_5",
            hash: {
              name: "SHA-1"
            }
          };
        case "1.2.840.113549.1.1.11":
          return {
            name: "RSASSA-PKCS1-v1_5",
            hash: {
              name: "SHA-256"
            }
          };
        case "1.2.840.113549.1.1.12":
          return {
            name: "RSASSA-PKCS1-v1_5",
            hash: {
              name: "SHA-384"
            }
          };
        case "1.2.840.113549.1.1.13":
          return {
            name: "RSASSA-PKCS1-v1_5",
            hash: {
              name: "SHA-512"
            }
          };
        case "1.2.840.113549.1.1.10":
          return {
            name: "RSA-PSS"
          };
        case "1.2.840.113549.1.1.7":
          return {
            name: "RSA-OAEP"
          };
        case "1.2.840.10045.2.1":
        case "1.2.840.10045.4.1":
          return {
            name: "ECDSA",
            hash: {
              name: "SHA-1"
            }
          };
        case "1.2.840.10045.4.3.2":
          return {
            name: "ECDSA",
            hash: {
              name: "SHA-256"
            }
          };
        case "1.2.840.10045.4.3.3":
          return {
            name: "ECDSA",
            hash: {
              name: "SHA-384"
            }
          };
        case "1.2.840.10045.4.3.4":
          return {
            name: "ECDSA",
            hash: {
              name: "SHA-512"
            }
          };
        case "1.3.133.16.840.63.0.2":
          return {
            name: "ECDH",
            kdf: "SHA-1"
          };
        case "1.3.132.1.11.1":
          return {
            name: "ECDH",
            kdf: "SHA-256"
          };
        case "1.3.132.1.11.2":
          return {
            name: "ECDH",
            kdf: "SHA-384"
          };
        case "1.3.132.1.11.3":
          return {
            name: "ECDH",
            kdf: "SHA-512"
          };
        case "2.16.840.1.101.3.4.1.2":
          return {
            name: "AES-CBC",
            length: 128
          };
        case "2.16.840.1.101.3.4.1.22":
          return {
            name: "AES-CBC",
            length: 192
          };
        case "2.16.840.1.101.3.4.1.42":
          return {
            name: "AES-CBC",
            length: 256
          };
        case "2.16.840.1.101.3.4.1.6":
          return {
            name: "AES-GCM",
            length: 128
          };
        case "2.16.840.1.101.3.4.1.26":
          return {
            name: "AES-GCM",
            length: 192
          };
        case "2.16.840.1.101.3.4.1.46":
          return {
            name: "AES-GCM",
            length: 256
          };
        case "2.16.840.1.101.3.4.1.4":
          return {
            name: "AES-CFB",
            length: 128
          };
        case "2.16.840.1.101.3.4.1.24":
          return {
            name: "AES-CFB",
            length: 192
          };
        case "2.16.840.1.101.3.4.1.44":
          return {
            name: "AES-CFB",
            length: 256
          };
        case "2.16.840.1.101.3.4.1.5":
          return {
            name: "AES-KW",
            length: 128
          };
        case "2.16.840.1.101.3.4.1.25":
          return {
            name: "AES-KW",
            length: 192
          };
        case "2.16.840.1.101.3.4.1.45":
          return {
            name: "AES-KW",
            length: 256
          };
        case "1.2.840.113549.2.7":
          return {
            name: "HMAC",
            hash: {
              name: "SHA-1"
            }
          };
        case "1.2.840.113549.2.9":
          return {
            name: "HMAC",
            hash: {
              name: "SHA-256"
            }
          };
        case "1.2.840.113549.2.10":
          return {
            name: "HMAC",
            hash: {
              name: "SHA-384"
            }
          };
        case "1.2.840.113549.2.11":
          return {
            name: "HMAC",
            hash: {
              name: "SHA-512"
            }
          };
        case "1.2.840.113549.1.9.16.3.5":
          return {
            name: "DH"
          };
        case "1.3.14.3.2.26":
          return {
            name: "SHA-1"
          };
        case "2.16.840.1.101.3.4.2.1":
          return {
            name: "SHA-256"
          };
        case "2.16.840.1.101.3.4.2.2":
          return {
            name: "SHA-384"
          };
        case "2.16.840.1.101.3.4.2.3":
          return {
            name: "SHA-512"
          };
        case "1.2.840.113549.1.5.12":
          return {
            name: "PBKDF2"
          };
        case "1.2.840.10045.3.1.7":
          return {
            name: "P-256"
          };
        case "1.3.132.0.34":
          return {
            name: "P-384"
          };
        case "1.3.132.0.35":
          return {
            name: "P-521"
          };
      }
      if (safety) {
        throw new Error(`Unsupported algorithm identifier ${target ? `for ${target} ` : EMPTY_STRING2}: ${oid}`);
      }
      return {};
    }
    getOIDByAlgorithm(algorithm, safety = false, target) {
      let result = EMPTY_STRING2;
      switch (algorithm.name.toUpperCase()) {
        case "RSAES-PKCS1-V1_5":
          result = "1.2.840.113549.1.1.1";
          break;
        case "RSASSA-PKCS1-V1_5":
          switch (algorithm.hash.name.toUpperCase()) {
            case "SHA-1":
              result = "1.2.840.113549.1.1.5";
              break;
            case "SHA-256":
              result = "1.2.840.113549.1.1.11";
              break;
            case "SHA-384":
              result = "1.2.840.113549.1.1.12";
              break;
            case "SHA-512":
              result = "1.2.840.113549.1.1.13";
              break;
          }
          break;
        case "RSA-PSS":
          result = "1.2.840.113549.1.1.10";
          break;
        case "RSA-OAEP":
          result = "1.2.840.113549.1.1.7";
          break;
        case "ECDSA":
          switch (algorithm.hash.name.toUpperCase()) {
            case "SHA-1":
              result = "1.2.840.10045.4.1";
              break;
            case "SHA-256":
              result = "1.2.840.10045.4.3.2";
              break;
            case "SHA-384":
              result = "1.2.840.10045.4.3.3";
              break;
            case "SHA-512":
              result = "1.2.840.10045.4.3.4";
              break;
          }
          break;
        case "ECDH":
          switch (algorithm.kdf.toUpperCase()) {
            case "SHA-1":
              result = "1.3.133.16.840.63.0.2";
              break;
            case "SHA-256":
              result = "1.3.132.1.11.1";
              break;
            case "SHA-384":
              result = "1.3.132.1.11.2";
              break;
            case "SHA-512":
              result = "1.3.132.1.11.3";
              break;
          }
          break;
        case "AES-CTR":
          break;
        case "AES-CBC":
          switch (algorithm.length) {
            case 128:
              result = "2.16.840.1.101.3.4.1.2";
              break;
            case 192:
              result = "2.16.840.1.101.3.4.1.22";
              break;
            case 256:
              result = "2.16.840.1.101.3.4.1.42";
              break;
          }
          break;
        case "AES-CMAC":
          break;
        case "AES-GCM":
          switch (algorithm.length) {
            case 128:
              result = "2.16.840.1.101.3.4.1.6";
              break;
            case 192:
              result = "2.16.840.1.101.3.4.1.26";
              break;
            case 256:
              result = "2.16.840.1.101.3.4.1.46";
              break;
          }
          break;
        case "AES-CFB":
          switch (algorithm.length) {
            case 128:
              result = "2.16.840.1.101.3.4.1.4";
              break;
            case 192:
              result = "2.16.840.1.101.3.4.1.24";
              break;
            case 256:
              result = "2.16.840.1.101.3.4.1.44";
              break;
          }
          break;
        case "AES-KW":
          switch (algorithm.length) {
            case 128:
              result = "2.16.840.1.101.3.4.1.5";
              break;
            case 192:
              result = "2.16.840.1.101.3.4.1.25";
              break;
            case 256:
              result = "2.16.840.1.101.3.4.1.45";
              break;
          }
          break;
        case "HMAC":
          switch (algorithm.hash.name.toUpperCase()) {
            case "SHA-1":
              result = "1.2.840.113549.2.7";
              break;
            case "SHA-256":
              result = "1.2.840.113549.2.9";
              break;
            case "SHA-384":
              result = "1.2.840.113549.2.10";
              break;
            case "SHA-512":
              result = "1.2.840.113549.2.11";
              break;
          }
          break;
        case "DH":
          result = "1.2.840.113549.1.9.16.3.5";
          break;
        case "SHA-1":
          result = "1.3.14.3.2.26";
          break;
        case "SHA-256":
          result = "2.16.840.1.101.3.4.2.1";
          break;
        case "SHA-384":
          result = "2.16.840.1.101.3.4.2.2";
          break;
        case "SHA-512":
          result = "2.16.840.1.101.3.4.2.3";
          break;
        case "CONCAT":
          break;
        case "HKDF":
          break;
        case "PBKDF2":
          result = "1.2.840.113549.1.5.12";
          break;
        case "P-256":
          result = "1.2.840.10045.3.1.7";
          break;
        case "P-384":
          result = "1.3.132.0.34";
          break;
        case "P-521":
          result = "1.3.132.0.35";
          break;
      }
      if (!result && safety) {
        throw new Error(`Unsupported algorithm ${target ? `for ${target} ` : EMPTY_STRING2}: ${algorithm.name}`);
      }
      return result;
    }
    getAlgorithmParameters(algorithmName, operation) {
      let result = {
        algorithm: {},
        usages: []
      };
      switch (algorithmName.toUpperCase()) {
        case "RSAES-PKCS1-V1_5":
        case "RSASSA-PKCS1-V1_5":
          switch (operation.toLowerCase()) {
            case "generatekey":
              result = {
                algorithm: {
                  name: "RSASSA-PKCS1-v1_5",
                  modulusLength: 2048,
                  publicExponent: new Uint8Array([1, 0, 1]),
                  hash: {
                    name: "SHA-256"
                  }
                },
                usages: ["sign", "verify"]
              };
              break;
            case "verify":
            case "sign":
            case "importkey":
              result = {
                algorithm: {
                  name: "RSASSA-PKCS1-v1_5",
                  hash: {
                    name: "SHA-256"
                  }
                },
                usages: ["verify"]
              };
              break;
            case "exportkey":
            default:
              return {
                algorithm: {
                  name: "RSASSA-PKCS1-v1_5"
                },
                usages: []
              };
          }
          break;
        case "RSA-PSS":
          switch (operation.toLowerCase()) {
            case "sign":
            case "verify":
              result = {
                algorithm: {
                  name: "RSA-PSS",
                  hash: {
                    name: "SHA-1"
                  },
                  saltLength: 20
                },
                usages: ["sign", "verify"]
              };
              break;
            case "generatekey":
              result = {
                algorithm: {
                  name: "RSA-PSS",
                  modulusLength: 2048,
                  publicExponent: new Uint8Array([1, 0, 1]),
                  hash: {
                    name: "SHA-1"
                  }
                },
                usages: ["sign", "verify"]
              };
              break;
            case "importkey":
              result = {
                algorithm: {
                  name: "RSA-PSS",
                  hash: {
                    name: "SHA-1"
                  }
                },
                usages: ["verify"]
              };
              break;
            case "exportkey":
            default:
              return {
                algorithm: {
                  name: "RSA-PSS"
                },
                usages: []
              };
          }
          break;
        case "RSA-OAEP":
          switch (operation.toLowerCase()) {
            case "encrypt":
            case "decrypt":
              result = {
                algorithm: {
                  name: "RSA-OAEP"
                },
                usages: ["encrypt", "decrypt"]
              };
              break;
            case "generatekey":
              result = {
                algorithm: {
                  name: "RSA-OAEP",
                  modulusLength: 2048,
                  publicExponent: new Uint8Array([1, 0, 1]),
                  hash: {
                    name: "SHA-256"
                  }
                },
                usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
              };
              break;
            case "importkey":
              result = {
                algorithm: {
                  name: "RSA-OAEP",
                  hash: {
                    name: "SHA-256"
                  }
                },
                usages: ["encrypt"]
              };
              break;
            case "exportkey":
            default:
              return {
                algorithm: {
                  name: "RSA-OAEP"
                },
                usages: []
              };
          }
          break;
        case "ECDSA":
          switch (operation.toLowerCase()) {
            case "generatekey":
              result = {
                algorithm: {
                  name: "ECDSA",
                  namedCurve: "P-256"
                },
                usages: ["sign", "verify"]
              };
              break;
            case "importkey":
              result = {
                algorithm: {
                  name: "ECDSA",
                  namedCurve: "P-256"
                },
                usages: ["verify"]
              };
              break;
            case "verify":
            case "sign":
              result = {
                algorithm: {
                  name: "ECDSA",
                  hash: {
                    name: "SHA-256"
                  }
                },
                usages: ["sign"]
              };
              break;
            default:
              return {
                algorithm: {
                  name: "ECDSA"
                },
                usages: []
              };
          }
          break;
        case "ECDH":
          switch (operation.toLowerCase()) {
            case "exportkey":
            case "importkey":
            case "generatekey":
              result = {
                algorithm: {
                  name: "ECDH",
                  namedCurve: "P-256"
                },
                usages: ["deriveKey", "deriveBits"]
              };
              break;
            case "derivekey":
            case "derivebits":
              result = {
                algorithm: {
                  name: "ECDH",
                  namedCurve: "P-256",
                  public: []
                },
                usages: ["encrypt", "decrypt"]
              };
              break;
            default:
              return {
                algorithm: {
                  name: "ECDH"
                },
                usages: []
              };
          }
          break;
        case "AES-CTR":
          switch (operation.toLowerCase()) {
            case "importkey":
            case "exportkey":
            case "generatekey":
              result = {
                algorithm: {
                  name: "AES-CTR",
                  length: 256
                },
                usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
              };
              break;
            case "decrypt":
            case "encrypt":
              result = {
                algorithm: {
                  name: "AES-CTR",
                  counter: new Uint8Array(16),
                  length: 10
                },
                usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
              };
              break;
            default:
              return {
                algorithm: {
                  name: "AES-CTR"
                },
                usages: []
              };
          }
          break;
        case "AES-CBC":
          switch (operation.toLowerCase()) {
            case "importkey":
            case "exportkey":
            case "generatekey":
              result = {
                algorithm: {
                  name: "AES-CBC",
                  length: 256
                },
                usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
              };
              break;
            case "decrypt":
            case "encrypt":
              result = {
                algorithm: {
                  name: "AES-CBC",
                  iv: this.getRandomValues(new Uint8Array(16))
                },
                usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
              };
              break;
            default:
              return {
                algorithm: {
                  name: "AES-CBC"
                },
                usages: []
              };
          }
          break;
        case "AES-GCM":
          switch (operation.toLowerCase()) {
            case "importkey":
            case "exportkey":
            case "generatekey":
              result = {
                algorithm: {
                  name: "AES-GCM",
                  length: 256
                },
                usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
              };
              break;
            case "decrypt":
            case "encrypt":
              result = {
                algorithm: {
                  name: "AES-GCM",
                  iv: this.getRandomValues(new Uint8Array(16))
                },
                usages: ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
              };
              break;
            default:
              return {
                algorithm: {
                  name: "AES-GCM"
                },
                usages: []
              };
          }
          break;
        case "AES-KW":
          switch (operation.toLowerCase()) {
            case "importkey":
            case "exportkey":
            case "generatekey":
            case "wrapkey":
            case "unwrapkey":
              result = {
                algorithm: {
                  name: "AES-KW",
                  length: 256
                },
                usages: ["wrapKey", "unwrapKey"]
              };
              break;
            default:
              return {
                algorithm: {
                  name: "AES-KW"
                },
                usages: []
              };
          }
          break;
        case "HMAC":
          switch (operation.toLowerCase()) {
            case "sign":
            case "verify":
              result = {
                algorithm: {
                  name: "HMAC"
                },
                usages: ["sign", "verify"]
              };
              break;
            case "importkey":
            case "exportkey":
            case "generatekey":
              result = {
                algorithm: {
                  name: "HMAC",
                  length: 32,
                  hash: {
                    name: "SHA-256"
                  }
                },
                usages: ["sign", "verify"]
              };
              break;
            default:
              return {
                algorithm: {
                  name: "HMAC"
                },
                usages: []
              };
          }
          break;
        case "HKDF":
          switch (operation.toLowerCase()) {
            case "derivekey":
              result = {
                algorithm: {
                  name: "HKDF",
                  hash: "SHA-256",
                  salt: new Uint8Array([]),
                  info: new Uint8Array([])
                },
                usages: ["encrypt", "decrypt"]
              };
              break;
            default:
              return {
                algorithm: {
                  name: "HKDF"
                },
                usages: []
              };
          }
          break;
        case "PBKDF2":
          switch (operation.toLowerCase()) {
            case "derivekey":
              result = {
                algorithm: {
                  name: "PBKDF2",
                  hash: { name: "SHA-256" },
                  salt: new Uint8Array([]),
                  iterations: 1e4
                },
                usages: ["encrypt", "decrypt"]
              };
              break;
            default:
              return {
                algorithm: {
                  name: "PBKDF2"
                },
                usages: []
              };
          }
          break;
      }
      return result;
    }
    getHashAlgorithm(signatureAlgorithm) {
      let result = EMPTY_STRING2;
      switch (signatureAlgorithm.algorithmId) {
        case "1.2.840.10045.4.1":
        case "1.2.840.113549.1.1.5":
          result = "SHA-1";
          break;
        case "1.2.840.10045.4.3.2":
        case "1.2.840.113549.1.1.11":
          result = "SHA-256";
          break;
        case "1.2.840.10045.4.3.3":
        case "1.2.840.113549.1.1.12":
          result = "SHA-384";
          break;
        case "1.2.840.10045.4.3.4":
        case "1.2.840.113549.1.1.13":
          result = "SHA-512";
          break;
        case "1.2.840.113549.1.1.10":
          {
            try {
              const params = new RSASSAPSSParams({ schema: signatureAlgorithm.algorithmParams });
              if (params.hashAlgorithm) {
                const algorithm = this.getAlgorithmByOID(params.hashAlgorithm.algorithmId);
                if ("name" in algorithm) {
                  result = algorithm.name;
                } else {
                  return EMPTY_STRING2;
                }
              } else
                result = "SHA-1";
            } catch {
            }
          }
          break;
      }
      return result;
    }
    async encryptEncryptedContentInfo(parameters) {
      ParameterError.assert(parameters, "password", "contentEncryptionAlgorithm", "hmacHashAlgorithm", "iterationCount", "contentToEncrypt", "contentToEncrypt", "contentType");
      const contentEncryptionOID = this.getOIDByAlgorithm(parameters.contentEncryptionAlgorithm, true, "contentEncryptionAlgorithm");
      const pbkdf2OID = this.getOIDByAlgorithm({
        name: "PBKDF2"
      }, true, "PBKDF2");
      const hmacOID = this.getOIDByAlgorithm({
        name: "HMAC",
        hash: {
          name: parameters.hmacHashAlgorithm
        }
      }, true, "hmacHashAlgorithm");
      const ivBuffer = new ArrayBuffer(16);
      const ivView = new Uint8Array(ivBuffer);
      this.getRandomValues(ivView);
      const saltBuffer = new ArrayBuffer(64);
      const saltView = new Uint8Array(saltBuffer);
      this.getRandomValues(saltView);
      const contentView = new Uint8Array(parameters.contentToEncrypt);
      const pbkdf2Params = new PBKDF2Params({
        salt: new OctetString({ valueHex: saltBuffer }),
        iterationCount: parameters.iterationCount,
        prf: new AlgorithmIdentifier({
          algorithmId: hmacOID,
          algorithmParams: new Null()
        })
      });
      const passwordView = new Uint8Array(parameters.password);
      const pbkdfKey = await this.importKey("raw", passwordView, "PBKDF2", false, ["deriveKey"]);
      const derivedKey = await this.deriveKey({
        name: "PBKDF2",
        hash: {
          name: parameters.hmacHashAlgorithm
        },
        salt: saltView,
        iterations: parameters.iterationCount
      }, pbkdfKey, parameters.contentEncryptionAlgorithm, false, ["encrypt"]);
      const encryptedData = await this.encrypt({
        name: parameters.contentEncryptionAlgorithm.name,
        iv: ivView
      }, derivedKey, contentView);
      const pbes2Parameters = new PBES2Params({
        keyDerivationFunc: new AlgorithmIdentifier({
          algorithmId: pbkdf2OID,
          algorithmParams: pbkdf2Params.toSchema()
        }),
        encryptionScheme: new AlgorithmIdentifier({
          algorithmId: contentEncryptionOID,
          algorithmParams: new OctetString({ valueHex: ivBuffer })
        })
      });
      return new EncryptedContentInfo({
        contentType: parameters.contentType,
        contentEncryptionAlgorithm: new AlgorithmIdentifier({
          algorithmId: "1.2.840.113549.1.5.13",
          algorithmParams: pbes2Parameters.toSchema()
        }),
        encryptedContent: new OctetString({ valueHex: encryptedData })
      });
    }
    async decryptEncryptedContentInfo(parameters) {
      ParameterError.assert(parameters, "password", "encryptedContentInfo");
      if (parameters.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId !== "1.2.840.113549.1.5.13")
        throw new Error(`Unknown "contentEncryptionAlgorithm": ${parameters.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId}`);
      let pbes2Parameters;
      try {
        pbes2Parameters = new PBES2Params({ schema: parameters.encryptedContentInfo.contentEncryptionAlgorithm.algorithmParams });
      } catch {
        throw new Error('Incorrectly encoded "pbes2Parameters"');
      }
      let pbkdf2Params;
      try {
        pbkdf2Params = new PBKDF2Params({ schema: pbes2Parameters.keyDerivationFunc.algorithmParams });
      } catch {
        throw new Error('Incorrectly encoded "pbkdf2Params"');
      }
      const contentEncryptionAlgorithm = this.getAlgorithmByOID(pbes2Parameters.encryptionScheme.algorithmId, true);
      const ivBuffer = pbes2Parameters.encryptionScheme.algorithmParams.valueBlock.valueHex;
      const ivView = new Uint8Array(ivBuffer);
      const saltBuffer = pbkdf2Params.salt.valueBlock.valueHex;
      const saltView = new Uint8Array(saltBuffer);
      const iterationCount = pbkdf2Params.iterationCount;
      let hmacHashAlgorithm = "SHA-1";
      if (pbkdf2Params.prf) {
        const algorithm = this.getAlgorithmByOID(pbkdf2Params.prf.algorithmId, true);
        hmacHashAlgorithm = algorithm.hash.name;
      }
      const pbkdfKey = await this.importKey("raw", parameters.password, "PBKDF2", false, ["deriveKey"]);
      const result = await this.deriveKey({
        name: "PBKDF2",
        hash: {
          name: hmacHashAlgorithm
        },
        salt: saltView,
        iterations: iterationCount
      }, pbkdfKey, contentEncryptionAlgorithm, false, ["decrypt"]);
      const dataBuffer = parameters.encryptedContentInfo.getEncryptedContent();
      return this.decrypt({
        name: contentEncryptionAlgorithm.name,
        iv: ivView
      }, result, dataBuffer);
    }
    async stampDataWithPassword(parameters) {
      if (parameters instanceof Object === false)
        throw new Error('Parameters must have type "Object"');
      ParameterError.assert(parameters, "password", "hashAlgorithm", "iterationCount", "salt", "contentToStamp");
      let length;
      switch (parameters.hashAlgorithm.toLowerCase()) {
        case "sha-1":
          length = 160;
          break;
        case "sha-256":
          length = 256;
          break;
        case "sha-384":
          length = 384;
          break;
        case "sha-512":
          length = 512;
          break;
        default:
          throw new Error(`Incorrect "parameters.hashAlgorithm" parameter: ${parameters.hashAlgorithm}`);
      }
      const hmacAlgorithm = {
        name: "HMAC",
        length,
        hash: {
          name: parameters.hashAlgorithm
        }
      };
      const pkcsKey = await makePKCS12B2Key(parameters.hashAlgorithm, length, parameters.password, parameters.salt, parameters.iterationCount);
      const hmacKey = await this.importKey("raw", new Uint8Array(pkcsKey), hmacAlgorithm, false, ["sign"]);
      return this.sign(hmacAlgorithm, hmacKey, new Uint8Array(parameters.contentToStamp));
    }
    async verifyDataStampedWithPassword(parameters) {
      ParameterError.assert(parameters, "password", "hashAlgorithm", "salt", "iterationCount", "contentToVerify", "signatureToVerify");
      let length = 0;
      switch (parameters.hashAlgorithm.toLowerCase()) {
        case "sha-1":
          length = 160;
          break;
        case "sha-256":
          length = 256;
          break;
        case "sha-384":
          length = 384;
          break;
        case "sha-512":
          length = 512;
          break;
        default:
          throw new Error(`Incorrect "parameters.hashAlgorithm" parameter: ${parameters.hashAlgorithm}`);
      }
      const hmacAlgorithm = {
        name: "HMAC",
        length,
        hash: {
          name: parameters.hashAlgorithm
        }
      };
      const pkcsKey = await makePKCS12B2Key(parameters.hashAlgorithm, length, parameters.password, parameters.salt, parameters.iterationCount);
      const hmacKey = await this.importKey("raw", new Uint8Array(pkcsKey), hmacAlgorithm, false, ["verify"]);
      return this.verify(hmacAlgorithm, hmacKey, new Uint8Array(parameters.signatureToVerify), new Uint8Array(parameters.contentToVerify));
    }
    async getSignatureParameters(privateKey, hashAlgorithm = "SHA-1") {
      this.getOIDByAlgorithm({ name: hashAlgorithm }, true, "hashAlgorithm");
      const signatureAlgorithm = new AlgorithmIdentifier();
      const parameters = this.getAlgorithmParameters(privateKey.algorithm.name, "sign");
      if (!Object.keys(parameters.algorithm).length) {
        throw new Error("Parameter 'algorithm' is empty");
      }
      const algorithm = parameters.algorithm;
      if ("hash" in privateKey.algorithm && privateKey.algorithm.hash && privateKey.algorithm.hash.name) {
        algorithm.hash.name = privateKey.algorithm.hash.name;
      } else {
        algorithm.hash.name = hashAlgorithm;
      }
      switch (privateKey.algorithm.name.toUpperCase()) {
        case "RSASSA-PKCS1-V1_5":
        case "ECDSA":
          signatureAlgorithm.algorithmId = this.getOIDByAlgorithm(algorithm, true);
          break;
        case "RSA-PSS":
          {
            switch (algorithm.hash.name.toUpperCase()) {
              case "SHA-256":
                algorithm.saltLength = 32;
                break;
              case "SHA-384":
                algorithm.saltLength = 48;
                break;
              case "SHA-512":
                algorithm.saltLength = 64;
                break;
            }
            const paramsObject = {};
            if (algorithm.hash.name.toUpperCase() !== "SHA-1") {
              const hashAlgorithmOID = this.getOIDByAlgorithm({ name: algorithm.hash.name }, true, "hashAlgorithm");
              paramsObject.hashAlgorithm = new AlgorithmIdentifier({
                algorithmId: hashAlgorithmOID,
                algorithmParams: new Null()
              });
              paramsObject.maskGenAlgorithm = new AlgorithmIdentifier({
                algorithmId: "1.2.840.113549.1.1.8",
                algorithmParams: paramsObject.hashAlgorithm.toSchema()
              });
            }
            if (algorithm.saltLength !== 20)
              paramsObject.saltLength = algorithm.saltLength;
            const pssParameters = new RSASSAPSSParams(paramsObject);
            signatureAlgorithm.algorithmId = "1.2.840.113549.1.1.10";
            signatureAlgorithm.algorithmParams = pssParameters.toSchema();
          }
          break;
        default:
          throw new Error(`Unsupported signature algorithm: ${privateKey.algorithm.name}`);
      }
      return {
        signatureAlgorithm,
        parameters
      };
    }
    async signWithPrivateKey(data, privateKey, parameters) {
      const signature = await this.sign(parameters.algorithm, privateKey, data);
      if (parameters.algorithm.name === "ECDSA") {
        return createCMSECDSASignature(signature);
      }
      return signature;
    }
    fillPublicKeyParameters(publicKeyInfo, signatureAlgorithm) {
      const parameters = {};
      const shaAlgorithm = this.getHashAlgorithm(signatureAlgorithm);
      if (shaAlgorithm === EMPTY_STRING2)
        throw new Error(`Unsupported signature algorithm: ${signatureAlgorithm.algorithmId}`);
      let algorithmId;
      if (signatureAlgorithm.algorithmId === "1.2.840.113549.1.1.10")
        algorithmId = signatureAlgorithm.algorithmId;
      else
        algorithmId = publicKeyInfo.algorithm.algorithmId;
      const algorithmObject = this.getAlgorithmByOID(algorithmId, true);
      parameters.algorithm = this.getAlgorithmParameters(algorithmObject.name, "importKey");
      if ("hash" in parameters.algorithm.algorithm)
        parameters.algorithm.algorithm.hash.name = shaAlgorithm;
      if (algorithmObject.name === "ECDSA") {
        const publicKeyAlgorithm = publicKeyInfo.algorithm;
        if (!publicKeyAlgorithm.algorithmParams) {
          throw new Error("Algorithm parameters for ECDSA public key are missed");
        }
        const publicKeyAlgorithmParams = publicKeyAlgorithm.algorithmParams;
        if ("idBlock" in publicKeyAlgorithm.algorithmParams) {
          if (!(publicKeyAlgorithmParams.idBlock.tagClass === 1 && publicKeyAlgorithmParams.idBlock.tagNumber === 6)) {
            throw new Error("Incorrect type for ECDSA public key parameters");
          }
        }
        const curveObject = this.getAlgorithmByOID(publicKeyAlgorithmParams.valueBlock.toString(), true);
        parameters.algorithm.algorithm.namedCurve = curveObject.name;
      }
      return parameters;
    }
    async getPublicKey(publicKeyInfo, signatureAlgorithm, parameters) {
      if (!parameters) {
        parameters = this.fillPublicKeyParameters(publicKeyInfo, signatureAlgorithm);
      }
      const publicKeyInfoBuffer = publicKeyInfo.toSchema().toBER(false);
      return this.importKey("spki", publicKeyInfoBuffer, parameters.algorithm.algorithm, true, parameters.algorithm.usages);
    }
    async verifyWithPublicKey(data, signature, publicKeyInfo, signatureAlgorithm, shaAlgorithm) {
      let publicKey;
      if (!shaAlgorithm) {
        shaAlgorithm = this.getHashAlgorithm(signatureAlgorithm);
        if (!shaAlgorithm)
          throw new Error(`Unsupported signature algorithm: ${signatureAlgorithm.algorithmId}`);
        publicKey = await this.getPublicKey(publicKeyInfo, signatureAlgorithm);
      } else {
        const parameters = {};
        let algorithmId;
        if (signatureAlgorithm.algorithmId === "1.2.840.113549.1.1.10")
          algorithmId = signatureAlgorithm.algorithmId;
        else
          algorithmId = publicKeyInfo.algorithm.algorithmId;
        const algorithmObject = this.getAlgorithmByOID(algorithmId, true);
        parameters.algorithm = this.getAlgorithmParameters(algorithmObject.name, "importKey");
        if ("hash" in parameters.algorithm.algorithm)
          parameters.algorithm.algorithm.hash.name = shaAlgorithm;
        if (algorithmObject.name === "ECDSA") {
          let algorithmParamsChecked = false;
          if ("algorithmParams" in publicKeyInfo.algorithm === true) {
            if ("idBlock" in publicKeyInfo.algorithm.algorithmParams) {
              if (publicKeyInfo.algorithm.algorithmParams.idBlock.tagClass === 1 && publicKeyInfo.algorithm.algorithmParams.idBlock.tagNumber === 6)
                algorithmParamsChecked = true;
            }
          }
          if (algorithmParamsChecked === false) {
            throw new Error("Incorrect type for ECDSA public key parameters");
          }
          const curveObject = this.getAlgorithmByOID(publicKeyInfo.algorithm.algorithmParams.valueBlock.toString(), true);
          parameters.algorithm.algorithm.namedCurve = curveObject.name;
        }
        publicKey = await this.getPublicKey(publicKeyInfo, null, parameters);
      }
      const algorithm = this.getAlgorithmParameters(publicKey.algorithm.name, "verify");
      if ("hash" in algorithm.algorithm)
        algorithm.algorithm.hash.name = shaAlgorithm;
      let signatureValue = signature.valueBlock.valueHexView;
      if (publicKey.algorithm.name === "ECDSA") {
        const namedCurve = ECNamedCurves.find(publicKey.algorithm.namedCurve);
        if (!namedCurve) {
          throw new Error("Unsupported named curve in use");
        }
        const asn1 = fromBER(signatureValue);
        AsnError.assert(asn1, "Signature value");
        signatureValue = createECDSASignatureFromCMS(asn1.result, namedCurve.size);
      }
      if (publicKey.algorithm.name === "RSA-PSS") {
        const pssParameters = new RSASSAPSSParams({ schema: signatureAlgorithm.algorithmParams });
        if ("saltLength" in pssParameters)
          algorithm.algorithm.saltLength = pssParameters.saltLength;
        else
          algorithm.algorithm.saltLength = 20;
        let hashAlgo = "SHA-1";
        if ("hashAlgorithm" in pssParameters) {
          const hashAlgorithm = this.getAlgorithmByOID(pssParameters.hashAlgorithm.algorithmId, true);
          hashAlgo = hashAlgorithm.name;
        }
        algorithm.algorithm.hash.name = hashAlgo;
      }
      return this.verify(algorithm.algorithm, publicKey, signatureValue, data);
    }
  };
  var engine = {
    name: "none",
    crypto: null
  };
  function isCryptoEngine(engine2) {
    return engine2 && typeof engine2 === "object" && "crypto" in engine2 ? true : false;
  }
  function setEngine(name, ...args) {
    let crypto2 = null;
    if (args.length < 2) {
      if (args.length) {
        crypto2 = args[0];
      } else {
        crypto2 = typeof self !== "undefined" && self.crypto ? new CryptoEngine({ name: "browser", crypto: self.crypto }) : null;
      }
    } else {
      const cryptoArg = args[0];
      const subtleArg = args[1];
      if (isCryptoEngine(subtleArg)) {
        crypto2 = subtleArg;
      } else if (isCryptoEngine(cryptoArg)) {
        crypto2 = cryptoArg;
      } else if ("subtle" in cryptoArg && "getRandomValues" in cryptoArg) {
        crypto2 = new CryptoEngine({
          crypto: cryptoArg
        });
      }
    }
    if (typeof process !== "undefined" && "pid" in process && typeof global !== "undefined" && typeof window === "undefined") {
      if (typeof global[process.pid] === "undefined") {
        global[process.pid] = {};
      } else {
        if (typeof global[process.pid] !== "object") {
          throw new Error(`Name global.${process.pid} already exists and it is not an object`);
        }
      }
      if (typeof global[process.pid].pkijs === "undefined") {
        global[process.pid].pkijs = {};
      } else {
        if (typeof global[process.pid].pkijs !== "object") {
          throw new Error(`Name global.${process.pid}.pkijs already exists and it is not an object`);
        }
      }
      global[process.pid].pkijs.engine = {
        name,
        crypto: crypto2
      };
    } else {
      engine = {
        name,
        crypto: crypto2
      };
    }
  }
  function getEngine() {
    if (typeof process !== "undefined" && "pid" in process && typeof global !== "undefined" && typeof window === "undefined") {
      let _engine;
      try {
        _engine = global[process.pid].pkijs.engine;
      } catch {
        throw new Error("Please call 'setEngine' before call to 'getEngine'");
      }
      return _engine;
    }
    return engine;
  }
  function getCrypto(safety = false) {
    const _engine = getEngine();
    if (!_engine.crypto && safety) {
      throw new Error("Unable to create WebCrypto object");
    }
    return _engine.crypto;
  }
  function createCMSECDSASignature(signatureBuffer) {
    if (signatureBuffer.byteLength % 2 !== 0)
      return EMPTY_BUFFER2;
    const length = signatureBuffer.byteLength / 2;
    const rBuffer = new ArrayBuffer(length);
    const rView = new Uint8Array(rBuffer);
    rView.set(new Uint8Array(signatureBuffer, 0, length));
    const rInteger = new Integer({ valueHex: rBuffer });
    const sBuffer = new ArrayBuffer(length);
    const sView = new Uint8Array(sBuffer);
    sView.set(new Uint8Array(signatureBuffer, length, length));
    const sInteger = new Integer({ valueHex: sBuffer });
    return new Sequence({
      value: [
        rInteger.convertToDER(),
        sInteger.convertToDER()
      ]
    }).toBER(false);
  }
  function createECDSASignatureFromCMS(cmsSignature, pointSize) {
    if (!(cmsSignature instanceof Sequence && cmsSignature.valueBlock.value.length === 2 && cmsSignature.valueBlock.value[0] instanceof Integer && cmsSignature.valueBlock.value[1] instanceof Integer))
      return EMPTY_BUFFER2;
    const rValueView = cmsSignature.valueBlock.value[0].convertFromDER().valueBlock.valueHexView;
    const sValueView = cmsSignature.valueBlock.value[1].convertFromDER().valueBlock.valueHexView;
    const res = new Uint8Array(pointSize * 2);
    res.set(rValueView, pointSize - rValueView.byteLength);
    res.set(sValueView, 2 * pointSize - sValueView.byteLength);
    return res.buffer;
  }
  async function kdfWithCounter(hashFunction, zBuffer, Counter, SharedInfo, crypto2) {
    switch (hashFunction.toUpperCase()) {
      case "SHA-1":
      case "SHA-256":
      case "SHA-384":
      case "SHA-512":
        break;
      default:
        throw new ArgumentError(`Unknown hash function: ${hashFunction}`);
    }
    ArgumentError.assert(zBuffer, "zBuffer", "ArrayBuffer");
    if (zBuffer.byteLength === 0)
      throw new ArgumentError("'zBuffer' has zero length, error");
    ArgumentError.assert(SharedInfo, "SharedInfo", "ArrayBuffer");
    if (Counter > 255)
      throw new ArgumentError("Please set 'Counter' argument to value less or equal to 255");
    const counterBuffer = new ArrayBuffer(4);
    const counterView = new Uint8Array(counterBuffer);
    counterView[0] = 0;
    counterView[1] = 0;
    counterView[2] = 0;
    counterView[3] = Counter;
    let combinedBuffer = EMPTY_BUFFER2;
    combinedBuffer = utilConcatBuf(combinedBuffer, zBuffer);
    combinedBuffer = utilConcatBuf(combinedBuffer, counterBuffer);
    combinedBuffer = utilConcatBuf(combinedBuffer, SharedInfo);
    const result = await crypto2.digest({ name: hashFunction }, combinedBuffer);
    return {
      counter: Counter,
      result
    };
  }
  async function kdf(hashFunction, Zbuffer, keydatalen, SharedInfo, crypto2 = getCrypto(true)) {
    let hashLength = 0;
    let maxCounter = 1;
    switch (hashFunction.toUpperCase()) {
      case "SHA-1":
        hashLength = 160;
        break;
      case "SHA-256":
        hashLength = 256;
        break;
      case "SHA-384":
        hashLength = 384;
        break;
      case "SHA-512":
        hashLength = 512;
        break;
      default:
        throw new ArgumentError(`Unknown hash function: ${hashFunction}`);
    }
    ArgumentError.assert(Zbuffer, "Zbuffer", "ArrayBuffer");
    if (Zbuffer.byteLength === 0)
      throw new ArgumentError("'Zbuffer' has zero length, error");
    ArgumentError.assert(SharedInfo, "SharedInfo", "ArrayBuffer");
    const quotient = keydatalen / hashLength;
    if (Math.floor(quotient) > 0) {
      maxCounter = Math.floor(quotient);
      if (quotient - maxCounter > 0)
        maxCounter++;
    }
    const incomingResult = [];
    for (let i = 1; i <= maxCounter; i++)
      incomingResult.push(await kdfWithCounter(hashFunction, Zbuffer, i, SharedInfo, crypto2));
    let combinedBuffer = EMPTY_BUFFER2;
    let currentCounter = 1;
    let found = true;
    while (found) {
      found = false;
      for (const result of incomingResult) {
        if (result.counter === currentCounter) {
          combinedBuffer = utilConcatBuf(combinedBuffer, result.result);
          found = true;
          break;
        }
      }
      currentCounter++;
    }
    keydatalen >>= 3;
    if (combinedBuffer.byteLength > keydatalen) {
      const newBuffer = new ArrayBuffer(keydatalen);
      const newView = new Uint8Array(newBuffer);
      const combinedView = new Uint8Array(combinedBuffer);
      for (let i = 0; i < keydatalen; i++)
        newView[i] = combinedView[i];
      return newBuffer;
    }
    return combinedBuffer;
  }
  var VERSION$i = "version";
  var LOG_ID = "logID";
  var EXTENSIONS$6 = "extensions";
  var TIMESTAMP = "timestamp";
  var HASH_ALGORITHM$3 = "hashAlgorithm";
  var SIGNATURE_ALGORITHM$8 = "signatureAlgorithm";
  var SIGNATURE$7 = "signature";
  var NONE = "none";
  var MD5 = "md5";
  var SHA12 = "sha1";
  var SHA224 = "sha224";
  var SHA2562 = "sha256";
  var SHA3842 = "sha384";
  var SHA5122 = "sha512";
  var ANONYMOUS = "anonymous";
  var RSA = "rsa";
  var DSA = "dsa";
  var ECDSA = "ecdsa";
  var SignedCertificateTimestamp = class _SignedCertificateTimestamp extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.version = getParametersValue(parameters, VERSION$i, _SignedCertificateTimestamp.defaultValues(VERSION$i));
      this.logID = getParametersValue(parameters, LOG_ID, _SignedCertificateTimestamp.defaultValues(LOG_ID));
      this.timestamp = getParametersValue(parameters, TIMESTAMP, _SignedCertificateTimestamp.defaultValues(TIMESTAMP));
      this.extensions = getParametersValue(parameters, EXTENSIONS$6, _SignedCertificateTimestamp.defaultValues(EXTENSIONS$6));
      this.hashAlgorithm = getParametersValue(parameters, HASH_ALGORITHM$3, _SignedCertificateTimestamp.defaultValues(HASH_ALGORITHM$3));
      this.signatureAlgorithm = getParametersValue(parameters, SIGNATURE_ALGORITHM$8, _SignedCertificateTimestamp.defaultValues(SIGNATURE_ALGORITHM$8));
      this.signature = getParametersValue(parameters, SIGNATURE$7, _SignedCertificateTimestamp.defaultValues(SIGNATURE$7));
      if ("stream" in parameters && parameters.stream) {
        this.fromStream(parameters.stream);
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VERSION$i:
          return 0;
        case LOG_ID:
        case EXTENSIONS$6:
          return EMPTY_BUFFER2;
        case TIMESTAMP:
          return /* @__PURE__ */ new Date(0);
        case HASH_ALGORITHM$3:
        case SIGNATURE_ALGORITHM$8:
          return EMPTY_STRING2;
        case SIGNATURE$7:
          return EMPTY_BUFFER2;
        default:
          return super.defaultValues(memberName);
      }
    }
    fromSchema(schema) {
      if (schema instanceof RawData === false)
        throw new Error("Object's schema was not verified against input data for SignedCertificateTimestamp");
      const seqStream = new SeqStream({
        stream: new ByteStream({
          buffer: schema.data
        })
      });
      this.fromStream(seqStream);
    }
    fromStream(stream) {
      const blockLength = stream.getUint16();
      this.version = stream.getBlock(1)[0];
      if (this.version === 0) {
        this.logID = new Uint8Array(stream.getBlock(32)).buffer.slice(0);
        this.timestamp = new Date(utilFromBase(new Uint8Array(stream.getBlock(8)), 8));
        const extensionsLength = stream.getUint16();
        this.extensions = new Uint8Array(stream.getBlock(extensionsLength)).buffer.slice(0);
        switch (stream.getBlock(1)[0]) {
          case 0:
            this.hashAlgorithm = NONE;
            break;
          case 1:
            this.hashAlgorithm = MD5;
            break;
          case 2:
            this.hashAlgorithm = SHA12;
            break;
          case 3:
            this.hashAlgorithm = SHA224;
            break;
          case 4:
            this.hashAlgorithm = SHA2562;
            break;
          case 5:
            this.hashAlgorithm = SHA3842;
            break;
          case 6:
            this.hashAlgorithm = SHA5122;
            break;
          default:
            throw new Error("Object's stream was not correct for SignedCertificateTimestamp");
        }
        switch (stream.getBlock(1)[0]) {
          case 0:
            this.signatureAlgorithm = ANONYMOUS;
            break;
          case 1:
            this.signatureAlgorithm = RSA;
            break;
          case 2:
            this.signatureAlgorithm = DSA;
            break;
          case 3:
            this.signatureAlgorithm = ECDSA;
            break;
          default:
            throw new Error("Object's stream was not correct for SignedCertificateTimestamp");
        }
        const signatureLength = stream.getUint16();
        this.signature = new Uint8Array(stream.getBlock(signatureLength)).buffer.slice(0);
        if (blockLength !== 47 + extensionsLength + signatureLength) {
          throw new Error("Object's stream was not correct for SignedCertificateTimestamp");
        }
      }
    }
    toSchema() {
      const stream = this.toStream();
      return new RawData({ data: stream.stream.buffer });
    }
    toStream() {
      const stream = new SeqStream();
      stream.appendUint16(47 + this.extensions.byteLength + this.signature.byteLength);
      stream.appendChar(this.version);
      stream.appendView(new Uint8Array(this.logID));
      const timeBuffer = new ArrayBuffer(8);
      const timeView = new Uint8Array(timeBuffer);
      const baseArray = utilToBase(this.timestamp.valueOf(), 8);
      timeView.set(new Uint8Array(baseArray), 8 - baseArray.byteLength);
      stream.appendView(timeView);
      stream.appendUint16(this.extensions.byteLength);
      if (this.extensions.byteLength)
        stream.appendView(new Uint8Array(this.extensions));
      let _hashAlgorithm;
      switch (this.hashAlgorithm.toLowerCase()) {
        case NONE:
          _hashAlgorithm = 0;
          break;
        case MD5:
          _hashAlgorithm = 1;
          break;
        case SHA12:
          _hashAlgorithm = 2;
          break;
        case SHA224:
          _hashAlgorithm = 3;
          break;
        case SHA2562:
          _hashAlgorithm = 4;
          break;
        case SHA3842:
          _hashAlgorithm = 5;
          break;
        case SHA5122:
          _hashAlgorithm = 6;
          break;
        default:
          throw new Error(`Incorrect data for hashAlgorithm: ${this.hashAlgorithm}`);
      }
      stream.appendChar(_hashAlgorithm);
      let _signatureAlgorithm;
      switch (this.signatureAlgorithm.toLowerCase()) {
        case ANONYMOUS:
          _signatureAlgorithm = 0;
          break;
        case RSA:
          _signatureAlgorithm = 1;
          break;
        case DSA:
          _signatureAlgorithm = 2;
          break;
        case ECDSA:
          _signatureAlgorithm = 3;
          break;
        default:
          throw new Error(`Incorrect data for signatureAlgorithm: ${this.signatureAlgorithm}`);
      }
      stream.appendChar(_signatureAlgorithm);
      stream.appendUint16(this.signature.byteLength);
      stream.appendView(new Uint8Array(this.signature));
      return stream;
    }
    toJSON() {
      return {
        version: this.version,
        logID: bufferToHexCodes(this.logID),
        timestamp: this.timestamp,
        extensions: bufferToHexCodes(this.extensions),
        hashAlgorithm: this.hashAlgorithm,
        signatureAlgorithm: this.signatureAlgorithm,
        signature: bufferToHexCodes(this.signature)
      };
    }
    async verify(logs, data, dataType = 0, crypto2 = getCrypto(true)) {
      const logId = toBase64(arrayBufferToString(this.logID));
      let publicKeyBase64 = null;
      const stream = new SeqStream();
      for (const log of logs) {
        if (log.log_id === logId) {
          publicKeyBase64 = log.key;
          break;
        }
      }
      if (!publicKeyBase64) {
        throw new Error(`Public key not found for CT with logId: ${logId}`);
      }
      const pki = stringToArrayBuffer(fromBase64(publicKeyBase64));
      const publicKeyInfo = PublicKeyInfo.fromBER(pki);
      stream.appendChar(0);
      stream.appendChar(0);
      const timeBuffer = new ArrayBuffer(8);
      const timeView = new Uint8Array(timeBuffer);
      const baseArray = utilToBase(this.timestamp.valueOf(), 8);
      timeView.set(new Uint8Array(baseArray), 8 - baseArray.byteLength);
      stream.appendView(timeView);
      stream.appendUint16(dataType);
      if (dataType === 0)
        stream.appendUint24(data.byteLength);
      stream.appendView(new Uint8Array(data));
      stream.appendUint16(this.extensions.byteLength);
      if (this.extensions.byteLength !== 0)
        stream.appendView(new Uint8Array(this.extensions));
      return crypto2.verifyWithPublicKey(stream.buffer.slice(0, stream.length), new OctetString({ valueHex: this.signature }), publicKeyInfo, { algorithmId: EMPTY_STRING2 }, "SHA-256");
    }
  };
  SignedCertificateTimestamp.CLASS_NAME = "SignedCertificateTimestamp";
  var TIMESTAMPS = "timestamps";
  var SignedCertificateTimestampList = class _SignedCertificateTimestampList extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.timestamps = getParametersValue(parameters, TIMESTAMPS, _SignedCertificateTimestampList.defaultValues(TIMESTAMPS));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case TIMESTAMPS:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case TIMESTAMPS:
          return memberValue.length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      var _a3;
      const names = getParametersValue(parameters, "names", {});
      (_a3 = names.optional) !== null && _a3 !== void 0 ? _a3 : names.optional = false;
      return new OctetString({
        name: names.blockName || "SignedCertificateTimestampList",
        optional: names.optional
      });
    }
    fromSchema(schema) {
      if (schema instanceof OctetString === false) {
        throw new Error("Object's schema was not verified against input data for SignedCertificateTimestampList");
      }
      const seqStream = new SeqStream({
        stream: new ByteStream({
          buffer: schema.valueBlock.valueHex
        })
      });
      const dataLength = seqStream.getUint16();
      if (dataLength !== seqStream.length) {
        throw new Error("Object's schema was not verified against input data for SignedCertificateTimestampList");
      }
      while (seqStream.length) {
        this.timestamps.push(new SignedCertificateTimestamp({ stream: seqStream }));
      }
    }
    toSchema() {
      const stream = new SeqStream();
      let overallLength = 0;
      const timestampsData = [];
      for (const timestamp of this.timestamps) {
        const timestampStream = timestamp.toStream();
        timestampsData.push(timestampStream);
        overallLength += timestampStream.stream.buffer.byteLength;
      }
      stream.appendUint16(overallLength);
      for (const timestamp of timestampsData) {
        stream.appendView(timestamp.stream.view);
      }
      return new OctetString({ valueHex: stream.stream.buffer.slice(0) });
    }
    toJSON() {
      return {
        timestamps: Array.from(this.timestamps, (o) => o.toJSON())
      };
    }
  };
  SignedCertificateTimestampList.CLASS_NAME = "SignedCertificateTimestampList";
  var ATTRIBUTES$4 = "attributes";
  var CLEAR_PROPS$11 = [
    ATTRIBUTES$4
  ];
  var SubjectDirectoryAttributes = class _SubjectDirectoryAttributes extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.attributes = getParametersValue(parameters, ATTRIBUTES$4, _SubjectDirectoryAttributes.defaultValues(ATTRIBUTES$4));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case ATTRIBUTES$4:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Repeated({
            name: names.attributes || EMPTY_STRING2,
            value: Attribute.schema()
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$11);
      const asn1 = compareSchema(schema, schema, _SubjectDirectoryAttributes.schema({
        names: {
          attributes: ATTRIBUTES$4
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.attributes = Array.from(asn1.result.attributes, (element) => new Attribute({ schema: element }));
    }
    toSchema() {
      return new Sequence({
        value: Array.from(this.attributes, (o) => o.toSchema())
      });
    }
    toJSON() {
      return {
        attributes: Array.from(this.attributes, (o) => o.toJSON())
      };
    }
  };
  SubjectDirectoryAttributes.CLASS_NAME = "SubjectDirectoryAttributes";
  var ExtensionValueFactory = class _ExtensionValueFactory {
    static getItems() {
      if (!this.types) {
        this.types = {};
        _ExtensionValueFactory.register(id_SubjectAltName, "SubjectAltName", AltName);
        _ExtensionValueFactory.register(id_IssuerAltName, "IssuerAltName", AltName);
        _ExtensionValueFactory.register(id_AuthorityKeyIdentifier, "AuthorityKeyIdentifier", AuthorityKeyIdentifier);
        _ExtensionValueFactory.register(id_BasicConstraints, "BasicConstraints", BasicConstraints);
        _ExtensionValueFactory.register(id_MicrosoftCaVersion, "MicrosoftCaVersion", CAVersion);
        _ExtensionValueFactory.register(id_CertificatePolicies, "CertificatePolicies", CertificatePolicies);
        _ExtensionValueFactory.register(id_MicrosoftAppPolicies, "CertificatePoliciesMicrosoft", CertificatePolicies);
        _ExtensionValueFactory.register(id_MicrosoftCertTemplateV2, "MicrosoftCertTemplateV2", CertificateTemplate);
        _ExtensionValueFactory.register(id_CRLDistributionPoints, "CRLDistributionPoints", CRLDistributionPoints);
        _ExtensionValueFactory.register(id_FreshestCRL, "FreshestCRL", CRLDistributionPoints);
        _ExtensionValueFactory.register(id_ExtKeyUsage, "ExtKeyUsage", ExtKeyUsage);
        _ExtensionValueFactory.register(id_CertificateIssuer, "CertificateIssuer", GeneralNames);
        _ExtensionValueFactory.register(id_AuthorityInfoAccess, "AuthorityInfoAccess", InfoAccess);
        _ExtensionValueFactory.register(id_SubjectInfoAccess, "SubjectInfoAccess", InfoAccess);
        _ExtensionValueFactory.register(id_IssuingDistributionPoint, "IssuingDistributionPoint", IssuingDistributionPoint);
        _ExtensionValueFactory.register(id_NameConstraints, "NameConstraints", NameConstraints);
        _ExtensionValueFactory.register(id_PolicyConstraints, "PolicyConstraints", PolicyConstraints);
        _ExtensionValueFactory.register(id_PolicyMappings, "PolicyMappings", PolicyMappings);
        _ExtensionValueFactory.register(id_PrivateKeyUsagePeriod, "PrivateKeyUsagePeriod", PrivateKeyUsagePeriod);
        _ExtensionValueFactory.register(id_QCStatements, "QCStatements", QCStatements);
        _ExtensionValueFactory.register(id_SignedCertificateTimestampList, "SignedCertificateTimestampList", SignedCertificateTimestampList);
        _ExtensionValueFactory.register(id_SubjectDirectoryAttributes, "SubjectDirectoryAttributes", SubjectDirectoryAttributes);
      }
      return this.types;
    }
    static fromBER(id, raw) {
      const asn1 = fromBER(raw);
      if (asn1.offset === -1) {
        return null;
      }
      const item = this.find(id);
      if (item) {
        try {
          return new item.type({ schema: asn1.result });
        } catch {
          const res = new item.type();
          res.parsingError = `Incorrectly formatted value of extension ${item.name} (${id})`;
          return res;
        }
      }
      return asn1.result;
    }
    static find(id) {
      const types = this.getItems();
      return types[id] || null;
    }
    static register(id, name, type) {
      this.getItems()[id] = { name, type };
    }
  };
  var EXTN_ID = "extnID";
  var CRITICAL = "critical";
  var EXTN_VALUE = "extnValue";
  var PARSED_VALUE$5 = "parsedValue";
  var CLEAR_PROPS$10 = [
    EXTN_ID,
    CRITICAL,
    EXTN_VALUE
  ];
  var Extension = class _Extension extends PkiObject {
    get parsedValue() {
      if (this._parsedValue === void 0) {
        const parsedValue = ExtensionValueFactory.fromBER(this.extnID, this.extnValue.valueBlock.valueHexView);
        this._parsedValue = parsedValue;
      }
      return this._parsedValue || void 0;
    }
    set parsedValue(value) {
      this._parsedValue = value;
    }
    constructor(parameters = {}) {
      super();
      this.extnID = getParametersValue(parameters, EXTN_ID, _Extension.defaultValues(EXTN_ID));
      this.critical = getParametersValue(parameters, CRITICAL, _Extension.defaultValues(CRITICAL));
      if (EXTN_VALUE in parameters) {
        this.extnValue = new OctetString({ valueHex: parameters.extnValue });
      } else {
        this.extnValue = _Extension.defaultValues(EXTN_VALUE);
      }
      if (PARSED_VALUE$5 in parameters) {
        this.parsedValue = getParametersValue(parameters, PARSED_VALUE$5, _Extension.defaultValues(PARSED_VALUE$5));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case EXTN_ID:
          return EMPTY_STRING2;
        case CRITICAL:
          return false;
        case EXTN_VALUE:
          return new OctetString();
        case PARSED_VALUE$5:
          return {};
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.extnID || EMPTY_STRING2 }),
          new Boolean({
            name: names.critical || EMPTY_STRING2,
            optional: true
          }),
          new OctetString({ name: names.extnValue || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$10);
      const asn1 = compareSchema(schema, schema, _Extension.schema({
        names: {
          extnID: EXTN_ID,
          critical: CRITICAL,
          extnValue: EXTN_VALUE
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.extnID = asn1.result.extnID.valueBlock.toString();
      if (CRITICAL in asn1.result) {
        this.critical = asn1.result.critical.valueBlock.value;
      }
      this.extnValue = asn1.result.extnValue;
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(new ObjectIdentifier({ value: this.extnID }));
      if (this.critical !== _Extension.defaultValues(CRITICAL)) {
        outputArray.push(new Boolean({ value: this.critical }));
      }
      outputArray.push(this.extnValue);
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const object = {
        extnID: this.extnID,
        extnValue: this.extnValue.toJSON()
      };
      if (this.critical !== _Extension.defaultValues(CRITICAL)) {
        object.critical = this.critical;
      }
      if (this.parsedValue && this.parsedValue.toJSON) {
        object.parsedValue = this.parsedValue.toJSON();
      }
      return object;
    }
  };
  Extension.CLASS_NAME = "Extension";
  var EXTENSIONS$5 = "extensions";
  var CLEAR_PROPS$$ = [
    EXTENSIONS$5
  ];
  var Extensions = class _Extensions extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.extensions = getParametersValue(parameters, EXTENSIONS$5, _Extensions.defaultValues(EXTENSIONS$5));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case EXTENSIONS$5:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}, optional = false) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        optional,
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Repeated({
            name: names.extensions || EMPTY_STRING2,
            value: Extension.schema(names.extension || {})
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$$);
      const asn1 = compareSchema(schema, schema, _Extensions.schema({
        names: {
          extensions: EXTENSIONS$5
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.extensions = Array.from(asn1.result.extensions, (element) => new Extension({ schema: element }));
    }
    toSchema() {
      return new Sequence({
        value: Array.from(this.extensions, (o) => o.toSchema())
      });
    }
    toJSON() {
      return {
        extensions: this.extensions.map((o) => o.toJSON())
      };
    }
  };
  Extensions.CLASS_NAME = "Extensions";
  var ISSUER$5 = "issuer";
  var SERIAL_NUMBER$6 = "serialNumber";
  var ISSUER_UID = "issuerUID";
  var CLEAR_PROPS$_ = [
    ISSUER$5,
    SERIAL_NUMBER$6,
    ISSUER_UID
  ];
  var IssuerSerial = class _IssuerSerial extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.issuer = getParametersValue(parameters, ISSUER$5, _IssuerSerial.defaultValues(ISSUER$5));
      this.serialNumber = getParametersValue(parameters, SERIAL_NUMBER$6, _IssuerSerial.defaultValues(SERIAL_NUMBER$6));
      if (ISSUER_UID in parameters) {
        this.issuerUID = getParametersValue(parameters, ISSUER_UID, _IssuerSerial.defaultValues(ISSUER_UID));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case ISSUER$5:
          return new GeneralNames();
        case SERIAL_NUMBER$6:
          return new Integer();
        case ISSUER_UID:
          return new BitString();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          GeneralNames.schema(names.issuer || {}),
          new Integer({ name: names.serialNumber || EMPTY_STRING2 }),
          new BitString({
            optional: true,
            name: names.issuerUID || EMPTY_STRING2
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$_);
      const asn1 = compareSchema(schema, schema, _IssuerSerial.schema({
        names: {
          issuer: {
            names: {
              blockName: ISSUER$5
            }
          },
          serialNumber: SERIAL_NUMBER$6,
          issuerUID: ISSUER_UID
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.issuer = new GeneralNames({ schema: asn1.result.issuer });
      this.serialNumber = asn1.result.serialNumber;
      if (ISSUER_UID in asn1.result)
        this.issuerUID = asn1.result.issuerUID;
    }
    toSchema() {
      const result = new Sequence({
        value: [
          this.issuer.toSchema(),
          this.serialNumber
        ]
      });
      if (this.issuerUID) {
        result.valueBlock.value.push(this.issuerUID);
      }
      return result;
    }
    toJSON() {
      const result = {
        issuer: this.issuer.toJSON(),
        serialNumber: this.serialNumber.toJSON()
      };
      if (this.issuerUID) {
        result.issuerUID = this.issuerUID.toJSON();
      }
      return result;
    }
  };
  IssuerSerial.CLASS_NAME = "IssuerSerial";
  var VERSION$h = "version";
  var BASE_CERTIFICATE_ID$2 = "baseCertificateID";
  var SUBJECT_NAME = "subjectName";
  var ISSUER$4 = "issuer";
  var SIGNATURE$6 = "signature";
  var SERIAL_NUMBER$5 = "serialNumber";
  var ATTR_CERT_VALIDITY_PERIOD$1 = "attrCertValidityPeriod";
  var ATTRIBUTES$3 = "attributes";
  var ISSUER_UNIQUE_ID$2 = "issuerUniqueID";
  var EXTENSIONS$4 = "extensions";
  var CLEAR_PROPS$Z = [
    VERSION$h,
    BASE_CERTIFICATE_ID$2,
    SUBJECT_NAME,
    ISSUER$4,
    SIGNATURE$6,
    SERIAL_NUMBER$5,
    ATTR_CERT_VALIDITY_PERIOD$1,
    ATTRIBUTES$3,
    ISSUER_UNIQUE_ID$2,
    EXTENSIONS$4
  ];
  var AttributeCertificateInfoV1 = class _AttributeCertificateInfoV1 extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.version = getParametersValue(parameters, VERSION$h, _AttributeCertificateInfoV1.defaultValues(VERSION$h));
      if (BASE_CERTIFICATE_ID$2 in parameters) {
        this.baseCertificateID = getParametersValue(parameters, BASE_CERTIFICATE_ID$2, _AttributeCertificateInfoV1.defaultValues(BASE_CERTIFICATE_ID$2));
      }
      if (SUBJECT_NAME in parameters) {
        this.subjectName = getParametersValue(parameters, SUBJECT_NAME, _AttributeCertificateInfoV1.defaultValues(SUBJECT_NAME));
      }
      this.issuer = getParametersValue(parameters, ISSUER$4, _AttributeCertificateInfoV1.defaultValues(ISSUER$4));
      this.signature = getParametersValue(parameters, SIGNATURE$6, _AttributeCertificateInfoV1.defaultValues(SIGNATURE$6));
      this.serialNumber = getParametersValue(parameters, SERIAL_NUMBER$5, _AttributeCertificateInfoV1.defaultValues(SERIAL_NUMBER$5));
      this.attrCertValidityPeriod = getParametersValue(parameters, ATTR_CERT_VALIDITY_PERIOD$1, _AttributeCertificateInfoV1.defaultValues(ATTR_CERT_VALIDITY_PERIOD$1));
      this.attributes = getParametersValue(parameters, ATTRIBUTES$3, _AttributeCertificateInfoV1.defaultValues(ATTRIBUTES$3));
      if (ISSUER_UNIQUE_ID$2 in parameters)
        this.issuerUniqueID = getParametersValue(parameters, ISSUER_UNIQUE_ID$2, _AttributeCertificateInfoV1.defaultValues(ISSUER_UNIQUE_ID$2));
      if (EXTENSIONS$4 in parameters) {
        this.extensions = getParametersValue(parameters, EXTENSIONS$4, _AttributeCertificateInfoV1.defaultValues(EXTENSIONS$4));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VERSION$h:
          return 0;
        case BASE_CERTIFICATE_ID$2:
          return new IssuerSerial();
        case SUBJECT_NAME:
          return new GeneralNames();
        case ISSUER$4:
          return new GeneralNames();
        case SIGNATURE$6:
          return new AlgorithmIdentifier();
        case SERIAL_NUMBER$5:
          return new Integer();
        case ATTR_CERT_VALIDITY_PERIOD$1:
          return new AttCertValidityPeriod();
        case ATTRIBUTES$3:
          return [];
        case ISSUER_UNIQUE_ID$2:
          return new BitString();
        case EXTENSIONS$4:
          return new Extensions();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Integer({ name: names.version || EMPTY_STRING2 }),
          new Choice({
            value: [
              new Constructed({
                name: names.baseCertificateID || EMPTY_STRING2,
                idBlock: {
                  tagClass: 3,
                  tagNumber: 0
                },
                value: IssuerSerial.schema().valueBlock.value
              }),
              new Constructed({
                name: names.subjectName || EMPTY_STRING2,
                idBlock: {
                  tagClass: 3,
                  tagNumber: 1
                },
                value: GeneralNames.schema().valueBlock.value
              })
            ]
          }),
          GeneralNames.schema({
            names: {
              blockName: names.issuer || EMPTY_STRING2
            }
          }),
          AlgorithmIdentifier.schema(names.signature || {}),
          new Integer({ name: names.serialNumber || EMPTY_STRING2 }),
          AttCertValidityPeriod.schema(names.attrCertValidityPeriod || {}),
          new Sequence({
            name: names.attributes || EMPTY_STRING2,
            value: [
              new Repeated({
                value: Attribute.schema()
              })
            ]
          }),
          new BitString({
            optional: true,
            name: names.issuerUniqueID || EMPTY_STRING2
          }),
          Extensions.schema(names.extensions || {}, true)
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$Z);
      const asn1 = compareSchema(schema, schema, _AttributeCertificateInfoV1.schema({
        names: {
          version: VERSION$h,
          baseCertificateID: BASE_CERTIFICATE_ID$2,
          subjectName: SUBJECT_NAME,
          issuer: ISSUER$4,
          signature: {
            names: {
              blockName: SIGNATURE$6
            }
          },
          serialNumber: SERIAL_NUMBER$5,
          attrCertValidityPeriod: {
            names: {
              blockName: ATTR_CERT_VALIDITY_PERIOD$1
            }
          },
          attributes: ATTRIBUTES$3,
          issuerUniqueID: ISSUER_UNIQUE_ID$2,
          extensions: {
            names: {
              blockName: EXTENSIONS$4
            }
          }
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.version = asn1.result.version.valueBlock.valueDec;
      if (BASE_CERTIFICATE_ID$2 in asn1.result) {
        this.baseCertificateID = new IssuerSerial({
          schema: new Sequence({
            value: asn1.result.baseCertificateID.valueBlock.value
          })
        });
      }
      if (SUBJECT_NAME in asn1.result) {
        this.subjectName = new GeneralNames({
          schema: new Sequence({
            value: asn1.result.subjectName.valueBlock.value
          })
        });
      }
      this.issuer = asn1.result.issuer;
      this.signature = new AlgorithmIdentifier({ schema: asn1.result.signature });
      this.serialNumber = asn1.result.serialNumber;
      this.attrCertValidityPeriod = new AttCertValidityPeriod({ schema: asn1.result.attrCertValidityPeriod });
      this.attributes = Array.from(asn1.result.attributes.valueBlock.value, (element) => new Attribute({ schema: element }));
      if (ISSUER_UNIQUE_ID$2 in asn1.result) {
        this.issuerUniqueID = asn1.result.issuerUniqueID;
      }
      if (EXTENSIONS$4 in asn1.result) {
        this.extensions = new Extensions({ schema: asn1.result.extensions });
      }
    }
    toSchema() {
      const result = new Sequence({
        value: [new Integer({ value: this.version })]
      });
      if (this.baseCertificateID) {
        result.valueBlock.value.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: this.baseCertificateID.toSchema().valueBlock.value
        }));
      }
      if (this.subjectName) {
        result.valueBlock.value.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          value: this.subjectName.toSchema().valueBlock.value
        }));
      }
      result.valueBlock.value.push(this.issuer.toSchema());
      result.valueBlock.value.push(this.signature.toSchema());
      result.valueBlock.value.push(this.serialNumber);
      result.valueBlock.value.push(this.attrCertValidityPeriod.toSchema());
      result.valueBlock.value.push(new Sequence({
        value: Array.from(this.attributes, (o) => o.toSchema())
      }));
      if (this.issuerUniqueID) {
        result.valueBlock.value.push(this.issuerUniqueID);
      }
      if (this.extensions) {
        result.valueBlock.value.push(this.extensions.toSchema());
      }
      return result;
    }
    toJSON() {
      const result = {
        version: this.version
      };
      if (this.baseCertificateID) {
        result.baseCertificateID = this.baseCertificateID.toJSON();
      }
      if (this.subjectName) {
        result.subjectName = this.subjectName.toJSON();
      }
      result.issuer = this.issuer.toJSON();
      result.signature = this.signature.toJSON();
      result.serialNumber = this.serialNumber.toJSON();
      result.attrCertValidityPeriod = this.attrCertValidityPeriod.toJSON();
      result.attributes = Array.from(this.attributes, (o) => o.toJSON());
      if (this.issuerUniqueID) {
        result.issuerUniqueID = this.issuerUniqueID.toJSON();
      }
      if (this.extensions) {
        result.extensions = this.extensions.toJSON();
      }
      return result;
    }
  };
  AttributeCertificateInfoV1.CLASS_NAME = "AttributeCertificateInfoV1";
  var ACINFO$1 = "acinfo";
  var SIGNATURE_ALGORITHM$7 = "signatureAlgorithm";
  var SIGNATURE_VALUE$4 = "signatureValue";
  var CLEAR_PROPS$Y = [
    ACINFO$1,
    SIGNATURE_VALUE$4,
    SIGNATURE_ALGORITHM$7
  ];
  var AttributeCertificateV1 = class _AttributeCertificateV1 extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.acinfo = getParametersValue(parameters, ACINFO$1, _AttributeCertificateV1.defaultValues(ACINFO$1));
      this.signatureAlgorithm = getParametersValue(parameters, SIGNATURE_ALGORITHM$7, _AttributeCertificateV1.defaultValues(SIGNATURE_ALGORITHM$7));
      this.signatureValue = getParametersValue(parameters, SIGNATURE_VALUE$4, _AttributeCertificateV1.defaultValues(SIGNATURE_VALUE$4));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case ACINFO$1:
          return new AttributeCertificateInfoV1();
        case SIGNATURE_ALGORITHM$7:
          return new AlgorithmIdentifier();
        case SIGNATURE_VALUE$4:
          return new BitString();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          AttributeCertificateInfoV1.schema(names.acinfo || {}),
          AlgorithmIdentifier.schema(names.signatureAlgorithm || {}),
          new BitString({ name: names.signatureValue || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$Y);
      const asn1 = compareSchema(schema, schema, _AttributeCertificateV1.schema({
        names: {
          acinfo: {
            names: {
              blockName: ACINFO$1
            }
          },
          signatureAlgorithm: {
            names: {
              blockName: SIGNATURE_ALGORITHM$7
            }
          },
          signatureValue: SIGNATURE_VALUE$4
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.acinfo = new AttributeCertificateInfoV1({ schema: asn1.result.acinfo });
      this.signatureAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.signatureAlgorithm });
      this.signatureValue = asn1.result.signatureValue;
    }
    toSchema() {
      return new Sequence({
        value: [
          this.acinfo.toSchema(),
          this.signatureAlgorithm.toSchema(),
          this.signatureValue
        ]
      });
    }
    toJSON() {
      return {
        acinfo: this.acinfo.toJSON(),
        signatureAlgorithm: this.signatureAlgorithm.toJSON(),
        signatureValue: this.signatureValue.toJSON()
      };
    }
  };
  AttributeCertificateV1.CLASS_NAME = "AttributeCertificateV1";
  var DIGESTED_OBJECT_TYPE = "digestedObjectType";
  var OTHER_OBJECT_TYPE_ID = "otherObjectTypeID";
  var DIGEST_ALGORITHM$2 = "digestAlgorithm";
  var OBJECT_DIGEST = "objectDigest";
  var CLEAR_PROPS$X = [
    DIGESTED_OBJECT_TYPE,
    OTHER_OBJECT_TYPE_ID,
    DIGEST_ALGORITHM$2,
    OBJECT_DIGEST
  ];
  var ObjectDigestInfo = class _ObjectDigestInfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.digestedObjectType = getParametersValue(parameters, DIGESTED_OBJECT_TYPE, _ObjectDigestInfo.defaultValues(DIGESTED_OBJECT_TYPE));
      if (OTHER_OBJECT_TYPE_ID in parameters) {
        this.otherObjectTypeID = getParametersValue(parameters, OTHER_OBJECT_TYPE_ID, _ObjectDigestInfo.defaultValues(OTHER_OBJECT_TYPE_ID));
      }
      this.digestAlgorithm = getParametersValue(parameters, DIGEST_ALGORITHM$2, _ObjectDigestInfo.defaultValues(DIGEST_ALGORITHM$2));
      this.objectDigest = getParametersValue(parameters, OBJECT_DIGEST, _ObjectDigestInfo.defaultValues(OBJECT_DIGEST));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case DIGESTED_OBJECT_TYPE:
          return new Enumerated();
        case OTHER_OBJECT_TYPE_ID:
          return new ObjectIdentifier();
        case DIGEST_ALGORITHM$2:
          return new AlgorithmIdentifier();
        case OBJECT_DIGEST:
          return new BitString();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Enumerated({ name: names.digestedObjectType || EMPTY_STRING2 }),
          new ObjectIdentifier({
            optional: true,
            name: names.otherObjectTypeID || EMPTY_STRING2
          }),
          AlgorithmIdentifier.schema(names.digestAlgorithm || {}),
          new BitString({ name: names.objectDigest || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$X);
      const asn1 = compareSchema(schema, schema, _ObjectDigestInfo.schema({
        names: {
          digestedObjectType: DIGESTED_OBJECT_TYPE,
          otherObjectTypeID: OTHER_OBJECT_TYPE_ID,
          digestAlgorithm: {
            names: {
              blockName: DIGEST_ALGORITHM$2
            }
          },
          objectDigest: OBJECT_DIGEST
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.digestedObjectType = asn1.result.digestedObjectType;
      if (OTHER_OBJECT_TYPE_ID in asn1.result) {
        this.otherObjectTypeID = asn1.result.otherObjectTypeID;
      }
      this.digestAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.digestAlgorithm });
      this.objectDigest = asn1.result.objectDigest;
    }
    toSchema() {
      const result = new Sequence({
        value: [this.digestedObjectType]
      });
      if (this.otherObjectTypeID) {
        result.valueBlock.value.push(this.otherObjectTypeID);
      }
      result.valueBlock.value.push(this.digestAlgorithm.toSchema());
      result.valueBlock.value.push(this.objectDigest);
      return result;
    }
    toJSON() {
      const result = {
        digestedObjectType: this.digestedObjectType.toJSON(),
        digestAlgorithm: this.digestAlgorithm.toJSON(),
        objectDigest: this.objectDigest.toJSON()
      };
      if (this.otherObjectTypeID) {
        result.otherObjectTypeID = this.otherObjectTypeID.toJSON();
      }
      return result;
    }
  };
  ObjectDigestInfo.CLASS_NAME = "ObjectDigestInfo";
  var ISSUER_NAME = "issuerName";
  var BASE_CERTIFICATE_ID$1 = "baseCertificateID";
  var OBJECT_DIGEST_INFO$1 = "objectDigestInfo";
  var CLEAR_PROPS$W = [
    ISSUER_NAME,
    BASE_CERTIFICATE_ID$1,
    OBJECT_DIGEST_INFO$1
  ];
  var V2Form = class _V2Form extends PkiObject {
    constructor(parameters = {}) {
      super();
      if (ISSUER_NAME in parameters) {
        this.issuerName = getParametersValue(parameters, ISSUER_NAME, _V2Form.defaultValues(ISSUER_NAME));
      }
      if (BASE_CERTIFICATE_ID$1 in parameters) {
        this.baseCertificateID = getParametersValue(parameters, BASE_CERTIFICATE_ID$1, _V2Form.defaultValues(BASE_CERTIFICATE_ID$1));
      }
      if (OBJECT_DIGEST_INFO$1 in parameters) {
        this.objectDigestInfo = getParametersValue(parameters, OBJECT_DIGEST_INFO$1, _V2Form.defaultValues(OBJECT_DIGEST_INFO$1));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case ISSUER_NAME:
          return new GeneralNames();
        case BASE_CERTIFICATE_ID$1:
          return new IssuerSerial();
        case OBJECT_DIGEST_INFO$1:
          return new ObjectDigestInfo();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          GeneralNames.schema({
            names: {
              blockName: names.issuerName
            }
          }, true),
          new Constructed({
            optional: true,
            name: names.baseCertificateID || EMPTY_STRING2,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: IssuerSerial.schema().valueBlock.value
          }),
          new Constructed({
            optional: true,
            name: names.objectDigestInfo || EMPTY_STRING2,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: ObjectDigestInfo.schema().valueBlock.value
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$W);
      const asn1 = compareSchema(schema, schema, _V2Form.schema({
        names: {
          issuerName: ISSUER_NAME,
          baseCertificateID: BASE_CERTIFICATE_ID$1,
          objectDigestInfo: OBJECT_DIGEST_INFO$1
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (ISSUER_NAME in asn1.result)
        this.issuerName = new GeneralNames({ schema: asn1.result.issuerName });
      if (BASE_CERTIFICATE_ID$1 in asn1.result) {
        this.baseCertificateID = new IssuerSerial({
          schema: new Sequence({
            value: asn1.result.baseCertificateID.valueBlock.value
          })
        });
      }
      if (OBJECT_DIGEST_INFO$1 in asn1.result) {
        this.objectDigestInfo = new ObjectDigestInfo({
          schema: new Sequence({
            value: asn1.result.objectDigestInfo.valueBlock.value
          })
        });
      }
    }
    toSchema() {
      const result = new Sequence();
      if (this.issuerName)
        result.valueBlock.value.push(this.issuerName.toSchema());
      if (this.baseCertificateID) {
        result.valueBlock.value.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: this.baseCertificateID.toSchema().valueBlock.value
        }));
      }
      if (this.objectDigestInfo) {
        result.valueBlock.value.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          value: this.objectDigestInfo.toSchema().valueBlock.value
        }));
      }
      return result;
    }
    toJSON() {
      const result = {};
      if (this.issuerName) {
        result.issuerName = this.issuerName.toJSON();
      }
      if (this.baseCertificateID) {
        result.baseCertificateID = this.baseCertificateID.toJSON();
      }
      if (this.objectDigestInfo) {
        result.objectDigestInfo = this.objectDigestInfo.toJSON();
      }
      return result;
    }
  };
  V2Form.CLASS_NAME = "V2Form";
  var BASE_CERTIFICATE_ID = "baseCertificateID";
  var ENTITY_NAME = "entityName";
  var OBJECT_DIGEST_INFO = "objectDigestInfo";
  var CLEAR_PROPS$V = [
    BASE_CERTIFICATE_ID,
    ENTITY_NAME,
    OBJECT_DIGEST_INFO
  ];
  var Holder = class _Holder extends PkiObject {
    constructor(parameters = {}) {
      super();
      if (BASE_CERTIFICATE_ID in parameters) {
        this.baseCertificateID = getParametersValue(parameters, BASE_CERTIFICATE_ID, _Holder.defaultValues(BASE_CERTIFICATE_ID));
      }
      if (ENTITY_NAME in parameters) {
        this.entityName = getParametersValue(parameters, ENTITY_NAME, _Holder.defaultValues(ENTITY_NAME));
      }
      if (OBJECT_DIGEST_INFO in parameters) {
        this.objectDigestInfo = getParametersValue(parameters, OBJECT_DIGEST_INFO, _Holder.defaultValues(OBJECT_DIGEST_INFO));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case BASE_CERTIFICATE_ID:
          return new IssuerSerial();
        case ENTITY_NAME:
          return new GeneralNames();
        case OBJECT_DIGEST_INFO:
          return new ObjectDigestInfo();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Constructed({
            optional: true,
            name: names.baseCertificateID || EMPTY_STRING2,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: IssuerSerial.schema().valueBlock.value
          }),
          new Constructed({
            optional: true,
            name: names.entityName || EMPTY_STRING2,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: GeneralNames.schema().valueBlock.value
          }),
          new Constructed({
            optional: true,
            name: names.objectDigestInfo || EMPTY_STRING2,
            idBlock: {
              tagClass: 3,
              tagNumber: 2
            },
            value: ObjectDigestInfo.schema().valueBlock.value
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$V);
      const asn1 = compareSchema(schema, schema, _Holder.schema({
        names: {
          baseCertificateID: BASE_CERTIFICATE_ID,
          entityName: ENTITY_NAME,
          objectDigestInfo: OBJECT_DIGEST_INFO
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (BASE_CERTIFICATE_ID in asn1.result) {
        this.baseCertificateID = new IssuerSerial({
          schema: new Sequence({
            value: asn1.result.baseCertificateID.valueBlock.value
          })
        });
      }
      if (ENTITY_NAME in asn1.result) {
        this.entityName = new GeneralNames({
          schema: new Sequence({
            value: asn1.result.entityName.valueBlock.value
          })
        });
      }
      if (OBJECT_DIGEST_INFO in asn1.result) {
        this.objectDigestInfo = new ObjectDigestInfo({
          schema: new Sequence({
            value: asn1.result.objectDigestInfo.valueBlock.value
          })
        });
      }
    }
    toSchema() {
      const result = new Sequence();
      if (this.baseCertificateID) {
        result.valueBlock.value.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: this.baseCertificateID.toSchema().valueBlock.value
        }));
      }
      if (this.entityName) {
        result.valueBlock.value.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          value: this.entityName.toSchema().valueBlock.value
        }));
      }
      if (this.objectDigestInfo) {
        result.valueBlock.value.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 2
          },
          value: this.objectDigestInfo.toSchema().valueBlock.value
        }));
      }
      return result;
    }
    toJSON() {
      const result = {};
      if (this.baseCertificateID) {
        result.baseCertificateID = this.baseCertificateID.toJSON();
      }
      if (this.entityName) {
        result.entityName = this.entityName.toJSON();
      }
      if (this.objectDigestInfo) {
        result.objectDigestInfo = this.objectDigestInfo.toJSON();
      }
      return result;
    }
  };
  Holder.CLASS_NAME = "Holder";
  var VERSION$g = "version";
  var HOLDER = "holder";
  var ISSUER$3 = "issuer";
  var SIGNATURE$5 = "signature";
  var SERIAL_NUMBER$4 = "serialNumber";
  var ATTR_CERT_VALIDITY_PERIOD = "attrCertValidityPeriod";
  var ATTRIBUTES$2 = "attributes";
  var ISSUER_UNIQUE_ID$1 = "issuerUniqueID";
  var EXTENSIONS$3 = "extensions";
  var CLEAR_PROPS$U = [
    VERSION$g,
    HOLDER,
    ISSUER$3,
    SIGNATURE$5,
    SERIAL_NUMBER$4,
    ATTR_CERT_VALIDITY_PERIOD,
    ATTRIBUTES$2,
    ISSUER_UNIQUE_ID$1,
    EXTENSIONS$3
  ];
  var AttributeCertificateInfoV2 = class _AttributeCertificateInfoV2 extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.version = getParametersValue(parameters, VERSION$g, _AttributeCertificateInfoV2.defaultValues(VERSION$g));
      this.holder = getParametersValue(parameters, HOLDER, _AttributeCertificateInfoV2.defaultValues(HOLDER));
      this.issuer = getParametersValue(parameters, ISSUER$3, _AttributeCertificateInfoV2.defaultValues(ISSUER$3));
      this.signature = getParametersValue(parameters, SIGNATURE$5, _AttributeCertificateInfoV2.defaultValues(SIGNATURE$5));
      this.serialNumber = getParametersValue(parameters, SERIAL_NUMBER$4, _AttributeCertificateInfoV2.defaultValues(SERIAL_NUMBER$4));
      this.attrCertValidityPeriod = getParametersValue(parameters, ATTR_CERT_VALIDITY_PERIOD, _AttributeCertificateInfoV2.defaultValues(ATTR_CERT_VALIDITY_PERIOD));
      this.attributes = getParametersValue(parameters, ATTRIBUTES$2, _AttributeCertificateInfoV2.defaultValues(ATTRIBUTES$2));
      if (ISSUER_UNIQUE_ID$1 in parameters) {
        this.issuerUniqueID = getParametersValue(parameters, ISSUER_UNIQUE_ID$1, _AttributeCertificateInfoV2.defaultValues(ISSUER_UNIQUE_ID$1));
      }
      if (EXTENSIONS$3 in parameters) {
        this.extensions = getParametersValue(parameters, EXTENSIONS$3, _AttributeCertificateInfoV2.defaultValues(EXTENSIONS$3));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VERSION$g:
          return 1;
        case HOLDER:
          return new Holder();
        case ISSUER$3:
          return {};
        case SIGNATURE$5:
          return new AlgorithmIdentifier();
        case SERIAL_NUMBER$4:
          return new Integer();
        case ATTR_CERT_VALIDITY_PERIOD:
          return new AttCertValidityPeriod();
        case ATTRIBUTES$2:
          return [];
        case ISSUER_UNIQUE_ID$1:
          return new BitString();
        case EXTENSIONS$3:
          return new Extensions();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Integer({ name: names.version || EMPTY_STRING2 }),
          Holder.schema(names.holder || {}),
          new Choice({
            value: [
              GeneralNames.schema({
                names: {
                  blockName: names.issuer || EMPTY_STRING2
                }
              }),
              new Constructed({
                name: names.issuer || EMPTY_STRING2,
                idBlock: {
                  tagClass: 3,
                  tagNumber: 0
                },
                value: V2Form.schema().valueBlock.value
              })
            ]
          }),
          AlgorithmIdentifier.schema(names.signature || {}),
          new Integer({ name: names.serialNumber || EMPTY_STRING2 }),
          AttCertValidityPeriod.schema(names.attrCertValidityPeriod || {}),
          new Sequence({
            name: names.attributes || EMPTY_STRING2,
            value: [
              new Repeated({
                value: Attribute.schema()
              })
            ]
          }),
          new BitString({
            optional: true,
            name: names.issuerUniqueID || EMPTY_STRING2
          }),
          Extensions.schema(names.extensions || {}, true)
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$U);
      const asn1 = compareSchema(schema, schema, _AttributeCertificateInfoV2.schema({
        names: {
          version: VERSION$g,
          holder: {
            names: {
              blockName: HOLDER
            }
          },
          issuer: ISSUER$3,
          signature: {
            names: {
              blockName: SIGNATURE$5
            }
          },
          serialNumber: SERIAL_NUMBER$4,
          attrCertValidityPeriod: {
            names: {
              blockName: ATTR_CERT_VALIDITY_PERIOD
            }
          },
          attributes: ATTRIBUTES$2,
          issuerUniqueID: ISSUER_UNIQUE_ID$1,
          extensions: {
            names: {
              blockName: EXTENSIONS$3
            }
          }
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.version = asn1.result.version.valueBlock.valueDec;
      this.holder = new Holder({ schema: asn1.result.holder });
      switch (asn1.result.issuer.idBlock.tagClass) {
        case 3:
          this.issuer = new V2Form({
            schema: new Sequence({
              value: asn1.result.issuer.valueBlock.value
            })
          });
          break;
        case 1:
        default:
          throw new Error("Incorrect value for 'issuer' in AttributeCertificateInfoV2");
      }
      this.signature = new AlgorithmIdentifier({ schema: asn1.result.signature });
      this.serialNumber = asn1.result.serialNumber;
      this.attrCertValidityPeriod = new AttCertValidityPeriod({ schema: asn1.result.attrCertValidityPeriod });
      this.attributes = Array.from(asn1.result.attributes.valueBlock.value, (element) => new Attribute({ schema: element }));
      if (ISSUER_UNIQUE_ID$1 in asn1.result) {
        this.issuerUniqueID = asn1.result.issuerUniqueID;
      }
      if (EXTENSIONS$3 in asn1.result) {
        this.extensions = new Extensions({ schema: asn1.result.extensions });
      }
    }
    toSchema() {
      const result = new Sequence({
        value: [
          new Integer({ value: this.version }),
          this.holder.toSchema(),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: this.issuer.toSchema().valueBlock.value
          }),
          this.signature.toSchema(),
          this.serialNumber,
          this.attrCertValidityPeriod.toSchema(),
          new Sequence({
            value: Array.from(this.attributes, (o) => o.toSchema())
          })
        ]
      });
      if (this.issuerUniqueID) {
        result.valueBlock.value.push(this.issuerUniqueID);
      }
      if (this.extensions) {
        result.valueBlock.value.push(this.extensions.toSchema());
      }
      return result;
    }
    toJSON() {
      const result = {
        version: this.version,
        holder: this.holder.toJSON(),
        issuer: this.issuer.toJSON(),
        signature: this.signature.toJSON(),
        serialNumber: this.serialNumber.toJSON(),
        attrCertValidityPeriod: this.attrCertValidityPeriod.toJSON(),
        attributes: Array.from(this.attributes, (o) => o.toJSON())
      };
      if (this.issuerUniqueID) {
        result.issuerUniqueID = this.issuerUniqueID.toJSON();
      }
      if (this.extensions) {
        result.extensions = this.extensions.toJSON();
      }
      return result;
    }
  };
  AttributeCertificateInfoV2.CLASS_NAME = "AttributeCertificateInfoV2";
  var ACINFO = "acinfo";
  var SIGNATURE_ALGORITHM$6 = "signatureAlgorithm";
  var SIGNATURE_VALUE$3 = "signatureValue";
  var CLEAR_PROPS$T = [
    ACINFO,
    SIGNATURE_ALGORITHM$6,
    SIGNATURE_VALUE$3
  ];
  var AttributeCertificateV2 = class _AttributeCertificateV2 extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.acinfo = getParametersValue(parameters, ACINFO, _AttributeCertificateV2.defaultValues(ACINFO));
      this.signatureAlgorithm = getParametersValue(parameters, SIGNATURE_ALGORITHM$6, _AttributeCertificateV2.defaultValues(SIGNATURE_ALGORITHM$6));
      this.signatureValue = getParametersValue(parameters, SIGNATURE_VALUE$3, _AttributeCertificateV2.defaultValues(SIGNATURE_VALUE$3));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case ACINFO:
          return new AttributeCertificateInfoV2();
        case SIGNATURE_ALGORITHM$6:
          return new AlgorithmIdentifier();
        case SIGNATURE_VALUE$3:
          return new BitString();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          AttributeCertificateInfoV2.schema(names.acinfo || {}),
          AlgorithmIdentifier.schema(names.signatureAlgorithm || {}),
          new BitString({ name: names.signatureValue || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$T);
      const asn1 = compareSchema(schema, schema, _AttributeCertificateV2.schema({
        names: {
          acinfo: {
            names: {
              blockName: ACINFO
            }
          },
          signatureAlgorithm: {
            names: {
              blockName: SIGNATURE_ALGORITHM$6
            }
          },
          signatureValue: SIGNATURE_VALUE$3
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.acinfo = new AttributeCertificateInfoV2({ schema: asn1.result.acinfo });
      this.signatureAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.signatureAlgorithm });
      this.signatureValue = asn1.result.signatureValue;
    }
    toSchema() {
      return new Sequence({
        value: [
          this.acinfo.toSchema(),
          this.signatureAlgorithm.toSchema(),
          this.signatureValue
        ]
      });
    }
    toJSON() {
      return {
        acinfo: this.acinfo.toJSON(),
        signatureAlgorithm: this.signatureAlgorithm.toJSON(),
        signatureValue: this.signatureValue.toJSON()
      };
    }
  };
  AttributeCertificateV2.CLASS_NAME = "AttributeCertificateV2";
  var CONTENT_TYPE = "contentType";
  var CONTENT = "content";
  var CLEAR_PROPS$S = [CONTENT_TYPE, CONTENT];
  var ContentInfo = class _ContentInfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.contentType = getParametersValue(parameters, CONTENT_TYPE, _ContentInfo.defaultValues(CONTENT_TYPE));
      this.content = getParametersValue(parameters, CONTENT, _ContentInfo.defaultValues(CONTENT));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case CONTENT_TYPE:
          return EMPTY_STRING2;
        case CONTENT:
          return new Any();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case CONTENT_TYPE:
          return typeof memberValue === "string" && memberValue === this.defaultValues(CONTENT_TYPE);
        case CONTENT:
          return memberValue instanceof Any;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      if ("optional" in names === false) {
        names.optional = false;
      }
      return new Sequence({
        name: names.blockName || "ContentInfo",
        optional: names.optional,
        value: [
          new ObjectIdentifier({ name: names.contentType || CONTENT_TYPE }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [new Any({ name: names.content || CONTENT })]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$S);
      const asn1 = compareSchema(schema, schema, _ContentInfo.schema());
      AsnError.assertSchema(asn1, this.className);
      this.contentType = asn1.result.contentType.valueBlock.toString();
      this.content = asn1.result.content;
    }
    toSchema() {
      return new Sequence({
        value: [
          new ObjectIdentifier({ value: this.contentType }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [this.content]
          })
        ]
      });
    }
    toJSON() {
      const object = {
        contentType: this.contentType
      };
      if (!(this.content instanceof Any)) {
        object.content = this.content.toJSON();
      }
      return object;
    }
  };
  ContentInfo.CLASS_NAME = "ContentInfo";
  ContentInfo.DATA = id_ContentType_Data;
  ContentInfo.SIGNED_DATA = id_ContentType_SignedData;
  ContentInfo.ENVELOPED_DATA = id_ContentType_EnvelopedData;
  ContentInfo.ENCRYPTED_DATA = id_ContentType_EncryptedData;
  var TYPE$1 = "type";
  var VALUE$4 = "value";
  var UTC_TIME_NAME = "utcTimeName";
  var GENERAL_TIME_NAME = "generalTimeName";
  var CLEAR_PROPS$R = [UTC_TIME_NAME, GENERAL_TIME_NAME];
  var TimeType;
  (function(TimeType2) {
    TimeType2[TimeType2["UTCTime"] = 0] = "UTCTime";
    TimeType2[TimeType2["GeneralizedTime"] = 1] = "GeneralizedTime";
    TimeType2[TimeType2["empty"] = 2] = "empty";
  })(TimeType || (TimeType = {}));
  var Time = class _Time extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.type = getParametersValue(parameters, TYPE$1, _Time.defaultValues(TYPE$1));
      this.value = getParametersValue(parameters, VALUE$4, _Time.defaultValues(VALUE$4));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case TYPE$1:
          return 0;
        case VALUE$4:
          return new Date(0, 0, 0);
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}, optional = false) {
      const names = getParametersValue(parameters, "names", {});
      return new Choice({
        optional,
        value: [
          new UTCTime({ name: names.utcTimeName || EMPTY_STRING2 }),
          new GeneralizedTime({ name: names.generalTimeName || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$R);
      const asn1 = compareSchema(schema, schema, _Time.schema({
        names: {
          utcTimeName: UTC_TIME_NAME,
          generalTimeName: GENERAL_TIME_NAME
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (UTC_TIME_NAME in asn1.result) {
        this.type = 0;
        this.value = asn1.result.utcTimeName.toDate();
      }
      if (GENERAL_TIME_NAME in asn1.result) {
        this.type = 1;
        this.value = asn1.result.generalTimeName.toDate();
      }
    }
    toSchema() {
      if (this.type === 0) {
        return new UTCTime({ valueDate: this.value });
      } else if (this.type === 1) {
        return new GeneralizedTime({ valueDate: this.value });
      }
      return {};
    }
    toJSON() {
      return {
        type: this.type,
        value: this.value
      };
    }
  };
  Time.CLASS_NAME = "Time";
  var TBS$4 = "tbs";
  var VERSION$f = "version";
  var SERIAL_NUMBER$3 = "serialNumber";
  var SIGNATURE$4 = "signature";
  var ISSUER$2 = "issuer";
  var NOT_BEFORE = "notBefore";
  var NOT_AFTER = "notAfter";
  var SUBJECT$1 = "subject";
  var SUBJECT_PUBLIC_KEY_INFO = "subjectPublicKeyInfo";
  var ISSUER_UNIQUE_ID = "issuerUniqueID";
  var SUBJECT_UNIQUE_ID = "subjectUniqueID";
  var EXTENSIONS$2 = "extensions";
  var SIGNATURE_ALGORITHM$5 = "signatureAlgorithm";
  var SIGNATURE_VALUE$2 = "signatureValue";
  var TBS_CERTIFICATE = "tbsCertificate";
  var TBS_CERTIFICATE_VERSION = `${TBS_CERTIFICATE}.${VERSION$f}`;
  var TBS_CERTIFICATE_SERIAL_NUMBER = `${TBS_CERTIFICATE}.${SERIAL_NUMBER$3}`;
  var TBS_CERTIFICATE_SIGNATURE = `${TBS_CERTIFICATE}.${SIGNATURE$4}`;
  var TBS_CERTIFICATE_ISSUER = `${TBS_CERTIFICATE}.${ISSUER$2}`;
  var TBS_CERTIFICATE_NOT_BEFORE = `${TBS_CERTIFICATE}.${NOT_BEFORE}`;
  var TBS_CERTIFICATE_NOT_AFTER = `${TBS_CERTIFICATE}.${NOT_AFTER}`;
  var TBS_CERTIFICATE_SUBJECT = `${TBS_CERTIFICATE}.${SUBJECT$1}`;
  var TBS_CERTIFICATE_SUBJECT_PUBLIC_KEY = `${TBS_CERTIFICATE}.${SUBJECT_PUBLIC_KEY_INFO}`;
  var TBS_CERTIFICATE_ISSUER_UNIQUE_ID = `${TBS_CERTIFICATE}.${ISSUER_UNIQUE_ID}`;
  var TBS_CERTIFICATE_SUBJECT_UNIQUE_ID = `${TBS_CERTIFICATE}.${SUBJECT_UNIQUE_ID}`;
  var TBS_CERTIFICATE_EXTENSIONS = `${TBS_CERTIFICATE}.${EXTENSIONS$2}`;
  var CLEAR_PROPS$Q = [
    TBS_CERTIFICATE,
    TBS_CERTIFICATE_VERSION,
    TBS_CERTIFICATE_SERIAL_NUMBER,
    TBS_CERTIFICATE_SIGNATURE,
    TBS_CERTIFICATE_ISSUER,
    TBS_CERTIFICATE_NOT_BEFORE,
    TBS_CERTIFICATE_NOT_AFTER,
    TBS_CERTIFICATE_SUBJECT,
    TBS_CERTIFICATE_SUBJECT_PUBLIC_KEY,
    TBS_CERTIFICATE_ISSUER_UNIQUE_ID,
    TBS_CERTIFICATE_SUBJECT_UNIQUE_ID,
    TBS_CERTIFICATE_EXTENSIONS,
    SIGNATURE_ALGORITHM$5,
    SIGNATURE_VALUE$2
  ];
  function tbsCertificate(parameters = {}) {
    const names = getParametersValue(parameters, "names", {});
    return new Sequence({
      name: names.blockName || TBS_CERTIFICATE,
      value: [
        new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [
            new Integer({ name: names.tbsCertificateVersion || TBS_CERTIFICATE_VERSION })
          ]
        }),
        new Integer({ name: names.tbsCertificateSerialNumber || TBS_CERTIFICATE_SERIAL_NUMBER }),
        AlgorithmIdentifier.schema(names.signature || {
          names: {
            blockName: TBS_CERTIFICATE_SIGNATURE
          }
        }),
        RelativeDistinguishedNames.schema(names.issuer || {
          names: {
            blockName: TBS_CERTIFICATE_ISSUER
          }
        }),
        new Sequence({
          name: names.tbsCertificateValidity || "tbsCertificate.validity",
          value: [
            Time.schema(names.notBefore || {
              names: {
                utcTimeName: TBS_CERTIFICATE_NOT_BEFORE,
                generalTimeName: TBS_CERTIFICATE_NOT_BEFORE
              }
            }),
            Time.schema(names.notAfter || {
              names: {
                utcTimeName: TBS_CERTIFICATE_NOT_AFTER,
                generalTimeName: TBS_CERTIFICATE_NOT_AFTER
              }
            })
          ]
        }),
        RelativeDistinguishedNames.schema(names.subject || {
          names: {
            blockName: TBS_CERTIFICATE_SUBJECT
          }
        }),
        PublicKeyInfo.schema(names.subjectPublicKeyInfo || {
          names: {
            blockName: TBS_CERTIFICATE_SUBJECT_PUBLIC_KEY
          }
        }),
        new Primitive({
          name: names.tbsCertificateIssuerUniqueID || TBS_CERTIFICATE_ISSUER_UNIQUE_ID,
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          }
        }),
        new Primitive({
          name: names.tbsCertificateSubjectUniqueID || TBS_CERTIFICATE_SUBJECT_UNIQUE_ID,
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 2
          }
        }),
        new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 3
          },
          value: [Extensions.schema(names.extensions || {
            names: {
              blockName: TBS_CERTIFICATE_EXTENSIONS
            }
          })]
        })
      ]
    });
  }
  var Certificate = class _Certificate extends PkiObject {
    get tbs() {
      return pvtsutils2.BufferSourceConverter.toArrayBuffer(this.tbsView);
    }
    set tbs(value) {
      this.tbsView = new Uint8Array(value);
    }
    constructor(parameters = {}) {
      super();
      this.tbsView = new Uint8Array(getParametersValue(parameters, TBS$4, _Certificate.defaultValues(TBS$4)));
      this.version = getParametersValue(parameters, VERSION$f, _Certificate.defaultValues(VERSION$f));
      this.serialNumber = getParametersValue(parameters, SERIAL_NUMBER$3, _Certificate.defaultValues(SERIAL_NUMBER$3));
      this.signature = getParametersValue(parameters, SIGNATURE$4, _Certificate.defaultValues(SIGNATURE$4));
      this.issuer = getParametersValue(parameters, ISSUER$2, _Certificate.defaultValues(ISSUER$2));
      this.notBefore = getParametersValue(parameters, NOT_BEFORE, _Certificate.defaultValues(NOT_BEFORE));
      this.notAfter = getParametersValue(parameters, NOT_AFTER, _Certificate.defaultValues(NOT_AFTER));
      this.subject = getParametersValue(parameters, SUBJECT$1, _Certificate.defaultValues(SUBJECT$1));
      this.subjectPublicKeyInfo = getParametersValue(parameters, SUBJECT_PUBLIC_KEY_INFO, _Certificate.defaultValues(SUBJECT_PUBLIC_KEY_INFO));
      if (ISSUER_UNIQUE_ID in parameters) {
        this.issuerUniqueID = getParametersValue(parameters, ISSUER_UNIQUE_ID, _Certificate.defaultValues(ISSUER_UNIQUE_ID));
      }
      if (SUBJECT_UNIQUE_ID in parameters) {
        this.subjectUniqueID = getParametersValue(parameters, SUBJECT_UNIQUE_ID, _Certificate.defaultValues(SUBJECT_UNIQUE_ID));
      }
      if (EXTENSIONS$2 in parameters) {
        this.extensions = getParametersValue(parameters, EXTENSIONS$2, _Certificate.defaultValues(EXTENSIONS$2));
      }
      this.signatureAlgorithm = getParametersValue(parameters, SIGNATURE_ALGORITHM$5, _Certificate.defaultValues(SIGNATURE_ALGORITHM$5));
      this.signatureValue = getParametersValue(parameters, SIGNATURE_VALUE$2, _Certificate.defaultValues(SIGNATURE_VALUE$2));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case TBS$4:
          return EMPTY_BUFFER2;
        case VERSION$f:
          return 0;
        case SERIAL_NUMBER$3:
          return new Integer();
        case SIGNATURE$4:
          return new AlgorithmIdentifier();
        case ISSUER$2:
          return new RelativeDistinguishedNames();
        case NOT_BEFORE:
          return new Time();
        case NOT_AFTER:
          return new Time();
        case SUBJECT$1:
          return new RelativeDistinguishedNames();
        case SUBJECT_PUBLIC_KEY_INFO:
          return new PublicKeyInfo();
        case ISSUER_UNIQUE_ID:
          return EMPTY_BUFFER2;
        case SUBJECT_UNIQUE_ID:
          return EMPTY_BUFFER2;
        case EXTENSIONS$2:
          return [];
        case SIGNATURE_ALGORITHM$5:
          return new AlgorithmIdentifier();
        case SIGNATURE_VALUE$2:
          return new BitString();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          tbsCertificate(names.tbsCertificate),
          AlgorithmIdentifier.schema(names.signatureAlgorithm || {
            names: {
              blockName: SIGNATURE_ALGORITHM$5
            }
          }),
          new BitString({ name: names.signatureValue || SIGNATURE_VALUE$2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$Q);
      const asn1 = compareSchema(schema, schema, _Certificate.schema({
        names: {
          tbsCertificate: {
            names: {
              extensions: {
                names: {
                  extensions: TBS_CERTIFICATE_EXTENSIONS
                }
              }
            }
          }
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.tbsView = asn1.result.tbsCertificate.valueBeforeDecodeView;
      if (TBS_CERTIFICATE_VERSION in asn1.result)
        this.version = asn1.result[TBS_CERTIFICATE_VERSION].valueBlock.valueDec;
      this.serialNumber = asn1.result[TBS_CERTIFICATE_SERIAL_NUMBER];
      this.signature = new AlgorithmIdentifier({ schema: asn1.result[TBS_CERTIFICATE_SIGNATURE] });
      this.issuer = new RelativeDistinguishedNames({ schema: asn1.result[TBS_CERTIFICATE_ISSUER] });
      this.notBefore = new Time({ schema: asn1.result[TBS_CERTIFICATE_NOT_BEFORE] });
      this.notAfter = new Time({ schema: asn1.result[TBS_CERTIFICATE_NOT_AFTER] });
      this.subject = new RelativeDistinguishedNames({ schema: asn1.result[TBS_CERTIFICATE_SUBJECT] });
      this.subjectPublicKeyInfo = new PublicKeyInfo({ schema: asn1.result[TBS_CERTIFICATE_SUBJECT_PUBLIC_KEY] });
      if (TBS_CERTIFICATE_ISSUER_UNIQUE_ID in asn1.result)
        this.issuerUniqueID = asn1.result[TBS_CERTIFICATE_ISSUER_UNIQUE_ID].valueBlock.valueHex;
      if (TBS_CERTIFICATE_SUBJECT_UNIQUE_ID in asn1.result)
        this.subjectUniqueID = asn1.result[TBS_CERTIFICATE_SUBJECT_UNIQUE_ID].valueBlock.valueHex;
      if (TBS_CERTIFICATE_EXTENSIONS in asn1.result)
        this.extensions = Array.from(asn1.result[TBS_CERTIFICATE_EXTENSIONS], (element) => new Extension({ schema: element }));
      this.signatureAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.signatureAlgorithm });
      this.signatureValue = asn1.result.signatureValue;
    }
    encodeTBS() {
      const outputArray = [];
      if (VERSION$f in this && this.version !== _Certificate.defaultValues(VERSION$f)) {
        outputArray.push(new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [
            new Integer({ value: this.version })
          ]
        }));
      }
      outputArray.push(this.serialNumber);
      outputArray.push(this.signature.toSchema());
      outputArray.push(this.issuer.toSchema());
      outputArray.push(new Sequence({
        value: [
          this.notBefore.toSchema(),
          this.notAfter.toSchema()
        ]
      }));
      outputArray.push(this.subject.toSchema());
      outputArray.push(this.subjectPublicKeyInfo.toSchema());
      if (this.issuerUniqueID) {
        outputArray.push(new Primitive({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          valueHex: this.issuerUniqueID
        }));
      }
      if (this.subjectUniqueID) {
        outputArray.push(new Primitive({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 2
          },
          valueHex: this.subjectUniqueID
        }));
      }
      if (this.extensions) {
        outputArray.push(new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 3
          },
          value: [new Sequence({
            value: Array.from(this.extensions, (o) => o.toSchema())
          })]
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toSchema(encodeFlag = false) {
      let tbsSchema;
      if (encodeFlag === false) {
        if (!this.tbsView.byteLength) {
          return _Certificate.schema().value[0];
        }
        const asn1 = fromBER(this.tbsView);
        AsnError.assert(asn1, "TBS Certificate");
        tbsSchema = asn1.result;
      } else {
        tbsSchema = this.encodeTBS();
      }
      return new Sequence({
        value: [
          tbsSchema,
          this.signatureAlgorithm.toSchema(),
          this.signatureValue
        ]
      });
    }
    toJSON() {
      const res = {
        tbs: pvtsutils2.Convert.ToHex(this.tbsView),
        version: this.version,
        serialNumber: this.serialNumber.toJSON(),
        signature: this.signature.toJSON(),
        issuer: this.issuer.toJSON(),
        notBefore: this.notBefore.toJSON(),
        notAfter: this.notAfter.toJSON(),
        subject: this.subject.toJSON(),
        subjectPublicKeyInfo: this.subjectPublicKeyInfo.toJSON(),
        signatureAlgorithm: this.signatureAlgorithm.toJSON(),
        signatureValue: this.signatureValue.toJSON()
      };
      if (VERSION$f in this && this.version !== _Certificate.defaultValues(VERSION$f)) {
        res.version = this.version;
      }
      if (this.issuerUniqueID) {
        res.issuerUniqueID = pvtsutils2.Convert.ToHex(this.issuerUniqueID);
      }
      if (this.subjectUniqueID) {
        res.subjectUniqueID = pvtsutils2.Convert.ToHex(this.subjectUniqueID);
      }
      if (this.extensions) {
        res.extensions = Array.from(this.extensions, (o) => o.toJSON());
      }
      return res;
    }
    async getPublicKey(parameters, crypto2 = getCrypto(true)) {
      return crypto2.getPublicKey(this.subjectPublicKeyInfo, this.signatureAlgorithm, parameters);
    }
    async getKeyHash(hashAlgorithm = "SHA-1", crypto2 = getCrypto(true)) {
      return crypto2.digest({ name: hashAlgorithm }, this.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHexView);
    }
    async sign(privateKey, hashAlgorithm = "SHA-1", crypto2 = getCrypto(true)) {
      if (!privateKey) {
        throw new Error("Need to provide a private key for signing");
      }
      const signatureParameters = await crypto2.getSignatureParameters(privateKey, hashAlgorithm);
      const parameters = signatureParameters.parameters;
      this.signature = signatureParameters.signatureAlgorithm;
      this.signatureAlgorithm = signatureParameters.signatureAlgorithm;
      this.tbsView = new Uint8Array(this.encodeTBS().toBER());
      const signature = await crypto2.signWithPrivateKey(this.tbsView, privateKey, parameters);
      this.signatureValue = new BitString({ valueHex: signature });
    }
    async verify(issuerCertificate, crypto2 = getCrypto(true)) {
      let subjectPublicKeyInfo;
      if (issuerCertificate) {
        subjectPublicKeyInfo = issuerCertificate.subjectPublicKeyInfo;
      } else if (this.issuer.isEqual(this.subject)) {
        subjectPublicKeyInfo = this.subjectPublicKeyInfo;
      }
      if (!(subjectPublicKeyInfo instanceof PublicKeyInfo)) {
        throw new Error("Please provide issuer certificate as a parameter");
      }
      return crypto2.verifyWithPublicKey(this.tbsView, this.signatureValue, subjectPublicKeyInfo, this.signatureAlgorithm);
    }
  };
  Certificate.CLASS_NAME = "Certificate";
  function checkCA(cert, signerCert = null) {
    if (signerCert && cert.issuer.isEqual(signerCert.issuer) && cert.serialNumber.isEqual(signerCert.serialNumber)) {
      return null;
    }
    let isCA = false;
    if (cert.extensions) {
      for (const extension of cert.extensions) {
        if (extension.extnID === id_BasicConstraints && extension.parsedValue instanceof BasicConstraints) {
          if (extension.parsedValue.cA) {
            isCA = true;
            break;
          }
        }
      }
    }
    if (isCA) {
      return cert;
    }
    return null;
  }
  var CERT_ID$1 = "certId";
  var CERT_VALUE = "certValue";
  var PARSED_VALUE$4 = "parsedValue";
  var CLEAR_PROPS$P = [
    CERT_ID$1,
    CERT_VALUE
  ];
  var CertBag = class _CertBag extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.certId = getParametersValue(parameters, CERT_ID$1, _CertBag.defaultValues(CERT_ID$1));
      this.certValue = getParametersValue(parameters, CERT_VALUE, _CertBag.defaultValues(CERT_VALUE));
      if (PARSED_VALUE$4 in parameters) {
        this.parsedValue = getParametersValue(parameters, PARSED_VALUE$4, _CertBag.defaultValues(PARSED_VALUE$4));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case CERT_ID$1:
          return EMPTY_STRING2;
        case CERT_VALUE:
          return new Any();
        case PARSED_VALUE$4:
          return {};
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case CERT_ID$1:
          return memberValue === EMPTY_STRING2;
        case CERT_VALUE:
          return memberValue instanceof Any;
        case PARSED_VALUE$4:
          return memberValue instanceof Object && Object.keys(memberValue).length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.id || "id" }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [new Any({ name: names.value || "value" })]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$P);
      const asn1 = compareSchema(schema, schema, _CertBag.schema({
        names: {
          id: CERT_ID$1,
          value: CERT_VALUE
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.certId = asn1.result.certId.valueBlock.toString();
      this.certValue = asn1.result.certValue;
      const certValueHex = this.certValue.valueBlock.valueHexView;
      switch (this.certId) {
        case id_CertBag_X509Certificate:
          {
            try {
              this.parsedValue = Certificate.fromBER(certValueHex);
            } catch {
              AttributeCertificateV2.fromBER(certValueHex);
            }
          }
          break;
        case id_CertBag_AttributeCertificate:
          {
            this.parsedValue = AttributeCertificateV2.fromBER(certValueHex);
          }
          break;
        case id_CertBag_SDSICertificate:
        default:
          throw new Error(`Incorrect CERT_ID value in CertBag: ${this.certId}`);
      }
    }
    toSchema() {
      if (PARSED_VALUE$4 in this) {
        if ("acinfo" in this.parsedValue) {
          this.certId = id_CertBag_AttributeCertificate;
        } else {
          this.certId = id_CertBag_X509Certificate;
        }
        this.certValue = new OctetString({ valueHex: this.parsedValue.toSchema().toBER(false) });
      }
      return new Sequence({
        value: [
          new ObjectIdentifier({ value: this.certId }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: ["toSchema" in this.certValue ? this.certValue.toSchema() : this.certValue]
          })
        ]
      });
    }
    toJSON() {
      return {
        certId: this.certId,
        certValue: this.certValue.toJSON()
      };
    }
  };
  CertBag.CLASS_NAME = "CertBag";
  var USER_CERTIFICATE = "userCertificate";
  var REVOCATION_DATE = "revocationDate";
  var CRL_ENTRY_EXTENSIONS = "crlEntryExtensions";
  var CLEAR_PROPS$O = [
    USER_CERTIFICATE,
    REVOCATION_DATE,
    CRL_ENTRY_EXTENSIONS
  ];
  var RevokedCertificate = class _RevokedCertificate extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.userCertificate = getParametersValue(parameters, USER_CERTIFICATE, _RevokedCertificate.defaultValues(USER_CERTIFICATE));
      this.revocationDate = getParametersValue(parameters, REVOCATION_DATE, _RevokedCertificate.defaultValues(REVOCATION_DATE));
      if (CRL_ENTRY_EXTENSIONS in parameters) {
        this.crlEntryExtensions = getParametersValue(parameters, CRL_ENTRY_EXTENSIONS, _RevokedCertificate.defaultValues(CRL_ENTRY_EXTENSIONS));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case USER_CERTIFICATE:
          return new Integer();
        case REVOCATION_DATE:
          return new Time();
        case CRL_ENTRY_EXTENSIONS:
          return new Extensions();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Integer({ name: names.userCertificate || USER_CERTIFICATE }),
          Time.schema({
            names: {
              utcTimeName: names.revocationDate || REVOCATION_DATE,
              generalTimeName: names.revocationDate || REVOCATION_DATE
            }
          }),
          Extensions.schema({
            names: {
              blockName: names.crlEntryExtensions || CRL_ENTRY_EXTENSIONS
            }
          }, true)
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$O);
      const asn1 = compareSchema(schema, schema, _RevokedCertificate.schema());
      AsnError.assertSchema(asn1, this.className);
      this.userCertificate = asn1.result.userCertificate;
      this.revocationDate = new Time({ schema: asn1.result.revocationDate });
      if (CRL_ENTRY_EXTENSIONS in asn1.result) {
        this.crlEntryExtensions = new Extensions({ schema: asn1.result.crlEntryExtensions });
      }
    }
    toSchema() {
      const outputArray = [
        this.userCertificate,
        this.revocationDate.toSchema()
      ];
      if (this.crlEntryExtensions) {
        outputArray.push(this.crlEntryExtensions.toSchema());
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        userCertificate: this.userCertificate.toJSON(),
        revocationDate: this.revocationDate.toJSON()
      };
      if (this.crlEntryExtensions) {
        res.crlEntryExtensions = this.crlEntryExtensions.toJSON();
      }
      return res;
    }
  };
  RevokedCertificate.CLASS_NAME = "RevokedCertificate";
  var TBS$3 = "tbs";
  var VERSION$e = "version";
  var SIGNATURE$3 = "signature";
  var ISSUER$1 = "issuer";
  var THIS_UPDATE$1 = "thisUpdate";
  var NEXT_UPDATE$1 = "nextUpdate";
  var REVOKED_CERTIFICATES = "revokedCertificates";
  var CRL_EXTENSIONS = "crlExtensions";
  var SIGNATURE_ALGORITHM$4 = "signatureAlgorithm";
  var SIGNATURE_VALUE$1 = "signatureValue";
  var TBS_CERT_LIST = "tbsCertList";
  var TBS_CERT_LIST_VERSION = `${TBS_CERT_LIST}.version`;
  var TBS_CERT_LIST_SIGNATURE = `${TBS_CERT_LIST}.signature`;
  var TBS_CERT_LIST_ISSUER = `${TBS_CERT_LIST}.issuer`;
  var TBS_CERT_LIST_THIS_UPDATE = `${TBS_CERT_LIST}.thisUpdate`;
  var TBS_CERT_LIST_NEXT_UPDATE = `${TBS_CERT_LIST}.nextUpdate`;
  var TBS_CERT_LIST_REVOKED_CERTIFICATES = `${TBS_CERT_LIST}.revokedCertificates`;
  var TBS_CERT_LIST_EXTENSIONS = `${TBS_CERT_LIST}.extensions`;
  var CLEAR_PROPS$N = [
    TBS_CERT_LIST,
    TBS_CERT_LIST_VERSION,
    TBS_CERT_LIST_SIGNATURE,
    TBS_CERT_LIST_ISSUER,
    TBS_CERT_LIST_THIS_UPDATE,
    TBS_CERT_LIST_NEXT_UPDATE,
    TBS_CERT_LIST_REVOKED_CERTIFICATES,
    TBS_CERT_LIST_EXTENSIONS,
    SIGNATURE_ALGORITHM$4,
    SIGNATURE_VALUE$1
  ];
  function tbsCertList(parameters = {}) {
    const names = getParametersValue(parameters, "names", {});
    return new Sequence({
      name: names.blockName || TBS_CERT_LIST,
      value: [
        new Integer({
          optional: true,
          name: names.tbsCertListVersion || TBS_CERT_LIST_VERSION,
          value: 2
        }),
        AlgorithmIdentifier.schema(names.signature || {
          names: {
            blockName: TBS_CERT_LIST_SIGNATURE
          }
        }),
        RelativeDistinguishedNames.schema(names.issuer || {
          names: {
            blockName: TBS_CERT_LIST_ISSUER
          }
        }),
        Time.schema(names.tbsCertListThisUpdate || {
          names: {
            utcTimeName: TBS_CERT_LIST_THIS_UPDATE,
            generalTimeName: TBS_CERT_LIST_THIS_UPDATE
          }
        }),
        Time.schema(names.tbsCertListNextUpdate || {
          names: {
            utcTimeName: TBS_CERT_LIST_NEXT_UPDATE,
            generalTimeName: TBS_CERT_LIST_NEXT_UPDATE
          }
        }, true),
        new Sequence({
          optional: true,
          value: [
            new Repeated({
              name: names.tbsCertListRevokedCertificates || TBS_CERT_LIST_REVOKED_CERTIFICATES,
              value: new Sequence({
                value: [
                  new Integer(),
                  Time.schema(),
                  Extensions.schema({}, true)
                ]
              })
            })
          ]
        }),
        new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [Extensions.schema(names.crlExtensions || {
            names: {
              blockName: TBS_CERT_LIST_EXTENSIONS
            }
          })]
        })
      ]
    });
  }
  var WELL_KNOWN_EXTENSIONS = [
    id_AuthorityKeyIdentifier,
    id_IssuerAltName,
    id_CRLNumber,
    id_BaseCRLNumber,
    id_IssuingDistributionPoint,
    id_FreshestCRL,
    id_AuthorityInfoAccess,
    id_CRLReason,
    id_InvalidityDate,
    id_CertificateIssuer
  ];
  var CertificateRevocationList = class _CertificateRevocationList extends PkiObject {
    get tbs() {
      return pvtsutils2.BufferSourceConverter.toArrayBuffer(this.tbsView);
    }
    set tbs(value) {
      this.tbsView = new Uint8Array(value);
    }
    constructor(parameters = {}) {
      super();
      this.tbsView = new Uint8Array(getParametersValue(parameters, TBS$3, _CertificateRevocationList.defaultValues(TBS$3)));
      this.version = getParametersValue(parameters, VERSION$e, _CertificateRevocationList.defaultValues(VERSION$e));
      this.signature = getParametersValue(parameters, SIGNATURE$3, _CertificateRevocationList.defaultValues(SIGNATURE$3));
      this.issuer = getParametersValue(parameters, ISSUER$1, _CertificateRevocationList.defaultValues(ISSUER$1));
      this.thisUpdate = getParametersValue(parameters, THIS_UPDATE$1, _CertificateRevocationList.defaultValues(THIS_UPDATE$1));
      if (NEXT_UPDATE$1 in parameters) {
        this.nextUpdate = getParametersValue(parameters, NEXT_UPDATE$1, _CertificateRevocationList.defaultValues(NEXT_UPDATE$1));
      }
      if (REVOKED_CERTIFICATES in parameters) {
        this.revokedCertificates = getParametersValue(parameters, REVOKED_CERTIFICATES, _CertificateRevocationList.defaultValues(REVOKED_CERTIFICATES));
      }
      if (CRL_EXTENSIONS in parameters) {
        this.crlExtensions = getParametersValue(parameters, CRL_EXTENSIONS, _CertificateRevocationList.defaultValues(CRL_EXTENSIONS));
      }
      this.signatureAlgorithm = getParametersValue(parameters, SIGNATURE_ALGORITHM$4, _CertificateRevocationList.defaultValues(SIGNATURE_ALGORITHM$4));
      this.signatureValue = getParametersValue(parameters, SIGNATURE_VALUE$1, _CertificateRevocationList.defaultValues(SIGNATURE_VALUE$1));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case TBS$3:
          return EMPTY_BUFFER2;
        case VERSION$e:
          return 0;
        case SIGNATURE$3:
          return new AlgorithmIdentifier();
        case ISSUER$1:
          return new RelativeDistinguishedNames();
        case THIS_UPDATE$1:
          return new Time();
        case NEXT_UPDATE$1:
          return new Time();
        case REVOKED_CERTIFICATES:
          return [];
        case CRL_EXTENSIONS:
          return new Extensions();
        case SIGNATURE_ALGORITHM$4:
          return new AlgorithmIdentifier();
        case SIGNATURE_VALUE$1:
          return new BitString();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || "CertificateList",
        value: [
          tbsCertList(parameters),
          AlgorithmIdentifier.schema(names.signatureAlgorithm || {
            names: {
              blockName: SIGNATURE_ALGORITHM$4
            }
          }),
          new BitString({ name: names.signatureValue || SIGNATURE_VALUE$1 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$N);
      const asn1 = compareSchema(schema, schema, _CertificateRevocationList.schema());
      AsnError.assertSchema(asn1, this.className);
      this.tbsView = asn1.result.tbsCertList.valueBeforeDecodeView;
      if (TBS_CERT_LIST_VERSION in asn1.result) {
        this.version = asn1.result[TBS_CERT_LIST_VERSION].valueBlock.valueDec;
      }
      this.signature = new AlgorithmIdentifier({ schema: asn1.result[TBS_CERT_LIST_SIGNATURE] });
      this.issuer = new RelativeDistinguishedNames({ schema: asn1.result[TBS_CERT_LIST_ISSUER] });
      this.thisUpdate = new Time({ schema: asn1.result[TBS_CERT_LIST_THIS_UPDATE] });
      if (TBS_CERT_LIST_NEXT_UPDATE in asn1.result) {
        this.nextUpdate = new Time({ schema: asn1.result[TBS_CERT_LIST_NEXT_UPDATE] });
      }
      if (TBS_CERT_LIST_REVOKED_CERTIFICATES in asn1.result) {
        this.revokedCertificates = Array.from(asn1.result[TBS_CERT_LIST_REVOKED_CERTIFICATES], (element) => new RevokedCertificate({ schema: element }));
      }
      if (TBS_CERT_LIST_EXTENSIONS in asn1.result) {
        this.crlExtensions = new Extensions({ schema: asn1.result[TBS_CERT_LIST_EXTENSIONS] });
      }
      this.signatureAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.signatureAlgorithm });
      this.signatureValue = asn1.result.signatureValue;
    }
    encodeTBS() {
      const outputArray = [];
      if (this.version !== _CertificateRevocationList.defaultValues(VERSION$e)) {
        outputArray.push(new Integer({ value: this.version }));
      }
      outputArray.push(this.signature.toSchema());
      outputArray.push(this.issuer.toSchema());
      outputArray.push(this.thisUpdate.toSchema());
      if (this.nextUpdate) {
        outputArray.push(this.nextUpdate.toSchema());
      }
      if (this.revokedCertificates) {
        outputArray.push(new Sequence({
          value: Array.from(this.revokedCertificates, (o) => o.toSchema())
        }));
      }
      if (this.crlExtensions) {
        outputArray.push(new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [
            this.crlExtensions.toSchema()
          ]
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toSchema(encodeFlag = false) {
      let tbsSchema;
      if (!encodeFlag) {
        if (!this.tbsView.byteLength) {
          return _CertificateRevocationList.schema();
        }
        const asn1 = fromBER(this.tbsView);
        AsnError.assert(asn1, "TBS Certificate Revocation List");
        tbsSchema = asn1.result;
      } else {
        tbsSchema = this.encodeTBS();
      }
      return new Sequence({
        value: [
          tbsSchema,
          this.signatureAlgorithm.toSchema(),
          this.signatureValue
        ]
      });
    }
    toJSON() {
      const res = {
        tbs: pvtsutils2.Convert.ToHex(this.tbsView),
        version: this.version,
        signature: this.signature.toJSON(),
        issuer: this.issuer.toJSON(),
        thisUpdate: this.thisUpdate.toJSON(),
        signatureAlgorithm: this.signatureAlgorithm.toJSON(),
        signatureValue: this.signatureValue.toJSON()
      };
      if (this.version !== _CertificateRevocationList.defaultValues(VERSION$e))
        res.version = this.version;
      if (this.nextUpdate) {
        res.nextUpdate = this.nextUpdate.toJSON();
      }
      if (this.revokedCertificates) {
        res.revokedCertificates = Array.from(this.revokedCertificates, (o) => o.toJSON());
      }
      if (this.crlExtensions) {
        res.crlExtensions = this.crlExtensions.toJSON();
      }
      return res;
    }
    isCertificateRevoked(certificate) {
      if (!this.issuer.isEqual(certificate.issuer)) {
        return false;
      }
      if (!this.revokedCertificates) {
        return false;
      }
      for (const revokedCertificate of this.revokedCertificates) {
        if (revokedCertificate.userCertificate.isEqual(certificate.serialNumber)) {
          return true;
        }
      }
      return false;
    }
    async sign(privateKey, hashAlgorithm = "SHA-1", crypto2 = getCrypto(true)) {
      if (!privateKey) {
        throw new Error("Need to provide a private key for signing");
      }
      const signatureParameters = await crypto2.getSignatureParameters(privateKey, hashAlgorithm);
      const { parameters } = signatureParameters;
      this.signature = signatureParameters.signatureAlgorithm;
      this.signatureAlgorithm = signatureParameters.signatureAlgorithm;
      this.tbsView = new Uint8Array(this.encodeTBS().toBER());
      const signature = await crypto2.signWithPrivateKey(this.tbsView, privateKey, parameters);
      this.signatureValue = new BitString({ valueHex: signature });
    }
    async verify(parameters = {}, crypto2 = getCrypto(true)) {
      let subjectPublicKeyInfo;
      if (parameters.issuerCertificate) {
        subjectPublicKeyInfo = parameters.issuerCertificate.subjectPublicKeyInfo;
        if (!this.issuer.isEqual(parameters.issuerCertificate.subject)) {
          return false;
        }
      }
      if (parameters.publicKeyInfo) {
        subjectPublicKeyInfo = parameters.publicKeyInfo;
      }
      if (!subjectPublicKeyInfo) {
        throw new Error("Issuer's certificate must be provided as an input parameter");
      }
      if (this.crlExtensions) {
        for (const extension of this.crlExtensions.extensions) {
          if (extension.critical) {
            if (!WELL_KNOWN_EXTENSIONS.includes(extension.extnID))
              return false;
          }
        }
      }
      return crypto2.verifyWithPublicKey(this.tbsView, this.signatureValue, subjectPublicKeyInfo, this.signatureAlgorithm);
    }
  };
  CertificateRevocationList.CLASS_NAME = "CertificateRevocationList";
  var CRL_ID = "crlId";
  var CRL_VALUE = "crlValue";
  var PARSED_VALUE$3 = "parsedValue";
  var CLEAR_PROPS$M = [
    CRL_ID,
    CRL_VALUE
  ];
  var CRLBag = class _CRLBag extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.crlId = getParametersValue(parameters, CRL_ID, _CRLBag.defaultValues(CRL_ID));
      this.crlValue = getParametersValue(parameters, CRL_VALUE, _CRLBag.defaultValues(CRL_VALUE));
      if (PARSED_VALUE$3 in parameters) {
        this.parsedValue = getParametersValue(parameters, PARSED_VALUE$3, _CRLBag.defaultValues(PARSED_VALUE$3));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case CRL_ID:
          return EMPTY_STRING2;
        case CRL_VALUE:
          return new Any();
        case PARSED_VALUE$3:
          return {};
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case CRL_ID:
          return memberValue === EMPTY_STRING2;
        case CRL_VALUE:
          return memberValue instanceof Any;
        case PARSED_VALUE$3:
          return memberValue instanceof Object && Object.keys(memberValue).length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.id || "id" }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [new Any({ name: names.value || "value" })]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$M);
      const asn1 = compareSchema(schema, schema, _CRLBag.schema({
        names: {
          id: CRL_ID,
          value: CRL_VALUE
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.crlId = asn1.result.crlId.valueBlock.toString();
      this.crlValue = asn1.result.crlValue;
      switch (this.crlId) {
        case id_CRLBag_X509CRL:
          {
            this.parsedValue = CertificateRevocationList.fromBER(this.certValue.valueBlock.valueHex);
          }
          break;
        default:
          throw new Error(`Incorrect CRL_ID value in CRLBag: ${this.crlId}`);
      }
    }
    toSchema() {
      if (this.parsedValue) {
        this.crlId = id_CRLBag_X509CRL;
        this.crlValue = new OctetString({ valueHex: this.parsedValue.toSchema().toBER(false) });
      }
      return new Sequence({
        value: [
          new ObjectIdentifier({ value: this.crlId }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [this.crlValue.toSchema()]
          })
        ]
      });
    }
    toJSON() {
      return {
        crlId: this.crlId,
        crlValue: this.crlValue.toJSON()
      };
    }
  };
  CRLBag.CLASS_NAME = "CRLBag";
  var VERSION$d = "version";
  var ENCRYPTED_CONTENT_INFO$1 = "encryptedContentInfo";
  var UNPROTECTED_ATTRS$1 = "unprotectedAttrs";
  var CLEAR_PROPS$L = [
    VERSION$d,
    ENCRYPTED_CONTENT_INFO$1,
    UNPROTECTED_ATTRS$1
  ];
  var EncryptedData = class _EncryptedData extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.version = getParametersValue(parameters, VERSION$d, _EncryptedData.defaultValues(VERSION$d));
      this.encryptedContentInfo = getParametersValue(parameters, ENCRYPTED_CONTENT_INFO$1, _EncryptedData.defaultValues(ENCRYPTED_CONTENT_INFO$1));
      if (UNPROTECTED_ATTRS$1 in parameters) {
        this.unprotectedAttrs = getParametersValue(parameters, UNPROTECTED_ATTRS$1, _EncryptedData.defaultValues(UNPROTECTED_ATTRS$1));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VERSION$d:
          return 0;
        case ENCRYPTED_CONTENT_INFO$1:
          return new EncryptedContentInfo();
        case UNPROTECTED_ATTRS$1:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case VERSION$d:
          return memberValue === 0;
        case ENCRYPTED_CONTENT_INFO$1:
          return EncryptedContentInfo.compareWithDefault("contentType", memberValue.contentType) && EncryptedContentInfo.compareWithDefault("contentEncryptionAlgorithm", memberValue.contentEncryptionAlgorithm) && EncryptedContentInfo.compareWithDefault("encryptedContent", memberValue.encryptedContent);
        case UNPROTECTED_ATTRS$1:
          return memberValue.length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Integer({ name: names.version || EMPTY_STRING2 }),
          EncryptedContentInfo.schema(names.encryptedContentInfo || {}),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: [
              new Repeated({
                name: names.unprotectedAttrs || EMPTY_STRING2,
                value: Attribute.schema()
              })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$L);
      const asn1 = compareSchema(schema, schema, _EncryptedData.schema({
        names: {
          version: VERSION$d,
          encryptedContentInfo: {
            names: {
              blockName: ENCRYPTED_CONTENT_INFO$1
            }
          },
          unprotectedAttrs: UNPROTECTED_ATTRS$1
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.version = asn1.result.version.valueBlock.valueDec;
      this.encryptedContentInfo = new EncryptedContentInfo({ schema: asn1.result.encryptedContentInfo });
      if (UNPROTECTED_ATTRS$1 in asn1.result)
        this.unprotectedAttrs = Array.from(asn1.result.unprotectedAttrs, (element) => new Attribute({ schema: element }));
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(new Integer({ value: this.version }));
      outputArray.push(this.encryptedContentInfo.toSchema());
      if (this.unprotectedAttrs) {
        outputArray.push(new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          value: Array.from(this.unprotectedAttrs, (o) => o.toSchema())
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        version: this.version,
        encryptedContentInfo: this.encryptedContentInfo.toJSON()
      };
      if (this.unprotectedAttrs)
        res.unprotectedAttrs = Array.from(this.unprotectedAttrs, (o) => o.toJSON());
      return res;
    }
    async encrypt(parameters, crypto2 = getCrypto(true)) {
      ArgumentError.assert(parameters, "parameters", "object");
      const encryptParams = {
        ...parameters,
        contentType: "1.2.840.113549.1.7.1"
      };
      this.encryptedContentInfo = await crypto2.encryptEncryptedContentInfo(encryptParams);
    }
    async decrypt(parameters, crypto2 = getCrypto(true)) {
      ArgumentError.assert(parameters, "parameters", "object");
      const decryptParams = {
        ...parameters,
        encryptedContentInfo: this.encryptedContentInfo
      };
      return crypto2.decryptEncryptedContentInfo(decryptParams);
    }
  };
  EncryptedData.CLASS_NAME = "EncryptedData";
  var ENCRYPTION_ALGORITHM = "encryptionAlgorithm";
  var ENCRYPTED_DATA = "encryptedData";
  var PARSED_VALUE$2 = "parsedValue";
  var CLEAR_PROPS$K = [
    ENCRYPTION_ALGORITHM,
    ENCRYPTED_DATA
  ];
  var PKCS8ShroudedKeyBag = class _PKCS8ShroudedKeyBag extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.encryptionAlgorithm = getParametersValue(parameters, ENCRYPTION_ALGORITHM, _PKCS8ShroudedKeyBag.defaultValues(ENCRYPTION_ALGORITHM));
      this.encryptedData = getParametersValue(parameters, ENCRYPTED_DATA, _PKCS8ShroudedKeyBag.defaultValues(ENCRYPTED_DATA));
      if (PARSED_VALUE$2 in parameters) {
        this.parsedValue = getParametersValue(parameters, PARSED_VALUE$2, _PKCS8ShroudedKeyBag.defaultValues(PARSED_VALUE$2));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case ENCRYPTION_ALGORITHM:
          return new AlgorithmIdentifier();
        case ENCRYPTED_DATA:
          return new OctetString();
        case PARSED_VALUE$2:
          return {};
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case ENCRYPTION_ALGORITHM:
          return AlgorithmIdentifier.compareWithDefault("algorithmId", memberValue.algorithmId) && "algorithmParams" in memberValue === false;
        case ENCRYPTED_DATA:
          return memberValue.isEqual(_PKCS8ShroudedKeyBag.defaultValues(memberName));
        case PARSED_VALUE$2:
          return memberValue instanceof Object && Object.keys(memberValue).length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          AlgorithmIdentifier.schema(names.encryptionAlgorithm || {
            names: {
              blockName: ENCRYPTION_ALGORITHM
            }
          }),
          new Choice({
            value: [
              new OctetString({ name: names.encryptedData || ENCRYPTED_DATA }),
              new OctetString({
                idBlock: {
                  isConstructed: true
                },
                name: names.encryptedData || ENCRYPTED_DATA
              })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$K);
      const asn1 = compareSchema(schema, schema, _PKCS8ShroudedKeyBag.schema({
        names: {
          encryptionAlgorithm: {
            names: {
              blockName: ENCRYPTION_ALGORITHM
            }
          },
          encryptedData: ENCRYPTED_DATA
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.encryptionAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.encryptionAlgorithm });
      this.encryptedData = asn1.result.encryptedData;
    }
    toSchema() {
      return new Sequence({
        value: [
          this.encryptionAlgorithm.toSchema(),
          this.encryptedData
        ]
      });
    }
    toJSON() {
      return {
        encryptionAlgorithm: this.encryptionAlgorithm.toJSON(),
        encryptedData: this.encryptedData.toJSON()
      };
    }
    async parseInternalValues(parameters, crypto2 = getCrypto(true)) {
      const cmsEncrypted = new EncryptedData({
        encryptedContentInfo: new EncryptedContentInfo({
          contentEncryptionAlgorithm: this.encryptionAlgorithm,
          encryptedContent: this.encryptedData
        })
      });
      const decryptedData = await cmsEncrypted.decrypt(parameters, crypto2);
      this.parsedValue = PrivateKeyInfo.fromBER(decryptedData);
    }
    async makeInternalValues(parameters, crypto2 = getCrypto(true)) {
      if (!this.parsedValue) {
        throw new Error('Please initialize "parsedValue" first');
      }
      const cmsEncrypted = new EncryptedData();
      const encryptParams = {
        ...parameters,
        contentToEncrypt: this.parsedValue.toSchema().toBER(false)
      };
      await cmsEncrypted.encrypt(encryptParams, crypto2);
      if (!cmsEncrypted.encryptedContentInfo.encryptedContent) {
        throw new Error("The filed `encryptedContent` in EncryptedContentInfo is empty");
      }
      this.encryptionAlgorithm = cmsEncrypted.encryptedContentInfo.contentEncryptionAlgorithm;
      this.encryptedData = cmsEncrypted.encryptedContentInfo.encryptedContent;
    }
  };
  PKCS8ShroudedKeyBag.CLASS_NAME = "PKCS8ShroudedKeyBag";
  var SECRET_TYPE_ID = "secretTypeId";
  var SECRET_VALUE = "secretValue";
  var CLEAR_PROPS$J = [
    SECRET_TYPE_ID,
    SECRET_VALUE
  ];
  var SecretBag = class _SecretBag extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.secretTypeId = getParametersValue(parameters, SECRET_TYPE_ID, _SecretBag.defaultValues(SECRET_TYPE_ID));
      this.secretValue = getParametersValue(parameters, SECRET_VALUE, _SecretBag.defaultValues(SECRET_VALUE));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case SECRET_TYPE_ID:
          return EMPTY_STRING2;
        case SECRET_VALUE:
          return new Any();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case SECRET_TYPE_ID:
          return memberValue === EMPTY_STRING2;
        case SECRET_VALUE:
          return memberValue instanceof Any;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.id || "id" }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [new Any({ name: names.value || "value" })]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$J);
      const asn1 = compareSchema(schema, schema, _SecretBag.schema({
        names: {
          id: SECRET_TYPE_ID,
          value: SECRET_VALUE
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.secretTypeId = asn1.result.secretTypeId.valueBlock.toString();
      this.secretValue = asn1.result.secretValue;
    }
    toSchema() {
      return new Sequence({
        value: [
          new ObjectIdentifier({ value: this.secretTypeId }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [this.secretValue.toSchema()]
          })
        ]
      });
    }
    toJSON() {
      return {
        secretTypeId: this.secretTypeId,
        secretValue: this.secretValue.toJSON()
      };
    }
  };
  SecretBag.CLASS_NAME = "SecretBag";
  var SafeBagValueFactory = class _SafeBagValueFactory {
    static getItems() {
      if (!this.items) {
        this.items = {};
        _SafeBagValueFactory.register("1.2.840.113549.1.12.10.1.1", PrivateKeyInfo);
        _SafeBagValueFactory.register("1.2.840.113549.1.12.10.1.2", PKCS8ShroudedKeyBag);
        _SafeBagValueFactory.register("1.2.840.113549.1.12.10.1.3", CertBag);
        _SafeBagValueFactory.register("1.2.840.113549.1.12.10.1.4", CRLBag);
        _SafeBagValueFactory.register("1.2.840.113549.1.12.10.1.5", SecretBag);
        _SafeBagValueFactory.register("1.2.840.113549.1.12.10.1.6", SafeContents);
      }
      return this.items;
    }
    static register(id, type) {
      this.getItems()[id] = type;
    }
    static find(id) {
      return this.getItems()[id] || null;
    }
  };
  var BAG_ID = "bagId";
  var BAG_VALUE = "bagValue";
  var BAG_ATTRIBUTES = "bagAttributes";
  var CLEAR_PROPS$I = [
    BAG_ID,
    BAG_VALUE,
    BAG_ATTRIBUTES
  ];
  var SafeBag = class _SafeBag extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.bagId = getParametersValue(parameters, BAG_ID, _SafeBag.defaultValues(BAG_ID));
      this.bagValue = getParametersValue(parameters, BAG_VALUE, _SafeBag.defaultValues(BAG_VALUE));
      if (BAG_ATTRIBUTES in parameters) {
        this.bagAttributes = getParametersValue(parameters, BAG_ATTRIBUTES, _SafeBag.defaultValues(BAG_ATTRIBUTES));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case BAG_ID:
          return EMPTY_STRING2;
        case BAG_VALUE:
          return new Any();
        case BAG_ATTRIBUTES:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case BAG_ID:
          return memberValue === EMPTY_STRING2;
        case BAG_VALUE:
          return memberValue instanceof Any;
        case BAG_ATTRIBUTES:
          return memberValue.length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.bagId || BAG_ID }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [new Any({ name: names.bagValue || BAG_VALUE })]
          }),
          new Set({
            optional: true,
            value: [
              new Repeated({
                name: names.bagAttributes || BAG_ATTRIBUTES,
                value: Attribute.schema()
              })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$I);
      const asn1 = compareSchema(schema, schema, _SafeBag.schema({
        names: {
          bagId: BAG_ID,
          bagValue: BAG_VALUE,
          bagAttributes: BAG_ATTRIBUTES
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.bagId = asn1.result.bagId.valueBlock.toString();
      const bagType = SafeBagValueFactory.find(this.bagId);
      if (!bagType) {
        throw new Error(`Invalid BAG_ID for SafeBag: ${this.bagId}`);
      }
      this.bagValue = new bagType({ schema: asn1.result.bagValue });
      if (BAG_ATTRIBUTES in asn1.result) {
        this.bagAttributes = Array.from(asn1.result.bagAttributes, (element) => new Attribute({ schema: element }));
      }
    }
    toSchema() {
      const outputArray = [
        new ObjectIdentifier({ value: this.bagId }),
        new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [this.bagValue.toSchema()]
        })
      ];
      if (this.bagAttributes) {
        outputArray.push(new Set({
          value: Array.from(this.bagAttributes, (o) => o.toSchema())
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const output2 = {
        bagId: this.bagId,
        bagValue: this.bagValue.toJSON()
      };
      if (this.bagAttributes) {
        output2.bagAttributes = Array.from(this.bagAttributes, (o) => o.toJSON());
      }
      return output2;
    }
  };
  SafeBag.CLASS_NAME = "SafeBag";
  var SAFE_BUGS = "safeBags";
  var SafeContents = class _SafeContents extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.safeBags = getParametersValue(parameters, SAFE_BUGS, _SafeContents.defaultValues(SAFE_BUGS));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case SAFE_BUGS:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case SAFE_BUGS:
          return memberValue.length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Repeated({
            name: names.safeBags || EMPTY_STRING2,
            value: SafeBag.schema()
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, [
        SAFE_BUGS
      ]);
      const asn1 = compareSchema(schema, schema, _SafeContents.schema({
        names: {
          safeBags: SAFE_BUGS
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.safeBags = Array.from(asn1.result.safeBags, (element) => new SafeBag({ schema: element }));
    }
    toSchema() {
      return new Sequence({
        value: Array.from(this.safeBags, (o) => o.toSchema())
      });
    }
    toJSON() {
      return {
        safeBags: Array.from(this.safeBags, (o) => o.toJSON())
      };
    }
  };
  SafeContents.CLASS_NAME = "SafeContents";
  var OTHER_CERT_FORMAT = "otherCertFormat";
  var OTHER_CERT = "otherCert";
  var CLEAR_PROPS$H = [
    OTHER_CERT_FORMAT,
    OTHER_CERT
  ];
  var OtherCertificateFormat = class _OtherCertificateFormat extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.otherCertFormat = getParametersValue(parameters, OTHER_CERT_FORMAT, _OtherCertificateFormat.defaultValues(OTHER_CERT_FORMAT));
      this.otherCert = getParametersValue(parameters, OTHER_CERT, _OtherCertificateFormat.defaultValues(OTHER_CERT));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case OTHER_CERT_FORMAT:
          return EMPTY_STRING2;
        case OTHER_CERT:
          return new Any();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.otherCertFormat || OTHER_CERT_FORMAT }),
          new Any({ name: names.otherCert || OTHER_CERT })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$H);
      const asn1 = compareSchema(schema, schema, _OtherCertificateFormat.schema());
      AsnError.assertSchema(asn1, this.className);
      this.otherCertFormat = asn1.result.otherCertFormat.valueBlock.toString();
      this.otherCert = asn1.result.otherCert;
    }
    toSchema() {
      return new Sequence({
        value: [
          new ObjectIdentifier({ value: this.otherCertFormat }),
          this.otherCert
        ]
      });
    }
    toJSON() {
      const res = {
        otherCertFormat: this.otherCertFormat
      };
      if (!(this.otherCert instanceof Any)) {
        res.otherCert = this.otherCert.toJSON();
      }
      return res;
    }
  };
  var CERTIFICATES$1 = "certificates";
  var CLEAR_PROPS$G = [
    CERTIFICATES$1
  ];
  var CertificateSet = class _CertificateSet extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.certificates = getParametersValue(parameters, CERTIFICATES$1, _CertificateSet.defaultValues(CERTIFICATES$1));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case CERTIFICATES$1:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Set({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Repeated({
            name: names.certificates || CERTIFICATES$1,
            value: new Choice({
              value: [
                Certificate.schema(),
                new Constructed({
                  idBlock: {
                    tagClass: 3,
                    tagNumber: 0
                  },
                  value: [
                    new Any()
                  ]
                }),
                new Constructed({
                  idBlock: {
                    tagClass: 3,
                    tagNumber: 1
                  },
                  value: [
                    new Sequence()
                  ]
                }),
                new Constructed({
                  idBlock: {
                    tagClass: 3,
                    tagNumber: 2
                  },
                  value: AttributeCertificateV2.schema().valueBlock.value
                }),
                new Constructed({
                  idBlock: {
                    tagClass: 3,
                    tagNumber: 3
                  },
                  value: OtherCertificateFormat.schema().valueBlock.value
                })
              ]
            })
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$G);
      const asn1 = compareSchema(schema, schema, _CertificateSet.schema());
      AsnError.assertSchema(asn1, this.className);
      this.certificates = Array.from(asn1.result.certificates || [], (element) => {
        const initialTagNumber = element.idBlock.tagNumber;
        if (element.idBlock.tagClass === 1)
          return new Certificate({ schema: element });
        const elementSequence = new Sequence({
          value: element.valueBlock.value
        });
        switch (initialTagNumber) {
          case 1:
            if (elementSequence.valueBlock.value[0].valueBlock.value[0].valueBlock.valueDec === 1) {
              return new AttributeCertificateV2({ schema: elementSequence });
            } else {
              return new AttributeCertificateV1({ schema: elementSequence });
            }
          case 2:
            return new AttributeCertificateV2({ schema: elementSequence });
          case 3:
            return new OtherCertificateFormat({ schema: elementSequence });
        }
        return element;
      });
    }
    toSchema() {
      return new Set({
        value: Array.from(this.certificates, (element) => {
          switch (true) {
            case element instanceof Certificate:
              return element.toSchema();
            case element instanceof AttributeCertificateV1:
              return new Constructed({
                idBlock: {
                  tagClass: 3,
                  tagNumber: 1
                },
                value: element.toSchema().valueBlock.value
              });
            case element instanceof AttributeCertificateV2:
              return new Constructed({
                idBlock: {
                  tagClass: 3,
                  tagNumber: 2
                },
                value: element.toSchema().valueBlock.value
              });
            case element instanceof OtherCertificateFormat:
              return new Constructed({
                idBlock: {
                  tagClass: 3,
                  tagNumber: 3
                },
                value: element.toSchema().valueBlock.value
              });
          }
          return element.toSchema();
        })
      });
    }
    toJSON() {
      return {
        certificates: Array.from(this.certificates, (o) => o.toJSON())
      };
    }
  };
  CertificateSet.CLASS_NAME = "CertificateSet";
  var OTHER_REV_INFO_FORMAT = "otherRevInfoFormat";
  var OTHER_REV_INFO = "otherRevInfo";
  var CLEAR_PROPS$F = [
    OTHER_REV_INFO_FORMAT,
    OTHER_REV_INFO
  ];
  var OtherRevocationInfoFormat = class _OtherRevocationInfoFormat extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.otherRevInfoFormat = getParametersValue(parameters, OTHER_REV_INFO_FORMAT, _OtherRevocationInfoFormat.defaultValues(OTHER_REV_INFO_FORMAT));
      this.otherRevInfo = getParametersValue(parameters, OTHER_REV_INFO, _OtherRevocationInfoFormat.defaultValues(OTHER_REV_INFO));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case OTHER_REV_INFO_FORMAT:
          return EMPTY_STRING2;
        case OTHER_REV_INFO:
          return new Any();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.otherRevInfoFormat || OTHER_REV_INFO_FORMAT }),
          new Any({ name: names.otherRevInfo || OTHER_REV_INFO })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$F);
      const asn1 = compareSchema(schema, schema, _OtherRevocationInfoFormat.schema());
      AsnError.assertSchema(asn1, this.className);
      this.otherRevInfoFormat = asn1.result.otherRevInfoFormat.valueBlock.toString();
      this.otherRevInfo = asn1.result.otherRevInfo;
    }
    toSchema() {
      return new Sequence({
        value: [
          new ObjectIdentifier({ value: this.otherRevInfoFormat }),
          this.otherRevInfo
        ]
      });
    }
    toJSON() {
      const res = {
        otherRevInfoFormat: this.otherRevInfoFormat
      };
      if (!(this.otherRevInfo instanceof Any)) {
        res.otherRevInfo = this.otherRevInfo.toJSON();
      }
      return res;
    }
  };
  OtherRevocationInfoFormat.CLASS_NAME = "OtherRevocationInfoFormat";
  var CRLS$3 = "crls";
  var OTHER_REVOCATION_INFOS = "otherRevocationInfos";
  var CLEAR_PROPS$E = [
    CRLS$3
  ];
  var RevocationInfoChoices = class _RevocationInfoChoices extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.crls = getParametersValue(parameters, CRLS$3, _RevocationInfoChoices.defaultValues(CRLS$3));
      this.otherRevocationInfos = getParametersValue(parameters, OTHER_REVOCATION_INFOS, _RevocationInfoChoices.defaultValues(OTHER_REVOCATION_INFOS));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case CRLS$3:
          return [];
        case OTHER_REVOCATION_INFOS:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Set({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Repeated({
            name: names.crls || EMPTY_STRING2,
            value: new Choice({
              value: [
                CertificateRevocationList.schema(),
                new Constructed({
                  idBlock: {
                    tagClass: 3,
                    tagNumber: 1
                  },
                  value: [
                    new ObjectIdentifier(),
                    new Any()
                  ]
                })
              ]
            })
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$E);
      const asn1 = compareSchema(schema, schema, _RevocationInfoChoices.schema({
        names: {
          crls: CRLS$3
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (asn1.result.crls) {
        for (const element of asn1.result.crls) {
          if (element.idBlock.tagClass === 1)
            this.crls.push(new CertificateRevocationList({ schema: element }));
          else
            this.otherRevocationInfos.push(new OtherRevocationInfoFormat({ schema: element }));
        }
      }
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(...Array.from(this.crls, (o) => o.toSchema()));
      outputArray.push(...Array.from(this.otherRevocationInfos, (element) => {
        const schema = element.toSchema();
        schema.idBlock.tagClass = 3;
        schema.idBlock.tagNumber = 1;
        return schema;
      }));
      return new Set({
        value: outputArray
      });
    }
    toJSON() {
      return {
        crls: Array.from(this.crls, (o) => o.toJSON()),
        otherRevocationInfos: Array.from(this.otherRevocationInfos, (o) => o.toJSON())
      };
    }
  };
  RevocationInfoChoices.CLASS_NAME = "RevocationInfoChoices";
  var CERTS$3 = "certs";
  var CRLS$2 = "crls";
  var CLEAR_PROPS$D = [
    CERTS$3,
    CRLS$2
  ];
  var OriginatorInfo = class _OriginatorInfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.crls = getParametersValue(parameters, CRLS$2, _OriginatorInfo.defaultValues(CRLS$2));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case CERTS$3:
          return new CertificateSet();
        case CRLS$2:
          return new RevocationInfoChoices();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case CERTS$3:
          return memberValue.certificates.length === 0;
        case CRLS$2:
          return memberValue.crls.length === 0 && memberValue.otherRevocationInfos.length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Constructed({
            name: names.certs || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: CertificateSet.schema().valueBlock.value
          }),
          new Constructed({
            name: names.crls || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: RevocationInfoChoices.schema().valueBlock.value
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$D);
      const asn1 = compareSchema(schema, schema, _OriginatorInfo.schema({
        names: {
          certs: CERTS$3,
          crls: CRLS$2
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (CERTS$3 in asn1.result) {
        this.certs = new CertificateSet({
          schema: new Set({
            value: asn1.result.certs.valueBlock.value
          })
        });
      }
      if (CRLS$2 in asn1.result) {
        this.crls = new RevocationInfoChoices({
          schema: new Set({
            value: asn1.result.crls.valueBlock.value
          })
        });
      }
    }
    toSchema() {
      const sequenceValue = [];
      if (this.certs) {
        sequenceValue.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: this.certs.toSchema().valueBlock.value
        }));
      }
      if (this.crls) {
        sequenceValue.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          value: this.crls.toSchema().valueBlock.value
        }));
      }
      return new Sequence({
        value: sequenceValue
      });
    }
    toJSON() {
      const res = {};
      if (this.certs) {
        res.certs = this.certs.toJSON();
      }
      if (this.crls) {
        res.crls = this.crls.toJSON();
      }
      return res;
    }
  };
  OriginatorInfo.CLASS_NAME = "OriginatorInfo";
  var ISSUER = "issuer";
  var SERIAL_NUMBER$2 = "serialNumber";
  var CLEAR_PROPS$C = [
    ISSUER,
    SERIAL_NUMBER$2
  ];
  var IssuerAndSerialNumber = class _IssuerAndSerialNumber extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.issuer = getParametersValue(parameters, ISSUER, _IssuerAndSerialNumber.defaultValues(ISSUER));
      this.serialNumber = getParametersValue(parameters, SERIAL_NUMBER$2, _IssuerAndSerialNumber.defaultValues(SERIAL_NUMBER$2));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case ISSUER:
          return new RelativeDistinguishedNames();
        case SERIAL_NUMBER$2:
          return new Integer();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          RelativeDistinguishedNames.schema(names.issuer || {}),
          new Integer({ name: names.serialNumber || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$C);
      const asn1 = compareSchema(schema, schema, _IssuerAndSerialNumber.schema({
        names: {
          issuer: {
            names: {
              blockName: ISSUER
            }
          },
          serialNumber: SERIAL_NUMBER$2
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.issuer = new RelativeDistinguishedNames({ schema: asn1.result.issuer });
      this.serialNumber = asn1.result.serialNumber;
    }
    toSchema() {
      return new Sequence({
        value: [
          this.issuer.toSchema(),
          this.serialNumber
        ]
      });
    }
    toJSON() {
      return {
        issuer: this.issuer.toJSON(),
        serialNumber: this.serialNumber.toJSON()
      };
    }
  };
  IssuerAndSerialNumber.CLASS_NAME = "IssuerAndSerialNumber";
  var VARIANT$3 = "variant";
  var VALUE$3 = "value";
  var CLEAR_PROPS$B = [
    "blockName"
  ];
  var RecipientIdentifier = class _RecipientIdentifier extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.variant = getParametersValue(parameters, VARIANT$3, _RecipientIdentifier.defaultValues(VARIANT$3));
      if (VALUE$3 in parameters) {
        this.value = getParametersValue(parameters, VALUE$3, _RecipientIdentifier.defaultValues(VALUE$3));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VARIANT$3:
          return -1;
        case VALUE$3:
          return {};
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case VARIANT$3:
          return memberValue === -1;
        case VALUE$3:
          return Object.keys(memberValue).length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Choice({
        value: [
          IssuerAndSerialNumber.schema({
            names: {
              blockName: names.blockName || EMPTY_STRING2
            }
          }),
          new Primitive({
            name: names.blockName || EMPTY_STRING2,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            }
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$B);
      const asn1 = compareSchema(schema, schema, _RecipientIdentifier.schema({
        names: {
          blockName: "blockName"
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (asn1.result.blockName.idBlock.tagClass === 1) {
        this.variant = 1;
        this.value = new IssuerAndSerialNumber({ schema: asn1.result.blockName });
      } else {
        this.variant = 2;
        this.value = new OctetString({ valueHex: asn1.result.blockName.valueBlock.valueHex });
      }
    }
    toSchema() {
      switch (this.variant) {
        case 1:
          if (!(this.value instanceof IssuerAndSerialNumber)) {
            throw new Error("Incorrect type of RecipientIdentifier.value. It should be IssuerAndSerialNumber.");
          }
          return this.value.toSchema();
        case 2:
          if (!(this.value instanceof OctetString)) {
            throw new Error("Incorrect type of RecipientIdentifier.value. It should be ASN.1 OctetString.");
          }
          return new Primitive({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            valueHex: this.value.valueBlock.valueHexView
          });
        default:
          return new Any();
      }
    }
    toJSON() {
      const res = {
        variant: this.variant
      };
      if ((this.variant === 1 || this.variant === 2) && this.value) {
        res.value = this.value.toJSON();
      }
      return res;
    }
  };
  RecipientIdentifier.CLASS_NAME = "RecipientIdentifier";
  var VERSION$c = "version";
  var RID$1 = "rid";
  var KEY_ENCRYPTION_ALGORITHM$3 = "keyEncryptionAlgorithm";
  var ENCRYPTED_KEY$3 = "encryptedKey";
  var RECIPIENT_CERTIFICATE$1 = "recipientCertificate";
  var CLEAR_PROPS$A = [
    VERSION$c,
    RID$1,
    KEY_ENCRYPTION_ALGORITHM$3,
    ENCRYPTED_KEY$3
  ];
  var KeyTransRecipientInfo = class _KeyTransRecipientInfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.version = getParametersValue(parameters, VERSION$c, _KeyTransRecipientInfo.defaultValues(VERSION$c));
      this.rid = getParametersValue(parameters, RID$1, _KeyTransRecipientInfo.defaultValues(RID$1));
      this.keyEncryptionAlgorithm = getParametersValue(parameters, KEY_ENCRYPTION_ALGORITHM$3, _KeyTransRecipientInfo.defaultValues(KEY_ENCRYPTION_ALGORITHM$3));
      this.encryptedKey = getParametersValue(parameters, ENCRYPTED_KEY$3, _KeyTransRecipientInfo.defaultValues(ENCRYPTED_KEY$3));
      this.recipientCertificate = getParametersValue(parameters, RECIPIENT_CERTIFICATE$1, _KeyTransRecipientInfo.defaultValues(RECIPIENT_CERTIFICATE$1));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VERSION$c:
          return -1;
        case RID$1:
          return {};
        case KEY_ENCRYPTION_ALGORITHM$3:
          return new AlgorithmIdentifier();
        case ENCRYPTED_KEY$3:
          return new OctetString();
        case RECIPIENT_CERTIFICATE$1:
          return new Certificate();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case VERSION$c:
          return memberValue === _KeyTransRecipientInfo.defaultValues(VERSION$c);
        case RID$1:
          return Object.keys(memberValue).length === 0;
        case KEY_ENCRYPTION_ALGORITHM$3:
        case ENCRYPTED_KEY$3:
          return memberValue.isEqual(_KeyTransRecipientInfo.defaultValues(memberName));
        case RECIPIENT_CERTIFICATE$1:
          return false;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Integer({ name: names.version || EMPTY_STRING2 }),
          RecipientIdentifier.schema(names.rid || {}),
          AlgorithmIdentifier.schema(names.keyEncryptionAlgorithm || {}),
          new OctetString({ name: names.encryptedKey || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$A);
      const asn1 = compareSchema(schema, schema, _KeyTransRecipientInfo.schema({
        names: {
          version: VERSION$c,
          rid: {
            names: {
              blockName: RID$1
            }
          },
          keyEncryptionAlgorithm: {
            names: {
              blockName: KEY_ENCRYPTION_ALGORITHM$3
            }
          },
          encryptedKey: ENCRYPTED_KEY$3
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.version = asn1.result.version.valueBlock.valueDec;
      if (asn1.result.rid.idBlock.tagClass === 3) {
        this.rid = new OctetString({ valueHex: asn1.result.rid.valueBlock.valueHex });
      } else {
        this.rid = new IssuerAndSerialNumber({ schema: asn1.result.rid });
      }
      this.keyEncryptionAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.keyEncryptionAlgorithm });
      this.encryptedKey = asn1.result.encryptedKey;
    }
    toSchema() {
      const outputArray = [];
      if (this.rid instanceof IssuerAndSerialNumber) {
        this.version = 0;
        outputArray.push(new Integer({ value: this.version }));
        outputArray.push(this.rid.toSchema());
      } else {
        this.version = 2;
        outputArray.push(new Integer({ value: this.version }));
        outputArray.push(new Primitive({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          valueHex: this.rid.valueBlock.valueHexView
        }));
      }
      outputArray.push(this.keyEncryptionAlgorithm.toSchema());
      outputArray.push(this.encryptedKey);
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      return {
        version: this.version,
        rid: this.rid.toJSON(),
        keyEncryptionAlgorithm: this.keyEncryptionAlgorithm.toJSON(),
        encryptedKey: this.encryptedKey.toJSON()
      };
    }
  };
  KeyTransRecipientInfo.CLASS_NAME = "KeyTransRecipientInfo";
  var ALGORITHM = "algorithm";
  var PUBLIC_KEY = "publicKey";
  var CLEAR_PROPS$z = [
    ALGORITHM,
    PUBLIC_KEY
  ];
  var OriginatorPublicKey = class _OriginatorPublicKey extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.algorithm = getParametersValue(parameters, ALGORITHM, _OriginatorPublicKey.defaultValues(ALGORITHM));
      this.publicKey = getParametersValue(parameters, PUBLIC_KEY, _OriginatorPublicKey.defaultValues(PUBLIC_KEY));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case ALGORITHM:
          return new AlgorithmIdentifier();
        case PUBLIC_KEY:
          return new BitString();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case ALGORITHM:
        case PUBLIC_KEY:
          return memberValue.isEqual(_OriginatorPublicKey.defaultValues(memberName));
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          AlgorithmIdentifier.schema(names.algorithm || {}),
          new BitString({ name: names.publicKey || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$z);
      const asn1 = compareSchema(schema, schema, _OriginatorPublicKey.schema({
        names: {
          algorithm: {
            names: {
              blockName: ALGORITHM
            }
          },
          publicKey: PUBLIC_KEY
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.algorithm = new AlgorithmIdentifier({ schema: asn1.result.algorithm });
      this.publicKey = asn1.result.publicKey;
    }
    toSchema() {
      return new Sequence({
        value: [
          this.algorithm.toSchema(),
          this.publicKey
        ]
      });
    }
    toJSON() {
      return {
        algorithm: this.algorithm.toJSON(),
        publicKey: this.publicKey.toJSON()
      };
    }
  };
  OriginatorPublicKey.CLASS_NAME = "OriginatorPublicKey";
  var VARIANT$2 = "variant";
  var VALUE$2 = "value";
  var CLEAR_PROPS$y = [
    "blockName"
  ];
  var OriginatorIdentifierOrKey = class _OriginatorIdentifierOrKey extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.variant = getParametersValue(parameters, VARIANT$2, _OriginatorIdentifierOrKey.defaultValues(VARIANT$2));
      if (VALUE$2 in parameters) {
        this.value = getParametersValue(parameters, VALUE$2, _OriginatorIdentifierOrKey.defaultValues(VALUE$2));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VARIANT$2:
          return -1;
        case VALUE$2:
          return {};
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case VARIANT$2:
          return memberValue === -1;
        case VALUE$2:
          return Object.keys(memberValue).length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Choice({
        value: [
          IssuerAndSerialNumber.schema({
            names: {
              blockName: names.blockName || EMPTY_STRING2
            }
          }),
          new Primitive({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            name: names.blockName || EMPTY_STRING2
          }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            name: names.blockName || EMPTY_STRING2,
            value: OriginatorPublicKey.schema().valueBlock.value
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$y);
      const asn1 = compareSchema(schema, schema, _OriginatorIdentifierOrKey.schema({
        names: {
          blockName: "blockName"
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (asn1.result.blockName.idBlock.tagClass === 1) {
        this.variant = 1;
        this.value = new IssuerAndSerialNumber({ schema: asn1.result.blockName });
      } else {
        if (asn1.result.blockName.idBlock.tagNumber === 0) {
          asn1.result.blockName.idBlock.tagClass = 1;
          asn1.result.blockName.idBlock.tagNumber = 4;
          this.variant = 2;
          this.value = asn1.result.blockName;
        } else {
          this.variant = 3;
          this.value = new OriginatorPublicKey({
            schema: new Sequence({
              value: asn1.result.blockName.valueBlock.value
            })
          });
        }
      }
    }
    toSchema() {
      switch (this.variant) {
        case 1:
          return this.value.toSchema();
        case 2:
          this.value.idBlock.tagClass = 3;
          this.value.idBlock.tagNumber = 0;
          return this.value;
        case 3: {
          const _schema = this.value.toSchema();
          _schema.idBlock.tagClass = 3;
          _schema.idBlock.tagNumber = 1;
          return _schema;
        }
        default:
          return new Any();
      }
    }
    toJSON() {
      const res = {
        variant: this.variant
      };
      if (this.variant === 1 || this.variant === 2 || this.variant === 3) {
        res.value = this.value.toJSON();
      }
      return res;
    }
  };
  OriginatorIdentifierOrKey.CLASS_NAME = "OriginatorIdentifierOrKey";
  var KEY_ATTR_ID = "keyAttrId";
  var KEY_ATTR = "keyAttr";
  var CLEAR_PROPS$x = [
    KEY_ATTR_ID,
    KEY_ATTR
  ];
  var OtherKeyAttribute = class _OtherKeyAttribute extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.keyAttrId = getParametersValue(parameters, KEY_ATTR_ID, _OtherKeyAttribute.defaultValues(KEY_ATTR_ID));
      if (KEY_ATTR in parameters) {
        this.keyAttr = getParametersValue(parameters, KEY_ATTR, _OtherKeyAttribute.defaultValues(KEY_ATTR));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case KEY_ATTR_ID:
          return EMPTY_STRING2;
        case KEY_ATTR:
          return {};
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case KEY_ATTR_ID:
          return typeof memberValue === "string" && memberValue === EMPTY_STRING2;
        case KEY_ATTR:
          return Object.keys(memberValue).length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        optional: names.optional || true,
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.keyAttrId || EMPTY_STRING2 }),
          new Any({
            optional: true,
            name: names.keyAttr || EMPTY_STRING2
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$x);
      const asn1 = compareSchema(schema, schema, _OtherKeyAttribute.schema({
        names: {
          keyAttrId: KEY_ATTR_ID,
          keyAttr: KEY_ATTR
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.keyAttrId = asn1.result.keyAttrId.valueBlock.toString();
      if (KEY_ATTR in asn1.result) {
        this.keyAttr = asn1.result.keyAttr;
      }
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(new ObjectIdentifier({ value: this.keyAttrId }));
      if (KEY_ATTR in this) {
        outputArray.push(this.keyAttr);
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        keyAttrId: this.keyAttrId
      };
      if (KEY_ATTR in this) {
        res.keyAttr = this.keyAttr.toJSON();
      }
      return res;
    }
  };
  OtherKeyAttribute.CLASS_NAME = "OtherKeyAttribute";
  var SUBJECT_KEY_IDENTIFIER = "subjectKeyIdentifier";
  var DATE$1 = "date";
  var OTHER$1 = "other";
  var CLEAR_PROPS$w = [
    SUBJECT_KEY_IDENTIFIER,
    DATE$1,
    OTHER$1
  ];
  var RecipientKeyIdentifier = class _RecipientKeyIdentifier extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.subjectKeyIdentifier = getParametersValue(parameters, SUBJECT_KEY_IDENTIFIER, _RecipientKeyIdentifier.defaultValues(SUBJECT_KEY_IDENTIFIER));
      if (DATE$1 in parameters) {
        this.date = getParametersValue(parameters, DATE$1, _RecipientKeyIdentifier.defaultValues(DATE$1));
      }
      if (OTHER$1 in parameters) {
        this.other = getParametersValue(parameters, OTHER$1, _RecipientKeyIdentifier.defaultValues(OTHER$1));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case SUBJECT_KEY_IDENTIFIER:
          return new OctetString();
        case DATE$1:
          return new GeneralizedTime();
        case OTHER$1:
          return new OtherKeyAttribute();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case SUBJECT_KEY_IDENTIFIER:
          return memberValue.isEqual(_RecipientKeyIdentifier.defaultValues(SUBJECT_KEY_IDENTIFIER));
        case DATE$1:
          return memberValue.year === 0 && memberValue.month === 0 && memberValue.day === 0 && memberValue.hour === 0 && memberValue.minute === 0 && memberValue.second === 0 && memberValue.millisecond === 0;
        case OTHER$1:
          return memberValue.keyAttrId === EMPTY_STRING2 && "keyAttr" in memberValue === false;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new OctetString({ name: names.subjectKeyIdentifier || EMPTY_STRING2 }),
          new GeneralizedTime({
            optional: true,
            name: names.date || EMPTY_STRING2
          }),
          OtherKeyAttribute.schema(names.other || {})
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$w);
      const asn1 = compareSchema(schema, schema, _RecipientKeyIdentifier.schema({
        names: {
          subjectKeyIdentifier: SUBJECT_KEY_IDENTIFIER,
          date: DATE$1,
          other: {
            names: {
              blockName: OTHER$1
            }
          }
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.subjectKeyIdentifier = asn1.result.subjectKeyIdentifier;
      if (DATE$1 in asn1.result)
        this.date = asn1.result.date;
      if (OTHER$1 in asn1.result)
        this.other = new OtherKeyAttribute({ schema: asn1.result.other });
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(this.subjectKeyIdentifier);
      if (this.date) {
        outputArray.push(this.date);
      }
      if (this.other) {
        outputArray.push(this.other.toSchema());
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        subjectKeyIdentifier: this.subjectKeyIdentifier.toJSON()
      };
      if (this.date) {
        res.date = this.date.toJSON();
      }
      if (this.other) {
        res.other = this.other.toJSON();
      }
      return res;
    }
  };
  RecipientKeyIdentifier.CLASS_NAME = "RecipientKeyIdentifier";
  var VARIANT$1 = "variant";
  var VALUE$1 = "value";
  var CLEAR_PROPS$v = [
    "blockName"
  ];
  var KeyAgreeRecipientIdentifier = class _KeyAgreeRecipientIdentifier extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.variant = getParametersValue(parameters, VARIANT$1, _KeyAgreeRecipientIdentifier.defaultValues(VARIANT$1));
      this.value = getParametersValue(parameters, VALUE$1, _KeyAgreeRecipientIdentifier.defaultValues(VALUE$1));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VARIANT$1:
          return -1;
        case VALUE$1:
          return {};
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case VARIANT$1:
          return memberValue === -1;
        case VALUE$1:
          return Object.keys(memberValue).length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Choice({
        value: [
          IssuerAndSerialNumber.schema(names.issuerAndSerialNumber || {
            names: {
              blockName: names.blockName || EMPTY_STRING2
            }
          }),
          new Constructed({
            name: names.blockName || EMPTY_STRING2,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: RecipientKeyIdentifier.schema(names.rKeyId || {
              names: {
                blockName: names.blockName || EMPTY_STRING2
              }
            }).valueBlock.value
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$v);
      const asn1 = compareSchema(schema, schema, _KeyAgreeRecipientIdentifier.schema({
        names: {
          blockName: "blockName"
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (asn1.result.blockName.idBlock.tagClass === 1) {
        this.variant = 1;
        this.value = new IssuerAndSerialNumber({ schema: asn1.result.blockName });
      } else {
        this.variant = 2;
        this.value = new RecipientKeyIdentifier({
          schema: new Sequence({
            value: asn1.result.blockName.valueBlock.value
          })
        });
      }
    }
    toSchema() {
      switch (this.variant) {
        case 1:
          return this.value.toSchema();
        case 2:
          return new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: this.value.toSchema().valueBlock.value
          });
        default:
          return new Any();
      }
    }
    toJSON() {
      const res = {
        variant: this.variant
      };
      if (this.variant === 1 || this.variant === 2) {
        res.value = this.value.toJSON();
      }
      return res;
    }
  };
  KeyAgreeRecipientIdentifier.CLASS_NAME = "KeyAgreeRecipientIdentifier";
  var RID = "rid";
  var ENCRYPTED_KEY$2 = "encryptedKey";
  var CLEAR_PROPS$u = [
    RID,
    ENCRYPTED_KEY$2
  ];
  var RecipientEncryptedKey = class _RecipientEncryptedKey extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.rid = getParametersValue(parameters, RID, _RecipientEncryptedKey.defaultValues(RID));
      this.encryptedKey = getParametersValue(parameters, ENCRYPTED_KEY$2, _RecipientEncryptedKey.defaultValues(ENCRYPTED_KEY$2));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case RID:
          return new KeyAgreeRecipientIdentifier();
        case ENCRYPTED_KEY$2:
          return new OctetString();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case RID:
          return memberValue.variant === -1 && "value" in memberValue === false;
        case ENCRYPTED_KEY$2:
          return memberValue.isEqual(_RecipientEncryptedKey.defaultValues(ENCRYPTED_KEY$2));
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          KeyAgreeRecipientIdentifier.schema(names.rid || {}),
          new OctetString({ name: names.encryptedKey || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$u);
      const asn1 = compareSchema(schema, schema, _RecipientEncryptedKey.schema({
        names: {
          rid: {
            names: {
              blockName: RID
            }
          },
          encryptedKey: ENCRYPTED_KEY$2
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.rid = new KeyAgreeRecipientIdentifier({ schema: asn1.result.rid });
      this.encryptedKey = asn1.result.encryptedKey;
    }
    toSchema() {
      return new Sequence({
        value: [
          this.rid.toSchema(),
          this.encryptedKey
        ]
      });
    }
    toJSON() {
      return {
        rid: this.rid.toJSON(),
        encryptedKey: this.encryptedKey.toJSON()
      };
    }
  };
  RecipientEncryptedKey.CLASS_NAME = "RecipientEncryptedKey";
  var ENCRYPTED_KEYS = "encryptedKeys";
  var RECIPIENT_ENCRYPTED_KEYS = "RecipientEncryptedKeys";
  var CLEAR_PROPS$t = [
    RECIPIENT_ENCRYPTED_KEYS
  ];
  var RecipientEncryptedKeys = class _RecipientEncryptedKeys extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.encryptedKeys = getParametersValue(parameters, ENCRYPTED_KEYS, _RecipientEncryptedKeys.defaultValues(ENCRYPTED_KEYS));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case ENCRYPTED_KEYS:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case ENCRYPTED_KEYS:
          return memberValue.length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Repeated({
            name: names.RecipientEncryptedKeys || EMPTY_STRING2,
            value: RecipientEncryptedKey.schema()
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$t);
      const asn1 = compareSchema(schema, schema, _RecipientEncryptedKeys.schema({
        names: {
          RecipientEncryptedKeys: RECIPIENT_ENCRYPTED_KEYS
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.encryptedKeys = Array.from(asn1.result.RecipientEncryptedKeys, (element) => new RecipientEncryptedKey({ schema: element }));
    }
    toSchema() {
      return new Sequence({
        value: Array.from(this.encryptedKeys, (o) => o.toSchema())
      });
    }
    toJSON() {
      return {
        encryptedKeys: Array.from(this.encryptedKeys, (o) => o.toJSON())
      };
    }
  };
  RecipientEncryptedKeys.CLASS_NAME = "RecipientEncryptedKeys";
  var VERSION$b = "version";
  var ORIGINATOR = "originator";
  var UKM = "ukm";
  var KEY_ENCRYPTION_ALGORITHM$2 = "keyEncryptionAlgorithm";
  var RECIPIENT_ENCRYPTED_KEY = "recipientEncryptedKeys";
  var RECIPIENT_CERTIFICATE = "recipientCertificate";
  var RECIPIENT_PUBLIC_KEY = "recipientPublicKey";
  var CLEAR_PROPS$s = [
    VERSION$b,
    ORIGINATOR,
    UKM,
    KEY_ENCRYPTION_ALGORITHM$2,
    RECIPIENT_ENCRYPTED_KEY
  ];
  var KeyAgreeRecipientInfo = class _KeyAgreeRecipientInfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.version = getParametersValue(parameters, VERSION$b, _KeyAgreeRecipientInfo.defaultValues(VERSION$b));
      this.originator = getParametersValue(parameters, ORIGINATOR, _KeyAgreeRecipientInfo.defaultValues(ORIGINATOR));
      if (UKM in parameters) {
        this.ukm = getParametersValue(parameters, UKM, _KeyAgreeRecipientInfo.defaultValues(UKM));
      }
      this.keyEncryptionAlgorithm = getParametersValue(parameters, KEY_ENCRYPTION_ALGORITHM$2, _KeyAgreeRecipientInfo.defaultValues(KEY_ENCRYPTION_ALGORITHM$2));
      this.recipientEncryptedKeys = getParametersValue(parameters, RECIPIENT_ENCRYPTED_KEY, _KeyAgreeRecipientInfo.defaultValues(RECIPIENT_ENCRYPTED_KEY));
      this.recipientCertificate = getParametersValue(parameters, RECIPIENT_CERTIFICATE, _KeyAgreeRecipientInfo.defaultValues(RECIPIENT_CERTIFICATE));
      this.recipientPublicKey = getParametersValue(parameters, RECIPIENT_PUBLIC_KEY, _KeyAgreeRecipientInfo.defaultValues(RECIPIENT_PUBLIC_KEY));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VERSION$b:
          return 0;
        case ORIGINATOR:
          return new OriginatorIdentifierOrKey();
        case UKM:
          return new OctetString();
        case KEY_ENCRYPTION_ALGORITHM$2:
          return new AlgorithmIdentifier();
        case RECIPIENT_ENCRYPTED_KEY:
          return new RecipientEncryptedKeys();
        case RECIPIENT_CERTIFICATE:
          return new Certificate();
        case RECIPIENT_PUBLIC_KEY:
          return null;
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case VERSION$b:
          return memberValue === 0;
        case ORIGINATOR:
          return memberValue.variant === -1 && "value" in memberValue === false;
        case UKM:
          return memberValue.isEqual(_KeyAgreeRecipientInfo.defaultValues(UKM));
        case KEY_ENCRYPTION_ALGORITHM$2:
          return memberValue.algorithmId === EMPTY_STRING2 && "algorithmParams" in memberValue === false;
        case RECIPIENT_ENCRYPTED_KEY:
          return memberValue.encryptedKeys.length === 0;
        case RECIPIENT_CERTIFICATE:
          return false;
        case RECIPIENT_PUBLIC_KEY:
          return false;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Integer({ name: names.version || EMPTY_STRING2 }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [
              OriginatorIdentifierOrKey.schema(names.originator || {})
            ]
          }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: [new OctetString({ name: names.ukm || EMPTY_STRING2 })]
          }),
          AlgorithmIdentifier.schema(names.keyEncryptionAlgorithm || {}),
          RecipientEncryptedKeys.schema(names.recipientEncryptedKeys || {})
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$s);
      const asn1 = compareSchema(schema, schema, _KeyAgreeRecipientInfo.schema({
        names: {
          version: VERSION$b,
          originator: {
            names: {
              blockName: ORIGINATOR
            }
          },
          ukm: UKM,
          keyEncryptionAlgorithm: {
            names: {
              blockName: KEY_ENCRYPTION_ALGORITHM$2
            }
          },
          recipientEncryptedKeys: {
            names: {
              blockName: RECIPIENT_ENCRYPTED_KEY
            }
          }
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.version = asn1.result.version.valueBlock.valueDec;
      this.originator = new OriginatorIdentifierOrKey({ schema: asn1.result.originator });
      if (UKM in asn1.result)
        this.ukm = asn1.result.ukm;
      this.keyEncryptionAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.keyEncryptionAlgorithm });
      this.recipientEncryptedKeys = new RecipientEncryptedKeys({ schema: asn1.result.recipientEncryptedKeys });
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(new Integer({ value: this.version }));
      outputArray.push(new Constructed({
        idBlock: {
          tagClass: 3,
          tagNumber: 0
        },
        value: [this.originator.toSchema()]
      }));
      if (this.ukm) {
        outputArray.push(new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          value: [this.ukm]
        }));
      }
      outputArray.push(this.keyEncryptionAlgorithm.toSchema());
      outputArray.push(this.recipientEncryptedKeys.toSchema());
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        version: this.version,
        originator: this.originator.toJSON(),
        keyEncryptionAlgorithm: this.keyEncryptionAlgorithm.toJSON(),
        recipientEncryptedKeys: this.recipientEncryptedKeys.toJSON()
      };
      if (this.ukm) {
        res.ukm = this.ukm.toJSON();
      }
      return res;
    }
  };
  KeyAgreeRecipientInfo.CLASS_NAME = "KeyAgreeRecipientInfo";
  var KEY_IDENTIFIER = "keyIdentifier";
  var DATE2 = "date";
  var OTHER = "other";
  var CLEAR_PROPS$r = [
    KEY_IDENTIFIER,
    DATE2,
    OTHER
  ];
  var KEKIdentifier = class _KEKIdentifier extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.keyIdentifier = getParametersValue(parameters, KEY_IDENTIFIER, _KEKIdentifier.defaultValues(KEY_IDENTIFIER));
      if (DATE2 in parameters) {
        this.date = getParametersValue(parameters, DATE2, _KEKIdentifier.defaultValues(DATE2));
      }
      if (OTHER in parameters) {
        this.other = getParametersValue(parameters, OTHER, _KEKIdentifier.defaultValues(OTHER));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case KEY_IDENTIFIER:
          return new OctetString();
        case DATE2:
          return new GeneralizedTime();
        case OTHER:
          return new OtherKeyAttribute();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case KEY_IDENTIFIER:
          return memberValue.isEqual(_KEKIdentifier.defaultValues(KEY_IDENTIFIER));
        case DATE2:
          return memberValue.year === 0 && memberValue.month === 0 && memberValue.day === 0 && memberValue.hour === 0 && memberValue.minute === 0 && memberValue.second === 0 && memberValue.millisecond === 0;
        case OTHER:
          return memberValue.compareWithDefault("keyAttrId", memberValue.keyAttrId) && "keyAttr" in memberValue === false;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new OctetString({ name: names.keyIdentifier || EMPTY_STRING2 }),
          new GeneralizedTime({
            optional: true,
            name: names.date || EMPTY_STRING2
          }),
          OtherKeyAttribute.schema(names.other || {})
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$r);
      const asn1 = compareSchema(schema, schema, _KEKIdentifier.schema({
        names: {
          keyIdentifier: KEY_IDENTIFIER,
          date: DATE2,
          other: {
            names: {
              blockName: OTHER
            }
          }
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.keyIdentifier = asn1.result.keyIdentifier;
      if (DATE2 in asn1.result)
        this.date = asn1.result.date;
      if (OTHER in asn1.result)
        this.other = new OtherKeyAttribute({ schema: asn1.result.other });
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(this.keyIdentifier);
      if (this.date) {
        outputArray.push(this.date);
      }
      if (this.other) {
        outputArray.push(this.other.toSchema());
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        keyIdentifier: this.keyIdentifier.toJSON()
      };
      if (this.date) {
        res.date = this.date;
      }
      if (this.other) {
        res.other = this.other.toJSON();
      }
      return res;
    }
  };
  KEKIdentifier.CLASS_NAME = "KEKIdentifier";
  var VERSION$a = "version";
  var KEK_ID = "kekid";
  var KEY_ENCRYPTION_ALGORITHM$1 = "keyEncryptionAlgorithm";
  var ENCRYPTED_KEY$1 = "encryptedKey";
  var PER_DEFINED_KEK = "preDefinedKEK";
  var CLEAR_PROPS$q = [
    VERSION$a,
    KEK_ID,
    KEY_ENCRYPTION_ALGORITHM$1,
    ENCRYPTED_KEY$1
  ];
  var KEKRecipientInfo = class _KEKRecipientInfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.version = getParametersValue(parameters, VERSION$a, _KEKRecipientInfo.defaultValues(VERSION$a));
      this.kekid = getParametersValue(parameters, KEK_ID, _KEKRecipientInfo.defaultValues(KEK_ID));
      this.keyEncryptionAlgorithm = getParametersValue(parameters, KEY_ENCRYPTION_ALGORITHM$1, _KEKRecipientInfo.defaultValues(KEY_ENCRYPTION_ALGORITHM$1));
      this.encryptedKey = getParametersValue(parameters, ENCRYPTED_KEY$1, _KEKRecipientInfo.defaultValues(ENCRYPTED_KEY$1));
      this.preDefinedKEK = getParametersValue(parameters, PER_DEFINED_KEK, _KEKRecipientInfo.defaultValues(PER_DEFINED_KEK));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VERSION$a:
          return 0;
        case KEK_ID:
          return new KEKIdentifier();
        case KEY_ENCRYPTION_ALGORITHM$1:
          return new AlgorithmIdentifier();
        case ENCRYPTED_KEY$1:
          return new OctetString();
        case PER_DEFINED_KEK:
          return EMPTY_BUFFER2;
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case "KEKRecipientInfo":
          return memberValue === _KEKRecipientInfo.defaultValues(VERSION$a);
        case KEK_ID:
          return memberValue.compareWithDefault("keyIdentifier", memberValue.keyIdentifier) && "date" in memberValue === false && "other" in memberValue === false;
        case KEY_ENCRYPTION_ALGORITHM$1:
          return memberValue.algorithmId === EMPTY_STRING2 && "algorithmParams" in memberValue === false;
        case ENCRYPTED_KEY$1:
          return memberValue.isEqual(_KEKRecipientInfo.defaultValues(ENCRYPTED_KEY$1));
        case PER_DEFINED_KEK:
          return memberValue.byteLength === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Integer({ name: names.version || EMPTY_STRING2 }),
          KEKIdentifier.schema(names.kekid || {}),
          AlgorithmIdentifier.schema(names.keyEncryptionAlgorithm || {}),
          new OctetString({ name: names.encryptedKey || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$q);
      const asn1 = compareSchema(schema, schema, _KEKRecipientInfo.schema({
        names: {
          version: VERSION$a,
          kekid: {
            names: {
              blockName: KEK_ID
            }
          },
          keyEncryptionAlgorithm: {
            names: {
              blockName: KEY_ENCRYPTION_ALGORITHM$1
            }
          },
          encryptedKey: ENCRYPTED_KEY$1
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.version = asn1.result.version.valueBlock.valueDec;
      this.kekid = new KEKIdentifier({ schema: asn1.result.kekid });
      this.keyEncryptionAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.keyEncryptionAlgorithm });
      this.encryptedKey = asn1.result.encryptedKey;
    }
    toSchema() {
      return new Sequence({
        value: [
          new Integer({ value: this.version }),
          this.kekid.toSchema(),
          this.keyEncryptionAlgorithm.toSchema(),
          this.encryptedKey
        ]
      });
    }
    toJSON() {
      return {
        version: this.version,
        kekid: this.kekid.toJSON(),
        keyEncryptionAlgorithm: this.keyEncryptionAlgorithm.toJSON(),
        encryptedKey: this.encryptedKey.toJSON()
      };
    }
  };
  KEKRecipientInfo.CLASS_NAME = "KEKRecipientInfo";
  var VERSION$9 = "version";
  var KEY_DERIVATION_ALGORITHM = "keyDerivationAlgorithm";
  var KEY_ENCRYPTION_ALGORITHM = "keyEncryptionAlgorithm";
  var ENCRYPTED_KEY = "encryptedKey";
  var PASSWORD = "password";
  var CLEAR_PROPS$p = [
    VERSION$9,
    KEY_DERIVATION_ALGORITHM,
    KEY_ENCRYPTION_ALGORITHM,
    ENCRYPTED_KEY
  ];
  var PasswordRecipientinfo = class _PasswordRecipientinfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.version = getParametersValue(parameters, VERSION$9, _PasswordRecipientinfo.defaultValues(VERSION$9));
      if (KEY_DERIVATION_ALGORITHM in parameters) {
        this.keyDerivationAlgorithm = getParametersValue(parameters, KEY_DERIVATION_ALGORITHM, _PasswordRecipientinfo.defaultValues(KEY_DERIVATION_ALGORITHM));
      }
      this.keyEncryptionAlgorithm = getParametersValue(parameters, KEY_ENCRYPTION_ALGORITHM, _PasswordRecipientinfo.defaultValues(KEY_ENCRYPTION_ALGORITHM));
      this.encryptedKey = getParametersValue(parameters, ENCRYPTED_KEY, _PasswordRecipientinfo.defaultValues(ENCRYPTED_KEY));
      this.password = getParametersValue(parameters, PASSWORD, _PasswordRecipientinfo.defaultValues(PASSWORD));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VERSION$9:
          return -1;
        case KEY_DERIVATION_ALGORITHM:
          return new AlgorithmIdentifier();
        case KEY_ENCRYPTION_ALGORITHM:
          return new AlgorithmIdentifier();
        case ENCRYPTED_KEY:
          return new OctetString();
        case PASSWORD:
          return EMPTY_BUFFER2;
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case VERSION$9:
          return memberValue === -1;
        case KEY_DERIVATION_ALGORITHM:
        case KEY_ENCRYPTION_ALGORITHM:
          return memberValue.algorithmId === EMPTY_STRING2 && "algorithmParams" in memberValue === false;
        case ENCRYPTED_KEY:
          return memberValue.isEqual(_PasswordRecipientinfo.defaultValues(ENCRYPTED_KEY));
        case PASSWORD:
          return memberValue.byteLength === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Integer({ name: names.version || EMPTY_STRING2 }),
          new Constructed({
            name: names.keyDerivationAlgorithm || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: AlgorithmIdentifier.schema().valueBlock.value
          }),
          AlgorithmIdentifier.schema(names.keyEncryptionAlgorithm || {}),
          new OctetString({ name: names.encryptedKey || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$p);
      const asn1 = compareSchema(schema, schema, _PasswordRecipientinfo.schema({
        names: {
          version: VERSION$9,
          keyDerivationAlgorithm: KEY_DERIVATION_ALGORITHM,
          keyEncryptionAlgorithm: {
            names: {
              blockName: KEY_ENCRYPTION_ALGORITHM
            }
          },
          encryptedKey: ENCRYPTED_KEY
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.version = asn1.result.version.valueBlock.valueDec;
      if (KEY_DERIVATION_ALGORITHM in asn1.result) {
        this.keyDerivationAlgorithm = new AlgorithmIdentifier({
          schema: new Sequence({
            value: asn1.result.keyDerivationAlgorithm.valueBlock.value
          })
        });
      }
      this.keyEncryptionAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.keyEncryptionAlgorithm });
      this.encryptedKey = asn1.result.encryptedKey;
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(new Integer({ value: this.version }));
      if (this.keyDerivationAlgorithm) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: this.keyDerivationAlgorithm.toSchema().valueBlock.value
        }));
      }
      outputArray.push(this.keyEncryptionAlgorithm.toSchema());
      outputArray.push(this.encryptedKey);
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        version: this.version,
        keyEncryptionAlgorithm: this.keyEncryptionAlgorithm.toJSON(),
        encryptedKey: this.encryptedKey.toJSON()
      };
      if (this.keyDerivationAlgorithm) {
        res.keyDerivationAlgorithm = this.keyDerivationAlgorithm.toJSON();
      }
      return res;
    }
  };
  PasswordRecipientinfo.CLASS_NAME = "PasswordRecipientInfo";
  var ORI_TYPE = "oriType";
  var ORI_VALUE = "oriValue";
  var CLEAR_PROPS$o = [
    ORI_TYPE,
    ORI_VALUE
  ];
  var OtherRecipientInfo = class _OtherRecipientInfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.oriType = getParametersValue(parameters, ORI_TYPE, _OtherRecipientInfo.defaultValues(ORI_TYPE));
      this.oriValue = getParametersValue(parameters, ORI_VALUE, _OtherRecipientInfo.defaultValues(ORI_VALUE));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case ORI_TYPE:
          return EMPTY_STRING2;
        case ORI_VALUE:
          return {};
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case ORI_TYPE:
          return memberValue === EMPTY_STRING2;
        case ORI_VALUE:
          return Object.keys(memberValue).length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.oriType || EMPTY_STRING2 }),
          new Any({ name: names.oriValue || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$o);
      const asn1 = compareSchema(schema, schema, _OtherRecipientInfo.schema({
        names: {
          oriType: ORI_TYPE,
          oriValue: ORI_VALUE
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.oriType = asn1.result.oriType.valueBlock.toString();
      this.oriValue = asn1.result.oriValue;
    }
    toSchema() {
      return new Sequence({
        value: [
          new ObjectIdentifier({ value: this.oriType }),
          this.oriValue
        ]
      });
    }
    toJSON() {
      const res = {
        oriType: this.oriType
      };
      if (!_OtherRecipientInfo.compareWithDefault(ORI_VALUE, this.oriValue)) {
        res.oriValue = this.oriValue.toJSON();
      }
      return res;
    }
  };
  OtherRecipientInfo.CLASS_NAME = "OtherRecipientInfo";
  var VARIANT = "variant";
  var VALUE = "value";
  var CLEAR_PROPS$n = [
    "blockName"
  ];
  var RecipientInfo = class _RecipientInfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.variant = getParametersValue(parameters, VARIANT, _RecipientInfo.defaultValues(VARIANT));
      if (VALUE in parameters) {
        this.value = getParametersValue(parameters, VALUE, _RecipientInfo.defaultValues(VALUE));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VARIANT:
          return -1;
        case VALUE:
          return {};
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case VARIANT:
          return memberValue === _RecipientInfo.defaultValues(memberName);
        case VALUE:
          return Object.keys(memberValue).length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Choice({
        value: [
          KeyTransRecipientInfo.schema({
            names: {
              blockName: names.blockName || EMPTY_STRING2
            }
          }),
          new Constructed({
            name: names.blockName || EMPTY_STRING2,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: KeyAgreeRecipientInfo.schema().valueBlock.value
          }),
          new Constructed({
            name: names.blockName || EMPTY_STRING2,
            idBlock: {
              tagClass: 3,
              tagNumber: 2
            },
            value: KEKRecipientInfo.schema().valueBlock.value
          }),
          new Constructed({
            name: names.blockName || EMPTY_STRING2,
            idBlock: {
              tagClass: 3,
              tagNumber: 3
            },
            value: PasswordRecipientinfo.schema().valueBlock.value
          }),
          new Constructed({
            name: names.blockName || EMPTY_STRING2,
            idBlock: {
              tagClass: 3,
              tagNumber: 4
            },
            value: OtherRecipientInfo.schema().valueBlock.value
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$n);
      const asn1 = compareSchema(schema, schema, _RecipientInfo.schema({
        names: {
          blockName: "blockName"
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (asn1.result.blockName.idBlock.tagClass === 1) {
        this.variant = 1;
        this.value = new KeyTransRecipientInfo({ schema: asn1.result.blockName });
      } else {
        const blockSequence = new Sequence({
          value: asn1.result.blockName.valueBlock.value
        });
        switch (asn1.result.blockName.idBlock.tagNumber) {
          case 1:
            this.variant = 2;
            this.value = new KeyAgreeRecipientInfo({ schema: blockSequence });
            break;
          case 2:
            this.variant = 3;
            this.value = new KEKRecipientInfo({ schema: blockSequence });
            break;
          case 3:
            this.variant = 4;
            this.value = new PasswordRecipientinfo({ schema: blockSequence });
            break;
          case 4:
            this.variant = 5;
            this.value = new OtherRecipientInfo({ schema: blockSequence });
            break;
          default:
            throw new Error("Incorrect structure of RecipientInfo block");
        }
      }
    }
    toSchema() {
      ParameterError.assertEmpty(this.value, "value", "RecipientInfo");
      const _schema = this.value.toSchema();
      switch (this.variant) {
        case 1:
          return _schema;
        case 2:
        case 3:
        case 4:
          _schema.idBlock.tagClass = 3;
          _schema.idBlock.tagNumber = this.variant - 1;
          return _schema;
        default:
          return new Any();
      }
    }
    toJSON() {
      const res = {
        variant: this.variant
      };
      if (this.value && this.variant >= 1 && this.variant <= 4) {
        res.value = this.value.toJSON();
      }
      return res;
    }
  };
  RecipientInfo.CLASS_NAME = "RecipientInfo";
  var HASH_ALGORITHM$2 = "hashAlgorithm";
  var MASK_GEN_ALGORITHM = "maskGenAlgorithm";
  var P_SOURCE_ALGORITHM = "pSourceAlgorithm";
  var CLEAR_PROPS$m = [
    HASH_ALGORITHM$2,
    MASK_GEN_ALGORITHM,
    P_SOURCE_ALGORITHM
  ];
  var RSAESOAEPParams = class _RSAESOAEPParams extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.hashAlgorithm = getParametersValue(parameters, HASH_ALGORITHM$2, _RSAESOAEPParams.defaultValues(HASH_ALGORITHM$2));
      this.maskGenAlgorithm = getParametersValue(parameters, MASK_GEN_ALGORITHM, _RSAESOAEPParams.defaultValues(MASK_GEN_ALGORITHM));
      this.pSourceAlgorithm = getParametersValue(parameters, P_SOURCE_ALGORITHM, _RSAESOAEPParams.defaultValues(P_SOURCE_ALGORITHM));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case HASH_ALGORITHM$2:
          return new AlgorithmIdentifier({
            algorithmId: "1.3.14.3.2.26",
            algorithmParams: new Null()
          });
        case MASK_GEN_ALGORITHM:
          return new AlgorithmIdentifier({
            algorithmId: "1.2.840.113549.1.1.8",
            algorithmParams: new AlgorithmIdentifier({
              algorithmId: "1.3.14.3.2.26",
              algorithmParams: new Null()
            }).toSchema()
          });
        case P_SOURCE_ALGORITHM:
          return new AlgorithmIdentifier({
            algorithmId: "1.2.840.113549.1.1.9",
            algorithmParams: new OctetString({ valueHex: new Uint8Array([218, 57, 163, 238, 94, 107, 75, 13, 50, 85, 191, 239, 149, 96, 24, 144, 175, 216, 7, 9]).buffer })
          });
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            optional: true,
            value: [AlgorithmIdentifier.schema(names.hashAlgorithm || {})]
          }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            optional: true,
            value: [AlgorithmIdentifier.schema(names.maskGenAlgorithm || {})]
          }),
          new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 2
            },
            optional: true,
            value: [AlgorithmIdentifier.schema(names.pSourceAlgorithm || {})]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$m);
      const asn1 = compareSchema(schema, schema, _RSAESOAEPParams.schema({
        names: {
          hashAlgorithm: {
            names: {
              blockName: HASH_ALGORITHM$2
            }
          },
          maskGenAlgorithm: {
            names: {
              blockName: MASK_GEN_ALGORITHM
            }
          },
          pSourceAlgorithm: {
            names: {
              blockName: P_SOURCE_ALGORITHM
            }
          }
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      if (HASH_ALGORITHM$2 in asn1.result)
        this.hashAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.hashAlgorithm });
      if (MASK_GEN_ALGORITHM in asn1.result)
        this.maskGenAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.maskGenAlgorithm });
      if (P_SOURCE_ALGORITHM in asn1.result)
        this.pSourceAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.pSourceAlgorithm });
    }
    toSchema() {
      const outputArray = [];
      if (!this.hashAlgorithm.isEqual(_RSAESOAEPParams.defaultValues(HASH_ALGORITHM$2))) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [this.hashAlgorithm.toSchema()]
        }));
      }
      if (!this.maskGenAlgorithm.isEqual(_RSAESOAEPParams.defaultValues(MASK_GEN_ALGORITHM))) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          value: [this.maskGenAlgorithm.toSchema()]
        }));
      }
      if (!this.pSourceAlgorithm.isEqual(_RSAESOAEPParams.defaultValues(P_SOURCE_ALGORITHM))) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 2
          },
          value: [this.pSourceAlgorithm.toSchema()]
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {};
      if (!this.hashAlgorithm.isEqual(_RSAESOAEPParams.defaultValues(HASH_ALGORITHM$2))) {
        res.hashAlgorithm = this.hashAlgorithm.toJSON();
      }
      if (!this.maskGenAlgorithm.isEqual(_RSAESOAEPParams.defaultValues(MASK_GEN_ALGORITHM))) {
        res.maskGenAlgorithm = this.maskGenAlgorithm.toJSON();
      }
      if (!this.pSourceAlgorithm.isEqual(_RSAESOAEPParams.defaultValues(P_SOURCE_ALGORITHM))) {
        res.pSourceAlgorithm = this.pSourceAlgorithm.toJSON();
      }
      return res;
    }
  };
  RSAESOAEPParams.CLASS_NAME = "RSAESOAEPParams";
  var KEY_INFO = "keyInfo";
  var ENTITY_U_INFO = "entityUInfo";
  var SUPP_PUB_INFO = "suppPubInfo";
  var CLEAR_PROPS$l = [
    KEY_INFO,
    ENTITY_U_INFO,
    SUPP_PUB_INFO
  ];
  var ECCCMSSharedInfo = class _ECCCMSSharedInfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.keyInfo = getParametersValue(parameters, KEY_INFO, _ECCCMSSharedInfo.defaultValues(KEY_INFO));
      if (ENTITY_U_INFO in parameters) {
        this.entityUInfo = getParametersValue(parameters, ENTITY_U_INFO, _ECCCMSSharedInfo.defaultValues(ENTITY_U_INFO));
      }
      this.suppPubInfo = getParametersValue(parameters, SUPP_PUB_INFO, _ECCCMSSharedInfo.defaultValues(SUPP_PUB_INFO));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case KEY_INFO:
          return new AlgorithmIdentifier();
        case ENTITY_U_INFO:
          return new OctetString();
        case SUPP_PUB_INFO:
          return new OctetString();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case KEY_INFO:
        case ENTITY_U_INFO:
        case SUPP_PUB_INFO:
          return memberValue.isEqual(_ECCCMSSharedInfo.defaultValues(memberName));
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          AlgorithmIdentifier.schema(names.keyInfo || {}),
          new Constructed({
            name: names.entityUInfo || EMPTY_STRING2,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            optional: true,
            value: [new OctetString()]
          }),
          new Constructed({
            name: names.suppPubInfo || EMPTY_STRING2,
            idBlock: {
              tagClass: 3,
              tagNumber: 2
            },
            value: [new OctetString()]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$l);
      const asn1 = compareSchema(schema, schema, _ECCCMSSharedInfo.schema({
        names: {
          keyInfo: {
            names: {
              blockName: KEY_INFO
            }
          },
          entityUInfo: ENTITY_U_INFO,
          suppPubInfo: SUPP_PUB_INFO
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.keyInfo = new AlgorithmIdentifier({ schema: asn1.result.keyInfo });
      if (ENTITY_U_INFO in asn1.result)
        this.entityUInfo = asn1.result.entityUInfo.valueBlock.value[0];
      this.suppPubInfo = asn1.result.suppPubInfo.valueBlock.value[0];
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(this.keyInfo.toSchema());
      if (this.entityUInfo) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [this.entityUInfo]
        }));
      }
      outputArray.push(new Constructed({
        idBlock: {
          tagClass: 3,
          tagNumber: 2
        },
        value: [this.suppPubInfo]
      }));
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        keyInfo: this.keyInfo.toJSON(),
        suppPubInfo: this.suppPubInfo.toJSON()
      };
      if (this.entityUInfo) {
        res.entityUInfo = this.entityUInfo.toJSON();
      }
      return res;
    }
  };
  ECCCMSSharedInfo.CLASS_NAME = "ECCCMSSharedInfo";
  var VERSION$8 = "version";
  var ORIGINATOR_INFO = "originatorInfo";
  var RECIPIENT_INFOS = "recipientInfos";
  var ENCRYPTED_CONTENT_INFO = "encryptedContentInfo";
  var UNPROTECTED_ATTRS = "unprotectedAttrs";
  var CLEAR_PROPS$k = [
    VERSION$8,
    ORIGINATOR_INFO,
    RECIPIENT_INFOS,
    ENCRYPTED_CONTENT_INFO,
    UNPROTECTED_ATTRS
  ];
  var defaultEncryptionParams = {
    kdfAlgorithm: "SHA-512",
    kekEncryptionLength: 256
  };
  var curveLengthByName = {
    "P-256": 256,
    "P-384": 384,
    "P-521": 528
  };
  var EnvelopedData = class _EnvelopedData extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.version = getParametersValue(parameters, VERSION$8, _EnvelopedData.defaultValues(VERSION$8));
      if (ORIGINATOR_INFO in parameters) {
        this.originatorInfo = getParametersValue(parameters, ORIGINATOR_INFO, _EnvelopedData.defaultValues(ORIGINATOR_INFO));
      }
      this.recipientInfos = getParametersValue(parameters, RECIPIENT_INFOS, _EnvelopedData.defaultValues(RECIPIENT_INFOS));
      this.encryptedContentInfo = getParametersValue(parameters, ENCRYPTED_CONTENT_INFO, _EnvelopedData.defaultValues(ENCRYPTED_CONTENT_INFO));
      if (UNPROTECTED_ATTRS in parameters) {
        this.unprotectedAttrs = getParametersValue(parameters, UNPROTECTED_ATTRS, _EnvelopedData.defaultValues(UNPROTECTED_ATTRS));
      }
      this.policy = {
        disableSplit: !!parameters.disableSplit
      };
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VERSION$8:
          return 0;
        case ORIGINATOR_INFO:
          return new OriginatorInfo();
        case RECIPIENT_INFOS:
          return [];
        case ENCRYPTED_CONTENT_INFO:
          return new EncryptedContentInfo();
        case UNPROTECTED_ATTRS:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case VERSION$8:
          return memberValue === _EnvelopedData.defaultValues(memberName);
        case ORIGINATOR_INFO:
          return memberValue.certs.certificates.length === 0 && memberValue.crls.crls.length === 0;
        case RECIPIENT_INFOS:
        case UNPROTECTED_ATTRS:
          return memberValue.length === 0;
        case ENCRYPTED_CONTENT_INFO:
          return EncryptedContentInfo.compareWithDefault("contentType", memberValue.contentType) && (EncryptedContentInfo.compareWithDefault("contentEncryptionAlgorithm", memberValue.contentEncryptionAlgorithm) && EncryptedContentInfo.compareWithDefault("encryptedContent", memberValue.encryptedContent));
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Integer({ name: names.version || EMPTY_STRING2 }),
          new Constructed({
            name: names.originatorInfo || EMPTY_STRING2,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: OriginatorInfo.schema().valueBlock.value
          }),
          new Set({
            value: [
              new Repeated({
                name: names.recipientInfos || EMPTY_STRING2,
                value: RecipientInfo.schema()
              })
            ]
          }),
          EncryptedContentInfo.schema(names.encryptedContentInfo || {}),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: [
              new Repeated({
                name: names.unprotectedAttrs || EMPTY_STRING2,
                value: Attribute.schema()
              })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$k);
      const asn1 = compareSchema(schema, schema, _EnvelopedData.schema({
        names: {
          version: VERSION$8,
          originatorInfo: ORIGINATOR_INFO,
          recipientInfos: RECIPIENT_INFOS,
          encryptedContentInfo: {
            names: {
              blockName: ENCRYPTED_CONTENT_INFO
            }
          },
          unprotectedAttrs: UNPROTECTED_ATTRS
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.version = asn1.result.version.valueBlock.valueDec;
      if (ORIGINATOR_INFO in asn1.result) {
        this.originatorInfo = new OriginatorInfo({
          schema: new Sequence({
            value: asn1.result.originatorInfo.valueBlock.value
          })
        });
      }
      this.recipientInfos = Array.from(asn1.result.recipientInfos, (o) => new RecipientInfo({ schema: o }));
      this.encryptedContentInfo = new EncryptedContentInfo({ schema: asn1.result.encryptedContentInfo });
      if (UNPROTECTED_ATTRS in asn1.result)
        this.unprotectedAttrs = Array.from(asn1.result.unprotectedAttrs, (o) => new Attribute({ schema: o }));
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(new Integer({ value: this.version }));
      if (this.originatorInfo) {
        outputArray.push(new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: this.originatorInfo.toSchema().valueBlock.value
        }));
      }
      outputArray.push(new Set({
        value: Array.from(this.recipientInfos, (o) => o.toSchema())
      }));
      outputArray.push(this.encryptedContentInfo.toSchema());
      if (this.unprotectedAttrs) {
        outputArray.push(new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          value: Array.from(this.unprotectedAttrs, (o) => o.toSchema())
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        version: this.version,
        recipientInfos: Array.from(this.recipientInfos, (o) => o.toJSON()),
        encryptedContentInfo: this.encryptedContentInfo.toJSON()
      };
      if (this.originatorInfo)
        res.originatorInfo = this.originatorInfo.toJSON();
      if (this.unprotectedAttrs)
        res.unprotectedAttrs = Array.from(this.unprotectedAttrs, (o) => o.toJSON());
      return res;
    }
    addRecipientByCertificate(certificate, parameters, variant, crypto2 = getCrypto(true)) {
      const encryptionParameters = Object.assign({ useOAEP: true, oaepHashAlgorithm: "SHA-512" }, defaultEncryptionParams, parameters || {});
      if (certificate.subjectPublicKeyInfo.algorithm.algorithmId.indexOf("1.2.840.113549") !== -1)
        variant = 1;
      else {
        if (certificate.subjectPublicKeyInfo.algorithm.algorithmId.indexOf("1.2.840.10045") !== -1)
          variant = 2;
        else
          throw new Error(`Unknown type of certificate's public key: ${certificate.subjectPublicKeyInfo.algorithm.algorithmId}`);
      }
      switch (variant) {
        case 1:
          {
            let algorithmId;
            let algorithmParams;
            if (encryptionParameters.useOAEP === true) {
              algorithmId = crypto2.getOIDByAlgorithm({
                name: "RSA-OAEP"
              }, true, "keyEncryptionAlgorithm");
              const hashOID = crypto2.getOIDByAlgorithm({
                name: encryptionParameters.oaepHashAlgorithm
              }, true, "RSAES-OAEP-params");
              const hashAlgorithm = new AlgorithmIdentifier({
                algorithmId: hashOID,
                algorithmParams: new Null()
              });
              const rsaOAEPParams = new RSAESOAEPParams({
                hashAlgorithm,
                maskGenAlgorithm: new AlgorithmIdentifier({
                  algorithmId: "1.2.840.113549.1.1.8",
                  algorithmParams: hashAlgorithm.toSchema()
                })
              });
              algorithmParams = rsaOAEPParams.toSchema();
            } else {
              algorithmId = crypto2.getOIDByAlgorithm({
                name: "RSAES-PKCS1-v1_5"
              });
              if (algorithmId === EMPTY_STRING2)
                throw new Error("Can not find OID for RSAES-PKCS1-v1_5");
              algorithmParams = new Null();
            }
            const keyInfo = new KeyTransRecipientInfo({
              version: 0,
              rid: new IssuerAndSerialNumber({
                issuer: certificate.issuer,
                serialNumber: certificate.serialNumber
              }),
              keyEncryptionAlgorithm: new AlgorithmIdentifier({
                algorithmId,
                algorithmParams
              }),
              recipientCertificate: certificate
            });
            this.recipientInfos.push(new RecipientInfo({
              variant: 1,
              value: keyInfo
            }));
          }
          break;
        case 2:
          {
            const recipientIdentifier = new KeyAgreeRecipientIdentifier({
              variant: 1,
              value: new IssuerAndSerialNumber({
                issuer: certificate.issuer,
                serialNumber: certificate.serialNumber
              })
            });
            this._addKeyAgreeRecipientInfo(recipientIdentifier, encryptionParameters, { recipientCertificate: certificate }, crypto2);
          }
          break;
        default:
          throw new Error(`Unknown "variant" value: ${variant}`);
      }
      return true;
    }
    addRecipientByPreDefinedData(preDefinedData, parameters = {}, variant, crypto2 = getCrypto(true)) {
      ArgumentError.assert(preDefinedData, "preDefinedData", "ArrayBuffer");
      if (!preDefinedData.byteLength) {
        throw new Error("Pre-defined data could have zero length");
      }
      if (!parameters.keyIdentifier) {
        const keyIdentifierBuffer = new ArrayBuffer(16);
        const keyIdentifierView = new Uint8Array(keyIdentifierBuffer);
        crypto2.getRandomValues(keyIdentifierView);
        parameters.keyIdentifier = keyIdentifierBuffer;
      }
      if (!parameters.hmacHashAlgorithm)
        parameters.hmacHashAlgorithm = "SHA-512";
      if (parameters.iterationCount === void 0) {
        parameters.iterationCount = 2048;
      }
      if (!parameters.keyEncryptionAlgorithm) {
        parameters.keyEncryptionAlgorithm = {
          name: "AES-KW",
          length: 256
        };
      }
      if (!parameters.keyEncryptionAlgorithmParams)
        parameters.keyEncryptionAlgorithmParams = new Null();
      switch (variant) {
        case 1:
          {
            const kekOID = crypto2.getOIDByAlgorithm(parameters.keyEncryptionAlgorithm, true, "keyEncryptionAlgorithm");
            const keyInfo = new KEKRecipientInfo({
              version: 4,
              kekid: new KEKIdentifier({
                keyIdentifier: new OctetString({ valueHex: parameters.keyIdentifier })
              }),
              keyEncryptionAlgorithm: new AlgorithmIdentifier({
                algorithmId: kekOID,
                algorithmParams: parameters.keyEncryptionAlgorithmParams
              }),
              preDefinedKEK: preDefinedData
            });
            this.recipientInfos.push(new RecipientInfo({
              variant: 3,
              value: keyInfo
            }));
          }
          break;
        case 2:
          {
            const pbkdf2OID = crypto2.getOIDByAlgorithm({ name: "PBKDF2" }, true, "keyDerivationAlgorithm");
            const saltBuffer = new ArrayBuffer(64);
            const saltView = new Uint8Array(saltBuffer);
            crypto2.getRandomValues(saltView);
            const hmacOID = crypto2.getOIDByAlgorithm({
              name: "HMAC",
              hash: {
                name: parameters.hmacHashAlgorithm
              }
            }, true, "hmacHashAlgorithm");
            const pbkdf2Params = new PBKDF2Params({
              salt: new OctetString({ valueHex: saltBuffer }),
              iterationCount: parameters.iterationCount,
              prf: new AlgorithmIdentifier({
                algorithmId: hmacOID,
                algorithmParams: new Null()
              })
            });
            const kekOID = crypto2.getOIDByAlgorithm(parameters.keyEncryptionAlgorithm, true, "keyEncryptionAlgorithm");
            const keyInfo = new PasswordRecipientinfo({
              version: 0,
              keyDerivationAlgorithm: new AlgorithmIdentifier({
                algorithmId: pbkdf2OID,
                algorithmParams: pbkdf2Params.toSchema()
              }),
              keyEncryptionAlgorithm: new AlgorithmIdentifier({
                algorithmId: kekOID,
                algorithmParams: parameters.keyEncryptionAlgorithmParams
              }),
              password: preDefinedData
            });
            this.recipientInfos.push(new RecipientInfo({
              variant: 4,
              value: keyInfo
            }));
          }
          break;
        default:
          throw new Error(`Unknown value for "variant": ${variant}`);
      }
    }
    addRecipientByKeyIdentifier(key, keyId, parameters, crypto2 = getCrypto(true)) {
      const encryptionParameters = Object.assign({}, defaultEncryptionParams, parameters || {});
      const recipientIdentifier = new KeyAgreeRecipientIdentifier({
        variant: 2,
        value: new RecipientKeyIdentifier({
          subjectKeyIdentifier: new OctetString({ valueHex: keyId })
        })
      });
      this._addKeyAgreeRecipientInfo(recipientIdentifier, encryptionParameters, { recipientPublicKey: key }, crypto2);
    }
    _addKeyAgreeRecipientInfo(recipientIdentifier, encryptionParameters, extraRecipientInfoParams, crypto2 = getCrypto(true)) {
      const encryptedKey = new RecipientEncryptedKey({
        rid: recipientIdentifier
      });
      const aesKWoid = crypto2.getOIDByAlgorithm({
        name: "AES-KW",
        length: encryptionParameters.kekEncryptionLength
      }, true, "keyEncryptionAlgorithm");
      const aesKW = new AlgorithmIdentifier({
        algorithmId: aesKWoid
      });
      const ecdhOID = crypto2.getOIDByAlgorithm({
        name: "ECDH",
        kdf: encryptionParameters.kdfAlgorithm
      }, true, "KeyAgreeRecipientInfo");
      const ukmBuffer = new ArrayBuffer(64);
      const ukmView = new Uint8Array(ukmBuffer);
      crypto2.getRandomValues(ukmView);
      const recipientInfoParams = {
        version: 3,
        ukm: new OctetString({ valueHex: ukmBuffer }),
        keyEncryptionAlgorithm: new AlgorithmIdentifier({
          algorithmId: ecdhOID,
          algorithmParams: aesKW.toSchema()
        }),
        recipientEncryptedKeys: new RecipientEncryptedKeys({
          encryptedKeys: [encryptedKey]
        })
      };
      const keyInfo = new KeyAgreeRecipientInfo(Object.assign(recipientInfoParams, extraRecipientInfoParams));
      this.recipientInfos.push(new RecipientInfo({
        variant: 2,
        value: keyInfo
      }));
    }
    async encrypt(contentEncryptionAlgorithm, contentToEncrypt, crypto2 = getCrypto(true)) {
      const ivBuffer = new ArrayBuffer(16);
      const ivView = new Uint8Array(ivBuffer);
      crypto2.getRandomValues(ivView);
      const contentView = new Uint8Array(contentToEncrypt);
      const contentEncryptionOID = crypto2.getOIDByAlgorithm(contentEncryptionAlgorithm, true, "contentEncryptionAlgorithm");
      const sessionKey = await crypto2.generateKey(contentEncryptionAlgorithm, true, ["encrypt"]);
      const encryptedContent = await crypto2.encrypt({
        name: contentEncryptionAlgorithm.name,
        iv: ivView
      }, sessionKey, contentView);
      const exportedSessionKey = await crypto2.exportKey("raw", sessionKey);
      this.version = 2;
      this.encryptedContentInfo = new EncryptedContentInfo({
        disableSplit: this.policy.disableSplit,
        contentType: "1.2.840.113549.1.7.1",
        contentEncryptionAlgorithm: new AlgorithmIdentifier({
          algorithmId: contentEncryptionOID,
          algorithmParams: new OctetString({ valueHex: ivBuffer })
        }),
        encryptedContent: new OctetString({ valueHex: encryptedContent })
      });
      const SubKeyAgreeRecipientInfo = async (index) => {
        const recipientInfo = this.recipientInfos[index].value;
        let recipientCurve;
        let recipientPublicKey;
        if (recipientInfo.recipientPublicKey) {
          recipientCurve = recipientInfo.recipientPublicKey.algorithm.namedCurve;
          recipientPublicKey = recipientInfo.recipientPublicKey;
        } else if (recipientInfo.recipientCertificate) {
          const curveObject = recipientInfo.recipientCertificate.subjectPublicKeyInfo.algorithm.algorithmParams;
          if (curveObject.constructor.blockName() !== ObjectIdentifier.blockName())
            throw new Error(`Incorrect "recipientCertificate" for index ${index}`);
          const curveOID = curveObject.valueBlock.toString();
          switch (curveOID) {
            case "1.2.840.10045.3.1.7":
              recipientCurve = "P-256";
              break;
            case "1.3.132.0.34":
              recipientCurve = "P-384";
              break;
            case "1.3.132.0.35":
              recipientCurve = "P-521";
              break;
            default:
              throw new Error(`Incorrect curve OID for index ${index}`);
          }
          recipientPublicKey = await recipientInfo.recipientCertificate.getPublicKey({
            algorithm: {
              algorithm: {
                name: "ECDH",
                namedCurve: recipientCurve
              },
              usages: []
            }
          }, crypto2);
        } else {
          throw new Error("Unsupported RecipientInfo");
        }
        const recipientCurveLength = curveLengthByName[recipientCurve];
        const ecdhKeys = await crypto2.generateKey({ name: "ECDH", namedCurve: recipientCurve }, true, ["deriveBits"]);
        const exportedECDHPublicKey = await crypto2.exportKey("spki", ecdhKeys.publicKey);
        const derivedBits = await crypto2.deriveBits({
          name: "ECDH",
          public: recipientPublicKey
        }, ecdhKeys.privateKey, recipientCurveLength);
        const aesKWAlgorithm = new AlgorithmIdentifier({ schema: recipientInfo.keyEncryptionAlgorithm.algorithmParams });
        const kwAlgorithm = crypto2.getAlgorithmByOID(aesKWAlgorithm.algorithmId, true, "aesKWAlgorithm");
        let kwLength = kwAlgorithm.length;
        const kwLengthBuffer = new ArrayBuffer(4);
        const kwLengthView = new Uint8Array(kwLengthBuffer);
        for (let j = 3; j >= 0; j--) {
          kwLengthView[j] = kwLength;
          kwLength >>= 8;
        }
        const eccInfo = new ECCCMSSharedInfo({
          keyInfo: new AlgorithmIdentifier({
            algorithmId: aesKWAlgorithm.algorithmId
          }),
          entityUInfo: recipientInfo.ukm,
          suppPubInfo: new OctetString({ valueHex: kwLengthBuffer })
        });
        const encodedInfo = eccInfo.toSchema().toBER(false);
        const ecdhAlgorithm = crypto2.getAlgorithmByOID(recipientInfo.keyEncryptionAlgorithm.algorithmId, true, "ecdhAlgorithm");
        const derivedKeyRaw = await kdf(ecdhAlgorithm.kdf, derivedBits, kwAlgorithm.length, encodedInfo, crypto2);
        const awsKW = await crypto2.importKey("raw", derivedKeyRaw, { name: "AES-KW" }, true, ["wrapKey"]);
        const wrappedKey = await crypto2.wrapKey("raw", sessionKey, awsKW, { name: "AES-KW" });
        const originator = new OriginatorIdentifierOrKey();
        originator.variant = 3;
        originator.value = OriginatorPublicKey.fromBER(exportedECDHPublicKey);
        recipientInfo.originator = originator;
        recipientInfo.recipientEncryptedKeys.encryptedKeys[0].encryptedKey = new OctetString({ valueHex: wrappedKey });
        return { ecdhPrivateKey: ecdhKeys.privateKey };
      };
      const SubKeyTransRecipientInfo = async (index) => {
        const recipientInfo = this.recipientInfos[index].value;
        const algorithmParameters = crypto2.getAlgorithmByOID(recipientInfo.keyEncryptionAlgorithm.algorithmId, true, "keyEncryptionAlgorithm");
        if (algorithmParameters.name === "RSA-OAEP") {
          const schema = recipientInfo.keyEncryptionAlgorithm.algorithmParams;
          const rsaOAEPParams = new RSAESOAEPParams({ schema });
          algorithmParameters.hash = crypto2.getAlgorithmByOID(rsaOAEPParams.hashAlgorithm.algorithmId);
          if ("name" in algorithmParameters.hash === false)
            throw new Error(`Incorrect OID for hash algorithm: ${rsaOAEPParams.hashAlgorithm.algorithmId}`);
        }
        try {
          const publicKey = await recipientInfo.recipientCertificate.getPublicKey({
            algorithm: {
              algorithm: algorithmParameters,
              usages: ["encrypt", "wrapKey"]
            }
          }, crypto2);
          const encryptedKey = await crypto2.encrypt(publicKey.algorithm, publicKey, exportedSessionKey);
          recipientInfo.encryptedKey = new OctetString({ valueHex: encryptedKey });
        } catch {
        }
      };
      const SubKEKRecipientInfo = async (index) => {
        const recipientInfo = this.recipientInfos[index].value;
        const kekAlgorithm = crypto2.getAlgorithmByOID(recipientInfo.keyEncryptionAlgorithm.algorithmId, true, "kekAlgorithm");
        const kekKey = await crypto2.importKey("raw", new Uint8Array(recipientInfo.preDefinedKEK), kekAlgorithm, true, ["wrapKey"]);
        const wrappedKey = await crypto2.wrapKey("raw", sessionKey, kekKey, kekAlgorithm);
        recipientInfo.encryptedKey = new OctetString({ valueHex: wrappedKey });
      };
      const SubPasswordRecipientinfo = async (index) => {
        const recipientInfo = this.recipientInfos[index].value;
        let pbkdf2Params;
        if (!recipientInfo.keyDerivationAlgorithm)
          throw new Error('Please append encoded "keyDerivationAlgorithm"');
        if (!recipientInfo.keyDerivationAlgorithm.algorithmParams)
          throw new Error('Incorrectly encoded "keyDerivationAlgorithm"');
        try {
          pbkdf2Params = new PBKDF2Params({ schema: recipientInfo.keyDerivationAlgorithm.algorithmParams });
        } catch {
          throw new Error('Incorrectly encoded "keyDerivationAlgorithm"');
        }
        const passwordView = new Uint8Array(recipientInfo.password);
        const derivationKey = await crypto2.importKey("raw", passwordView, "PBKDF2", false, ["deriveKey"]);
        const kekAlgorithm = crypto2.getAlgorithmByOID(recipientInfo.keyEncryptionAlgorithm.algorithmId, true, "kekAlgorithm");
        let hmacHashAlgorithm = "SHA-1";
        if (pbkdf2Params.prf) {
          const prfAlgorithm = crypto2.getAlgorithmByOID(pbkdf2Params.prf.algorithmId, true, "prfAlgorithm");
          hmacHashAlgorithm = prfAlgorithm.hash.name;
        }
        const saltView = new Uint8Array(pbkdf2Params.salt.valueBlock.valueHex);
        const iterations = pbkdf2Params.iterationCount;
        const derivedKey = await crypto2.deriveKey({
          name: "PBKDF2",
          hash: {
            name: hmacHashAlgorithm
          },
          salt: saltView,
          iterations
        }, derivationKey, kekAlgorithm, true, ["wrapKey"]);
        const wrappedKey = await crypto2.wrapKey("raw", sessionKey, derivedKey, kekAlgorithm);
        recipientInfo.encryptedKey = new OctetString({ valueHex: wrappedKey });
      };
      const res = [];
      for (let i = 0; i < this.recipientInfos.length; i++) {
        switch (this.recipientInfos[i].variant) {
          case 1:
            res.push(await SubKeyTransRecipientInfo(i));
            break;
          case 2:
            res.push(await SubKeyAgreeRecipientInfo(i));
            break;
          case 3:
            res.push(await SubKEKRecipientInfo(i));
            break;
          case 4:
            res.push(await SubPasswordRecipientinfo(i));
            break;
          default:
            throw new Error(`Unknown recipient type in array with index ${i}`);
        }
      }
      return res;
    }
    async decrypt(recipientIndex, parameters, crypto2 = getCrypto(true)) {
      const decryptionParameters = parameters || {};
      if (recipientIndex + 1 > this.recipientInfos.length) {
        throw new Error(`Maximum value for "index" is: ${this.recipientInfos.length - 1}`);
      }
      const SubKeyAgreeRecipientInfo = async (index) => {
        const recipientInfo = this.recipientInfos[index].value;
        let curveOID;
        let recipientCurve;
        let recipientCurveLength;
        const originator = recipientInfo.originator;
        if (decryptionParameters.recipientCertificate) {
          const curveObject = decryptionParameters.recipientCertificate.subjectPublicKeyInfo.algorithm.algorithmParams;
          if (curveObject.constructor.blockName() !== ObjectIdentifier.blockName()) {
            throw new Error(`Incorrect "recipientCertificate" for index ${index}`);
          }
          curveOID = curveObject.valueBlock.toString();
        } else if (originator.value.algorithm.algorithmParams) {
          const curveObject = originator.value.algorithm.algorithmParams;
          if (curveObject.constructor.blockName() !== ObjectIdentifier.blockName()) {
            throw new Error(`Incorrect originator for index ${index}`);
          }
          curveOID = curveObject.valueBlock.toString();
        } else {
          throw new Error('Parameter "recipientCertificate" is mandatory for "KeyAgreeRecipientInfo" if algorithm params are missing from originator');
        }
        if (!decryptionParameters.recipientPrivateKey)
          throw new Error('Parameter "recipientPrivateKey" is mandatory for "KeyAgreeRecipientInfo"');
        switch (curveOID) {
          case "1.2.840.10045.3.1.7":
            recipientCurve = "P-256";
            recipientCurveLength = 256;
            break;
          case "1.3.132.0.34":
            recipientCurve = "P-384";
            recipientCurveLength = 384;
            break;
          case "1.3.132.0.35":
            recipientCurve = "P-521";
            recipientCurveLength = 528;
            break;
          default:
            throw new Error(`Incorrect curve OID for index ${index}`);
        }
        let ecdhPrivateKey;
        let keyCrypto = crypto2;
        if (import_pvtsutils.BufferSourceConverter.isBufferSource(decryptionParameters.recipientPrivateKey)) {
          ecdhPrivateKey = await crypto2.importKey("pkcs8", decryptionParameters.recipientPrivateKey, {
            name: "ECDH",
            namedCurve: recipientCurve
          }, true, ["deriveBits"]);
        } else {
          ecdhPrivateKey = decryptionParameters.recipientPrivateKey;
          if ("crypto" in decryptionParameters && decryptionParameters.crypto) {
            keyCrypto = decryptionParameters.crypto.subtle;
          }
        }
        if ("algorithmParams" in originator.value.algorithm === false)
          originator.value.algorithm.algorithmParams = new ObjectIdentifier({ value: curveOID });
        const buffer = originator.value.toSchema().toBER(false);
        const ecdhPublicKey = await crypto2.importKey("spki", buffer, {
          name: "ECDH",
          namedCurve: recipientCurve
        }, true, []);
        const sharedSecret = await keyCrypto.deriveBits({
          name: "ECDH",
          public: ecdhPublicKey
        }, ecdhPrivateKey, recipientCurveLength);
        async function applyKDF(includeAlgorithmParams) {
          includeAlgorithmParams = includeAlgorithmParams || false;
          const aesKWAlgorithm = new AlgorithmIdentifier({ schema: recipientInfo.keyEncryptionAlgorithm.algorithmParams });
          const kwAlgorithm = crypto2.getAlgorithmByOID(aesKWAlgorithm.algorithmId, true, "kwAlgorithm");
          let kwLength = kwAlgorithm.length;
          const kwLengthBuffer = new ArrayBuffer(4);
          const kwLengthView = new Uint8Array(kwLengthBuffer);
          for (let j = 3; j >= 0; j--) {
            kwLengthView[j] = kwLength;
            kwLength >>= 8;
          }
          const keyInfoAlgorithm = {
            algorithmId: aesKWAlgorithm.algorithmId
          };
          if (includeAlgorithmParams) {
            keyInfoAlgorithm.algorithmParams = new Null();
          }
          const eccInfo = new ECCCMSSharedInfo({
            keyInfo: new AlgorithmIdentifier(keyInfoAlgorithm),
            entityUInfo: recipientInfo.ukm,
            suppPubInfo: new OctetString({ valueHex: kwLengthBuffer })
          });
          const encodedInfo = eccInfo.toSchema().toBER(false);
          const ecdhAlgorithm = crypto2.getAlgorithmByOID(recipientInfo.keyEncryptionAlgorithm.algorithmId, true, "ecdhAlgorithm");
          if (!ecdhAlgorithm.name) {
            throw new Error(`Incorrect OID for key encryption algorithm: ${recipientInfo.keyEncryptionAlgorithm.algorithmId}`);
          }
          return kdf(ecdhAlgorithm.kdf, sharedSecret, kwAlgorithm.length, encodedInfo, crypto2);
        }
        const kdfResult = await applyKDF();
        const importAesKwKey = async (kdfResult2) => {
          return crypto2.importKey("raw", kdfResult2, { name: "AES-KW" }, true, ["unwrapKey"]);
        };
        const aesKwKey = await importAesKwKey(kdfResult);
        const unwrapSessionKey = async (aesKwKey2) => {
          const algorithmId2 = this.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId;
          const contentEncryptionAlgorithm2 = crypto2.getAlgorithmByOID(algorithmId2, true, "contentEncryptionAlgorithm");
          return crypto2.unwrapKey("raw", recipientInfo.recipientEncryptedKeys.encryptedKeys[0].encryptedKey.valueBlock.valueHexView, aesKwKey2, { name: "AES-KW" }, contentEncryptionAlgorithm2, true, ["decrypt"]);
        };
        try {
          return await unwrapSessionKey(aesKwKey);
        } catch {
          const kdfResult2 = await applyKDF(true);
          const aesKwKey2 = await importAesKwKey(kdfResult2);
          return unwrapSessionKey(aesKwKey2);
        }
      };
      const SubKeyTransRecipientInfo = async (index) => {
        const recipientInfo = this.recipientInfos[index].value;
        if (!decryptionParameters.recipientPrivateKey) {
          throw new Error('Parameter "recipientPrivateKey" is mandatory for "KeyTransRecipientInfo"');
        }
        const algorithmParameters = crypto2.getAlgorithmByOID(recipientInfo.keyEncryptionAlgorithm.algorithmId, true, "keyEncryptionAlgorithm");
        if (algorithmParameters.name === "RSA-OAEP") {
          const schema = recipientInfo.keyEncryptionAlgorithm.algorithmParams;
          const rsaOAEPParams = new RSAESOAEPParams({ schema });
          algorithmParameters.hash = crypto2.getAlgorithmByOID(rsaOAEPParams.hashAlgorithm.algorithmId);
          if ("name" in algorithmParameters.hash === false)
            throw new Error(`Incorrect OID for hash algorithm: ${rsaOAEPParams.hashAlgorithm.algorithmId}`);
        }
        let privateKey;
        let keyCrypto = crypto2;
        if (import_pvtsutils.BufferSourceConverter.isBufferSource(decryptionParameters.recipientPrivateKey)) {
          privateKey = await crypto2.importKey("pkcs8", decryptionParameters.recipientPrivateKey, algorithmParameters, true, ["decrypt"]);
        } else {
          privateKey = decryptionParameters.recipientPrivateKey;
          if ("crypto" in decryptionParameters && decryptionParameters.crypto) {
            keyCrypto = decryptionParameters.crypto.subtle;
          }
        }
        const sessionKey = await keyCrypto.decrypt(privateKey.algorithm, privateKey, recipientInfo.encryptedKey.valueBlock.valueHexView);
        const algorithmId2 = this.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId;
        const contentEncryptionAlgorithm2 = crypto2.getAlgorithmByOID(algorithmId2, true, "contentEncryptionAlgorithm");
        if ("name" in contentEncryptionAlgorithm2 === false)
          throw new Error(`Incorrect "contentEncryptionAlgorithm": ${algorithmId2}`);
        return crypto2.importKey("raw", sessionKey, contentEncryptionAlgorithm2, true, ["decrypt"]);
      };
      const SubKEKRecipientInfo = async (index) => {
        const recipientInfo = this.recipientInfos[index].value;
        if (!decryptionParameters.preDefinedData)
          throw new Error('Parameter "preDefinedData" is mandatory for "KEKRecipientInfo"');
        const kekAlgorithm = crypto2.getAlgorithmByOID(recipientInfo.keyEncryptionAlgorithm.algorithmId, true, "kekAlgorithm");
        const importedKey = await crypto2.importKey("raw", decryptionParameters.preDefinedData, kekAlgorithm, true, ["unwrapKey"]);
        const algorithmId2 = this.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId;
        const contentEncryptionAlgorithm2 = crypto2.getAlgorithmByOID(algorithmId2, true, "contentEncryptionAlgorithm");
        if (!contentEncryptionAlgorithm2.name) {
          throw new Error(`Incorrect "contentEncryptionAlgorithm": ${algorithmId2}`);
        }
        return crypto2.unwrapKey("raw", recipientInfo.encryptedKey.valueBlock.valueHexView, importedKey, kekAlgorithm, contentEncryptionAlgorithm2, true, ["decrypt"]);
      };
      const SubPasswordRecipientinfo = async (index) => {
        const recipientInfo = this.recipientInfos[index].value;
        let pbkdf2Params;
        if (!decryptionParameters.preDefinedData) {
          throw new Error('Parameter "preDefinedData" is mandatory for "KEKRecipientInfo"');
        }
        if (!recipientInfo.keyDerivationAlgorithm) {
          throw new Error('Please append encoded "keyDerivationAlgorithm"');
        }
        if (!recipientInfo.keyDerivationAlgorithm.algorithmParams) {
          throw new Error('Incorrectly encoded "keyDerivationAlgorithm"');
        }
        try {
          pbkdf2Params = new PBKDF2Params({ schema: recipientInfo.keyDerivationAlgorithm.algorithmParams });
        } catch {
          throw new Error('Incorrectly encoded "keyDerivationAlgorithm"');
        }
        const pbkdf2Key = await crypto2.importKey("raw", decryptionParameters.preDefinedData, "PBKDF2", false, ["deriveKey"]);
        const kekAlgorithm = crypto2.getAlgorithmByOID(recipientInfo.keyEncryptionAlgorithm.algorithmId, true, "keyEncryptionAlgorithm");
        const hmacHashAlgorithm = pbkdf2Params.prf ? crypto2.getAlgorithmByOID(pbkdf2Params.prf.algorithmId, true, "prfAlgorithm").hash.name : "SHA-1";
        const saltView = new Uint8Array(pbkdf2Params.salt.valueBlock.valueHex);
        const iterations = pbkdf2Params.iterationCount;
        const kekKey = await crypto2.deriveKey({
          name: "PBKDF2",
          hash: {
            name: hmacHashAlgorithm
          },
          salt: saltView,
          iterations
        }, pbkdf2Key, kekAlgorithm, true, ["unwrapKey"]);
        const algorithmId2 = this.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId;
        const contentEncryptionAlgorithm2 = crypto2.getAlgorithmByOID(algorithmId2, true, "contentEncryptionAlgorithm");
        return crypto2.unwrapKey("raw", recipientInfo.encryptedKey.valueBlock.valueHexView, kekKey, kekAlgorithm, contentEncryptionAlgorithm2, true, ["decrypt"]);
      };
      let unwrappedKey;
      switch (this.recipientInfos[recipientIndex].variant) {
        case 1:
          unwrappedKey = await SubKeyTransRecipientInfo(recipientIndex);
          break;
        case 2:
          unwrappedKey = await SubKeyAgreeRecipientInfo(recipientIndex);
          break;
        case 3:
          unwrappedKey = await SubKEKRecipientInfo(recipientIndex);
          break;
        case 4:
          unwrappedKey = await SubPasswordRecipientinfo(recipientIndex);
          break;
        default:
          throw new Error(`Unknown recipient type in array with index ${recipientIndex}`);
      }
      const algorithmId = this.encryptedContentInfo.contentEncryptionAlgorithm.algorithmId;
      const contentEncryptionAlgorithm = crypto2.getAlgorithmByOID(algorithmId, true, "contentEncryptionAlgorithm");
      const ivBuffer = this.encryptedContentInfo.contentEncryptionAlgorithm.algorithmParams.valueBlock.valueHex;
      const ivView = new Uint8Array(ivBuffer);
      if (!this.encryptedContentInfo.encryptedContent) {
        throw new Error("Required property `encryptedContent` is empty");
      }
      const dataBuffer = this.encryptedContentInfo.getEncryptedContent();
      return crypto2.decrypt({
        name: contentEncryptionAlgorithm.name,
        iv: ivView
      }, unwrappedKey, dataBuffer);
    }
  };
  EnvelopedData.CLASS_NAME = "EnvelopedData";
  var SAFE_CONTENTS = "safeContents";
  var PARSED_VALUE$1 = "parsedValue";
  var CONTENT_INFOS = "contentInfos";
  var AuthenticatedSafe = class _AuthenticatedSafe extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.safeContents = getParametersValue(parameters, SAFE_CONTENTS, _AuthenticatedSafe.defaultValues(SAFE_CONTENTS));
      if (PARSED_VALUE$1 in parameters) {
        this.parsedValue = getParametersValue(parameters, PARSED_VALUE$1, _AuthenticatedSafe.defaultValues(PARSED_VALUE$1));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case SAFE_CONTENTS:
          return [];
        case PARSED_VALUE$1:
          return {};
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case SAFE_CONTENTS:
          return memberValue.length === 0;
        case PARSED_VALUE$1:
          return memberValue instanceof Object && Object.keys(memberValue).length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Repeated({
            name: names.contentInfos || EMPTY_STRING2,
            value: ContentInfo.schema()
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, [
        CONTENT_INFOS
      ]);
      const asn1 = compareSchema(schema, schema, _AuthenticatedSafe.schema({
        names: {
          contentInfos: CONTENT_INFOS
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.safeContents = Array.from(asn1.result.contentInfos, (element) => new ContentInfo({ schema: element }));
    }
    toSchema() {
      return new Sequence({
        value: Array.from(this.safeContents, (o) => o.toSchema())
      });
    }
    toJSON() {
      return {
        safeContents: Array.from(this.safeContents, (o) => o.toJSON())
      };
    }
    async parseInternalValues(parameters, crypto2 = getCrypto(true)) {
      ParameterError.assert(parameters, SAFE_CONTENTS);
      ArgumentError.assert(parameters.safeContents, SAFE_CONTENTS, "Array");
      if (parameters.safeContents.length !== this.safeContents.length) {
        throw new ArgumentError('Length of "parameters.safeContents" must be equal to "this.safeContents.length"');
      }
      this.parsedValue = {
        safeContents: []
      };
      for (const [index, content] of this.safeContents.entries()) {
        const safeContent = parameters.safeContents[index];
        const errorTarget = `parameters.safeContents[${index}]`;
        switch (content.contentType) {
          case id_ContentType_Data:
            {
              ArgumentError.assert(content.content, "this.safeContents[j].content", OctetString);
              const authSafeContent = content.content.getValue();
              this.parsedValue.safeContents.push({
                privacyMode: 0,
                value: SafeContents.fromBER(authSafeContent)
              });
            }
            break;
          case id_ContentType_EnvelopedData:
            {
              const cmsEnveloped = new EnvelopedData({ schema: content.content });
              ParameterError.assert(errorTarget, safeContent, "recipientCertificate", "recipientKey");
              const envelopedData = safeContent;
              const recipientCertificate = envelopedData.recipientCertificate;
              const recipientKey = envelopedData.recipientKey;
              const decrypted = await cmsEnveloped.decrypt(0, {
                recipientCertificate,
                recipientPrivateKey: recipientKey
              }, crypto2);
              this.parsedValue.safeContents.push({
                privacyMode: 2,
                value: SafeContents.fromBER(decrypted)
              });
            }
            break;
          case id_ContentType_EncryptedData:
            {
              const cmsEncrypted = new EncryptedData({ schema: content.content });
              ParameterError.assert(errorTarget, safeContent, "password");
              const password = safeContent.password;
              const decrypted = await cmsEncrypted.decrypt({
                password
              }, crypto2);
              this.parsedValue.safeContents.push({
                privacyMode: 1,
                value: SafeContents.fromBER(decrypted)
              });
            }
            break;
          default:
            throw new Error(`Unknown "contentType" for AuthenticatedSafe: " ${content.contentType}`);
        }
      }
    }
    async makeInternalValues(parameters, crypto2 = getCrypto(true)) {
      if (!this.parsedValue) {
        throw new Error('Please run "parseValues" first or add "parsedValue" manually');
      }
      ArgumentError.assert(this.parsedValue, "this.parsedValue", "object");
      ArgumentError.assert(this.parsedValue.safeContents, "this.parsedValue.safeContents", "Array");
      ArgumentError.assert(parameters, "parameters", "object");
      ParameterError.assert(parameters, "safeContents");
      ArgumentError.assert(parameters.safeContents, "parameters.safeContents", "Array");
      if (parameters.safeContents.length !== this.parsedValue.safeContents.length) {
        throw new ArgumentError('Length of "parameters.safeContents" must be equal to "this.parsedValue.safeContents"');
      }
      this.safeContents = [];
      for (const [index, content] of this.parsedValue.safeContents.entries()) {
        ParameterError.assert("content", content, "privacyMode", "value");
        ArgumentError.assert(content.value, "content.value", SafeContents);
        switch (content.privacyMode) {
          case 0:
            {
              const contentBuffer = content.value.toSchema().toBER(false);
              this.safeContents.push(new ContentInfo({
                contentType: "1.2.840.113549.1.7.1",
                content: new OctetString({ valueHex: contentBuffer })
              }));
            }
            break;
          case 1:
            {
              const cmsEncrypted = new EncryptedData();
              const currentParameters = parameters.safeContents[index];
              currentParameters.contentToEncrypt = content.value.toSchema().toBER(false);
              await cmsEncrypted.encrypt(currentParameters, crypto2);
              this.safeContents.push(new ContentInfo({
                contentType: "1.2.840.113549.1.7.6",
                content: cmsEncrypted.toSchema()
              }));
            }
            break;
          case 2:
            {
              const cmsEnveloped = new EnvelopedData();
              const contentToEncrypt = content.value.toSchema().toBER(false);
              const safeContent = parameters.safeContents[index];
              ParameterError.assert(`parameters.safeContents[${index}]`, safeContent, "encryptingCertificate", "encryptionAlgorithm");
              switch (true) {
                case safeContent.encryptionAlgorithm.name.toLowerCase() === "aes-cbc":
                case safeContent.encryptionAlgorithm.name.toLowerCase() === "aes-gcm":
                  break;
                default:
                  throw new Error(`Incorrect parameter "encryptionAlgorithm" in "parameters.safeContents[i]": ${safeContent.encryptionAlgorithm}`);
              }
              switch (true) {
                case safeContent.encryptionAlgorithm.length === 128:
                case safeContent.encryptionAlgorithm.length === 192:
                case safeContent.encryptionAlgorithm.length === 256:
                  break;
                default:
                  throw new Error(`Incorrect parameter "encryptionAlgorithm.length" in "parameters.safeContents[i]": ${safeContent.encryptionAlgorithm.length}`);
              }
              const encryptionAlgorithm = safeContent.encryptionAlgorithm;
              cmsEnveloped.addRecipientByCertificate(safeContent.encryptingCertificate, {}, void 0, crypto2);
              await cmsEnveloped.encrypt(encryptionAlgorithm, contentToEncrypt, crypto2);
              this.safeContents.push(new ContentInfo({
                contentType: "1.2.840.113549.1.7.3",
                content: cmsEnveloped.toSchema()
              }));
            }
            break;
          default:
            throw new Error(`Incorrect value for "content.privacyMode": ${content.privacyMode}`);
        }
      }
      return this;
    }
  };
  AuthenticatedSafe.CLASS_NAME = "AuthenticatedSafe";
  var HASH_ALGORITHM$1 = "hashAlgorithm";
  var ISSUER_NAME_HASH = "issuerNameHash";
  var ISSUER_KEY_HASH = "issuerKeyHash";
  var SERIAL_NUMBER$1 = "serialNumber";
  var CLEAR_PROPS$j = [
    HASH_ALGORITHM$1,
    ISSUER_NAME_HASH,
    ISSUER_KEY_HASH,
    SERIAL_NUMBER$1
  ];
  var CertID = class _CertID extends PkiObject {
    static async create(certificate, parameters, crypto2 = getCrypto(true)) {
      const certID = new _CertID();
      await certID.createForCertificate(certificate, parameters, crypto2);
      return certID;
    }
    constructor(parameters = {}) {
      super();
      this.hashAlgorithm = getParametersValue(parameters, HASH_ALGORITHM$1, _CertID.defaultValues(HASH_ALGORITHM$1));
      this.issuerNameHash = getParametersValue(parameters, ISSUER_NAME_HASH, _CertID.defaultValues(ISSUER_NAME_HASH));
      this.issuerKeyHash = getParametersValue(parameters, ISSUER_KEY_HASH, _CertID.defaultValues(ISSUER_KEY_HASH));
      this.serialNumber = getParametersValue(parameters, SERIAL_NUMBER$1, _CertID.defaultValues(SERIAL_NUMBER$1));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case HASH_ALGORITHM$1:
          return new AlgorithmIdentifier();
        case ISSUER_NAME_HASH:
        case ISSUER_KEY_HASH:
          return new OctetString();
        case SERIAL_NUMBER$1:
          return new Integer();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case HASH_ALGORITHM$1:
          return memberValue.algorithmId === EMPTY_STRING2 && "algorithmParams" in memberValue === false;
        case ISSUER_NAME_HASH:
        case ISSUER_KEY_HASH:
        case SERIAL_NUMBER$1:
          return memberValue.isEqual(_CertID.defaultValues(SERIAL_NUMBER$1));
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          AlgorithmIdentifier.schema(names.hashAlgorithmObject || {
            names: {
              blockName: names.hashAlgorithm || EMPTY_STRING2
            }
          }),
          new OctetString({ name: names.issuerNameHash || EMPTY_STRING2 }),
          new OctetString({ name: names.issuerKeyHash || EMPTY_STRING2 }),
          new Integer({ name: names.serialNumber || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$j);
      const asn1 = compareSchema(schema, schema, _CertID.schema({
        names: {
          hashAlgorithm: HASH_ALGORITHM$1,
          issuerNameHash: ISSUER_NAME_HASH,
          issuerKeyHash: ISSUER_KEY_HASH,
          serialNumber: SERIAL_NUMBER$1
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.hashAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.hashAlgorithm });
      this.issuerNameHash = asn1.result.issuerNameHash;
      this.issuerKeyHash = asn1.result.issuerKeyHash;
      this.serialNumber = asn1.result.serialNumber;
    }
    toSchema() {
      return new Sequence({
        value: [
          this.hashAlgorithm.toSchema(),
          this.issuerNameHash,
          this.issuerKeyHash,
          this.serialNumber
        ]
      });
    }
    toJSON() {
      return {
        hashAlgorithm: this.hashAlgorithm.toJSON(),
        issuerNameHash: this.issuerNameHash.toJSON(),
        issuerKeyHash: this.issuerKeyHash.toJSON(),
        serialNumber: this.serialNumber.toJSON()
      };
    }
    isEqual(certificateID) {
      if (this.hashAlgorithm.algorithmId !== certificateID.hashAlgorithm.algorithmId) {
        return false;
      }
      if (!pvtsutils2.BufferSourceConverter.isEqual(this.issuerNameHash.valueBlock.valueHexView, certificateID.issuerNameHash.valueBlock.valueHexView)) {
        return false;
      }
      if (!pvtsutils2.BufferSourceConverter.isEqual(this.issuerKeyHash.valueBlock.valueHexView, certificateID.issuerKeyHash.valueBlock.valueHexView)) {
        return false;
      }
      if (!this.serialNumber.isEqual(certificateID.serialNumber)) {
        return false;
      }
      return true;
    }
    async createForCertificate(certificate, parameters, crypto2 = getCrypto(true)) {
      ParameterError.assert(parameters, HASH_ALGORITHM$1, "issuerCertificate");
      const hashOID = crypto2.getOIDByAlgorithm({ name: parameters.hashAlgorithm }, true, "hashAlgorithm");
      this.hashAlgorithm = new AlgorithmIdentifier({
        algorithmId: hashOID,
        algorithmParams: new Null()
      });
      const issuerCertificate = parameters.issuerCertificate;
      this.serialNumber = certificate.serialNumber;
      const hashIssuerName = await crypto2.digest({ name: parameters.hashAlgorithm }, issuerCertificate.subject.toSchema().toBER(false));
      this.issuerNameHash = new OctetString({ valueHex: hashIssuerName });
      const issuerKeyBuffer = issuerCertificate.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHexView;
      const hashIssuerKey = await crypto2.digest({ name: parameters.hashAlgorithm }, issuerKeyBuffer);
      this.issuerKeyHash = new OctetString({ valueHex: hashIssuerKey });
    }
  };
  CertID.CLASS_NAME = "CertID";
  var CERT_ID = "certID";
  var CERT_STATUS = "certStatus";
  var THIS_UPDATE = "thisUpdate";
  var NEXT_UPDATE = "nextUpdate";
  var SINGLE_EXTENSIONS = "singleExtensions";
  var CLEAR_PROPS$i = [
    CERT_ID,
    CERT_STATUS,
    THIS_UPDATE,
    NEXT_UPDATE,
    SINGLE_EXTENSIONS
  ];
  var SingleResponse = class _SingleResponse extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.certID = getParametersValue(parameters, CERT_ID, _SingleResponse.defaultValues(CERT_ID));
      this.certStatus = getParametersValue(parameters, CERT_STATUS, _SingleResponse.defaultValues(CERT_STATUS));
      this.thisUpdate = getParametersValue(parameters, THIS_UPDATE, _SingleResponse.defaultValues(THIS_UPDATE));
      if (NEXT_UPDATE in parameters) {
        this.nextUpdate = getParametersValue(parameters, NEXT_UPDATE, _SingleResponse.defaultValues(NEXT_UPDATE));
      }
      if (SINGLE_EXTENSIONS in parameters) {
        this.singleExtensions = getParametersValue(parameters, SINGLE_EXTENSIONS, _SingleResponse.defaultValues(SINGLE_EXTENSIONS));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case CERT_ID:
          return new CertID();
        case CERT_STATUS:
          return {};
        case THIS_UPDATE:
        case NEXT_UPDATE:
          return new Date(0, 0, 0);
        case SINGLE_EXTENSIONS:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case CERT_ID:
          return CertID.compareWithDefault("hashAlgorithm", memberValue.hashAlgorithm) && CertID.compareWithDefault("issuerNameHash", memberValue.issuerNameHash) && CertID.compareWithDefault("issuerKeyHash", memberValue.issuerKeyHash) && CertID.compareWithDefault("serialNumber", memberValue.serialNumber);
        case CERT_STATUS:
          return Object.keys(memberValue).length === 0;
        case THIS_UPDATE:
        case NEXT_UPDATE:
          return memberValue === _SingleResponse.defaultValues(memberName);
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          CertID.schema(names.certID || {}),
          new Choice({
            value: [
              new Primitive({
                name: names.certStatus || EMPTY_STRING2,
                idBlock: {
                  tagClass: 3,
                  tagNumber: 0
                }
              }),
              new Constructed({
                name: names.certStatus || EMPTY_STRING2,
                idBlock: {
                  tagClass: 3,
                  tagNumber: 1
                },
                value: [
                  new GeneralizedTime(),
                  new Constructed({
                    optional: true,
                    idBlock: {
                      tagClass: 3,
                      tagNumber: 0
                    },
                    value: [new Enumerated()]
                  })
                ]
              }),
              new Primitive({
                name: names.certStatus || EMPTY_STRING2,
                idBlock: {
                  tagClass: 3,
                  tagNumber: 2
                },
                lenBlock: { length: 1 }
              })
            ]
          }),
          new GeneralizedTime({ name: names.thisUpdate || EMPTY_STRING2 }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [new GeneralizedTime({ name: names.nextUpdate || EMPTY_STRING2 })]
          }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: [Extensions.schema(names.singleExtensions || {})]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$i);
      const asn1 = compareSchema(schema, schema, _SingleResponse.schema({
        names: {
          certID: {
            names: {
              blockName: CERT_ID
            }
          },
          certStatus: CERT_STATUS,
          thisUpdate: THIS_UPDATE,
          nextUpdate: NEXT_UPDATE,
          singleExtensions: {
            names: {
              blockName: SINGLE_EXTENSIONS
            }
          }
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.certID = new CertID({ schema: asn1.result.certID });
      this.certStatus = asn1.result.certStatus;
      this.thisUpdate = asn1.result.thisUpdate.toDate();
      if (NEXT_UPDATE in asn1.result)
        this.nextUpdate = asn1.result.nextUpdate.toDate();
      if (SINGLE_EXTENSIONS in asn1.result)
        this.singleExtensions = Array.from(asn1.result.singleExtensions.valueBlock.value, (element) => new Extension({ schema: element }));
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(this.certID.toSchema());
      outputArray.push(this.certStatus);
      outputArray.push(new GeneralizedTime({ valueDate: this.thisUpdate }));
      if (this.nextUpdate) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [new GeneralizedTime({ valueDate: this.nextUpdate })]
        }));
      }
      if (this.singleExtensions) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          value: [new Sequence({ value: Array.from(this.singleExtensions, (o) => o.toSchema()) })]
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        certID: this.certID.toJSON(),
        certStatus: this.certStatus.toJSON(),
        thisUpdate: this.thisUpdate
      };
      if (this.nextUpdate) {
        res.nextUpdate = this.nextUpdate;
      }
      if (this.singleExtensions) {
        res.singleExtensions = Array.from(this.singleExtensions, (o) => o.toJSON());
      }
      return res;
    }
  };
  SingleResponse.CLASS_NAME = "SingleResponse";
  var TBS$2 = "tbs";
  var VERSION$7 = "version";
  var RESPONDER_ID = "responderID";
  var PRODUCED_AT = "producedAt";
  var RESPONSES = "responses";
  var RESPONSE_EXTENSIONS = "responseExtensions";
  var RESPONSE_DATA = "ResponseData";
  var RESPONSE_DATA_VERSION = `${RESPONSE_DATA}.${VERSION$7}`;
  var RESPONSE_DATA_RESPONDER_ID = `${RESPONSE_DATA}.${RESPONDER_ID}`;
  var RESPONSE_DATA_PRODUCED_AT = `${RESPONSE_DATA}.${PRODUCED_AT}`;
  var RESPONSE_DATA_RESPONSES = `${RESPONSE_DATA}.${RESPONSES}`;
  var RESPONSE_DATA_RESPONSE_EXTENSIONS = `${RESPONSE_DATA}.${RESPONSE_EXTENSIONS}`;
  var CLEAR_PROPS$h = [
    RESPONSE_DATA,
    RESPONSE_DATA_VERSION,
    RESPONSE_DATA_RESPONDER_ID,
    RESPONSE_DATA_PRODUCED_AT,
    RESPONSE_DATA_RESPONSES,
    RESPONSE_DATA_RESPONSE_EXTENSIONS
  ];
  var ResponseData = class _ResponseData extends PkiObject {
    get tbs() {
      return pvtsutils2.BufferSourceConverter.toArrayBuffer(this.tbsView);
    }
    set tbs(value) {
      this.tbsView = new Uint8Array(value);
    }
    constructor(parameters = {}) {
      super();
      this.tbsView = new Uint8Array(getParametersValue(parameters, TBS$2, _ResponseData.defaultValues(TBS$2)));
      if (VERSION$7 in parameters) {
        this.version = getParametersValue(parameters, VERSION$7, _ResponseData.defaultValues(VERSION$7));
      }
      this.responderID = getParametersValue(parameters, RESPONDER_ID, _ResponseData.defaultValues(RESPONDER_ID));
      this.producedAt = getParametersValue(parameters, PRODUCED_AT, _ResponseData.defaultValues(PRODUCED_AT));
      this.responses = getParametersValue(parameters, RESPONSES, _ResponseData.defaultValues(RESPONSES));
      if (RESPONSE_EXTENSIONS in parameters) {
        this.responseExtensions = getParametersValue(parameters, RESPONSE_EXTENSIONS, _ResponseData.defaultValues(RESPONSE_EXTENSIONS));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VERSION$7:
          return 0;
        case TBS$2:
          return EMPTY_BUFFER2;
        case RESPONDER_ID:
          return {};
        case PRODUCED_AT:
          return new Date(0, 0, 0);
        case RESPONSES:
        case RESPONSE_EXTENSIONS:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case TBS$2:
          return memberValue.byteLength === 0;
        case RESPONDER_ID:
          return Object.keys(memberValue).length === 0;
        case PRODUCED_AT:
          return memberValue === _ResponseData.defaultValues(memberName);
        case RESPONSES:
        case RESPONSE_EXTENSIONS:
          return memberValue.length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || RESPONSE_DATA,
        value: [
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [new Integer({ name: names.version || RESPONSE_DATA_VERSION })]
          }),
          new Choice({
            value: [
              new Constructed({
                name: names.responderID || RESPONSE_DATA_RESPONDER_ID,
                idBlock: {
                  tagClass: 3,
                  tagNumber: 1
                },
                value: [RelativeDistinguishedNames.schema(names.ResponseDataByName || {
                  names: {
                    blockName: "ResponseData.byName"
                  }
                })]
              }),
              new Constructed({
                name: names.responderID || RESPONSE_DATA_RESPONDER_ID,
                idBlock: {
                  tagClass: 3,
                  tagNumber: 2
                },
                value: [new OctetString({ name: names.ResponseDataByKey || "ResponseData.byKey" })]
              })
            ]
          }),
          new GeneralizedTime({ name: names.producedAt || RESPONSE_DATA_PRODUCED_AT }),
          new Sequence({
            value: [
              new Repeated({
                name: RESPONSE_DATA_RESPONSES,
                value: SingleResponse.schema(names.response || {})
              })
            ]
          }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: [Extensions.schema(names.extensions || {
              names: {
                blockName: RESPONSE_DATA_RESPONSE_EXTENSIONS
              }
            })]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$h);
      const asn1 = compareSchema(schema, schema, _ResponseData.schema());
      AsnError.assertSchema(asn1, this.className);
      this.tbsView = asn1.result.ResponseData.valueBeforeDecodeView;
      if (RESPONSE_DATA_VERSION in asn1.result)
        this.version = asn1.result[RESPONSE_DATA_VERSION].valueBlock.valueDec;
      if (asn1.result[RESPONSE_DATA_RESPONDER_ID].idBlock.tagNumber === 1)
        this.responderID = new RelativeDistinguishedNames({ schema: asn1.result[RESPONSE_DATA_RESPONDER_ID].valueBlock.value[0] });
      else
        this.responderID = asn1.result[RESPONSE_DATA_RESPONDER_ID].valueBlock.value[0];
      this.producedAt = asn1.result[RESPONSE_DATA_PRODUCED_AT].toDate();
      this.responses = Array.from(asn1.result[RESPONSE_DATA_RESPONSES], (element) => new SingleResponse({ schema: element }));
      if (RESPONSE_DATA_RESPONSE_EXTENSIONS in asn1.result)
        this.responseExtensions = Array.from(asn1.result[RESPONSE_DATA_RESPONSE_EXTENSIONS].valueBlock.value, (element) => new Extension({ schema: element }));
    }
    toSchema(encodeFlag = false) {
      let tbsSchema;
      if (encodeFlag === false) {
        if (!this.tbsView.byteLength) {
          return _ResponseData.schema();
        }
        const asn1 = fromBER(this.tbsView);
        AsnError.assert(asn1, "TBS Response Data");
        tbsSchema = asn1.result;
      } else {
        const outputArray = [];
        if (VERSION$7 in this) {
          outputArray.push(new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [new Integer({ value: this.version })]
          }));
        }
        if (this.responderID instanceof RelativeDistinguishedNames) {
          outputArray.push(new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: [this.responderID.toSchema()]
          }));
        } else {
          outputArray.push(new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 2
            },
            value: [this.responderID]
          }));
        }
        outputArray.push(new GeneralizedTime({ valueDate: this.producedAt }));
        outputArray.push(new Sequence({
          value: Array.from(this.responses, (o) => o.toSchema())
        }));
        if (this.responseExtensions) {
          outputArray.push(new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: [new Sequence({
              value: Array.from(this.responseExtensions, (o) => o.toSchema())
            })]
          }));
        }
        tbsSchema = new Sequence({
          value: outputArray
        });
      }
      return tbsSchema;
    }
    toJSON() {
      const res = {};
      if (VERSION$7 in this) {
        res.version = this.version;
      }
      if (this.responderID) {
        res.responderID = this.responderID;
      }
      if (this.producedAt) {
        res.producedAt = this.producedAt;
      }
      if (this.responses) {
        res.responses = Array.from(this.responses, (o) => o.toJSON());
      }
      if (this.responseExtensions) {
        res.responseExtensions = Array.from(this.responseExtensions, (o) => o.toJSON());
      }
      return res;
    }
  };
  ResponseData.CLASS_NAME = "ResponseData";
  var TRUSTED_CERTS = "trustedCerts";
  var CERTS$2 = "certs";
  var CRLS$1 = "crls";
  var OCSPS$1 = "ocsps";
  var CHECK_DATE = "checkDate";
  var FIND_ORIGIN = "findOrigin";
  var FIND_ISSUER = "findIssuer";
  var ChainValidationCode;
  (function(ChainValidationCode2) {
    ChainValidationCode2[ChainValidationCode2["unknown"] = -1] = "unknown";
    ChainValidationCode2[ChainValidationCode2["success"] = 0] = "success";
    ChainValidationCode2[ChainValidationCode2["noRevocation"] = 11] = "noRevocation";
    ChainValidationCode2[ChainValidationCode2["noPath"] = 60] = "noPath";
    ChainValidationCode2[ChainValidationCode2["noValidPath"] = 97] = "noValidPath";
  })(ChainValidationCode || (ChainValidationCode = {}));
  var ChainValidationError = class _ChainValidationError extends Error {
    constructor(code, message) {
      super(message);
      this.name = _ChainValidationError.NAME;
      this.code = code;
      this.message = message;
    }
  };
  ChainValidationError.NAME = "ChainValidationError";
  function isTrusted(cert, trustedList) {
    for (let i = 0; i < trustedList.length; i++) {
      if (pvtsutils2.BufferSourceConverter.isEqual(cert.tbsView, trustedList[i].tbsView)) {
        return true;
      }
    }
    return false;
  }
  var CertificateChainValidationEngine = class _CertificateChainValidationEngine {
    constructor(parameters = {}) {
      this.trustedCerts = getParametersValue(parameters, TRUSTED_CERTS, this.defaultValues(TRUSTED_CERTS));
      this.certs = getParametersValue(parameters, CERTS$2, this.defaultValues(CERTS$2));
      this.crls = getParametersValue(parameters, CRLS$1, this.defaultValues(CRLS$1));
      this.ocsps = getParametersValue(parameters, OCSPS$1, this.defaultValues(OCSPS$1));
      this.checkDate = getParametersValue(parameters, CHECK_DATE, this.defaultValues(CHECK_DATE));
      this.findOrigin = getParametersValue(parameters, FIND_ORIGIN, this.defaultValues(FIND_ORIGIN));
      this.findIssuer = getParametersValue(parameters, FIND_ISSUER, this.defaultValues(FIND_ISSUER));
    }
    static defaultFindOrigin(certificate, validationEngine) {
      if (certificate.tbsView.byteLength === 0) {
        certificate.tbsView = new Uint8Array(certificate.encodeTBS().toBER());
      }
      for (const localCert of validationEngine.certs) {
        if (localCert.tbsView.byteLength === 0) {
          localCert.tbsView = new Uint8Array(localCert.encodeTBS().toBER());
        }
        if (pvtsutils2.BufferSourceConverter.isEqual(certificate.tbsView, localCert.tbsView))
          return "Intermediate Certificates";
      }
      for (const trustedCert of validationEngine.trustedCerts) {
        if (trustedCert.tbsView.byteLength === 0)
          trustedCert.tbsView = new Uint8Array(trustedCert.encodeTBS().toBER());
        if (pvtsutils2.BufferSourceConverter.isEqual(certificate.tbsView, trustedCert.tbsView))
          return "Trusted Certificates";
      }
      return "Unknown";
    }
    async defaultFindIssuer(certificate, validationEngine, crypto2 = getCrypto(true)) {
      const result = [];
      let keyIdentifier = null;
      let authorityCertIssuer = null;
      let authorityCertSerialNumber = null;
      if (certificate.subject.isEqual(certificate.issuer)) {
        try {
          const verificationResult = await certificate.verify(void 0, crypto2);
          if (verificationResult) {
            return [certificate];
          }
        } catch {
        }
      }
      if (certificate.extensions) {
        for (const extension of certificate.extensions) {
          if (extension.extnID === id_AuthorityKeyIdentifier && extension.parsedValue instanceof AuthorityKeyIdentifier) {
            if (extension.parsedValue.keyIdentifier) {
              keyIdentifier = extension.parsedValue.keyIdentifier;
            } else {
              if (extension.parsedValue.authorityCertIssuer) {
                authorityCertIssuer = extension.parsedValue.authorityCertIssuer;
              }
              if (extension.parsedValue.authorityCertSerialNumber) {
                authorityCertSerialNumber = extension.parsedValue.authorityCertSerialNumber;
              }
            }
            break;
          }
        }
      }
      function checkCertificate(possibleIssuer) {
        if (keyIdentifier !== null) {
          if (possibleIssuer.extensions) {
            let extensionFound = false;
            for (const extension of possibleIssuer.extensions) {
              if (extension.extnID === id_SubjectKeyIdentifier && extension.parsedValue) {
                extensionFound = true;
                if (pvtsutils2.BufferSourceConverter.isEqual(extension.parsedValue.valueBlock.valueHex, keyIdentifier.valueBlock.valueHexView)) {
                  result.push(possibleIssuer);
                }
                break;
              }
            }
            if (extensionFound) {
              return;
            }
          }
        }
        let authorityCertSerialNumberEqual = false;
        if (authorityCertSerialNumber !== null)
          authorityCertSerialNumberEqual = possibleIssuer.serialNumber.isEqual(authorityCertSerialNumber);
        if (authorityCertIssuer !== null) {
          if (possibleIssuer.subject.isEqual(authorityCertIssuer)) {
            if (authorityCertSerialNumberEqual)
              result.push(possibleIssuer);
          }
        } else {
          if (certificate.issuer.isEqual(possibleIssuer.subject))
            result.push(possibleIssuer);
        }
      }
      for (const trustedCert of validationEngine.trustedCerts) {
        checkCertificate(trustedCert);
      }
      for (const intermediateCert of validationEngine.certs) {
        checkCertificate(intermediateCert);
      }
      for (let i = result.length - 1; i >= 0; i--) {
        try {
          const verificationResult = await certificate.verify(result[i], crypto2);
          if (verificationResult === false)
            result.splice(i, 1);
        } catch {
          result.splice(i, 1);
        }
      }
      return result;
    }
    defaultValues(memberName) {
      switch (memberName) {
        case TRUSTED_CERTS:
          return [];
        case CERTS$2:
          return [];
        case CRLS$1:
          return [];
        case OCSPS$1:
          return [];
        case CHECK_DATE:
          return /* @__PURE__ */ new Date();
        case FIND_ORIGIN:
          return _CertificateChainValidationEngine.defaultFindOrigin;
        case FIND_ISSUER:
          return this.defaultFindIssuer;
        default:
          throw new Error(`Invalid member name for CertificateChainValidationEngine class: ${memberName}`);
      }
    }
    async sort(passedWhenNotRevValues = false, crypto2 = getCrypto(true)) {
      const localCerts = [];
      const buildPath = async (certificate, crypto3) => {
        const result2 = [];
        function checkUnique(array) {
          let unique = true;
          for (let i = 0; i < array.length; i++) {
            for (let j = 0; j < array.length; j++) {
              if (j === i)
                continue;
              if (array[i] === array[j]) {
                unique = false;
                break;
              }
            }
            if (!unique)
              break;
          }
          return unique;
        }
        if (isTrusted(certificate, this.trustedCerts)) {
          return [[certificate]];
        }
        const findIssuerResult = await this.findIssuer(certificate, this, crypto3);
        if (findIssuerResult.length === 0) {
          throw new Error("No valid certificate paths found");
        }
        for (let i = 0; i < findIssuerResult.length; i++) {
          if (pvtsutils2.BufferSourceConverter.isEqual(findIssuerResult[i].tbsView, certificate.tbsView)) {
            result2.push([findIssuerResult[i]]);
            continue;
          }
          const buildPathResult = await buildPath(findIssuerResult[i], crypto3);
          for (let j = 0; j < buildPathResult.length; j++) {
            const copy = buildPathResult[j].slice();
            copy.splice(0, 0, findIssuerResult[i]);
            if (checkUnique(copy))
              result2.push(copy);
            else
              result2.push(buildPathResult[j]);
          }
        }
        return result2;
      };
      const findCRL = async (certificate) => {
        const issuerCertificates = [];
        const crls = [];
        const crlsAndCertificates = [];
        issuerCertificates.push(...localCerts.filter((element) => certificate.issuer.isEqual(element.subject)));
        if (issuerCertificates.length === 0) {
          return {
            status: 1,
            statusMessage: "No certificate's issuers"
          };
        }
        crls.push(...this.crls.filter((o) => o.issuer.isEqual(certificate.issuer)));
        if (crls.length === 0) {
          return {
            status: 2,
            statusMessage: "No CRLs for specific certificate issuer"
          };
        }
        for (let i = 0; i < crls.length; i++) {
          const crl = crls[i];
          if (crl.nextUpdate && crl.nextUpdate.value < this.checkDate) {
            continue;
          }
          for (let j = 0; j < issuerCertificates.length; j++) {
            try {
              const result2 = await crls[i].verify({ issuerCertificate: issuerCertificates[j] }, crypto2);
              if (result2) {
                crlsAndCertificates.push({
                  crl: crls[i],
                  certificate: issuerCertificates[j]
                });
                break;
              }
            } catch {
            }
          }
        }
        if (crlsAndCertificates.length) {
          return {
            status: 0,
            statusMessage: EMPTY_STRING2,
            result: crlsAndCertificates
          };
        }
        return {
          status: 3,
          statusMessage: "No valid CRLs found"
        };
      };
      const findOCSP = async (certificate, issuerCertificate) => {
        const hashAlgorithm = crypto2.getAlgorithmByOID(certificate.signatureAlgorithm.algorithmId);
        if (!hashAlgorithm.name) {
          return 1;
        }
        if (!hashAlgorithm.hash) {
          return 1;
        }
        for (let i = 0; i < this.ocsps.length; i++) {
          const ocsp = this.ocsps[i];
          const result2 = await ocsp.getCertificateStatus(certificate, issuerCertificate, crypto2);
          if (result2.isForCertificate) {
            if (result2.status === 0)
              return 0;
            return 1;
          }
        }
        return 2;
      };
      async function checkForCA(certificate, needToCheckCRL = false) {
        let isCA = false;
        let mustBeCA = false;
        let keyUsagePresent = false;
        let cRLSign = false;
        if (certificate.extensions) {
          for (let j = 0; j < certificate.extensions.length; j++) {
            const extension = certificate.extensions[j];
            if (extension.critical && !extension.parsedValue) {
              return {
                result: false,
                resultCode: 6,
                resultMessage: `Unable to parse critical certificate extension: ${extension.extnID}`
              };
            }
            if (extension.extnID === id_KeyUsage) {
              keyUsagePresent = true;
              const view = new Uint8Array(extension.parsedValue.valueBlock.valueHex);
              if ((view[0] & 4) === 4)
                mustBeCA = true;
              if ((view[0] & 2) === 2)
                cRLSign = true;
            }
            if (extension.extnID === id_BasicConstraints) {
              if ("cA" in extension.parsedValue) {
                if (extension.parsedValue.cA === true)
                  isCA = true;
              }
            }
          }
          if (mustBeCA === true && isCA === false) {
            return {
              result: false,
              resultCode: 3,
              resultMessage: 'Unable to build certificate chain - using "keyCertSign" flag set without BasicConstraints'
            };
          }
          if (keyUsagePresent === true && isCA === true && mustBeCA === false) {
            return {
              result: false,
              resultCode: 4,
              resultMessage: 'Unable to build certificate chain - "keyCertSign" flag was not set'
            };
          }
          if (isCA === true && keyUsagePresent === true && (needToCheckCRL && cRLSign === false)) {
            return {
              result: false,
              resultCode: 5,
              resultMessage: 'Unable to build certificate chain - intermediate certificate must have "cRLSign" key usage flag'
            };
          }
        }
        if (isCA === false) {
          return {
            result: false,
            resultCode: 7,
            resultMessage: "Unable to build certificate chain - more than one possible end-user certificate"
          };
        }
        return {
          result: true,
          resultCode: 0,
          resultMessage: EMPTY_STRING2
        };
      }
      const basicCheck = async (path, checkDate) => {
        for (let i = 0; i < path.length; i++) {
          if (path[i].notBefore.value > checkDate || path[i].notAfter.value < checkDate) {
            return {
              result: false,
              resultCode: 8,
              resultMessage: "The certificate is either not yet valid or expired"
            };
          }
        }
        if (path.length < 2) {
          return {
            result: false,
            resultCode: 9,
            resultMessage: "Too short certificate path"
          };
        }
        for (let i = path.length - 2; i >= 0; i--) {
          if (path[i].issuer.isEqual(path[i].subject) === false) {
            if (path[i].issuer.isEqual(path[i + 1].subject) === false) {
              return {
                result: false,
                resultCode: 10,
                resultMessage: "Incorrect name chaining"
              };
            }
          }
        }
        if (this.crls.length !== 0 || this.ocsps.length !== 0) {
          for (let i = 0; i < path.length - 1; i++) {
            let ocspResult = 2;
            let crlResult = {
              status: 0,
              statusMessage: EMPTY_STRING2
            };
            if (this.ocsps.length !== 0) {
              ocspResult = await findOCSP(path[i], path[i + 1]);
              switch (ocspResult) {
                case 0:
                  continue;
                case 1:
                  return {
                    result: false,
                    resultCode: 12,
                    resultMessage: "One of certificates was revoked via OCSP response"
                  };
              }
            }
            if (this.crls.length !== 0) {
              crlResult = await findCRL(path[i]);
              if (crlResult.status === 0 && crlResult.result) {
                for (let j = 0; j < crlResult.result.length; j++) {
                  const isCertificateRevoked = crlResult.result[j].crl.isCertificateRevoked(path[i]);
                  if (isCertificateRevoked) {
                    return {
                      result: false,
                      resultCode: 12,
                      resultMessage: "One of certificates had been revoked"
                    };
                  }
                  const isCertificateCA = await checkForCA(crlResult.result[j].certificate, true);
                  if (isCertificateCA.result === false) {
                    return {
                      result: false,
                      resultCode: 13,
                      resultMessage: "CRL issuer certificate is not a CA certificate or does not have crlSign flag"
                    };
                  }
                }
              } else {
                if (passedWhenNotRevValues === false) {
                  throw new ChainValidationError(ChainValidationCode.noRevocation, `No revocation values found for one of certificates: ${crlResult.statusMessage}`);
                }
              }
            } else {
              if (ocspResult === 2) {
                return {
                  result: false,
                  resultCode: 11,
                  resultMessage: "No revocation values found for one of certificates"
                };
              }
            }
            if (ocspResult === 2 && crlResult.status === 2 && passedWhenNotRevValues) {
              const issuerCertificate = path[i + 1];
              let extensionFound = false;
              if (issuerCertificate.extensions) {
                for (const extension of issuerCertificate.extensions) {
                  switch (extension.extnID) {
                    case id_CRLDistributionPoints:
                    case id_FreshestCRL:
                    case id_AuthorityInfoAccess:
                      extensionFound = true;
                      break;
                  }
                }
              }
              if (extensionFound) {
                throw new ChainValidationError(ChainValidationCode.noRevocation, `No revocation values found for one of certificates: ${crlResult.statusMessage}`);
              }
            }
          }
        }
        for (const [i, cert] of path.entries()) {
          if (!i) {
            continue;
          }
          const result2 = await checkForCA(cert);
          if (!result2.result) {
            return {
              result: false,
              resultCode: 14,
              resultMessage: "One of intermediate certificates is not a CA certificate"
            };
          }
        }
        return {
          result: true
        };
      };
      localCerts.push(...this.trustedCerts);
      localCerts.push(...this.certs);
      for (let i = 0; i < localCerts.length; i++) {
        for (let j = 0; j < localCerts.length; j++) {
          if (i === j)
            continue;
          if (pvtsutils2.BufferSourceConverter.isEqual(localCerts[i].tbsView, localCerts[j].tbsView)) {
            localCerts.splice(j, 1);
            i = 0;
            break;
          }
        }
      }
      const leafCert = localCerts[localCerts.length - 1];
      let result;
      const certificatePath = [leafCert];
      result = await buildPath(leafCert, crypto2);
      if (result.length === 0) {
        throw new ChainValidationError(ChainValidationCode.noPath, "Unable to find certificate path");
      }
      for (let i = result.length - 1; i >= 0; i--) {
        let found = false;
        for (let j = 0; j < result[i].length; j++) {
          const certificate = result[i][j];
          for (let k = 0; k < this.trustedCerts.length; k++) {
            if (pvtsutils2.BufferSourceConverter.isEqual(certificate.tbsView, this.trustedCerts[k].tbsView)) {
              found = true;
              break;
            }
          }
          if (found)
            break;
        }
        if (!found) {
          result.splice(i, 1);
        }
      }
      if (result.length === 0) {
        throw new ChainValidationError(ChainValidationCode.noValidPath, "No valid certificate paths found");
      }
      let shortestLength = result[0].length;
      let shortestIndex = 0;
      for (let i = 0; i < result.length; i++) {
        if (result[i].length < shortestLength) {
          shortestLength = result[i].length;
          shortestIndex = i;
        }
      }
      for (let i = 0; i < result[shortestIndex].length; i++)
        certificatePath.push(result[shortestIndex][i]);
      result = await basicCheck(certificatePath, this.checkDate);
      if (result.result === false)
        throw result;
      return certificatePath;
    }
    async verify(parameters = {}, crypto2 = getCrypto(true)) {
      function compareDNSName(name, constraint) {
        const namePrepared = stringPrep(name);
        const constraintPrepared = stringPrep(constraint);
        const nameSplitted = namePrepared.split(".");
        const constraintSplitted = constraintPrepared.split(".");
        const nameLen = nameSplitted.length;
        const constrLen = constraintSplitted.length;
        if (nameLen === 0 || constrLen === 0 || nameLen < constrLen) {
          return false;
        }
        for (let i = 0; i < nameLen; i++) {
          if (nameSplitted[i].length === 0) {
            return false;
          }
        }
        for (let i = 0; i < constrLen; i++) {
          if (constraintSplitted[i].length === 0) {
            if (i === 0) {
              if (constrLen === 1) {
                return false;
              }
              continue;
            }
            return false;
          }
        }
        for (let i = 0; i < constrLen; i++) {
          if (constraintSplitted[constrLen - 1 - i].length === 0) {
            continue;
          }
          if (nameSplitted[nameLen - 1 - i].localeCompare(constraintSplitted[constrLen - 1 - i]) !== 0) {
            return false;
          }
        }
        return true;
      }
      function compareRFC822Name(name, constraint) {
        const namePrepared = stringPrep(name);
        const constraintPrepared = stringPrep(constraint);
        const nameSplitted = namePrepared.split("@");
        const constraintSplitted = constraintPrepared.split("@");
        if (nameSplitted.length === 0 || constraintSplitted.length === 0 || nameSplitted.length < constraintSplitted.length)
          return false;
        if (constraintSplitted.length === 1) {
          const result = compareDNSName(nameSplitted[1], constraintSplitted[0]);
          if (result) {
            const ns = nameSplitted[1].split(".");
            const cs = constraintSplitted[0].split(".");
            if (cs[0].length === 0)
              return true;
            return ns.length === cs.length;
          }
          return false;
        }
        return namePrepared.localeCompare(constraintPrepared) === 0;
      }
      function compareUniformResourceIdentifier(name, constraint) {
        let namePrepared = stringPrep(name);
        const constraintPrepared = stringPrep(constraint);
        const ns = namePrepared.split("/");
        const cs = constraintPrepared.split("/");
        if (cs.length > 1)
          return false;
        if (ns.length > 1) {
          for (let i = 0; i < ns.length; i++) {
            if (ns[i].length > 0 && ns[i].charAt(ns[i].length - 1) !== ":") {
              const nsPort = ns[i].split(":");
              namePrepared = nsPort[0];
              break;
            }
          }
        }
        const result = compareDNSName(namePrepared, constraintPrepared);
        if (result) {
          const nameSplitted = namePrepared.split(".");
          const constraintSplitted = constraintPrepared.split(".");
          if (constraintSplitted[0].length === 0)
            return true;
          return nameSplitted.length === constraintSplitted.length;
        }
        return false;
      }
      function compareIPAddress(name, constraint) {
        const nameView = name.valueBlock.valueHexView;
        const constraintView = constraint.valueBlock.valueHexView;
        if (nameView.length === 4 && constraintView.length === 8) {
          for (let i = 0; i < 4; i++) {
            if ((nameView[i] ^ constraintView[i]) & constraintView[i + 4])
              return false;
          }
          return true;
        }
        if (nameView.length === 16 && constraintView.length === 32) {
          for (let i = 0; i < 16; i++) {
            if ((nameView[i] ^ constraintView[i]) & constraintView[i + 16])
              return false;
          }
          return true;
        }
        return false;
      }
      function compareDirectoryName(name, constraint) {
        if (name.typesAndValues.length === 0 || constraint.typesAndValues.length === 0)
          return true;
        if (name.typesAndValues.length < constraint.typesAndValues.length)
          return false;
        let result = true;
        let nameStart = 0;
        for (let i = 0; i < constraint.typesAndValues.length; i++) {
          let localResult = false;
          for (let j = nameStart; j < name.typesAndValues.length; j++) {
            localResult = name.typesAndValues[j].isEqual(constraint.typesAndValues[i]);
            if (name.typesAndValues[j].type === constraint.typesAndValues[i].type)
              result = result && localResult;
            if (localResult === true) {
              if (nameStart === 0 || nameStart === j) {
                nameStart = j + 1;
                break;
              } else
                return false;
            }
          }
          if (localResult === false)
            return false;
        }
        return nameStart === 0 ? false : result;
      }
      try {
        if (this.certs.length === 0)
          throw new Error("Empty certificate array");
        const passedWhenNotRevValues = parameters.passedWhenNotRevValues || false;
        const initialPolicySet = parameters.initialPolicySet || [id_AnyPolicy];
        const initialExplicitPolicy = parameters.initialExplicitPolicy || false;
        const initialPolicyMappingInhibit = parameters.initialPolicyMappingInhibit || false;
        const initialInhibitPolicy = parameters.initialInhibitPolicy || false;
        const initialPermittedSubtreesSet = parameters.initialPermittedSubtreesSet || [];
        const initialExcludedSubtreesSet = parameters.initialExcludedSubtreesSet || [];
        const initialRequiredNameForms = parameters.initialRequiredNameForms || [];
        let explicitPolicyIndicator = initialExplicitPolicy;
        let policyMappingInhibitIndicator = initialPolicyMappingInhibit;
        let inhibitAnyPolicyIndicator = initialInhibitPolicy;
        const pendingConstraints = [
          false,
          false,
          false
        ];
        let explicitPolicyPending = 0;
        let policyMappingInhibitPending = 0;
        let inhibitAnyPolicyPending = 0;
        let permittedSubtrees = initialPermittedSubtreesSet;
        let excludedSubtrees = initialExcludedSubtreesSet;
        const requiredNameForms = initialRequiredNameForms;
        let pathDepth = 1;
        this.certs = await this.sort(passedWhenNotRevValues, crypto2);
        const allPolicies = [];
        allPolicies.push(id_AnyPolicy);
        const policiesAndCerts = [];
        const anyPolicyArray = new Array(this.certs.length - 1);
        for (let ii = 0; ii < this.certs.length - 1; ii++)
          anyPolicyArray[ii] = true;
        policiesAndCerts.push(anyPolicyArray);
        const policyMappings = new Array(this.certs.length - 1);
        const certPolicies = new Array(this.certs.length - 1);
        let explicitPolicyStart = explicitPolicyIndicator ? this.certs.length - 1 : -1;
        for (let i = this.certs.length - 2; i >= 0; i--, pathDepth++) {
          const cert = this.certs[i];
          if (cert.extensions) {
            for (let j = 0; j < cert.extensions.length; j++) {
              const extension = cert.extensions[j];
              if (extension.extnID === id_CertificatePolicies) {
                certPolicies[i] = extension.parsedValue;
                for (let s = 0; s < allPolicies.length; s++) {
                  if (allPolicies[s] === id_AnyPolicy) {
                    delete policiesAndCerts[s][i];
                    break;
                  }
                }
                for (let k = 0; k < extension.parsedValue.certificatePolicies.length; k++) {
                  let policyIndex = -1;
                  const policyId = extension.parsedValue.certificatePolicies[k].policyIdentifier;
                  for (let s = 0; s < allPolicies.length; s++) {
                    if (policyId === allPolicies[s]) {
                      policyIndex = s;
                      break;
                    }
                  }
                  if (policyIndex === -1) {
                    allPolicies.push(policyId);
                    const certArray = new Array(this.certs.length - 1);
                    certArray[i] = true;
                    policiesAndCerts.push(certArray);
                  } else
                    policiesAndCerts[policyIndex][i] = true;
                }
              }
              if (extension.extnID === id_PolicyMappings) {
                if (policyMappingInhibitIndicator) {
                  return {
                    result: false,
                    resultCode: 98,
                    resultMessage: "Policy mapping prohibited"
                  };
                }
                policyMappings[i] = extension.parsedValue;
              }
              if (extension.extnID === id_PolicyConstraints) {
                if (explicitPolicyIndicator === false) {
                  if (extension.parsedValue.requireExplicitPolicy === 0) {
                    explicitPolicyIndicator = true;
                    explicitPolicyStart = i;
                  } else {
                    if (pendingConstraints[0] === false) {
                      pendingConstraints[0] = true;
                      explicitPolicyPending = extension.parsedValue.requireExplicitPolicy;
                    } else
                      explicitPolicyPending = explicitPolicyPending > extension.parsedValue.requireExplicitPolicy ? extension.parsedValue.requireExplicitPolicy : explicitPolicyPending;
                  }
                  if (extension.parsedValue.inhibitPolicyMapping === 0)
                    policyMappingInhibitIndicator = true;
                  else {
                    if (pendingConstraints[1] === false) {
                      pendingConstraints[1] = true;
                      policyMappingInhibitPending = extension.parsedValue.inhibitPolicyMapping + 1;
                    } else
                      policyMappingInhibitPending = policyMappingInhibitPending > extension.parsedValue.inhibitPolicyMapping + 1 ? extension.parsedValue.inhibitPolicyMapping + 1 : policyMappingInhibitPending;
                  }
                }
              }
              if (extension.extnID === id_InhibitAnyPolicy) {
                if (inhibitAnyPolicyIndicator === false) {
                  if (extension.parsedValue.valueBlock.valueDec === 0)
                    inhibitAnyPolicyIndicator = true;
                  else {
                    if (pendingConstraints[2] === false) {
                      pendingConstraints[2] = true;
                      inhibitAnyPolicyPending = extension.parsedValue.valueBlock.valueDec;
                    } else
                      inhibitAnyPolicyPending = inhibitAnyPolicyPending > extension.parsedValue.valueBlock.valueDec ? extension.parsedValue.valueBlock.valueDec : inhibitAnyPolicyPending;
                  }
                }
              }
            }
            if (inhibitAnyPolicyIndicator === true) {
              let policyIndex = -1;
              for (let searchAnyPolicy = 0; searchAnyPolicy < allPolicies.length; searchAnyPolicy++) {
                if (allPolicies[searchAnyPolicy] === id_AnyPolicy) {
                  policyIndex = searchAnyPolicy;
                  break;
                }
              }
              if (policyIndex !== -1)
                delete policiesAndCerts[0][i];
            }
            if (explicitPolicyIndicator === false) {
              if (pendingConstraints[0] === true) {
                explicitPolicyPending--;
                if (explicitPolicyPending === 0) {
                  explicitPolicyIndicator = true;
                  explicitPolicyStart = i;
                  pendingConstraints[0] = false;
                }
              }
            }
            if (policyMappingInhibitIndicator === false) {
              if (pendingConstraints[1] === true) {
                policyMappingInhibitPending--;
                if (policyMappingInhibitPending === 0) {
                  policyMappingInhibitIndicator = true;
                  pendingConstraints[1] = false;
                }
              }
            }
            if (inhibitAnyPolicyIndicator === false) {
              if (pendingConstraints[2] === true) {
                inhibitAnyPolicyPending--;
                if (inhibitAnyPolicyPending === 0) {
                  inhibitAnyPolicyIndicator = true;
                  pendingConstraints[2] = false;
                }
              }
            }
          }
        }
        for (let i = 0; i < this.certs.length - 1; i++) {
          if (i < this.certs.length - 2 && typeof policyMappings[i + 1] !== "undefined") {
            for (let k = 0; k < policyMappings[i + 1].mappings.length; k++) {
              if (policyMappings[i + 1].mappings[k].issuerDomainPolicy === id_AnyPolicy || policyMappings[i + 1].mappings[k].subjectDomainPolicy === id_AnyPolicy) {
                return {
                  result: false,
                  resultCode: 99,
                  resultMessage: 'The "anyPolicy" should not be a part of policy mapping scheme'
                };
              }
              let issuerDomainPolicyIndex = -1;
              let subjectDomainPolicyIndex = -1;
              for (let n = 0; n < allPolicies.length; n++) {
                if (allPolicies[n] === policyMappings[i + 1].mappings[k].issuerDomainPolicy)
                  issuerDomainPolicyIndex = n;
                if (allPolicies[n] === policyMappings[i + 1].mappings[k].subjectDomainPolicy)
                  subjectDomainPolicyIndex = n;
              }
              if (typeof policiesAndCerts[issuerDomainPolicyIndex][i] !== "undefined")
                delete policiesAndCerts[issuerDomainPolicyIndex][i];
              for (let j = 0; j < certPolicies[i].certificatePolicies.length; j++) {
                if (policyMappings[i + 1].mappings[k].subjectDomainPolicy === certPolicies[i].certificatePolicies[j].policyIdentifier) {
                  if (issuerDomainPolicyIndex !== -1 && subjectDomainPolicyIndex !== -1) {
                    for (let m = 0; m <= i; m++) {
                      if (typeof policiesAndCerts[subjectDomainPolicyIndex][m] !== "undefined") {
                        policiesAndCerts[issuerDomainPolicyIndex][m] = true;
                        delete policiesAndCerts[subjectDomainPolicyIndex][m];
                      }
                    }
                  }
                }
              }
            }
          }
        }
        for (let i = 0; i < allPolicies.length; i++) {
          if (allPolicies[i] === id_AnyPolicy) {
            for (let j = 0; j < explicitPolicyStart; j++)
              delete policiesAndCerts[i][j];
          }
        }
        const authConstrPolicies = [];
        for (let i = 0; i < policiesAndCerts.length; i++) {
          let found = true;
          for (let j = 0; j < this.certs.length - 1; j++) {
            let anyPolicyFound = false;
            if (j < explicitPolicyStart && allPolicies[i] === id_AnyPolicy && allPolicies.length > 1) {
              found = false;
              break;
            }
            if (typeof policiesAndCerts[i][j] === "undefined") {
              if (j >= explicitPolicyStart) {
                for (let k = 0; k < allPolicies.length; k++) {
                  if (allPolicies[k] === id_AnyPolicy) {
                    if (policiesAndCerts[k][j] === true)
                      anyPolicyFound = true;
                    break;
                  }
                }
              }
              if (!anyPolicyFound) {
                found = false;
                break;
              }
            }
          }
          if (found === true)
            authConstrPolicies.push(allPolicies[i]);
        }
        let userConstrPolicies = [];
        if (initialPolicySet.length === 1 && initialPolicySet[0] === id_AnyPolicy && explicitPolicyIndicator === false)
          userConstrPolicies = initialPolicySet;
        else {
          if (authConstrPolicies.length === 1 && authConstrPolicies[0] === id_AnyPolicy)
            userConstrPolicies = initialPolicySet;
          else {
            for (let i = 0; i < authConstrPolicies.length; i++) {
              for (let j = 0; j < initialPolicySet.length; j++) {
                if (initialPolicySet[j] === authConstrPolicies[i] || initialPolicySet[j] === id_AnyPolicy) {
                  userConstrPolicies.push(authConstrPolicies[i]);
                  break;
                }
              }
            }
          }
        }
        const policyResult = {
          result: userConstrPolicies.length > 0,
          resultCode: 0,
          resultMessage: userConstrPolicies.length > 0 ? EMPTY_STRING2 : 'Zero "userConstrPolicies" array, no intersections with "authConstrPolicies"',
          authConstrPolicies,
          userConstrPolicies,
          explicitPolicyIndicator,
          policyMappings,
          certificatePath: this.certs
        };
        if (userConstrPolicies.length === 0)
          return policyResult;
        if (policyResult.result === false)
          return policyResult;
        pathDepth = 1;
        for (let i = this.certs.length - 2; i >= 0; i--, pathDepth++) {
          const cert = this.certs[i];
          let subjectAltNames = [];
          let certPermittedSubtrees = [];
          let certExcludedSubtrees = [];
          if (cert.extensions) {
            for (let j = 0; j < cert.extensions.length; j++) {
              const extension = cert.extensions[j];
              if (extension.extnID === id_NameConstraints) {
                if ("permittedSubtrees" in extension.parsedValue)
                  certPermittedSubtrees = certPermittedSubtrees.concat(extension.parsedValue.permittedSubtrees);
                if ("excludedSubtrees" in extension.parsedValue)
                  certExcludedSubtrees = certExcludedSubtrees.concat(extension.parsedValue.excludedSubtrees);
              }
              if (extension.extnID === id_SubjectAltName)
                subjectAltNames = subjectAltNames.concat(extension.parsedValue.altNames);
            }
          }
          let formFound = requiredNameForms.length <= 0;
          for (let j = 0; j < requiredNameForms.length; j++) {
            switch (requiredNameForms[j].base.type) {
              case 4:
                {
                  if (requiredNameForms[j].base.value.typesAndValues.length !== cert.subject.typesAndValues.length)
                    continue;
                  formFound = true;
                  for (let k = 0; k < cert.subject.typesAndValues.length; k++) {
                    if (cert.subject.typesAndValues[k].type !== requiredNameForms[j].base.value.typesAndValues[k].type) {
                      formFound = false;
                      break;
                    }
                  }
                  if (formFound === true)
                    break;
                }
                break;
              default:
            }
          }
          if (formFound === false) {
            policyResult.result = false;
            policyResult.resultCode = 21;
            policyResult.resultMessage = "No necessary name form found";
            throw policyResult;
          }
          const constrGroups = [
            [],
            [],
            [],
            [],
            []
          ];
          for (let j = 0; j < permittedSubtrees.length; j++) {
            switch (permittedSubtrees[j].base.type) {
              case 1:
                constrGroups[0].push(permittedSubtrees[j]);
                break;
              case 2:
                constrGroups[1].push(permittedSubtrees[j]);
                break;
              case 4:
                constrGroups[2].push(permittedSubtrees[j]);
                break;
              case 6:
                constrGroups[3].push(permittedSubtrees[j]);
                break;
              case 7:
                constrGroups[4].push(permittedSubtrees[j]);
                break;
              default:
            }
          }
          for (let p = 0; p < 5; p++) {
            let groupPermitted = false;
            let valueExists = false;
            const group = constrGroups[p];
            for (let j = 0; j < group.length; j++) {
              switch (p) {
                case 0:
                  if (subjectAltNames.length > 0) {
                    for (let k = 0; k < subjectAltNames.length; k++) {
                      if (subjectAltNames[k].type === 1) {
                        valueExists = true;
                        groupPermitted = groupPermitted || compareRFC822Name(subjectAltNames[k].value, group[j].base.value);
                      }
                    }
                  } else {
                    for (let k = 0; k < cert.subject.typesAndValues.length; k++) {
                      if (cert.subject.typesAndValues[k].type === "1.2.840.113549.1.9.1" || cert.subject.typesAndValues[k].type === "0.9.2342.19200300.100.1.3") {
                        valueExists = true;
                        groupPermitted = groupPermitted || compareRFC822Name(cert.subject.typesAndValues[k].value.valueBlock.value, group[j].base.value);
                      }
                    }
                  }
                  break;
                case 1:
                  if (subjectAltNames.length > 0) {
                    for (let k = 0; k < subjectAltNames.length; k++) {
                      if (subjectAltNames[k].type === 2) {
                        valueExists = true;
                        groupPermitted = groupPermitted || compareDNSName(subjectAltNames[k].value, group[j].base.value);
                      }
                    }
                  }
                  break;
                case 2:
                  valueExists = true;
                  groupPermitted = compareDirectoryName(cert.subject, group[j].base.value);
                  break;
                case 3:
                  if (subjectAltNames.length > 0) {
                    for (let k = 0; k < subjectAltNames.length; k++) {
                      if (subjectAltNames[k].type === 6) {
                        valueExists = true;
                        groupPermitted = groupPermitted || compareUniformResourceIdentifier(subjectAltNames[k].value, group[j].base.value);
                      }
                    }
                  }
                  break;
                case 4:
                  if (subjectAltNames.length > 0) {
                    for (let k = 0; k < subjectAltNames.length; k++) {
                      if (subjectAltNames[k].type === 7) {
                        valueExists = true;
                        groupPermitted = groupPermitted || compareIPAddress(subjectAltNames[k].value, group[j].base.value);
                      }
                    }
                  }
                  break;
                default:
              }
              if (groupPermitted)
                break;
            }
            if (groupPermitted === false && group.length > 0 && valueExists) {
              policyResult.result = false;
              policyResult.resultCode = 41;
              policyResult.resultMessage = 'Failed to meet "permitted sub-trees" name constraint';
              throw policyResult;
            }
          }
          let excluded = false;
          for (let j = 0; j < excludedSubtrees.length; j++) {
            switch (excludedSubtrees[j].base.type) {
              case 1:
                if (subjectAltNames.length >= 0) {
                  for (let k = 0; k < subjectAltNames.length; k++) {
                    if (subjectAltNames[k].type === 1)
                      excluded = excluded || compareRFC822Name(subjectAltNames[k].value, excludedSubtrees[j].base.value);
                  }
                } else {
                  for (let k = 0; k < cert.subject.typesAndValues.length; k++) {
                    if (cert.subject.typesAndValues[k].type === "1.2.840.113549.1.9.1" || cert.subject.typesAndValues[k].type === "0.9.2342.19200300.100.1.3")
                      excluded = excluded || compareRFC822Name(cert.subject.typesAndValues[k].value.valueBlock.value, excludedSubtrees[j].base.value);
                  }
                }
                break;
              case 2:
                if (subjectAltNames.length > 0) {
                  for (let k = 0; k < subjectAltNames.length; k++) {
                    if (subjectAltNames[k].type === 2)
                      excluded = excluded || compareDNSName(subjectAltNames[k].value, excludedSubtrees[j].base.value);
                  }
                }
                break;
              case 4:
                excluded = excluded || compareDirectoryName(cert.subject, excludedSubtrees[j].base.value);
                break;
              case 6:
                if (subjectAltNames.length > 0) {
                  for (let k = 0; k < subjectAltNames.length; k++) {
                    if (subjectAltNames[k].type === 6)
                      excluded = excluded || compareUniformResourceIdentifier(subjectAltNames[k].value, excludedSubtrees[j].base.value);
                  }
                }
                break;
              case 7:
                if (subjectAltNames.length > 0) {
                  for (let k = 0; k < subjectAltNames.length; k++) {
                    if (subjectAltNames[k].type === 7)
                      excluded = excluded || compareIPAddress(subjectAltNames[k].value, excludedSubtrees[j].base.value);
                  }
                }
                break;
              default:
            }
            if (excluded)
              break;
          }
          if (excluded === true) {
            policyResult.result = false;
            policyResult.resultCode = 42;
            policyResult.resultMessage = 'Failed to meet "excluded sub-trees" name constraint';
            throw policyResult;
          }
          permittedSubtrees = permittedSubtrees.concat(certPermittedSubtrees);
          excludedSubtrees = excludedSubtrees.concat(certExcludedSubtrees);
        }
        return policyResult;
      } catch (error) {
        if (error instanceof Error) {
          if (error instanceof ChainValidationError) {
            return {
              result: false,
              resultCode: error.code,
              resultMessage: error.message,
              error
            };
          }
          return {
            result: false,
            resultCode: ChainValidationCode.unknown,
            resultMessage: error.message,
            error
          };
        }
        if (error && typeof error === "object" && "resultMessage" in error) {
          return error;
        }
        return {
          result: false,
          resultCode: -1,
          resultMessage: `${error}`
        };
      }
    }
  };
  var TBS_RESPONSE_DATA = "tbsResponseData";
  var SIGNATURE_ALGORITHM$3 = "signatureAlgorithm";
  var SIGNATURE$2 = "signature";
  var CERTS$1 = "certs";
  var BASIC_OCSP_RESPONSE = "BasicOCSPResponse";
  var BASIC_OCSP_RESPONSE_TBS_RESPONSE_DATA = `${BASIC_OCSP_RESPONSE}.${TBS_RESPONSE_DATA}`;
  var BASIC_OCSP_RESPONSE_SIGNATURE_ALGORITHM = `${BASIC_OCSP_RESPONSE}.${SIGNATURE_ALGORITHM$3}`;
  var BASIC_OCSP_RESPONSE_SIGNATURE = `${BASIC_OCSP_RESPONSE}.${SIGNATURE$2}`;
  var BASIC_OCSP_RESPONSE_CERTS = `${BASIC_OCSP_RESPONSE}.${CERTS$1}`;
  var CLEAR_PROPS$g = [
    BASIC_OCSP_RESPONSE_TBS_RESPONSE_DATA,
    BASIC_OCSP_RESPONSE_SIGNATURE_ALGORITHM,
    BASIC_OCSP_RESPONSE_SIGNATURE,
    BASIC_OCSP_RESPONSE_CERTS
  ];
  var BasicOCSPResponse = class _BasicOCSPResponse extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.tbsResponseData = getParametersValue(parameters, TBS_RESPONSE_DATA, _BasicOCSPResponse.defaultValues(TBS_RESPONSE_DATA));
      this.signatureAlgorithm = getParametersValue(parameters, SIGNATURE_ALGORITHM$3, _BasicOCSPResponse.defaultValues(SIGNATURE_ALGORITHM$3));
      this.signature = getParametersValue(parameters, SIGNATURE$2, _BasicOCSPResponse.defaultValues(SIGNATURE$2));
      if (CERTS$1 in parameters) {
        this.certs = getParametersValue(parameters, CERTS$1, _BasicOCSPResponse.defaultValues(CERTS$1));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case TBS_RESPONSE_DATA:
          return new ResponseData();
        case SIGNATURE_ALGORITHM$3:
          return new AlgorithmIdentifier();
        case SIGNATURE$2:
          return new BitString();
        case CERTS$1:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case "type": {
          let comparisonResult = ResponseData.compareWithDefault("tbs", memberValue.tbs) && ResponseData.compareWithDefault("responderID", memberValue.responderID) && ResponseData.compareWithDefault("producedAt", memberValue.producedAt) && ResponseData.compareWithDefault("responses", memberValue.responses);
          if ("responseExtensions" in memberValue)
            comparisonResult = comparisonResult && ResponseData.compareWithDefault("responseExtensions", memberValue.responseExtensions);
          return comparisonResult;
        }
        case SIGNATURE_ALGORITHM$3:
          return memberValue.algorithmId === EMPTY_STRING2 && "algorithmParams" in memberValue === false;
        case SIGNATURE$2:
          return memberValue.isEqual(_BasicOCSPResponse.defaultValues(memberName));
        case CERTS$1:
          return memberValue.length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || BASIC_OCSP_RESPONSE,
        value: [
          ResponseData.schema(names.tbsResponseData || {
            names: {
              blockName: BASIC_OCSP_RESPONSE_TBS_RESPONSE_DATA
            }
          }),
          AlgorithmIdentifier.schema(names.signatureAlgorithm || {
            names: {
              blockName: BASIC_OCSP_RESPONSE_SIGNATURE_ALGORITHM
            }
          }),
          new BitString({ name: names.signature || BASIC_OCSP_RESPONSE_SIGNATURE }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [
              new Sequence({
                value: [new Repeated({
                  name: BASIC_OCSP_RESPONSE_CERTS,
                  value: Certificate.schema(names.certs || {})
                })]
              })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$g);
      const asn1 = compareSchema(schema, schema, _BasicOCSPResponse.schema());
      AsnError.assertSchema(asn1, this.className);
      this.tbsResponseData = new ResponseData({ schema: asn1.result[BASIC_OCSP_RESPONSE_TBS_RESPONSE_DATA] });
      this.signatureAlgorithm = new AlgorithmIdentifier({ schema: asn1.result[BASIC_OCSP_RESPONSE_SIGNATURE_ALGORITHM] });
      this.signature = asn1.result[BASIC_OCSP_RESPONSE_SIGNATURE];
      if (BASIC_OCSP_RESPONSE_CERTS in asn1.result) {
        this.certs = Array.from(asn1.result[BASIC_OCSP_RESPONSE_CERTS], (element) => new Certificate({ schema: element }));
      }
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(this.tbsResponseData.toSchema());
      outputArray.push(this.signatureAlgorithm.toSchema());
      outputArray.push(this.signature);
      if (this.certs) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [
            new Sequence({
              value: Array.from(this.certs, (o) => o.toSchema())
            })
          ]
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        tbsResponseData: this.tbsResponseData.toJSON(),
        signatureAlgorithm: this.signatureAlgorithm.toJSON(),
        signature: this.signature.toJSON()
      };
      if (this.certs) {
        res.certs = Array.from(this.certs, (o) => o.toJSON());
      }
      return res;
    }
    async getCertificateStatus(certificate, issuerCertificate, crypto2 = getCrypto(true)) {
      const result = {
        isForCertificate: false,
        status: 2
      };
      const hashesObject = {};
      const certIDs = [];
      for (const response of this.tbsResponseData.responses) {
        const hashAlgorithm = crypto2.getAlgorithmByOID(response.certID.hashAlgorithm.algorithmId, true, "CertID.hashAlgorithm");
        if (!hashesObject[hashAlgorithm.name]) {
          hashesObject[hashAlgorithm.name] = 1;
          const certID = new CertID();
          certIDs.push(certID);
          await certID.createForCertificate(certificate, {
            hashAlgorithm: hashAlgorithm.name,
            issuerCertificate
          }, crypto2);
        }
      }
      for (const response of this.tbsResponseData.responses) {
        for (const id of certIDs) {
          if (response.certID.isEqual(id)) {
            result.isForCertificate = true;
            try {
              switch (response.certStatus.idBlock.isConstructed) {
                case true:
                  if (response.certStatus.idBlock.tagNumber === 1)
                    result.status = 1;
                  break;
                case false:
                  switch (response.certStatus.idBlock.tagNumber) {
                    case 0:
                      result.status = 0;
                      break;
                    case 2:
                      result.status = 2;
                      break;
                    default:
                  }
                  break;
                default:
              }
            } catch {
            }
            return result;
          }
        }
      }
      return result;
    }
    async sign(privateKey, hashAlgorithm = "SHA-1", crypto2 = getCrypto(true)) {
      if (!privateKey) {
        throw new Error("Need to provide a private key for signing");
      }
      const signatureParams = await crypto2.getSignatureParameters(privateKey, hashAlgorithm);
      const algorithm = signatureParams.parameters.algorithm;
      if (!("name" in algorithm)) {
        throw new Error("Empty algorithm");
      }
      this.signatureAlgorithm = signatureParams.signatureAlgorithm;
      this.tbsResponseData.tbsView = new Uint8Array(this.tbsResponseData.toSchema(true).toBER());
      const signature = await crypto2.signWithPrivateKey(this.tbsResponseData.tbsView, privateKey, { algorithm });
      this.signature = new BitString({ valueHex: signature });
    }
    async verify(params = {}, crypto2 = getCrypto(true)) {
      let signerCert = null;
      let certIndex = -1;
      const trustedCerts = params.trustedCerts || [];
      if (!this.certs) {
        throw new Error("No certificates attached to the BasicOCSPResponse");
      }
      switch (true) {
        case this.tbsResponseData.responderID instanceof RelativeDistinguishedNames:
          for (const [index, certificate] of this.certs.entries()) {
            if (certificate.subject.isEqual(this.tbsResponseData.responderID)) {
              certIndex = index;
              break;
            }
          }
          break;
        case this.tbsResponseData.responderID instanceof OctetString:
          for (const [index, cert] of this.certs.entries()) {
            const hash = await crypto2.digest({ name: "sha-1" }, cert.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHexView);
            if (isEqualBuffer(hash, this.tbsResponseData.responderID.valueBlock.valueHex)) {
              certIndex = index;
              break;
            }
          }
          break;
        default:
          throw new Error("Wrong value for responderID");
      }
      if (certIndex === -1)
        throw new Error("Correct certificate was not found in OCSP response");
      signerCert = this.certs[certIndex];
      const additionalCerts = [signerCert];
      for (const cert of this.certs) {
        const caCert = await checkCA(cert, signerCert);
        if (caCert) {
          additionalCerts.push(caCert);
        }
      }
      const certChain = new CertificateChainValidationEngine({
        certs: additionalCerts,
        trustedCerts
      });
      const verificationResult = await certChain.verify({}, crypto2);
      if (!verificationResult.result) {
        throw new Error("Validation of signer's certificate failed");
      }
      return crypto2.verifyWithPublicKey(this.tbsResponseData.tbsView, this.signature, this.certs[certIndex].subjectPublicKeyInfo, this.signatureAlgorithm);
    }
  };
  BasicOCSPResponse.CLASS_NAME = "BasicOCSPResponse";
  var TBS$1 = "tbs";
  var VERSION$6 = "version";
  var SUBJECT = "subject";
  var SPKI = "subjectPublicKeyInfo";
  var ATTRIBUTES$1 = "attributes";
  var SIGNATURE_ALGORITHM$2 = "signatureAlgorithm";
  var SIGNATURE_VALUE = "signatureValue";
  var CSR_INFO = "CertificationRequestInfo";
  var CSR_INFO_VERSION = `${CSR_INFO}.version`;
  var CSR_INFO_SUBJECT = `${CSR_INFO}.subject`;
  var CSR_INFO_SPKI = `${CSR_INFO}.subjectPublicKeyInfo`;
  var CSR_INFO_ATTRS = `${CSR_INFO}.attributes`;
  var CLEAR_PROPS$f = [
    CSR_INFO,
    CSR_INFO_VERSION,
    CSR_INFO_SUBJECT,
    CSR_INFO_SPKI,
    CSR_INFO_ATTRS,
    SIGNATURE_ALGORITHM$2,
    SIGNATURE_VALUE
  ];
  function CertificationRequestInfo(parameters = {}) {
    const names = getParametersValue(parameters, "names", {});
    return new Sequence({
      name: names.CertificationRequestInfo || CSR_INFO,
      value: [
        new Integer({ name: names.CertificationRequestInfoVersion || CSR_INFO_VERSION }),
        RelativeDistinguishedNames.schema(names.subject || {
          names: {
            blockName: CSR_INFO_SUBJECT
          }
        }),
        PublicKeyInfo.schema({
          names: {
            blockName: CSR_INFO_SPKI
          }
        }),
        new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [
            new Repeated({
              optional: true,
              name: names.CertificationRequestInfoAttributes || CSR_INFO_ATTRS,
              value: Attribute.schema(names.attributes || {})
            })
          ]
        })
      ]
    });
  }
  var CertificationRequest = class _CertificationRequest extends PkiObject {
    get tbs() {
      return pvtsutils2.BufferSourceConverter.toArrayBuffer(this.tbsView);
    }
    set tbs(value) {
      this.tbsView = new Uint8Array(value);
    }
    constructor(parameters = {}) {
      super();
      this.tbsView = new Uint8Array(getParametersValue(parameters, TBS$1, _CertificationRequest.defaultValues(TBS$1)));
      this.version = getParametersValue(parameters, VERSION$6, _CertificationRequest.defaultValues(VERSION$6));
      this.subject = getParametersValue(parameters, SUBJECT, _CertificationRequest.defaultValues(SUBJECT));
      this.subjectPublicKeyInfo = getParametersValue(parameters, SPKI, _CertificationRequest.defaultValues(SPKI));
      if (ATTRIBUTES$1 in parameters) {
        this.attributes = getParametersValue(parameters, ATTRIBUTES$1, _CertificationRequest.defaultValues(ATTRIBUTES$1));
      }
      this.signatureAlgorithm = getParametersValue(parameters, SIGNATURE_ALGORITHM$2, _CertificationRequest.defaultValues(SIGNATURE_ALGORITHM$2));
      this.signatureValue = getParametersValue(parameters, SIGNATURE_VALUE, _CertificationRequest.defaultValues(SIGNATURE_VALUE));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case TBS$1:
          return EMPTY_BUFFER2;
        case VERSION$6:
          return 0;
        case SUBJECT:
          return new RelativeDistinguishedNames();
        case SPKI:
          return new PublicKeyInfo();
        case ATTRIBUTES$1:
          return [];
        case SIGNATURE_ALGORITHM$2:
          return new AlgorithmIdentifier();
        case SIGNATURE_VALUE:
          return new BitString();
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        value: [
          CertificationRequestInfo(names.certificationRequestInfo || {}),
          new Sequence({
            name: names.signatureAlgorithm || SIGNATURE_ALGORITHM$2,
            value: [
              new ObjectIdentifier(),
              new Any({ optional: true })
            ]
          }),
          new BitString({ name: names.signatureValue || SIGNATURE_VALUE })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$f);
      const asn1 = compareSchema(schema, schema, _CertificationRequest.schema());
      AsnError.assertSchema(asn1, this.className);
      this.tbsView = asn1.result.CertificationRequestInfo.valueBeforeDecodeView;
      this.version = asn1.result[CSR_INFO_VERSION].valueBlock.valueDec;
      this.subject = new RelativeDistinguishedNames({ schema: asn1.result[CSR_INFO_SUBJECT] });
      this.subjectPublicKeyInfo = new PublicKeyInfo({ schema: asn1.result[CSR_INFO_SPKI] });
      if (CSR_INFO_ATTRS in asn1.result) {
        this.attributes = Array.from(asn1.result[CSR_INFO_ATTRS], (element) => new Attribute({ schema: element }));
      }
      this.signatureAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.signatureAlgorithm });
      this.signatureValue = asn1.result.signatureValue;
    }
    encodeTBS() {
      const outputArray = [
        new Integer({ value: this.version }),
        this.subject.toSchema(),
        this.subjectPublicKeyInfo.toSchema()
      ];
      if (ATTRIBUTES$1 in this) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: Array.from(this.attributes || [], (o) => o.toSchema())
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toSchema(encodeFlag = false) {
      let tbsSchema;
      if (encodeFlag === false) {
        if (this.tbsView.byteLength === 0) {
          return _CertificationRequest.schema();
        }
        const asn1 = fromBER(this.tbsView);
        AsnError.assert(asn1, "PKCS#10 Certificate Request");
        tbsSchema = asn1.result;
      } else {
        tbsSchema = this.encodeTBS();
      }
      return new Sequence({
        value: [
          tbsSchema,
          this.signatureAlgorithm.toSchema(),
          this.signatureValue
        ]
      });
    }
    toJSON() {
      const object = {
        tbs: pvtsutils2.Convert.ToHex(this.tbsView),
        version: this.version,
        subject: this.subject.toJSON(),
        subjectPublicKeyInfo: this.subjectPublicKeyInfo.toJSON(),
        signatureAlgorithm: this.signatureAlgorithm.toJSON(),
        signatureValue: this.signatureValue.toJSON()
      };
      if (ATTRIBUTES$1 in this) {
        object.attributes = Array.from(this.attributes || [], (o) => o.toJSON());
      }
      return object;
    }
    async sign(privateKey, hashAlgorithm = "SHA-1", crypto2 = getCrypto(true)) {
      if (!privateKey) {
        throw new Error("Need to provide a private key for signing");
      }
      const signatureParams = await crypto2.getSignatureParameters(privateKey, hashAlgorithm);
      const parameters = signatureParams.parameters;
      this.signatureAlgorithm = signatureParams.signatureAlgorithm;
      this.tbsView = new Uint8Array(this.encodeTBS().toBER());
      const signature = await crypto2.signWithPrivateKey(this.tbsView, privateKey, parameters);
      this.signatureValue = new BitString({ valueHex: signature });
    }
    async verify(crypto2 = getCrypto(true)) {
      return crypto2.verifyWithPublicKey(this.tbsView, this.signatureValue, this.subjectPublicKeyInfo, this.signatureAlgorithm);
    }
    async getPublicKey(parameters, crypto2 = getCrypto(true)) {
      return crypto2.getPublicKey(this.subjectPublicKeyInfo, this.signatureAlgorithm, parameters);
    }
  };
  CertificationRequest.CLASS_NAME = "CertificationRequest";
  var DIGEST_ALGORITHM$1 = "digestAlgorithm";
  var DIGEST = "digest";
  var CLEAR_PROPS$e = [
    DIGEST_ALGORITHM$1,
    DIGEST
  ];
  var DigestInfo = class _DigestInfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.digestAlgorithm = getParametersValue(parameters, DIGEST_ALGORITHM$1, _DigestInfo.defaultValues(DIGEST_ALGORITHM$1));
      this.digest = getParametersValue(parameters, DIGEST, _DigestInfo.defaultValues(DIGEST));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case DIGEST_ALGORITHM$1:
          return new AlgorithmIdentifier();
        case DIGEST:
          return new OctetString();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case DIGEST_ALGORITHM$1:
          return AlgorithmIdentifier.compareWithDefault("algorithmId", memberValue.algorithmId) && "algorithmParams" in memberValue === false;
        case DIGEST:
          return memberValue.isEqual(_DigestInfo.defaultValues(memberName));
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          AlgorithmIdentifier.schema(names.digestAlgorithm || {
            names: {
              blockName: DIGEST_ALGORITHM$1
            }
          }),
          new OctetString({ name: names.digest || DIGEST })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$e);
      const asn1 = compareSchema(schema, schema, _DigestInfo.schema({
        names: {
          digestAlgorithm: {
            names: {
              blockName: DIGEST_ALGORITHM$1
            }
          },
          digest: DIGEST
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.digestAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.digestAlgorithm });
      this.digest = asn1.result.digest;
    }
    toSchema() {
      return new Sequence({
        value: [
          this.digestAlgorithm.toSchema(),
          this.digest
        ]
      });
    }
    toJSON() {
      return {
        digestAlgorithm: this.digestAlgorithm.toJSON(),
        digest: this.digest.toJSON()
      };
    }
  };
  DigestInfo.CLASS_NAME = "DigestInfo";
  var E_CONTENT_TYPE = "eContentType";
  var E_CONTENT = "eContent";
  var CLEAR_PROPS$d = [
    E_CONTENT_TYPE,
    E_CONTENT
  ];
  var EncapsulatedContentInfo = class _EncapsulatedContentInfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.eContentType = getParametersValue(parameters, E_CONTENT_TYPE, _EncapsulatedContentInfo.defaultValues(E_CONTENT_TYPE));
      if (E_CONTENT in parameters) {
        this.eContent = getParametersValue(parameters, E_CONTENT, _EncapsulatedContentInfo.defaultValues(E_CONTENT));
        if (this.eContent.idBlock.tagClass === 1 && this.eContent.idBlock.tagNumber === 4) {
          if (this.eContent.idBlock.isConstructed === false) {
            const constrString = new OctetString({
              idBlock: { isConstructed: true },
              isConstructed: true
            });
            let offset = 0;
            const viewHex = this.eContent.valueBlock.valueHexView.slice().buffer;
            let length = viewHex.byteLength;
            while (length > 0) {
              const pieceView = new Uint8Array(viewHex, offset, offset + 65536 > viewHex.byteLength ? viewHex.byteLength - offset : 65536);
              const _array = new ArrayBuffer(pieceView.length);
              const _view = new Uint8Array(_array);
              for (let i = 0; i < _view.length; i++) {
                _view[i] = pieceView[i];
              }
              constrString.valueBlock.value.push(new OctetString({ valueHex: _array }));
              length -= pieceView.length;
              offset += pieceView.length;
            }
            this.eContent = constrString;
          }
        }
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case E_CONTENT_TYPE:
          return EMPTY_STRING2;
        case E_CONTENT:
          return new OctetString();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case E_CONTENT_TYPE:
          return memberValue === EMPTY_STRING2;
        case E_CONTENT: {
          if (memberValue.idBlock.tagClass === 1 && memberValue.idBlock.tagNumber === 4)
            return memberValue.isEqual(_EncapsulatedContentInfo.defaultValues(E_CONTENT));
          return false;
        }
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.eContentType || EMPTY_STRING2 }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [
              new Any({ name: names.eContent || EMPTY_STRING2 })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$d);
      const asn1 = compareSchema(schema, schema, _EncapsulatedContentInfo.schema({
        names: {
          eContentType: E_CONTENT_TYPE,
          eContent: E_CONTENT
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.eContentType = asn1.result.eContentType.valueBlock.toString();
      if (E_CONTENT in asn1.result)
        this.eContent = asn1.result.eContent;
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(new ObjectIdentifier({ value: this.eContentType }));
      if (this.eContent) {
        if (_EncapsulatedContentInfo.compareWithDefault(E_CONTENT, this.eContent) === false) {
          outputArray.push(new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [this.eContent]
          }));
        }
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        eContentType: this.eContentType
      };
      if (this.eContent && _EncapsulatedContentInfo.compareWithDefault(E_CONTENT, this.eContent) === false) {
        res.eContent = this.eContent.toJSON();
      }
      return res;
    }
  };
  EncapsulatedContentInfo.CLASS_NAME = "EncapsulatedContentInfo";
  var MAC = "mac";
  var MAC_SALT = "macSalt";
  var ITERATIONS = "iterations";
  var CLEAR_PROPS$c = [
    MAC,
    MAC_SALT,
    ITERATIONS
  ];
  var MacData = class _MacData extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.mac = getParametersValue(parameters, MAC, _MacData.defaultValues(MAC));
      this.macSalt = getParametersValue(parameters, MAC_SALT, _MacData.defaultValues(MAC_SALT));
      if (ITERATIONS in parameters) {
        this.iterations = getParametersValue(parameters, ITERATIONS, _MacData.defaultValues(ITERATIONS));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case MAC:
          return new DigestInfo();
        case MAC_SALT:
          return new OctetString();
        case ITERATIONS:
          return 1;
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case MAC:
          return DigestInfo.compareWithDefault("digestAlgorithm", memberValue.digestAlgorithm) && DigestInfo.compareWithDefault("digest", memberValue.digest);
        case MAC_SALT:
          return memberValue.isEqual(_MacData.defaultValues(memberName));
        case ITERATIONS:
          return memberValue === _MacData.defaultValues(memberName);
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        optional: names.optional || true,
        value: [
          DigestInfo.schema(names.mac || {
            names: {
              blockName: MAC
            }
          }),
          new OctetString({ name: names.macSalt || MAC_SALT }),
          new Integer({
            optional: true,
            name: names.iterations || ITERATIONS
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$c);
      const asn1 = compareSchema(schema, schema, _MacData.schema({
        names: {
          mac: {
            names: {
              blockName: MAC
            }
          },
          macSalt: MAC_SALT,
          iterations: ITERATIONS
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.mac = new DigestInfo({ schema: asn1.result.mac });
      this.macSalt = asn1.result.macSalt;
      if (ITERATIONS in asn1.result)
        this.iterations = asn1.result.iterations.valueBlock.valueDec;
    }
    toSchema() {
      const outputArray = [
        this.mac.toSchema(),
        this.macSalt
      ];
      if (this.iterations !== void 0) {
        outputArray.push(new Integer({ value: this.iterations }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        mac: this.mac.toJSON(),
        macSalt: this.macSalt.toJSON()
      };
      if (this.iterations !== void 0) {
        res.iterations = this.iterations;
      }
      return res;
    }
  };
  MacData.CLASS_NAME = "MacData";
  var HASH_ALGORITHM = "hashAlgorithm";
  var HASHED_MESSAGE = "hashedMessage";
  var CLEAR_PROPS$b = [
    HASH_ALGORITHM,
    HASHED_MESSAGE
  ];
  var MessageImprint = class _MessageImprint extends PkiObject {
    static async create(hashAlgorithm, message, crypto2 = getCrypto(true)) {
      const hashAlgorithmOID = crypto2.getOIDByAlgorithm({ name: hashAlgorithm }, true, "hashAlgorithm");
      const hashedMessage = await crypto2.digest(hashAlgorithm, message);
      const res = new _MessageImprint({
        hashAlgorithm: new AlgorithmIdentifier({
          algorithmId: hashAlgorithmOID,
          algorithmParams: new Null()
        }),
        hashedMessage: new OctetString({ valueHex: hashedMessage })
      });
      return res;
    }
    constructor(parameters = {}) {
      super();
      this.hashAlgorithm = getParametersValue(parameters, HASH_ALGORITHM, _MessageImprint.defaultValues(HASH_ALGORITHM));
      this.hashedMessage = getParametersValue(parameters, HASHED_MESSAGE, _MessageImprint.defaultValues(HASHED_MESSAGE));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case HASH_ALGORITHM:
          return new AlgorithmIdentifier();
        case HASHED_MESSAGE:
          return new OctetString();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case HASH_ALGORITHM:
          return memberValue.algorithmId === EMPTY_STRING2 && "algorithmParams" in memberValue === false;
        case HASHED_MESSAGE:
          return memberValue.isEqual(_MessageImprint.defaultValues(memberName)) === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          AlgorithmIdentifier.schema(names.hashAlgorithm || {}),
          new OctetString({ name: names.hashedMessage || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$b);
      const asn1 = compareSchema(schema, schema, _MessageImprint.schema({
        names: {
          hashAlgorithm: {
            names: {
              blockName: HASH_ALGORITHM
            }
          },
          hashedMessage: HASHED_MESSAGE
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.hashAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.hashAlgorithm });
      this.hashedMessage = asn1.result.hashedMessage;
    }
    toSchema() {
      return new Sequence({
        value: [
          this.hashAlgorithm.toSchema(),
          this.hashedMessage
        ]
      });
    }
    toJSON() {
      return {
        hashAlgorithm: this.hashAlgorithm.toJSON(),
        hashedMessage: this.hashedMessage.toJSON()
      };
    }
  };
  MessageImprint.CLASS_NAME = "MessageImprint";
  var REQ_CERT = "reqCert";
  var SINGLE_REQUEST_EXTENSIONS = "singleRequestExtensions";
  var CLEAR_PROPS$a = [
    REQ_CERT,
    SINGLE_REQUEST_EXTENSIONS
  ];
  var Request = class _Request extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.reqCert = getParametersValue(parameters, REQ_CERT, _Request.defaultValues(REQ_CERT));
      if (SINGLE_REQUEST_EXTENSIONS in parameters) {
        this.singleRequestExtensions = getParametersValue(parameters, SINGLE_REQUEST_EXTENSIONS, _Request.defaultValues(SINGLE_REQUEST_EXTENSIONS));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case REQ_CERT:
          return new CertID();
        case SINGLE_REQUEST_EXTENSIONS:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case REQ_CERT:
          return memberValue.isEqual(_Request.defaultValues(memberName));
        case SINGLE_REQUEST_EXTENSIONS:
          return memberValue.length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          CertID.schema(names.reqCert || {}),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [Extensions.schema(names.extensions || {
              names: {
                blockName: names.singleRequestExtensions || EMPTY_STRING2
              }
            })]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$a);
      const asn1 = compareSchema(schema, schema, _Request.schema({
        names: {
          reqCert: {
            names: {
              blockName: REQ_CERT
            }
          },
          extensions: {
            names: {
              blockName: SINGLE_REQUEST_EXTENSIONS
            }
          }
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.reqCert = new CertID({ schema: asn1.result.reqCert });
      if (SINGLE_REQUEST_EXTENSIONS in asn1.result) {
        this.singleRequestExtensions = Array.from(asn1.result.singleRequestExtensions.valueBlock.value, (element) => new Extension({ schema: element }));
      }
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(this.reqCert.toSchema());
      if (this.singleRequestExtensions) {
        outputArray.push(new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [
            new Sequence({
              value: Array.from(this.singleRequestExtensions, (o) => o.toSchema())
            })
          ]
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        reqCert: this.reqCert.toJSON()
      };
      if (this.singleRequestExtensions) {
        res.singleRequestExtensions = Array.from(this.singleRequestExtensions, (o) => o.toJSON());
      }
      return res;
    }
  };
  Request.CLASS_NAME = "Request";
  var TBS = "tbs";
  var VERSION$5 = "version";
  var REQUESTOR_NAME = "requestorName";
  var REQUEST_LIST = "requestList";
  var REQUEST_EXTENSIONS = "requestExtensions";
  var TBS_REQUEST$1 = "TBSRequest";
  var TBS_REQUEST_VERSION = `${TBS_REQUEST$1}.${VERSION$5}`;
  var TBS_REQUEST_REQUESTOR_NAME = `${TBS_REQUEST$1}.${REQUESTOR_NAME}`;
  var TBS_REQUEST_REQUESTS = `${TBS_REQUEST$1}.requests`;
  var TBS_REQUEST_REQUEST_EXTENSIONS = `${TBS_REQUEST$1}.${REQUEST_EXTENSIONS}`;
  var CLEAR_PROPS$9 = [
    TBS_REQUEST$1,
    TBS_REQUEST_VERSION,
    TBS_REQUEST_REQUESTOR_NAME,
    TBS_REQUEST_REQUESTS,
    TBS_REQUEST_REQUEST_EXTENSIONS
  ];
  var TBSRequest = class _TBSRequest extends PkiObject {
    get tbs() {
      return pvtsutils2.BufferSourceConverter.toArrayBuffer(this.tbsView);
    }
    set tbs(value) {
      this.tbsView = new Uint8Array(value);
    }
    constructor(parameters = {}) {
      super();
      this.tbsView = new Uint8Array(getParametersValue(parameters, TBS, _TBSRequest.defaultValues(TBS)));
      if (VERSION$5 in parameters) {
        this.version = getParametersValue(parameters, VERSION$5, _TBSRequest.defaultValues(VERSION$5));
      }
      if (REQUESTOR_NAME in parameters) {
        this.requestorName = getParametersValue(parameters, REQUESTOR_NAME, _TBSRequest.defaultValues(REQUESTOR_NAME));
      }
      this.requestList = getParametersValue(parameters, REQUEST_LIST, _TBSRequest.defaultValues(REQUEST_LIST));
      if (REQUEST_EXTENSIONS in parameters) {
        this.requestExtensions = getParametersValue(parameters, REQUEST_EXTENSIONS, _TBSRequest.defaultValues(REQUEST_EXTENSIONS));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case TBS:
          return EMPTY_BUFFER2;
        case VERSION$5:
          return 0;
        case REQUESTOR_NAME:
          return new GeneralName();
        case REQUEST_LIST:
        case REQUEST_EXTENSIONS:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case TBS:
          return memberValue.byteLength === 0;
        case VERSION$5:
          return memberValue === _TBSRequest.defaultValues(memberName);
        case REQUESTOR_NAME:
          return memberValue.type === GeneralName.defaultValues("type") && Object.keys(memberValue.value).length === 0;
        case REQUEST_LIST:
        case REQUEST_EXTENSIONS:
          return memberValue.length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || TBS_REQUEST$1,
        value: [
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [new Integer({ name: names.TBSRequestVersion || TBS_REQUEST_VERSION })]
          }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: [GeneralName.schema(names.requestorName || {
              names: {
                blockName: TBS_REQUEST_REQUESTOR_NAME
              }
            })]
          }),
          new Sequence({
            name: names.requestList || "TBSRequest.requestList",
            value: [
              new Repeated({
                name: names.requests || TBS_REQUEST_REQUESTS,
                value: Request.schema(names.requestNames || {})
              })
            ]
          }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 2
            },
            value: [Extensions.schema(names.extensions || {
              names: {
                blockName: names.requestExtensions || TBS_REQUEST_REQUEST_EXTENSIONS
              }
            })]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$9);
      const asn1 = compareSchema(schema, schema, _TBSRequest.schema());
      AsnError.assertSchema(asn1, this.className);
      this.tbsView = asn1.result.TBSRequest.valueBeforeDecodeView;
      if (TBS_REQUEST_VERSION in asn1.result)
        this.version = asn1.result[TBS_REQUEST_VERSION].valueBlock.valueDec;
      if (TBS_REQUEST_REQUESTOR_NAME in asn1.result)
        this.requestorName = new GeneralName({ schema: asn1.result[TBS_REQUEST_REQUESTOR_NAME] });
      this.requestList = Array.from(asn1.result[TBS_REQUEST_REQUESTS], (element) => new Request({ schema: element }));
      if (TBS_REQUEST_REQUEST_EXTENSIONS in asn1.result)
        this.requestExtensions = Array.from(asn1.result[TBS_REQUEST_REQUEST_EXTENSIONS].valueBlock.value, (element) => new Extension({ schema: element }));
    }
    toSchema(encodeFlag = false) {
      let tbsSchema;
      if (encodeFlag === false) {
        if (this.tbsView.byteLength === 0)
          return _TBSRequest.schema();
        const asn1 = fromBER(this.tbsView);
        AsnError.assert(asn1, "TBS Request");
        if (!(asn1.result instanceof Sequence)) {
          throw new Error("ASN.1 result should be SEQUENCE");
        }
        tbsSchema = asn1.result;
      } else {
        const outputArray = [];
        if (this.version !== void 0) {
          outputArray.push(new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [new Integer({ value: this.version })]
          }));
        }
        if (this.requestorName) {
          outputArray.push(new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: [this.requestorName.toSchema()]
          }));
        }
        outputArray.push(new Sequence({
          value: Array.from(this.requestList, (o) => o.toSchema())
        }));
        if (this.requestExtensions) {
          outputArray.push(new Constructed({
            idBlock: {
              tagClass: 3,
              tagNumber: 2
            },
            value: [
              new Sequence({
                value: Array.from(this.requestExtensions, (o) => o.toSchema())
              })
            ]
          }));
        }
        tbsSchema = new Sequence({
          value: outputArray
        });
      }
      return tbsSchema;
    }
    toJSON() {
      const res = {};
      if (this.version != void 0)
        res.version = this.version;
      if (this.requestorName) {
        res.requestorName = this.requestorName.toJSON();
      }
      res.requestList = Array.from(this.requestList, (o) => o.toJSON());
      if (this.requestExtensions) {
        res.requestExtensions = Array.from(this.requestExtensions, (o) => o.toJSON());
      }
      return res;
    }
  };
  TBSRequest.CLASS_NAME = "TBSRequest";
  var SIGNATURE_ALGORITHM$1 = "signatureAlgorithm";
  var SIGNATURE$1 = "signature";
  var CERTS = "certs";
  var Signature = class _Signature extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.signatureAlgorithm = getParametersValue(parameters, SIGNATURE_ALGORITHM$1, _Signature.defaultValues(SIGNATURE_ALGORITHM$1));
      this.signature = getParametersValue(parameters, SIGNATURE$1, _Signature.defaultValues(SIGNATURE$1));
      if (CERTS in parameters) {
        this.certs = getParametersValue(parameters, CERTS, _Signature.defaultValues(CERTS));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case SIGNATURE_ALGORITHM$1:
          return new AlgorithmIdentifier();
        case SIGNATURE$1:
          return new BitString();
        case CERTS:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case SIGNATURE_ALGORITHM$1:
          return memberValue.algorithmId === EMPTY_STRING2 && "algorithmParams" in memberValue === false;
        case SIGNATURE$1:
          return memberValue.isEqual(_Signature.defaultValues(memberName));
        case CERTS:
          return memberValue.length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          AlgorithmIdentifier.schema(names.signatureAlgorithm || {}),
          new BitString({ name: names.signature || EMPTY_STRING2 }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [
              new Sequence({
                value: [new Repeated({
                  name: names.certs || EMPTY_STRING2,
                  value: Certificate.schema({})
                })]
              })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, [
        SIGNATURE_ALGORITHM$1,
        SIGNATURE$1,
        CERTS
      ]);
      const asn1 = compareSchema(schema, schema, _Signature.schema({
        names: {
          signatureAlgorithm: {
            names: {
              blockName: SIGNATURE_ALGORITHM$1
            }
          },
          signature: SIGNATURE$1,
          certs: CERTS
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.signatureAlgorithm = new AlgorithmIdentifier({ schema: asn1.result.signatureAlgorithm });
      this.signature = asn1.result.signature;
      if (CERTS in asn1.result)
        this.certs = Array.from(asn1.result.certs, (element) => new Certificate({ schema: element }));
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(this.signatureAlgorithm.toSchema());
      outputArray.push(this.signature);
      if (this.certs) {
        outputArray.push(new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [
            new Sequence({
              value: Array.from(this.certs, (o) => o.toSchema())
            })
          ]
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        signatureAlgorithm: this.signatureAlgorithm.toJSON(),
        signature: this.signature.toJSON()
      };
      if (this.certs) {
        res.certs = Array.from(this.certs, (o) => o.toJSON());
      }
      return res;
    }
  };
  Signature.CLASS_NAME = "Signature";
  var TBS_REQUEST = "tbsRequest";
  var OPTIONAL_SIGNATURE = "optionalSignature";
  var CLEAR_PROPS$8 = [
    TBS_REQUEST,
    OPTIONAL_SIGNATURE
  ];
  var OCSPRequest = class _OCSPRequest extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.tbsRequest = getParametersValue(parameters, TBS_REQUEST, _OCSPRequest.defaultValues(TBS_REQUEST));
      if (OPTIONAL_SIGNATURE in parameters) {
        this.optionalSignature = getParametersValue(parameters, OPTIONAL_SIGNATURE, _OCSPRequest.defaultValues(OPTIONAL_SIGNATURE));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case TBS_REQUEST:
          return new TBSRequest();
        case OPTIONAL_SIGNATURE:
          return new Signature();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case TBS_REQUEST:
          return TBSRequest.compareWithDefault("tbs", memberValue.tbs) && TBSRequest.compareWithDefault("version", memberValue.version) && TBSRequest.compareWithDefault("requestorName", memberValue.requestorName) && TBSRequest.compareWithDefault("requestList", memberValue.requestList) && TBSRequest.compareWithDefault("requestExtensions", memberValue.requestExtensions);
        case OPTIONAL_SIGNATURE:
          return Signature.compareWithDefault("signatureAlgorithm", memberValue.signatureAlgorithm) && Signature.compareWithDefault("signature", memberValue.signature) && Signature.compareWithDefault("certs", memberValue.certs);
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || "OCSPRequest",
        value: [
          TBSRequest.schema(names.tbsRequest || {
            names: {
              blockName: TBS_REQUEST
            }
          }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [
              Signature.schema(names.optionalSignature || {
                names: {
                  blockName: OPTIONAL_SIGNATURE
                }
              })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$8);
      const asn1 = compareSchema(schema, schema, _OCSPRequest.schema());
      AsnError.assertSchema(asn1, this.className);
      this.tbsRequest = new TBSRequest({ schema: asn1.result.tbsRequest });
      if (OPTIONAL_SIGNATURE in asn1.result)
        this.optionalSignature = new Signature({ schema: asn1.result.optionalSignature });
    }
    toSchema(encodeFlag = false) {
      const outputArray = [];
      outputArray.push(this.tbsRequest.toSchema(encodeFlag));
      if (this.optionalSignature)
        outputArray.push(new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [
            this.optionalSignature.toSchema()
          ]
        }));
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        tbsRequest: this.tbsRequest.toJSON()
      };
      if (this.optionalSignature) {
        res.optionalSignature = this.optionalSignature.toJSON();
      }
      return res;
    }
    async createForCertificate(certificate, parameters, crypto2 = getCrypto(true)) {
      const certID = new CertID();
      await certID.createForCertificate(certificate, parameters, crypto2);
      this.tbsRequest.requestList.push(new Request({
        reqCert: certID
      }));
    }
    async sign(privateKey, hashAlgorithm = "SHA-1", crypto2 = getCrypto(true)) {
      ParameterError.assertEmpty(privateKey, "privateKey", "OCSPRequest.sign method");
      if (!this.optionalSignature) {
        throw new Error('Need to create "optionalSignature" field before signing');
      }
      const signatureParams = await crypto2.getSignatureParameters(privateKey, hashAlgorithm);
      const parameters = signatureParams.parameters;
      this.optionalSignature.signatureAlgorithm = signatureParams.signatureAlgorithm;
      const tbs = this.tbsRequest.toSchema(true).toBER(false);
      const signature = await crypto2.signWithPrivateKey(tbs, privateKey, parameters);
      this.optionalSignature.signature = new BitString({ valueHex: signature });
    }
    verify() {
    }
  };
  OCSPRequest.CLASS_NAME = "OCSPRequest";
  var RESPONSE_TYPE = "responseType";
  var RESPONSE = "response";
  var CLEAR_PROPS$7 = [
    RESPONSE_TYPE,
    RESPONSE
  ];
  var ResponseBytes = class _ResponseBytes extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.responseType = getParametersValue(parameters, RESPONSE_TYPE, _ResponseBytes.defaultValues(RESPONSE_TYPE));
      this.response = getParametersValue(parameters, RESPONSE, _ResponseBytes.defaultValues(RESPONSE));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case RESPONSE_TYPE:
          return EMPTY_STRING2;
        case RESPONSE:
          return new OctetString();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case RESPONSE_TYPE:
          return memberValue === EMPTY_STRING2;
        case RESPONSE:
          return memberValue.isEqual(_ResponseBytes.defaultValues(memberName));
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new ObjectIdentifier({ name: names.responseType || EMPTY_STRING2 }),
          new OctetString({ name: names.response || EMPTY_STRING2 })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$7);
      const asn1 = compareSchema(schema, schema, _ResponseBytes.schema({
        names: {
          responseType: RESPONSE_TYPE,
          response: RESPONSE
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.responseType = asn1.result.responseType.valueBlock.toString();
      this.response = asn1.result.response;
    }
    toSchema() {
      return new Sequence({
        value: [
          new ObjectIdentifier({ value: this.responseType }),
          this.response
        ]
      });
    }
    toJSON() {
      return {
        responseType: this.responseType,
        response: this.response.toJSON()
      };
    }
  };
  ResponseBytes.CLASS_NAME = "ResponseBytes";
  var RESPONSE_STATUS = "responseStatus";
  var RESPONSE_BYTES = "responseBytes";
  var OCSPResponse = class _OCSPResponse extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.responseStatus = getParametersValue(parameters, RESPONSE_STATUS, _OCSPResponse.defaultValues(RESPONSE_STATUS));
      if (RESPONSE_BYTES in parameters) {
        this.responseBytes = getParametersValue(parameters, RESPONSE_BYTES, _OCSPResponse.defaultValues(RESPONSE_BYTES));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case RESPONSE_STATUS:
          return new Enumerated();
        case RESPONSE_BYTES:
          return new ResponseBytes();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case RESPONSE_STATUS:
          return memberValue.isEqual(_OCSPResponse.defaultValues(memberName));
        case RESPONSE_BYTES:
          return ResponseBytes.compareWithDefault("responseType", memberValue.responseType) && ResponseBytes.compareWithDefault("response", memberValue.response);
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || "OCSPResponse",
        value: [
          new Enumerated({ name: names.responseStatus || RESPONSE_STATUS }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [
              ResponseBytes.schema(names.responseBytes || {
                names: {
                  blockName: RESPONSE_BYTES
                }
              })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, [
        RESPONSE_STATUS,
        RESPONSE_BYTES
      ]);
      const asn1 = compareSchema(schema, schema, _OCSPResponse.schema());
      AsnError.assertSchema(asn1, this.className);
      this.responseStatus = asn1.result.responseStatus;
      if (RESPONSE_BYTES in asn1.result)
        this.responseBytes = new ResponseBytes({ schema: asn1.result.responseBytes });
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(this.responseStatus);
      if (this.responseBytes) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [this.responseBytes.toSchema()]
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        responseStatus: this.responseStatus.toJSON()
      };
      if (this.responseBytes) {
        res.responseBytes = this.responseBytes.toJSON();
      }
      return res;
    }
    async getCertificateStatus(certificate, issuerCertificate, crypto2 = getCrypto(true)) {
      let basicResponse;
      const result = {
        isForCertificate: false,
        status: 2
      };
      if (!this.responseBytes)
        return result;
      if (this.responseBytes.responseType !== id_PKIX_OCSP_Basic)
        return result;
      try {
        const asn1Basic = fromBER(this.responseBytes.response.valueBlock.valueHexView);
        AsnError.assert(asn1Basic, "Basic OCSP response");
        basicResponse = new BasicOCSPResponse({ schema: asn1Basic.result });
      } catch {
        return result;
      }
      return basicResponse.getCertificateStatus(certificate, issuerCertificate, crypto2);
    }
    async sign(privateKey, hashAlgorithm, crypto2 = getCrypto(true)) {
      var _a3;
      if (this.responseBytes && this.responseBytes.responseType === id_PKIX_OCSP_Basic) {
        const basicResponse = BasicOCSPResponse.fromBER(this.responseBytes.response.valueBlock.valueHexView);
        return basicResponse.sign(privateKey, hashAlgorithm, crypto2);
      }
      throw new Error(`Unknown ResponseBytes type: ${((_a3 = this.responseBytes) === null || _a3 === void 0 ? void 0 : _a3.responseType) || "Unknown"}`);
    }
    async verify(issuerCertificate = null, crypto2 = getCrypto(true)) {
      var _a3;
      if (RESPONSE_BYTES in this === false)
        throw new Error("Empty ResponseBytes field");
      if (this.responseBytes && this.responseBytes.responseType === id_PKIX_OCSP_Basic) {
        const basicResponse = BasicOCSPResponse.fromBER(this.responseBytes.response.valueBlock.valueHexView);
        if (issuerCertificate !== null) {
          if (!basicResponse.certs) {
            basicResponse.certs = [];
          }
          basicResponse.certs.push(issuerCertificate);
        }
        return basicResponse.verify({}, crypto2);
      }
      throw new Error(`Unknown ResponseBytes type: ${((_a3 = this.responseBytes) === null || _a3 === void 0 ? void 0 : _a3.responseType) || "Unknown"}`);
    }
  };
  OCSPResponse.CLASS_NAME = "OCSPResponse";
  var TYPE = "type";
  var ATTRIBUTES = "attributes";
  var ENCODED_VALUE = "encodedValue";
  var CLEAR_PROPS$6 = [
    ATTRIBUTES
  ];
  var SignedAndUnsignedAttributes = class _SignedAndUnsignedAttributes extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.type = getParametersValue(parameters, TYPE, _SignedAndUnsignedAttributes.defaultValues(TYPE));
      this.attributes = getParametersValue(parameters, ATTRIBUTES, _SignedAndUnsignedAttributes.defaultValues(ATTRIBUTES));
      this.encodedValue = getParametersValue(parameters, ENCODED_VALUE, _SignedAndUnsignedAttributes.defaultValues(ENCODED_VALUE));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case TYPE:
          return -1;
        case ATTRIBUTES:
          return [];
        case ENCODED_VALUE:
          return EMPTY_BUFFER2;
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case TYPE:
          return memberValue === _SignedAndUnsignedAttributes.defaultValues(TYPE);
        case ATTRIBUTES:
          return memberValue.length === 0;
        case ENCODED_VALUE:
          return memberValue.byteLength === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Constructed({
        name: names.blockName || EMPTY_STRING2,
        optional: true,
        idBlock: {
          tagClass: 3,
          tagNumber: names.tagNumber || 0
        },
        value: [
          new Repeated({
            name: names.attributes || EMPTY_STRING2,
            value: Attribute.schema()
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$6);
      const asn1 = compareSchema(schema, schema, _SignedAndUnsignedAttributes.schema({
        names: {
          tagNumber: this.type,
          attributes: ATTRIBUTES
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.type = asn1.result.idBlock.tagNumber;
      this.encodedValue = pvtsutils2.BufferSourceConverter.toArrayBuffer(asn1.result.valueBeforeDecodeView);
      const encodedView = new Uint8Array(this.encodedValue);
      encodedView[0] = 49;
      if (ATTRIBUTES in asn1.result === false) {
        if (this.type === 0)
          throw new Error("Wrong structure of SignedUnsignedAttributes");
        else
          return;
      }
      this.attributes = Array.from(asn1.result.attributes, (element) => new Attribute({ schema: element }));
    }
    toSchema() {
      if (_SignedAndUnsignedAttributes.compareWithDefault(TYPE, this.type) || _SignedAndUnsignedAttributes.compareWithDefault(ATTRIBUTES, this.attributes))
        throw new Error('Incorrectly initialized "SignedAndUnsignedAttributes" class');
      return new Constructed({
        optional: true,
        idBlock: {
          tagClass: 3,
          tagNumber: this.type
        },
        value: Array.from(this.attributes, (o) => o.toSchema())
      });
    }
    toJSON() {
      if (_SignedAndUnsignedAttributes.compareWithDefault(TYPE, this.type) || _SignedAndUnsignedAttributes.compareWithDefault(ATTRIBUTES, this.attributes))
        throw new Error('Incorrectly initialized "SignedAndUnsignedAttributes" class');
      return {
        type: this.type,
        attributes: Array.from(this.attributes, (o) => o.toJSON())
      };
    }
  };
  SignedAndUnsignedAttributes.CLASS_NAME = "SignedAndUnsignedAttributes";
  var VERSION$4 = "version";
  var SID = "sid";
  var DIGEST_ALGORITHM = "digestAlgorithm";
  var SIGNED_ATTRS = "signedAttrs";
  var SIGNATURE_ALGORITHM = "signatureAlgorithm";
  var SIGNATURE = "signature";
  var UNSIGNED_ATTRS = "unsignedAttrs";
  var SIGNER_INFO = "SignerInfo";
  var SIGNER_INFO_VERSION = `${SIGNER_INFO}.${VERSION$4}`;
  var SIGNER_INFO_SID = `${SIGNER_INFO}.${SID}`;
  var SIGNER_INFO_DIGEST_ALGORITHM = `${SIGNER_INFO}.${DIGEST_ALGORITHM}`;
  var SIGNER_INFO_SIGNED_ATTRS = `${SIGNER_INFO}.${SIGNED_ATTRS}`;
  var SIGNER_INFO_SIGNATURE_ALGORITHM = `${SIGNER_INFO}.${SIGNATURE_ALGORITHM}`;
  var SIGNER_INFO_SIGNATURE = `${SIGNER_INFO}.${SIGNATURE}`;
  var SIGNER_INFO_UNSIGNED_ATTRS = `${SIGNER_INFO}.${UNSIGNED_ATTRS}`;
  var CLEAR_PROPS$5 = [
    SIGNER_INFO_VERSION,
    SIGNER_INFO_SID,
    SIGNER_INFO_DIGEST_ALGORITHM,
    SIGNER_INFO_SIGNED_ATTRS,
    SIGNER_INFO_SIGNATURE_ALGORITHM,
    SIGNER_INFO_SIGNATURE,
    SIGNER_INFO_UNSIGNED_ATTRS
  ];
  var SignerInfo = class _SignerInfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.version = getParametersValue(parameters, VERSION$4, _SignerInfo.defaultValues(VERSION$4));
      this.sid = getParametersValue(parameters, SID, _SignerInfo.defaultValues(SID));
      this.digestAlgorithm = getParametersValue(parameters, DIGEST_ALGORITHM, _SignerInfo.defaultValues(DIGEST_ALGORITHM));
      if (SIGNED_ATTRS in parameters) {
        this.signedAttrs = getParametersValue(parameters, SIGNED_ATTRS, _SignerInfo.defaultValues(SIGNED_ATTRS));
      }
      this.signatureAlgorithm = getParametersValue(parameters, SIGNATURE_ALGORITHM, _SignerInfo.defaultValues(SIGNATURE_ALGORITHM));
      this.signature = getParametersValue(parameters, SIGNATURE, _SignerInfo.defaultValues(SIGNATURE));
      if (UNSIGNED_ATTRS in parameters) {
        this.unsignedAttrs = getParametersValue(parameters, UNSIGNED_ATTRS, _SignerInfo.defaultValues(UNSIGNED_ATTRS));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VERSION$4:
          return 0;
        case SID:
          return new Any();
        case DIGEST_ALGORITHM:
          return new AlgorithmIdentifier();
        case SIGNED_ATTRS:
          return new SignedAndUnsignedAttributes({ type: 0 });
        case SIGNATURE_ALGORITHM:
          return new AlgorithmIdentifier();
        case SIGNATURE:
          return new OctetString();
        case UNSIGNED_ATTRS:
          return new SignedAndUnsignedAttributes({ type: 1 });
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case VERSION$4:
          return _SignerInfo.defaultValues(VERSION$4) === memberValue;
        case SID:
          return memberValue instanceof Any;
        case DIGEST_ALGORITHM:
          if (memberValue instanceof AlgorithmIdentifier === false)
            return false;
          return memberValue.isEqual(_SignerInfo.defaultValues(DIGEST_ALGORITHM));
        case SIGNED_ATTRS:
          return SignedAndUnsignedAttributes.compareWithDefault("type", memberValue.type) && SignedAndUnsignedAttributes.compareWithDefault("attributes", memberValue.attributes) && SignedAndUnsignedAttributes.compareWithDefault("encodedValue", memberValue.encodedValue);
        case SIGNATURE_ALGORITHM:
          if (memberValue instanceof AlgorithmIdentifier === false)
            return false;
          return memberValue.isEqual(_SignerInfo.defaultValues(SIGNATURE_ALGORITHM));
        case SIGNATURE:
        case UNSIGNED_ATTRS:
          return SignedAndUnsignedAttributes.compareWithDefault("type", memberValue.type) && SignedAndUnsignedAttributes.compareWithDefault("attributes", memberValue.attributes) && SignedAndUnsignedAttributes.compareWithDefault("encodedValue", memberValue.encodedValue);
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: SIGNER_INFO,
        value: [
          new Integer({ name: names.version || SIGNER_INFO_VERSION }),
          new Choice({
            value: [
              IssuerAndSerialNumber.schema(names.sidSchema || {
                names: {
                  blockName: SIGNER_INFO_SID
                }
              }),
              new Choice({
                value: [
                  new Constructed({
                    optional: true,
                    name: names.sid || SIGNER_INFO_SID,
                    idBlock: {
                      tagClass: 3,
                      tagNumber: 0
                    },
                    value: [new OctetString()]
                  }),
                  new Primitive({
                    optional: true,
                    name: names.sid || SIGNER_INFO_SID,
                    idBlock: {
                      tagClass: 3,
                      tagNumber: 0
                    }
                  })
                ]
              })
            ]
          }),
          AlgorithmIdentifier.schema(names.digestAlgorithm || {
            names: {
              blockName: SIGNER_INFO_DIGEST_ALGORITHM
            }
          }),
          SignedAndUnsignedAttributes.schema(names.signedAttrs || {
            names: {
              blockName: SIGNER_INFO_SIGNED_ATTRS,
              tagNumber: 0
            }
          }),
          AlgorithmIdentifier.schema(names.signatureAlgorithm || {
            names: {
              blockName: SIGNER_INFO_SIGNATURE_ALGORITHM
            }
          }),
          new OctetString({ name: names.signature || SIGNER_INFO_SIGNATURE }),
          SignedAndUnsignedAttributes.schema(names.unsignedAttrs || {
            names: {
              blockName: SIGNER_INFO_UNSIGNED_ATTRS,
              tagNumber: 1
            }
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$5);
      const asn1 = compareSchema(schema, schema, _SignerInfo.schema());
      AsnError.assertSchema(asn1, this.className);
      this.version = asn1.result[SIGNER_INFO_VERSION].valueBlock.valueDec;
      const currentSid = asn1.result[SIGNER_INFO_SID];
      if (currentSid.idBlock.tagClass === 1)
        this.sid = new IssuerAndSerialNumber({ schema: currentSid });
      else
        this.sid = currentSid;
      this.digestAlgorithm = new AlgorithmIdentifier({ schema: asn1.result[SIGNER_INFO_DIGEST_ALGORITHM] });
      if (SIGNER_INFO_SIGNED_ATTRS in asn1.result)
        this.signedAttrs = new SignedAndUnsignedAttributes({ type: 0, schema: asn1.result[SIGNER_INFO_SIGNED_ATTRS] });
      this.signatureAlgorithm = new AlgorithmIdentifier({ schema: asn1.result[SIGNER_INFO_SIGNATURE_ALGORITHM] });
      this.signature = asn1.result[SIGNER_INFO_SIGNATURE];
      if (SIGNER_INFO_UNSIGNED_ATTRS in asn1.result)
        this.unsignedAttrs = new SignedAndUnsignedAttributes({ type: 1, schema: asn1.result[SIGNER_INFO_UNSIGNED_ATTRS] });
    }
    toSchema() {
      if (_SignerInfo.compareWithDefault(SID, this.sid))
        throw new Error('Incorrectly initialized "SignerInfo" class');
      const outputArray = [];
      outputArray.push(new Integer({ value: this.version }));
      if (this.sid instanceof IssuerAndSerialNumber)
        outputArray.push(this.sid.toSchema());
      else
        outputArray.push(this.sid);
      outputArray.push(this.digestAlgorithm.toSchema());
      if (this.signedAttrs) {
        if (_SignerInfo.compareWithDefault(SIGNED_ATTRS, this.signedAttrs) === false)
          outputArray.push(this.signedAttrs.toSchema());
      }
      outputArray.push(this.signatureAlgorithm.toSchema());
      outputArray.push(this.signature);
      if (this.unsignedAttrs) {
        if (_SignerInfo.compareWithDefault(UNSIGNED_ATTRS, this.unsignedAttrs) === false)
          outputArray.push(this.unsignedAttrs.toSchema());
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      if (_SignerInfo.compareWithDefault(SID, this.sid)) {
        throw new Error('Incorrectly initialized "SignerInfo" class');
      }
      const res = {
        version: this.version,
        digestAlgorithm: this.digestAlgorithm.toJSON(),
        signatureAlgorithm: this.signatureAlgorithm.toJSON(),
        signature: this.signature.toJSON()
      };
      if (!(this.sid instanceof Any))
        res.sid = this.sid.toJSON();
      if (this.signedAttrs && _SignerInfo.compareWithDefault(SIGNED_ATTRS, this.signedAttrs) === false) {
        res.signedAttrs = this.signedAttrs.toJSON();
      }
      if (this.unsignedAttrs && _SignerInfo.compareWithDefault(UNSIGNED_ATTRS, this.unsignedAttrs) === false) {
        res.unsignedAttrs = this.unsignedAttrs.toJSON();
      }
      return res;
    }
  };
  SignerInfo.CLASS_NAME = "SignerInfo";
  var VERSION$3 = "version";
  var POLICY = "policy";
  var MESSAGE_IMPRINT$1 = "messageImprint";
  var SERIAL_NUMBER = "serialNumber";
  var GEN_TIME = "genTime";
  var ORDERING = "ordering";
  var NONCE$1 = "nonce";
  var ACCURACY = "accuracy";
  var TSA = "tsa";
  var EXTENSIONS$1 = "extensions";
  var TST_INFO = "TSTInfo";
  var TST_INFO_VERSION = `${TST_INFO}.${VERSION$3}`;
  var TST_INFO_POLICY = `${TST_INFO}.${POLICY}`;
  var TST_INFO_MESSAGE_IMPRINT = `${TST_INFO}.${MESSAGE_IMPRINT$1}`;
  var TST_INFO_SERIAL_NUMBER = `${TST_INFO}.${SERIAL_NUMBER}`;
  var TST_INFO_GEN_TIME = `${TST_INFO}.${GEN_TIME}`;
  var TST_INFO_ACCURACY = `${TST_INFO}.${ACCURACY}`;
  var TST_INFO_ORDERING = `${TST_INFO}.${ORDERING}`;
  var TST_INFO_NONCE = `${TST_INFO}.${NONCE$1}`;
  var TST_INFO_TSA = `${TST_INFO}.${TSA}`;
  var TST_INFO_EXTENSIONS = `${TST_INFO}.${EXTENSIONS$1}`;
  var CLEAR_PROPS$4 = [
    TST_INFO_VERSION,
    TST_INFO_POLICY,
    TST_INFO_MESSAGE_IMPRINT,
    TST_INFO_SERIAL_NUMBER,
    TST_INFO_GEN_TIME,
    TST_INFO_ACCURACY,
    TST_INFO_ORDERING,
    TST_INFO_NONCE,
    TST_INFO_TSA,
    TST_INFO_EXTENSIONS
  ];
  var TSTInfo = class _TSTInfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.version = getParametersValue(parameters, VERSION$3, _TSTInfo.defaultValues(VERSION$3));
      this.policy = getParametersValue(parameters, POLICY, _TSTInfo.defaultValues(POLICY));
      this.messageImprint = getParametersValue(parameters, MESSAGE_IMPRINT$1, _TSTInfo.defaultValues(MESSAGE_IMPRINT$1));
      this.serialNumber = getParametersValue(parameters, SERIAL_NUMBER, _TSTInfo.defaultValues(SERIAL_NUMBER));
      this.genTime = getParametersValue(parameters, GEN_TIME, _TSTInfo.defaultValues(GEN_TIME));
      if (ACCURACY in parameters) {
        this.accuracy = getParametersValue(parameters, ACCURACY, _TSTInfo.defaultValues(ACCURACY));
      }
      if (ORDERING in parameters) {
        this.ordering = getParametersValue(parameters, ORDERING, _TSTInfo.defaultValues(ORDERING));
      }
      if (NONCE$1 in parameters) {
        this.nonce = getParametersValue(parameters, NONCE$1, _TSTInfo.defaultValues(NONCE$1));
      }
      if (TSA in parameters) {
        this.tsa = getParametersValue(parameters, TSA, _TSTInfo.defaultValues(TSA));
      }
      if (EXTENSIONS$1 in parameters) {
        this.extensions = getParametersValue(parameters, EXTENSIONS$1, _TSTInfo.defaultValues(EXTENSIONS$1));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VERSION$3:
          return 0;
        case POLICY:
          return EMPTY_STRING2;
        case MESSAGE_IMPRINT$1:
          return new MessageImprint();
        case SERIAL_NUMBER:
          return new Integer();
        case GEN_TIME:
          return new Date(0, 0, 0);
        case ACCURACY:
          return new Accuracy();
        case ORDERING:
          return false;
        case NONCE$1:
          return new Integer();
        case TSA:
          return new GeneralName();
        case EXTENSIONS$1:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case VERSION$3:
        case POLICY:
        case GEN_TIME:
        case ORDERING:
          return memberValue === _TSTInfo.defaultValues(ORDERING);
        case MESSAGE_IMPRINT$1:
          return MessageImprint.compareWithDefault(HASH_ALGORITHM, memberValue.hashAlgorithm) && MessageImprint.compareWithDefault(HASHED_MESSAGE, memberValue.hashedMessage);
        case SERIAL_NUMBER:
        case NONCE$1:
          return memberValue.isEqual(_TSTInfo.defaultValues(NONCE$1));
        case ACCURACY:
          return Accuracy.compareWithDefault(SECONDS, memberValue.seconds) && Accuracy.compareWithDefault(MILLIS, memberValue.millis) && Accuracy.compareWithDefault(MICROS, memberValue.micros);
        case TSA:
          return GeneralName.compareWithDefault(TYPE$4, memberValue.type) && GeneralName.compareWithDefault(VALUE$5, memberValue.value);
        case EXTENSIONS$1:
          return memberValue.length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || TST_INFO,
        value: [
          new Integer({ name: names.version || TST_INFO_VERSION }),
          new ObjectIdentifier({ name: names.policy || TST_INFO_POLICY }),
          MessageImprint.schema(names.messageImprint || {
            names: {
              blockName: TST_INFO_MESSAGE_IMPRINT
            }
          }),
          new Integer({ name: names.serialNumber || TST_INFO_SERIAL_NUMBER }),
          new GeneralizedTime({ name: names.genTime || TST_INFO_GEN_TIME }),
          Accuracy.schema(names.accuracy || {
            names: {
              blockName: TST_INFO_ACCURACY
            }
          }),
          new Boolean({
            name: names.ordering || TST_INFO_ORDERING,
            optional: true
          }),
          new Integer({
            name: names.nonce || TST_INFO_NONCE,
            optional: true
          }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [GeneralName.schema(names.tsa || {
              names: {
                blockName: TST_INFO_TSA
              }
            })]
          }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: [
              new Repeated({
                name: names.extensions || TST_INFO_EXTENSIONS,
                value: Extension.schema(names.extension || {})
              })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$4);
      const asn1 = compareSchema(schema, schema, _TSTInfo.schema());
      AsnError.assertSchema(asn1, this.className);
      this.version = asn1.result[TST_INFO_VERSION].valueBlock.valueDec;
      this.policy = asn1.result[TST_INFO_POLICY].valueBlock.toString();
      this.messageImprint = new MessageImprint({ schema: asn1.result[TST_INFO_MESSAGE_IMPRINT] });
      this.serialNumber = asn1.result[TST_INFO_SERIAL_NUMBER];
      this.genTime = asn1.result[TST_INFO_GEN_TIME].toDate();
      if (TST_INFO_ACCURACY in asn1.result)
        this.accuracy = new Accuracy({ schema: asn1.result[TST_INFO_ACCURACY] });
      if (TST_INFO_ORDERING in asn1.result)
        this.ordering = asn1.result[TST_INFO_ORDERING].valueBlock.value;
      if (TST_INFO_NONCE in asn1.result)
        this.nonce = asn1.result[TST_INFO_NONCE];
      if (TST_INFO_TSA in asn1.result)
        this.tsa = new GeneralName({ schema: asn1.result[TST_INFO_TSA] });
      if (TST_INFO_EXTENSIONS in asn1.result)
        this.extensions = Array.from(asn1.result[TST_INFO_EXTENSIONS], (element) => new Extension({ schema: element }));
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(new Integer({ value: this.version }));
      outputArray.push(new ObjectIdentifier({ value: this.policy }));
      outputArray.push(this.messageImprint.toSchema());
      outputArray.push(this.serialNumber);
      outputArray.push(new GeneralizedTime({ valueDate: this.genTime }));
      if (this.accuracy)
        outputArray.push(this.accuracy.toSchema());
      if (this.ordering !== void 0)
        outputArray.push(new Boolean({ value: this.ordering }));
      if (this.nonce)
        outputArray.push(this.nonce);
      if (this.tsa) {
        outputArray.push(new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: [this.tsa.toSchema()]
        }));
      }
      if (this.extensions) {
        outputArray.push(new Constructed({
          optional: true,
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          value: Array.from(this.extensions, (o) => o.toSchema())
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        version: this.version,
        policy: this.policy,
        messageImprint: this.messageImprint.toJSON(),
        serialNumber: this.serialNumber.toJSON(),
        genTime: this.genTime
      };
      if (this.accuracy)
        res.accuracy = this.accuracy.toJSON();
      if (this.ordering !== void 0)
        res.ordering = this.ordering;
      if (this.nonce)
        res.nonce = this.nonce.toJSON();
      if (this.tsa)
        res.tsa = this.tsa.toJSON();
      if (this.extensions)
        res.extensions = Array.from(this.extensions, (o) => o.toJSON());
      return res;
    }
    async verify(params, crypto2 = getCrypto(true)) {
      if (!params.data) {
        throw new Error('"data" is a mandatory attribute for TST_INFO verification');
      }
      const data = params.data;
      if (params.notBefore) {
        if (this.genTime < params.notBefore)
          throw new Error("Generation time for TSTInfo object is less than notBefore value");
      }
      if (params.notAfter) {
        if (this.genTime > params.notAfter)
          throw new Error("Generation time for TSTInfo object is more than notAfter value");
      }
      const shaAlgorithm = crypto2.getAlgorithmByOID(this.messageImprint.hashAlgorithm.algorithmId, true, "MessageImprint.hashAlgorithm");
      const hash = await crypto2.digest(shaAlgorithm.name, new Uint8Array(data));
      return pvtsutils2.BufferSourceConverter.isEqual(hash, this.messageImprint.hashedMessage.valueBlock.valueHexView);
    }
  };
  TSTInfo.CLASS_NAME = "TSTInfo";
  var VERSION$2 = "version";
  var DIGEST_ALGORITHMS = "digestAlgorithms";
  var ENCAP_CONTENT_INFO = "encapContentInfo";
  var CERTIFICATES = "certificates";
  var CRLS = "crls";
  var SIGNER_INFOS = "signerInfos";
  var OCSPS = "ocsps";
  var SIGNED_DATA = "SignedData";
  var SIGNED_DATA_VERSION = `${SIGNED_DATA}.${VERSION$2}`;
  var SIGNED_DATA_DIGEST_ALGORITHMS = `${SIGNED_DATA}.${DIGEST_ALGORITHMS}`;
  var SIGNED_DATA_ENCAP_CONTENT_INFO = `${SIGNED_DATA}.${ENCAP_CONTENT_INFO}`;
  var SIGNED_DATA_CERTIFICATES = `${SIGNED_DATA}.${CERTIFICATES}`;
  var SIGNED_DATA_CRLS = `${SIGNED_DATA}.${CRLS}`;
  var SIGNED_DATA_SIGNER_INFOS = `${SIGNED_DATA}.${SIGNER_INFOS}`;
  var CLEAR_PROPS$3 = [
    SIGNED_DATA_VERSION,
    SIGNED_DATA_DIGEST_ALGORITHMS,
    SIGNED_DATA_ENCAP_CONTENT_INFO,
    SIGNED_DATA_CERTIFICATES,
    SIGNED_DATA_CRLS,
    SIGNED_DATA_SIGNER_INFOS
  ];
  var SignedDataVerifyError = class extends Error {
    constructor({ message, code = 0, date = /* @__PURE__ */ new Date(), signatureVerified = null, signerCertificate = null, signerCertificateVerified = null, timestampSerial = null, certificatePath = [] }) {
      super(message);
      this.name = "SignedDataVerifyError";
      this.date = date;
      this.code = code;
      this.timestampSerial = timestampSerial;
      this.signatureVerified = signatureVerified;
      this.signerCertificate = signerCertificate;
      this.signerCertificateVerified = signerCertificateVerified;
      this.certificatePath = certificatePath;
    }
  };
  var SignedData = class _SignedData extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.version = getParametersValue(parameters, VERSION$2, _SignedData.defaultValues(VERSION$2));
      this.digestAlgorithms = getParametersValue(parameters, DIGEST_ALGORITHMS, _SignedData.defaultValues(DIGEST_ALGORITHMS));
      this.encapContentInfo = getParametersValue(parameters, ENCAP_CONTENT_INFO, _SignedData.defaultValues(ENCAP_CONTENT_INFO));
      if (CERTIFICATES in parameters) {
        this.certificates = getParametersValue(parameters, CERTIFICATES, _SignedData.defaultValues(CERTIFICATES));
      }
      if (CRLS in parameters) {
        this.crls = getParametersValue(parameters, CRLS, _SignedData.defaultValues(CRLS));
      }
      if (OCSPS in parameters) {
        this.ocsps = getParametersValue(parameters, OCSPS, _SignedData.defaultValues(OCSPS));
      }
      this.signerInfos = getParametersValue(parameters, SIGNER_INFOS, _SignedData.defaultValues(SIGNER_INFOS));
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VERSION$2:
          return 0;
        case DIGEST_ALGORITHMS:
          return [];
        case ENCAP_CONTENT_INFO:
          return new EncapsulatedContentInfo();
        case CERTIFICATES:
          return [];
        case CRLS:
          return [];
        case OCSPS:
          return [];
        case SIGNER_INFOS:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case VERSION$2:
          return memberValue === _SignedData.defaultValues(VERSION$2);
        case ENCAP_CONTENT_INFO:
          return EncapsulatedContentInfo.compareWithDefault("eContentType", memberValue.eContentType) && EncapsulatedContentInfo.compareWithDefault("eContent", memberValue.eContent);
        case DIGEST_ALGORITHMS:
        case CERTIFICATES:
        case CRLS:
        case OCSPS:
        case SIGNER_INFOS:
          return memberValue.length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      if (names.optional === void 0) {
        names.optional = false;
      }
      return new Sequence({
        name: names.blockName || SIGNED_DATA,
        optional: names.optional,
        value: [
          new Integer({ name: names.version || SIGNED_DATA_VERSION }),
          new Set({
            value: [
              new Repeated({
                name: names.digestAlgorithms || SIGNED_DATA_DIGEST_ALGORITHMS,
                value: AlgorithmIdentifier.schema()
              })
            ]
          }),
          EncapsulatedContentInfo.schema(names.encapContentInfo || {
            names: {
              blockName: SIGNED_DATA_ENCAP_CONTENT_INFO
            }
          }),
          new Constructed({
            name: names.certificates || SIGNED_DATA_CERTIFICATES,
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: CertificateSet.schema().valueBlock.value
          }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 1
            },
            value: RevocationInfoChoices.schema(names.crls || {
              names: {
                crls: SIGNED_DATA_CRLS
              }
            }).valueBlock.value
          }),
          new Set({
            value: [
              new Repeated({
                name: names.signerInfos || SIGNED_DATA_SIGNER_INFOS,
                value: SignerInfo.schema()
              })
            ]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$3);
      const asn1 = compareSchema(schema, schema, _SignedData.schema());
      AsnError.assertSchema(asn1, this.className);
      this.version = asn1.result[SIGNED_DATA_VERSION].valueBlock.valueDec;
      if (SIGNED_DATA_DIGEST_ALGORITHMS in asn1.result)
        this.digestAlgorithms = Array.from(asn1.result[SIGNED_DATA_DIGEST_ALGORITHMS], (algorithm) => new AlgorithmIdentifier({ schema: algorithm }));
      this.encapContentInfo = new EncapsulatedContentInfo({ schema: asn1.result[SIGNED_DATA_ENCAP_CONTENT_INFO] });
      if (SIGNED_DATA_CERTIFICATES in asn1.result) {
        const certificateSet = new CertificateSet({
          schema: new Set({
            value: asn1.result[SIGNED_DATA_CERTIFICATES].valueBlock.value
          })
        });
        this.certificates = certificateSet.certificates.slice(0);
      }
      if (SIGNED_DATA_CRLS in asn1.result) {
        this.crls = Array.from(asn1.result[SIGNED_DATA_CRLS], (crl) => {
          if (crl.idBlock.tagClass === 1)
            return new CertificateRevocationList({ schema: crl });
          crl.idBlock.tagClass = 1;
          crl.idBlock.tagNumber = 16;
          return new OtherRevocationInfoFormat({ schema: crl });
        });
      }
      if (SIGNED_DATA_SIGNER_INFOS in asn1.result)
        this.signerInfos = Array.from(asn1.result[SIGNED_DATA_SIGNER_INFOS], (signerInfoSchema) => new SignerInfo({ schema: signerInfoSchema }));
    }
    toSchema(encodeFlag = false) {
      const outputArray = [];
      if (this.certificates && this.certificates.length && this.certificates.some((o) => o instanceof OtherCertificateFormat) || this.crls && this.crls.length && this.crls.some((o) => o instanceof OtherRevocationInfoFormat)) {
        this.version = 5;
      } else if (this.certificates && this.certificates.length && this.certificates.some((o) => o instanceof AttributeCertificateV2)) {
        this.version = 4;
      } else if (this.certificates && this.certificates.length && this.certificates.some((o) => o instanceof AttributeCertificateV1) || this.signerInfos.some((o) => o.version === 3) || this.encapContentInfo.eContentType !== _SignedData.ID_DATA) {
        this.version = 3;
      } else {
        this.version = 1;
      }
      outputArray.push(new Integer({ value: this.version }));
      outputArray.push(new Set({
        value: Array.from(this.digestAlgorithms, (algorithm) => algorithm.toSchema())
      }));
      outputArray.push(this.encapContentInfo.toSchema());
      if (this.certificates) {
        const certificateSet = new CertificateSet({ certificates: this.certificates });
        const certificateSetSchema = certificateSet.toSchema();
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: certificateSetSchema.valueBlock.value
        }));
      }
      if (this.crls) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 1
          },
          value: Array.from(this.crls, (crl) => {
            if (crl instanceof OtherRevocationInfoFormat) {
              const crlSchema = crl.toSchema();
              crlSchema.idBlock.tagClass = 3;
              crlSchema.idBlock.tagNumber = 1;
              return crlSchema;
            }
            return crl.toSchema(encodeFlag);
          })
        }));
      }
      outputArray.push(new Set({
        value: Array.from(this.signerInfos, (signerInfo) => signerInfo.toSchema())
      }));
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        version: this.version,
        digestAlgorithms: Array.from(this.digestAlgorithms, (algorithm) => algorithm.toJSON()),
        encapContentInfo: this.encapContentInfo.toJSON(),
        signerInfos: Array.from(this.signerInfos, (signerInfo) => signerInfo.toJSON())
      };
      if (this.certificates) {
        res.certificates = Array.from(this.certificates, (certificate) => certificate.toJSON());
      }
      if (this.crls) {
        res.crls = Array.from(this.crls, (crl) => crl.toJSON());
      }
      return res;
    }
    async verify({ signer = -1, data = EMPTY_BUFFER2, trustedCerts = [], checkDate = /* @__PURE__ */ new Date(), checkChain = false, passedWhenNotRevValues = false, extendedMode = false, findOrigin = null, findIssuer = null } = {}, crypto2 = getCrypto(true)) {
      let signerCert = null;
      let timestampSerial = null;
      try {
        let messageDigestValue = EMPTY_BUFFER2;
        let shaAlgorithm = EMPTY_STRING2;
        let certificatePath = [];
        const signerInfo = this.signerInfos[signer];
        if (!signerInfo) {
          throw new SignedDataVerifyError({
            date: checkDate,
            code: 1,
            message: "Unable to get signer by supplied index"
          });
        }
        if (!this.certificates) {
          throw new SignedDataVerifyError({
            date: checkDate,
            code: 2,
            message: "No certificates attached to this signed data"
          });
        }
        if (signerInfo.sid instanceof IssuerAndSerialNumber) {
          for (const certificate of this.certificates) {
            if (!(certificate instanceof Certificate))
              continue;
            if (certificate.issuer.isEqual(signerInfo.sid.issuer) && certificate.serialNumber.isEqual(signerInfo.sid.serialNumber)) {
              signerCert = certificate;
              break;
            }
          }
        } else {
          const sid = signerInfo.sid;
          const keyId = sid.idBlock.isConstructed ? sid.valueBlock.value[0].valueBlock.valueHex : sid.valueBlock.valueHex;
          for (const certificate of this.certificates) {
            if (!(certificate instanceof Certificate)) {
              continue;
            }
            const digest = await crypto2.digest({ name: "sha-1" }, certificate.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHexView);
            if (isEqualBuffer(digest, keyId)) {
              signerCert = certificate;
              break;
            }
          }
        }
        if (!signerCert) {
          throw new SignedDataVerifyError({
            date: checkDate,
            code: 3,
            message: "Unable to find signer certificate"
          });
        }
        if (this.encapContentInfo.eContentType === id_eContentType_TSTInfo) {
          if (!this.encapContentInfo.eContent) {
            throw new SignedDataVerifyError({
              date: checkDate,
              code: 15,
              message: "Error during verification: TSTInfo eContent is empty",
              signatureVerified: null,
              signerCertificate: signerCert,
              timestampSerial,
              signerCertificateVerified: true
            });
          }
          let tstInfo;
          try {
            tstInfo = TSTInfo.fromBER(this.encapContentInfo.eContent.valueBlock.valueHexView);
          } catch {
            throw new SignedDataVerifyError({
              date: checkDate,
              code: 15,
              message: "Error during verification: TSTInfo wrong ASN.1 schema ",
              signatureVerified: null,
              signerCertificate: signerCert,
              timestampSerial,
              signerCertificateVerified: true
            });
          }
          checkDate = tstInfo.genTime;
          timestampSerial = tstInfo.serialNumber.valueBlock.valueHexView.slice().buffer;
          if (data.byteLength === 0) {
            throw new SignedDataVerifyError({
              date: checkDate,
              code: 4,
              message: "Missed detached data input array"
            });
          }
          if (!await tstInfo.verify({ data }, crypto2)) {
            throw new SignedDataVerifyError({
              date: checkDate,
              code: 15,
              message: "Error during verification: TSTInfo verification is failed",
              signatureVerified: false,
              signerCertificate: signerCert,
              timestampSerial,
              signerCertificateVerified: true
            });
          }
        }
        if (checkChain) {
          const certs = this.certificates.filter((certificate) => certificate instanceof Certificate && !!checkCA(certificate, signerCert));
          const chainParams = {
            checkDate,
            certs,
            trustedCerts
          };
          if (findIssuer) {
            chainParams.findIssuer = findIssuer;
          }
          if (findOrigin) {
            chainParams.findOrigin = findOrigin;
          }
          const chainEngine = new CertificateChainValidationEngine(chainParams);
          chainEngine.certs.push(signerCert);
          if (this.crls) {
            for (const crl of this.crls) {
              if ("thisUpdate" in crl)
                chainEngine.crls.push(crl);
              else {
                if (crl.otherRevInfoFormat === id_PKIX_OCSP_Basic)
                  chainEngine.ocsps.push(new BasicOCSPResponse({ schema: crl.otherRevInfo }));
              }
            }
          }
          if (this.ocsps) {
            chainEngine.ocsps.push(...this.ocsps);
          }
          const verificationResult = await chainEngine.verify({ passedWhenNotRevValues }, crypto2).catch((e) => {
            throw new SignedDataVerifyError({
              date: checkDate,
              code: 5,
              message: `Validation of signer's certificate failed with error: ${e instanceof Object ? e.resultMessage : e}`,
              signerCertificate: signerCert,
              signerCertificateVerified: false
            });
          });
          if (verificationResult.certificatePath) {
            certificatePath = verificationResult.certificatePath;
          }
          if (!verificationResult.result)
            throw new SignedDataVerifyError({
              date: checkDate,
              code: 5,
              message: `Validation of signer's certificate failed: ${verificationResult.resultMessage}`,
              signerCertificate: signerCert,
              signerCertificateVerified: false
            });
        }
        const signerInfoHashAlgorithm = crypto2.getAlgorithmByOID(signerInfo.digestAlgorithm.algorithmId);
        if (!("name" in signerInfoHashAlgorithm)) {
          throw new SignedDataVerifyError({
            date: checkDate,
            code: 7,
            message: `Unsupported signature algorithm: ${signerInfo.digestAlgorithm.algorithmId}`,
            signerCertificate: signerCert,
            signerCertificateVerified: true
          });
        }
        shaAlgorithm = signerInfoHashAlgorithm.name;
        const eContent = this.encapContentInfo.eContent;
        if (eContent) {
          if (eContent.idBlock.tagClass === 1 && eContent.idBlock.tagNumber === 4) {
            data = eContent.getValue();
          } else
            data = eContent.valueBlock.valueBeforeDecodeView.slice().buffer;
        } else {
          if (data.byteLength === 0) {
            throw new SignedDataVerifyError({
              date: checkDate,
              code: 8,
              message: "Missed detached data input array",
              signerCertificate: signerCert,
              signerCertificateVerified: true
            });
          }
        }
        if (signerInfo.signedAttrs) {
          let foundContentType = false;
          let foundMessageDigest = false;
          for (const attribute of signerInfo.signedAttrs.attributes) {
            if (attribute.type === "1.2.840.113549.1.9.3")
              foundContentType = true;
            if (attribute.type === "1.2.840.113549.1.9.4") {
              foundMessageDigest = true;
              messageDigestValue = attribute.values[0].valueBlock.valueHex;
            }
            if (foundContentType && foundMessageDigest)
              break;
          }
          if (foundContentType === false) {
            throw new SignedDataVerifyError({
              date: checkDate,
              code: 9,
              message: 'Attribute "content-type" is a mandatory attribute for "signed attributes"',
              signerCertificate: signerCert,
              signerCertificateVerified: true
            });
          }
          if (foundMessageDigest === false) {
            throw new SignedDataVerifyError({
              date: checkDate,
              code: 10,
              message: 'Attribute "message-digest" is a mandatory attribute for "signed attributes"',
              signatureVerified: null,
              signerCertificate: signerCert,
              signerCertificateVerified: true
            });
          }
        }
        if (signerInfo.signedAttrs) {
          const messageDigest = await crypto2.digest(shaAlgorithm, new Uint8Array(data));
          if (!isEqualBuffer(messageDigest, messageDigestValue)) {
            throw new SignedDataVerifyError({
              date: checkDate,
              code: 15,
              message: "Error during verification: Message digest doesn't match",
              signatureVerified: null,
              signerCertificate: signerCert,
              timestampSerial,
              signerCertificateVerified: true
            });
          }
          data = signerInfo.signedAttrs.encodedValue;
        }
        const verifyResult = signerInfo.signatureAlgorithm.algorithmId === "1.2.840.113549.1.1.1" ? await crypto2.verifyWithPublicKey(data, signerInfo.signature, signerCert.subjectPublicKeyInfo, signerInfo.signatureAlgorithm, shaAlgorithm) : await crypto2.verifyWithPublicKey(data, signerInfo.signature, signerCert.subjectPublicKeyInfo, signerInfo.signatureAlgorithm);
        if (extendedMode) {
          return {
            date: checkDate,
            code: 14,
            message: EMPTY_STRING2,
            signatureVerified: verifyResult,
            signerCertificate: signerCert,
            timestampSerial,
            signerCertificateVerified: true,
            certificatePath
          };
        } else {
          return verifyResult;
        }
      } catch (e) {
        if (e instanceof SignedDataVerifyError) {
          throw e;
        }
        throw new SignedDataVerifyError({
          date: checkDate,
          code: 15,
          message: `Error during verification: ${e instanceof Error ? e.message : e}`,
          signatureVerified: null,
          signerCertificate: signerCert,
          timestampSerial,
          signerCertificateVerified: true
        });
      }
    }
    async sign(privateKey, signerIndex, hashAlgorithm = "SHA-1", data = EMPTY_BUFFER2, crypto2 = getCrypto(true)) {
      var _a3;
      if (!privateKey)
        throw new Error("Need to provide a private key for signing");
      const signerInfo = this.signerInfos[signerIndex];
      if (!signerInfo) {
        throw new RangeError("SignerInfo index is out of range");
      }
      if (!((_a3 = signerInfo.signedAttrs) === null || _a3 === void 0 ? void 0 : _a3.attributes.length) && "hash" in privateKey.algorithm && "hash" in privateKey.algorithm && privateKey.algorithm.hash) {
        hashAlgorithm = privateKey.algorithm.hash.name;
      }
      const hashAlgorithmOID = crypto2.getOIDByAlgorithm({ name: hashAlgorithm }, true, "hashAlgorithm");
      if (this.digestAlgorithms.filter((algorithm) => algorithm.algorithmId === hashAlgorithmOID).length === 0) {
        this.digestAlgorithms.push(new AlgorithmIdentifier({
          algorithmId: hashAlgorithmOID,
          algorithmParams: new Null()
        }));
      }
      signerInfo.digestAlgorithm = new AlgorithmIdentifier({
        algorithmId: hashAlgorithmOID,
        algorithmParams: new Null()
      });
      const signatureParams = await crypto2.getSignatureParameters(privateKey, hashAlgorithm);
      const parameters = signatureParams.parameters;
      signerInfo.signatureAlgorithm = signatureParams.signatureAlgorithm;
      if (signerInfo.signedAttrs) {
        if (signerInfo.signedAttrs.encodedValue.byteLength !== 0)
          data = signerInfo.signedAttrs.encodedValue;
        else {
          data = signerInfo.signedAttrs.toSchema().toBER();
          const view = pvtsutils2.BufferSourceConverter.toUint8Array(data);
          view[0] = 49;
        }
      } else {
        const eContent = this.encapContentInfo.eContent;
        if (eContent) {
          if (eContent.idBlock.tagClass === 1 && eContent.idBlock.tagNumber === 4) {
            data = eContent.getValue();
          } else
            data = eContent.valueBlock.valueBeforeDecodeView.slice().buffer;
        } else {
          if (data.byteLength === 0)
            throw new Error("Missed detached data input array");
        }
      }
      const signature = await crypto2.signWithPrivateKey(data, privateKey, parameters);
      signerInfo.signature = new OctetString({ valueHex: signature });
    }
  };
  SignedData.CLASS_NAME = "SignedData";
  SignedData.ID_DATA = id_ContentType_Data;
  var VERSION$1 = "version";
  var AUTH_SAFE = "authSafe";
  var MAC_DATA = "macData";
  var PARSED_VALUE = "parsedValue";
  var CLERA_PROPS = [
    VERSION$1,
    AUTH_SAFE,
    MAC_DATA
  ];
  var PFX = class _PFX extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.version = getParametersValue(parameters, VERSION$1, _PFX.defaultValues(VERSION$1));
      this.authSafe = getParametersValue(parameters, AUTH_SAFE, _PFX.defaultValues(AUTH_SAFE));
      if (MAC_DATA in parameters) {
        this.macData = getParametersValue(parameters, MAC_DATA, _PFX.defaultValues(MAC_DATA));
      }
      if (PARSED_VALUE in parameters) {
        this.parsedValue = getParametersValue(parameters, PARSED_VALUE, _PFX.defaultValues(PARSED_VALUE));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VERSION$1:
          return 3;
        case AUTH_SAFE:
          return new ContentInfo();
        case MAC_DATA:
          return new MacData();
        case PARSED_VALUE:
          return {};
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case VERSION$1:
          return memberValue === _PFX.defaultValues(memberName);
        case AUTH_SAFE:
          return ContentInfo.compareWithDefault("contentType", memberValue.contentType) && ContentInfo.compareWithDefault("content", memberValue.content);
        case MAC_DATA:
          return MacData.compareWithDefault("mac", memberValue.mac) && MacData.compareWithDefault("macSalt", memberValue.macSalt) && MacData.compareWithDefault("iterations", memberValue.iterations);
        case PARSED_VALUE:
          return memberValue instanceof Object && Object.keys(memberValue).length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Integer({ name: names.version || VERSION$1 }),
          ContentInfo.schema(names.authSafe || {
            names: {
              blockName: AUTH_SAFE
            }
          }),
          MacData.schema(names.macData || {
            names: {
              blockName: MAC_DATA,
              optional: true
            }
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLERA_PROPS);
      const asn1 = compareSchema(schema, schema, _PFX.schema({
        names: {
          version: VERSION$1,
          authSafe: {
            names: {
              blockName: AUTH_SAFE
            }
          },
          macData: {
            names: {
              blockName: MAC_DATA
            }
          }
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      this.version = asn1.result.version.valueBlock.valueDec;
      this.authSafe = new ContentInfo({ schema: asn1.result.authSafe });
      if (MAC_DATA in asn1.result)
        this.macData = new MacData({ schema: asn1.result.macData });
    }
    toSchema() {
      const outputArray = [
        new Integer({ value: this.version }),
        this.authSafe.toSchema()
      ];
      if (this.macData) {
        outputArray.push(this.macData.toSchema());
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const output2 = {
        version: this.version,
        authSafe: this.authSafe.toJSON()
      };
      if (this.macData) {
        output2.macData = this.macData.toJSON();
      }
      return output2;
    }
    async makeInternalValues(parameters = {}, crypto2 = getCrypto(true)) {
      ArgumentError.assert(parameters, "parameters", "object");
      if (!this.parsedValue) {
        throw new Error('Please call "parseValues" function first in order to make "parsedValue" data');
      }
      ParameterError.assertEmpty(this.parsedValue.integrityMode, "integrityMode", "parsedValue");
      ParameterError.assertEmpty(this.parsedValue.authenticatedSafe, "authenticatedSafe", "parsedValue");
      switch (this.parsedValue.integrityMode) {
        case 0:
          {
            if (!("iterations" in parameters))
              throw new ParameterError("iterations");
            ParameterError.assertEmpty(parameters.pbkdf2HashAlgorithm, "pbkdf2HashAlgorithm");
            ParameterError.assertEmpty(parameters.hmacHashAlgorithm, "hmacHashAlgorithm");
            ParameterError.assertEmpty(parameters.password, "password");
            const saltBuffer = new ArrayBuffer(64);
            const saltView = new Uint8Array(saltBuffer);
            crypto2.getRandomValues(saltView);
            const data = this.parsedValue.authenticatedSafe.toSchema().toBER(false);
            this.authSafe = new ContentInfo({
              contentType: ContentInfo.DATA,
              content: new OctetString({ valueHex: data })
            });
            const result = await crypto2.stampDataWithPassword({
              password: parameters.password,
              hashAlgorithm: parameters.hmacHashAlgorithm,
              salt: saltBuffer,
              iterationCount: parameters.iterations,
              contentToStamp: data
            });
            this.macData = new MacData({
              mac: new DigestInfo({
                digestAlgorithm: new AlgorithmIdentifier({
                  algorithmId: crypto2.getOIDByAlgorithm({ name: parameters.hmacHashAlgorithm }, true, "hmacHashAlgorithm")
                }),
                digest: new OctetString({ valueHex: result })
              }),
              macSalt: new OctetString({ valueHex: saltBuffer }),
              iterations: parameters.iterations
            });
          }
          break;
        case 1:
          {
            if (!("signingCertificate" in parameters)) {
              throw new ParameterError("signingCertificate");
            }
            ParameterError.assertEmpty(parameters.privateKey, "privateKey");
            ParameterError.assertEmpty(parameters.hashAlgorithm, "hashAlgorithm");
            const toBeSigned = this.parsedValue.authenticatedSafe.toSchema().toBER(false);
            const cmsSigned = new SignedData({
              version: 1,
              encapContentInfo: new EncapsulatedContentInfo({
                eContentType: "1.2.840.113549.1.7.1",
                eContent: new OctetString({ valueHex: toBeSigned })
              }),
              certificates: [parameters.signingCertificate]
            });
            const result = await crypto2.digest({ name: parameters.hashAlgorithm }, new Uint8Array(toBeSigned));
            const signedAttr = [];
            signedAttr.push(new Attribute({
              type: "1.2.840.113549.1.9.3",
              values: [
                new ObjectIdentifier({ value: "1.2.840.113549.1.7.1" })
              ]
            }));
            signedAttr.push(new Attribute({
              type: "1.2.840.113549.1.9.5",
              values: [
                new UTCTime({ valueDate: /* @__PURE__ */ new Date() })
              ]
            }));
            signedAttr.push(new Attribute({
              type: "1.2.840.113549.1.9.4",
              values: [
                new OctetString({ valueHex: result })
              ]
            }));
            cmsSigned.signerInfos.push(new SignerInfo({
              version: 1,
              sid: new IssuerAndSerialNumber({
                issuer: parameters.signingCertificate.issuer,
                serialNumber: parameters.signingCertificate.serialNumber
              }),
              signedAttrs: new SignedAndUnsignedAttributes({
                type: 0,
                attributes: signedAttr
              })
            }));
            await cmsSigned.sign(parameters.privateKey, 0, parameters.hashAlgorithm, void 0, crypto2);
            this.authSafe = new ContentInfo({
              contentType: "1.2.840.113549.1.7.2",
              content: cmsSigned.toSchema(true)
            });
          }
          break;
        default:
          throw new Error(`Parameter "integrityMode" has unknown value: ${this.parsedValue.integrityMode}`);
      }
    }
    async parseInternalValues(parameters, crypto2 = getCrypto(true)) {
      ArgumentError.assert(parameters, "parameters", "object");
      if (parameters.checkIntegrity === void 0) {
        parameters.checkIntegrity = true;
      }
      this.parsedValue = {};
      switch (this.authSafe.contentType) {
        case ContentInfo.DATA:
          {
            ParameterError.assertEmpty(parameters.password, "password");
            this.parsedValue.integrityMode = 0;
            ArgumentError.assert(this.authSafe.content, "authSafe.content", OctetString);
            const authSafeContent = this.authSafe.content.getValue();
            this.parsedValue.authenticatedSafe = AuthenticatedSafe.fromBER(authSafeContent);
            if (parameters.checkIntegrity) {
              if (!this.macData) {
                throw new Error('Absent "macData" value, can not check PKCS#12 data integrity');
              }
              const hashAlgorithm = crypto2.getAlgorithmByOID(this.macData.mac.digestAlgorithm.algorithmId, true, "digestAlgorithm");
              const result = await crypto2.verifyDataStampedWithPassword({
                password: parameters.password,
                hashAlgorithm: hashAlgorithm.name,
                salt: import_pvtsutils.BufferSourceConverter.toArrayBuffer(this.macData.macSalt.valueBlock.valueHexView),
                iterationCount: this.macData.iterations || 1,
                contentToVerify: authSafeContent,
                signatureToVerify: import_pvtsutils.BufferSourceConverter.toArrayBuffer(this.macData.mac.digest.valueBlock.valueHexView)
              });
              if (!result) {
                throw new Error("Integrity for the PKCS#12 data is broken!");
              }
            }
          }
          break;
        case ContentInfo.SIGNED_DATA:
          {
            this.parsedValue.integrityMode = 1;
            const cmsSigned = new SignedData({ schema: this.authSafe.content });
            const eContent = cmsSigned.encapContentInfo.eContent;
            ParameterError.assert(eContent, "eContent", "cmsSigned.encapContentInfo");
            ArgumentError.assert(eContent, "eContent", OctetString);
            const data = eContent.getValue();
            this.parsedValue.authenticatedSafe = AuthenticatedSafe.fromBER(data);
            const ok = await cmsSigned.verify({ signer: 0, checkChain: false }, crypto2);
            if (!ok) {
              throw new Error("Integrity for the PKCS#12 data is broken!");
            }
          }
          break;
        default:
          throw new Error(`Incorrect value for "this.authSafe.contentType": ${this.authSafe.contentType}`);
      }
    }
  };
  PFX.CLASS_NAME = "PFX";
  var STATUS$1 = "status";
  var STATUS_STRINGS = "statusStrings";
  var FAIL_INFO = "failInfo";
  var CLEAR_PROPS$2 = [
    STATUS$1,
    STATUS_STRINGS,
    FAIL_INFO
  ];
  var PKIStatus;
  (function(PKIStatus2) {
    PKIStatus2[PKIStatus2["granted"] = 0] = "granted";
    PKIStatus2[PKIStatus2["grantedWithMods"] = 1] = "grantedWithMods";
    PKIStatus2[PKIStatus2["rejection"] = 2] = "rejection";
    PKIStatus2[PKIStatus2["waiting"] = 3] = "waiting";
    PKIStatus2[PKIStatus2["revocationWarning"] = 4] = "revocationWarning";
    PKIStatus2[PKIStatus2["revocationNotification"] = 5] = "revocationNotification";
  })(PKIStatus || (PKIStatus = {}));
  var PKIStatusInfo = class _PKIStatusInfo extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.status = getParametersValue(parameters, STATUS$1, _PKIStatusInfo.defaultValues(STATUS$1));
      if (STATUS_STRINGS in parameters) {
        this.statusStrings = getParametersValue(parameters, STATUS_STRINGS, _PKIStatusInfo.defaultValues(STATUS_STRINGS));
      }
      if (FAIL_INFO in parameters) {
        this.failInfo = getParametersValue(parameters, FAIL_INFO, _PKIStatusInfo.defaultValues(FAIL_INFO));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case STATUS$1:
          return 2;
        case STATUS_STRINGS:
          return [];
        case FAIL_INFO:
          return new BitString();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case STATUS$1:
          return memberValue === _PKIStatusInfo.defaultValues(memberName);
        case STATUS_STRINGS:
          return memberValue.length === 0;
        case FAIL_INFO:
          return memberValue.isEqual(_PKIStatusInfo.defaultValues(memberName));
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || EMPTY_STRING2,
        value: [
          new Integer({ name: names.status || EMPTY_STRING2 }),
          new Sequence({
            optional: true,
            value: [
              new Repeated({
                name: names.statusStrings || EMPTY_STRING2,
                value: new Utf8String()
              })
            ]
          }),
          new BitString({
            name: names.failInfo || EMPTY_STRING2,
            optional: true
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$2);
      const asn1 = compareSchema(schema, schema, _PKIStatusInfo.schema({
        names: {
          status: STATUS$1,
          statusStrings: STATUS_STRINGS,
          failInfo: FAIL_INFO
        }
      }));
      AsnError.assertSchema(asn1, this.className);
      const _status = asn1.result.status;
      if (_status.valueBlock.isHexOnly === true || _status.valueBlock.valueDec < 0 || _status.valueBlock.valueDec > 5)
        throw new Error('PKIStatusInfo "status" has invalid value');
      this.status = _status.valueBlock.valueDec;
      if (STATUS_STRINGS in asn1.result)
        this.statusStrings = asn1.result.statusStrings;
      if (FAIL_INFO in asn1.result)
        this.failInfo = asn1.result.failInfo;
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(new Integer({ value: this.status }));
      if (this.statusStrings) {
        outputArray.push(new Sequence({
          optional: true,
          value: this.statusStrings
        }));
      }
      if (this.failInfo) {
        outputArray.push(this.failInfo);
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        status: this.status
      };
      if (this.statusStrings) {
        res.statusStrings = Array.from(this.statusStrings, (o) => o.toJSON());
      }
      if (this.failInfo) {
        res.failInfo = this.failInfo.toJSON();
      }
      return res;
    }
  };
  PKIStatusInfo.CLASS_NAME = "PKIStatusInfo";
  var VERSION = "version";
  var MESSAGE_IMPRINT = "messageImprint";
  var REQ_POLICY = "reqPolicy";
  var NONCE = "nonce";
  var CERT_REQ = "certReq";
  var EXTENSIONS = "extensions";
  var TIME_STAMP_REQ = "TimeStampReq";
  var TIME_STAMP_REQ_VERSION = `${TIME_STAMP_REQ}.${VERSION}`;
  var TIME_STAMP_REQ_MESSAGE_IMPRINT = `${TIME_STAMP_REQ}.${MESSAGE_IMPRINT}`;
  var TIME_STAMP_REQ_POLICY = `${TIME_STAMP_REQ}.${REQ_POLICY}`;
  var TIME_STAMP_REQ_NONCE = `${TIME_STAMP_REQ}.${NONCE}`;
  var TIME_STAMP_REQ_CERT_REQ = `${TIME_STAMP_REQ}.${CERT_REQ}`;
  var TIME_STAMP_REQ_EXTENSIONS = `${TIME_STAMP_REQ}.${EXTENSIONS}`;
  var CLEAR_PROPS$1 = [
    TIME_STAMP_REQ_VERSION,
    TIME_STAMP_REQ_MESSAGE_IMPRINT,
    TIME_STAMP_REQ_POLICY,
    TIME_STAMP_REQ_NONCE,
    TIME_STAMP_REQ_CERT_REQ,
    TIME_STAMP_REQ_EXTENSIONS
  ];
  var TimeStampReq = class _TimeStampReq extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.version = getParametersValue(parameters, VERSION, _TimeStampReq.defaultValues(VERSION));
      this.messageImprint = getParametersValue(parameters, MESSAGE_IMPRINT, _TimeStampReq.defaultValues(MESSAGE_IMPRINT));
      if (REQ_POLICY in parameters) {
        this.reqPolicy = getParametersValue(parameters, REQ_POLICY, _TimeStampReq.defaultValues(REQ_POLICY));
      }
      if (NONCE in parameters) {
        this.nonce = getParametersValue(parameters, NONCE, _TimeStampReq.defaultValues(NONCE));
      }
      if (CERT_REQ in parameters) {
        this.certReq = getParametersValue(parameters, CERT_REQ, _TimeStampReq.defaultValues(CERT_REQ));
      }
      if (EXTENSIONS in parameters) {
        this.extensions = getParametersValue(parameters, EXTENSIONS, _TimeStampReq.defaultValues(EXTENSIONS));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case VERSION:
          return 0;
        case MESSAGE_IMPRINT:
          return new MessageImprint();
        case REQ_POLICY:
          return EMPTY_STRING2;
        case NONCE:
          return new Integer();
        case CERT_REQ:
          return false;
        case EXTENSIONS:
          return [];
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case VERSION:
        case REQ_POLICY:
        case CERT_REQ:
          return memberValue === _TimeStampReq.defaultValues(memberName);
        case MESSAGE_IMPRINT:
          return MessageImprint.compareWithDefault("hashAlgorithm", memberValue.hashAlgorithm) && MessageImprint.compareWithDefault("hashedMessage", memberValue.hashedMessage);
        case NONCE:
          return memberValue.isEqual(_TimeStampReq.defaultValues(memberName));
        case EXTENSIONS:
          return memberValue.length === 0;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || TIME_STAMP_REQ,
        value: [
          new Integer({ name: names.version || TIME_STAMP_REQ_VERSION }),
          MessageImprint.schema(names.messageImprint || {
            names: {
              blockName: TIME_STAMP_REQ_MESSAGE_IMPRINT
            }
          }),
          new ObjectIdentifier({
            name: names.reqPolicy || TIME_STAMP_REQ_POLICY,
            optional: true
          }),
          new Integer({
            name: names.nonce || TIME_STAMP_REQ_NONCE,
            optional: true
          }),
          new Boolean({
            name: names.certReq || TIME_STAMP_REQ_CERT_REQ,
            optional: true
          }),
          new Constructed({
            optional: true,
            idBlock: {
              tagClass: 3,
              tagNumber: 0
            },
            value: [new Repeated({
              name: names.extensions || TIME_STAMP_REQ_EXTENSIONS,
              value: Extension.schema()
            })]
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS$1);
      const asn1 = compareSchema(schema, schema, _TimeStampReq.schema());
      AsnError.assertSchema(asn1, this.className);
      this.version = asn1.result[TIME_STAMP_REQ_VERSION].valueBlock.valueDec;
      this.messageImprint = new MessageImprint({ schema: asn1.result[TIME_STAMP_REQ_MESSAGE_IMPRINT] });
      if (TIME_STAMP_REQ_POLICY in asn1.result)
        this.reqPolicy = asn1.result[TIME_STAMP_REQ_POLICY].valueBlock.toString();
      if (TIME_STAMP_REQ_NONCE in asn1.result)
        this.nonce = asn1.result[TIME_STAMP_REQ_NONCE];
      if (TIME_STAMP_REQ_CERT_REQ in asn1.result)
        this.certReq = asn1.result[TIME_STAMP_REQ_CERT_REQ].valueBlock.value;
      if (TIME_STAMP_REQ_EXTENSIONS in asn1.result)
        this.extensions = Array.from(asn1.result[TIME_STAMP_REQ_EXTENSIONS], (element) => new Extension({ schema: element }));
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(new Integer({ value: this.version }));
      outputArray.push(this.messageImprint.toSchema());
      if (this.reqPolicy)
        outputArray.push(new ObjectIdentifier({ value: this.reqPolicy }));
      if (this.nonce)
        outputArray.push(this.nonce);
      if (CERT_REQ in this && _TimeStampReq.compareWithDefault(CERT_REQ, this.certReq) === false)
        outputArray.push(new Boolean({ value: this.certReq }));
      if (this.extensions) {
        outputArray.push(new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: 0
          },
          value: Array.from(this.extensions, (o) => o.toSchema())
        }));
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        version: this.version,
        messageImprint: this.messageImprint.toJSON()
      };
      if (this.reqPolicy !== void 0)
        res.reqPolicy = this.reqPolicy;
      if (this.nonce !== void 0)
        res.nonce = this.nonce.toJSON();
      if (this.certReq !== void 0 && _TimeStampReq.compareWithDefault(CERT_REQ, this.certReq) === false)
        res.certReq = this.certReq;
      if (this.extensions) {
        res.extensions = Array.from(this.extensions, (o) => o.toJSON());
      }
      return res;
    }
  };
  TimeStampReq.CLASS_NAME = "TimeStampReq";
  var STATUS = "status";
  var TIME_STAMP_TOKEN = "timeStampToken";
  var TIME_STAMP_RESP = "TimeStampResp";
  var TIME_STAMP_RESP_STATUS = `${TIME_STAMP_RESP}.${STATUS}`;
  var TIME_STAMP_RESP_TOKEN = `${TIME_STAMP_RESP}.${TIME_STAMP_TOKEN}`;
  var CLEAR_PROPS = [
    TIME_STAMP_RESP_STATUS,
    TIME_STAMP_RESP_TOKEN
  ];
  var TimeStampResp = class _TimeStampResp extends PkiObject {
    constructor(parameters = {}) {
      super();
      this.status = getParametersValue(parameters, STATUS, _TimeStampResp.defaultValues(STATUS));
      if (TIME_STAMP_TOKEN in parameters) {
        this.timeStampToken = getParametersValue(parameters, TIME_STAMP_TOKEN, _TimeStampResp.defaultValues(TIME_STAMP_TOKEN));
      }
      if (parameters.schema) {
        this.fromSchema(parameters.schema);
      }
    }
    static defaultValues(memberName) {
      switch (memberName) {
        case STATUS:
          return new PKIStatusInfo();
        case TIME_STAMP_TOKEN:
          return new ContentInfo();
        default:
          return super.defaultValues(memberName);
      }
    }
    static compareWithDefault(memberName, memberValue) {
      switch (memberName) {
        case STATUS:
          return PKIStatusInfo.compareWithDefault(STATUS, memberValue.status) && "statusStrings" in memberValue === false && "failInfo" in memberValue === false;
        case TIME_STAMP_TOKEN:
          return memberValue.contentType === EMPTY_STRING2 && memberValue.content instanceof Any;
        default:
          return super.defaultValues(memberName);
      }
    }
    static schema(parameters = {}) {
      const names = getParametersValue(parameters, "names", {});
      return new Sequence({
        name: names.blockName || TIME_STAMP_RESP,
        value: [
          PKIStatusInfo.schema(names.status || {
            names: {
              blockName: TIME_STAMP_RESP_STATUS
            }
          }),
          ContentInfo.schema(names.timeStampToken || {
            names: {
              blockName: TIME_STAMP_RESP_TOKEN,
              optional: true
            }
          })
        ]
      });
    }
    fromSchema(schema) {
      clearProps(schema, CLEAR_PROPS);
      const asn1 = compareSchema(schema, schema, _TimeStampResp.schema());
      AsnError.assertSchema(asn1, this.className);
      this.status = new PKIStatusInfo({ schema: asn1.result[TIME_STAMP_RESP_STATUS] });
      if (TIME_STAMP_RESP_TOKEN in asn1.result)
        this.timeStampToken = new ContentInfo({ schema: asn1.result[TIME_STAMP_RESP_TOKEN] });
    }
    toSchema() {
      const outputArray = [];
      outputArray.push(this.status.toSchema());
      if (this.timeStampToken) {
        outputArray.push(this.timeStampToken.toSchema());
      }
      return new Sequence({
        value: outputArray
      });
    }
    toJSON() {
      const res = {
        status: this.status.toJSON()
      };
      if (this.timeStampToken) {
        res.timeStampToken = this.timeStampToken.toJSON();
      }
      return res;
    }
    async sign(privateKey, hashAlgorithm, crypto2 = getCrypto(true)) {
      this.assertContentType();
      const signed = new SignedData({ schema: this.timeStampToken.content });
      return signed.sign(privateKey, 0, hashAlgorithm, void 0, crypto2);
    }
    async verify(verificationParameters = { signer: 0, trustedCerts: [], data: EMPTY_BUFFER2 }, crypto2 = getCrypto(true)) {
      this.assertContentType();
      const signed = new SignedData({ schema: this.timeStampToken.content });
      return signed.verify(verificationParameters, crypto2);
    }
    assertContentType() {
      if (!this.timeStampToken) {
        throw new Error("timeStampToken is absent in TSP response");
      }
      if (this.timeStampToken.contentType !== id_ContentType_SignedData) {
        throw new Error(`Wrong format of timeStampToken: ${this.timeStampToken.contentType}`);
      }
    }
  };
  TimeStampResp.CLASS_NAME = "TimeStampResp";
  function initCryptoEngine() {
    if (typeof globalThis !== "undefined" && "crypto" in globalThis) {
      let engineName = "webcrypto";
      if ("webkitSubtle" in globalThis.crypto) {
        engineName = "safari";
      }
      setEngine(engineName, new CryptoEngine({ name: engineName, crypto: globalThis.crypto }));
    } else if (typeof crypto !== "undefined" && "webcrypto" in crypto) {
      const name = "NodeJS ^15";
      const nodeCrypto = crypto.webcrypto;
      setEngine(name, new CryptoEngine({ name, crypto: nodeCrypto }));
    }
  }
  initCryptoEngine();
  return __toCommonJS(stdin_exports);
})();
/*! Bundled license information:

pvtsutils/build/index.js:
  (*!
   * MIT License
   * 
   * Copyright (c) 2017-2024 Peculiar Ventures, LLC
   * 
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   * 
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   * 
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   * 
   *)

pvutils/build/utils.es.js:
  (*!
   Copyright (c) Peculiar Ventures, LLC
  *)

asn1js/build/index.es.js:
  (*!
   * Copyright (c) 2014, GMO GlobalSign
   * Copyright (c) 2015-2022, Peculiar Ventures
   * All rights reserved.
   * 
   * Author 2014-2019, Yury Strozhevsky
   * 
   * Redistribution and use in source and binary forms, with or without modification,
   * are permitted provided that the following conditions are met:
   * 
   * * Redistributions of source code must retain the above copyright notice, this
   *   list of conditions and the following disclaimer.
   * 
   * * Redistributions in binary form must reproduce the above copyright notice, this
   *   list of conditions and the following disclaimer in the documentation and/or
   *   other materials provided with the distribution.
   * 
   * * Neither the name of the copyright holder nor the names of its
   *   contributors may be used to endorse or promote products derived from
   *   this software without specific prior written permission.
   * 
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
   * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
   * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
   * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
   * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
   * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   * 
   *)

@noble/hashes/esm/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

pkijs/build/index.es.js:
  (*!
   * Copyright (c) 2014, GlobalSign
   * Copyright (c) 2015-2019, Peculiar Ventures
   * All rights reserved.
   * 
   * Author 2014-2019, Yury Strozhevsky
   * 
   * Redistribution and use in source and binary forms, with or without modification,
   * are permitted provided that the following conditions are met:
   * 
   * * Redistributions of source code must retain the above copyright notice, this
   *   list of conditions and the following disclaimer.
   * 
   * * Redistributions in binary form must reproduce the above copyright notice, this
   *   list of conditions and the following disclaimer in the documentation and/or
   *   other materials provided with the distribution.
   * 
   * * Neither the name of the {organization} nor the names of its
   *   contributors may be used to endorse or promote products derived from
   *   this software without specific prior written permission.
   * 
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
   * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
   * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
   * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
   * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
   * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   * 
   *)
*/
