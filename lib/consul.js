'use strict';

const DEFAULT_CONSUL_CONFIG = {
  promisify: true,
  secure: false,
  port: 8500
};


class Consul {
  constructor(app) {
    this.app = app;
    this.initClient();
  }
  /**
   * 初始化consul客户端
   */
  initClient() {
    const { config } = this.app;
    const { consul: consulConf } = config;
    this.consul = require('consul')(
      Object.assign({}, DEFAULT_CONSUL_CONFIG, consulConf.server)
    );
  }

  /**
   * 注册服务
   */
  async regService() {
    const { config } = this.app;
    const { consul: consulConf } = config;
    if (consulConf.register) {
      if (consulConf.multiInstance) {
        consulConf.name +=
          config.keys instanceof Array ? config.keys[0] : config.keys;
      }
      await this.consul.agent.service.register(consulConf);
    }
  }

  /**
   * 服务发现(同步)
   */
  async findServiceSync() {
    this.app.services = {};
    const { services } = this.app.config.consul;
    for (const elem of services) {
      const { referName, serviceId } = elem;
      // 通过服务id获得ws
      const checks = await this.consul.agent.check.list();
      const services = await this.consul.agent.service.list();
      if (Object.keys(checks).length <= 0) {
        throw new Error(`找不到该服务:${serviceId}`);
      }
      const checkId = 'service:' + serviceId;
      const check = checks[0][checkId];
      if (!check) {
        throw new Error(`找不到该服务:${serviceId}`);
      }
      if (check.Status !== 'passing') {
        throw new Error(`服务异常:${serviceId}`);
      }
      const service = services[0][serviceId];
      const { Address, Port } = service;
      this.app.services[referName] = 'http://' + Address + ':' + Port;
    }
    this.app.logger.info('app.services', this.app.services);
  }

  /**
   * 服务发现(异步)
   */
  async findService() {
    const { services: servicesConf } = this.app.config.consul;
    this.app.services = new Proxy(
      {},
      {
        get: async (target, propKey, receiver) => {
          const matchedService = servicesConf.find(
            elem => elem.referName === propKey
          );
          if (!matchedService) {
            return;
          }
          let { serviceId } = matchedService;
          const checks = await this.consul.agent.check.list();
          const services = await this.consul.agent.service.list();
          if (Object.keys(checks).length === 0) {
            return;
          }
          const checkId = 'service:' + serviceId;
          const keys = Object.keys(checks[0]);
          const targetServices = keys.filter(elem => {
            return (
              elem.startsWith(checkId) && checks[0][elem].Status === 'passing'
            );
          });
          if (targetServices.length === 0) {
            return;
          }
          const rand = Math.floor(Math.random() * targetServices.length);
          serviceId = targetServices[rand].split(':')[1];
          const service = services[0][serviceId];
          const { Address, Port } = service;

          return 'http://' + Address + ':' + Port;
        }
      }
    );
  }

  /**
   * 注销本地注册在consul的服务
   */
  async deregisterConsulService() {
    const { config: { consul } } = this.app;
    try {
      if (consul && consul.register) {
        await Promise.all([
          this.consul.agent.service.deregister(consul.name),
          this.consul.agent.check.deregister(consul.name)
        ]);
      }
    } catch (error) {
      if (error instanceof Error) {
        error.function = 'deregisterService';
        error.data = consul;
      }
      throw error;
    }
  }

  /**
   * 获取配置
   * @param {String} key key
   */
  async getConfig(key) {
    const { config: { consul } } = this.app;
    const result = await this.consul.kv.get(key);

    if (!result) {
      return Promise.reject(new Error(`${key} 不存在`));
    }

    if (consul.configFileType === 'yaml') {
      return require('yamljs').parse(result.Value);
    }
    return JSON.parse(result.Value);
  }
}

module.exports = Consul;
