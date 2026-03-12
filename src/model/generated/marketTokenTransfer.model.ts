import { Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, IntColumn as IntColumn_, StringColumn as StringColumn_, Index as Index_, BigIntColumn as BigIntColumn_, JSONColumn as JSONColumn_ } from "@subsquid/typeorm-store"

@Entity_()
export class MarketTokenTransfer {
    constructor(props?: Partial<MarketTokenTransfer>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @IntColumn_({ nullable: false })
    block!: number

    @Index_()
    @StringColumn_({ nullable: false })
    from!: string

    @Index_()
    @StringColumn_({ nullable: false })
    to!: string

    @BigIntColumn_({ nullable: false })
    value!: bigint

    @Index_()
    @StringColumn_({ nullable: false })
    txnHash!: string

    @Index_()
    @StringColumn_({ nullable: false })
    tokenAddress!: string

    @JSONColumn_({ nullable: true })
    factoryEvent!: unknown | null
}
