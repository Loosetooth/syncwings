import { XMLBuilder, XMLParser } from "fast-xml-parser";

/**
 * Update syncthing config.xml with required settings.
 * Ensures listen addresses, discovery ports, default folder path, and auto-accept folders are set.
 * @param originalConfigXml Original config.xml content as string
 * @param index User index to determine ports
 * @returns Object indicating if update was made and reasons. Includes the new XML string if updated.
 */
export const updateSyncthingConfigString = (originalConfigXml: string, username: string, index: number) => {

  const tcpPort = 22000 + index;
  const discoveryPort = 21027 + index;

  const parser = new XMLParser({ ignoreAttributes: false });
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    suppressBooleanAttributes: false
  });
  const config = parser.parse(originalConfigXml);

  let modified = false;
  const updateReasons: string[] = [];
  // Update listenAddress (each as a separate element)
  const listenAddresses = [
    `tcp://0.0.0.0:${tcpPort}`,
    `quic://0.0.0.0:${tcpPort}`,
    'dynamic+https://relays.syncthing.net/endpoint'
  ];
  // Check if all listen addresses are already present
  let currentAddresses = config.configuration.options.listenAddress;
  console.log('Current listen addresses:', currentAddresses);
  if (Array.isArray(currentAddresses)) {
    listenAddresses.forEach(addr => {
      if (!currentAddresses.includes(addr)) {
        currentAddresses.push(addr);
        modified = true;
        updateReasons.push(`Listening address ${addr} added`);
      }
    });
  } else if (typeof currentAddresses === 'string') {
    if (currentAddresses === 'default') {
      config.configuration.options.listenAddress = listenAddresses;
      modified = true;
      updateReasons.push('Updated default listen addresses');
    } else {
      // Comma separated string?
      currentAddresses = currentAddresses.split(',').map(s => s.trim());
      let changed = false;
      listenAddresses.forEach(addr => {
        if (!currentAddresses.includes(addr)) {
          currentAddresses.push(addr);
          modified = true;
          changed = true;
          updateReasons.push(`Listening address ${addr} added`);
        }
      });
      if (changed) {
        config.configuration.options.listenAddress = currentAddresses;
        modified = true;
        updateReasons.push('Updated listen addresses from comma-separated string');
      }
    }
  } else {
    config.configuration.options.listenAddress = listenAddresses;
    modified = true;
    updateReasons.push('Set initial listen addresses');
  }

  // Update localAnnouncePort and localAnnounceMCAddr
  if (config.configuration.options.localAnnouncePort !== discoveryPort) {
    config.configuration.options.localAnnouncePort = discoveryPort;
    modified = true;
    updateReasons.push(`Local announce port set to ${discoveryPort}`);
  }
  if (config.configuration.options.localAnnounceMCAddr !== `[ff12::8384]:${discoveryPort}`) {
    config.configuration.options.localAnnounceMCAddr = `[ff12::8384]:${discoveryPort}`;
    modified = true;
    updateReasons.push(`Local announce multicast address set to [ff12::8384]:${discoveryPort}`);
  }

  // Set default folder path and auto-accept
  if (config.configuration.defaults.folder?.['@_path'] !== '/data/') {
    if (!config.configuration.defaults.folder) {
      config.configuration.defaults.folder = {};
    }
    config.configuration.defaults.folder['@_path'] = '/data/';
    modified = true;
    updateReasons.push('Default folder path set to /data/');
  }
  if (config.configuration.defaults.device?.autoAcceptFolders !== true) {
    if (!config.configuration.defaults.device) {
      config.configuration.defaults.device = {};
    }
    config.configuration.defaults.device.autoAcceptFolders = true;
    modified = true;
    updateReasons.push('Auto-accept folders enabled');
  }

  if (!modified) {
    console.log(`No changes to Syncthing config.xml for ${username}`);
    return { updated: false };
  }

  const newXml = builder.build(config);
  console.log(`Generated updated config.xml for ${username}`);
  console.log(`Reasons for update: ${updateReasons.join(';\n')}`);
  return { updated: true, reasons: updateReasons, xml: newXml };
}
