# Using your own service with the toolkit
When you deploy the Natural Language Classifier toolkit, an instance of the Natural Language Classifier service is created. To use an existing instance of the service with the toolkit, follow these instructions.

You can use either the web method or CLI method.
***

## Bluemix web interface method
Follow this method if you already deployed the toolkit with the [**Deploy to Bluemix**][d2b] process and want to change the Natural Language Classifier that the toolkit uses.

### Before you begin

The toolkit cannot display training data that you used to create classifiers in another service. To reuse that training data in the toolkit, log in to your existing toolkit and **export** your data.

### Stage 1: Unbind or delete the existing service
1. Log in to [Bluemix](https://console.ng.bluemix.net).
2. Go to your **Dashboard**, and then click your instance of the toolkit app.
3. Click **Menu** (the gear icon) in the upper-right corner of the Natural Language Classifier service.
4. Select either **Unbind Service** or **Delete Service**. 
    * If you have other apps or classifiers that use this Natural Language Classifier service, unbind the service. 
    * If you no longer need this instance of the service, you can delete it.
5. When the **Restage Application** window is displayed, click **Cancel**.

### Stage 2: Bind another service to the toolkit
1. Click **Bind a Service or API**.
2. Select the instance of the Natural Language Classifier service that you want to use with the toolkit and click **Add**.
3. Click **Cancel** in the **Restage Application** window.
4. Update the environment variables:
    1. If the name of your Natural Language Classifier service is not `ibmwatson-nlc-classifier`, click **Environment Variables**. 
    2. Select the **User-Defined** tab.
    3. Change the value of `CLASSIFIER_SERVICE_NAME` from `ibmwatson-nlc-classifier` to the name of the Classifier service instance that you selected and click **Save**.

Bluemix restarts the toolkit application. When your application is restaged, you can log in to the toolkit with the service credentials of the service you just bound to the toolkit. 

For more information about finding the service credentials, see [the readme][d2b] file for the toolkit. Search for "Log in to the toolkit application".

### What to do next
**Import your training data**: If you exported existing training data in the earlier step, you can import the data to the toolkit. 


## Command-line interface method
Follow this method if you did not deploy the Natural Language Classifier toolkit.

With this method, you use the Cloud-foundry CLI tool to deploy an instance of the toolkit that is bound to an existing classifier instance.

### Before you begin

[Download][cloud_foundry] and install the Cloud-foundry CLI tool.

### Steps
1. Clone the code repository and navigate to the local directory by issuing the following commands:
    
    ```sh
    $ git clone https://hub.jazz.net/git/wdctools/ibmwatson-nlc-groundtruth
    $ cd ibmwatson-nlc-groundtruth
    ```
      
2. Ensure that you're deploying the app into the appropriate space:
    1. Verify the output of the `cf target` command. 
    
        ```sh
        $ cf target

        API endpoint:   https://api.ng.bluemix.net (API version: 2.27.0)   
        User:           {Bluemix username}
        Org:            {org@domain.com}
        Space:          dev          <-- Check that the space is correct
        ```
    
    2. Change any incorrect information by using the following command. Replace `{org@domain.com}` and `{spacename}` with your information: 
    
        ```sh
        cf target -o {org@domain.com} -s {spacename}.
        ```

3. List the services in your org and space: 

    ```sh
    $ cf services
    ```
    
    The output includes the name of the service that you want to bind to your toolkit app.
    
3. If you don't have the `cloudantNoSQLDB` service, create it: 

    ```sh
    $ cf create-service cloudantNoSQLDB Shared ibmwatson-nlc-cloudant
    
    Creating service instance ibmwatson-nlc-cloudant in org {org} / space {space} as {username}...
    OK
    ```

4. Edit the `manifest.yml` application manifest in your clone. Search for information that looks like the following:

    ```
    applications:
    - services:
      - ibmwatson-nlc-cloudant
      - ibmwatson-nlc-classifier
      name: my-classifier-toolkit-app
      ...
      host: my-classifier-toolkit-app
    ```
    
    1. Change the `ibmwatson-nlc-classifier` service to the name of your Natural Language Classifier service instance.
    2. Change the values for the `name` and `host` fields to something unique.. Typically, you want these fields to have the same value. The name is the name of your service on Bluemix. The host is part of the application URL.
    In this example, you access your app at https://my-classifier-toolkit-app.mybluemix.net/
 
5. Push the application to Bluemix using the following command:

     ```sh
     $ cf push {app_name} 
     ```
 
    where `{app_name}` is the name of your application.
    
    When your application is pushed, you can log in to the toolkit with the service credentials of the service you bound to the toolkit. 
 
6. Get the service credentials by issuing the following command. Replace `{name of toolkit}` with your app name.:

     ```sh
     $ cf env {name of toolkit} | grep '"natural_language_classifier":' -A10 | grep "username\|password"
     ```
         
The output shows the username and password that you use to log in to the toolkit.

Bluemix restarts the toolkit application. When your application is restaged, 



### What to do next
**Import your training data**: If you exported existing training data in the earlier step, you can import the data to the toolkit. 

 
[d2b]: https://hub.jazz.net/project/wdctools/ibmwatson-nlc-groundtruth/overview
[cloud_foundry]: https://github.com/cloudfoundry/cli/releases

[commandlinetools]: https://www.ng.bluemix.net/docs/#starters/install_cli.html
