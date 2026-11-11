var LocalX509 = (() => {
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

  // node_modules/reflect-metadata/Reflect.js
  var require_Reflect = __commonJS({
    "node_modules/reflect-metadata/Reflect.js"() {
      var Reflect2;
      (function(Reflect3) {
        (function(factory) {
          var root = typeof globalThis === "object" ? globalThis : typeof global === "object" ? global : typeof self === "object" ? self : typeof this === "object" ? this : sloppyModeThis();
          var exporter = makeExporter(Reflect3);
          if (typeof root.Reflect !== "undefined") {
            exporter = makeExporter(root.Reflect, exporter);
          }
          factory(exporter, root);
          if (typeof root.Reflect === "undefined") {
            root.Reflect = Reflect3;
          }
          function makeExporter(target, previous) {
            return function(key, value) {
              Object.defineProperty(target, key, { configurable: true, writable: true, value });
              if (previous)
                previous(key, value);
            };
          }
          function functionThis() {
            try {
              return Function("return this;")();
            } catch (_) {
            }
          }
          function indirectEvalThis() {
            try {
              return (void 0, eval)("(function() { return this; })()");
            } catch (_) {
            }
          }
          function sloppyModeThis() {
            return functionThis() || indirectEvalThis();
          }
        })(function(exporter, root) {
          var hasOwn = Object.prototype.hasOwnProperty;
          var supportsSymbol = typeof Symbol === "function";
          var toPrimitiveSymbol = supportsSymbol && typeof Symbol.toPrimitive !== "undefined" ? Symbol.toPrimitive : "@@toPrimitive";
          var iteratorSymbol = supportsSymbol && typeof Symbol.iterator !== "undefined" ? Symbol.iterator : "@@iterator";
          var supportsCreate = typeof Object.create === "function";
          var supportsProto = { __proto__: [] } instanceof Array;
          var downLevel = !supportsCreate && !supportsProto;
          var HashMap = {
            // create an object in dictionary mode (a.k.a. "slow" mode in v8)
            create: supportsCreate ? function() {
              return MakeDictionary(/* @__PURE__ */ Object.create(null));
            } : supportsProto ? function() {
              return MakeDictionary({ __proto__: null });
            } : function() {
              return MakeDictionary({});
            },
            has: downLevel ? function(map, key) {
              return hasOwn.call(map, key);
            } : function(map, key) {
              return key in map;
            },
            get: downLevel ? function(map, key) {
              return hasOwn.call(map, key) ? map[key] : void 0;
            } : function(map, key) {
              return map[key];
            }
          };
          var functionPrototype = Object.getPrototypeOf(Function);
          var _Map = typeof Map === "function" && typeof Map.prototype.entries === "function" ? Map : CreateMapPolyfill();
          var _Set = typeof Set === "function" && typeof Set.prototype.entries === "function" ? Set : CreateSetPolyfill();
          var _WeakMap = typeof WeakMap === "function" ? WeakMap : CreateWeakMapPolyfill();
          var registrySymbol = supportsSymbol ? /* @__PURE__ */ Symbol.for("@reflect-metadata:registry") : void 0;
          var metadataRegistry = GetOrCreateMetadataRegistry();
          var metadataProvider = CreateMetadataProvider(metadataRegistry);
          function decorate(decorators, target, propertyKey, attributes) {
            if (!IsUndefined(propertyKey)) {
              if (!IsArray(decorators))
                throw new TypeError();
              if (!IsObject(target))
                throw new TypeError();
              if (!IsObject(attributes) && !IsUndefined(attributes) && !IsNull(attributes))
                throw new TypeError();
              if (IsNull(attributes))
                attributes = void 0;
              propertyKey = ToPropertyKey(propertyKey);
              return DecorateProperty(decorators, target, propertyKey, attributes);
            } else {
              if (!IsArray(decorators))
                throw new TypeError();
              if (!IsConstructor(target))
                throw new TypeError();
              return DecorateConstructor(decorators, target);
            }
          }
          exporter("decorate", decorate);
          function metadata(metadataKey, metadataValue) {
            function decorator(target, propertyKey) {
              if (!IsObject(target))
                throw new TypeError();
              if (!IsUndefined(propertyKey) && !IsPropertyKey(propertyKey))
                throw new TypeError();
              OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
            }
            return decorator;
          }
          exporter("metadata", metadata);
          function defineMetadata(metadataKey, metadataValue, target, propertyKey) {
            if (!IsObject(target))
              throw new TypeError();
            if (!IsUndefined(propertyKey))
              propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
          }
          exporter("defineMetadata", defineMetadata);
          function hasMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
              throw new TypeError();
            if (!IsUndefined(propertyKey))
              propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryHasMetadata(metadataKey, target, propertyKey);
          }
          exporter("hasMetadata", hasMetadata);
          function hasOwnMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
              throw new TypeError();
            if (!IsUndefined(propertyKey))
              propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryHasOwnMetadata(metadataKey, target, propertyKey);
          }
          exporter("hasOwnMetadata", hasOwnMetadata);
          function getMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
              throw new TypeError();
            if (!IsUndefined(propertyKey))
              propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryGetMetadata(metadataKey, target, propertyKey);
          }
          exporter("getMetadata", getMetadata);
          function getOwnMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
              throw new TypeError();
            if (!IsUndefined(propertyKey))
              propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryGetOwnMetadata(metadataKey, target, propertyKey);
          }
          exporter("getOwnMetadata", getOwnMetadata);
          function getMetadataKeys(target, propertyKey) {
            if (!IsObject(target))
              throw new TypeError();
            if (!IsUndefined(propertyKey))
              propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryMetadataKeys(target, propertyKey);
          }
          exporter("getMetadataKeys", getMetadataKeys);
          function getOwnMetadataKeys(target, propertyKey) {
            if (!IsObject(target))
              throw new TypeError();
            if (!IsUndefined(propertyKey))
              propertyKey = ToPropertyKey(propertyKey);
            return OrdinaryOwnMetadataKeys(target, propertyKey);
          }
          exporter("getOwnMetadataKeys", getOwnMetadataKeys);
          function deleteMetadata(metadataKey, target, propertyKey) {
            if (!IsObject(target))
              throw new TypeError();
            if (!IsUndefined(propertyKey))
              propertyKey = ToPropertyKey(propertyKey);
            if (!IsObject(target))
              throw new TypeError();
            if (!IsUndefined(propertyKey))
              propertyKey = ToPropertyKey(propertyKey);
            var provider = GetMetadataProvider(
              target,
              propertyKey,
              /*Create*/
              false
            );
            if (IsUndefined(provider))
              return false;
            return provider.OrdinaryDeleteMetadata(metadataKey, target, propertyKey);
          }
          exporter("deleteMetadata", deleteMetadata);
          function DecorateConstructor(decorators, target) {
            for (var i = decorators.length - 1; i >= 0; --i) {
              var decorator = decorators[i];
              var decorated = decorator(target);
              if (!IsUndefined(decorated) && !IsNull(decorated)) {
                if (!IsConstructor(decorated))
                  throw new TypeError();
                target = decorated;
              }
            }
            return target;
          }
          function DecorateProperty(decorators, target, propertyKey, descriptor) {
            for (var i = decorators.length - 1; i >= 0; --i) {
              var decorator = decorators[i];
              var decorated = decorator(target, propertyKey, descriptor);
              if (!IsUndefined(decorated) && !IsNull(decorated)) {
                if (!IsObject(decorated))
                  throw new TypeError();
                descriptor = decorated;
              }
            }
            return descriptor;
          }
          function OrdinaryHasMetadata(MetadataKey, O, P) {
            var hasOwn2 = OrdinaryHasOwnMetadata(MetadataKey, O, P);
            if (hasOwn2)
              return true;
            var parent = OrdinaryGetPrototypeOf(O);
            if (!IsNull(parent))
              return OrdinaryHasMetadata(MetadataKey, parent, P);
            return false;
          }
          function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
            var provider = GetMetadataProvider(
              O,
              P,
              /*Create*/
              false
            );
            if (IsUndefined(provider))
              return false;
            return ToBoolean(provider.OrdinaryHasOwnMetadata(MetadataKey, O, P));
          }
          function OrdinaryGetMetadata(MetadataKey, O, P) {
            var hasOwn2 = OrdinaryHasOwnMetadata(MetadataKey, O, P);
            if (hasOwn2)
              return OrdinaryGetOwnMetadata(MetadataKey, O, P);
            var parent = OrdinaryGetPrototypeOf(O);
            if (!IsNull(parent))
              return OrdinaryGetMetadata(MetadataKey, parent, P);
            return void 0;
          }
          function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
            var provider = GetMetadataProvider(
              O,
              P,
              /*Create*/
              false
            );
            if (IsUndefined(provider))
              return;
            return provider.OrdinaryGetOwnMetadata(MetadataKey, O, P);
          }
          function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
            var provider = GetMetadataProvider(
              O,
              P,
              /*Create*/
              true
            );
            provider.OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P);
          }
          function OrdinaryMetadataKeys(O, P) {
            var ownKeys = OrdinaryOwnMetadataKeys(O, P);
            var parent = OrdinaryGetPrototypeOf(O);
            if (parent === null)
              return ownKeys;
            var parentKeys = OrdinaryMetadataKeys(parent, P);
            if (parentKeys.length <= 0)
              return ownKeys;
            if (ownKeys.length <= 0)
              return parentKeys;
            var set = new _Set();
            var keys = [];
            for (var _i = 0, ownKeys_1 = ownKeys; _i < ownKeys_1.length; _i++) {
              var key = ownKeys_1[_i];
              var hasKey = set.has(key);
              if (!hasKey) {
                set.add(key);
                keys.push(key);
              }
            }
            for (var _a = 0, parentKeys_1 = parentKeys; _a < parentKeys_1.length; _a++) {
              var key = parentKeys_1[_a];
              var hasKey = set.has(key);
              if (!hasKey) {
                set.add(key);
                keys.push(key);
              }
            }
            return keys;
          }
          function OrdinaryOwnMetadataKeys(O, P) {
            var provider = GetMetadataProvider(
              O,
              P,
              /*create*/
              false
            );
            if (!provider) {
              return [];
            }
            return provider.OrdinaryOwnMetadataKeys(O, P);
          }
          function Type(x) {
            if (x === null)
              return 1;
            switch (typeof x) {
              case "undefined":
                return 0;
              case "boolean":
                return 2;
              case "string":
                return 3;
              case "symbol":
                return 4;
              case "number":
                return 5;
              case "object":
                return x === null ? 1 : 6;
              default:
                return 6;
            }
          }
          function IsUndefined(x) {
            return x === void 0;
          }
          function IsNull(x) {
            return x === null;
          }
          function IsSymbol(x) {
            return typeof x === "symbol";
          }
          function IsObject(x) {
            return typeof x === "object" ? x !== null : typeof x === "function";
          }
          function ToPrimitive(input, PreferredType) {
            switch (Type(input)) {
              case 0:
                return input;
              case 1:
                return input;
              case 2:
                return input;
              case 3:
                return input;
              case 4:
                return input;
              case 5:
                return input;
            }
            var hint = PreferredType === 3 ? "string" : PreferredType === 5 ? "number" : "default";
            var exoticToPrim = GetMethod(input, toPrimitiveSymbol);
            if (exoticToPrim !== void 0) {
              var result = exoticToPrim.call(input, hint);
              if (IsObject(result))
                throw new TypeError();
              return result;
            }
            return OrdinaryToPrimitive(input, hint === "default" ? "number" : hint);
          }
          function OrdinaryToPrimitive(O, hint) {
            if (hint === "string") {
              var toString_1 = O.toString;
              if (IsCallable(toString_1)) {
                var result = toString_1.call(O);
                if (!IsObject(result))
                  return result;
              }
              var valueOf = O.valueOf;
              if (IsCallable(valueOf)) {
                var result = valueOf.call(O);
                if (!IsObject(result))
                  return result;
              }
            } else {
              var valueOf = O.valueOf;
              if (IsCallable(valueOf)) {
                var result = valueOf.call(O);
                if (!IsObject(result))
                  return result;
              }
              var toString_2 = O.toString;
              if (IsCallable(toString_2)) {
                var result = toString_2.call(O);
                if (!IsObject(result))
                  return result;
              }
            }
            throw new TypeError();
          }
          function ToBoolean(argument) {
            return !!argument;
          }
          function ToString(argument) {
            return "" + argument;
          }
          function ToPropertyKey(argument) {
            var key = ToPrimitive(
              argument,
              3
              /* String */
            );
            if (IsSymbol(key))
              return key;
            return ToString(key);
          }
          function IsArray(argument) {
            return Array.isArray ? Array.isArray(argument) : argument instanceof Object ? argument instanceof Array : Object.prototype.toString.call(argument) === "[object Array]";
          }
          function IsCallable(argument) {
            return typeof argument === "function";
          }
          function IsConstructor(argument) {
            return typeof argument === "function";
          }
          function IsPropertyKey(argument) {
            switch (Type(argument)) {
              case 3:
                return true;
              case 4:
                return true;
              default:
                return false;
            }
          }
          function SameValueZero(x, y) {
            return x === y || x !== x && y !== y;
          }
          function GetMethod(V, P) {
            var func = V[P];
            if (func === void 0 || func === null)
              return void 0;
            if (!IsCallable(func))
              throw new TypeError();
            return func;
          }
          function GetIterator(obj) {
            var method = GetMethod(obj, iteratorSymbol);
            if (!IsCallable(method))
              throw new TypeError();
            var iterator = method.call(obj);
            if (!IsObject(iterator))
              throw new TypeError();
            return iterator;
          }
          function IteratorValue(iterResult) {
            return iterResult.value;
          }
          function IteratorStep(iterator) {
            var result = iterator.next();
            return result.done ? false : result;
          }
          function IteratorClose(iterator) {
            var f = iterator["return"];
            if (f)
              f.call(iterator);
          }
          function OrdinaryGetPrototypeOf(O) {
            var proto = Object.getPrototypeOf(O);
            if (typeof O !== "function" || O === functionPrototype)
              return proto;
            if (proto !== functionPrototype)
              return proto;
            var prototype = O.prototype;
            var prototypeProto = prototype && Object.getPrototypeOf(prototype);
            if (prototypeProto == null || prototypeProto === Object.prototype)
              return proto;
            var constructor = prototypeProto.constructor;
            if (typeof constructor !== "function")
              return proto;
            if (constructor === O)
              return proto;
            return constructor;
          }
          function CreateMetadataRegistry() {
            var fallback;
            if (!IsUndefined(registrySymbol) && typeof root.Reflect !== "undefined" && !(registrySymbol in root.Reflect) && typeof root.Reflect.defineMetadata === "function") {
              fallback = CreateFallbackProvider(root.Reflect);
            }
            var first;
            var second;
            var rest;
            var targetProviderMap = new _WeakMap();
            var registry = {
              registerProvider,
              getProvider,
              setProvider
            };
            return registry;
            function registerProvider(provider) {
              if (!Object.isExtensible(registry)) {
                throw new Error("Cannot add provider to a frozen registry.");
              }
              switch (true) {
                case fallback === provider:
                  break;
                case IsUndefined(first):
                  first = provider;
                  break;
                case first === provider:
                  break;
                case IsUndefined(second):
                  second = provider;
                  break;
                case second === provider:
                  break;
                default:
                  if (rest === void 0)
                    rest = new _Set();
                  rest.add(provider);
                  break;
              }
            }
            function getProviderNoCache(O, P) {
              if (!IsUndefined(first)) {
                if (first.isProviderFor(O, P))
                  return first;
                if (!IsUndefined(second)) {
                  if (second.isProviderFor(O, P))
                    return first;
                  if (!IsUndefined(rest)) {
                    var iterator = GetIterator(rest);
                    while (true) {
                      var next = IteratorStep(iterator);
                      if (!next) {
                        return void 0;
                      }
                      var provider = IteratorValue(next);
                      if (provider.isProviderFor(O, P)) {
                        IteratorClose(iterator);
                        return provider;
                      }
                    }
                  }
                }
              }
              if (!IsUndefined(fallback) && fallback.isProviderFor(O, P)) {
                return fallback;
              }
              return void 0;
            }
            function getProvider(O, P) {
              var providerMap = targetProviderMap.get(O);
              var provider;
              if (!IsUndefined(providerMap)) {
                provider = providerMap.get(P);
              }
              if (!IsUndefined(provider)) {
                return provider;
              }
              provider = getProviderNoCache(O, P);
              if (!IsUndefined(provider)) {
                if (IsUndefined(providerMap)) {
                  providerMap = new _Map();
                  targetProviderMap.set(O, providerMap);
                }
                providerMap.set(P, provider);
              }
              return provider;
            }
            function hasProvider(provider) {
              if (IsUndefined(provider))
                throw new TypeError();
              return first === provider || second === provider || !IsUndefined(rest) && rest.has(provider);
            }
            function setProvider(O, P, provider) {
              if (!hasProvider(provider)) {
                throw new Error("Metadata provider not registered.");
              }
              var existingProvider = getProvider(O, P);
              if (existingProvider !== provider) {
                if (!IsUndefined(existingProvider)) {
                  return false;
                }
                var providerMap = targetProviderMap.get(O);
                if (IsUndefined(providerMap)) {
                  providerMap = new _Map();
                  targetProviderMap.set(O, providerMap);
                }
                providerMap.set(P, provider);
              }
              return true;
            }
          }
          function GetOrCreateMetadataRegistry() {
            var metadataRegistry2;
            if (!IsUndefined(registrySymbol) && IsObject(root.Reflect) && Object.isExtensible(root.Reflect)) {
              metadataRegistry2 = root.Reflect[registrySymbol];
            }
            if (IsUndefined(metadataRegistry2)) {
              metadataRegistry2 = CreateMetadataRegistry();
            }
            if (!IsUndefined(registrySymbol) && IsObject(root.Reflect) && Object.isExtensible(root.Reflect)) {
              Object.defineProperty(root.Reflect, registrySymbol, {
                enumerable: false,
                configurable: false,
                writable: false,
                value: metadataRegistry2
              });
            }
            return metadataRegistry2;
          }
          function CreateMetadataProvider(registry) {
            var metadata2 = new _WeakMap();
            var provider = {
              isProviderFor: function(O, P) {
                var targetMetadata = metadata2.get(O);
                if (IsUndefined(targetMetadata))
                  return false;
                return targetMetadata.has(P);
              },
              OrdinaryDefineOwnMetadata: OrdinaryDefineOwnMetadata2,
              OrdinaryHasOwnMetadata: OrdinaryHasOwnMetadata2,
              OrdinaryGetOwnMetadata: OrdinaryGetOwnMetadata2,
              OrdinaryOwnMetadataKeys: OrdinaryOwnMetadataKeys2,
              OrdinaryDeleteMetadata
            };
            metadataRegistry.registerProvider(provider);
            return provider;
            function GetOrCreateMetadataMap(O, P, Create) {
              var targetMetadata = metadata2.get(O);
              var createdTargetMetadata = false;
              if (IsUndefined(targetMetadata)) {
                if (!Create)
                  return void 0;
                targetMetadata = new _Map();
                metadata2.set(O, targetMetadata);
                createdTargetMetadata = true;
              }
              var metadataMap = targetMetadata.get(P);
              if (IsUndefined(metadataMap)) {
                if (!Create)
                  return void 0;
                metadataMap = new _Map();
                targetMetadata.set(P, metadataMap);
                if (!registry.setProvider(O, P, provider)) {
                  targetMetadata.delete(P);
                  if (createdTargetMetadata) {
                    metadata2.delete(O);
                  }
                  throw new Error("Wrong provider for target.");
                }
              }
              return metadataMap;
            }
            function OrdinaryHasOwnMetadata2(MetadataKey, O, P) {
              var metadataMap = GetOrCreateMetadataMap(
                O,
                P,
                /*Create*/
                false
              );
              if (IsUndefined(metadataMap))
                return false;
              return ToBoolean(metadataMap.has(MetadataKey));
            }
            function OrdinaryGetOwnMetadata2(MetadataKey, O, P) {
              var metadataMap = GetOrCreateMetadataMap(
                O,
                P,
                /*Create*/
                false
              );
              if (IsUndefined(metadataMap))
                return void 0;
              return metadataMap.get(MetadataKey);
            }
            function OrdinaryDefineOwnMetadata2(MetadataKey, MetadataValue, O, P) {
              var metadataMap = GetOrCreateMetadataMap(
                O,
                P,
                /*Create*/
                true
              );
              metadataMap.set(MetadataKey, MetadataValue);
            }
            function OrdinaryOwnMetadataKeys2(O, P) {
              var keys = [];
              var metadataMap = GetOrCreateMetadataMap(
                O,
                P,
                /*Create*/
                false
              );
              if (IsUndefined(metadataMap))
                return keys;
              var keysObj = metadataMap.keys();
              var iterator = GetIterator(keysObj);
              var k = 0;
              while (true) {
                var next = IteratorStep(iterator);
                if (!next) {
                  keys.length = k;
                  return keys;
                }
                var nextValue = IteratorValue(next);
                try {
                  keys[k] = nextValue;
                } catch (e) {
                  try {
                    IteratorClose(iterator);
                  } finally {
                    throw e;
                  }
                }
                k++;
              }
            }
            function OrdinaryDeleteMetadata(MetadataKey, O, P) {
              var metadataMap = GetOrCreateMetadataMap(
                O,
                P,
                /*Create*/
                false
              );
              if (IsUndefined(metadataMap))
                return false;
              if (!metadataMap.delete(MetadataKey))
                return false;
              if (metadataMap.size === 0) {
                var targetMetadata = metadata2.get(O);
                if (!IsUndefined(targetMetadata)) {
                  targetMetadata.delete(P);
                  if (targetMetadata.size === 0) {
                    metadata2.delete(targetMetadata);
                  }
                }
              }
              return true;
            }
          }
          function CreateFallbackProvider(reflect) {
            var defineMetadata2 = reflect.defineMetadata, hasOwnMetadata2 = reflect.hasOwnMetadata, getOwnMetadata2 = reflect.getOwnMetadata, getOwnMetadataKeys2 = reflect.getOwnMetadataKeys, deleteMetadata2 = reflect.deleteMetadata;
            var metadataOwner = new _WeakMap();
            var provider = {
              isProviderFor: function(O, P) {
                var metadataPropertySet = metadataOwner.get(O);
                if (!IsUndefined(metadataPropertySet) && metadataPropertySet.has(P)) {
                  return true;
                }
                if (getOwnMetadataKeys2(O, P).length) {
                  if (IsUndefined(metadataPropertySet)) {
                    metadataPropertySet = new _Set();
                    metadataOwner.set(O, metadataPropertySet);
                  }
                  metadataPropertySet.add(P);
                  return true;
                }
                return false;
              },
              OrdinaryDefineOwnMetadata: defineMetadata2,
              OrdinaryHasOwnMetadata: hasOwnMetadata2,
              OrdinaryGetOwnMetadata: getOwnMetadata2,
              OrdinaryOwnMetadataKeys: getOwnMetadataKeys2,
              OrdinaryDeleteMetadata: deleteMetadata2
            };
            return provider;
          }
          function GetMetadataProvider(O, P, Create) {
            var registeredProvider = metadataRegistry.getProvider(O, P);
            if (!IsUndefined(registeredProvider)) {
              return registeredProvider;
            }
            if (Create) {
              if (metadataRegistry.setProvider(O, P, metadataProvider)) {
                return metadataProvider;
              }
              throw new Error("Illegal state.");
            }
            return void 0;
          }
          function CreateMapPolyfill() {
            var cacheSentinel = {};
            var arraySentinel = [];
            var MapIterator = (
              /** @class */
              (function() {
                function MapIterator2(keys, values, selector) {
                  this._index = 0;
                  this._keys = keys;
                  this._values = values;
                  this._selector = selector;
                }
                MapIterator2.prototype["@@iterator"] = function() {
                  return this;
                };
                MapIterator2.prototype[iteratorSymbol] = function() {
                  return this;
                };
                MapIterator2.prototype.next = function() {
                  var index = this._index;
                  if (index >= 0 && index < this._keys.length) {
                    var result = this._selector(this._keys[index], this._values[index]);
                    if (index + 1 >= this._keys.length) {
                      this._index = -1;
                      this._keys = arraySentinel;
                      this._values = arraySentinel;
                    } else {
                      this._index++;
                    }
                    return { value: result, done: false };
                  }
                  return { value: void 0, done: true };
                };
                MapIterator2.prototype.throw = function(error) {
                  if (this._index >= 0) {
                    this._index = -1;
                    this._keys = arraySentinel;
                    this._values = arraySentinel;
                  }
                  throw error;
                };
                MapIterator2.prototype.return = function(value) {
                  if (this._index >= 0) {
                    this._index = -1;
                    this._keys = arraySentinel;
                    this._values = arraySentinel;
                  }
                  return { value, done: true };
                };
                return MapIterator2;
              })()
            );
            var Map2 = (
              /** @class */
              (function() {
                function Map3() {
                  this._keys = [];
                  this._values = [];
                  this._cacheKey = cacheSentinel;
                  this._cacheIndex = -2;
                }
                Object.defineProperty(Map3.prototype, "size", {
                  get: function() {
                    return this._keys.length;
                  },
                  enumerable: true,
                  configurable: true
                });
                Map3.prototype.has = function(key) {
                  return this._find(
                    key,
                    /*insert*/
                    false
                  ) >= 0;
                };
                Map3.prototype.get = function(key) {
                  var index = this._find(
                    key,
                    /*insert*/
                    false
                  );
                  return index >= 0 ? this._values[index] : void 0;
                };
                Map3.prototype.set = function(key, value) {
                  var index = this._find(
                    key,
                    /*insert*/
                    true
                  );
                  this._values[index] = value;
                  return this;
                };
                Map3.prototype.delete = function(key) {
                  var index = this._find(
                    key,
                    /*insert*/
                    false
                  );
                  if (index >= 0) {
                    var size = this._keys.length;
                    for (var i = index + 1; i < size; i++) {
                      this._keys[i - 1] = this._keys[i];
                      this._values[i - 1] = this._values[i];
                    }
                    this._keys.length--;
                    this._values.length--;
                    if (SameValueZero(key, this._cacheKey)) {
                      this._cacheKey = cacheSentinel;
                      this._cacheIndex = -2;
                    }
                    return true;
                  }
                  return false;
                };
                Map3.prototype.clear = function() {
                  this._keys.length = 0;
                  this._values.length = 0;
                  this._cacheKey = cacheSentinel;
                  this._cacheIndex = -2;
                };
                Map3.prototype.keys = function() {
                  return new MapIterator(this._keys, this._values, getKey);
                };
                Map3.prototype.values = function() {
                  return new MapIterator(this._keys, this._values, getValue);
                };
                Map3.prototype.entries = function() {
                  return new MapIterator(this._keys, this._values, getEntry);
                };
                Map3.prototype["@@iterator"] = function() {
                  return this.entries();
                };
                Map3.prototype[iteratorSymbol] = function() {
                  return this.entries();
                };
                Map3.prototype._find = function(key, insert) {
                  if (!SameValueZero(this._cacheKey, key)) {
                    this._cacheIndex = -1;
                    for (var i = 0; i < this._keys.length; i++) {
                      if (SameValueZero(this._keys[i], key)) {
                        this._cacheIndex = i;
                        break;
                      }
                    }
                  }
                  if (this._cacheIndex < 0 && insert) {
                    this._cacheIndex = this._keys.length;
                    this._keys.push(key);
                    this._values.push(void 0);
                  }
                  return this._cacheIndex;
                };
                return Map3;
              })()
            );
            return Map2;
            function getKey(key, _) {
              return key;
            }
            function getValue(_, value) {
              return value;
            }
            function getEntry(key, value) {
              return [key, value];
            }
          }
          function CreateSetPolyfill() {
            var Set3 = (
              /** @class */
              (function() {
                function Set4() {
                  this._map = new _Map();
                }
                Object.defineProperty(Set4.prototype, "size", {
                  get: function() {
                    return this._map.size;
                  },
                  enumerable: true,
                  configurable: true
                });
                Set4.prototype.has = function(value) {
                  return this._map.has(value);
                };
                Set4.prototype.add = function(value) {
                  return this._map.set(value, value), this;
                };
                Set4.prototype.delete = function(value) {
                  return this._map.delete(value);
                };
                Set4.prototype.clear = function() {
                  this._map.clear();
                };
                Set4.prototype.keys = function() {
                  return this._map.keys();
                };
                Set4.prototype.values = function() {
                  return this._map.keys();
                };
                Set4.prototype.entries = function() {
                  return this._map.entries();
                };
                Set4.prototype["@@iterator"] = function() {
                  return this.keys();
                };
                Set4.prototype[iteratorSymbol] = function() {
                  return this.keys();
                };
                return Set4;
              })()
            );
            return Set3;
          }
          function CreateWeakMapPolyfill() {
            var UUID_SIZE = 16;
            var keys = HashMap.create();
            var rootKey = CreateUniqueKey();
            return (
              /** @class */
              (function() {
                function WeakMap2() {
                  this._key = CreateUniqueKey();
                }
                WeakMap2.prototype.has = function(target) {
                  var table = GetOrCreateWeakMapTable(
                    target,
                    /*create*/
                    false
                  );
                  return table !== void 0 ? HashMap.has(table, this._key) : false;
                };
                WeakMap2.prototype.get = function(target) {
                  var table = GetOrCreateWeakMapTable(
                    target,
                    /*create*/
                    false
                  );
                  return table !== void 0 ? HashMap.get(table, this._key) : void 0;
                };
                WeakMap2.prototype.set = function(target, value) {
                  var table = GetOrCreateWeakMapTable(
                    target,
                    /*create*/
                    true
                  );
                  table[this._key] = value;
                  return this;
                };
                WeakMap2.prototype.delete = function(target) {
                  var table = GetOrCreateWeakMapTable(
                    target,
                    /*create*/
                    false
                  );
                  return table !== void 0 ? delete table[this._key] : false;
                };
                WeakMap2.prototype.clear = function() {
                  this._key = CreateUniqueKey();
                };
                return WeakMap2;
              })()
            );
            function CreateUniqueKey() {
              var key;
              do
                key = "@@WeakMap@@" + CreateUUID();
              while (HashMap.has(keys, key));
              keys[key] = true;
              return key;
            }
            function GetOrCreateWeakMapTable(target, create3) {
              if (!hasOwn.call(target, rootKey)) {
                if (!create3)
                  return void 0;
                Object.defineProperty(target, rootKey, { value: HashMap.create() });
              }
              return target[rootKey];
            }
            function FillRandomBytes(buffer, size) {
              for (var i = 0; i < size; ++i)
                buffer[i] = Math.random() * 255 | 0;
              return buffer;
            }
            function GenRandomBytes(size) {
              if (typeof Uint8Array === "function") {
                var array = new Uint8Array(size);
                if (typeof crypto !== "undefined") {
                  crypto.getRandomValues(array);
                } else if (typeof msCrypto !== "undefined") {
                  msCrypto.getRandomValues(array);
                } else {
                  FillRandomBytes(array, size);
                }
                return array;
              }
              return FillRandomBytes(new Array(size), size);
            }
            function CreateUUID() {
              var data = GenRandomBytes(UUID_SIZE);
              data[6] = data[6] & 79 | 64;
              data[8] = data[8] & 191 | 128;
              var result = "";
              for (var offset = 0; offset < UUID_SIZE; ++offset) {
                var byte = data[offset];
                if (offset === 4 || offset === 6 || offset === 8)
                  result += "-";
                if (byte < 16)
                  result += "0";
                result += byte.toString(16).toLowerCase();
              }
              return result;
            }
          }
          function MakeDictionary(obj) {
            obj.__ = void 0;
            delete obj.__;
            return obj;
          }
        });
      })(Reflect2 || (Reflect2 = {}));
    }
  });

  // <stdin>
  var stdin_exports = {};
  __export(stdin_exports, {
    X509Certificate: () => X509Certificate
  });
  var import_reflect_metadata = __toESM(require_Reflect());

  // node_modules/@peculiar/asn1-schema/build/enums.js
  var AsnTypeTypes = /* @__PURE__ */ (function(AsnTypeTypes2) {
    AsnTypeTypes2[AsnTypeTypes2["Sequence"] = 0] = "Sequence";
    AsnTypeTypes2[AsnTypeTypes2["Set"] = 1] = "Set";
    AsnTypeTypes2[AsnTypeTypes2["Choice"] = 2] = "Choice";
    return AsnTypeTypes2;
  })({});
  var AsnPropTypes = /* @__PURE__ */ (function(AsnPropTypes2) {
    AsnPropTypes2[AsnPropTypes2["Any"] = 1] = "Any";
    AsnPropTypes2[AsnPropTypes2["Boolean"] = 2] = "Boolean";
    AsnPropTypes2[AsnPropTypes2["OctetString"] = 3] = "OctetString";
    AsnPropTypes2[AsnPropTypes2["BitString"] = 4] = "BitString";
    AsnPropTypes2[AsnPropTypes2["Integer"] = 5] = "Integer";
    AsnPropTypes2[AsnPropTypes2["Enumerated"] = 6] = "Enumerated";
    AsnPropTypes2[AsnPropTypes2["ObjectIdentifier"] = 7] = "ObjectIdentifier";
    AsnPropTypes2[AsnPropTypes2["Utf8String"] = 8] = "Utf8String";
    AsnPropTypes2[AsnPropTypes2["BmpString"] = 9] = "BmpString";
    AsnPropTypes2[AsnPropTypes2["UniversalString"] = 10] = "UniversalString";
    AsnPropTypes2[AsnPropTypes2["NumericString"] = 11] = "NumericString";
    AsnPropTypes2[AsnPropTypes2["PrintableString"] = 12] = "PrintableString";
    AsnPropTypes2[AsnPropTypes2["TeletexString"] = 13] = "TeletexString";
    AsnPropTypes2[AsnPropTypes2["VideotexString"] = 14] = "VideotexString";
    AsnPropTypes2[AsnPropTypes2["IA5String"] = 15] = "IA5String";
    AsnPropTypes2[AsnPropTypes2["GraphicString"] = 16] = "GraphicString";
    AsnPropTypes2[AsnPropTypes2["VisibleString"] = 17] = "VisibleString";
    AsnPropTypes2[AsnPropTypes2["GeneralString"] = 18] = "GeneralString";
    AsnPropTypes2[AsnPropTypes2["CharacterString"] = 19] = "CharacterString";
    AsnPropTypes2[AsnPropTypes2["UTCTime"] = 20] = "UTCTime";
    AsnPropTypes2[AsnPropTypes2["GeneralizedTime"] = 21] = "GeneralizedTime";
    AsnPropTypes2[AsnPropTypes2["DATE"] = 22] = "DATE";
    AsnPropTypes2[AsnPropTypes2["TimeOfDay"] = 23] = "TimeOfDay";
    AsnPropTypes2[AsnPropTypes2["DateTime"] = 24] = "DateTime";
    AsnPropTypes2[AsnPropTypes2["Duration"] = 25] = "Duration";
    AsnPropTypes2[AsnPropTypes2["TIME"] = 26] = "TIME";
    AsnPropTypes2[AsnPropTypes2["Null"] = 27] = "Null";
    AsnPropTypes2[AsnPropTypes2["RelativeObjectIdentifier"] = 28] = "RelativeObjectIdentifier";
    return AsnPropTypes2;
  })({});

  // node_modules/asn1js/build/index.js
  var build_exports = {};
  __export(build_exports, {
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
    DEFAULT_MAX_CONTENT_LENGTH: () => DEFAULT_MAX_CONTENT_LENGTH,
    DEFAULT_MAX_DEPTH: () => DEFAULT_MAX_DEPTH,
    DEFAULT_MAX_NODES: () => DEFAULT_MAX_NODES,
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
    Set: () => Set2,
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

  // node_modules/@peculiar/utils/build/bytes/buffer-source.js
  var ARRAY_BUFFER_TAG = "[object ArrayBuffer]";
  var SHARED_ARRAY_BUFFER_TAG = "[object SharedArrayBuffer]";
  function tagOf(value) {
    return Object.prototype.toString.call(value);
  }
  function isDataViewConstructor(type) {
    return type === DataView || type.prototype instanceof DataView;
  }
  function bytesPerElement(type) {
    if (isDataViewConstructor(type)) return 1;
    return type.BYTES_PER_ELEMENT ?? 1;
  }
  function isArrayBufferViewLike(value) {
    if (ArrayBuffer.isView(value)) return true;
    if (!value || typeof value !== "object") return false;
    const view = value;
    return typeof view.byteOffset === "number" && typeof view.byteLength === "number" && isArrayBufferLike(view.buffer);
  }
  function copyBytes(data) {
    const view = toUint8Array(data);
    const copy2 = new Uint8Array(view.byteLength);
    copy2.set(view);
    return copy2;
  }
  function isArrayBuffer(value) {
    return tagOf(value) === ARRAY_BUFFER_TAG;
  }
  function isSharedArrayBuffer(value) {
    return typeof SharedArrayBuffer !== "undefined" && tagOf(value) === SHARED_ARRAY_BUFFER_TAG;
  }
  function isArrayBufferLike(value) {
    return isArrayBuffer(value) || isSharedArrayBuffer(value);
  }
  function isArrayBufferView(value) {
    return isArrayBufferViewLike(value);
  }
  function isBufferSource(value) {
    return isArrayBufferLike(value) || isArrayBufferView(value);
  }
  function assertBufferSource(value) {
    if (!isBufferSource(value)) throw new TypeError("Expected ArrayBuffer, SharedArrayBuffer, or ArrayBufferView");
  }
  function toUint8Array(data) {
    assertBufferSource(data);
    if (isArrayBufferLike(data)) return new Uint8Array(data);
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  function toUint8ArrayCopy(data) {
    return copyBytes(data);
  }
  function toArrayBuffer(data) {
    assertBufferSource(data);
    if (isArrayBuffer(data)) return data;
    const buffer = new ArrayBuffer(data.byteLength);
    new Uint8Array(buffer).set(toUint8Array(data));
    return buffer;
  }
  function toArrayBufferLike(data) {
    assertBufferSource(data);
    if (isArrayBufferLike(data)) return data;
    if (data.byteOffset === 0 && data.byteLength === data.buffer.byteLength) return data.buffer;
    return copyBytes(data).buffer;
  }
  function toView(data, type) {
    assertBufferSource(data);
    if (ArrayBuffer.isView(data) && data.constructor === type) return data;
    const view = toUint8Array(data);
    const elementSize = bytesPerElement(type);
    if (view.byteOffset % elementSize !== 0 || view.byteLength % elementSize !== 0) throw new RangeError(`Cannot create ${type.name} over unaligned byte range`);
    if (isDataViewConstructor(type)) return new type(view.buffer, view.byteOffset, view.byteLength);
    return new type(view.buffer, view.byteOffset, view.byteLength / elementSize);
  }
  function toViewCopy(data, type) {
    return toView(toUint8ArrayCopy(data), type);
  }

  // node_modules/@peculiar/utils/build/bytes/concat.js
  function concatToUint8Array(buffers) {
    const views = [];
    let length = 0;
    for (const buffer of buffers) {
      const view = toUint8Array(buffer);
      views.push(view);
      length += view.byteLength;
    }
    const result = new Uint8Array(length);
    let offset = 0;
    for (const view of views) {
      result.set(view, offset);
      offset += view.byteLength;
    }
    return result;
  }
  function concat(first, second, ...rest) {
    let buffers;
    let type;
    if (typeof second === "function") {
      buffers = Array.from(first);
      type = second;
    } else if (isBufferSource(first)) buffers = [
      first,
      second,
      ...rest
    ].filter(isBufferSource);
    else {
      buffers = Array.from(first);
      if (second) buffers.push(second);
      buffers.push(...rest);
    }
    const bytes = concatToUint8Array(buffers);
    return type ? toView(bytes, type) : bytes.buffer;
  }

  // node_modules/@peculiar/utils/build/bytes/equal.js
  function equal(a, b, options = {}) {
    const left = toUint8Array(a);
    const right = toUint8Array(b);
    if (!options.constantTime && left.byteLength !== right.byteLength) return false;
    const length = Math.max(left.byteLength, right.byteLength);
    let diff = left.byteLength ^ right.byteLength;
    for (let i = 0; i < length; i++) diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
    return diff === 0;
  }

  // node_modules/@peculiar/utils/build/bytes/sequence.js
  function clampIndex(value, fallback, length) {
    const normalized = Number.isFinite(value) ? Math.trunc(value) : fallback;
    if (normalized <= 0) return 0;
    if (normalized >= length) return length;
    return normalized;
  }
  function normalizeForwardRange(length, options) {
    const start = clampIndex(options?.start, 0, length);
    const end = clampIndex(options?.end, length, length);
    return end >= start ? [start, end] : [start, start];
  }
  function normalizeReverseRange(length, options) {
    const start = clampIndex(options?.start, length, length);
    const end = clampIndex(options?.end, 0, length);
    return start >= end ? [end, start] : [start, start];
  }
  function normalizeSliceIndex(value, fallback, length) {
    const normalized = Number.isFinite(value) ? Math.trunc(value) : fallback;
    if (normalized < 0) return Math.max(length + normalized, 0);
    if (normalized > length) return length;
    return normalized;
  }
  function encodeAscii(text) {
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 255;
    return bytes;
  }
  function encodeUtf8(text) {
    return new TextEncoder().encode(text);
  }
  function toPatternBytes(pattern, options) {
    if (typeof pattern === "string") return options?.encoding === "utf8" ? encodeUtf8(pattern) : encodeAscii(pattern);
    return toUint8Array(pattern);
  }
  function bytesEqualAt(data, pattern, offset) {
    for (let index = 0; index < pattern.byteLength; index++) if (data[offset + index] !== pattern[index]) return false;
    return true;
  }
  function indexOf(data, pattern, options) {
    const bytes = toUint8Array(data);
    const needle = toPatternBytes(pattern, options);
    const [start, end] = normalizeForwardRange(bytes.byteLength, options);
    if (needle.byteLength === 0) return start;
    const lastOffset = end - needle.byteLength;
    if (lastOffset < start) return -1;
    for (let offset = start; offset <= lastOffset; offset++) if (bytesEqualAt(bytes, needle, offset)) return offset;
    return -1;
  }
  function lastIndexOf(data, pattern, options) {
    const bytes = toUint8Array(data);
    const needle = toPatternBytes(pattern, options);
    const [end, start] = normalizeReverseRange(bytes.byteLength, options);
    if (needle.byteLength === 0) return start;
    const firstOffset = start - needle.byteLength;
    if (firstOffset < end) return -1;
    for (let offset = firstOffset; offset >= end; offset--) if (bytesEqualAt(bytes, needle, offset)) return offset;
    return -1;
  }
  function includes(data, pattern, options) {
    return indexOf(data, pattern, options) !== -1;
  }
  function startsWith(data, pattern, options) {
    const bytes = toUint8Array(data);
    const needle = toPatternBytes(pattern, options);
    if (needle.byteLength > bytes.byteLength) return false;
    return bytesEqualAt(bytes, needle, 0);
  }
  function endsWith(data, pattern, options) {
    const bytes = toUint8Array(data);
    const needle = toPatternBytes(pattern, options);
    if (needle.byteLength > bytes.byteLength) return false;
    return bytesEqualAt(bytes, needle, bytes.byteLength - needle.byteLength);
  }
  function slice(data, start, end) {
    const bytes = toUint8Array(data);
    const normalizedStart = normalizeSliceIndex(start, 0, bytes.byteLength);
    const normalizedEnd = normalizeSliceIndex(end, bytes.byteLength, bytes.byteLength);
    if (normalizedEnd <= normalizedStart) return bytes.subarray(normalizedStart, normalizedStart);
    return bytes.subarray(normalizedStart, normalizedEnd);
  }
  function tail(data, length) {
    const bytes = toUint8Array(data);
    const normalizedLength = Number.isFinite(length) ? Math.max(0, Math.trunc(length)) : 0;
    if (normalizedLength >= bytes.byteLength) return bytes;
    return bytes.subarray(bytes.byteLength - normalizedLength);
  }
  function copy(data) {
    return toUint8ArrayCopy(data);
  }
  function compare(a, b) {
    const left = toUint8Array(a);
    const right = toUint8Array(b);
    const limit = Math.min(left.byteLength, right.byteLength);
    for (let index = 0; index < limit; index++) {
      if (left[index] < right[index]) return -1;
      if (left[index] > right[index]) return 1;
    }
    if (left.byteLength < right.byteLength) return -1;
    if (left.byteLength > right.byteLength) return 1;
    return 0;
  }

  // node_modules/@peculiar/utils/build/_virtual/_rolldown/runtime.js
  var __defProp2 = Object.defineProperty;
  var __exportAll = (all, no_symbols) => {
    let target = {};
    for (var name in all) __defProp2(target, name, {
      get: all[name],
      enumerable: true
    });
    if (!no_symbols) __defProp2(target, Symbol.toStringTag, { value: "Module" });
    return target;
  };

  // node_modules/@peculiar/utils/build/bytes.js
  var bytes_exports = /* @__PURE__ */ __exportAll({
    assertBufferSource: () => assertBufferSource,
    compare: () => compare,
    concat: () => concat,
    concatToUint8Array: () => concatToUint8Array,
    copy: () => copy,
    endsWith: () => endsWith,
    equal: () => equal,
    includes: () => includes,
    indexOf: () => indexOf,
    isArrayBuffer: () => isArrayBuffer,
    isArrayBufferLike: () => isArrayBufferLike,
    isArrayBufferView: () => isArrayBufferView,
    isBufferSource: () => isBufferSource,
    isSharedArrayBuffer: () => isSharedArrayBuffer,
    lastIndexOf: () => lastIndexOf,
    slice: () => slice,
    startsWith: () => startsWith,
    tail: () => tail,
    toArrayBuffer: () => toArrayBuffer,
    toArrayBufferLike: () => toArrayBufferLike,
    toUint8Array: () => toUint8Array,
    toUint8ArrayCopy: () => toUint8ArrayCopy,
    toView: () => toView,
    toViewCopy: () => toViewCopy
  });

  // node_modules/@peculiar/utils/build/encoding/binary.js
  var binary_exports = /* @__PURE__ */ __exportAll({
    binary: () => binary,
    decode: () => decode,
    encode: () => encode,
    is: () => is
  });
  function encode(data) {
    const bytes = toUint8Array(data);
    let result = "";
    for (const byte of bytes) result += String.fromCharCode(byte);
    return result;
  }
  function decode(text) {
    const result = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) result[i] = text.charCodeAt(i) & 255;
    return result;
  }
  function is(text) {
    return typeof text === "string";
  }
  var binary = {
    encode,
    decode,
    is
  };

  // node_modules/@peculiar/utils/build/encoding/hex.js
  var hex_exports = /* @__PURE__ */ __exportAll({
    decode: () => decode2,
    encode: () => encode2,
    format: () => format,
    formats: () => formats,
    hex: () => hex,
    is: () => is2,
    normalize: () => normalize,
    parse: () => parse
  });
  var HEX_CHARACTER_REGEX = /^[0-9a-f]$/i;
  var COMMON_SEPARATORS = [
    " ",
    "	",
    "\n",
    "\r",
    ":",
    "-",
    "."
  ];
  function resolveSeparators(options) {
    if (options.separators === "none") return [];
    if (!options.separators || options.separators === "common") return COMMON_SEPARATORS;
    return options.separators;
  }
  function validateSeparator(separator) {
    if (!separator) throw new TypeError("Hex separators must be non-empty strings");
  }
  function matchSeparator(text, index, separators) {
    for (const separator of separators) if (text.startsWith(separator, index)) return separator;
  }
  function detectCase(text) {
    const hasUpper = /[A-F]/.test(text);
    const hasLower = /[a-f]/.test(text);
    return hasUpper && !hasLower ? "upper" : "lower";
  }
  function detectLineSeparator(text) {
    const match = /\r\n|\n/.exec(text);
    if (!match) return;
    return match[0] === "\r\n" ? "\r\n" : "\n";
  }
  function compactForDetection(text) {
    return text.replace(/[^0-9a-f]/gi, "");
  }
  function detectGroup(text) {
    const segments = text.match(/[0-9A-Fa-f]+|[^0-9A-Fa-f]+/g) ?? [];
    if (segments.length < 3) return;
    const hexSegments = segments.filter((_, index) => index % 2 === 0);
    const separators = segments.filter((_, index) => index % 2 === 1);
    const separator = separators[0];
    if (!separator || separators.some((item) => item !== separator)) return;
    if (hexSegments.some((segment) => segment.length === 0 || segment.length % 2 !== 0)) return;
    const firstLength = hexSegments[0]?.length ?? 0;
    if (!firstLength) return;
    if (hexSegments.slice(0, -1).some((segment) => segment.length !== firstLength)) return;
    if ((hexSegments[hexSegments.length - 1]?.length ?? 0) > firstLength) return;
    return {
      size: firstLength / 2,
      separator
    };
  }
  function detectFormat(text) {
    const trimmed = text.trim();
    const prefix = /^0x/i.test(trimmed) ? "0x" : "";
    const body = prefix ? trimmed.slice(2) : trimmed;
    const lineSeparator = detectLineSeparator(body);
    const lines = body.split(/\r\n|\n/).filter((line) => line.length > 0);
    const group = detectGroup(lines[0]?.trim() ?? "");
    const format2 = {
      case: detectCase(trimmed),
      prefix
    };
    if (group) format2.group = group;
    if (lineSeparator && lines.length > 1) {
      const firstLineBytes = compactForDetection(lines[0] ?? "").length / 2;
      if (firstLineBytes > 0 && lines.slice(0, -1).every((line) => compactForDetection(line).length / 2 === firstLineBytes)) format2.line = {
        bytesPerLine: firstLineBytes,
        separator: lineSeparator
      };
    }
    return format2;
  }
  function normalizeText(text, options) {
    const allowPrefix = options.allowPrefix ?? true;
    const separators = [...resolveSeparators(options)].sort((left, right) => right.length - left.length);
    for (const separator of separators) validateSeparator(separator);
    let working = text.trim();
    if (/^0x/i.test(working)) {
      if (!allowPrefix) throw new TypeError("Hexadecimal text must not include a 0x prefix");
      working = working.slice(2);
    }
    let normalized = "";
    let lastTokenWasSeparator = false;
    for (let index = 0; index < working.length; ) {
      const character = working[index] ?? "";
      if (HEX_CHARACTER_REGEX.test(character)) {
        normalized += character;
        lastTokenWasSeparator = false;
        index += 1;
        continue;
      }
      const separator = matchSeparator(working, index, separators);
      if (!separator) throw new TypeError("Input is not valid hexadecimal text");
      if (options.strict && (lastTokenWasSeparator || normalized.length === 0)) throw new TypeError("Hexadecimal text contains misplaced separators");
      lastTokenWasSeparator = true;
      index += separator.length;
    }
    if (options.strict && lastTokenWasSeparator && normalized.length > 0) throw new TypeError("Hexadecimal text must not end with a separator");
    if (normalized.length % 2 !== 0) {
      if (!options.allowOddLength) throw new TypeError("Hexadecimal text must contain an even number of characters");
      normalized = `0${normalized}`;
    }
    return normalized.toLowerCase();
  }
  function groupPairs(pairs, group) {
    if (!group) return pairs.join("");
    if (!Number.isInteger(group.size) || group.size < 1) throw new RangeError("Hex group size must be a positive integer");
    const chunks = [];
    for (let index = 0; index < pairs.length; index += group.size) chunks.push(pairs.slice(index, index + group.size).join(""));
    return chunks.join(group.separator);
  }
  function normalize(text, options = {}) {
    return normalizeText(text, options);
  }
  function is2(text, options = {}) {
    if (typeof text !== "string") return false;
    try {
      normalize(text, options);
      return true;
    } catch {
      return false;
    }
  }
  function encode2(data, options = {}) {
    const bytes = toUint8Array(data);
    const casing = options.case ?? "lower";
    const pairs = Array.from(bytes, (byte) => {
      const text = byte.toString(16).padStart(2, "0");
      return casing === "upper" ? text.toUpperCase() : text;
    });
    let body = "";
    if (options.line) {
      const bytesPerLine = options.line.bytesPerLine;
      if (!Number.isInteger(bytesPerLine) || bytesPerLine < 1) throw new RangeError("Hex bytesPerLine must be a positive integer");
      const separator = options.line.separator ?? "\n";
      const lines = [];
      for (let index = 0; index < pairs.length; index += bytesPerLine) lines.push(groupPairs(pairs.slice(index, index + bytesPerLine), options.group));
      body = lines.join(separator);
    } else body = groupPairs(pairs, options.group);
    return `${options.prefix ?? ""}${body}`;
  }
  function decode2(text, options = {}) {
    const normalized = normalize(text, options);
    const result = new Uint8Array(normalized.length / 2);
    for (let i = 0; i < normalized.length; i += 2) result[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
    return result;
  }
  function parse(text, options = {}) {
    const normalized = normalize(text, options);
    return {
      bytes: decode2(normalized),
      format: detectFormat(text),
      normalized
    };
  }
  function format(data, value) {
    return encode2(data, value);
  }
  var formats = {
    compact: Object.freeze({}),
    upper: Object.freeze({ case: "upper" }),
    colon: Object.freeze({ group: {
      size: 1,
      separator: ":"
    } }),
    colonUpper: Object.freeze({
      case: "upper",
      group: {
        size: 1,
        separator: ":"
      }
    }),
    groupsOf4: Object.freeze({ group: {
      size: 4,
      separator: " "
    } }),
    prefixed: Object.freeze({ prefix: "0x" })
  };
  var hex = {
    encode: encode2,
    decode: decode2,
    format,
    formats,
    is: is2,
    normalize,
    parse
  };

  // node_modules/@peculiar/utils/build/encoding/utf8.js
  var utf8_exports = /* @__PURE__ */ __exportAll({
    decode: () => decode3,
    encode: () => encode3,
    utf8: () => utf8
  });
  function encode3(text) {
    return new TextEncoder().encode(text);
  }
  function decode3(data) {
    return new TextDecoder("utf-8", { fatal: false }).decode(toUint8Array(data));
  }
  var utf8 = {
    encode: encode3,
    decode: decode3
  };

  // node_modules/@peculiar/utils/build/encoding/utf16.js
  var utf16_exports = /* @__PURE__ */ __exportAll({
    decode: () => decode4,
    encode: () => encode4,
    utf16: () => utf16
  });
  function encode4(text, options = {}) {
    const result = /* @__PURE__ */ new ArrayBuffer(text.length * 2);
    const view = new DataView(result);
    for (let i = 0; i < text.length; i++) view.setUint16(i * 2, text.charCodeAt(i), options.littleEndian ?? false);
    return new Uint8Array(result);
  }
  function decode4(data, options = {}) {
    const buffer = toArrayBuffer(data);
    const view = new DataView(buffer);
    let result = "";
    for (let i = 0; i < buffer.byteLength; i += 2) result += String.fromCharCode(view.getUint16(i, options.littleEndian ?? false));
    return result;
  }
  var utf16 = {
    encode: encode4,
    decode: decode4
  };

  // node_modules/@peculiar/utils/build/encoding/base64.js
  var base64_exports = /* @__PURE__ */ __exportAll({
    base64: () => base64,
    decode: () => decode5,
    encode: () => encode5,
    is: () => is3,
    normalize: () => normalize2,
    pad: () => pad
  });
  var BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  function nodeBuffer() {
    return globalThis.Buffer;
  }
  function normalize2(text) {
    return text.replace(/[\n\r\t ]/g, "");
  }
  function pad(text) {
    const remainder = text.length % 4;
    return remainder ? text + "=".repeat(4 - remainder) : text;
  }
  function is3(text) {
    if (typeof text !== "string") return false;
    const normalized = normalize2(text);
    return normalized === "" || BASE64_REGEX.test(normalized);
  }
  function encode5(data, _options) {
    const bytes = toUint8Array(data);
    const buffer = nodeBuffer();
    if (buffer) return buffer.from(bytes).toString("base64");
    return btoa(encode(bytes));
  }
  function decode5(text, _options) {
    const normalized = normalize2(text);
    if (!is3(normalized)) throw new TypeError("Input is not valid Base64 text");
    const buffer = nodeBuffer();
    if (buffer) return new Uint8Array(buffer.from(normalized, "base64"));
    return decode(atob(normalized));
  }
  var base64 = {
    encode: encode5,
    decode: decode5,
    is: is3,
    normalize: normalize2,
    pad
  };

  // node_modules/@peculiar/utils/build/encoding/base64url.js
  var base64url_exports = /* @__PURE__ */ __exportAll({
    base64url: () => base64url,
    decode: () => decode6,
    encode: () => encode6,
    is: () => is4,
    normalize: () => normalize3
  });
  var BASE64URL_REGEX = /^[A-Za-z0-9_-]*$/;
  var PADDED_BASE64URL_REGEX = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2}==|[A-Za-z0-9_-]{3}=)?$/;
  function normalize3(text) {
    return text.replace(/[\n\r\t ]/g, "");
  }
  function is4(text, options = {}) {
    if (typeof text !== "string") return false;
    const normalized = normalize3(text);
    return BASE64URL_REGEX.test(normalized) || !!options.allowPadding && PADDED_BASE64URL_REGEX.test(normalized);
  }
  function encode6(data, _options) {
    return base64.encode(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  function decode6(text, options = {}) {
    const normalized = normalize3(text);
    if (!is4(normalized, options)) throw new TypeError("Input is not valid Base64Url text");
    return base64.decode(base64.pad(normalized.replace(/=+$/, "").replace(/-/g, "+").replace(/_/g, "/")));
  }
  var base64url = {
    encode: encode6,
    decode: decode6,
    is: is4,
    normalize: normalize3
  };

  // node_modules/@peculiar/utils/build/integer/uint.js
  var uint_exports = /* @__PURE__ */ __exportAll({
    decode: () => decode7,
    decodeBigInt: () => decodeBigInt,
    encode: () => encode7,
    uint: () => uint
  });
  function resolveBits(bitsPerByte = 8) {
    if (!Number.isInteger(bitsPerByte) || bitsPerByte < 1 || bitsPerByte > 8) throw new RangeError("bitsPerByte must be an integer from 1 to 8");
    return bitsPerByte;
  }
  function pad2(digits, length) {
    if (length === void 0) return Uint8Array.from(digits);
    if (!Number.isInteger(length) || length < 0) throw new RangeError("length must be a non-negative integer");
    if (digits.length > length) throw new RangeError(`Value does not fit into ${length} byte(s)`);
    const result = new Uint8Array(length);
    result.set(digits, length - digits.length);
    return result;
  }
  function encode7(value, options = {}) {
    const bits = resolveBits(options.bitsPerByte);
    const digits = [];
    if (typeof value === "bigint") {
      if (value < 0n) throw new RangeError("Unsigned integer must not be negative");
      const shift = BigInt(bits);
      const mask = (1n << shift) - 1n;
      do {
        digits.push(Number(value & mask));
        value >>= shift;
      } while (value > 0n);
    } else {
      if (!Number.isSafeInteger(value) || value < 0) throw new RangeError("Unsigned integer must be a non-negative safe integer; use bigint for larger values");
      const radix = 2 ** bits;
      do {
        digits.push(value % radix);
        value = Math.floor(value / radix);
      } while (value > 0);
    }
    return pad2(digits.reverse(), options.length);
  }
  function decodeBigInt(data, options = {}) {
    const bits = resolveBits(options.bitsPerByte);
    const shift = BigInt(bits);
    const radix = 1 << bits;
    let result = 0n;
    for (const digit of toUint8Array(data)) {
      if (digit >= radix) throw new RangeError(`Byte 0x${digit.toString(16)} exceeds ${bits} bits`);
      result = result << shift | BigInt(digit);
    }
    return result;
  }
  function decode7(data, options = {}) {
    const bits = resolveBits(options.bitsPerByte);
    const radix = 2 ** bits;
    let result = 0;
    for (const digit of toUint8Array(data)) {
      if (digit >= radix) throw new RangeError(`Byte 0x${digit.toString(16)} exceeds ${bits} bits`);
      if (result > (Number.MAX_SAFE_INTEGER - digit) / radix) throw new RangeError("Value exceeds Number.MAX_SAFE_INTEGER; use decodeBigInt instead");
      result = result * radix + digit;
    }
    return result;
  }
  var uint = {
    encode: encode7,
    decode: decode7,
    decodeBigInt
  };

  // node_modules/@peculiar/utils/build/integer/int.js
  var int_exports = /* @__PURE__ */ __exportAll({
    decode: () => decode8,
    decodeBigInt: () => decodeBigInt2,
    encode: () => encode8,
    int: () => int,
    isMinimal: () => isMinimal
  });
  function toBigInt(value) {
    if (typeof value === "bigint") return value;
    if (!Number.isSafeInteger(value)) throw new RangeError("Integer must be a safe integer; use bigint for larger values");
    return BigInt(value);
  }
  function encode8(value, options = {}) {
    const integer = toBigInt(value);
    let size = 1;
    while (integer < -(1n << BigInt(size * 8 - 1)) || integer >= 1n << BigInt(size * 8 - 1)) size++;
    const length = options.length ?? size;
    if (!Number.isInteger(length) || length < 1) throw new RangeError("length must be a positive integer");
    if (size > length) throw new RangeError(`Value does not fit into ${length} byte(s)`);
    const unsigned = integer < 0n ? integer + (1n << BigInt(length * 8)) : integer;
    return encode7(unsigned, { length });
  }
  function decodeBigInt2(data) {
    const bytes = toUint8Array(data);
    if (!bytes.byteLength) throw new RangeError("Two's complement input must not be empty");
    const unsigned = decodeBigInt(bytes);
    return bytes[0] & 128 ? unsigned - (1n << BigInt(bytes.byteLength * 8)) : unsigned;
  }
  function decode8(data) {
    const value = decodeBigInt2(data);
    if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) throw new RangeError("Value is outside the safe integer range; use decodeBigInt instead");
    return Number(value);
  }
  function isMinimal(data) {
    const bytes = toUint8Array(data);
    if (bytes.byteLength < 2) return bytes.byteLength === 1;
    const redundantZero = bytes[0] === 0 && (bytes[1] & 128) === 0;
    const redundantOnes = bytes[0] === 255 && (bytes[1] & 128) !== 0;
    return !redundantZero && !redundantOnes;
  }
  var int = {
    encode: encode8,
    decode: decode8,
    decodeBigInt: decodeBigInt2,
    isMinimal
  };

  // node_modules/asn1js/build/index.js
  function concat2(buffers) {
    let outputLength = 0;
    let prevLength = 0;
    for (let i = 0; i < buffers.length; i++) {
      const buffer = buffers[i];
      outputLength += buffer.byteLength;
    }
    const retView = new Uint8Array(outputLength);
    for (let i = 0; i < buffers.length; i++) {
      const buffer = buffers[i];
      retView.set(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer), prevLength);
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
      this.items.push(buf instanceof ArrayBuffer ? buf : concat2([buf]));
    }
    final() {
      return concat2(this.items);
    }
  };
  var ORIGINAL_VIEW_WRITER_WRITE = ViewWriter.prototype.write;
  var ORIGINAL_VIEW_WRITER_FINAL = ViewWriter.prototype.final;
  var EMPTY_BUFFER = /* @__PURE__ */ new ArrayBuffer(0);
  var EMPTY_VIEW = /* @__PURE__ */ new Uint8Array(0);
  var END_OF_CONTENT_NAME = "EndOfContent";
  var OCTET_STRING_NAME = "OCTET STRING";
  var BIT_STRING_NAME = "BIT STRING";
  function HexBlock(BaseClass) {
    return class Some extends BaseClass {
      static {
        this.NAME = "hexBlock";
      }
      get valueHex() {
        return this.valueHexView.slice().buffer;
      }
      set valueHex(value) {
        this.valueHexView = new Uint8Array(value);
      }
      constructor(...args) {
        super(...args);
        const params = args[0] || {};
        this.isHexOnly = params.isHexOnly ?? false;
        this.valueHexView = params.valueHex ? toUint8Array(params.valueHex) : EMPTY_VIEW;
      }
      fromBER(inputBuffer, inputOffset, inputLength, _context) {
        const view = inputBuffer instanceof ArrayBuffer ? new Uint8Array(inputBuffer) : inputBuffer;
        if (!checkBufferParams(this, view, inputOffset, inputLength)) return -1;
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
        if (sizeOnly) return new ArrayBuffer(this.valueHexView.byteLength);
        if (this.valueHexView.buffer instanceof ArrayBuffer && this.valueHexView.byteLength === this.valueHexView.buffer.byteLength) return this.valueHexView.buffer;
        return toArrayBuffer(this.valueHexView);
      }
      toJSON() {
        return {
          ...super.toJSON(),
          isHexOnly: this.isHexOnly,
          valueHex: hex_exports.encode(this.valueHexView)
        };
      }
    };
  }
  var LocalBaseBlock = class {
    static {
      this.NAME = "baseBlock";
    }
    static blockName() {
      return this.NAME;
    }
    get valueBeforeDecode() {
      return this.valueBeforeDecodeView.slice().buffer;
    }
    set valueBeforeDecode(value) {
      this.valueBeforeDecodeView = new Uint8Array(value);
    }
    constructor({ blockLength = 0, error = "", warnings = [], valueBeforeDecode = EMPTY_VIEW } = {}) {
      this.blockLength = blockLength;
      this.error = error;
      this.warnings = warnings;
      this.valueBeforeDecodeView = toUint8Array(valueBeforeDecode);
    }
    toJSON() {
      return {
        blockName: this.constructor.NAME,
        blockLength: this.blockLength,
        error: this.error,
        warnings: this.warnings,
        valueBeforeDecode: hex_exports.encode(this.valueBeforeDecodeView)
      };
    }
  };
  var ValueBlock = class extends LocalBaseBlock {
    static {
      this.NAME = "valueBlock";
    }
    fromBER(_inputBuffer, _inputOffset, _inputLength, _context) {
      throw TypeError("User need to make a specific function in a class which extends 'ValueBlock'");
    }
    toBER(_sizeOnly, _writer) {
      throw TypeError("User need to make a specific function in a class which extends 'ValueBlock'");
    }
  };
  function decodeBase128(view) {
    try {
      return uint_exports.decode(view, { bitsPerByte: 7 });
    } catch {
      return;
    }
  }
  function encodeBase128(value) {
    try {
      return uint_exports.encode(value, { bitsPerByte: 7 });
    } catch {
      return;
    }
  }
  function bytesToSignedBigInt(view) {
    if (!view.byteLength) return BigInt(0);
    const value = BigInt(`0x${hex_exports.encode(view)}`);
    if (view[0] & 128) return value - (BigInt(1) << BigInt(view.byteLength * 8));
    return value;
  }
  function signedBigIntToBytes(value) {
    const byteLength = ((value < 0 ? -value - BigInt(1) : value).toString(2).length >> 3) + 1;
    const unsigned = value < 0 ? value + (BigInt(1) << BigInt(byteLength * 8)) : value;
    return hex_exports.decode(unsigned.toString(16).padStart(byteLength * 2, "0"));
  }
  var LocalIdentificationBlock = class extends HexBlock(LocalBaseBlock) {
    static {
      this.NAME = "identificationBlock";
    }
    constructor({ idBlock = {} } = {}) {
      super();
      if (idBlock) {
        this.isHexOnly = idBlock.isHexOnly ?? false;
        this.valueHexView = idBlock.valueHex ? toUint8Array(idBlock.valueHex) : EMPTY_VIEW;
        this.tagClass = idBlock.tagClass ?? -1;
        this.tagNumber = idBlock.tagNumber ?? -1;
        this.isConstructed = idBlock.isConstructed ?? false;
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
      if (this.isConstructed) firstOctet |= 32;
      if (this.tagNumber < 31 && !this.isHexOnly) {
        const retView2 = /* @__PURE__ */ new Uint8Array(1);
        if (!sizeOnly) {
          let number = this.tagNumber;
          number &= 31;
          firstOctet |= number;
          retView2[0] = firstOctet;
        }
        return retView2.buffer;
      }
      if (!this.isHexOnly) {
        const encodedView = encodeBase128(this.tagNumber);
        if (!encodedView) {
          this.error = "Error during encoding tag number";
          return EMPTY_BUFFER;
        }
        const size = encodedView.byteLength;
        const retView2 = new Uint8Array(size + 1);
        retView2[0] = firstOctet | 31;
        if (!sizeOnly) {
          for (let i = 0; i < size - 1; i++) retView2[i + 1] = encodedView[i] | 128;
          retView2[size] = encodedView[size - 1];
        }
        return retView2.buffer;
      }
      const retView = new Uint8Array(this.valueHexView.byteLength + 1);
      retView[0] = firstOctet | 31;
      if (!sizeOnly) {
        const curView = this.valueHexView;
        for (let i = 0; i < curView.length - 1; i++) retView[i + 1] = curView[i] | 128;
        retView[this.valueHexView.byteLength] = curView[curView.length - 1];
      }
      return retView.buffer;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const inputView = toUint8Array(inputBuffer);
      if (!checkBufferParams(this, inputView, inputOffset, inputLength)) return -1;
      const fastArgs = Number.isInteger(inputOffset) && Number.isInteger(inputLength);
      const intBuffer = fastArgs ? inputView : inputView.subarray(inputOffset, inputOffset + inputLength);
      const baseIndex = fastArgs ? inputOffset : 0;
      const bufferLength = fastArgs ? inputLength : intBuffer.length;
      if (bufferLength === 0) {
        this.error = "Zero buffer length";
        return -1;
      }
      switch (intBuffer[baseIndex] & 192) {
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
      this.isConstructed = (intBuffer[baseIndex] & 32) === 32;
      this.isHexOnly = false;
      const tagNumberMask = intBuffer[baseIndex] & 31;
      if (tagNumberMask !== 31) {
        this.tagNumber = tagNumberMask;
        this.blockLength = 1;
      } else {
        let count = 0;
        while (true) {
          const tagByteIndex = count + 1;
          if (tagByteIndex >= bufferLength) {
            this.error = "End of input reached before message was fully decoded";
            return -1;
          }
          count++;
          if ((intBuffer[baseIndex + tagByteIndex] & 128) === 0) break;
        }
        this.blockLength = count + 1;
        const intTagNumberBuffer = this.valueHexView = new Uint8Array(count);
        for (let i = 0; i < count; i++) intTagNumberBuffer[i] = intBuffer[baseIndex + i + 1] & 127;
        const tagNumber = this.blockLength <= 9 ? decodeBase128(intTagNumberBuffer) : void 0;
        if (tagNumber !== void 0) this.tagNumber = tagNumber;
        else {
          this.isHexOnly = true;
          this.warnings.push("Tag too long, represented as hex-coded");
        }
      }
      if (this.tagClass === 1 && this.isConstructed) switch (this.tagNumber) {
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
  var ORIGINAL_LOCAL_IDENTIFICATION_TO_BER = LocalIdentificationBlock.prototype.toBER;
  var ORIGINAL_LOCAL_IDENTIFICATION_FROM_BER = LocalIdentificationBlock.prototype.fromBER;
  var LocalLengthBlock = class extends LocalBaseBlock {
    static {
      this.NAME = "lengthBlock";
    }
    constructor({ lenBlock = {} } = {}) {
      super();
      this.isIndefiniteForm = lenBlock.isIndefiniteForm ?? false;
      this.longFormUsed = lenBlock.longFormUsed ?? false;
      this.length = lenBlock.length ?? 0;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const view = toUint8Array(inputBuffer);
      if (!checkBufferParams(this, view, inputOffset, inputLength)) return -1;
      const fastArgs = Number.isInteger(inputOffset) && Number.isInteger(inputLength);
      const intBuffer = fastArgs ? view : view.subarray(inputOffset, inputOffset + inputLength);
      const baseIndex = fastArgs ? inputOffset : 0;
      const bufferLength = fastArgs ? inputLength : intBuffer.length;
      if (bufferLength === 0) {
        this.error = "Zero buffer length";
        return -1;
      }
      if (intBuffer[baseIndex] === 255) {
        this.error = "Length block 0xFF is reserved by standard";
        return -1;
      }
      this.isIndefiniteForm = intBuffer[baseIndex] === 128;
      if (this.isIndefiniteForm) {
        this.blockLength = 1;
        return inputOffset + this.blockLength;
      }
      this.longFormUsed = !!(intBuffer[baseIndex] & 128);
      if (this.longFormUsed === false) {
        this.length = intBuffer[baseIndex];
        this.blockLength = 1;
        return inputOffset + this.blockLength;
      }
      const count = intBuffer[baseIndex] & 127;
      if (count > 8) {
        this.error = "Too big integer";
        return -1;
      }
      if (count + 1 > bufferLength) {
        this.error = "End of input reached before message was fully decoded";
        return -1;
      }
      const lenOffset = inputOffset + 1;
      const lengthBufferView = view.subarray(lenOffset, lenOffset + count);
      if (lengthBufferView[0] === 0) this.warnings.push("Needlessly long encoded length");
      try {
        this.length = uint_exports.decode(lengthBufferView);
      } catch {
        this.error = "Too big integer";
        return -1;
      }
      if (this.longFormUsed && this.length <= 127) this.warnings.push("Unnecessary usage of long length form");
      this.blockLength = count + 1;
      return inputOffset + this.blockLength;
    }
    toBER(sizeOnly = false) {
      let retBuf;
      let retView;
      if (this.length > 127) this.longFormUsed = true;
      if (this.isIndefiniteForm) {
        retBuf = /* @__PURE__ */ new ArrayBuffer(1);
        if (sizeOnly === false) {
          retView = new Uint8Array(retBuf);
          retView[0] = 128;
        }
        return retBuf;
      }
      if (this.longFormUsed) {
        let encodedBuf;
        try {
          encodedBuf = uint_exports.encode(this.length);
        } catch {
          this.error = "Too big length";
          return EMPTY_BUFFER;
        }
        retBuf = new ArrayBuffer(encodedBuf.byteLength + 1);
        if (sizeOnly) return retBuf;
        retView = new Uint8Array(retBuf);
        retView[0] = encodedBuf.byteLength | 128;
        retView.set(encodedBuf, 1);
        return retBuf;
      }
      retBuf = /* @__PURE__ */ new ArrayBuffer(1);
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
  var ORIGINAL_LOCAL_LENGTH_TO_BER = LocalLengthBlock.prototype.toBER;
  var ORIGINAL_LOCAL_LENGTH_FROM_BER = LocalLengthBlock.prototype.fromBER;
  var typeStore = {};
  var originalUint8ArraySliceInfo = findMethod(Uint8Array.prototype, "slice");
  var originalUint8ArrayConstructor = Object.getOwnPropertyDescriptor(Uint8Array.prototype, "constructor")?.value;
  var originalArrayIterator = Object.getOwnPropertyDescriptor(Array.prototype, Symbol.iterator)?.value;
  var intrinsicTypedArrayByteLength = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), "byteLength")?.get;
  var BUILTIN_DISPATCH_PAYLOAD_THRESHOLD = 16384;
  var BUILTIN_DISPATCH_MAX_DEPTH = 64;
  var builtinRegistry;
  function registerBuiltinEncoder(builtinConstructors, internals) {
    const nextInternals = internals || builtinRegistry;
    if (!nextInternals) {
      builtinRegistry = void 0;
      return;
    }
    builtinRegistry = {
      ...nextInternals,
      ...builtinConstructors
    };
  }
  function dataProperty(object, name) {
    const descriptor = Object.getOwnPropertyDescriptor(object, name);
    if (!descriptor || !("value" in descriptor)) return void 0;
    return descriptor.value;
  }
  function intrinsicPayloadByteLength(value) {
    if (!intrinsicTypedArrayByteLength || !value || typeof value !== "object") return void 0;
    try {
      const byteLength = intrinsicTypedArrayByteLength.call(value);
      return typeof byteLength === "number" ? byteLength : void 0;
    } catch {
      return;
    }
  }
  function largePayloadOrChain(block, depth) {
    if (depth > BUILTIN_DISPATCH_MAX_DEPTH || !block || typeof block !== "object") return false;
    const valueBlockDescriptor = Object.getOwnPropertyDescriptor(block, "valueBlock");
    if (!valueBlockDescriptor || !("value" in valueBlockDescriptor)) return false;
    const valueBlock = valueBlockDescriptor.value;
    if (!valueBlock || typeof valueBlock !== "object") return false;
    const payloadDescriptor = Object.getOwnPropertyDescriptor(valueBlock, "valueHexView");
    if (payloadDescriptor) {
      if (!("value" in payloadDescriptor)) return false;
      const byteLength = intrinsicPayloadByteLength(payloadDescriptor.value);
      return byteLength !== void 0 && byteLength >= BUILTIN_DISPATCH_PAYLOAD_THRESHOLD;
    }
    const valuesDescriptor = Object.getOwnPropertyDescriptor(valueBlock, "value");
    if (!valuesDescriptor || !("value" in valuesDescriptor) || !Array.isArray(valuesDescriptor.value)) return false;
    const values = valuesDescriptor.value;
    const lengthDescriptor = Object.getOwnPropertyDescriptor(values, "length");
    if (!lengthDescriptor || !("value" in lengthDescriptor) || lengthDescriptor.value !== 1) return false;
    const indexDescriptor = Object.getOwnPropertyDescriptor(values, "0");
    if (!indexDescriptor || !("value" in indexDescriptor)) return false;
    return largePayloadOrChain(indexDescriptor.value, depth + 1);
  }
  function shouldUseBuiltinEncoder(block) {
    try {
      return largePayloadOrChain(block, 0);
    } catch {
      return false;
    }
  }
  function sameDataMethod(current, original) {
    return !!current && "value" in current && current.value === original && current.writable === true && current.enumerable === false && current.configurable === true;
  }
  function writerMethodsStable(registry) {
    return sameDataMethod(Object.getOwnPropertyDescriptor(registry.ViewWriter.prototype, "write"), registry.originalWriterWrite) && sameDataMethod(Object.getOwnPropertyDescriptor(registry.ViewWriter.prototype, "final"), registry.originalWriterFinal);
  }
  function findMethod(prototype, name) {
    let current = prototype;
    while (current) {
      const descriptor = Object.getOwnPropertyDescriptor(current, name);
      if (descriptor) {
        if ("value" in descriptor && typeof descriptor.value === "function") return {
          declaringPrototype: current,
          method: descriptor.value
        };
        return;
      }
      current = Object.getPrototypeOf(current);
    }
  }
  function stableInheritedMethod(prototype, name, original) {
    if (!original) return false;
    let current = prototype;
    while (current) {
      const descriptor = Object.getOwnPropertyDescriptor(current, name);
      if (current === original.declaringPrototype) return !!descriptor && "value" in descriptor && descriptor.value === original.method;
      if (descriptor) return false;
      current = Object.getPrototypeOf(current);
    }
    return false;
  }
  function prototypeMethod(object, prototype, name, expected) {
    if (Object.prototype.hasOwnProperty.call(object, name)) return false;
    if (Object.getPrototypeOf(object) !== prototype) return false;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
    return !!descriptor && "value" in descriptor && descriptor.value === expected;
  }
  function inheritedMethod(object, name, expected, primitiveConstructor) {
    if (Object.prototype.hasOwnProperty.call(object, name)) return false;
    const prototype = Object.getPrototypeOf(object);
    const originalPrimitiveValuePrototype = Object.getPrototypeOf(primitiveConstructor.prototype);
    if (prototype !== primitiveConstructor.prototype || Object.getPrototypeOf(prototype) !== originalPrimitiveValuePrototype) return false;
    if (prototype && Object.getOwnPropertyDescriptor(prototype, name)) return false;
    const parentDescriptor = Object.getOwnPropertyDescriptor(originalPrimitiveValuePrototype, name);
    return !!parentDescriptor && "value" in parentDescriptor && parentDescriptor.value === expected;
  }
  function plainPayload(value, allowEmpty = false) {
    if (!(value instanceof Uint8Array) || Object.getPrototypeOf(value) !== Uint8Array.prototype) return void 0;
    for (const name of [
      "buffer",
      "byteOffset",
      "byteLength",
      "length",
      "slice",
      "constructor"
    ]) if (Object.prototype.hasOwnProperty.call(value, name)) return void 0;
    const constructorDescriptor = Object.getOwnPropertyDescriptor(Uint8Array.prototype, "constructor");
    if (!constructorDescriptor || !("value" in constructorDescriptor) || constructorDescriptor.value !== originalUint8ArrayConstructor) return void 0;
    if (!stableInheritedMethod(Uint8Array.prototype, "slice", originalUint8ArraySliceInfo)) return void 0;
    try {
      const buffer = value.buffer;
      if (!(buffer instanceof ArrayBuffer) || Object.getPrototypeOf(buffer) !== ArrayBuffer.prototype) return void 0;
      if (Object.prototype.hasOwnProperty.call(buffer, "byteLength")) return void 0;
      if (value.byteLength !== value.length || !allowEmpty && value.byteLength === 0) return void 0;
      if (value.byteOffset < 0 || value.byteOffset + value.byteLength > buffer.byteLength) return void 0;
    } catch {
      return;
    }
    return value;
  }
  function validIdBlock(block, constructed, registry) {
    if (Object.getPrototypeOf(block) !== registry.LocalIdentificationBlock.prototype) return false;
    if (!prototypeMethod(block, registry.LocalIdentificationBlock.prototype, "toBER", registry.originalIdentificationToBER)) return false;
    const tagClass = dataProperty(block, "tagClass");
    const tagNumber = dataProperty(block, "tagNumber");
    const isConstructed2 = dataProperty(block, "isConstructed");
    const isHexOnly = dataProperty(block, "isHexOnly");
    const valueHexView = dataProperty(block, "valueHexView");
    if (typeof tagClass !== "number" || !Number.isInteger(tagClass) || tagClass < 1 || tagClass > 4) return false;
    if (typeof tagNumber !== "number" || !Number.isInteger(tagNumber) || tagNumber < 0) return false;
    if (isConstructed2 !== constructed || typeof isHexOnly !== "boolean") return false;
    if (isHexOnly) return !!plainPayload(valueHexView);
    return Number.isSafeInteger(tagNumber);
  }
  function validLengthBlock(block, allowIndefinite, registry) {
    if (Object.getPrototypeOf(block) !== registry.LocalLengthBlock.prototype) return false;
    if (!prototypeMethod(block, registry.LocalLengthBlock.prototype, "toBER", registry.originalLengthToBER)) return false;
    const indefinite = dataProperty(block, "isIndefiniteForm");
    const longForm = dataProperty(block, "longFormUsed");
    const lengthDescriptor = Object.getOwnPropertyDescriptor(block, "length");
    const length = lengthDescriptor && "value" in lengthDescriptor ? lengthDescriptor.value : void 0;
    const longFormDescriptor = Object.getOwnPropertyDescriptor(block, "longFormUsed");
    return typeof indefinite === "boolean" && (indefinite === false || allowIndefinite) && typeof longForm === "boolean" && !!longFormDescriptor && "value" in longFormDescriptor && longFormDescriptor.writable === true && !!lengthDescriptor && "value" in lengthDescriptor && lengthDescriptor.writable === true && typeof length === "number" && Number.isSafeInteger(length) && length >= 0;
  }
  function validBaseBlock(block, isConstructed2, registry) {
    const idBlock = dataProperty(block, "idBlock");
    const lenBlock = dataProperty(block, "lenBlock");
    return !!idBlock && !!lenBlock && validIdBlock(idBlock, isConstructed2, registry) && validLengthBlock(lenBlock, isConstructed2, registry);
  }
  function constructedChild(block, registry) {
    const valueBlock = dataProperty(block, "valueBlock");
    if (!valueBlock || Object.getPrototypeOf(valueBlock) !== registry.LocalConstructedValueBlock.prototype) return void 0;
    if (!prototypeMethod(valueBlock, registry.LocalConstructedValueBlock.prototype, "toBER", registry.originalConstructedToBER)) return void 0;
    const values = dataProperty(valueBlock, "value");
    if (!Array.isArray(values) || Object.getPrototypeOf(values) !== Array.prototype) return void 0;
    const lengthDescriptor = Object.getOwnPropertyDescriptor(values, "length");
    if (!lengthDescriptor || !("value" in lengthDescriptor) || lengthDescriptor.value !== 1) return void 0;
    if (Object.prototype.hasOwnProperty.call(values, Symbol.iterator)) return void 0;
    const iteratorDescriptor = Object.getOwnPropertyDescriptor(Array.prototype, Symbol.iterator);
    if (!iteratorDescriptor || !("value" in iteratorDescriptor) || iteratorDescriptor.value !== originalArrayIterator) return void 0;
    const indexDescriptor = Object.getOwnPropertyDescriptor(values, "0");
    if (!indexDescriptor || !("value" in indexDescriptor)) return void 0;
    if (Object.getOwnPropertyNames(values).length !== 2) return void 0;
    return indexDescriptor.value;
  }
  function bitPayload(block, registry) {
    const valueBlock = dataProperty(block, "valueBlock");
    if (!valueBlock || Object.getPrototypeOf(valueBlock) !== registry.LocalBitStringValueBlock.prototype) return void 0;
    if (!prototypeMethod(valueBlock, registry.LocalBitStringValueBlock.prototype, "toBER", registry.originalBitStringToBER)) return void 0;
    if (dataProperty(valueBlock, "isConstructed") !== false) return void 0;
    const unusedBits = dataProperty(valueBlock, "unusedBits");
    if (typeof unusedBits !== "number" || !Number.isInteger(unusedBits) || unusedBits < 0 || unusedBits > 7) return void 0;
    const payload = plainPayload(dataProperty(valueBlock, "valueHexView"), true);
    if (!payload) return void 0;
    return {
      payload,
      prefix: Uint8Array.of(payload.byteLength ? unusedBits : 0)
    };
  }
  function primitivePayload(block, kind, registry) {
    const valueBlock = dataProperty(block, "valueBlock");
    if (!valueBlock) return void 0;
    if (kind === "integer") {
      if (Object.getPrototypeOf(valueBlock) !== registry.LocalIntegerValueBlock.prototype) return void 0;
      if (!prototypeMethod(valueBlock, registry.LocalIntegerValueBlock.prototype, "toBER", registry.originalIntegerToBER)) return void 0;
    } else if (kind === "octet") {
      if (Object.getPrototypeOf(valueBlock) !== registry.LocalOctetStringValueBlock.prototype) return void 0;
      if (!prototypeMethod(valueBlock, registry.LocalOctetStringValueBlock.prototype, "toBER", registry.originalOctetStringToBER)) return void 0;
      if (dataProperty(valueBlock, "isConstructed") !== false) return void 0;
    } else {
      if (Object.getPrototypeOf(valueBlock) !== registry.LocalPrimitiveValueBlock.prototype) return void 0;
      if (!inheritedMethod(valueBlock, "toBER", registry.originalPrimitiveToBER, registry.LocalPrimitiveValueBlock)) return void 0;
    }
    if (kind === "primitive" && dataProperty(valueBlock, "isHexOnly") !== true) return void 0;
    if (typeof dataProperty(valueBlock, "isHexOnly") !== "boolean") return void 0;
    return plainPayload(dataProperty(valueBlock, "valueHexView"));
  }
  function validOuterMethod(block, registry) {
    if (Object.prototype.hasOwnProperty.call(block, "toBER")) return false;
    let prototype = block;
    while (prototype) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, "toBER");
      if (descriptor) return "value" in descriptor && descriptor.value === registry.originalBaseBlockToBER;
      prototype = Object.getPrototypeOf(prototype);
    }
    return false;
  }
  function isPrimitive(block, type, registry) {
    const constructor = registry[type];
    return !!constructor && Object.getPrototypeOf(block) === constructor.prototype;
  }
  function isConstructed(block, registry) {
    return Object.getPrototypeOf(block) === registry.Sequence.prototype || Object.getPrototypeOf(block) === registry.Set.prototype || Object.getPrototypeOf(block) === registry.Constructed.prototype;
  }
  function inspectNode(block, depth, registry) {
    if (depth > BUILTIN_DISPATCH_MAX_DEPTH || !block || typeof block !== "object") return void 0;
    try {
      if (!validOuterMethod(block, registry)) return void 0;
      const primitiveKind = isPrimitive(block, "BitString", registry) ? "bit" : isPrimitive(block, "Integer", registry) ? "integer" : isPrimitive(block, "OctetString", registry) ? "octet" : isPrimitive(block, "Primitive", registry) ? "primitive" : void 0;
      const constructed = primitiveKind === void 0 && isConstructed(block, registry);
      if (!primitiveKind && !constructed) return void 0;
      if (!validBaseBlock(block, constructed, registry)) return void 0;
      const idBlock = dataProperty(block, "idBlock");
      const lenBlock = dataProperty(block, "lenBlock");
      if (!idBlock || !lenBlock) return void 0;
      if (primitiveKind) {
        const bit = primitiveKind === "bit" ? bitPayload(block, registry) : void 0;
        const payload = primitiveKind === "bit" ? bit?.payload : primitivePayload(block, primitiveKind, registry);
        return payload ? {
          block,
          kind: primitiveKind,
          idBlock,
          lenBlock,
          indefinite: false,
          payload,
          prefix: bit?.prefix
        } : void 0;
      }
      const child = constructedChild(block, registry);
      const validatedChild = child && inspectNode(child, depth + 1, registry);
      const indefinite = dataProperty(lenBlock, "isIndefiniteForm");
      return validatedChild ? {
        block,
        kind: "constructed",
        idBlock,
        lenBlock,
        indefinite: indefinite === true,
        child: validatedChild
      } : void 0;
    } catch {
      return;
    }
  }
  function buildNode(node, sizeOnly, registry) {
    const id = Reflect.apply(registry.originalIdentificationToBER, node.idBlock, [sizeOnly]);
    if (!(id instanceof ArrayBuffer) || id.byteLength === 0) throw TypeError("Built-in identifier encoding failed");
    let payload;
    if (node.kind === "constructed") payload = buildNode(node.child, sizeOnly, registry);
    else payload = node.payload;
    const length = (payload instanceof Uint8Array ? payload.byteLength : payload.total) + (node.prefix?.byteLength ?? 0);
    let len;
    if (node.indefinite) len = Uint8Array.of(128).buffer;
    else {
      node.lenBlock.length = length;
      len = Reflect.apply(registry.originalLengthToBER, node.lenBlock, [sizeOnly]);
      if (!(len instanceof ArrayBuffer) || len.byteLength === 0) throw TypeError("Built-in length encoding failed");
    }
    const total = id.byteLength + len.byteLength + length + (node.indefinite ? 2 : 0);
    if (!Number.isSafeInteger(total)) throw RangeError("Built-in encoding is too large");
    return {
      id,
      len,
      payload,
      length,
      total,
      indefinite: node.indefinite,
      prefix: node.prefix
    };
  }
  function flatten(node, output, offset, sizeOnly) {
    output.set(new Uint8Array(node.id), offset);
    offset += node.id.byteLength;
    output.set(new Uint8Array(node.len), offset);
    offset += node.len.byteLength;
    if (node.prefix) {
      if (!sizeOnly) output.set(node.prefix, offset);
      offset += node.prefix.byteLength;
    }
    if (node.payload instanceof Uint8Array) {
      if (!sizeOnly) output.set(node.payload, offset);
      offset += node.payload.byteLength;
    } else offset = flatten(node.payload, output, offset, sizeOnly);
    if (node.indefinite) offset += 2;
    return offset;
  }
  function tryEncodeBuiltin(block, sizeOnly = false) {
    const registry = builtinRegistry;
    if (!registry || !writerMethodsStable(registry)) return void 0;
    const validated = inspectNode(block, 0, registry);
    if (!validated) return void 0;
    const node = buildNode(validated, sizeOnly, registry);
    const output = new Uint8Array(node.total);
    flatten(node, output, 0, sizeOnly);
    return output.buffer;
  }
  var BaseBlock = class extends LocalBaseBlock {
    static {
      this.NAME = "BaseBlock";
    }
    constructor({ name = "", optional = false, primitiveSchema, ...parameters } = {}, valueBlockType) {
      super(parameters);
      this.name = name;
      this.optional = optional;
      if (primitiveSchema) this.primitiveSchema = primitiveSchema;
      this.idBlock = new LocalIdentificationBlock(parameters);
      this.lenBlock = new LocalLengthBlock(parameters);
      this.valueBlock = valueBlockType ? new valueBlockType(parameters) : new ValueBlock(parameters);
    }
    fromBER(inputBuffer, inputOffset, inputLength, context) {
      const resultOffset = this.valueBlock.fromBER(inputBuffer, inputOffset, this.lenBlock.isIndefiniteForm ? inputLength : this.lenBlock.length, context);
      if (resultOffset === -1) {
        this.error = this.valueBlock.error;
        return resultOffset;
      }
      if (!this.idBlock.error.length) this.blockLength += this.idBlock.blockLength;
      if (!this.lenBlock.error.length) this.blockLength += this.lenBlock.blockLength;
      if (!this.valueBlock.error.length) this.blockLength += this.valueBlock.blockLength;
      return resultOffset;
    }
    toBER(sizeOnly, writer) {
      const _writer = writer || new ViewWriter();
      if (!writer) {
        prepareIndefiniteForm(this);
        if (sizeOnly === true || sizeOnly === false || sizeOnly === void 0) {
          if (shouldUseBuiltinEncoder(this)) {
            const encoded = tryEncodeBuiltin(this, sizeOnly === true);
            if (encoded) return encoded;
          }
        }
      }
      const idBlockBuf = this.idBlock.toBER(sizeOnly);
      _writer.write(idBlockBuf);
      if (this.lenBlock.isIndefiniteForm) {
        _writer.write(new Uint8Array([128]).buffer);
        this.valueBlock.toBER(sizeOnly, _writer);
        _writer.write(/* @__PURE__ */ new ArrayBuffer(2));
      } else {
        const valueBlockBuf = this.valueBlock.toBER(sizeOnly);
        this.lenBlock.length = valueBlockBuf.byteLength;
        const lenBlockBuf = this.lenBlock.toBER(sizeOnly);
        _writer.write(lenBlockBuf);
        _writer.write(valueBlockBuf);
      }
      if (!writer) return _writer.final();
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
      if (this.primitiveSchema) object.primitiveSchema = this.primitiveSchema.toJSON();
      return object;
    }
    toString(encoding = "ascii") {
      if (encoding === "ascii") return this.onAsciiEncoding();
      return hex_exports.encode(this.toBER());
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME} : ${hex_exports.encode(this.valueBlock.valueBeforeDecodeView)}`;
    }
    isEqual(other) {
      if (this === other) return true;
      if (!(other instanceof this.constructor)) return false;
      const thisRaw = this.toBER();
      const otherRaw = other.toBER();
      return bytes_exports.equal(thisRaw, otherRaw);
    }
  };
  var ORIGINAL_BASE_BLOCK_TO_BER = BaseBlock.prototype.toBER;
  function prepareIndefiniteForm(baseBlock) {
    if (baseBlock instanceof typeStore.Constructed) {
      for (const value of baseBlock.valueBlock.value) if (prepareIndefiniteForm(value)) baseBlock.lenBlock.isIndefiniteForm = true;
    }
    return !!baseBlock.lenBlock?.isIndefiniteForm;
  }
  var BaseStringBlock = class extends BaseBlock {
    static {
      this.NAME = "BaseStringBlock";
    }
    getValue() {
      return this.valueBlock.value;
    }
    setValue(value) {
      this.valueBlock.value = value;
    }
    constructor({ value = "", ...parameters } = {}, stringValueBlockType) {
      super(parameters, stringValueBlockType);
      if (value) this.fromString(value);
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const resultOffset = this.valueBlock.fromBER(inputBuffer, inputOffset, this.lenBlock.isIndefiniteForm ? inputLength : this.lenBlock.length);
      if (resultOffset === -1) {
        this.error = this.valueBlock.error;
        return resultOffset;
      }
      const valueError = this.checkValue(this.valueBlock.valueHexView);
      if (valueError) {
        this.error = valueError;
        return -1;
      }
      this.fromBuffer(this.valueBlock.valueHexView);
      if (!this.idBlock.error.length) this.blockLength += this.idBlock.blockLength;
      if (!this.lenBlock.error.length) this.blockLength += this.lenBlock.blockLength;
      if (!this.valueBlock.error.length) this.blockLength += this.valueBlock.blockLength;
      return resultOffset;
    }
    checkValue(_view) {
      return "";
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME} : '${this.valueBlock.value}'`;
    }
  };
  var LocalPrimitiveValueBlock = class extends HexBlock(ValueBlock) {
    static {
      this.NAME = "PrimitiveValueBlock";
    }
    constructor({ isHexOnly = true, ...parameters } = {}) {
      super(parameters);
      this.isHexOnly = isHexOnly;
    }
  };
  var ORIGINAL_LOCAL_PRIMITIVE_TO_BER = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(LocalPrimitiveValueBlock.prototype), "toBER")?.value;
  var Primitive = class extends BaseBlock {
    static {
      typeStore.Primitive = this;
    }
    static {
      this.NAME = "PRIMITIVE";
    }
    constructor(parameters = {}) {
      super(parameters, LocalPrimitiveValueBlock);
      this.idBlock.isConstructed = false;
    }
  };
  var fastParserRegistry;
  function registerFastParser(constructors) {
    fastParserRegistry = {
      Integer: constructors.Integer,
      Null: constructors.Null,
      Sequence: constructors.Sequence
    };
  }
  function fastParserContext(context) {
    const nodes = Object.getOwnPropertyDescriptor(context, "nodesCount");
    const maxNodes = Object.getOwnPropertyDescriptor(context, "maxNodes");
    const maxContentLength = Object.getOwnPropertyDescriptor(context, "maxContentLength");
    if (!nodes || !("value" in nodes) || nodes.writable !== true) return false;
    if (!maxNodes || !("value" in maxNodes) || !maxContentLength || !("value" in maxContentLength)) return false;
    return typeof nodes.value === "number" && Number.isSafeInteger(nodes.value) && nodes.value >= 0 && typeof maxNodes.value === "number" && Number.isSafeInteger(maxNodes.value) && maxNodes.value >= 0 && typeof maxContentLength.value === "number" && Number.isSafeInteger(maxContentLength.value) && maxContentLength.value >= 0 && nodes.value < maxNodes.value;
  }
  function fastParserType(store, name, value) {
    const descriptor = Object.getOwnPropertyDescriptor(store, name);
    return !!descriptor && "value" in descriptor && descriptor.value === value;
  }
  function tryFastFromBER(inputBuffer, inputOffset, inputLength, context) {
    const registry = fastParserRegistry;
    if (!registry) return void 0;
    let Constructor;
    let length = 0;
    try {
      if (Object.getPrototypeOf(inputBuffer) !== Uint8Array.prototype) return void 0;
      if (!Number.isSafeInteger(inputOffset) || inputOffset < 0 || !Number.isSafeInteger(inputLength) || inputLength < 2) return;
      if (inputOffset > inputBuffer.byteLength || inputLength > inputBuffer.byteLength - inputOffset) return void 0;
      const tag = inputBuffer[inputOffset];
      if (tag !== 2 && tag !== 5 && tag !== 48) return void 0;
      length = inputBuffer[inputOffset + 1];
      if (length >= 128 || length > inputLength - 2) return void 0;
      if (tag === 5 && length !== 0) return void 0;
      if (!fastParserContext(context)) return void 0;
      if (length > Object.getOwnPropertyDescriptor(context, "maxContentLength").value) return;
      const constructorName = tag === 2 ? "Integer" : tag === 5 ? "Null" : "Sequence";
      Constructor = registry[constructorName];
      if (!fastParserType(typeStore, constructorName, Constructor)) return void 0;
      const identificationFromBER = Object.getOwnPropertyDescriptor(LocalIdentificationBlock.prototype, "fromBER");
      const lengthFromBER = Object.getOwnPropertyDescriptor(LocalLengthBlock.prototype, "fromBER");
      if (!identificationFromBER || !("value" in identificationFromBER) || identificationFromBER.value !== ORIGINAL_LOCAL_IDENTIFICATION_FROM_BER || !lengthFromBER || !("value" in lengthFromBER) || lengthFromBER.value !== ORIGINAL_LOCAL_LENGTH_FROM_BER) return void 0;
    } catch {
      return;
    }
    if (!Constructor) return void 0;
    const result = new Constructor();
    result.idBlock.tagClass = 1;
    result.idBlock.tagNumber = inputBuffer[inputOffset] & 31;
    result.idBlock.isConstructed = inputBuffer[inputOffset] === 48;
    result.idBlock.isHexOnly = false;
    result.idBlock.blockLength = 1;
    result.lenBlock.isIndefiniteForm = false;
    result.lenBlock.longFormUsed = false;
    result.lenBlock.length = length;
    result.lenBlock.blockLength = 1;
    context.nodesCount += 1;
    const resultOffset = result.fromBER(inputBuffer, inputOffset + 2, length, context);
    result.valueBeforeDecodeView = inputBuffer.subarray(inputOffset, inputOffset + result.blockLength);
    return {
      offset: resultOffset,
      result
    };
  }
  var DEFAULT_MAX_DEPTH = 100;
  var DEFAULT_MAX_NODES = 1e4;
  var DEFAULT_MAX_CONTENT_LENGTH = 16777216;
  var MAX_DEPTH_EXCEEDED_ERROR = "Maximum ASN.1 nesting depth exceeded";
  var MAX_NODES_EXCEEDED_ERROR = "Maximum ASN.1 node count exceeded";
  var MAX_CONTENT_LENGTH_EXCEEDED_ERROR = "Maximum ASN.1 content length exceeded";
  function createFromBerContext(options = {}) {
    return {
      depth: 0,
      maxDepth: options.maxDepth ?? 100,
      nodesCount: 0,
      maxNodes: options.maxNodes ?? 1e4,
      maxContentLength: options.maxContentLength ?? 16777216,
      parseEmbedded: options.parseEmbedded ?? true
    };
  }
  function createErrorResult(error) {
    const result = new BaseBlock({}, ValueBlock);
    result.error = error;
    return {
      offset: -1,
      result
    };
  }
  function checkNodesLimit(context) {
    context.nodesCount += 1;
    if (context.nodesCount > context.maxNodes) return MAX_NODES_EXCEEDED_ERROR;
  }
  function checkContentLengthLimit(inputLength, context) {
    if (inputLength > context.maxContentLength) return MAX_CONTENT_LENGTH_EXCEEDED_ERROR;
  }
  function localFromBERWithChildContext(inputBuffer, inputOffset, inputLength, context) {
    const childDepth = context.depth + 1;
    if (childDepth > context.maxDepth) return createErrorResult(MAX_DEPTH_EXCEEDED_ERROR);
    context.depth = childDepth;
    try {
      return localFromBER(inputBuffer, inputOffset, inputLength, context);
    } finally {
      context.depth -= 1;
    }
  }
  function localChangeType(inputObject, newType) {
    if (inputObject instanceof newType) return inputObject;
    const newObject = new newType();
    newObject.idBlock = inputObject.idBlock;
    newObject.lenBlock = inputObject.lenBlock;
    newObject.warnings = inputObject.warnings;
    newObject.valueBeforeDecodeView = inputObject.valueBeforeDecodeView;
    return newObject;
  }
  function localFromBER(inputBuffer, inputOffset = 0, inputLength = inputBuffer.length, context = createFromBerContext()) {
    const fastResult = tryFastFromBER(inputBuffer, inputOffset, inputLength, context);
    if (fastResult) return fastResult;
    const incomingOffset = inputOffset;
    let returnObject = new BaseBlock({}, ValueBlock);
    if (!checkBufferParams(returnObject, inputBuffer, inputOffset, inputLength)) return {
      offset: -1,
      result: returnObject
    };
    if (Number.isInteger(inputOffset) && Number.isInteger(inputLength) ? inputLength === 0 : inputBuffer.subarray(inputOffset, inputOffset + inputLength).length === 0) {
      returnObject.error = "Zero buffer length";
      return {
        offset: -1,
        result: returnObject
      };
    }
    const nodesLimitError = checkNodesLimit(context);
    if (nodesLimitError) {
      returnObject.error = nodesLimitError;
      return {
        offset: -1,
        result: returnObject
      };
    }
    let resultOffset = returnObject.idBlock.fromBER(inputBuffer, inputOffset, inputLength);
    if (returnObject.idBlock.warnings.length) returnObject.warnings.concat(returnObject.idBlock.warnings);
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
    if (returnObject.lenBlock.warnings.length) returnObject.warnings.concat(returnObject.lenBlock.warnings);
    if (resultOffset === -1) {
      returnObject.error = returnObject.lenBlock.error;
      return {
        offset: -1,
        result: returnObject
      };
    }
    inputOffset = resultOffset;
    inputLength -= returnObject.lenBlock.blockLength;
    const valueLength = returnObject.lenBlock.isIndefiniteForm ? inputLength : returnObject.lenBlock.length;
    const contentLengthError = checkContentLengthLimit(valueLength, context);
    if (contentLengthError) {
      returnObject.error = contentLengthError;
      return {
        offset: -1,
        result: returnObject
      };
    }
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
      default:
        newASN1Type = returnObject.idBlock.isConstructed ? typeStore.Constructed : typeStore.Primitive;
    }
    returnObject = localChangeType(returnObject, newASN1Type);
    resultOffset = returnObject.fromBER(inputBuffer, inputOffset, valueLength, context);
    returnObject.valueBeforeDecodeView = inputBuffer.subarray(incomingOffset, incomingOffset + returnObject.blockLength);
    return {
      offset: resultOffset,
      result: returnObject
    };
  }
  function fromBER(inputBuffer, options = {}) {
    if (!inputBuffer.byteLength) {
      const result = new BaseBlock({}, ValueBlock);
      result.error = "Input buffer has zero length";
      return {
        offset: -1,
        result
      };
    }
    const inputView = toUint8Array(inputBuffer);
    return localFromBER(options.copyInput === false ? inputView : inputView.slice(), 0, inputBuffer.byteLength, createFromBerContext(options));
  }
  function checkLen(indefiniteLength, length) {
    if (indefiniteLength) return 1;
    return length;
  }
  var LocalConstructedValueBlock = class extends ValueBlock {
    static {
      this.NAME = "ConstructedValueBlock";
    }
    constructor({ value = [], isIndefiniteForm = false, ...parameters } = {}) {
      super(parameters);
      this.value = value;
      this.isIndefiniteForm = isIndefiniteForm;
    }
    fromBER(inputBuffer, inputOffset, inputLength, context) {
      const view = toUint8Array(inputBuffer);
      const parseContext = context ?? createFromBerContext();
      if (!checkBufferParams(this, view, inputOffset, inputLength)) return -1;
      this.valueBeforeDecodeView = view.subarray(inputOffset, inputOffset + inputLength);
      if (this.valueBeforeDecodeView.length === 0) {
        this.warnings.push("Zero buffer length");
        return inputOffset;
      }
      let currentOffset = inputOffset;
      while (checkLen(this.isIndefiniteForm, inputLength) > 0) {
        const returnObject = localFromBERWithChildContext(view, currentOffset, inputLength, parseContext);
        if (returnObject.offset === -1) {
          this.error = returnObject.result.error;
          this.warnings.concat(returnObject.result.warnings);
          return -1;
        }
        currentOffset = returnObject.offset;
        this.blockLength += returnObject.result.blockLength;
        inputLength -= returnObject.result.blockLength;
        this.value.push(returnObject.result);
        if (this.isIndefiniteForm && returnObject.result.constructor.NAME === "EndOfContent") break;
      }
      if (this.isIndefiniteForm) {
        if (this.value[this.value.length - 1].constructor.NAME === "EndOfContent") this.value.pop();
        else this.warnings.push("No EndOfContent block encoded");
      }
      return currentOffset;
    }
    toBER(sizeOnly, writer) {
      const _writer = writer || new ViewWriter();
      for (let i = 0; i < this.value.length; i++) this.value[i].toBER(sizeOnly, _writer);
      if (!writer) return _writer.final();
      return EMPTY_BUFFER;
    }
    toJSON() {
      const object = {
        ...super.toJSON(),
        isIndefiniteForm: this.isIndefiniteForm,
        value: []
      };
      for (const value of this.value) object.value.push(value.toJSON());
      return object;
    }
  };
  var ORIGINAL_LOCAL_CONSTRUCTED_TO_BER = LocalConstructedValueBlock.prototype.toBER;
  var Constructed = class extends BaseBlock {
    static {
      typeStore.Constructed = this;
    }
    static {
      this.NAME = "CONSTRUCTED";
    }
    constructor(parameters = {}) {
      super(parameters, LocalConstructedValueBlock);
      this.idBlock.isConstructed = true;
    }
    fromBER(inputBuffer, inputOffset, inputLength, context) {
      this.valueBlock.isIndefiniteForm = this.lenBlock.isIndefiniteForm;
      const resultOffset = this.valueBlock.fromBER(inputBuffer, inputOffset, this.lenBlock.isIndefiniteForm ? inputLength : this.lenBlock.length, context);
      if (resultOffset === -1) {
        this.error = this.valueBlock.error;
        return resultOffset;
      }
      if (!this.idBlock.error.length) this.blockLength += this.idBlock.blockLength;
      if (!this.lenBlock.error.length) this.blockLength += this.lenBlock.blockLength;
      if (!this.valueBlock.error.length) this.blockLength += this.valueBlock.blockLength;
      return resultOffset;
    }
    onAsciiEncoding() {
      const values = [];
      for (const value of this.valueBlock.value) values.push(value.toString("ascii").split("\n").map((o) => `  ${o}`).join("\n"));
      const blockName = this.idBlock.tagClass === 3 ? `[${this.idBlock.tagNumber}]` : this.constructor.NAME;
      return values.length ? `${blockName} :
${values.join("\n")}` : `${blockName} :`;
    }
  };
  var LocalEndOfContentValueBlock = class extends ValueBlock {
    static {
      this.override = "EndOfContentValueBlock";
    }
    fromBER(inputBuffer, inputOffset, _inputLength) {
      return inputOffset;
    }
    toBER(_sizeOnly) {
      return EMPTY_BUFFER;
    }
  };
  var EndOfContent = class extends BaseBlock {
    static {
      typeStore.EndOfContent = this;
    }
    static {
      this.NAME = END_OF_CONTENT_NAME;
    }
    constructor(parameters = {}) {
      super(parameters, LocalEndOfContentValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 0;
    }
  };
  var Null = class extends BaseBlock {
    static {
      typeStore.Null = this;
    }
    static {
      this.NAME = "NULL";
    }
    constructor(parameters = {}) {
      super(parameters, ValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 5;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      if (this.lenBlock.length > 0) this.warnings.push("Non-zero length of value block for Null type");
      if (!this.idBlock.error.length) this.blockLength += this.idBlock.blockLength;
      if (!this.lenBlock.error.length) this.blockLength += this.lenBlock.blockLength;
      this.blockLength += inputLength;
      if (inputOffset + inputLength > inputBuffer.byteLength) {
        this.error = "End of input reached before message was fully decoded (inconsistent offset and length values)";
        return -1;
      }
      return inputOffset + inputLength;
    }
    toBER(sizeOnly, writer) {
      const retBuf = /* @__PURE__ */ new ArrayBuffer(2);
      if (!sizeOnly) {
        const retView = new Uint8Array(retBuf);
        retView[0] = 5;
        retView[1] = 0;
      }
      if (writer) writer.write(retBuf);
      return retBuf;
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME}`;
    }
  };
  var LocalBooleanValueBlock = class extends HexBlock(ValueBlock) {
    static {
      this.NAME = "BooleanValueBlock";
    }
    get value() {
      for (const octet of this.valueHexView) if (octet > 0) return true;
      return false;
    }
    set value(value) {
      this.valueHexView[0] = value ? 255 : 0;
    }
    constructor({ value, ...parameters } = {}) {
      super(parameters);
      if (parameters.valueHex) this.valueHexView = toUint8Array(parameters.valueHex);
      else this.valueHexView = /* @__PURE__ */ new Uint8Array(1);
      if (value) this.value = value;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const inputView = toUint8Array(inputBuffer);
      if (!checkBufferParams(this, inputView, inputOffset, inputLength)) return -1;
      this.valueHexView = inputView.subarray(inputOffset, inputOffset + inputLength);
      if (inputLength > 1) this.warnings.push("Boolean value encoded in more then 1 octet");
      this.isHexOnly = true;
      if (inputLength > 1 && !int_exports.isMinimal(this.valueHexView)) this.warnings.push("Needlessly long format");
      this.blockLength = inputLength;
      return inputOffset + inputLength;
    }
    toBER() {
      return this.valueHexView.slice().buffer;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        value: this.value
      };
    }
  };
  var Boolean = class extends BaseBlock {
    static {
      typeStore.Boolean = this;
    }
    getValue() {
      return this.valueBlock.value;
    }
    setValue(value) {
      this.valueBlock.value = value;
    }
    static {
      this.NAME = "BOOLEAN";
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
  var LocalOctetStringValueBlock = class extends HexBlock(LocalConstructedValueBlock) {
    static {
      this.NAME = "OctetStringValueBlock";
    }
    constructor({ isConstructed: isConstructed2 = false, ...parameters } = {}) {
      super(parameters);
      this.isConstructed = isConstructed2;
    }
    fromBER(inputBuffer, inputOffset, inputLength, context) {
      let resultOffset = 0;
      if (this.isConstructed) {
        this.isHexOnly = false;
        resultOffset = LocalConstructedValueBlock.prototype.fromBER.call(this, inputBuffer, inputOffset, inputLength, context);
        if (resultOffset === -1) return resultOffset;
        for (let i = 0; i < this.value.length; i++) {
          const currentBlockName = this.value[i].constructor.NAME;
          if (currentBlockName === "EndOfContent") {
            if (this.isIndefiniteForm) break;
            else {
              this.error = "EndOfContent is unexpected, OCTET STRING may consists of OCTET STRINGs only";
              return -1;
            }
          }
          if (currentBlockName !== "OCTET STRING") {
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
      if (this.isConstructed) return LocalConstructedValueBlock.prototype.toBER.call(this, sizeOnly, writer);
      return sizeOnly ? new ArrayBuffer(this.valueHexView.byteLength) : this.valueHexView.slice().buffer;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        isConstructed: this.isConstructed
      };
    }
  };
  var ORIGINAL_LOCAL_OCTET_STRING_TO_BER = LocalOctetStringValueBlock.prototype.toBER;
  var OctetString = class OctetString2 extends BaseBlock {
    static {
      typeStore.OctetString = this;
    }
    static {
      this.NAME = OCTET_STRING_NAME;
    }
    constructor({ idBlock = {}, lenBlock = {}, ...parameters } = {}) {
      parameters.isConstructed ??= !!parameters.value?.length;
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
    fromBER(inputBuffer, inputOffset, inputLength, context) {
      this.valueBlock.isConstructed = this.idBlock.isConstructed;
      this.valueBlock.isIndefiniteForm = this.lenBlock.isIndefiniteForm;
      if (inputLength === 0) {
        if (this.idBlock.error.length === 0) this.blockLength += this.idBlock.blockLength;
        if (this.lenBlock.error.length === 0) this.blockLength += this.lenBlock.blockLength;
        return inputOffset;
      }
      if (!this.valueBlock.isConstructed && context?.parseEmbedded !== false) {
        const buf = (inputBuffer instanceof ArrayBuffer ? new Uint8Array(inputBuffer) : inputBuffer).subarray(inputOffset, inputOffset + inputLength);
        try {
          if (buf.byteLength) {
            const parseContext = context ?? createFromBerContext();
            const asn = localFromBERWithChildContext(buf, 0, buf.byteLength, parseContext);
            if (asn.offset !== -1 && asn.offset === inputLength) this.valueBlock.value = [asn.result];
          }
        } catch {
        }
      }
      return super.fromBER(inputBuffer, inputOffset, inputLength, context);
    }
    onAsciiEncoding() {
      if (this.valueBlock.isConstructed || this.valueBlock.value && this.valueBlock.value.length) return Constructed.prototype.onAsciiEncoding.call(this);
      return `${this.constructor.NAME} : ${hex_exports.encode(this.valueBlock.valueHexView)}`;
    }
    getValue() {
      if (!this.idBlock.isConstructed) return this.valueBlock.valueHexView.slice().buffer;
      const array = [];
      for (const content of this.valueBlock.value) if (content instanceof OctetString2) array.push(content.valueBlock.valueHexView);
      return concat2(array);
    }
  };
  var LocalBitStringValueBlock = class extends HexBlock(LocalConstructedValueBlock) {
    static {
      this.NAME = "BitStringValueBlock";
    }
    constructor({ unusedBits = 0, isConstructed: isConstructed2 = false, ...parameters } = {}) {
      super(parameters);
      this.unusedBits = unusedBits;
      this.isConstructed = isConstructed2;
      this.blockLength = this.valueHexView.byteLength;
    }
    fromBER(inputBuffer, inputOffset, inputLength, context) {
      if (!inputLength) return inputOffset;
      let resultOffset = -1;
      if (this.isConstructed) {
        resultOffset = LocalConstructedValueBlock.prototype.fromBER.call(this, inputBuffer, inputOffset, inputLength, context);
        if (resultOffset === -1) return resultOffset;
        for (const value of this.value) {
          const currentBlockName = value.constructor.NAME;
          if (currentBlockName === "EndOfContent") {
            if (this.isIndefiniteForm) break;
            else {
              this.error = "EndOfContent is unexpected, BIT STRING may consists of BIT STRINGs only";
              return -1;
            }
          }
          if (currentBlockName !== "BIT STRING") {
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
      const inputView = toUint8Array(inputBuffer);
      if (!checkBufferParams(this, inputView, inputOffset, inputLength)) return -1;
      const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);
      this.unusedBits = intBuffer[0];
      if (this.unusedBits > 7) {
        this.error = "Unused bits for BitString must be in range 0-7";
        return -1;
      }
      if (!this.unusedBits && context?.parseEmbedded !== false) {
        const buf = intBuffer.subarray(1);
        try {
          if (buf.byteLength) {
            const parseContext = context ?? createFromBerContext();
            const asn = localFromBERWithChildContext(buf, 0, buf.byteLength, parseContext);
            if (asn.offset !== -1 && asn.offset === inputLength - 1) this.value = [asn.result];
          }
        } catch {
        }
      }
      this.valueHexView = intBuffer.subarray(1);
      this.blockLength = intBuffer.length;
      return inputOffset + inputLength;
    }
    toBER(sizeOnly, writer) {
      if (this.isConstructed) return LocalConstructedValueBlock.prototype.toBER.call(this, sizeOnly, writer);
      if (sizeOnly) return new ArrayBuffer(this.valueHexView.byteLength + 1);
      if (!this.valueHexView.byteLength) {
        const empty = /* @__PURE__ */ new Uint8Array(1);
        empty[0] = 0;
        return empty.buffer;
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
  var ORIGINAL_LOCAL_BIT_STRING_TO_BER = LocalBitStringValueBlock.prototype.toBER;
  var BitString = class extends BaseBlock {
    static {
      typeStore.BitString = this;
    }
    static {
      this.NAME = BIT_STRING_NAME;
    }
    constructor({ idBlock = {}, lenBlock = {}, ...parameters } = {}) {
      parameters.isConstructed ??= !!parameters.value?.length;
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
    fromBER(inputBuffer, inputOffset, inputLength, context) {
      this.valueBlock.isConstructed = this.idBlock.isConstructed;
      this.valueBlock.isIndefiniteForm = this.lenBlock.isIndefiniteForm;
      return super.fromBER(inputBuffer, inputOffset, inputLength, context);
    }
    onAsciiEncoding() {
      if (this.valueBlock.isConstructed || this.valueBlock.value && this.valueBlock.value.length) return Constructed.prototype.onAsciiEncoding.call(this);
      else {
        const bits = [];
        const valueHex = this.valueBlock.valueHexView;
        for (const byte of valueHex) bits.push(byte.toString(2).padStart(8, "0"));
        const bitsStr = bits.join("");
        return `${this.constructor.NAME} : ${bitsStr.substring(0, bitsStr.length - this.valueBlock.unusedBits)}`;
      }
    }
  };
  var LocalIntegerValueBlock = class extends HexBlock(ValueBlock) {
    setValueHex() {
      if (this.valueHexView.length >= 4) {
        this.warnings.push("Too big Integer for decoding, hex only");
        this.isHexOnly = true;
        this._valueDec = 0;
      } else {
        this.isHexOnly = false;
        if (this.valueHexView.length > 0) {
          if (!int_exports.isMinimal(this.valueHexView)) this.warnings.push("Needlessly long format");
          this._valueDec = int_exports.decode(this.valueHexView);
        }
      }
    }
    static {
      this.NAME = "IntegerValueBlock";
    }
    static {
      Object.defineProperty(this.prototype, "valueHex", {
        set: function(v) {
          this.valueHexView = new Uint8Array(v);
          this.setValueHex();
        },
        get: function() {
          return this.valueHexView.slice().buffer;
        }
      });
    }
    constructor({ value, ...parameters } = {}) {
      super(parameters);
      this._valueDec = 0;
      if (parameters.valueHex) this.setValueHex();
      if (value !== void 0) this.valueDec = value;
    }
    set valueDec(v) {
      if (!Number.isInteger(v)) throw new RangeError(`Integer value must be an integer, got ${v}`);
      this.valueHexView = int_exports.encode(BigInt(v));
      this.isHexOnly = false;
      this._valueDec = v;
    }
    get valueDec() {
      return this._valueDec;
    }
    fromDER(inputBuffer, inputOffset, inputLength, expectedLength = 0) {
      const offset = this.fromBER(inputBuffer, inputOffset, inputLength);
      if (offset === -1) return offset;
      const view = this.valueHexView;
      if (view[0] === 0 && (view[1] & 128) !== 0) this.valueHexView = view.subarray(1);
      else if (expectedLength !== 0) {
        if (view.length < expectedLength) {
          if (expectedLength - view.length > 1) expectedLength = view.length + 1;
          this.valueHexView = view.subarray(expectedLength - view.length);
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
          this.valueHexView = this.valueHexView.subarray(1);
      }
      return this.toBER(sizeOnly);
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const resultOffset = super.fromBER(inputBuffer, inputOffset, inputLength);
      if (resultOffset === -1) return resultOffset;
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
      return bytesToSignedBigInt(this.valueHexView).toString(10);
    }
  };
  var ORIGINAL_LOCAL_INTEGER_TO_BER = LocalIntegerValueBlock.prototype.toBER;
  var ORIGINAL_LOCAL_INTEGER_TO_STRING = LocalIntegerValueBlock.prototype.toString;
  var Integer = class Integer2 extends BaseBlock {
    static {
      typeStore.Integer = this;
    }
    static {
      this.NAME = "INTEGER";
    }
    constructor(parameters = {}) {
      super(parameters, LocalIntegerValueBlock);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 2;
    }
    toBigInt() {
      const valueBlock = this.valueBlock;
      const toString = valueBlock.toString;
      if (toString === ORIGINAL_LOCAL_INTEGER_TO_STRING) return bytesToSignedBigInt(valueBlock.valueHexView);
      return BigInt(Reflect.apply(toString, valueBlock, []));
    }
    static fromBigInt(value) {
      return new Integer2({ valueHex: signedBigIntToBytes(BigInt(value)) });
    }
    convertToDER() {
      const integer = new Integer2({ valueHex: this.valueBlock.valueHexView });
      integer.valueBlock.toDER();
      return integer;
    }
    convertFromDER() {
      return new Integer2({ valueHex: this.valueBlock.valueHexView[0] === 0 ? this.valueBlock.valueHexView.subarray(1) : this.valueBlock.valueHexView });
    }
    onAsciiEncoding() {
      return `${this.constructor.NAME} : ${this.valueBlock.toString()}`;
    }
  };
  var Enumerated = class extends Integer {
    static {
      typeStore.Enumerated = this;
    }
    static {
      this.NAME = "ENUMERATED";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 10;
    }
  };
  var LocalSidValueBlock = class extends HexBlock(ValueBlock) {
    static {
      this.NAME = "sidBlock";
    }
    constructor({ valueDec = -1, isFirstSid = false, ...parameters } = {}) {
      super(parameters);
      this.valueDec = valueDec;
      this.isFirstSid = isFirstSid;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      if (!inputLength) return inputOffset;
      const inputView = toUint8Array(inputBuffer);
      if (!checkBufferParams(this, inputView, inputOffset, inputLength)) return -1;
      const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);
      if (this.blockLength === 0 && Number.isInteger(inputOffset) && Number.isInteger(inputLength)) {
        let sidLength = 0;
        while (sidLength < inputLength) {
          const octet = intBuffer[sidLength];
          sidLength++;
          if ((octet & 128) === 0) break;
        }
        this.blockLength = sidLength;
        this.valueHexView = new Uint8Array(sidLength);
        for (let i = 0; i < sidLength; i++) this.valueHexView[i] = intBuffer[i] & 127;
      } else {
        this.valueHexView = new Uint8Array(inputLength);
        for (let i = 0; i < inputLength; i++) {
          this.valueHexView[i] = intBuffer[i] & 127;
          this.blockLength++;
          if ((intBuffer[i] & 128) === 0) break;
        }
        const tempView = new Uint8Array(this.blockLength);
        for (let i = 0; i < this.blockLength; i++) tempView[i] = this.valueHexView[i];
        this.valueHexView = tempView;
      }
      if ((intBuffer[this.blockLength - 1] & 128) !== 0) {
        this.error = "End of input reached before message was fully decoded";
        return -1;
      }
      if (this.valueHexView[0] === 0) this.warnings.push("Needlessly long format of SID encoding");
      const valueDec = this.blockLength <= 8 ? decodeBase128(this.valueHexView) : void 0;
      if (valueDec !== void 0) this.valueDec = valueDec;
      else {
        this.isHexOnly = true;
        this.warnings.push("Too big SID for decoding, hex only");
      }
      return inputOffset + this.blockLength;
    }
    set valueBigInt(value) {
      const bytes = encodeBase128(BigInt(value));
      if (!bytes) {
        this.error = "Error during encoding SID value";
        return;
      }
      for (let i = 0; i < bytes.length - 1; i++) bytes[i] |= 128;
      this.fromBER(bytes, 0, bytes.length);
    }
    toBER(sizeOnly) {
      if (this.isHexOnly) {
        if (sizeOnly) return new ArrayBuffer(this.valueHexView.byteLength);
        const curView = this.valueHexView;
        const retView2 = new Uint8Array(this.blockLength);
        for (let i = 0; i < this.blockLength - 1; i++) retView2[i] = curView[i] | 128;
        retView2[this.blockLength - 1] = curView[this.blockLength - 1];
        return toArrayBuffer(retView2);
      }
      const encodedBuf = encodeBase128(this.valueDec);
      if (!encodedBuf) {
        this.error = "Error during encoding SID value";
        return EMPTY_BUFFER;
      }
      const retView = new Uint8Array(encodedBuf.byteLength);
      if (!sizeOnly) {
        const len = encodedBuf.byteLength - 1;
        for (let i = 0; i < len; i++) retView[i] = encodedBuf[i] | 128;
        retView[len] = encodedBuf[len];
      }
      return toArrayBuffer(retView);
    }
    toString() {
      let result = "";
      if (this.isHexOnly) result = hex_exports.encode(this.valueHexView);
      else if (this.isFirstSid) {
        let sidValue = this.valueDec;
        if (this.valueDec <= 39) result = "0.";
        else if (this.valueDec <= 79) {
          result = "1.";
          sidValue -= 40;
        } else {
          result = "2.";
          sidValue -= 80;
        }
        result += sidValue.toString();
      } else result = this.valueDec.toString();
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
  var LocalObjectIdentifierValueBlock = class extends ValueBlock {
    static {
      this.NAME = "ObjectIdentifierValueBlock";
    }
    constructor({ value = "", ...parameters } = {}) {
      super(parameters);
      this.value = [];
      if (value) this.fromString(value);
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
        if (this.value.length === 0) sidBlock.isFirstSid = true;
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
      return concat2(retBuffers);
    }
    fromString(string) {
      this.value = [];
      let pos1 = 0;
      let pos2 = 0;
      let sid = "";
      let flag = false;
      do {
        pos2 = string.indexOf(".", pos1);
        if (pos2 === -1) sid = string.substring(pos1);
        else sid = string.substring(pos1, pos2);
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
          if (isNaN(parsedSID)) return;
          sidBlock.valueDec = parsedSID + plus;
          flag = false;
        } else {
          const sidBlock = new LocalSidValueBlock();
          if (sid > Number.MAX_SAFE_INTEGER) sidBlock.valueBigInt = BigInt(sid);
          else {
            sidBlock.valueDec = parseInt(sid, 10);
            if (isNaN(sidBlock.valueDec)) return;
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
        if (i !== 0) result = `${result}.`;
        if (isHexOnly) {
          sidStr = `{${sidStr}}`;
          if (this.value[i].isFirstSid) result = `2.{${sidStr} - 80}`;
          else result += sidStr;
        } else result += sidStr;
      }
      return result;
    }
    toJSON() {
      const object = {
        ...super.toJSON(),
        value: this.toString(),
        sidArray: []
      };
      for (let i = 0; i < this.value.length; i++) object.sidArray.push(this.value[i].toJSON());
      return object;
    }
  };
  var ObjectIdentifier = class extends BaseBlock {
    static {
      typeStore.ObjectIdentifier = this;
    }
    static {
      this.NAME = "OBJECT IDENTIFIER";
    }
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
  var LocalRelativeSidValueBlock = class extends HexBlock(LocalBaseBlock) {
    static {
      this.NAME = "relativeSidBlock";
    }
    constructor({ valueDec = 0, ...parameters } = {}) {
      super(parameters);
      this.valueDec = valueDec;
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      if (inputLength === 0) return inputOffset;
      const inputView = toUint8Array(inputBuffer);
      if (!checkBufferParams(this, inputView, inputOffset, inputLength)) return -1;
      const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);
      if (this.blockLength === 0 && Number.isInteger(inputOffset) && Number.isInteger(inputLength)) {
        let sidLength = 0;
        while (sidLength < inputLength) {
          const octet = intBuffer[sidLength];
          sidLength++;
          if ((octet & 128) === 0) break;
        }
        this.blockLength = sidLength;
        this.valueHexView = new Uint8Array(sidLength);
        for (let i = 0; i < sidLength; i++) this.valueHexView[i] = intBuffer[i] & 127;
      } else {
        this.valueHexView = new Uint8Array(inputLength);
        for (let i = 0; i < inputLength; i++) {
          this.valueHexView[i] = intBuffer[i] & 127;
          this.blockLength++;
          if ((intBuffer[i] & 128) === 0) break;
        }
        const tempView = new Uint8Array(this.blockLength);
        for (let i = 0; i < this.blockLength; i++) tempView[i] = this.valueHexView[i];
        this.valueHexView = tempView;
      }
      if ((intBuffer[this.blockLength - 1] & 128) !== 0) {
        this.error = "End of input reached before message was fully decoded";
        return -1;
      }
      if (this.valueHexView[0] === 0) this.warnings.push("Needlessly long format of SID encoding");
      const valueDec = this.blockLength <= 8 ? decodeBase128(this.valueHexView) : void 0;
      if (valueDec !== void 0) this.valueDec = valueDec;
      else {
        this.isHexOnly = true;
        this.warnings.push("Too big SID for decoding, hex only");
      }
      return inputOffset + this.blockLength;
    }
    toBER(sizeOnly) {
      if (this.isHexOnly) {
        if (sizeOnly) return new ArrayBuffer(this.valueHexView.byteLength);
        const curView = this.valueHexView;
        const retView2 = new Uint8Array(this.blockLength);
        for (let i = 0; i < this.blockLength - 1; i++) retView2[i] = curView[i] | 128;
        retView2[this.blockLength - 1] = curView[this.blockLength - 1];
        return retView2.buffer;
      }
      const encodedBuf = encodeBase128(this.valueDec);
      if (!encodedBuf) {
        this.error = "Error during encoding SID value";
        return EMPTY_BUFFER;
      }
      const retView = new Uint8Array(encodedBuf.byteLength);
      if (!sizeOnly) {
        const len = encodedBuf.byteLength - 1;
        for (let i = 0; i < len; i++) retView[i] = encodedBuf[i] | 128;
        retView[len] = encodedBuf[len];
      }
      return retView.buffer;
    }
    toString() {
      let result = "";
      if (this.isHexOnly) result = hex_exports.encode(this.valueHexView);
      else result = this.valueDec.toString();
      return result;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        valueDec: this.valueDec
      };
    }
  };
  var LocalRelativeObjectIdentifierValueBlock = class extends ValueBlock {
    static {
      this.NAME = "RelativeObjectIdentifierValueBlock";
    }
    constructor({ value = "", ...parameters } = {}) {
      super(parameters);
      this.value = [];
      if (value) this.fromString(value);
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
      return concat2(retBuffers);
    }
    fromString(string) {
      this.value = [];
      let pos1 = 0;
      let pos2 = 0;
      let sid = "";
      do {
        pos2 = string.indexOf(".", pos1);
        if (pos2 === -1) sid = string.substring(pos1);
        else sid = string.substring(pos1, pos2);
        pos1 = pos2 + 1;
        const sidBlock = new LocalRelativeSidValueBlock();
        sidBlock.valueDec = parseInt(sid, 10);
        if (isNaN(sidBlock.valueDec)) return true;
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
        if (i !== 0) result = `${result}.`;
        if (isHexOnly) {
          sidStr = `{${sidStr}}`;
          result += sidStr;
        } else result += sidStr;
      }
      return result;
    }
    toJSON() {
      const object = {
        ...super.toJSON(),
        value: this.toString(),
        sidArray: []
      };
      for (let i = 0; i < this.value.length; i++) object.sidArray.push(this.value[i].toJSON());
      return object;
    }
  };
  var RelativeObjectIdentifier = class extends BaseBlock {
    static {
      typeStore.RelativeObjectIdentifier = this;
    }
    getValue() {
      return this.valueBlock.toString();
    }
    setValue(value) {
      this.valueBlock.fromString(value);
    }
    static {
      this.NAME = "RelativeObjectIdentifier";
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
  var Sequence = class extends Constructed {
    static {
      typeStore.Sequence = this;
    }
    static {
      this.NAME = "SEQUENCE";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 16;
    }
  };
  var Set2 = class extends Constructed {
    static {
      typeStore.Set = this;
    }
    static {
      this.NAME = "SET";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 17;
    }
  };
  var LocalStringValueBlock = class extends HexBlock(ValueBlock) {
    static {
      this.NAME = "StringValueBlock";
    }
    constructor({ ...parameters } = {}) {
      super(parameters);
      this.isHexOnly = true;
      this.value = "";
    }
    toJSON() {
      return {
        ...super.toJSON(),
        value: this.value
      };
    }
  };
  var LocalSimpleStringValueBlock = class extends LocalStringValueBlock {
    static {
      this.NAME = "SimpleStringValueBlock";
    }
  };
  var LocalSimpleStringBlock = class extends BaseStringBlock {
    static {
      this.NAME = "SIMPLE STRING";
    }
    constructor({ ...parameters } = {}) {
      super(parameters, LocalSimpleStringValueBlock);
    }
    fromBuffer(inputBuffer) {
      this.valueBlock.value = String.fromCharCode.apply(null, toUint8Array(inputBuffer));
    }
    fromString(inputString) {
      const strLen = inputString.length;
      const view = this.valueBlock.valueHexView = new Uint8Array(strLen);
      for (let i = 0; i < strLen; i++) view[i] = inputString.charCodeAt(i);
      this.valueBlock.value = inputString;
    }
  };
  var strictUtf8Decoder = new TextDecoder("utf-8", {
    fatal: true,
    ignoreBOM: true
  });
  var LONE_SURROGATE = /\p{Cs}/u;
  var LocalUtf8StringValueBlock = class extends LocalSimpleStringBlock {
    static {
      this.NAME = "Utf8StringValueBlock";
    }
    fromBuffer(inputBuffer) {
      this.valueBlock.valueHexView = toUint8Array(inputBuffer);
      try {
        this.valueBlock.value = strictUtf8Decoder.decode(this.valueBlock.valueHexView);
      } catch (ex) {
        this.warnings.push(`Error during "decodeURIComponent": ${ex}, using raw string`);
        this.valueBlock.value = binary_exports.encode(inputBuffer);
      }
    }
    fromString(inputString) {
      if (LONE_SURROGATE.test(inputString)) throw new TypeError("The string contains lone surrogates and cannot be encoded as UTF-8");
      this.valueBlock.valueHexView = utf8_exports.encode(inputString);
      this.valueBlock.value = inputString;
    }
  };
  var Utf8String = class extends LocalUtf8StringValueBlock {
    static {
      typeStore.Utf8String = this;
    }
    static {
      this.NAME = "UTF8String";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 12;
    }
  };
  var LocalBmpStringValueBlock = class extends LocalSimpleStringBlock {
    static {
      this.NAME = "BmpStringValueBlock";
    }
    checkValue(view) {
      return view.length % 2 !== 0 ? "BMPString value length must be a multiple of 2" : "";
    }
    fromBuffer(inputBuffer) {
      this.valueBlock.value = utf16_exports.decode(inputBuffer);
      this.valueBlock.valueHexView = toUint8Array(inputBuffer);
    }
    fromString(inputString) {
      this.valueBlock.value = inputString;
      this.valueBlock.valueHexView = utf16_exports.encode(inputString);
    }
  };
  var BmpString = class extends LocalBmpStringValueBlock {
    static {
      typeStore.BmpString = this;
    }
    static {
      this.NAME = "BMPString";
    }
    constructor({ ...parameters } = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 30;
    }
  };
  var MAX_CODE_POINT = 1114111;
  var REPLACEMENT_CODE_POINT = 65533;
  var LocalUniversalStringValueBlock = class extends LocalSimpleStringBlock {
    static {
      this.NAME = "UniversalStringValueBlock";
    }
    checkValue(view) {
      return view.length % 4 !== 0 ? "UniversalString value length must be a multiple of 4" : "";
    }
    fromBuffer(inputBuffer) {
      const view = toUint8Array(inputBuffer);
      const data = new DataView(view.buffer, view.byteOffset, view.byteLength);
      const count = view.length >> 2;
      const codePoints = [];
      for (let i = 0; i < count; i++) {
        const codePoint = data.getUint32(i * 4);
        if (codePoint > MAX_CODE_POINT) {
          this.warnings.push(`Code point 0x${codePoint.toString(16)} is outside the Unicode range, using U+FFFD`);
          codePoints.push(REPLACEMENT_CODE_POINT);
        } else if (codePoint >= 55296 && codePoint <= 57343) {
          const next = i + 1 < count ? data.getUint32((i + 1) * 4) : 0;
          if (codePoint <= 56319 && next >= 56320 && next <= 57343) {
            codePoints.push(65536 + (codePoint - 55296 << 10) + (next - 56320));
            i++;
          } else {
            this.warnings.push(`Code point 0x${codePoint.toString(16)} is a lone surrogate, using U+FFFD`);
            codePoints.push(REPLACEMENT_CODE_POINT);
          }
        } else codePoints.push(codePoint);
      }
      let value = "";
      for (let i = 0; i < codePoints.length; i += 8192) value += String.fromCodePoint(...codePoints.slice(i, i + 8192));
      this.valueBlock.value = value;
    }
    fromString(inputString) {
      const codePoints = Array.from(inputString, (char) => char.codePointAt(0));
      const valueHexView = this.valueBlock.valueHexView = new Uint8Array(codePoints.length * 4);
      for (let i = 0; i < codePoints.length; i++) valueHexView.set(uint_exports.encode(codePoints[i], { length: 4 }), i * 4);
      this.valueBlock.value = inputString;
    }
  };
  var UniversalString = class extends LocalUniversalStringValueBlock {
    static {
      typeStore.UniversalString = this;
    }
    static {
      this.NAME = "UniversalString";
    }
    constructor({ ...parameters } = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 28;
    }
  };
  var NumericString = class extends LocalSimpleStringBlock {
    static {
      typeStore.NumericString = this;
    }
    static {
      this.NAME = "NumericString";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 18;
    }
  };
  var PrintableString = class extends LocalSimpleStringBlock {
    static {
      typeStore.PrintableString = this;
    }
    static {
      this.NAME = "PrintableString";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 19;
    }
  };
  var TeletexString = class extends LocalSimpleStringBlock {
    static {
      typeStore.TeletexString = this;
    }
    static {
      this.NAME = "TeletexString";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 20;
    }
  };
  var VideotexString = class extends LocalSimpleStringBlock {
    static {
      typeStore.VideotexString = this;
    }
    static {
      this.NAME = "VideotexString";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 21;
    }
  };
  var IA5String = class extends LocalSimpleStringBlock {
    static {
      typeStore.IA5String = this;
    }
    static {
      this.NAME = "IA5String";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 22;
    }
  };
  var GraphicString = class extends LocalSimpleStringBlock {
    static {
      typeStore.GraphicString = this;
    }
    static {
      this.NAME = "GraphicString";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 25;
    }
  };
  var VisibleString = class extends LocalSimpleStringBlock {
    static {
      typeStore.VisibleString = this;
    }
    static {
      this.NAME = "VisibleString";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 26;
    }
  };
  var GeneralString = class extends LocalSimpleStringBlock {
    static {
      typeStore.GeneralString = this;
    }
    static {
      this.NAME = "GeneralString";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 27;
    }
  };
  var CharacterString = class extends LocalSimpleStringBlock {
    static {
      typeStore.CharacterString = this;
    }
    static {
      this.NAME = "CharacterString";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 29;
    }
  };
  var UTCTime = class extends VisibleString {
    static {
      typeStore.UTCTime = this;
    }
    static {
      this.NAME = "UTCTime";
    }
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
        for (let i = 0; i < value.length; i++) this.valueBlock.valueHexView[i] = value.charCodeAt(i);
      }
      if (valueDate) {
        this.fromDate(valueDate);
        this.valueBlock.valueHexView = new Uint8Array(this.toBuffer());
      }
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 23;
    }
    fromBuffer(inputBuffer) {
      this.fromString(String.fromCharCode.apply(null, toUint8Array(inputBuffer)));
    }
    toBuffer() {
      this.checkYear();
      const str = this.toString();
      const buffer = new ArrayBuffer(str.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < str.length; i++) view[i] = str.charCodeAt(i);
      return buffer;
    }
    checkYear() {
      if (!(this.year >= 1950 && this.year <= 2049)) throw new RangeError(`UTCTime year must be between 1950 and 2049, got ${this.year}; use GeneralizedTime instead`);
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
      const parserArray = /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z/gi.exec(inputString);
      if (parserArray === null) {
        this.error = "Wrong input string for conversion";
        return;
      }
      const year = parseInt(parserArray[1], 10);
      if (year >= 50) this.year = 1900 + year;
      else this.year = 2e3 + year;
      this.month = parseInt(parserArray[2], 10);
      this.day = parseInt(parserArray[3], 10);
      this.hour = parseInt(parserArray[4], 10);
      this.minute = parseInt(parserArray[5], 10);
      this.second = parseInt(parserArray[6], 10);
    }
    toString(encoding = "iso") {
      if (encoding === "iso") {
        const outputArray = Array.from({ length: 7 });
        outputArray[0] = String(this.year % 100).padStart(2, "0");
        outputArray[1] = String(this.month).padStart(2, "0");
        outputArray[2] = String(this.day).padStart(2, "0");
        outputArray[3] = String(this.hour).padStart(2, "0");
        outputArray[4] = String(this.minute).padStart(2, "0");
        outputArray[5] = String(this.second).padStart(2, "0");
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
  var GeneralizedTime = class extends UTCTime {
    static {
      typeStore.GeneralizedTime = this;
    }
    static {
      this.NAME = "GeneralizedTime";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.millisecond ??= 0;
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 24;
    }
    checkYear() {
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
        if (isNaN(number.valueOf())) throw new Error("Wrong input string for conversion");
        timeString = inputString;
      }
      if (isUTC) {
        if (timeString.indexOf("+") !== -1) throw new Error("Wrong input string for conversion");
        if (timeString.indexOf("-") !== -1) throw new Error("Wrong input string for conversion");
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
          if (differenceString.length !== 2 && differenceString.length !== 4) throw new Error("Wrong input string for conversion");
          let number = parseInt(differenceString.substring(0, 2), 10);
          if (isNaN(number.valueOf())) throw new Error("Wrong input string for conversion");
          hourDifference = multiplier * number;
          if (differenceString.length === 4) {
            number = parseInt(differenceString.substring(2, 4), 10);
            if (isNaN(number.valueOf())) throw new Error("Wrong input string for conversion");
            minuteDifference = multiplier * number;
          }
        }
      }
      let fractionPointPosition = timeString.indexOf(".");
      if (fractionPointPosition === -1) fractionPointPosition = timeString.indexOf(",");
      if (fractionPointPosition !== -1) {
        const fractionPartCheck = /* @__PURE__ */ new Number(`0${timeString.substring(fractionPointPosition)}`);
        if (isNaN(fractionPartCheck.valueOf())) throw new Error("Wrong input string for conversion");
        fractionPart = fractionPartCheck.valueOf();
        dateTimeString = timeString.substring(0, fractionPointPosition);
      } else dateTimeString = timeString;
      switch (true) {
        case dateTimeString.length === 8:
          parser = /(\d{4})(\d{2})(\d{2})/gi;
          if (fractionPointPosition !== -1) throw new Error("Wrong input string for conversion");
          break;
        case dateTimeString.length === 10:
          parser = /(\d{4})(\d{2})(\d{2})(\d{2})/gi;
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
          parser = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/gi;
          if (fractionPointPosition !== -1) {
            let fractionResult = 60 * fractionPart;
            this.second = Math.floor(fractionResult);
            fractionResult = 1e3 * (fractionResult - this.second);
            this.millisecond = Math.floor(fractionResult);
          }
          break;
        case dateTimeString.length === 14:
          parser = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/gi;
          if (fractionPointPosition !== -1) {
            const fractionResult = 1e3 * fractionPart;
            this.millisecond = Math.floor(fractionResult);
          }
          break;
        default:
          throw new Error("Wrong input string for conversion");
      }
      const parserArray = parser.exec(dateTimeString);
      if (parserArray === null) throw new Error("Wrong input string for conversion");
      for (let j = 1; j < parserArray.length; j++) switch (j) {
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
        outputArray.push(String(this.year).padStart(4, "0"));
        outputArray.push(String(this.month).padStart(2, "0"));
        outputArray.push(String(this.day).padStart(2, "0"));
        outputArray.push(String(this.hour).padStart(2, "0"));
        outputArray.push(String(this.minute).padStart(2, "0"));
        outputArray.push(String(this.second).padStart(2, "0"));
        if (this.millisecond !== 0) {
          outputArray.push(".");
          outputArray.push(String(this.millisecond).padStart(3, "0").replace(/0+$/, ""));
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
  var DATE = class extends Utf8String {
    static {
      typeStore.DATE = this;
    }
    static {
      this.NAME = "DATE";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 31;
    }
  };
  var TimeOfDay = class extends Utf8String {
    static {
      typeStore.TimeOfDay = this;
    }
    static {
      this.NAME = "TimeOfDay";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 32;
    }
  };
  var DateTime = class extends Utf8String {
    static {
      typeStore.DateTime = this;
    }
    static {
      this.NAME = "DateTime";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 33;
    }
  };
  var Duration = class extends Utf8String {
    static {
      typeStore.Duration = this;
    }
    static {
      this.NAME = "Duration";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 34;
    }
  };
  var TIME = class extends Utf8String {
    static {
      typeStore.TIME = this;
    }
    static {
      this.NAME = "TIME";
    }
    constructor(parameters = {}) {
      super(parameters);
      this.idBlock.tagClass = 1;
      this.idBlock.tagNumber = 14;
    }
  };
  var Any = class {
    constructor({ name = "", optional = false } = {}) {
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
      this.dataView = toUint8Array(value);
    }
    constructor({ data = EMPTY_VIEW } = {}) {
      this.dataView = toUint8Array(data);
    }
    fromBER(inputBuffer, inputOffset, inputLength) {
      const endLength = inputOffset + inputLength;
      this.dataView = toUint8Array(inputBuffer).subarray(inputOffset, endLength);
      return endLength;
    }
    toBER(_sizeOnly) {
      return this.dataView.slice().buffer;
    }
  };
  function compareSchema(root, inputData, inputSchema) {
    if (inputSchema instanceof Choice) {
      for (const element of inputSchema.value) if (compareSchema(root, inputData, element).verified) return {
        verified: true,
        result: root
      };
      {
        const _result = {
          verified: false,
          result: { error: "Wrong values for Choice type" }
        };
        if (inputSchema.hasOwnProperty("name")) _result.name = inputSchema.name;
        return _result;
      }
    }
    if (inputSchema instanceof Any) {
      if (inputSchema.hasOwnProperty("name")) root[inputSchema.name] = inputData;
      return {
        verified: true,
        result: root
      };
    }
    if (root instanceof Object === false) return {
      verified: false,
      result: { error: "Wrong root object" }
    };
    if (inputData instanceof Object === false) return {
      verified: false,
      result: { error: "Wrong ASN.1 data" }
    };
    if (inputSchema instanceof Object === false) return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
    if ("idBlock" in inputSchema === false) return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
    if ("fromBER" in inputSchema.idBlock === false) return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
    if ("toBER" in inputSchema.idBlock === false) return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
    const encodedId = inputSchema.idBlock.toBER(false);
    if (encodedId.byteLength === 0) return {
      verified: false,
      result: { error: "Error encoding idBlock for ASN.1 schema" }
    };
    if (inputSchema.idBlock.fromBER(encodedId, 0, encodedId.byteLength) === -1) return {
      verified: false,
      result: { error: "Error decoding idBlock for ASN.1 schema" }
    };
    if (inputSchema.idBlock.hasOwnProperty("tagClass") === false) return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
    if (inputSchema.idBlock.tagClass !== inputData.idBlock.tagClass) return {
      verified: false,
      result: root
    };
    if (inputSchema.idBlock.hasOwnProperty("tagNumber") === false) return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
    if (inputSchema.idBlock.tagNumber !== inputData.idBlock.tagNumber) return {
      verified: false,
      result: root
    };
    if (inputSchema.idBlock.hasOwnProperty("isConstructed") === false) return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
    if (inputSchema.idBlock.isConstructed !== inputData.idBlock.isConstructed) return {
      verified: false,
      result: root
    };
    if (!("isHexOnly" in inputSchema.idBlock)) return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
    if (inputSchema.idBlock.isHexOnly !== inputData.idBlock.isHexOnly) return {
      verified: false,
      result: root
    };
    if (inputSchema.idBlock.isHexOnly) {
      if ("valueHexView" in inputSchema.idBlock === false) return {
        verified: false,
        result: { error: "Wrong ASN.1 schema" }
      };
      const schemaView = inputSchema.idBlock.valueHexView;
      const asn1View = inputData.idBlock.valueHexView;
      if (schemaView.length !== asn1View.length) return {
        verified: false,
        result: root
      };
      for (let i = 0; i < schemaView.length; i++) if (schemaView[i] !== asn1View[1]) return {
        verified: false,
        result: root
      };
    }
    if (inputSchema.name) {
      inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, "");
      if (inputSchema.name) root[inputSchema.name] = inputData;
    }
    if (inputSchema instanceof typeStore.Constructed) {
      let admission = 0;
      let result = {
        verified: false,
        result: { error: "Unknown error" }
      };
      let maxLength = inputSchema.valueBlock.value.length;
      if (maxLength > 0) {
        if (inputSchema.valueBlock.value[0] instanceof Repeated) maxLength = inputData.valueBlock.value.length;
      }
      if (maxLength === 0) return {
        verified: true,
        result: root
      };
      if (inputData.valueBlock.value.length === 0 && inputSchema.valueBlock.value.length !== 0) {
        let _optional = true;
        for (let i = 0; i < inputSchema.valueBlock.value.length; i++) _optional = _optional && (inputSchema.valueBlock.value[i].optional || false);
        if (_optional) return {
          verified: true,
          result: root
        };
        if (inputSchema.name) {
          inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, "");
          if (inputSchema.name) delete root[inputSchema.name];
        }
        root.error = "Inconsistent object length";
        return {
          verified: false,
          result: root
        };
      }
      for (let i = 0; i < maxLength; i++) if (i - admission >= inputData.valueBlock.value.length) {
        if (inputSchema.valueBlock.value[i].optional === false) {
          const _result = {
            verified: false,
            result: root
          };
          root.error = "Inconsistent length between ASN.1 data and schema";
          if (inputSchema.name) {
            inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, "");
            if (inputSchema.name) {
              delete root[inputSchema.name];
              _result.name = inputSchema.name;
            }
          }
          return _result;
        }
      } else if (inputSchema.valueBlock.value[0] instanceof Repeated) {
        result = compareSchema(root, inputData.valueBlock.value[i], inputSchema.valueBlock.value[0].value);
        if (result.verified === false) {
          if (inputSchema.valueBlock.value[0].optional) admission++;
          else {
            if (inputSchema.name) {
              inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, "");
              if (inputSchema.name) delete root[inputSchema.name];
            }
            return result;
          }
        }
        if ("name" in inputSchema.valueBlock.value[0] && inputSchema.valueBlock.value[0].name.length > 0) {
          let arrayRoot = {};
          if ("local" in inputSchema.valueBlock.value[0] && inputSchema.valueBlock.value[0].local) arrayRoot = inputData;
          else arrayRoot = root;
          if (typeof arrayRoot[inputSchema.valueBlock.value[0].name] === "undefined") arrayRoot[inputSchema.valueBlock.value[0].name] = [];
          arrayRoot[inputSchema.valueBlock.value[0].name].push(inputData.valueBlock.value[i]);
        }
      } else {
        result = compareSchema(root, inputData.valueBlock.value[i - admission], inputSchema.valueBlock.value[i]);
        if (result.verified === false) {
          if (inputSchema.valueBlock.value[i].optional) admission++;
          else {
            if (inputSchema.name) {
              inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, "");
              if (inputSchema.name) delete root[inputSchema.name];
            }
            return result;
          }
        }
      }
      if (result.verified === false) {
        const _result = {
          verified: false,
          result: root
        };
        if (inputSchema.name) {
          inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, "");
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
    if (inputSchema.primitiveSchema && "valueHexView" in inputData.valueBlock) {
      const asn1 = localFromBER(inputData.valueBlock.valueHexView);
      if (asn1.offset === -1) {
        const _result = {
          verified: false,
          result: asn1.result
        };
        if (inputSchema.name) {
          inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, "");
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
    if (inputSchema instanceof Object === false) return {
      verified: false,
      result: { error: "Wrong ASN.1 schema type" }
    };
    const asn1 = localFromBER(toUint8Array(inputBuffer));
    if (asn1.offset === -1) return {
      verified: false,
      result: asn1.result
    };
    return compareSchema(asn1.result, asn1.result, inputSchema);
  }
  registerBuiltinEncoder({
    BitString,
    Integer,
    OctetString,
    Primitive,
    Constructed,
    Sequence,
    Set: Set2
  }, {
    BaseBlock,
    ViewWriter,
    LocalIdentificationBlock,
    LocalLengthBlock,
    LocalIntegerValueBlock,
    LocalOctetStringValueBlock,
    LocalConstructedValueBlock,
    LocalBitStringValueBlock,
    LocalPrimitiveValueBlock,
    originalBaseBlockToBER: ORIGINAL_BASE_BLOCK_TO_BER,
    originalWriterWrite: ORIGINAL_VIEW_WRITER_WRITE,
    originalWriterFinal: ORIGINAL_VIEW_WRITER_FINAL,
    originalIdentificationToBER: ORIGINAL_LOCAL_IDENTIFICATION_TO_BER,
    originalLengthToBER: ORIGINAL_LOCAL_LENGTH_TO_BER,
    originalIntegerToBER: ORIGINAL_LOCAL_INTEGER_TO_BER,
    originalOctetStringToBER: ORIGINAL_LOCAL_OCTET_STRING_TO_BER,
    originalBitStringToBER: ORIGINAL_LOCAL_BIT_STRING_TO_BER,
    originalConstructedToBER: ORIGINAL_LOCAL_CONSTRUCTED_TO_BER,
    originalPrimitiveToBER: ORIGINAL_LOCAL_PRIMITIVE_TO_BER
  });
  registerFastParser({
    Integer,
    Null,
    Sequence
  });

  // node_modules/@peculiar/asn1-schema/build/types/bit_string.js
  var BitString2 = class {
    unusedBits = 0;
    value = /* @__PURE__ */ new ArrayBuffer(0);
    constructor(params, unusedBits = 0) {
      if (params) {
        if (typeof params === "number") this.fromNumber(params);
        else if (isBufferSource(params)) {
          this.unusedBits = unusedBits;
          this.value = toArrayBuffer(params);
        } else throw TypeError("Unsupported type of 'params' argument for BitString");
      }
    }
    fromASN(asn) {
      if (!(asn instanceof BitString)) throw new TypeError("Argument 'asn' is not instance of ASN.1 BitString");
      this.unusedBits = asn.valueBlock.unusedBits;
      this.value = toArrayBuffer(asn.valueBlock.valueHex);
      return this;
    }
    toASN() {
      return new BitString({
        unusedBits: this.unusedBits,
        valueHex: this.value
      });
    }
    toSchema(name) {
      return new BitString({ name });
    }
    toNumber() {
      let res = "";
      const uintArray = new Uint8Array(this.value);
      for (const octet of uintArray) res += octet.toString(2).padStart(8, "0");
      res = res.split("").reverse().join("");
      if (this.unusedBits) res = res.slice(this.unusedBits).padStart(this.unusedBits, "0");
      return parseInt(res, 2);
    }
    fromNumber(value) {
      let bits = value.toString(2);
      const octetSize = bits.length + 7 >> 3;
      this.unusedBits = (octetSize << 3) - bits.length;
      const octets = new Uint8Array(octetSize);
      bits = bits.padStart(octetSize << 3, "0").split("").reverse().join("");
      let index = 0;
      while (index < octetSize) {
        octets[index] = parseInt(bits.slice(index << 3, (index << 3) + 8), 2);
        index++;
      }
      this.value = octets.buffer;
    }
  };

  // node_modules/@peculiar/asn1-schema/build/types/octet_string.js
  var OctetString3 = class {
    buffer;
    get byteLength() {
      return this.buffer.byteLength;
    }
    get byteOffset() {
      return 0;
    }
    constructor(param) {
      if (typeof param === "number") this.buffer = new ArrayBuffer(param);
      else if (isBufferSource(param)) this.buffer = toArrayBuffer(param);
      else if (Array.isArray(param)) this.buffer = new Uint8Array(param).buffer;
      else this.buffer = /* @__PURE__ */ new ArrayBuffer(0);
    }
    fromASN(asn) {
      if (!(asn instanceof OctetString)) throw new TypeError("Argument 'asn' is not instance of ASN.1 OctetString");
      this.buffer = toArrayBuffer(asn.valueBlock.valueHex);
      return this;
    }
    toASN() {
      return new OctetString({ valueHex: this.buffer });
    }
    toSchema(name) {
      return new OctetString({ name });
    }
  };

  // node_modules/@peculiar/asn1-schema/build/converters.js
  var AsnAnyConverter = {
    fromASN: (value) => value instanceof Null ? null : toArrayBuffer(value.valueBeforeDecodeView),
    toASN: (value) => {
      if (value === null) return new Null();
      const schema = fromBER(value, {
        maxDepth: Infinity,
        maxNodes: Infinity,
        maxContentLength: Infinity
      });
      if (schema.result.error) throw new Error(schema.result.error);
      return schema.result;
    }
  };
  var AsnIntegerConverter = {
    fromASN: (value) => value.valueBlock.valueHexView.byteLength >= 4 ? value.valueBlock.toString() : value.valueBlock.valueDec,
    toASN: (value) => new Integer({ value: +value })
  };
  var AsnEnumeratedConverter = {
    fromASN: (value) => value.valueBlock.valueDec,
    toASN: (value) => new Enumerated({ value })
  };
  var AsnIntegerArrayBufferConverter = {
    fromASN: (value) => toArrayBuffer(value.valueBlock.valueHexView),
    toASN: (value) => new Integer({ valueHex: value })
  };
  var AsnBitStringConverter = {
    fromASN: (value) => toArrayBuffer(value.valueBlock.valueHexView),
    toASN: (value) => new BitString({ valueHex: value })
  };
  var AsnObjectIdentifierConverter = {
    fromASN: (value) => value.valueBlock.toString(),
    toASN: (value) => new ObjectIdentifier({ value })
  };
  var AsnRelativeObjectIdentifierConverter = {
    fromASN: (value) => value.valueBlock.toString(),
    toASN: (value) => new RelativeObjectIdentifier({ value })
  };
  var AsnBooleanConverter = {
    fromASN: (value) => value.valueBlock.value,
    toASN: (value) => new Boolean({ value })
  };
  var AsnOctetStringConverter = {
    fromASN: (value) => toArrayBuffer(value.valueBlock.valueHexView),
    toASN: (value) => new OctetString({ valueHex: value })
  };
  function createStringConverter(Asn1Type) {
    return {
      fromASN: (value) => value.valueBlock.value,
      toASN: (value) => new Asn1Type({ value })
    };
  }
  var AsnUtf8StringConverter = createStringConverter(Utf8String);
  var AsnBmpStringConverter = createStringConverter(BmpString);
  var AsnUniversalStringConverter = createStringConverter(UniversalString);
  var AsnNumericStringConverter = createStringConverter(NumericString);
  var AsnPrintableStringConverter = createStringConverter(PrintableString);
  var AsnTeletexStringConverter = createStringConverter(TeletexString);
  var AsnVideotexStringConverter = createStringConverter(VideotexString);
  var AsnIA5StringConverter = createStringConverter(IA5String);
  var AsnGraphicStringConverter = createStringConverter(GraphicString);
  var AsnVisibleStringConverter = createStringConverter(VisibleString);
  var AsnGeneralStringConverter = createStringConverter(GeneralString);
  var AsnCharacterStringConverter = createStringConverter(CharacterString);
  var AsnUTCTimeConverter = {
    fromASN: (value) => value.toDate(),
    toASN: (value) => new UTCTime({ valueDate: value })
  };
  var AsnGeneralizedTimeConverter = {
    fromASN: (value) => value.toDate(),
    toASN: (value) => new GeneralizedTime({ valueDate: value })
  };
  var AsnNullConverter = {
    fromASN: () => null,
    toASN: () => {
      return new Null();
    }
  };
  function defaultConverter(type) {
    switch (type) {
      case 1:
        return AsnAnyConverter;
      case 4:
        return AsnBitStringConverter;
      case 9:
        return AsnBmpStringConverter;
      case 2:
        return AsnBooleanConverter;
      case 19:
        return AsnCharacterStringConverter;
      case 6:
        return AsnEnumeratedConverter;
      case 18:
        return AsnGeneralStringConverter;
      case 21:
        return AsnGeneralizedTimeConverter;
      case 16:
        return AsnGraphicStringConverter;
      case 15:
        return AsnIA5StringConverter;
      case 5:
        return AsnIntegerConverter;
      case 27:
        return AsnNullConverter;
      case 11:
        return AsnNumericStringConverter;
      case 7:
        return AsnObjectIdentifierConverter;
      case 28:
        return AsnRelativeObjectIdentifierConverter;
      case 3:
        return AsnOctetStringConverter;
      case 12:
        return AsnPrintableStringConverter;
      case 13:
        return AsnTeletexStringConverter;
      case 20:
        return AsnUTCTimeConverter;
      case 10:
        return AsnUniversalStringConverter;
      case 8:
        return AsnUtf8StringConverter;
      case 14:
        return AsnVideotexStringConverter;
      case 17:
        return AsnVisibleStringConverter;
      default:
        return null;
    }
  }

  // node_modules/@peculiar/asn1-schema/build/helper.js
  function isConvertible(target) {
    if (typeof target === "function" && target.prototype) {
      if (target.prototype.toASN && target.prototype.fromASN) return true;
      else return isConvertible(target.prototype);
    } else return !!(target && typeof target === "object" && "toASN" in target && "fromASN" in target);
  }
  function isTypeOfArray(target) {
    if (target) {
      const proto = Object.getPrototypeOf(target);
      if (proto?.prototype?.constructor === Array) return true;
      return isTypeOfArray(proto);
    }
    return false;
  }
  function isArrayEqual(bytes1, bytes2) {
    if (!(bytes1 && bytes2)) return false;
    if (bytes1.byteLength !== bytes2.byteLength) return false;
    const b1 = new Uint8Array(bytes1);
    const b2 = new Uint8Array(bytes2);
    for (let i = 0; i < bytes1.byteLength; i++) if (b1[i] !== b2[i]) return false;
    return true;
  }

  // node_modules/@peculiar/asn1-schema/build/schema.js
  var AsnSchemaStorage = class {
    items = /* @__PURE__ */ new WeakMap();
    has(target) {
      return this.items.has(target);
    }
    get(target, checkSchema = false) {
      const schema = this.items.get(target);
      if (!schema) throw new Error(`Cannot get schema for '${target.prototype.constructor.name}' target`);
      if (checkSchema && !schema.schema) throw new Error(`Schema '${target.prototype.constructor.name}' doesn't contain ASN.1 schema. Call 'AsnSchemaStorage.cache'.`);
      return schema;
    }
    cache(target) {
      const schema = this.get(target);
      if (!schema.schema) schema.schema = this.create(target, true);
    }
    createDefault(target) {
      const schema = {
        type: 0,
        items: {}
      };
      const parentSchema = this.findParentSchema(target);
      if (parentSchema) {
        Object.assign(schema, parentSchema);
        schema.items = Object.assign({}, schema.items, parentSchema.items);
      }
      return schema;
    }
    create(target, useNames) {
      const schema = this.items.get(target) || this.createDefault(target);
      const asn1Value = [];
      for (const key in schema.items) {
        const item = schema.items[key];
        const name = useNames ? key : "";
        let asn1Item;
        if (typeof item.type === "number") {
          const Asn1TypeName = AsnPropTypes[item.type];
          const Asn1Type = build_exports[Asn1TypeName];
          if (!Asn1Type) throw new Error(`Cannot get ASN1 class by name '${Asn1TypeName}'`);
          asn1Item = new Asn1Type({ name });
        } else if (isConvertible(item.type)) asn1Item = new item.type().toSchema(name);
        else if (item.optional) {
          if (this.get(item.type).type === 2) asn1Item = new Any({ name });
          else {
            asn1Item = this.create(item.type, false);
            asn1Item.name = name;
          }
        } else asn1Item = new Any({ name });
        const optional = !!item.optional || item.defaultValue !== void 0;
        if (item.repeated) {
          asn1Item.name = "";
          asn1Item = new (item.repeated === "set" ? Set2 : Sequence)({
            name: "",
            value: [new Repeated({
              name,
              value: asn1Item
            })]
          });
        }
        if (item.context !== null && item.context !== void 0) {
          if (item.implicit) {
            if (typeof item.type === "number" || isConvertible(item.type)) {
              const Container = item.repeated ? Constructed : Primitive;
              asn1Value.push(new Container({
                name,
                optional,
                idBlock: {
                  tagClass: 3,
                  tagNumber: item.context
                }
              }));
            } else {
              this.cache(item.type);
              const isRepeated = !!item.repeated;
              let value = !isRepeated ? this.get(item.type, true).schema : asn1Item;
              value = "valueBlock" in value ? value.valueBlock.value : value.value;
              asn1Value.push(new Constructed({
                name: !isRepeated ? name : "",
                optional,
                idBlock: {
                  tagClass: 3,
                  tagNumber: item.context
                },
                value
              }));
            }
          } else asn1Value.push(new Constructed({
            optional,
            idBlock: {
              tagClass: 3,
              tagNumber: item.context
            },
            value: [asn1Item]
          }));
        } else {
          asn1Item.optional = optional;
          asn1Value.push(asn1Item);
        }
      }
      switch (schema.type) {
        case 0:
          return new Sequence({
            value: asn1Value,
            name: ""
          });
        case 1:
          return new Set2({
            value: asn1Value,
            name: ""
          });
        case 2:
          return new Choice({
            value: asn1Value,
            name: ""
          });
        default:
          throw new Error("Unsupported ASN1 type in use");
      }
    }
    set(target, schema) {
      this.items.set(target, schema);
      return this;
    }
    findParentSchema(target) {
      const parent = Object.getPrototypeOf(target);
      if (parent) return this.items.get(parent) || this.findParentSchema(parent);
      return null;
    }
  };

  // node_modules/@peculiar/asn1-schema/build/storage.js
  var schemaStorage = new AsnSchemaStorage();

  // node_modules/@peculiar/asn1-schema/build/decorators.js
  var AsnType = (options) => (target) => {
    let schema;
    if (!schemaStorage.has(target)) {
      schema = schemaStorage.createDefault(target);
      schemaStorage.set(target, schema);
    } else schema = schemaStorage.get(target);
    Object.assign(schema, options);
  };
  var AsnProp = (options) => (target, propertyKey) => {
    let schema;
    if (!schemaStorage.has(target.constructor)) {
      schema = schemaStorage.createDefault(target.constructor);
      schemaStorage.set(target.constructor, schema);
    } else schema = schemaStorage.get(target.constructor);
    const copyOptions = Object.assign({}, options);
    if (typeof copyOptions.type === "number" && !copyOptions.converter) {
      const defaultConverter$1 = defaultConverter(options.type);
      if (!defaultConverter$1) throw new Error(`Cannot get default converter for property '${propertyKey}' of ${target.constructor.name}`);
      copyOptions.converter = defaultConverter$1;
    }
    copyOptions.raw = options.raw;
    schema.items[propertyKey] = copyOptions;
  };

  // node_modules/@peculiar/asn1-schema/build/errors/schema_validation.js
  var AsnSchemaValidationError = class extends Error {
    schemas = [];
  };

  // node_modules/@peculiar/asn1-schema/build/parser.js
  var AsnParser = class {
    static parse(data, target, options) {
      const asn1Parsed = fromBER(toArrayBuffer(data), options?.berOptions);
      if (asn1Parsed.result.error) throw new Error(asn1Parsed.result.error);
      return this.fromASN(asn1Parsed.result, target, options);
    }
    static fromASN(asn1Schema, target, options) {
      try {
        if (isConvertible(target)) return new target().fromASN(asn1Schema);
        const schema = schemaStorage.get(target);
        schemaStorage.cache(target);
        let targetSchema = schema.schema;
        const choiceResult = this.handleChoiceTypes(asn1Schema, schema, target, targetSchema, options);
        if (choiceResult?.result) return choiceResult.result;
        if (choiceResult?.targetSchema) targetSchema = choiceResult.targetSchema;
        const sequenceResult = this.handleSequenceTypes(asn1Schema, schema, target, targetSchema);
        const res = new target();
        if (isTypeOfArray(target)) return this.handleArrayTypes(asn1Schema, schema, target, options);
        this.processSchemaItems(schema, sequenceResult, res, options);
        return res;
      } catch (error) {
        if (error instanceof AsnSchemaValidationError) error.schemas.push(target.name);
        throw error;
      }
    }
    static handleChoiceTypes(asn1Schema, schema, target, targetSchema, options) {
      if (asn1Schema.constructor === Constructed && schema.type === 2 && asn1Schema.idBlock.tagClass === 3) for (const key in schema.items) {
        const schemaItem = schema.items[key];
        if (schemaItem.context === asn1Schema.idBlock.tagNumber && schemaItem.implicit) {
          if (typeof schemaItem.type === "function" && schemaStorage.has(schemaItem.type)) {
            const fieldSchema = schemaStorage.get(schemaItem.type);
            if (fieldSchema && fieldSchema.type === 0) {
              const newSeq = new Sequence();
              if ("value" in asn1Schema.valueBlock && Array.isArray(asn1Schema.valueBlock.value) && "value" in newSeq.valueBlock) {
                newSeq.valueBlock.value = asn1Schema.valueBlock.value;
                const fieldValue = this.fromASN(newSeq, schemaItem.type, options);
                const res = new target();
                res[key] = fieldValue;
                return { result: res };
              }
            }
          }
        }
      }
      else if (asn1Schema.constructor === Constructed && schema.type !== 2) {
        const newTargetSchema = new Constructed({
          idBlock: {
            tagClass: 3,
            tagNumber: asn1Schema.idBlock.tagNumber
          },
          value: schema.schema.valueBlock.value
        });
        for (const key in schema.items) delete asn1Schema[key];
        return { targetSchema: newTargetSchema };
      }
      return null;
    }
    static handleSequenceTypes(asn1Schema, schema, target, targetSchema) {
      if (schema.type === 0) {
        const asn1ComparedSchema = compareSchema({}, asn1Schema, targetSchema);
        if (!asn1ComparedSchema.verified) throw new AsnSchemaValidationError(`Data does not match to ${target.name} ASN1 schema.${asn1ComparedSchema.result.error ? ` ${asn1ComparedSchema.result.error}` : ""}`);
        return asn1ComparedSchema;
      } else {
        const asn1ComparedSchema = compareSchema({}, asn1Schema, targetSchema);
        if (!asn1ComparedSchema.verified) throw new AsnSchemaValidationError(`Data does not match to ${target.name} ASN1 schema.${asn1ComparedSchema.result.error ? ` ${asn1ComparedSchema.result.error}` : ""}`);
        return asn1ComparedSchema;
      }
    }
    static processRepeatedField(asn1Elements, asn1Index, schemaItem) {
      let elementsToProcess = asn1Elements.slice(asn1Index);
      if (elementsToProcess.length === 1 && elementsToProcess[0].constructor.name === "Sequence") {
        const seq = elementsToProcess[0];
        if (seq.valueBlock && seq.valueBlock.value && Array.isArray(seq.valueBlock.value)) elementsToProcess = seq.valueBlock.value;
      }
      if (typeof schemaItem.type === "number") {
        const converter = defaultConverter(schemaItem.type);
        if (!converter) throw new Error(`No converter for ASN.1 type ${schemaItem.type}`);
        return elementsToProcess.filter((el) => el && el.valueBlock).map((el) => {
          try {
            return converter.fromASN(el);
          } catch {
            return;
          }
        }).filter((v) => v !== void 0);
      } else return elementsToProcess.filter((el) => el && el.valueBlock).map((el) => {
        try {
          return this.fromASN(el, schemaItem.type);
        } catch {
          return;
        }
      }).filter((v) => v !== void 0);
    }
    static processPrimitiveField(asn1Element, schemaItem) {
      const converter = defaultConverter(schemaItem.type);
      if (!converter) throw new Error(`No converter for ASN.1 type ${schemaItem.type}`);
      return converter.fromASN(asn1Element);
    }
    static isOptionalChoiceField(schemaItem) {
      return schemaItem.optional && typeof schemaItem.type === "function" && schemaStorage.has(schemaItem.type) && schemaStorage.get(schemaItem.type).type === 2;
    }
    static processOptionalChoiceField(asn1Element, schemaItem) {
      try {
        return {
          processed: true,
          value: this.fromASN(asn1Element, schemaItem.type)
        };
      } catch (err) {
        if (err instanceof AsnSchemaValidationError && /Wrong values for Choice type/.test(err.message)) return { processed: false };
        throw err;
      }
    }
    static handleArrayTypes(asn1Schema, schema, target, options) {
      if (!("value" in asn1Schema.valueBlock && Array.isArray(asn1Schema.valueBlock.value))) throw new Error("Cannot get items from the ASN.1 parsed value. ASN.1 object is not constructed.");
      const itemType = schema.itemType;
      if (typeof itemType === "number") {
        const converter = defaultConverter(itemType);
        if (!converter) throw new Error(`Cannot get default converter for array item of ${target.name} ASN1 schema`);
        return target.from(asn1Schema.valueBlock.value, (element) => converter.fromASN(element));
      } else return target.from(asn1Schema.valueBlock.value, (element) => this.fromASN(element, itemType, options));
    }
    static processSchemaItems(schema, asn1ComparedSchema, res, options) {
      for (const key in schema.items) {
        const asn1SchemaValue = asn1ComparedSchema.result[key];
        if (!asn1SchemaValue) continue;
        const schemaItem = schema.items[key];
        const schemaItemType = schemaItem.type;
        let parsedValue;
        if (typeof schemaItemType === "number" || isConvertible(schemaItemType)) parsedValue = this.processPrimitiveSchemaItem(asn1SchemaValue, schemaItem, schemaItemType, options);
        else parsedValue = this.processComplexSchemaItem(asn1SchemaValue, schemaItem, schemaItemType, options);
        if (parsedValue && typeof parsedValue === "object" && "value" in parsedValue && "raw" in parsedValue) {
          res[key] = parsedValue.value;
          res[`${key}Raw`] = parsedValue.raw;
        } else res[key] = parsedValue;
      }
    }
    static processPrimitiveSchemaItem(asn1SchemaValue, schemaItem, schemaItemType, options) {
      const converter = schemaItem.converter ?? (isConvertible(schemaItemType) ? new schemaItemType() : null);
      if (!converter) throw new Error("Converter is empty");
      if (schemaItem.repeated) return this.processRepeatedPrimitiveItem(asn1SchemaValue, schemaItem, converter, options);
      else return this.processSinglePrimitiveItem(asn1SchemaValue, schemaItem, schemaItemType, converter, options);
    }
    static processRepeatedPrimitiveItem(asn1SchemaValue, schemaItem, converter, options) {
      if (schemaItem.implicit) {
        const newItem = new (schemaItem.repeated === "sequence" ? Sequence : Set2)();
        newItem.valueBlock = asn1SchemaValue.valueBlock;
        const newItemAsn = fromBER(newItem.toBER(false), options?.berOptions);
        if (newItemAsn.offset === -1) throw new Error(`Cannot parse the child item. ${newItemAsn.result.error}`);
        if (!("value" in newItemAsn.result.valueBlock && Array.isArray(newItemAsn.result.valueBlock.value))) throw new Error("Cannot get items from the ASN.1 parsed value. ASN.1 object is not constructed.");
        const value = newItemAsn.result.valueBlock.value;
        return Array.from(value, (element) => converter.fromASN(element));
      } else return Array.from(asn1SchemaValue, (element) => converter.fromASN(element));
    }
    static processSinglePrimitiveItem(asn1SchemaValue, schemaItem, schemaItemType, converter, options) {
      let value = asn1SchemaValue;
      if (schemaItem.implicit) {
        let newItem;
        if (isConvertible(schemaItemType)) newItem = new schemaItemType().toSchema("");
        else {
          const Asn1TypeName = AsnPropTypes[schemaItemType];
          const Asn1Type = build_exports[Asn1TypeName];
          if (!Asn1Type) throw new Error(`Cannot get '${Asn1TypeName}' class from asn1js module`);
          newItem = new Asn1Type();
        }
        newItem.valueBlock = value.valueBlock;
        value = fromBER(newItem.toBER(false), options?.berOptions).result;
      }
      return converter.fromASN(value);
    }
    static processComplexSchemaItem(asn1SchemaValue, schemaItem, schemaItemType, options) {
      if (schemaItem.repeated) {
        if (!Array.isArray(asn1SchemaValue)) throw new Error("Cannot get list of items from the ASN.1 parsed value. ASN.1 value should be iterable.");
        return Array.from(asn1SchemaValue, (element) => this.fromASN(element, schemaItemType, options));
      } else {
        const valueToProcess = this.handleImplicitTagging(asn1SchemaValue, schemaItem, schemaItemType);
        if (this.isOptionalChoiceField(schemaItem)) try {
          return this.fromASN(valueToProcess, schemaItemType, options);
        } catch (err) {
          if (err instanceof AsnSchemaValidationError && /Wrong values for Choice type/.test(err.message)) return;
          throw err;
        }
        else {
          const parsedValue = this.fromASN(valueToProcess, schemaItemType, options);
          if (schemaItem.raw) return {
            value: parsedValue,
            raw: asn1SchemaValue.valueBeforeDecodeView
          };
          return parsedValue;
        }
      }
    }
    static handleImplicitTagging(asn1SchemaValue, schemaItem, schemaItemType) {
      if (schemaItem.implicit && typeof schemaItem.context === "number") {
        const schema = schemaStorage.get(schemaItemType);
        if (schema.type === 0) {
          const newSeq = new Sequence();
          if ("value" in asn1SchemaValue.valueBlock && Array.isArray(asn1SchemaValue.valueBlock.value) && "value" in newSeq.valueBlock) {
            newSeq.valueBlock.value = asn1SchemaValue.valueBlock.value;
            return newSeq;
          }
        } else if (schema.type === 1) {
          const newSet = new Set2();
          if ("value" in asn1SchemaValue.valueBlock && Array.isArray(asn1SchemaValue.valueBlock.value) && "value" in newSet.valueBlock) {
            newSet.valueBlock.value = asn1SchemaValue.valueBlock.value;
            return newSet;
          }
        }
      }
      return asn1SchemaValue;
    }
  };

  // node_modules/@peculiar/asn1-schema/build/serializer.js
  var AsnSerializer = class AsnSerializer2 {
    static serialize(obj) {
      if (obj instanceof BaseBlock) return obj.toBER(false);
      return this.toASN(obj).toBER(false);
    }
    static toASN(obj) {
      if (obj && typeof obj === "object" && isConvertible(obj)) return obj.toASN();
      if (!(obj && typeof obj === "object")) throw new TypeError("Parameter 1 should be type of Object.");
      const target = obj.constructor;
      const schema = schemaStorage.get(target);
      schemaStorage.cache(target);
      let asn1Value = [];
      if (schema.itemType) {
        if (!Array.isArray(obj)) throw new TypeError("Parameter 1 should be type of Array.");
        if (typeof schema.itemType === "number") {
          const converter = defaultConverter(schema.itemType);
          if (!converter) throw new Error(`Cannot get default converter for array item of ${target.name} ASN1 schema`);
          asn1Value = obj.map((o) => converter.toASN(o));
        } else asn1Value = obj.map((o) => this.toAsnItem({ type: schema.itemType }, "[]", target, o));
      } else for (const key in schema.items) {
        const schemaItem = schema.items[key];
        const objProp = obj[key];
        if (objProp === void 0 || schemaItem.defaultValue === objProp || typeof schemaItem.defaultValue === "object" && typeof objProp === "object" && isArrayEqual(this.serialize(schemaItem.defaultValue), this.serialize(objProp))) continue;
        const asn1Item = AsnSerializer2.toAsnItem(schemaItem, key, target, objProp);
        if (typeof schemaItem.context === "number") {
          if (schemaItem.implicit) {
            if (!schemaItem.repeated && (typeof schemaItem.type === "number" || isConvertible(schemaItem.type))) {
              const value = {};
              value.valueHex = asn1Item instanceof Null ? toArrayBuffer(asn1Item.valueBeforeDecodeView) : asn1Item.valueBlock.toBER();
              asn1Value.push(new Primitive({
                optional: schemaItem.optional,
                idBlock: {
                  tagClass: 3,
                  tagNumber: schemaItem.context
                },
                ...value
              }));
            } else asn1Value.push(new Constructed({
              optional: schemaItem.optional,
              idBlock: {
                tagClass: 3,
                tagNumber: schemaItem.context
              },
              value: asn1Item.valueBlock.value
            }));
          } else asn1Value.push(new Constructed({
            optional: schemaItem.optional,
            idBlock: {
              tagClass: 3,
              tagNumber: schemaItem.context
            },
            value: [asn1Item]
          }));
        } else if (schemaItem.repeated) asn1Value = asn1Value.concat(asn1Item);
        else asn1Value.push(asn1Item);
      }
      let asnSchema;
      switch (schema.type) {
        case 0:
          asnSchema = new Sequence({ value: asn1Value });
          break;
        case 1:
          asnSchema = new Set2({ value: asn1Value });
          break;
        case 2:
          if (!asn1Value[0]) throw new Error(`Schema '${target.name}' has wrong data. Choice cannot be empty.`);
          asnSchema = asn1Value[0];
      }
      return asnSchema;
    }
    static toAsnItem(schemaItem, key, target, objProp) {
      let asn1Item;
      if (typeof schemaItem.type === "number") {
        const converter = schemaItem.converter;
        if (!converter) throw new Error(`Property '${key}' doesn't have converter for type ${AsnPropTypes[schemaItem.type]} in schema '${target.name}'`);
        if (schemaItem.repeated) {
          if (!Array.isArray(objProp)) throw new TypeError("Parameter 'objProp' should be type of Array.");
          const items = Array.from(objProp, (element) => converter.toASN(element));
          asn1Item = new (schemaItem.repeated === "sequence" ? Sequence : Set2)({ value: items });
        } else asn1Item = converter.toASN(objProp);
      } else if (schemaItem.repeated) {
        if (!Array.isArray(objProp)) throw new TypeError("Parameter 'objProp' should be type of Array.");
        const items = Array.from(objProp, (element) => this.toASN(element));
        asn1Item = new (schemaItem.repeated === "sequence" ? Sequence : Set2)({ value: items });
      } else asn1Item = this.toASN(objProp);
      return asn1Item;
    }
  };

  // node_modules/@peculiar/asn1-schema/build/objects.js
  var AsnArray = class extends Array {
    constructor(items = []) {
      if (typeof items === "number") super(items);
      else {
        super();
        for (const item of items) this.push(item);
      }
    }
  };

  // node_modules/@peculiar/asn1-schema/build/convert.js
  var AsnConvert = class AsnConvert2 {
    static serialize(obj) {
      return AsnSerializer.serialize(obj);
    }
    static parse(data, target, options) {
      return AsnParser.parse(data, target, options);
    }
    static toString(data, options) {
      const buf = isBufferSource(data) ? toArrayBuffer(data) : AsnConvert2.serialize(data);
      const asn = fromBER(buf, options?.berOptions);
      if (asn.offset === -1) throw new Error(`Cannot decode ASN.1 data. ${asn.result.error}`);
      return asn.result.toString();
    }
  };

  // node_modules/@peculiar/asn1-x509/build/_virtual/_@oxc-project_runtime@0.155.0/helpers/esm/decorate.js
  function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  }

  // node_modules/@peculiar/asn1-x509/build/name.js
  var _RelativeDistinguishedName;
  var _RDNSequence;
  var _Name;
  var DirectoryString = class DirectoryString2 {
    teletexString;
    printableString;
    universalString;
    utf8String;
    bmpString;
    constructor(params = {}) {
      Object.assign(this, params);
    }
    toString() {
      return this.bmpString || this.printableString || this.teletexString || this.universalString || this.utf8String || "";
    }
  };
  __decorate([AsnProp({ type: AsnPropTypes.TeletexString })], DirectoryString.prototype, "teletexString", void 0);
  __decorate([AsnProp({ type: AsnPropTypes.PrintableString })], DirectoryString.prototype, "printableString", void 0);
  __decorate([AsnProp({ type: AsnPropTypes.UniversalString })], DirectoryString.prototype, "universalString", void 0);
  __decorate([AsnProp({ type: AsnPropTypes.Utf8String })], DirectoryString.prototype, "utf8String", void 0);
  __decorate([AsnProp({ type: AsnPropTypes.BmpString })], DirectoryString.prototype, "bmpString", void 0);
  DirectoryString = __decorate([AsnType({ type: AsnTypeTypes.Choice })], DirectoryString);
  var AttributeValue = class AttributeValue2 extends DirectoryString {
    ia5String;
    anyValue;
    constructor(params = {}) {
      super(params);
      Object.assign(this, params);
    }
    toString() {
      return this.ia5String || (this.anyValue ? hex_exports.encode(this.anyValue) : super.toString());
    }
  };
  __decorate([AsnProp({ type: AsnPropTypes.IA5String })], AttributeValue.prototype, "ia5String", void 0);
  __decorate([AsnProp({ type: AsnPropTypes.Any })], AttributeValue.prototype, "anyValue", void 0);
  AttributeValue = __decorate([AsnType({ type: AsnTypeTypes.Choice })], AttributeValue);
  var AttributeTypeAndValue = class {
    type = "";
    value = new AttributeValue();
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate([AsnProp({ type: AsnPropTypes.ObjectIdentifier })], AttributeTypeAndValue.prototype, "type", void 0);
  __decorate([AsnProp({ type: AttributeValue })], AttributeTypeAndValue.prototype, "value", void 0);
  var RelativeDistinguishedName = _RelativeDistinguishedName = class RelativeDistinguishedName2 extends AsnArray {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _RelativeDistinguishedName.prototype);
    }
  };
  RelativeDistinguishedName = _RelativeDistinguishedName = __decorate([AsnType({
    type: AsnTypeTypes.Set,
    itemType: AttributeTypeAndValue
  })], RelativeDistinguishedName);
  var RDNSequence = _RDNSequence = class RDNSequence2 extends AsnArray {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _RDNSequence.prototype);
    }
  };
  RDNSequence = _RDNSequence = __decorate([AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: RelativeDistinguishedName
  })], RDNSequence);
  var Name = _Name = class Name2 extends RDNSequence {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _Name.prototype);
    }
  };
  Name = _Name = __decorate([AsnType({ type: AsnTypeTypes.Sequence })], Name);

  // node_modules/@peculiar/asn1-x509/build/ip_converter.js
  var IpConverter = class {
    static isIPv4(ip) {
      return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
    }
    static parseIPv4(ip) {
      const parts = ip.split(".");
      if (parts.length !== 4) throw new Error("Invalid IPv4 address");
      return parts.map((part) => {
        const num = parseInt(part, 10);
        if (isNaN(num) || num < 0 || num > 255) throw new Error("Invalid IPv4 address part");
        return num;
      });
    }
    static parseIPv6(ip) {
      const parts = this.expandIPv6(ip).split(":");
      if (parts.length !== 8) throw new Error("Invalid IPv6 address");
      return parts.reduce((bytes, part) => {
        const num = parseInt(part, 16);
        if (isNaN(num) || num < 0 || num > 65535) throw new Error("Invalid IPv6 address part");
        bytes.push(num >> 8 & 255);
        bytes.push(num & 255);
        return bytes;
      }, []);
    }
    static expandIPv6(ip) {
      if (!ip.includes("::")) return ip;
      const parts = ip.split("::");
      if (parts.length > 2) throw new Error("Invalid IPv6 address");
      const left = parts[0] ? parts[0].split(":") : [];
      const right = parts[1] ? parts[1].split(":") : [];
      const missing = 8 - (left.length + right.length);
      if (missing < 0) throw new Error("Invalid IPv6 address");
      return [
        ...left,
        ...Array(missing).fill("0"),
        ...right
      ].join(":");
    }
    static formatIPv6(bytes) {
      const parts = [];
      for (let i = 0; i < 16; i += 2) parts.push((bytes[i] << 8 | bytes[i + 1]).toString(16));
      return this.compressIPv6(parts.join(":"));
    }
    static compressIPv6(ip) {
      const parts = ip.split(":");
      let longestZeroStart = -1;
      let longestZeroLength = 0;
      let currentZeroStart = -1;
      let currentZeroLength = 0;
      for (let i = 0; i < parts.length; i++) if (parts[i] === "0") {
        if (currentZeroStart === -1) currentZeroStart = i;
        currentZeroLength++;
      } else {
        if (currentZeroLength > longestZeroLength) {
          longestZeroStart = currentZeroStart;
          longestZeroLength = currentZeroLength;
        }
        currentZeroStart = -1;
        currentZeroLength = 0;
      }
      if (currentZeroLength > longestZeroLength) {
        longestZeroStart = currentZeroStart;
        longestZeroLength = currentZeroLength;
      }
      if (longestZeroLength > 1) return `${parts.slice(0, longestZeroStart).join(":")}::${parts.slice(longestZeroStart + longestZeroLength).join(":")}`;
      return ip;
    }
    static parseCIDR(text) {
      const [addr, prefixStr] = text.split("/");
      const prefix = parseInt(prefixStr, 10);
      if (this.isIPv4(addr)) {
        if (prefix < 0 || prefix > 32) throw new Error("Invalid IPv4 prefix length");
        return [this.parseIPv4(addr), prefix];
      } else {
        if (prefix < 0 || prefix > 128) throw new Error("Invalid IPv6 prefix length");
        return [this.parseIPv6(addr), prefix];
      }
    }
    static decodeIP(value) {
      if (value.length === 64 && parseInt(value, 16) === 0) return "::/0";
      if (value.length !== 16) return value;
      const mask = parseInt(value.slice(8), 16).toString(2).split("").reduce((a, k) => a + +k, 0);
      let ip = value.slice(0, 8).replace(/(.{2})/g, (match) => `${parseInt(match, 16)}.`);
      ip = ip.slice(0, -1);
      return `${ip}/${mask}`;
    }
    static toString(buf) {
      const uint8 = new Uint8Array(buf);
      if (uint8.length === 4) return Array.from(uint8).join(".");
      if (uint8.length === 16) return this.formatIPv6(uint8);
      if (uint8.length === 8 || uint8.length === 32) {
        const half = uint8.length / 2;
        const addrBytes = uint8.slice(0, half);
        const maskBytes = uint8.slice(half);
        if (uint8.every((byte) => byte === 0)) return uint8.length === 8 ? "0.0.0.0/0" : "::/0";
        const prefixLen = maskBytes.reduce((a, b) => a + (b.toString(2).match(/1/g) || []).length, 0);
        if (uint8.length === 8) return `${Array.from(addrBytes).join(".")}/${prefixLen}`;
        else return `${this.formatIPv6(addrBytes)}/${prefixLen}`;
      }
      return this.decodeIP(hex_exports.encode(buf));
    }
    static fromString(text) {
      if (text.includes("/")) {
        const [addr, prefix] = this.parseCIDR(text);
        const maskBytes = new Uint8Array(addr.length);
        let bitsLeft = prefix;
        for (let i = 0; i < maskBytes.length; i++) if (bitsLeft >= 8) {
          maskBytes[i] = 255;
          bitsLeft -= 8;
        } else if (bitsLeft > 0) {
          maskBytes[i] = 255 << 8 - bitsLeft;
          bitsLeft = 0;
        }
        const out = new Uint8Array(addr.length * 2);
        out.set(addr, 0);
        out.set(maskBytes, addr.length);
        return out.buffer;
      }
      const bytes = this.isIPv4(text) ? this.parseIPv4(text) : this.parseIPv6(text);
      return new Uint8Array(bytes).buffer;
    }
  };

  // node_modules/@peculiar/asn1-x509/build/general_name.js
  var AsnIpConverter = {
    fromASN: (value) => IpConverter.toString(AsnOctetStringConverter.fromASN(value)),
    toASN: (value) => AsnOctetStringConverter.toASN(IpConverter.fromString(value))
  };
  var OtherName = class {
    typeId = "";
    value = /* @__PURE__ */ new ArrayBuffer(0);
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate([AsnProp({ type: AsnPropTypes.ObjectIdentifier })], OtherName.prototype, "typeId", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Any,
    context: 0
  })], OtherName.prototype, "value", void 0);
  var EDIPartyName = class {
    nameAssigner;
    partyName = new DirectoryString();
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate([AsnProp({
    type: DirectoryString,
    optional: true,
    context: 0,
    implicit: true
  })], EDIPartyName.prototype, "nameAssigner", void 0);
  __decorate([AsnProp({
    type: DirectoryString,
    context: 1,
    implicit: true
  })], EDIPartyName.prototype, "partyName", void 0);
  var GeneralName = class GeneralName2 {
    otherName;
    rfc822Name;
    dNSName;
    x400Address;
    directoryName;
    ediPartyName;
    uniformResourceIdentifier;
    iPAddress;
    registeredID;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate([AsnProp({
    type: OtherName,
    context: 0,
    implicit: true
  })], GeneralName.prototype, "otherName", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.IA5String,
    context: 1,
    implicit: true
  })], GeneralName.prototype, "rfc822Name", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.IA5String,
    context: 2,
    implicit: true
  })], GeneralName.prototype, "dNSName", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Any,
    context: 3,
    implicit: true
  })], GeneralName.prototype, "x400Address", void 0);
  __decorate([AsnProp({
    type: Name,
    context: 4,
    implicit: false
  })], GeneralName.prototype, "directoryName", void 0);
  __decorate([AsnProp({
    type: EDIPartyName,
    context: 5
  })], GeneralName.prototype, "ediPartyName", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.IA5String,
    context: 6,
    implicit: true
  })], GeneralName.prototype, "uniformResourceIdentifier", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.OctetString,
    context: 7,
    implicit: true,
    converter: AsnIpConverter
  })], GeneralName.prototype, "iPAddress", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.ObjectIdentifier,
    context: 8,
    implicit: true
  })], GeneralName.prototype, "registeredID", void 0);
  GeneralName = __decorate([AsnType({ type: AsnTypeTypes.Choice })], GeneralName);

  // node_modules/@peculiar/asn1-x509/build/object_identifiers.js
  var id_pkix = "1.3.6.1.5.5.7";
  var id_pe = `${id_pkix}.1`;
  var id_qt = `${id_pkix}.2`;
  var id_kp = `${id_pkix}.3`;
  var id_ad = `${id_pkix}.48`;
  var id_qt_csp = `${id_qt}.1`;
  var id_qt_unotice = `${id_qt}.2`;
  var id_ad_ocsp = `${id_ad}.1`;
  var id_ad_caIssuers = `${id_ad}.2`;
  var id_ad_timeStamping = `${id_ad}.3`;
  var id_ad_caRepository = `${id_ad}.5`;
  var id_ce = "2.5.29";

  // node_modules/@peculiar/asn1-x509/build/extensions/authority_information_access.js
  var _AuthorityInfoAccessSyntax;
  var id_pe_authorityInfoAccess = `${id_pe}.1`;
  var AccessDescription = class {
    accessMethod = "";
    accessLocation = new GeneralName();
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate([AsnProp({ type: AsnPropTypes.ObjectIdentifier })], AccessDescription.prototype, "accessMethod", void 0);
  __decorate([AsnProp({ type: GeneralName })], AccessDescription.prototype, "accessLocation", void 0);
  var AuthorityInfoAccessSyntax = _AuthorityInfoAccessSyntax = class AuthorityInfoAccessSyntax2 extends AsnArray {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _AuthorityInfoAccessSyntax.prototype);
    }
  };
  AuthorityInfoAccessSyntax = _AuthorityInfoAccessSyntax = __decorate([AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: AccessDescription
  })], AuthorityInfoAccessSyntax);

  // node_modules/@peculiar/asn1-x509/build/extensions/authority_key_identifier.js
  var id_ce_authorityKeyIdentifier = `${id_ce}.35`;
  var KeyIdentifier = class extends OctetString3 {
  };
  var AuthorityKeyIdentifier = class {
    keyIdentifier;
    authorityCertIssuer;
    authorityCertSerialNumber;
    constructor(params = {}) {
      if (params) Object.assign(this, params);
    }
  };
  __decorate([AsnProp({
    type: KeyIdentifier,
    context: 0,
    optional: true,
    implicit: true
  })], AuthorityKeyIdentifier.prototype, "keyIdentifier", void 0);
  __decorate([AsnProp({
    type: GeneralName,
    context: 1,
    optional: true,
    implicit: true,
    repeated: "sequence"
  })], AuthorityKeyIdentifier.prototype, "authorityCertIssuer", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    context: 2,
    optional: true,
    implicit: true,
    converter: AsnIntegerArrayBufferConverter
  })], AuthorityKeyIdentifier.prototype, "authorityCertSerialNumber", void 0);

  // node_modules/@peculiar/asn1-x509/build/extensions/basic_constraints.js
  var id_ce_basicConstraints = `${id_ce}.19`;
  var BasicConstraints = class {
    cA = false;
    pathLenConstraint;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate([AsnProp({
    type: AsnPropTypes.Boolean,
    defaultValue: false
  })], BasicConstraints.prototype, "cA", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    optional: true
  })], BasicConstraints.prototype, "pathLenConstraint", void 0);

  // node_modules/@peculiar/asn1-x509/build/general_names.js
  var _GeneralNames;
  var GeneralNames = _GeneralNames = class GeneralNames2 extends AsnArray {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _GeneralNames.prototype);
    }
  };
  GeneralNames = _GeneralNames = __decorate([AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: GeneralName
  })], GeneralNames);

  // node_modules/@peculiar/asn1-x509/build/extensions/certificate_policies.js
  var _CertificatePolicies;
  var id_ce_certificatePolicies = `${id_ce}.32`;
  var id_ce_certificatePolicies_anyPolicy = `${id_ce_certificatePolicies}.0`;
  var DisplayText = class DisplayText2 {
    ia5String;
    visibleString;
    bmpString;
    utf8String;
    constructor(params = {}) {
      Object.assign(this, params);
    }
    toString() {
      return this.ia5String || this.visibleString || this.bmpString || this.utf8String || "";
    }
  };
  __decorate([AsnProp({ type: AsnPropTypes.IA5String })], DisplayText.prototype, "ia5String", void 0);
  __decorate([AsnProp({ type: AsnPropTypes.VisibleString })], DisplayText.prototype, "visibleString", void 0);
  __decorate([AsnProp({ type: AsnPropTypes.BmpString })], DisplayText.prototype, "bmpString", void 0);
  __decorate([AsnProp({ type: AsnPropTypes.Utf8String })], DisplayText.prototype, "utf8String", void 0);
  DisplayText = __decorate([AsnType({ type: AsnTypeTypes.Choice })], DisplayText);
  var NoticeReference = class {
    organization = new DisplayText();
    noticeNumbers = [];
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate([AsnProp({ type: DisplayText })], NoticeReference.prototype, "organization", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    repeated: "sequence"
  })], NoticeReference.prototype, "noticeNumbers", void 0);
  var UserNotice = class {
    noticeRef;
    explicitText;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate([AsnProp({
    type: NoticeReference,
    optional: true
  })], UserNotice.prototype, "noticeRef", void 0);
  __decorate([AsnProp({
    type: DisplayText,
    optional: true
  })], UserNotice.prototype, "explicitText", void 0);
  var Qualifier = class Qualifier2 {
    cPSuri;
    userNotice;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate([AsnProp({ type: AsnPropTypes.IA5String })], Qualifier.prototype, "cPSuri", void 0);
  __decorate([AsnProp({ type: UserNotice })], Qualifier.prototype, "userNotice", void 0);
  Qualifier = __decorate([AsnType({ type: AsnTypeTypes.Choice })], Qualifier);
  var PolicyQualifierInfo = class {
    policyQualifierId = "";
    qualifier = /* @__PURE__ */ new ArrayBuffer(0);
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate([AsnProp({ type: AsnPropTypes.ObjectIdentifier })], PolicyQualifierInfo.prototype, "policyQualifierId", void 0);
  __decorate([AsnProp({ type: AsnPropTypes.Any })], PolicyQualifierInfo.prototype, "qualifier", void 0);
  var PolicyInformation = class {
    policyIdentifier = "";
    policyQualifiers;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate([AsnProp({ type: AsnPropTypes.ObjectIdentifier })], PolicyInformation.prototype, "policyIdentifier", void 0);
  __decorate([AsnProp({
    type: PolicyQualifierInfo,
    repeated: "sequence",
    optional: true
  })], PolicyInformation.prototype, "policyQualifiers", void 0);
  var CertificatePolicies = _CertificatePolicies = class CertificatePolicies2 extends AsnArray {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _CertificatePolicies.prototype);
    }
  };
  CertificatePolicies = _CertificatePolicies = __decorate([AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: PolicyInformation
  })], CertificatePolicies);

  // node_modules/@peculiar/asn1-x509/build/extensions/crl_distribution_points.js
  var _CRLDistributionPoints;
  var id_ce_cRLDistributionPoints = `${id_ce}.31`;
  var Reason = class extends BitString2 {
    toJSON() {
      const res = [];
      const flags = this.toNumber();
      if (flags & 256) res.push("aACompromise");
      if (flags & 8) res.push("affiliationChanged");
      if (flags & 4) res.push("cACompromise");
      if (flags & 64) res.push("certificateHold");
      if (flags & 32) res.push("cessationOfOperation");
      if (flags & 2) res.push("keyCompromise");
      if (flags & 128) res.push("privilegeWithdrawn");
      if (flags & 16) res.push("superseded");
      if (flags & 1) res.push("unused");
      return res;
    }
    toString() {
      return `[${this.toJSON().join(", ")}]`;
    }
  };
  var DistributionPointName = class DistributionPointName2 {
    fullName;
    nameRelativeToCRLIssuer;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate([AsnProp({
    type: GeneralName,
    context: 0,
    repeated: "sequence",
    implicit: true
  })], DistributionPointName.prototype, "fullName", void 0);
  __decorate([AsnProp({
    type: RelativeDistinguishedName,
    context: 1,
    implicit: true
  })], DistributionPointName.prototype, "nameRelativeToCRLIssuer", void 0);
  DistributionPointName = __decorate([AsnType({ type: AsnTypeTypes.Choice })], DistributionPointName);
  var DistributionPoint = class {
    distributionPoint;
    reasons;
    cRLIssuer;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate([AsnProp({
    type: DistributionPointName,
    context: 0,
    optional: true
  })], DistributionPoint.prototype, "distributionPoint", void 0);
  __decorate([AsnProp({
    type: Reason,
    context: 1,
    optional: true,
    implicit: true
  })], DistributionPoint.prototype, "reasons", void 0);
  __decorate([AsnProp({
    type: GeneralName,
    context: 2,
    optional: true,
    repeated: "sequence",
    implicit: true
  })], DistributionPoint.prototype, "cRLIssuer", void 0);
  var CRLDistributionPoints = _CRLDistributionPoints = class CRLDistributionPoints2 extends AsnArray {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _CRLDistributionPoints.prototype);
    }
  };
  CRLDistributionPoints = _CRLDistributionPoints = __decorate([AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: DistributionPoint
  })], CRLDistributionPoints);

  // node_modules/@peculiar/asn1-x509/build/extensions/extended_key_usage.js
  var _ExtendedKeyUsage;
  var id_ce_extKeyUsage = `${id_ce}.37`;
  var ExtendedKeyUsage = _ExtendedKeyUsage = class ExtendedKeyUsage2 extends AsnArray {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _ExtendedKeyUsage.prototype);
    }
  };
  ExtendedKeyUsage = _ExtendedKeyUsage = __decorate([AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: AsnPropTypes.ObjectIdentifier
  })], ExtendedKeyUsage);
  var anyExtendedKeyUsage = `${id_ce_extKeyUsage}.0`;
  var id_kp_serverAuth = `${id_kp}.1`;
  var id_kp_clientAuth = `${id_kp}.2`;
  var id_kp_codeSigning = `${id_kp}.3`;
  var id_kp_emailProtection = `${id_kp}.4`;
  var id_kp_timeStamping = `${id_kp}.8`;
  var id_kp_OCSPSigning = `${id_kp}.9`;

  // node_modules/@peculiar/asn1-x509/build/extensions/issuer_alternative_name.js
  var _IssueAlternativeName;
  var id_ce_issuerAltName = `${id_ce}.18`;
  var IssueAlternativeName = _IssueAlternativeName = class IssueAlternativeName2 extends GeneralNames {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _IssueAlternativeName.prototype);
    }
  };
  IssueAlternativeName = _IssueAlternativeName = __decorate([AsnType({ type: AsnTypeTypes.Sequence })], IssueAlternativeName);

  // node_modules/@peculiar/asn1-x509/build/extensions/key_usage.js
  var id_ce_keyUsage = `${id_ce}.15`;
  var KeyUsage = class extends BitString2 {
    toJSON() {
      const flag = this.toNumber();
      const res = [];
      if (flag & 64) res.push("crlSign");
      if (flag & 8) res.push("dataEncipherment");
      if (flag & 256) res.push("decipherOnly");
      if (flag & 1) res.push("digitalSignature");
      if (flag & 128) res.push("encipherOnly");
      if (flag & 16) res.push("keyAgreement");
      if (flag & 32) res.push("keyCertSign");
      if (flag & 4) res.push("keyEncipherment");
      if (flag & 2) res.push("nonRepudiation");
      return res;
    }
    toString() {
      return `[${this.toJSON().join(", ")}]`;
    }
  };

  // node_modules/@peculiar/asn1-x509/build/extensions/subject_alternative_name.js
  var _SubjectAlternativeName;
  var id_ce_subjectAltName = `${id_ce}.17`;
  var SubjectAlternativeName = _SubjectAlternativeName = class SubjectAlternativeName2 extends GeneralNames {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _SubjectAlternativeName.prototype);
    }
  };
  SubjectAlternativeName = _SubjectAlternativeName = __decorate([AsnType({ type: AsnTypeTypes.Sequence })], SubjectAlternativeName);

  // node_modules/@peculiar/asn1-x509/build/attribute.js
  var Attribute = class {
    type = "";
    values = [];
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate([AsnProp({ type: AsnPropTypes.ObjectIdentifier })], Attribute.prototype, "type", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Any,
    repeated: "set"
  })], Attribute.prototype, "values", void 0);

  // node_modules/@peculiar/asn1-x509/build/extensions/subject_key_identifier.js
  var id_ce_subjectKeyIdentifier = `${id_ce}.14`;
  var SubjectKeyIdentifier = class extends KeyIdentifier {
  };

  // node_modules/@peculiar/asn1-x509/build/algorithm_identifier.js
  var AlgorithmIdentifier = class AlgorithmIdentifier2 {
    algorithm = "";
    parameters;
    constructor(params = {}) {
      Object.assign(this, params);
    }
    isEqual(data) {
      return data instanceof AlgorithmIdentifier2 && data.algorithm == this.algorithm && (data.parameters && this.parameters && equal(data.parameters, this.parameters) || data.parameters === this.parameters);
    }
  };
  __decorate([AsnProp({ type: AsnPropTypes.ObjectIdentifier })], AlgorithmIdentifier.prototype, "algorithm", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Any,
    optional: true
  })], AlgorithmIdentifier.prototype, "parameters", void 0);

  // node_modules/@peculiar/asn1-x509/build/subject_public_key_info.js
  var SubjectPublicKeyInfo = class {
    algorithm = new AlgorithmIdentifier();
    subjectPublicKey = /* @__PURE__ */ new ArrayBuffer(0);
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate([AsnProp({ type: AlgorithmIdentifier })], SubjectPublicKeyInfo.prototype, "algorithm", void 0);
  __decorate([AsnProp({ type: AsnPropTypes.BitString })], SubjectPublicKeyInfo.prototype, "subjectPublicKey", void 0);

  // node_modules/@peculiar/asn1-x509/build/time.js
  var Time = class Time2 {
    utcTime;
    generalTime;
    constructor(time) {
      if (time) {
        if (typeof time === "string" || typeof time === "number" || time instanceof Date) {
          const date = new Date(time);
          date.setUTCMilliseconds(0);
          if (date.getUTCFullYear() > 2049) this.generalTime = date;
          else this.utcTime = date;
        } else Object.assign(this, time);
      }
    }
    getTime() {
      const time = this.utcTime || this.generalTime;
      if (!time) throw new Error("Cannot get time from CHOICE object");
      return time;
    }
  };
  __decorate([AsnProp({ type: AsnPropTypes.UTCTime })], Time.prototype, "utcTime", void 0);
  __decorate([AsnProp({ type: AsnPropTypes.GeneralizedTime })], Time.prototype, "generalTime", void 0);
  Time = __decorate([AsnType({ type: AsnTypeTypes.Choice })], Time);

  // node_modules/@peculiar/asn1-x509/build/validity.js
  var Validity = class {
    notBefore = new Time(/* @__PURE__ */ new Date());
    notAfter = new Time(/* @__PURE__ */ new Date());
    constructor(params) {
      if (params) {
        this.notBefore = new Time(params.notBefore);
        this.notAfter = new Time(params.notAfter);
      }
    }
  };
  __decorate([AsnProp({ type: Time })], Validity.prototype, "notBefore", void 0);
  __decorate([AsnProp({ type: Time })], Validity.prototype, "notAfter", void 0);

  // node_modules/@peculiar/asn1-x509/build/extension.js
  var _Extensions;
  var Extension = class Extension2 {
    static CRITICAL = false;
    extnID = "";
    critical = Extension2.CRITICAL;
    extnValue = new OctetString3();
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate([AsnProp({ type: AsnPropTypes.ObjectIdentifier })], Extension.prototype, "extnID", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Boolean,
    defaultValue: Extension.CRITICAL
  })], Extension.prototype, "critical", void 0);
  __decorate([AsnProp({ type: OctetString3 })], Extension.prototype, "extnValue", void 0);
  var Extensions = _Extensions = class Extensions2 extends AsnArray {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _Extensions.prototype);
    }
  };
  Extensions = _Extensions = __decorate([AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: Extension
  })], Extensions);

  // node_modules/@peculiar/asn1-x509/build/types.js
  var Version = /* @__PURE__ */ (function(Version2) {
    Version2[Version2["v1"] = 0] = "v1";
    Version2[Version2["v2"] = 1] = "v2";
    Version2[Version2["v3"] = 2] = "v3";
    return Version2;
  })({});

  // node_modules/@peculiar/asn1-x509/build/tbs_certificate.js
  var TBSCertificate = class {
    version = 0;
    serialNumber = /* @__PURE__ */ new ArrayBuffer(0);
    signature = new AlgorithmIdentifier();
    issuer = new Name();
    validity = new Validity();
    subject = new Name();
    subjectPublicKeyInfo = new SubjectPublicKeyInfo();
    issuerUniqueID;
    subjectUniqueID;
    extensions;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    context: 0,
    defaultValue: 0
  })], TBSCertificate.prototype, "version", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })], TBSCertificate.prototype, "serialNumber", void 0);
  __decorate([AsnProp({ type: AlgorithmIdentifier })], TBSCertificate.prototype, "signature", void 0);
  __decorate([AsnProp({ type: Name })], TBSCertificate.prototype, "issuer", void 0);
  __decorate([AsnProp({ type: Validity })], TBSCertificate.prototype, "validity", void 0);
  __decorate([AsnProp({ type: Name })], TBSCertificate.prototype, "subject", void 0);
  __decorate([AsnProp({ type: SubjectPublicKeyInfo })], TBSCertificate.prototype, "subjectPublicKeyInfo", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.BitString,
    context: 1,
    implicit: true,
    optional: true
  })], TBSCertificate.prototype, "issuerUniqueID", void 0);
  __decorate([AsnProp({
    type: AsnPropTypes.BitString,
    context: 2,
    implicit: true,
    optional: true
  })], TBSCertificate.prototype, "subjectUniqueID", void 0);
  __decorate([AsnProp({
    type: Extensions,
    context: 3,
    optional: true
  })], TBSCertificate.prototype, "extensions", void 0);

  // node_modules/@peculiar/asn1-x509/build/certificate.js
  var Certificate = class {
    tbsCertificate = new TBSCertificate();
    tbsCertificateRaw;
    signatureAlgorithm = new AlgorithmIdentifier();
    signatureValue = /* @__PURE__ */ new ArrayBuffer(0);
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate([AsnProp({
    type: TBSCertificate,
    raw: true
  })], Certificate.prototype, "tbsCertificate", void 0);
  __decorate([AsnProp({ type: AlgorithmIdentifier })], Certificate.prototype, "signatureAlgorithm", void 0);
  __decorate([AsnProp({ type: AsnPropTypes.BitString })], Certificate.prototype, "signatureValue", void 0);

  // node_modules/@peculiar/asn1-cms/build/_virtual/_@oxc-project_runtime@0.155.0/helpers/esm/decorate.js
  function __decorate2(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  }

  // node_modules/@peculiar/asn1-cms/build/issuer_and_serial_number.js
  var IssuerAndSerialNumber = class {
    issuer = new Name();
    serialNumber = /* @__PURE__ */ new ArrayBuffer(0);
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate2([AsnProp({ type: Name })], IssuerAndSerialNumber.prototype, "issuer", void 0);
  __decorate2([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })], IssuerAndSerialNumber.prototype, "serialNumber", void 0);

  // node_modules/@peculiar/asn1-cms/build/signer_identifier.js
  var SignerIdentifier = class SignerIdentifier2 {
    subjectKeyIdentifier;
    issuerAndSerialNumber;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate2([AsnProp({
    type: SubjectKeyIdentifier,
    context: 0,
    implicit: true
  })], SignerIdentifier.prototype, "subjectKeyIdentifier", void 0);
  __decorate2([AsnProp({ type: IssuerAndSerialNumber })], SignerIdentifier.prototype, "issuerAndSerialNumber", void 0);
  SignerIdentifier = __decorate2([AsnType({ type: AsnTypeTypes.Choice })], SignerIdentifier);

  // node_modules/@peculiar/asn1-cms/build/types.js
  var CMSVersion = /* @__PURE__ */ (function(CMSVersion2) {
    CMSVersion2[CMSVersion2["v0"] = 0] = "v0";
    CMSVersion2[CMSVersion2["v1"] = 1] = "v1";
    CMSVersion2[CMSVersion2["v2"] = 2] = "v2";
    CMSVersion2[CMSVersion2["v3"] = 3] = "v3";
    CMSVersion2[CMSVersion2["v4"] = 4] = "v4";
    CMSVersion2[CMSVersion2["v5"] = 5] = "v5";
    return CMSVersion2;
  })({});
  var DigestAlgorithmIdentifier = class DigestAlgorithmIdentifier2 extends AlgorithmIdentifier {
  };
  DigestAlgorithmIdentifier = __decorate2([AsnType({ type: AsnTypeTypes.Sequence })], DigestAlgorithmIdentifier);
  var SignatureAlgorithmIdentifier = class SignatureAlgorithmIdentifier2 extends AlgorithmIdentifier {
  };
  SignatureAlgorithmIdentifier = __decorate2([AsnType({ type: AsnTypeTypes.Sequence })], SignatureAlgorithmIdentifier);
  var KeyEncryptionAlgorithmIdentifier = class KeyEncryptionAlgorithmIdentifier2 extends AlgorithmIdentifier {
  };
  KeyEncryptionAlgorithmIdentifier = __decorate2([AsnType({ type: AsnTypeTypes.Sequence })], KeyEncryptionAlgorithmIdentifier);
  var ContentEncryptionAlgorithmIdentifier = class ContentEncryptionAlgorithmIdentifier2 extends AlgorithmIdentifier {
  };
  ContentEncryptionAlgorithmIdentifier = __decorate2([AsnType({ type: AsnTypeTypes.Sequence })], ContentEncryptionAlgorithmIdentifier);
  var MessageAuthenticationCodeAlgorithm = class MessageAuthenticationCodeAlgorithm2 extends AlgorithmIdentifier {
  };
  MessageAuthenticationCodeAlgorithm = __decorate2([AsnType({ type: AsnTypeTypes.Sequence })], MessageAuthenticationCodeAlgorithm);
  var KeyDerivationAlgorithmIdentifier = class KeyDerivationAlgorithmIdentifier2 extends AlgorithmIdentifier {
  };
  KeyDerivationAlgorithmIdentifier = __decorate2([AsnType({ type: AsnTypeTypes.Sequence })], KeyDerivationAlgorithmIdentifier);

  // node_modules/@peculiar/asn1-cms/build/attribute.js
  var Attribute2 = class {
    attrType = "";
    attrValues = [];
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate2([AsnProp({ type: AsnPropTypes.ObjectIdentifier })], Attribute2.prototype, "attrType", void 0);
  __decorate2([AsnProp({
    type: AsnPropTypes.Any,
    repeated: "set"
  })], Attribute2.prototype, "attrValues", void 0);

  // node_modules/@peculiar/asn1-cms/build/signer_info.js
  var _SignerInfos;
  var SignerInfo = class {
    version = 0;
    sid = new SignerIdentifier();
    digestAlgorithm = new DigestAlgorithmIdentifier();
    signedAttrs;
    signedAttrsRaw;
    signatureAlgorithm = new SignatureAlgorithmIdentifier();
    signature = new OctetString3();
    unsignedAttrs;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate2([AsnProp({ type: AsnPropTypes.Integer })], SignerInfo.prototype, "version", void 0);
  __decorate2([AsnProp({ type: SignerIdentifier })], SignerInfo.prototype, "sid", void 0);
  __decorate2([AsnProp({ type: DigestAlgorithmIdentifier })], SignerInfo.prototype, "digestAlgorithm", void 0);
  __decorate2([AsnProp({
    type: Attribute2,
    repeated: "set",
    context: 0,
    implicit: true,
    optional: true,
    raw: true
  })], SignerInfo.prototype, "signedAttrs", void 0);
  __decorate2([AsnProp({ type: SignatureAlgorithmIdentifier })], SignerInfo.prototype, "signatureAlgorithm", void 0);
  __decorate2([AsnProp({ type: OctetString3 })], SignerInfo.prototype, "signature", void 0);
  __decorate2([AsnProp({
    type: Attribute2,
    repeated: "set",
    context: 1,
    implicit: true,
    optional: true
  })], SignerInfo.prototype, "unsignedAttrs", void 0);
  var SignerInfos = _SignerInfos = class SignerInfos2 extends AsnArray {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _SignerInfos.prototype);
    }
  };
  SignerInfos = _SignerInfos = __decorate2([AsnType({
    type: AsnTypeTypes.Set,
    itemType: SignerInfo
  })], SignerInfos);

  // node_modules/@peculiar/asn1-x509-attr/build/_virtual/_@oxc-project_runtime@0.155.0/helpers/esm/decorate.js
  function __decorate3(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  }

  // node_modules/@peculiar/asn1-x509-attr/build/issuer_serial.js
  var IssuerSerial = class {
    issuer = new GeneralNames();
    serial = /* @__PURE__ */ new ArrayBuffer(0);
    issuerUID = /* @__PURE__ */ new ArrayBuffer(0);
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate3([AsnProp({ type: GeneralNames })], IssuerSerial.prototype, "issuer", void 0);
  __decorate3([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })], IssuerSerial.prototype, "serial", void 0);
  __decorate3([AsnProp({
    type: AsnPropTypes.BitString,
    optional: true
  })], IssuerSerial.prototype, "issuerUID", void 0);

  // node_modules/@peculiar/asn1-x509-attr/build/object_digest_info.js
  var ObjectDigestInfo = class {
    digestedObjectType = 0;
    otherObjectTypeID;
    digestAlgorithm = new AlgorithmIdentifier();
    objectDigest = /* @__PURE__ */ new ArrayBuffer(0);
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate3([AsnProp({ type: AsnPropTypes.Enumerated })], ObjectDigestInfo.prototype, "digestedObjectType", void 0);
  __decorate3([AsnProp({
    type: AsnPropTypes.ObjectIdentifier,
    optional: true
  })], ObjectDigestInfo.prototype, "otherObjectTypeID", void 0);
  __decorate3([AsnProp({ type: AlgorithmIdentifier })], ObjectDigestInfo.prototype, "digestAlgorithm", void 0);
  __decorate3([AsnProp({ type: AsnPropTypes.BitString })], ObjectDigestInfo.prototype, "objectDigest", void 0);

  // node_modules/@peculiar/asn1-x509-attr/build/v2_form.js
  var V2Form = class {
    issuerName;
    baseCertificateID;
    objectDigestInfo;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate3([AsnProp({
    type: GeneralNames,
    optional: true
  })], V2Form.prototype, "issuerName", void 0);
  __decorate3([AsnProp({
    type: IssuerSerial,
    context: 0,
    implicit: true,
    optional: true
  })], V2Form.prototype, "baseCertificateID", void 0);
  __decorate3([AsnProp({
    type: ObjectDigestInfo,
    context: 1,
    implicit: true,
    optional: true
  })], V2Form.prototype, "objectDigestInfo", void 0);

  // node_modules/@peculiar/asn1-x509-attr/build/attr_cert_issuer.js
  var AttCertIssuer = class AttCertIssuer2 {
    v1Form;
    v2Form;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate3([AsnProp({
    type: GeneralName,
    repeated: "sequence"
  })], AttCertIssuer.prototype, "v1Form", void 0);
  __decorate3([AsnProp({
    type: V2Form,
    context: 0,
    implicit: true
  })], AttCertIssuer.prototype, "v2Form", void 0);
  AttCertIssuer = __decorate3([AsnType({ type: AsnTypeTypes.Choice })], AttCertIssuer);

  // node_modules/@peculiar/asn1-x509-attr/build/attr_cert_validity_period.js
  var AttCertValidityPeriod = class {
    notBeforeTime = /* @__PURE__ */ new Date();
    notAfterTime = /* @__PURE__ */ new Date();
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate3([AsnProp({ type: AsnPropTypes.GeneralizedTime })], AttCertValidityPeriod.prototype, "notBeforeTime", void 0);
  __decorate3([AsnProp({ type: AsnPropTypes.GeneralizedTime })], AttCertValidityPeriod.prototype, "notAfterTime", void 0);

  // node_modules/@peculiar/asn1-x509-attr/build/holder.js
  var Holder = class {
    baseCertificateID;
    entityName;
    objectDigestInfo;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate3([AsnProp({
    type: IssuerSerial,
    implicit: true,
    context: 0,
    optional: true
  })], Holder.prototype, "baseCertificateID", void 0);
  __decorate3([AsnProp({
    type: GeneralNames,
    implicit: true,
    context: 1,
    optional: true
  })], Holder.prototype, "entityName", void 0);
  __decorate3([AsnProp({
    type: ObjectDigestInfo,
    implicit: true,
    context: 2,
    optional: true
  })], Holder.prototype, "objectDigestInfo", void 0);

  // node_modules/@peculiar/asn1-x509-attr/build/attribute_certificate_info.js
  var AttributeCertificateInfo = class {
    version = 1;
    holder = new Holder();
    issuer = new AttCertIssuer();
    signature = new AlgorithmIdentifier();
    serialNumber = /* @__PURE__ */ new ArrayBuffer(0);
    attrCertValidityPeriod = new AttCertValidityPeriod();
    attributes = [];
    issuerUniqueID;
    extensions;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate3([AsnProp({ type: AsnPropTypes.Integer })], AttributeCertificateInfo.prototype, "version", void 0);
  __decorate3([AsnProp({ type: Holder })], AttributeCertificateInfo.prototype, "holder", void 0);
  __decorate3([AsnProp({ type: AttCertIssuer })], AttributeCertificateInfo.prototype, "issuer", void 0);
  __decorate3([AsnProp({ type: AlgorithmIdentifier })], AttributeCertificateInfo.prototype, "signature", void 0);
  __decorate3([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })], AttributeCertificateInfo.prototype, "serialNumber", void 0);
  __decorate3([AsnProp({ type: AttCertValidityPeriod })], AttributeCertificateInfo.prototype, "attrCertValidityPeriod", void 0);
  __decorate3([AsnProp({
    type: Attribute,
    repeated: "sequence"
  })], AttributeCertificateInfo.prototype, "attributes", void 0);
  __decorate3([AsnProp({
    type: AsnPropTypes.BitString,
    optional: true
  })], AttributeCertificateInfo.prototype, "issuerUniqueID", void 0);
  __decorate3([AsnProp({
    type: Extensions,
    optional: true
  })], AttributeCertificateInfo.prototype, "extensions", void 0);

  // node_modules/@peculiar/asn1-x509-attr/build/attribute_certificate.js
  var AttributeCertificate = class {
    acinfo = new AttributeCertificateInfo();
    signatureAlgorithm = new AlgorithmIdentifier();
    signatureValue = /* @__PURE__ */ new ArrayBuffer(0);
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate3([AsnProp({ type: AttributeCertificateInfo })], AttributeCertificate.prototype, "acinfo", void 0);
  __decorate3([AsnProp({ type: AlgorithmIdentifier })], AttributeCertificate.prototype, "signatureAlgorithm", void 0);
  __decorate3([AsnProp({ type: AsnPropTypes.BitString })], AttributeCertificate.prototype, "signatureValue", void 0);

  // node_modules/@peculiar/asn1-x509-attr/build/object_identifiers.js
  var id_pe_ac_auditIdentity = `${id_pe}.4`;
  var id_pe_aaControls = `${id_pe}.6`;
  var id_pe_ac_proxying = `${id_pe}.10`;
  var id_ce_targetInformation = `${id_ce}.55`;
  var id_aca = `${id_pkix}.10`;
  var id_aca_authenticationInfo = `${id_aca}.1`;
  var id_aca_accessIdentity = `${id_aca}.2`;
  var id_aca_chargingIdentity = `${id_aca}.3`;
  var id_aca_group = `${id_aca}.4`;
  var id_aca_encAttrs = `${id_aca}.6`;
  var id_at = "2.5.4";
  var id_at_role = `${id_at}.72`;

  // node_modules/@peculiar/asn1-cms/build/certificate_choices.js
  var _CertificateSet;
  var OtherCertificateFormat = class {
    otherCertFormat = "";
    otherCert = /* @__PURE__ */ new ArrayBuffer(0);
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate2([AsnProp({ type: AsnPropTypes.ObjectIdentifier })], OtherCertificateFormat.prototype, "otherCertFormat", void 0);
  __decorate2([AsnProp({ type: AsnPropTypes.Any })], OtherCertificateFormat.prototype, "otherCert", void 0);
  var CertificateChoices = class CertificateChoices2 {
    certificate;
    v2AttrCert;
    other;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate2([AsnProp({ type: Certificate })], CertificateChoices.prototype, "certificate", void 0);
  __decorate2([AsnProp({
    type: AttributeCertificate,
    context: 2,
    implicit: true
  })], CertificateChoices.prototype, "v2AttrCert", void 0);
  __decorate2([AsnProp({
    type: OtherCertificateFormat,
    context: 3,
    implicit: true
  })], CertificateChoices.prototype, "other", void 0);
  CertificateChoices = __decorate2([AsnType({ type: AsnTypeTypes.Choice })], CertificateChoices);
  var CertificateSet = _CertificateSet = class CertificateSet2 extends AsnArray {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _CertificateSet.prototype);
    }
  };
  CertificateSet = _CertificateSet = __decorate2([AsnType({
    type: AsnTypeTypes.Set,
    itemType: CertificateChoices
  })], CertificateSet);

  // node_modules/@peculiar/asn1-cms/build/content_info.js
  var ContentInfo = class {
    contentType = "";
    content = /* @__PURE__ */ new ArrayBuffer(0);
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate2([AsnProp({ type: AsnPropTypes.ObjectIdentifier })], ContentInfo.prototype, "contentType", void 0);
  __decorate2([AsnProp({
    type: AsnPropTypes.Any,
    context: 0
  })], ContentInfo.prototype, "content", void 0);

  // node_modules/@peculiar/asn1-cms/build/encapsulated_content_info.js
  var EncapsulatedContent = class EncapsulatedContent2 {
    single;
    any;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate2([AsnProp({ type: OctetString3 })], EncapsulatedContent.prototype, "single", void 0);
  __decorate2([AsnProp({ type: AsnPropTypes.Any })], EncapsulatedContent.prototype, "any", void 0);
  EncapsulatedContent = __decorate2([AsnType({ type: AsnTypeTypes.Choice })], EncapsulatedContent);
  var EncapsulatedContentInfo = class {
    eContentType = "";
    eContent;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate2([AsnProp({ type: AsnPropTypes.ObjectIdentifier })], EncapsulatedContentInfo.prototype, "eContentType", void 0);
  __decorate2([AsnProp({
    type: EncapsulatedContent,
    context: 0,
    optional: true
  })], EncapsulatedContentInfo.prototype, "eContent", void 0);

  // node_modules/@peculiar/asn1-cms/build/revocation_info_choice.js
  var _RevocationInfoChoices;
  var id_ri = `${id_pkix}.16`;
  var id_ri_ocsp_response = `${id_ri}.2`;
  var id_ri_scvp = `${id_ri}.4`;
  var OtherRevocationInfoFormat = class {
    otherRevInfoFormat = "";
    otherRevInfo = /* @__PURE__ */ new ArrayBuffer(0);
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate2([AsnProp({ type: AsnPropTypes.ObjectIdentifier })], OtherRevocationInfoFormat.prototype, "otherRevInfoFormat", void 0);
  __decorate2([AsnProp({ type: AsnPropTypes.Any })], OtherRevocationInfoFormat.prototype, "otherRevInfo", void 0);
  var RevocationInfoChoice = class RevocationInfoChoice2 {
    other = new OtherRevocationInfoFormat();
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate2([AsnProp({
    type: OtherRevocationInfoFormat,
    context: 1,
    implicit: true
  })], RevocationInfoChoice.prototype, "other", void 0);
  RevocationInfoChoice = __decorate2([AsnType({ type: AsnTypeTypes.Choice })], RevocationInfoChoice);
  var RevocationInfoChoices = _RevocationInfoChoices = class RevocationInfoChoices2 extends AsnArray {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _RevocationInfoChoices.prototype);
    }
  };
  RevocationInfoChoices = _RevocationInfoChoices = __decorate2([AsnType({
    type: AsnTypeTypes.Set,
    itemType: RevocationInfoChoice
  })], RevocationInfoChoices);

  // node_modules/@peculiar/asn1-cms/build/object_identifiers.js
  var id_data = "1.2.840.113549.1.7.1";
  var id_signedData = "1.2.840.113549.1.7.2";

  // node_modules/@peculiar/asn1-cms/build/signed_data.js
  var _DigestAlgorithmIdentifiers;
  var DigestAlgorithmIdentifiers = _DigestAlgorithmIdentifiers = class DigestAlgorithmIdentifiers2 extends AsnArray {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _DigestAlgorithmIdentifiers.prototype);
    }
  };
  DigestAlgorithmIdentifiers = _DigestAlgorithmIdentifiers = __decorate2([AsnType({
    type: AsnTypeTypes.Set,
    itemType: DigestAlgorithmIdentifier
  })], DigestAlgorithmIdentifiers);
  var SignedData = class {
    version = 0;
    digestAlgorithms = new DigestAlgorithmIdentifiers();
    encapContentInfo = new EncapsulatedContentInfo();
    certificates;
    crls;
    signerInfos = new SignerInfos();
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate2([AsnProp({ type: AsnPropTypes.Integer })], SignedData.prototype, "version", void 0);
  __decorate2([AsnProp({ type: DigestAlgorithmIdentifiers })], SignedData.prototype, "digestAlgorithms", void 0);
  __decorate2([AsnProp({ type: EncapsulatedContentInfo })], SignedData.prototype, "encapContentInfo", void 0);
  __decorate2([AsnProp({
    type: CertificateSet,
    context: 0,
    implicit: true,
    optional: true
  })], SignedData.prototype, "certificates", void 0);
  __decorate2([AsnProp({
    type: RevocationInfoChoices,
    context: 1,
    implicit: true,
    optional: true
  })], SignedData.prototype, "crls", void 0);
  __decorate2([AsnProp({ type: SignerInfos })], SignedData.prototype, "signerInfos", void 0);

  // node_modules/@peculiar/asn1-ecc/build/object_identifiers.js
  var id_ecPublicKey = "1.2.840.10045.2.1";
  var id_ecdsaWithSHA1 = "1.2.840.10045.4.1";
  var id_ecdsaWithSHA224 = "1.2.840.10045.4.3.1";
  var id_ecdsaWithSHA256 = "1.2.840.10045.4.3.2";
  var id_ecdsaWithSHA384 = "1.2.840.10045.4.3.3";
  var id_ecdsaWithSHA512 = "1.2.840.10045.4.3.4";
  var id_secp256r1 = "1.2.840.10045.3.1.7";
  var id_secp384r1 = "1.3.132.0.34";
  var id_secp521r1 = "1.3.132.0.35";

  // node_modules/@peculiar/asn1-ecc/build/algorithms.js
  function create(algorithm) {
    return new AlgorithmIdentifier({ algorithm });
  }
  var ecdsaWithSHA1 = create(id_ecdsaWithSHA1);
  var ecdsaWithSHA224 = create(id_ecdsaWithSHA224);
  var ecdsaWithSHA256 = create(id_ecdsaWithSHA256);
  var ecdsaWithSHA384 = create(id_ecdsaWithSHA384);
  var ecdsaWithSHA512 = create(id_ecdsaWithSHA512);

  // node_modules/@peculiar/asn1-ecc/build/_virtual/_@oxc-project_runtime@0.155.0/helpers/esm/decorate.js
  function __decorate4(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  }

  // node_modules/@peculiar/asn1-ecc/build/rfc3279.js
  var FieldID = class FieldID2 {
    fieldType;
    parameters;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate4([AsnProp({ type: AsnPropTypes.ObjectIdentifier })], FieldID.prototype, "fieldType", void 0);
  __decorate4([AsnProp({ type: AsnPropTypes.Any })], FieldID.prototype, "parameters", void 0);
  FieldID = __decorate4([AsnType({ type: AsnTypeTypes.Sequence })], FieldID);
  var ECPoint = class extends OctetString3 {
  };
  var Curve = class Curve2 {
    a;
    b;
    seed;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate4([AsnProp({ type: AsnPropTypes.OctetString })], Curve.prototype, "a", void 0);
  __decorate4([AsnProp({ type: AsnPropTypes.OctetString })], Curve.prototype, "b", void 0);
  __decorate4([AsnProp({
    type: AsnPropTypes.BitString,
    optional: true
  })], Curve.prototype, "seed", void 0);
  Curve = __decorate4([AsnType({ type: AsnTypeTypes.Sequence })], Curve);
  var SpecifiedECDomain = class SpecifiedECDomain2 {
    version = 1;
    fieldID;
    curve;
    base;
    order;
    cofactor;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate4([AsnProp({ type: AsnPropTypes.Integer })], SpecifiedECDomain.prototype, "version", void 0);
  __decorate4([AsnProp({ type: FieldID })], SpecifiedECDomain.prototype, "fieldID", void 0);
  __decorate4([AsnProp({ type: Curve })], SpecifiedECDomain.prototype, "curve", void 0);
  __decorate4([AsnProp({ type: ECPoint })], SpecifiedECDomain.prototype, "base", void 0);
  __decorate4([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })], SpecifiedECDomain.prototype, "order", void 0);
  __decorate4([AsnProp({
    type: AsnPropTypes.Integer,
    optional: true
  })], SpecifiedECDomain.prototype, "cofactor", void 0);
  SpecifiedECDomain = __decorate4([AsnType({ type: AsnTypeTypes.Sequence })], SpecifiedECDomain);

  // node_modules/@peculiar/asn1-ecc/build/ec_parameters.js
  var ECParameters = class ECParameters2 {
    namedCurve;
    implicitCurve;
    specifiedCurve;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate4([AsnProp({ type: AsnPropTypes.ObjectIdentifier })], ECParameters.prototype, "namedCurve", void 0);
  __decorate4([AsnProp({ type: AsnPropTypes.Null })], ECParameters.prototype, "implicitCurve", void 0);
  __decorate4([AsnProp({ type: SpecifiedECDomain })], ECParameters.prototype, "specifiedCurve", void 0);
  ECParameters = __decorate4([AsnType({ type: AsnTypeTypes.Choice })], ECParameters);

  // node_modules/@peculiar/asn1-ecc/build/ec_signature_value.js
  var ECDSASigValue = class {
    r = /* @__PURE__ */ new ArrayBuffer(0);
    s = /* @__PURE__ */ new ArrayBuffer(0);
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate4([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })], ECDSASigValue.prototype, "r", void 0);
  __decorate4([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })], ECDSASigValue.prototype, "s", void 0);

  // node_modules/@peculiar/asn1-rsa/build/object_identifiers.js
  var id_pkcs_1 = "1.2.840.113549.1.1";
  var id_rsaEncryption = `${id_pkcs_1}.1`;
  var id_RSAES_OAEP = `${id_pkcs_1}.7`;
  var id_pSpecified = `${id_pkcs_1}.9`;
  var id_RSASSA_PSS = `${id_pkcs_1}.10`;
  var id_md2WithRSAEncryption = `${id_pkcs_1}.2`;
  var id_md5WithRSAEncryption = `${id_pkcs_1}.4`;
  var id_sha1WithRSAEncryption = `${id_pkcs_1}.5`;
  var id_sha224WithRSAEncryption = `${id_pkcs_1}.14`;
  var id_sha256WithRSAEncryption = `${id_pkcs_1}.11`;
  var id_sha384WithRSAEncryption = `${id_pkcs_1}.12`;
  var id_sha512WithRSAEncryption = `${id_pkcs_1}.13`;
  var id_sha512_224WithRSAEncryption = `${id_pkcs_1}.15`;
  var id_sha512_256WithRSAEncryption = `${id_pkcs_1}.16`;
  var id_sha1 = "1.3.14.3.2.26";
  var id_sha224 = "2.16.840.1.101.3.4.2.4";
  var id_sha256 = "2.16.840.1.101.3.4.2.1";
  var id_sha384 = "2.16.840.1.101.3.4.2.2";
  var id_sha512 = "2.16.840.1.101.3.4.2.3";
  var id_sha512_224 = "2.16.840.1.101.3.4.2.5";
  var id_sha512_256 = "2.16.840.1.101.3.4.2.6";
  var id_md2 = "1.2.840.113549.2.2";
  var id_md5 = "1.2.840.113549.2.5";
  var id_mgf1 = `${id_pkcs_1}.8`;

  // node_modules/@peculiar/asn1-rsa/build/algorithms.js
  function create2(algorithm) {
    return new AlgorithmIdentifier({
      algorithm,
      parameters: null
    });
  }
  var md2 = create2(id_md2);
  var md4 = create2(id_md5);
  var sha1 = create2(id_sha1);
  var sha224 = create2(id_sha224);
  var sha256 = create2(id_sha256);
  var sha384 = create2(id_sha384);
  var sha512 = create2(id_sha512);
  var sha512_224 = create2(id_sha512_224);
  var sha512_256 = create2(id_sha512_256);
  var mgf1SHA1 = new AlgorithmIdentifier({
    algorithm: id_mgf1,
    parameters: AsnConvert.serialize(sha1)
  });
  var pSpecifiedEmpty = new AlgorithmIdentifier({
    algorithm: id_pSpecified,
    parameters: AsnConvert.serialize(AsnOctetStringConverter.toASN(new Uint8Array([
      218,
      57,
      163,
      238,
      94,
      107,
      75,
      13,
      50,
      85,
      191,
      239,
      149,
      96,
      24,
      144,
      175,
      216,
      7,
      9
    ]).buffer))
  });
  var rsaEncryption = create2(id_rsaEncryption);
  var md2WithRSAEncryption = create2(id_md2WithRSAEncryption);
  var md5WithRSAEncryption = create2(id_md5WithRSAEncryption);
  var sha1WithRSAEncryption = create2(id_sha1WithRSAEncryption);
  var sha224WithRSAEncryption = create2(id_sha512_224WithRSAEncryption);
  var sha256WithRSAEncryption = create2(id_sha512_256WithRSAEncryption);
  var sha384WithRSAEncryption = create2(id_sha384WithRSAEncryption);
  var sha512WithRSAEncryption = create2(id_sha512WithRSAEncryption);
  var sha512_224WithRSAEncryption = create2(id_sha512_224WithRSAEncryption);
  var sha512_256WithRSAEncryption = create2(id_sha512_256WithRSAEncryption);

  // node_modules/@peculiar/asn1-rsa/build/_virtual/_@oxc-project_runtime@0.155.0/helpers/esm/decorate.js
  function __decorate5(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  }

  // node_modules/@peculiar/asn1-rsa/build/parameters/rsassa_pss.js
  var RsaSaPssParams = class {
    hashAlgorithm = new AlgorithmIdentifier(sha1);
    maskGenAlgorithm = new AlgorithmIdentifier({
      algorithm: id_mgf1,
      parameters: AsnConvert.serialize(sha1)
    });
    saltLength = 20;
    trailerField = 1;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate5([AsnProp({
    type: AlgorithmIdentifier,
    context: 0,
    defaultValue: sha1
  })], RsaSaPssParams.prototype, "hashAlgorithm", void 0);
  __decorate5([AsnProp({
    type: AlgorithmIdentifier,
    context: 1,
    defaultValue: mgf1SHA1
  })], RsaSaPssParams.prototype, "maskGenAlgorithm", void 0);
  __decorate5([AsnProp({
    type: AsnPropTypes.Integer,
    context: 2,
    defaultValue: 20
  })], RsaSaPssParams.prototype, "saltLength", void 0);
  __decorate5([AsnProp({
    type: AsnPropTypes.Integer,
    context: 3,
    defaultValue: 1
  })], RsaSaPssParams.prototype, "trailerField", void 0);
  var RSASSA_PSS = new AlgorithmIdentifier({
    algorithm: id_RSASSA_PSS,
    parameters: AsnConvert.serialize(new RsaSaPssParams())
  });

  // node_modules/@peculiar/asn1-rsa/build/parameters/rsassa_pkcs1_v1_5.js
  var DigestInfo = class {
    digestAlgorithm = new AlgorithmIdentifier();
    digest = new OctetString3();
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate5([AsnProp({ type: AlgorithmIdentifier })], DigestInfo.prototype, "digestAlgorithm", void 0);
  __decorate5([AsnProp({ type: OctetString3 })], DigestInfo.prototype, "digest", void 0);

  // node_modules/@peculiar/asn1-rsa/build/rsa_public_key.js
  var RSAPublicKey = class {
    modulus = /* @__PURE__ */ new ArrayBuffer(0);
    publicExponent = /* @__PURE__ */ new ArrayBuffer(0);
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate5([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })], RSAPublicKey.prototype, "modulus", void 0);
  __decorate5([AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })], RSAPublicKey.prototype, "publicExponent", void 0);

  // node_modules/tsyringe/dist/esm5/types/lifecycle.js
  var Lifecycle;
  (function(Lifecycle2) {
    Lifecycle2[Lifecycle2["Transient"] = 0] = "Transient";
    Lifecycle2[Lifecycle2["Singleton"] = 1] = "Singleton";
    Lifecycle2[Lifecycle2["ResolutionScoped"] = 2] = "ResolutionScoped";
    Lifecycle2[Lifecycle2["ContainerScoped"] = 3] = "ContainerScoped";
  })(Lifecycle || (Lifecycle = {}));
  var lifecycle_default = Lifecycle;

  // node_modules/tslib/tslib.es6.js
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2) if (b2.hasOwnProperty(p)) d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  function __extends(d, b) {
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  }
  function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() {
      if (t[0] & 1) throw t[1];
      return t[1];
    }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
      return this;
    }), g;
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (_) try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
        if (y = 0, t) op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return { value: op[1], done: false };
          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2]) _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  }
  function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
      next: function() {
        if (o && i >= o.length) o = void 0;
        return { value: o && o[i++], done: !o };
      }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
  }
  function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"])) m.call(i);
      } finally {
        if (e) throw e.error;
      }
    }
    return ar;
  }
  function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
      ar = ar.concat(__read(arguments[i]));
    return ar;
  }

  // node_modules/tsyringe/dist/esm5/reflection-helpers.js
  var INJECTION_TOKEN_METADATA_KEY = "injectionTokens";
  function getParamInfo(target) {
    var params = Reflect.getMetadata("design:paramtypes", target) || [];
    var injectionTokens = Reflect.getOwnMetadata(INJECTION_TOKEN_METADATA_KEY, target) || {};
    Object.keys(injectionTokens).forEach(function(key) {
      params[+key] = injectionTokens[key];
    });
    return params;
  }

  // node_modules/tsyringe/dist/esm5/providers/class-provider.js
  function isClassProvider(provider) {
    return !!provider.useClass;
  }

  // node_modules/tsyringe/dist/esm5/providers/factory-provider.js
  function isFactoryProvider(provider) {
    return !!provider.useFactory;
  }

  // node_modules/tsyringe/dist/esm5/lazy-helpers.js
  var DelayedConstructor = (function() {
    function DelayedConstructor2(wrap) {
      this.wrap = wrap;
      this.reflectMethods = [
        "get",
        "getPrototypeOf",
        "setPrototypeOf",
        "getOwnPropertyDescriptor",
        "defineProperty",
        "has",
        "set",
        "deleteProperty",
        "apply",
        "construct",
        "ownKeys"
      ];
    }
    DelayedConstructor2.prototype.createProxy = function(createObject) {
      var _this = this;
      var target = {};
      var init = false;
      var value;
      var delayedObject = function() {
        if (!init) {
          value = createObject(_this.wrap());
          init = true;
        }
        return value;
      };
      return new Proxy(target, this.createHandler(delayedObject));
    };
    DelayedConstructor2.prototype.createHandler = function(delayedObject) {
      var handler = {};
      var install = function(name) {
        handler[name] = function() {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
          }
          args[0] = delayedObject();
          var method = Reflect[name];
          return method.apply(void 0, __spread(args));
        };
      };
      this.reflectMethods.forEach(install);
      return handler;
    };
    return DelayedConstructor2;
  })();

  // node_modules/tsyringe/dist/esm5/providers/injection-token.js
  function isNormalToken(token) {
    return typeof token === "string" || typeof token === "symbol";
  }
  function isTokenDescriptor(descriptor) {
    return typeof descriptor === "object" && "token" in descriptor && "multiple" in descriptor;
  }
  function isTransformDescriptor(descriptor) {
    return typeof descriptor === "object" && "token" in descriptor && "transform" in descriptor;
  }
  function isConstructorToken(token) {
    return typeof token === "function" || token instanceof DelayedConstructor;
  }

  // node_modules/tsyringe/dist/esm5/providers/token-provider.js
  function isTokenProvider(provider) {
    return !!provider.useToken;
  }

  // node_modules/tsyringe/dist/esm5/providers/value-provider.js
  function isValueProvider(provider) {
    return provider.useValue != void 0;
  }

  // node_modules/tsyringe/dist/esm5/providers/provider.js
  function isProvider(provider) {
    return isClassProvider(provider) || isValueProvider(provider) || isTokenProvider(provider) || isFactoryProvider(provider);
  }

  // node_modules/tsyringe/dist/esm5/registry-base.js
  var RegistryBase = (function() {
    function RegistryBase2() {
      this._registryMap = /* @__PURE__ */ new Map();
    }
    RegistryBase2.prototype.entries = function() {
      return this._registryMap.entries();
    };
    RegistryBase2.prototype.getAll = function(key) {
      this.ensure(key);
      return this._registryMap.get(key);
    };
    RegistryBase2.prototype.get = function(key) {
      this.ensure(key);
      var value = this._registryMap.get(key);
      return value[value.length - 1] || null;
    };
    RegistryBase2.prototype.set = function(key, value) {
      this.ensure(key);
      this._registryMap.get(key).push(value);
    };
    RegistryBase2.prototype.setAll = function(key, value) {
      this._registryMap.set(key, value);
    };
    RegistryBase2.prototype.has = function(key) {
      this.ensure(key);
      return this._registryMap.get(key).length > 0;
    };
    RegistryBase2.prototype.clear = function() {
      this._registryMap.clear();
    };
    RegistryBase2.prototype.ensure = function(key) {
      if (!this._registryMap.has(key)) {
        this._registryMap.set(key, []);
      }
    };
    return RegistryBase2;
  })();
  var registry_base_default = RegistryBase;

  // node_modules/tsyringe/dist/esm5/registry.js
  var Registry = (function(_super) {
    __extends(Registry2, _super);
    function Registry2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    return Registry2;
  })(registry_base_default);
  var registry_default = Registry;

  // node_modules/tsyringe/dist/esm5/resolution-context.js
  var ResolutionContext = /* @__PURE__ */ (function() {
    function ResolutionContext2() {
      this.scopedResolutions = /* @__PURE__ */ new Map();
    }
    return ResolutionContext2;
  })();
  var resolution_context_default = ResolutionContext;

  // node_modules/tsyringe/dist/esm5/error-helpers.js
  function formatDependency(params, idx) {
    if (params === null) {
      return "at position #" + idx;
    }
    var argName = params.split(",")[idx].trim();
    return '"' + argName + '" at position #' + idx;
  }
  function composeErrorMessage(msg, e, indent) {
    if (indent === void 0) {
      indent = "    ";
    }
    return __spread([msg], e.message.split("\n").map(function(l) {
      return indent + l;
    })).join("\n");
  }
  function formatErrorCtor(ctor, paramIdx, error) {
    var _a = __read(ctor.toString().match(/constructor\(([\w, ]+)\)/) || [], 2), _b = _a[1], params = _b === void 0 ? null : _b;
    var dep = formatDependency(params, paramIdx);
    return composeErrorMessage("Cannot inject the dependency " + dep + ' of "' + ctor.name + '" constructor. Reason:', error);
  }

  // node_modules/tsyringe/dist/esm5/types/disposable.js
  function isDisposable(value) {
    if (typeof value.dispose !== "function")
      return false;
    var disposeFun = value.dispose;
    if (disposeFun.length > 0) {
      return false;
    }
    return true;
  }

  // node_modules/tsyringe/dist/esm5/interceptors.js
  var PreResolutionInterceptors = (function(_super) {
    __extends(PreResolutionInterceptors2, _super);
    function PreResolutionInterceptors2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    return PreResolutionInterceptors2;
  })(registry_base_default);
  var PostResolutionInterceptors = (function(_super) {
    __extends(PostResolutionInterceptors2, _super);
    function PostResolutionInterceptors2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    return PostResolutionInterceptors2;
  })(registry_base_default);
  var Interceptors = /* @__PURE__ */ (function() {
    function Interceptors2() {
      this.preResolution = new PreResolutionInterceptors();
      this.postResolution = new PostResolutionInterceptors();
    }
    return Interceptors2;
  })();
  var interceptors_default = Interceptors;

  // node_modules/tsyringe/dist/esm5/dependency-container.js
  var typeInfo = /* @__PURE__ */ new Map();
  var InternalDependencyContainer = (function() {
    function InternalDependencyContainer2(parent) {
      this.parent = parent;
      this._registry = new registry_default();
      this.interceptors = new interceptors_default();
      this.disposed = false;
      this.disposables = /* @__PURE__ */ new Set();
    }
    InternalDependencyContainer2.prototype.register = function(token, providerOrConstructor, options) {
      if (options === void 0) {
        options = { lifecycle: lifecycle_default.Transient };
      }
      this.ensureNotDisposed();
      var provider;
      if (!isProvider(providerOrConstructor)) {
        provider = { useClass: providerOrConstructor };
      } else {
        provider = providerOrConstructor;
      }
      if (isTokenProvider(provider)) {
        var path = [token];
        var tokenProvider = provider;
        while (tokenProvider != null) {
          var currentToken = tokenProvider.useToken;
          if (path.includes(currentToken)) {
            throw new Error("Token registration cycle detected! " + __spread(path, [currentToken]).join(" -> "));
          }
          path.push(currentToken);
          var registration = this._registry.get(currentToken);
          if (registration && isTokenProvider(registration.provider)) {
            tokenProvider = registration.provider;
          } else {
            tokenProvider = null;
          }
        }
      }
      if (options.lifecycle === lifecycle_default.Singleton || options.lifecycle == lifecycle_default.ContainerScoped || options.lifecycle == lifecycle_default.ResolutionScoped) {
        if (isValueProvider(provider) || isFactoryProvider(provider)) {
          throw new Error('Cannot use lifecycle "' + lifecycle_default[options.lifecycle] + '" with ValueProviders or FactoryProviders');
        }
      }
      this._registry.set(token, { provider, options });
      return this;
    };
    InternalDependencyContainer2.prototype.registerType = function(from, to) {
      this.ensureNotDisposed();
      if (isNormalToken(to)) {
        return this.register(from, {
          useToken: to
        });
      }
      return this.register(from, {
        useClass: to
      });
    };
    InternalDependencyContainer2.prototype.registerInstance = function(token, instance2) {
      this.ensureNotDisposed();
      return this.register(token, {
        useValue: instance2
      });
    };
    InternalDependencyContainer2.prototype.registerSingleton = function(from, to) {
      this.ensureNotDisposed();
      if (isNormalToken(from)) {
        if (isNormalToken(to)) {
          return this.register(from, {
            useToken: to
          }, { lifecycle: lifecycle_default.Singleton });
        } else if (to) {
          return this.register(from, {
            useClass: to
          }, { lifecycle: lifecycle_default.Singleton });
        }
        throw new Error('Cannot register a type name as a singleton without a "to" token');
      }
      var useClass = from;
      if (to && !isNormalToken(to)) {
        useClass = to;
      }
      return this.register(from, {
        useClass
      }, { lifecycle: lifecycle_default.Singleton });
    };
    InternalDependencyContainer2.prototype.resolve = function(token, context, isOptional) {
      if (context === void 0) {
        context = new resolution_context_default();
      }
      if (isOptional === void 0) {
        isOptional = false;
      }
      this.ensureNotDisposed();
      var registration = this.getRegistration(token);
      if (!registration && isNormalToken(token)) {
        if (isOptional) {
          return void 0;
        }
        throw new Error('Attempted to resolve unregistered dependency token: "' + token.toString() + '"');
      }
      this.executePreResolutionInterceptor(token, "Single");
      if (registration) {
        var result = this.resolveRegistration(registration, context);
        this.executePostResolutionInterceptor(token, result, "Single");
        return result;
      }
      if (isConstructorToken(token)) {
        var result = this.construct(token, context);
        this.executePostResolutionInterceptor(token, result, "Single");
        return result;
      }
      throw new Error("Attempted to construct an undefined constructor. Could mean a circular dependency problem. Try using `delay` function.");
    };
    InternalDependencyContainer2.prototype.executePreResolutionInterceptor = function(token, resolutionType) {
      var e_1, _a;
      if (this.interceptors.preResolution.has(token)) {
        var remainingInterceptors = [];
        try {
          for (var _b = __values(this.interceptors.preResolution.getAll(token)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var interceptor = _c.value;
            if (interceptor.options.frequency != "Once") {
              remainingInterceptors.push(interceptor);
            }
            interceptor.callback(token, resolutionType);
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
          } finally {
            if (e_1) throw e_1.error;
          }
        }
        this.interceptors.preResolution.setAll(token, remainingInterceptors);
      }
    };
    InternalDependencyContainer2.prototype.executePostResolutionInterceptor = function(token, result, resolutionType) {
      var e_2, _a;
      if (this.interceptors.postResolution.has(token)) {
        var remainingInterceptors = [];
        try {
          for (var _b = __values(this.interceptors.postResolution.getAll(token)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var interceptor = _c.value;
            if (interceptor.options.frequency != "Once") {
              remainingInterceptors.push(interceptor);
            }
            interceptor.callback(token, result, resolutionType);
          }
        } catch (e_2_1) {
          e_2 = { error: e_2_1 };
        } finally {
          try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
          } finally {
            if (e_2) throw e_2.error;
          }
        }
        this.interceptors.postResolution.setAll(token, remainingInterceptors);
      }
    };
    InternalDependencyContainer2.prototype.resolveRegistration = function(registration, context) {
      this.ensureNotDisposed();
      if (registration.options.lifecycle === lifecycle_default.ResolutionScoped && context.scopedResolutions.has(registration)) {
        return context.scopedResolutions.get(registration);
      }
      var isSingleton = registration.options.lifecycle === lifecycle_default.Singleton;
      var isContainerScoped = registration.options.lifecycle === lifecycle_default.ContainerScoped;
      var returnInstance = isSingleton || isContainerScoped;
      var resolved;
      if (isValueProvider(registration.provider)) {
        resolved = registration.provider.useValue;
      } else if (isTokenProvider(registration.provider)) {
        resolved = returnInstance ? registration.instance || (registration.instance = this.resolve(registration.provider.useToken, context)) : this.resolve(registration.provider.useToken, context);
      } else if (isClassProvider(registration.provider)) {
        resolved = returnInstance ? registration.instance || (registration.instance = this.construct(registration.provider.useClass, context)) : this.construct(registration.provider.useClass, context);
      } else if (isFactoryProvider(registration.provider)) {
        resolved = registration.provider.useFactory(this);
      } else {
        resolved = this.construct(registration.provider, context);
      }
      if (registration.options.lifecycle === lifecycle_default.ResolutionScoped) {
        context.scopedResolutions.set(registration, resolved);
      }
      return resolved;
    };
    InternalDependencyContainer2.prototype.resolveAll = function(token, context, isOptional) {
      var _this = this;
      if (context === void 0) {
        context = new resolution_context_default();
      }
      if (isOptional === void 0) {
        isOptional = false;
      }
      this.ensureNotDisposed();
      var registrations = this.getAllRegistrations(token);
      if (!registrations && isNormalToken(token)) {
        if (isOptional) {
          return [];
        }
        throw new Error('Attempted to resolve unregistered dependency token: "' + token.toString() + '"');
      }
      this.executePreResolutionInterceptor(token, "All");
      if (registrations) {
        var result_1 = registrations.map(function(item) {
          return _this.resolveRegistration(item, context);
        });
        this.executePostResolutionInterceptor(token, result_1, "All");
        return result_1;
      }
      var result = [this.construct(token, context)];
      this.executePostResolutionInterceptor(token, result, "All");
      return result;
    };
    InternalDependencyContainer2.prototype.isRegistered = function(token, recursive) {
      if (recursive === void 0) {
        recursive = false;
      }
      this.ensureNotDisposed();
      return this._registry.has(token) || recursive && (this.parent || false) && this.parent.isRegistered(token, true);
    };
    InternalDependencyContainer2.prototype.reset = function() {
      this.ensureNotDisposed();
      this._registry.clear();
      this.interceptors.preResolution.clear();
      this.interceptors.postResolution.clear();
    };
    InternalDependencyContainer2.prototype.clearInstances = function() {
      var e_3, _a;
      this.ensureNotDisposed();
      try {
        for (var _b = __values(this._registry.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
          var _d = __read(_c.value, 2), token = _d[0], registrations = _d[1];
          this._registry.setAll(token, registrations.filter(function(registration) {
            return !isValueProvider(registration.provider);
          }).map(function(registration) {
            registration.instance = void 0;
            return registration;
          }));
        }
      } catch (e_3_1) {
        e_3 = { error: e_3_1 };
      } finally {
        try {
          if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        } finally {
          if (e_3) throw e_3.error;
        }
      }
    };
    InternalDependencyContainer2.prototype.createChildContainer = function() {
      var e_4, _a;
      this.ensureNotDisposed();
      var childContainer = new InternalDependencyContainer2(this);
      try {
        for (var _b = __values(this._registry.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
          var _d = __read(_c.value, 2), token = _d[0], registrations = _d[1];
          if (registrations.some(function(_a2) {
            var options = _a2.options;
            return options.lifecycle === lifecycle_default.ContainerScoped;
          })) {
            childContainer._registry.setAll(token, registrations.map(function(registration) {
              if (registration.options.lifecycle === lifecycle_default.ContainerScoped) {
                return {
                  provider: registration.provider,
                  options: registration.options
                };
              }
              return registration;
            }));
          }
        }
      } catch (e_4_1) {
        e_4 = { error: e_4_1 };
      } finally {
        try {
          if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        } finally {
          if (e_4) throw e_4.error;
        }
      }
      return childContainer;
    };
    InternalDependencyContainer2.prototype.beforeResolution = function(token, callback, options) {
      if (options === void 0) {
        options = { frequency: "Always" };
      }
      this.interceptors.preResolution.set(token, {
        callback,
        options
      });
    };
    InternalDependencyContainer2.prototype.afterResolution = function(token, callback, options) {
      if (options === void 0) {
        options = { frequency: "Always" };
      }
      this.interceptors.postResolution.set(token, {
        callback,
        options
      });
    };
    InternalDependencyContainer2.prototype.dispose = function() {
      return __awaiter(this, void 0, void 0, function() {
        var promises;
        return __generator(this, function(_a) {
          switch (_a.label) {
            case 0:
              this.disposed = true;
              promises = [];
              this.disposables.forEach(function(disposable) {
                var maybePromise = disposable.dispose();
                if (maybePromise) {
                  promises.push(maybePromise);
                }
              });
              return [4, Promise.all(promises)];
            case 1:
              _a.sent();
              return [2];
          }
        });
      });
    };
    InternalDependencyContainer2.prototype.getRegistration = function(token) {
      if (this.isRegistered(token)) {
        return this._registry.get(token);
      }
      if (this.parent) {
        return this.parent.getRegistration(token);
      }
      return null;
    };
    InternalDependencyContainer2.prototype.getAllRegistrations = function(token) {
      if (this.isRegistered(token)) {
        return this._registry.getAll(token);
      }
      if (this.parent) {
        return this.parent.getAllRegistrations(token);
      }
      return null;
    };
    InternalDependencyContainer2.prototype.construct = function(ctor, context) {
      var _this = this;
      if (ctor instanceof DelayedConstructor) {
        return ctor.createProxy(function(target) {
          return _this.resolve(target, context);
        });
      }
      var instance2 = (function() {
        var paramInfo = typeInfo.get(ctor);
        if (!paramInfo || paramInfo.length === 0) {
          if (ctor.length === 0) {
            return new ctor();
          } else {
            throw new Error('TypeInfo not known for "' + ctor.name + '"');
          }
        }
        var params = paramInfo.map(_this.resolveParams(context, ctor));
        return new (ctor.bind.apply(ctor, __spread([void 0], params)))();
      })();
      if (isDisposable(instance2)) {
        this.disposables.add(instance2);
      }
      return instance2;
    };
    InternalDependencyContainer2.prototype.resolveParams = function(context, ctor) {
      var _this = this;
      return function(param, idx) {
        var _a, _b, _c;
        try {
          if (isTokenDescriptor(param)) {
            if (isTransformDescriptor(param)) {
              return param.multiple ? (_a = _this.resolve(param.transform)).transform.apply(_a, __spread([_this.resolveAll(param.token, new resolution_context_default(), param.isOptional)], param.transformArgs)) : (_b = _this.resolve(param.transform)).transform.apply(_b, __spread([_this.resolve(param.token, context, param.isOptional)], param.transformArgs));
            } else {
              return param.multiple ? _this.resolveAll(param.token, new resolution_context_default(), param.isOptional) : _this.resolve(param.token, context, param.isOptional);
            }
          } else if (isTransformDescriptor(param)) {
            return (_c = _this.resolve(param.transform, context)).transform.apply(_c, __spread([_this.resolve(param.token, context)], param.transformArgs));
          }
          return _this.resolve(param, context);
        } catch (e) {
          throw new Error(formatErrorCtor(ctor, idx, e));
        }
      };
    };
    InternalDependencyContainer2.prototype.ensureNotDisposed = function() {
      if (this.disposed) {
        throw new Error("This container has been disposed, you cannot interact with a disposed container");
      }
    };
    return InternalDependencyContainer2;
  })();
  var instance = new InternalDependencyContainer();

  // node_modules/tsyringe/dist/esm5/decorators/injectable.js
  function injectable(options) {
    return function(target) {
      typeInfo.set(target, getParamInfo(target));
      if (options && options.token) {
        if (!Array.isArray(options.token)) {
          instance.register(options.token, target);
        } else {
          options.token.forEach(function(token) {
            instance.register(token, target);
          });
        }
      }
    };
  }
  var injectable_default = injectable;

  // node_modules/tsyringe/dist/esm5/index.js
  if (typeof Reflect === "undefined" || !Reflect.getMetadata) {
    throw new Error(`tsyringe requires a reflect polyfill. Please add 'import "reflect-metadata"' to the top of your entry point.`);
  }

  // node_modules/@peculiar/asn1-pkcs9/build/_virtual/_@oxc-project_runtime@0.155.0/helpers/esm/decorate.js
  function __decorate6(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  }

  // node_modules/@peculiar/asn1-pfx/build/_virtual/_@oxc-project_runtime@0.155.0/helpers/esm/decorate.js
  function __decorate7(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  }

  // node_modules/@peculiar/asn1-pkcs8/build/_virtual/_@oxc-project_runtime@0.155.0/helpers/esm/decorate.js
  function __decorate8(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  }

  // node_modules/@peculiar/asn1-pkcs8/build/encrypted_private_key_info.js
  var EncryptedData = class extends OctetString3 {
  };
  var EncryptedPrivateKeyInfo = class {
    encryptionAlgorithm = new AlgorithmIdentifier();
    encryptedData = new EncryptedData();
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate8([AsnProp({ type: AlgorithmIdentifier })], EncryptedPrivateKeyInfo.prototype, "encryptionAlgorithm", void 0);
  __decorate8([AsnProp({ type: EncryptedData })], EncryptedPrivateKeyInfo.prototype, "encryptedData", void 0);

  // node_modules/@peculiar/asn1-pfx/build/mac_data.js
  var MacData = class {
    mac = new DigestInfo();
    macSalt = new OctetString3();
    iterations = 1;
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate7([AsnProp({ type: DigestInfo })], MacData.prototype, "mac", void 0);
  __decorate7([AsnProp({ type: OctetString3 })], MacData.prototype, "macSalt", void 0);
  __decorate7([AsnProp({
    type: AsnPropTypes.Integer,
    defaultValue: 1
  })], MacData.prototype, "iterations", void 0);

  // node_modules/@peculiar/asn1-pfx/build/pfx.js
  var PFX = class {
    version = 3;
    authSafe = new ContentInfo();
    macData = new MacData();
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate7([AsnProp({ type: AsnPropTypes.Integer })], PFX.prototype, "version", void 0);
  __decorate7([AsnProp({ type: ContentInfo })], PFX.prototype, "authSafe", void 0);
  __decorate7([AsnProp({
    type: MacData,
    optional: true
  })], PFX.prototype, "macData", void 0);

  // node_modules/@peculiar/asn1-pkcs9/build/index.js
  var _ExtensionRequest;
  var _ExtendedCertificateAttributes;
  var _SMIMECapabilities;
  var id_pkcs9 = "1.2.840.113549.1.9";
  var id_pkcs9_mo = `${id_pkcs9}.0`;
  var id_pkcs9_oc = `${id_pkcs9}.24`;
  var id_pkcs9_at = `${id_pkcs9}.25`;
  var id_pkcs9_sx = `${id_pkcs9}.26`;
  var id_pkcs9_mr = `${id_pkcs9}.27`;
  var id_pkcs9_oc_pkcsEntity = `${id_pkcs9_oc}.1`;
  var id_pkcs9_oc_naturalPerson = `${id_pkcs9_oc}.2`;
  var id_pkcs9_at_emailAddress = `${id_pkcs9}.1`;
  var id_pkcs9_at_unstructuredName = `${id_pkcs9}.2`;
  var id_pkcs9_at_contentType = `${id_pkcs9}.3`;
  var id_pkcs9_at_messageDigest = `${id_pkcs9}.4`;
  var id_pkcs9_at_signingTime = `${id_pkcs9}.5`;
  var id_pkcs9_at_counterSignature = `${id_pkcs9}.6`;
  var id_pkcs9_at_challengePassword = `${id_pkcs9}.7`;
  var id_pkcs9_at_unstructuredAddress = `${id_pkcs9}.8`;
  var id_pkcs9_at_extendedCertificateAttributes = `${id_pkcs9}.9`;
  var id_pkcs9_at_signingDescription = `${id_pkcs9}.13`;
  var id_pkcs9_at_extensionRequest = `${id_pkcs9}.14`;
  var id_pkcs9_at_smimeCapabilities = `${id_pkcs9}.15`;
  var id_pkcs9_at_friendlyName = `${id_pkcs9}.20`;
  var id_pkcs9_at_localKeyId = `${id_pkcs9}.21`;
  var id_pkcs9_at_pkcs15Token = `${id_pkcs9_at}.1`;
  var id_pkcs9_at_encryptedPrivateKeyInfo = `${id_pkcs9_at}.2`;
  var id_pkcs9_at_randomNonce = `${id_pkcs9_at}.3`;
  var id_pkcs9_at_sequenceNumber = `${id_pkcs9_at}.4`;
  var id_pkcs9_at_pkcs7PDU = `${id_pkcs9_at}.5`;
  var id_ietf_at = "1.3.6.1.5.5.7.9";
  var id_pkcs9_at_dateOfBirth = `${id_ietf_at}.1`;
  var id_pkcs9_at_placeOfBirth = `${id_ietf_at}.2`;
  var id_pkcs9_at_gender = `${id_ietf_at}.3`;
  var id_pkcs9_at_countryOfCitizenship = `${id_ietf_at}.4`;
  var id_pkcs9_at_countryOfResidence = `${id_ietf_at}.5`;
  var id_pkcs9_sx_pkcs9String = `${id_pkcs9_sx}.1`;
  var id_pkcs9_sx_signingTime = `${id_pkcs9_sx}.2`;
  var id_pkcs9_mr_caseIgnoreMatch = `${id_pkcs9_mr}.1`;
  var id_pkcs9_mr_signingTimeMatch = `${id_pkcs9_mr}.2`;
  var id_smime = `${id_pkcs9}.16`;
  var id_certTypes = `${id_pkcs9}.22`;
  var crlTypes = `${id_pkcs9}.23`;
  var id_at_pseudonym = `${id_at}.65`;
  var PKCS9String = class PKCS9String2 extends DirectoryString {
    ia5String;
    constructor(params = {}) {
      super(params);
    }
    toString() {
      ({}).toString();
      return this.ia5String || super.toString();
    }
  };
  __decorate6([AsnProp({ type: AsnPropTypes.IA5String })], PKCS9String.prototype, "ia5String", void 0);
  PKCS9String = __decorate6([AsnType({ type: AsnTypeTypes.Choice })], PKCS9String);
  var Pkcs7PDU = class Pkcs7PDU2 extends ContentInfo {
  };
  Pkcs7PDU = __decorate6([AsnType({ type: AsnTypeTypes.Sequence })], Pkcs7PDU);
  var UserPKCS12 = class UserPKCS122 extends PFX {
  };
  UserPKCS12 = __decorate6([AsnType({ type: AsnTypeTypes.Sequence })], UserPKCS12);
  var EncryptedPrivateKeyInfo2 = class EncryptedPrivateKeyInfo3 extends EncryptedPrivateKeyInfo {
  };
  EncryptedPrivateKeyInfo2 = __decorate6([AsnType({ type: AsnTypeTypes.Sequence })], EncryptedPrivateKeyInfo2);
  var EmailAddress = class EmailAddress2 {
    value;
    constructor(value = "") {
      this.value = value;
    }
    toString() {
      return this.value;
    }
  };
  __decorate6([AsnProp({ type: AsnPropTypes.IA5String })], EmailAddress.prototype, "value", void 0);
  EmailAddress = __decorate6([AsnType({ type: AsnTypeTypes.Choice })], EmailAddress);
  var UnstructuredName = class UnstructuredName2 extends PKCS9String {
  };
  UnstructuredName = __decorate6([AsnType({ type: AsnTypeTypes.Choice })], UnstructuredName);
  var UnstructuredAddress = class UnstructuredAddress2 extends DirectoryString {
  };
  UnstructuredAddress = __decorate6([AsnType({ type: AsnTypeTypes.Choice })], UnstructuredAddress);
  var DateOfBirth = class DateOfBirth2 {
    value;
    constructor(value = /* @__PURE__ */ new Date()) {
      this.value = value;
    }
  };
  __decorate6([AsnProp({ type: AsnPropTypes.GeneralizedTime })], DateOfBirth.prototype, "value", void 0);
  DateOfBirth = __decorate6([AsnType({ type: AsnTypeTypes.Choice })], DateOfBirth);
  var PlaceOfBirth = class PlaceOfBirth2 extends DirectoryString {
  };
  PlaceOfBirth = __decorate6([AsnType({ type: AsnTypeTypes.Choice })], PlaceOfBirth);
  var Gender = class Gender2 {
    value;
    constructor(value = "M") {
      this.value = value;
    }
    toString() {
      return this.value;
    }
  };
  __decorate6([AsnProp({ type: AsnPropTypes.PrintableString })], Gender.prototype, "value", void 0);
  Gender = __decorate6([AsnType({ type: AsnTypeTypes.Choice })], Gender);
  var CountryOfCitizenship = class CountryOfCitizenship2 {
    value;
    constructor(value = "") {
      this.value = value;
    }
    toString() {
      return this.value;
    }
  };
  __decorate6([AsnProp({ type: AsnPropTypes.PrintableString })], CountryOfCitizenship.prototype, "value", void 0);
  CountryOfCitizenship = __decorate6([AsnType({ type: AsnTypeTypes.Choice })], CountryOfCitizenship);
  var CountryOfResidence = class CountryOfResidence2 extends CountryOfCitizenship {
  };
  CountryOfResidence = __decorate6([AsnType({ type: AsnTypeTypes.Choice })], CountryOfResidence);
  var Pseudonym = class Pseudonym2 extends DirectoryString {
  };
  Pseudonym = __decorate6([AsnType({ type: AsnTypeTypes.Choice })], Pseudonym);
  var ContentType = class ContentType2 {
    value;
    constructor(value = "") {
      this.value = value;
    }
    toString() {
      return this.value;
    }
  };
  __decorate6([AsnProp({ type: AsnPropTypes.ObjectIdentifier })], ContentType.prototype, "value", void 0);
  ContentType = __decorate6([AsnType({ type: AsnTypeTypes.Choice })], ContentType);
  var SigningTime = class SigningTime2 extends Time {
  };
  SigningTime = __decorate6([AsnType({ type: AsnTypeTypes.Choice })], SigningTime);
  var SequenceNumber = class SequenceNumber2 {
    value;
    constructor(value = 0) {
      this.value = value;
    }
    toString() {
      return this.value.toString();
    }
  };
  __decorate6([AsnProp({ type: AsnPropTypes.Integer })], SequenceNumber.prototype, "value", void 0);
  SequenceNumber = __decorate6([AsnType({ type: AsnTypeTypes.Choice })], SequenceNumber);
  var CounterSignature = class CounterSignature2 extends SignerInfo {
  };
  CounterSignature = __decorate6([AsnType({ type: AsnTypeTypes.Sequence })], CounterSignature);
  var ChallengePassword = class ChallengePassword2 extends DirectoryString {
  };
  ChallengePassword = __decorate6([AsnType({ type: AsnTypeTypes.Choice })], ChallengePassword);
  var ExtensionRequest = _ExtensionRequest = class ExtensionRequest2 extends Extensions {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _ExtensionRequest.prototype);
    }
  };
  ExtensionRequest = _ExtensionRequest = __decorate6([AsnType({ type: AsnTypeTypes.Sequence })], ExtensionRequest);
  var ExtendedCertificateAttributes = _ExtendedCertificateAttributes = class ExtendedCertificateAttributes2 extends AsnArray {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _ExtendedCertificateAttributes.prototype);
    }
  };
  ExtendedCertificateAttributes = _ExtendedCertificateAttributes = __decorate6([AsnType({
    type: AsnTypeTypes.Set,
    itemType: Attribute2
  })], ExtendedCertificateAttributes);
  var FriendlyName = class FriendlyName2 {
    value;
    constructor(value = "") {
      this.value = value;
    }
    toString() {
      return this.value;
    }
  };
  __decorate6([AsnProp({ type: AsnPropTypes.BmpString })], FriendlyName.prototype, "value", void 0);
  FriendlyName = __decorate6([AsnType({ type: AsnTypeTypes.Choice })], FriendlyName);
  var SMIMECapability = class SMIMECapability2 extends AlgorithmIdentifier {
  };
  SMIMECapability = __decorate6([AsnType({ type: AsnTypeTypes.Sequence })], SMIMECapability);
  var SMIMECapabilities = _SMIMECapabilities = class SMIMECapabilities2 extends AsnArray {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _SMIMECapabilities.prototype);
    }
  };
  SMIMECapabilities = _SMIMECapabilities = __decorate6([AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: SMIMECapability
  })], SMIMECapabilities);

  // node_modules/@peculiar/asn1-x509-post-quantum/build/object_identifiers.js
  var id_sigAlgs = "2.16.840.1.101.3.4.3";
  var id_ml_dsa_44 = `${id_sigAlgs}.17`;
  var id_ml_dsa_65 = `${id_sigAlgs}.18`;
  var id_ml_dsa_87 = `${id_sigAlgs}.19`;
  var id_slh_dsa_sha2_128s = `${id_sigAlgs}.20`;
  var id_slh_dsa_sha2_128f = `${id_sigAlgs}.21`;
  var id_slh_dsa_sha2_192s = `${id_sigAlgs}.22`;
  var id_slh_dsa_sha2_192f = `${id_sigAlgs}.23`;
  var id_slh_dsa_sha2_256s = `${id_sigAlgs}.24`;
  var id_slh_dsa_sha2_256f = `${id_sigAlgs}.25`;
  var id_slh_dsa_shake_128s = `${id_sigAlgs}.26`;
  var id_slh_dsa_shake_128f = `${id_sigAlgs}.27`;
  var id_slh_dsa_shake_192s = `${id_sigAlgs}.28`;
  var id_slh_dsa_shake_192f = `${id_sigAlgs}.29`;
  var id_slh_dsa_shake_256s = `${id_sigAlgs}.30`;
  var id_slh_dsa_shake_256f = `${id_sigAlgs}.31`;

  // node_modules/@peculiar/asn1-csr/build/_virtual/_@oxc-project_runtime@0.155.0/helpers/esm/decorate.js
  function __decorate9(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  }

  // node_modules/@peculiar/asn1-csr/build/attributes.js
  var _Attributes;
  var Attributes = _Attributes = class Attributes2 extends AsnArray {
    constructor(items) {
      super(items);
      Object.setPrototypeOf(this, _Attributes.prototype);
    }
  };
  Attributes = _Attributes = __decorate9([AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: Attribute
  })], Attributes);

  // node_modules/@peculiar/asn1-csr/build/certification_request_info.js
  var CertificationRequestInfo = class {
    version = 0;
    subject = new Name();
    subjectPKInfo = new SubjectPublicKeyInfo();
    attributes = new Attributes();
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate9([AsnProp({ type: AsnPropTypes.Integer })], CertificationRequestInfo.prototype, "version", void 0);
  __decorate9([AsnProp({ type: Name })], CertificationRequestInfo.prototype, "subject", void 0);
  __decorate9([AsnProp({ type: SubjectPublicKeyInfo })], CertificationRequestInfo.prototype, "subjectPKInfo", void 0);
  __decorate9([AsnProp({
    type: Attributes,
    implicit: true,
    context: 0,
    optional: true
  })], CertificationRequestInfo.prototype, "attributes", void 0);

  // node_modules/@peculiar/asn1-csr/build/certification_request.js
  var CertificationRequest = class {
    certificationRequestInfo = new CertificationRequestInfo();
    certificationRequestInfoRaw;
    signatureAlgorithm = new AlgorithmIdentifier();
    signature = /* @__PURE__ */ new ArrayBuffer(0);
    constructor(params = {}) {
      Object.assign(this, params);
    }
  };
  __decorate9([AsnProp({
    type: CertificationRequestInfo,
    raw: true
  })], CertificationRequest.prototype, "certificationRequestInfo", void 0);
  __decorate9([AsnProp({ type: AlgorithmIdentifier })], CertificationRequest.prototype, "signatureAlgorithm", void 0);
  __decorate9([AsnProp({ type: AsnPropTypes.BitString })], CertificationRequest.prototype, "signature", void 0);

  // node_modules/@peculiar/x509/build/index.js
  var _Symbol$toStringTag;
  var CryptoProvider = class CryptoProvider2 {
    static {
      _Symbol$toStringTag = Symbol.toStringTag;
    }
    static {
      this.DEFAULT = "default";
    }
    static isCryptoKeyPair(data) {
      return data && data.privateKey && data.publicKey;
    }
    static isCryptoKey(data) {
      return data && data.usages && data.type && data.algorithm && data.extractable !== void 0;
    }
    constructor() {
      this.items = /* @__PURE__ */ new Map();
      this[_Symbol$toStringTag] = "CryptoProvider";
      if (typeof self !== "undefined" && typeof crypto !== "undefined") this.set(CryptoProvider2.DEFAULT, crypto);
      else if (typeof global !== "undefined" && global.crypto && global.crypto.subtle) this.set(CryptoProvider2.DEFAULT, global.crypto);
    }
    clear() {
      this.items.clear();
    }
    delete(key) {
      return this.items.delete(key);
    }
    forEach(callbackfn, thisArg) {
      return this.items.forEach(callbackfn, thisArg);
    }
    has(key) {
      return this.items.has(key);
    }
    get size() {
      return this.items.size;
    }
    entries() {
      return this.items.entries();
    }
    keys() {
      return this.items.keys();
    }
    values() {
      return this.items.values();
    }
    [Symbol.iterator]() {
      return this.items[Symbol.iterator]();
    }
    get(key = CryptoProvider2.DEFAULT) {
      const crypto2 = this.items.get(key.toLowerCase());
      if (!crypto2) throw new Error(`Cannot get Crypto by name '${key}'`);
      return crypto2;
    }
    set(key, value) {
      if (typeof key === "string") {
        if (!value) throw new TypeError("Argument 'value' is required");
        this.items.set(key.toLowerCase(), value);
      } else this.items.set(CryptoProvider2.DEFAULT, key);
      return this;
    }
  };
  var cryptoProvider = new CryptoProvider();
  var hexOptions = {
    allowPrefix: false,
    allowOddLength: true,
    separators: [
      " ",
      "	",
      "\n",
      "\r"
    ]
  };
  function getElementLength(data) {
    let offset = 1;
    if ((data[0] & 31) === 31) while (data[offset++] & 128) ;
    const first = data[offset++];
    if (first === 128) return;
    if (first < 128) return offset + first;
    let length = 0;
    for (let i = 0; i < (first & 127); i++) length = length * 256 + data[offset++];
    return offset + length;
  }
  function assertSingleAsnElement(data) {
    const bytes = toUint8Array(data);
    const length = getElementLength(bytes);
    if (length !== void 0 && length !== bytes.byteLength) throw new Error(`Unexpected data after the ASN.1 structure: ${bytes.byteLength - length} trailing bytes`);
  }
  var selfProducedParseOptions = { berOptions: {
    maxDepth: Infinity,
    maxNodes: Infinity,
    maxContentLength: Infinity
  } };
  function getCertificateSerialNumber(raw) {
    let serialNumber = toUint8Array(raw);
    if (serialNumber.length > 1 && serialNumber[0] === 0 && serialNumber[1] > 127) serialNumber = serialNumber.slice(1);
    return hex_exports.encode(serialNumber);
  }
  var diAlgorithm = "crypto.algorithm";
  var AlgorithmProvider = class {
    getAlgorithms() {
      return instance.resolveAll(diAlgorithm);
    }
    toAsnAlgorithm(alg) {
      const algCopy = { ...alg };
      if (algCopy.hash && typeof algCopy.hash === "string") algCopy.hash = { name: algCopy.hash };
      for (const algorithm of this.getAlgorithms()) {
        const res = algorithm.toAsnAlgorithm(algCopy);
        if (res) return res;
      }
      if (/^[0-9.]+$/.test(alg.name)) {
        const res = new AlgorithmIdentifier({ algorithm: alg.name });
        if ("parameters" in alg) res.parameters = alg.parameters;
        return res;
      }
      throw new Error("Cannot convert WebCrypto algorithm to ASN.1 algorithm");
    }
    toWebAlgorithm(alg) {
      for (const algorithm of this.getAlgorithms()) {
        const res = algorithm.toWebAlgorithm(alg);
        if (res) return res;
      }
      return {
        name: alg.algorithm,
        parameters: alg.parameters
      };
    }
  };
  var diAlgorithmProvider = "crypto.algorithmProvider";
  instance.registerSingleton(diAlgorithmProvider, AlgorithmProvider);
  function __decorate10(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  }
  var _EcAlgorithm;
  var idVersionOne = "1.3.36.3.3.2.8.1.1";
  var idBrainpoolP160r1 = `${idVersionOne}.1`;
  var idBrainpoolP160t1 = `${idVersionOne}.2`;
  var idBrainpoolP192r1 = `${idVersionOne}.3`;
  var idBrainpoolP192t1 = `${idVersionOne}.4`;
  var idBrainpoolP224r1 = `${idVersionOne}.5`;
  var idBrainpoolP224t1 = `${idVersionOne}.6`;
  var idBrainpoolP256r1 = `${idVersionOne}.7`;
  var idBrainpoolP256t1 = `${idVersionOne}.8`;
  var idBrainpoolP320r1 = `${idVersionOne}.9`;
  var idBrainpoolP320t1 = `${idVersionOne}.10`;
  var idBrainpoolP384r1 = `${idVersionOne}.11`;
  var idBrainpoolP384t1 = `${idVersionOne}.12`;
  var idBrainpoolP512r1 = `${idVersionOne}.13`;
  var idBrainpoolP512t1 = `${idVersionOne}.14`;
  var brainpoolP160r1 = "brainpoolP160r1";
  var brainpoolP160t1 = "brainpoolP160t1";
  var brainpoolP192r1 = "brainpoolP192r1";
  var brainpoolP192t1 = "brainpoolP192t1";
  var brainpoolP224r1 = "brainpoolP224r1";
  var brainpoolP224t1 = "brainpoolP224t1";
  var brainpoolP256r1 = "brainpoolP256r1";
  var brainpoolP256t1 = "brainpoolP256t1";
  var brainpoolP320r1 = "brainpoolP320r1";
  var brainpoolP320t1 = "brainpoolP320t1";
  var brainpoolP384r1 = "brainpoolP384r1";
  var brainpoolP384t1 = "brainpoolP384t1";
  var brainpoolP512r1 = "brainpoolP512r1";
  var brainpoolP512t1 = "brainpoolP512t1";
  var ECDSA = "ECDSA";
  var EcAlgorithm = class EcAlgorithm2 {
    static {
      _EcAlgorithm = this;
    }
    static {
      this.SECP256K1 = "1.3.132.0.10";
    }
    toAsnAlgorithm(alg) {
      switch (alg.name.toLowerCase()) {
        case ECDSA.toLowerCase():
          if ("hash" in alg) switch ((typeof alg.hash === "string" ? alg.hash : alg.hash.name).toLowerCase()) {
            case "sha-1":
              return ecdsaWithSHA1;
            case "sha-256":
              return ecdsaWithSHA256;
            case "sha-384":
              return ecdsaWithSHA384;
            case "sha-512":
              return ecdsaWithSHA512;
          }
          else if ("namedCurve" in alg) {
            let parameters = "";
            switch (alg.namedCurve) {
              case "P-256":
                parameters = id_secp256r1;
                break;
              case "K-256":
                parameters = _EcAlgorithm.SECP256K1;
                break;
              case "P-384":
                parameters = id_secp384r1;
                break;
              case "P-521":
                parameters = id_secp521r1;
                break;
              case brainpoolP160r1:
                parameters = idBrainpoolP160r1;
                break;
              case brainpoolP160t1:
                parameters = idBrainpoolP160t1;
                break;
              case brainpoolP192r1:
                parameters = idBrainpoolP192r1;
                break;
              case brainpoolP192t1:
                parameters = idBrainpoolP192t1;
                break;
              case brainpoolP224r1:
                parameters = idBrainpoolP224r1;
                break;
              case brainpoolP224t1:
                parameters = idBrainpoolP224t1;
                break;
              case brainpoolP256r1:
                parameters = idBrainpoolP256r1;
                break;
              case brainpoolP256t1:
                parameters = idBrainpoolP256t1;
                break;
              case brainpoolP320r1:
                parameters = idBrainpoolP320r1;
                break;
              case brainpoolP320t1:
                parameters = idBrainpoolP320t1;
                break;
              case brainpoolP384r1:
                parameters = idBrainpoolP384r1;
                break;
              case brainpoolP384t1:
                parameters = idBrainpoolP384t1;
                break;
              case brainpoolP512r1:
                parameters = idBrainpoolP512r1;
                break;
              case brainpoolP512t1:
                parameters = idBrainpoolP512t1;
            }
            if (parameters) return new AlgorithmIdentifier({
              algorithm: id_ecPublicKey,
              parameters: AsnConvert.serialize(new ECParameters({ namedCurve: parameters }))
            });
          }
      }
      return null;
    }
    toWebAlgorithm(alg) {
      switch (alg.algorithm) {
        case id_ecdsaWithSHA1:
          return {
            name: ECDSA,
            hash: { name: "SHA-1" }
          };
        case id_ecdsaWithSHA256:
          return {
            name: ECDSA,
            hash: { name: "SHA-256" }
          };
        case id_ecdsaWithSHA384:
          return {
            name: ECDSA,
            hash: { name: "SHA-384" }
          };
        case id_ecdsaWithSHA512:
          return {
            name: ECDSA,
            hash: { name: "SHA-512" }
          };
        case id_ecPublicKey:
          if (!alg.parameters) throw new TypeError("Cannot get required parameters from EC algorithm");
          switch (AsnConvert.parse(alg.parameters, ECParameters).namedCurve) {
            case id_secp256r1:
              return {
                name: ECDSA,
                namedCurve: "P-256"
              };
            case _EcAlgorithm.SECP256K1:
              return {
                name: ECDSA,
                namedCurve: "K-256"
              };
            case id_secp384r1:
              return {
                name: ECDSA,
                namedCurve: "P-384"
              };
            case id_secp521r1:
              return {
                name: ECDSA,
                namedCurve: "P-521"
              };
            case idBrainpoolP160r1:
              return {
                name: ECDSA,
                namedCurve: brainpoolP160r1
              };
            case idBrainpoolP160t1:
              return {
                name: ECDSA,
                namedCurve: brainpoolP160t1
              };
            case idBrainpoolP192r1:
              return {
                name: ECDSA,
                namedCurve: brainpoolP192r1
              };
            case idBrainpoolP192t1:
              return {
                name: ECDSA,
                namedCurve: brainpoolP192t1
              };
            case idBrainpoolP224r1:
              return {
                name: ECDSA,
                namedCurve: brainpoolP224r1
              };
            case idBrainpoolP224t1:
              return {
                name: ECDSA,
                namedCurve: brainpoolP224t1
              };
            case idBrainpoolP256r1:
              return {
                name: ECDSA,
                namedCurve: brainpoolP256r1
              };
            case idBrainpoolP256t1:
              return {
                name: ECDSA,
                namedCurve: brainpoolP256t1
              };
            case idBrainpoolP320r1:
              return {
                name: ECDSA,
                namedCurve: brainpoolP320r1
              };
            case idBrainpoolP320t1:
              return {
                name: ECDSA,
                namedCurve: brainpoolP320t1
              };
            case idBrainpoolP384r1:
              return {
                name: ECDSA,
                namedCurve: brainpoolP384r1
              };
            case idBrainpoolP384t1:
              return {
                name: ECDSA,
                namedCurve: brainpoolP384t1
              };
            case idBrainpoolP512r1:
              return {
                name: ECDSA,
                namedCurve: brainpoolP512r1
              };
            case idBrainpoolP512t1:
              return {
                name: ECDSA,
                namedCurve: brainpoolP512t1
              };
          }
      }
      return null;
    }
  };
  EcAlgorithm = _EcAlgorithm = __decorate10([injectable_default()], EcAlgorithm);
  instance.registerSingleton(diAlgorithm, EcAlgorithm);
  var NAME = /* @__PURE__ */ Symbol("name");
  var VALUE = /* @__PURE__ */ Symbol("value");
  var TextObject = class {
    static {
      this.NAME = NAME;
    }
    static {
      this.VALUE = VALUE;
    }
    constructor(name, items = {}, value = "") {
      this[NAME] = name;
      this[VALUE] = value;
      for (const key in items) this[key] = items[key];
    }
  };
  var DefaultAlgorithmSerializer = class {
    static toTextObject(alg) {
      const obj = new TextObject("Algorithm Identifier", {}, OidSerializer.toString(alg.algorithm));
      if (alg.parameters) switch (alg.algorithm) {
        case id_ecPublicKey: {
          const ecAlg = new EcAlgorithm().toWebAlgorithm(alg);
          if (ecAlg && "namedCurve" in ecAlg) obj["Named Curve"] = ecAlg.namedCurve;
          else obj["Parameters"] = alg.parameters;
          break;
        }
        default:
          obj["Parameters"] = alg.parameters;
      }
      return obj;
    }
  };
  var OidSerializer = class {
    static {
      this.items = {
        [id_sha1]: "sha1",
        [id_sha224]: "sha224",
        [id_sha256]: "sha256",
        [id_sha384]: "sha384",
        [id_sha512]: "sha512",
        [id_rsaEncryption]: "rsaEncryption",
        [id_sha1WithRSAEncryption]: "sha1WithRSAEncryption",
        [id_sha224WithRSAEncryption]: "sha224WithRSAEncryption",
        [id_sha256WithRSAEncryption]: "sha256WithRSAEncryption",
        [id_sha384WithRSAEncryption]: "sha384WithRSAEncryption",
        [id_sha512WithRSAEncryption]: "sha512WithRSAEncryption",
        [id_ecPublicKey]: "ecPublicKey",
        [id_ecdsaWithSHA1]: "ecdsaWithSHA1",
        [id_ecdsaWithSHA224]: "ecdsaWithSHA224",
        [id_ecdsaWithSHA256]: "ecdsaWithSHA256",
        [id_ecdsaWithSHA384]: "ecdsaWithSHA384",
        [id_ecdsaWithSHA512]: "ecdsaWithSHA512",
        [id_kp_serverAuth]: "TLS WWW server authentication",
        [id_kp_clientAuth]: "TLS WWW client authentication",
        [id_kp_codeSigning]: "Code Signing",
        [id_kp_emailProtection]: "E-mail Protection",
        [id_kp_timeStamping]: "Time Stamping",
        [id_kp_OCSPSigning]: "OCSP Signing",
        [id_signedData]: "Signed Data"
      };
    }
    static toString(oid) {
      const name = this.items[oid];
      if (name) return name;
      return oid;
    }
  };
  var TextConverter = class {
    static {
      this.oidSerializer = OidSerializer;
    }
    static {
      this.algorithmSerializer = DefaultAlgorithmSerializer;
    }
    static serialize(obj) {
      return this.serializeObj(obj).join("\n");
    }
    static pad(deep = 0) {
      return "".padStart(2 * deep, " ");
    }
    static serializeObj(obj, deep = 0) {
      const res = [];
      let pad3 = this.pad(deep++);
      let value = "";
      const objValue = obj[TextObject.VALUE];
      if (objValue) value = ` ${objValue}`;
      res.push(`${pad3}${obj[TextObject.NAME]}:${value}`);
      pad3 = this.pad(deep);
      for (const key in obj) {
        if (typeof key === "symbol") continue;
        const value2 = obj[key];
        const keyValue = key ? `${key}: ` : "";
        if (typeof value2 === "string" || typeof value2 === "number" || typeof value2 === "boolean") res.push(`${pad3}${keyValue}${value2}`);
        else if (value2 instanceof Date) res.push(`${pad3}${keyValue}${value2.toUTCString()}`);
        else if (Array.isArray(value2)) for (const obj2 of value2) {
          obj2[TextObject.NAME] = key;
          res.push(...this.serializeObj(obj2, deep));
        }
        else if (value2 instanceof TextObject) {
          value2[TextObject.NAME] = key;
          res.push(...this.serializeObj(value2, deep));
        } else if (isBufferSource(value2)) {
          if (key) {
            res.push(`${pad3}${keyValue}`);
            res.push(...this.serializeBufferSource(value2, deep + 1));
          } else res.push(...this.serializeBufferSource(value2, deep));
        } else if ("toTextObject" in value2) {
          const obj2 = value2.toTextObject();
          obj2[TextObject.NAME] = key;
          res.push(...this.serializeObj(obj2, deep));
        } else throw new TypeError("Cannot serialize data in text format. Unsupported type.");
      }
      return res;
    }
    static serializeBufferSource(buffer, deep = 0) {
      const pad3 = this.pad(deep);
      const view = toUint8Array(buffer);
      const res = [];
      for (let i = 0; i < view.length; ) {
        const row = [];
        for (let j = 0; j < 16 && i < view.length; j++) {
          if (j === 8) row.push("");
          const hex2 = view[i++].toString(16).padStart(2, "0");
          row.push(hex2);
        }
        res.push(`${pad3}${row.join(" ")}`);
      }
      return res;
    }
    static serializeAlgorithm(alg) {
      return this.algorithmSerializer.toTextObject(alg);
    }
  };
  var AsnData = class AsnData2 {
    static {
      this.NAME = "ASN";
    }
    #rawData;
    #options;
    get parseOptions() {
      return this.#options;
    }
    get rawData() {
      if (!this.#rawData) this.#rawData = AsnConvert.serialize(this.asn);
      return this.#rawData;
    }
    constructor(...args) {
      if (isBufferSource(args[0])) {
        this.#options = args[2];
        this.asn = AsnConvert.parse(args[0], args[1], args[2]);
        assertSingleAsnElement(args[0]);
        this.#rawData = toArrayBuffer(args[0]);
        this.onInit(this.asn);
      } else {
        this.#options = args[1];
        this.asn = args[0];
        this.onInit(this.asn);
      }
    }
    equal(data) {
      if (data instanceof AsnData2) return equal(data.rawData, this.rawData);
      return false;
    }
    toString(format2 = "text") {
      switch (format2) {
        case "asn":
          return AsnConvert.toString(this.rawData, this.#options);
        case "text":
          return TextConverter.serialize(this.toTextObject());
        case "hex":
          return hex_exports.encode(this.rawData);
        case "base64":
          return base64_exports.encode(this.rawData);
        case "base64url":
          return base64url_exports.encode(this.rawData);
        default:
          throw TypeError("Argument 'format' is unsupported value");
      }
    }
    getTextName() {
      return this.constructor.NAME;
    }
    toTextObject() {
      const obj = this.toTextObjectEmpty();
      obj[""] = this.rawData;
      return obj;
    }
    toTextObjectEmpty(value) {
      return new TextObject(this.getTextName(), {}, value);
    }
  };
  var Extension3 = class Extension4 extends AsnData {
    constructor(...args) {
      let raw;
      let options;
      if (isBufferSource(args[0])) {
        raw = toArrayBuffer(args[0]);
        options = args[1];
      } else {
        raw = AsnConvert.serialize(new Extension({
          extnID: args[0],
          critical: args[1],
          extnValue: new OctetString3(toArrayBuffer(args[2]))
        }));
        options = selfProducedParseOptions;
      }
      super(raw, Extension, options);
    }
    onInit(asn) {
      this.type = asn.extnID;
      this.critical = asn.critical;
      this.value = asn.extnValue.buffer;
    }
    toTextObject() {
      const obj = this.toTextObjectWithoutValue();
      obj[""] = this.value;
      return obj;
    }
    toTextObjectWithoutValue() {
      const obj = this.toTextObjectEmpty(this.critical ? "critical" : void 0);
      if (obj[TextObject.NAME] === Extension4.NAME) obj[TextObject.NAME] = OidSerializer.toString(this.type);
      return obj;
    }
  };
  var OID_REGEX = /^[0-2](?:\.[1-9][0-9]*)+$/;
  function isOID(id) {
    return new RegExp(OID_REGEX).test(id);
  }
  var NameIdentifier = class {
    constructor(names2 = {}) {
      this.items = {};
      for (const id in names2) this.register(id, names2[id]);
    }
    get(idOrName) {
      return this.items[idOrName] || null;
    }
    findId(idOrName) {
      if (!isOID(idOrName)) return this.get(idOrName);
      return idOrName;
    }
    register(id, name) {
      this.items[id] = name;
      this.items[name] = id;
    }
  };
  var names = new NameIdentifier();
  names.register("CN", "2.5.4.3");
  names.register("L", "2.5.4.7");
  names.register("ST", "2.5.4.8");
  names.register("O", "2.5.4.10");
  names.register("OU", "2.5.4.11");
  names.register("C", "2.5.4.6");
  names.register("DC", "0.9.2342.19200300.100.1.25");
  names.register("E", "1.2.840.113549.1.9.1");
  names.register("G", "2.5.4.42");
  names.register("I", "2.5.4.43");
  names.register("SN", "2.5.4.4");
  names.register("T", "2.5.4.12");
  function replaceUnknownCharacter(text, char) {
    return `\\${hex_exports.encode(utf8_exports.encode(char)).toUpperCase()}`;
  }
  function escape(data) {
    return data.replace(/([,+"\\<>;])/g, "\\$1").replace(/^([ #])/, "\\$1").replace(/([ ]$)/, "\\$1").replace(/([\r\n\t])/, replaceUnknownCharacter);
  }
  var Name3 = class Name4 {
    static isASCII(text) {
      for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) > 255) return false;
      return true;
    }
    static isPrintableString(text) {
      return /^[A-Za-z0-9 '()+,-./:=?]*$/g.test(text);
    }
    constructor(data, extraNames = {}) {
      this.extraNames = new NameIdentifier();
      this.asn = new Name();
      for (const key in extraNames) if (Object.prototype.hasOwnProperty.call(extraNames, key)) {
        const value = extraNames[key];
        this.extraNames.register(key, value);
      }
      if (typeof data === "string") this.asn = this.fromString(data);
      else if (data instanceof Name) this.asn = data;
      else if (isBufferSource(data)) this.asn = AsnConvert.parse(data, Name);
      else this.asn = this.fromJSON(data);
    }
    getField(idOrName) {
      const id = this.extraNames.findId(idOrName) || names.findId(idOrName);
      const res = [];
      for (const name of this.asn) for (const rdn of name) if (rdn.type === id) res.push(rdn.value.toString());
      return res;
    }
    getName(idOrName) {
      return this.extraNames.get(idOrName) || names.get(idOrName);
    }
    toString() {
      return this.asn.map((rdn) => rdn.map((o) => {
        return `${this.getName(o.type) || o.type}=${o.value.anyValue ? `#${hex_exports.encode(o.value.anyValue)}` : escape(o.value.toString())}`;
      }).join("+")).join(", ");
    }
    toJSON() {
      const json = [];
      for (const rdn of this.asn) {
        const jsonItem = {};
        for (const attr of rdn) {
          const type = this.getName(attr.type) || attr.type;
          jsonItem[type] ??= [];
          jsonItem[type].push(attr.value.anyValue ? `#${hex_exports.encode(attr.value.anyValue)}` : attr.value.toString());
        }
        json.push(jsonItem);
      }
      return json;
    }
    fromString(data) {
      const asn = new Name();
      const regex = /(\d\.[\d.]*\d|[A-Za-z]+)=((?:"")|(?:".*?[^\\]")|(?:[^,+"\\](?=[,+]|$))|(?:[^,+].*?(?:[^\\][,+]))|(?:))([,+])?/g;
      let matches = null;
      let level = ",";
      while (matches = regex.exec(`${data},`)) {
        let [, type, value] = matches;
        const lastChar = value[value.length - 1];
        if (lastChar === "," || lastChar === "+") {
          value = value.slice(0, value.length - 1);
          matches[3] = lastChar;
        }
        const next = matches[3];
        type = this.getTypeOid(type);
        const attr = this.createAttribute(type, value);
        if (level === "+") asn[asn.length - 1].push(attr);
        else asn.push(new RelativeDistinguishedName([attr]));
        level = next;
      }
      return asn;
    }
    fromJSON(data) {
      const asn = new Name();
      for (const item of data) {
        const asnRdn = new RelativeDistinguishedName();
        for (const type in item) {
          const typeId = this.getTypeOid(type);
          const values = item[type];
          for (const value of values) {
            const asnAttr = this.createAttribute(typeId, value);
            asnRdn.push(asnAttr);
          }
        }
        asn.push(asnRdn);
      }
      return asn;
    }
    getTypeOid(type) {
      if (!/[\d.]+/.test(type)) type = this.getName(type) || "";
      if (!type) throw new Error(`Cannot get OID for name type '${type}'`);
      return type;
    }
    createAttribute(type, value) {
      const attr = new AttributeTypeAndValue({ type });
      if (typeof value === "object") for (const key in value) switch (key) {
        case "ia5String":
          attr.value.ia5String = value[key];
          break;
        case "utf8String":
          attr.value.utf8String = value[key];
          break;
        case "universalString":
          attr.value.universalString = value[key];
          break;
        case "bmpString":
          attr.value.bmpString = value[key];
          break;
        case "printableString":
          attr.value.printableString = value[key];
      }
      else if (value[0] === "#") attr.value.anyValue = toArrayBuffer(hex_exports.decode(value.slice(1), hexOptions));
      else {
        const processedValue = this.processStringValue(value);
        if (type === this.getName("E") || type === this.getName("DC")) attr.value.ia5String = processedValue;
        else if (Name4.isPrintableString(processedValue)) attr.value.printableString = processedValue;
        else attr.value.utf8String = processedValue;
      }
      return attr;
    }
    processStringValue(value) {
      const quotedMatches = /"(.*?[^\\])?"/.exec(value);
      if (quotedMatches) value = quotedMatches[1];
      return value.replace(/\\0a/gi, "\n").replace(/\\0d/gi, "\r").replace(/\\0g/gi, "	").replace(/\\(.)/g, "$1");
    }
    toArrayBuffer() {
      return AsnConvert.serialize(this.asn);
    }
    async getThumbprint(arg1, arg2) {
      let crypto2;
      let algorithm = "SHA-1";
      if (arg1) {
        if (typeof arg1 === "object" && "subtle" in arg1) crypto2 = arg1;
        else {
          algorithm = arg1;
          crypto2 = arg2;
        }
      }
      crypto2 ??= cryptoProvider.get();
      return await crypto2.subtle.digest(algorithm, this.toArrayBuffer());
    }
  };
  var ERR_GN_CONSTRUCTOR = "Cannot initialize GeneralName from ASN.1 data.";
  var ERR_GN_STRING_FORMAT = `${ERR_GN_CONSTRUCTOR} Unsupported string format in use.`;
  var ERR_GUID = `${ERR_GN_CONSTRUCTOR} Value doesn't match to GUID regular expression.`;
  var GUID_REGEX = /^([0-9a-f]{8})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{12})$/i;
  var id_GUID = "1.3.6.1.4.1.311.25.1";
  var id_UPN = "1.3.6.1.4.1.311.20.2.3";
  var EMAIL = "email";
  var GUID = "guid";
  var GeneralName3 = class extends AsnData {
    constructor(...args) {
      let name;
      let options;
      if (isBufferSource(args[0])) {
        options = args[1];
        name = AsnConvert.parse(args[0], GeneralName, options);
      } else if (typeof args[0] === "string") {
        options = selfProducedParseOptions;
        switch (args[0]) {
          case "dn": {
            const derName = new Name3(args[1]).toArrayBuffer();
            const asnName = AsnConvert.parse(derName, Name, selfProducedParseOptions);
            name = new GeneralName({ directoryName: asnName });
            break;
          }
          case "dns":
            name = new GeneralName({ dNSName: args[1] });
            break;
          case EMAIL:
            name = new GeneralName({ rfc822Name: args[1] });
            break;
          case GUID: {
            const matches = new RegExp(GUID_REGEX, "i").exec(args[1]);
            if (!matches) throw new Error("Cannot parse GUID value. Value doesn't match to regular expression");
            const guidHex = matches.slice(1).map((o, i) => {
              if (i < 3) return hex_exports.encode(new Uint8Array(hex_exports.decode(o, hexOptions)).reverse());
              return o;
            }).join("");
            name = new GeneralName({ otherName: new OtherName({
              typeId: id_GUID,
              value: AsnConvert.serialize(new OctetString3(hex_exports.decode(guidHex, hexOptions)))
            }) });
            break;
          }
          case "ip":
            name = new GeneralName({ iPAddress: args[1] });
            break;
          case "id":
            name = new GeneralName({ registeredID: args[1] });
            break;
          case "upn":
            name = new GeneralName({ otherName: new OtherName({
              typeId: id_UPN,
              value: AsnConvert.serialize(AsnUtf8StringConverter.toASN(args[1]))
            }) });
            break;
          case "url":
            name = new GeneralName({ uniformResourceIdentifier: args[1] });
            break;
          default:
            throw new Error("Cannot create GeneralName. Unsupported type of the name");
        }
      } else {
        name = args[0];
        options = args[1] ?? selfProducedParseOptions;
      }
      super(name, options);
    }
    onInit(asn) {
      if (asn.dNSName != void 0) {
        this.type = "dns";
        this.value = asn.dNSName;
      } else if (asn.rfc822Name != void 0) {
        this.type = EMAIL;
        this.value = asn.rfc822Name;
      } else if (asn.iPAddress != void 0) {
        this.type = "ip";
        this.value = asn.iPAddress;
      } else if (asn.uniformResourceIdentifier != void 0) {
        this.type = "url";
        this.value = asn.uniformResourceIdentifier;
      } else if (asn.registeredID != void 0) {
        this.type = "id";
        this.value = asn.registeredID;
      } else if (asn.directoryName != void 0) {
        this.type = "dn";
        this.value = new Name3(asn.directoryName).toString();
      } else if (asn.otherName != void 0) {
        if (asn.otherName.typeId === id_GUID) {
          this.type = GUID;
          const guid = AsnConvert.parse(asn.otherName.value, OctetString3, this.parseOptions);
          const matches = new RegExp(GUID_REGEX, "i").exec(hex_exports.encode(guid));
          if (!matches) throw new Error(ERR_GUID);
          this.value = matches.slice(1).map((o, i) => {
            if (i < 3) return hex_exports.encode(new Uint8Array(hex_exports.decode(o, hexOptions)).reverse());
            return o;
          }).join("-");
        } else if (asn.otherName.typeId === id_UPN) {
          this.type = "upn";
          this.value = AsnConvert.parse(asn.otherName.value, DirectoryString, this.parseOptions).toString();
        } else throw new Error(ERR_GN_STRING_FORMAT);
      } else throw new Error(ERR_GN_STRING_FORMAT);
    }
    toJSON() {
      return {
        type: this.type,
        value: this.value
      };
    }
    toTextObject() {
      let type;
      switch (this.type) {
        case "dn":
        case "dns":
        case GUID:
        case "ip":
        case "id":
        case "upn":
        case "url":
          type = this.type.toUpperCase();
          break;
        case EMAIL:
          type = "Email";
          break;
        default:
          throw new Error("Unsupported GeneralName type");
      }
      let value = this.value;
      if (this.type === "id") value = OidSerializer.toString(value);
      return new TextObject(type, void 0, value);
    }
  };
  var GeneralNames3 = class extends AsnData {
    static {
      this.NAME = "GeneralNames";
    }
    constructor(params, options) {
      let names2;
      let stored = selfProducedParseOptions;
      if (params instanceof GeneralNames) names2 = params;
      else if (Array.isArray(params)) {
        const items = [];
        for (const name of params) if (name instanceof GeneralName) items.push(name);
        else {
          const asnName = AsnConvert.parse(new GeneralName3(name.type, name.value).rawData, GeneralName, selfProducedParseOptions);
          items.push(asnName);
        }
        names2 = new GeneralNames(items);
      } else if (isBufferSource(params)) {
        names2 = AsnConvert.parse(params, GeneralNames, options);
        stored = options ?? {};
      } else throw new Error("Cannot initialize GeneralNames. Incorrect incoming arguments");
      super(names2, stored);
    }
    onInit(asn) {
      const items = [];
      for (const asnName of asn) {
        let name = null;
        try {
          name = new GeneralName3(asnName, this.parseOptions);
        } catch {
          continue;
        }
        items.push(name);
      }
      this.items = items;
    }
    toJSON() {
      return this.items.map((o) => o.toJSON());
    }
    toTextObject() {
      const res = super.toTextObjectEmpty();
      for (const name of this.items) {
        const nameObj = name.toTextObject();
        let field = res[nameObj[TextObject.NAME]];
        if (!Array.isArray(field)) {
          field = [];
          res[nameObj[TextObject.NAME]] = field;
        }
        field.push(nameObj);
      }
      return res;
    }
  };
  var rPaddingTag = "-{5}";
  var rEolChars = "\\n";
  var rBeginTag = `${rPaddingTag}BEGIN (${`[^${rEolChars}]+`}(?=${rPaddingTag}))${rPaddingTag}`;
  var rEndTag = `${rPaddingTag}END \\1${rPaddingTag}`;
  var rEolGroup = "\\n";
  var rPem = `${rBeginTag}${rEolGroup}(?:((?:${`[^:${rEolChars}]+`}: ${`(?:[^${rEolChars}]+${rEolGroup}(?: +[^${rEolChars}]+${rEolGroup})*)`})+))?${rEolGroup}?(${`(?:[a-zA-Z0-9=+/]+${rEolGroup})+`})${rEndTag}`;
  var rEolPattern = new RegExp(`[${rEolChars}]+`, "g");
  var PemConverter = class {
    static {
      this.CertificateTag = "CERTIFICATE";
    }
    static {
      this.CrlTag = "CRL";
    }
    static {
      this.CertificateRequestTag = "CERTIFICATE REQUEST";
    }
    static {
      this.PublicKeyTag = "PUBLIC KEY";
    }
    static {
      this.PrivateKeyTag = "PRIVATE KEY";
    }
    static isPem(data) {
      return typeof data === "string" && new RegExp(rPem, "g").test(data.replace(/\r/g, ""));
    }
    static decodeWithHeaders(pem) {
      pem = pem.replace(/\r/g, "");
      const pattern = new RegExp(rPem, "g");
      const res = [];
      let matches = null;
      while (matches = pattern.exec(pem)) {
        const base64Text = matches[3].replace(rEolPattern, "");
        const pemStruct = {
          type: matches[1],
          headers: [],
          rawData: toArrayBuffer(base64_exports.decode(base64Text))
        };
        const headersString = matches[2];
        if (headersString) {
          const headers = headersString.split(new RegExp(rEolGroup, "g"));
          let lastHeader = null;
          for (const header of headers) {
            const [key, value] = header.split(/:(.*)/);
            if (value === void 0) {
              if (!lastHeader) throw new Error("Cannot parse PEM string. Incorrect header value");
              lastHeader.value += key.trim();
            } else {
              if (lastHeader) pemStruct.headers.push(lastHeader);
              lastHeader = {
                key,
                value: value.trim()
              };
            }
          }
          if (lastHeader) pemStruct.headers.push(lastHeader);
        }
        res.push(pemStruct);
      }
      return res;
    }
    static decode(pem) {
      return this.decodeWithHeaders(pem).map((o) => o.rawData);
    }
    static decodeFirst(pem) {
      const items = this.decode(pem);
      if (!items.length) throw new RangeError("PEM string doesn't contain any objects");
      return items[0];
    }
    static encode(rawData, tag) {
      if (Array.isArray(rawData)) {
        const raws = new Array();
        if (tag) rawData.forEach((element) => {
          if (!isBufferSource(element)) throw new TypeError("Cannot encode array of BufferSource in PEM format. Not all items of the array are BufferSource");
          raws.push(this.encodeStruct({
            type: tag,
            rawData: toArrayBuffer(element)
          }));
        });
        else rawData.forEach((element) => {
          if (!("type" in element)) throw new TypeError("Cannot encode array of PemStruct in PEM format. Not all items of the array are PemStrut");
          raws.push(this.encodeStruct(element));
        });
        return raws.join("\n");
      } else {
        if (!tag) throw new Error("Required argument 'tag' is missed");
        return this.encodeStruct({
          type: tag,
          rawData: toArrayBuffer(rawData)
        });
      }
    }
    static encodeStruct(pem) {
      const upperCaseType = pem.type.toLocaleUpperCase();
      const res = [];
      res.push(`-----BEGIN ${upperCaseType}-----`);
      if (pem.headers?.length) {
        for (const header of pem.headers) res.push(`${header.key}: ${header.value}`);
        res.push("");
      }
      const base64Text = base64_exports.encode(pem.rawData);
      for (let i = 0; i < base64Text.length; i += 64) res.push(base64Text.substring(i, i + 64));
      res.push(`-----END ${upperCaseType}-----`);
      return res.join("\n");
    }
  };
  var PemData = class PemData2 extends AsnData {
    static isAsnEncoded(data) {
      return isBufferSource(data) || typeof data === "string";
    }
    static toArrayBuffer(raw) {
      if (typeof raw === "string") {
        if (PemConverter.isPem(raw)) return PemConverter.decode(raw)[0];
        else if (hex_exports.is(raw, hexOptions)) return toArrayBuffer(hex_exports.decode(raw, hexOptions));
        else if (base64_exports.is(raw)) return toArrayBuffer(base64_exports.decode(raw));
        else if (base64url_exports.is(raw)) return toArrayBuffer(base64url_exports.decode(raw));
        else throw new TypeError("Unsupported format of 'raw' argument. Must be one of DER, PEM, HEX, Base64, or Base4Url");
      } else {
        const buffer = toUint8Array(raw);
        if (buffer.length > 0 && buffer[0] === 48) return toArrayBuffer(raw);
        const stringRaw = binary_exports.encode(raw);
        if (PemConverter.isPem(stringRaw)) return PemConverter.decode(stringRaw)[0];
        else if (hex_exports.is(stringRaw, hexOptions)) return toArrayBuffer(hex_exports.decode(stringRaw, hexOptions));
        else if (base64_exports.is(stringRaw)) return toArrayBuffer(base64_exports.decode(stringRaw));
        else if (base64url_exports.is(stringRaw)) return toArrayBuffer(base64url_exports.decode(stringRaw));
        throw new TypeError("Unsupported format of 'raw' argument. Must be one of DER, PEM, HEX, Base64, or Base4Url");
      }
    }
    constructor(...args) {
      if (PemData2.isAsnEncoded(args[0])) super(PemData2.toArrayBuffer(args[0]), args[1], args[2]);
      else super(args[0], args[1]);
    }
    toString(format2 = "pem") {
      switch (format2) {
        case "pem":
          return PemConverter.encode(this.rawData, this.tag);
        default:
          return super.toString(format2);
      }
    }
  };
  var PublicKey = class PublicKey2 extends PemData {
    static async create(data, crypto2 = cryptoProvider.get()) {
      if (data instanceof PublicKey2) return data;
      else if (CryptoProvider.isCryptoKey(data)) {
        if (data.type !== "public") throw new TypeError("Public key is required");
        const spki = await crypto2.subtle.exportKey("spki", data);
        return new PublicKey2(spki);
      } else if (data.publicKey) return data.publicKey;
      else if (isBufferSource(data)) return new PublicKey2(data);
      else throw new TypeError("Unsupported PublicKeyType");
    }
    constructor(param, options) {
      if (PemData.isAsnEncoded(param)) super(param, SubjectPublicKeyInfo, options);
      else super(param, options);
      this.tag = PemConverter.PublicKeyTag;
    }
    async export(arg1, arg2, arg3) {
      let crypto2;
      let keyUsages = ["verify"];
      let algorithm = {
        hash: "SHA-256",
        ...this.algorithm
      };
      if (arg2) {
        algorithm = arg1;
        keyUsages = arg2;
        crypto2 = arg3;
      } else crypto2 = arg1;
      crypto2 ??= cryptoProvider.get();
      let raw = this.rawData;
      const asnSpki = AsnConvert.parse(this.rawData, SubjectPublicKeyInfo, this.parseOptions);
      if (asnSpki.algorithm.algorithm === id_RSASSA_PSS) raw = convertSpkiToRsaPkcs1(asnSpki, raw);
      return crypto2.subtle.importKey("spki", raw, algorithm, true, keyUsages);
    }
    onInit(asn) {
      const algProv = instance.resolve(diAlgorithmProvider);
      const algorithm = this.algorithm = algProv.toWebAlgorithm(asn.algorithm);
      switch (asn.algorithm.algorithm) {
        case id_rsaEncryption: {
          const rsaPublicKey = AsnConvert.parse(asn.subjectPublicKey, RSAPublicKey, this.parseOptions);
          const modulus = toUint8Array(rsaPublicKey.modulus);
          algorithm.publicExponent = toUint8Array(rsaPublicKey.publicExponent);
          algorithm.modulusLength = (!modulus[0] ? modulus.slice(1) : modulus).byteLength << 3;
          break;
        }
      }
    }
    async getThumbprint(arg1, arg2) {
      let crypto2;
      let algorithm = "SHA-1";
      if (arg1) {
        if (typeof arg1 === "object" && "subtle" in arg1) crypto2 = arg1;
        else {
          algorithm = arg1;
          crypto2 = arg2;
        }
      }
      crypto2 ??= cryptoProvider.get();
      return await crypto2.subtle.digest(algorithm, this.rawData);
    }
    async getKeyIdentifier(arg1, arg2) {
      let crypto2;
      let algorithm = "SHA-1";
      if (arg1) {
        if (typeof arg1 === "object" && "subtle" in arg1) crypto2 = arg1;
        else {
          algorithm = arg1;
          crypto2 = arg2;
        }
      }
      crypto2 ??= cryptoProvider.get();
      const asn = AsnConvert.parse(this.rawData, SubjectPublicKeyInfo, this.parseOptions);
      return await crypto2.subtle.digest(algorithm, asn.subjectPublicKey);
    }
    toTextObject() {
      const obj = this.toTextObjectEmpty();
      const asn = AsnConvert.parse(this.rawData, SubjectPublicKeyInfo, this.parseOptions);
      obj["Algorithm"] = TextConverter.serializeAlgorithm(asn.algorithm);
      switch (asn.algorithm.algorithm) {
        case id_ecPublicKey:
          obj["EC Point"] = asn.subjectPublicKey;
          break;
        case id_rsaEncryption:
        default:
          obj["Raw Data"] = asn.subjectPublicKey;
      }
      return obj;
    }
  };
  function convertSpkiToRsaPkcs1(asnSpki, raw) {
    asnSpki.algorithm = new AlgorithmIdentifier({
      algorithm: id_rsaEncryption,
      parameters: null
    });
    raw = AsnConvert.serialize(asnSpki);
    return raw;
  }
  var AuthorityKeyIdentifierExtension = class AuthorityKeyIdentifierExtension2 extends Extension3 {
    static {
      this.NAME = "Authority Key Identifier";
    }
    static async create(param, critical = false, crypto2 = cryptoProvider.get()) {
      if ("name" in param && "serialNumber" in param) return new AuthorityKeyIdentifierExtension2(param, critical);
      const id = await (await PublicKey.create(param, crypto2)).getKeyIdentifier(crypto2);
      return new AuthorityKeyIdentifierExtension2(hex_exports.encode(id), critical);
    }
    constructor(...args) {
      if (isBufferSource(args[0])) super(args[0], args[1]);
      else if (typeof args[0] === "string") {
        const value = new AuthorityKeyIdentifier({ keyIdentifier: new KeyIdentifier(hex_exports.decode(args[0], hexOptions)) });
        super(id_ce_authorityKeyIdentifier, args[1], AsnConvert.serialize(value));
      } else {
        const certId = args[0];
        const certIdName = certId.name instanceof GeneralNames3 ? AsnConvert.parse(certId.name.rawData, GeneralNames, selfProducedParseOptions) : certId.name;
        const value = new AuthorityKeyIdentifier({
          authorityCertIssuer: certIdName,
          authorityCertSerialNumber: toArrayBuffer(hex_exports.decode(certId.serialNumber, hexOptions))
        });
        super(id_ce_authorityKeyIdentifier, args[1], AsnConvert.serialize(value));
      }
    }
    onInit(asn) {
      super.onInit(asn);
      const aki = AsnConvert.parse(asn.extnValue, AuthorityKeyIdentifier, this.parseOptions);
      if (aki.keyIdentifier) this.keyId = hex_exports.encode(aki.keyIdentifier);
      if (aki.authorityCertIssuer || aki.authorityCertSerialNumber) this.certId = {
        name: aki.authorityCertIssuer || [],
        serialNumber: aki.authorityCertSerialNumber ? hex_exports.encode(aki.authorityCertSerialNumber) : ""
      };
    }
    toTextObject() {
      const obj = this.toTextObjectWithoutValue();
      const asn = AsnConvert.parse(this.value, AuthorityKeyIdentifier, this.parseOptions);
      if (asn.authorityCertIssuer) obj["Authority Issuer"] = new GeneralNames3(asn.authorityCertIssuer).toTextObject();
      if (asn.authorityCertSerialNumber) obj["Authority Serial Number"] = asn.authorityCertSerialNumber;
      if (asn.keyIdentifier) obj[""] = asn.keyIdentifier;
      return obj;
    }
  };
  var BasicConstraintsExtension = class extends Extension3 {
    static {
      this.NAME = "Basic Constraints";
    }
    constructor(...args) {
      if (isBufferSource(args[0])) {
        super(args[0], args[1]);
        const value = AsnConvert.parse(this.value, BasicConstraints, this.parseOptions);
        this.ca = value.cA;
        this.pathLength = value.pathLenConstraint;
      } else {
        const value = new BasicConstraints({
          cA: args[0],
          pathLenConstraint: args[1]
        });
        super(id_ce_basicConstraints, args[2], AsnConvert.serialize(value));
        this.ca = args[0];
        this.pathLength = args[1];
      }
    }
    toTextObject() {
      const obj = this.toTextObjectWithoutValue();
      if (this.ca) obj["CA"] = this.ca;
      if (this.pathLength !== void 0) obj["Path Length"] = this.pathLength;
      return obj;
    }
  };
  var ExtendedKeyUsageExtension = class extends Extension3 {
    static {
      this.NAME = "Extended Key Usages";
    }
    constructor(...args) {
      if (isBufferSource(args[0])) {
        super(args[0], args[1]);
        const value = AsnConvert.parse(this.value, ExtendedKeyUsage, this.parseOptions);
        this.usages = value.map((o) => o);
      } else {
        const value = new ExtendedKeyUsage(args[0]);
        super(id_ce_extKeyUsage, args[1], AsnConvert.serialize(value));
        this.usages = args[0];
      }
    }
    toTextObject() {
      const obj = this.toTextObjectWithoutValue();
      obj[""] = this.usages.map((o) => OidSerializer.toString(o)).join(", ");
      return obj;
    }
  };
  var KeyUsagesExtension = class extends Extension3 {
    static {
      this.NAME = "Key Usages";
    }
    constructor(...args) {
      if (isBufferSource(args[0])) {
        super(args[0], args[1]);
        const value = AsnConvert.parse(this.value, KeyUsage, this.parseOptions);
        this.usages = value.toNumber();
      } else {
        const value = new KeyUsage(args[0]);
        super(id_ce_keyUsage, args[1], AsnConvert.serialize(value));
        this.usages = args[0];
      }
    }
    toTextObject() {
      const obj = this.toTextObjectWithoutValue();
      obj[""] = AsnConvert.parse(this.value, KeyUsage, this.parseOptions).toJSON().join(", ");
      return obj;
    }
  };
  var SubjectKeyIdentifierExtension = class SubjectKeyIdentifierExtension2 extends Extension3 {
    static {
      this.NAME = "Subject Key Identifier";
    }
    static async create(publicKey, critical = false, crypto2 = cryptoProvider.get()) {
      const id = await (await PublicKey.create(publicKey, crypto2)).getKeyIdentifier(crypto2);
      return new SubjectKeyIdentifierExtension2(hex_exports.encode(id), critical);
    }
    constructor(...args) {
      if (isBufferSource(args[0])) {
        super(args[0], args[1]);
        const value = AsnConvert.parse(this.value, SubjectKeyIdentifier, this.parseOptions);
        this.keyId = hex_exports.encode(value);
      } else {
        const identifier = typeof args[0] === "string" ? hex_exports.decode(args[0], hexOptions) : args[0];
        const value = new SubjectKeyIdentifier(identifier);
        super(id_ce_subjectKeyIdentifier, args[1], AsnConvert.serialize(value));
        this.keyId = hex_exports.encode(identifier);
      }
    }
    toTextObject() {
      const obj = this.toTextObjectWithoutValue();
      obj[""] = AsnConvert.parse(this.value, SubjectKeyIdentifier, this.parseOptions);
      return obj;
    }
  };
  var SubjectAlternativeNameExtension = class extends Extension3 {
    static {
      this.NAME = "Subject Alternative Name";
    }
    constructor(...args) {
      if (isBufferSource(args[0])) super(args[0], args[1]);
      else super(id_ce_subjectAltName, args[1], new GeneralNames3(args[0] || []).rawData);
    }
    onInit(asn) {
      super.onInit(asn);
      const value = AsnConvert.parse(asn.extnValue, SubjectAlternativeName, this.parseOptions);
      this.names = new GeneralNames3(value);
    }
    toTextObject() {
      const obj = this.toTextObjectWithoutValue();
      const namesObj = this.names.toTextObject();
      for (const key in namesObj) obj[key] = namesObj[key];
      return obj;
    }
  };
  var ExtensionFactory = class {
    static {
      this.items = /* @__PURE__ */ new Map();
    }
    static register(id, type) {
      this.items.set(id, type);
    }
    static create(data, options) {
      const extension = new Extension3(data, options);
      const Type = this.items.get(extension.type);
      if (Type) return new Type(data, options);
      return extension;
    }
  };
  var CertificatePolicyExtension = class extends Extension3 {
    static {
      this.NAME = "Certificate Policies";
    }
    constructor(...args) {
      if (isBufferSource(args[0])) {
        super(args[0], args[1]);
        const asnPolicies = AsnConvert.parse(this.value, CertificatePolicies, this.parseOptions);
        this.policies = asnPolicies.map((o) => o.policyIdentifier);
      } else {
        const policies = args[0];
        const critical = args[1] ?? false;
        const value = new CertificatePolicies(policies.map((o) => new PolicyInformation({ policyIdentifier: o })));
        super(id_ce_certificatePolicies, critical, AsnConvert.serialize(value));
        this.policies = policies;
      }
    }
    toTextObject() {
      const obj = this.toTextObjectWithoutValue();
      obj["Policy"] = this.policies.map((o) => new TextObject("", {}, OidSerializer.toString(o)));
      return obj;
    }
  };
  ExtensionFactory.register(id_ce_certificatePolicies, CertificatePolicyExtension);
  var CRLDistributionPointsExtension = class extends Extension3 {
    static {
      this.NAME = "CRL Distribution Points";
    }
    constructor(...args) {
      if (isBufferSource(args[0])) super(args[0], args[1]);
      else if (Array.isArray(args[0]) && typeof args[0][0] === "string") {
        const dps = args[0].map((url) => {
          return new DistributionPoint({ distributionPoint: new DistributionPointName({ fullName: [new GeneralName({ uniformResourceIdentifier: url })] }) });
        });
        const value = new CRLDistributionPoints(dps);
        super(id_ce_cRLDistributionPoints, args[1], AsnConvert.serialize(value));
      } else {
        const value = new CRLDistributionPoints(args[0]);
        super(id_ce_cRLDistributionPoints, args[1], AsnConvert.serialize(value));
      }
      this.distributionPoints ??= [];
    }
    onInit(asn) {
      super.onInit(asn);
      const crlExt = AsnConvert.parse(asn.extnValue, CRLDistributionPoints, this.parseOptions);
      this.distributionPoints = crlExt;
    }
    toTextObject() {
      const obj = this.toTextObjectWithoutValue();
      obj["Distribution Point"] = this.distributionPoints.map((dp) => {
        const dpObj = new TextObject("");
        if (dp.distributionPoint?.fullName) dpObj[""] = dp.distributionPoint.fullName.map((name) => new GeneralName3(name).toString()).join(", ");
        if (dp.reasons) dpObj["Reasons"] = dp.reasons.toString();
        if (dp.cRLIssuer) dpObj["CRL Issuer"] = dp.cRLIssuer.map((issuer) => issuer.toString()).join(", ");
        return dpObj;
      });
      return obj;
    }
  };
  var AuthorityInfoAccessExtension = class extends Extension3 {
    static {
      this.NAME = "Authority Info Access";
    }
    constructor(...args) {
      if (isBufferSource(args[0])) super(args[0], args[1]);
      else if (args[0] instanceof AuthorityInfoAccessSyntax) {
        const value = new AuthorityInfoAccessSyntax(args[0]);
        super(id_pe_authorityInfoAccess, args[1], AsnConvert.serialize(value));
      } else {
        const params = args[0];
        const value = new AuthorityInfoAccessSyntax();
        addAccessDescriptions(value, params, id_ad_ocsp, "ocsp");
        addAccessDescriptions(value, params, id_ad_caIssuers, "caIssuers");
        addAccessDescriptions(value, params, id_ad_timeStamping, "timeStamping");
        addAccessDescriptions(value, params, id_ad_caRepository, "caRepository");
        super(id_pe_authorityInfoAccess, args[1], AsnConvert.serialize(value));
      }
      this.ocsp ??= [];
      this.caIssuers ??= [];
      this.timeStamping ??= [];
      this.caRepository ??= [];
    }
    onInit(asn) {
      super.onInit(asn);
      this.ocsp = [];
      this.caIssuers = [];
      this.timeStamping = [];
      this.caRepository = [];
      AsnConvert.parse(asn.extnValue, AuthorityInfoAccessSyntax, this.parseOptions).forEach((accessDescription) => {
        switch (accessDescription.accessMethod) {
          case id_ad_ocsp:
            this.ocsp.push(new GeneralName3(accessDescription.accessLocation));
            break;
          case id_ad_caIssuers:
            this.caIssuers.push(new GeneralName3(accessDescription.accessLocation));
            break;
          case id_ad_timeStamping:
            this.timeStamping.push(new GeneralName3(accessDescription.accessLocation));
            break;
          case id_ad_caRepository:
            this.caRepository.push(new GeneralName3(accessDescription.accessLocation));
        }
      });
    }
    toTextObject() {
      const obj = this.toTextObjectWithoutValue();
      if (this.ocsp.length) addUrlsToObject(obj, "OCSP", this.ocsp);
      if (this.caIssuers.length) addUrlsToObject(obj, "CA Issuers", this.caIssuers);
      if (this.timeStamping.length) addUrlsToObject(obj, "Time Stamping", this.timeStamping);
      if (this.caRepository.length) addUrlsToObject(obj, "CA Repository", this.caRepository);
      return obj;
    }
  };
  function addUrlsToObject(obj, key, urls) {
    if (urls.length === 1) obj[key] = urls[0].toTextObject();
    else {
      const names2 = new TextObject("");
      urls.forEach((name, index) => {
        const nameObj = name.toTextObject();
        const indexedKey = `${nameObj[TextObject.NAME]} ${index + 1}`;
        let field = names2[indexedKey];
        if (!Array.isArray(field)) {
          field = [];
          names2[indexedKey] = field;
        }
        field.push(nameObj);
      });
      obj[key] = names2;
    }
  }
  function addAccessDescriptions(value, params, method, key) {
    const items = params[key];
    if (items) (Array.isArray(items) ? items : [items]).forEach((url) => {
      if (typeof url === "string") url = new GeneralName3("url", url);
      value.push(new AccessDescription({
        accessMethod: method,
        accessLocation: AsnConvert.parse(url.rawData, GeneralName, selfProducedParseOptions)
      }));
    });
  }
  var IssuerAlternativeNameExtension = class extends Extension3 {
    static {
      this.NAME = "Issuer Alternative Name";
    }
    constructor(...args) {
      if (isBufferSource(args[0])) super(args[0], args[1]);
      else super(id_ce_issuerAltName, args[1], new GeneralNames3(args[0] || []).rawData);
    }
    onInit(asn) {
      super.onInit(asn);
      const value = AsnConvert.parse(asn.extnValue, GeneralNames, this.parseOptions);
      this.names = new GeneralNames3(value);
    }
    toTextObject() {
      const obj = this.toTextObjectWithoutValue();
      const namesObj = this.names.toTextObject();
      for (const key in namesObj) obj[key] = namesObj[key];
      return obj;
    }
  };
  var Attribute3 = class Attribute4 extends AsnData {
    static {
      this.NAME = "Attribute";
    }
    constructor(...args) {
      let raw;
      let options;
      if (isBufferSource(args[0])) {
        raw = toArrayBuffer(args[0]);
        options = args[1];
      } else {
        const type = args[0];
        const values = Array.isArray(args[1]) ? args[1].map((o) => toArrayBuffer(o)) : [];
        raw = AsnConvert.serialize(new Attribute({
          type,
          values
        }));
        options = selfProducedParseOptions;
      }
      super(raw, Attribute, options);
    }
    onInit(asn) {
      this.type = asn.type;
      this.values = asn.values;
    }
    toTextObject() {
      const obj = this.toTextObjectWithoutValue();
      obj["Value"] = this.values.map((o) => new TextObject("", { "": o }));
      return obj;
    }
    toTextObjectWithoutValue() {
      const obj = this.toTextObjectEmpty();
      if (obj[TextObject.NAME] === Attribute4.NAME) obj[TextObject.NAME] = OidSerializer.toString(this.type);
      return obj;
    }
  };
  var ChallengePasswordAttribute = class extends Attribute3 {
    static {
      this.NAME = "Challenge Password";
    }
    constructor(...args) {
      if (isBufferSource(args[0])) super(args[0], args[1]);
      else {
        const value = new ChallengePassword({ printableString: args[0] });
        super(id_pkcs9_at_challengePassword, [AsnConvert.serialize(value)]);
      }
      this.password ??= "";
    }
    onInit(asn) {
      super.onInit(asn);
      if (this.values[0]) {
        const value = AsnConvert.parse(this.values[0], ChallengePassword, this.parseOptions);
        this.password = value.toString();
      }
    }
    toTextObject() {
      const obj = this.toTextObjectWithoutValue();
      obj[TextObject.VALUE] = this.password;
      return obj;
    }
  };
  var ExtensionsAttribute = class extends Attribute3 {
    static {
      this.NAME = "Extensions";
    }
    constructor(...args) {
      if (isBufferSource(args[0])) super(args[0], args[1]);
      else {
        const extensions = args[0];
        const value = new Extensions();
        for (const extension of extensions) value.push(AsnConvert.parse(extension.rawData, Extension, selfProducedParseOptions));
        super(id_pkcs9_at_extensionRequest, [AsnConvert.serialize(value)]);
      }
      this.items ??= [];
    }
    onInit(asn) {
      super.onInit(asn);
      if (this.values[0]) {
        const value = AsnConvert.parse(this.values[0], Extensions, this.parseOptions);
        this.items = value.map((o) => ExtensionFactory.create(AsnConvert.serialize(o), this.parseOptions));
      }
    }
    toTextObject() {
      const obj = this.toTextObjectWithoutValue();
      const extensions = this.items.map((o) => o.toTextObject());
      for (const extension of extensions) obj[extension[TextObject.NAME]] = extension;
      return obj;
    }
  };
  var AttributeFactory = class {
    static {
      this.items = /* @__PURE__ */ new Map();
    }
    static register(id, type) {
      this.items.set(id, type);
    }
    static create(data, options) {
      const attribute = new Attribute3(data, options);
      const Type = this.items.get(attribute.type);
      if (Type) return new Type(data, options);
      return attribute;
    }
  };
  var diAsnSignatureFormatter = "crypto.signatureFormatter";
  var AsnDefaultSignatureFormatter = class {
    toAsnSignature(algorithm, signature) {
      return toArrayBuffer(signature);
    }
    toWebSignature(algorithm, signature) {
      return toArrayBuffer(signature);
    }
  };
  var _RsaAlgorithm;
  var RsaAlgorithm = _RsaAlgorithm = class RsaAlgorithm2 {
    static createPssParams(hash, saltLength) {
      const hashAlgorithm = _RsaAlgorithm.getHashAlgorithm(hash);
      if (!hashAlgorithm) return null;
      return new RsaSaPssParams({
        hashAlgorithm,
        maskGenAlgorithm: new AlgorithmIdentifier({
          algorithm: id_mgf1,
          parameters: AsnConvert.serialize(hashAlgorithm)
        }),
        saltLength
      });
    }
    static getHashAlgorithm(alg) {
      const algProv = instance.resolve(diAlgorithmProvider);
      if (typeof alg === "string") return algProv.toAsnAlgorithm({ name: alg });
      if (typeof alg === "object" && alg && "name" in alg) return algProv.toAsnAlgorithm(alg);
      return null;
    }
    toAsnAlgorithm(alg) {
      switch (alg.name.toLowerCase()) {
        case "rsassa-pkcs1-v1_5":
          if ("hash" in alg) {
            let hash;
            if (typeof alg.hash === "string") hash = alg.hash;
            else if (alg.hash && typeof alg.hash === "object" && "name" in alg.hash && typeof alg.hash.name === "string") hash = alg.hash.name.toUpperCase();
            else throw new Error("Cannot get hash algorithm name");
            switch (hash.toLowerCase()) {
              case "sha-1":
                return new AlgorithmIdentifier({
                  algorithm: id_sha1WithRSAEncryption,
                  parameters: null
                });
              case "sha-256":
                return new AlgorithmIdentifier({
                  algorithm: id_sha256WithRSAEncryption,
                  parameters: null
                });
              case "sha-384":
                return new AlgorithmIdentifier({
                  algorithm: id_sha384WithRSAEncryption,
                  parameters: null
                });
              case "sha-512":
                return new AlgorithmIdentifier({
                  algorithm: id_sha512WithRSAEncryption,
                  parameters: null
                });
            }
          } else return new AlgorithmIdentifier({
            algorithm: id_rsaEncryption,
            parameters: null
          });
          break;
        case "rsa-pss":
          if ("hash" in alg) {
            if (!("saltLength" in alg && typeof alg.saltLength === "number")) throw new Error("Cannot get 'saltLength' from 'alg' argument");
            const pssParams = _RsaAlgorithm.createPssParams(alg.hash, alg.saltLength);
            if (!pssParams) throw new Error("Cannot create PSS parameters");
            return new AlgorithmIdentifier({
              algorithm: id_RSASSA_PSS,
              parameters: AsnConvert.serialize(pssParams)
            });
          } else return new AlgorithmIdentifier({
            algorithm: id_RSASSA_PSS,
            parameters: null
          });
      }
      return null;
    }
    toWebAlgorithm(alg) {
      switch (alg.algorithm) {
        case id_rsaEncryption:
          return { name: "RSASSA-PKCS1-v1_5" };
        case id_sha1WithRSAEncryption:
          return {
            name: "RSASSA-PKCS1-v1_5",
            hash: { name: "SHA-1" }
          };
        case id_sha256WithRSAEncryption:
          return {
            name: "RSASSA-PKCS1-v1_5",
            hash: { name: "SHA-256" }
          };
        case id_sha384WithRSAEncryption:
          return {
            name: "RSASSA-PKCS1-v1_5",
            hash: { name: "SHA-384" }
          };
        case id_sha512WithRSAEncryption:
          return {
            name: "RSASSA-PKCS1-v1_5",
            hash: { name: "SHA-512" }
          };
        case id_RSASSA_PSS:
          if (alg.parameters) {
            const pssParams = AsnConvert.parse(alg.parameters, RsaSaPssParams);
            return {
              name: "RSA-PSS",
              hash: instance.resolve(diAlgorithmProvider).toWebAlgorithm(pssParams.hashAlgorithm),
              saltLength: pssParams.saltLength
            };
          } else return { name: "RSA-PSS" };
      }
      return null;
    }
  };
  RsaAlgorithm = _RsaAlgorithm = __decorate10([injectable_default()], RsaAlgorithm);
  instance.registerSingleton(diAlgorithm, RsaAlgorithm);
  var ShaAlgorithm = class ShaAlgorithm2 {
    toAsnAlgorithm(alg) {
      switch (alg.name.toLowerCase()) {
        case "sha-1":
          return new AlgorithmIdentifier({ algorithm: id_sha1 });
        case "sha-256":
          return new AlgorithmIdentifier({ algorithm: id_sha256 });
        case "sha-384":
          return new AlgorithmIdentifier({ algorithm: id_sha384 });
        case "sha-512":
          return new AlgorithmIdentifier({ algorithm: id_sha512 });
      }
      return null;
    }
    toWebAlgorithm(alg) {
      switch (alg.algorithm) {
        case id_sha1:
          return { name: "SHA-1" };
        case id_sha256:
          return { name: "SHA-256" };
        case id_sha384:
          return { name: "SHA-384" };
        case id_sha512:
          return { name: "SHA-512" };
      }
      return null;
    }
  };
  ShaAlgorithm = __decorate10([injectable_default()], ShaAlgorithm);
  instance.registerSingleton(diAlgorithm, ShaAlgorithm);
  var AsnEcSignatureFormatter = class AsnEcSignatureFormatter2 {
    static {
      this.namedCurveSize = /* @__PURE__ */ new Map();
    }
    static {
      this.defaultNamedCurveSize = 32;
    }
    addPadding(pointSize, data) {
      const bytes = toUint8Array(data);
      const res = new Uint8Array(pointSize);
      res.set(bytes, pointSize - bytes.length);
      return res.buffer;
    }
    removePadding(data, positive = false) {
      let bytes = toUint8Array(data);
      for (let i = 0; i < bytes.length; i++) {
        if (!bytes[i]) continue;
        bytes = bytes.slice(i);
        break;
      }
      if (positive && bytes[0] > 127) {
        const result = new Uint8Array(bytes.length + 1);
        result.set(bytes, 1);
        return result.buffer;
      }
      return bytes.buffer;
    }
    toAsnSignature(algorithm, signature) {
      if (algorithm.name === "ECDSA") {
        const namedCurve = algorithm.namedCurve;
        const pointSize = AsnEcSignatureFormatter2.namedCurveSize.get(namedCurve) || AsnEcSignatureFormatter2.defaultNamedCurveSize;
        const ecSignature = new ECDSASigValue();
        const uint8Signature = toUint8Array(signature);
        ecSignature.r = this.removePadding(uint8Signature.slice(0, pointSize), true);
        ecSignature.s = this.removePadding(uint8Signature.slice(pointSize, pointSize + pointSize), true);
        return AsnConvert.serialize(ecSignature);
      }
      return null;
    }
    toWebSignature(algorithm, signature) {
      if (algorithm.name === "ECDSA") {
        const ecSigValue = AsnConvert.parse(signature, ECDSASigValue);
        const namedCurve = algorithm.namedCurve;
        const pointSize = AsnEcSignatureFormatter2.namedCurveSize.get(namedCurve) || AsnEcSignatureFormatter2.defaultNamedCurveSize;
        const r = this.addPadding(pointSize, this.removePadding(ecSigValue.r));
        const s = this.addPadding(pointSize, this.removePadding(ecSigValue.s));
        return concat(r, s);
      }
      return null;
    }
  };
  var idX25519 = "1.3.101.110";
  var idX448 = "1.3.101.111";
  var idEd25519 = "1.3.101.112";
  var idEd448 = "1.3.101.113";
  var EdAlgorithm = class EdAlgorithm2 {
    toAsnAlgorithm(alg) {
      let algorithm = null;
      switch (alg.name.toLowerCase()) {
        case "ed25519":
          algorithm = idEd25519;
          break;
        case "x25519":
          algorithm = idX25519;
          break;
        case "eddsa":
          switch (alg.namedCurve.toLowerCase()) {
            case "ed25519":
              algorithm = idEd25519;
              break;
            case "ed448":
              algorithm = idEd448;
          }
          break;
        case "ecdh-es":
          switch (alg.namedCurve.toLowerCase()) {
            case "x25519":
              algorithm = idX25519;
              break;
            case "x448":
              algorithm = idX448;
          }
      }
      if (algorithm) return new AlgorithmIdentifier({ algorithm });
      return null;
    }
    toWebAlgorithm(alg) {
      switch (alg.algorithm) {
        case idEd25519:
          return { name: "Ed25519" };
        case idEd448:
          return {
            name: "EdDSA",
            namedCurve: "Ed448"
          };
        case idX25519:
          return { name: "X25519" };
        case idX448:
          return {
            name: "ECDH-ES",
            namedCurve: "X448"
          };
      }
      return null;
    }
  };
  EdAlgorithm = __decorate10([injectable_default()], EdAlgorithm);
  instance.registerSingleton(diAlgorithm, EdAlgorithm);
  var MlDsaAlgorithm = class MlDsaAlgorithm2 {
    toAsnAlgorithm(alg) {
      let algorithm = null;
      switch (alg.name.toLowerCase()) {
        case "ml-dsa-44":
          algorithm = id_ml_dsa_44;
          break;
        case "ml-dsa-65":
          algorithm = id_ml_dsa_65;
          break;
        case "ml-dsa-87":
          algorithm = id_ml_dsa_87;
      }
      if (algorithm) return new AlgorithmIdentifier({ algorithm });
      return null;
    }
    toWebAlgorithm(alg) {
      switch (alg.algorithm) {
        case id_ml_dsa_44:
          return { name: "ML-DSA-44" };
        case id_ml_dsa_65:
          return { name: "ML-DSA-65" };
        case id_ml_dsa_87:
          return { name: "ML-DSA-87" };
      }
      return null;
    }
  };
  MlDsaAlgorithm = __decorate10([injectable_default()], MlDsaAlgorithm);
  instance.registerSingleton(diAlgorithm, MlDsaAlgorithm);
  var SlhDsaAlgorithm = class SlhDsaAlgorithm2 {
    toAsnAlgorithm(alg) {
      let algorithm = null;
      switch (alg.name.toLowerCase()) {
        case "slh-dsa-sha2-128s":
          algorithm = id_slh_dsa_sha2_128s;
          break;
        case "slh-dsa-sha2-128f":
          algorithm = id_slh_dsa_sha2_128f;
          break;
        case "slh-dsa-sha2-192s":
          algorithm = id_slh_dsa_sha2_192s;
          break;
        case "slh-dsa-sha2-192f":
          algorithm = id_slh_dsa_sha2_192f;
          break;
        case "slh-dsa-sha2-256s":
          algorithm = id_slh_dsa_sha2_256s;
          break;
        case "slh-dsa-sha2-256f":
          algorithm = id_slh_dsa_sha2_256f;
          break;
        case "slh-dsa-shake-128s":
          algorithm = id_slh_dsa_shake_128s;
          break;
        case "slh-dsa-shake-128f":
          algorithm = id_slh_dsa_shake_128f;
          break;
        case "slh-dsa-shake-192s":
          algorithm = id_slh_dsa_shake_192s;
          break;
        case "slh-dsa-shake-192f":
          algorithm = id_slh_dsa_shake_192f;
          break;
        case "slh-dsa-shake-256s":
          algorithm = id_slh_dsa_shake_256s;
          break;
        case "slh-dsa-shake-256f":
          algorithm = id_slh_dsa_shake_256f;
      }
      if (algorithm) return new AlgorithmIdentifier({ algorithm });
      return null;
    }
    toWebAlgorithm(alg) {
      switch (alg.algorithm) {
        case id_slh_dsa_sha2_128s:
          return { name: "SLH-DSA-SHA2-128s" };
        case id_slh_dsa_sha2_128f:
          return { name: "SLH-DSA-SHA2-128f" };
        case id_slh_dsa_sha2_192s:
          return { name: "SLH-DSA-SHA2-192s" };
        case id_slh_dsa_sha2_192f:
          return { name: "SLH-DSA-SHA2-192f" };
        case id_slh_dsa_sha2_256s:
          return { name: "SLH-DSA-SHA2-256s" };
        case id_slh_dsa_sha2_256f:
          return { name: "SLH-DSA-SHA2-256f" };
        case id_slh_dsa_shake_128s:
          return { name: "SLH-DSA-SHAKE-128s" };
        case id_slh_dsa_shake_128f:
          return { name: "SLH-DSA-SHAKE-128f" };
        case id_slh_dsa_shake_192s:
          return { name: "SLH-DSA-SHAKE-192s" };
        case id_slh_dsa_shake_192f:
          return { name: "SLH-DSA-SHAKE-192f" };
        case id_slh_dsa_shake_256s:
          return { name: "SLH-DSA-SHAKE-256s" };
        case id_slh_dsa_shake_256f:
          return { name: "SLH-DSA-SHAKE-256f" };
      }
      return null;
    }
  };
  SlhDsaAlgorithm = __decorate10([injectable_default()], SlhDsaAlgorithm);
  instance.registerSingleton(diAlgorithm, SlhDsaAlgorithm);
  var Pkcs10CertificateRequest = class extends PemData {
    static {
      this.NAME = "PKCS#10 Certificate Request";
    }
    #tbs;
    #subjectName;
    #subject;
    #signatureAlgorithm;
    #signature;
    #publicKey;
    #attributes;
    #extensions;
    get subjectName() {
      if (!this.#subjectName) this.#subjectName = new Name3(this.asn.certificationRequestInfo.subject);
      return this.#subjectName;
    }
    get subject() {
      if (!this.#subject) this.#subject = this.subjectName.toString();
      return this.#subject;
    }
    get signatureAlgorithm() {
      if (!this.#signatureAlgorithm) {
        const algProv = instance.resolve(diAlgorithmProvider);
        this.#signatureAlgorithm = algProv.toWebAlgorithm(this.asn.signatureAlgorithm);
      }
      return this.#signatureAlgorithm;
    }
    get signature() {
      if (!this.#signature) this.#signature = this.asn.signature;
      return this.#signature;
    }
    get publicKey() {
      if (!this.#publicKey) this.#publicKey = new PublicKey(this.asn.certificationRequestInfo.subjectPKInfo, this.parseOptions);
      return this.#publicKey;
    }
    get attributes() {
      if (!this.#attributes) this.#attributes = this.asn.certificationRequestInfo.attributes.map((o) => AttributeFactory.create(AsnConvert.serialize(o), this.parseOptions));
      return this.#attributes;
    }
    get extensions() {
      if (!this.#extensions) {
        this.#extensions = [];
        const extensions = this.getAttribute(id_pkcs9_at_extensionRequest);
        if (extensions instanceof ExtensionsAttribute) this.#extensions = extensions.items;
      }
      return this.#extensions;
    }
    get tbs() {
      if (!this.#tbs) this.#tbs = this.asn.certificationRequestInfoRaw || AsnConvert.serialize(this.asn.certificationRequestInfo);
      return this.#tbs;
    }
    constructor(param, options) {
      const args = PemData.isAsnEncoded(param) ? [
        param,
        CertificationRequest,
        options
      ] : [param, options];
      super(args[0], args[1], args[2]);
      this.tag = PemConverter.CertificateRequestTag;
    }
    onInit(_asn) {
    }
    getAttribute(type) {
      for (const attr of this.attributes) if (attr.type === type) return attr;
      return null;
    }
    getAttributes(type) {
      return this.attributes.filter((o) => o.type === type);
    }
    getExtension(type) {
      for (const ext of this.extensions) if (ext.type === type) return ext;
      return null;
    }
    getExtensions(type) {
      return this.extensions.filter((o) => o.type === type);
    }
    async verify(crypto2 = cryptoProvider.get()) {
      const algorithm = {
        ...this.publicKey.algorithm,
        ...this.signatureAlgorithm
      };
      const publicKey = await this.publicKey.export(algorithm, ["verify"], crypto2);
      const signatureFormatters = instance.resolveAll(diAsnSignatureFormatter).reverse();
      let signature = null;
      for (const signatureFormatter of signatureFormatters) {
        signature = signatureFormatter.toWebSignature(algorithm, this.signature);
        if (signature) break;
      }
      if (!signature) throw Error("Cannot convert WebCrypto signature value to ASN.1 format");
      return await crypto2.subtle.verify(this.signatureAlgorithm, publicKey, signature, this.tbs);
    }
    toTextObject() {
      const obj = this.toTextObjectEmpty();
      const req = AsnConvert.parse(this.rawData, CertificationRequest, this.parseOptions);
      const tbs = req.certificationRequestInfo;
      const data = new TextObject("", {
        Version: `${Version[tbs.version]} (${tbs.version})`,
        Subject: this.subject,
        "Subject Public Key Info": this.publicKey
      });
      if (this.attributes.length) {
        const attrs = new TextObject("");
        for (const ext of this.attributes) {
          const attrObj = ext.toTextObject();
          attrs[attrObj[TextObject.NAME]] = attrObj;
        }
        data["Attributes"] = attrs;
      }
      obj["Data"] = data;
      obj["Signature"] = new TextObject("", {
        Algorithm: TextConverter.serializeAlgorithm(req.signatureAlgorithm),
        "": req.signature
      });
      return obj;
    }
  };
  var X509Certificate = class extends PemData {
    static {
      this.NAME = "Certificate";
    }
    #tbs;
    #serialNumber;
    #subjectName;
    #subject;
    #issuerName;
    #issuer;
    #notBefore;
    #notAfter;
    #signatureAlgorithm;
    #signature;
    #extensions;
    #publicKey;
    get publicKey() {
      if (!this.#publicKey) this.#publicKey = new PublicKey(this.asn.tbsCertificate.subjectPublicKeyInfo, this.parseOptions);
      return this.#publicKey;
    }
    get serialNumber() {
      if (!this.#serialNumber) this.#serialNumber = getCertificateSerialNumber(this.asn.tbsCertificate.serialNumber);
      return this.#serialNumber;
    }
    get subjectName() {
      if (!this.#subjectName) this.#subjectName = new Name3(this.asn.tbsCertificate.subject);
      return this.#subjectName;
    }
    get subject() {
      if (!this.#subject) this.#subject = this.subjectName.toString();
      return this.#subject;
    }
    get issuerName() {
      if (!this.#issuerName) this.#issuerName = new Name3(this.asn.tbsCertificate.issuer);
      return this.#issuerName;
    }
    get issuer() {
      if (!this.#issuer) this.#issuer = this.issuerName.toString();
      return this.#issuer;
    }
    get notBefore() {
      if (!this.#notBefore) {
        const notBefore = this.asn.tbsCertificate.validity.notBefore.utcTime || this.asn.tbsCertificate.validity.notBefore.generalTime;
        if (!notBefore) throw new Error("Cannot get 'notBefore' value");
        this.#notBefore = notBefore;
      }
      return this.#notBefore;
    }
    get notAfter() {
      if (!this.#notAfter) {
        const notAfter = this.asn.tbsCertificate.validity.notAfter.utcTime || this.asn.tbsCertificate.validity.notAfter.generalTime;
        if (!notAfter) throw new Error("Cannot get 'notAfter' value");
        this.#notAfter = notAfter;
      }
      return this.#notAfter;
    }
    get signatureAlgorithm() {
      if (!this.#signatureAlgorithm) {
        const algProv = instance.resolve(diAlgorithmProvider);
        this.#signatureAlgorithm = algProv.toWebAlgorithm(this.asn.signatureAlgorithm);
      }
      return this.#signatureAlgorithm;
    }
    get signature() {
      if (!this.#signature) this.#signature = this.asn.signatureValue;
      return this.#signature;
    }
    get extensions() {
      if (!this.#extensions) {
        this.#extensions = [];
        if (this.asn.tbsCertificate.extensions) this.#extensions = this.asn.tbsCertificate.extensions.map((o) => ExtensionFactory.create(AsnConvert.serialize(o), this.parseOptions));
      }
      return this.#extensions;
    }
    get tbs() {
      if (!this.#tbs) this.#tbs = this.asn.tbsCertificateRaw || AsnConvert.serialize(this.asn.tbsCertificate);
      return this.#tbs;
    }
    constructor(param, options) {
      const args = PemData.isAsnEncoded(param) ? [
        param,
        Certificate,
        options
      ] : [param, options];
      super(args[0], args[1], args[2]);
      this.tag = PemConverter.CertificateTag;
    }
    onInit(_asn) {
    }
    getExtension(type) {
      for (const ext of this.extensions) if (typeof type === "string") {
        if (ext.type === type) return ext;
      } else if (ext instanceof type) return ext;
      return null;
    }
    getExtensions(type) {
      return this.extensions.filter((o) => {
        if (typeof type === "string") return o.type === type;
        else return o instanceof type;
      });
    }
    async verify(params = {}, crypto2 = cryptoProvider.get()) {
      let keyAlgorithm;
      let publicKey;
      const paramsKey = params.publicKey;
      try {
        if (!paramsKey) {
          keyAlgorithm = {
            ...this.publicKey.algorithm,
            ...this.signatureAlgorithm
          };
          publicKey = await this.publicKey.export(keyAlgorithm, ["verify"], crypto2);
        } else if ("publicKey" in paramsKey) {
          keyAlgorithm = {
            ...paramsKey.publicKey.algorithm,
            ...this.signatureAlgorithm
          };
          publicKey = await paramsKey.publicKey.export(keyAlgorithm, ["verify"], crypto2);
        } else if (paramsKey instanceof PublicKey) {
          keyAlgorithm = {
            ...paramsKey.algorithm,
            ...this.signatureAlgorithm
          };
          publicKey = await paramsKey.export(keyAlgorithm, ["verify"], crypto2);
        } else if (isBufferSource(paramsKey)) {
          const key = new PublicKey(paramsKey);
          keyAlgorithm = {
            ...key.algorithm,
            ...this.signatureAlgorithm
          };
          publicKey = await key.export(keyAlgorithm, ["verify"], crypto2);
        } else {
          keyAlgorithm = {
            ...paramsKey.algorithm,
            ...this.signatureAlgorithm
          };
          publicKey = paramsKey;
        }
      } catch {
        return false;
      }
      const signatureFormatters = instance.resolveAll(diAsnSignatureFormatter).reverse();
      let signature = null;
      for (const signatureFormatter of signatureFormatters) {
        signature = signatureFormatter.toWebSignature(keyAlgorithm, this.signature);
        if (signature) break;
      }
      if (!signature) throw Error("Cannot convert ASN.1 signature value to WebCrypto format");
      const ok = await crypto2.subtle.verify(this.signatureAlgorithm, publicKey, signature, this.tbs);
      if (params.signatureOnly) return ok;
      else {
        const time = (params.date || /* @__PURE__ */ new Date()).getTime();
        return ok && this.notBefore.getTime() < time && time < this.notAfter.getTime();
      }
    }
    async getThumbprint(arg1, arg2) {
      let crypto2;
      let algorithm = "SHA-1";
      if (arg1) {
        if (typeof arg1 === "object" && "subtle" in arg1) crypto2 = arg1;
        else {
          algorithm = arg1;
          crypto2 = arg2;
        }
      }
      crypto2 ??= cryptoProvider.get();
      return await crypto2.subtle.digest(algorithm, this.rawData);
    }
    async isSelfSigned(crypto2 = cryptoProvider.get()) {
      return this.subject === this.issuer && await this.verify({ signatureOnly: true }, crypto2);
    }
    toTextObject() {
      const obj = this.toTextObjectEmpty();
      const cert = AsnConvert.parse(this.rawData, Certificate, this.parseOptions);
      const tbs = cert.tbsCertificate;
      const data = new TextObject("", {
        Version: `${Version[tbs.version]} (${tbs.version})`,
        "Serial Number": tbs.serialNumber,
        "Signature Algorithm": TextConverter.serializeAlgorithm(tbs.signature),
        Issuer: this.issuer,
        Validity: new TextObject("", {
          "Not Before": tbs.validity.notBefore.getTime(),
          "Not After": tbs.validity.notAfter.getTime()
        }),
        Subject: this.subject,
        "Subject Public Key Info": this.publicKey
      });
      if (tbs.issuerUniqueID) data["Issuer Unique ID"] = tbs.issuerUniqueID;
      if (tbs.subjectUniqueID) data["Subject Unique ID"] = tbs.subjectUniqueID;
      if (this.extensions.length) {
        const extensions = new TextObject("");
        for (const ext of this.extensions) {
          const extObj = ext.toTextObject();
          extensions[extObj[TextObject.NAME]] = extObj;
        }
        data["Extensions"] = extensions;
      }
      obj["Data"] = data;
      obj["Signature"] = new TextObject("", {
        Algorithm: TextConverter.serializeAlgorithm(cert.signatureAlgorithm),
        "": cert.signatureValue
      });
      return obj;
    }
  };
  var X509Certificates = class extends Array {
    #options;
    constructor(param, options) {
      super();
      if (PemData.isAsnEncoded(param)) this.import(param, options);
      else if (param instanceof X509Certificate) this.push(param);
      else if (Array.isArray(param)) for (const item of param) this.push(item);
    }
    export(format2) {
      const signedData = new SignedData();
      signedData.version = 1;
      signedData.encapContentInfo.eContentType = id_data;
      signedData.encapContentInfo.eContent = new EncapsulatedContent({ single: new OctetString3() });
      signedData.certificates = new CertificateSet(this.map((o) => new CertificateChoices({ certificate: AsnConvert.parse(o.rawData, Certificate, this.#options) })));
      const cms = new ContentInfo({
        contentType: id_signedData,
        content: AsnConvert.serialize(signedData)
      });
      const raw = AsnConvert.serialize(cms);
      if (format2 === "raw") return raw;
      return this.toString(format2);
    }
    import(data, options) {
      const raw = PemData.toArrayBuffer(data);
      const cms = AsnConvert.parse(raw, ContentInfo, options);
      assertSingleAsnElement(raw);
      if (cms.contentType !== id_signedData) throw new TypeError("Cannot parse CMS package. Incoming data is not a SignedData object.");
      const signedData = AsnConvert.parse(cms.content, SignedData, options);
      const certificates = [];
      for (const item of signedData.certificates || []) if (item.certificate) certificates.push(new X509Certificate(item.certificate, options));
      this.clear();
      for (const certificate of certificates) this.push(certificate);
      this.#options = options;
    }
    clear() {
      while (this.pop()) ;
    }
    toString(format2 = "pem") {
      const raw = this.export("raw");
      switch (format2) {
        case "pem":
          return PemConverter.encode(raw, "CMS");
        case "pem-chain":
          return this.map((o) => o.toString("pem")).join("\n");
        case "asn":
          return AsnConvert.toString(raw, this.#options);
        case "hex":
          return hex_exports.encode(raw);
        case "base64":
          return base64_exports.encode(raw);
        case "base64url":
          return base64url_exports.encode(raw);
        case "text":
          return TextConverter.serialize(this.toTextObject());
        default:
          throw TypeError("Argument 'format' is unsupported value");
      }
    }
    toTextObject() {
      const contentInfo = AsnConvert.parse(this.export("raw"), ContentInfo, this.#options);
      const signedData = AsnConvert.parse(contentInfo.content, SignedData, this.#options);
      return new TextObject("X509Certificates", {
        "Content Type": OidSerializer.toString(contentInfo.contentType),
        Content: new TextObject("", {
          Version: `${CMSVersion[signedData.version]} (${signedData.version})`,
          Certificates: new TextObject("", { Certificate: this.map((o) => o.toTextObject()) })
        })
      });
    }
  };
  var X509ChainBuildError = class extends Error {
    constructor(params) {
      const { code, rejections = [], rejectionsTruncated = false, limit } = params;
      super(code === "NO_PATH" ? "Cannot build a certificate chain to a trusted anchor. No path found." : `Cannot build a certificate chain to a trusted anchor. Limit exceeded: ${limit}.`);
      this.name = "X509ChainBuildError";
      this.code = code;
      this.limit = limit;
      this.rejections = Object.freeze(rejections.slice(0, 64).map((item) => Object.freeze({ ...item })));
      this.rejectionsTruncated = rejectionsTruncated || rejections.length > 64;
    }
  };
  var X509ChainBuilder = class {
    static {
      this.defaultLimits = Object.freeze({
        maxDepth: 16,
        maxSearchSteps: 1e4
      });
    }
    constructor(params = {}) {
      this.certificates = [];
      if (params.certificates) this.certificates = params.certificates;
    }
    async build(cert, crypto2 = cryptoProvider.get()) {
      const chain = new X509Certificates(cert);
      let current = cert;
      while (current = await this.findIssuer(current, crypto2)) {
        const thumbprint = await current.getThumbprint(crypto2);
        for (const item of chain) {
          const thumbprint2 = await item.getThumbprint(crypto2);
          if (equal(thumbprint, thumbprint2)) throw new Error("Cannot build a certificate chain. Circular dependency.");
        }
        chain.push(current);
      }
      return chain;
    }
    async buildToAnchor(cert, params, crypto2 = cryptoProvider.get()) {
      return buildChainToAnchor(cert, this.certificates.slice(), params, crypto2);
    }
    async findIssuer(cert, crypto2 = cryptoProvider.get()) {
      if (!await cert.isSelfSigned(crypto2)) {
        const akiExt = cert.getExtension(id_ce_authorityKeyIdentifier);
        for (const item of this.certificates) {
          if (item.subject !== cert.issuer) continue;
          if (akiExt) {
            if (akiExt.keyId) {
              const skiExt = item.getExtension(id_ce_subjectKeyIdentifier);
              if (skiExt && skiExt.keyId !== akiExt.keyId) continue;
            } else if (akiExt.certId) {
              const sanExt = item.getExtension(id_ce_subjectAltName);
              if (sanExt && !(akiExt.certId.serialNumber === item.serialNumber && equal(AsnConvert.serialize(akiExt.certId.name), AsnConvert.serialize(sanExt)))) continue;
            }
          }
          try {
            const algorithm = {
              ...item.publicKey.algorithm,
              ...cert.signatureAlgorithm
            };
            const publicKey = await item.publicKey.export(algorithm, ["verify"], crypto2);
            if (!await cert.verify({
              publicKey,
              signatureOnly: true
            }, crypto2)) continue;
          } catch {
            continue;
          }
          return item;
        }
      }
      return null;
    }
  };
  function isChainCertificate(value) {
    if (!value || typeof value !== "object") return false;
    const certificate = value;
    const hasMember = (name, accepts) => {
      for (let owner = value; owner; owner = Object.getPrototypeOf(owner)) {
        const descriptor = Object.getOwnPropertyDescriptor(owner, name);
        if (descriptor) return typeof descriptor.get === "function" || "value" in descriptor && accepts(descriptor.value);
      }
      return false;
    };
    return isBufferSource(certificate.rawData) && typeof certificate.getExtension === "function" && typeof certificate.verify === "function" && hasMember("subject", (member) => typeof member === "string") && hasMember("issuer", (member) => typeof member === "string") && hasMember("publicKey", (member) => !!member && typeof member === "object" && "export" in member && typeof member.export === "function") && hasMember("signatureAlgorithm", (member) => !!member && typeof member === "object");
  }
  async function buildChainToAnchor(cert, certificates, params, crypto2) {
    const input = params?.trustAnchors;
    if (input == null || Array.isArray(input) && !input.length) throw new TypeError("At least one trust anchor is required.");
    const anchors = Array.isArray(input) ? input.slice() : [input];
    const limits = { ...X509ChainBuilder.defaultLimits };
    for (const name of ["maxDepth", "maxSearchSteps"]) {
      const value = params.limits?.[name];
      if (value !== void 0) {
        if (!Number.isSafeInteger(value) || value <= 0) throw new RangeError(`${name} must be a positive safe integer.`);
        limits[name] = value;
      }
    }
    const signal = params.signal;
    let work = 0;
    const checkpoint = async () => {
      signal?.throwIfAborted();
      if (signal && ++work % 64 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
        signal.throwIfAborted();
      }
    };
    signal?.throwIfAborted();
    const nodes = /* @__PURE__ */ new Map();
    const add = (certificate, anchor = false) => {
      const id = hex_exports.encode(certificate.rawData);
      let node = nodes.get(id);
      if (!node) {
        node = {
          certificate,
          id,
          anchor
        };
        nodes.set(id, node);
      } else if (anchor) node.anchor = true;
      return node;
    };
    const start = add(cert);
    for (const [index, anchor] of anchors.entries()) {
      await checkpoint();
      signal?.throwIfAborted();
      if (!isChainCertificate(anchor)) throw new TypeError(`trustAnchors[${index}] must be an X509Certificate.`);
      add(anchor, true);
    }
    if (start.anchor) {
      signal?.throwIfAborted();
      return new X509Certificates(cert);
    }
    for (const certificate of certificates) {
      await checkpoint();
      add(certificate);
    }
    const bySubject = /* @__PURE__ */ new Map();
    for (const node of nodes.values()) {
      await checkpoint();
      try {
        node.aki = node.certificate.getExtension(id_ce_authorityKeyIdentifier)?.keyId;
        node.ski = node.certificate.getExtension(id_ce_subjectKeyIdentifier)?.keyId;
      } catch {
      }
      const subject = node.certificate.subject;
      const group = bySubject.get(subject);
      if (group) group.push(node);
      else bySubject.set(subject, [node]);
    }
    const candidates = /* @__PURE__ */ new Map();
    const frame = (node) => {
      let issuers = candidates.get(node);
      if (!issuers) {
        const priority = (issuer) => issuer.anchor ? 0 : node.aki && node.aki === issuer.ski ? 1 : 2;
        issuers = (bySubject.get(node.certificate.issuer) || []).slice().sort((a, b) => priority(a) - priority(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        candidates.set(node, issuers);
      }
      return {
        node,
        candidates: issuers,
        next: 0
      };
    };
    const rejections = [];
    let truncated = false;
    const reject = (event) => {
      if (rejections.length < 64) rejections.push(event);
      else truncated = true;
    };
    const failure = (limit) => new X509ChainBuildError(limit ? {
      code: "LIMIT_EXCEEDED",
      limit,
      rejections,
      rejectionsTruncated: truncated
    } : {
      code: "NO_PATH",
      rejections,
      rejectionsTruncated: truncated
    });
    const verified = /* @__PURE__ */ new Map();
    const verify = async (child, issuer) => {
      let cache = verified.get(child);
      if (!cache) {
        cache = /* @__PURE__ */ new Map();
        verified.set(child, cache);
      }
      let result = cache.get(issuer);
      if (!result) {
        try {
          const algorithm = {
            ...issuer.certificate.publicKey.algorithm,
            ...child.certificate.signatureAlgorithm
          };
          const publicKey = await issuer.certificate.publicKey.export(algorithm, ["verify"], crypto2);
          signal?.throwIfAborted();
          result = await child.certificate.verify({
            publicKey,
            signatureOnly: true
          }, crypto2) ? { ok: true } : {
            ok: false,
            reason: "SIGNATURE_INVALID"
          };
        } catch (cause) {
          signal?.throwIfAborted();
          result = {
            ok: false,
            reason: "VERIFICATION_ERROR",
            cause
          };
        }
        signal?.throwIfAborted();
        cache.set(issuer, result);
      }
      return result;
    };
    const path = [start];
    const active = new Set(path);
    const stack = [frame(start)];
    let steps = 0;
    let depthExceeded = false;
    while (stack.length) {
      await checkpoint();
      signal?.throwIfAborted();
      const current = stack[stack.length - 1];
      if (current.next === current.candidates.length) {
        if (!current.candidates.length) reject({
          certificate: current.node.certificate,
          reason: "NO_ISSUER"
        });
        stack.pop();
        active.delete(current.node);
        path.pop();
        continue;
      }
      if (steps === limits.maxSearchSteps) throw failure("maxSearchSteps");
      steps++;
      const issuer = current.candidates[current.next++];
      const event = {
        certificate: current.node.certificate,
        candidate: issuer.certificate
      };
      if (active.has(issuer)) {
        reject({
          ...event,
          reason: "CYCLE"
        });
        continue;
      }
      const result = await verify(current.node, issuer);
      signal?.throwIfAborted();
      if (!result.ok) {
        reject({
          ...event,
          reason: result.reason,
          cause: result.cause
        });
        continue;
      }
      if (path.length === limits.maxDepth) {
        depthExceeded = true;
        reject({
          ...event,
          reason: "DEPTH"
        });
        continue;
      }
      path.push(issuer);
      if (issuer.anchor) return new X509Certificates(path.map((node) => node.certificate));
      active.add(issuer);
      stack.push(frame(issuer));
    }
    throw failure(depthExceeded ? "maxDepth" : void 0);
  }
  ExtensionFactory.register(id_ce_basicConstraints, BasicConstraintsExtension);
  ExtensionFactory.register(id_ce_extKeyUsage, ExtendedKeyUsageExtension);
  ExtensionFactory.register(id_ce_keyUsage, KeyUsagesExtension);
  ExtensionFactory.register(id_ce_subjectKeyIdentifier, SubjectKeyIdentifierExtension);
  ExtensionFactory.register(id_ce_authorityKeyIdentifier, AuthorityKeyIdentifierExtension);
  ExtensionFactory.register(id_ce_subjectAltName, SubjectAlternativeNameExtension);
  ExtensionFactory.register(id_ce_cRLDistributionPoints, CRLDistributionPointsExtension);
  ExtensionFactory.register(id_pe_authorityInfoAccess, AuthorityInfoAccessExtension);
  ExtensionFactory.register(id_ce_issuerAltName, IssuerAlternativeNameExtension);
  AttributeFactory.register(id_pkcs9_at_challengePassword, ChallengePasswordAttribute);
  AttributeFactory.register(id_pkcs9_at_extensionRequest, ExtensionsAttribute);
  instance.registerSingleton(diAsnSignatureFormatter, AsnDefaultSignatureFormatter);
  instance.registerSingleton(diAsnSignatureFormatter, AsnEcSignatureFormatter);
  AsnEcSignatureFormatter.namedCurveSize.set("P-256", 32);
  AsnEcSignatureFormatter.namedCurveSize.set("K-256", 32);
  AsnEcSignatureFormatter.namedCurveSize.set("P-384", 48);
  AsnEcSignatureFormatter.namedCurveSize.set("P-521", 66);
  return __toCommonJS(stdin_exports);
})();
/*! Bundled license information:

reflect-metadata/Reflect.js:
  (*! *****************************************************************************
  Copyright (C) Microsoft. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0
  
  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.
  
  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** *)

asn1js/build/index.js:
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

tslib/tslib.es6.js:
  (*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** *)

@peculiar/x509/build/index.js:
  (*!
   * MIT License
   * 
   * Copyright (c) Peculiar Ventures. All rights reserved.
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
*/
