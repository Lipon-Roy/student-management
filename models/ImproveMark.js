// External import
const mongoose = require("mongoose");

const improveMarkSchema = mongoose.Schema({
  department: {
    type: String,
    required: true,
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
  },
  roll: {
    type: String,
    required: true,
  },
  courseName: {
    type: String,
    required: true,
  },
  courseCode: {
    type: String,
    required: true,
  },
  currentSession: {
    type: String,
    required: true,
  },
  totalInternal: {
    type: Number,
    required: true,
  },
  totalExternal: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  firstExaminer: {
    type: Number,
    min: 0,
    max: 60,
    default: 0,
  },
  secondExaminer: {
    type: Number,
    min: 0,
    max: 60,
    default: 0,
  },
  isThirdExaminer: {
    type: Boolean,
    default: false,
  },
  thirdExaminer: {
    type: Number,
    min: 0,
    max: 60,
    default: 0,
  },
});

const ImproveMark = mongoose.model("Improve", improveMarkSchema);

module.exports = ImproveMark;
