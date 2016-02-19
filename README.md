# IBM Watson&trade; Natural Language Classifier Toolkit

## Overview

The IBM Watson&trade; Natural Language Classifier Toolkit is a web application that you can use to manage the training data and classifiers for a classifier service instance.

For more information about the Natural Language Classifier service, see the [Bluemix Catalog](https://console.ng.bluemix.net/catalog/natural-language-classifier/).

***

## UPDATE

There has been a major update to the tool. It is now a hosted application on Bluemix that does not require deploying from Jazz Hub. Please see the [full documentation](http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/nl-classifier/tool_overview.shtml) for instructions on how to access and use the tool. Support for the old tool will sunset on March 1st, 2016.

If you need to transfer data from an existing instance of the toolkit, please see below.

***

## Transitioning to the new tooling

When following the [instructions to access the new tooling](http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/nl-classifier/tool_overview.shtml), make sure that you use the same service instance of the Natural Language Classifier on Bluemix. This will automatically give you access to all of your existing classifiers.

In order to transition your current training data, follow these steps:
1. Open and log in to the old tooling.
2. Navigate to the training data page (with your classes and texts).
3. Click on the "Export" button in the navigation bar.
4. Open and log in to the new tooling.
5. Navigate to the training data page ("Training" link in the navigation bar).
6. Click on the upload button (first button to the right of "Create classifier").
7. Select the file you just exported from the old tool.
8. Done! You now have access to your classifiers and training data from the old tool.

Note: Some new features may not be available for old classifiers.

***


Congratulations and happy classifying.
