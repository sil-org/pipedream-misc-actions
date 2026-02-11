import Client from "ssh2-sftp-client@^12.0.1";

export default defineComponent({
  name: "Rename SFTP File",
  description:
    "Moves a file by its path to a new destination on an SFTP host. Returns an error message.",
  key: "sftp_rename_file",
  version: "0.0.1",
  type: "action",

  props: {
    sftp: {
      type: "app",
      app: "sftp",
    },
    file: {
      type: "string",
      label: "File Path",
      description:
        "Name of the file to rename (e.g. /src/dir/example.csv)",
    },
    destPath: {
      type: "string",
      label: "Destination Path",
      description: "New file path (e.g. /dest/dir/example.csv)",
    },
  },
  async run({ steps, $ }) {
    const { host, username, privateKey } = this.sftp.$auth;
    if (!host || !username || !privateKey) {
      throw Error("missing SFTP authentication details");
    }

    const ftpConfig = {
      host,
      username,
      privateKey,
    };

    /**
     * Renames a file on the remote SFTP server.
     *
     * @param {string} file - Name of the file to remove or archive (e.g. /src/dir/example.csv)
     * @param {string} dest - Path of the file to move (e.g. /dest/dir/example.csv)
     * @param {Object} ftpConfig - SFTP configuration object
     *
     * @returns {string} - Error message if any, or empty string if successful
     */
    async function renameFile(file, dest, ftpConfig) {
      const sftp = new Client();
      let msg;
      try {
        await sftp.connect(ftpConfig);
      } catch (error) {
        const errMsg = error.message || error;
        msg = "Error connecting to SFTP for moving file. Error: " + errMsg;
        console.error(msg);
        return;
      }

      try {
        console.log(`moving file ${file}`);
        await sftp.rename(file, dest);
        msg = `succesfully moved ${file} to ${dest}`;
        console.log(msg);
      } catch (error) {
        const errMsg = error.message || error;
        msg = `Error moving file ${file} to ${dest}. Error: ` + errMsg;
        console.error(msg);
      } finally {
        await sftp.end();
        console.log("done");
      }
      return msg;
    }

    return await renameFile(this.file, this.destPath, ftpConfig);
  },
});
