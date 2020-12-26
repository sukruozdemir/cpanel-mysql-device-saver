import Joi from 'joi';

export const createDevice = {
  body: Joi.object().keys({
    token: Joi.string().allow(null, ''),
    uniqueAppDeviceId: Joi.string().required(),
    brand: Joi.string().allow(null, ''),
    manufacturer: Joi.string().allow(null, ''),
    modelName: Joi.string().allow(null, ''),
    modelId: Joi.alternatives(Joi.string(), Joi.number()).allow(null, ''),
    designName: Joi.string().allow(null, ''),
    productName: Joi.string().allow(null, ''),
    deviceYearClass: Joi.alternatives(Joi.string(), Joi.number()).allow(null, ''),
    totalMemory: Joi.alternatives(Joi.string(), Joi.number()).allow(null, ''),
    osName: Joi.string().allow(null, ''),
    osVersion: Joi.alternatives(Joi.string(), Joi.number()).allow(null, ''),
    osBuildId: Joi.alternatives(Joi.string(), Joi.number()).allow(null, ''),
    osInternalBuildId: Joi.alternatives(Joi.string(), Joi.number()).allow(null, ''),
    osBuildFingerprint: Joi.string().allow(null, ''),
    platformApiLevel: Joi.alternatives(Joi.string(), Joi.number()).allow(null, ''),
    deviceName: Joi.string().allow(null, ''),
    deviceType: Joi.string().allow(null, ''),
    networkStateType: Joi.string().allow(null, ''),
    networkIpAddress: Joi.string().allow(null, ''),
    networkMacAddress: Joi.string().allow(null, ''),
    supportedCpuArchitectures: Joi.array().allow(null),
  }),
};

export const saveToken = {
  body: Joi.object().keys({
    uniqueAppDeviceId: Joi.string().required(),
    token: Joi.string().required()
  })
}
