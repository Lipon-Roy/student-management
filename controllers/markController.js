// front end a total field ta auto fill kore dis, jkhon marks input dibe
// External import
const createError = require("http-errors");

// Internal imports
const Mark = require("../models/Mark");
const LabMark = require("../models/LabMark");
const ImproveMark = require("../models/ImproveMark");
const LabImprove = require("../models/LabImproveMark");

// get all marks
const getAllMarks = async (req, res, next) => {
  try {
    const { dept, session, semester, courseName, courseCode } = req.params;
    const marks = await Mark.find({
      department: dept,
      currentSession: session,
      semester: Number(semester),
      courseName,
      courseCode,
    });
    res.status(200).json({
      result: marks,
    });
  } catch (err) {
    next(createError(err.message));
  }
};

// get internal mark for single student
const getSingleMark = async (req, res, next) => {
  const { dept, semester, session, courseName, courseCode, roll } = req.params;

  try {
    const mark = await Mark.findOne({
      department: dept,
      currentSession: session,
      semester: Number(semester),
      courseName,
      courseCode,
      roll,
    });

    res.status(200).json({
      result: mark,
    });
  } catch (err) {
    next(createError(err.message));
  }
};

// get mark which are isThirdExaminer true
const getIsThirdExaminer = async (req, res, next) => {
  const { dept, semester, courseName, courseCode } = req.params;

  try {
    const marks = await Mark.find({
      department: dept,
      semester,
      courseName,
      courseCode,
      isThirdExaminer: true,
    });

    res.status(200).json({
      result: marks,
    });
  } catch (err) {
    next(createError(err.message));
  }
};

// get improve third examiner mark
const getImproveMark = async (req, res, next) => {
  const { dept, semester, courseName, courseCode, roll } = req.params;

  try {
    const mark = await ImproveMark.findOne({
      department: dept,
      semester,
      courseName,
      courseCode,
      roll,
    });

    res.status(200).json({
      result: mark,
    });
  } catch (err) {
    next(createError(err.message));
  }
};

const getLabMarks = async (req, res, next) => {
  try {
    const marks = await LabMark.find();
    res.status(200).json({
      result: marks,
    });
  } catch (err) {
    next(createError(err.message));
  }
};

// add marks
const addMarks = async (req, res, next) => {
  try {
    // await newMark.save();
    await Mark.insertMany(req.body.marks);

    res.status(201).json({
      message: "Marks added successfully",
    });
  } catch (err) {
    res.status(500).json({
      errors: {
        common: {
          message: err.message,
        },
      },
    });
  }
};

// add internal mark for single student
const addSingleInternalMark = async (req, res, next) => {
  try {
    const {
      department,
      semester,
      currentSession,
      roll,
      courseName,
      courseCode,
      midOne,
      midTwo,
      attendance,
      presentationOrAssignment,
    } = req.body;

    const totalInternal =
      midOne + midTwo + attendance + presentationOrAssignment;

    await Mark.updateOne(
      {
        department: department,
        semester: Number(semester),
        roll: roll,
        courseName: courseName,
        courseCode: courseCode,
        currentSession,
      },
      {
        $set: {
          midOne,
          midTwo,
          attendance,
          presentationOrAssignment,
          totalInternal,
          credit: 3,
        },
      },
      {
        upsert: true,
      }
    );
    res.status(200).send({
      message: `Internal marks updated successfully`,
    });
  } catch (err) {
    res.status(500).json({
      errors: {
        common: {
          message: err.message,
        },
      },
    });
  }
};

// add internal mark for multiple student
const addMultipleInternalMark = async (req, res, next) => {
  try {
    const { marks } = req.body;
    // 64e384d6b12e86454d8d2ce4

    const bulk = [];
    marks.forEach((m) => {
      const {
        midOne,
        midTwo,
        attendance,
        presentationOrAssignment,
        currentSession,
      } = m;

      const totalInternal =
        midOne + midTwo + attendance + presentationOrAssignment;

      let updateDoc = {
        updateOne: {
          filter: {
            department: m.department,
            semester: Number(m.semester),
            roll: m.roll,
            courseName: m.courseName,
            courseCode: m.courseCode,
            currentSession,
          },
          update: {
            midOne,
            midTwo,
            attendance,
            presentationOrAssignment,
            totalInternal,
            credit: 3,
          },
          upsert: true,
        },
      };
      bulk.push(updateDoc);
    });
    await Mark.bulkWrite(bulk);

    res.status(200).json({
      message: `Internal marks added successfully for all student`,
    });
  } catch (err) {
    res.status(500).json({
      errors: {
        common: {
          message: err.message,
        },
      },
    });
  }
};

