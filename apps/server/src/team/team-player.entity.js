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
exports.TeamPlayerEntity = void 0;
var typeorm_1 = require("typeorm");
var TeamPlayerEntity = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('team_players')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _teamId_decorators;
    var _teamId_initializers = [];
    var _teamId_extraInitializers = [];
    var _playerId_decorators;
    var _playerId_initializers = [];
    var _playerId_extraInitializers = [];
    var _isStarter_decorators;
    var _isStarter_initializers = [];
    var _isStarter_extraInitializers = [];
    var _slotIndex_decorators;
    var _slotIndex_initializers = [];
    var _slotIndex_extraInitializers = [];
    var TeamPlayerEntity = _classThis = /** @class */ (function () {
        function TeamPlayerEntity_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.teamId = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _teamId_initializers, void 0));
            this.playerId = (__runInitializers(this, _teamId_extraInitializers), __runInitializers(this, _playerId_initializers, void 0));
            this.isStarter = (__runInitializers(this, _playerId_extraInitializers), __runInitializers(this, _isStarter_initializers, void 0));
            this.slotIndex = (__runInitializers(this, _isStarter_extraInitializers), __runInitializers(this, _slotIndex_initializers, void 0));
            __runInitializers(this, _slotIndex_extraInitializers);
        }
        return TeamPlayerEntity_1;
    }());
    __setFunctionName(_classThis, "TeamPlayerEntity");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _teamId_decorators = [(0, typeorm_1.Column)()];
        _playerId_decorators = [(0, typeorm_1.Column)()];
        _isStarter_decorators = [(0, typeorm_1.Column)({ default: false })];
        _slotIndex_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 0 })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _teamId_decorators, { kind: "field", name: "teamId", static: false, private: false, access: { has: function (obj) { return "teamId" in obj; }, get: function (obj) { return obj.teamId; }, set: function (obj, value) { obj.teamId = value; } }, metadata: _metadata }, _teamId_initializers, _teamId_extraInitializers);
        __esDecorate(null, null, _playerId_decorators, { kind: "field", name: "playerId", static: false, private: false, access: { has: function (obj) { return "playerId" in obj; }, get: function (obj) { return obj.playerId; }, set: function (obj, value) { obj.playerId = value; } }, metadata: _metadata }, _playerId_initializers, _playerId_extraInitializers);
        __esDecorate(null, null, _isStarter_decorators, { kind: "field", name: "isStarter", static: false, private: false, access: { has: function (obj) { return "isStarter" in obj; }, get: function (obj) { return obj.isStarter; }, set: function (obj, value) { obj.isStarter = value; } }, metadata: _metadata }, _isStarter_initializers, _isStarter_extraInitializers);
        __esDecorate(null, null, _slotIndex_decorators, { kind: "field", name: "slotIndex", static: false, private: false, access: { has: function (obj) { return "slotIndex" in obj; }, get: function (obj) { return obj.slotIndex; }, set: function (obj, value) { obj.slotIndex = value; } }, metadata: _metadata }, _slotIndex_initializers, _slotIndex_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TeamPlayerEntity = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TeamPlayerEntity = _classThis;
}();
exports.TeamPlayerEntity = TeamPlayerEntity;
