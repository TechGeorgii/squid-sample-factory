import { EvmBatchProcessor } from '@subsquid/evm-processor'
import { TypeormDatabase } from '@subsquid/typeorm-store'
import { events as emitterEvents } from './abi/EventEmitter'
import { events as marketTokenEvents } from './abi/MarketToken'
import { MarketInfo, MarketTokenTransfer } from './model'

const EVENT_EMITTER_ADDRESS = '0xC8ee91A54287DB53897056e12D9819156D3822Fb'.toLowerCase()
const EVENTLOG1_TOPIC = emitterEvents.EventLog1.topic
const TRANSFER_TOPIC = marketTokenEvents.Transfer.topic
//const START_BLOCK = 107748264; 
const START_BLOCK = 340981939;

const processor = new EvmBatchProcessor()
  .setGateway('https://v2.archive.subsquid.io/network/arbitrum-one')
  .setRpcEndpoint('https://arb1.arbitrum.io/rpc')
  .setFinalityConfirmation(75)
  .addLog({
    address: [EVENT_EMITTER_ADDRESS],
    topic0: [EVENTLOG1_TOPIC],
    range: { from: START_BLOCK },
  })
  .addLog({
    topic0: [TRANSFER_TOPIC],
    range: { from: START_BLOCK },
  })
  .setFields({
    log: {
      transactionHash: true,
    },
  })

const db = new TypeormDatabase({ supportHotBlocks: true })

function getAddressItem(
  eventData: { addressItems: { items: { key: string; value: string }[] } },
  key: string
): string | undefined {
  for (const item of eventData.addressItems.items) {
    if (item.key === key) return item.value.toLowerCase()
  }
  return undefined
}

processor.run(db, async (ctx) => {
  const batchMarkets = new Map<string, MarketInfo>()
  const transfers: MarketTokenTransfer[] = []

  for (const block of ctx.blocks) {
    for (const log of block.logs) {
      if (log.address === EVENT_EMITTER_ADDRESS && log.topics[0] === EVENTLOG1_TOPIC) {
        const decoded = emitterEvents.EventLog1.decode(log)
        if (decoded.eventName === 'MarketCreated') {
          const marketToken = getAddressItem(decoded.eventData, 'marketToken')!
          const indexToken = getAddressItem(decoded.eventData, 'indexToken')!
          const longToken = getAddressItem(decoded.eventData, 'longToken')!
          const shortToken = getAddressItem(decoded.eventData, 'shortToken')!

          const market = new MarketInfo({
            id: marketToken,
            block: block.header.height,
            marketToken,
            indexToken,
            longToken,
            shortToken,
          })
          batchMarkets.set(marketToken, market)
          console.log(`MarketCreated: ${marketToken} (index=${indexToken})`)
        }
      } else if (log.topics[0] === TRANSFER_TOPIC) {
        const marketInfo = batchMarkets.get(log.address)
          ?? await ctx.store.get(MarketInfo, log.address)
        if (!marketInfo) continue

        const transfer = marketTokenEvents.Transfer.decode(log)
        transfers.push(new MarketTokenTransfer({
          id: `${log.transactionHash}-${log.logIndex}`,
          block: block.header.height,
          from: transfer.from.toLowerCase(),
          to: transfer.to.toLowerCase(),
          value: transfer.value,
          txnHash: log.transactionHash,
          tokenAddress: log.address,
          factoryEvent: {
            marketToken: marketInfo.marketToken,
            indexToken: marketInfo.indexToken,
            longToken: marketInfo.longToken,
            shortToken: marketInfo.shortToken,
          },
        }))
      }
    }
  }

  if (batchMarkets.size > 0) {
    await ctx.store.save([...batchMarkets.values()])
  }
  if (transfers.length > 0) {
    await ctx.store.insert(transfers)
  }
})
