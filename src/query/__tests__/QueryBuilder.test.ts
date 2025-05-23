import { QueryBuilder } from "../QueryBuilder";

describe("QueryBuilder", () => {
  let builder: QueryBuilder;

  beforeEach(() => {
    builder = new QueryBuilder();
  });

  describe("debug methods", () => {
    let builder: QueryBuilder;
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      builder = new QueryBuilder();
      consoleSpy = jest.spyOn(console, "log").mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    describe("toJSON", () => {
      it("should return non-pretty JSON string by default", () => {
        builder.where("age", ">", 25);
        const rawQuery = builder.toJSON();
        expect(rawQuery).toBe(JSON.stringify(builder.build()));
        expect(rawQuery).not.toContain("\n");
      });

      it("should return pretty JSON string when pretty=true", () => {
        builder.where("age", ">", 25);
        const rawQuery = builder.toJSON(true);
        expect(rawQuery).toBe(JSON.stringify(builder.build(), null, 2));
        expect(rawQuery).toContain("\n");
      });
    });

    describe("debug", () => {
      it("should log the query in pretty format", () => {
        builder.where("age", ">", 25).debug();
        expect(consoleSpy).toHaveBeenCalledTimes(2);
        expect(consoleSpy).toHaveBeenNthCalledWith(1, "Elasticsearch Query:");
        expect(consoleSpy.mock.calls[1][0]).toBe(builder.toJSON(true));
      });

      it("should return this for method chaining", () => {
        const result = builder.debug();
        expect(result).toBe(builder);
      });

      it("should not affect the final query", () => {
        const query = builder
          .where("age", ">", 25)
          .debug()
          .andWhere("status", "=", "active")
          .build();

        expect(query).toEqual({
          query: {
            bool: {
              must: [
                { range: { age: { gt: 25 } } },
                { term: { status: "active" } },
              ],
            },
          },
        });
      });
    });
  });

  describe("where conditions", () => {
    it("should build a simple where clause", () => {
      const query = builder.where("age", "=", 25).build();
      expect(query).toEqual({
        query: {
          bool: {
            must: [{ term: { age: 25 } }],
          },
        },
      });
    });

    it("should build multiple AND conditions", () => {
      const query = builder
        .where("age", ">=", 25)
        .andWhere("status", "=", "active")
        .build();

      expect(query).toEqual({
        query: {
          bool: {
            must: [
              { range: { age: { gte: 25 } } },
              { term: { status: "active" } },
            ],
          },
        },
      });
    });

    it("should build OR conditions", () => {
      const query = builder
        .where("age", ">=", 25)
        .orWhere("status", "=", "active")
        .build();

      expect(query).toEqual({
        query: {
          bool: {
            should: [
              { bool: { must: [{ range: { age: { gte: 25 } } }] } },
              { term: { status: "active" } },
            ],
          },
        },
      });
    });

    it("should handle IN operator", () => {
      const query = builder
        .where("status", "in", ["active", "pending"])
        .build();

      expect(query).toEqual({
        query: {
          bool: {
            must: [{ terms: { status: ["active", "pending"] } }],
          },
        },
      });
    });
  });

  describe("sorting and pagination", () => {
    it("should add sort fields", () => {
      const query = builder.orderBy("age", "desc").orderBy("name").build();

      expect(query).toEqual({
        query: { match_all: {} },
        sort: [{ age: { order: "desc" } }, { name: { order: "asc" } }],
      });
    });

    it("should add pagination", () => {
      const query = builder.offset(10).limit(20).build();

      expect(query).toEqual({
        query: { match_all: {} },
        from: 10,
        size: 20,
      });
    });
  });

  describe("field selection", () => {
    it("should select specific fields", () => {
      const query = builder.select(["name", "age", "status"]).build();

      expect(query).toEqual({
        query: { match_all: {} },
        _source: ["name", "age", "status"],
      });
    });
  });

  describe("aggregations", () => {
    it("should build simple aggregations", () => {
      const query = builder
        .count("status")
        .avg("age")
        .sum("total")
        .min("price")
        .max("score")
        .build();

      expect(query).toEqual({
        query: { match_all: {} },
        aggs: {
          count_status: { value_count: { field: "status" } },
          avg_age: { avg: { field: "age" } },
          sum_total: { sum: { field: "total" } },
          min_price: { min: { field: "price" } },
          max_score: { max: { field: "score" } },
        },
      });
    });

    it("should build grouped aggregations", () => {
      const query = builder.groupBy("status").count().avg("age").build();

      expect(query).toEqual({
        query: { match_all: {} },
        aggs: {
          group_by: {
            terms: { field: "status" },
            aggs: {
              avg_age: { avg: { field: "age" } },
            },
          },
        },
      });
    });
  });

  describe("complex queries", () => {
    it("should build a complex query with multiple features", () => {
      const query = builder
        .where("age", ">=", 25)
        .andWhere("status", "in", ["active", "pending"])
        .orWhere("role", "=", "admin")
        .select(["id", "name", "age", "status", "role"])
        .orderBy("age", "desc")
        .groupBy("status")
        .count()
        .avg("age")
        .limit(20)
        .offset(40)
        .build();

      expect(query).toEqual({
        query: {
          bool: {
            should: [
              {
                bool: {
                  must: [
                    { range: { age: { gte: 25 } } },
                    { terms: { status: ["active", "pending"] } },
                  ],
                },
              },
              { term: { role: "admin" } },
            ],
          },
        },
        _source: ["id", "name", "age", "status", "role"],
        sort: [{ age: { order: "desc" } }],
        from: 40,
        size: 20,
        aggs: {
          group_by: {
            terms: { field: "status" },
            aggs: {
              avg_age: { avg: { field: "age" } },
            },
          },
        },
      });
    });
  });

  describe("error handling", () => {
    it("should throw error for unsupported operator", () => {
      // @ts-ignore - Testing invalid operator
      expect(() => builder.where("field", "invalid", "value").build()).toThrow(
        "Unsupported operator"
      );
    });
  });
});
