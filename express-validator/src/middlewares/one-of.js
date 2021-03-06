"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const base_1 = require("../base");
const context_builder_1 = require("../context-builder");
function oneOf(chains, message) {
    return (req, _res, next) => __awaiter(this, void 0, void 0, function* () {
        const surrogateContext = new context_builder_1.ContextBuilder().build();
        // Run each group of chains in parallel, and within each group, run each chain in parallel too.
        const promises = chains.map((chain) => __awaiter(this, void 0, void 0, function* () {
            const group = Array.isArray(chain) ? chain : [chain];
            const contexts = yield Promise.all(group.map(chain => chain.run(req, { saveContext: false })));
            const groupErrors = _.flatMap(contexts, 'errors');
            // #536: The data from a chain within oneOf() can only be made available to e.g. matchedData()
            // if its entire group is valid.
            if (!groupErrors.length) {
                contexts.forEach(context => {
                    surrogateContext.addFieldInstances(context.getData());
                });
            }
            return groupErrors;
        }));
        req[base_1.contextsKey] = (req[base_1.contextsKey] || []).concat(surrogateContext);
        try {
            const allErrors = yield Promise.all(promises);
            const success = allErrors.some(groupErrors => groupErrors.length === 0);
            if (!success) {
                // Only add an error to the context if no group of chains had success.
                surrogateContext.addError(typeof message === 'function' ? message({ req }) : message || 'Invalid value(s)', _.flatMap(allErrors));
            }
            next();
        }
        catch (e) {
            next(e);
        }
    });
}
exports.oneOf = oneOf;
