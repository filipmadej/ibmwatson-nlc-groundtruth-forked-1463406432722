# ibmwatson-nlc-groundtruth

## Overview

The IBM Watson&trade; Natural Language Classifier Toolkit is a web application that you can use to manage the training data and classifiers for a classifier service instance. 

For more information about the Natural Language Classifier service, see the [Bluemix Catalog](https://console.ng.bluemix.net/catalog/natural-language-classifier/).


***

## Before you begin
Ensure that you have a Bluemix account. If you don't have one, [sign up](https://apps.admin.ibmcloud.com/manage/trial/bluemix.html?cm_mmc=WatsonDeveloperCloud-_-LandingSiteGetStarted-_-x-_-CreateAnAccountOnBluemixCLI). For more information about development on Bluemix, see [Developing Watson applications with Bluemix](http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/getting_started/gs-bluemix.shtml).
  

### Required Bluemix services
This application requires the following Bluemix services, which are created for you when you use the **Deploy to Bluemix** button: 

- Cloudant NoSQL DB
- Natural Language Classifier

If you have instances of those services that you do not need, delete them before you deploy the toolkit so that you're not charged for them.


***


## Clone, build and deploy the toolkit app

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy)

When you click the **Deploy to Bluemix** button, the following steps take place:

1. You are prompted to log in to Bluemix or to create an account.
2. A Bluemix DevOps Services project is created, and a Git repository is initialized.
3. The `ibmwatson-nlc-groundtruth` project is cloned into the Git repository.
4. Your copy of the application is built.
5. The Cloudant NoSQL DB service and Natural Language Classifier Bluemix services are created.
6. The toolkit application is deployed to Bluemix.

The entire process takes several minutes to complete, and the final step of deploying typically is the longest step. When the process completes, you'll see a confirmation message and a link to your running application. 

**Tip**: If you have instances of the Cloudant NoSQL DB or Natural Language Classifier Bluemix services that you created manually and do not need, delete them so that you're not charged for them.

Your new DevOps Services project is set up to deploy changes to Bluemix immediately when you commit new changes to your Git repository.


## Log in to the toolkit application

Log in to your toolkit app with the service credentials of the Natural Language Classifier that is bound to your toolkit app. Here's how to find the service credentials: 

1. [Log in to Bluemix](https://console.ng.bluemix.net/) and navigate to your new instance of the toolkit app.
2. Click **Show Credentials** for the Natural Language Classifier service that is bound to your toolkit app.
3. Copy the values of the `username` and `password` parameters.


## What to do next

- Read about the app and the Natural Language Classifier service in the [docs](http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/nl-classifier/tool_overview.shtml). 
- Review the [App gallery](http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/gallery.html) for Natural Language Classifier applications.


## Getting help and providing feedback

Submit comments or ask questions in the [Watson forum](https://developer.ibm.com/answers/smartspace/watson/). If [Stack Overflow](http://stackoverflow.com/questions/tagged/ibm-watson) is your preference, we're happy to chat there.


## Upgrading your app

When we update the application, fix bugs, and add features, you'll want to update along with us. You can update your instance of the toolkit app by using the **Deploy to Bluemix** button described earlier in this readme. 

**Important**: Make sure that you deploy the app to the same organization and Bluemix space as your earlier version. 

By using the **Deploy to Bluemix** button with the same organization and Bluemix space, your updated app gets a new URL and uses new login information but will continue to work with your existing data and classifiers. 

When you're happy with the new app, delete your original instance of the application from your Bluemix dashboard.

Congratulations and happy classifying.

