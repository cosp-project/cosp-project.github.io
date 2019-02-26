// Global animation time (ms)
var mAtime = 500;

// Miscelaneous global variables initialization
var debug = false; var mStorExpirationTime = 1; // (hours)

// Build list server URL
var mBuildListURL = 'https://ota.cosp-project.org';

// Device list server url
var mDeviceListURL = 'https://mirror.codebucket.de/cosp/getdevices.php';

/* Check if HTML5 blob storage is available.

   As seen here: https://stackoverflow.com/questions/16427636/check-if-localstorage-is-available */
if (typeof(Storage) !== 'undefined')
{
  try
  {
    localStorage.setItem('check_availability', 'available');
    if (localStorage.getItem('check_availability') === 'available')
    {
      logi('HML5 blob storage support detected.');
      // Just a temporary workaround.
      localStorage.clear();
      var mHasHTML5Stor = true;
    }
  } catch (e) {
    logw('HML5 blob storage support is missing or broken.\nThe error that\'s shown below was caught while testing the feature.\n\n' + e);
    var mHasHTML5Stor = false;
  }
}
else
{
  logw('HML5 blob storage support is missing or broken.');
  var mHasHTML5Stor = false;
}

// Display debugging info in console (only if enabled)
function logi(info) { if (debug) { console.log(info); } }
function loge(info) { if (debug) { console.error(info); } }
function logw(info) { if (debug) { console.warn(info); } }

// Build HTML selectors
function select(options)
{
  return '<div class="input-field" id="device-list"><select name="devices" id="devices">' + options + '</select><label>Devices</label></div>';
}
function option(value, html)
{
  return '<option value="' + value + '">' + html + '</option>';
}

// Build HTML tables
function table(data)
{
  return '<table id="builds">' + data + '</table>';
}
function th(data)
{
  return '<th>' + data + '</th>';
}
function td(data)
{
  return '<td>' + data + '</td>';
}
function tr(data)
{
  return '</tr>' + data + '</tr>';
}

// Build a loading circle
function loading()
{
  return '<div class="preloader-wrapper big active"><div class="spinner-layer spinner-blue-only"><div class="circle-clipper left"><div class="circle"></div></div><div class="gap-patch"><div class="circle"></div></div><div class="circle-clipper right"><div class="circle"></div></div></div></div>';
}

// Build a more elegant date format off a YYMMdd string.
function getDate(datestr)
{
  // Build an array in the original order: YY-MM-dd.
  cnt = 0; parsed = [ '', '', '' ];
  for (i = 0; i < datestr.length; i++)
  {
    if (i > 3)
    {
      parsed[2] += datestr[i];
    }
    else
    {
      if (i > 1)
      {
        parsed[1] += datestr[i];
      }
      else
      {
        parsed[0] += datestr[i];
      }
    }
  }
  return parsed;
}

