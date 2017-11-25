'use strict';

const AWS = require('aws-sdk');
const fileType = require('file-type');

const s3 = new AWS.S3({apiVersion: '2006-03-01'});


module.exports.upload = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const username ="shecodes";
  const title = event.body.title ? event.body.title.replace(/\W/g,'') : 'uploaded_image';

  //get the image data from upload
  const body = event.body;

  const fileBuffer = new Buffer(body['image'].replace(/^data:image\/\w+;base64,/, ""), 'base64');
  const fileMime = fileType(fileBuffer);
  const mime = fileMime.mime;
  const ext = fileMime.ext;

  //validate image is on right type
  if (fileBuffer.length < 500000 ) {

    // upload it to s3 with unix timestamp as a file name
    const timestamp = Math.floor(new Date() / 1000);
    const fileName = `${title}-${timestamp}.${ext}`;

    const bucket = process.env.BUCKET;
    const bucket_url = process.env.BUCKET_URL;
    const connectionString = process.env.PG_CONNECTION_STRING;
    const tableName = process.env.PG_TABLE;
    const staticurl = `${bucket_url}/${fileName}`;

    const params = {
        Body: fileBuffer,
        Key: fileName,
        Bucket: bucket,
        ContentEncoding: 'base64',
        ContentType: mime,
        Metadata:{
          ContentType: mime,
          "user": username,
          "description":  event.body.description
        }
    };

    s3.putObject(params, (err, data) => {

        if (err) callback(new Error([err.statusCode], [err.message]));
        callback(null, {
          statusCode: '200',
          headers: {'Access-Control-Allow-Origin': '*'},
          body: JSON.stringify({"message": fileName})
      });

    });
  } else {
      callback(null, {
          statusCode: '402',
          headers: {'Access-Control-Allow-Origin': '*'},
          body: JSON.stringify({"message": "Not a valid file type or file too big."})
      });
  }
};
