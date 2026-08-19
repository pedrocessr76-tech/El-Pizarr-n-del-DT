"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerEntity = void 0;
var typeorm_1 = require("typeorm");
var PlayerEntity = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('players')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _nationality_decorators;
    var _nationality_initializers = [];
    var _nationality_extraInitializers = [];
    var _position_decorators;
    var _position_initializers = [];
    var _position_extraInitializers = [];
    var _rating_decorators;
    var _rating_initializers = [];
    var _rating_extraInitializers = [];
    var _pace_decorators;
    var _pace_initializers = [];
    var _pace_extraInitializers = [];
    var _shooting_decorators;
    var _shooting_initializers = [];
    var _shooting_extraInitializers = [];
    var _passing_decorators;
    var _passing_initializers = [];
    var _passing_extraInitializers = [];
    var _dribbling_decorators;
    var _dribbling_initializers = [];
    var _dribbling_extraInitializers = [];
    var _defending_decorators;
    var _defending_initializers = [];
    var _defending_extraInitializers = [];
    var _physical_decorators;
    var _physical_initializers = [];
    var _physical_extraInitializers = [];
    var PlayerEntity = _classThis = /** @class */ (function () {
        function PlayerEntity_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.name = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _name_initializers, void 0));
            this.nationality = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _nationality_initializers, void 0));
            this.position = (__runInitializers(this, _nationality_extraInitializers), __runInitializers(this, _position_initializers, void 0));
            this.rating = (__runInitializers(this, _position_extraInitializers), __runInitializers(this, _rating_initializers, void 0));
            this.pace = (__runInitializers(this, _rating_extraInitializers), __runInitializers(this, _pace_initializers, void 0));
            this.shooting = (__runInitializers(this, _pace_extraInitializers), __runInitializers(this, _shooting_initializers, void 0));
            this.passing = (__runInitializers(this, _shooting_extraInitializers), __runInitializers(this, _passing_initializers, void 0));
            this.dribbling = (__runInitializers(this, _passing_extraInitializers), __runInitializers(this, _dribbling_initializers, void 0));
            this.defending = (__runInitializers(this, _dribbling_extraInitializers), __runInitializers(this, _defending_initializers, void 0));
            this.physical = (__runInitializers(this, _defending_extraInitializers), __runInitializers(this, _physical_initializers, void 0));
            __runInitializers(this, _physical_extraInitializers);
        }
        return PlayerEntity_1;
    }());
    __setFunctionName(_classThis, "PlayerEntity");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryColumn)({ type: 'text' })];
        _name_decorators = [(0, typeorm_1.Column)({ length: 100 })];
        _nationality_decorators = [(0, typeorm_1.Column)({ length: 50 })];
        _position_decorators = [(0, typeorm_1.Column)({ length: 3 })];
        _rating_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 50 })];
        _pace_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 50 })];
        _shooting_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 50 })];
        _passing_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 50 })];
        _dribbling_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 50 })];
        _defending_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 50 })];
        _physical_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 50 })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _nationality_decorators, { kind: "field", name: "nationality", static: false, private: false, access: { has: function (obj) { return "nationality" in obj; }, get: function (obj) { return obj.nationality; }, set: function (obj, value) { obj.nationality = value; } }, metadata: _metadata }, _nationality_initializers, _nationality_extraInitializers);
        __esDecorate(null, null, _position_decorators, { kind: "field", name: "position", static: false, private: false, access: { has: function (obj) { return "position" in obj; }, get: function (obj) { return obj.position; }, set: function (obj, value) { obj.position = value; } }, metadata: _metadata }, _position_initializers, _position_extraInitializers);
        __esDecorate(null, null, _rating_decorators, { kind: "field", name: "rating", static: false, private: false, access: { has: function (obj) { return "rating" in obj; }, get: function (obj) { return obj.rating; }, set: function (obj, value) { obj.rating = value; } }, metadata: _metadata }, _rating_initializers, _rating_extraInitializers);
        __esDecorate(null, null, _pace_decorators, { kind: "field", name: "pace", static: false, private: false, access: { has: function (obj) { return "pace" in obj; }, get: function (obj) { return obj.pace; }, set: function (obj, value) { obj.pace = value; } }, metadata: _metadata }, _pace_initializers, _pace_extraInitializers);
        __esDecorate(null, null, _shooting_decorators, { kind: "field", name: "shooting", static: false, private: false, access: { has: function (obj) { return "shooting" in obj; }, get: function (obj) { return obj.shooting; }, set: function (obj, value) { obj.shooting = value; } }, metadata: _metadata }, _shooting_initializers, _shooting_extraInitializers);
        __esDecorate(null, null, _passing_decorators, { kind: "field", name: "passing", static: false, private: false, access: { has: function (obj) { return "passing" in obj; }, get: function (obj) { return obj.passing; }, set: function (obj, value) { obj.passing = value; } }, metadata: _metadata }, _passing_initializers, _passing_extraInitializers);
        __esDecorate(null, null, _dribbling_decorators, { kind: "field", name: "dribbling", static: false, private: false, access: { has: function (obj) { return "dribbling" in obj; }, get: function (obj) { return obj.dribbling; }, set: function (obj, value) { obj.dribbling = value; } }, metadata: _metadata }, _dribbling_initializers, _dribbling_extraInitializers);
        __esDecorate(null, null, _defending_decorators, { kind: "field", name: "defending", static: false, private: false, access: { has: function (obj) { return "defending" in obj; }, get: function (obj) { return obj.defending; }, set: function (obj, value) { obj.defending = value; } }, metadata: _metadata }, _defending_initializers, _defending_extraInitializers);
        __esDecorate(null, null, _physical_decorators, { kind: "field", name: "physical", static: false, private: false, access: { has: function (obj) { return "physical" in obj; }, get: function (obj) { return obj.physical; }, set: function (obj, value) { obj.physical = value; } }, metadata: _metadata }, _physical_initializers, _physical_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PlayerEntity = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PlayerEntity = _classThis;
}();
exports.PlayerEntity = PlayerEntity;
