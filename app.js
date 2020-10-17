'use strict';

const Consul = require('./lib/consul');

class AppBootHook {
  constructor(app) {
    this.app = app;
  }
  // 配置文件即将加载
  async configWillLoad() {
    const { multiInstance } = this.app.config.consul;

    // ------------ 初始化consul客户端 ------------
    this.consul = new Consul(this.app);
    this.app.consul = {
      app: this.app,
      consul: this.consul.consul,
      getConfig: this.consul.getConfig
    };
    this.app.logger.info('consul init is ready');

    // ------------ 服务注册 ------------
    await this.consul.regService();
    this.app.logger.info('consul regist is ready');

    // ------------ 服务发现 ------------
    if (multiInstance) {
      await this.consul.findService();
    } else {
      await this.consul.findServiceSync();
    }
  }

  async beforeClose() {
    await this.consul.deregisterConsulService();
    this.app.logger.info('consul deregister is ready');
  }
}

module.exports = AppBootHook;
