import { PrometheusServer, run } from "@subsquid/batch-processor";
import { TypeormDatabase } from "@subsquid/typeorm-store";
import { DatadogMetricsSink } from "./datadog-metrics-sink";
import { EvmBatchProcessor } from "@subsquid/evm-processor";
import { events as emitterEvents } from './abi/EventEmitter'
import { events as marketTokenEvents } from './abi/MarketToken'
import { DataSourceBuilder } from "@subsquid/evm-stream";
import { createPinoSink, setRootSink } from "@subsquid/logger";
import pino from "pino";
import {config} from "dotenv"
config();

const EVENT_EMITTER_ADDRESS = '0xC8ee91A54287DB53897056e12D9819156D3822Fb'.toLowerCase()
const EVENTLOG1_TOPIC = emitterEvents.EventLog1.topic
const TRANSFER_TOPIC = marketTokenEvents.Transfer.topic
const START_BLOCK = 100000;

const datadogLogTransportOptions = {
  ddClientConf: {
    authMethods: {
      apiKeyAuth: process.env.DATADOG_API_KEY!,
    },
  },
  ddServerConf: {
    site: process.env.DATADOG_SITE!,
  },
  ...(process.env.DATADOG_TAGS && {
    ddtags: process.env.DATADOG_TAGS,
  }),
  ddsource: "nodejs",
  service: process.env.DATADOG_SERVICE || "squid-evm-template",
};

async function main() {
  // =================================================================================
  // Logger setup
  const isProd = process.env.NODE_ENV === "production";
  const pinoPrettyTarget =  { target: "pino-pretty", options: { colorize: true } };
  const datadogTransport =  {
    target: "pino-datadog-transport",
    options: { ...datadogLogTransportOptions },
  };
  const transport = isProd ? {
      targets: [  // two targets in case of prod
        pinoPrettyTarget,
        datadogTransport,
      ],
    }
  : pinoPrettyTarget; // for dev env - only console pretty output

  setRootSink(
    createPinoSink(
      pino({ transport }),
    ),
  );

  const db = new TypeormDatabase({
    supportHotBlocks: true,
    stateSchema: "squid_processor",
  });

  const datadogSink = new DatadogMetricsSink({
    apiKey: process.env.DATADOG_API_KEY!,
    site: process.env.DATADOG_SITE!,
    tags: process.env.DATADOG_TAGS!.split(","),
    pushIntervalMs: Number(process.env.DATADOG_PUSH_INTERVAL!)
  });  
  const prometheusServer = new PrometheusServer();
  prometheusServer.addMetricsSink(datadogSink);
  
  // =================================================================================
  //        How to push metrics to DataDog with EvmBatchProcessor
  const processor = new EvmBatchProcessor()
    .setGateway('https://v2.archive.subsquid.io/network/arbitrum-one')
    .setRpcEndpoint('https://arb1.arbitrum.io/rpc')
    .setFinalityConfirmation(75)
    .setPrometheusServer(prometheusServer)  // this is the change
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

  processor.run(db, async (ctx )=> {
    ctx.log.info(`EvmBatchProcessor: ${ctx.blocks.length} blocks received`);
  });



  // =================================================================================
  // How to push metrics to DataDog with DataSourceBuilder
  const dataSource = new DataSourceBuilder()
    .setPortal("https://portal.sqd.dev/datasets/ethereum-mainnet")
    .addLog({
      where: {
        topic0: [TRANSFER_TOPIC]
      },
      range: {from: 10_000_000 }
    })
    .setFields({
      block: {
        timestamp: true,
      },
      log: {
        topics: true,
        data: true,
        transactionHash: true,
      },
    })
    .setBlockRange({
      from: 10_000_000,
    })
    .build();


  run(dataSource, db, async (ctx) => {
    console.log(`DataSourceBuilder: ${ctx.blocks.length} blocks received`);
   }, { prometheus: prometheusServer });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
