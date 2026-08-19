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
exports.MatchEntity = void 0;
var typeorm_1 = require("typeorm");
var MatchEntity = function () {
    var _classDecorators = [(0, typeorm_1.Entity)('matches')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _id_decorators;
    var _id_initializers = [];
    var _id_extraInitializers = [];
    var _tournamentId_decorators;
    var _tournamentId_initializers = [];
    var _tournamentId_extraInitializers = [];
    var _round_decorators;
    var _round_initializers = [];
    var _round_extraInitializers = [];
    var _userId_decorators;
    var _userId_initializers = [];
    var _userId_extraInitializers = [];
    var _homeTeamId_decorators;
    var _homeTeamId_initializers = [];
    var _homeTeamId_extraInitializers = [];
    var _awayTeamId_decorators;
    var _awayTeamId_initializers = [];
    var _awayTeamId_extraInitializers = [];
    var _homeScore_decorators;
    var _homeScore_initializers = [];
    var _homeScore_extraInitializers = [];
    var _awayScore_decorators;
    var _awayScore_initializers = [];
    var _awayScore_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _winnerId_decorators;
    var _winnerId_initializers = [];
    var _winnerId_extraInitializers = [];
    var MatchEntity = _classThis = /** @class */ (function () {
        function MatchEntity_1() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.tournamentId = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _tournamentId_initializers, void 0));
            this.round = (__runInitializers(this, _tournamentId_extraInitializers), __runInitializers(this, _round_initializers, void 0));
            this.userId = (__runInitializers(this, _round_extraInitializers), __runInitializers(this, _userId_initializers, void 0));
            this.homeTeamId = (__runInitializers(this, _userId_extraInitializers), __runInitializers(this, _homeTeamId_initializers, void 0));
            this.awayTeamId = (__runInitializers(this, _homeTeamId_extraInitializers), __runInitializers(this, _awayTeamId_initializers, void 0));
            this.homeScore = (__runInitializers(this, _awayTeamId_extraInitializers), __runInitializers(this, _homeScore_initializers, void 0));
            this.awayScore = (__runInitializers(this, _homeScore_extraInitializers), __runInitializers(this, _awayScore_initializers, void 0));
            this.status = (__runInitializers(this, _awayScore_extraInitializers), __runInitializers(this, _status_initializers, void 0));
            this.winnerId = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _winnerId_initializers, void 0));
            __runInitializers(this, _winnerId_extraInitializers);
        }
        return MatchEntity_1;
    }());
    __setFunctionName(_classThis, "MatchEntity");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryColumn)({ type: 'text' })];
        _tournamentId_decorators = [(0, typeorm_1.Column)({ length: 50, nullable: true })];
        _round_decorators = [(0, typeorm_1.Column)({ length: 20, default: 'OCTAVOS' })];
        _userId_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        _homeTeamId_decorators = [(0, typeorm_1.Column)()];
        _awayTeamId_decorators = [(0, typeorm_1.Column)()];
        _homeScore_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 0 })];
        _awayScore_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 0 })];
        _status_decorators = [(0, typeorm_1.Column)({ length: 20, default: 'PENDING' })];
        _winnerId_decorators = [(0, typeorm_1.Column)({ nullable: true })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: function (obj) { return "id" in obj; }, get: function (obj) { return obj.id; }, set: function (obj, value) { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _tournamentId_decorators, { kind: "field", name: "tournamentId", static: false, private: false, access: { has: function (obj) { return "tournamentId" in obj; }, get: function (obj) { return obj.tournamentId; }, set: function (obj, value) { obj.tournamentId = value; } }, metadata: _metadata }, _tournamentId_initializers, _tournamentId_extraInitializers);
        __esDecorate(null, null, _round_decorators, { kind: "field", name: "round", static: false, private: false, access: { has: function (obj) { return "round" in obj; }, get: function (obj) { return obj.round; }, set: function (obj, value) { obj.round = value; } }, metadata: _metadata }, _round_initializers, _round_extraInitializers);
        __esDecorate(null, null, _userId_decorators, { kind: "field", name: "userId", static: false, private: false, access: { has: function (obj) { return "userId" in obj; }, get: function (obj) { return obj.userId; }, set: function (obj, value) { obj.userId = value; } }, metadata: _metadata }, _userId_initializers, _userId_extraInitializers);
        __esDecorate(null, null, _homeTeamId_decorators, { kind: "field", name: "homeTeamId", static: false, private: false, access: { has: function (obj) { return "homeTeamId" in obj; }, get: function (obj) { return obj.homeTeamId; }, set: function (obj, value) { obj.homeTeamId = value; } }, metadata: _metadata }, _homeTeamId_initializers, _homeTeamId_extraInitializers);
        __esDecorate(null, null, _awayTeamId_decorators, { kind: "field", name: "awayTeamId", static: false, private: false, access: { has: function (obj) { return "awayTeamId" in obj; }, get: function (obj) { return obj.awayTeamId; }, set: function (obj, value) { obj.awayTeamId = value; } }, metadata: _metadata }, _awayTeamId_initializers, _awayTeamId_extraInitializers);
        __esDecorate(null, null, _homeScore_decorators, { kind: "field", name: "homeScore", static: false, private: false, access: { has: function (obj) { return "homeScore" in obj; }, get: function (obj) { return obj.homeScore; }, set: function (obj, value) { obj.homeScore = value; } }, metadata: _metadata }, _homeScore_initializers, _homeScore_extraInitializers);
        __esDecorate(null, null, _awayScore_decorators, { kind: "field", name: "awayScore", static: false, private: false, access: { has: function (obj) { return "awayScore" in obj; }, get: function (obj) { return obj.awayScore; }, set: function (obj, value) { obj.awayScore = value; } }, metadata: _metadata }, _awayScore_initializers, _awayScore_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _winnerId_decorators, { kind: "field", name: "winnerId", static: false, private: false, access: { has: function (obj) { return "winnerId" in obj; }, get: function (obj) { return obj.winnerId; }, set: function (obj, value) { obj.winnerId = value; } }, metadata: _metadata }, _winnerId_initializers, _winnerId_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MatchEntity = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MatchEntity = _classThis;
}();
exports.MatchEntity = MatchEntity;
