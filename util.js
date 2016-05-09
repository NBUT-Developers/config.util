/**
 * XadillaX created at 2016-05-09 11:12:46 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
'use strict';

/* jshint ignore: start */
var Utils = require("util");

var DEFAULT_CLONE_DEPTH = 20;

var util = {};

// refer to
// https://github.com/lorenwest/node-config/blob/656abf109ca3387a3efb81687f0d9900d2c68a71/lib/config.js#L1522-L1524
util.isObject = function(obj) {
    return (obj !== null) && (typeof obj === 'object') && !(Array.isArray(obj));
};

// refer to
// https://github.com/lorenwest/node-config/blob/656abf109ca3387a3efb81687f0d9900d2c68a71/lib/config.js#L455-L472
util.makeHidden = function(object, property, value) {
    if (typeof value === 'undefined') {
        Object.defineProperty(object, property, {
            enumerable: false
        });
    } else {
        Object.defineProperty(object, property, {
            value: value,
            enumerable: false
        });
    }

    return object;
}

// refer to
// https://github.com/lorenwest/node-config/blob/656abf109ca3387a3efb81687f0d9900d2c68a71/lib/config.js#L510-L548
util.makeImmutable = function(object, property, value) {
    var properties = null;

    if (typeof property === 'string') {
        return Object.defineProperty(object, property, {
            value: (typeof value === 'undefined') ? object[property] : value,
            writable: false,
            configurable: false
        });
    }

    if (Array.isArray(property)) {
        properties = property;
    } else {
        properties = Object.keys(object);
    }

    for (var i = 0; i < properties.length; i++) {
        var propertyName = properties[i],
            value = object[propertyName];

        Object.defineProperty(object, propertyName, {
            value: value,
            writable: false,
            configurable: false
        });

        // Call recursively if an object.
        if (util.isObject(value)) {
            util.makeImmutable(value);
        }
    }

    return object;
};

// refer to
// https://github.com/lorenwest/node-config/blob/656abf109ca3387a3efb81687f0d9900d2c68a71/lib/config.js#L1269-L1314
util.equalsDeep = function(object1, object2, depth) {
    var t = this;
    depth = (depth === null ? DEFAULT_CLONE_DEPTH : depth);
    if (depth < 0) {
        return {};
    }

    if (!object1 || !object2) {
        return false;
    }
    if (object1 === object2) {
        return true;
    }
    if (typeof(object1) != 'object' || typeof(object2) != 'object') {
        return false;
    }

    if (Object.keys(object1).length != Object.keys(object2).length) {
        return false;
    }

    for (var prop in object1) {
        if (object1[prop] && typeof(object1[prop]) === 'object') {
            if (!util.equalsDeep(object1[prop], object2[prop], depth - 1)) {
                return false;
            }
        } else {
            if (object1[prop] !== object2[prop]) {
                return false;
            }
        }
    }

    // Test passed.
    return true;
};

// refer to
// https://github.com/lorenwest/node-config/blob/656abf109ca3387a3efb81687f0d9900d2c68a71/lib/config.js#L1336-L1368
util.diffDeep = function(object1, object2, depth) {
    var t = this,
        diff = {};
    depth = (depth === null ? DEFAULT_CLONE_DEPTH : depth);
    if (depth < 0) {
        return {};
    }

    for (var parm in object2) {
        var value1 = object1[parm];
        var value2 = object2[parm];
        if (value1 && value2 && util.isObject(value2)) {
            if (!(util.equalsDeep(value1, value2))) {
                diff[parm] = util.diffDeep(value1, value2, depth - 1);
            }
        } else if (Array.isArray(value1) && Array.isArray(value2)) {
            if (!util.equalsDeep(value1, value2)) {
                diff[parm] = value2;
            }
        } else if (value1 !== value2) {
            diff[parm] = value2;
        }
    }

    return diff;
};

// refer to
// https://github.com/lorenwest/node-config/blob/656abf109ca3387a3efb81687f0d9900d2c68a71/lib/config.js#L1095-L1164
util.cloneDeep = function cloneDeep(parent, depth, circular, prototype) {
    var allParents = [];
    var allChildren = [];

    var useBuffer = typeof Buffer != 'undefined';

    if (typeof circular === 'undefined')
        circular = true;

    if (typeof depth === 'undefined')
        depth = 20;

    function _clone(parent, depth) {
        if (parent === null)
            return null;

        if (depth === 0)
            return parent;

        var child;
        if (typeof parent != 'object') {
            return parent;
        }

        if (Utils.isArray(parent)) {
            child = [];
        } else if (Utils.isRegExp(parent)) {
            child = new RegExp(parent.source, util.getRegExpFlags(parent));
            if (parent.lastIndex) child.lastIndex = parent.lastIndex;
        } else if (Utils.isDate(parent)) {
            child = new Date(parent.getTime());
        } else if (useBuffer && Buffer.isBuffer(parent)) {
            child = new Buffer(parent.length);
            parent.copy(child);
            return child;
        } else {
            if (typeof prototype === 'undefined') child = Object.create(Object.getPrototypeOf(parent));
            else child = Object.create(prototype);
        }

        if (circular) {
            var index = allParents.indexOf(parent);

            if (index != -1) {
                return allChildren[index];
            }
            allParents.push(parent);
            allChildren.push(child);
        }

        for (var i in parent) {
            var propDescriptor = Object.getOwnPropertyDescriptor(parent, i);
            var hasGetter = ((propDescriptor !== undefined) && (propDescriptor.get !== undefined));

            if (hasGetter) {
                Object.defineProperty(child, i, propDescriptor);
            } else {
                child[i] = _clone(parent[i], depth - 1);
            }
        }

        return child;
    }

    return _clone(parent, depth);
};

// refer to
// https://github.com/lorenwest/node-config/blob/656abf109ca3387a3efb81687f0d9900d2c68a71/lib/config.js#L1383-L1428
util.extendDeep = function(mergeInto) {
    var t = this;
    var vargs = Array.prototype.slice.call(arguments, 1);
    var depth = vargs.pop();
    if (typeof(depth) != 'number') {
        vargs.push(depth);
        depth = DEFAULT_CLONE_DEPTH;
    }

    if (depth < 0) {
        return mergeInto;
    }

    vargs.forEach(function(mergeFrom) {
        for (var prop in mergeFrom) {
            var isDeferredFunc = mergeInto[prop] instanceof DeferredConfig;
            if (mergeFrom[prop] instanceof Date) {
                mergeInto[prop] = mergeFrom[prop];
            } else if (util.isObject(mergeInto[prop]) && util.isObject(mergeFrom[prop]) && !isDeferredFunc) {
                util.extendDeep(mergeInto[prop], mergeFrom[prop], depth - 1);
            } else if (mergeFrom[prop] && typeof mergeFrom[prop] === 'object') {
                mergeInto[prop] = util.cloneDeep(mergeFrom[prop], depth - 1);
            } else {
                Object.defineProperty(mergeInto, prop, Object.getOwnPropertyDescriptor(Object(mergeFrom), prop));
            }
        }
    });

    return mergeInto;
};

module.exports = util;
