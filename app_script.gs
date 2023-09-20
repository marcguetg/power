// Post script

function get_file() {
  var date = Utilities.formatDate(new Date(), "GMT", "yyyy.MM.dd");
  var folder = DriveApp.getFoldersByName('PowerReader').next();
  var file_iterator = folder.getFilesByName(date);
  if (file_iterator.hasNext()) {
    return file_iterator.next();
  } else {
    return folder.createFile(date, '');
  }
}


function doPost(e) {
  var file = get_file();
  var combinedContent = file.getBlob().getDataAsString() + e.parameter.data;
  file.setContent(combinedContent);

  var result = {"ok": true};

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}


// Get script

function doGet(e) {
  const path = e.parameter.path;
  var folder = DriveApp.getFoldersByName('PowerReader').next();
  var file = folder.getFilesByName(path);

  var data;
  if (file.hasNext()) {
    data = {
      ok: true,
      data: file.next().getBlob().getDataAsString(),
    };
  } else {
    data = {
      ok: false,
      text: 'file not found'
    };
  }

  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}