// add external mark for single student
const addSingleExternalMark = async (req, res, next) => {
  try {
    let {
      department,
      semester,
      roll,
      courseName,
      courseCode,
      firstExaminer,
      secondExaminer,
      currentSession,
    } = req.body;

    let total, sixty;

    // get internal mark and set total
    const result = await Mark.findOne({
      department,
      semester,
      roll,
      courseName,
      courseCode,
      currentSession,
    });

    if (!result) {
      throw `Mark was not found for id ${roll}`;
    }

    const { totalInternal } = result;
    sixty = (firstExaminer + secondExaminer) / 2;
    const totalExternal = Number(sixty.toFixed(2));
    total = totalInternal + totalExternal;

    await Mark.updateOne(
      {
        department,
        semester,
        roll,
        courseName,
        courseCode,
        currentSession,
      },
      {
        $set: {
          firstExaminer,
          secondExaminer,
          totalExternal,
          total,
          isThirdExaminer: Math.abs(firstExaminer - secondExaminer) > 12,
        },
      }
    );

    res.status(200).send({
      message: `External mark added`,
    });
  } catch (err) {
    res.status(500).json({
      errors: {
        common: {
          message: err.message,
        },
      },
    });
  }
};

// add external marks for multiple student
const addMultipleExternalMark = async (req, res, next) => {
  try {
    const { marks } = req.body;
    // forEach er moddhe async/await babohar kora jaccilo na

    const bulk = [];
    for (let m of marks) {
      let { firstExaminer, secondExaminer, semester } = m;
      let total, sixty;

      // get internal marks and set total
      const result = await Mark.findOne({
        department: m.department,
        semester,
        roll: m.roll,
        courseName: m.courseName,
        courseCode: m.courseCode,
        currentSession: m.currentSession,
      });

      if (!result) {
        throw `Mark was not found for id ${m.roll}`;
      }

      const { totalInternal } = result;
      sixty = (firstExaminer + secondExaminer) / 2;
      totalExternal = Number(sixty.toFixed(2));
      total = totalInternal + totalExternal;

      let updateDoc = {
        updateOne: {
          filter: {
            department: m.department,
            semester,
            roll: m.roll,
            courseName: m.courseName,
            courseCode: m.courseCode,
            currentSession: m.currentSession,
          },
          update: {
            firstExaminer,
            secondExaminer,
            totalExternal,
            total,
            isThirdExaminer: Math.abs(firstExaminer - secondExaminer) > 12,
          },
        },
      };

      bulk.push(updateDoc);
    }
    await Mark.bulkWrite(bulk);

    res.status(200).json({
      message: `External marks added`,
    });
  } catch (err) {
    res.status(500).json({
      errors: {
        common: {
          message: err.message,
        },
      },
    });
  }
};

