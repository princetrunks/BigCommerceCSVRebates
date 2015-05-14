/*
   -Uses jquery-CSV (https://code.google.com/p/jquery-csv/ ) 
   to automatically post & schedule stackable Mail-in Rebates / notifications for BigCommerce products.
   
   -Incomplete capability for Instant Rebates / discounts 
   
   -Includes coding for hiding Free Shipping on service products & renaming of "You Save" to "Instant Savings" or Mail-In Rebates
   
   -Tested on Panels/ProductDetails.html pages
   
   -Test Rebate Files (CSV and XLS) provided
   
   -By Chuck Gaffney: Free to use and build upon / update
*/

//custom function; used to add a custom string as part of an object's dot notation 
     function getDescendantProp(obj, desc) 
    {
      var arr = desc.split(".");
      while(arr.length && (obj = obj[arr.shift()]));
      return obj;
    }
    
    //returns true if there's data in the current rebate field 
    function isRebateAvailable(startDateArray,endDateArray,index) 
    {
       return ((startDateArray[index] != null) && (endDateArray[index] != null));
    }
    
    //function iterates through current or rebate amounts.  
      //returns a rebate amount
    function getRebateAmount(array,i, j )
    {
        var amt = getDescendantProp(array[i], "RebateAmount"+ j);
        /* Allows to set one rebate amount for multiple future rebate date ranges
                 if ( (amt == '') && (j >= 0) )
        {
          //use keep prior rebate amount going if the case
          j--;
          console.log("AMT: " + amt);
          amt = getRebateAmount(array, i, j);
        }
                */
        return amt;        
    }
    
     function displayRebateInfo(endDate, rebateObjectArray, index)
    {
            
       //formats the endDate to mm/dd/yy
       var formattedEndDate = (endDate.getMonth()+ 1) + '/' + endDate.getDate() + '/' + endDate.getFullYear();
            
       //get the rebate amount
       //var rebateAmt = rebateObjectArray[index].RebateAmount;
        //var rebateAmt = getDescendantProp(rebateObjectArray[index], "RebateAmount"+ index);
         var rebateAmt = getRebateAmount(rebateObjectArray, index, index);
               //console.log("Rebate Amount After: " +rebateAmt);
            
            //exit rebate loop if no rebate amount found or is not a number
            if ( (rebateAmt == null) || (!$.isNumeric( rebateAmt )) )
            {
                console.log("RebateAmount error");
                return;
            }
            
            //checks if an Instant Rebate
            var rebateTypeText;
            if(rebateObjectArray[index].isInstantRebate != '') 
            {
                  console.log("isInstantRebate Field: " + rebateObjectArray[index].isInstantRebate);
                  console.log("REBATE Is Instant");
                rebateTypeText = " Instant Rebate  ";
            }
            else
            {
              rebateTypeText = " Mail-In Rebate  ";
            }
            
              //set rebate notification text and fade it in
              var rebateText = "$" + rebateAmt + rebateTypeText + "\n(Valid until: " + formattedEndDate + ")" ;
               $('.MailInRebate').text(rebateText);
               $('.MailInRebate').delay(450).fadeIn(1100);
                  console.log("INDEX: " + index);
     
    }

     function moveToNextRebate(rebateStartDates,rebateEndDates,rebateIndex)
     {
        //check if next rebate index isn't null; if null, end entire loop
                if(isRebateAvailable(rebateStartDates,rebateEndDates,rebateIndex)) 
                {
                  var now = new Date(jQuery.now());
                
                  //sets the next date variables to product's Dates
                  startDate = new Date(rebateStartDates[rebateIndex]);
                  endDate   = new Date(rebateEndDates[rebateIndex]);
                   console.log("startDate: " + startDate);
                   console.log("endDate: " + endDate);
                   
                    if ((startDate <= now) && (endDate >= now)) 
                       { 
                     //next valid rebate found, display rebate
                      displayRebateInfo(endDate,rebateObjects, foundIndex);
               }
                 //recursively iterate through posted rebate dates until end of list
                 else
                         {
                           //increment index
                           rebateIndex++;
                               console.log("jumped to next rebate");
                           moveToNextRebate(rebateStartDates,rebateEndDates,rebateIndex);
 
                         }
                  
                }
                else
                {
                 console.log("No more valid rebates");
                 return;
                }
     }
    

    $(document).ready(function(){

    //=======Reads Rebate CSV file, checks if product has a rebate and displays rebate data======

    //Current Product Sku
    var currentSKU =  $('.product%%GLOBAL_ProductId%%SKU').text();
    //removes blank spaces
    currentSKU = $.trim(currentSKU);
    
       //console.log("Current SKU: " + currentSKU);
     
    //Dates
    var currentDate = new Date(jQuery.now());
    var startDate;
    var endDate;

    //Reads the file
    $.get( "%%GLOBAL_ShopPath%%/template/rebateFiles/testRebates.csv", function(data){
           //console.log(data);
         
         //global variable
         window.rebateObjects=$.csv.toObjects(data);
           //console.log(rebateObjects);
        
        //rebate main loop
        $.each( rebateObjects, function( i, val ) {

        //checks if current product is in the rebate file
        if (rebateObjects[i].ProductSKU == currentSKU) 
        {

            console.log("PRODUCT HAS A REBATE");
            console.log("Found At Index: " + i);
            
            window.foundIndex = i;

            var r = rebateObjects[i];
            var rebateStartDateInfo;
            var rebateEndDateInfo;

            var rebateIndex = 0;
            var maxRebates = 10;
 
            //stores arrays of available rebate startDates and end dates
            var rebateStartDates = [];
            var rebateEndDates   = [];
            
            
            //populate arrays with all rebates entered for this item 
            for (j = 0; j < maxRebates ;j++) 
            { 
               rebateStartDateInfo = getDescendantProp(r, "RebateStart"+ j);
               rebateEndDateInfo   = getDescendantProp(r, "RebateEnd"+ j);
               
               //break out of loop if any of the caught rebate start/end dates are null
               if ((rebateStartDateInfo == null) || (rebateEndDateInfo == null)){ break;}
               
               //otherwise, populate the arrays;
               else
                {
                   //console.log(rebateStartDateInfo);
                   //console.log(rebateEndDateInfo);
                   rebateStartDates.push(rebateStartDateInfo);
                   rebateEndDates.push(rebateEndDateInfo);
                }       
            }  //end of for loop
   
              console.log("List of StartDates: " + rebateStartDates);
              console.log("List of EndDates: " + rebateEndDates);
            
          //recursive function that iterates through each available set of rebate dates
          moveToNextRebate(rebateStartDates,rebateEndDates,rebateIndex);
      
         }  // end of SKU match if-else 
        

        });  // end of .each loop

        console.log("Current Date: " + currentDate);
   
    });     // end of get block

    //===========================================================================================
    
    //=============puts "was" before old price, if there's a rebated price present===============
    // puts "was" before old price, if there's a rebated price present

    var rebateSectionText = $('.YouSave').text();

    if (rebateSectionText != ''){

      $( ".DetailRow.RetailPrice" ).prepend( "was " );

     //console.log(rebateSectionText);
       
    //delay the "was price" appearance
     $('.DetailRow.RetailPrice').delay(900).fadeIn(1200);
    
    //replaces the "You Save" to "Instant Rebate of "
    var rebateText = $('.YouSave').text();
    var rebate = rebateText.split(' ');
    var rebateSplit = rebate[3].split(')');
   
    $( ".YouSave" ).text("(" + rebateSplit[0] + " Instant Savings)")
   }

    //==================================================================
    
    //=============replaces shipping price if a class===================
        var myLink = $('.Breadcrumb li a').text();
        var cat = myLink.split(' ');
        var rootCat = cat[0];
        rootCat = rootCat.toLowerCase();
     // console.log('Root Category: ' + rootCat);
        
        if (rootCat == 'homeclasses')
        {
            $('.product%%GLOBAL_ProductId%%SHIPPING').text('N/A');
            //console.log('HIT');
        }

     //==================================================================

        
    });