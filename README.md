# ibmwatson-nlc-groundtruth

## Overview

This toolkit is a web application that can be used to configure an IBM Watson Natural Language Classifier service instance. For more information, see the [Bluemix Catalog](https://console.ng.bluemix.net/catalog/natural-language-classifier/).

## Prerequisite Services

To work, this application requires the following Bluemix services
- Cloudant
- Natural Language Classifier

***

## Before you begin
Ensure that you have an IBM Bluemix account. If you don't have one, [sign up](https://apps.admin.ibmcloud.com/manage/trial/bluemix.html?cm_mmc=WatsonDeveloperCloud-_-LandingSiteGetStarted-_-x-_-CreateAnAccountOnBluemixCLI). For more information about development on Bluemix, see [Developing Watson applications with Bluemix](http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/getting_started/gs-bluemix.shtml).
  
***

## Give it a Try!

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://hub.jazz.net/git/wdctools/ibmwatson-nlc-groundtruth)

When you click this button, the application will

1. Prompt you to log in to Bluemix, or to create an account
2. Create a Bluemix DevOps Services project and initialize a new Git repository
3. Clone the ibmwatson-nlc-groundtruth project into the Git repository
4. Build your copy of the application
5. Create the required Bluemix services
6. Deploy the application to Bluemix

Your new DevOps Services project will be set up to automatically deploy changes to Bluemix when you commit new changes to your Git repository.

The entire process will take several minutes to complete. The final deploying step typically takes the longest. When it completes, you'll see a confirmation message and link to the running application. 

## Using the App

The first thing that you'll need is the username and password required to access your application. For the beta release these are the same as the credentials of the Natural Language Classifier Service bound to your instance of the application. You can find these credentials with these three easy steps:

1. Log in to Bluemix and navigate to your new instance of the application.
2. Click "Show Credentials" for the Natural Language Classifier service that is bound to your application.
3. The username and password for the application are shown in the `credentials` section.

For information on using the app to customize the Natural Language Classifier see [documentation link]. You can bring your own data or check out sample Natural Language Classifier applications and data at our [App Gallery](http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/gallery.html).

## Getting Help and Providing Feedback

If you have questions, would like to report a problem, or otherwise provide feedback, please visit us in the [Watson Space at dW Answers](https://developer.ibm.com/answers/smartspace/watson/). If [Stack Overflow](http://stackoverflow.com/questions/tagged/ibm-watson) is your preference, we'd be glad to chat there too.

## Upgrading your App

We will be updating the application, fixing bugs, adding capability, and responding to your feedback. You can upgrade your personal instance of the application by using the Deploy to Bluemix button above. You'll need to make sure that you deploy to the same organization and Bluemix space. After the deployment is successful you'll have a new URL, username, and password, but you'll have access to your existing data and classifiers. You can go into your Bluemix dashboard and delete your original instance of the application.

Congratulations and happy classifying!

