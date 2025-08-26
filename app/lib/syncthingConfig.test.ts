
import { describe, it, expect } from 'vitest';
import { updateSyncthingConfigString } from './syncthingConfig';

const sampleConfigXml = `<?xml version="1.0"?>
<configuration version="51">
  <device id="ABCDEF" name="test-device" compression="metadata" introducer="false" skipIntroductionRemovals="false" introducedBy="">
    <address>dynamic</address>
    <paused>false</paused>
    <autoAcceptFolders>false</autoAcceptFolders>
  </device>
  <gui tls="false" sendBasicAuthPrompt="false">
    <address>0.0.0.0:8384</address>
    <metricsWithoutAuth>false</metricsWithoutAuth>
    <apikey>testapikey</apikey>
    <theme>default</theme>
  </gui>
  <options>
    <listenAddress>default</listenAddress>
    <globalAnnounceServer>default</globalAnnounceServer>
    <globalAnnounceEnabled>true</globalAnnounceEnabled>
    <localAnnounceEnabled>true</localAnnounceEnabled>
    <localAnnouncePort>21030</localAnnouncePort>
    <localAnnounceMCAddr>[ff12::8384]:21030</localAnnounceMCAddr>
  </options>
  <defaults>
    <folder path="/data/" type="sendreceive">
      <filesystemType>basic</filesystemType>
    </folder>
    <device autoAcceptFolders="false" />
  </defaults>
</configuration>`;

describe('updateSyncthingConfigString', () => {
  it('updates listenAddress from default', () => {
    const { updated, xml } = updateSyncthingConfigString(sampleConfigXml, 'test', 3);
    expect(updated).toBe(true);
    expect(xml).toContain('tcp://0.0.0.0:22003');
    expect(xml).toContain('quic://0.0.0.0:22003');
    expect(xml).toContain('dynamic+https://relays.syncthing.net/endpoint');
  });

  it('updates localAnnouncePort and localAnnounceMCAddr', () => {
    const { updated, xml } = updateSyncthingConfigString(sampleConfigXml, 'test', 3);
    expect(xml).toContain('<localAnnouncePort>21030</localAnnouncePort>');
    expect(xml).toContain('<localAnnounceMCAddr>[ff12::8384]:21030</localAnnounceMCAddr>');
  });

  it('updates default folder path', () => {
    const { updated, xml } = updateSyncthingConfigString(sampleConfigXml, 'test', 3);
    expect(xml).toContain('path="/data/"');
  });

  it('enables autoAcceptFolders', () => {
    const { updated, xml } = updateSyncthingConfigString(sampleConfigXml, 'test', 3);
    // Should match either <autoAcceptFolders>true</autoAcceptFolders> or autoAcceptFolders="true" (attribute)
    expect(
      xml.includes('<autoAcceptFolders>true</autoAcceptFolders>') ||
      xml.includes('autoAcceptFolders="true"')
    ).toBe(true);
  });

  it('leaves unrelated settings intact', () => {
    const { updated, xml } = updateSyncthingConfigString(sampleConfigXml, 'test', 3);
    expect(xml).toContain('<apikey>testapikey</apikey>');
    expect(xml).toContain('<theme>default</theme>');
  });

  it('handles comma separated listenAddress', () => {
    const configWithComma = sampleConfigXml.replace('<listenAddress>default</listenAddress>', '<listenAddress>tcp://0.0.0.0:22003,quic://0.0.0.0:22003</listenAddress>');
    const { updated, xml } = updateSyncthingConfigString(configWithComma, 'test', 3);
    expect(updated).toBe(true);
    expect(xml).toContain('tcp://0.0.0.0:22003');
    expect(xml).toContain('quic://0.0.0.0:22003');
    expect(xml).toContain('dynamic+https://relays.syncthing.net/endpoint');
  });

  it('handles multiple listenAddress fields', () => {
    const configWithMultiple = sampleConfigXml.replace('<listenAddress>default</listenAddress>', '<listenAddress>tcp://0.0.0.0:22003</listenAddress>\n      <listenAddress>quic://0.0.0.0:22003</listenAddress>');
    const { updated, xml } = updateSyncthingConfigString(configWithMultiple, 'test', 3);
    expect(updated).toBe(true);
    expect(xml).toContain('tcp://0.0.0.0:22003');
    expect(xml).toContain('quic://0.0.0.0:22003');
    expect(xml).toContain('dynamic+https://relays.syncthing.net/endpoint');
  });
});
