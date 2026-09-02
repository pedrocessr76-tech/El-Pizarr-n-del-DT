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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchService = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("typeorm");
var match_entity_1 = require("./entities/match.entity");
var tournament_entity_1 = require("./entities/tournament.entity");
var crypto = require("crypto");
var MatchService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var MatchService = _classThis = /** @class */ (function () {
        function MatchService_1(playerRepo, teamRepo, teamPlayerRepo, matchRepo, tournamentRepo) {
            this.playerRepo = playerRepo;
            this.teamRepo = teamRepo;
            this.teamPlayerRepo = teamPlayerRepo;
            this.matchRepo = matchRepo;
            this.tournamentRepo = tournamentRepo;
        }
        MatchService_1.prototype.toPlayer = function (entity) {
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
        MatchService_1.prototype.getTeamById = function (teamId) {
            return __awaiter(this, void 0, void 0, function () {
                var teamEntity, teamPlayers, playerIds, playerEntities, playerMap, starters, substitutes, _i, teamPlayers_1, tp, player;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.teamRepo.findOne({ where: { id: teamId } })];
                        case 1:
                            teamEntity = _a.sent();
                            if (!teamEntity)
                                return [2 /*return*/, null];
                            return [4 /*yield*/, this.teamPlayerRepo.find({
                                    where: { teamId: teamId },
                                    order: { slotIndex: 'ASC' },
                                })];
                        case 2:
                            teamPlayers = _a.sent();
                            playerIds = teamPlayers.map(function (tp) { return tp.playerId; });
                            return [4 /*yield*/, this.playerRepo.find({ where: { id: (0, typeorm_1.In)(playerIds) } })];
                        case 3:
                            playerEntities = _a.sent();
                            playerMap = new Map(playerEntities.map(function (p) { return [p.id, _this.toPlayer(p)]; }));
                            starters = [];
                            substitutes = [];
                            for (_i = 0, teamPlayers_1 = teamPlayers; _i < teamPlayers_1.length; _i++) {
                                tp = teamPlayers_1[_i];
                                player = playerMap.get(tp.playerId);
                                if (player) {
                                    if (tp.isStarter) {
                                        starters.push(player);
                                    }
                                    else {
                                        substitutes.push(player);
                                    }
                                }
                            }
                            return [2 /*return*/, {
                                    id: teamEntity.id,
                                    name: teamEntity.name,
                                    starters: starters,
                                    substitutes: substitutes,
                                }];
                    }
                });
            });
        };
        MatchService_1.prototype.sumTeamStats = function (team) {
            return team.starters.reduce(function (total, player) {
                return total + player.stats.pace + player.stats.shooting + player.stats.passing + player.stats.dribbling + player.stats.defending + player.stats.physical;
            }, 0);
        };
        MatchService_1.prototype.simulateMatch = function (matchId) {
            return __awaiter(this, void 0, void 0, function () {
                var matchEntity, homeTeam, awayTeam, homeScoreValue, awayScoreValue, scoreDiff, homeScore, awayScore, winnerId;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.matchRepo.findOne({ where: { id: matchId } })];
                        case 1:
                            matchEntity = _a.sent();
                            if (!matchEntity)
                                throw new common_1.NotFoundException('Partido no encontrado.');
                            return [4 /*yield*/, this.getTeamById(matchEntity.homeTeamId)];
                        case 2:
                            homeTeam = _a.sent();
                            return [4 /*yield*/, this.getTeamById(matchEntity.awayTeamId)];
                        case 3:
                            awayTeam = _a.sent();
                            if (!homeTeam || !awayTeam)
                                throw new common_1.NotFoundException('Equipo no encontrado.');
                            homeScoreValue = this.sumTeamStats(homeTeam);
                            awayScoreValue = this.sumTeamStats(awayTeam);
                            scoreDiff = (homeScoreValue - awayScoreValue) / 66;
                            homeScore = Math.max(0, Math.round(Math.random() * 3 + scoreDiff));
                            awayScore = Math.max(0, Math.round(Math.random() * 3 - scoreDiff));
                            winnerId = homeScore > awayScore ? homeTeam.id : homeScore < awayScore ? awayTeam.id : undefined;
                            if (homeScore === awayScore) {
                                winnerId = Math.random() + (scoreDiff / 10) > 0.5 ? homeTeam.id : awayTeam.id;
                            }
                            matchEntity.homeScore = homeScore;
                            matchEntity.awayScore = awayScore;
                            matchEntity.status = 'FINISHED';
                            matchEntity.winnerId = winnerId;
                            return [4 /*yield*/, this.matchRepo.save(matchEntity)];
                        case 4:
                            _a.sent();
                            return [2 /*return*/, {
                                    id: matchEntity.id,
                                    homeTeam: homeTeam,
                                    awayTeam: awayTeam,
                                    homeScore: homeScore,
                                    awayScore: awayScore,
                                    status: 'FINISHED',
                                    winnerId: winnerId,
                                }];
                    }
                });
            });
        };
        MatchService_1.prototype.createTournament = function (userTeamId, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var userTeam, allAvailableTeams, opponentEntities, opponents, _i, opponentEntities_1, entity, team, allTeams, tournamentId, tournamentEntity, matches, i, matchEntity;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getTeamById(userTeamId)];
                        case 1:
                            userTeam = _a.sent();
                            if (!userTeam)
                                throw new common_1.NotFoundException('Equipo de usuario no encontrado.');
                            return [4 /*yield*/, this.teamRepo.find({ where: { isReal: true } })];
                        case 2:
                            allAvailableTeams = _a.sent();
                            opponentEntities = allAvailableTeams
                                .filter(function (t) { return t.id !== userTeamId; })
                                .sort(function () { return 0.5 - Math.random(); })
                                .slice(0, 15);
                            opponents = [];
                            _i = 0, opponentEntities_1 = opponentEntities;
                            _a.label = 3;
                        case 3:
                            if (!(_i < opponentEntities_1.length)) return [3 /*break*/, 6];
                            entity = opponentEntities_1[_i];
                            return [4 /*yield*/, this.getTeamById(entity.id)];
                        case 4:
                            team = _a.sent();
                            if (team)
                                opponents.push(team);
                            _a.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 3];
                        case 6:
                            allTeams = __spreadArray([userTeam], opponents, true).sort(function () { return 0.5 - Math.random(); });
                            tournamentId = crypto.randomUUID();
                            tournamentEntity = new tournament_entity_1.TournamentEntity();
                            tournamentEntity.id = tournamentId;
                            tournamentEntity.userId = userId;
                            tournamentEntity.userTeamId = userTeamId;
                            tournamentEntity.status = 'IN_PROGRESS';
                            tournamentEntity.currentRound = 'OCTAVOS';
                            return [4 /*yield*/, this.tournamentRepo.save(tournamentEntity)];
                        case 7:
                            _a.sent();
                            matches = [];
                            i = 0;
                            _a.label = 8;
                        case 8:
                            if (!(i < allTeams.length)) return [3 /*break*/, 11];
                            matchEntity = new match_entity_1.MatchEntity();
                            matchEntity.id = crypto.randomUUID();
                            matchEntity.tournamentId = tournamentId;
                            matchEntity.round = 'OCTAVOS';
                            matchEntity.userId = userId;
                            matchEntity.homeTeamId = allTeams[i].id;
                            matchEntity.awayTeamId = allTeams[i + 1].id;
                            matchEntity.homeScore = 0;
                            matchEntity.awayScore = 0;
                            matchEntity.status = 'PENDING';
                            return [4 /*yield*/, this.matchRepo.save(matchEntity)];
                        case 9:
                            _a.sent();
                            matches.push({
                                id: matchEntity.id,
                                homeTeam: allTeams[i],
                                awayTeam: allTeams[i + 1],
                                homeScore: 0,
                                awayScore: 0,
                                status: 'PENDING',
                            });
                            _a.label = 10;
                        case 10:
                            i += 2;
                            return [3 /*break*/, 8];
                        case 11: return [2 /*return*/, {
                                id: tournamentId,
                                userTeam: userTeam,
                                opponents: opponents,
                                rounds: { OCTAVOS: matches, CUARTOS: [], SEMIS: [], FINAL: [] },
                                currentRound: 'OCTAVOS',
                                status: 'IN_PROGRESS',
                            }];
                    }
                });
            });
        };
        MatchService_1.prototype.getTournament = function (tournamentId) {
            return __awaiter(this, void 0, void 0, function () {
                var matches, rounds, _i, matches_1, m;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.matchRepo.find({ where: { tournamentId: tournamentId } })];
                        case 1:
                            matches = _a.sent();
                            rounds = {};
                            for (_i = 0, matches_1 = matches; _i < matches_1.length; _i++) {
                                m = matches_1[_i];
                                if (!rounds[m.round])
                                    rounds[m.round] = [];
                                rounds[m.round].push(m);
                            }
                            return [2 /*return*/, { rounds: rounds }];
                    }
                });
            });
        };
        return MatchService_1;
    }());
    __setFunctionName(_classThis, "MatchService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MatchService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MatchService = _classThis;
}();
exports.MatchService = MatchService;
