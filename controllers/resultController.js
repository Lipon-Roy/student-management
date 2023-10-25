// external imports
const createError = require('http-errors');

// internal imports
const Mark = require('../models/Mark');

const getTabulation = async (req, res, next) => {
    try {
        const { dept, session, semester } = req.params;
        
        const marks = await Mark.aggregate([{
            $match: {
                department: dept,
                currentSession: session,
                semester: Number(semester)
            }
        }, {
            $group: {
                _id: '$roll',
                courses: { $push: '$$ROOT' }
            }
        }, {
            $lookup: {
                from: 'labmarks',
                localField: '_id',
                foreignField: 'roll',
                pipeline: [{ $match: { currentSession: '2017-18', semester: 1 } }],
                as: 'labs'
            }
        }, {
            $project: {
                _id: 1,
                courses: {
                    $map: {
                        input: '$courses',
                        as: 'course',
                        in: {
                            roll: '$$course.roll',
                            courseCode: '$$course.courseCode',
                            credit: '$$course.credit',
                            "theory Continuous (40%)": {
                                $sum: ['$$course.midOne', '$$course.midTwo', '$$course.presentationOrAssignment', '$$course.attendance']
                            },
                            "theory final exam (60%)": {
                                $switch: {
                                    branches: [
                                        { case: { $lte: [{ $abs: { $subtract: ['$$course.firstExaminer', '$$course.secondExaminer'] } }, 12] }, then: { $avg: ['$$course.firstExaminer', '$$course.secondExaminer'] } },
                                        { case: { $eq: [{ $abs: { $subtract: ['$$course.firstExaminer', '$$course.secondExaminer'] } }, '$$course.minimum'] }, then: { $avg: ['$$course.firstExaminer', '$$course.secondExaminer'] } },
                                        { case: { $eq: [{ $abs: { $subtract: ['$$course.secondExaminer', '$$course.thirdExaminer'] } }, '$$course.minimum'] }, then: { $avg: ['$$course.secondExaminer', '$$course.thirdExaminer'] } },
                                    ],
                                    default: { $avg: ['$$course.firstExaminer', '$$course.thirdExaminer'] }
                                }
                            },
                            total: '$$course.total',
                            LG: {
                                $switch: {
                                    branches: [
                                        { case: { $gte: ['$$course.total', 80] }, then: 'A+' },
                                        { case: { $gte: ['$$course.total', 75] }, then: 'A' },
                                        { case: { $gte: ['$$course.total', 70] }, then: 'A-' },
                                        { case: { $gte: ['$$course.total', 65] }, then: 'B+' },
                                        { case: { $gte: ['$$course.total', 60] }, then: 'B' },
                                        { case: { $gte: ['$$course.total', 55] }, then: 'B-' },
                                        { case: { $gte: ['$$course.total', 50] }, then: 'C+' },
                                        { case: { $gte: ['$$course.total', 45] }, then: 'C' },
                                        { case: { $gte: ['$$course.total', 40] }, then: 'D' },
                                    ],
                                    default: 'F'
                                }
                            },
                            GP: {
                                $switch: {
                                    branches: [
                                        { case: { $gte: ['$$course.total', 80] }, then: 4.00 },
                                        { case: { $gte: ['$$course.total', 75] }, then: 3.75 },
                                        { case: { $gte: ['$$course.total', 70] }, then: 3.50 },
                                        { case: { $gte: ['$$course.total', 65] }, then: 3.25 },
                                        { case: { $gte: ['$$course.total', 60] }, then: 3.00 },
                                        { case: { $gte: ['$$course.total', 55] }, then: 2.75 },
                                        { case: { $gte: ['$$course.total', 50] }, then: 2.50 },
                                        { case: { $gte: ['$$course.total', 45] }, then: 2.25 },
                                        { case: { $gte: ['$$course.total', 40] }, then: 2.00 },
                                    ],
                                    default: 0
                                }
                            }
                        }
                    }
                },
                labs: {
                    $map: {
                        input: '$labs',
                        as: 'lab',
                        in: {
                            roll: '$$lab.roll',
                            courseCode: '$$lab.courseCode',
                            "Lab Continuous (20%)": 15,
                            "Lab final exam (80%)": 55,
                            total: '$$lab.labTotal',
                            credit: '$$lab.credit',
                            LG: {
                                $switch: {
                                    branches: [
                                        { case: { $gte: ['$$lab.labTotal', 80] }, then: 'A+' },
                                        { case: { $gte: ['$$lab.labTotal', 75] }, then: 'A' },
                                        { case: { $gte: ['$$lab.labTotal', 70] }, then: 'A-' },
                                        { case: { $gte: ['$$lab.labTotal', 65] }, then: 'B+' },
                                        { case: { $gte: ['$$lab.labTotal', 60] }, then: 'B' },
                                        { case: { $gte: ['$$lab.labTotal', 55] }, then: 'B-' },
                                        { case: { $gte: ['$$lab.labTotal', 50] }, then: 'C+' },
                                        { case: { $gte: ['$$lab.labTotal', 45] }, then: 'C' },
                                        { case: { $gte: ['$$lab.labTotal', 40] }, then: 'D' },
                                    ],
                                    default: 'F'
                                }
                            },
                            GP: {
                                $switch: {
                                    branches: [
                                        { case: { $gte: ['$$lab.labTotal', 80] }, then: 4.00 },
                                        { case: { $gte: ['$$lab.labTotal', 75] }, then: 3.75 },
                                        { case: { $gte: ['$$lab.labTotal', 70] }, then: 3.50 },
                                        { case: { $gte: ['$$lab.labTotal', 65] }, then: 3.25 },
                                        { case: { $gte: ['$$lab.labTotal', 60] }, then: 3.00 },
                                        { case: { $gte: ['$$lab.labTotal', 55] }, then: 2.75 },
                                        { case: { $gte: ['$$lab.labTotal', 50] }, then: 2.50 },
                                        { case: { $gte: ['$$lab.labTotal', 45] }, then: 2.25 },
                                        { case: { $gte: ['$$lab.labTotal', 40] }, then: 2.00 },
                                    ],
                                    default: 0
                                }
                            }
                        }
                    }
                }
            }
        }, {
            $addFields: { marks: { $concatArrays: ['$courses', '$labs'] } }
        }, {
            $project: { labs: 0, courses: 0 }
        }, {
            $unwind: '$marks'
        }, {
            $group: {
                _id: '$marks.roll',
                totalPoint: { $sum: { $multiply: ['$marks.credit', '$marks.GP'] } },
                totalCredit: { $sum: '$marks.credit' },
                marks: {
                    $push: '$marks'
                }
            }
        }, {
            $addFields: {
                GPA: { $round: [{ $divide: ['$totalPoint', '$totalCredit'] }, 2] },
                CGPA: 3.50
            }
        }, {
            $project: { totalPoint: 0, totalCredit: 0 }
        }, {
            $sort: { _id: 1 }
        }]);
        
        res.status(200).json({
            result: marks
        });

    } catch (err) {
        next(createError(err.message));
    }
}

