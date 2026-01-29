import Client from 'ssh2-sftp-client@^12.0.1'

/**
 * Walks a directory on the remote SFTP server and returns a list of files.
 *
 * @param {Client} sftp
 * @param {string} remotePath
 * @param {Record<string, string>} files
 * @returns {Promise<Object>}
 */
async function walkDir(sftp, remotePath, files = {}) {
  const list = await sftp.list(remotePath)

  for (const item of list) {
    if (item.type === '-') {
      const fullPath = `${remotePath}/${item.name}`
      const file = await sftp.get(fullPath)
      files[item.name] = file.toString()
    }
  }

  return files
}

export default {
  name: "Download SFTP Files",
  description: "Downloads all files from a directory on an SFTP host.",
  key: "sftp_download_files",
  version: "0.0.1",
  type: "action",

  props: {
    sftp: {
      type: 'app',
      app: 'sftp',
    },
    directory: {
      type: 'string',
      label: 'Directory on SFTP host',
      description: 'The directory on the SFTP server from which to download files.',
      default: '/',
      optional: true,
    }
  },
  async run({ $ }) {
    const { host, username, privateKey } = this.sftp.$auth

    if (!host) {
      throw Error('missing host')
    }

    if (!username) {
      throw Error('missing username')
    }

    if (!privateKey) {
      throw Error('missing privateKey')
    }

    const config = {
      host,
      username,
      privateKey,
    }

    const sftp = new Client()

    await sftp.connect(config)

    const files = await walkDir(sftp, this.directory)

    await sftp.end()

    $.export(
      "$summary",
      `Successfully downloaded ${files.length} files.`
    );

    return {
      files,
    }
  },
}
