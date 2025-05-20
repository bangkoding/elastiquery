"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const ElasticClient_1 = require("../client/ElasticClient");
class BaseRepository {
    constructor(entity) {
        this.client = ElasticClient_1.ElasticClient.getInstance();
        this.index = entity.index;
    }
    async create(doc) {
        if (doc.beforeCreate)
            await doc.beforeCreate();
        const body = doc.toDocument ? doc.toDocument() : doc;
        const result = await this.client.index({
            index: this.index,
            document: body,
        });
        if (doc.afterCreate)
            await doc.afterCreate();
        return result;
    }
    async createMany(docs) {
        const body = docs.flatMap(doc => [{ index: { _index: this.index } }, doc.toDocument ? doc.toDocument() : doc]);
        return this.client.bulk({ refresh: true, body });
    }
    async findById(id) {
        return this.client.get({
            index: this.index,
            id,
        });
    }
    async findOne(queryBuilder) {
        const body = queryBuilder.limit(1).build();
        const result = await this.client.search({
            index: this.index,
            ...body,
        });
        return result.hits?.hits?.[0]?._source || null;
    }
    async findMany(queryBuilder) {
        const body = queryBuilder.build();
        const result = await this.client.search({
            index: this.index,
            ...body,
        });
        return result.hits?.hits?.map((hit) => hit._source) || [];
    }
    async update(id, partial) {
        const doc = partial;
        if (doc.beforeUpdate)
            await doc.beforeUpdate(partial);
        const result = await this.client.update({
            index: this.index,
            id,
            doc: partial,
        });
        if (doc.afterUpdate)
            await doc.afterUpdate(partial);
        return result;
    }
    async upsert(id, data) {
        return this.client.update({
            index: this.index,
            id,
            doc: data,
            doc_as_upsert: true,
        });
    }
    async delete(id, doc) {
        if (doc?.beforeDelete)
            await doc.beforeDelete();
        const result = await this.client.delete({
            index: this.index,
            id,
        });
        if (doc?.afterDelete)
            await doc.afterDelete();
        return result;
    }
    async deleteByQuery(queryBuilder) {
        const body = queryBuilder.build().query;
        return this.client.deleteByQuery({
            index: this.index,
            query: body,
        });
    }
    async paginate(queryBuilder, page = 1, perPage = 10) {
        const from = (page - 1) * perPage;
        queryBuilder.limit(perPage).offset(from);
        const body = queryBuilder.build();
        const result = await this.client.search({
            index: this.index,
            ...body,
        });
        const total = typeof result.hits?.total === 'number'
            ? result.hits.total
            : result.hits?.total?.value || 0;
        const data = result.hits?.hits?.map((hit) => hit._source) || [];
        return {
            data,
            total,
            page,
            perPage,
            totalPages: Math.ceil(total / perPage),
        };
    }
    async search(queryBuilder) {
        const body = queryBuilder.build();
        return this.client.search({
            index: this.index,
            ...body,
        });
    }
    async groupBy(queryBuilder) {
        const body = queryBuilder.build();
        const result = await this.client.search({
            index: this.index,
            ...body,
        });
        if (result.aggregations?.group_by && 'buckets' in result.aggregations.group_by) {
            return result.aggregations.group_by.buckets;
        }
        return result.aggregations;
    }
}
exports.BaseRepository = BaseRepository;
