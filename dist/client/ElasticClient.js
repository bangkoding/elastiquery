"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticClient = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
class ElasticClient {
    static getInstance(config) {
        if (!ElasticClient.instance) {
            if (!config) {
                throw new Error('Elasticsearch client not initialized. Provide config.');
            }
            ElasticClient.instance = new elasticsearch_1.Client(config);
        }
        return ElasticClient.instance;
    }
}
exports.ElasticClient = ElasticClient;
