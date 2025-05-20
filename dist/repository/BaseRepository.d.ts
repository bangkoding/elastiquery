import { QueryBuilder } from '../query/QueryBuilder';
import { BaseEntity } from '../entity/BaseEntity';
export declare class BaseRepository<T extends BaseEntity> {
    protected index: string;
    protected client: import("@elastic/elasticsearch").Client;
    constructor(entity: typeof BaseEntity);
    create(doc: T): Promise<import("@elastic/elasticsearch/lib/api/types").WriteResponseBase>;
    createMany(docs: T[]): Promise<import("@elastic/elasticsearch/lib/api/types").BulkResponse>;
    findById(id: string): Promise<import("@elastic/elasticsearch/lib/api/types").GetResponse<unknown>>;
    findOne(queryBuilder: QueryBuilder): Promise<{} | null>;
    findMany(queryBuilder: QueryBuilder): Promise<any[]>;
    update(id: string, partial: Partial<T>): Promise<import("@elastic/elasticsearch/lib/api/types").UpdateResponse<unknown>>;
    upsert(id: string, data: Partial<T>): Promise<import("@elastic/elasticsearch/lib/api/types").UpdateResponse<unknown>>;
    delete(id: string, doc?: T): Promise<import("@elastic/elasticsearch/lib/api/types").WriteResponseBase>;
    deleteByQuery(queryBuilder: QueryBuilder): Promise<import("@elastic/elasticsearch/lib/api/types").DeleteByQueryResponse>;
    paginate(queryBuilder: QueryBuilder, page?: number, perPage?: number): Promise<{
        data: any[];
        total: number;
        page: number;
        perPage: number;
        totalPages: number;
    }>;
    search(queryBuilder: QueryBuilder): Promise<import("@elastic/elasticsearch/lib/api/types").SearchResponse<unknown, Record<string, import("@elastic/elasticsearch/lib/api/types").AggregationsAggregate>>>;
    groupBy(queryBuilder: QueryBuilder): Promise<any[] | Record<string, import("@elastic/elasticsearch/lib/api/types").AggregationsAggregate> | undefined>;
}
