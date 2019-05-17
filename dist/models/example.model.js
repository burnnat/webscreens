"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
exports.ExampleSchema = new mongoose_1.Schema({
    name: {
        type: mongoose_1.Schema.Types.String,
        required: true
    },
    created: {
        type: mongoose_1.Schema.Types.String,
        default: Date.now()
    }
});
exports.Example = mongoose_1.model('Example', exports.ExampleSchema);
//# sourceMappingURL=example.model.js.map