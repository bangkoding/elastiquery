import { QueryBuilder } from "../QueryBuilder";

describe("QueryBuilder", () => {
  let builder: QueryBuilder;

  beforeEach(() => {
    builder = new QueryBuilder();
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
