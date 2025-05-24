import { Client } from "@elastic/elasticsearch";
import { ElasticClient } from "../ElasticClient";

// Mock elasticsearch Client
jest.mock("@elastic/elasticsearch", () => ({
  Client: jest.fn(),
}));

describe("ElasticClient", () => {
  // Reset mocks and singleton instance before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton instance
    // @ts-ignore - Accessing private static property for testing
    ElasticClient.instance = undefined;
  });

  describe("getInstance", () => {
    it("should throw error when called without config and no existing instance", () => {
      expect(() => ElasticClient.getInstance()).toThrow(
        "Elasticsearch client not initialized. Provide config."
      );
    });

    it("should create new instance with provided config", () => {
      const config = { node: "http://localhost:9200" };
      const instance = ElasticClient.getInstance(config);

      expect(Client).toHaveBeenCalledTimes(1);
      expect(Client).toHaveBeenCalledWith(config);
      expect(instance).toBeInstanceOf(Client);
    });

    it("should return existing instance when called multiple times with config", () => {
      const config = { node: "http://localhost:9200" };
      const firstInstance = ElasticClient.getInstance(config);
      const secondInstance = ElasticClient.getInstance(config);

      expect(Client).toHaveBeenCalledTimes(1);
      expect(firstInstance).toBe(secondInstance);
    });

    it("should return existing instance when called without config after initialization", () => {
      const config = { node: "http://localhost:9200" };
      const firstInstance = ElasticClient.getInstance(config);
      const secondInstance = ElasticClient.getInstance();

      expect(Client).toHaveBeenCalledTimes(1);
      expect(firstInstance).toBe(secondInstance);
    });

    it("should use the first config provided and ignore subsequent configs", () => {
      const firstConfig = { node: "http://localhost:9200" };
      const secondConfig = { node: "http://localhost:9201" };

      const firstInstance = ElasticClient.getInstance(firstConfig);
      const secondInstance = ElasticClient.getInstance(secondConfig);

      expect(Client).toHaveBeenCalledTimes(1);
      expect(Client).toHaveBeenCalledWith(firstConfig);
      expect(firstInstance).toBe(secondInstance);
    });
  });
});
