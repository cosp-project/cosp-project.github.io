// Global animation time (ms)
var atime = 500; var startup = true; var mDeviceList = null; var debug = false;

// Display debugging info in console (only if enabled)
function log(info) { if (debug) { console.log(info); } }

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
  return '<table class="responsive-table" id="builds">' + data + '</table>';
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

// Build the table for the selected entry available
function update()
{
  if ($('#builds').length)
  {
    $('#builds').remove();
  }
  // Request the list of builds.
  reqURL = 'https://cosp-webserver.herokuapp.com/checkUpdate?device=' + $('#devices option:selected').text();
  log('Ajax: Retrieving "' + reqURL + '"...');
  $.ajax({ type: 'GET', url: reqURL, dataType: 'json' })
  .done(function(json_object) { log('Ajax: success!'); rendertable(json_object); $('.info').remove(); })
  .fail(function (response) { if (response.responseText == 'error') { log('Ajax: the API reported an error.'); $('.info').remove(); $('#devices').append('<p class="info">No builds found.</p>'); } });
}

function rendertable(DeviceBuildList)
{
  DeviceBuildTable = '<tr> <th>Changelog</th>  <th> Download </th> </tr>';
  //                                                     \/ Replace newlines for <br>
  DeviceBuildTable += tr(td(DeviceBuildList['changeLog']).replace(/\n/g, '<br>') + (td(DeviceBuildList['download']) === '' ? td(DeviceBuildList['download']) : td('<span class="err">Unable to retrieve download URL.</span>')));
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
reqURL = 'https://mirror.codebucket.de/cosp/getdevices.php';
log('Ajax: Retrieving "' + reqURL + '"...');
$.ajax({ type: 'GET', url: reqURL, dataType: 'json' })
.always(function() { $('.preloader-wrapper').fadeOut(atime); setTimeout(function() { $('.preloader-wrapper').remove() }, atime); })
.done(function (json_array) { log('Ajax: success!'); mDeviceList = json_array; showdevices(); } )
.fail(function() { log('Ajax: the API reported an error.'); $('#devices').append('<p class="err">Unable to retrieve device list.</p>'); }
);

$(document).ready(function()
{
  $('#devices').append(loading());
  $('#devices').on('change', function() {
    update();
  });
  if (!debug) { console.log('Hello there! It might be easier to contribute if you enable the debugging code. To do so, simply type as follows: \n\ndebug = true;\n\nThen, all the following actions will have an increased console verbosity.') }
});
