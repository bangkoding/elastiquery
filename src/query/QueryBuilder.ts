type Operator = "=" | ">" | "<" | ">=" | "<=" | "in";

type Condition = {
  type: "and" | "or";
  field: string;
  operator: Operator;
  value: any;
};

type MetricType = "count" | "avg" | "sum" | "min" | "max";

export class QueryBuilder {
  private conditions: Condition[] = [];
  private sortFields: any[] = [];
  private fromValue?: number;
  private sizeValue?: number;
  private selectedFields?: string[];
  private groupByField?: string;
  private metrics: { type: MetricType; field?: string }[] = [];

  where(field: string, operator: Operator, value?: any) {
    this.conditions.push({ type: "and", field, operator, value });
    return this;
  }

  andWhere(field: string, operator: Operator, value?: any) {
    return this.where(field, operator, value);
  }

  orWhere(field: string, operator: Operator, value?: any) {
    this.conditions.push({ type: "or", field, operator, value });
    return this;
  }

  orderBy(field: string, order: "asc" | "desc" = "asc") {
    this.sortFields.push({ [field]: { order } });
    return this;
  }

  limit(size: number) {
    this.sizeValue = size;
    return this;
  }

  offset(from: number) {
    this.fromValue = from;
    return this;
  }

  select(fields: string[]) {
    this.selectedFields = fields;
    return this;
  }

  groupBy(field: string) {
    this.groupByField = field;
    return this;
  }

  count(field?: string) {
    this.metrics.push({ type: "count", field });
    return this;
  }

  avg(field: string) {
    this.metrics.push({ type: "avg", field });
    return this;
  }

  sum(field: string) {
    this.metrics.push({ type: "sum", field });
    return this;
  }

  min(field: string) {
    this.metrics.push({ type: "min", field });
    return this;
  }

  max(field: string) {
    this.metrics.push({ type: "max", field });
    return this;
  }

  private buildCondition(cond: Condition): any {
    switch (cond.operator) {
      case "=":
        return { term: { [cond.field]: cond.value } };
      case ">":
        return { range: { [cond.field]: { gt: cond.value } } };
      case "<":
        return { range: { [cond.field]: { lt: cond.value } } };
      case ">=":
        return { range: { [cond.field]: { gte: cond.value } } };
      case "<=":
        return { range: { [cond.field]: { lte: cond.value } } };
      case "in":
        return { terms: { [cond.field]: cond.value } };
      default:
        throw new Error("Unsupported operator");
    }
  }

  toJSON(pretty: boolean = false): string {
    const query = this.build();
    return JSON.stringify(query, null, pretty ? 2 : 0);
  }

  debug(): this {
    // eslint-disable-next-line no-console
    console.log("Elasticsearch Query:");
    // eslint-disable-next-line no-console
    console.log(this.toJSON(true));
    return this;
  }

  private buildAggregations() {
    if (!this.groupByField && this.metrics.length === 0) return undefined;
    let aggs: any = {};
    if (this.groupByField) {
      aggs["group_by"] = {
        terms: { field: this.groupByField },
        aggs: {},
      };
      for (const metric of this.metrics) {
        if (metric.type === "count") {
          if (metric.field) {
            aggs["group_by"].aggs[`count_${metric.field}`] = {
              value_count: { field: metric.field },
            };
          }
          // jika tidak ada field, doc_count sudah otomatis
        } else {
          aggs["group_by"].aggs[`${metric.type}_${metric.field}`] = {
            [metric.type]: { field: metric.field },
          };
        }
      }
    } else {
      for (const metric of this.metrics) {
        if (metric.type === "count") {
          if (metric.field) {
            aggs[`count_${metric.field}`] = {
              value_count: { field: metric.field },
            };
          }
        } else {
          aggs[`${metric.type}_${metric.field}`] = {
            [metric.type]: { field: metric.field },
          };
        }
      }
    }
    return aggs;
  }

  build() {
    let must: any[] = [];
    let should: any[] = [];
    let lastType: "and" | "or" = "and";
    for (const cond of this.conditions) {
      const q = this.buildCondition(cond);
      if (cond.type === "and") {
        must.push(q);
        lastType = "and";
      } else if (cond.type === "or") {
        if (lastType === "and" && must.length) {
          should.push({ bool: { must } });
          must = [];
        }
        should.push(q);
        lastType = "or";
      }
    }
    let query: any = {};
    if (should.length) {
      if (must.length) should.push({ bool: { must } });
      query = { bool: { should } };
    } else if (must.length) {
      query = { bool: { must } };
    } else {
      query = { match_all: {} };
    }
    const built: any = { query };
    if (this.sortFields.length) built.sort = this.sortFields;
    if (this.fromValue !== undefined) built.from = this.fromValue;
    if (this.sizeValue !== undefined) built.size = this.sizeValue;
    if (this.selectedFields) built._source = this.selectedFields;
    const aggs = this.buildAggregations();
    if (aggs) built.aggs = aggs;
    return built;
  }
}
