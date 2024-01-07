// External import
const mongoose = require("mongoose");

const labMarkSchema = mongoose.Schema({
  department: {
    type: String,
    required: true,
    //enum korar plan ase pore
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
  },
  currentSession: {
    type: String,
    required: true,
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
  credit: {
    type: Number,
    required: true,
  },
  attendance: {
    type: Number,
    min: 0,
    max: 10,
    required: true,
  },
  labReport: {
    type: Number,
    min: 0,
    max: 10,
    required: true,
  },
  continuousAssesment: {
    type: Number,
    min: 0,
    max: 20,
    required: true
  },
  totalInternal: {
    type: Number,
    required: true,
  },
  totalExternal: {
    type: Number,
    required: true,
  },
  labTotal: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
});

const LabImprove = mongoose.model("LabImprove", labMarkSchema);

module.exports = LabImprove;
