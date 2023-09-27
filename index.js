// External import
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Internal imports
const { notFoundHandler, errorHandler } = require('./middlewares/common/errorHandler');
const userRouter = require('./routers/userRouter');
const userInfoRouter = require('./routers/userInfoRouter');
const loginRouter = require('./routers/loginRouter');
const sessionRouter = require('./routers/sessionRouter');
const markRouter = require('./routers/markRouter');
const courseRouter = require('./routers/courseRouter');

// App configuration
const app = express();
app.use(cors());
dotenv.config();

// Database connection
mongoose.connect(process.env.DB_URL_STRING)
    .then(() => console.log('Database connection successfull'))
    .catch(err => console.log(err));

// Request parser
app.use(express.json());

// Routing setup
app.get('/', (req, res) => {
    res.status(200).send("Hello World!");
});

app.use('/user', userRouter);
app.use('/user-info', userInfoRouter);
app.use('/login', loginRouter);
app.use('/session', sessionRouter);
app.use('/course', courseRouter);
app.use('/mark', markRouter);

// not found handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// app listener
app.listen(process.env.PORT, () => {
    console.log(`Server is running at port ${process.env.PORT}`);
});