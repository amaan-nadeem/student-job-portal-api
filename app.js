const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const cors = require('cors');


// connecting to mongoDB
connectDB();

// fetching body from body Parser 
app.use(bodyParser.json());


// cross origin
app.use(cors());

// login and signup routes
app.use('/api/v1/admin' , require('./routes/adminLoginRoutes'));
app.use('/api/v1/company' , require('./routes/companyLoginRoutes'));
app.use('/api/v1/student' , require('./routes/studentsLoginRoutes'));
app.use('/api/v1/jobs' , require('./routes/createAndApplyJobRoute'));
app.use('/api/v1/admin', require('./routes/adminLoginRoutes'));


// 404 not found
app.use((req, res) =>
  res
    .status(404)
    .send({
      message: `API route not found`,
      route: `${req.hostname}${req.url}`
    })
);


const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log(`Connected to Port ${PORT}`));
