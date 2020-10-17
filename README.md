# ht-egg-consul

Fork: https://github.com/iamljw/egg-consul-plus

<!--
Description here.
-->

## 依赖说明

### 依赖的 egg 版本

ht-egg-consul 版本 | egg 2.x

### 依赖的插件

## 安装插件

```bash
$ npm i ht-egg-consul
// 或者
$ yarn add ht-egg-consul
```

## 开启插件

```js
// config/plugin.js
exports.consulPlus = {
  enable: true,
  package: 'ht-egg-consul',
};
```

## 使用场景

- Why and What: 基于 consul 开发的 egg 插件，实现服务的自动注册和发现，多实例模式和简单的负载均衡、服务熔断。
- How: 开启插件后会在当前应用实例 app 上挂载 consul 客户端和 services 服务列表，分别用`app.consul`和`app.services`进行引用。
*注意：当开启多实例(multiInstance为true)，app.services.referName会切换为异步获取，返回值为Promise对象*

## 详细配置

```js
consul: {
    configFileType: 'yaml' // 用户配置文件类型 yaml | json 默认 json
    server: {
        host: '127.0.0.1', // 注册中心ip地址
        port: 8500 // 注册中心端口号
    },
    services: [ // 服务发现列表
        {
            referName: 'consulPlusTest', // 引用名，后续可用 app.services.referName 访问服务
            comment: 'consulPlusTest', // 备注
            serviceId: 'consul-plus-test' // 服务id
        }
    ],
    register: true, // 是否注册当前模块，默认为false
    multiInstance: true, // 多实例模式开关，默认为false，注意当开启多实例，务必保证集群中的每个项目的keys不同，或者会导致先启动的项目被隔离(被覆盖)
    name: 'consul-plus-test', // 注册id
    tags: ['consul-plus-test'], // 标签信息
    check: {
        http: 'http://127.0.0.1:7777', // 健康检测地址
        interval: '5s', // 健康检测间隔
        notes: 'http service check',
        status: 'critical'
    },
    address: '127.0.0.1', // 当前模块的注册地址
    port: 7777 // 当前模块的注册端口号
}
```

## 单元测试

<!-- 描述如何在单元测试中使用此插件，例如 schedule 如何触发。无则省略。-->

## 提问交流


## License

[MIT](LICENSE)
