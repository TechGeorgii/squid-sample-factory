import { Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, IntColumn as IntColumn_, StringColumn as StringColumn_, Index as Index_ } from "@subsquid/typeorm-store"

@Entity_()
export class MarketInfo {
    constructor(props?: Partial<MarketInfo>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @IntColumn_({ nullable: false })
    block!: number

    @Index_()
    @StringColumn_({ nullable: false })
    marketToken!: string

    @Index_()
    @StringColumn_({ nullable: false })
    indexToken!: string

    @StringColumn_({ nullable: false })
    longToken!: string

    @StringColumn_({ nullable: false })
    shortToken!: string
}
