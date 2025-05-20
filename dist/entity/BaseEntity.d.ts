export declare abstract class BaseEntity {
    static index: string;
    static mapping?: object;
    static settings?: object;
    toDocument?(): object;
    beforeCreate?(): Promise<void> | void;
    afterCreate?(): Promise<void> | void;
    beforeUpdate?(partial: Partial<this>): Promise<void> | void;
    afterUpdate?(partial: Partial<this>): Promise<void> | void;
    beforeDelete?(): Promise<void> | void;
    afterDelete?(): Promise<void> | void;
}
