"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBuilder = void 0;
class QueryBuilder {
    constructor() {
        this.conditions = [];
        this.sortFields = [];
        this.metrics = [];
    }
    where(field, operator, value) {
        this.conditions.push({ type: 'and', field, operator, value });
        return this;
    }
    andWhere(field, operator, value) {
        return this.where(field, operator, value);
    }
    orWhere(field, operator, value) {
        this.conditions.push({ type: 'or', field, operator, value });
        return this;
    }
    orderBy(field, order = 'asc') {
        this.sortFields.push({ [field]: { order } });
        return this;
    }
    limit(size) {
        this.sizeValue = size;
        return this;
    }
    offset(from) {
        this.fromValue = from;
        return this;
    }
    select(fields) {
        this.selectedFields = fields;
        return this;
    }
    groupBy(field) {
        this.groupByField = field;
        return this;
    }
    count(field) {
        this.metrics.push({ type: 'count', field });
        return this;
    }
    avg(field) {
        this.metrics.push({ type: 'avg', field });
        return this;
    }
    sum(field) {
        this.metrics.push({ type: 'sum', field });
        return this;
    }
    min(field) {
        this.metrics.push({ type: 'min', field });
        return this;
    }
    max(field) {
        this.metrics.push({ type: 'max', field });
        return this;
    }
    buildCondition(cond) {
        switch (cond.operator) {
            case '=':
                return { term: { [cond.field]: cond.value } };
            case '>':
                return { range: { [cond.field]: { gt: cond.value } } };
            case '<':
                return { range: { [cond.field]: { lt: cond.value } } };
            case '>=':
                return { range: { [cond.field]: { gte: cond.value } } };
            case '<=':
                return { range: { [cond.field]: { lte: cond.value } } };
            case 'in':
                return { terms: { [cond.field]: cond.value } };
            default:
                throw new Error('Unsupported operator');
        }
    }
    buildAggregations() {
        if (!this.groupByField && this.metrics.length === 0)
            return undefined;
        let aggs = {};
        if (this.groupByField) {
            aggs['group_by'] = {
                terms: { field: this.groupByField },
                aggs: {}
            };
            for (const metric of this.metrics) {
                if (metric.type === 'count') {
                    if (metric.field) {
                        aggs['group_by'].aggs[`count_${metric.field}`] = { value_count: { field: metric.field } };
                    }
                    // jika tidak ada field, doc_count sudah otomatis
                }
                else {
                    aggs['group_by'].aggs[`${metric.type}_${metric.field}`] = {
                        [metric.type]: { field: metric.field }
                    };
                }
            }
        }
        else {
            for (const metric of this.metrics) {
                if (metric.type === 'count') {
                    if (metric.field) {
                        aggs[`count_${metric.field}`] = { value_count: { field: metric.field } };
                    }
                }
                else {
                    aggs[`${metric.type}_${metric.field}`] = {
                        [metric.type]: { field: metric.field }
                    };
                }
            }
        }
        return aggs;
    }
    build() {
        let must = [];
        let should = [];
        let lastType = 'and';
        for (const cond of this.conditions) {
            const q = this.buildCondition(cond);
            if (cond.type === 'and') {
                must.push(q);
                lastType = 'and';
            }
            else if (cond.type === 'or') {
                if (lastType === 'and' && must.length) {
                    should.push({ bool: { must } });
                    must = [];
                }
                should.push(q);
                lastType = 'or';
            }
        }
        let query = {};
        if (should.length) {
            if (must.length)
                should.push({ bool: { must } });
            query = { bool: { should } };
        }
        else if (must.length) {
            query = { bool: { must } };
        }
        else {
            query = { match_all: {} };
        }
        const built = { query };
        if (this.sortFields.length)
            built.sort = this.sortFields;
        if (this.fromValue !== undefined)
            built.from = this.fromValue;
        if (this.sizeValue !== undefined)
            built.size = this.sizeValue;
        if (this.selectedFields)
            built._source = this.selectedFields;
        const aggs = this.buildAggregations();
        if (aggs)
            built.aggs = aggs;
        return built;
    }
}
exports.QueryBuilder = QueryBuilder;