// add third examiner mark for multiple student
const addThirdExaminerMarks = async (req, res, next) => {
  try {
    const { marks } = req.body;

    const bulk = [];
    for (let m of marks) {
      let total, sixty;

      // get internal marks and set total and minimum
      const result = await Mark.findOne({
        department: m.department,
        semester: m.semester,
        roll: m.roll,
        courseName: m.courseName,
        courseCode: m.courseCode,
        isThirdExaminer: true,
        currentSession: m.currentSession,
      });

      if (!result) {
        throw createError(`Mark was not found for id ${m.roll}`);
      }

      const { totalInternal, firstExaminer, secondExaminer } = result;
      const thirdExaminer = m.thirdExaminer;

      let diffOne = Math.abs(firstExaminer - secondExaminer);
      let diffTwo = Math.abs(secondExaminer - thirdExaminer);
      let diffThree = Math.abs(firstExaminer - thirdExaminer);

      const minimum = Math.min(diffOne, diffTwo, diffThree);

      switch (minimum) {
        case Math.abs(firstExaminer - secondExaminer):
          sixty = (firstExaminer + secondExaminer) / 2;
          break;
        case Math.abs(secondExaminer - thirdExaminer):
          sixty = (secondExaminer + thirdExaminer) / 2;
          break;
        default:
          sixty = (firstExaminer + thirdExaminer) / 2;
      }

      const totalExternal = Number(sixty.toFixed(2));
      total = totalInternal + totalExternal;

      let updateDoc = {
        updateOne: {
          filter: {
            department: m.department,
            semester: m.semester,
            roll: m.roll,
            courseName: m.courseName,
            courseCode: m.courseCode,
            isThirdExaminer: true,
            currentSession: m.currentSession,
          },
          update: {
            thirdExaminer,
            totalExternal,
            total,
            isThirdExaminer: false,
          },
        },
      };
      bulk.push(updateDoc);
    }
    await Mark.bulkWrite(bulk);

    res.status(200).json({
      message: `Third examiner marks added`,
    });
  } catch (err) {
    res.status(500).json({
      errors: {
        common: {
          message: err.message,
        },
      },
    });
  }
};

// add lab mark for single student
const addSingleLabMark = async (req, res) => {
  try {
    const {
      department,
      semester,
      currentSession,
      roll,
      courseName,
      courseCode,
      attendance,
      labReport,
      continuousAssesment,
      finalExamination
    } = req.body;

    const totalInternal = attendance + labReport + continuousAssesment;
    const totalExternal = finalExamination;

    const result = await LabMark.updateOne(
      {
        department,
        semester,
        currentSession,
        roll,
        courseName,
        courseCode,
      },
      {
        $set: {
          attendance,
          labReport,
          continuousAssesment,
          totalInternal,
          totalExternal,
          labTotal: totalInternal + totalExternal,
          credit: 1.5,
        },
      },
      {
        upsert: true,
      }
    );

    res.status(201).json({
      message: "Lab mark successfully added",
    });
  } catch (err) {
    res.status(500).json({
      errors: {
        common: {
          message: err.message,
        },
      },
    });
  }
};

// add lab mark for multiple student
const addMultipleLabMark = async (req, res) => {
  try {
    const { marks } = req.body;
    // 64e38506b12e86454d8d2cec

    const bulk = [];
    marks.forEach((m) => {
      const {attendance, labReport, continuousAssesment, finalExamination} = m;
      const totalInternal = attendance + labReport + continuousAssesment;
      const totalExternal = finalExamination;

      let updateDoc = {
        updateOne: {
          filter: {
            department: m.department,
            semester: m.semester,
            currentSession: m.currentSession,
            roll: m.roll,
            courseName: m.courseName,
            courseCode: m.courseCode,
          },
          update: {
            attendance,
            labReport,
            continuousAssesment,
            totalInternal,
            totalExternal,
            labTotal: totalInternal + totalExternal,
            credit: 1.5,
          },
          upsert: true,
        },
      };
      bulk.push(updateDoc);
    });

    await LabMark.bulkWrite(bulk);

    res.status(200).json({
      message: `Lab marks added for all student`,
    });
  } catch (err) {
    res.status(500).json({
      errors: {
        common: {
          message: err.message,
        },
      },
    });
  }
};

const addSingleLabImproveMark = async (req, res) => {
  try {
    const {
      department,
      semester,
      currentSession,
      roll,
      courseName,
      courseCode,
      attendance,
      labReport,
      continuousAssesment,
      finalExamination
    } = req.body;

    const totalInternal = attendance + labReport + continuousAssesment;
    const totalExternal = finalExamination;

    const prevMark = await LabMark.findOne({
      department,
      semester,
      currentSession,
      roll,
      courseName,
      courseCode,
    });

    if (!prevMark) {
      throw createError("This course was not found");
    }

    const result = await LabImprove.updateOne(
      {
        department,
        semester,
        currentSession,
        roll,
        courseName,
        courseCode,
      },
      {
        $set: {
          attendance,
          labReport,
          continuousAssesment,
          totalInternal,
          totalExternal,
          labTotal: totalInternal + totalExternal,
          credit: 1.5,
        },
      },
      {
        upsert: true,
      }
    );

    if (!result) {
      throw createError("Failed to add lab improve mark");
    }

    res.status(201).json({
      message: "Lab improve mark successfully added",
    });
  } catch (err) {
    res.status(500).json({
      errors: {
        common: {
          message: err.message,
        },
      },
    });
  }
};

