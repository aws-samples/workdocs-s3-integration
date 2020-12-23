var AWS = require('aws-sdk-mock');
var chai = require('chai');
var expect = chai.expect;

AWS.mock("WorkDocs", "initiateDocumentVersionUpload", { 'Metadata': { 'Id': 'testId', 'LatestVersionMetadata': { 'Id': 'testId1' } }, 'UploadMetadata': [{ 'UploadUrl': 'testId' }, { 'SignedHeaders': 'test' }] });
AWS.mock("WorkDocs", "describeUsers", { "key": "value" })
AWS.mock("S3", "getObject", Buffer.from(require("fs").readFileSync("testFile.csv")));
const index = require('../src/js/index-new');
const Log = require('../src/js/log');

event = {
    "Records": [
        {
            "eventVersion": "2.0",
            "eventTime": "1970-01-01T00:00:00.000Z",
            "requestParameters": {
                "sourceIPAddress": "127.0.0.1"
            },
            "s3": {
                "configurationId": "testConfigRule",
                "object": {
                    "eTag": "0123456789abcdef0123456789abcdef",
                    "sequencer": "0A1B2C3D4E5F678901",
                    "key": "HappyFace.jpg",
                    "size": 1024
                },
                "bucket": {
                    "arn": "arn:aws:s3:::mybucket",
                    "name": "sourcebucket",
                    "ownerIdentity": {
                        "principalId": "EXAMPLE"
                    }
                },
                "s3SchemaVersion": "1.0"
            },
            "responseElements": {
                "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH",
                "x-amz-request-id": "EXAMPLE123456789"
            },
            "awsRegion": "us-east-1",
            "eventName": "ObjectCreated:Put",
            "userIdentity": {
                "principalId": "EXAMPLE"
            },
            "eventSource": "aws:s3"
        }
    ]
}
const assert = require('assert');
const { request } = require('http');
describe('Gets content from S3 file', () => {
    it('should return the the contents of the file', () => {
        var response = index.readFileFromS3(
            'test-bucket',
            'test-key'
        );
        console.log('response',response);
        expect(response).to.be.an.instanceof(Object);
        AWS.restore('S3');
        console.log('response', response);
    })
})
describe('Gets content from Workdocs file', () => {
    it('should return the the contents of the file', () => {
        var response = index.initUpload({
            folderId: 'test',
            filename: 'test-key',
            event: event,
            context: ""
        });
        expect(response).to.be.an.instanceof(Object);
        AWS.restore('WorkDocs');
        console.log('response', response);
    })
})
describe('Addition', () => {
    it('Addition', () => {
        assert.equal(1 + 1, 2);
    })
})