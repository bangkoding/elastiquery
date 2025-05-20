import { Client } from '@elastic/elasticsearch';
export declare class ElasticClient {
    private static instance;
    static getInstance(config?: ConstructorParameters<typeof Client>[0]): Client;
}
