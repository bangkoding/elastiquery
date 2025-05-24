import { BaseEntity } from "../BaseEntity";

// Mock implementation of BaseEntity for testing
class TestEntity extends BaseEntity {
  static index = "test-index";
  static mapping = {
    properties: {
      name: { type: "keyword" },
      age: { type: "integer" },
    },
  };
  static settings = {
    number_of_shards: 1,
    number_of_replicas: 1,
  };

  name: string;
  age: number;

  constructor(name: string, age: number) {
    super();
    this.name = name;
    this.age = age;
  }

  toDocument(): object {
    return {
      name: this.name,
      age: this.age,
    };
  }

  // Lifecycle hooks implementation
  async beforeCreate(): Promise<void> {
    this.name = this.name.trim();
  }

  async afterCreate(): Promise<void> {
    // Simulating some post-creation logic
  }

  async beforeUpdate(partial: Partial<TestEntity>): Promise<void> {
    if (partial.name) {
      partial.name = partial.name.trim();
    }
  }

  async afterUpdate(partial: Partial<TestEntity>): Promise<void> {
    // Simulating some post-update logic
  }

  async beforeDelete(): Promise<void> {
    // Simulating pre-deletion validation
    if (!this.id) {
      throw new Error("Cannot delete entity without ID");
    }
  }

  async afterDelete(): Promise<void> {
    // Simulating some post-deletion cleanup
  }
}

describe("BaseEntity", () => {
  let entity: TestEntity;

  beforeEach(() => {
    entity = new TestEntity("Test User", 25);
    entity.id = "123";
  });

  describe("Static Properties", () => {
    it("should have correct static properties", () => {
      expect(TestEntity.index).toBe("test-index");
      expect(TestEntity.mapping).toEqual({
        properties: {
          name: { type: "keyword" },
          age: { type: "integer" },
        },
      });
      expect(TestEntity.settings).toEqual({
        number_of_shards: 1,
        number_of_replicas: 1,
      });
    });
  });

  describe("Instance Properties", () => {
    it("should set and get id correctly", () => {
      expect(entity.id).toBe("123");
    });

    it("should set and get custom properties correctly", () => {
      expect(entity.name).toBe("Test User");
      expect(entity.age).toBe(25);
    });
  });

  describe("toDocument", () => {
    it("should serialize entity correctly", () => {
      const doc = entity.toDocument();
      expect(doc).toEqual({
        name: "Test User",
        age: 25,
      });
    });
  });

  describe("Lifecycle Hooks", () => {
    it("should execute beforeCreate hook", async () => {
      const entity = new TestEntity("  Test User  ", 25);
      await entity.beforeCreate();
      expect(entity.name).toBe("Test User");
    });

    it("should execute afterCreate hook without error", async () => {
      await expect(entity.afterCreate()).resolves.toBeUndefined();
    });

    it("should execute beforeUpdate hook", async () => {
      const partial: Partial<TestEntity> = { name: "  Updated User  " };
      await entity.beforeUpdate(partial);
      expect(partial.name).toBe("Updated User");
    });

    it("should execute afterUpdate hook without error", async () => {
      const partial: Partial<TestEntity> = { name: "Updated User" };
      await expect(entity.afterUpdate(partial)).resolves.toBeUndefined();
    });

    it("should execute beforeDelete hook with valid id", async () => {
      await expect(entity.beforeDelete()).resolves.toBeUndefined();
    });

    it("should throw error in beforeDelete hook when id is missing", async () => {
      entity.id = undefined;
      await expect(entity.beforeDelete()).rejects.toThrow(
        "Cannot delete entity without ID"
      );
    });

    it("should execute afterDelete hook without error", async () => {
      await expect(entity.afterDelete()).resolves.toBeUndefined();
    });
  });
});
