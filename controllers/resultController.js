// external imports
const createError = require("http-errors");
const ImproveMark = require("../models/ImproveMark");

// internal imports
const Mark = require("../models/Mark");
const Point = require("../models/Point");

const getTabulation = async (req, res, next) => {
  try {
    const { dept, session, semester } = req.params;

    const marks = await Mark.aggregate([
      {
        $match: {
          department: dept,
          currentSession: session,
          semester: Number(semester),
        },
      },
      {
        $group: {
          _id: "$roll",
          courses: { $push: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "labmarks",
          localField: "_id",
          foreignField: "roll",
          pipeline: [
            {
              $match: {
                department: dept,
                currentSession: session,
                semester: Number(semester),
              },
            },
          ],
          as: "labs",
        },
      },
      {
        $lookup: {
          from: "points",
          localField: "_id",
          foreignField: "roll",
          pipeline: [
            {
              $match: {
                department: dept,
                currentSession: session,
                semester: { $lt: Number(semester) },
              },
            },
          ],
          as: "prevPoints",
        },
      },
      {
        $project: {
          _id: 1,
          courses: {
            $map: {
              input: "$courses",
              as: "course",
              in: {
                courseCode: "$$course.courseCode",
                credit: "$$course.credit",
                "theory Continuous (40%)": {
                  $sum: [
                    "$$course.midOne",
                    "$$course.midTwo",
                    "$$course.presentationOrAssignment",
                    "$$course.attendance",
                  ],
                },
                "theory final exam (60%)": {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $lte: [
                            {
                              $abs: {
                                $subtract: [
                                  "$$course.firstExaminer",
                                  "$$course.secondExaminer",
                                ],
                              },
                            },
                            12,
                          ],
                        },
                        then: {
                          $avg: [
                            "$$course.firstExaminer",
                            "$$course.secondExaminer",
                          ],
                        },
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $abs: {
                                $subtract: [
                                  "$$course.firstExaminer",
                                  "$$course.secondExaminer",
                                ],
                              },
                            },
                            "$$course.minimum",
                          ],
                        },
                        then: {
                          $avg: [
                            "$$course.firstExaminer",
                            "$$course.secondExaminer",
                          ],
                        },
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $abs: {
                                $subtract: [
                                  "$$course.secondExaminer",
                                  "$$course.thirdExaminer",
                                ],
                              },
                            },
                            "$$course.minimum",
                          ],
                        },
                        then: {
                          $avg: [
                            "$$course.secondExaminer",
                            "$$course.thirdExaminer",
                          ],
                        },
                      },
                    ],
                    default: {
                      $avg: [
                        "$$course.firstExaminer",
                        "$$course.thirdExaminer",
                      ],
                    },
                  },
                },
                total: "$$course.total",
                LG: {
                  $switch: {
                    branches: [
                      {
                        case: { $gte: ["$$course.total", 80] },
                        then: "A+",
                      },
                      { case: { $gte: ["$$course.total", 75] }, then: "A" },
                      {
                        case: { $gte: ["$$course.total", 70] },
                        then: "A-",
                      },
                      {
                        case: { $gte: ["$$course.total", 65] },
                        then: "B+",
                      },
                      { case: { $gte: ["$$course.total", 60] }, then: "B" },
                      {
                        case: { $gte: ["$$course.total", 55] },
                        then: "B-",
                      },
                      {
                        case: { $gte: ["$$course.total", 50] },
                        then: "C+",
                      },
                      { case: { $gte: ["$$course.total", 45] }, then: "C" },
                      { case: { $gte: ["$$course.total", 40] }, then: "D" },
                    ],
                    default: "F",
                  },
                },
                GP: {
                  $switch: {
                    branches: [
                      { case: { $gte: ["$$course.total", 80] }, then: 4.0 },
                      {
                        case: { $gte: ["$$course.total", 75] },
                        then: 3.75,
                      },
                      { case: { $gte: ["$$course.total", 70] }, then: 3.5 },
                      {
                        case: { $gte: ["$$course.total", 65] },
                        then: 3.25,
                      },
                      { case: { $gte: ["$$course.total", 60] }, then: 3.0 },
                      {
                        case: { $gte: ["$$course.total", 55] },
                        then: 2.75,
                      },
                      { case: { $gte: ["$$course.total", 50] }, then: 2.5 },
                      {
                        case: { $gte: ["$$course.total", 45] },
                        then: 2.25,
                      },
                      { case: { $gte: ["$$course.total", 40] }, then: 2.0 },
                    ],
                    default: 0,
                  },
                },
              },
            },
          },
          labs: {
            $map: {
              input: "$labs",
              as: "lab",
              in: {
                courseCode: "$$lab.courseCode",
                "Lab Continuous (20%)": 15,
                "Lab final exam (80%)": 55,
                total: "$$lab.labTotal",
                credit: "$$lab.credit",
                LG: {
                  $switch: {
                    branches: [
                      {
                        case: { $gte: ["$$lab.labTotal", 80] },
                        then: "A+",
                      },
                      { case: { $gte: ["$$lab.labTotal", 75] }, then: "A" },
                      {
                        case: { $gte: ["$$lab.labTotal", 70] },
                        then: "A-",
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 65] },
                        then: "B+",
                      },
                      { case: { $gte: ["$$lab.labTotal", 60] }, then: "B" },
                      {
                        case: { $gte: ["$$lab.labTotal", 55] },
                        then: "B-",
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 50] },
                        then: "C+",
                      },
                      { case: { $gte: ["$$lab.labTotal", 45] }, then: "C" },
                      { case: { $gte: ["$$lab.labTotal", 40] }, then: "D" },
                    ],
                    default: "F",
                  },
                },
                GP: {
                  $switch: {
                    branches: [
                      { case: { $gte: ["$$lab.labTotal", 80] }, then: 4.0 },
                      {
                        case: { $gte: ["$$lab.labTotal", 75] },
                        then: 3.75,
                      },
                      { case: { $gte: ["$$lab.labTotal", 70] }, then: 3.5 },
                      {
                        case: { $gte: ["$$lab.labTotal", 65] },
                        then: 3.25,
                      },
                      { case: { $gte: ["$$lab.labTotal", 60] }, then: 3.0 },
                      {
                        case: { $gte: ["$$lab.labTotal", 55] },
                        then: 2.75,
                      },
                      { case: { $gte: ["$$lab.labTotal", 50] }, then: 2.5 },
                      {
                        case: { $gte: ["$$lab.labTotal", 45] },
                        then: 2.25,
                      },
                      { case: { $gte: ["$$lab.labTotal", 40] }, then: 2.0 },
                    ],
                    default: 0,
                  },
                },
              },
            },
          },
          prevTotalPoint: {
            $reduce: {
              input: "$prevPoints",
              initialValue: 0,
              in: { $sum: ["$$value", "$$this.totalPoint"] },
            },
          },
          prevTotalCredit: {
            $reduce: {
              input: "$prevPoints",
              initialValue: 0,
              in: { $sum: ["$$value", "$$this.totalCredit"] },
            },
          },
        },
      },
      {
        $addFields: { marks: { $concatArrays: ["$courses", "$labs"] } },
      },
      {
        $project: { labs: 0, courses: 0 },
      },
      {
        $project: {
          _id: 1,
          prevTotalPoint: 1,
          prevTotalCredit: 1,
          marks: 1,
          curTotalPoint: {
            $reduce: {
              input: "$marks",
              initialValue: 0,
              in: {
                $sum: [
                  "$$value",
                  { $multiply: ["$$this.GP", "$$this.credit"] },
                ],
              },
            },
          },
          curTotalCredit: {
            $reduce: {
              input: "$marks",
              initialValue: 0,
              in: { $sum: ["$$value", "$$this.credit"] },
            },
          },
        },
      },
      {
        $addFields: {
          totalPoint: { $sum: ["$prevTotalPoint", "$curTotalPoint"] },
          totalCredit: { $sum: ["$prevTotalCredit", "$curTotalCredit"] },
        },
      },
      {
        $project: {
          _id: 1,
          marks: 1,
          GPA: {
            $round: [{ $divide: ["$curTotalPoint", "$curTotalCredit"] }, 2],
          },
          CGPA: {
            $round: [{ $divide: ["$totalPoint", "$totalCredit"] }, 2],
          },
          curTotalPoint: 1,
          curTotalCredit: 1,
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // save current semester total point and credit
    let bulk = [];
    for (let mark of marks) {
      const { _id, curTotalPoint, curTotalCredit } = mark;

      let updateDoc = {
        updateOne: {
          filter: {
            department: dept,
            currentSession: session,
            semester: Number(semester),
            roll: _id,
          },
          update: {
            totalPoint: curTotalPoint,
            totalCredit: curTotalCredit,
          },
          upsert: true,
        },
      };
      bulk.push(updateDoc);
    }
    await Point.bulkWrite(bulk);

    res.status(200).json({
      result: marks,
    });
  } catch (err) {
    next(createError(err.message));
  }
};

