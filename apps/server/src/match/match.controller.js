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
exports.MatchController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var CreateTournamentDto = function () {
    var _a;
    var _userTeamId_decorators;
    var _userTeamId_initializers = [];
    var _userTeamId_extraInitializers = [];
    var _userId_decorators;
    var _userId_initializers = [];
    var _userId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateTournamentDto() {
                this.userTeamId = __runInitializers(this, _userTeamId_initializers, void 0);
                this.userId = (__runInitializers(this, _userTeamId_extraInitializers), __runInitializers(this, _userId_initializers, void 0));
                __runInitializers(this, _userId_extraInitializers);
            }
            return CreateTournamentDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _userTeamId_decorators = [(0, swagger_1.ApiProperty)({ example: 'team-uuid', description: 'ID del equipo del usuario' })];
            _userId_decorators = [(0, swagger_1.ApiProperty)({ example: 'user-uuid', required: false, description: 'ID del usuario (opcional)' })];
            __esDecorate(null, null, _userTeamId_decorators, { kind: "field", name: "userTeamId", static: false, private: false, access: { has: function (obj) { return "userTeamId" in obj; }, get: function (obj) { return obj.userTeamId; }, set: function (obj, value) { obj.userTeamId = value; } }, metadata: _metadata }, _userTeamId_initializers, _userTeamId_extraInitializers);
            __esDecorate(null, null, _userId_decorators, { kind: "field", name: "userId", static: false, private: false, access: { has: function (obj) { return "userId" in obj; }, get: function (obj) { return obj.userId; }, set: function (obj, value) { obj.userId = value; } }, metadata: _metadata }, _userId_initializers, _userId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var SimulateMatchDto = function () {
    var _a;
    var _matchId_decorators;
    var _matchId_initializers = [];
    var _matchId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function SimulateMatchDto() {
                this.matchId = __runInitializers(this, _matchId_initializers, void 0);
                __runInitializers(this, _matchId_extraInitializers);
            }
            return SimulateMatchDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _matchId_decorators = [(0, swagger_1.ApiProperty)({ example: 'match-uuid', description: 'ID del partido a simular' })];
            __esDecorate(null, null, _matchId_decorators, { kind: "field", name: "matchId", static: false, private: false, access: { has: function (obj) { return "matchId" in obj; }, get: function (obj) { return obj.matchId; }, set: function (obj, value) { obj.matchId = value; } }, metadata: _metadata }, _matchId_initializers, _matchId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var MatchController = function () {
    var _classDecorators = [(0, common_1.Controller)('match'), (0, swagger_1.ApiTags)('Match')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _createTournament_decorators;
    var _simulateMatch_decorators;
    var _getTournament_decorators;
    var _getTeam_decorators;
    var MatchController = _classThis = /** @class */ (function () {
        function MatchController_1(matchService) {
            this.matchService = (__runInitializers(this, _instanceExtraInitializers), matchService);
        }
        MatchController_1.prototype.createTournament = function (body) {
            return this.matchService.createTournament(body.userTeamId, body.userId);
        };
        MatchController_1.prototype.simulateMatch = function (body) {
            return this.matchService.simulateMatch(body.matchId);
        };
        MatchController_1.prototype.getTournament = function (id) {
            return this.matchService.getTournament(id);
        };
        MatchController_1.prototype.getTeam = function (id) {
            return this.matchService.getTeamById(id);
        };
        return MatchController_1;
    }());
    __setFunctionName(_classThis, "MatchController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _createTournament_decorators = [(0, common_1.Post)('tournament/create'), (0, swagger_1.ApiOperation)({ summary: 'Crear un torneo desde un equipo persistido.' }), (0, swagger_1.ApiBody)({ type: CreateTournamentDto })];
        _simulateMatch_decorators = [(0, common_1.Post)('tournament/simulate-match'), (0, swagger_1.ApiOperation)({ summary: 'Simular un partido del torneo y persistir resultado.' }), (0, swagger_1.ApiBody)({ type: SimulateMatchDto })];
        _getTournament_decorators = [(0, common_1.Get)('tournament/:id'), (0, swagger_1.ApiOperation)({ summary: 'Obtener el estado actual de un torneo' })];
        _getTeam_decorators = [(0, common_1.Get)('team/:id'), (0, swagger_1.ApiOperation)({ summary: 'Obtener un equipo con sus jugadores' })];
        __esDecorate(_classThis, null, _createTournament_decorators, { kind: "method", name: "createTournament", static: false, private: false, access: { has: function (obj) { return "createTournament" in obj; }, get: function (obj) { return obj.createTournament; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _simulateMatch_decorators, { kind: "method", name: "simulateMatch", static: false, private: false, access: { has: function (obj) { return "simulateMatch" in obj; }, get: function (obj) { return obj.simulateMatch; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getTournament_decorators, { kind: "method", name: "getTournament", static: false, private: false, access: { has: function (obj) { return "getTournament" in obj; }, get: function (obj) { return obj.getTournament; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getTeam_decorators, { kind: "method", name: "getTeam", static: false, private: false, access: { has: function (obj) { return "getTeam" in obj; }, get: function (obj) { return obj.getTeam; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MatchController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MatchController = _classThis;
}();
exports.MatchController = MatchController;
