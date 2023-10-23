// external imports
const createError = require('http-errors');

// internal imports
const Mark = require('../models/Mark');

const getTabulation = async (req, res, next) => {
    try {
        const marks = await Mark.aggregate([{
            $match: { currentSession: '2017-18', semester: 1 }
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
                            _id: '$$course._id',
                            courseId: '$$course.courseId',
                            department: '$$course.department',
                            roll: '$$course.roll',
                            credit: 3,
                            forty: {
                                $sum: ['$$course.midOne', '$$course.midTwo', '$$course.presentationOrAssignment', '$$course.attendance']
                            },
                            sixty: {
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
                            _id: '$$lab._id',
                            courseId: '$$lab.courseId',
                            department: '$$lab.department',
                            roll: '$$lab.roll',
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
                courses: {
                    $push: '$marks'
                }
            }
        }, {
            $addFields: {
                GPA: { $round: [{ $divide: ['$totalPoint', '$totalCredit'] }, 2] }
            }
        }, {
            $project: { totalPoint: 0, totalCredit: 0 }
        }, {
            $sort: {_id: 1}
        }]);

        res.status(200).json({
            result: marks
        });

    } catch (err) {
        next(createError(err.message));
    }
}

module.exports = {
    getTabulation
}