const getCourseTabulation = async (req, res, next) => {
  try {
    const { dept, session, semester, course, code } = req.params;

    const result = await Mark.aggregate([
      {
        $match: {
          department: dept,
          currentSession: session,
          semester: Number(semester),
          courseName: course,
          courseCode: code,
        },
      },
      {
        $addFields: {
          minimum: {
            $min: [
              { $abs: { $subtract: ["$firstExaminer", "$secondExaminer"] } },
              { $abs: { $subtract: ["$secondExaminer", "$thirdExaminer"] } },
              { $abs: { $subtract: ["$firstExaminer", "$thirdExaminer"] } },
            ],
          },
          forty: { $sum: ["$midOne", "$midTwo", "$assignment", "$attendance"] },
        },
      },
      {
        $addFields: {
          sixty: {
            $switch: {
              branches: [
                {
                  case: {
                    $lte: [
                      {
                        $abs: {
                          $subtract: ["$firstExaminer", "$secondExaminer"],
                        },
                      },
                      12,
                    ],
                  },
                  then: { $avg: ["$firstExaminer", "$secondExaminer"] },
                },
                {
                  case: {
                    $lte: [
                      {
                        $abs: {
                          $subtract: ["$firstExaminer", "$secondExaminer"],
                        },
                      },
                      "$minimum",
                    ],
                  },
                  then: { $avg: ["$firstExaminer", "$secondExaminer"] },
                },
                {
                  case: {
                    $lte: [
                      {
                        $abs: {
                          $subtract: ["$secondExaminer", "$thirdExaminer"],
                        },
                      },
                      "$minimum",
                    ],
                  },
                  then: { $avg: ["$secondExaminer", "$thirdExaminer"] },
                },
              ],
              default: { $avg: ["$firstExaminer", "$thirdExaminer"] },
            },
          },
          LG: {
            $switch: {
              branches: [
                { case: { $gte: ["$total", 80] }, then: "A+" },
                { case: { $gte: ["$total", 75] }, then: "A" },
                { case: { $gte: ["$total", 70] }, then: "A-" },
                { case: { $gte: ["$total", 65] }, then: "B+" },
                { case: { $gte: ["$total", 60] }, then: "B" },
                { case: { $gte: ["$total", 55] }, then: "B-" },
                { case: { $gte: ["$total", 50] }, then: "C+" },
                { case: { $gte: ["$total", 45] }, then: "C" },
                { case: { $gte: ["$total", 40] }, then: "D" },
              ],
              default: "F",
            },
          },
          GP: {
            $switch: {
              branches: [
                { case: { $gte: ["$total", 80] }, then: 4.0 },
                { case: { $gte: ["$total", 75] }, then: 3.75 },
                { case: { $gte: ["$total", 70] }, then: 3.5 },
                { case: { $gte: ["$total", 65] }, then: 3.25 },
                { case: { $gte: ["$total", 60] }, then: 3.0 },
                { case: { $gte: ["$total", 55] }, then: 2.75 },
                { case: { $gte: ["$total", 50] }, then: 2.5 },
                { case: { $gte: ["$total", 45] }, then: 2.25 },
                { case: { $gte: ["$total", 40] }, then: 2.0 },
              ],
              default: 0,
            },
          },
        },
      },
      {
        $group: {
          _id: "$roll",
          marks: {
            $push: "$$ROOT",
          },
        },
      },
      {
        $unwind: "$marks",
      },
      {
        $project: {
          "marks._id": 0,
          "marks.roll": 0,
          "marks.department": 0,
          "marks.credit": 0,
          "marks.minimum": 0,
          "marks.currentSession": 0,
          "marks.semester": 0,
          "marks.isThirdExaminer": 0,
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.status(200).json({
      result: result,
    });
  } catch (err) {
    next(createError(err.message));
  }
};

// get improve marks with previous
const getImproveMarkTabulation = async (req, res, next) => {
  try {
    const { dept, session, course, code } = req.params;

    // check first the course is lab or theory
    // if the result for lab, the aggregation another from this

    const improveResult = await ImproveMark.aggregate([
      {
        $match: {
          currentSession: session,
          department: dept,
          courseName: course,
          courseCode: code,
        },
      },
      {
        $lookup: {
          from: "marks",
          localField: "roll",
          foreignField: "roll",
          pipeline: [
            {
              $match: {
                currentSession: session,
                department: dept,
                courseName: course,
                courseCode: code,
              },
            },
          ],
          as: "prevMark",
        },
      },
      {
        $unwind: "$prevMark",
      },
      {
        $addFields: {
          minimum: {
            $min: [
              { $abs: { $subtract: ["$firstExaminer", "$secondExaminer"] } },
              { $abs: { $subtract: ["$secondExaminer", "$thirdExaminer"] } },
              { $abs: { $subtract: ["$firstExaminer", "$thirdExaminer"] } },
            ],
          },
          internalMark: {
            $sum: [
              "$prevMark.midOne",
              "$prevMark.midTwo",
              "$prevMark.attendance",
              "$prevMark.presentationOrAssignment",
            ],
          },
        },
      },
      {
        $addFields: {
          improveFinal: {
            $switch: {
              branches: [
                {
                  case: {
                    $lte: [
                      {
                        $abs: {
                          $subtract: ["$firstExaminer", "$secondExaminer"],
                        },
                      },
                      12,
                    ],
                  },
                  then: { $avg: ["$firstExaminer", "$secondExaminer"] },
                },
                {
                  case: {
                    $eq: [
                      {
                        $abs: {
                          $subtract: ["$firstExaminer", "$secondExaminer"],
                        },
                      },
                      "$minimum",
                    ],
                  },
                  then: { $avg: ["$firstExaminer", "$secondExaminer"] },
                },
                {
                  case: {
                    $eq: [
                      {
                        $abs: {
                          $subtract: ["$secondExaminer", "$thirdExaminer"],
                        },
                      },
                      "$minimum",
                    ],
                  },
                  then: { $avg: ["$secondExaminer", "$thirdexaminer"] },
                },
              ],
              default: { $avg: ["$firstExaminer", "$thirdExaminer"] },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          roll: "$roll",
          internalMark: "$internalMark",
          previousMark: {
            finalExamMark: {
              $switch: {
                branches: [
                  {
                    case: {
                      $lte: [
                        {
                          $abs: {
                            $subtract: [
                              "$prevMark.firstExaminer",
                              "$prevMark.secondExaminer",
                            ],
                          },
                        },
                        12,
                      ],
                    },
                    then: {
                      $avg: [
                        "$prevMark.firstExaminer",
                        "$prevMark.secondExaminer",
                      ],
                    },
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $abs: {
                            $subtract: [
                              "$prevMark.firstExaminer",
                              "$prevMark.secondExaminer",
                            ],
                          },
                        },
                        "$prevMark.minimum",
                      ],
                    },
                    then: {
                      $avg: [
                        "$prevMark.firstExaminer",
                        "$prevMark.secondExaminer",
                      ],
                    },
                  },
                  {
                    case: {
                      $eq: [
                        {
                          $abs: {
                            $subtract: [
                              "$prevMark.secondExaminer",
                              "$prevMark.thirdExaminer",
                            ],
                          },
                        },
                        "$prevMark.minimum",
                      ],
                    },
                    then: {
                      $avg: [
                        "$prevMark.secondExaminer",
                        "$prevMark.thirdExaminer",
                      ],
                    },
                  },
                ],
                default: {
                  $avg: ["$prevMark.firstExaminer", "$prevMark.thirdExaminer"],
                },
              },
            },
            LG: {
              $switch: {
                branches: [
                  { case: { $gte: ["$prevMark.total", 80] }, then: "A+" },
                  { case: { $gte: ["$prevMark.total", 75] }, then: "A" },
                  { case: { $gte: ["$prevMark.total", 70] }, then: "A-" },
                  { case: { $gte: ["$prevMark.total", 65] }, then: "B+" },
                  { case: { $gte: ["$prevMark.total", 60] }, then: "B" },
                  { case: { $gte: ["$prevMark.total", 55] }, then: "B-" },
                  { case: { $gte: ["$prevMark.total", 50] }, then: "C+" },
                  { case: { $gte: ["$prevMark.total", 45] }, then: "C" },
                  { case: { $gte: ["$prevMark.total", 40] }, then: "D" },
                ],
                default: "F",
              },
            },
            GP: {
              $switch: {
                branches: [
                  { case: { $gte: ["$prevMark.total", 80] }, then: 4.0 },
                  { case: { $gte: ["$prevMark.total", 75] }, then: 3.75 },
                  { case: { $gte: ["$prevMark.total", 70] }, then: 3.5 },
                  { case: { $gte: ["$prevMark.total", 65] }, then: 3.25 },
                  { case: { $gte: ["$prevMark.total", 60] }, then: 3.0 },
                  { case: { $gte: ["$prevMark.total", 55] }, then: 2.75 },
                  { case: { $gte: ["$prevMark.total", 50] }, then: 2.5 },
                  { case: { $gte: ["$prevMark.total", 45] }, then: 2.25 },
                  { case: { $gte: ["$prevMark.total", 40] }, then: 2.0 },
                ],
                default: 0,
              },
            },
            totalMark: "$prevMark.total",
          },
          improvedMark: {
            firstExaminer: "$firstExaminer",
            secondExaminer: "$secondExaminer",
            thirdExaminer: "$thirdExaminer",
            finalExamMark: "$improveFinal",
            totalMark: { $sum: ["$internalMark", "$improveFinal"] },
            LG: {
              $switch: {
                branches: [
                  {
                    case: {
                      $gte: [{ $sum: ["$internalMark", "$improveFinal"] }, 80],
                    },
                    then: "A+",
                  },
                  {
                    case: {
                      $gte: [{ $sum: ["$internalMark", "$improveFinal"] }, 75],
                    },
                    then: "A",
                  },
                  {
                    case: {
                      $gte: [{ $sum: ["$internalMark", "$improveFinal"] }, 70],
                    },
                    then: "A-",
                  },
                  {
                    case: {
                      $gte: [{ $sum: ["$internalMark", "$improveFinal"] }, 65],
                    },
                    then: "B+",
                  },
                  {
                    case: {
                      $gte: [{ $sum: ["$internalMark", "$improveFinal"] }, 60],
                    },
                    then: "B",
                  },
                  {
                    case: {
                      $gte: [{ $sum: ["$internalMark", "$improveFinal"] }, 55],
                    },
                    then: "B-",
                  },
                  {
                    case: {
                      $gte: [{ $sum: ["$internalMark", "$improveFinal"] }, 50],
                    },
                    then: "C+",
                  },
                  {
                    case: {
                      $gte: [{ $sum: ["$internalMark", "$improveFinal"] }, 45],
                    },
                    then: "C",
                  },
                  {
                    case: {
                      $gte: [{ $sum: ["$internalMark", "$improveFinal"] }, 40],
                    },
                    then: "C",
                  },
                ],
                default: "F",
              },
            },
            GP: {
              $switch: {
                branches: [
                  {
                    case: {
                      $gte: [{ $sum: ["$internalMark", "$improveFinal"] }, 80],
                    },
                    then: 4.0,
                  },
                  {
                    case: {
                      $gte: [{ $sum: ["$internalMark", "$improveFinal"] }, 75],
                    },
                    then: 3.75,
                  },
                  {
                    case: {
                      $gte: [{ $sum: ["$internalMark", "$improveFinal"] }, 70],
                    },
                    then: 3.5,
                  },
                  {
                    case: {
                      $gte: [{ $sum: ["$internalMark", "$improveFinal"] }, 65],
                    },
                    then: 3.25,
                  },
                  {
                    case: {
                      $gte: [{ $sum: ["$internalMark", "$improveFinal"] }, 60],
                    },
                    then: 3.0,
                  },
                  {
                    case: {
                      $gte: [{ $sum: ["$internalMark", "$improveFinal"] }, 55],
                    },
                    then: 2.75,
                  },
                  {
                    case: {
                      $gte: [{ $sum: ["$internalMark", "$improveFinal"] }, 50],
                    },
                    then: 2.5,
                  },
                  {
                    case: {
                      $gte: [{ $sum: ["$internalMark", "$improveFinal"] }, 45],
                    },
                    then: 2.25,
                  },
                  {
                    case: {
                      $gte: [{ $sum: ["$internalMark", "$improveFinal"] }, 40],
                    },
                    then: 2.0,
                  },
                ],
                default: 0,
              },
            },
          },
          remark: {
            $switch: {
              branches: [
                {
                  case: {
                    $gt: [
                      { $sum: ["$internalMark", "$improveFinal"] },
                      "$prevMark.total",
                    ],
                  },
                  then: "Improved",
                },
              ],
              default: "Not Improved",
            },
          },
        },
      },
      {
        $addFields: {
          improvedGPA: {
            $switch: {
              branches: [
                {
                  case: {
                    $gt: [
                      { $sum: ["$internalMark", "$improveFinal"] },
                      "$prevMark.total",
                    ],
                  },
                  then: "$improvedMark.GP",
                },
              ],
              default: "$previousMark.GP",
            },
          },
        },
      },
      {
        $sort: { roll: 1 },
      },
    ]);

    res.status(200).json({
      result: improveResult,
    });
  } catch (err) {
    next(createError(err.message));
  }
};

const getSemesterTranscript = async (req, res, next) => {
  try {
    const { dept, session, semester, roll } = req.params;

    const semesterTranscript = await Mark.aggregate([
      {
        $match: {
          department: dept,
          currentSession: session,
          semester: Number(semester),
          roll: roll,
        },
      },
      {
        $group: {
          _id: "$roll",
          courses: { $push: "$$ROOT" },
        },
      },
      {
        $project: { _id: 0 },
      },
      {
        $lookup: {
          from: "labmarks",
          localField: "courses.roll",
          foreignField: "roll",
          pipeline: [
            {
              $match: {
                department: dept,
                currentSession: session,
                semester: Number(semester),
                roll,
              },
            },
          ],
          as: "labs",
        },
      },
      {
        $project: {
          courses: {
            $map: {
              input: "$courses",
              as: "course",
              in: {
                courseCode: "$$course.courseCode",
                courseTitle: "$$course.courseName",
                courseCredit: "$$course.credit",
                LG: {
                  $switch: {
                    branches: [
                      {
                        case: { $gte: ["$$course.total", 80] },
                        then: "A+",
                      },
                      { case: { $gte: ["$$course.total", 75] }, then: "A" },
                      {
                        case: { $gte: ["$$course.total", 70] },
                        then: "A-",
                      },
                      {
                        case: { $gte: ["$$course.total", 65] },
                        then: "B+",
                      },
                      { case: { $gte: ["$$course.total", 60] }, then: "B" },
                      {
                        case: { $gte: ["$$course.total", 55] },
                        then: "B-",
                      },
                      {
                        case: { $gte: ["$$course.total", 50] },
                        then: "C+",
                      },
                      { case: { $gte: ["$$course.total", 45] }, then: "C" },
                      { case: { $gte: ["$$course.total", 40] }, then: "D" },
                    ],
                    default: "F",
                  },
                },
                GP: {
                  $switch: {
                    branches: [
                      { case: { $gte: ["$$course.total", 80] }, then: 4.0 },
                      {
                        case: { $gte: ["$$course.total", 75] },
                        then: 3.75,
                      },
                      { case: { $gte: ["$$course.total", 70] }, then: 3.5 },
                      {
                        case: { $gte: ["$$course.total", 65] },
                        then: 3.25,
                      },
                      { case: { $gte: ["$$course.total", 60] }, then: 3.0 },
                      {
                        case: { $gte: ["$$course.total", 55] },
                        then: 2.75,
                      },
                      { case: { $gte: ["$$course.total", 50] }, then: 2.5 },
                      {
                        case: { $gte: ["$$course.total", 45] },
                        then: 2.25,
                      },
                      { case: { $gte: ["$$course.total", 40] }, then: 2.0 },
                    ],
                    default: 0,
                  },
                },
              },
            },
          },
          labs: {
            $map: {
              input: "$labs",
              as: "lab",
              in: {
                courseCode: "$$lab.courseCode",
                courseTitle: "$$lab.courseName",
                courseCredit: "$$lab.credit",
                LG: {
                  $switch: {
                    branches: [
                      {
                        case: { $gte: ["$$lab.labTotal", 80] },
                        then: "A+",
                      },
                      { case: { $gte: ["$$lab.labTotal", 75] }, then: "A" },
                      {
                        case: { $gte: ["$$lab.labTotal", 70] },
                        then: "A-",
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 65] },
                        then: "B+",
                      },
                      { case: { $gte: ["$$lab.labTotal", 60] }, then: "B" },
                      {
                        case: { $gte: ["$$lab.labTotal", 55] },
                        then: "B-",
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 50] },
                        then: "C+",
                      },
                      { case: { $gte: ["$$lab.labTotal", 45] }, then: "C" },
                      { case: { $gte: ["$$lab.labTotal", 40] }, then: "D" },
                    ],
                    default: "F",
                  },
                },
                GP: {
                  $switch: {
                    branches: [
                      { case: { $gte: ["$$lab.labTotal", 80] }, then: 4.0 },
                      {
                        case: { $gte: ["$$lab.labTotal", 75] },
                        then: 3.75,
                      },
                      { case: { $gte: ["$$lab.labTotal", 70] }, then: 3.5 },
                      {
                        case: { $gte: ["$$lab.labTotal", 65] },
                        then: 3.25,
                      },
                      { case: { $gte: ["$$lab.labTotal", 60] }, then: 3.0 },
                      {
                        case: { $gte: ["$$lab.labTotal", 55] },
                        then: 2.75,
                      },
                      { case: { $gte: ["$$lab.labTotal", 50] }, then: 2.5 },
                      {
                        case: { $gte: ["$$lab.labTotal", 45] },
                        then: 2.25,
                      },
                      { case: { $gte: ["$$lab.labTotal", 40] }, then: 2.0 },
                    ],
                    default: 0,
                  },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          courseData: {
            $concatArrays: ["$courses", "$labs"],
          },
        },
      },
      {
        $project: {
          courseData: 1,
          totalPoint: {
            $reduce: {
              input: "$courseData",
              initialValue: 0,
              in: {
                $sum: [
                  "$$value",
                  { $multiply: ["$$this.courseCredit", "$$this.GP"] },
                ],
              },
            },
          },
          totalCredit: {
            $reduce: {
              input: "$courseData",
              initialValue: 0,
              in: { $sum: ["$$value", "$$this.courseCredit"] },
            },
          },
        },
      },
      {
        $project: {
          courseData: 1,
          GPA: {
            $round: [{ $divide: ["$totalPoint", "$totalCredit"] }, 2],
          },
        },
      },
      {
        $project: {
          courseData: 1,
          GPA: 1,
          LG: {
            $switch: {
              branches: [
                { case: { $gte: ["$GPA", 4] }, then: "A+" },
                {
                  case: { $gte: ["$GPA", 3.75] },
                  then: "A",
                },
                { case: { $gte: ["$GPA", 3.5] }, then: "A-" },
                {
                  case: { $gte: ["$GPA", 3.25] },
                  then: "B+",
                },
                { case: { $gte: ["$GPA", 3] }, then: "B" },
                {
                  case: { $gte: ["$GPA", 2.75] },
                  then: "B-",
                },
                { case: { $gte: ["$GPA", 2.5] }, then: "C+" },
                {
                  case: { $gte: ["$GPA", 2.25] },
                  then: "C",
                },
                { case: { $gte: ["$GPA", 2] }, then: "D" },
              ],
              default: "F",
            },
          },
        },
      },
    ]);

    res.status(200).json({ semesterTranscript: semesterTranscript[0] });
  } catch (err) {
    next(createError(err.message));
  }
};

const getTabulationSheetPerYear = async (req, res, next) => {
  try {
    const { year, dept, session, roll } = req.params;

    const firstSemester = Number(year) * 2 - 1;
    const secondSemester = Number(year) * 2;
    const prevMaxSemester = secondSemester === 2 ? 2 : secondSemester - 2;

    const courseMarks = await Mark.aggregate([
      {
        $match: {
          department: dept,
          currentSession: session,
          semester: { $in: [firstSemester, secondSemester] },
          roll,
        },
      },
      {
        $group: {
          _id: "$semester",
          courseMarks: { $push: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "labmarks",
          localField: "_id",
          foreignField: "semester",
          pipeline: [
            {
              $match: {
                department: dept,
                currentSession: session,
                roll,
              },
            },
          ],
          as: "labMarks",
        },
      },
      {
        $lookup: {
          from: "improves",
          localField: "_id",
          foreignField: "semester",
          pipeline: [
            {
              $match: {
                department: dept,
                currentSession: session,
                roll,
              },
            },
          ],
          as: "theoryImproves",
        },
      },
      {
        $lookup: {
          from: "labimproves",
          localField: "_id",
          foreignField: "semester",
          pipeline: [
            {
              $match: {
                department: dept,
                currentSession: session,
                roll,
              },
            },
          ],
          as: "labImproves",
        },
      },
      {
        $project: {
          courseMarks: {
            $map: {
              input: "$courseMarks",
              as: "mark",
              in: {
                courseCode: "$$mark.courseCode",
                courseCredit: "$$mark.credit",
                internalMark: "$$mark.totalInternal",
                finalMark: "$$mark.totalExternal",
                totalMark: "$$mark.total",
                LG: {
                  $switch: {
                    branches: [
                      {
                        case: { $gte: ["$$mark.total", 80] },
                        then: "A+",
                      },
                      {
                        case: { $gte: ["$$mark.total", 75] },
                        then: "A",
                      },
                      {
                        case: { $gte: ["$$mark.total", 70] },
                        then: "A-",
                      },
                      {
                        case: { $gte: ["$$mark.total", 65] },
                        then: "B+",
                      },
                      {
                        case: { $gte: ["$$mark.total", 60] },
                        then: "B",
                      },
                      {
                        case: { $gte: ["$$mark.total", 55] },
                        then: "B-",
                      },
                      {
                        case: { $gte: ["$$mark.total", 50] },
                        then: "C+",
                      },
                      {
                        case: { $gte: ["$$mark.total", 45] },
                        then: "C",
                      },
                      {
                        case: { $gte: ["$$mark.total", 40] },
                        then: "D",
                      },
                    ],
                    default: "F",
                  },
                },
                GP: {
                  $switch: {
                    branches: [
                      {
                        case: { $gte: ["$$mark.total", 80] },
                        then: 4.0,
                      },
                      {
                        case: { $gte: ["$$mark.total", 75] },
                        then: 3.75,
                      },
                      {
                        case: { $gte: ["$$mark.total", 70] },
                        then: 3.5,
                      },
                      {
                        case: { $gte: ["$$mark.total", 65] },
                        then: 3.25,
                      },
                      {
                        case: { $gte: ["$$mark.total", 60] },
                        then: 3.0,
                      },
                      {
                        case: { $gte: ["$$mark.total", 55] },
                        then: 2.75,
                      },
                      {
                        case: { $gte: ["$$mark.total", 50] },
                        then: 2.5,
                      },
                      {
                        case: { $gte: ["$$mark.total", 45] },
                        then: 2.25,
                      },
                      {
                        case: { $gte: ["$$mark.total", 40] },
                        then: 2.0,
                      },
                    ],
                    default: 0,
                  },
                },
              },
            },
          },
          labMarks: {
            $map: {
              input: "$labMarks",
              as: "lab",
              in: {
                courseCode: "$$lab.courseCode",
                courseCredit: "$$lab.credit",
                internalMark: "$$lab.totalInternal",
                finalMark: "$$lab.totalExternal",
                totalMark: "$$lab.labTotal",
                LG: {
                  $switch: {
                    branches: [
                      {
                        case: { $gte: ["$$lab.labTotal", 80] },
                        then: "A+",
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 75] },
                        then: "A",
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 70] },
                        then: "A-",
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 65] },
                        then: "B+",
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 60] },
                        then: "B",
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 55] },
                        then: "B-",
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 50] },
                        then: "C+",
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 45] },
                        then: "C",
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 40] },
                        then: "D",
                      },
                    ],
                    default: "F",
                  },
                },
                GP: {
                  $switch: {
                    branches: [
                      {
                        case: { $gte: ["$$lab.labTotal", 80] },
                        then: 4.0,
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 75] },
                        then: 3.75,
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 70] },
                        then: 3.5,
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 65] },
                        then: 3.25,
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 60] },
                        then: 3.0,
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 55] },
                        then: 2.75,
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 50] },
                        then: 2.5,
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 45] },
                        then: 2.25,
                      },
                      {
                        case: { $gte: ["$$lab.labTotal", 40] },
                        then: 2.0,
                      },
                    ],
                    default: 0,
                  },
                },
              },
            },
          },
          theoryImproves: {
            $map: {
              input: "$theoryImproves",
              as: "improve",
              in: {
                courseCode: "$$improve.courseCode",
                courseCredit: "$$improve.credit",
                internalMark: "$$improve.totalInternal",
                finalMark: "$$improve.totalExternal",
                totalMark: "$$improve.total",
                LG: {
                  $switch: {
                    branches: [
                      {
                        case: { $gte: ["$$improve.total", 80] },
                        then: "A+",
                      },
                      {
                        case: { $gte: ["$$improve.total", 75] },
                        then: "A",
                      },
                      {
                        case: { $gte: ["$$improve.total", 70] },
                        then: "A-",
                      },
                      {
                        case: { $gte: ["$$improve.total", 65] },
                        then: "B+",
                      },
                      {
                        case: { $gte: ["$$improve.total", 60] },
                        then: "B",
                      },
                      {
                        case: { $gte: ["$$improve.total", 55] },
                        then: "B-",
                      },
                      {
                        case: { $gte: ["$$improve.total", 50] },
                        then: "C+",
                      },
                      {
                        case: { $gte: ["$$improve.total", 45] },
                        then: "C",
                      },
                      {
                        case: { $gte: ["$$improve.total", 40] },
                        then: "D",
                      },
                    ],
                    default: "F",
                  },
                },
                GP: {
                  $switch: {
                    branches: [
                      {
                        case: { $gte: ["$$improve.total", 80] },
                        then: 4.0,
                      },
                      {
                        case: { $gte: ["$$improve.total", 75] },
                        then: 3.75,
                      },
                      {
                        case: { $gte: ["$$improve.total", 70] },
                        then: 3.5,
                      },
                      {
                        case: { $gte: ["$$improve.total", 65] },
                        then: 3.25,
                      },
                      {
                        case: { $gte: ["$$improve.total", 60] },
                        then: 3.0,
                      },
                      {
                        case: { $gte: ["$$improve.total", 55] },
                        then: 2.75,
                      },
                      {
                        case: { $gte: ["$$improve.total", 50] },
                        then: 2.5,
                      },
                      {
                        case: { $gte: ["$$improve.total", 45] },
                        then: 2.25,
                      },
                      {
                        case: { $gte: ["$$improve.total", 40] },
                        then: 2.0,
                      },
                    ],
                    default: 0,
                  },
                },
              },
            },
          },
          labImproves: {
            $map: {
              input: "$labImproves",
              as: "improve",
              in: {
                courseCode: "$$improve.courseCode",
                courseCredit: "$$improve.credit",
                internalMark: "$$improve.totalInternal",
                finalMark: "$$improve.totalExternal",
                totalMark: "$$improve.labTotal",
                LG: {
                  $switch: {
                    branches: [
                      {
                        case: { $gte: ["$$improve.labTotal", 80] },
                        then: "A+",
                      },
                      {
                        case: { $gte: ["$$improve.labTotal", 75] },
                        then: "A",
                      },
                      {
                        case: { $gte: ["$$improve.labTotal", 70] },
                        then: "A-",
                      },
                      {
                        case: { $gte: ["$$improve.labTotal", 65] },
                        then: "B+",
                      },
                      {
                        case: { $gte: ["$$improve.labTotal", 60] },
                        then: "B",
                      },
                      {
                        case: { $gte: ["$$improve.labTotal", 55] },
                        then: "B-",
                      },
                      {
                        case: { $gte: ["$$improve.labTotal", 50] },
                        then: "C+",
                      },
                      {
                        case: { $gte: ["$$improve.labTotal", 45] },
                        then: "C",
                      },
                      {
                        case: { $gte: ["$$improve.labTotal", 40] },
                        then: "D",
                      },
                    ],
                    default: "F",
                  },
                },
                GP: {
                  $switch: {
                    branches: [
                      {
                        case: { $gte: ["$$improve.labTotal", 80] },
                        then: 4.0,
                      },
                      {
                        case: { $gte: ["$$improve.labTotal", 75] },
                        then: 3.75,
                      },
                      {
                        case: { $gte: ["$$improve.labTotal", 70] },
                        then: 3.5,
                      },
                      {
                        case: { $gte: ["$$improve.labTotal", 65] },
                        then: 3.25,
                      },
                      {
                        case: { $gte: ["$$improve.labTotal", 60] },
                        then: 3.0,
                      },
                      {
                        case: { $gte: ["$$improve.labTotal", 55] },
                        then: 2.75,
                      },
                      {
                        case: { $gte: ["$$improve.labTotal", 50] },
                        then: 2.5,
                      },
                      {
                        case: { $gte: ["$$improve.labTotal", 45] },
                        then: 2.25,
                      },
                      {
                        case: { $gte: ["$$improve.labTotal", 40] },
                        then: 2.0,
                      },
                    ],
                    default: 0,
                  },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          regularMarks: { $concatArrays: ["$courseMarks", "$labMarks"] },
          improveMarks: {
            $concatArrays: ["$theoryImproves", "$labImproves"],
          },
        },
      },
      {
        $project: {
          _id: 1,
          marksWithImprove: {
            $map: {
              input: "$regularMarks",
              as: "regularMark",
              in: {
                courseCode: "$$regularMark.courseCode",
                courseCredit: "$$regularMark.courseCredit",
                fullMarks: 100,
                regular: {
                  internalMark: "$$regularMark.internalMark",
                  finalMark: "$$regularMark.finalMark",
                  totalMark: "$$regularMark.totalMark",
                  LG: "$$regularMark.LG",
                  GP: "$$regularMark.GP",
                },
                improve: {
                  $cond: {
                    if: {
                      $gt: [
                        {
                          $size: {
                            $filter: {
                              input: "$improveMarks",
                              as: "improveMark",
                              cond: {
                                $eq: [
                                  "$$improveMark.courseCode",
                                  "$$regularMark.courseCode",
                                ],
                              },
                            },
                          },
                        },
                        0,
                      ],
                    },
                    then: {
                      $let: {
                        vars: {
                          matchingImprove: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: "$improveMarks",
                                  as: "improveMark",
                                  cond: {
                                    $eq: [
                                      "$$improveMark.courseCode",
                                      "$$regularMark.courseCode",
                                    ],
                                  },
                                },
                              },
                              0,
                            ],
                          },
                        },
                        in: {
                          finalMark: "$$matchingImprove.finalMark",
                          totalMark: "$$matchingImprove.totalMark",
                          LG: "$$matchingImprove.LG",
                          GP: "$$matchingImprove.GP",
                        },
                      },
                    },
                    else: {
                      finalMark: "",
                      totalMark: "",
                      LG: "",
                      GP: "",
                    },
                  },
                },
              },
            },
          },
        },
      },
    ]);

    const regularPoints = await Mark.aggregate([
      {
        $facet: {
          thisYear: [
            {
              $match: {
                department: dept,
                currentSession: session,
                semester: { $in: [firstSemester, secondSemester] },
                roll,
              },
            },
            {
              $group: {
                _id: "$roll",
                courseMarks: { $push: "$$ROOT" },
              },
            },
            {
              $lookup: {
                from: "labmarks",
                localField: "_id",
                foreignField: "roll",
                pipeline: [
                  {
                    $match: {
                      department: dept,
                      currentSession: session,
                      semester: { $in: [firstSemester, secondSemester] },
                    },
                  },
                ],
                as: "labMarks",
              },
            },
            {
              $lookup: {
                from: "improves",
                localField: "_id",
                foreignField: "roll",
                pipeline: [
                  {
                    $match: {
                      department: dept,
                      currentSession: session,
                      semester: { $in: [firstSemester, secondSemester] },
                    },
                  },
                ],
                as: "theoryImproves",
              },
            },
            {
              $lookup: {
                from: "labimproves",
                localField: "_id",
                foreignField: "roll",
                pipeline: [
                  {
                    $match: {
                      department: dept,
                      currentSession: session,
                      semester: { $in: [firstSemester, secondSemester] },
                    },
                  },
                ],
                as: "labImproves",
              },
            },
            {
              $project: {
                courseMarks: {
                  $map: {
                    input: "$courseMarks",
                    as: "mark",
                    in: {
                      courseCode: "$$mark.courseCode",
                      courseCredit: "$$mark.credit",
                      internalMark: "$$mark.totalInternal",
                      finalMark: "$$mark.totalExternal",
                      totalMark: "$$mark.total",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$mark.total", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$mark.total", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$mark.total", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$mark.total", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$mark.total", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$mark.total", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$mark.total", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$mark.total", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$mark.total", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$mark.total", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$mark.total", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$mark.total", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$mark.total", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$mark.total", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$mark.total", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$mark.total", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$mark.total", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$mark.total", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
                labMarks: {
                  $map: {
                    input: "$labMarks",
                    as: "lab",
                    in: {
                      courseCode: "$$lab.courseCode",
                      courseCredit: "$$lab.credit",
                      internalMark: "$$lab.tweentyPercent",
                      finalMark: "$$lab.eightyPercent",
                      totalMark: "$$lab.labTotal",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$lab.labTotal", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$lab.labTotal", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
                theoryImproves: {
                  $map: {
                    input: "$theoryImproves",
                    as: "improve",
                    in: {
                      courseCode: "$$improve.courseCode",
                      courseCredit: "$$improve.credit",
                      internalMark: "$$improve.totalInternal",
                      finalMark: "$$improve.totalExternal",
                      totalMark: "$$improve.total",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.total", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$improve.total", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$improve.total", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$improve.total", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$improve.total", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$improve.total", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$improve.total", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$improve.total", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$improve.total", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.total", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$improve.total", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$improve.total", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$improve.total", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$improve.total", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$improve.total", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$improve.total", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$improve.total", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$improve.total", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
                labImproves: {
                  $map: {
                    input: "$labImproves",
                    as: "improve",
                    in: {
                      courseCode: "$$improve.courseCode",
                      courseCredit: "$$improve.credit",
                      internalMark: "$$improve.tweentyPercent",
                      finalMark: "$$improve.eightyPercent",
                      totalMark: "$$improve.labTotal",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.labTotal", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.labTotal", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                regularMarks: { $concatArrays: ["$courseMarks", "$labMarks"] },
                improveMarks: {
                  $concatArrays: ["$theoryImproves", "$labImproves"],
                },
              },
            },
            {
              $project: {
                marksWithImprove: {
                  $map: {
                    input: "$regularMarks",
                    as: "regularMark",
                    in: {
                      courseCode: "$$regularMark.courseCode",
                      courseCredit: "$$regularMark.courseCredit",
                      fullMarks: 100,
                      regular: {
                        internalMark: "$$regularMark.internalMark",
                        finalMark: "$$regularMark.finalMark",
                        totalMark: "$$regularMark.totalMark",
                        LG: "$$regularMark.LG",
                        GP: "$$regularMark.GP",
                      },
                      improve: {
                        $cond: {
                          if: {
                            $gt: [
                              {
                                $size: {
                                  $filter: {
                                    input: "$improveMarks",
                                    as: "improveMark",
                                    cond: {
                                      $eq: [
                                        "$$improveMark.courseCode",
                                        "$$regularMark.courseCode",
                                      ],
                                    },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                          then: {
                            $let: {
                              vars: {
                                matchingImprove: {
                                  $arrayElemAt: [
                                    {
                                      $filter: {
                                        input: "$improveMarks",
                                        as: "improveMark",
                                        cond: {
                                          $eq: [
                                            "$$improveMark.courseCode",
                                            "$$regularMark.courseCode",
                                          ],
                                        },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                              in: {
                                finalMark: "$$matchingImprove.finalMark",
                                totalMark: "$$matchingImprove.totalMark",
                                LG: "$$matchingImprove.LG",
                                GP: "$$matchingImprove.GP",
                              },
                            },
                          },
                          else: {
                            finalMark: "",
                            totalMark: "",
                            LG: "",
                            GP: "",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                cgp: {
                  $reduce: {
                    input: "$marksWithImprove",
                    initialValue: 0,
                    in: {
                      $sum: [
                        "$$value",
                        {
                          $multiply: [
                            "$$this.courseCredit",
                            "$$this.regular.GP",
                          ],
                        },
                      ],
                    },
                  },
                },
                tc: {
                  $reduce: {
                    input: "$marksWithImprove",
                    initialValue: 0,
                    in: {
                      $sum: ["$$value", "$$this.courseCredit"],
                    },
                  },
                },
                ec: {
                  $reduce: {
                    input: "$marksWithImprove",
                    initialValue: 0,
                    in: {
                      $cond: {
                        if: { $eq: ["$$this.regular.GP", 0] },
                        then: { $sum: ["$$value", 0] },
                        else: { $sum: ["$$value", "$$this.courseCredit"] },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                cgp: 1,
                ec: 1,
                tc: 1,
                cgpa: {
                  $round: [{ $divide: ["$cgp", "$tc"] }, 2],
                },
              },
            },
          ],
          previousYear: [
            {
              $match: {
                department: dept,
                currentSession: session,
                semester: { $gte: 1, $lte: prevMaxSemester },
                roll,
              },
            },
            {
              $group: {
                _id: "$roll",
                courseMarks: { $push: "$$ROOT" },
              },
            },
            {
              $lookup: {
                from: "labmarks",
                localField: "_id",
                foreignField: "roll",
                pipeline: [
                  {
                    $match: {
                      department: dept,
                      currentSession: session,
                      semester: { $gte: 1, $lte: prevMaxSemester },
                    },
                  },
                ],
                as: "labMarks",
              },
            },
            {
              $lookup: {
                from: "improves",
                localField: "_id",
                foreignField: "roll",
                pipeline: [
                  {
                    $match: {
                      department: dept,
                      currentSession: session,
                      semester: { $gte: 1, $lte: prevMaxSemester },
                    },
                  },
                ],
                as: "theoryImproves",
              },
            },
            {
              $lookup: {
                from: "labimproves",
                localField: "_id",
                foreignField: "roll",
                pipeline: [
                  {
                    $match: {
                      department: dept,
                      currentSession: session,
                      semester: { $gte: 1, $lte: prevMaxSemester },
                    },
                  },
                ],
                as: "labImproves",
              },
            },
            {
              $project: {
                courseMarks: {
                  $map: {
                    input: "$courseMarks",
                    as: "mark",
                    in: {
                      courseCode: "$$mark.courseCode",
                      courseCredit: "$$mark.credit",
                      internalMark: "$$mark.totalInternal",
                      finalMark: "$$mark.totalExternal",
                      totalMark: "$$mark.total",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$mark.total", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$mark.total", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$mark.total", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$mark.total", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$mark.total", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$mark.total", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$mark.total", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$mark.total", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$mark.total", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$mark.total", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$mark.total", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$mark.total", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$mark.total", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$mark.total", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$mark.total", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$mark.total", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$mark.total", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$mark.total", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
                labMarks: {
                  $map: {
                    input: "$labMarks",
                    as: "lab",
                    in: {
                      courseCode: "$$lab.courseCode",
                      courseCredit: "$$lab.credit",
                      internalMark: "$$lab.tweentyPercent",
                      finalMark: "$$lab.eightyPercent",
                      totalMark: "$$lab.labTotal",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$lab.labTotal", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$lab.labTotal", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
                theoryImproves: {
                  $map: {
                    input: "$theoryImproves",
                    as: "improve",
                    in: {
                      courseCode: "$$improve.courseCode",
                      courseCredit: "$$improve.credit",
                      internalMark: "$$improve.totalInternal",
                      finalMark: "$$improve.totalExternal",
                      totalMark: "$$improve.total",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.total", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$improve.total", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$improve.total", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$improve.total", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$improve.total", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$improve.total", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$improve.total", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$improve.total", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$improve.total", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.total", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$improve.total", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$improve.total", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$improve.total", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$improve.total", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$improve.total", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$improve.total", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$improve.total", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$improve.total", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
                labImproves: {
                  $map: {
                    input: "$labImproves",
                    as: "improve",
                    in: {
                      courseCode: "$$improve.courseCode",
                      courseCredit: "$$improve.credit",
                      internalMark: "$$improve.tweentyPercent",
                      finalMark: "$$improve.eightyPercent",
                      totalMark: "$$improve.labTotal",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.labTotal", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.labTotal", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                regularMarks: { $concatArrays: ["$courseMarks", "$labMarks"] },
                improveMarks: {
                  $concatArrays: ["$theoryImproves", "$labImproves"],
                },
              },
            },
            {
              $project: {
                marksWithImprove: {
                  $map: {
                    input: "$regularMarks",
                    as: "regularMark",
                    in: {
                      courseCode: "$$regularMark.courseCode",
                      courseCredit: "$$regularMark.courseCredit",
                      fullMarks: 100,
                      regular: {
                        internalMark: "$$regularMark.internalMark",
                        finalMark: "$$regularMark.finalMark",
                        totalMark: "$$regularMark.totalMark",
                        LG: "$$regularMark.LG",
                        GP: "$$regularMark.GP",
                      },
                      improve: {
                        $cond: {
                          if: {
                            $gt: [
                              {
                                $size: {
                                  $filter: {
                                    input: "$improveMarks",
                                    as: "improveMark",
                                    cond: {
                                      $eq: [
                                        "$$improveMark.courseCode",
                                        "$$regularMark.courseCode",
                                      ],
                                    },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                          then: {
                            $let: {
                              vars: {
                                matchingImprove: {
                                  $arrayElemAt: [
                                    {
                                      $filter: {
                                        input: "$improveMarks",
                                        as: "improveMark",
                                        cond: {
                                          $eq: [
                                            "$$improveMark.courseCode",
                                            "$$regularMark.courseCode",
                                          ],
                                        },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                              in: {
                                finalMark: "$$matchingImprove.finalMark",
                                totalMark: "$$matchingImprove.totalMark",
                                LG: "$$matchingImprove.LG",
                                GP: "$$matchingImprove.GP",
                              },
                            },
                          },
                          else: {
                            finalMark: "",
                            totalMark: "",
                            LG: "",
                            GP: "",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                cgp: {
                  $reduce: {
                    input: "$marksWithImprove",
                    initialValue: 0,
                    in: {
                      $sum: [
                        "$$value",
                        {
                          $multiply: [
                            "$$this.courseCredit",
                            "$$this.regular.GP",
                          ],
                        },
                      ],
                    },
                  },
                },
                tc: {
                  $reduce: {
                    input: "$marksWithImprove",
                    initialValue: 0,
                    in: {
                      $sum: ["$$value", "$$this.courseCredit"],
                    },
                  },
                },
                ec: {
                  $reduce: {
                    input: "$marksWithImprove",
                    initialValue: 0,
                    in: {
                      $cond: {
                        if: { $eq: ["$$this.regular.GP", 0] },
                        then: { $sum: ["$$value", 0] },
                        else: { $sum: ["$$value", "$$this.courseCredit"] },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                cgp: 1,
                ec: 1,
                tc: 1,
                cgpa: {
                  $round: [{ $divide: ["$cgp", "$tc"] }, 2],
                },
              },
            },
          ],
          uptoThisYear: [
            {
              $match: {
                department: dept,
                currentSession: session,
                semester: { $gte: 1, $lte: secondSemester },
                roll,
              },
            },
            {
              $group: {
                _id: "$roll",
                courseMarks: { $push: "$$ROOT" },
              },
            },
            {
              $lookup: {
                from: "labmarks",
                localField: "_id",
                foreignField: "roll",
                pipeline: [
                  {
                    $match: {
                      department: dept,
                      currentSession: session,
                      semester: { $gte: 1, $lte: secondSemester },
                    },
                  },
                ],
                as: "labMarks",
              },
            },
            {
              $lookup: {
                from: "improves",
                localField: "_id",
                foreignField: "roll",
                pipeline: [
                  {
                    $match: {
                      department: dept,
                      currentSession: session,
                      semester: { $gte: 1, $lte: secondSemester },
                    },
                  },
                ],
                as: "theoryImproves",
              },
            },
            {
              $lookup: {
                from: "labimproves",
                localField: "_id",
                foreignField: "roll",
                pipeline: [
                  {
                    $match: {
                      department: dept,
                      currentSession: session,
                      semester: { $gte: 1, $lte: secondSemester },
                    },
                  },
                ],
                as: "labImproves",
              },
            },
            {
              $project: {
                courseMarks: {
                  $map: {
                    input: "$courseMarks",
                    as: "mark",
                    in: {
                      courseCode: "$$mark.courseCode",
                      courseCredit: "$$mark.credit",
                      internalMark: "$$mark.totalInternal",
                      finalMark: "$$mark.totalExternal",
                      totalMark: "$$mark.total",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$mark.total", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$mark.total", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$mark.total", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$mark.total", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$mark.total", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$mark.total", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$mark.total", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$mark.total", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$mark.total", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$mark.total", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$mark.total", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$mark.total", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$mark.total", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$mark.total", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$mark.total", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$mark.total", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$mark.total", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$mark.total", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
                labMarks: {
                  $map: {
                    input: "$labMarks",
                    as: "lab",
                    in: {
                      courseCode: "$$lab.courseCode",
                      courseCredit: "$$lab.credit",
                      internalMark: "$$lab.tweentyPercent",
                      finalMark: "$$lab.eightyPercent",
                      totalMark: "$$lab.labTotal",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$lab.labTotal", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$lab.labTotal", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
                theoryImproves: {
                  $map: {
                    input: "$theoryImproves",
                    as: "improve",
                    in: {
                      courseCode: "$$improve.courseCode",
                      courseCredit: "$$improve.credit",
                      internalMark: "$$improve.totalInternal",
                      finalMark: "$$improve.totalExternal",
                      totalMark: "$$improve.total",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.total", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$improve.total", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$improve.total", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$improve.total", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$improve.total", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$improve.total", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$improve.total", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$improve.total", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$improve.total", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.total", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$improve.total", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$improve.total", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$improve.total", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$improve.total", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$improve.total", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$improve.total", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$improve.total", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$improve.total", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
                labImproves: {
                  $map: {
                    input: "$labImproves",
                    as: "improve",
                    in: {
                      courseCode: "$$improve.courseCode",
                      courseCredit: "$$improve.credit",
                      internalMark: "$$improve.tweentyPercent",
                      finalMark: "$$improve.eightyPercent",
                      totalMark: "$$improve.labTotal",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.labTotal", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.labTotal", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                regularMarks: { $concatArrays: ["$courseMarks", "$labMarks"] },
                improveMarks: {
                  $concatArrays: ["$theoryImproves", "$labImproves"],
                },
              },
            },
            {
              $project: {
                marksWithImprove: {
                  $map: {
                    input: "$regularMarks",
                    as: "regularMark",
                    in: {
                      courseCode: "$$regularMark.courseCode",
                      courseCredit: "$$regularMark.courseCredit",
                      fullMarks: 100,
                      regular: {
                        internalMark: "$$regularMark.internalMark",
                        finalMark: "$$regularMark.finalMark",
                        totalMark: "$$regularMark.totalMark",
                        LG: "$$regularMark.LG",
                        GP: "$$regularMark.GP",
                      },
                      improve: {
                        $cond: {
                          if: {
                            $gt: [
                              {
                                $size: {
                                  $filter: {
                                    input: "$improveMarks",
                                    as: "improveMark",
                                    cond: {
                                      $eq: [
                                        "$$improveMark.courseCode",
                                        "$$regularMark.courseCode",
                                      ],
                                    },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                          then: {
                            $let: {
                              vars: {
                                matchingImprove: {
                                  $arrayElemAt: [
                                    {
                                      $filter: {
                                        input: "$improveMarks",
                                        as: "improveMark",
                                        cond: {
                                          $eq: [
                                            "$$improveMark.courseCode",
                                            "$$regularMark.courseCode",
                                          ],
                                        },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                              in: {
                                finalMark: "$$matchingImprove.finalMark",
                                totalMark: "$$matchingImprove.totalMark",
                                LG: "$$matchingImprove.LG",
                                GP: "$$matchingImprove.GP",
                              },
                            },
                          },
                          else: {
                            finalMark: "",
                            totalMark: "",
                            LG: "",
                            GP: "",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                cgp: {
                  $reduce: {
                    input: "$marksWithImprove",
                    initialValue: 0,
                    in: {
                      $sum: [
                        "$$value",
                        {
                          $multiply: [
                            "$$this.courseCredit",
                            "$$this.regular.GP",
                          ],
                        },
                      ],
                    },
                  },
                },
                tc: {
                  $reduce: {
                    input: "$marksWithImprove",
                    initialValue: 0,
                    in: {
                      $sum: ["$$value", "$$this.courseCredit"],
                    },
                  },
                },
                ec: {
                  $reduce: {
                    input: "$marksWithImprove",
                    initialValue: 0,
                    in: {
                      $cond: {
                        if: { $eq: ["$$this.regular.GP", 0] },
                        then: { $sum: ["$$value", 0] },
                        else: { $sum: ["$$value", "$$this.courseCredit"] },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                cgp: 1,
                ec: 1,
                tc: 1,
                cgpa: {
                  $round: [{ $divide: ["$cgp", "$tc"] }, 2],
                },
              },
            },
          ],
        },
      },
      {
        $unwind: "$thisYear",
      },
      {
        $unwind: "$previousYear",
      },
      {
        $unwind: "$uptoThisYear",
      },
    ]);

    const improvePoints = await Mark.aggregate([
      {
        $facet: {
          thisYear: [
            {
              $match: {
                department: dept,
                currentSession: session,
                semester: { $in: [firstSemester, secondSemester] },
                roll,
              },
            },
            {
              $group: {
                _id: "$roll",
                courseMarks: { $push: "$$ROOT" },
              },
            },
            {
              $lookup: {
                from: "labmarks",
                localField: "_id",
                foreignField: "roll",
                pipeline: [
                  {
                    $match: {
                      department: dept,
                      currentSession: session,
                      semester: { $in: [firstSemester, secondSemester] },
                    },
                  },
                ],
                as: "labMarks",
              },
            },
            {
              $lookup: {
                from: "improves",
                localField: "_id",
                foreignField: "roll",
                pipeline: [
                  {
                    $match: {
                      department: dept,
                      currentSession: session,
                      semester: { $in: [firstSemester, secondSemester] },
                    },
                  },
                ],
                as: "theoryImproves",
              },
            },
            {
              $lookup: {
                from: "labimproves",
                localField: "_id",
                foreignField: "roll",
                pipeline: [
                  {
                    $match: {
                      department: dept,
                      currentSession: session,
                      semester: { $in: [firstSemester, secondSemester] },
                    },
                  },
                ],
                as: "labImproves",
              },
            },
            {
              $project: {
                courseMarks: {
                  $map: {
                    input: "$courseMarks",
                    as: "mark",
                    in: {
                      courseCode: "$$mark.courseCode",
                      courseCredit: "$$mark.credit",
                      internalMark: "$$mark.totalInternal",
                      finalMark: "$$mark.totalExternal",
                      totalMark: "$$mark.total",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$mark.total", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$mark.total", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$mark.total", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$mark.total", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$mark.total", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$mark.total", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$mark.total", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$mark.total", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$mark.total", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$mark.total", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$mark.total", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$mark.total", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$mark.total", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$mark.total", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$mark.total", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$mark.total", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$mark.total", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$mark.total", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
                labMarks: {
                  $map: {
                    input: "$labMarks",
                    as: "lab",
                    in: {
                      courseCode: "$$lab.courseCode",
                      courseCredit: "$$lab.credit",
                      internalMark: "$$lab.tweentyPercent",
                      finalMark: "$$lab.eightyPercent",
                      totalMark: "$$lab.labTotal",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$lab.labTotal", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$lab.labTotal", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
                theoryImproves: {
                  $map: {
                    input: "$theoryImproves",
                    as: "improve",
                    in: {
                      courseCode: "$$improve.courseCode",
                      courseCredit: "$$improve.credit",
                      internalMark: "$$improve.totalInternal",
                      finalMark: "$$improve.totalExternal",
                      totalMark: "$$improve.total",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.total", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$improve.total", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$improve.total", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$improve.total", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$improve.total", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$improve.total", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$improve.total", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$improve.total", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$improve.total", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.total", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$improve.total", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$improve.total", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$improve.total", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$improve.total", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$improve.total", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$improve.total", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$improve.total", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$improve.total", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
                labImproves: {
                  $map: {
                    input: "$labImproves",
                    as: "improve",
                    in: {
                      courseCode: "$$improve.courseCode",
                      courseCredit: "$$improve.credit",
                      internalMark: "$$improve.tweentyPercent",
                      finalMark: "$$improve.eightyPercent",
                      totalMark: "$$improve.labTotal",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.labTotal", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.labTotal", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                regularMarks: { $concatArrays: ["$courseMarks", "$labMarks"] },
                improveMarks: {
                  $concatArrays: ["$theoryImproves", "$labImproves"],
                },
              },
            },
            {
              $project: {
                marksWithImprove: {
                  $map: {
                    input: "$regularMarks",
                    as: "regularMark",
                    in: {
                      courseCode: "$$regularMark.courseCode",
                      courseCredit: "$$regularMark.courseCredit",
                      fullMarks: 100,
                      regular: {
                        internalMark: "$$regularMark.internalMark",
                        finalMark: "$$regularMark.finalMark",
                        totalMark: "$$regularMark.totalMark",
                        LG: "$$regularMark.LG",
                        GP: "$$regularMark.GP",
                      },
                      improve: {
                        $cond: {
                          if: {
                            $gt: [
                              {
                                $size: {
                                  $filter: {
                                    input: "$improveMarks",
                                    as: "improveMark",
                                    cond: {
                                      $eq: [
                                        "$$improveMark.courseCode",
                                        "$$regularMark.courseCode",
                                      ],
                                    },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                          then: {
                            $let: {
                              vars: {
                                matchingImprove: {
                                  $arrayElemAt: [
                                    {
                                      $filter: {
                                        input: "$improveMarks",
                                        as: "improveMark",
                                        cond: {
                                          $eq: [
                                            "$$improveMark.courseCode",
                                            "$$regularMark.courseCode",
                                          ],
                                        },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                              in: {
                                finalMark: "$$matchingImprove.finalMark",
                                totalMark: "$$matchingImprove.totalMark",
                                LG: "$$matchingImprove.LG",
                                GP: "$$matchingImprove.GP",
                              },
                            },
                          },
                          else: {
                            finalMark: "",
                            totalMark: "",
                            LG: "",
                            GP: "",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                cgp: {
                  $reduce: {
                    input: "$marksWithImprove",
                    initialValue: 0,
                    in: {
                      $cond: {
                        if: { $ne: ["$$this.improve.GP", ""] },
                        then: {
                          $sum: [
                            "$$value",
                            {
                              $multiply: [
                                "$$this.courseCredit",
                                "$$this.improve.GP",
                              ],
                            },
                          ],
                        },
                        else: {
                          $sum: [
                            "$$value",
                            {
                              $multiply: [
                                "$$this.courseCredit",
                                "$$this.regular.GP",
                              ],
                            },
                          ],
                        },
                      },
                    },
                  },
                },
                tc: {
                  $reduce: {
                    input: "$marksWithImprove",
                    initialValue: 0,
                    in: {
                      $sum: ["$$value", "$$this.courseCredit"],
                    },
                  },
                },
                ec: {
                  $reduce: {
                    input: "$marksWithImprove",
                    initialValue: 0,
                    in: {
                      $cond: {
                        if: { $eq: ["$$this.regular.GP", 0] },
                        then: { $sum: ["$$value", 0] },
                        else: { $sum: ["$$value", "$$this.courseCredit"] },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                cgp: 1,
                ec: 1,
                tc: 1,
                cgpa: {
                  $round: [{ $divide: ["$cgp", "$tc"] }, 2],
                },
              },
            },
          ],
          previousYear: [
            {
              $match: {
                department: dept,
                currentSession: session,
                semester: { $gte: 1, $lte: prevMaxSemester },
                roll,
              },
            },
            {
              $group: {
                _id: "$roll",
                courseMarks: { $push: "$$ROOT" },
              },
            },
            {
              $lookup: {
                from: "labmarks",
                localField: "_id",
                foreignField: "roll",
                pipeline: [
                  {
                    $match: {
                      department: dept,
                      currentSession: session,
                      semester: { $gte: 1, $lte: prevMaxSemester },
                    },
                  },
                ],
                as: "labMarks",
              },
            },
            {
              $lookup: {
                from: "improves",
                localField: "_id",
                foreignField: "roll",
                pipeline: [
                  {
                    $match: {
                      department: dept,
                      currentSession: session,
                      semester: { $gte: 1, $lte: prevMaxSemester },
                    },
                  },
                ],
                as: "theoryImproves",
              },
            },
            {
              $lookup: {
                from: "labimproves",
                localField: "_id",
                foreignField: "roll",
                pipeline: [
                  {
                    $match: {
                      department: dept,
                      currentSession: session,
                      semester: { $gte: 1, $lte: prevMaxSemester },
                    },
                  },
                ],
                as: "labImproves",
              },
            },
            {
              $project: {
                courseMarks: {
                  $map: {
                    input: "$courseMarks",
                    as: "mark",
                    in: {
                      courseCode: "$$mark.courseCode",
                      courseCredit: "$$mark.credit",
                      internalMark: "$$mark.totalInternal",
                      finalMark: "$$mark.totalExternal",
                      totalMark: "$$mark.total",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$mark.total", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$mark.total", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$mark.total", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$mark.total", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$mark.total", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$mark.total", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$mark.total", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$mark.total", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$mark.total", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$mark.total", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$mark.total", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$mark.total", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$mark.total", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$mark.total", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$mark.total", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$mark.total", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$mark.total", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$mark.total", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
                labMarks: {
                  $map: {
                    input: "$labMarks",
                    as: "lab",
                    in: {
                      courseCode: "$$lab.courseCode",
                      courseCredit: "$$lab.credit",
                      internalMark: "$$lab.tweentyPercent",
                      finalMark: "$$lab.eightyPercent",
                      totalMark: "$$lab.labTotal",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$lab.labTotal", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$lab.labTotal", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
                theoryImproves: {
                  $map: {
                    input: "$theoryImproves",
                    as: "improve",
                    in: {
                      courseCode: "$$improve.courseCode",
                      courseCredit: "$$improve.credit",
                      internalMark: "$$improve.totalInternal",
                      finalMark: "$$improve.totalExternal",
                      totalMark: "$$improve.total",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.total", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$improve.total", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$improve.total", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$improve.total", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$improve.total", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$improve.total", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$improve.total", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$improve.total", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$improve.total", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.total", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$improve.total", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$improve.total", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$improve.total", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$improve.total", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$improve.total", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$improve.total", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$improve.total", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$improve.total", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
                labImproves: {
                  $map: {
                    input: "$labImproves",
                    as: "improve",
                    in: {
                      courseCode: "$$improve.courseCode",
                      courseCredit: "$$improve.credit",
                      internalMark: "$$improve.tweentyPercent",
                      finalMark: "$$improve.eightyPercent",
                      totalMark: "$$improve.labTotal",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.labTotal", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.labTotal", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                regularMarks: { $concatArrays: ["$courseMarks", "$labMarks"] },
                improveMarks: {
                  $concatArrays: ["$theoryImproves", "$labImproves"],
                },
              },
            },
            {
              $project: {
                marksWithImprove: {
                  $map: {
                    input: "$regularMarks",
                    as: "regularMark",
                    in: {
                      courseCode: "$$regularMark.courseCode",
                      courseCredit: "$$regularMark.courseCredit",
                      fullMarks: 100,
                      regular: {
                        internalMark: "$$regularMark.internalMark",
                        finalMark: "$$regularMark.finalMark",
                        totalMark: "$$regularMark.totalMark",
                        LG: "$$regularMark.LG",
                        GP: "$$regularMark.GP",
                      },
                      improve: {
                        $cond: {
                          if: {
                            $gt: [
                              {
                                $size: {
                                  $filter: {
                                    input: "$improveMarks",
                                    as: "improveMark",
                                    cond: {
                                      $eq: [
                                        "$$improveMark.courseCode",
                                        "$$regularMark.courseCode",
                                      ],
                                    },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                          then: {
                            $let: {
                              vars: {
                                matchingImprove: {
                                  $arrayElemAt: [
                                    {
                                      $filter: {
                                        input: "$improveMarks",
                                        as: "improveMark",
                                        cond: {
                                          $eq: [
                                            "$$improveMark.courseCode",
                                            "$$regularMark.courseCode",
                                          ],
                                        },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                              in: {
                                finalMark: "$$matchingImprove.finalMark",
                                totalMark: "$$matchingImprove.totalMark",
                                LG: "$$matchingImprove.LG",
                                GP: "$$matchingImprove.GP",
                              },
                            },
                          },
                          else: {
                            finalMark: "",
                            totalMark: "",
                            LG: "",
                            GP: "",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                cgp: {
                  $reduce: {
                    input: "$marksWithImprove",
                    initialValue: 0,
                    in: {
                      $cond: {
                        if: { $ne: ["$$this.improve.GP", ""] },
                        then: {
                          $sum: [
                            "$$value",
                            {
                              $multiply: [
                                "$$this.courseCredit",
                                "$$this.improve.GP",
                              ],
                            },
                          ],
                        },
                        else: {
                          $sum: [
                            "$$value",
                            {
                              $multiply: [
                                "$$this.courseCredit",
                                "$$this.regular.GP",
                              ],
                            },
                          ],
                        },
                      },
                    },
                  },
                },
                tc: {
                  $reduce: {
                    input: "$marksWithImprove",
                    initialValue: 0,
                    in: {
                      $sum: ["$$value", "$$this.courseCredit"],
                    },
                  },
                },
                ec: {
                  $reduce: {
                    input: "$marksWithImprove",
                    initialValue: 0,
                    in: {
                      $cond: {
                        if: { $eq: ["$$this.regular.GP", 0] },
                        then: { $sum: ["$$value", 0] },
                        else: { $sum: ["$$value", "$$this.courseCredit"] },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                cgp: 1,
                ec: 1,
                tc: 1,
                cgpa: {
                  $round: [{ $divide: ["$cgp", "$tc"] }, 2],
                },
              },
            },
          ],
          uptoThisYear: [
            {
              $match: {
                department: dept,
                currentSession: session,
                semester: { $gte: 1, $lte: secondSemester },
                roll,
              },
            },
            {
              $group: {
                _id: "$roll",
                courseMarks: { $push: "$$ROOT" },
              },
            },
            {
              $lookup: {
                from: "labmarks",
                localField: "_id",
                foreignField: "roll",
                pipeline: [
                  {
                    $match: {
                      department: dept,
                      currentSession: session,
                      semester: { $gte: 1, $lte: secondSemester },
                    },
                  },
                ],
                as: "labMarks",
              },
            },
            {
              $lookup: {
                from: "improves",
                localField: "_id",
                foreignField: "roll",
                pipeline: [
                  {
                    $match: {
                      department: dept,
                      currentSession: session,
                      semester: { $gte: 1, $lte: secondSemester },
                    },
                  },
                ],
                as: "theoryImproves",
              },
            },
            {
              $lookup: {
                from: "labimproves",
                localField: "_id",
                foreignField: "roll",
                pipeline: [
                  {
                    $match: {
                      department: dept,
                      currentSession: session,
                      semester: { $gte: 1, $lte: secondSemester },
                    },
                  },
                ],
                as: "labImproves",
              },
            },
            {
              $project: {
                courseMarks: {
                  $map: {
                    input: "$courseMarks",
                    as: "mark",
                    in: {
                      courseCode: "$$mark.courseCode",
                      courseCredit: "$$mark.credit",
                      internalMark: "$$mark.totalInternal",
                      finalMark: "$$mark.totalExternal",
                      totalMark: "$$mark.total",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$mark.total", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$mark.total", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$mark.total", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$mark.total", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$mark.total", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$mark.total", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$mark.total", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$mark.total", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$mark.total", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$mark.total", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$mark.total", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$mark.total", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$mark.total", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$mark.total", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$mark.total", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$mark.total", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$mark.total", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$mark.total", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
                labMarks: {
                  $map: {
                    input: "$labMarks",
                    as: "lab",
                    in: {
                      courseCode: "$$lab.courseCode",
                      courseCredit: "$$lab.credit",
                      internalMark: "$$lab.tweentyPercent",
                      finalMark: "$$lab.eightyPercent",
                      totalMark: "$$lab.labTotal",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$lab.labTotal", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$lab.labTotal", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$lab.labTotal", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
                theoryImproves: {
                  $map: {
                    input: "$theoryImproves",
                    as: "improve",
                    in: {
                      courseCode: "$$improve.courseCode",
                      courseCredit: "$$improve.credit",
                      internalMark: "$$improve.totalInternal",
                      finalMark: "$$improve.totalExternal",
                      totalMark: "$$improve.total",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.total", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$improve.total", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$improve.total", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$improve.total", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$improve.total", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$improve.total", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$improve.total", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$improve.total", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$improve.total", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.total", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$improve.total", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$improve.total", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$improve.total", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$improve.total", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$improve.total", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$improve.total", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$improve.total", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$improve.total", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
                labImproves: {
                  $map: {
                    input: "$labImproves",
                    as: "improve",
                    in: {
                      courseCode: "$$improve.courseCode",
                      courseCredit: "$$improve.credit",
                      internalMark: "$$improve.tweentyPercent",
                      finalMark: "$$improve.eightyPercent",
                      totalMark: "$$improve.labTotal",
                      LG: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.labTotal", 80] },
                              then: "A+",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 75] },
                              then: "A",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 70] },
                              then: "A-",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 65] },
                              then: "B+",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 60] },
                              then: "B",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 55] },
                              then: "B-",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 50] },
                              then: "C+",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 45] },
                              then: "C",
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 40] },
                              then: "D",
                            },
                          ],
                          default: "F",
                        },
                      },
                      GP: {
                        $switch: {
                          branches: [
                            {
                              case: { $gte: ["$$improve.labTotal", 80] },
                              then: 4.0,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 75] },
                              then: 3.75,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 70] },
                              then: 3.5,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 65] },
                              then: 3.25,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 60] },
                              then: 3.0,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 55] },
                              then: 2.75,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 50] },
                              then: 2.5,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 45] },
                              then: 2.25,
                            },
                            {
                              case: { $gte: ["$$improve.labTotal", 40] },
                              then: 2.0,
                            },
                          ],
                          default: 0,
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                regularMarks: { $concatArrays: ["$courseMarks", "$labMarks"] },
                improveMarks: {
                  $concatArrays: ["$theoryImproves", "$labImproves"],
                },
              },
            },
            {
              $project: {
                marksWithImprove: {
                  $map: {
                    input: "$regularMarks",
                    as: "regularMark",
                    in: {
                      courseCode: "$$regularMark.courseCode",
                      courseCredit: "$$regularMark.courseCredit",
                      fullMarks: 100,
                      regular: {
                        internalMark: "$$regularMark.internalMark",
                        finalMark: "$$regularMark.finalMark",
                        totalMark: "$$regularMark.totalMark",
                        LG: "$$regularMark.LG",
                        GP: "$$regularMark.GP",
                      },
                      improve: {
                        $cond: {
                          if: {
                            $gt: [
                              {
                                $size: {
                                  $filter: {
                                    input: "$improveMarks",
                                    as: "improveMark",
                                    cond: {
                                      $eq: [
                                        "$$improveMark.courseCode",
                                        "$$regularMark.courseCode",
                                      ],
                                    },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                          then: {
                            $let: {
                              vars: {
                                matchingImprove: {
                                  $arrayElemAt: [
                                    {
                                      $filter: {
                                        input: "$improveMarks",
                                        as: "improveMark",
                                        cond: {
                                          $eq: [
                                            "$$improveMark.courseCode",
                                            "$$regularMark.courseCode",
                                          ],
                                        },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                              in: {
                                finalMark: "$$matchingImprove.finalMark",
                                totalMark: "$$matchingImprove.totalMark",
                                LG: "$$matchingImprove.LG",
                                GP: "$$matchingImprove.GP",
                              },
                            },
                          },
                          else: {
                            finalMark: "",
                            totalMark: "",
                            LG: "",
                            GP: "",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                cgp: {
                  $reduce: {
                    input: "$marksWithImprove",
                    initialValue: 0,
                    in: {
                      $cond: {
                        if: { $ne: ["$$this.improve.GP", ""] },
                        then: {
                          $sum: [
                            "$$value",
                            {
                              $multiply: [
                                "$$this.courseCredit",
                                "$$this.improve.GP",
                              ],
                            },
                          ],
                        },
                        else: {
                          $sum: [
                            "$$value",
                            {
                              $multiply: [
                                "$$this.courseCredit",
                                "$$this.regular.GP",
                              ],
                            },
                          ],
                        },
                      },
                    },
                  },
                },
                tc: {
                  $reduce: {
                    input: "$marksWithImprove",
                    initialValue: 0,
                    in: {
                      $sum: ["$$value", "$$this.courseCredit"],
                    },
                  },
                },
                ec: {
                  $reduce: {
                    input: "$marksWithImprove",
                    initialValue: 0,
                    in: {
                      $cond: {
                        if: { $eq: ["$$this.regular.GP", 0] },
                        then: { $sum: ["$$value", 0] },
                        else: { $sum: ["$$value", "$$this.courseCredit"] },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                cgp: 1,
                ec: 1,
                tc: 1,
                cgpa: {
                  $round: [{ $divide: ["$cgp", "$tc"] }, 2],
                },
              },
            },
          ],
        },
      },
      {
        $unwind: "$thisYear",
      },
      {
        $unwind: "$previousYear",
      },
      {
        $unwind: "$uptoThisYear",
      },
    ]);

    const marks = {
      firstSemester:
        courseMarks[0]?._id < courseMarks[1]?._id
          ? courseMarks[0]?.marksWithImprove
          : courseMarks[1]?.marksWithImprove,
      secondSemester:
        courseMarks[0]?._id > courseMarks[1]?._id
          ? courseMarks[0]?.marksWithImprove
          : courseMarks[1]?.marksWithImprove,
    };

    res.status(200).json({
      yearTabulation: {
        marks: marks,
        regularPoints: regularPoints[0],
        improvePoints: improvePoints[0]
      }
    });
  } catch (err) {
    next(createError(err.message));
  }
};

module.exports = {
  getTabulation,
  getCourseTabulation,
  getImproveMarkTabulation,
  getSemesterTranscript,
  getTabulationSheetPerYear,
};