// Build the table for the selected entry available
function update()
{
  DeviceCodename = $('#devices option:selected').val();
  if ($('#builds').length || $('.err').length)
  {
    $('#builds').remove(); $('.err').remove();
  }
  if (mHasHTML5Stor)
  {
    if ((localStorage.getItem(DeviceCodename + '_basic') === null && localStorage.getItem(DeviceCodename + '_advanced') === null && localStorage.getItem(DeviceCodename + '_failure') === null) || (localStorage.getItem('global_expiration') === null || (getTime() > localStorage.getItem('global_expiration'))))
    {
      StorExpirationTime = (mStorExpirationTime * 3600000);
      logi('The cached data will expire in ' + mStorExpirationTime + ' hour(s) (or ' + StorExpirationTime + ' ms).');
      StorExpirationTime += getTime();
      localStorage.setItem('global_expiration', StorExpirationTime);
      // Request the latest download.
      reqURL = mBuildListURL + '/latestDownload';
      logi('Ajax: Retrieving "' + reqURL + '"...');
      $.ajax({ type: 'GET', url: reqURL, data: { device: DeviceCodename }, dataType: 'json' })
      .done(function(basic_json_object) {
        logi('Ajax: success!');
        logi('Saving the basic build information for ' + DeviceCodename + ' as a web storage item "' + DeviceCodename + '_basic"...');
        localStorage.setItem(DeviceCodename + '_basic', JSON.stringify(basic_json_object));
        // Request more details about the build.
        reqURL = mBuildListURL + '/checkUpdate';
        logi('Ajax: Retrieving "' + reqURL + '"...');
        $.ajax({ type: 'GET', url: reqURL, data: { device: DeviceCodename, date: basic_json_object.date }, dataType: 'json' })
        .done(function(advanced_json_object) {
          logi('Ajax: success!');
          logi('Saving the advanced build information for ' + DeviceCodename + ' as a web storage item "' + DeviceCodename + '_advanced"...');
          localStorage.setItem(DeviceCodename + '_advanced', JSON.stringify(advanced_json_object));
          $('.info').remove();
          // Reuse date as MMddYY.
          DeviceBuildData = [ basic_json_object.date, advanced_json_object.changeLog, basic_json_object.download ];
          rendertable(DeviceBuildData);
         })
        .fail(function (response) {
          if (response.responseText == 'error')
          {
            loge('Ajax: the API reported an error.'); $('.info').remove(); $('#devices').append('<p class="info">No builds found.</p>');
          }
        });
      })
      .fail(function (response) {
        if (response.responseText == 'error')
        {
          localStorage.setItem(DeviceCodename + '_failure', response.responseText);
          loge('Ajax: the API reported an error.'); $('.info').remove(); $('#devices').append('<p class="info">No builds found.</p>');
        }
        else
        {
          if (typeof(response.responseText) != 'string')
          {
            loge('Ajax: the API reported an error, the "responseText" property of "response" isn\'t a string. Is the server down? No internet connection?'); $('.info').remove(); $('#devices').append('<p class="err">Couldn\'t reach server.</p>');
          }
        }
      });
    }
    else
    {
      $('.info').remove();
      logi('Web storage entries have been found for the selected device "' + DeviceCodename + '".');
      logi('Found: ');
      logi(' - ' + localStorage.getItem(DeviceCodename + '_basic') === null ? '' : DeviceCodename + '_basic: ' + localStorage.getItem(DeviceCodename + '_basic'));
      logi(' - ' + localStorage.getItem(DeviceCodename + '_advanced') === null ? '' :  DeviceCodename + '_advanced: ' + localStorage.getItem(DeviceCodename + '_advanced'));
      logi(' - ' + localStorage.getItem(DeviceCodename + '_failure') === null ? '' : DeviceCodename + '_failure: ' + localStorage.getItem(DeviceCodename + '_failure'));
      if (localStorage.getItem(DeviceCodename + '_failure') === 'error')
      {
       $('#devices').append('<p class="info">No builds found.</p>');
      }
      else
      {
       DeviceBuildData = [ JSON.parse(localStorage.getItem(DeviceCodename + '_basic')).date, JSON.parse(localStorage.getItem(DeviceCodename + '_advanced')).changeLog, JSON.parse(localStorage.getItem(DeviceCodename + '_basic')).download ];
       rendertable(DeviceBuildData);
      }
      StorExpirationTimeRem = ((localStorage.getItem('global_expiration') - getTime()) / 1000).toFixed(2);
      logi(StorExpirationTimeRem + ' seconds remaining before refreshing the cache.');
    }
  }
  else
  {
    // Request the latest download.
    reqURL = mBuildListURL + '/latestDownload';
    logi('Ajax: Retrieving "' + reqURL + '"...');
    $.ajax({ type: 'GET', url: reqURL, data: { device: DeviceCodename }, dataType: 'json' })
    .done(function(basic_json_object) {
      logi('Ajax: success!');
      logi('Saving the basic build information for ' + DeviceCodename + ' as a web storage item "' + DeviceCodename + '_basic"...');
      // Request more details about the build.
      reqURL = mBuildListURL + '/checkUpdate';
      logi('Ajax: Retrieving "' + reqURL + '"...');
      $.ajax({ type: 'GET', url: reqURL, data: { device: DeviceCodename, date: basic_json_object.date }, dataType: 'json' })
      .done(function(advanced_json_object) {
        logi('Ajax: success!');
        logi('Saving the advanced build information for ' + DeviceCodename + ' as a web storage item "' + DeviceCodename + '_advanced"...');
        $('.info').remove();
        // Reuse date as MMddYY.
        DeviceBuildData = [ basic_json_object.date, advanced_json_object.changeLog, basic_json_object.download ];
        rendertable(DeviceBuildData);
       })
      .fail(function (response) {
        if (response.responseText == 'error')
        {
          loge('Ajax: the API reported an error.'); $('.info').remove(); $('#devices').append('<p class="info">No builds found.</p>');
        }
      });
    })
    .fail(function (response) {
      if (response.responseText == 'error')
      {
        loge('Ajax: the API reported an error.'); $('.info').remove(); $('#devices').append('<p class="info">No builds found.</p>');
      }
      else
      {
        if (typeof(response.responseText) != 'string')
        {
          loge('Ajax: the API reported an error, the "responseText" property of "response" isn\'t a string. Is the server down? No internet connection?'); $('.info').remove(); $('#devices').append('<p class="err">Couldn\'t reach server.</p>');
        }
      }
    });
  }
}

