export abstract class BaseEntity {
  static index: string;
  static mapping?: object;
  static settings?: object;
  id?: string;

  // Optionally override to provide custom serialization
  toDocument?(): object;

  // Lifecycle hooks (optional)
  beforeCreate?(): Promise<void> | void;
  afterCreate?(): Promise<void> | void;
  beforeUpdate?(partial: Partial<this>): Promise<void> | void;
  afterUpdate?(partial: Partial<this>): Promise<void> | void;
  beforeDelete?(): Promise<void> | void;
  afterDelete?(): Promise<void> | void;
} 