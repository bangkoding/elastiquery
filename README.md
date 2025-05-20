# Elasticsearch ORM Query Builder (TypeScript)

A modular library for building Elasticsearch queries with an ORM-like style in TypeScript/JavaScript.

## Getting Started

### Installation
```sh
yarn add elastiquery @elastic/elasticsearch
# or
npm install elastiquery @elastic/elasticsearch
```

### Quick Usage
```ts
import { ElasticClient, BaseEntity, BaseRepository, QueryBuilder } from 'elastiquery';

ElasticClient.getInstance({
  node: 'https://your-es-host:9200',
  auth: {
    bearer: 'your_bearer_token'
  }
});

class User extends BaseEntity {
  static index = 'users';
  id!: string;
  name!: string;
  age!: number;
  status!: string;
}

const userRepo = new BaseRepository<User>(User);
const users = await userRepo.findMany(new QueryBuilder().where('age', '>', 20));
```

---

## Structure
- `BaseEntity`: Define your entity schema/mapping.
- `BaseRepository`: CRUD, upsert, pagination, groupBy/aggregation, and query builder.
- `QueryBuilder`: Fluent API for building Elasticsearch queries.
- `ElasticClient`: Wrapper for the Elasticsearch client.

## Usage Example
```ts
import { ElasticClient, BaseEntity, BaseRepository, QueryBuilder } from 'elastiquery';

// 1. Initialize the client (once at startup)
ElasticClient.getInstance({
  node: 'https://your-es-host:9200',
  auth: {
    bearer: 'your_bearer_token'
  }
});

// 2. Define an entity
class User extends BaseEntity {
  static index = 'users';
  id!: string;
  name!: string;
  age!: number;
  status!: string;
}

// 3. Create a repository
const userRepo = new BaseRepository<User>(User);

// 4. CRUD
// CREATE
await userRepo.create({ id: '1', name: 'John', age: 30, status: 'active' });
await userRepo.createMany([
  { id: '2', name: 'Jane', age: 25, status: 'inactive' },
  { id: '3', name: 'Doe', age: 40, status: 'active' },
]);

// READ
const user = await userRepo.findById('1');
const userByQuery = await userRepo.findOne(new QueryBuilder().where('name', '=', 'John'));
const users = await userRepo.findMany(new QueryBuilder().where('age', '>', 20).orderBy('age', 'desc'));

// UPDATE
await userRepo.update('1', { age: 31 });

// DELETE
await userRepo.delete('1');
await userRepo.deleteByQuery(new QueryBuilder().where('age', '<', 30));

// UPSERT
await userRepo.upsert('1', { name: 'John', age: 32 });

// PAGINATION
const pageResult = await userRepo.paginate(new QueryBuilder().where('age', '>', 20), 2, 5);
// pageResult = { data, total, page, perPage, totalPages }

// ADVANCED QUERY
const qb = new QueryBuilder()
  .where('name', '=', 'John')
  .andWhere('age', '>', 20)
  .orWhere('status', '=', 'active')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .offset(20)
  .select(['id', 'name', 'age']);
const result = await userRepo.findMany(qb);

// GROUP BY & AGGREGATION
// Group by status, calculate average and count of users per status
const groupQb = new QueryBuilder()
  .groupBy('status')
  .avg('age')
  .count();
const groupResult = await userRepo.groupBy(groupQb);
// groupResult: [{ key: 'active', doc_count: 2, avg_age: { value: 35 } }, ...]

// Group by age, count users per age
const groupByAge = new QueryBuilder().groupBy('age').count();
const groupAgeResult = await userRepo.groupBy(groupByAge);
// groupAgeResult: [{ key: 30, doc_count: 1 }, { key: 25, doc_count: 1 }, ...]

// Aggregation without groupBy (e.g. average age of all users)
const aggQb = new QueryBuilder().avg('age').max('age').min('age');
const aggResult = await userRepo.groupBy(aggQb);
// aggResult: { avg_age: { value: ... }, max_age: { value: ... }, min_age: { value: ... } }
```

## Upsert
- `upsert(id, data)`: Update if exists, insert if not.

## Pagination
- `paginate(queryBuilder, page, perPage)` returns `{ data, total, page, perPage, totalPages }`.

## Group By & Aggregation
### Concept
- **groupBy**: Group documents by the value of a specific field (similar to SQL `GROUP BY`).
- **Aggregation**: Calculate statistics for each group, such as count, average, sum, min, and max.
- You can combine filters (`where`) with groupBy/aggregation.

### API
- `.groupBy(field)`: Group documents by a field.
- `.count(field?)`: Count documents (or count distinct if a field is provided).
- `.avg(field)`, `.sum(field)`, `.min(field)`, `.max(field)`: Statistical aggregations per group.
- `repo.groupBy(queryBuilder)`: Run a group/aggregation query and return the buckets/metrics.

### Result Structure
- With `.groupBy(field)`, the result is an array of buckets:
  ```js
  [
    { key: 'active', doc_count: 2, avg_age: { value: 35 } },
    { key: 'inactive', doc_count: 1, avg_age: { value: 25 } },
    // ...
  ]
  ```
- With only aggregations (no groupBy):
  ```js
  {
    avg_age: { value: 33.3 },
    max_age: { value: 40 },
    min_age: { value: 25 }
  }
  ```

### Usage Tips
- `.count()` without a field will count documents per group (use `doc_count` from the bucket result).
- You can combine `.where()` and `.groupBy()` to filter before grouping.
- For global aggregations (across all documents), use `.avg()`, `.sum()`, etc. without `.groupBy()`.
- For distinct count, use `.count('fieldName')`.

### More Examples
```ts
// Group by status, count only active users
const qb = new QueryBuilder()
  .where('status', '=', 'active')
  .groupBy('status')
  .count();
const result = await userRepo.groupBy(qb);
// result: [{ key: 'active', doc_count: ... }]

// Average age of users older than 20 (global aggregation)
const aggQb = new QueryBuilder()
  .where('age', '>', 20)
  .avg('age');
const aggResult = await userRepo.groupBy(aggQb);
// aggResult: { avg_age: { value: ... } }
```

## Contributing

Contributions, issues, and feature requests are welcome!

- Fork the repository
- Create your feature branch (`git checkout -b feature/your-feature`)
- Commit your changes (`git commit -am 'Add new feature'`)
- Push to the branch (`git push origin feature/your-feature`)
- Open a Pull Request

For issues and suggestions, please use the [GitHub Issues](https://github.com/bangkoding/elastiquery/issues) page.

## License
MIT 