"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseType = exports.GamePhase = exports.ActionType = exports.CharacterType = void 0;
var CharacterType;
(function (CharacterType) {
    CharacterType["DUKE"] = "duke";
    CharacterType["ASSASSIN"] = "assassin";
    CharacterType["CAPTAIN"] = "captain";
    CharacterType["AMBASSADOR"] = "ambassador";
    CharacterType["CONTESSA"] = "contessa";
    CharacterType["INQUISITOR"] = "inquisitor";
})(CharacterType || (exports.CharacterType = CharacterType = {}));
var ActionType;
(function (ActionType) {
    ActionType["INCOME"] = "income";
    ActionType["FOREIGN_AID"] = "foreign_aid";
    ActionType["COUP"] = "coup";
    ActionType["TAX"] = "tax";
    ActionType["ASSASSINATE"] = "assassinate";
    ActionType["STEAL"] = "steal";
    ActionType["EXCHANGE"] = "exchange";
    ActionType["INVESTIGATE"] = "investigate";
})(ActionType || (exports.ActionType = ActionType = {}));
var GamePhase;
(function (GamePhase) {
    GamePhase["LOBBY"] = "lobby";
    GamePhase["STARTING"] = "starting";
    GamePhase["ACTION"] = "action";
    GamePhase["RESPONSE"] = "response";
    GamePhase["CHALLENGE"] = "challenge";
    GamePhase["REVEAL"] = "reveal";
    GamePhase["ENDED"] = "ended";
})(GamePhase || (exports.GamePhase = GamePhase = {}));
var ResponseType;
(function (ResponseType) {
    ResponseType["ALLOW"] = "allow";
    ResponseType["CHALLENGE"] = "challenge";
    ResponseType["BLOCK"] = "block";
})(ResponseType || (exports.ResponseType = ResponseType = {}));
//# sourceMappingURL=game.interface.js.map