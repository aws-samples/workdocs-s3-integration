const AWS = require('aws-sdk');	
	const got = require('got');	
	const FormData = require('form-data');	
	const workdocs = new AWS.WorkDocs({region: 'us-east-1'});	
	const Log = require('./log');	
	//const fs = require("fs");	
	//const readLine = require("readline");	
		
	// get reference to S3 client	
	const s3 = new AWS.S3();	
		
	// Read options from the event parameter.	
	let srcBucket;	
	let srckey;	
	let log;	
		
	exports.handler = async (event, context) => {	
	  log = new Log(event, context);	
	  srcBucket = event.Records[0].s3.bucket.name;	
	  log.info(srcBucket);	
	  srckey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));	
		
		
	  log.info(srckey);	
	  // Download the file from the S3 source bucket. 	
	  try {	
	    log.info("Entering main start function")	
	    const user = await describeUsers();	
	    const rootFolderId = user.Users[0].RootFolderId;	
	    log.info("RootfolderID", rootFolderId)	
	    const filename = srckey;	
	    log.info(filename);	
	    const {	
	      documentId,	
	      versionId,	
	      uploadUrl,	
	      signedHeaders,	
	    } = await initUpload({ folderId: rootFolderId, filename });	
	    log.info("folderid",rootFolderId);	
	    await uploadFile({ filename, signedHeaders, uploadUrl });	
	    log.info("uploadurl",uploadUrl);	
	    await updateVersion({ documentId, versionId });	
	    log.info("versionid",versionId);	
	  } catch (e) {	
	    log.error(e);	
	  }	
	};	
		
	const describeUsers = async () => {	
	  const user = await workdocs	
	      .describeUsers({	
	          OrganizationId: process.env.ID,//'d-90677c1311', // your WorkDocs organization Id	
	          Query: process.env.Query,//'viyoma', // name of an existing WorkDocs user	
	      })	
	      .promise();	
	   log.info('folderID', user.Users[0].RootFolderId);	
	  return user;	
	};	
		
	const initUpload = async ({	
	  folderId,	
	  filename	
	}) => {	
	  try {	
	      log.info('initUpload');	
	      const contentType = 'application/octet-stream';	
	      const initResult = await workdocs	
	          .initiateDocumentVersionUpload({	
	              ParentFolderId: folderId,	
	              Name: filename,	
	              ContentType: contentType,	
	              ContentCreatedTimestamp: new Date(),	
	              ContentModifiedTimestamp: new Date(),	
	          })	
	          .promise();	
	      const documentId = initResult.Metadata.Id;	
	      const versionId = initResult.Metadata.LatestVersionMetadata.Id;	
	      const {	
	          UploadUrl,	
	          SignedHeaders	
	      } = initResult.UploadMetadata;	
	      log.info('initUpload complete');	
	      return {	
	          documentId,	
	          versionId,	
	          uploadUrl: UploadUrl,	
	          signedHeaders: SignedHeaders,	
	      };	
	  } catch (e) {	
	      log.info('failed initUpload', e);	
	      throw e;	
	  }	
	};	
		
	var readFileFromS3 = function ({	
	  s3Bucket,	
	  s3Key	
	}) {	
	  try {	
	      const params = {	
	          Bucket: s3Bucket,	
	          Key: s3Key	
	      };	
	      return s3.getObject(params).createReadStream();	
	  } catch (e) {	
	    log.error('Error:', e.stack);	
	  }	
	}	
		
	var streamToString = function (stream) {	
	  const chunks = [];	
	  return new Promise((resolve, reject) => {	
	      stream.on('data', (chunk) => chunks.push(chunk));	
	      stream.on('error', reject);	
	      stream.on('end', () => resolve(Buffer.concat(chunks)));	
	  });	
	}	
		
	const uploadFile = async ({	
	  filename,	
	  signedHeaders,	
	  uploadUrl	
	}) => {	
	  try {	
	      log.info('reading file stream');	
	      log.info('S3 Bucket:',srcBucket);	
	      log.info('S3 Key:', srckey);	
	      const contentsStream = readFileFromS3({	
	          s3Bucket: srcBucket,	
	          s3Key: srckey,	
	      });	
	      const result = await streamToString(contentsStream);	
	      log.info(result);	
	      const formData = new FormData();	
	      formData.append(filename, result);	
	      log.info('uploading to ', uploadUrl);	
	      const extendParams = {	
	          headers: signedHeaders,	
	      };	
	      const client = got.extend(extendParams);	
	      await client.put(uploadUrl, {	
	          body: formData,	
	      });	
	      log.info('upload complete');	
	  } catch (e) {	
	      log.error('failed uploadFile', e);	
	  }	
	};	
		
	const updateVersion = async ({	
	  documentId,	
	  versionId	
	}) => {	
	  try {	
	      await workdocs	
	          .updateDocumentVersion({	
	              DocumentId: documentId,	
	              VersionId: versionId,	
	              VersionStatus: 'ACTIVE',	
	          })	
	          .promise();	
	      log.info('document version updated');	
	  } catch (e) {	
	      log.error('failed updateVersion', e);	
	  }	
	};