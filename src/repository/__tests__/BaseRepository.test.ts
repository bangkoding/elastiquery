jest.mock("../../client/ElasticClient");

import { BaseEntity } from "../../entity/BaseEntity";
import { BaseRepository } from "../BaseRepository";
import { ElasticClient } from "../../client/ElasticClient";
import { QueryBuilder } from "../../query/QueryBuilder";

let mockClient: any;

// Setup the mock before each test so BaseRepository always gets the mock
beforeEach(() => {
  mockClient = {
    index: jest.fn().mockResolvedValue({ result: "created" }),
    bulk: jest.fn().mockResolvedValue({ items: [] }),
    get: jest.fn().mockResolvedValue({ _source: { name: "Test", age: 25 } }),
    search: jest.fn().mockResolvedValue({
      hits: {
        total: { value: 100 },
        hits: [{ _source: { name: "Test", age: 25 } }],
      },
      aggregations: {
        group_by: {
          buckets: [{ key: "group1", doc_count: 10 }],
        },
      },
    }),
    update: jest.fn().mockResolvedValue({ result: "updated" }),
    delete: jest.fn().mockResolvedValue({ result: "deleted" }),
    deleteByQuery: jest.fn().mockResolvedValue({ deleted: 1 }),
  };
  (ElasticClient.getInstance as jest.Mock).mockReturnValue(mockClient);
});

// Mock entity for testing
class TestEntity extends BaseEntity {
  static override index = "test-index";

  name!: string;
  age!: number;

  constructor() {
    super();
  }

  toDocument() {
    return {
      name: this.name,
      age: this.age,
    };
  }

  async beforeCreate() {}
  async afterCreate() {}
  async beforeUpdate(partial: Partial<this>) {}
  async afterUpdate(partial: Partial<this>) {}
  async beforeDelete() {}
  async afterDelete() {}
}

