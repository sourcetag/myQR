'use strict';
exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://admin:admin1234@ds263018.mlab.com:63018/qvery-manager';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || "mongodb://localhost/test-myqr";
exports.PORT = process.env.PORT || 8080;
exports.SECRET = process.env.SECRET || "1212312121";