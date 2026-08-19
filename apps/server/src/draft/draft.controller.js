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
exports.DraftController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var SelectPlayerDto = function () {
    var _a;
    var _playerId_decorators;
    var _playerId_initializers = [];
    var _playerId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function SelectPlayerDto() {
                this.playerId = __runInitializers(this, _playerId_initializers, void 0);
                __runInitializers(this, _playerId_extraInitializers);
            }
            return SelectPlayerDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _playerId_decorators = [(0, swagger_1.ApiProperty)({ example: 'player-1', description: 'ID del jugador' })];
            __esDecorate(null, null, _playerId_decorators, { kind: "field", name: "playerId", static: false, private: false, access: { has: function (obj) { return "playerId" in obj; }, get: function (obj) { return obj.playerId; }, set: function (obj, value) { obj.playerId = value; } }, metadata: _metadata }, _playerId_initializers, _playerId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var AddPlayerToTeamDto = function () {
    var _a;
    var _teamId_decorators;
    var _teamId_initializers = [];
    var _teamId_extraInitializers = [];
    var _playerId_decorators;
    var _playerId_initializers = [];
    var _playerId_extraInitializers = [];
    var _isStarter_decorators;
    var _isStarter_initializers = [];
    var _isStarter_extraInitializers = [];
    return _a = /** @class */ (function () {
            function AddPlayerToTeamDto() {
                this.teamId = __runInitializers(this, _teamId_initializers, void 0);
                this.playerId = (__runInitializers(this, _teamId_extraInitializers), __runInitializers(this, _playerId_initializers, void 0));
                this.isStarter = (__runInitializers(this, _playerId_extraInitializers), __runInitializers(this, _isStarter_initializers, void 0));
                __runInitializers(this, _isStarter_extraInitializers);
            }
            return AddPlayerToTeamDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _teamId_decorators = [(0, swagger_1.ApiProperty)({ example: 'team-uuid', description: 'ID del equipo' })];
            _playerId_decorators = [(0, swagger_1.ApiProperty)({ example: 'player-uuid', description: 'ID del jugador' })];
            _isStarter_decorators = [(0, swagger_1.ApiProperty)({ example: true, description: 'true = titular, false = suplente', required: false })];
            __esDecorate(null, null, _teamId_decorators, { kind: "field", name: "teamId", static: false, private: false, access: { has: function (obj) { return "teamId" in obj; }, get: function (obj) { return obj.teamId; }, set: function (obj, value) { obj.teamId = value; } }, metadata: _metadata }, _teamId_initializers, _teamId_extraInitializers);
            __esDecorate(null, null, _playerId_decorators, { kind: "field", name: "playerId", static: false, private: false, access: { has: function (obj) { return "playerId" in obj; }, get: function (obj) { return obj.playerId; }, set: function (obj, value) { obj.playerId = value; } }, metadata: _metadata }, _playerId_initializers, _playerId_extraInitializers);
            __esDecorate(null, null, _isStarter_decorators, { kind: "field", name: "isStarter", static: false, private: false, access: { has: function (obj) { return "isStarter" in obj; }, get: function (obj) { return obj.isStarter; }, set: function (obj, value) { obj.isStarter = value; } }, metadata: _metadata }, _isStarter_initializers, _isStarter_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var CreateTeamDto = function () {
    var _a;
    var _userId_decorators;
    var _userId_initializers = [];
    var _userId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateTeamDto() {
                this.userId = __runInitializers(this, _userId_initializers, void 0);
                __runInitializers(this, _userId_extraInitializers);
            }
            return CreateTeamDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _userId_decorators = [(0, swagger_1.ApiProperty)({ example: 'user-uuid', description: 'ID del usuario (opcional)', required: false })];
            __esDecorate(null, null, _userId_decorators, { kind: "field", name: "userId", static: false, private: false, access: { has: function (obj) { return "userId" in obj; }, get: function (obj) { return obj.userId; }, set: function (obj, value) { obj.userId = value; } }, metadata: _metadata }, _userId_initializers, _userId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var DraftController = function () {
    var _classDecorators = [(0, common_1.Controller)('draft'), (0, swagger_1.ApiTags)('Draft')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getPack_decorators;
    var _selectPlayer_decorators;
    var _createTeam_decorators;
    var _addPlayerToTeam_decorators;
    var _removePlayerFromTeam_decorators;
    var DraftController = _classThis = /** @class */ (function () {
        function DraftController_1(draftService) {
            this.draftService = (__runInitializers(this, _instanceExtraInitializers), draftService);
        }
        DraftController_1.prototype.getPack = function (position) {
            return this.draftService.getPack(position);
        };
        DraftController_1.prototype.selectPlayer = function (body) {
            return this.draftService.selectPlayer(body.playerId);
        };
        DraftController_1.prototype.createTeam = function (body) {
            return this.draftService.createTeam(body.userId);
        };
        DraftController_1.prototype.addPlayerToTeam = function (body) {
            return this.draftService.addPlayerToTeam(body.teamId, body.playerId, body.isStarter);
        };
        DraftController_1.prototype.removePlayerFromTeam = function (teamId, playerId) {
            return this.draftService.removePlayerFromTeam(teamId, playerId);
        };
        return DraftController_1;
    }());
    __setFunctionName(_classThis, "DraftController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getPack_decorators = [(0, common_1.Get)('pack'), (0, swagger_1.ApiOperation)({ summary: 'Obtener un sobre aleatorio de 5 jugadores desde la DB' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Sobre de jugadores generado.' })];
        _selectPlayer_decorators = [(0, common_1.Post)('select'), (0, swagger_1.ApiOperation)({ summary: 'Verificar que un jugador existe en la DB' }), (0, swagger_1.ApiBody)({ type: SelectPlayerDto })];
        _createTeam_decorators = [(0, common_1.Post)('team'), (0, swagger_1.ApiOperation)({ summary: 'Crear un nuevo equipo vacío' }), (0, swagger_1.ApiBody)({ type: CreateTeamDto })];
        _addPlayerToTeam_decorators = [(0, common_1.Post)('team/player'), (0, swagger_1.ApiOperation)({ summary: 'Agregar un jugador al equipo (máx 11 titulares)' }), (0, swagger_1.ApiBody)({ type: AddPlayerToTeamDto })];
        _removePlayerFromTeam_decorators = [(0, common_1.Delete)('team/:teamId/player/:playerId'), (0, swagger_1.ApiOperation)({ summary: 'Eliminar un jugador del equipo' })];
        __esDecorate(_classThis, null, _getPack_decorators, { kind: "method", name: "getPack", static: false, private: false, access: { has: function (obj) { return "getPack" in obj; }, get: function (obj) { return obj.getPack; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _selectPlayer_decorators, { kind: "method", name: "selectPlayer", static: false, private: false, access: { has: function (obj) { return "selectPlayer" in obj; }, get: function (obj) { return obj.selectPlayer; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _createTeam_decorators, { kind: "method", name: "createTeam", static: false, private: false, access: { has: function (obj) { return "createTeam" in obj; }, get: function (obj) { return obj.createTeam; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _addPlayerToTeam_decorators, { kind: "method", name: "addPlayerToTeam", static: false, private: false, access: { has: function (obj) { return "addPlayerToTeam" in obj; }, get: function (obj) { return obj.addPlayerToTeam; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _removePlayerFromTeam_decorators, { kind: "method", name: "removePlayerFromTeam", static: false, private: false, access: { has: function (obj) { return "removePlayerFromTeam" in obj; }, get: function (obj) { return obj.removePlayerFromTeam; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DraftController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DraftController = _classThis;
}();
exports.DraftController = DraftController;
