# IBM Watson&trade; Natural Language Classifier Toolkit - ChangeLog

## Beta 0.0.7 - Monday, November 16th, 2015

* Enabled training classifiers in Portuguese and Spanish in the training UI.

## Beta 0.0.6 - Thursday, October 29th, 2015

* Enabled bidirectional text support in training and testing.

## Beta 0.0.5 - Thursday, October 15th, 2015

* Improved support for multiple users
* Improved Redis implementation for multiple instance support
* Encrypted the session information within the server before sending to Redis

## Beta 0.0.4 - Tuesday, September 29th, 2015

* Fixed finding a Natural Language Classifier instance when the name doesn't match the expected value.
* Fixed the upload limit when trying to train a classifier and the error handling from the service.

## Beta 0.0.3 - Monday, September 21st, 2015

* Improved the alert service for notifying users when they are on an old or development version of the tool including a download link for the latest version.
* Updated and specified versions of dependencies that were incompatible.
* Fixed bug in adding classes to text.

## Beta 0.0.2 - Friday, September 11th, 2015

* Improved overall system performance and stability by moving more features to the backend - including much of the data import and export functionality.
* Added an IBM Bluemix DevOps Services Build & Deploy pipeline to the repository which allows anyone to run a full build using the "Deploy to Bluemix" button. This change also makes it easier for other developers to modify and contribute to the project, but deployments will be a little slower.
* Reduced the number of API calls being made to the server to check on classifier training status.
* Added the ability to import multiple files at the same time from the UI.
* Refined the UI and corrected a variety of minor glitches in the user interface.

## Beta 0.0.1 - Friday, August 21st, 2015

* Initial beta release
