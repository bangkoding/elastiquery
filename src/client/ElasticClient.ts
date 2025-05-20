import { Client } from '@elastic/elasticsearch';

export class ElasticClient {
  private static instance: Client;

  static getInstance(config?: ConstructorParameters<typeof Client>[0]): Client {
    if (!ElasticClient.instance) {
      if (!config) {
        throw new Error('Elasticsearch client not initialized. Provide config.');
      }
      ElasticClient.instance = new Client(config);
    }
    return ElasticClient.instance;
  }
} 