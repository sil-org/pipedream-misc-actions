export default defineComponent({
  name: "Fetch Record from Datastore",
  description: "Fetch Record from Datastore",
  key: "fetch_datastore_record",
  version: "0.0.4",
  type: "action",
  props: {
    dataQueue: {
      type: "data_store",
    },
  },

  async run({ steps, $ }) {
    const MAX_DURATION_MS = 100000
    const start = Date.now()
    let attempt = 0

    while (true){
      try {
        attempt++
        // Access your Data Store via the prop
        const keys = await this.dataQueue.keys();
        if (keys.length == 0) {
          console.log("Data store is empty. Ending Subworkflow")
          $.flow.exit()
        }

        keys.sort();
        const key = keys.pop();

        // get record from data store
        const record = await this.dataQueue.get(key);

        // remove record from data store
        await this.dataQueue.delete(key);

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
