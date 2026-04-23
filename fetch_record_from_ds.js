export default defineComponent({
  name: "Fetch Record from Data Store",
  description: "Fetch Record from Data Store (DEV or PROD, as appropriate)",
  key: "fetch_datastore_record",
  version: "0.1.0",
  type: "action",
  
  props: {
    devDataQueue: {
      label: "DEV Data Store queue",
      type: "data_store",
    },
    prodDataQueue: {
      label: "PROD Data Store queue",
      type: "data_store",
    },
    isProd: {
      label: "Is this a PROD run?",
      type: "boolean",
      optional: true,
      default: false,
    },
  },

  async run({ steps, $ }) {
    const MAX_DURATION_MS = 100000
    const start = Date.now()
    let attempt = 0
    const dataQueue = this.isProd ? this.prodDataQueue : this.devDataQueue

    while (true){
      try {
        attempt++
        // Access your Data Store via the prop
        const keys = await dataQueue.keys();
        if (keys.length == 0) {
          console.log("Data store is empty. Ending Subworkflow")
          $.flow.exit()
        }

        keys.sort();
        const key = keys.pop();

        // get record from data store
        const record = await dataQueue.get(key);

        // remove record from data store
        await dataQueue.delete(key);

        console.log('Fetched record:', JSON.stringify(record) );

        return {key, record};

      } catch (err) {
        const elapsed = Date.now() - start

        console.log(`Attempt ${i+1} failed:`, err.message);

        if (elapsed > MAX_DURATION_MS){
          throw new Error("Datastore unavailable after 10s of retrying")
        }

        const delay = Math.min(1000 * attempt, 3000)
        await new Promise(r=>setTimeout(r, delay))

      }
    }
  },
});