// add theory course improvements mark for single student
const addSingleImproveMark = async (req, res) => {
  try {
    const {
      department,
      semester,
      currentSession,
      roll,
      courseName,
      courseCode,
      firstExaminer,
      secondExaminer,
    } = req.body;

    const semesterMark = await Mark.findOne({
      department,
      semester,
      currentSession,
      roll,
      courseCode,
      courseName,
    });

    if (!semesterMark) {
      throw createError("This course was not found");
    }

    const { totalInternal } = semesterMark;

    const sixty = (Number(firstExaminer) + Number(secondExaminer)) / 2;
    const totalExternal = Number(sixty.toFixed(2));
    const total = totalInternal + totalExternal;

    const result = await ImproveMark.updateOne(
      {
        department: department,
        semester: semester,
        currentSession,
        roll: roll,
        courseName,
        courseCode,
      },
      {
        $set: {
          credit: 3,
          firstExaminer,
          secondExaminer,
          totalInternal,
          totalExternal,
          total,
          isThirdExaminer: Math.abs(firstExaminer - secondExaminer) > 12,
        },
      },
      {
        upsert: true,
      }
    );

    if (!result?.acknowledged) {
      throw createError("Improve mark addition failed");
    }

    res.status(200).send({
      message: `Improve mark added`,
    });
  } catch (err) {
    res.status(500).json({
      errors: {
        common: {
          message: err.message,
        },
      },
    });
  }
};

// add third examiner mark for theory course improvement
const addSingleThirdImproveMark = async (req, res) => {
  try {
    const {
      department,
      semester,
      currentSession,
      roll,
      courseName,
      courseCode,
      thirdExaminer,
    } = req.body;

    const prevMark = await ImproveMark.findOne({
      department,
      semester,
      currentSession,
      isThirdExaminer: true,
      roll,
      courseName,
      courseCode,
    });

    if (!prevMark) {
      throw createError("This course was not found");
    }

    const { totalInternal, firstExaminer, secondExaminer } = prevMark;

    const diffOne = Math.abs(firstExaminer - secondExaminer);
    const diffTwo = Math.abs(secondExaminer - thirdExaminer);
    const diffThree = Math.abs(firstExaminer - thirdExaminer);

    const minimum = Math.min(diffOne, diffTwo, diffThree);
    let sixty;

    switch (minimum) {
      case Math.abs(firstExaminer - secondExaminer):
        sixty = (firstExaminer + secondExaminer) / 2;
        break;
      case Math.abs(secondExaminer - thirdExaminer):
        sixty = (secondExaminer + thirdExaminer) / 2;
        break;
      default:
        sixty = (firstExaminer + thirdExaminer) / 2;
    }

    const totalExternal = Number(sixty.toFixed(2));
    const total = totalInternal + totalExternal;

    const result = await ImproveMark.updateOne(
      {
        department,
        semester,
        currentSession,
        isThirdExaminer: true,
        roll,
        courseName,
        courseCode,
      },
      {
        $set: {
          thirdExaminer,
          totalExternal,
          total,
          isThirdExaminer: false,
        },
      }
    );

    if (!result?.acknowledged) {
      throw createError("Improve mark addition failed");
    }

    res.status(200).send({
      message: `Third examiner mark added for improvements`,
    });
  } catch (err) {
    res.status(500).json({
      errors: {
        common: {
          message: err.message,
        },
      },
    });
  }
};

module.exports = {
  getAllMarks,
  getSingleMark,
  getIsThirdExaminer,
  getImproveMark,
  getLabMarks,
  addMarks,
  addSingleInternalMark,
  addMultipleInternalMark,
  addSingleExternalMark,
  addMultipleExternalMark,
  addThirdExaminerMarks,
  addSingleLabMark,
  addMultipleLabMark,
  addSingleImproveMark,
  addSingleThirdImproveMark,
  addSingleLabImproveMark,
};
