const mongoose = require('mongoose');
const AppError = require('../utils/appError');

module.exports = fn => (req, res, next) => {
  fn(req, res, next).catch(err => {
    if (err instanceof mongoose.Error.ValidationError) {
      for (field in err.errors) {
        return next(new AppError(400, err.errors[field].message));
      }
    } else {
      return next(err);
    }
  });
};