describe("BaseRepository", () => {
  let repository: BaseRepository<TestEntity>;
  let testEntity: TestEntity;

  beforeEach(() => {
    repository = new BaseRepository(TestEntity);
    testEntity = new TestEntity();
    testEntity.name = "Test User";
    testEntity.age = 25;
    testEntity.id = "test-id";
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create document with lifecycle hooks", async () => {
      const beforeCreateSpy = jest.spyOn(testEntity, "beforeCreate");
      const afterCreateSpy = jest.spyOn(testEntity, "afterCreate");

      await repository.create(testEntity);

      expect(beforeCreateSpy).toHaveBeenCalled();
      expect(mockClient.index).toHaveBeenCalledWith({
        index: "test-index",
        document: { name: "Test User", age: 25 },
        id: "test-id",
      });
      expect(afterCreateSpy).toHaveBeenCalled();
    });
  });

  describe("createMany", () => {
    it("should bulk create documents", async () => {
      const docs = [
        Object.assign(new TestEntity(), { name: "User 1", age: 25, id: "id1" }),
        Object.assign(new TestEntity(), { name: "User 2", age: 30, id: "id2" }),
      ];

      await repository.createMany(docs);

      expect(mockClient.bulk).toHaveBeenCalledWith({
        refresh: true,
        body: [
          { index: { _index: "test-index", _id: "id1" } },
          { name: "User 1", age: 25 },
          { index: { _index: "test-index", _id: "id2" } },
          { name: "User 2", age: 30 },
        ],
      });
    });
  });

  describe("findById", () => {
    it("should find document by id", async () => {
      await repository.findById("test-id");

      expect(mockClient.get).toHaveBeenCalledWith({
        index: "test-index",
        id: "test-id",
      });
    });
  });

  describe("findOne", () => {
    it("should find single document", async () => {
      const queryBuilder = new QueryBuilder();
      queryBuilder.where("age", "=", 25);

      await repository.findOne(queryBuilder);

      expect(mockClient.search).toHaveBeenCalledWith({
        index: "test-index",
        query: expect.any(Object),
        size: 1,
      });
    });
  });

  describe("findMany", () => {
    it("should find multiple documents", async () => {
      const queryBuilder = new QueryBuilder();
      queryBuilder.where("age", ">=", 25);

      await repository.findMany(queryBuilder);

      expect(mockClient.search).toHaveBeenCalledWith({
        index: "test-index",
        query: expect.any(Object),
      });
    });
  });

  describe("update", () => {
    it("should update document with lifecycle hooks", async () => {
      // Use a full entity instance for update so hooks are present
      const entityForUpdate = new TestEntity();
      entityForUpdate.name = "Updated User";
      entityForUpdate.age = 30;
      entityForUpdate.id = "test-id";
      const beforeUpdateSpy = jest.spyOn(entityForUpdate, "beforeUpdate");
      const afterUpdateSpy = jest.spyOn(entityForUpdate, "afterUpdate");

      const partial = { name: "Updated User" };
      await repository.update("test-id", entityForUpdate);

      expect(beforeUpdateSpy).toHaveBeenCalledWith(entityForUpdate);
      expect(mockClient.update).toHaveBeenCalledWith({
        index: "test-index",
        id: "test-id",
        doc: entityForUpdate,
      });
      expect(afterUpdateSpy).toHaveBeenCalledWith(entityForUpdate);
    });
  });

  describe("upsert", () => {
    it("should upsert document", async () => {
      const data = { name: "New User", age: 30 };
      await repository.upsert("test-id", data);

      expect(mockClient.update).toHaveBeenCalledWith({
        index: "test-index",
        id: "test-id",
        doc: data,
        doc_as_upsert: true,
      });
    });
  });

  describe("delete", () => {
    it("should delete document with lifecycle hooks", async () => {
      const beforeDeleteSpy = jest.spyOn(testEntity, "beforeDelete");
      const afterDeleteSpy = jest.spyOn(testEntity, "afterDelete");

      await repository.delete("test-id", testEntity);

      expect(beforeDeleteSpy).toHaveBeenCalled();
      expect(mockClient.delete).toHaveBeenCalledWith({
        index: "test-index",
        id: "test-id",
      });
      expect(afterDeleteSpy).toHaveBeenCalled();
    });
  });

  describe("deleteByQuery", () => {
    it("should delete documents by query", async () => {
      const queryBuilder = new QueryBuilder();
      queryBuilder.where("age", ">=", 25);

      await repository.deleteByQuery(queryBuilder);

      expect(mockClient.deleteByQuery).toHaveBeenCalledWith({
        index: "test-index",
        query: expect.any(Object),
      });
    });
  });

  describe("paginate", () => {
    it("should return paginated results", async () => {
      const queryBuilder = new QueryBuilder();
      const result = await repository.paginate(queryBuilder, 2, 10);

      expect(mockClient.search).toHaveBeenCalledWith({
        index: "test-index",
        query: expect.any(Object),
        from: 10,
        size: 10,
      });
      expect(result).toEqual({
        data: [{ name: "Test", age: 25 }],
        total: 100,
        page: 2,
        perPage: 10,
        totalPages: 10,
      });
    });
  });

  describe("search", () => {
    it("should perform raw search", async () => {
      const queryBuilder = new QueryBuilder();
      queryBuilder.where("name", "=", "Test");

      await repository.search(queryBuilder);

      expect(mockClient.search).toHaveBeenCalledWith({
        index: "test-index",
        query: expect.any(Object),
      });
    });
  });

  describe("groupBy", () => {
    it("should return aggregation results", async () => {
      const queryBuilder = new QueryBuilder();
      queryBuilder.groupBy("status").count();

      const result = await repository.groupBy(queryBuilder);

      expect(mockClient.search).toHaveBeenCalledWith({
        index: "test-index",
        query: expect.any(Object),
        aggs: expect.any(Object),
      });
      expect(result).toEqual([{ key: "group1", doc_count: 10 }]);
    });
  });
});
