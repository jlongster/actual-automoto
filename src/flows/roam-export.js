const { join } = require('path');
const getRoamClient = require('automoto/clients/roam');
const exportRoam = require('automoto/actions/roam-export');

module.exports = config =>
  async function run(app) {
    let roam = await getRoamClient(config.roamAuth);
    console.log(`Installing roam export API (${config.key})`);

    app.get(`/roam/export/actual`, async (req, res) => {
      let token = req.header('x-discord-life-token');

      if (token !== config.exportToken) {
        res.status(403).send();
        return;
      }

      if (process.env.DATA_DIR == null) {
        throw new Error('DATA_DIR must be defined in env');
      }

      console.log(`Downloading graph (${config.roamAuth.graph})...`);
      let { data, metadata } = await exportRoam(
        roam,
        join(process.env.DATA_DIR, 'persona-metadata.json')
      );

      res.header('Content-Type', 'text/javascript');
      res.send(JSON.stringify({ data, metadata }));
    });
  };
