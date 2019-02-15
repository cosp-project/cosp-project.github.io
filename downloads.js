// Global animation time (ms)
var atime = 500;

// Miscelaneous global variables initialization
var startup = true; var mDeviceList = null; var debug = false;

// Build list server URL
var mBuildListURL = 'https://cosp-webserver.herokuapp.com';

// Device list server url
var mDeviceListURL = 'https://mirror.codebucket.de/cosp/getdevices.php';

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
  if ($('#builds').length || $('.err').length)
  {
    $('#builds').remove(); $('.err').remove();
  }
  // Request the latest download.
  reqURL = mBuildListURL + '/latestDownload';
  logi('Ajax: Retrieving "' + reqURL + '"...');
  $.ajax({ type: 'GET', url: reqURL, data: { device: $('#devices option:selected').text() }, dataType: 'json' })
  .done(function(basic_json_object) { logi('Ajax: success!');
    // Request more details about the build.
    reqURL = mBuildListURL + '/checkUpdate';
    logi('Ajax: Retrieving "' + reqURL + '"...');
    $.ajax({ type: 'GET', url: reqURL, data: { device: $('#devices option:selected').text(), date: basic_json_object.date }, dataType: 'json' })
    .done(function(advanced_json_object) {
      logi('Ajax: success!'); $('.info').remove();
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
    DownloadURL = '<a href="' + DeviceBuildList[2] + '">' + DeviceBuildList[2] + '</a>';
  }
  //                                                                                                                 \/ Replace newlines for <br>
  DeviceBuildTable =  tr(th('Release date'))  + tr(td(ReleaseDate)) + tr(th('Changelog')) + tr(td(DeviceBuildList[1]).replace(/\n/g, '<br>')) + tr(th('Download')) + tr(td(DownloadURL)) + '</tbody>';
  $('#device-list').append(table(DeviceBuildTable));
}

function showdevices()
{
  DevicePicker = '';
  for (i = 0; i < mDeviceList.length; i++)
  {
   DevicePicker = DevicePicker + option(mDeviceList[i], mDeviceList[i]);
  }
  setTimeout(function()
  {
   $('#devices').append(select(DevicePicker));
   $('select').formSelect();
   $('#devices').hide();
   $('#devices').fadeIn(atime);
   update();
  }, atime);
}

// Start the Ajax request and run the functions, build the available device list.
reqURL = mDeviceListURL;
logi('Ajax: Retrieving "' + reqURL + '"...');
$.ajax({ type: 'GET', url: reqURL, dataType: 'json' })
.always(function() { $('.preloader-wrapper').fadeOut(atime); setTimeout(function() { $('.preloader-wrapper').remove() }, atime); })
.done(function (json_array) { logi('Ajax: success!'); mDeviceList = json_array; showdevices(); } )
.fail(function() { loge('Ajax: the API reported an error.'); $('#devices').append('<p class="err">Unable to retrieve device list.</p>'); }
);

$(document).ready(function()
{
  $('#devices').append(loading());
  $('#devices').on('change', function() {
    update();
  });
  if (!debug) { console.log('Hello there! It might be easier to contribute if you enable the debugging code. To do so, simply type as follows: \n\ndebug = true;\n\nThen, all the following actions will have an increased console verbosity.') }
});
