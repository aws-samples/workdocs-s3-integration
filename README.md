## Automate Deployment of Lambda Function
Purpose
Automate the integration of Amazon S3 bucket and Amazon WorkDocs with the s3 trigger defined by the user.

Dependencies
- AWS SAM CLI
- AWS Credentials in Environment
- Set up Workdocs Application and get the WorkDocs Organization ID and name of the existing WorkDocs user using the below link : https://docs.aws.amazon.com/workdocs/latest/developerguide/wd-auth-user.html

TL;DR
This will create the following AWS infrastructure
- S3TriggerBucket
- Lambda Function and Role
- Lambda Permission

Automating integration of S3 and WorkDocs

1. Prerequisites/Assumptions
   Assumption : A WorkDocs Application is already set up as mentioned in the below link: https://docs.aws.amazon.com/workdocs/latest/developerguide/wd-auth-user.html

2. The code requires that you obtain an Amazon WorkDocs Organization ID.You can get a Amazon WorkDocs organization ID from the AWS console using the following steps:To get an organization ID

- In the [Link AWS Directory Service console](Link https://console.aws.amazon.com/directoryservicev2/) navigation pane, select Directories.
- The Directory ID corresponding to your Amazon WorkDocs site is the Organization ID for that site.
- Copy the Organization ID and Description and paste it in the ID and Query for the Parameter section in template.yaml

3. Steps to set up the Automation
   a. Build lambda function, and prepare them for subsequent steps in the workflow

Command: sam build -b ./build -s . -t template.yaml -u
b. Packages the above LambdaFunction. It creates a ZIP file of the code and dependencies, and uploads it to Amazon S3 (please create the S3 bucket and mention the bucket name in the command below). It then returns a copy of AWS SAM template, replacing references to local artifacts with the Amazon S3 location where the command uploaded the artifacts

Command: sam package \
 --template-file build/template.yaml \
 --s3-bucket ${YOUR_S3_SAM_BUCKET} \
 --output-template-file build/packaged.yaml
c. Deploy Lambda functions through AWS CloudFormation from the S3 bucket created above. AWS SAM CLI now creates and manages this Amazon S3 bucket for you.

Command: sam deploy \
 --template-file build/packaged.yaml \
 --stack-name S3-WorkDocs \
 --capabilities CAPABILITY_NAMED_IAM \
 --parameter-overrides S3TriggerBucketName=${YOUR_NEW_STATIC_SITE_BUCKET_NAME}

4. Steps to Check the Integration
   Put a Object in the S3TriggerBucket and the corresponding object should be available in the WorkDocs folder path.

Security
See CONTRIBUTING for more information.

License
This library is licensed under the MIT-0 License. See the LICENSE file.

Contributors
Matt Noyce
Viyoma Sachdeva
