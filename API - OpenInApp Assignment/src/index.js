// require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import connectDb from "./db/index.js";
import { app } from "./app.js";
import runCronJobs from "./cron/cronJobs.js";

dotenv.config({
  path: "./env",
});

connectDb()
  .then(() => {
    app.on("error", () => {
      console.log(`Error : `, error);
      throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(`MongoDB Connection Failed !!`, err);
  });

runCronJobs()
  .then(() => {
    console.log("Cron Job is Running !!");
  })
  .catch((err) => {
    console.log("Running Cron Job Failed ", err);
  });

/*

import express from 'express';
const app = express();

;( async () => {
    try {
        console.log(`${process.env.PORT}`)
        console.log(`${process.env.MONGO_URI}`)
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error", () => { 
            console.log("Error : ", error);
            throw error;
        })

        app.listen(process.env.PORT, () => { 
            console.log(`App is listening on PORT ${process.env.PORT}`);
        })
    } catch (error) { 
        console.error("ERROR : ", error); 
        throw error
    }

})()

*/
