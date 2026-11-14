var LocalCFB = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
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

  // (disabled):fs
  var require_fs = __commonJS({
    "(disabled):fs"() {
    }
  });

  // node_modules/cfb/cfb.js
  var require_cfb = __commonJS({
    "node_modules/cfb/cfb.js"(exports, module) {
      var Base64_map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      function Base64_encode(input) {
        var o = "";
        var c1 = 0, c2 = 0, c3 = 0, e1 = 0, e2 = 0, e3 = 0, e4 = 0;
        for (var i = 0; i < input.length; ) {
          c1 = input.charCodeAt(i++);
          e1 = c1 >> 2;
          c2 = input.charCodeAt(i++);
          e2 = (c1 & 3) << 4 | c2 >> 4;
          c3 = input.charCodeAt(i++);
          e3 = (c2 & 15) << 2 | c3 >> 6;
          e4 = c3 & 63;
          if (isNaN(c2)) e3 = e4 = 64;
          else if (isNaN(c3)) e4 = 64;
          o += Base64_map.charAt(e1) + Base64_map.charAt(e2) + Base64_map.charAt(e3) + Base64_map.charAt(e4);
        }
        return o;
      }
      function Base64_decode(input) {
        var o = "";
        var c1 = 0, c2 = 0, c3 = 0, e1 = 0, e2 = 0, e3 = 0, e4 = 0;
        input = input.replace(/[^\w\+\/\=]/g, "");
        for (var i = 0; i < input.length; ) {
          e1 = Base64_map.indexOf(input.charAt(i++));
          e2 = Base64_map.indexOf(input.charAt(i++));
          c1 = e1 << 2 | e2 >> 4;
          o += String.fromCharCode(c1);
          e3 = Base64_map.indexOf(input.charAt(i++));
          c2 = (e2 & 15) << 4 | e3 >> 2;
          if (e3 !== 64) o += String.fromCharCode(c2);
          e4 = Base64_map.indexOf(input.charAt(i++));
          c3 = (e3 & 3) << 6 | e4;
          if (e4 !== 64) o += String.fromCharCode(c3);
        }
        return o;
      }
      var has_buf = (function() {
        return typeof Buffer !== "undefined" && typeof process !== "undefined" && typeof process.versions !== "undefined" && !!process.versions.node;
      })();
      var Buffer_from = (function() {
        if (typeof Buffer !== "undefined") {
          var nbfs = !Buffer.from;
          if (!nbfs) try {
            Buffer.from("foo", "utf8");
          } catch (e) {
            nbfs = true;
          }
          return nbfs ? function(buf, enc) {
            return enc ? new Buffer(buf, enc) : new Buffer(buf);
          } : Buffer.from.bind(Buffer);
        }
        return function() {
        };
      })();
      function new_raw_buf(len) {
        if (has_buf) {
          if (Buffer.alloc) return Buffer.alloc(len);
          var b = new Buffer(len);
          b.fill(0);
          return b;
        }
        return typeof Uint8Array != "undefined" ? new Uint8Array(len) : new Array(len);
      }
      function new_unsafe_buf(len) {
        if (has_buf) return Buffer.allocUnsafe ? Buffer.allocUnsafe(len) : new Buffer(len);
        return typeof Uint8Array != "undefined" ? new Uint8Array(len) : new Array(len);
      }
      var s2a = function s2a2(s) {
        if (has_buf) return Buffer_from(s, "binary");
        return s.split("").map(function(x) {
          return x.charCodeAt(0) & 255;
        });
      };
      var chr0 = /\u0000/g;
      var chr1 = /[\u0001-\u0006]/g;
      var __toBuffer = function(bufs) {
        var x = [];
        for (var i = 0; i < bufs[0].length; ++i) {
          x.push.apply(x, bufs[0][i]);
        }
        return x;
      };
      var ___toBuffer = __toBuffer;
      var __utf16le = function(b, s, e) {
        var ss = [];
        for (var i = s; i < e; i += 2) ss.push(String.fromCharCode(__readUInt16LE(b, i)));
        return ss.join("").replace(chr0, "");
      };
      var ___utf16le = __utf16le;
      var __hexlify = function(b, s, l) {
        var ss = [];
        for (var i = s; i < s + l; ++i) ss.push(("0" + b[i].toString(16)).slice(-2));
        return ss.join("");
      };
      var ___hexlify = __hexlify;
      var __bconcat = function(bufs) {
        if (Array.isArray(bufs[0])) return [].concat.apply([], bufs);
        var maxlen = 0, i = 0;
        for (i = 0; i < bufs.length; ++i) maxlen += bufs[i].length;
        var o = new Uint8Array(maxlen);
        for (i = 0, maxlen = 0; i < bufs.length; maxlen += bufs[i].length, ++i) o.set(bufs[i], maxlen);
        return o;
      };
      var bconcat = __bconcat;
      if (has_buf) {
        __utf16le = function(b, s, e) {
          if (!Buffer.isBuffer(b)) return ___utf16le(b, s, e);
          return b.toString("utf16le", s, e).replace(chr0, "");
        };
        __hexlify = function(b, s, l) {
          return Buffer.isBuffer(b) ? b.toString("hex", s, s + l) : ___hexlify(b, s, l);
        };
        __toBuffer = function(bufs) {
          return bufs[0].length > 0 && Buffer.isBuffer(bufs[0][0]) ? Buffer.concat(bufs[0]) : ___toBuffer(bufs);
        };
        s2a = function(s) {
          return Buffer_from(s, "binary");
        };
        bconcat = function(bufs) {
          return Buffer.isBuffer(bufs[0]) ? Buffer.concat(bufs) : __bconcat(bufs);
        };
      }
      var __readUInt8 = function(b, idx) {
        return b[idx];
      };
      var __readUInt16LE = function(b, idx) {
        return b[idx + 1] * (1 << 8) + b[idx];
      };
      var __readInt16LE = function(b, idx) {
        var u = b[idx + 1] * (1 << 8) + b[idx];
        return u < 32768 ? u : (65535 - u + 1) * -1;
      };
      var __readUInt32LE = function(b, idx) {
        return b[idx + 3] * (1 << 24) + (b[idx + 2] << 16) + (b[idx + 1] << 8) + b[idx];
      };
      var __readInt32LE = function(b, idx) {
        return (b[idx + 3] << 24) + (b[idx + 2] << 16) + (b[idx + 1] << 8) + b[idx];
      };
      function ReadShift(size, t) {
        var oI, oS, type = 0;
        switch (size) {
          case 1:
            oI = __readUInt8(this, this.l);
            break;
          case 2:
            oI = (t !== "i" ? __readUInt16LE : __readInt16LE)(this, this.l);
            break;
          case 4:
            oI = __readInt32LE(this, this.l);
            break;
          case 16:
            type = 2;
            oS = __hexlify(this, this.l, size);
        }
        this.l += size;
        if (type === 0) return oI;
        return oS;
      }
      var __writeUInt32LE = function(b, val, idx) {
        b[idx] = val & 255;
        b[idx + 1] = val >>> 8 & 255;
        b[idx + 2] = val >>> 16 & 255;
        b[idx + 3] = val >>> 24 & 255;
      };
      var __writeInt32LE = function(b, val, idx) {
        b[idx] = val & 255;
        b[idx + 1] = val >> 8 & 255;
        b[idx + 2] = val >> 16 & 255;
        b[idx + 3] = val >> 24 & 255;
      };
      function WriteShift(t, val, f) {
        var size = 0, i = 0;
        switch (f) {
          case "hex":
            for (; i < t; ++i) {
              this[this.l++] = parseInt(val.slice(2 * i, 2 * i + 2), 16) || 0;
            }
            return this;
          case "utf16le":
            var end = this.l + t;
            for (i = 0; i < Math.min(val.length, t); ++i) {
              var cc = val.charCodeAt(i);
              this[this.l++] = cc & 255;
              this[this.l++] = cc >> 8;
            }
            while (this.l < end) this[this.l++] = 0;
            return this;
        }
        switch (t) {
          case 1:
            size = 1;
            this[this.l] = val & 255;
            break;
          case 2:
            size = 2;
            this[this.l] = val & 255;
            val >>>= 8;
            this[this.l + 1] = val & 255;
            break;
          case 4:
            size = 4;
            __writeUInt32LE(this, val, this.l);
            break;
          case -4:
            size = 4;
            __writeInt32LE(this, val, this.l);
            break;
        }
        this.l += size;
        return this;
      }
      function CheckField(hexstr, fld) {
        var m = __hexlify(this, this.l, hexstr.length >> 1);
        if (m !== hexstr) throw new Error(fld + "Expected " + hexstr + " saw " + m);
        this.l += hexstr.length >> 1;
      }
      function prep_blob(blob, pos) {
        blob.l = pos;
        blob.read_shift = ReadShift;
        blob.chk = CheckField;
        blob.write_shift = WriteShift;
      }
      function new_buf(sz) {
        var o = new_raw_buf(sz);
        prep_blob(o, 0);
        return o;
      }
      var CRC32 = (function() {
        var CRC322 = {};
        CRC322.version = "1.2.1";
        function signed_crc_table() {
          var c = 0, table = new Array(256);
          for (var n = 0; n != 256; ++n) {
            c = n;
            c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
            c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
            c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
            c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
            c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
            c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
            c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
            c = c & 1 ? -306674912 ^ c >>> 1 : c >>> 1;
            table[n] = c;
          }
          return typeof Int32Array !== "undefined" ? new Int32Array(table) : table;
        }
        var T0 = signed_crc_table();
        function slice_by_16_tables(T) {
          var c = 0, v = 0, n = 0, table = typeof Int32Array !== "undefined" ? new Int32Array(4096) : new Array(4096);
          for (n = 0; n != 256; ++n) table[n] = T[n];
          for (n = 0; n != 256; ++n) {
            v = T[n];
            for (c = 256 + n; c < 4096; c += 256) v = table[c] = v >>> 8 ^ T[v & 255];
          }
          var out = [];
          for (n = 1; n != 16; ++n) out[n - 1] = typeof Int32Array !== "undefined" ? table.subarray(n * 256, n * 256 + 256) : table.slice(n * 256, n * 256 + 256);
          return out;
        }
        var TT = slice_by_16_tables(T0);
        var T1 = TT[0], T2 = TT[1], T3 = TT[2], T4 = TT[3], T5 = TT[4];
        var T6 = TT[5], T7 = TT[6], T8 = TT[7], T9 = TT[8], Ta = TT[9];
        var Tb = TT[10], Tc = TT[11], Td = TT[12], Te = TT[13], Tf = TT[14];
        function crc32_bstr(bstr, seed) {
          var C = seed ^ -1;
          for (var i = 0, L = bstr.length; i < L; ) C = C >>> 8 ^ T0[(C ^ bstr.charCodeAt(i++)) & 255];
          return ~C;
        }
        function crc32_buf(B, seed) {
          var C = seed ^ -1, L = B.length - 15, i = 0;
          for (; i < L; ) C = Tf[B[i++] ^ C & 255] ^ Te[B[i++] ^ C >> 8 & 255] ^ Td[B[i++] ^ C >> 16 & 255] ^ Tc[B[i++] ^ C >>> 24] ^ Tb[B[i++]] ^ Ta[B[i++]] ^ T9[B[i++]] ^ T8[B[i++]] ^ T7[B[i++]] ^ T6[B[i++]] ^ T5[B[i++]] ^ T4[B[i++]] ^ T3[B[i++]] ^ T2[B[i++]] ^ T1[B[i++]] ^ T0[B[i++]];
          L += 15;
          while (i < L) C = C >>> 8 ^ T0[(C ^ B[i++]) & 255];
          return ~C;
        }
        function crc32_str(str, seed) {
          var C = seed ^ -1;
          for (var i = 0, L = str.length, c = 0, d = 0; i < L; ) {
            c = str.charCodeAt(i++);
            if (c < 128) {
              C = C >>> 8 ^ T0[(C ^ c) & 255];
            } else if (c < 2048) {
              C = C >>> 8 ^ T0[(C ^ (192 | c >> 6 & 31)) & 255];
              C = C >>> 8 ^ T0[(C ^ (128 | c & 63)) & 255];
            } else if (c >= 55296 && c < 57344) {
              c = (c & 1023) + 64;
              d = str.charCodeAt(i++) & 1023;
              C = C >>> 8 ^ T0[(C ^ (240 | c >> 8 & 7)) & 255];
              C = C >>> 8 ^ T0[(C ^ (128 | c >> 2 & 63)) & 255];
              C = C >>> 8 ^ T0[(C ^ (128 | d >> 6 & 15 | (c & 3) << 4)) & 255];
              C = C >>> 8 ^ T0[(C ^ (128 | d & 63)) & 255];
            } else {
              C = C >>> 8 ^ T0[(C ^ (224 | c >> 12 & 15)) & 255];
              C = C >>> 8 ^ T0[(C ^ (128 | c >> 6 & 63)) & 255];
              C = C >>> 8 ^ T0[(C ^ (128 | c & 63)) & 255];
            }
          }
          return ~C;
        }
        CRC322.table = T0;
        CRC322.bstr = crc32_bstr;
        CRC322.buf = crc32_buf;
        CRC322.str = crc32_str;
        return CRC322;
      })();
      var CFB2 = (function _CFB() {
        var exports2 = {};
        exports2.version = "1.2.2";
        function namecmp(l, r) {
          var L = l.split("/"), R = r.split("/");
          for (var i2 = 0, c = 0, Z = Math.min(L.length, R.length); i2 < Z; ++i2) {
            if (c = L[i2].length - R[i2].length) return c;
            if (L[i2] != R[i2]) return L[i2] < R[i2] ? -1 : 1;
          }
          return L.length - R.length;
        }
        function dirname(p) {
          if (p.charAt(p.length - 1) == "/") return p.slice(0, -1).indexOf("/") === -1 ? p : dirname(p.slice(0, -1));
          var c = p.lastIndexOf("/");
          return c === -1 ? p : p.slice(0, c + 1);
        }
        function filename(p) {
          if (p.charAt(p.length - 1) == "/") return filename(p.slice(0, -1));
          var c = p.lastIndexOf("/");
          return c === -1 ? p : p.slice(c + 1);
        }
        function write_dos_date(buf, date) {
          if (typeof date === "string") date = new Date(date);
          var hms = date.getHours();
          hms = hms << 6 | date.getMinutes();
          hms = hms << 5 | date.getSeconds() >>> 1;
          buf.write_shift(2, hms);
          var ymd = date.getFullYear() - 1980;
          ymd = ymd << 4 | date.getMonth() + 1;
          ymd = ymd << 5 | date.getDate();
          buf.write_shift(2, ymd);
        }
        function parse_dos_date(buf) {
          var hms = buf.read_shift(2) & 65535;
          var ymd = buf.read_shift(2) & 65535;
          var val = /* @__PURE__ */ new Date();
          var d = ymd & 31;
          ymd >>>= 5;
          var m = ymd & 15;
          ymd >>>= 4;
          val.setMilliseconds(0);
          val.setFullYear(ymd + 1980);
          val.setMonth(m - 1);
          val.setDate(d);
          var S = hms & 31;
          hms >>>= 5;
          var M = hms & 63;
          hms >>>= 6;
          val.setHours(hms);
          val.setMinutes(M);
          val.setSeconds(S << 1);
          return val;
        }
        function parse_extra_field(blob) {
          prep_blob(blob, 0);
          var o = {};
          var flags = 0;
          while (blob.l <= blob.length - 4) {
            var type = blob.read_shift(2);
            var sz = blob.read_shift(2), tgt = blob.l + sz;
            var p = {};
            switch (type) {
              /* UNIX-style Timestamps */
              case 21589:
                {
                  flags = blob.read_shift(1);
                  if (flags & 1) p.mtime = blob.read_shift(4);
                  if (sz > 5) {
                    if (flags & 2) p.atime = blob.read_shift(4);
                    if (flags & 4) p.ctime = blob.read_shift(4);
                  }
                  if (p.mtime) p.mt = new Date(p.mtime * 1e3);
                }
                break;
            }
            blob.l = tgt;
            o[type] = p;
          }
          return o;
        }
        var fs;
        function get_fs() {
          return fs || (fs = require_fs());
        }
        function parse(file, options) {
          if (file[0] == 80 && file[1] == 75) return parse_zip(file, options);
          if ((file[0] | 32) == 109 && (file[1] | 32) == 105) return parse_mad(file, options);
          if (file.length < 512) throw new Error("CFB file size " + file.length + " < 512");
          var mver = 3;
          var ssz = 512;
          var nmfs = 0;
          var difat_sec_cnt = 0;
          var dir_start = 0;
          var minifat_start = 0;
          var difat_start = 0;
          var fat_addrs = [];
          var blob = file.slice(0, 512);
          prep_blob(blob, 0);
          var mv = check_get_mver(blob);
          mver = mv[0];
          switch (mver) {
            case 3:
              ssz = 512;
              break;
            case 4:
              ssz = 4096;
              break;
            case 0:
              if (mv[1] == 0) return parse_zip(file, options);
            /* falls through */
            default:
              throw new Error("Major Version: Expected 3 or 4 saw " + mver);
          }
          if (ssz !== 512) {
            blob = file.slice(0, ssz);
            prep_blob(
              blob,
              28
              /* blob.l */
            );
          }
          var header = file.slice(0, ssz);
          check_shifts(blob, mver);
          var dir_cnt = blob.read_shift(4, "i");
          if (mver === 3 && dir_cnt !== 0) throw new Error("# Directory Sectors: Expected 0 saw " + dir_cnt);
          blob.l += 4;
          dir_start = blob.read_shift(4, "i");
          blob.l += 4;
          blob.chk("00100000", "Mini Stream Cutoff Size: ");
          minifat_start = blob.read_shift(4, "i");
          nmfs = blob.read_shift(4, "i");
          difat_start = blob.read_shift(4, "i");
          difat_sec_cnt = blob.read_shift(4, "i");
          for (var q2 = -1, j = 0; j < 109; ++j) {
            q2 = blob.read_shift(4, "i");
            if (q2 < 0) break;
            fat_addrs[j] = q2;
          }
          var sectors = sectorify(file, ssz);
          sleuth_fat(difat_start, difat_sec_cnt, sectors, ssz, fat_addrs);
          var sector_list = make_sector_list(sectors, dir_start, fat_addrs, ssz);
          sector_list[dir_start].name = "!Directory";
          if (nmfs > 0 && minifat_start !== ENDOFCHAIN) sector_list[minifat_start].name = "!MiniFAT";
          sector_list[fat_addrs[0]].name = "!FAT";
          sector_list.fat_addrs = fat_addrs;
          sector_list.ssz = ssz;
          var files = {}, Paths = [], FileIndex = [], FullPaths = [];
          read_directory(dir_start, sector_list, sectors, Paths, nmfs, files, FileIndex, minifat_start);
          build_full_paths(FileIndex, FullPaths, Paths);
          Paths.shift();
          var o = {
            FileIndex,
            FullPaths
          };
          if (options && options.raw) o.raw = { header, sectors };
          return o;
        }
        function check_get_mver(blob) {
          if (blob[blob.l] == 80 && blob[blob.l + 1] == 75) return [0, 0];
          blob.chk(HEADER_SIGNATURE, "Header Signature: ");
          blob.l += 16;
          var mver = blob.read_shift(2, "u");
          return [blob.read_shift(2, "u"), mver];
        }
        function check_shifts(blob, mver) {
          var shift = 9;
          blob.l += 2;
          switch (shift = blob.read_shift(2)) {
            case 9:
              if (mver != 3) throw new Error("Sector Shift: Expected 9 saw " + shift);
              break;
            case 12:
              if (mver != 4) throw new Error("Sector Shift: Expected 12 saw " + shift);
              break;
            default:
              throw new Error("Sector Shift: Expected 9 or 12 saw " + shift);
          }
          blob.chk("0600", "Mini Sector Shift: ");
          blob.chk("000000000000", "Reserved: ");
        }
        function sectorify(file, ssz) {
          var nsectors = Math.ceil(file.length / ssz) - 1;
          var sectors = [];
          for (var i2 = 1; i2 < nsectors; ++i2) sectors[i2 - 1] = file.slice(i2 * ssz, (i2 + 1) * ssz);
          sectors[nsectors - 1] = file.slice(nsectors * ssz);
          return sectors;
        }
        function build_full_paths(FI, FP, Paths) {
          var i2 = 0, L = 0, R = 0, C = 0, j = 0, pl = Paths.length;
          var dad = [], q2 = [];
          for (; i2 < pl; ++i2) {
            dad[i2] = q2[i2] = i2;
            FP[i2] = Paths[i2];
          }
          for (; j < q2.length; ++j) {
            i2 = q2[j];
            L = FI[i2].L;
            R = FI[i2].R;
            C = FI[i2].C;
            if (dad[i2] === i2) {
              if (L !== -1 && dad[L] !== L) dad[i2] = dad[L];
              if (R !== -1 && dad[R] !== R) dad[i2] = dad[R];
            }
            if (C !== -1) dad[C] = i2;
            if (L !== -1 && i2 != dad[i2]) {
              dad[L] = dad[i2];
              if (q2.lastIndexOf(L) < j) q2.push(L);
            }
            if (R !== -1 && i2 != dad[i2]) {
              dad[R] = dad[i2];
              if (q2.lastIndexOf(R) < j) q2.push(R);
            }
          }
          for (i2 = 1; i2 < pl; ++i2) if (dad[i2] === i2) {
            if (R !== -1 && dad[R] !== R) dad[i2] = dad[R];
            else if (L !== -1 && dad[L] !== L) dad[i2] = dad[L];
          }
          for (i2 = 1; i2 < pl; ++i2) {
            if (FI[i2].type === 0) continue;
            j = i2;
            if (j != dad[j]) do {
              j = dad[j];
              FP[i2] = FP[j] + "/" + FP[i2];
            } while (j !== 0 && -1 !== dad[j] && j != dad[j]);
            dad[i2] = -1;
          }
          FP[0] += "/";
          for (i2 = 1; i2 < pl; ++i2) {
            if (FI[i2].type !== 2) FP[i2] += "/";
          }
        }
        function get_mfat_entry(entry, payload, mini) {
          var start = entry.start, size = entry.size;
          var o = [];
          var idx = start;
          while (mini && size > 0 && idx >= 0) {
            o.push(payload.slice(idx * MSSZ, idx * MSSZ + MSSZ));
            size -= MSSZ;
            idx = __readInt32LE(mini, idx * 4);
          }
          if (o.length === 0) return new_buf(0);
          return bconcat(o).slice(0, entry.size);
        }
        function sleuth_fat(idx, cnt, sectors, ssz, fat_addrs) {
          var q2 = ENDOFCHAIN;
          if (idx === ENDOFCHAIN) {
            if (cnt !== 0) throw new Error("DIFAT chain shorter than expected");
          } else if (idx !== -1) {
            var sector = sectors[idx], m = (ssz >>> 2) - 1;
            if (!sector) return;
            for (var i2 = 0; i2 < m; ++i2) {
              if ((q2 = __readInt32LE(sector, i2 * 4)) === ENDOFCHAIN) break;
              fat_addrs.push(q2);
            }
            if (cnt >= 1) sleuth_fat(__readInt32LE(sector, ssz - 4), cnt - 1, sectors, ssz, fat_addrs);
          }
        }
        function get_sector_list(sectors, start, fat_addrs, ssz, chkd) {
          var buf = [], buf_chain = [];
          if (!chkd) chkd = [];
          var modulus = ssz - 1, j = 0, jj = 0;
          for (j = start; j >= 0; ) {
            chkd[j] = true;
            buf[buf.length] = j;
            buf_chain.push(sectors[j]);
            var addr = fat_addrs[Math.floor(j * 4 / ssz)];
            jj = j * 4 & modulus;
            if (ssz < 4 + jj) throw new Error("FAT boundary crossed: " + j + " 4 " + ssz);
            if (!sectors[addr]) break;
            j = __readInt32LE(sectors[addr], jj);
          }
          return { nodes: buf, data: __toBuffer([buf_chain]) };
        }
        function make_sector_list(sectors, dir_start, fat_addrs, ssz) {
          var sl = sectors.length, sector_list = [];
          var chkd = [], buf = [], buf_chain = [];
          var modulus = ssz - 1, i2 = 0, j = 0, k = 0, jj = 0;
          for (i2 = 0; i2 < sl; ++i2) {
            buf = [];
            k = i2 + dir_start;
            if (k >= sl) k -= sl;
            if (chkd[k]) continue;
            buf_chain = [];
            var seen = [];
            for (j = k; j >= 0; ) {
              seen[j] = true;
              chkd[j] = true;
              buf[buf.length] = j;
              buf_chain.push(sectors[j]);
              var addr = fat_addrs[Math.floor(j * 4 / ssz)];
              jj = j * 4 & modulus;
              if (ssz < 4 + jj) throw new Error("FAT boundary crossed: " + j + " 4 " + ssz);
              if (!sectors[addr]) break;
              j = __readInt32LE(sectors[addr], jj);
              if (seen[j]) break;
            }
            sector_list[k] = { nodes: buf, data: __toBuffer([buf_chain]) };
          }
          return sector_list;
        }
        function read_directory(dir_start, sector_list, sectors, Paths, nmfs, files, FileIndex, mini) {
          var minifat_store = 0, pl = Paths.length ? 2 : 0;
          var sector = sector_list[dir_start].data;
          var i2 = 0, namelen = 0, name;
          for (; i2 < sector.length; i2 += 128) {
            var blob = sector.slice(i2, i2 + 128);
            prep_blob(blob, 64);
            namelen = blob.read_shift(2);
            name = __utf16le(blob, 0, namelen - pl);
            Paths.push(name);
            var o = {
              name,
              type: blob.read_shift(1),
              color: blob.read_shift(1),
              L: blob.read_shift(4, "i"),
              R: blob.read_shift(4, "i"),
              C: blob.read_shift(4, "i"),
              clsid: blob.read_shift(16),
              state: blob.read_shift(4, "i"),
              start: 0,
              size: 0
            };
            var ctime = blob.read_shift(2) + blob.read_shift(2) + blob.read_shift(2) + blob.read_shift(2);
            if (ctime !== 0) o.ct = read_date(blob, blob.l - 8);
            var mtime = blob.read_shift(2) + blob.read_shift(2) + blob.read_shift(2) + blob.read_shift(2);
            if (mtime !== 0) o.mt = read_date(blob, blob.l - 8);
            o.start = blob.read_shift(4, "i");
            o.size = blob.read_shift(4, "i");
            if (o.size < 0 && o.start < 0) {
              o.size = o.type = 0;
              o.start = ENDOFCHAIN;
              o.name = "";
            }
            if (o.type === 5) {
              minifat_store = o.start;
              if (nmfs > 0 && minifat_store !== ENDOFCHAIN) sector_list[minifat_store].name = "!StreamData";
            } else if (o.size >= 4096) {
              o.storage = "fat";
              if (sector_list[o.start] === void 0) sector_list[o.start] = get_sector_list(sectors, o.start, sector_list.fat_addrs, sector_list.ssz);
              sector_list[o.start].name = o.name;
              o.content = sector_list[o.start].data.slice(0, o.size);
            } else {
              o.storage = "minifat";
              if (o.size < 0) o.size = 0;
              else if (minifat_store !== ENDOFCHAIN && o.start !== ENDOFCHAIN && sector_list[minifat_store]) {
                o.content = get_mfat_entry(o, sector_list[minifat_store].data, (sector_list[mini] || {}).data);
              }
            }
            if (o.content) prep_blob(o.content, 0);
            files[name] = o;
            FileIndex.push(o);
          }
        }
        function read_date(blob, offset) {
          return new Date((__readUInt32LE(blob, offset + 4) / 1e7 * Math.pow(2, 32) + __readUInt32LE(blob, offset) / 1e7 - 11644473600) * 1e3);
        }
        function read_file(filename2, options) {
          get_fs();
          return parse(fs.readFileSync(filename2), options);
        }
        function read(blob, options) {
          var type = options && options.type;
          if (!type) {
            if (has_buf && Buffer.isBuffer(blob)) type = "buffer";
          }
          switch (type || "base64") {
            case "file":
              return read_file(blob, options);
            case "base64":
              return parse(s2a(Base64_decode(blob)), options);
            case "binary":
              return parse(s2a(blob), options);
          }
          return parse(blob, options);
        }
        function init_cfb(cfb, opts) {
          var o = opts || {}, root = o.root || "Root Entry";
          if (!cfb.FullPaths) cfb.FullPaths = [];
          if (!cfb.FileIndex) cfb.FileIndex = [];
          if (cfb.FullPaths.length !== cfb.FileIndex.length) throw new Error("inconsistent CFB structure");
          if (cfb.FullPaths.length === 0) {
            cfb.FullPaths[0] = root + "/";
            cfb.FileIndex[0] = { name: root, type: 5 };
          }
          if (o.CLSID) cfb.FileIndex[0].clsid = o.CLSID;
          seed_cfb(cfb);
        }
        function seed_cfb(cfb) {
          var nm = "Sh33tJ5";
          if (CFB2.find(cfb, "/" + nm)) return;
          var p = new_buf(4);
          p[0] = 55;
          p[1] = p[3] = 50;
          p[2] = 54;
          cfb.FileIndex.push({ name: nm, type: 2, content: p, size: 4, L: 69, R: 69, C: 69 });
          cfb.FullPaths.push(cfb.FullPaths[0] + nm);
          rebuild_cfb(cfb);
        }
        function rebuild_cfb(cfb, f) {
          init_cfb(cfb);
          var gc = false, s = false;
          for (var i2 = cfb.FullPaths.length - 1; i2 >= 0; --i2) {
            var _file = cfb.FileIndex[i2];
            switch (_file.type) {
              case 0:
                if (s) gc = true;
                else {
                  cfb.FileIndex.pop();
                  cfb.FullPaths.pop();
                }
                break;
              case 1:
              case 2:
              case 5:
                s = true;
                if (isNaN(_file.R * _file.L * _file.C)) gc = true;
                if (_file.R > -1 && _file.L > -1 && _file.R == _file.L) gc = true;
                break;
              default:
                gc = true;
                break;
            }
          }
          if (!gc && !f) return;
          var now = new Date(1987, 1, 19), j = 0;
          var fullPaths = Object.create ? /* @__PURE__ */ Object.create(null) : {};
          var data = [];
          for (i2 = 0; i2 < cfb.FullPaths.length; ++i2) {
            fullPaths[cfb.FullPaths[i2]] = true;
            if (cfb.FileIndex[i2].type === 0) continue;
            data.push([cfb.FullPaths[i2], cfb.FileIndex[i2]]);
          }
          for (i2 = 0; i2 < data.length; ++i2) {
            var dad = dirname(data[i2][0]);
            s = fullPaths[dad];
            while (!s) {
              while (dirname(dad) && !fullPaths[dirname(dad)]) dad = dirname(dad);
              data.push([dad, {
                name: filename(dad).replace("/", ""),
                type: 1,
                clsid: HEADER_CLSID,
                ct: now,
                mt: now,
                content: null
              }]);
              fullPaths[dad] = true;
              dad = dirname(data[i2][0]);
              s = fullPaths[dad];
            }
          }
          data.sort(function(x, y) {
            return namecmp(x[0], y[0]);
          });
          cfb.FullPaths = [];
          cfb.FileIndex = [];
          for (i2 = 0; i2 < data.length; ++i2) {
            cfb.FullPaths[i2] = data[i2][0];
            cfb.FileIndex[i2] = data[i2][1];
          }
          for (i2 = 0; i2 < data.length; ++i2) {
            var elt = cfb.FileIndex[i2];
            var nm = cfb.FullPaths[i2];
            elt.name = filename(nm).replace("/", "");
            elt.L = elt.R = elt.C = -(elt.color = 1);
            elt.size = elt.content ? elt.content.length : 0;
            elt.start = 0;
            elt.clsid = elt.clsid || HEADER_CLSID;
            if (i2 === 0) {
              elt.C = data.length > 1 ? 1 : -1;
              elt.size = 0;
              elt.type = 5;
            } else if (nm.slice(-1) == "/") {
              for (j = i2 + 1; j < data.length; ++j) if (dirname(cfb.FullPaths[j]) == nm) break;
              elt.C = j >= data.length ? -1 : j;
              for (j = i2 + 1; j < data.length; ++j) if (dirname(cfb.FullPaths[j]) == dirname(nm)) break;
              elt.R = j >= data.length ? -1 : j;
              elt.type = 1;
            } else {
              if (dirname(cfb.FullPaths[i2 + 1] || "") == dirname(nm)) elt.R = i2 + 1;
              elt.type = 2;
            }
          }
        }
        function _write(cfb, options) {
          var _opts = options || {};
          if (_opts.fileType == "mad") return write_mad(cfb, _opts);
          rebuild_cfb(cfb);
          switch (_opts.fileType) {
            case "zip":
              return write_zip(cfb, _opts);
          }
          var L = (function(cfb2) {
            var mini_size = 0, fat_size = 0;
            for (var i3 = 0; i3 < cfb2.FileIndex.length; ++i3) {
              var file2 = cfb2.FileIndex[i3];
              if (!file2.content) continue;
              var flen2 = file2.content.length;
              if (flen2 > 0) {
                if (flen2 < 4096) mini_size += flen2 + 63 >> 6;
                else fat_size += flen2 + 511 >> 9;
              }
            }
            var dir_cnt = cfb2.FullPaths.length + 3 >> 2;
            var mini_cnt = mini_size + 7 >> 3;
            var mfat_cnt = mini_size + 127 >> 7;
            var fat_base = mini_cnt + fat_size + dir_cnt + mfat_cnt;
            var fat_cnt = fat_base + 127 >> 7;
            var difat_cnt = fat_cnt <= 109 ? 0 : Math.ceil((fat_cnt - 109) / 127);
            while (fat_base + fat_cnt + difat_cnt + 127 >> 7 > fat_cnt) difat_cnt = ++fat_cnt <= 109 ? 0 : Math.ceil((fat_cnt - 109) / 127);
            var L2 = [1, difat_cnt, fat_cnt, mfat_cnt, dir_cnt, fat_size, mini_size, 0];
            cfb2.FileIndex[0].size = mini_size << 6;
            L2[7] = (cfb2.FileIndex[0].start = L2[0] + L2[1] + L2[2] + L2[3] + L2[4] + L2[5]) + (L2[6] + 7 >> 3);
            return L2;
          })(cfb);
          var o = new_buf(L[7] << 9);
          var i2 = 0, T = 0;
          {
            for (i2 = 0; i2 < 8; ++i2) o.write_shift(1, HEADER_SIG[i2]);
            for (i2 = 0; i2 < 8; ++i2) o.write_shift(2, 0);
            o.write_shift(2, 62);
            o.write_shift(2, 3);
            o.write_shift(2, 65534);
            o.write_shift(2, 9);
            o.write_shift(2, 6);
            for (i2 = 0; i2 < 3; ++i2) o.write_shift(2, 0);
            o.write_shift(4, 0);
            o.write_shift(4, L[2]);
            o.write_shift(4, L[0] + L[1] + L[2] + L[3] - 1);
            o.write_shift(4, 0);
            o.write_shift(4, 1 << 12);
            o.write_shift(4, L[3] ? L[0] + L[1] + L[2] - 1 : ENDOFCHAIN);
            o.write_shift(4, L[3]);
            o.write_shift(-4, L[1] ? L[0] - 1 : ENDOFCHAIN);
            o.write_shift(4, L[1]);
            for (i2 = 0; i2 < 109; ++i2) o.write_shift(-4, i2 < L[2] ? L[1] + i2 : -1);
          }
          if (L[1]) {
            for (T = 0; T < L[1]; ++T) {
              for (; i2 < 236 + T * 127; ++i2) o.write_shift(-4, i2 < L[2] ? L[1] + i2 : -1);
              o.write_shift(-4, T === L[1] - 1 ? ENDOFCHAIN : T + 1);
            }
          }
          var chainit = function(w) {
            for (T += w; i2 < T - 1; ++i2) o.write_shift(-4, i2 + 1);
            if (w) {
              ++i2;
              o.write_shift(-4, ENDOFCHAIN);
            }
          };
          T = i2 = 0;
          for (T += L[1]; i2 < T; ++i2) o.write_shift(-4, consts.DIFSECT);
          for (T += L[2]; i2 < T; ++i2) o.write_shift(-4, consts.FATSECT);
          chainit(L[3]);
          chainit(L[4]);
          var j = 0, flen = 0;
          var file = cfb.FileIndex[0];
          for (; j < cfb.FileIndex.length; ++j) {
            file = cfb.FileIndex[j];
            if (!file.content) continue;
            flen = file.content.length;
            if (flen < 4096) continue;
            file.start = T;
            chainit(flen + 511 >> 9);
          }
          chainit(L[6] + 7 >> 3);
          while (o.l & 511) o.write_shift(-4, consts.ENDOFCHAIN);
          T = i2 = 0;
          for (j = 0; j < cfb.FileIndex.length; ++j) {
            file = cfb.FileIndex[j];
            if (!file.content) continue;
            flen = file.content.length;
            if (!flen || flen >= 4096) continue;
            file.start = T;
            chainit(flen + 63 >> 6);
          }
          while (o.l & 511) o.write_shift(-4, consts.ENDOFCHAIN);
          for (i2 = 0; i2 < L[4] << 2; ++i2) {
            var nm = cfb.FullPaths[i2];
            if (!nm || nm.length === 0) {
              for (j = 0; j < 17; ++j) o.write_shift(4, 0);
              for (j = 0; j < 3; ++j) o.write_shift(4, -1);
              for (j = 0; j < 12; ++j) o.write_shift(4, 0);
              continue;
            }
            file = cfb.FileIndex[i2];
            if (i2 === 0) file.start = file.size ? file.start - 1 : ENDOFCHAIN;
            var _nm = i2 === 0 && _opts.root || file.name;
            if (_nm.length > 32) {
              console.error("Name " + _nm + " will be truncated to " + _nm.slice(0, 32));
              _nm = _nm.slice(0, 32);
            }
            flen = 2 * (_nm.length + 1);
            o.write_shift(64, _nm, "utf16le");
            o.write_shift(2, flen);
            o.write_shift(1, file.type);
            o.write_shift(1, file.color);
            o.write_shift(-4, file.L);
            o.write_shift(-4, file.R);
            o.write_shift(-4, file.C);
            if (!file.clsid) for (j = 0; j < 4; ++j) o.write_shift(4, 0);
            else o.write_shift(16, file.clsid, "hex");
            o.write_shift(4, file.state || 0);
            o.write_shift(4, 0);
            o.write_shift(4, 0);
            o.write_shift(4, 0);
            o.write_shift(4, 0);
            o.write_shift(4, file.start);
            o.write_shift(4, file.size);
            o.write_shift(4, 0);
          }
          for (i2 = 1; i2 < cfb.FileIndex.length; ++i2) {
            file = cfb.FileIndex[i2];
            if (file.size >= 4096) {
              o.l = file.start + 1 << 9;
              if (has_buf && Buffer.isBuffer(file.content)) {
                file.content.copy(o, o.l, 0, file.size);
                o.l += file.size + 511 & -512;
              } else {
                for (j = 0; j < file.size; ++j) o.write_shift(1, file.content[j]);
                for (; j & 511; ++j) o.write_shift(1, 0);
              }
            }
          }
          for (i2 = 1; i2 < cfb.FileIndex.length; ++i2) {
            file = cfb.FileIndex[i2];
            if (file.size > 0 && file.size < 4096) {
              if (has_buf && Buffer.isBuffer(file.content)) {
                file.content.copy(o, o.l, 0, file.size);
                o.l += file.size + 63 & -64;
              } else {
                for (j = 0; j < file.size; ++j) o.write_shift(1, file.content[j]);
                for (; j & 63; ++j) o.write_shift(1, 0);
              }
            }
          }
          if (has_buf) {
            o.l = o.length;
          } else {
            while (o.l < o.length) o.write_shift(1, 0);
          }
          return o;
        }
        function find(cfb, path) {
          var UCFullPaths = cfb.FullPaths.map(function(x) {
            return x.toUpperCase();
          });
          var UCPaths = UCFullPaths.map(function(x) {
            var y = x.split("/");
            return y[y.length - (x.slice(-1) == "/" ? 2 : 1)];
          });
          var k = false;
          if (path.charCodeAt(0) === 47) {
            k = true;
            path = UCFullPaths[0].slice(0, -1) + path;
          } else k = path.indexOf("/") !== -1;
          var UCPath = path.toUpperCase();
          var w = k === true ? UCFullPaths.indexOf(UCPath) : UCPaths.indexOf(UCPath);
          if (w !== -1) return cfb.FileIndex[w];
          var m = !UCPath.match(chr1);
          UCPath = UCPath.replace(chr0, "");
          if (m) UCPath = UCPath.replace(chr1, "!");
          for (w = 0; w < UCFullPaths.length; ++w) {
            if ((m ? UCFullPaths[w].replace(chr1, "!") : UCFullPaths[w]).replace(chr0, "") == UCPath) return cfb.FileIndex[w];
            if ((m ? UCPaths[w].replace(chr1, "!") : UCPaths[w]).replace(chr0, "") == UCPath) return cfb.FileIndex[w];
          }
          return null;
        }
        var MSSZ = 64;
        var ENDOFCHAIN = -2;
        var HEADER_SIGNATURE = "d0cf11e0a1b11ae1";
        var HEADER_SIG = [208, 207, 17, 224, 161, 177, 26, 225];
        var HEADER_CLSID = "00000000000000000000000000000000";
        var consts = {
          /* 2.1 Compund File Sector Numbers and Types */
          MAXREGSECT: -6,
          DIFSECT: -4,
          FATSECT: -3,
          ENDOFCHAIN,
          FREESECT: -1,
          /* 2.2 Compound File Header */
          HEADER_SIGNATURE,
          HEADER_MINOR_VERSION: "3e00",
          MAXREGSID: -6,
          NOSTREAM: -1,
          HEADER_CLSID,
          /* 2.6.1 Compound File Directory Entry */
          EntryTypes: ["unknown", "storage", "stream", "lockbytes", "property", "root"]
        };
        function write_file(cfb, filename2, options) {
          get_fs();
          var o = _write(cfb, options);
          fs.writeFileSync(filename2, o);
        }
        function a2s(o) {
          var out = new Array(o.length);
          for (var i2 = 0; i2 < o.length; ++i2) out[i2] = String.fromCharCode(o[i2]);
          return out.join("");
        }
        function write(cfb, options) {
          var o = _write(cfb, options);
          switch (options && options.type || "buffer") {
            case "file":
              get_fs();
              fs.writeFileSync(options.filename, o);
              return o;
            case "binary":
              return typeof o == "string" ? o : a2s(o);
            case "base64":
              return Base64_encode(typeof o == "string" ? o : a2s(o));
            case "buffer":
              if (has_buf) return Buffer.isBuffer(o) ? o : Buffer_from(o);
            /* falls through */
            case "array":
              return typeof o == "string" ? s2a(o) : o;
          }
          return o;
        }
        var _zlib;
        function use_zlib(zlib) {
          try {
            var InflateRaw = zlib.InflateRaw;
            var InflRaw = new InflateRaw();
            InflRaw._processChunk(new Uint8Array([3, 0]), InflRaw._finishFlushFlag);
            if (InflRaw.bytesRead) _zlib = zlib;
            else throw new Error("zlib does not expose bytesRead");
          } catch (e) {
            console.error("cannot use native zlib: " + (e.message || e));
          }
        }
        function _inflateRawSync(payload, usz) {
          if (!_zlib) return _inflate(payload, usz);
          var InflateRaw = _zlib.InflateRaw;
          var InflRaw = new InflateRaw();
          var out = InflRaw._processChunk(payload.slice(payload.l), InflRaw._finishFlushFlag);
          payload.l += InflRaw.bytesRead;
          return out;
        }
        function _deflateRawSync(payload) {
          return _zlib ? _zlib.deflateRawSync(payload) : _deflate(payload);
        }
        var CLEN_ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
        var LEN_LN = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
        var DST_LN = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
        function bit_swap_8(n) {
          var t = (n << 1 | n << 11) & 139536 | (n << 5 | n << 15) & 558144;
          return (t >> 16 | t >> 8 | t) & 255;
        }
        var use_typed_arrays = typeof Uint8Array !== "undefined";
        var bitswap8 = use_typed_arrays ? new Uint8Array(1 << 8) : [];
        for (var q = 0; q < 1 << 8; ++q) bitswap8[q] = bit_swap_8(q);
        function bit_swap_n(n, b) {
          var rev = bitswap8[n & 255];
          if (b <= 8) return rev >>> 8 - b;
          rev = rev << 8 | bitswap8[n >> 8 & 255];
          if (b <= 16) return rev >>> 16 - b;
          rev = rev << 8 | bitswap8[n >> 16 & 255];
          return rev >>> 24 - b;
        }
        function read_bits_2(buf, bl) {
          var w = bl & 7, h = bl >>> 3;
          return (buf[h] | (w <= 6 ? 0 : buf[h + 1] << 8)) >>> w & 3;
        }
        function read_bits_3(buf, bl) {
          var w = bl & 7, h = bl >>> 3;
          return (buf[h] | (w <= 5 ? 0 : buf[h + 1] << 8)) >>> w & 7;
        }
        function read_bits_4(buf, bl) {
          var w = bl & 7, h = bl >>> 3;
          return (buf[h] | (w <= 4 ? 0 : buf[h + 1] << 8)) >>> w & 15;
        }
        function read_bits_5(buf, bl) {
          var w = bl & 7, h = bl >>> 3;
          return (buf[h] | (w <= 3 ? 0 : buf[h + 1] << 8)) >>> w & 31;
        }
        function read_bits_7(buf, bl) {
          var w = bl & 7, h = bl >>> 3;
          return (buf[h] | (w <= 1 ? 0 : buf[h + 1] << 8)) >>> w & 127;
        }
        function read_bits_n(buf, bl, n) {
          var w = bl & 7, h = bl >>> 3, f = (1 << n) - 1;
          var v = buf[h] >>> w;
          if (n < 8 - w) return v & f;
          v |= buf[h + 1] << 8 - w;
          if (n < 16 - w) return v & f;
          v |= buf[h + 2] << 16 - w;
          if (n < 24 - w) return v & f;
          v |= buf[h + 3] << 24 - w;
          return v & f;
        }
        function write_bits_3(buf, bl, v) {
          var w = bl & 7, h = bl >>> 3;
          if (w <= 5) buf[h] |= (v & 7) << w;
          else {
            buf[h] |= v << w & 255;
            buf[h + 1] = (v & 7) >> 8 - w;
          }
          return bl + 3;
        }
        function write_bits_1(buf, bl, v) {
          var w = bl & 7, h = bl >>> 3;
          v = (v & 1) << w;
          buf[h] |= v;
          return bl + 1;
        }
        function write_bits_8(buf, bl, v) {
          var w = bl & 7, h = bl >>> 3;
          v <<= w;
          buf[h] |= v & 255;
          v >>>= 8;
          buf[h + 1] = v;
          return bl + 8;
        }
        function write_bits_16(buf, bl, v) {
          var w = bl & 7, h = bl >>> 3;
          v <<= w;
          buf[h] |= v & 255;
          v >>>= 8;
          buf[h + 1] = v & 255;
          buf[h + 2] = v >>> 8;
          return bl + 16;
        }
        function realloc(b, sz) {
          var L = b.length, M = 2 * L > sz ? 2 * L : sz + 5, i2 = 0;
          if (L >= sz) return b;
          if (has_buf) {
            var o = new_unsafe_buf(M);
            if (b.copy) b.copy(o);
            else for (; i2 < b.length; ++i2) o[i2] = b[i2];
            return o;
          } else if (use_typed_arrays) {
            var a = new Uint8Array(M);
            if (a.set) a.set(b);
            else for (; i2 < L; ++i2) a[i2] = b[i2];
            return a;
          }
          b.length = M;
          return b;
        }
        function zero_fill_array(n) {
          var o = new Array(n);
          for (var i2 = 0; i2 < n; ++i2) o[i2] = 0;
          return o;
        }
        function build_tree(clens, cmap, MAX) {
          var maxlen = 1, w = 0, i2 = 0, j = 0, ccode = 0, L = clens.length;
          var bl_count = use_typed_arrays ? new Uint16Array(32) : zero_fill_array(32);
          for (i2 = 0; i2 < 32; ++i2) bl_count[i2] = 0;
          for (i2 = L; i2 < MAX; ++i2) clens[i2] = 0;
          L = clens.length;
          var ctree = use_typed_arrays ? new Uint16Array(L) : zero_fill_array(L);
          for (i2 = 0; i2 < L; ++i2) {
            bl_count[w = clens[i2]]++;
            if (maxlen < w) maxlen = w;
            ctree[i2] = 0;
          }
          bl_count[0] = 0;
          for (i2 = 1; i2 <= maxlen; ++i2) bl_count[i2 + 16] = ccode = ccode + bl_count[i2 - 1] << 1;
          for (i2 = 0; i2 < L; ++i2) {
            ccode = clens[i2];
            if (ccode != 0) ctree[i2] = bl_count[ccode + 16]++;
          }
          var cleni = 0;
          for (i2 = 0; i2 < L; ++i2) {
            cleni = clens[i2];
            if (cleni != 0) {
              ccode = bit_swap_n(ctree[i2], maxlen) >> maxlen - cleni;
              for (j = (1 << maxlen + 4 - cleni) - 1; j >= 0; --j)
                cmap[ccode | j << cleni] = cleni & 15 | i2 << 4;
            }
          }
          return maxlen;
        }
        var fix_lmap = use_typed_arrays ? new Uint16Array(512) : zero_fill_array(512);
        var fix_dmap = use_typed_arrays ? new Uint16Array(32) : zero_fill_array(32);
        if (!use_typed_arrays) {
          for (var i = 0; i < 512; ++i) fix_lmap[i] = 0;
          for (i = 0; i < 32; ++i) fix_dmap[i] = 0;
        }
        (function() {
          var dlens = [];
          var i2 = 0;
          for (; i2 < 32; i2++) dlens.push(5);
          build_tree(dlens, fix_dmap, 32);
          var clens = [];
          i2 = 0;
          for (; i2 <= 143; i2++) clens.push(8);
          for (; i2 <= 255; i2++) clens.push(9);
          for (; i2 <= 279; i2++) clens.push(7);
          for (; i2 <= 287; i2++) clens.push(8);
          build_tree(clens, fix_lmap, 288);
        })();
        var _deflateRaw = (function _deflateRawIIFE() {
          var DST_LN_RE = use_typed_arrays ? new Uint8Array(32768) : [];
          var j = 0, k = 0;
          for (; j < DST_LN.length - 1; ++j) {
            for (; k < DST_LN[j + 1]; ++k) DST_LN_RE[k] = j;
          }
          for (; k < 32768; ++k) DST_LN_RE[k] = 29;
          var LEN_LN_RE = use_typed_arrays ? new Uint8Array(259) : [];
          for (j = 0, k = 0; j < LEN_LN.length - 1; ++j) {
            for (; k < LEN_LN[j + 1]; ++k) LEN_LN_RE[k] = j;
          }
          function write_stored(data, out) {
            var boff = 0;
            while (boff < data.length) {
              var L = Math.min(65535, data.length - boff);
              var h = boff + L == data.length;
              out.write_shift(1, +h);
              out.write_shift(2, L);
              out.write_shift(2, ~L & 65535);
              while (L-- > 0) out[out.l++] = data[boff++];
            }
            return out.l;
          }
          function write_huff_fixed(data, out) {
            var bl = 0;
            var boff = 0;
            var addrs = use_typed_arrays ? new Uint16Array(32768) : [];
            while (boff < data.length) {
              var L = (
                /* data.length - boff; */
                Math.min(65535, data.length - boff)
              );
              if (L < 10) {
                bl = write_bits_3(out, bl, +!!(boff + L == data.length));
                if (bl & 7) bl += 8 - (bl & 7);
                out.l = bl / 8 | 0;
                out.write_shift(2, L);
                out.write_shift(2, ~L & 65535);
                while (L-- > 0) out[out.l++] = data[boff++];
                bl = out.l * 8;
                continue;
              }
              bl = write_bits_3(out, bl, +!!(boff + L == data.length) + 2);
              var hash = 0;
              while (L-- > 0) {
                var d = data[boff];
                hash = (hash << 5 ^ d) & 32767;
                var match = -1, mlen = 0;
                if (match = addrs[hash]) {
                  match |= boff & ~32767;
                  if (match > boff) match -= 32768;
                  if (match < boff) while (data[match + mlen] == data[boff + mlen] && mlen < 250) ++mlen;
                }
                if (mlen > 2) {
                  d = LEN_LN_RE[mlen];
                  if (d <= 22) bl = write_bits_8(out, bl, bitswap8[d + 1] >> 1) - 1;
                  else {
                    write_bits_8(out, bl, 3);
                    bl += 5;
                    write_bits_8(out, bl, bitswap8[d - 23] >> 5);
                    bl += 3;
                  }
                  var len_eb = d < 8 ? 0 : d - 4 >> 2;
                  if (len_eb > 0) {
                    write_bits_16(out, bl, mlen - LEN_LN[d]);
                    bl += len_eb;
                  }
                  d = DST_LN_RE[boff - match];
                  bl = write_bits_8(out, bl, bitswap8[d] >> 3);
                  bl -= 3;
                  var dst_eb = d < 4 ? 0 : d - 2 >> 1;
                  if (dst_eb > 0) {
                    write_bits_16(out, bl, boff - match - DST_LN[d]);
                    bl += dst_eb;
                  }
                  for (var q2 = 0; q2 < mlen; ++q2) {
                    addrs[hash] = boff & 32767;
                    hash = (hash << 5 ^ data[boff]) & 32767;
                    ++boff;
                  }
                  L -= mlen - 1;
                } else {
                  if (d <= 143) d = d + 48;
                  else bl = write_bits_1(out, bl, 1);
                  bl = write_bits_8(out, bl, bitswap8[d]);
                  addrs[hash] = boff & 32767;
                  ++boff;
                }
              }
              bl = write_bits_8(out, bl, 0) - 1;
            }
            out.l = (bl + 7) / 8 | 0;
            return out.l;
          }
          return function _deflateRaw2(data, out) {
            if (data.length < 8) return write_stored(data, out);
            return write_huff_fixed(data, out);
          };
        })();
        function _deflate(data) {
          var buf = new_buf(50 + Math.floor(data.length * 1.1));
          var off = _deflateRaw(data, buf);
          return buf.slice(0, off);
        }
        var dyn_lmap = use_typed_arrays ? new Uint16Array(32768) : zero_fill_array(32768);
        var dyn_dmap = use_typed_arrays ? new Uint16Array(32768) : zero_fill_array(32768);
        var dyn_cmap = use_typed_arrays ? new Uint16Array(128) : zero_fill_array(128);
        var dyn_len_1 = 1, dyn_len_2 = 1;
        function dyn(data, boff) {
          var _HLIT = read_bits_5(data, boff) + 257;
          boff += 5;
          var _HDIST = read_bits_5(data, boff) + 1;
          boff += 5;
          var _HCLEN = read_bits_4(data, boff) + 4;
          boff += 4;
          var w = 0;
          var clens = use_typed_arrays ? new Uint8Array(19) : zero_fill_array(19);
          var ctree = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          var maxlen = 1;
          var bl_count = use_typed_arrays ? new Uint8Array(8) : zero_fill_array(8);
          var next_code = use_typed_arrays ? new Uint8Array(8) : zero_fill_array(8);
          var L = clens.length;
          for (var i2 = 0; i2 < _HCLEN; ++i2) {
            clens[CLEN_ORDER[i2]] = w = read_bits_3(data, boff);
            if (maxlen < w) maxlen = w;
            bl_count[w]++;
            boff += 3;
          }
          var ccode = 0;
          bl_count[0] = 0;
          for (i2 = 1; i2 <= maxlen; ++i2) next_code[i2] = ccode = ccode + bl_count[i2 - 1] << 1;
          for (i2 = 0; i2 < L; ++i2) if ((ccode = clens[i2]) != 0) ctree[i2] = next_code[ccode]++;
          var cleni = 0;
          for (i2 = 0; i2 < L; ++i2) {
            cleni = clens[i2];
            if (cleni != 0) {
              ccode = bitswap8[ctree[i2]] >> 8 - cleni;
              for (var j = (1 << 7 - cleni) - 1; j >= 0; --j) dyn_cmap[ccode | j << cleni] = cleni & 7 | i2 << 3;
            }
          }
          var hcodes = [];
          maxlen = 1;
          for (; hcodes.length < _HLIT + _HDIST; ) {
            ccode = dyn_cmap[read_bits_7(data, boff)];
            boff += ccode & 7;
            switch (ccode >>>= 3) {
              case 16:
                w = 3 + read_bits_2(data, boff);
                boff += 2;
                ccode = hcodes[hcodes.length - 1];
                while (w-- > 0) hcodes.push(ccode);
                break;
              case 17:
                w = 3 + read_bits_3(data, boff);
                boff += 3;
                while (w-- > 0) hcodes.push(0);
                break;
              case 18:
                w = 11 + read_bits_7(data, boff);
                boff += 7;
                while (w-- > 0) hcodes.push(0);
                break;
              default:
                hcodes.push(ccode);
                if (maxlen < ccode) maxlen = ccode;
                break;
            }
          }
          var h1 = hcodes.slice(0, _HLIT), h2 = hcodes.slice(_HLIT);
          for (i2 = _HLIT; i2 < 286; ++i2) h1[i2] = 0;
          for (i2 = _HDIST; i2 < 30; ++i2) h2[i2] = 0;
          dyn_len_1 = build_tree(h1, dyn_lmap, 286);
          dyn_len_2 = build_tree(h2, dyn_dmap, 30);
          return boff;
        }
        function inflate(data, usz) {
          if (data[0] == 3 && !(data[1] & 3)) {
            return [new_raw_buf(usz), 2];
          }
          var boff = 0;
          var header = 0;
          var outbuf = new_unsafe_buf(usz ? usz : 1 << 18);
          var woff = 0;
          var OL = outbuf.length >>> 0;
          var max_len_1 = 0, max_len_2 = 0;
          while ((header & 1) == 0) {
            header = read_bits_3(data, boff);
            boff += 3;
            if (header >>> 1 == 0) {
              if (boff & 7) boff += 8 - (boff & 7);
              var sz = data[boff >>> 3] | data[(boff >>> 3) + 1] << 8;
              boff += 32;
              if (sz > 0) {
                if (!usz && OL < woff + sz) {
                  outbuf = realloc(outbuf, woff + sz);
                  OL = outbuf.length;
                }
                while (sz-- > 0) {
                  outbuf[woff++] = data[boff >>> 3];
                  boff += 8;
                }
              }
              continue;
            } else if (header >> 1 == 1) {
              max_len_1 = 9;
              max_len_2 = 5;
            } else {
              boff = dyn(data, boff);
              max_len_1 = dyn_len_1;
              max_len_2 = dyn_len_2;
            }
            for (; ; ) {
              if (!usz && OL < woff + 32767) {
                outbuf = realloc(outbuf, woff + 32767);
                OL = outbuf.length;
              }
              var bits = read_bits_n(data, boff, max_len_1);
              var code = header >>> 1 == 1 ? fix_lmap[bits] : dyn_lmap[bits];
              boff += code & 15;
              code >>>= 4;
              if ((code >>> 8 & 255) === 0) outbuf[woff++] = code;
              else if (code == 256) break;
              else {
                code -= 257;
                var len_eb = code < 8 ? 0 : code - 4 >> 2;
                if (len_eb > 5) len_eb = 0;
                var tgt = woff + LEN_LN[code];
                if (len_eb > 0) {
                  tgt += read_bits_n(data, boff, len_eb);
                  boff += len_eb;
                }
                bits = read_bits_n(data, boff, max_len_2);
                code = header >>> 1 == 1 ? fix_dmap[bits] : dyn_dmap[bits];
                boff += code & 15;
                code >>>= 4;
                var dst_eb = code < 4 ? 0 : code - 2 >> 1;
                var dst = DST_LN[code];
                if (dst_eb > 0) {
                  dst += read_bits_n(data, boff, dst_eb);
                  boff += dst_eb;
                }
                if (!usz && OL < tgt) {
                  outbuf = realloc(outbuf, tgt + 100);
                  OL = outbuf.length;
                }
                while (woff < tgt) {
                  outbuf[woff] = outbuf[woff - dst];
                  ++woff;
                }
              }
            }
          }
          if (usz) return [outbuf, boff + 7 >>> 3];
          return [outbuf.slice(0, woff), boff + 7 >>> 3];
        }
        function _inflate(payload, usz) {
          var data = payload.slice(payload.l || 0);
          var out = inflate(data, usz);
          payload.l += out[1];
          return out[0];
        }
        function warn_or_throw(wrn, msg) {
          if (wrn) {
            if (typeof console !== "undefined") console.error(msg);
          } else throw new Error(msg);
        }
        function parse_zip(file, options) {
          var blob = file;
          prep_blob(blob, 0);
          var FileIndex = [], FullPaths = [];
          var o = {
            FileIndex,
            FullPaths
          };
          init_cfb(o, { root: options.root });
          var i2 = blob.length - 4;
          while ((blob[i2] != 80 || blob[i2 + 1] != 75 || blob[i2 + 2] != 5 || blob[i2 + 3] != 6) && i2 >= 0) --i2;
          blob.l = i2 + 4;
          blob.l += 4;
          var fcnt = blob.read_shift(2);
          blob.l += 6;
          var start_cd = blob.read_shift(4);
          blob.l = start_cd;
          for (i2 = 0; i2 < fcnt; ++i2) {
            blob.l += 20;
            var csz = blob.read_shift(4);
            var usz = blob.read_shift(4);
            var namelen = blob.read_shift(2);
            var efsz = blob.read_shift(2);
            var fcsz = blob.read_shift(2);
            blob.l += 8;
            var offset = blob.read_shift(4);
            var EF = parse_extra_field(blob.slice(blob.l + namelen, blob.l + namelen + efsz));
            blob.l += namelen + efsz + fcsz;
            var L = blob.l;
            blob.l = offset + 4;
            parse_local_file(blob, csz, usz, o, EF);
            blob.l = L;
          }
          return o;
        }
        function parse_local_file(blob, csz, usz, o, EF) {
          blob.l += 2;
          var flags = blob.read_shift(2);
          var meth = blob.read_shift(2);
          var date = parse_dos_date(blob);
          if (flags & 8257) throw new Error("Unsupported ZIP encryption");
          var crc32 = blob.read_shift(4);
          var _csz = blob.read_shift(4);
          var _usz = blob.read_shift(4);
          var namelen = blob.read_shift(2);
          var efsz = blob.read_shift(2);
          var name = "";
          for (var i2 = 0; i2 < namelen; ++i2) name += String.fromCharCode(blob[blob.l++]);
          if (efsz) {
            var ef = parse_extra_field(blob.slice(blob.l, blob.l + efsz));
            if ((ef[21589] || {}).mt) date = ef[21589].mt;
            if (((EF || {})[21589] || {}).mt) date = EF[21589].mt;
          }
          blob.l += efsz;
          var data = blob.slice(blob.l, blob.l + _csz);
          switch (meth) {
            case 8:
              data = _inflateRawSync(blob, _usz);
              break;
            case 0:
              break;
            // TODO: scan for magic number
            default:
              throw new Error("Unsupported ZIP Compression method " + meth);
          }
          var wrn = false;
          if (flags & 8) {
            crc32 = blob.read_shift(4);
            if (crc32 == 134695760) {
              crc32 = blob.read_shift(4);
              wrn = true;
            }
            _csz = blob.read_shift(4);
            _usz = blob.read_shift(4);
          }
          if (_csz != csz) warn_or_throw(wrn, "Bad compressed size: " + csz + " != " + _csz);
          if (_usz != usz) warn_or_throw(wrn, "Bad uncompressed size: " + usz + " != " + _usz);
          var _crc32 = CRC32.buf(data, 0);
          if (crc32 >> 0 != _crc32 >> 0) warn_or_throw(wrn, "Bad CRC32 checksum: " + crc32 + " != " + _crc32);
          cfb_add(o, name, data, { unsafe: true, mt: date });
        }
        function write_zip(cfb, options) {
          var _opts = options || {};
          var out = [], cdirs = [];
          var o = new_buf(1);
          var method = _opts.compression ? 8 : 0, flags = 0;
          var desc = false;
          if (desc) flags |= 8;
          var i2 = 0, j = 0;
          var start_cd = 0, fcnt = 0;
          var root = cfb.FullPaths[0], fp = root, fi = cfb.FileIndex[0];
          var crcs = [];
          var sz_cd = 0;
          for (i2 = 1; i2 < cfb.FullPaths.length; ++i2) {
            fp = cfb.FullPaths[i2].slice(root.length);
            fi = cfb.FileIndex[i2];
            if (!fi.size || !fi.content || fp == "Sh33tJ5") continue;
            var start = start_cd;
            var namebuf = new_buf(fp.length);
            for (j = 0; j < fp.length; ++j) namebuf.write_shift(1, fp.charCodeAt(j) & 127);
            namebuf = namebuf.slice(0, namebuf.l);
            crcs[fcnt] = CRC32.buf(fi.content, 0);
            var outbuf = fi.content;
            if (method == 8) outbuf = _deflateRawSync(outbuf);
            o = new_buf(30);
            o.write_shift(4, 67324752);
            o.write_shift(2, 20);
            o.write_shift(2, flags);
            o.write_shift(2, method);
            if (fi.mt) write_dos_date(o, fi.mt);
            else o.write_shift(4, 0);
            o.write_shift(-4, flags & 8 ? 0 : crcs[fcnt]);
            o.write_shift(4, flags & 8 ? 0 : outbuf.length);
            o.write_shift(4, flags & 8 ? 0 : fi.content.length);
            o.write_shift(2, namebuf.length);
            o.write_shift(2, 0);
            start_cd += o.length;
            out.push(o);
            start_cd += namebuf.length;
            out.push(namebuf);
            start_cd += outbuf.length;
            out.push(outbuf);
            if (flags & 8) {
              o = new_buf(12);
              o.write_shift(-4, crcs[fcnt]);
              o.write_shift(4, outbuf.length);
              o.write_shift(4, fi.content.length);
              start_cd += o.l;
              out.push(o);
            }
            o = new_buf(46);
            o.write_shift(4, 33639248);
            o.write_shift(2, 0);
            o.write_shift(2, 20);
            o.write_shift(2, flags);
            o.write_shift(2, method);
            o.write_shift(4, 0);
            o.write_shift(-4, crcs[fcnt]);
            o.write_shift(4, outbuf.length);
            o.write_shift(4, fi.content.length);
            o.write_shift(2, namebuf.length);
            o.write_shift(2, 0);
            o.write_shift(2, 0);
            o.write_shift(2, 0);
            o.write_shift(2, 0);
            o.write_shift(4, 0);
            o.write_shift(4, start);
            sz_cd += o.l;
            cdirs.push(o);
            sz_cd += namebuf.length;
            cdirs.push(namebuf);
            ++fcnt;
          }
          o = new_buf(22);
          o.write_shift(4, 101010256);
          o.write_shift(2, 0);
          o.write_shift(2, 0);
          o.write_shift(2, fcnt);
          o.write_shift(2, fcnt);
          o.write_shift(4, sz_cd);
          o.write_shift(4, start_cd);
          o.write_shift(2, 0);
          return bconcat([bconcat(out), bconcat(cdirs), o]);
        }
        var ContentTypeMap = {
          "htm": "text/html",
          "xml": "text/xml",
          "gif": "image/gif",
          "jpg": "image/jpeg",
          "png": "image/png",
          "mso": "application/x-mso",
          "thmx": "application/vnd.ms-officetheme",
          "sh33tj5": "application/octet-stream"
        };
        function get_content_type(fi, fp) {
          if (fi.ctype) return fi.ctype;
          var ext = fi.name || "", m = ext.match(/\.([^\.]+)$/);
          if (m && ContentTypeMap[m[1]]) return ContentTypeMap[m[1]];
          if (fp) {
            m = (ext = fp).match(/[\.\\]([^\.\\])+$/);
            if (m && ContentTypeMap[m[1]]) return ContentTypeMap[m[1]];
          }
          return "application/octet-stream";
        }
        function write_base64_76(bstr) {
          var data = Base64_encode(bstr);
          var o = [];
          for (var i2 = 0; i2 < data.length; i2 += 76) o.push(data.slice(i2, i2 + 76));
          return o.join("\r\n") + "\r\n";
        }
        function write_quoted_printable(text) {
          var encoded = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7E-\xFF=]/g, function(c) {
            var w = c.charCodeAt(0).toString(16).toUpperCase();
            return "=" + (w.length == 1 ? "0" + w : w);
          });
          encoded = encoded.replace(/ $/mg, "=20").replace(/\t$/mg, "=09");
          if (encoded.charAt(0) == "\n") encoded = "=0D" + encoded.slice(1);
          encoded = encoded.replace(/\r(?!\n)/mg, "=0D").replace(/\n\n/mg, "\n=0A").replace(/([^\r\n])\n/mg, "$1=0A");
          var o = [], split = encoded.split("\r\n");
          for (var si = 0; si < split.length; ++si) {
            var str = split[si];
            if (str.length == 0) {
              o.push("");
              continue;
            }
            for (var i2 = 0; i2 < str.length; ) {
              var end = 76;
              var tmp = str.slice(i2, i2 + end);
              if (tmp.charAt(end - 1) == "=") end--;
              else if (tmp.charAt(end - 2) == "=") end -= 2;
              else if (tmp.charAt(end - 3) == "=") end -= 3;
              tmp = str.slice(i2, i2 + end);
              i2 += end;
              if (i2 < str.length) tmp += "=";
              o.push(tmp);
            }
          }
          return o.join("\r\n");
        }
        function parse_quoted_printable(data) {
          var o = [];
          for (var di = 0; di < data.length; ++di) {
            var line = data[di];
            while (di <= data.length && line.charAt(line.length - 1) == "=") line = line.slice(0, line.length - 1) + data[++di];
            o.push(line);
          }
          for (var oi = 0; oi < o.length; ++oi) o[oi] = o[oi].replace(/[=][0-9A-Fa-f]{2}/g, function($$) {
            return String.fromCharCode(parseInt($$.slice(1), 16));
          });
          return s2a(o.join("\r\n"));
        }
        function parse_mime(cfb, data, root) {
          var fname = "", cte = "", ctype = "", fdata;
          var di = 0;
          for (; di < 10; ++di) {
            var line = data[di];
            if (!line || line.match(/^\s*$/)) break;
            var m = line.match(/^(.*?):\s*([^\s].*)$/);
            if (m) switch (m[1].toLowerCase()) {
              case "content-location":
                fname = m[2].trim();
                break;
              case "content-type":
                ctype = m[2].trim();
                break;
              case "content-transfer-encoding":
                cte = m[2].trim();
                break;
            }
          }
          ++di;
          switch (cte.toLowerCase()) {
            case "base64":
              fdata = s2a(Base64_decode(data.slice(di).join("")));
              break;
            case "quoted-printable":
              fdata = parse_quoted_printable(data.slice(di));
              break;
            default:
              throw new Error("Unsupported Content-Transfer-Encoding " + cte);
          }
          var file = cfb_add(cfb, fname.slice(root.length), fdata, { unsafe: true });
          if (ctype) file.ctype = ctype;
        }
        function parse_mad(file, options) {
          if (a2s(file.slice(0, 13)).toLowerCase() != "mime-version:") throw new Error("Unsupported MAD header");
          var root = options && options.root || "";
          var data = (has_buf && Buffer.isBuffer(file) ? file.toString("binary") : a2s(file)).split("\r\n");
          var di = 0, row = "";
          for (di = 0; di < data.length; ++di) {
            row = data[di];
            if (!/^Content-Location:/i.test(row)) continue;
            row = row.slice(row.indexOf("file"));
            if (!root) root = row.slice(0, row.lastIndexOf("/") + 1);
            if (row.slice(0, root.length) == root) continue;
            while (root.length > 0) {
              root = root.slice(0, root.length - 1);
              root = root.slice(0, root.lastIndexOf("/") + 1);
              if (row.slice(0, root.length) == root) break;
            }
          }
          var mboundary = (data[1] || "").match(/boundary="(.*?)"/);
          if (!mboundary) throw new Error("MAD cannot find boundary");
          var boundary = "--" + (mboundary[1] || "");
          var FileIndex = [], FullPaths = [];
          var o = {
            FileIndex,
            FullPaths
          };
          init_cfb(o);
          var start_di, fcnt = 0;
          for (di = 0; di < data.length; ++di) {
            var line = data[di];
            if (line !== boundary && line !== boundary + "--") continue;
            if (fcnt++) parse_mime(o, data.slice(start_di, di), root);
            start_di = di;
          }
          return o;
        }
        function write_mad(cfb, options) {
          var opts = options || {};
          var boundary = opts.boundary || "SheetJS";
          boundary = "------=" + boundary;
          var out = [
            "MIME-Version: 1.0",
            'Content-Type: multipart/related; boundary="' + boundary.slice(2) + '"',
            "",
            "",
            ""
          ];
          var root = cfb.FullPaths[0], fp = root, fi = cfb.FileIndex[0];
          for (var i2 = 1; i2 < cfb.FullPaths.length; ++i2) {
            fp = cfb.FullPaths[i2].slice(root.length);
            fi = cfb.FileIndex[i2];
            if (!fi.size || !fi.content || fp == "Sh33tJ5") continue;
            fp = fp.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7E-\xFF]/g, function(c) {
              return "_x" + c.charCodeAt(0).toString(16) + "_";
            }).replace(/[\u0080-\uFFFF]/g, function(u) {
              return "_u" + u.charCodeAt(0).toString(16) + "_";
            });
            var ca = fi.content;
            var cstr = has_buf && Buffer.isBuffer(ca) ? ca.toString("binary") : a2s(ca);
            var dispcnt = 0, L = Math.min(1024, cstr.length), cc = 0;
            for (var csl = 0; csl <= L; ++csl) if ((cc = cstr.charCodeAt(csl)) >= 32 && cc < 128) ++dispcnt;
            var qp = dispcnt >= L * 4 / 5;
            out.push(boundary);
            out.push("Content-Location: " + (opts.root || "file:///C:/SheetJS/") + fp);
            out.push("Content-Transfer-Encoding: " + (qp ? "quoted-printable" : "base64"));
            out.push("Content-Type: " + get_content_type(fi, fp));
            out.push("");
            out.push(qp ? write_quoted_printable(cstr) : write_base64_76(cstr));
          }
          out.push(boundary + "--\r\n");
          return out.join("\r\n");
        }
        function cfb_new(opts) {
          var o = {};
          init_cfb(o, opts);
          return o;
        }
        function cfb_add(cfb, name, content, opts) {
          var unsafe = opts && opts.unsafe;
          if (!unsafe) init_cfb(cfb);
          var file = !unsafe && CFB2.find(cfb, name);
          if (!file) {
            var fpath = cfb.FullPaths[0];
            if (name.slice(0, fpath.length) == fpath) fpath = name;
            else {
              if (fpath.slice(-1) != "/") fpath += "/";
              fpath = (fpath + name).replace("//", "/");
            }
            file = { name: filename(name), type: 2 };
            cfb.FileIndex.push(file);
            cfb.FullPaths.push(fpath);
            if (!unsafe) CFB2.utils.cfb_gc(cfb);
          }
          file.content = content;
          file.size = content ? content.length : 0;
          if (opts) {
            if (opts.CLSID) file.clsid = opts.CLSID;
            if (opts.mt) file.mt = opts.mt;
            if (opts.ct) file.ct = opts.ct;
          }
          return file;
        }
        function cfb_del(cfb, name) {
          init_cfb(cfb);
          var file = CFB2.find(cfb, name);
          if (file) {
            for (var j = 0; j < cfb.FileIndex.length; ++j) if (cfb.FileIndex[j] == file) {
              cfb.FileIndex.splice(j, 1);
              cfb.FullPaths.splice(j, 1);
              return true;
            }
          }
          return false;
        }
        function cfb_mov(cfb, old_name, new_name) {
          init_cfb(cfb);
          var file = CFB2.find(cfb, old_name);
          if (file) {
            for (var j = 0; j < cfb.FileIndex.length; ++j) if (cfb.FileIndex[j] == file) {
              cfb.FileIndex[j].name = filename(new_name);
              cfb.FullPaths[j] = new_name;
              return true;
            }
          }
          return false;
        }
        function cfb_gc(cfb) {
          rebuild_cfb(cfb, true);
        }
        exports2.find = find;
        exports2.read = read;
        exports2.parse = parse;
        exports2.write = write;
        exports2.writeFile = write_file;
        exports2.utils = {
          cfb_new,
          cfb_add,
          cfb_del,
          cfb_mov,
          cfb_gc,
          ReadShift,
          CheckField,
          prep_blob,
          bconcat,
          use_zlib,
          _deflateRaw: _deflate,
          _inflateRaw: _inflate,
          consts
        };
        return exports2;
      })();
      if (typeof __require !== "undefined" && typeof module !== "undefined" && typeof DO_NOT_EXPORT_CFB === "undefined") {
        module.exports = CFB2;
      }
    }
  });

  // <stdin>
  var stdin_exports = {};
  __export(stdin_exports, {
    CFB: () => CFB
  });
  var CFB = __toESM(require_cfb());
  return __toCommonJS(stdin_exports);
})();
/*! Bundled license information:

cfb/cfb.js:
  (*! crc32.js (C) 2014-present SheetJS -- http://sheetjs.com *)
*/
