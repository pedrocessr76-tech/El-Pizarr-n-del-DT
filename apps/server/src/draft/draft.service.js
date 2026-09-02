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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftService = void 0;
var common_1 = require("@nestjs/common");
var team_entity_1 = require("../team/team.entity");
var team_player_entity_1 = require("../team/team-player.entity");
var DraftService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var DraftService = _classThis = /** @class */ (function () {
        function DraftService_1(playerRepo, teamRepo, teamPlayerRepo) {
            this.playerRepo = playerRepo;
            this.teamRepo = teamRepo;
            this.teamPlayerRepo = teamPlayerRepo;
        }
        DraftService_1.prototype.toPlayer = function (entity) {
            return {
                id: entity.id,
                name: entity.name,
                nationality: entity.nationality,
                position: entity.position,
                rating: entity.rating,
                stats: {
                    pace: entity.pace,
                    shooting: entity.shooting,
                    passing: entity.passing,
                    dribbling: entity.dribbling,
                    defending: entity.defending,
                    physical: entity.physical,
                },
            };
        };
        DraftService_1.prototype.getPack = function (position) {
            return __awaiter(this, void 0, void 0, function () {
                var count, randomPlayers, compatiblePositions, positionsToSearch, players;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.playerRepo.count()];
                        case 1:
                            count = _a.sent();
                            if (count === 0) {
                                return [2 /*return*/, { players: [] }];
                            }
                            if (!(!position || position === 'ANY')) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.playerRepo
                                    .createQueryBuilder('p')
                                    .orderBy('RANDOM()')
                                    .take(5)
                                    .getMany()];
                        case 2:
                            randomPlayers = _a.sent();
                            return [2 /*return*/, { players: randomPlayers.map(function (p) { return _this.toPlayer(p); }) }];
                        case 3:
                            compatiblePositions = {
                                'POR': ['POR'],
                                'LD': ['LD', 'DFC'],
                                'LI': ['LI', 'DFC'],
                                'DFC': ['DFC', 'LD', 'LI'],
                                'MCD': ['MCD', 'MC', 'MCO'],
                                'MC': ['MC', 'MCD', 'MCO'],
                                'MCO': ['MCO', 'MC', 'MCD'],
                                'MD': ['MD', 'ED', 'MC'],
                                'MI': ['MI', 'EI', 'MC'],
                                'ED': ['ED', 'MD', 'EI', 'SD'],
                                'EI': ['EI', 'MI', 'ED', 'SD'],
                                'SD': ['SD', 'DC', 'ST', 'ED', 'EI'],
                                'DC': ['DC', 'ST', 'SD'],
                                'ST': ['ST', 'DC', 'SD'],
                            };
                            positionsToSearch = compatiblePositions[position.toUpperCase()] || [position.toUpperCase()];
                            return [4 /*yield*/, this.playerRepo
                                    .createQueryBuilder('p')
                                    .where('UPPER(p.position) IN (:...positions)', { positions: positionsToSearch })
                                    .orderBy('RANDOM()')
                                    .take(5)
                                    .getMany()];
                        case 4:
                            players = _a.sent();
                            return [2 /*return*/, { players: players.map(function (p) { return _this.toPlayer(p); }) }];
                    }
                });
            });
        };
        DraftService_1.prototype.selectPlayer = function (playerId) {
            return __awaiter(this, void 0, void 0, function () {
                var playerEntity, player;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.playerRepo.findOne({ where: { id: playerId } })];
                        case 1:
                            playerEntity = _a.sent();
                            if (!playerEntity) {
                                throw new common_1.NotFoundException('Jugador no encontrado en la base de datos.');
                            }
                            player = this.toPlayer(playerEntity);
                            return [2 /*return*/, {
                                    success: true,
                                    player: player,
                                    message: 'Jugador encontrado. Listo para seleccionar.',
                                }];
                    }
                });
            });
        };
        DraftService_1.prototype.createTeam = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var team;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            team = new team_entity_1.TeamEntity();
                            team.id = crypto.randomUUID();
                            team.name = 'Mi Equipo';
                            team.userId = userId;
                            team.isReal = false; // El equipo del usuario nunca es un oponente IA real
                            return [4 /*yield*/, this.teamRepo.save(team)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, { teamId: team.id }];
                    }
                });
            });
        };
        DraftService_1.prototype.addPlayerToTeam = function (teamId_1, playerId_1) {
            return __awaiter(this, arguments, void 0, function (teamId, playerId, isStarter) {
                var team, player, existing, starterCount, substituteCount, tp;
                if (isStarter === void 0) { isStarter = true; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.teamRepo.findOne({ where: { id: teamId } })];
                        case 1:
                            team = _a.sent();
                            if (!team) {
                                throw new common_1.NotFoundException('Equipo no encontrado.');
                            }
                            return [4 /*yield*/, this.playerRepo.findOne({ where: { id: playerId } })];
                        case 2:
                            player = _a.sent();
                            if (!player) {
                                throw new common_1.NotFoundException('Jugador no encontrado.');
                            }
                            return [4 /*yield*/, this.teamPlayerRepo.findOne({ where: { teamId: teamId, playerId: playerId } })];
                        case 3:
                            existing = _a.sent();
                            if (existing) {
                                throw new common_1.BadRequestException('El jugador ya está en el equipo.');
                            }
                            return [4 /*yield*/, this.teamPlayerRepo.count({ where: { teamId: teamId, isStarter: true } })];
                        case 4:
                            starterCount = _a.sent();
                            return [4 /*yield*/, this.teamPlayerRepo.count({ where: { teamId: teamId, isStarter: false } })];
                        case 5:
                            substituteCount = _a.sent();
                            // Validación de plantilla máxima (11 titulares + 7 suplentes = 18)
                            if (starterCount + substituteCount >= 18) {
                                throw new common_1.BadRequestException('El equipo ya tiene 18 jugadores (11 titulares + 7 suplentes).');
                            }
                            if (isStarter) {
                                if (starterCount >= 11) {
                                    throw new common_1.BadRequestException('El equipo ya tiene 11 jugadores titulares.');
                                }
                            }
                            else {
                                if (substituteCount >= 7) {
                                    throw new common_1.BadRequestException('El equipo ya tiene 7 jugadores suplentes.');
                                }
                            }
                            tp = new team_player_entity_1.TeamPlayerEntity();
                            tp.teamId = teamId;
                            tp.playerId = playerId;
                            tp.isStarter = isStarter;
                            tp.slotIndex = isStarter ? starterCount : substituteCount;
                            return [4 /*yield*/, this.teamPlayerRepo.save(tp)];
                        case 6:
                            _a.sent();
                            return [2 /*return*/, { success: true, message: isStarter ? 'Jugador agregado al equipo.' : 'Suplente agregado al equipo.' }];
                    }
                });
            });
        };
        DraftService_1.prototype.removePlayerFromTeam = function (teamId, playerId) {
            return __awaiter(this, void 0, void 0, function () {
                var tp;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.teamPlayerRepo.findOne({ where: { teamId: teamId, playerId: playerId } })];
                        case 1:
                            tp = _a.sent();
                            if (!tp) {
                                throw new common_1.NotFoundException('El jugador no está en el equipo.');
                            }
                            return [4 /*yield*/, this.teamPlayerRepo.remove(tp)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { success: true, message: 'Jugador eliminado del equipo.' }];
                    }
                });
            });
        };
        return DraftService_1;
    }());
    __setFunctionName(_classThis, "DraftService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DraftService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DraftService = _classThis;
}();
exports.DraftService = DraftService;
