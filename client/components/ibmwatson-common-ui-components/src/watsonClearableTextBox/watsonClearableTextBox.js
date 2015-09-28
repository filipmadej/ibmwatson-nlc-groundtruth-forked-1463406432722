/**
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/


'use strict';

angular.module('ibmwatson-common-ui-components.watsonClearableTextBox',[]);

angular.module('ibmwatson-common-ui-components.watsonClearableTextBox')
  .directive('watsonClearableTextBox', function() {
    return {
      restrict: 'E',
      template: '<div class="ibm-clearable-textbox" tabindex="-1"><input type="text"></input><button type="button" class="close ibm-alert__close" aria-label="Close"><span class="ibm-icon--close-cancel-error" aria-hidden="true"></span></button></div>',
      require: 'ngModel',
      link: function(scope,element,attrs,ngModel){

        var formControlElement = element.find('input[type="text"]');

        var clearElement = element.find('button');

        // When the model changes, update the value of the textbox
        ngModel.$render = function(){
          formControlElement.val(ngModel.$viewValue);
        };

        // When the user updates the value in the box, update the model
        formControlElement.on('blue keyup change',function update(){
          var newValue = formControlElement.val();
          ngModel.$setViewValue(newValue);
        });

        // When the dom node for this directive gets focus
        // programmatically, send it to the input field
        element.focus(function onFocus(){
          formControlElement.focus();
        });

        // When the clear button is pressed, clear the text and value
        clearElement.on('click',function clear(){
          var newValue = '';

          formControlElement.val(newValue);
          
          ngModel.$setViewValue(newValue);

          // If a clear function has been specified
          // execute it
          if(attrs.watsonClear){
            scope.$eval(attrs.watsonClear);
          }

          // Finally, since our handler was initated outside of angular
          // update the scope
          scope.$apply();
        });

        // put list attribute onto input element
        if(attrs.list){
          formControlElement.attr('list',attrs.list);
        }
      },
      
      replace: true
    };
  });