type Operator = '=' | '>' | '<' | '>=' | '<=' | 'in';
export declare class QueryBuilder {
    private conditions;
    private sortFields;
    private fromValue?;
    private sizeValue?;
    private selectedFields?;
    private groupByField?;
    private metrics;
    where(field: string, operator: Operator, value?: any): this;
    andWhere(field: string, operator: Operator, value?: any): this;
    orWhere(field: string, operator: Operator, value?: any): this;
    orderBy(field: string, order?: 'asc' | 'desc'): this;
    limit(size: number): this;
    offset(from: number): this;
    select(fields: string[]): this;
    groupBy(field: string): this;
    count(field?: string): this;
    avg(field: string): this;
    sum(field: string): this;
    min(field: string): this;
    max(field: string): this;
    private buildCondition;
    private buildAggregations;
    build(): any;
}
export {};