const getCourseTabulation = async (req, res, next) => {
    try {
        const { dept, session, semester, course, code } = req.params;

        const result = await Mark.aggregate([{
            $match: {
                department: dept,
                currentSession: session,
                semester: Number(semester),
                courseName: course,
                courseCode: code
            }
        }, {
            $addFields: {
                minimum: { $min: [{ $abs: { $subtract: ['$firstExaminer', '$secondExaminer'] } }, { $abs: { $subtract: ['$secondExaminer', '$thirdExaminer'] } }, { $abs: { $subtract: ['$firstExaminer', '$thirdExaminer'] } }] },
                forty: { $sum: ['$midOne', '$midTwo', '$assignment', '$attendance'] }
            }
        }, {
            $addFields: {
                sixty: {
                    $switch: {
                        branches: [
                            { case: { $lte: [{ $abs: { $subtract: ['$firstExaminer', '$secondExaminer'] } }, 12] }, then: { $avg: ['$firstExaminer', '$secondExaminer'] } },
                            { case: { $lte: [{ $abs: { $subtract: ['$firstExaminer', '$secondExaminer'] } }, '$minimum'] }, then: { $avg: ['$firstExaminer', '$secondExaminer'] } },
                            { case: { $lte: [{ $abs: { $subtract: ['$secondExaminer', '$thirdExaminer'] } }, '$minimum'] }, then: { $avg: ['$secondExaminer', '$thirdExaminer'] } }
                        ],
                        default: { $avg: ['$firstExaminer', '$thirdExaminer'] }
                    }
                },
                LG: {
                    $switch: {
                        branches: [
                            { case: { $gte: ['$total', 80] }, then: 'A+' },
                            { case: { $gte: ['$total', 75] }, then: 'A' },
                            { case: { $gte: ['$total', 70] }, then: 'A-' },
                            { case: { $gte: ['$total', 65] }, then: 'B+' },
                            { case: { $gte: ['$total', 60] }, then: 'B' },
                            { case: { $gte: ['$total', 55] }, then: 'B-' },
                            { case: { $gte: ['$total', 50] }, then: 'C+' },
                            { case: { $gte: ['$total', 45] }, then: 'C' },
                            { case: { $gte: ['$total', 40] }, then: 'D' }
                        ],
                        default: 'F'
                    }
                },
                GP: {
                    $switch: {
                        branches: [
                            { case: { $gte: ['$total', 80] }, then: 4.00 },
                            { case: { $gte: ['$total', 75] }, then: 3.75 },
                            { case: { $gte: ['$total', 70] }, then: 3.50 },
                            { case: { $gte: ['$total', 65] }, then: 3.25 },
                            { case: { $gte: ['$total', 60] }, then: 3.00 },
                            { case: { $gte: ['$total', 55] }, then: 2.75 },
                            { case: { $gte: ['$total', 50] }, then: 2.50 },
                            { case: { $gte: ['$total', 45] }, then: 2.25 },
                            { case: { $gte: ['$total', 40] }, then: 2.00 }
                        ],
                        default: 0
                    }
                }
            }
        }, {
            $group: {
                _id: '$roll',
                marks: {
                    $push: '$$ROOT'
                }
            }
        }, {
            $unwind: '$marks'
        }, {
            $project: {
                'marks._id': 0,
                'marks.roll': 0,
                'marks.department': 0,
                'marks.credit': 0,
                'marks.minimum': 0,
                'marks.currentSession': 0,
                'marks.semester': 0,
                'marks.isThirdExaminer': 0
            }
        }, {
            $sort: {_id: 1}
        }]);

        res.status(200).json({
            result: result
        });
    } catch (err) {
        next(createError(err.message));
    }
}

module.exports = {
    getTabulation,
    getCourseTabulation
}