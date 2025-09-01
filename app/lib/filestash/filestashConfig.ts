import { decryptFilestashConfig, encryptFilestashConfig, generateFilestashSecretKey } from "./crypto";

export type FileStashConfig = {
  general?: {
    secret_key?: string
    /**
     * Upload chunk size in MB
     */
    upload_chunk_size?: number;
  };
  connections?: { type: string; label: string }[];
  middleware?: {
    identity_provider?: { type: string; params?: string };
    attribute_mapping?: { related_backend: string; params?: string | null };
  };
  features?: {
    share?: {
      enable?: boolean;
    };
  };
};


export const updateFilestashConfigString = (originalConfigString: string, username: string, index: number) => {

  const originalConfig: FileStashConfig = JSON.parse(originalConfigString);
  let newConfig: FileStashConfig = structuredClone(originalConfig);
  let secretKey = newConfig.general?.secret_key;

  // clone the original config to newConfig
  newConfig = structuredClone(originalConfig);
  secretKey = newConfig.general?.secret_key;

  if (!secretKey) {
    secretKey = generateFilestashSecretKey();
    if (!newConfig.general) newConfig.general = {};
    newConfig.general.secret_key = secretKey;
  }

  // Set required properties
  newConfig.connections = [
    {
      type: 'local',
      label: 'local',
    },
  ];

  // Set upload chunk size to 10MB
  newConfig.general.upload_chunk_size = 10;

  // Middleware filestash configuration
  const idParamObj = { strategy: 'direct' };
  const idpParamsUnencrypted = JSON.stringify(idParamObj);
  const idpParams = encryptFilestashConfig(secretKey, idpParamsUnencrypted);
  const attributeParamsObj = { local: { type: 'local', password: secretKey, path: '/app/userdata' } };
  const attributeParamsUnencrypted = JSON.stringify(attributeParamsObj);
  const attributeMappingParams = encryptFilestashConfig(secretKey, attributeParamsUnencrypted);

  // Check if the config is the same, if not, update
  // We need to check unencrypted values because encrypted values will differ each time
  // due to changing nonce/iv
  const unencryptedOriginalIdpParams = originalConfig.middleware?.identity_provider?.params ?
    decryptFilestashConfig(secretKey, originalConfig.middleware?.identity_provider?.params) : undefined;
  const unencryptedOriginalAttributeParams = originalConfig.middleware?.attribute_mapping?.params ?
    decryptFilestashConfig(secretKey, originalConfig.middleware?.attribute_mapping?.params) : undefined;
  const unencryptedOriginalMiddleware = {
    identity_provider: {
      type: originalConfig.middleware?.identity_provider?.type,
      params: unencryptedOriginalIdpParams,
    },
    attribute_mapping: {
      related_backend: originalConfig.middleware?.attribute_mapping?.related_backend,
      params: unencryptedOriginalAttributeParams,
    },
  };
  const unencryptedNewMiddleware = {
    identity_provider: {
      type: 'passthrough',
      params: idpParamsUnencrypted,
    },
    attribute_mapping: {
      related_backend: 'local',
      params: attributeParamsUnencrypted,
    },
  };

  // Set features.share.enabled to false by default
  if (!newConfig.features) newConfig.features = {};
  if (!newConfig.features.share) newConfig.features.share = {};
  newConfig.features.share.enable = false;

  const isShareFeatureSame = originalConfig.features?.share?.enable === newConfig.features.share.enable;
  const isMiddlewareSame = JSON.stringify(unencryptedOriginalMiddleware) === JSON.stringify(unencryptedNewMiddleware);

  if (isShareFeatureSame && isMiddlewareSame) {
    console.log(`No changes to filestash middleware config for user ${username}`);
    return { updated: false };
  }

  newConfig.middleware = {
    identity_provider: {
      type: 'passthrough',
      params: idpParams,
    },
    attribute_mapping: {
      related_backend: 'local',
      params: attributeMappingParams,
    },
  };

  // Write the new config
  console.log(`Generated updated filestash config.json for user ${username}`);
  return { updated: true, config: newConfig };
}