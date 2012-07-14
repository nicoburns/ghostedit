<?php /* Reference implementation for saving pages with GhostEdit 1.0-beta1
Copyright (C) 2010-2012 Nico Burns

This page retrieves the variables GhostEdit sends via POST, and santises them, it then saves the page content to a flat file
You will probably want to replace this with a MySQL or other RMDB backend.

Output the string 'true' and GhostEdit will display the 'Page was saved successfully' message.
Output anything else, and GhostEdit will display the output (useful for displaying custom error messages)
*/

// Define allowed tags (best to leave this as it is for now, but it may need to be updated when GhostEdit supports more)
$AllowedTags = "<p><b><i><u><a><strike><img><h1><h2><h3><h4><h5><h6><br><ol><ul><li>";

// Get POST variables. 'name', 'url', 'content' and 'snippet' are sent by default. 'id' was passed in the 'saveparams' option when calling ghostedit.
$PageId = isset($_POST['id']) ? $_POST['id'] : false;
$Name = isset($_POST['name']) ? $_POST['name'] : false;
$Url = isset($_POST['url']) ? $_POST['url'] : false;
$Content = isset($_POST['content']) ? $_POST['content'] : false;
$Snippet = isset($_POST['snippet']) ? $_POST['snippet'] : false;

$Error = false;

//Check that ID is a number
if($PageId === false || !ctype_digit($PageId)) {
	$Error = true;
}

// Sanitize content
if ($Content !== false) {
        $Content = (string) $Content;
        if (strlen($Content) > 50000) {
                $Content = substr($Content, 0, 50000);
        }
	$Content = strip_tags($Content, $AllowedTags);
} else { $Error = true; }

// Sanitize snippet
if ($Snippet !== false) {
	$Snippet = strip_tags($Snippet, $AllowedTags);
} else { $Error = true; }

// Sanitize name field
if ($Name) {
	$allowedchars = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789\-\_ \/";
	$Name = preg_replace("/[^".$allowedchars."]/", "", $Name);
} else { $Error = true; }

// Sanitize url field
if ($Url) {
	$allowedchars = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789\-\_ \/";
	$Url = str_replace(" ", "-", $Url);
	$Url = str_replace("_", "-", $Url);
	$Url = preg_replace("/[^".$allowedchars."]/", "", $Url);
} else { $Error = true; }


/* Save to backend
	In this case it just saves it to a flat file, you will probably want to replace this with a MySQL update or whatever backend you use.
 */
file_put_contents("savedpages/" . $PageId . ".htm", $Content);


// Output to page (sent to GhostEdit via ajax). Outputting 'true' will display the 'page saved successfully :)' message.
// Outputting anything else will display what you output. (useful for custom error messages).
if(!$Error) {
	echo "true";
}
else {
	echo "Sorry, there was an error saving this article.";
}
?>
