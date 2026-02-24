import { createObjectCsvWriter } from "csv-writer";
import fs from "fs";
import path from "path";

export default defineComponent({
  name: "Create CSV Base64",
  description: "Create a base64-encoded CSV file from data array input",
  key: "create_csv_base64",
  version: "0.0.1",
  type: "action",
  props: {
    data: {
      type: "any",
      label: "Transaction Data",
      description: "Array of objects (each object = one CSV row)",
    },
    filename: {
      type: "string",
      label: "Filename",
      optional: true,
      default: "transactions.csv",
    },
  },

  async run({ $ }) {
    if (!Array.isArray(this.data) || this.data.length === 0) {
      throw new Error("Data must be a non-empty array of objects");
    }

    const headers = Object.keys(this.data[0]).map((key) => ({
      id: key,
      title: key,
    }));

    const filePath = path.join("/tmp", this.filename);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: headers,
    });

    await csvWriter.writeRecords(this.data);

    const buffer = fs.readFileSync(filePath);

    return {
      filename: this.filename,
      base64: buffer.toString("base64"),
      sizeBytes: buffer.length,
      rowCount: this.data.length,
      columns: headers.map((h) => h.id),
    };
  },
});