function rendertable(DeviceBuildList)
{
  ReleaseDate = getDate(String(DeviceBuildList[0])); ReleaseDate = ReleaseDate[1] + '/' + ReleaseDate[2] + '/' + ReleaseDate[0];
  if (DeviceBuildList[2] === '')
  {
    logw('Unable to retrieve the download URL while parsing the response.');
    DownloadURL = '<span class="err">Unable to retrieve download URL.</span>';
  }
  else
  {
    DownloadURL = '<a class="blue-grey-text" href="' + DeviceBuildList[2] + '">' + DeviceBuildList[2] + '</a>';
  }
  //                                                                                                                 \/ Replace newlines for <br>
  DeviceBuildTable =  tr(th('Release date'))  + tr(td(ReleaseDate)) + tr(th('Changelog')) + tr(td(DeviceBuildList[1]).replace(/\n/g, '<br>')) + tr(th('Download')) + tr(td(DownloadURL)) + '</tbody>';
  $('#device-list').append(table(DeviceBuildTable));
}

function showdevices(DeviceList)
{
  $('.preloader-wrapper').fadeOut(mAtime);
  setTimeout(function(){
    $('.preloader-wrapper').remove();
  }, mAtime);
  DevicePicker = '';
  for (i = 0; i < DeviceList.length; i++)
  {
   DevicePicker = DevicePicker + option(DeviceList[i], DeviceList[i]);
  }
  setTimeout(function()
  {
   $('#devices').append(select(DevicePicker));
   $('select').formSelect();
   $('#devices').hide();
   $('#devices').fadeIn(mAtime);
   update();
  }, mAtime);
}

// Start the Ajax request and run the functions, build the available device list.
if (mHasHTML5Stor)
{
  if (localStorage.getItem('mDeviceList') === null)
  {
    reqURL = mDeviceListURL;
    logi('Ajax: Retrieving "' + reqURL + '"...');
    $.ajax({ type: 'GET', url: reqURL, dataType: 'json' })
    .done(function (json_array)
    {
      logi('Ajax: success!');
      mDeviceList = json_array;
      showdevices(mDeviceList);
      logi('Saving mDeviceList as a web storage item "mDeviceList"...');
      localStorage.setItem('mDeviceList', JSON.stringify(mDeviceList));
    })
    .fail(function() { loge('Ajax: the API reported an error.'); $('#devices').append('<p class="err">Unable to retrieve device list.</p>'); }
    );
  }
  else
  {
    logi('A web storage copy of "mDeviceList" has been found, using it instead of retrieving from remote.');
    showdevices(JSON.parse(localStorage.mDeviceList));
  }
}
else
{
  reqURL = mDeviceListURL;
  logi('Ajax: Retrieving "' + reqURL + '"...');
  $.ajax({ type: 'GET', url: reqURL, dataType: 'json' })
  .always(function() { $('.preloader-wrapper').fadeOut(mAtime); setTimeout(function() { $('.preloader-wrapper').remove() }, mAtime); })
  .done(function (json_array) { logi('Ajax: success!'); mDeviceList = json_array; showdevices(mDeviceList); } )
  .fail(function() { loge('Ajax: the API reported an error.'); $('#devices').append('<p class="err">Unable to retrieve device list.</p>'); }
  );
}

$(document).ready(function()
{
  $('#devices').append(loading());
  $('#devices').on('change', function() {
    update();
  });
  if (!debug) { console.log('Hello there! It might be easier to contribute if you enable the debugging code. To do so, simply type as follows: \n\ndebug = true;\n\nThen, all the following actions will have an increased console verbosity.\n\nFeel free to clear the cache with the following code:\n\nlocalStorage.clear();') }
});
