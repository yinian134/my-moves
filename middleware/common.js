// middleware/common.js
const express = require('express');
const cors    = require('cors');
const path    = require('path');

module.exports = function (app) {
  // 1. 跨域
  app.use(cors());

  // 2. 解析 JSON
  app.use(express.json());

  // 3. 解析 URL-encoded
  app.use(express.urlencoded({ extended: true }));

  // 4. 静态资源目录
  app.use(express.static(path.join(__dirname, '../public')));
};